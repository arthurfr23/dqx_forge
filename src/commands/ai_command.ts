import * as vscode from "vscode";
import type { CatalogClient } from "../remote/catalog_client";
import type { SqlClient } from "../remote/sql_client";
import type { CheckCatalog } from "../domain/check_catalog";
import type { ContractStore } from "../contracts/contract_store";
import type { DatabricksAuth } from "../auth/databricks_auth";
import type { CheckCatalogEntry, DqxCheck } from "../domain/profiling";
import { runAgent } from "../ai/agent_loop";
import { DatabricksFmProvider, type LlmProvider, type Rota } from "../ai/llm_provider";
import { VsCodeLmProvider } from "../ai/vscode_lm_provider";
import type { ServingClient } from "../remote/serving_client";
import { selecionarModelo } from "./setup_commands";
import { newContract, serializeContract } from "../contracts/contract_schema";
import { validateContractText } from "../contracts/validator";
import { defaultDimensions, detectLayer } from "../domain/layer_profiles";
import { ContractEditorPanel, type EditorDeps } from "../webview/panel";
import type { CheckOrigin } from "../webview/protocol";
import { t } from "../i18n/current";

export interface AiDeps {
  auth: DatabricksAuth;
  serving: ServingClient;
  catalog: CatalogClient;
  sql: SqlClient;
  checkCatalog: CheckCatalog;
  editor: EditorDeps;
  output: vscode.OutputChannel;
  store: ContractStore;
}

/** Acima disso, gerar tudo de uma vez custa tempo demais para ser silencioso. */
const AVISO_MUITAS_TABELAS = 5;

interface ResumoTabela {
  tabela: string;
  aceitos: number;
  rejeitados: number;
  erro?: string;
}

/**
 * Gera contratos deixando o modelo explorar o Lakehouse sozinho: ele lista,
 * descreve, amostra, confirma hipóteses com SQL e só então propõe as regras.
 *
 * Com um schema como alvo, roda uma vez por tabela — cada tabela merece o seu
 * próprio contrato, porque é assim que os jobs e o versionamento funcionam.
 */
export async function generateWithAgent(
  alvo: { table?: string; catalog?: string; schema?: string },
  deps: AiDeps,
): Promise<void> {
  const provider = await escolherProvider(deps.auth, deps.serving);
  if (!provider) {
    return;
  }

  if (!deps.sql.configured) {
    const acao = await vscode.window.showErrorMessage(
      t().msg_precisaWarehouse,
      t().msg_abrirConfig,
    );
    if (acao) {
      await vscode.commands.executeCommand("dqxForge.selectWarehouse");
    }
    return;
  }

  const tabelas = await resolverTabelas(alvo, deps);
  if (!tabelas?.length) {
    return;
  }

  const contexto = await vscode.window.showInputBox({
    title: t().acao_contextoTitulo,
    prompt: t().acao_contextoPrompt,
    placeHolder: t().acao_contextoPlaceholder,
  });
  if (contexto === undefined) {
    return;
  }

  const catalogoChecks = await deps.checkCatalog.get().catch(() => []);
  if (!catalogoChecks.length) {
    vscode.window.showErrorMessage(t().msg_semCatalogoChecks);
    return;
  }

  const resumos: ResumoTabela[] = [];

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: t().ia_titulo(tabelas.length),
      cancellable: true,
    },
    async (progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());

      for (const [indice, tabela] of tabelas.entries()) {
        if (controller.signal.aborted) {
          break;
        }

        const rotulo =
          tabelas.length > 1
            ? t().ia_progresso(indice + 1, tabelas.length, nomeCurto(tabela))
            : nomeCurto(tabela);
        progress.report({ message: rotulo });
        deps.output.appendLine(`\n=== agente de IA em ${tabela} (${provider.descricao}) ===`);

        try {
          resumos.push(
            await gerarParaTabela(tabela, {
              provider,
              contexto,
              catalogoChecks,
              deps,
              signal: controller.signal,
              onProgress: (mensagem) => progress.report({ message: `${rotulo} · ${mensagem}` }),
            }),
          );
        } catch (err) {
          const mensagem = err instanceof Error ? err.message : String(err);
          deps.output.appendLine(`  erro: ${mensagem}`);
          resumos.push({ tabela, aceitos: 0, rejeitados: 0, erro: mensagem });
        }
      }
    },
  );

  await reportar(resumos, deps);
}

/** Roda o agente numa tabela e abre o contrato resultante para revisão. */
async function gerarParaTabela(
  tabela: string,
  ctx: {
    provider: LlmProvider;
    contexto: string;
    catalogoChecks: CheckCatalogEntry[];
    deps: AiDeps;
    signal: AbortSignal;
    onProgress: (mensagem: string) => void;
  },
): Promise<ResumoTabela> {
  const { deps } = ctx;

  const resultado = await runAgent({
    provider: ctx.provider,
    catalog: deps.catalog,
    sql: deps.sql,
    checkCatalog: ctx.catalogoChecks,
    alvo: { table: tabela },
    contexto: ctx.contexto,
    dimensoesSugeridas: defaultDimensions(detectLayer(tabela.split(".").pop() ?? "")),
    onProgress: (mensagem) => {
      ctx.onProgress(mensagem);
      deps.output.appendLine(`  ${mensagem}`);
    },
    signal: ctx.signal,
  });

  for (const linha of resultado.diagnostico) {
    deps.output.appendLine(`  [diag] ${linha}`);
  }
  for (const passo of resultado.trilha) {
    deps.output.appendLine(`  · ${passo.ferramenta}: ${passo.resumo}`);
  }
  if (resultado.resumo) {
    deps.output.appendLine(`\n${resultado.resumo}`);
  }

  if (!resultado.propostas.length) {
    // Sem propostas, o texto do modelo é a única pista do que ele entendeu.
    deps.output.appendLine(
      resultado.resumo
        ? `\n  resposta do modelo:\n${resultado.resumo}`
        : "\n  o modelo não devolveu texto nenhum",
    );
    return {
      tabela,
      aceitos: 0,
      rejeitados: 0,
      erro: resultado.atingiuLimite ? t().ia_limiteAtingido : t().ia_semPropostas,
    };
  }

  // Nenhuma saída de LLM vira contrato sem passar pela validação: função
  // inventada ou argumento errado é descartado aqui, não no Databricks.
  const colunas = await deps.catalog.getColumns(tabela).catch(() => undefined);
  const aceitos: DqxCheck[] = [];
  const origins: Record<number, CheckOrigin> = {};
  const rejeitados: string[] = [];

  for (const proposta of resultado.propostas) {
    const teste = newContract({
      table: tabela,
      checks: [proposta.check],
      origem: "ia_agente",
      columns: colunas,
    });
    const problemas = validateContractText(serializeContract(teste), {
      catalog: ctx.catalogoChecks,
      columns: colunas?.map((c) => c.name),
    }).filter((issue) => issue.severity === "error");

    if (problemas.length) {
      rejeitados.push(
        `${proposta.check.check.function}: ${problemas.map((p) => p.message).join(" ")}`,
      );
      continue;
    }

    origins[aceitos.length] = {
      sugerido: true,
      explicacao: proposta.justificativa,
      dimensao: proposta.check.user_metadata?.dimensao as CheckOrigin["dimensao"],
    };
    aceitos.push(proposta.check);
  }

  if (rejeitados.length) {
    deps.output.appendLine(`\n${rejeitados.length} proposta(s) descartada(s) na validação:`);
    for (const motivo of rejeitados) {
      deps.output.appendLine(`  ✗ ${motivo}`);
    }
  }

  if (aceitos.length) {
    await ContractEditorPanel.show(
      deps.editor,
      newContract({ table: tabela, checks: aceitos, origem: "ia_agente", columns: colunas }),
      origins,
    );
  }

  return { tabela, aceitos: aceitos.length, rejeitados: rejeitados.length };
}

/**
 * Decide em quais tabelas rodar. Com um schema, o usuário escolhe da lista —
 * cada tabela é uma execução completa do agente, então o custo em tempo tem de
 * estar explícito antes de começar.
 */
async function resolverTabelas(
  alvo: { table?: string; catalog?: string; schema?: string },
  deps: AiDeps,
): Promise<string[] | undefined> {
  if (alvo.table) {
    return [alvo.table];
  }
  if (!alvo.catalog || !alvo.schema) {
    return undefined;
  }

  const disponiveis = await deps.catalog.listTables(alvo.catalog, alvo.schema);
  // Views não têm dados próprios para perfilar e costumam apenas espelhar
  // tabelas que já entram na lista.
  const candidatas = disponiveis.filter((tabela) => tabela.tableType !== "VIEW");

  if (!candidatas.length) {
    vscode.window.showWarningMessage(t().ia_semTabelas(`${alvo.catalog}.${alvo.schema}`));
    return undefined;
  }

  // Saídas, quarentenas e métricas dos contratos existentes são artefatos da
  // própria ferramenta. Validar a saída da validação não faz sentido, e cada
  // uma custaria minutos de agente — ficam listadas mas desmarcadas.
  const derivadas = await tabelasDerivadas(deps.store);

  const escolhidas = await vscode.window.showQuickPick(
    candidatas.map((tabela) => ({
      label: tabela.name,
      description: derivadas.has(tabela.fullName) ? t().ia_tabelaDerivada : tabela.tableType,
      detail: tabela.comment,
      picked: !derivadas.has(tabela.fullName),
      fullName: tabela.fullName,
    })),
    {
      title: t().ia_escolherTabelasTitulo(`${alvo.catalog}.${alvo.schema}`),
      placeHolder: t().ia_escolherTabelasPlaceholder,
      canPickMany: true,
    },
  );

  if (!escolhidas?.length) {
    return undefined;
  }

  if (escolhidas.length > AVISO_MUITAS_TABELAS) {
    const minutos = escolhidas.length * 4;
    const confirmar = await vscode.window.showWarningMessage(
      t().ia_confirmarLote(escolhidas.length, minutos),
      { modal: true },
      t().ia_confirmarLoteAcao,
    );
    if (!confirmar) {
      return undefined;
    }
  }

  return escolhidas.map((escolha) => escolha.fullName);
}

async function reportar(resumos: ResumoTabela[], deps: AiDeps): Promise<void> {
  if (!resumos.length) {
    return;
  }

  const comChecks = resumos.filter((r) => r.aceitos > 0);
  const falhas = resumos.filter((r) => r.aceitos === 0);

  deps.output.appendLine("\n=== resumo da geração ===");
  for (const resumo of resumos) {
    deps.output.appendLine(
      resumo.aceitos > 0
        ? `  ${resumo.tabela}: ${resumo.aceitos} regras (${resumo.rejeitados} descartadas)`
        : `  ${resumo.tabela}: nenhuma regra — ${resumo.erro ?? "motivo desconhecido"}`,
    );
  }

  if (!comChecks.length) {
    deps.output.show(true);
    vscode.window.showErrorMessage(t().ia_nenhumContrato);
    return;
  }

  const total = comChecks.reduce((soma, r) => soma + r.aceitos, 0);
  const mensagem =
    comChecks.length === 1
      ? t().msg_iaPropos(total, comChecks[0].tabela)
      : t().ia_resumoLote(total, comChecks.length);

  const acao = await vscode.window.showInformationMessage(
    falhas.length ? `${mensagem} ${t().ia_semRegrasEm(falhas.length)}` : mensagem,
    t().msg_verDetalhes,
  );
  if (acao) {
    deps.output.show(true);
  }
}

async function escolherProvider(
  auth: DatabricksAuth,
  serving: ServingClient,
): Promise<LlmProvider | undefined> {
  const config = vscode.workspace.getConfiguration("dqxForge");
  let rota = config.get<Rota | "">("aiRoute", "");
  let endpoint = config.get<string>("aiEndpoint", "");
  let modeloIde = config.get<string>("aiIdeModel", "");

  // Primeira execução: o usuário escolhe o modelo numa lista real, e a escolha
  // fica gravada — não há passo de editar configuração à mão.
  if (!rota || (rota === "databricks" && !endpoint)) {
    const escolha = await selecionarModelo(serving);
    if (!escolha) {
      return undefined;
    }
    rota = escolha.rota;
    endpoint = escolha.endpoint ?? endpoint;
    modeloIde = escolha.modeloIde ?? modeloIde;
  }

  if (rota === "ide") {
    const provider = await VsCodeLmProvider.selecionar(modeloIde || undefined);
    if (!provider) {
      vscode.window.showErrorMessage(t().msg_semModelosIde);
      return undefined;
    }
    return provider;
  }

  return new DatabricksFmProvider(auth, endpoint);
}

/** Tabelas que já são destino de algum contrato — geradas pelo DQX Forge. */
async function tabelasDerivadas(store: ContractStore): Promise<Set<string>> {
  const nomes = new Set<string>();
  for (const { contract } of await store.list()) {
    for (const destino of [
      contract.output.tabela_saida,
      contract.output.tabela_quarentena,
      contract.output.tabela_metricas,
    ]) {
      // A tabela de origem também aparece como saída no modo anotação; ela
      // continua sendo um alvo legítimo, então não entra na lista.
      if (destino && destino !== contract.meta.table) {
        nomes.add(destino);
      }
    }
  }
  return nomes;
}

function nomeCurto(fullName: string): string {
  return fullName.split(".").pop() ?? fullName;
}

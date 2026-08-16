import * as vscode from "vscode";
import type { CatalogClient } from "../remote/catalog_client";
import type { JobRunner } from "../remote/job_runner";
import type { SqlClient } from "../remote/sql_client";
import type { CheckCatalog } from "../domain/check_catalog";
import type { DqxCheck } from "../domain/profiling";
import { importFromTable, importFromText, type ImportResult } from "../contracts/importers";
import { newContract, serializeContract } from "../contracts/contract_schema";
import { validateContractText } from "../contracts/validator";
import { ContractEditorPanel, type EditorDeps } from "../webview/panel";
import type { CheckOrigin } from "../webview/protocol";
import { t } from "../i18n/current";

export interface ImportDeps {
  runner: JobRunner;
  catalog: CatalogClient;
  sql: SqlClient;
  checkCatalog: CheckCatalog;
  editor: EditorDeps;
  output: vscode.OutputChannel;
}

type Fonte = "arquivo" | "odcs" | "tabela";

/**
 * Traz para o repositório checks que já existem em outro lugar. As três fontes
 * convergem para o mesmo painel de revisão, para que o usuário confira antes de
 * versionar o que veio de fora.
 */
export async function importContract(deps: ImportDeps): Promise<void> {
  const fonte = await escolherFonte();
  if (!fonte) {
    return;
  }

  let resultado: ImportResult;
  try {
    resultado = await carregar(fonte, deps);
  } catch (err) {
    vscode.window.showErrorMessage(
      t().imp_falhou(err instanceof Error ? err.message : String(err)),
    );
    return;
  }

  const tabela = resultado.table ?? (await perguntarTabela());
  if (!tabela) {
    return;
  }

  const colunas = await deps.catalog.getColumns(tabela).catch(() => undefined);
  const catalogoChecks = await deps.checkCatalog.get().catch(() => []);

  // Checks vindos de fora podem referenciar colunas que não existem mais ou
  // funções de outra versão do DQX. Separar aqui evita salvar algo quebrado.
  const aceitos: DqxCheck[] = [];
  const origins: Record<number, CheckOrigin> = {};
  const rejeitados: string[] = [];

  for (const check of resultado.checks) {
    const teste = newContract({ table: tabela, checks: [check], origem: "import", columns: colunas });
    const problemas = validateContractText(serializeContract(teste), {
      catalog: catalogoChecks.length ? catalogoChecks : undefined,
      columns: colunas?.map((c) => c.name),
    }).filter((issue) => issue.severity === "error");

    if (problemas.length) {
      rejeitados.push(`${check.check.function}: ${problemas.map((p) => p.message).join(" ")}`);
      continue;
    }

    origins[aceitos.length] = {
      sugerido: true,
      explicacao: descreverOrigem(fonte),
      dimensao: check.user_metadata?.dimensao as CheckOrigin["dimensao"],
    };
    aceitos.push(check);
  }

  deps.output.appendLine(
    t().log_importacao(descreverFonte(fonte), tabela, aceitos.length, rejeitados.length),
  );
  for (const aviso of resultado.avisos) {
    deps.output.appendLine(`  ! ${aviso}`);
  }
  for (const motivo of rejeitados) {
    deps.output.appendLine(`  ✗ ${motivo}`);
  }

  if (!aceitos.length) {
    deps.output.show(true);
    vscode.window.showErrorMessage(t().imp_nenhumAprovado);
    return;
  }

  await ContractEditorPanel.show(
    deps.editor,
    newContract({ table: tabela, checks: aceitos, origem: "import", columns: colunas }),
    origins,
  );

  const problemas = rejeitados.length + resultado.avisos.length;
  const acao = await vscode.window.showInformationMessage(
    t().msg_checksImportados(aceitos.length, tabela) +
      (problemas ? t().imp_comObservacao(problemas) : "."),
    ...(problemas ? [t().msg_verDetalhes] : []),
  );
  if (acao) {
    deps.output.show(true);
  }
}

async function escolherFonte(): Promise<Fonte | undefined> {
  const escolha = await vscode.window.showQuickPick(
    [
      {
        label: `$(file-code) ${t().imp_arquivo}`,
        description: t().imp_arquivoDescricao,
        detail: t().imp_arquivoDetalhe,
        fonte: "arquivo" as const,
      },
      {
        label: "$(book) Data contract ODCS",
        description: "Open Data Contract Standard v3.x",
        detail: t().imp_odcsDetalhe,
        fonte: "odcs" as const,
      },
      {
        label: `$(database) ${t().imp_tabela}`,
        description: t().imp_tabelaDescricao,
        detail: t().imp_tabelaDetalhe,
        fonte: "tabela" as const,
      },
    ],
    { title: t().imp_titulo, placeHolder: t().imp_placeholder },
  );
  return escolha?.fonte;
}

async function carregar(fonte: Fonte, deps: ImportDeps): Promise<ImportResult> {
  if (fonte === "tabela") {
    const tabelaChecks = await vscode.window.showInputBox({
      title: t().imp_tabelaChecksTitulo,
      prompt: t().imp_tabelaChecksPrompt,
      placeHolder: "catalog.schema.dq_checks",
      validateInput: (v) => (v.split(".").length === 3 ? undefined : t().pick_tabelaInvalida),
    });
    if (!tabelaChecks) {
      throw new Error(t().imp_semTabela);
    }
    if (!deps.sql.configured) {
      throw new Error(t().ctr_semWarehouse);
    }
    return await importFromTable(deps.sql, tabelaChecks);
  }

  const arquivos = await vscode.window.showOpenDialog({
    title: fonte === "odcs" ? t().imp_odcsTitulo : t().imp_arquivoTitulo,
    canSelectMany: false,
    filters:
      fonte === "odcs"
        ? { "Data contract": ["yml", "yaml", "json"] }
        : { Checks: ["yml", "yaml", "json"] },
  });
  const arquivo = arquivos?.[0];
  if (!arquivo) {
    throw new Error(t().imp_semArquivo);
  }

  if (fonte === "arquivo") {
    const bytes = await vscode.workspace.fs.readFile(arquivo);
    return importFromText(Buffer.from(bytes).toString("utf8"));
  }

  return await importarOdcs(arquivo, deps);
}

/**
 * ODCS precisa do próprio DQX para interpretar o contrato, então o arquivo sobe
 * para o Volume e a conversão roda no Databricks.
 */
async function importarOdcs(arquivo: vscode.Uri, deps: ImportDeps): Promise<ImportResult> {
  const conteudo = Buffer.from(await vscode.workspace.fs.readFile(arquivo)).toString("utf8");
  const nome = arquivo.path.split("/").pop() ?? "contract.yml";
  const remoto = deps.runner.buildOutputPath(`odcs_${nome.replace(/[^\w.]/g, "_")}`);

  await deps.runner.writeVolumeText(remoto, conteudo);

  const outputPath = deps.runner.buildOutputPath("odcs_checks");
  const resultado = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: t().imp_convertendo(nome) },
    async (progress) =>
      await deps.runner.run<{ ok: boolean; checks?: DqxCheck[]; error?: string }>({
        task: "contract_import_task",
        outputPath,
        cleanup: [remoto],
        onProgress: (mensagem) => progress.report({ message: mensagem }),
        parameters: ["--contract-file", remoto, "--criticality", "error"],
      }),
  );

  if (!resultado.payload.ok || !resultado.payload.checks?.length) {
    throw new Error(resultado.payload.error ?? t().imp_semChecksNoContrato);
  }

  return { checks: resultado.payload.checks, avisos: [] };
}

async function perguntarTabela(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    title: t().imp_aQualTabela,
    prompt: t().pick_tabelaPrompt,
    placeHolder: t().pick_tabelaPlaceholder,
    validateInput: (v) => (v.split(".").length === 3 ? undefined : t().pick_tabelaInvalida),
  });
}

/** Rótulo traduzido da origem, usado no log — o identificador interno não vaza para a tela. */
function descreverFonte(fonte: Fonte): string {
  switch (fonte) {
    case "arquivo":
      return t().imp_arquivo;
    case "odcs":
      return t().imp_odcsTitulo;
    case "tabela":
      return t().imp_tabela;
  }
}

function descreverOrigem(fonte: Fonte): string {
  switch (fonte) {
    case "arquivo":
      return t().imp_origemArquivo;
    case "odcs":
      return t().imp_origemOdcs;
    case "tabela":
      return t().imp_origemTabela;
  }
}

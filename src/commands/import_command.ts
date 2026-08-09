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
      `Não foi possível importar: ${err instanceof Error ? err.message : String(err)}`,
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
    `\n=== importação (${fonte}) para ${tabela}: ${aceitos.length} aceitos, ${rejeitados.length} rejeitados ===`,
  );
  for (const aviso of resultado.avisos) {
    deps.output.appendLine(`  ! ${aviso}`);
  }
  for (const motivo of rejeitados) {
    deps.output.appendLine(`  ✗ ${motivo}`);
  }

  if (!aceitos.length) {
    deps.output.show(true);
    vscode.window.showErrorMessage(
      "Nenhum check importado passou na validação. Veja o log para os motivos.",
    );
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
      (problemas ? ` (${problemas} item(ns) com observação).` : "."),
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
        label: "$(file-code) Arquivo de checks do DQX",
        description: "YAML ou JSON",
        detail:
          "Uma lista de checks no formato do DQX, ou um contrato já exportado pelo DQX Forge.",
        fonte: "arquivo" as const,
      },
      {
        label: "$(book) Data contract ODCS",
        description: "Open Data Contract Standard v3.x",
        detail:
          "O DQX deriva as regras do schema e da seção quality do contrato. Roda no Databricks.",
        fonte: "odcs" as const,
      },
      {
        label: "$(database) Tabela de checks no Unity Catalog",
        description: "migração de quem já usa DQX",
        detail: "Lê a tabela Delta onde as regras estão hoje e traz para o repositório.",
        fonte: "tabela" as const,
      },
    ],
    { title: "De onde vêm os checks?", placeHolder: "Escolha a origem" },
  );
  return escolha?.fonte;
}

async function carregar(fonte: Fonte, deps: ImportDeps): Promise<ImportResult> {
  if (fonte === "tabela") {
    const tabelaChecks = await vscode.window.showInputBox({
      title: "Tabela de checks",
      prompt: "Tabela Delta onde as regras estão hoje",
      placeHolder: "catalog.schema.dq_checks",
      validateInput: (v) => (v.split(".").length === 3 ? undefined : "Use catalog.schema.tabela"),
    });
    if (!tabelaChecks) {
      throw new Error("Nenhuma tabela informada.");
    }
    if (!deps.sql.configured) {
      throw new Error(
        "Ler uma tabela de checks exige um SQL warehouse. Escolha um em Configuração.",
      );
    }
    return await importFromTable(deps.sql, tabelaChecks);
  }

  const arquivos = await vscode.window.showOpenDialog({
    title: fonte === "odcs" ? "Contrato ODCS" : "Arquivo de checks",
    canSelectMany: false,
    filters:
      fonte === "odcs"
        ? { "Data contract": ["yml", "yaml", "json"] }
        : { Checks: ["yml", "yaml", "json"] },
  });
  const arquivo = arquivos?.[0];
  if (!arquivo) {
    throw new Error("Nenhum arquivo escolhido.");
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
    { location: vscode.ProgressLocation.Notification, title: `Convertendo ${nome}` },
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
    throw new Error(resultado.payload.error ?? "O contrato não gerou nenhum check.");
  }

  return { checks: resultado.payload.checks, avisos: [] };
}

async function perguntarTabela(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    title: "A que tabela estes checks se aplicam?",
    prompt: "Nome completo da tabela",
    placeHolder: "catalog.schema.tabela",
    validateInput: (v) => (v.split(".").length === 3 ? undefined : "Use catalog.schema.tabela"),
  });
}

function descreverOrigem(fonte: Fonte): string {
  switch (fonte) {
    case "arquivo":
      return "Importado de um arquivo de checks.";
    case "odcs":
      return "Derivado de um data contract ODCS pelo DQX.";
    case "tabela":
      return "Importado de uma tabela de checks do Unity Catalog.";
  }
}

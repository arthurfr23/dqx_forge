import { join } from "node:path";
import * as vscode from "vscode";
import { DatabricksAuth } from "./auth/databricks_auth";
import { CatalogClient } from "./remote/catalog_client";
import { JobRunner } from "./remote/job_runner";
import { CatalogTreeProvider, isSchemaNode, isTableNode } from "./views/catalog_tree";
import { profileTable } from "./commands/profile_command";
import { runDryRun } from "./commands/dry_run_command";
import { generateWithAgent } from "./commands/ai_command";
import { SqlClient } from "./remote/sql_client";
import { ServingClient } from "./remote/serving_client";
import { SetupTreeProvider } from "./views/setup_tree";
import {
  selecionarAgendamento,
  selecionarModelo,
  selecionarVolume,
  selecionarWarehouse,
} from "./commands/setup_commands";
import {
  deployBundle,
  generateBundleResources,
  runContractJob,
} from "./commands/bundle_command";
import { BundleClient } from "./deploy/bundle_client";
import { importContract } from "./commands/import_command";
import { IDIOMAS, type Idioma } from "./i18n/messages";
import { t } from "./i18n/current";
import { CheckCatalog } from "./domain/check_catalog";
import { ContractStore } from "./contracts/contract_store";
import { ContractEditorPanel, type EditorDeps } from "./webview/panel";
import { newContract } from "./contracts/contract_schema";

export function activate(context: vscode.ExtensionContext): void {
  const config = vscode.workspace.getConfiguration("dqxForge");
  const auth = new DatabricksAuth(config.get<string>("profile", ""));
  const catalogClient = new CatalogClient(auth);
  const catalogTree = new CatalogTreeProvider(catalogClient);
  const output = vscode.window.createOutputChannel("DQX Forge");

  const runner = new JobRunner(auth, join(context.extensionPath, "dist", "tasks"), {
    get dqxVersion() {
      return vscode.workspace.getConfiguration("dqxForge").get<string>("dqxVersion", "0.15.0");
    },
    get volumePath() {
      return vscode.workspace.getConfiguration("dqxForge").get<string>("volumePath", "");
    },
  });

  const sqlClient = new SqlClient(auth, () =>
    vscode.workspace.getConfiguration("dqxForge").get<string>("warehouseId", ""),
  );
  const servingClient = new ServingClient(auth);
  const setupTree = new SetupTreeProvider();
  const checkCatalog = new CheckCatalog(context.globalState, runner);
  const store = new ContractStore();
  const bundleClient = new BundleClient(
    () => {
      // O databricks.yml fica dois níveis acima de dq/contracts.
      const raiz = vscode.workspace.workspaceFolders?.[0];
      const dir = vscode.workspace
        .getConfiguration("dqxForge")
        .get<string>("contractsDir", "sat_bh/dq/contracts");
      const partes = dir.split("/").filter(Boolean).slice(0, -2);
      return raiz ? vscode.Uri.joinPath(raiz.uri, ...partes) : undefined;
    },
    () => vscode.workspace.getConfiguration("dqxForge").get<string>("profile", ""),
    output,
  );
  const editorDeps: EditorDeps = {
    extensionUri: context.extensionUri,
    catalog: catalogClient,
    checkCatalog,
    store,
    onDryRun: (contract, panel, percentual) =>
      runDryRun(contract, panel, runner, percentual, output),
  };

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.command = "dqxForge.selectProfile";
  const renderStatusBar = () => {
    const profile = auth.profile || "DEFAULT";
    statusBar.text = `$(database) DQX: ${profile}`;
    statusBar.tooltip = `Perfil do Databricks usado pelo DQX Forge — clique para trocar`;
    statusBar.show();
  };
  renderStatusBar();

  context.subscriptions.push(
    statusBar,
    output,
    store,
    vscode.window.createTreeView("dqxForge.setup", { treeDataProvider: setupTree }),
    vscode.window.createTreeView("dqxForge.catalog", {
      treeDataProvider: catalogTree,
      showCollapseAll: true,
    }),

    vscode.commands.registerCommand("dqxForge.refreshCatalog", () => {
      catalogTree.refresh();
    }),

    vscode.commands.registerCommand("dqxForge.selectProfile", async () => {
      const profiles = await DatabricksAuth.listProfiles();
      if (!profiles.length) {
        const action = await vscode.window.showErrorMessage(
          t().msg_semPerfis,
          t().acao_comoConfigurar,
        );
        if (action) {
          void vscode.env.openExternal(
            vscode.Uri.parse("https://docs.databricks.com/dev-tools/cli/authentication.html"),
          );
        }
        return;
      }

      const picked = await vscode.window.showQuickPick(
        profiles.map((p) => ({
          label: p.name,
          description: p.host,
          detail: p.authType,
        })),
        { title: t().pick_perfilTitulo, placeHolder: t().pick_perfilPlaceholder },
      );
      if (!picked) {
        return;
      }

      await vscode.workspace
        .getConfiguration("dqxForge")
        .update("profile", picked.label, vscode.ConfigurationTarget.Workspace);
      auth.setProfile(picked.label);
      renderStatusBar();
      catalogTree.refresh();
    }),

    vscode.commands.registerCommand("dqxForge.profileTable", async (node?: unknown) => {
      const fullName = isTableNode(node)
        ? node.table.fullName
        : await vscode.window.showInputBox({
            title: t().acao_perfilarTitulo,
            prompt: t().pick_tabelaPrompt,
            placeHolder: t().pick_tabelaPlaceholder,
            validateInput: (value) =>
              value.split(".").length === 3 ? undefined : t().pick_tabelaInvalida,
          });
      if (!fullName) {
        return;
      }
      try {
        await profileTable(fullName, {
          runner,
          catalog: catalogClient,
          output,
          editor: editorDeps,
        });
      } catch (err) {
        vscode.window.showErrorMessage(
          `Profiling falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),

    vscode.commands.registerCommand("dqxForge.newContract", async (node?: unknown) => {
      const fullName = isTableNode(node)
        ? node.table.fullName
        : await vscode.window.showInputBox({
            title: t().acao_novoContratoTitulo,
            prompt: t().pick_tabelaPrompt,
            placeHolder: t().pick_tabelaPlaceholder,
            validateInput: (value) =>
              value.split(".").length === 3 ? undefined : t().pick_tabelaInvalida,
          });
      if (!fullName) {
        return;
      }

      const existente = await store.find(fullName);
      if (existente) {
        await ContractEditorPanel.show(editorDeps, existente.contract);
        return;
      }

      const columns = await catalogClient.getColumns(fullName).catch(() => undefined);
      await ContractEditorPanel.show(
        editorDeps,
        newContract({ table: fullName, checks: [], origem: "manual", columns }),
      );
    }),

    vscode.commands.registerCommand("dqxForge.generateWithAi", async (node?: unknown) => {
      let alvo: { table?: string; catalog?: string; schema?: string } | undefined;

      if (isTableNode(node)) {
        alvo = { table: node.table.fullName };
      } else if (isSchemaNode(node)) {
        alvo = { catalog: node.catalog, schema: node.name };
      } else {
        const entrada = await vscode.window.showInputBox({
          title: t().acao_iaTitulo,
          prompt: t().pick_tabelaPrompt,
          placeHolder: t().pick_tabelaPlaceholder,
        });
        if (!entrada) {
          return;
        }
        const partes = entrada.split(".");
        alvo =
          partes.length === 3
            ? { table: entrada }
            : partes.length === 2
              ? { catalog: partes[0], schema: partes[1] }
              : undefined;
        if (!alvo) {
          vscode.window.showErrorMessage("Informe catalog.schema ou catalog.schema.tabela.");
          return;
        }
      }

      try {
        await generateWithAgent(alvo, {
          auth,
          catalog: catalogClient,
          sql: sqlClient,
          checkCatalog,
          editor: editorDeps,
          output,
          serving: servingClient,
          store,
        });
      } catch (err) {
        output.appendLine(`erro: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
        vscode.window.showErrorMessage(
          `O agente falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectModel", async () => {
      const escolha = await selecionarModelo(servingClient);
      if (escolha) {
        setupTree.refresh();
        vscode.window.showInformationMessage(`Modelo de IA: ${escolha.rotulo}.`);
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectWarehouse", async () => {
      const id = await selecionarWarehouse(auth);
      if (id) {
        setupTree.refresh();
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectVolume", async () => {
      const caminho = await selecionarVolume(auth, catalogClient);
      if (caminho) {
        setupTree.refresh();
        vscode.window.showInformationMessage(`Volume de artefatos: ${caminho}.`);
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectContractsDir", async () => {
      const atual = vscode.workspace
        .getConfiguration("dqxForge")
        .get<string>("contractsDir", "");
      const escolhido = await vscode.window.showInputBox({
        title: t().acao_pastaTitulo,
        prompt: t().acao_pastaPrompt,
        value: atual,
        validateInput: (v) => (v.trim() ? undefined : "Informe um caminho"),
      });
      if (escolhido) {
        await vscode.workspace
          .getConfiguration("dqxForge")
          .update("contractsDir", escolhido.trim(), vscode.ConfigurationTarget.Workspace);
        setupTree.refresh();
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectSchedule", async () => {
      const descricao = await selecionarAgendamento();
      if (descricao) {
        setupTree.refresh();
        vscode.window.showInformationMessage(t().msg_agendamentoDefinido(descricao));
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectDqxVersion", async () => {
      const atual = vscode.workspace.getConfiguration("dqxForge").get<string>("dqxVersion", "");
      const escolhido = await vscode.window.showInputBox({
        title: t().acao_versaoTitulo,
        prompt: t().acao_versaoPrompt,
        value: atual,
        validateInput: (v) =>
          /^\d+\.\d+\.\d+$/.test(v.trim()) ? undefined : t().acao_versaoInvalida,
      });
      if (escolhido) {
        await vscode.workspace
          .getConfiguration("dqxForge")
          .update("dqxVersion", escolhido.trim(), vscode.ConfigurationTarget.Workspace);
        setupTree.refresh();
        await checkCatalog.refresh().catch(() => undefined);
      }
    }),

    vscode.commands.registerCommand("dqxForge.generateBundleResources", async () => {
      try {
        await generateBundleResources(store);
      } catch (err) {
        vscode.window.showErrorMessage(
          `Não foi possível gerar os recursos: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),

    vscode.commands.registerCommand("dqxForge.importContract", async () => {
      try {
        await importContract({
          runner,
          catalog: catalogClient,
          sql: sqlClient,
          checkCatalog,
          editor: editorDeps,
          output,
        });
      } catch (err) {
        vscode.window.showErrorMessage(
          `Importação falhou: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),

    vscode.commands.registerCommand("dqxForge.selectLanguage", async () => {
      const escolha = await vscode.window.showQuickPick(
        [
          {
            label: t().pick_idiomaAuto,
            description: vscode.env.language,
            detail: t().pick_idiomaAutoDetalhe,
            codigo: "" as Idioma | "",
          },
          ...IDIOMAS.map((i) => ({
            label: i.nome,
            description: i.codigo,
            detail: "",
            codigo: i.codigo as Idioma | "",
          })),
        ],
        { title: t().pick_idiomaTitulo, placeHolder: t().pick_idiomaPlaceholder },
      );
      if (!escolha) {
        return;
      }
      await vscode.workspace
        .getConfiguration("dqxForge")
        .update("language", escolha.codigo, vscode.ConfigurationTarget.Global);
      setupTree.refresh();
      catalogTree.refresh();
      await ContractEditorPanel.recarregarTodos();
      vscode.window.showInformationMessage(t().msg_idiomaAlterado(escolha.label));
    }),

    vscode.commands.registerCommand("dqxForge.deployBundle", async () => {
      await deployBundle(bundleClient);
    }),

    vscode.commands.registerCommand("dqxForge.runContractJob", async () => {
      await runContractJob(store, bundleClient);
    }),

    vscode.commands.registerCommand("dqxForge.showOutput", () => {
      output.show(true);
    }),

    vscode.commands.registerCommand("dqxForge.refreshCheckCatalog", async () => {
      try {
        const checks = await checkCatalog.refresh();
        vscode.window.showInformationMessage(
          t().msg_catalogoRecarregado(checks.length),
        );
      } catch (err) {
        vscode.window.showErrorMessage(
          `Não foi possível ler o catálogo: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }),

    vscode.commands.registerCommand("dqxForge.copyTableName", async (node?: unknown) => {
      if (!isTableNode(node)) {
        return;
      }
      await vscode.env.clipboard.writeText(node.table.fullName);
      vscode.window.setStatusBarMessage(`Copiado: ${node.table.fullName}`, 3000);
    }),

    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("dqxForge")) {
        setupTree.refresh();
      }
      if (event.affectsConfiguration("dqxForge.profile")) {
        auth.setProfile(vscode.workspace.getConfiguration("dqxForge").get<string>("profile", ""));
        renderStatusBar();
        catalogTree.refresh();
      } else if (event.affectsConfiguration("dqxForge.catalogFilter")) {
        catalogTree.refresh();
      }
    }),
  );
}

export function deactivate(): void {
  // Nada a liberar — tudo vive em context.subscriptions.
}

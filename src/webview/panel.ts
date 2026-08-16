import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import type { CatalogClient } from "../remote/catalog_client";
import type { CheckCatalog } from "../domain/check_catalog";
import type { ContractStore } from "../contracts/contract_store";
import type { DqContract } from "../contracts/contract_schema";
import { serializeContract } from "../contracts/contract_schema";
import { validateContractText } from "../contracts/validator";
import { defaultDimensions } from "../domain/layer_profiles";
import { t } from "../i18n/current";
import { resolverIdioma } from "../i18n/messages";
import type { CheckOrigin, EditorState, HostMessage, ViewMessage } from "./protocol";

export interface EditorDeps {
  extensionUri: vscode.Uri;
  catalog: CatalogClient;
  checkCatalog: CheckCatalog;
  store: ContractStore;
  onDryRun?: (
    contract: DqContract,
    panel: ContractEditorPanel,
    percentual: number,
  ) => Promise<void>;
}

/**
 * Painel de edição de um contrato. Um painel por tabela — reabrir a mesma
 * tabela traz o painel existente para frente em vez de duplicar.
 */
export class ContractEditorPanel {
  private static readonly abertos = new Map<string, ContractEditorPanel>();

  private readonly disposables: vscode.Disposable[] = [];
  private contract: DqContract;
  private origins: Record<number, CheckOrigin>;

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly deps: EditorDeps,
    contract: DqContract,
    origins: Record<number, CheckOrigin>,
  ) {
    this.contract = contract;
    this.origins = origins;

    this.panel.webview.html = this.renderHtml();
    this.panel.webview.onDidReceiveMessage(
      (message: ViewMessage) => void this.handleMessage(message),
      undefined,
      this.disposables,
    );
    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
  }

  static async show(
    deps: EditorDeps,
    contract: DqContract,
    origins: Record<number, CheckOrigin> = {},
  ): Promise<ContractEditorPanel> {
    const key = contract.meta.table;
    const existente = ContractEditorPanel.abertos.get(key);
    if (existente) {
      existente.contract = contract;
      existente.origins = origins;
      existente.panel.reveal();
      await existente.pushState();
      return existente;
    }

    const panel = vscode.window.createWebviewPanel(
      "dqxForge.contractEditor",
      contract.meta.table.split(".").pop() ?? "Contrato",
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(deps.extensionUri, "dist")],
      },
    );

    const instance = new ContractEditorPanel(panel, deps, contract, origins);
    ContractEditorPanel.abertos.set(key, instance);
    return instance;
  }

  /** Reenvia o estado de todos os painéis abertos — usado ao trocar de idioma. */
  static async recarregarTodos(): Promise<void> {
    for (const painel of ContractEditorPanel.abertos.values()) {
      await painel.pushState();
    }
  }

  get contractSnapshot(): DqContract {
    return this.contract;
  }

  post(message: HostMessage): void {
    void this.panel.webview.postMessage(message);
  }

  setBusy(busy: boolean, mensagem?: string): void {
    this.post({ type: "busy", busy, mensagem });
  }

  dispose(): void {
    ContractEditorPanel.abertos.delete(this.contract.meta.table);
    this.panel.dispose();
    for (const item of this.disposables) {
      item.dispose();
    }
  }

  private async handleMessage(message: ViewMessage): Promise<void> {
    switch (message.type) {
      case "ready":
        await this.pushState();
        break;

      case "updateContract":
        this.contract = message.contract;
        this.post({ type: "issues", issues: await this.validate() });
        break;

      case "save":
        try {
          const uri = await this.deps.store.save(this.contract);
          this.post({ type: "saved", caminhoArquivo: uri.fsPath });
          vscode.window.showInformationMessage(
            t().msg_contratoSalvo(vscode.workspace.asRelativePath(uri)),
          );
        } catch (err) {
          this.post({ type: "error", mensagem: describe(err) });
        }
        break;

      case "dryRun":
        if (!this.deps.onDryRun) {
          this.post({ type: "error", mensagem: "Dry-run ainda não disponível." });
          return;
        }
        try {
          await this.deps.onDryRun(this.contract, this, message.percentual);
        } catch (err) {
          this.post({ type: "error", mensagem: describe(err) });
        } finally {
          this.setBusy(false);
        }
        break;

      case "openYaml": {
        const document = await vscode.workspace.openTextDocument({
          language: "yaml",
          content: serializeContract(this.contract),
        });
        await vscode.window.showTextDocument(document, { preview: true, viewColumn: vscode.ViewColumn.Beside });
        break;
      }

      case "addCheck":
        this.contract = { ...this.contract, checks: [...this.contract.checks, message.check] };
        await this.pushState();
        break;

      case "removeCheck":
        this.contract = {
          ...this.contract,
          checks: this.contract.checks.filter((_, i) => i !== message.index),
        };
        await this.pushState();
        break;
    }
  }

  private async pushState(): Promise<void> {
    const [catalog, columns] = await Promise.all([
      this.deps.checkCatalog.get().catch(() => []),
      this.deps.catalog.getColumns(this.contract.meta.table).catch(() => []),
    ]);

    const state: EditorState = {
      contract: this.contract,
      origins: this.origins,
      catalog,
      columns: columns.map((c) => ({ name: c.name, type: c.typeText, nullable: c.nullable })),
      issues: await this.validate(catalog.length ? catalog : undefined, columns.map((c) => c.name)),
      dimensoesSugeridas: defaultDimensions(this.contract.meta.layer),
      salvo: (await this.deps.store.find(this.contract.meta.table)) !== undefined,
      idioma: resolverIdioma(
        vscode.workspace.getConfiguration("dqxForge").get<string>("language", ""),
        vscode.env.language,
      ),
    };
    this.post({ type: "state", state });
  }

  private async validate(catalog?: EditorState["catalog"], columns?: string[]) {
    const entries = catalog ?? this.deps.checkCatalog.peek();
    let colunas = columns;
    if (!colunas) {
      colunas = await this.deps.catalog
        .getColumns(this.contract.meta.table)
        .then((cols) => cols.map((c) => c.name))
        .catch(() => undefined);
    }
    return validateContractText(serializeContract(this.contract), {
      catalog: entries,
      columns: colunas,
    });
  }

  private renderHtml(): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.deps.extensionUri, "dist", "webview.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.deps.extensionUri, "dist", "webview.css"),
    );
    const nonce = randomBytes(16).toString("base64");

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link href="${styleUri}" rel="stylesheet">
  <title>Contrato de qualidade</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

import { t } from "../i18n/current";
import * as vscode from "vscode";
import { CatalogClient, type ColumnInfo, type TableInfo } from "../remote/catalog_client";
import { detectLayer, layerLabel } from "../domain/layer_profiles";

export type Node =
  | { kind: "message"; label: string; detail?: string; command?: vscode.Command }
  | { kind: "catalog"; name: string; comment?: string }
  | { kind: "schema"; catalog: string; name: string; comment?: string }
  | { kind: "table"; table: TableInfo }
  | { kind: "column"; column: ColumnInfo };

export function isTableNode(node: unknown): node is Extract<Node, { kind: "table" }> {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { kind?: unknown }).kind === "table" &&
    typeof (node as { table?: { fullName?: unknown } }).table?.fullName === "string"
  );
}

export function isSchemaNode(node: unknown): node is Extract<Node, { kind: "schema" }> {
  return (
    typeof node === "object" &&
    node !== null &&
    (node as { kind?: unknown }).kind === "schema" &&
    typeof (node as { catalog?: unknown }).catalog === "string"
  );
}

export class CatalogTreeProvider implements vscode.TreeDataProvider<Node> {
  private readonly changeEmitter = new vscode.EventEmitter<Node | undefined>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  constructor(private client: CatalogClient) {}

  refresh(): void {
    this.changeEmitter.fire(undefined);
  }

  getTreeItem(node: Node): vscode.TreeItem {
    switch (node.kind) {
      case "message": {
        const item = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None);
        item.description = node.detail;
        item.tooltip = node.detail;
        item.command = node.command;
        item.iconPath = new vscode.ThemeIcon("info");
        return item;
      }
      case "catalog": {
        const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
        item.iconPath = new vscode.ThemeIcon("database");
        item.contextValue = "dqxCatalog";
        item.tooltip = node.comment;
        return item;
      }
      case "schema": {
        const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Collapsed);
        item.iconPath = new vscode.ThemeIcon("symbol-namespace");
        item.contextValue = "dqxSchema";
        item.tooltip = node.comment;
        return item;
      }
      case "table": {
        const item = new vscode.TreeItem(node.table.name, vscode.TreeItemCollapsibleState.Collapsed);
        item.iconPath = new vscode.ThemeIcon("table");
        item.contextValue = "dqxTable";
        item.description = layerLabel(detectLayer(node.table.name));
        item.tooltip = new vscode.MarkdownString(
          [`**${node.table.fullName}**`, node.table.tableType, node.table.comment]
            .filter(Boolean)
            .join("\n\n"),
        );
        return item;
      }
      case "column": {
        const item = new vscode.TreeItem(node.column.name, vscode.TreeItemCollapsibleState.None);
        item.iconPath = new vscode.ThemeIcon("symbol-field");
        item.contextValue = "dqxColumn";
        item.description = node.column.nullable
          ? node.column.typeText
          : `${node.column.typeText} · not null`;
        item.tooltip = node.column.comment;
        return item;
      }
    }
  }

  async getChildren(node?: Node): Promise<Node[]> {
    try {
      if (!node) {
        return await this.rootNodes();
      }
      switch (node.kind) {
        case "catalog": {
          const schemas = await this.client.listSchemas(node.name);
          return schemas.length
            ? schemas.map((s) => ({ kind: "schema", catalog: s.catalogName, name: s.name, comment: s.comment }))
            : [{ kind: "message", label: t().arvore_semSchema }];
        }
        case "schema": {
          const tables = await this.client.listTables(node.catalog, node.name);
          return tables.length
            ? tables.map((table) => ({ kind: "table", table }))
            : [{ kind: "message", label: "Nenhuma tabela acessível" }];
        }
        case "table": {
          const columns = await this.client.getColumns(node.table.fullName);
          return columns.length
            ? columns.map((column) => ({ kind: "column", column }))
            : [{ kind: "message", label: t().arvore_semColuna }];
        }
        default:
          return [];
      }
    } catch (err) {
      return [this.errorNode(err)];
    }
  }

  private async rootNodes(): Promise<Node[]> {
    const catalogs = await this.client.listCatalogs();
    const filter = vscode.workspace
      .getConfiguration("dqxForge")
      .get<string[]>("catalogFilter", [])
      .filter((c) => c.trim().length > 0);

    const visible = filter.length
      ? catalogs.filter((c) => filter.includes(c.name))
      : catalogs;

    if (!visible.length) {
      return [
        {
          kind: "message",
          label: filter.length ? t().arvore_semCatalogoFiltro : t().arvore_semCatalogo,
          detail: filter.length ? `Filtro: ${filter.join(", ")}` : undefined,
        },
      ];
    }
    return visible.map((c) => ({ kind: "catalog", name: c.name, comment: c.comment }));
  }

  private errorNode(err: unknown): Node {
    const message = err instanceof Error ? err.message : String(err);
    const isAuth = /perfil|token|auth|401|403/i.test(message);
    return {
      kind: "message",
      label: isAuth ? t().arvore_falhaConectar : t().arvore_erroCatalogo,
      detail: message,
      command: isAuth
        ? { command: "dqxForge.selectProfile", title: t().arvore_selecionarPerfil }
        : undefined,
    };
  }
}

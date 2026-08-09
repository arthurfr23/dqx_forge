import { DatabricksAuth } from "../auth/databricks_auth";

export interface CatalogInfo {
  name: string;
  comment?: string;
}

export interface SchemaInfo {
  name: string;
  catalogName: string;
  comment?: string;
}

export interface TableInfo {
  name: string;
  catalogName: string;
  schemaName: string;
  fullName: string;
  tableType?: string;
  comment?: string;
}

export interface ColumnInfo {
  name: string;
  typeName: string;
  typeText: string;
  nullable: boolean;
  comment?: string;
  position: number;
}

interface Paged<T> {
  next_page_token?: string;
  [key: string]: unknown;
  items?: T[];
}

/** Leitura do Unity Catalog. Respeita as permissões do usuário — só retorna o que ele enxerga. */
export class CatalogClient {
  constructor(private auth: DatabricksAuth) {}

  async listCatalogs(): Promise<CatalogInfo[]> {
    const raw = await this.collect<{ name: string; comment?: string }>(
      "/api/2.1/unity-catalog/catalogs",
      "catalogs",
      { max_results: 100 },
    );
    return raw
      .map((c) => ({ name: c.name, comment: c.comment }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listSchemas(catalogName: string): Promise<SchemaInfo[]> {
    const raw = await this.collect<{ name: string; comment?: string }>(
      "/api/2.1/unity-catalog/schemas",
      "schemas",
      { catalog_name: catalogName, max_results: 100 },
    );
    return raw
      .map((s) => ({ name: s.name, catalogName, comment: s.comment }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listTables(catalogName: string, schemaName: string): Promise<TableInfo[]> {
    const raw = await this.collect<{
      name: string;
      full_name?: string;
      table_type?: string;
      comment?: string;
    }>("/api/2.1/unity-catalog/tables", "tables", {
      catalog_name: catalogName,
      schema_name: schemaName,
      max_results: 100,
      // Evita puxar o schema completo de cada tabela só para montar a árvore.
      omit_columns: "true",
    });
    return raw
      .map((t) => ({
        name: t.name,
        catalogName,
        schemaName,
        fullName: t.full_name ?? `${catalogName}.${schemaName}.${t.name}`,
        tableType: t.table_type,
        comment: t.comment,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getColumns(fullName: string): Promise<ColumnInfo[]> {
    const table = await this.auth.request<{
      columns?: Array<{
        name: string;
        type_name?: string;
        type_text?: string;
        nullable?: boolean;
        comment?: string;
        position?: number;
      }>;
    }>(`/api/2.1/unity-catalog/tables/${encodeURIComponent(fullName)}`);

    return (table.columns ?? []).map((c, index) => ({
      name: c.name,
      typeName: c.type_name ?? "UNKNOWN",
      typeText: c.type_text ?? c.type_name ?? "unknown",
      nullable: c.nullable ?? true,
      comment: c.comment,
      position: c.position ?? index,
    }));
  }

  private async collect<T>(
    path: string,
    key: string,
    query: Record<string, string | number | undefined>,
  ): Promise<T[]> {
    const items: T[] = [];
    let pageToken: string | undefined;

    do {
      const page = await this.auth.request<Paged<T>>(path, {
        query: { ...query, page_token: pageToken },
      });
      const batch = page[key] as T[] | undefined;
      if (batch?.length) {
        items.push(...batch);
      }
      pageToken = page.next_page_token;
    } while (pageToken);

    return items;
  }
}

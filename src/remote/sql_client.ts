import { DatabricksAuth } from "../auth/databricks_auth";

export interface QueryResult {
  columns: string[];
  rows: Array<Array<string | null>>;
  truncated: boolean;
}

interface StatementResponse {
  statement_id: string;
  status: { state: string; error?: { message?: string } };
  manifest?: {
    schema?: { columns?: Array<{ name: string; type_text?: string }> };
    truncated?: boolean;
  };
  result?: { data_array?: Array<Array<string | null>> };
}

const TERMINAL = new Set(["SUCCEEDED", "FAILED", "CANCELED", "CLOSED"]);

/**
 * Consultas rápidas via SQL warehouse. É o que torna viável um agente de IA
 * explorar o Lakehouse: cada ferramenta responde em segundos, não nos minutos
 * que um job serverless levaria.
 */
export class SqlClient {
  constructor(
    private auth: DatabricksAuth,
    private warehouseId: () => string,
  ) {}

  get configured(): boolean {
    return this.warehouseId().trim().length > 0;
  }

  async query(statement: string, rowLimit = 100): Promise<QueryResult> {
    const warehouse = this.warehouseId().trim();
    if (!warehouse) {
      throw new Error(
        "Nenhum SQL warehouse configurado. Defina dqxForge.warehouseId para habilitar consultas interativas.",
      );
    }

    let response = await this.auth.request<StatementResponse>("/api/2.0/sql/statements", {
      method: "POST",
      body: {
        statement,
        warehouse_id: warehouse,
        wait_timeout: "30s",
        on_wait_timeout: "CONTINUE",
        format: "JSON_ARRAY",
        disposition: "INLINE",
        row_limit: rowLimit,
      },
    });

    while (!TERMINAL.has(response.status.state)) {
      await delay(1000);
      response = await this.auth.request<StatementResponse>(
        `/api/2.0/sql/statements/${response.statement_id}`,
      );
    }

    if (response.status.state !== "SUCCEEDED") {
      throw new Error(response.status.error?.message ?? `Consulta terminou em ${response.status.state}.`);
    }

    return {
      columns: (response.manifest?.schema?.columns ?? []).map((c) => c.name),
      rows: response.result?.data_array ?? [],
      truncated: response.manifest?.truncated ?? false,
    };
  }

  /** Converte o resultado em objetos, mais conveniente para alimentar um LLM. */
  async queryObjects(statement: string, rowLimit = 100): Promise<Array<Record<string, string | null>>> {
    const result = await this.query(statement, rowLimit);
    return result.rows.map((row) =>
      Object.fromEntries(result.columns.map((column, i) => [column, row[i] ?? null])),
    );
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

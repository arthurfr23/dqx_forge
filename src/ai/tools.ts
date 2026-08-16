import type { CatalogClient } from "../remote/catalog_client";
import type { SqlClient } from "../remote/sql_client";
import type { DqxCheck } from "../domain/profiling";

export interface ToolContext {
  catalog: CatalogClient;
  sql: SqlClient;
  /** Preenchido pelo propose_checks — é a saída real do agente. */
  propostas: Array<{ check: DqxCheck; justificativa: string }>;
  /** Registro do que o agente fez, para a UI mostrar o raciocínio. */
  trilha: Array<{ ferramenta: string; entrada: unknown; resumo: string }>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  run: (input: Record<string, unknown>, context: ToolContext) => Promise<string>;
}

const MAX_LINHAS_AMOSTRA = 20;

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "list_tables",
    description:
      "Lista as tabelas de um schema do Unity Catalog. Use para descobrir o que existe antes de decidir o que validar.",
    schema: {
      type: "object",
      properties: {
        catalog: { type: "string" },
        schema: { type: "string" },
      },
      required: ["catalog", "schema"],
    },
    run: async (input, context) => {
      const tables = await context.catalog.listTables(String(input.catalog), String(input.schema));
      const linhas = tables.map((t) => `${t.name} (${t.tableType ?? "TABLE"})`);
      return linhas.length ? linhas.join("\n") : "Nenhuma tabela acessível neste schema.";
    },
  },

  {
    name: "describe_table",
    description:
      "Mostra as colunas de uma tabela com tipo, nulidade e comentário. Sempre chame isto antes de propor checks para uma tabela.",
    schema: {
      type: "object",
      properties: { table: { type: "string", description: "catalog.schema.tabela" } },
      required: ["table"],
    },
    run: async (input, context) => {
      const columns = await context.catalog.getColumns(String(input.table));
      if (!columns.length) {
        return "Tabela sem colunas visíveis ou inacessível.";
      }
      return columns
        .map(
          (c) =>
            `${c.name} : ${c.typeText}${c.nullable ? "" : " NOT NULL"}${c.comment ? ` -- ${c.comment}` : ""}`,
        )
        .join("\n");
    },
  },

  {
    name: "sample_table",
    description:
      "Retorna algumas linhas da tabela para você ver o formato real dos dados (padrões de texto, unidades, códigos).",
    schema: {
      type: "object",
      properties: {
        table: { type: "string" },
        limit: { type: "integer", description: `máximo ${MAX_LINHAS_AMOSTRA}` },
      },
      required: ["table"],
    },
    run: async (input, context) => {
      const limit = clamp(Number(input.limit ?? 10), 1, MAX_LINHAS_AMOSTRA);
      const table = requireIdentifier(String(input.table));
      const result = await context.sql.query(`SELECT * FROM ${table} LIMIT ${limit}`, limit);
      return formatTable(result.columns, result.rows);
    },
  },

  {
    name: "profile_column",
    description:
      "Estatísticas de uma coluna: total, nulos, distintos, mínimo e máximo. Use para decidir limites e se a coluna tem domínio fechado.",
    schema: {
      type: "object",
      properties: { table: { type: "string" }, column: { type: "string" } },
      required: ["table", "column"],
    },
    run: async (input, context) => {
      const table = requireIdentifier(String(input.table));
      const column = requireIdentifier(String(input.column));
      const rows = await context.sql.queryObjects(
        `SELECT count(*) AS total,
                count(*) - count(${column}) AS nulos,
                count(DISTINCT ${column}) AS distintos,
                min(${column}) AS minimo,
                max(${column}) AS maximo
         FROM ${table}`,
        1,
      );
      const stats = rows[0] ?? {};
      const distintos = Number(stats.distintos ?? 0);

      // Domínio pequeno é o sinal que justifica um is_in_list.
      let dominio = "";
      if (distintos > 0 && distintos <= 25) {
        const valores = await context.sql.queryObjects(
          `SELECT ${column} AS valor, count(*) AS n FROM ${table}
           GROUP BY ${column} ORDER BY n DESC LIMIT 25`,
          25,
        );
        dominio = `\nvalores distintos: ${valores.map((v) => `${v.valor} (${v.n})`).join(", ")}`;
      }

      return (
        `total=${stats.total} nulos=${stats.nulos} distintos=${stats.distintos} ` +
        `min=${stats.minimo} max=${stats.maximo}${dominio}`
      );
    },
  },

  {
    name: "run_sql",
    description:
      "Executa uma consulta SELECT somente-leitura para confirmar uma hipótese (ex.: quantas linhas violariam uma regra). Não pode modificar dados.",
    schema: {
      type: "object",
      properties: { query: { type: "string", description: "somente SELECT ou WITH" } },
      required: ["query"],
    },
    run: async (input, context) => {
      const query = String(input.query).trim();
      assertReadOnly(query);
      const result = await context.sql.query(query, 50);
      return formatTable(result.columns, result.rows);
    },
  },

  {
    name: "propose_checks",
    description:
      "Registra os checks de qualidade que você decidiu propor, cada um com a justificativa baseada no que você observou nos dados. Chame uma única vez, ao final.",
    schema: {
      type: "object",
      properties: {
        checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              criticality: { type: "string", enum: ["error", "warn"] },
              name: { type: "string" },
              filter: { type: "string" },
              function: { type: "string", description: "nome da check function do DQX" },
              arguments: { type: "object" },
              dimensao: { type: "string" },
              justificativa: { type: "string" },
            },
            required: ["criticality", "function", "arguments", "justificativa"],
          },
        },
      },
      required: ["checks"],
    },
    run: async (input, context) => {
      const propostas = Array.isArray(input.checks) ? input.checks : [];
      for (const item of propostas as Array<Record<string, unknown>>) {
        const check: DqxCheck = {
          criticality: item.criticality === "warn" ? "warn" : "error",
          name: typeof item.name === "string" ? item.name : undefined,
          filter: typeof item.filter === "string" ? item.filter : undefined,
          check: {
            function: String(item.function),
            arguments: (item.arguments as Record<string, unknown>) ?? {},
          },
          user_metadata:
            typeof item.dimensao === "string" ? { dimensao: item.dimensao } : undefined,
        };
        context.propostas.push({
          check,
          justificativa: String(item.justificativa ?? ""),
        });
      }
      return `${propostas.length} checks registrados. Encerre sua resposta com um resumo do que você propôs e por quê.`;
    },
  },
];

export async function runTool(
  name: string,
  input: Record<string, unknown>,
  context: ToolContext,
): Promise<string> {
  const tool = AGENT_TOOLS.find((t) => t.name === name);
  if (!tool) {
    return `Ferramenta desconhecida: ${name}`;
  }
  try {
    const saida = await tool.run(input, context);
    context.trilha.push({ ferramenta: name, entrada: input, resumo: firstLine(saida) });
    return saida;
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : String(err);
    context.trilha.push({ ferramenta: name, entrada: input, resumo: `erro: ${mensagem}` });
    // Devolver o erro ao modelo em vez de lançar: ele costuma se corrigir.
    return `A ferramenta falhou: ${mensagem}`;
  }
}

/**
 * Barreira contra o agente escrever no Lakehouse. O prompt já pede só leitura,
 * mas a garantia precisa estar no código, não na boa vontade do modelo.
 */
function assertReadOnly(query: string): void {
  const normalizado = query.replace(/--[^\n]*/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
  if (!/^(SELECT|WITH|DESCRIBE|SHOW|EXPLAIN)\b/.test(normalizado)) {
    throw new Error("Só consultas de leitura são permitidas (SELECT, WITH, DESCRIBE, SHOW).");
  }
  // Casar a palavra solta barrava consulta legítima: `replace(...)` é função de
  // string, e com dados mal formatados é justamente o que se usa para testar
  // formato. Como a instrução já precisa começar com SELECT/WITH e não pode ter
  // ';', o que resta é reconhecer a escrita pela frase inteira.
  const proibidos =
    /\b(INSERT\s+(INTO|OVERWRITE)|DELETE\s+FROM|UPDATE\s+\S+\s+SET|MERGE\s+INTO|DROP\s+(TABLE|VIEW|SCHEMA|DATABASE|CATALOG|FUNCTION|VOLUME)|TRUNCATE\s+TABLE|ALTER\s+(TABLE|VIEW|SCHEMA|DATABASE|CATALOG)|CREATE\s+(OR\s+REPLACE\s+)?(TABLE|VIEW|FUNCTION|SCHEMA|DATABASE|CATALOG|VOLUME)|GRANT\s|REVOKE\s|COPY\s+INTO|VACUUM\s|RESTORE\s+TABLE)\b/;
  if (proibidos.test(normalizado)) {
    throw new Error("A consulta contém um comando de escrita, que não é permitido aqui.");
  }
  if (normalizado.includes(";")) {
    throw new Error("Envie uma única instrução, sem ponto e vírgula.");
  }
}

/** Aceita apenas identificadores qualificados, barrando injeção via nome. */
function requireIdentifier(value: string): string {
  const limpo = value.trim().replace(/`/g, "");
  if (!/^[A-Za-z_][\w]*(\.[A-Za-z_][\w]*)*$/.test(limpo)) {
    throw new Error(`Identificador inválido: ${value}`);
  }
  return limpo
    .split(".")
    .map((part) => `\`${part}\``)
    .join(".");
}

function formatTable(columns: string[], rows: Array<Array<string | null>>): string {
  if (!rows.length) {
    return "(nenhuma linha)";
  }
  const header = columns.join(" | ");
  const corpo = rows
    .map((row) => row.map((cell) => (cell === null ? "NULL" : truncate(String(cell), 40))).join(" | "))
    .join("\n");
  return `${header}\n${"-".repeat(Math.min(header.length, 80))}\n${corpo}`;
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function firstLine(text: string): string {
  const linha = text.split("\n")[0] ?? "";
  return truncate(linha, 100);
}

import { parse as parseYaml } from "yaml";
import type { DqxCheck } from "../domain/profiling";
import type { SqlClient } from "../remote/sql_client";

export interface ImportResult {
  checks: DqxCheck[];
  /** Tabela declarada na origem, quando ela informa uma. */
  table?: string;
  /** O que foi ignorado e por quê — sempre mostrado ao usuário. */
  avisos: string[];
}

/**
 * Lê checks de um arquivo que o usuário já tem. Aceita três formatos que
 * aparecem na prática: a lista crua de checks do DQX, um contrato completo do
 * DQX Forge, e o wrapper `{checks: [...]}` que algumas instalações usam.
 */
export function importFromText(texto: string): ImportResult {
  const avisos: string[] = [];
  const conteudo = texto.trim();
  if (!conteudo) {
    throw new Error("Arquivo vazio.");
  }

  let dados: unknown;
  try {
    dados = conteudo.startsWith("{") || conteudo.startsWith("[")
      ? JSON.parse(conteudo)
      : parseYaml(conteudo);
  } catch (err) {
    throw new Error(
      `Não consegui ler o arquivo como YAML nem como JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  let bruto: unknown[];
  let table: string | undefined;

  if (Array.isArray(dados)) {
    bruto = dados;
  } else if (dados && typeof dados === "object") {
    const objeto = dados as Record<string, unknown>;
    if (Array.isArray(objeto.checks)) {
      bruto = objeto.checks;
      const meta = objeto.meta as Record<string, unknown> | undefined;
      if (meta && typeof meta.table === "string") {
        table = meta.table;
      }
    } else {
      throw new Error(
        "Não encontrei uma lista de checks. Esperado um array de checks ou um objeto com a chave 'checks'.",
      );
    }
  } else {
    throw new Error("Formato não reconhecido.");
  }

  const checks: DqxCheck[] = [];
  bruto.forEach((item, indice) => {
    const normalizado = normalizarCheck(item, indice, avisos);
    if (normalizado) {
      checks.push(normalizado);
    }
  });

  if (!checks.length) {
    throw new Error("Nenhum check válido foi encontrado no arquivo.");
  }

  return { checks, table, avisos };
}

/**
 * Lê checks de uma tabela Delta no formato do DQX — o caminho de migração para
 * quem já roda DQX e quer passar a versionar as regras em Git.
 */
export async function importFromTable(
  sql: SqlClient,
  tabelaDeChecks: string,
): Promise<ImportResult> {
  const avisos: string[] = [];
  const linhas = await sql.queryObjects(
    `SELECT * FROM ${escapeIdentifier(tabelaDeChecks)}`,
    1000,
  );

  if (!linhas.length) {
    throw new Error(`A tabela ${tabelaDeChecks} não tem linhas.`);
  }

  const checks: DqxCheck[] = [];
  linhas.forEach((linha, indice) => {
    // A coluna `check` é um struct; a Statement Execution API a devolve
    // serializada como JSON.
    const bruto: Record<string, unknown> = {
      name: linha.name ?? undefined,
      criticality: linha.criticality ?? "error",
      filter: linha.filter ?? undefined,
      check: parseTalvezJson(linha.check),
      user_metadata: parseTalvezJson(linha.user_metadata),
    };
    const normalizado = normalizarCheck(bruto, indice, avisos);
    if (normalizado) {
      checks.push(normalizado);
    }
  });

  if (!checks.length) {
    throw new Error(`Nenhum check válido em ${tabelaDeChecks}.`);
  }

  return { checks, avisos };
}

function normalizarCheck(item: unknown, indice: number, avisos: string[]): DqxCheck | undefined {
  if (!item || typeof item !== "object") {
    avisos.push(`Item ${indice + 1} ignorado: não é um objeto.`);
    return undefined;
  }

  const objeto = item as Record<string, unknown>;
  const bloco = objeto.check as Record<string, unknown> | undefined;

  // Alguns exports achatam a estrutura, deixando function/arguments no topo.
  const funcao =
    (bloco && typeof bloco.function === "string" ? bloco.function : undefined) ??
    (typeof objeto.function === "string" ? objeto.function : undefined);

  if (!funcao) {
    avisos.push(`Item ${indice + 1} ignorado: não tem check.function.`);
    return undefined;
  }

  const argumentos =
    (bloco?.arguments as Record<string, unknown> | undefined) ??
    (objeto.arguments as Record<string, unknown> | undefined) ??
    {};

  const criticality = objeto.criticality === "warn" ? "warn" : "error";
  if (objeto.criticality && objeto.criticality !== "warn" && objeto.criticality !== "error") {
    avisos.push(
      `Check ${indice + 1} (${funcao}): criticality "${String(objeto.criticality)}" não é válida, assumindo "error".`,
    );
  }

  const forEach = bloco?.for_each_column ?? objeto.for_each_column;

  return {
    criticality,
    name: typeof objeto.name === "string" ? objeto.name : undefined,
    filter: typeof objeto.filter === "string" ? objeto.filter : undefined,
    check: {
      function: funcao,
      arguments: argumentos,
      for_each_column: Array.isArray(forEach) ? (forEach as string[]) : undefined,
    },
    user_metadata:
      objeto.user_metadata && typeof objeto.user_metadata === "object"
        ? (objeto.user_metadata as Record<string, string>)
        : undefined,
  };
}

function parseTalvezJson(valor: unknown): Record<string, unknown> | undefined {
  if (!valor) {
    return undefined;
  }
  if (typeof valor === "object") {
    return valor as Record<string, unknown>;
  }
  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function escapeIdentifier(nome: string): string {
  const limpo = nome.trim().replace(/`/g, "");
  if (!/^[A-Za-z_][\w]*(\.[A-Za-z_][\w]*)*$/.test(limpo)) {
    throw new Error(`Nome de tabela inválido: ${nome}`);
  }
  return limpo
    .split(".")
    .map((parte) => `\`${parte}\``)
    .join(".");
}

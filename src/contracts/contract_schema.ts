import { createHash } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { ColumnInfo } from "../remote/catalog_client";
import type { DqxCheck } from "../domain/profiling";
import { detectLayer, type Layer } from "../domain/layer_profiles";

export type OrigemContrato = "profiling" | "ia_assistida" | "ia_agente" | "import" | "manual";
export type ModoSaida = "quarentena" | "anotacao";

export interface ContractMeta {
  table: string;
  camada: Layer;
  gerado_por: OrigemContrato;
  gerado_em: string;
  dqx_version?: string;
  schema_fingerprint?: string;
}

export interface ContractOutput {
  modo: ModoSaida;
  tabela_saida?: string;
  tabela_quarentena?: string;
  tabela_metricas?: string;
}

export interface DqContract {
  meta: ContractMeta;
  output: ContractOutput;
  checks: DqxCheck[];
}

/**
 * Serialização determinística: chaves sempre na mesma ordem, sem timestamps
 * espúrios. Sem isso o `git diff` vira ruído e o modelo GitOps perde o sentido.
 */
export function serializeContract(contract: DqContract): string {
  const ordered = {
    meta: pickDefined({
      table: contract.meta.table,
      camada: contract.meta.camada,
      gerado_por: contract.meta.gerado_por,
      gerado_em: contract.meta.gerado_em,
      dqx_version: contract.meta.dqx_version,
      schema_fingerprint: contract.meta.schema_fingerprint,
    }),
    output: pickDefined({
      modo: contract.output.modo,
      tabela_saida: contract.output.tabela_saida,
      tabela_quarentena:
        contract.output.modo === "quarentena" ? contract.output.tabela_quarentena : undefined,
      tabela_metricas: contract.output.tabela_metricas,
    }),
    checks: contract.checks.map(orderCheck),
  };

  return stringifyYaml(ordered, {
    indent: 2,
    lineWidth: 100,
    singleQuote: false,
    // Mantém os checks legíveis em bloco em vez de colapsar em JSON inline.
    defaultStringType: "PLAIN",
    defaultKeyType: "PLAIN",
  });
}

export function parseContract(text: string): DqContract {
  const raw = parseYaml(text) as Partial<DqContract> | null;
  if (!raw || typeof raw !== "object") {
    throw new Error("Contrato vazio ou inválido.");
  }
  if (!raw.meta?.table) {
    throw new Error("Contrato sem meta.table.");
  }
  if (!Array.isArray(raw.checks)) {
    throw new Error("Contrato sem lista de checks.");
  }
  return {
    meta: raw.meta as ContractMeta,
    output: raw.output ?? { modo: "anotacao" },
    checks: raw.checks,
  };
}

function orderCheck(check: DqxCheck): Record<string, unknown> {
  return pickDefined({
    criticality: check.criticality,
    name: check.name,
    filter: check.filter,
    check: pickDefined({
      function: check.check.function,
      arguments: sortKeys(check.check.arguments),
      for_each_column: check.check.for_each_column,
    }),
    user_metadata: check.user_metadata ? sortKeys(check.user_metadata) : undefined,
  });
}

/**
 * A ordem das colunas importa: o fingerprint precisa mudar quando uma coluna
 * troca de tipo ou some, mas não quando o catálogo devolve a lista embaralhada.
 */
export function schemaFingerprint(columns: ColumnInfo[]): string {
  const canonical = columns
    .map((c) => `${c.name}:${c.typeText}:${c.nullable ? "null" : "notnull"}`)
    .sort()
    .join("|");
  return `sha256:${createHash("sha256").update(canonical).digest("hex").slice(0, 16)}`;
}

export function contractFileName(table: string): string {
  return `${table}.yml`;
}

export function newContract(params: {
  table: string;
  checks: DqxCheck[];
  origem: OrigemContrato;
  dqxVersion?: string;
  columns?: ColumnInfo[];
  modo?: ModoSaida;
}): DqContract {
  const tableName = params.table.split(".").pop() ?? params.table;
  return {
    meta: pickDefined<ContractMeta>({
      table: params.table,
      camada: detectLayer(tableName),
      gerado_por: params.origem,
      gerado_em: new Date().toISOString(),
      dqx_version: params.dqxVersion,
      schema_fingerprint: params.columns ? schemaFingerprint(params.columns) : undefined,
    }),
    output: {
      modo: params.modo ?? "anotacao",
      tabela_saida: params.table,
    },
    checks: params.checks,
  };
}

function sortKeys<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

/** Remove chaves undefined para que não virem `null` no YAML. */
function pickDefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

import { createHash } from "node:crypto";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import type { ColumnInfo } from "../remote/catalog_client";
import type { DqxCheck } from "../domain/profiling";
import { detectLayer, type Layer } from "../domain/layer_profiles";

export type OrigemContrato = "profiling" | "ai_assisted" | "ai_agent" | "import" | "manual";
export type ModoSaida = "quarantine" | "annotate";

export interface ContractMeta {
  table: string;
  layer: Layer;
  generated_by: OrigemContrato;
  generated_at: string;
  dqx_version?: string;
  schema_fingerprint?: string;
}

export interface ContractOutput {
  mode: ModoSaida;
  output_table?: string;
  quarantine_table?: string;
  metrics_table?: string;
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
      layer: contract.meta.layer,
      generated_by: contract.meta.generated_by,
      generated_at: contract.meta.generated_at,
      dqx_version: contract.meta.dqx_version,
      schema_fingerprint: contract.meta.schema_fingerprint,
    }),
    output: pickDefined({
      mode: contract.output.mode,
      output_table: contract.output.output_table,
      quarantine_table:
        contract.output.mode === "quarantine" ? contract.output.quarantine_table : undefined,
      metrics_table: contract.output.metrics_table,
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
    meta: migrarMeta(raw.meta as unknown as Record<string, unknown>),
    output: migrarOutput((raw.output ?? {}) as Record<string, unknown>),
    checks: (raw.checks as DqxCheck[]).map(migrarCheck),
  };
}

/**
 * Os contratos nasceram com chaves e valores em português. O YAML é artefato de
 * repositório, lido por gente e por ferramenta fora daqui, então padronizou-se
 * em inglês — mas os arquivos já versionados continuam sendo aceitos e migram
 * no próximo save.
 */
const MODOS: Record<string, ModoSaida> = { quarentena: "quarantine", anotacao: "annotate" };
const ORIGENS: Record<string, OrigemContrato> = {
  ia_agente: "ai_agent",
  ia_assistida: "ai_assisted",
};
const DIMENSOES: Record<string, string> = {
  completude: "completeness",
  validade: "validity",
  acuracia: "accuracy",
  unicidade: "uniqueness",
  consistencia: "consistency",
  atualidade: "timeliness",
};

function migrarMeta(meta: Record<string, unknown> = {}): ContractMeta {
  const camada = (meta.layer ?? meta.camada) as Layer | undefined;
  const origem = (meta.generated_by ?? meta.gerado_por) as string | undefined;
  return pickDefined<ContractMeta>({
    table: meta.table as string,
    layer: camada === ("desconhecida" as Layer) ? "unknown" : (camada ?? "unknown"),
    generated_by: ((origem && ORIGENS[origem]) || (origem as OrigemContrato) || "manual"),
    generated_at: (meta.generated_at ?? meta.gerado_em ?? new Date().toISOString()) as string,
    dqx_version: meta.dqx_version as string | undefined,
    schema_fingerprint: meta.schema_fingerprint as string | undefined,
  });
}

function migrarOutput(output: Record<string, unknown>): ContractOutput {
  const modo = (output.mode ?? output.modo) as string | undefined;
  return pickDefined<ContractOutput>({
    mode: ((modo && MODOS[modo]) || (modo as ModoSaida) || "annotate"),
    output_table: (output.output_table ?? output.tabela_saida) as string | undefined,
    quarantine_table: (output.quarantine_table ?? output.tabela_quarentena) as string | undefined,
    metrics_table: (output.metrics_table ?? output.tabela_metricas) as string | undefined,
  });
}

function migrarCheck(check: DqxCheck): DqxCheck {
  const meta = check.user_metadata;
  if (!meta) {
    return check;
  }
  const { dimensao, dimension, ...resto } = meta as Record<string, string>;
  const valor = dimension ?? dimensao;
  return {
    ...check,
    user_metadata: valor
      ? { ...resto, dimension: DIMENSOES[valor] ?? valor }
      : (resto as Record<string, string>),
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
      layer: detectLayer(tableName),
      generated_by: params.origem,
      generated_at: new Date().toISOString(),
      dqx_version: params.dqxVersion,
      schema_fingerprint: params.columns ? schemaFingerprint(params.columns) : undefined,
    }),
    output: {
      mode: params.modo ?? "annotate",
      output_table: params.table,
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

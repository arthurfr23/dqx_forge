import { t } from "../i18n/current";
import type { Dimension } from "./layer_profiles";

/** Um check no formato nativo do DQX, consumível por apply_checks_by_metadata. */
export interface DqxCheck {
  name?: string;
  criticality: "error" | "warn";
  filter?: string;
  check: {
    function: string;
    arguments: Record<string, unknown>;
    for_each_column?: string[];
  };
  user_metadata?: Record<string, string>;
}

/** Saída bruta do DQProfiler para uma coluna. */
export interface DqxProfile {
  name: string;
  column: string;
  description?: string | null;
  parameters?: Record<string, unknown> | null;
  filter?: string | null;
}

export interface ColumnStats {
  count?: number;
  count_null?: number;
  count_non_null?: number;
  count_distinct?: number;
  empty_count?: number;
  mean?: number | null;
  stddev?: number | null;
  min?: unknown;
  max?: unknown;
  [key: string]: unknown;
}

export interface ProfileResult {
  task: "profile";
  ok: boolean;
  table: string;
  gerado_em: string;
  dqx_version?: string;
  summary_stats?: Record<string, ColumnStats>;
  profiles?: DqxProfile[];
  checks?: DqxCheck[];
  primary_keys?: Record<string, unknown>;
  primary_keys_error?: string;
  error?: string;
  traceback?: string;
}

export interface CheckCatalogEntry {
  name: string;
  scope: "row" | "dataset";
  dimension: Dimension;
  arguments: Array<{
    name: string;
    type: string;
    required: boolean;
    default: unknown;
  }>;
  return_type: string;
  doc: string;
}

export interface CheckCatalogResult {
  task: "introspect";
  ok: boolean;
  dqx_version?: string;
  checks?: CheckCatalogEntry[];
  total?: number;
  error?: string;
}

/**
 * Explica de onde veio um check sugerido, cruzando-o com o profile e as
 * estatísticas da coluna. É o que a UI mostra para o usuário decidir se aceita.
 */
export function explainCheck(
  check: DqxCheck,
  profiles: DqxProfile[],
  stats: Record<string, ColumnStats> | undefined,
): string | undefined {
  const column = typeof check.check.arguments.column === "string" ? check.check.arguments.column : undefined;
  if (!column) {
    return undefined;
  }

  const profile = profiles.find((p) => p.column === column && mapsTo(p.name, check.check.function));
  if (profile?.description) {
    return profile.description;
  }

  const columnStats = stats?.[column];
  if (!columnStats) {
    return undefined;
  }

  const total = numberOrUndefined(columnStats.count);
  const nulls = numberOrUndefined(columnStats.count_null);
  const distinct = numberOrUndefined(columnStats.count_distinct);

  if (check.check.function === "is_not_null" && total && nulls !== undefined) {
    return nulls === 0
      ? t().perfil_semNulos(total.toLocaleString(t().locale))
      : t().perfil_percentualNulos(((nulls / total) * 100).toFixed(1));
  }
  if (check.check.function === "is_in_range") {
    return t().perfil_faixa(format(columnStats.min), format(columnStats.max));
  }
  if (distinct !== undefined && total) {
    return t().perfil_distintos(distinct.toLocaleString(t().locale), total.toLocaleString(t().locale));
  }
  return undefined;
}

/** O profiler nomeia os perfis diferente das check functions que eles geram. */
function mapsTo(profileName: string, checkFunction: string): boolean {
  if (profileName === checkFunction) {
    return true;
  }
  const aliases: Record<string, string[]> = {
    min_max: ["is_in_range"],
    is_not_null_or_empty: ["is_not_null_and_not_empty"],
  };
  return aliases[profileName]?.includes(checkFunction) ?? false;
}

function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function format(value: unknown): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return typeof value === "number" ? value.toLocaleString(t().locale) : String(value);
}

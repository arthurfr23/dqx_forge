import { t } from "../i18n/current";
import { isMap, isSeq, parseDocument, type Node } from "yaml";
import type { CheckCatalogEntry } from "../domain/profiling";

export type Severity = "error" | "warning";

export interface ValidationIssue {
  severity: Severity;
  message: string;
  /** Offset do trecho no texto original, para virar Range no editor. */
  offset: [number, number];
  checkIndex?: number;
}

export interface ValidationContext {
  catalog?: CheckCatalogEntry[];
  /** Colunas da tabela, quando conhecidas — habilita checar nomes de coluna. */
  columns?: string[];
}

/**
 * Validação local e instantânea, feita sobre o texto do YAML para poder
 * apontar a linha exata. Não substitui o validate_checks do DQX, que roda
 * no workspace antes de gravar — pega o que dá para pegar sem ida ao servidor.
 */
export function validateContractText(
  text: string,
  context: ValidationContext = {},
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const doc = parseDocument(text);

  if (doc.errors.length) {
    for (const err of doc.errors) {
      issues.push({
        severity: "error",
        message: `YAML inválido: ${err.message}`,
        offset: [err.pos[0], err.pos[1]],
      });
    }
    return issues;
  }

  const root = doc.contents;
  if (!isMap(root)) {
    return [{ severity: "error", message: "O contrato deve ser um mapa YAML.", offset: [0, text.length] }];
  }

  const meta = root.get("meta", true);
  if (!isMap(meta) || !meta.get("table")) {
    issues.push({
      severity: "error",
      message: t().ctr_semMetaTable,
      offset: nodeRange(root),
    });
  }

  const checks = root.get("checks", true);
  if (!isSeq(checks)) {
    issues.push({
      severity: "error",
      message: t().ctr_semChecks,
      offset: nodeRange(root),
    });
    return issues;
  }

  const byName = new Map((context.catalog ?? []).map((c) => [c.name, c]));
  const seenNames = new Set<string>();

  checks.items.forEach((item, index) => {
    if (!isMap(item)) {
      issues.push({
        severity: "error",
        message: "Cada check deve ser um mapa.",
        offset: nodeRange(item as Node),
        checkIndex: index,
      });
      return;
    }

    const range = nodeRange(item as Node);
    const criticality = item.get("criticality");
    if (criticality !== "error" && criticality !== "warn") {
      issues.push({
        severity: "error",
        message: `criticality deve ser "error" ou "warn" (encontrado: ${JSON.stringify(criticality) ?? "ausente"}).`,
        offset: range,
        checkIndex: index,
      });
    }

    const name = item.get("name");
    if (typeof name === "string") {
      if (seenNames.has(name)) {
        issues.push({
          severity: "warning",
          message: `Nome de check duplicado: "${name}". Nomes repetidos dificultam ler os resultados.`,
          offset: range,
          checkIndex: index,
        });
      }
      seenNames.add(name);
    }

    const check = item.get("check", true);
    if (!isMap(check)) {
      issues.push({
        severity: "error",
        message: "Check sem o bloco check.function.",
        offset: range,
        checkIndex: index,
      });
      return;
    }

    const fnName = check.get("function");
    if (typeof fnName !== "string") {
      issues.push({
        severity: "error",
        message: t().ctr_funcaoObrigatoria,
        offset: range,
        checkIndex: index,
      });
      return;
    }

    // Sem catálogo carregado não dá para afirmar que a função não existe.
    const entry = byName.get(fnName);
    if (!entry) {
      if (byName.size > 0) {
        issues.push({
          severity: "error",
          message: `"${fnName}" não é uma check function do DQX ${suggest(fnName, [...byName.keys()])}`,
          offset: range,
          checkIndex: index,
        });
      }
      return;
    }

    const args = check.get("arguments", true);
    const provided = isMap(args)
      ? new Set(args.items.map((pair) => String((pair.key as { value?: unknown })?.value ?? "")))
      : new Set<string>();

    const hasForEach = Array.isArray(check.get("for_each_column"));
    for (const argument of entry.arguments) {
      if (!argument.required || provided.has(argument.name)) {
        continue;
      }
      // for_each_column preenche "column"/"columns" implicitamente.
      if (hasForEach && (argument.name === "column" || argument.name === "columns")) {
        continue;
      }
      issues.push({
        severity: "error",
        message: `"${fnName}" exige o argumento "${argument.name}".`,
        offset: range,
        checkIndex: index,
      });
    }

    const known = new Set(entry.arguments.map((a) => a.name));
    for (const name of provided) {
      if (!known.has(name)) {
        issues.push({
          severity: "warning",
          message: `"${fnName}" não recebe o argumento "${name}".`,
          offset: range,
          checkIndex: index,
        });
      }
    }

    if (context.columns?.length && isMap(args)) {
      const columnValue = args.get("column");
      if (typeof columnValue === "string" && !context.columns.includes(columnValue)) {
        issues.push({
          severity: "error",
          message: `A coluna "${columnValue}" não existe na tabela ${suggest(columnValue, context.columns)}`,
          offset: range,
          checkIndex: index,
        });
      }
    }
  });

  return issues;
}

function nodeRange(node: Node | null): [number, number] {
  const range = (node as { range?: [number, number, number] } | null)?.range;
  return range ? [range[0], range[1]] : [0, 0];
}

/** Sugere o candidato mais próximo, para erro de digitação virar conserto rápido. */
function suggest(value: string, candidates: string[]): string {
  let best: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of candidates) {
    const distance = editDistance(value, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }
  return best && bestDistance <= Math.max(2, Math.floor(value.length / 3))
    ? `— você quis dizer "${best}"?`
    : ".";
}

function editDistance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) {
    rows[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
}

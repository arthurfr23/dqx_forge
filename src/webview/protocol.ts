import type { DqContract } from "../contracts/contract_schema";
import type { CheckCatalogEntry, DqxCheck } from "../domain/profiling";
import type { ValidationIssue } from "../contracts/validator";
import type { Dimension } from "../domain/layer_profiles";
import type { Idioma } from "../i18n/messages";

/** Por que um check foi sugerido — o que o usuário lê para decidir se aceita. */
export interface CheckOrigin {
  explicacao?: string;
  dimensao?: Dimension;
  /** Sugestões vindas de profiling/IA começam desmarcadas para revisão. */
  sugerido: boolean;
}

export interface EditorState {
  contract: DqContract;
  /** Chaveado pelo índice do check em contract.checks. */
  origins: Record<number, CheckOrigin>;
  catalog: CheckCatalogEntry[];
  columns: Array<{ name: string; type: string; nullable: boolean }>;
  issues: ValidationIssue[];
  /** Dimensões que a camada da tabela recomenda cobrir. */
  dimensoesSugeridas: Dimension[];
  salvo: boolean;
  /** Idioma resolvido para a UI. */
  idioma: Idioma;
  caminhoArquivo?: string;
}

/** Mensagens da extensão para o webview. */
export type HostMessage =
  | { type: "state"; state: EditorState }
  | { type: "issues"; issues: ValidationIssue[] }
  | { type: "saved"; caminhoArquivo: string }
  | { type: "busy"; busy: boolean; mensagem?: string }
  | { type: "dryRunResult"; resultado: DryRunSummary }
  | { type: "error"; mensagem: string };

/** Mensagens do webview para a extensão. */
export type ViewMessage =
  | { type: "ready" }
  | { type: "updateContract"; contract: DqContract }
  | { type: "save" }
  | { type: "dryRun"; percentual: number }
  | { type: "addCheck"; check: DqxCheck }
  | { type: "removeCheck"; index: number }
  | { type: "openYaml" };

export interface DryRunCheckResult {
  name: string;
  function: string;
  column?: string;
  criticality: "error" | "warn";
  violacoes: number;
  percentual: number;
}

export interface DryRunSummary {
  ok: boolean;
  table: string;
  linhasAmostradas: number;
  /** Total de linhas na tabela — revela o quanto a amostra cobre. */
  linhasNaTabela: number;
  /** Percentual que o usuário pediu para avaliar. */
  percentualSolicitado: number;
  linhasValidas: number;
  linhasComErro: number;
  linhasComAviso: number;
  checks: DryRunCheckResult[];
  exemplos: Array<Record<string, unknown>>;
  erro?: string;
}

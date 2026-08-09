import * as vscode from "vscode";
import type { CatalogClient } from "../remote/catalog_client";
import type { JobRunner } from "../remote/job_runner";
import { explainCheck, type ProfileResult } from "../domain/profiling";
import { newContract } from "../contracts/contract_schema";
import { ContractEditorPanel, type EditorDeps } from "../webview/panel";
import type { CheckOrigin } from "../webview/protocol";

export interface ProfileOptions {
  limit: number;
  sampleFraction?: number;
  removeOutliers: boolean;
  numSigmas: number;
  maxNullRatio: number;
  detectPrimaryKeys: boolean;
  criticality: "error" | "warn";
}

const DEFAULT_OPTIONS: ProfileOptions = {
  limit: 100_000,
  removeOutliers: true,
  numSigmas: 3,
  maxNullRatio: 0.01,
  detectPrimaryKeys: false,
  criticality: "error",
};

/**
 * Perfila uma tabela no Databricks e devolve um contrato pronto para revisão.
 * O trabalho pesado roda no serverless com as classes reais do DQX.
 */
export async function profileTable(
  fullName: string,
  deps: {
    runner: JobRunner;
    catalog: CatalogClient;
    output: vscode.OutputChannel;
    editor: EditorDeps;
  },
  overrides: Partial<ProfileOptions> = {},
): Promise<void> {
  const options = { ...DEFAULT_OPTIONS, ...overrides };
  const outputPath = deps.runner.buildOutputPath(`profile_${fullName.replace(/\./g, "_")}`);

  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Perfilando ${fullName}`,
      cancellable: true,
    },
    async (progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());

      return await deps.runner.run<ProfileResult>({
        task: "profile_task",
        outputPath,
        signal: controller.signal,
        onProgress: (message) => progress.report({ message }),
        parameters: [
          "--table",
          fullName,
          "--criticality",
          options.criticality,
          "--detect-primary-keys",
          String(options.detectPrimaryKeys),
          "--options",
          JSON.stringify(buildProfilerOptions(options)),
        ],
      });
    },
  );

  const payload = result.payload;
  if (!payload.ok) {
    deps.output.appendLine(payload.traceback ?? payload.error ?? "erro desconhecido");
    deps.output.show(true);
    throw new Error(payload.error ?? "O profiling falhou.");
  }

  const checks = payload.checks ?? [];
  const profiles = payload.profiles ?? [];

  deps.output.appendLine(
    `\n=== ${fullName} — ${checks.length} checks em ${(result.durationMs / 1000).toFixed(1)}s (DQX ${payload.dqx_version}) ===`,
  );

  // Cada sugestão carrega a estatística que a originou: é o que permite ao
  // usuário julgar a regra em vez de aceitar no escuro.
  const origins: Record<number, CheckOrigin> = {};
  checks.forEach((check, index) => {
    const explicacao = explainCheck(check, profiles, payload.summary_stats);
    origins[index] = { sugerido: true, explicacao };
    deps.output.appendLine(
      `  ${check.check.function.padEnd(28)} ${String(check.check.arguments.column ?? "").padEnd(20)} ${explicacao ?? ""}`,
    );
  });

  let columns;
  try {
    columns = await deps.catalog.getColumns(fullName);
  } catch {
    // Sem as colunas o contrato nasce sem fingerprint — perde a detecção de
    // drift, mas não impede a revisão.
    columns = undefined;
  }

  const contract = newContract({
    table: fullName,
    checks,
    origem: "profiling",
    dqxVersion: payload.dqx_version,
    columns,
  });

  await ContractEditorPanel.show(deps.editor, contract, origins);
}

function buildProfilerOptions(options: ProfileOptions): Record<string, unknown> {
  const profilerOptions: Record<string, unknown> = {
    limit: options.limit,
    remove_outliers: options.removeOutliers,
    num_sigmas: options.numSigmas,
    max_null_ratio: options.maxNullRatio,
  };
  if (options.sampleFraction !== undefined) {
    profilerOptions.sample_fraction = options.sampleFraction;
  }
  return profilerOptions;
}

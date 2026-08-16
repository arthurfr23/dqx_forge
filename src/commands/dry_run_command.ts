import * as vscode from "vscode";
import { t } from "../i18n/current";
import type { JobRunner } from "../remote/job_runner";
import type { DqContract } from "../contracts/contract_schema";
import type { ContractEditorPanel } from "../webview/panel";
import type { DryRunSummary } from "../webview/protocol";

interface DryRunPayload {
  ok: boolean;
  table: string;
  linhasAmostradas?: number;
  linhasNaTabela?: number;
  percentualSolicitado?: number;
  linhasValidas?: number;
  linhasComErro?: number;
  linhasComAviso?: number;
  checks?: Array<{
    name: string;
    function: string;
    column?: string | null;
    criticality: "error" | "warn";
    violacoes: number;
    percentual: number;
  }>;
  exemplos?: Array<Record<string, unknown>>;
  error?: string;
  validacao?: string;
}

/**
 * Aplica o contrato numa amostra da tabela e devolve as violações por check.
 * Nada é gravado — o objetivo é só dar evidência antes do commit.
 */
export async function runDryRun(
  contract: DqContract,
  panel: ContractEditorPanel,
  runner: JobRunner,
  percentual = 100,
  output?: vscode.OutputChannel,
): Promise<void> {
  if (contract.checks.length === 0) {
    panel.post({ type: "error", mensagem: t().msg_dryRunSemChecks });
    return;
  }

  panel.setBusy(true, t().msg_dryRunPreparando);
  output?.appendLine(t().log_dryRun(contract.meta.table, contract.checks.length, percentual));

  const slug = contract.meta.table.replace(/\./g, "_");
  const checksPath = runner.buildOutputPath(`dryrun_checks_${slug}`);
  const outputPath = runner.buildOutputPath(`dryrun_${slug}`);

  // Os checks vão pelo Volume, não por argumento de linha de comando: um
  // contrato grande estoura o limite de tamanho dos parâmetros do job.
  await runner.writeVolumeJson(checksPath, contract.checks);

  // O job leva minutos. Sem a notificação do VS Code, o rodapé do painel é o
  // único sinal de vida e o usuário conclui que o botão não funcionou.
  const escopo =
    percentual >= 100 ? t().dry_tabelaInteira : t().dry_escopoAmostra(percentual);

  const result = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: t().dry_titulo_progresso(contract.meta.table, escopo),
      cancellable: true,
    },
    async (progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());

      return await runner.run<DryRunPayload>({
        task: "dry_run_task",
        outputPath,
        cleanup: [checksPath],
        runName: `dqx_forge_dryrun_${slug}`,
        signal: controller.signal,
        onProgress: (mensagem) => {
          progress.report({ message: mensagem });
          panel.setBusy(true, mensagem);
        },
        parameters: [
          "--table",
          contract.meta.table,
          "--checks-path",
          checksPath,
          "--sample-percent",
          String(percentual),
        ],
      });
    },
  );

  const payload = result.payload;
  const resumo: DryRunSummary = {
    ok: payload.ok,
    table: contract.meta.table,
    linhasAmostradas: payload.linhasAmostradas ?? 0,
    linhasNaTabela: payload.linhasNaTabela ?? 0,
    percentualSolicitado: payload.percentualSolicitado ?? percentual,
    linhasValidas: payload.linhasValidas ?? 0,
    linhasComErro: payload.linhasComErro ?? 0,
    linhasComAviso: payload.linhasComAviso ?? 0,
    checks: (payload.checks ?? []).map((c) => ({
      name: c.name ?? c.function,
      function: c.function,
      column: c.column ?? undefined,
      criticality: c.criticality,
      violacoes: c.violacoes,
      percentual: c.percentual,
    })),
    exemplos: payload.exemplos ?? [],
    erro: payload.validacao ?? payload.error,
  };

  output?.appendLine(
    payload.ok
      ? t().log_dryRunResumo(
          String(resumo.linhasComErro),
          String(resumo.linhasAmostradas),
          (result.durationMs / 1000).toFixed(0),
        )
      : t().log_dryRunFalhou(resumo.erro ?? t().msg_erroDesconhecido),
  );

  panel.setBusy(false);
  panel.post({ type: "dryRunResult", resultado: resumo });
}

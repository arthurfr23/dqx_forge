import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { DatabricksAuth } from "../auth/databricks_auth";
import { t } from "../i18n/current";

const RESULT_MARKER = "DQX_FORGE_RESULT::";
const POLL_INTERVAL_MS = 5_000;

/** Tasks Python que a extensão executa no serverless, na ordem em que são enviadas. */
export type TaskName =
  | "profile_task"
  | "introspect_task"
  | "ai_generate_task"
  | "contract_import_task"
  | "dry_run_task"
  | "apply_task";

export interface RunOptions {
  task: TaskName;
  parameters: string[];
  /** Caminho no UC Volume onde o task grava o payload completo. */
  outputPath: string;
  /** Arquivos de entrada gravados no Volume, removidos junto com o resultado. */
  cleanup?: string[];
  runName?: string;
  onProgress?: (message: string) => void;
  signal?: AbortSignal;
}

export interface RunResult<T> {
  runId: number;
  payload: T;
  durationMs: number;
}

export class JobRunError extends Error {
  constructor(message: string, readonly runId?: number, readonly runPageUrl?: string) {
    super(message);
    this.name = "JobRunError";
  }
}

interface RunState {
  status?: { state?: string; termination_details?: { code?: string; message?: string } };
  state?: { life_cycle_state?: string; result_state?: string; state_message?: string };
  run_page_url?: string;
  tasks?: Array<{ run_id?: number; task_key?: string }>;
}

/**
 * Executa os tasks do DQX em jobs serverless efêmeros.
 *
 * Os scripts são enviados uma vez por conteúdo (o hash entra no nome do
 * diretório), então reexecuções não pagam o custo do upload.
 */
export class JobRunner {
  private uploaded = new Map<TaskName, string>();

  constructor(
    private auth: DatabricksAuth,
    private tasksDir: string,
    private config: { dqxVersion: string; volumePath: string; environmentVersion?: string },
  ) {}

  async run<T>(options: RunOptions): Promise<RunResult<T>> {
    try {
      return await this.executar<T>(options);
    } finally {
      // O Volume é só o canal de retorno do job para a IDE: uma vez lido, o
      // arquivo não serve mais e ficaria acumulando — os de dry-run carregam
      // linhas reais da tabela, então não podem sobreviver à sessão.
      await this.limparArtefatos([options.outputPath, ...(options.cleanup ?? [])]);
    }
  }

  private async executar<T>(options: RunOptions): Promise<RunResult<T>> {
    const startedAt = Date.now();
    const report = options.onProgress ?? (() => undefined);

    report(t().job_enviandoScript);
    const remotePath = await this.ensureTaskUploaded(options.task);

    report(t().job_iniciando);
    const submitted = await this.auth.request<{ run_id: number }>("/api/2.2/jobs/runs/submit", {
      method: "POST",
      body: {
        run_name: options.runName ?? `dqx_forge_${options.task}`,
        environments: [
          {
            environment_key: "dqx_env",
            spec: {
              client: this.config.environmentVersion ?? "3",
              dependencies: [this.dependenciaDqx(options.task)],
            },
          },
        ],
        tasks: [
          {
            task_key: options.task,
            environment_key: "dqx_env",
            spark_python_task: {
              python_file: remotePath,
              source: "WORKSPACE",
              parameters: [...options.parameters, "--output-path", options.outputPath],
            },
          },
        ],
      },
    });

    const runId = submitted.run_id;
    const state = await this.waitForRun(runId, report, options.signal);

    const resultState = state.status?.state ?? state.state?.result_state;
    const terminationCode = state.status?.termination_details?.code;
    const succeeded = terminationCode === "SUCCESS" || resultState === "SUCCESS";

    if (!succeeded) {
      // A mensagem do job é sempre a mesma ("see run output for details"). A
      // causa real está na saída do task — buscá-la aqui evita mandar o usuário
      // para a UI do Databricks só para descobrir o que falhou.
      const detail =
        (await this.erroDoTask(state.tasks?.[0]?.run_id)) ??
        state.status?.termination_details?.message ??
        state.state?.state_message ??
        `estado ${resultState ?? "desconhecido"}`;
      throw new JobRunError(t().job_falhou(detail), runId, state.run_page_url);
    }

    report(t().job_lendoResultado);
    const payload = await this.readVolumeJson<T>(options.outputPath);
    return { runId, payload, durationMs: Date.now() - startedAt };
  }

  /**
   * A conversão de ODCS depende do datacontract-cli, que só vem no extra
   * [datacontract] do DQX. Instalar em todo task encareceria o cold start dos
   * outros sem necessidade, então o extra é resolvido por task.
   */
  private dependenciaDqx(task: TaskName): string {
    const extra = task === "contract_import_task" ? "[datacontract]" : "";
    return `databricks-labs-dqx${extra}==${this.config.dqxVersion}`;
  }

  /** Primeira linha do erro do task, que é onde a causa real aparece. */
  private async erroDoTask(taskRunId?: number): Promise<string | undefined> {
    if (taskRunId === undefined) {
      return undefined;
    }
    try {
      const saida = await this.auth.request<{ error?: string }>("/api/2.2/jobs/runs/get-output", {
        query: { run_id: taskRunId },
      });
      const linha = saida.error?.trim().split("\n")[0];
      return linha ? linha.slice(0, 400) : undefined;
    } catch {
      return undefined;
    }
  }

  /** Lê o marcador que o task imprime no stdout — resumo barato, sem tocar o Volume. */
  async readMarker(taskRunId: number): Promise<Record<string, unknown> | undefined> {
    const output = await this.auth.request<{ logs?: string }>("/api/2.2/jobs/runs/get-output", {
      query: { run_id: taskRunId },
    });
    const line = output.logs?.split("\n").find((l) => l.includes(RESULT_MARKER));
    if (!line) {
      return undefined;
    }
    try {
      return JSON.parse(line.slice(line.indexOf(RESULT_MARKER) + RESULT_MARKER.length).trim());
    } catch {
      return undefined;
    }
  }

  async readVolumeJson<T>(volumePath: string): Promise<T> {
    const body = await this.auth.requestText(`/api/2.0/fs/files${volumePath}`);
    return JSON.parse(body) as T;
  }

  /**
   * Remove os arquivos da execução. Falhar aqui não pode derrubar um job que
   * já deu certo: o artefato vira lixo no Volume, não erro na tela.
   */
  private async limparArtefatos(caminhos: string[]): Promise<void> {
    await Promise.all(
      caminhos.map((caminho) =>
        this.auth
          .request(`/api/2.0/fs/files${caminho}`, { method: "DELETE" })
          .catch(() => undefined),
      ),
    );
  }

  /** Grava um payload de entrada no Volume para o task consumir. */
  async writeVolumeJson(volumePath: string, value: unknown): Promise<void> {
    await this.auth.uploadFile(volumePath, JSON.stringify(value));
  }

  /** Grava texto cru — usado para subir contratos ODCS em YAML. */
  async writeVolumeText(volumePath: string, conteudo: string): Promise<void> {
    await this.auth.uploadFile(volumePath, conteudo);
  }

  buildOutputPath(prefix: string): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${this.config.volumePath}/runs/${prefix}_${stamp}_${suffix}.json`;
  }

  private async waitForRun(
    runId: number,
    report: (message: string) => void,
    signal?: AbortSignal,
  ): Promise<RunState> {
    let lastState = "";
    for (;;) {
      if (signal?.aborted) {
        await this.cancel(runId).catch(() => undefined);
        throw new JobRunError(t().job_cancelado, runId);
      }

      const state = await this.auth.request<RunState>("/api/2.2/jobs/runs/get", {
        query: { run_id: runId },
      });

      const lifecycle = state.status?.state ?? state.state?.life_cycle_state ?? "";
      if (lifecycle !== lastState) {
        lastState = lifecycle;
        report(describeState(lifecycle));
      }

      if (lifecycle === "TERMINATED" || lifecycle === "INTERNAL_ERROR" || lifecycle === "SKIPPED") {
        return state;
      }

      await delay(POLL_INTERVAL_MS, signal);
    }
  }

  private async cancel(runId: number): Promise<void> {
    await this.auth.request("/api/2.2/jobs/runs/cancel", { method: "POST", body: { run_id: runId } });
  }

  private async ensureTaskUploaded(task: TaskName): Promise<string> {
    const cached = this.uploaded.get(task);
    if (cached) {
      return cached;
    }

    const source = await readFile(join(this.tasksDir, `${task}.py`), "utf8");
    const digest = createHash("sha256").update(source).digest("hex").slice(0, 12);

    const me = await this.auth.request<{ userName: string }>("/api/2.0/preview/scim/v2/Me");
    const dir = `/Users/${me.userName}/.dqx_forge/tasks/${digest}`;
    const remotePath = `${dir}/${task}.py`;

    await this.auth.request("/api/2.0/workspace/mkdirs", { method: "POST", body: { path: dir } });
    await this.auth.request("/api/2.0/workspace/import", {
      method: "POST",
      body: {
        path: remotePath,
        format: "AUTO",
        overwrite: true,
        content: Buffer.from(source, "utf8").toString("base64"),
      },
    });

    const workspacePath = `/Workspace${remotePath}`;
    this.uploaded.set(task, workspacePath);
    return workspacePath;
  }
}

function describeState(state: string): string {
  switch (state) {
    case "PENDING":
    case "QUEUED":
      return t().job_aguardandoCompute;
    case "RUNNING":
      return t().job_executandoNoDatabricks;
    case "TERMINATING":
      return t().job_finalizando;
    default:
      return state ? t().job_estado(state) : t().job_executando;
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

import { t } from "../i18n/current";
import * as vscode from "vscode";
import type { JobRunner } from "../remote/job_runner";
import type { CheckCatalogEntry, CheckCatalogResult } from "./profiling";

const CACHE_KEY = "dqxForge.checkCatalog";

interface CachedCatalog {
  dqxVersion: string;
  checks: CheckCatalogEntry[];
}

/**
 * Catálogo das check functions disponíveis, obtido por introspecção da versão
 * do DQX instalada no workspace. Fica em cache por versão, então uma atualização
 * do DQX traz os checks novos sem release da extensão.
 */
export class CheckCatalog {
  private memory?: CachedCatalog;

  constructor(
    private state: vscode.Memento,
    private runner: JobRunner,
  ) {}

  /** Devolve o catálogo em cache, ou undefined se ainda não foi carregado. */
  peek(): CheckCatalogEntry[] | undefined {
    if (this.memory) {
      return this.memory.checks;
    }
    const cached = this.state.get<CachedCatalog>(CACHE_KEY);
    if (cached && cached.dqxVersion === this.currentVersion()) {
      this.memory = cached;
      return cached.checks;
    }
    return undefined;
  }

  async get(options: { force?: boolean } = {}): Promise<CheckCatalogEntry[]> {
    if (!options.force) {
      const cached = this.peek();
      if (cached) {
        return cached;
      }
    }
    return await this.refresh();
  }

  async refresh(): Promise<CheckCatalogEntry[]> {
    const outputPath = this.runner.buildOutputPath("check_catalog");

    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: t().cat_lendo },
      async (progress) =>
        await this.runner.run<CheckCatalogResult>({
          task: "introspect_task",
          outputPath,
          parameters: [],
          onProgress: (message) => progress.report({ message }),
        }),
    );

    if (!result.payload.ok || !result.payload.checks) {
      throw new Error(result.payload.error ?? t().cat_naoLeu);
    }

    // A versão é fixada na configuração e instalada com "==" nos jobs. Se o que
    // rodou no workspace for outra coisa, os tasks podem bater numa API que
    // mudou — melhor avisar aqui do que descobrir num job quebrado.
    const instalada = result.payload.dqx_version;
    const configurada = this.currentVersion();
    if (instalada && configurada && instalada !== configurada) {
      void vscode.window
        .showWarningMessage(
          t().cat_versaoDivergente(instalada, configurada),
          `Fixar ${instalada}`,
        )
        .then((acao) => {
          if (acao) {
            void vscode.workspace
              .getConfiguration("dqxForge")
              .update("dqxVersion", instalada, vscode.ConfigurationTarget.Workspace);
          }
        });
    }

    const catalog: CachedCatalog = {
      dqxVersion: instalada ?? configurada,
      checks: result.payload.checks,
    };
    this.memory = catalog;
    await this.state.update(CACHE_KEY, catalog);
    return catalog.checks;
  }

  find(name: string): CheckCatalogEntry | undefined {
    return this.peek()?.find((c) => c.name === name);
  }

  private currentVersion(): string {
    return vscode.workspace.getConfiguration("dqxForge").get<string>("dqxVersion", "");
  }
}

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as vscode from "vscode";
import { t } from "../i18n/current";

const execFileAsync = promisify(execFile);

export interface BundleResult {
  ok: boolean;
  stdout: string;
  stderr: string;
}

/**
 * Executa o CLI do Databricks para validar, deployar e rodar o bundle, para
 * que o ciclo inteiro caiba na UI — ninguém precisa abrir um terminal.
 */
export class BundleClient {
  constructor(
    private bundleRoot: () => vscode.Uri | undefined,
    private profile: () => string,
    private output: vscode.OutputChannel,
  ) {}

  async validate(target: string): Promise<BundleResult> {
    return await this.run(["bundle", "validate", "-t", target], t().bundle_validando);
  }

  async deploy(target: string): Promise<BundleResult> {
    return await this.run(["bundle", "deploy", "-t", target], t().bundle_publicando(target));
  }

  async runJob(jobKey: string, target: string): Promise<BundleResult> {
    return await this.run(
      ["bundle", "run", jobKey, "-t", target, "--no-wait"],
      t().bundle_disparando(jobKey),
    );
  }

  async summary(target: string): Promise<BundleResult> {
    return await this.run(["bundle", "summary", "-t", target], t().bundle_lendoEstado);
  }

  /** Alvos declarados no databricks.yml, para o usuário escolher em vez de digitar. */
  async listTargets(): Promise<string[]> {
    const root = this.bundleRoot();
    if (!root) {
      return [];
    }
    try {
      const bytes = await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(root, "databricks.yml"),
      );
      const texto = Buffer.from(bytes).toString("utf8");
      const bloco = texto.split(/^targets:\s*$/m)[1];
      if (!bloco) {
        return [];
      }
      const nomes: string[] = [];
      for (const linha of bloco.split("\n")) {
        // Alvos são as chaves com exatamente dois espaços de indentação.
        const match = /^ {2}([A-Za-z_][\w-]*):\s*$/.exec(linha);
        if (match) {
          nomes.push(match[1]);
        } else if (/^\S/.test(linha) && linha.trim()) {
          break;
        }
      }
      return nomes;
    } catch {
      return [];
    }
  }

  private async run(args: string[], titulo: string): Promise<BundleResult> {
    const root = this.bundleRoot();
    if (!root) {
      throw new Error(t().bundle_semArquivo);
    }

    const profile = this.profile();
    const argumentos = profile ? [...args, "--profile", profile] : args;

    this.output.appendLine(`\n$ databricks ${argumentos.join(" ")}`);

    return await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: titulo },
      async () => {
        try {
          const { stdout, stderr } = await execFileAsync("databricks", argumentos, {
            cwd: root.fsPath,
            timeout: 600_000,
            maxBuffer: 10 * 1024 * 1024,
          });
          this.output.appendLine(stdout || stderr);
          return { ok: true, stdout, stderr };
        } catch (err) {
          const detalhe = err as { stdout?: string; stderr?: string; message?: string };
          const saida = detalhe.stderr || detalhe.stdout || detalhe.message || String(err);
          this.output.appendLine(saida);
          return { ok: false, stdout: detalhe.stdout ?? "", stderr: saida };
        }
      },
    );
  }
}

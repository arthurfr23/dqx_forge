import * as vscode from "vscode";
import {
  contractFileName,
  parseContract,
  serializeContract,
  type DqContract,
} from "./contract_schema";

export interface StoredContract {
  contract: DqContract;
  uri: vscode.Uri;
}

/**
 * Os contratos são arquivos do repositório — essa é a premissa do modelo
 * GitOps. Tudo aqui trabalha sobre o workspace aberto no VS Code.
 */
export class ContractStore {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.changeEmitter.event;

  private watcher?: vscode.FileSystemWatcher;

  constructor() {
    this.setupWatcher();
  }

  dispose(): void {
    this.watcher?.dispose();
    this.changeEmitter.dispose();
  }

  /** Diretório configurado, resolvido contra a primeira pasta do workspace. */
  contractsDir(): vscode.Uri | undefined {
    const root = vscode.workspace.workspaceFolders?.[0];
    if (!root) {
      return undefined;
    }
    const relative = vscode.workspace
      .getConfiguration("dqxForge")
      .get<string>("contractsDir", "sat_bh/dq/contracts");
    return vscode.Uri.joinPath(root.uri, ...relative.split("/").filter(Boolean));
  }

  async list(): Promise<StoredContract[]> {
    const dir = this.contractsDir();
    if (!dir) {
      return [];
    }

    let entries: [string, vscode.FileType][];
    try {
      entries = await vscode.workspace.fs.readDirectory(dir);
    } catch {
      return [];
    }

    const contracts: StoredContract[] = [];
    for (const [name, type] of entries) {
      if (type !== vscode.FileType.File || !/\.ya?ml$/i.test(name)) {
        continue;
      }
      const uri = vscode.Uri.joinPath(dir, name);
      try {
        const bytes = await vscode.workspace.fs.readFile(uri);
        contracts.push({ contract: parseContract(Buffer.from(bytes).toString("utf8")), uri });
      } catch {
        // Um arquivo corrompido não pode derrubar a listagem inteira.
        continue;
      }
    }
    return contracts.sort((a, b) => a.contract.meta.table.localeCompare(b.contract.meta.table));
  }

  async find(table: string): Promise<StoredContract | undefined> {
    const dir = this.contractsDir();
    if (!dir) {
      return undefined;
    }
    const uri = vscode.Uri.joinPath(dir, contractFileName(table));
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return { contract: parseContract(Buffer.from(bytes).toString("utf8")), uri };
    } catch {
      return undefined;
    }
  }

  async save(contract: DqContract): Promise<vscode.Uri> {
    const dir = this.contractsDir();
    if (!dir) {
      throw new Error("Abra a pasta do projeto para salvar contratos versionados.");
    }
    await vscode.workspace.fs.createDirectory(dir);

    const uri = vscode.Uri.joinPath(dir, contractFileName(contract.meta.table));
    const text = serializeContract(contract);

    // Reescrever conteúdo idêntico sujaria o mtime e, com ele, o watcher.
    try {
      const existing = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
      if (existing === text) {
        return uri;
      }
    } catch {
      // arquivo novo
    }

    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, "utf8"));
    this.changeEmitter.fire();
    return uri;
  }

  async delete(table: string): Promise<void> {
    const dir = this.contractsDir();
    if (!dir) {
      return;
    }
    await vscode.workspace.fs.delete(vscode.Uri.joinPath(dir, contractFileName(table)));
    this.changeEmitter.fire();
  }

  private setupWatcher(): void {
    const root = vscode.workspace.workspaceFolders?.[0];
    if (!root) {
      return;
    }
    const relative = vscode.workspace
      .getConfiguration("dqxForge")
      .get<string>("contractsDir", "sat_bh/dq/contracts");

    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(root, `${relative}/*.{yml,yaml}`),
    );
    this.watcher.onDidCreate(() => this.changeEmitter.fire());
    this.watcher.onDidChange(() => this.changeEmitter.fire());
    this.watcher.onDidDelete(() => this.changeEmitter.fire());
  }
}

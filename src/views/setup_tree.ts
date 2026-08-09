import * as vscode from "vscode";
import { DEFAULT_CRON, DEFAULT_TZ } from "../deploy/bundle_generator";
import { descreverAgendamento } from "../deploy/schedule";
import { IDIOMAS } from "../i18n/messages";
import { t } from "../i18n/current";

interface SetupItem {
  chave: string;
  rotulo: () => string;
  valor: () => string;
  comando: string;
  icone: string;
  obrigatorio: boolean;
  ajuda: () => string;
}

/**
 * Estado da configuração em forma de lista clicável. Cada linha mostra o valor
 * atual e abre o seletor correspondente — nada aqui exige abrir settings.json.
 */
export class SetupTreeProvider implements vscode.TreeDataProvider<SetupItem> {
  private readonly changeEmitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changeEmitter.event;

  private readonly itens: SetupItem[] = [
    {
      chave: "profile",
      rotulo: () => t().setup_workspace,
      valor: () => this.config().get<string>("profile", "") || t().setup_naoConfigurado,
      comando: "dqxForge.selectProfile",
      icone: "plug",
      obrigatorio: true,
      ajuda: () => t().setup_ajudaWorkspace,
    },
    {
      chave: "volumePath",
      rotulo: () => t().setup_volume,
      valor: () => encurtar(this.config().get<string>("volumePath", "")),
      comando: "dqxForge.selectVolume",
      icone: "folder",
      obrigatorio: true,
      ajuda: () => t().setup_ajudaVolume,
    },
    {
      chave: "warehouseId",
      rotulo: () => t().setup_warehouse,
      valor: () => this.config().get<string>("warehouseId", "") || t().setup_naoConfigurado,
      comando: "dqxForge.selectWarehouse",
      icone: "server",
      obrigatorio: false,
      ajuda: () => t().setup_ajudaWarehouse,
    },
    {
      chave: "aiModel",
      rotulo: () => t().setup_modelo,
      valor: () => {
        const rota = this.config().get<string>("aiRoute", "");
        if (rota === "ide") {
          return `IDE · ${this.config().get<string>("aiIdeModel", "padrão")}`;
        }
        const endpoint = this.config().get<string>("aiEndpoint", "");
        return endpoint || t().setup_naoConfigurado;
      },
      comando: "dqxForge.selectModel",
      icone: "sparkle",
      obrigatorio: false,
      ajuda: () => t().setup_ajudaModelo,
    },
    {
      chave: "contractsDir",
      rotulo: () => t().setup_pasta,
      valor: () => this.config().get<string>("contractsDir", ""),
      comando: "dqxForge.selectContractsDir",
      icone: "repo",
      obrigatorio: true,
      ajuda: () => t().setup_ajudaPasta,
    },
    {
      chave: "schedule",
      rotulo: () => t().setup_agendamento,
      valor: () => {
        const cron = this.config().get<string>("schedule", DEFAULT_CRON);
        const descricao = descreverAgendamento(cron);
        return cron
          ? `${descricao} · ${this.config().get<string>("timezone", DEFAULT_TZ)}`
          : descricao;
      },
      comando: "dqxForge.selectSchedule",
      icone: "clock",
      obrigatorio: false,
      ajuda: () => t().setup_ajudaAgendamento,
    },
    {
      chave: "language",
      rotulo: () => t().setup_idioma,
      valor: () => {
        const escolhido = this.config().get<string>("language", "");
        if (!escolhido) {
          return t().setup_automatico(vscode.env.language);
        }
        return IDIOMAS.find((i) => i.codigo === escolhido)?.nome ?? escolhido;
      },
      comando: "dqxForge.selectLanguage",
      icone: "globe",
      obrigatorio: false,
      ajuda: () => t().setup_ajudaIdioma,
    },
    {
      chave: "dqxVersion",
      rotulo: () => t().setup_versao,
      valor: () => this.config().get<string>("dqxVersion", ""),
      comando: "dqxForge.selectDqxVersion",
      icone: "package",
      obrigatorio: true,
      ajuda: () => t().setup_ajudaVersao,
    },
  ];

  refresh(): void {
    this.changeEmitter.fire();
  }

  getTreeItem(item: SetupItem): vscode.TreeItem {
    const valor = item.valor();
    const pendente = !valor || valor === t().setup_naoConfigurado;

    const treeItem = new vscode.TreeItem(item.rotulo(), vscode.TreeItemCollapsibleState.None);
    treeItem.description = valor;
    treeItem.tooltip = item.ajuda();
    treeItem.command = { command: item.comando, title: item.rotulo() };
    treeItem.iconPath = new vscode.ThemeIcon(
      pendente && item.obrigatorio ? "warning" : item.icone,
      pendente && item.obrigatorio
        ? new vscode.ThemeColor("problemsWarningIcon.foreground")
        : undefined,
    );
    return treeItem;
  }

  getChildren(): SetupItem[] {
    return this.itens;
  }

  private config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration("dqxForge");
  }
}

function encurtar(caminho: string): string {
  if (!caminho) {
    return t().setup_naoConfigurado;
  }
  const partes = caminho.split("/").filter(Boolean);
  return partes.length > 2 ? partes.slice(-2).join("/") : caminho;
}

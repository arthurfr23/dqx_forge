import * as vscode from "vscode";
import type { DatabricksAuth } from "../auth/databricks_auth";
import type { ServingClient } from "../remote/serving_client";
import type { CatalogClient } from "../remote/catalog_client";
import { DEFAULT_CRON, DEFAULT_TZ } from "../deploy/bundle_generator";
import {
  PRESETS_AGENDAMENTO,
  descreverAgendamento,
  validarQuartz,
} from "../deploy/schedule";
import { t } from "../i18n/current";

/**
 * Toda a configuração da extensão é feita por estes seletores: o usuário
 * escolhe de listas reais do workspace, sem editar settings.json à mão.
 */

export interface EscolhaModelo {
  rota: "databricks" | "ide";
  endpoint?: string;
  modeloIde?: string;
  rotulo: string;
}

export async function selecionarModelo(
  serving: ServingClient,
): Promise<EscolhaModelo | undefined> {
  const itens: Array<vscode.QuickPickItem & { escolha?: EscolhaModelo }> = [];

  const [modelosWorkspace, modelosIde] = await Promise.all([
    serving.listChatModels().catch(() => []),
    vscode.lm.selectChatModels().then(
      (m) => m,
      () => [],
    ),
  ]);

  if (modelosWorkspace.length) {
    itens.push({
      label: t().pick_modeloNoWorkspace,
      kind: vscode.QuickPickItemKind.Separator,
    });
    for (const modelo of modelosWorkspace) {
      itens.push({
        label: modelo.displayName,
        description: modelo.name,
        detail: modelo.ready ? t().pick_modeloDetalheDb : t().pick_modeloNaoPronto,
        escolha: {
          rota: "databricks",
          endpoint: modelo.name,
          rotulo: modelo.displayName,
        },
      });
    }
  }

  if (modelosIde.length) {
    itens.push({ label: t().pick_modeloNaIde, kind: vscode.QuickPickItemKind.Separator });
    for (const modelo of modelosIde) {
      itens.push({
        label: modelo.name,
        description: `${modelo.vendor} · ${modelo.family}`,
        detail: t().pick_modeloDetalheIde,
        escolha: { rota: "ide", modeloIde: modelo.id, rotulo: modelo.name },
      });
    }
  }

  if (!itens.length) {
    vscode.window.showErrorMessage(
      t().msg_semModelos,
    );
    return undefined;
  }

  const escolhido = await vscode.window.showQuickPick(itens, {
    title: t().pick_modeloTitulo,
    placeHolder: t().pick_modeloPlaceholder,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (!escolhido?.escolha) {
    return undefined;
  }

  const config = vscode.workspace.getConfiguration("dqxForge");
  await config.update("aiRoute", escolhido.escolha.rota, vscode.ConfigurationTarget.Workspace);
  if (escolhido.escolha.endpoint) {
    await config.update("aiEndpoint", escolhido.escolha.endpoint, vscode.ConfigurationTarget.Workspace);
  }
  if (escolhido.escolha.modeloIde) {
    await config.update("aiIdeModel", escolhido.escolha.modeloIde, vscode.ConfigurationTarget.Workspace);
  }

  return escolhido.escolha;
}

export async function selecionarWarehouse(auth: DatabricksAuth): Promise<string | undefined> {
  const response = await auth.request<{
    warehouses?: Array<{ id: string; name: string; state?: string; cluster_size?: string }>;
  }>("/api/2.0/sql/warehouses");

  const warehouses = response.warehouses ?? [];
  if (!warehouses.length) {
    const acao = await vscode.window.showWarningMessage(
      t().msg_semWarehouse,
      t().msg_criarAgora,
    );
    if (acao) {
      return await criarWarehouse(auth);
    }
    return undefined;
  }

  const escolhido = await vscode.window.showQuickPick(
    [
      ...warehouses.map((w) => ({
        label: w.name,
        description: w.cluster_size,
        detail: `${w.state ?? ""} · ${w.id}`,
        id: w.id,
      })),
      {
        label: `$(add) ${t().pick_warehouseCriar}`,
        description: t().pick_warehouseCriarDetalhe,
        detail: "",
        id: "__novo__",
      },
    ],
    { title: t().pick_warehouseTitulo, placeHolder: t().pick_warehousePlaceholder },
  );

  if (!escolhido) {
    return undefined;
  }

  const id = escolhido.id === "__novo__" ? await criarWarehouse(auth) : escolhido.id;
  if (id) {
    await vscode.workspace
      .getConfiguration("dqxForge")
      .update("warehouseId", id, vscode.ConfigurationTarget.Workspace);
  }
  return id;
}

async function criarWarehouse(auth: DatabricksAuth): Promise<string | undefined> {
  const nome = await vscode.window.showInputBox({
    title: "Nome do warehouse",
    value: "wh_dqx_forge",
    validateInput: (v) => (v.trim() ? undefined : "Informe um nome"),
  });
  if (!nome) {
    return undefined;
  }

  return await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Criando o warehouse…" },
    async () => {
      const criado = await auth.request<{ id: string }>("/api/2.0/sql/warehouses", {
        method: "POST",
        body: {
          name: nome,
          cluster_size: "2X-Small",
          max_num_clusters: 1,
          auto_stop_mins: 10,
          enable_serverless_compute: true,
          warehouse_type: "PRO",
        },
      });
      vscode.window.showInformationMessage(`Warehouse "${nome}" criado.`);
      return criado.id;
    },
  );
}

/**
 * Periodicidade dos jobs gerados. A lista cobre os casos comuns e a última
 * opção abre a expressão Quartz crua, para quem precisa de algo que nenhum
 * preset expressa. O fuso só é perguntado quando existe schedule.
 */
export async function selecionarAgendamento(): Promise<string | undefined> {
  const config = vscode.workspace.getConfiguration("dqxForge");
  const atual = config.get<string>("schedule", DEFAULT_CRON);

  const escolhido = await vscode.window.showQuickPick(
    [
      ...PRESETS_AGENDAMENTO.map((preset) => ({
        label: preset.rotulo(),
        description: preset.cron || t().agenda_manualDetalhe,
        detail: preset.cron === atual ? t().agenda_emUso : "",
        cron: preset.cron as string | undefined,
      })),
      {
        label: `$(edit) ${t().agenda_personalizado}`,
        description: t().agenda_personalizadoDetalhe,
        detail: PRESETS_AGENDAMENTO.some((p) => p.cron === atual) ? "" : t().agenda_emUso,
        cron: undefined,
      },
    ],
    { title: t().agenda_titulo, placeHolder: t().agenda_placeholder },
  );
  if (!escolhido) {
    return undefined;
  }

  let cron = escolhido.cron;
  if (cron === undefined) {
    const digitado = await vscode.window.showInputBox({
      title: t().agenda_cronTitulo,
      prompt: t().agenda_cronPrompt,
      value: PRESETS_AGENDAMENTO.some((p) => p.cron === atual) ? "0 0/30 * * * ?" : atual,
      validateInput: (valor) => validarQuartz(valor),
    });
    if (digitado === undefined) {
      return undefined;
    }
    cron = digitado.trim().split(/\s+/).join(" ");
  }

  let fuso = config.get<string>("timezone", DEFAULT_TZ);
  if (cron) {
    const escolhaFuso = await vscode.window.showQuickPick(fusosDisponiveis(fuso), {
      title: t().agenda_fusoTitulo,
      placeHolder: t().agenda_fusoPlaceholder,
    });
    if (!escolhaFuso) {
      return undefined;
    }
    fuso = escolhaFuso;
  }

  await config.update("schedule", cron, vscode.ConfigurationTarget.Workspace);
  await config.update("timezone", fuso, vscode.ConfigurationTarget.Workspace);

  return cron ? `${descreverAgendamento(cron)} · ${fuso}` : descreverAgendamento(cron);
}

/** Fusos IANA do runtime, com o atual no topo para que Enter mantenha o valor. */
function fusosDisponiveis(atual: string): string[] {
  const suportados = (Intl as { supportedValuesOf?: (chave: string) => string[] })
    .supportedValuesOf;
  const lista = suportados?.("timeZone") ?? [DEFAULT_TZ, "UTC"];
  return [atual, ...lista.filter((fuso) => fuso !== atual)];
}

export async function selecionarVolume(
  auth: DatabricksAuth,
  catalog: CatalogClient,
): Promise<string | undefined> {
  const catalogos = await catalog.listCatalogs();
  const catalogoEscolhido = await vscode.window.showQuickPick(
    catalogos.filter((c) => c.name !== "system" && c.name !== "samples").map((c) => c.name),
    { title: `${t().pick_volumeTitulo} (1/2)`, placeHolder: t().pick_volumeCatalogo },
  );
  if (!catalogoEscolhido) {
    return undefined;
  }

  const schemas = await catalog.listSchemas(catalogoEscolhido);
  const schemaEscolhido = await vscode.window.showQuickPick(
    schemas.filter((s) => s.name !== "information_schema").map((s) => s.name),
    { title: `${t().pick_volumeTitulo} (2/2)`, placeHolder: t().pick_volumeSchema },
  );
  if (!schemaEscolhido) {
    return undefined;
  }

  const response = await auth.request<{ volumes?: Array<{ name: string; full_name: string }> }>(
    "/api/2.1/unity-catalog/volumes",
    { query: { catalog_name: catalogoEscolhido, schema_name: schemaEscolhido } },
  );
  const volumes = response.volumes ?? [];

  const escolhido = await vscode.window.showQuickPick(
    [
      ...volumes.map((v) => ({ label: v.name, description: v.full_name, criar: false })),
      {
        label: "$(add) Criar vol_dqx_artifacts",
        description: `${catalogoEscolhido}.${schemaEscolhido}`,
        criar: true,
      },
    ],
    { title: t().pick_volumeTitulo, placeHolder: t().pick_volumePlaceholder },
  );
  if (!escolhido) {
    return undefined;
  }

  let nomeVolume = escolhido.label;
  if (escolhido.criar) {
    nomeVolume = "vol_dqx_artifacts";
    await auth.request("/api/2.1/unity-catalog/volumes", {
      method: "POST",
      body: {
        catalog_name: catalogoEscolhido,
        schema_name: schemaEscolhido,
        name: nomeVolume,
        volume_type: "MANAGED",
      },
    });
  }

  const caminho = `/Volumes/${catalogoEscolhido}/${schemaEscolhido}/${nomeVolume}`;
  await vscode.workspace
    .getConfiguration("dqxForge")
    .update("volumePath", caminho, vscode.ConfigurationTarget.Workspace);
  return caminho;
}

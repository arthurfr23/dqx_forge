import * as vscode from "vscode";
import { DatabricksAuth } from "../auth/databricks_auth";
import { DEFAULT_CONTRACTS_DIR, type ContractStore } from "../contracts/contract_store";
import type { BundleClient } from "../deploy/bundle_client";
import { t } from "../i18n/current";
import {
  DEFAULT_CRON,
  DEFAULT_TZ,
  applyDashboardParameters,
  dividirCaminhoDosContratos,
  generateDashboardResource,
  generateDatabricksYml,
  generateJobsResource,
  jobSlug,
} from "../deploy/bundle_generator";
import { descreverAgendamento } from "../deploy/schedule";

/**
 * Traduz os contratos versionados em recursos do Asset Bundle. É o passo que
 * leva o que foi autorado na UI até um job rodando no workspace.
 */
export async function generateBundleResources(
  store: ContractStore,
  extensionUri: vscode.Uri,
): Promise<void> {
  const contratos = await store.list();
  if (!contratos.length) {
    vscode.window.showWarningMessage(
      t().msg_semContratos,
    );
    return;
  }

  const dir = store.contractsDir();
  const raiz = vscode.workspace.workspaceFolders?.[0];
  if (!dir || !raiz) {
    throw new Error(t().msg_abraPasta);
  }

  const config = vscode.workspace.getConfiguration("dqxForge");
  const contractsDir = config.get<string>("contractsDir", DEFAULT_CONTRACTS_DIR);

  const { raizDoBundle, contratosNoBundle } = dividirCaminhoDosContratos(contractsDir);
  const bundleUri = vscode.Uri.joinPath(raiz.uri, ...raizDoBundle);
  const resourcesDir = vscode.Uri.joinPath(bundleUri, "resources");

  const options = {
    dqxVersion: config.get<string>("dqxVersion", "0.15.0"),
    contractsDir: contratosNoBundle,
    volumePath: config.get<string>("volumePath", ""),
    warehouseId: config.get<string>("warehouseId", "") || undefined,
    cronExpression: config.get<string>("schedule", DEFAULT_CRON),
    timezone: config.get<string>("timezone", DEFAULT_TZ),
  };

  // Sem o Volume o caminho de saída sairia relativo à raiz e o job só falharia
  // em runtime, muito depois do deploy passar.
  if (!options.volumePath) {
    const acao = await vscode.window.showErrorMessage(t().msg_precisaVolume, t().msg_abrirConfig);
    if (acao) {
      await vscode.commands.executeCommand("dqxForge.selectVolume");
    }
    return;
  }

  const lista = contratos.map((c) => c.contract);
  await vscode.workspace.fs.createDirectory(resourcesDir);

  const bundleCriado = await garantirDatabricksYml(bundleUri, config.get<string>("profile", ""));

  const jobsUri = vscode.Uri.joinPath(resourcesDir, "dq_jobs.yml");
  await vscode.workspace.fs.writeFile(
    jobsUri,
    Buffer.from(generateJobsResource(lista, options), "utf8"),
  );

  // O job agendado roda um script do repositório do usuário, referenciado por
  // caminho relativo no YAML — quem entrega esse arquivo é a extensão.
  const taskUri = await escreverTaskDoJob(bundleUri, extensionUri);

  const escritos = [jobsUri, taskUri];

  // O dashboard só entra quando há warehouse: sem ele o bundle não valida.
  if (options.warehouseId) {
    const dashboardFile = vscode.Uri.joinPath(
      bundleUri,
      "dq",
      "dashboard",
      "dqx_quality.lvdash.json",
    );
    await semearDashboard(dashboardFile, extensionUri);

    try {
      // Os filtros do dashboard não passam pelo bundle: gravamos os valores do
      // projeto como defaults no próprio .lvdash.json versionado.
      const template = Buffer.from(await vscode.workspace.fs.readFile(dashboardFile)).toString(
        "utf8",
      );
      const { conteudo } = applyDashboardParameters(template, lista);
      await vscode.workspace.fs.writeFile(dashboardFile, Buffer.from(conteudo, "utf8"));

      // O recurso só é declarado com o .lvdash.json em mãos: apontar para um
      // arquivo ausente reprova o bundle inteiro, não só o dashboard.
      const dashUri = vscode.Uri.joinPath(resourcesDir, "dq_dashboard.yml");
      await vscode.workspace.fs.writeFile(
        dashUri,
        Buffer.from(generateDashboardResource(options), "utf8"),
      );
      escritos.push(dashUri, dashboardFile);
    } catch {
      vscode.window.showWarningMessage(
        t().msg_dashboardNaoEncontrado,
      );
    }
  }

  const acao = await vscode.window.showInformationMessage(
    t().msg_recursosGerados(escritos.length, lista.length) +
      t().msg_agendamentoAplicado(descreverAgendamento(options.cronExpression)) +
      (bundleCriado ? t().msg_bundleCriado : "") +
      (options.warehouseId ? "" : t().msg_dashboardPulado),
    t().acao_abrirArquivo("dq_jobs.yml"),
  );
  if (acao) {
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(jobsUri));
  }
}

/**
 * Copia o task do job agendado para o repositório. É artefato derivado, como o
 * dq_jobs.yml que o referencia: sobrescreve sempre, para que o script e o YAML
 * nunca fiquem em versões diferentes.
 */
async function escreverTaskDoJob(
  bundleUri: vscode.Uri,
  extensionUri: vscode.Uri,
): Promise<vscode.Uri> {
  const destinoDir = vscode.Uri.joinPath(bundleUri, "src", "dqx_runner");
  const destino = vscode.Uri.joinPath(destinoDir, "apply_task.py");

  await vscode.workspace.fs.createDirectory(destinoDir);
  await vscode.workspace.fs.copy(
    vscode.Uri.joinPath(extensionUri, "dist", "tasks", "apply_task.py"),
    destino,
    { overwrite: true },
  );
  return destino;
}

/**
 * O databricks.yml é do usuário, não artefato derivado — por isso só nasce na
 * ausência e nunca é reescrito. Sem ele o CLI não encontra a raiz do bundle e
 * o primeiro deploy falha antes de chegar em qualquer recurso.
 */
async function garantirDatabricksYml(
  bundleUri: vscode.Uri,
  perfil: string,
): Promise<boolean> {
  const alvo = vscode.Uri.joinPath(bundleUri, "databricks.yml");
  try {
    await vscode.workspace.fs.stat(alvo);
    return false;
  } catch {
    // não existe: segue para criar
  }

  const host = await hostDoPerfil(perfil);
  if (!host) {
    // Um bundle com host vazio só adiaria a falha para o deploy, com mensagem pior.
    const acao = await vscode.window.showWarningMessage(
      t().msg_semHostParaBundle,
      t().msg_abrirConfig,
    );
    if (acao) {
      await vscode.commands.executeCommand("dqxForge.selectProfile");
    }
    return false;
  }

  const nome = jobSlug(bundleUri.path.split("/").filter(Boolean).pop() ?? "dqx_forge");
  await vscode.workspace.fs.writeFile(
    alvo,
    Buffer.from(generateDatabricksYml(nome, host), "utf8"),
  );
  return true;
}

async function hostDoPerfil(perfil: string): Promise<string | undefined> {
  try {
    const perfis = await DatabricksAuth.listProfiles();
    return perfis.find((p) => p.name === (perfil || "DEFAULT"))?.host || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Semeia o template embarcado do dashboard. Sem o .lvdash.json no repositório,
 * o recurso apontaria para um caminho inexistente e reprovaria o bundle todo.
 */
async function semearDashboard(destino: vscode.Uri, extensionUri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.stat(destino);
    return;
  } catch {
    // não existe: copia o template
  }

  await vscode.workspace.fs.copy(
    vscode.Uri.joinPath(extensionUri, "resources", "dashboard", "dqx_quality.lvdash.json"),
    destino,
    { overwrite: false },
  );
}

/**
 * Valida e publica o bundle sem sair da IDE. Sempre valida antes: um deploy
 * que falha no meio deixa o workspace num estado difícil de explicar.
 */
export async function deployBundle(client: BundleClient): Promise<void> {
  const target = await escolherTarget(client);
  if (!target) {
    return;
  }

  const validacao = await client.validate(target);
  if (!validacao.ok) {
    const acao = await vscode.window.showErrorMessage(
      t().msg_falhaValidacao,
      t().msg_verDetalhes,
    );
    if (acao) {
      await vscode.commands.executeCommand("dqxForge.showOutput");
    }
    return;
  }

  const resultado = await client.deploy(target);
  if (!resultado.ok) {
    const acao = await vscode.window.showErrorMessage(
      t().msg_falhaPublicar(target),
      t().msg_verDetalhes,
    );
    if (acao) {
      await vscode.commands.executeCommand("dqxForge.showOutput");
    }
    return;
  }

  const acao = await vscode.window.showInformationMessage(
    t().msg_publicado(target),
    t().acao_verRecursos,
  );
  if (acao) {
    await client.summary(target);
    await vscode.commands.executeCommand("dqxForge.showOutput");
  }
}

/** Dispara o job de qualidade de um contrato, escolhido numa lista. */
export async function runContractJob(
  store: ContractStore,
  client: BundleClient,
): Promise<void> {
  const contratos = await store.list();
  if (!contratos.length) {
    vscode.window.showWarningMessage(t().msg_semContratos);
    return;
  }

  const escolhido = await vscode.window.showQuickPick(
    contratos.map(({ contract }) => ({
      label: contract.meta.table,
      description: `${contract.checks.length} checks · ${contract.output.modo}`,
      chave: `job_dq_${jobSlug(contract.meta.table)}`,
    })),
    { title: t().acao_executarTitulo, placeHolder: t().acao_executarPlaceholder },
  );
  if (!escolhido) {
    return;
  }

  const target = await escolherTarget(client);
  if (!target) {
    return;
  }

  const resultado = await client.runJob(escolhido.chave, target);
  if (resultado.ok) {
    const url = /https:\/\/\S+/.exec(resultado.stdout)?.[0];
    const acao = await vscode.window.showInformationMessage(
      t().msg_execucaoIniciada(escolhido.label),
      ...(url ? [t().acao_abrirDatabricks] : []),
    );
    if (acao && url) {
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  } else {
    vscode.window.showErrorMessage(t().bundle_naoIniciou(resultado.stderr.slice(0, 200)));
  }
}

async function escolherTarget(client: BundleClient): Promise<string | undefined> {
  const targets = await client.listTargets();
  if (!targets.length) {
    return "dev";
  }
  if (targets.length === 1) {
    return targets[0];
  }
  return await vscode.window.showQuickPick(targets, {
    title: t().pick_targetTitulo,
    placeHolder: t().pick_targetPlaceholder,
  });
}

import { stringify as stringifyYaml } from "yaml";
import type { DqContract } from "../contracts/contract_schema";

export interface BundleOptions {
  dqxVersion: string;
  /** Caminho dos contratos relativo à raiz do bundle. */
  contractsDir: string;
  volumePath: string;
  warehouseId?: string;
  /** Expressão Quartz. String vazia gera o job sem schedule. */
  cronExpression?: string;
  timezone?: string;
}

export const DEFAULT_CRON = "0 0 6 * * ?";
export const DEFAULT_TZ = "America/Sao_Paulo";

/**
 * Traduz os contratos versionados em jobs do Databricks Asset Bundle.
 *
 * O arquivo é gerado inteiro a cada chamada — é artefato derivado, não deve
 * ser editado à mão. Isso mantém o contrato como fonte única da verdade.
 */
export function generateJobsResource(
  contracts: DqContract[],
  options: BundleOptions,
): string {
  const jobs: Record<string, unknown> = {};

  for (const contract of contracts) {
    const slug = jobSlug(contract.meta.table);
    const contractPath = `\${workspace.file_path}/${options.contractsDir}/${contract.meta.table}.yml`;
    // O target entra no caminho porque o Volume é o mesmo nos dois ambientes:
    // sem isso, um deploy de dev sobrescreve o resultado do job de prod.
    const outputPath = `${options.volumePath}/runs/\${bundle.target}/apply_${slug}.json`;

    jobs[`job_dq_${slug}`] = {
      name: `dq_${slug}`,
      tasks: [
        {
          task_key: "apply_checks",
          environment_key: "dqx_env",
          spark_python_task: {
            python_file: "../src/dqx_runner/apply_task.py",
            parameters: ["--contract-path", contractPath, "--output-path", outputPath],
          },
        },
      ],
      environments: [
        {
          environment_key: "dqx_env",
          spec: {
            client: "3",
            dependencies: [`databricks-labs-dqx==${options.dqxVersion}`],
          },
        },
      ],
      ...agendamento(options),
      queue: { enabled: true },
      tags: {
        origem: "dqx_forge",
        tabela: contract.meta.table,
        camada: contract.meta.camada,
      },
    };
  }

  return withHeader(stringifyYaml({ resources: { jobs } }, { indent: 2, lineWidth: 120 }));
}

/**
 * Sem periodicidade escolhida, o job sobe sem o bloco `schedule` — continua
 * disparável pelo comando "Executar checks" e por qualquer orquestrador
 * externo, apenas não tem gatilho próprio.
 */
function agendamento(options: BundleOptions): Record<string, unknown> {
  const cron = options.cronExpression ?? DEFAULT_CRON;
  if (!cron) {
    return {};
  }

  return {
    schedule: {
      quartz_cron_expression: cron,
      timezone_id: options.timezone ?? DEFAULT_TZ,
      // Nasce pausado: quem decide ligar um job em produção é o revisor do PR.
      pause_status: "PAUSED",
    },
  };
}

/**
 * Declara o dashboard do DQX como recurso do bundle, em vez de depender do
 * `databricks labs install dqx` — assim ele é versionado e promovido dev→prod
 * junto com os jobs.
 */
export function generateDashboardResource(options: BundleOptions): string {
  const dashboard = {
    resources: {
      dashboards: {
        dash_dq_qualidade: {
          display_name: "Qualidade de dados — DQX",
          file_path: "../dq/dashboard/dqx_quality.lvdash.json",
          warehouse_id: options.warehouseId ?? "${var.warehouse_id}",
        },
      },
    },
  };

  return withHeader(stringifyYaml(dashboard, { indent: 2, lineWidth: 120 }));
}

/**
 * O schema do Asset Bundle não aceita parâmetros de dashboard, então os valores
 * do projeto são gravados como defaults dentro do próprio .lvdash.json. O
 * arquivo continua versionado e o dashboard sobe já apontando para as tabelas
 * certas, sem ninguém precisar preencher filtro na mão.
 */
export function applyDashboardParameters(
  template: string,
  contracts: DqContract[],
): { conteudo: string; aplicados: string[] } {
  const alvo = contracts.find((c) => c.output.tabela_metricas) ?? contracts[0];
  if (!alvo) {
    throw new Error("Nenhum contrato disponível para configurar o dashboard.");
  }

  const curada = partes(alvo.output.tabela_saida ?? alvo.meta.table);
  // No modo anotação, válida e inválida são a mesma tabela — o dashboard do
  // DQX aceita esse arranjo, já que distingue pelas colunas _errors/_warnings.
  const invalida =
    alvo.output.modo === "quarentena" && alvo.output.tabela_quarentena
      ? partes(alvo.output.tabela_quarentena)
      : curada;
  const metricas = alvo.output.tabela_metricas ? partes(alvo.output.tabela_metricas) : undefined;

  const valores: Record<string, string> = {
    v_catalog_name: curada.catalog,
    v_schema_name: curada.schema,
    data_table_name: curada.table,
    inv_catalog_name: invalida.catalog,
    inv_schema_name: invalida.schema,
    q_table_name: invalida.table,
    error_col_name: "_errors",
    warn_col_name: "_warnings",
  };

  if (metricas) {
    valores.summary_catalog_name = metricas.catalog;
    valores.summary_schema_name = metricas.schema;
    valores.summary_table_name = metricas.table;
  }

  const doc = JSON.parse(template) as {
    datasets?: Array<{
      parameters?: Array<{
        keyword?: string;
        defaultSelection?: { values?: { dataType?: string; values?: Array<{ value: string }> } };
      }>;
    }>;
  };

  const aplicados = new Set<string>();
  for (const dataset of doc.datasets ?? []) {
    for (const parametro of dataset.parameters ?? []) {
      const novo = parametro.keyword ? valores[parametro.keyword] : undefined;
      if (novo === undefined) {
        continue;
      }
      parametro.defaultSelection = {
        values: { dataType: "STRING", values: [{ value: novo }] },
      };
      aplicados.add(parametro.keyword as string);
    }
  }

  return { conteudo: `${JSON.stringify(doc, null, 2)}\n`, aplicados: [...aplicados].sort() };
}

function partes(fullName: string): { catalog: string; schema: string; table: string } {
  const [catalog = "", schema = "", table = ""] = fullName.split(".");
  return { catalog, schema, table };
}

export function jobSlug(table: string): string {
  return table.replace(/[^A-Za-z0-9]+/g, "_").toLowerCase();
}

function withHeader(body: string): string {
  return `# Gerado pelo DQX Forge a partir dos contratos em dq/contracts/.
# Não edite à mão: rode "DQX Forge: Gerar recursos do bundle" novamente.

${body}`;
}

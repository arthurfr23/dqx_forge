import type { CatalogClient } from "../remote/catalog_client";
import type { SqlClient } from "../remote/sql_client";
import type { CheckCatalogEntry, DqxCheck } from "../domain/profiling";
import type { Dimension } from "../domain/layer_profiles";
import { AGENT_TOOLS, runTool, type ToolContext } from "./tools";
import type { LlmMessage, LlmProvider } from "./llm_provider";

const MAX_ITERACOES = 14;

export interface AgentResult {
  propostas: Array<{ check: DqxCheck; justificativa: string }>;
  trilha: ToolContext["trilha"];
  resumo: string;
  iteracoes: number;
  atingiuLimite: boolean;
  /** Linhas de diagnóstico: o que o modelo devolveu em cada volta. */
  diagnostico: string[];
}

export interface AgentOptions {
  provider: LlmProvider;
  catalog: CatalogClient;
  sql: SqlClient;
  checkCatalog: CheckCatalogEntry[];
  alvo: { table?: string; catalog?: string; schema?: string };
  contexto?: string;
  dimensoesSugeridas?: Dimension[];
  onProgress?: (mensagem: string) => void;
  signal?: AbortSignal;
}

/**
 * Deixa o modelo explorar o Lakehouse por conta própria e propor o contrato.
 * O loop é limitado e todas as ferramentas são somente-leitura; o resultado
 * ainda passa pela validação do DQX antes de virar contrato.
 */
export async function runAgent(options: AgentOptions): Promise<AgentResult> {
  const context: ToolContext = {
    catalog: options.catalog,
    sql: options.sql,
    propostas: [],
    trilha: [],
  };

  const messages: LlmMessage[] = [
    { role: "system", content: buildSystemPrompt(options) },
    { role: "user", content: buildUserPrompt(options) },
  ];

  let resumo = "";
  let iteracoes = 0;
  const diagnostico: string[] = [
    `provider: ${options.provider.descricao} · ferramentas enviadas: ${AGENT_TOOLS.length}`,
  ];

  while (iteracoes < MAX_ITERACOES) {
    if (options.signal?.aborted) {
      break;
    }
    iteracoes += 1;

    const response = await options.provider.chat(messages, AGENT_TOOLS);

    diagnostico.push(
      `volta ${iteracoes}: ${response.toolCalls.length} chamada(s)` +
        (response.toolCalls.length
          ? ` [${response.toolCalls.map((c) => c.name || "sem-nome").join(", ")}]`
          : "") +
        ` · texto: ${response.text ? `${response.text.length} chars` : "vazio"}`,
    );

    if (response.text) {
      resumo = response.text;
    }

    // Sem chamada de ferramenta o modelo não investigou nada. Antes de desistir,
    // vale um empurrão: alguns modelos respondem em prosa na primeira volta.
    if (!response.toolCalls.length) {
      if (iteracoes === 1) {
        diagnostico.push("nenhuma ferramenta usada na primeira volta — insistindo uma vez");
        options.onProgress?.("Pedindo ao modelo que use as ferramentas…");
        messages.push({ role: "assistant", content: response.text });
        messages.push({
          role: "user",
          content:
            "Você não chamou nenhuma ferramenta. Não responda em texto: use describe_table " +
            "para ver o schema e depois as demais ferramentas para investigar os dados. " +
            "Ao final, chame propose_checks com as regras.",
        });
        continue;
      }
      break;
    }

    messages.push({
      role: "assistant",
      content: response.text,
      toolCalls: response.toolCalls,
    });

    for (const call of response.toolCalls) {
      // Argumento ilegível costuma ser resposta truncada: devolver o motivo faz
      // o modelo reenviar em partes menores, em vez de encerrar sem propor nada.
      if (call.parseError) {
        options.onProgress?.("Reenviando a chamada, os argumentos vieram incompletos…");
        messages.push({
          role: "tool",
          content:
            `Não consegui ler os argumentos de ${call.name}: ${call.parseError}. ` +
            `Reenvie a chamada com menos itens de uma vez.`,
          toolCallId: call.id,
        });
        continue;
      }

      options.onProgress?.(descreverChamada(call.name, call.arguments));
      const saida = await runTool(call.name, call.arguments, context);
      messages.push({ role: "tool", content: saida, toolCallId: call.id });
    }

    // Depois de registrar as propostas o trabalho acabou; mais uma volta só
    // para o modelo redigir o fechamento.
    if (response.toolCalls.some((c) => c.name === "propose_checks")) {
      const fechamento = await options.provider.chat(messages, AGENT_TOOLS);
      if (fechamento.text) {
        resumo = fechamento.text;
      }
      break;
    }
  }

  return {
    propostas: context.propostas,
    trilha: context.trilha,
    resumo,
    iteracoes,
    atingiuLimite: iteracoes >= MAX_ITERACOES && context.propostas.length === 0,
    diagnostico,
  };
}

function buildSystemPrompt(options: AgentOptions): string {
  const porDimensao = new Map<string, string[]>();
  for (const entry of options.checkCatalog) {
    const lista = porDimensao.get(entry.dimension) ?? [];
    lista.push(entry.name);
    porDimensao.set(entry.dimension, lista);
  }

  const catalogoResumido = [...porDimensao.entries()]
    .map(([dimensao, nomes]) => `- ${dimensao}: ${nomes.join(", ")}`)
    .join("\n");

  const assinaturas = options.checkCatalog
    .map((entry) => {
      const args = entry.arguments
        .map((a) => (a.required ? a.name : `${a.name}?`))
        .join(", ");
      return `${entry.name}(${args})`;
    })
    .join("\n");

  return `Você é um engenheiro de qualidade de dados trabalhando num Lakehouse do Databricks.
Sua tarefa é investigar os dados reais e propor um conjunto de regras de qualidade (checks do DQX).

Como trabalhar:
1. Descubra a estrutura com list_tables e describe_table.
2. Olhe os dados de verdade com sample_table e profile_column. Não proponha regra sem ter olhado.
3. Quando tiver uma hipótese (ex.: "esta coluna parece ter domínio fechado", "este valor nunca deveria ser negativo"), confirme com run_sql antes de propor.
4. Ao final, chame propose_checks uma única vez com tudo que você decidiu, cada regra com a justificativa do que você observou.

Princípios:
- Uma regra que reprova dados válidos é pior que regra nenhuma. Se a amostra já mostra violações do que você ia propor, use criticality "warn" em vez de "error", ou não proponha.
- Prefira poucas regras com significado de negócio a muitas regras óbvias.
- Use "error" só quando a linha realmente não deve seguir adiante; caso contrário use "warn".
- Cubra as dimensões de qualidade da Databricks: completude, validade, acurácia, unicidade, consistência e atualidade.

Check functions disponíveis, por dimensão:
${catalogoResumido}

Assinaturas (argumento? = opcional):
${assinaturas}

Use exatamente estes nomes de função e de argumento. Não invente funções.`;
}

function buildUserPrompt(options: AgentOptions): string {
  const partes: string[] = [];

  if (options.alvo.table) {
    // O contrato é sempre de uma tabela só, mas olhar as vizinhas é o que
    // permite propor foreign_key com referência real.
    partes.push(
      `Analise a tabela ${options.alvo.table} e proponha regras de qualidade para ela.\n` +
        `Todas as regras devem se referir a esta tabela. Você pode inspecionar outras ` +
        `tabelas do mesmo schema para checar integridade referencial, mas não proponha ` +
        `regras para elas.`,
    );
  } else if (options.alvo.catalog && options.alvo.schema) {
    partes.push(
      `Analise o schema ${options.alvo.catalog}.${options.alvo.schema} e proponha regras ` +
        `de qualidade para a tabela mais relevante dele.`,
    );
  }

  if (options.contexto?.trim()) {
    partes.push(`\nContexto de negócio informado pelo time:\n${options.contexto.trim()}`);
  }

  if (options.dimensoesSugeridas?.length) {
    partes.push(
      `\nPela camada desta tabela, priorize as dimensões: ${options.dimensoesSugeridas.join(", ")}.`,
    );
  }

  return partes.join("\n");
}

function descreverChamada(nome: string, args: Record<string, unknown>): string {
  switch (nome) {
    case "list_tables":
      return `Listando tabelas de ${args.catalog}.${args.schema}…`;
    case "describe_table":
      return `Lendo o schema de ${args.table}…`;
    case "sample_table":
      return `Amostrando ${args.table}…`;
    case "profile_column":
      return `Analisando a coluna ${args.column} de ${args.table}…`;
    case "run_sql":
      return `Confirmando uma hipótese com SQL…`;
    case "propose_checks":
      return `Registrando as regras propostas…`;
    default:
      return `Executando ${nome}…`;
  }
}

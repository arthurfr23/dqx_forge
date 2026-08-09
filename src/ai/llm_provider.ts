import type { DatabricksAuth } from "../auth/databricks_auth";
import type { ToolDefinition } from "./tools";

export type Rota = "databricks" | "ide";

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Preenchido quando os argumentos vieram malformados (resposta truncada). */
  parseError?: string;
}

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface LlmResponse {
  text: string;
  toolCalls: ToolCall[];
}

export interface LlmProvider {
  readonly rota: Rota;
  readonly descricao: string;
  chat(messages: LlmMessage[], tools: ToolDefinition[]): Promise<LlmResponse>;
}

/**
 * Roda o modelo dentro do workspace via Foundation Model APIs. Nenhuma amostra
 * de dado sai do perímetro do Databricks — é o default por esse motivo.
 */
export class DatabricksFmProvider implements LlmProvider {
  readonly rota = "databricks" as const;

  constructor(
    private auth: DatabricksAuth,
    private endpoint: string,
  ) {}

  get descricao(): string {
    return `Databricks FM · ${this.endpoint}`;
  }

  async chat(messages: LlmMessage[], tools: ToolDefinition[]): Promise<LlmResponse> {
    const body = {
      messages: messages.map((m) => {
        if (m.role === "tool") {
          return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
        }
        if (m.role === "assistant" && m.toolCalls?.length) {
          return {
            role: "assistant",
            content: m.content || null,
            tool_calls: m.toolCalls.map((c) => ({
              id: c.id,
              type: "function",
              function: { name: c.name, arguments: JSON.stringify(c.arguments) },
            })),
          };
        }
        return { role: m.role, content: m.content };
      }),
      tools: tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.schema },
      })),
      // Sem temperature: alguns modelos servidos (Claude Fable 5, por exemplo)
      // rejeitam o parâmetro em vez de ignorá-lo.
      // O teto precisa acomodar um contrato inteiro em tool_calls; abaixo disso
      // a resposta trunca no meio do JSON e os argumentos chegam ilegíveis.
      max_tokens: 16384,
    };

    const response = await this.auth.request<{
      choices?: Array<{
        finish_reason?: string;
        message?: {
          content?: unknown;
          tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }>;
        };
      }>;
    }>(`/serving-endpoints/${this.endpoint}/invocations`, { method: "POST", body });

    const choice = response.choices?.[0];
    const message = choice?.message;
    const truncado = choice?.finish_reason === "length";

    return {
      text: normalizeContent(message?.content),
      toolCalls: (message?.tool_calls ?? []).map((call, index) => {
        const parsed = parseArguments(call.function?.arguments, truncado);
        return {
          id: call.id ?? `call_${index}`,
          name: call.function?.name ?? "",
          arguments: parsed.value,
          parseError: parsed.error,
        };
      }),
    };
  }
}

/**
 * O campo content pode vir como string simples ou como lista de blocos
 * ({type:"text",text:...}), dependendo do modelo servido.
 */
export function normalizeContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((bloco) => {
        if (typeof bloco === "string") {
          return bloco;
        }
        if (bloco && typeof bloco === "object") {
          const texto = (bloco as { text?: unknown }).text;
          return typeof texto === "string" ? texto : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function parseArguments(
  text: string | undefined,
  truncado: boolean,
): { value: Record<string, unknown>; error?: string } {
  if (!text || !text.trim()) {
    return {
      value: {},
      error: truncado
        ? "os argumentos chegaram vazios porque a resposta foi truncada"
        : undefined,
    };
  }
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null) {
      return { value: parsed as Record<string, unknown> };
    }
    return { value: {}, error: "os argumentos não formaram um objeto JSON" };
  } catch (err) {
    // Silenciar aqui faria a ferramenta rodar com {} e o agente terminar
    // sem propor nada, sem explicar por quê.
    return {
      value: {},
      error: `os argumentos não são JSON válido${truncado ? " (resposta truncada)" : ""}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }
}

import { t } from "../i18n/current";
import * as vscode from "vscode";
import type { ToolDefinition } from "./tools";
import type { LlmMessage, LlmProvider, LlmResponse, ToolCall } from "./llm_provider";

/** Margem sobre maxInputTokens, para o pedido não estourar por pouco. */
const FOLGA_TOKENS = 0.85;

/** Teto por resultado de ferramenta ao podar o histórico. */
const CORTE_RESULTADO = 1_200;

/**
 * Usa o modelo já disponível na IDE (assinatura Copilot/Claude do usuário).
 * Custo zero no Databricks, porém amostras de dados trafegam para fora do
 * workspace — a UI precisa deixar isso explícito antes de acionar.
 */
export class VsCodeLmProvider implements LlmProvider {
  readonly rota = "ide" as const;

  constructor(private model: vscode.LanguageModelChat) {}

  get descricao(): string {
    return `IDE · ${this.model.name} (${this.model.maxInputTokens} tokens)`;
  }

  /** Resolve o modelo que o usuário escolheu; cai no primeiro disponível se ele sumiu. */
  static async selecionar(modelId?: string): Promise<VsCodeLmProvider | undefined> {
    const modelos = await vscode.lm.selectChatModels();
    if (!modelos.length) {
      return undefined;
    }
    const escolhido =
      (modelId ? modelos.find((m) => m.id === modelId) : undefined) ??
      modelos.find((m) => m.family.includes("claude")) ??
      modelos[0];
    return new VsCodeLmProvider(escolhido);
  }

  async chat(messages: LlmMessage[], tools: ToolDefinition[]): Promise<LlmResponse> {
    const preparadas = await this.montarMensagens(messages);

    let response: vscode.LanguageModelChatResponse;
    try {
      response = await this.model.sendRequest(preparadas, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.schema,
        })),
        // Auto é o default; explicitar deixa claro que o modelo escolhe se e
        // qual ferramenta usar (Required aceitaria só uma ferramenta).
        toolMode: vscode.LanguageModelChatToolMode.Auto,
        justification: t().ia_justificativaLm,
      });
    } catch (err) {
      // Traduz os erros da IDE em algo acionável, em vez de "não propôs regras".
      if (err instanceof vscode.LanguageModelError) {
        throw new Error(`o modelo da IDE recusou o pedido (${err.code}): ${err.message}`);
      }
      throw err;
    }

    let text = "";
    const toolCalls: ToolCall[] = [];
    for await (const part of response.stream) {
      if (part instanceof vscode.LanguageModelTextPart) {
        text += part.value;
      } else if (part instanceof vscode.LanguageModelToolCallPart) {
        toolCalls.push({
          id: part.callId,
          name: part.name,
          arguments: normalizarEntrada(part.input),
        });
      }
    }

    return { text, toolCalls };
  }

  /**
   * A API da IDE não tem papel de sistema, e mandar o preâmbulo como uma
   * mensagem de usuário separada faz alguns modelos responderem em prosa em vez
   * de usar as ferramentas. Juntar preâmbulo e pedido numa única mensagem
   * inicial elimina essa ambiguidade.
   */
  private async montarMensagens(
    messages: LlmMessage[],
  ): Promise<vscode.LanguageModelChatMessage[]> {
    const chatMessages: vscode.LanguageModelChatMessage[] = [];
    let abertura = "";

    for (const message of messages) {
      if (message.role === "system") {
        abertura = abertura ? `${abertura}\n\n${message.content}` : message.content;
        continue;
      }

      // O primeiro turno de usuário absorve o preâmbulo acumulado.
      if (message.role === "user" && abertura) {
        chatMessages.push(
          vscode.LanguageModelChatMessage.User(`${abertura}\n\n---\n\n${message.content}`),
        );
        abertura = "";
        continue;
      }

      if (message.role === "tool") {
        chatMessages.push(
          vscode.LanguageModelChatMessage.User([
            new vscode.LanguageModelToolResultPart(message.toolCallId ?? "", [
              new vscode.LanguageModelTextPart(podar(message.content)),
            ]),
          ]),
        );
        continue;
      }

      if (message.role === "assistant") {
        const partes: Array<vscode.LanguageModelTextPart | vscode.LanguageModelToolCallPart> = [];
        if (message.content) {
          partes.push(new vscode.LanguageModelTextPart(message.content));
        }
        for (const call of message.toolCalls ?? []) {
          partes.push(new vscode.LanguageModelToolCallPart(call.id, call.name, call.arguments));
        }
        if (partes.length) {
          chatMessages.push(vscode.LanguageModelChatMessage.Assistant(partes));
        }
        continue;
      }

      chatMessages.push(vscode.LanguageModelChatMessage.User(message.content));
    }

    if (abertura) {
      chatMessages.push(vscode.LanguageModelChatMessage.User(abertura));
    }

    return await this.caberNoLimite(chatMessages);
  }

  /**
   * Estoura de contexto acontece porque o histórico acumula amostras de dados.
   * Em vez de deixar o pedido falhar no meio da investigação, descarta os turnos
   * mais antigos — o preâmbulo e os turnos recentes são o que importa.
   */
  private async caberNoLimite(
    mensagens: vscode.LanguageModelChatMessage[],
  ): Promise<vscode.LanguageModelChatMessage[]> {
    const teto = Math.floor(this.model.maxInputTokens * FOLGA_TOKENS);
    let atual = [...mensagens];

    for (;;) {
      const total = await this.contar(atual);
      if (total <= teto || atual.length <= 3) {
        return atual;
      }
      // Preserva a primeira (preâmbulo + pedido) e corta o par mais antigo
      // depois dela, que é sempre uma chamada e o seu resultado.
      atual = [atual[0], ...atual.slice(3)];
    }
  }

  private async contar(mensagens: vscode.LanguageModelChatMessage[]): Promise<number> {
    let total = 0;
    for (const mensagem of mensagens) {
      try {
        total += await this.model.countTokens(mensagem);
      } catch {
        // countTokens pode falhar em partes não textuais; estima pelo tamanho.
        total += 500;
      }
    }
    return total;
  }
}

function podar(texto: string): string {
  return texto.length <= CORTE_RESULTADO
    ? texto
    : `${texto.slice(0, CORTE_RESULTADO)}\n… (resultado truncado)`;
}

/** O input pode vir como objeto já parseado ou como string JSON. */
function normalizarEntrada(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object") {
    return input as Record<string, unknown>;
  }
  if (typeof input === "string" && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

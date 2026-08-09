import type { DatabricksAuth } from "../auth/databricks_auth";

export interface ServingModel {
  name: string;
  displayName: string;
  ready: boolean;
  /** Modelo de fundação hospedado pelo Databricks (pay-per-token). */
  foundation: boolean;
}

interface EndpointResponse {
  endpoints?: Array<{
    name: string;
    task?: string;
    state?: { ready?: string };
    config?: {
      served_entities?: Array<{
        foundation_model?: { display_name?: string; name?: string };
      }>;
    };
  }>;
}

/** Descobre quais modelos de chat o workspace expõe, para o usuário escolher. */
export class ServingClient {
  constructor(private auth: DatabricksAuth) {}

  async listChatModels(): Promise<ServingModel[]> {
    const response = await this.auth.request<EndpointResponse>("/api/2.0/serving-endpoints");

    return (response.endpoints ?? [])
      // Embeddings e outras tarefas não servem para gerar checks.
      .filter((endpoint) => (endpoint.task ?? "").includes("chat"))
      .map((endpoint) => {
        const entity = endpoint.config?.served_entities?.[0];
        return {
          name: endpoint.name,
          displayName: entity?.foundation_model?.display_name ?? endpoint.name,
          ready: (endpoint.state?.ready ?? "").toUpperCase() === "READY",
          foundation: Boolean(entity?.foundation_model),
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }
}

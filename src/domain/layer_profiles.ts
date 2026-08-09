/**
 * Camadas da arquitetura medalhão, inferidas pelo prefixo do nome da tabela.
 * A doc de data quality da Databricks posiciona a silver como single source of
 * truth, onde mora o grosso da validação — por isso cada camada recebe um
 * conjunto default de dimensões a cobrir.
 */
export type Layer = "raw" | "bronze" | "silver" | "gold" | "mart" | "desconhecida";

export type Dimension =
  | "completude"
  | "validade"
  | "acuracia"
  | "unicidade"
  | "consistencia"
  | "atualidade";

const PREFIX_TO_LAYER: ReadonlyArray<[string, Layer]> = [
  ["raw_", "raw"],
  ["brz_", "bronze"],
  ["slv_", "silver"],
  ["gld_", "gold"],
  ["mrt_", "mart"],
];

const LAYER_DIMENSIONS: Record<Layer, Dimension[]> = {
  raw: ["validade", "atualidade"],
  bronze: ["validade", "atualidade"],
  silver: ["completude", "unicidade", "consistencia", "validade"],
  gold: ["acuracia", "consistencia", "atualidade"],
  mart: ["acuracia", "consistencia"],
  desconhecida: ["completude", "validade"],
};

const LAYER_LABEL: Record<Layer, string> = {
  raw: "raw",
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  mart: "mart",
  desconhecida: "",
};

export function detectLayer(tableName: string): Layer {
  const lower = tableName.toLowerCase();
  for (const [prefix, layer] of PREFIX_TO_LAYER) {
    if (lower.startsWith(prefix)) {
      return layer;
    }
  }
  return "desconhecida";
}

export function layerLabel(layer: Layer): string {
  return LAYER_LABEL[layer];
}

/** Dimensões que a extensão sugere cobrir por padrão numa tabela desta camada. */
export function defaultDimensions(layer: Layer): Dimension[] {
  return LAYER_DIMENSIONS[layer];
}

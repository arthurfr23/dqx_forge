import { useMemo, useState } from "react";
import type { CheckCatalogEntry, DqxCheck } from "../../src/domain/profiling";
import type { Dimension } from "../../src/domain/layer_profiles";
import type { Catalogo } from "../../src/i18n/messages";

const DIMENSOES: Dimension[] = [
  "completude",
  "validade",
  "acuracia",
  "unicidade",
  "consistencia",
  "atualidade",
];

interface Props {
  catalog: CheckCatalogEntry[];
  dimensoesSugeridas: Dimension[];
  colunaPadrao?: string;
  t: Catalogo;
  onAdd: (check: DqxCheck) => void;
}

export function CatalogPanel({ catalog, dimensoesSugeridas, colunaPadrao, t, onAdd }: Props) {
  const [busca, setBusca] = useState("");
  const [dimensao, setDimensao] = useState<Dimension | "todas">("todas");

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalog
      .filter((c) => dimensao === "todas" || c.dimension === dimensao)
      .filter((c) => !termo || c.name.includes(termo) || c.doc.toLowerCase().includes(termo))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, busca, dimensao]);

  const adicionar = (entry: CheckCatalogEntry) => {
    const args: Record<string, unknown> = {};
    // Pré-preenche a coluna quando faz sentido: menos cliques no caso comum.
    if (colunaPadrao && entry.arguments.some((a) => a.name === "column")) {
      args.column = colunaPadrao;
    }
    onAdd({
      criticality: "error",
      name: colunaPadrao ? `${colunaPadrao}_${entry.name}` : entry.name,
      check: { function: entry.name, arguments: args },
      user_metadata: { dimensao: entry.dimension },
    });
  };

  return (
    <>
      <div className="section-title">{t.catalogo_titulo}</div>

      <input
        type="text"
        placeholder={t.catalogo_buscar}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <select
        value={dimensao}
        onChange={(e) => setDimensao(e.target.value as Dimension | "todas")}
        style={{ marginBottom: 10 }}
      >
        <option value="todas">{t.catalogo_todasDimensoes}</option>
        {DIMENSOES.map((d) => (
          <option key={d} value={d}>
            {t[`dim_${d}`]}
            {dimensoesSugeridas.includes(d) ? ` · ${t.catalogo_sugerida}` : ""}
          </option>
        ))}
      </select>

      {dimensoesSugeridas.length > 0 && dimensao === "todas" && (
        <p className="hint" style={{ marginBottom: 10 }}>
          {t.catalogo_recomendadas(dimensoesSugeridas.map((d) => t[`dim_${d}`]).join(", "))}
        </p>
      )}

      {visiveis.length === 0 && <p className="hint">{t.catalogo_semResultado}</p>}

      {visiveis.map((entry) => (
        <div
          key={entry.name}
          className="catalog-item"
          onClick={() => adicionar(entry)}
          title={entry.doc}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span className="name">{entry.name}</span>
            {entry.doc && <span className="doc">{truncate(entry.doc, 70)}</span>}
          </div>
          {entry.scope === "dataset" && <span className="badge">dataset</span>}
        </div>
      ))}
    </>
  );
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

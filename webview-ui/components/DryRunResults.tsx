import type { DryRunSummary } from "../../src/webview/protocol";
import type { Catalogo } from "../../src/i18n/messages";

export function DryRunResults({ resultado, t }: { resultado: DryRunSummary; t: Catalogo }) {
  if (!resultado.ok) {
    return <div className="issue error">{t.dry_falhou(resultado.erro ?? "—")}</div>;
  }

  const { linhasAmostradas, linhasComErro, linhasComAviso, linhasValidas } = resultado;
  const comProblema = resultado.checks.filter((c) => c.violacoes > 0);

  // Um contrato gerado por profiling herda limites da amostra. Se a amostra
  // cobre pouco da tabela, esses limites reprovam dados válidos no resto.
  const cobertura = resultado.linhasNaTabela ? linhasAmostradas / resultado.linhasNaTabela : 1;
  const amostraParcial = cobertura < 0.9 && resultado.linhasNaTabela > 0;

  const n = (valor: number) => valor.toLocaleString();

  return (
    <div>
      <div className="section-title">{t.dry_titulo}</div>

      <p className="hint" style={{ marginBottom: 10 }}>
        {t.dry_resumo(n(linhasAmostradas), n(linhasValidas), n(linhasComErro), n(linhasComAviso))}
      </p>

      {amostraParcial && (
        <div className="issue warning">
          {t.dry_avisoAmostra(
            (cobertura * 100).toFixed(1),
            n(linhasAmostradas),
            n(resultado.linhasNaTabela),
          )}
        </div>
      )}

      {comProblema.length === 0 ? (
        <p className="hint">{t.dry_semViolacoes}</p>
      ) : (
        <table className="results">
          <thead>
            <tr>
              <th>{t.dry_colCheck}</th>
              <th>{t.dry_colColuna}</th>
              <th className="num">{t.dry_colViolacoes}</th>
              <th style={{ width: 90 }}>%</th>
            </tr>
          </thead>
          <tbody>
            {comProblema
              .sort((a, b) => b.violacoes - a.violacoes)
              .map((check) => (
                <tr key={`${check.name}-${check.function}-${check.column ?? ""}`}>
                  <td>
                    <span
                      className={`badge dim-${check.criticality === "error" ? "acuracia" : "atualidade"}`}
                    >
                      {check.criticality}
                    </span>{" "}
                    {check.name}
                  </td>
                  <td>{check.column ?? "—"}</td>
                  <td className="num">{n(check.violacoes)}</td>
                  <td>
                    <div
                      className="bar"
                      style={{ width: `${Math.min(100, Math.max(2, check.percentual))}%` }}
                      title={`${check.percentual.toFixed(2)}%`}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {resultado.exemplos.length > 0 && (
        <>
          <div className="section-title">{t.dry_exemplos}</div>
          <div style={{ overflowX: "auto" }}>
            <table className="results">
              <thead>
                <tr>
                  {Object.keys(resultado.exemplos[0]).map((coluna) => (
                    <th key={coluna}>{coluna}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resultado.exemplos.map((linha, i) => (
                  <tr key={i}>
                    {Object.values(linha).map((valor, j) => (
                      <td key={j}>{formatCell(valor)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "∅";
  }
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return text.length > 60 ? `${text.slice(0, 60)}…` : text;
}

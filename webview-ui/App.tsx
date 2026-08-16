import { useEffect, useMemo, useState } from "react";
import type { DqxCheck } from "../src/domain/profiling";
import type { DryRunSummary, EditorState } from "../src/webview/protocol";
import type { DqContract, ModoSaida } from "../src/contracts/contract_schema";
import { onHostMessage, post } from "./vscode_api";
import { catalogo } from "../src/i18n/messages";
import { CheckCard } from "./components/CheckCard";
import { CatalogPanel } from "./components/CatalogPanel";
import { DryRunResults } from "./components/DryRunResults";

export function App() {
  const [state, setState] = useState<EditorState | undefined>();
  const [busy, setBusy] = useState<string | undefined>();
  const [dryRun, setDryRun] = useState<DryRunSummary | undefined>();
  const [erro, setErro] = useState<string | undefined>();
  const [sujo, setSujo] = useState(false);
  // 100% por padrão: uma amostra parcial é o que gera limites enviesados.
  const [percentual, setPercentual] = useState(100);

  useEffect(() => {
    const off = onHostMessage((message) => {
      switch (message.type) {
        case "state":
          setState(message.state);
          setSujo(false);
          setErro(undefined);
          break;
        case "issues":
          setState((prev) => (prev ? { ...prev, issues: message.issues } : prev));
          break;
        case "saved":
          setSujo(false);
          setState((prev) =>
            prev ? { ...prev, salvo: true, caminhoArquivo: message.caminhoArquivo } : prev,
          );
          break;
        case "busy":
          setBusy(message.busy ? (message.mensagem ?? "Processando…") : undefined);
          break;
        case "dryRunResult":
          setDryRun(message.resultado);
          break;
        case "error":
          setErro(message.mensagem);
          setBusy(undefined);
          break;
      }
    });
    post({ type: "ready" });
    return off;
  }, []);

  const entryByName = useMemo(
    () => new Map((state?.catalog ?? []).map((c) => [c.name, c])),
    [state?.catalog],
  );

  const errosPorCheck = useMemo(() => {
    const set = new Set<number>();
    for (const issue of state?.issues ?? []) {
      if (issue.severity === "error" && issue.checkIndex !== undefined) {
        set.add(issue.checkIndex);
      }
    }
    return set;
  }, [state?.issues]);

  const t = catalogo(state?.idioma ?? "pt-br");

  if (!state) {
    return <div className="empty">…</div>;
  }

  const { contract } = state;

  const atualizar = (proximo: DqContract) => {
    setState({ ...state, contract: proximo });
    setSujo(true);
    post({ type: "updateContract", contract: proximo });
  };

  const alterarCheck = (index: number, check: DqxCheck) => {
    const checks = [...contract.checks];
    checks[index] = check;
    atualizar({ ...contract, checks });
  };

  const removerCheck = (index: number) => {
    atualizar({ ...contract, checks: contract.checks.filter((_, i) => i !== index) });
  };

  const adicionarCheck = (check: DqxCheck) => {
    atualizar({ ...contract, checks: [...contract.checks, check] });
  };

  const alterarModo = (mode: ModoSaida) => {
    atualizar({
      ...contract,
      output: {
        ...contract.output,
        mode,
        quarantine_table:
          mode === "quarantine"
            ? (contract.output.quarantine_table ?? `${contract.meta.table}_quarantine`)
            : undefined,
      },
    });
  };

  const erros = state.issues.filter((i) => i.severity === "error");
  const avisos = state.issues.filter((i) => i.severity === "warning");

  return (
    <div className="app">
      <header className="header">
        <h1>{contract.meta.table}</h1>
        <span className="badge">{contract.meta.layer}</span>
        <span className="badge">{contract.meta.generated_by.replace("_", " ")}</span>
        <span className="sub">
          {t.editor_checks(contract.checks.length)}
          {contract.meta.dqx_version ? ` · DQX ${contract.meta.dqx_version}` : ""}
          {sujo ? ` · ${t.editor_naoSalvo}` : state.caminhoArquivo ? ` · ${t.editor_salvo}` : ""}
        </span>
      </header>

      <div className="body">
        <main className="main">
          {erro && <div className="issue error">{erro}</div>}

          <div className="output-box">
            <div className="section-title">{t.saida_titulo}</div>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  checked={contract.output.mode === "annotate"}
                  onChange={() => alterarModo("annotate")}
                />
                {t.saida_anotar}
              </label>
              <label>
                <input
                  type="radio"
                  checked={contract.output.mode === "quarantine"}
                  onChange={() => alterarModo("quarantine")}
                />
                {t.saida_quarentena}
              </label>
            </div>
            <p className="hint">
              {contract.output.mode === "annotate" ? t.saida_anotarDica : t.saida_quarentenaDica}
            </p>

            <div className="check-args" style={{ marginTop: 10 }}>
              <label htmlFor="tabela-saida">{t.saida_tabelaSaida}</label>
              <input
                id="tabela-saida"
                type="text"
                value={contract.output.output_table ?? ""}
                onChange={(e) =>
                  atualizar({
                    ...contract,
                    output: { ...contract.output, output_table: e.target.value || undefined },
                  })
                }
              />

              {contract.output.mode === "quarantine" && (
                <>
                  <label htmlFor="tabela-quarentena">{t.saida_tabelaQuarentena}</label>
                  <input
                    id="tabela-quarentena"
                    type="text"
                    value={contract.output.quarantine_table ?? ""}
                    onChange={(e) =>
                      atualizar({
                        ...contract,
                        output: {
                          ...contract.output,
                          quarantine_table: e.target.value || undefined,
                        },
                      })
                    }
                  />
                </>
              )}

              <label htmlFor="tabela-metricas">{t.saida_tabelaMetricas}</label>
              <input
                id="tabela-metricas"
                type="text"
                placeholder={t.saida_tabelaMetricasDica}
                value={contract.output.metrics_table ?? ""}
                onChange={(e) =>
                  atualizar({
                    ...contract,
                    output: { ...contract.output, metrics_table: e.target.value || undefined },
                  })
                }
              />
            </div>
          </div>

          <div className="section-title">{t.editor_checks(contract.checks.length)}</div>

          {contract.checks.length === 0 && (
            <div className="empty">
              {t.editor_semChecks}
              <br />
              {t.editor_semChecksDica}
            </div>
          )}

          {contract.checks.map((check, index) => (
            <CheckCard
              key={`${index}-${check.check.function}`}
              check={check}
              index={index}
              origin={state.origins[index]}
              entry={entryByName.get(check.check.function)}
              columns={state.columns.map((c) => ({ name: c.name, type: c.type }))}
              temErro={errosPorCheck.has(index)}
              t={t}
              onChange={alterarCheck}
              onRemove={removerCheck}
            />
          ))}

          {busy && (
            <div className="running">
              <span className="spinner" />
              <div>
                <strong>{busy}</strong>
                <p className="hint">{t.dry_aguarde}</p>
              </div>
            </div>
          )}

          {!busy && dryRun && <DryRunResults resultado={dryRun} t={t} />}
        </main>

        <aside className="side">
          <CatalogPanel
            catalog={state.catalog}
            dimensoesSugeridas={state.dimensoesSugeridas}
            t={t}
            onAdd={adicionarCheck}
          />
        </aside>
      </div>

      <footer className="footer">
        <button onClick={() => post({ type: "save" })} disabled={!!busy || erros.length > 0}>
          {sujo ? t.rodape_salvar : t.rodape_salvoBotao}
        </button>

        <button
          className="secondary"
          onClick={() => post({ type: "dryRun", percentual })}
          disabled={!!busy}
        >
          {busy ? t.dry_executando : t.rodape_dryRun}
        </button>

        <label className="sample-control" title={t.dry_amostraDica}>
          {t.dry_amostraLabel}
          <input
            type="number"
            min={0.01}
            max={100}
            step={5}
            value={percentual}
            onChange={(e) => {
              const valor = Number(e.target.value);
              setPercentual(Number.isFinite(valor) ? Math.min(100, Math.max(0.01, valor)) : 100);
            }}
          />
          <span>%</span>
          {percentual >= 100 && <span className="sub">· {t.dry_tabelaInteira}</span>}
        </label>

        <button className="secondary" onClick={() => post({ type: "openYaml" })}>
          {t.rodape_verYaml}
        </button>

        <span className="spacer" />

        {busy && <span className="sub">{busy}</span>}
        {!busy && erros.length > 0 && (
          <span className="sub" title={erros.map((e) => e.message).join("\n")}>
            {t.rodape_errosImpedem(erros.length)}
          </span>
        )}
        {!busy && erros.length === 0 && avisos.length > 0 && (
          <span className="sub">{t.rodape_avisos(avisos.length)}</span>
        )}
      </footer>

      {(erros.length > 0 || avisos.length > 0) && (
        <div style={{ padding: "0 16px 12px", maxHeight: 160, overflowY: "auto" }}>
          {erros.map((issue, i) => (
            <div key={`e${i}`} className="issue error">
              {issue.message}
            </div>
          ))}
          {avisos.map((issue, i) => (
            <div key={`w${i}`} className="issue warning">
              {issue.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

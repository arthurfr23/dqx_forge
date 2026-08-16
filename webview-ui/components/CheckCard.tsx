import type { CheckCatalogEntry, DqxCheck } from "../../src/domain/profiling";
import type { CheckOrigin } from "../../src/webview/protocol";
import type { Catalogo } from "../../src/i18n/messages";

interface Props {
  check: DqxCheck;
  index: number;
  origin?: CheckOrigin;
  entry?: CheckCatalogEntry;
  columns: Array<{ name: string; type: string }>;
  temErro: boolean;
  t: Catalogo;
  onChange: (index: number, check: DqxCheck) => void;
  onRemove: (index: number) => void;
}

export function CheckCard({
  check,
  index,
  origin,
  entry,
  columns,
  temErro,
  t,
  onChange,
  onRemove,
}: Props) {
  const dimension = origin?.dimension ?? entry?.dimension;

  const setArgument = (name: string, value: unknown) => {
    const args = { ...check.check.arguments };
    if (value === "" || value === undefined) {
      delete args[name];
    } else {
      args[name] = value;
    }
    onChange(index, { ...check, check: { ...check.check, arguments: args } });
  };

  const className = [
    "check",
    temErro ? "has-error" : origin?.sugerido ? "suggested" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="check-head">
        <select
          aria-label={t.check_criticidade}
          value={check.criticality}
          style={{ width: "auto" }}
          onChange={(e) =>
            onChange(index, { ...check, criticality: e.target.value as "error" | "warn" })
          }
        >
          <option value="error">error</option>
          <option value="warn">warn</option>
        </select>

        <span className="check-fn">{check.check.function}</span>

        {typeof check.check.arguments.column === "string" && (
          <span className="check-col">{check.check.arguments.column}</span>
        )}

        {dimension && (
          // A classe fica no nome canônico (pt) para o CSS; só o rótulo traduz.
          <span className={`badge dim-${dimension}`}>{t[`dim_${dimension}`]}</span>
        )}
        {entry?.scope === "dataset" && <span className="badge">dataset</span>}

        <span className="spacer" />

        <button className="icon" title={t.check_remover} onClick={() => onRemove(index)}>
          {t.check_remover}
        </button>
      </div>

      {origin?.explicacao && <p className="check-why">{origin.explicacao}</p>}

      {entry && (
        <div className="check-args">
          {entry.arguments.map((argument) => (
            <ArgumentField
              key={argument.name}
              argument={argument}
              value={check.check.arguments[argument.name]}
              columns={columns}
              t={t}
              onChange={(value) => setArgument(argument.name, value)}
            />
          ))}

          <label htmlFor={`filter-${index}`}>filter</label>
          <input
            id={`filter-${index}`}
            type="text"
            placeholder={t.check_filtroDica}
            value={check.filter ?? ""}
            onChange={(e) =>
              onChange(index, { ...check, filter: e.target.value || undefined })
            }
          />
        </div>
      )}
    </div>
  );
}

function ArgumentField({
  argument,
  value,
  columns,
  t,
  onChange,
}: {
  argument: CheckCatalogEntry["arguments"][number];
  value: unknown;
  columns: Array<{ name: string; type: string }>;
  t: Catalogo;
  onChange: (value: unknown) => void;
}) {
  const label = argument.required ? argument.name : t.check_opcional(argument.name);
  const id = `arg-${argument.name}-${Math.random().toString(36).slice(2, 7)}`;

  // Argumentos de coluna viram um select das colunas reais da tabela: elimina
  // a classe inteira de erro de digitar nome de coluna errado.
  if (argument.name === "column" && columns.length) {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {columns.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} · {c.type}
            </option>
          ))}
        </select>
      </>
    );
  }

  const type = argument.type.toLowerCase();
  if (type.includes("bool")) {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          value={value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value === "true")}
        >
          <option value="">—</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </>
    );
  }

  if (type.includes("int") || type.includes("float")) {
    return (
      <>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          type="number"
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      </>
    );
  }

  const isList = type.includes("list");
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        placeholder={isList ? "valores separados por vírgula" : ""}
        value={formatValue(value, isList)}
        onChange={(e) => onChange(parseValue(e.target.value, isList))}
      />
    </>
  );
}

function formatValue(value: unknown, isList: boolean): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (isList && Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function parseValue(text: string, isList: boolean): unknown {
  if (text === "") {
    return undefined;
  }
  if (isList) {
    return text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return text;
}

"""Extrai o catálogo de check functions da versão do DQX instalada.

A extensão monta os formulários da UI a partir deste JSON, então
checks novos de versões futuras aparecem sem release da extensão.
"""

import argparse
import inspect
import io
import json
import traceback
from datetime import datetime, timezone

RESULT_MARKER = "DQX_FORGE_RESULT::"

# Mapeia cada check para a dimensão de qualidade da doc da Databricks.
# Checks não listados caem em "validade", o default menos surpreendente.
DIMENSION_BY_CHECK = {
    "completude": [
        "is_not_null",
        "is_not_null_and_not_empty",
        "is_not_null_and_not_empty_array",
        "is_not_empty",
    ],
    "unicidade": ["is_unique"],
    "acuracia": [
        "is_in_range",
        "is_not_in_range",
        "is_not_less_than",
        "is_not_greater_than",
        "is_equal_to",
        "is_not_equal_to",
        "is_aggr_not_greater_than",
        "is_aggr_not_less_than",
        "is_aggr_equal",
        "is_aggr_not_equal",
        "has_no_aggr_outliers",
        "has_no_outliers",
        "has_no_row_anomalies",
    ],
    "consistencia": [
        "foreign_key",
        "compare_datasets",
        "sql_expression",
        "sql_query",
    ],
    "atualidade": [
        "is_data_fresh",
        "is_data_fresh_per_time_window",
        "is_not_in_future",
        "is_not_in_near_future",
        "is_older_than_n_days",
        "is_older_than_col2_for_n_days",
    ],
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-path", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from databricks.sdk import WorkspaceClient

    ws = WorkspaceClient()
    payload = {
        "task": "introspect",
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "ok": False,
    }

    try:
        from databricks.labs.dqx import __version__ as dqx_version
        from databricks.labs.dqx import check_funcs
        from databricks.labs.dqx.rule import CHECK_FUNC_REGISTRY

        payload["dqx_version"] = dqx_version

        dimension_lookup = {
            name: dimension
            for dimension, names in DIMENSION_BY_CHECK.items()
            for name in names
        }

        # O registry é a fonte da verdade: só o que foi decorado com
        # @register_rule é visível para apply_checks_by_metadata. Helpers
        # públicos do módulo não entram.
        checks = []
        for name, scope in sorted(CHECK_FUNC_REGISTRY.items()):
            fn = getattr(check_funcs, name, None)
            if fn is None or not callable(fn):
                payload.setdefault("nao_resolvidos", []).append(name)
                continue

            try:
                signature = inspect.signature(fn)
            except (TypeError, ValueError):
                continue

            arguments = []
            for param_name, param in signature.parameters.items():
                if param_name in ("self", "args", "kwargs"):
                    continue
                arguments.append(
                    {
                        "name": param_name,
                        "type": _annotation_name(param.annotation),
                        "required": param.default is inspect.Parameter.empty,
                        "default": None
                        if param.default is inspect.Parameter.empty
                        else _jsonable(param.default),
                    }
                )

            doc = (inspect.getdoc(fn) or "").strip().split("\n\n")[0]
            checks.append(
                {
                    "name": name,
                    "scope": scope,
                    "dimension": dimension_lookup.get(name, "validade"),
                    "arguments": arguments,
                    "doc": " ".join(doc.split()),
                }
            )

        payload["ok"] = True
        payload["checks"] = checks
        payload["total"] = len(checks)

    except Exception as exc:
        payload["error"] = str(exc)
        payload["traceback"] = traceback.format_exc()

    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    ws.files.upload(args.output_path, io.BytesIO(body), overwrite=True)

    marker = {
        "ok": payload["ok"],
        "path": args.output_path,
        "total": payload.get("total", 0),
    }
    print(f"{RESULT_MARKER}{json.dumps(marker)}")

    if not payload["ok"]:
        raise SystemExit(payload.get("error", "introspecção falhou"))


def _annotation_name(annotation) -> str:
    if annotation is inspect.Parameter.empty:
        return "any"
    if hasattr(annotation, "__name__"):
        return annotation.__name__
    return str(annotation).replace("typing.", "")


def _jsonable(value):
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    return str(value)


if __name__ == "__main__":
    main()

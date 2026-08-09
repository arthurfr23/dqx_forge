"""Executa o profiler do DQX numa tabela e devolve os checks candidatos.

Roda como spark_python_task num job serverless efêmero disparado pela
extensão. O payload completo vai para um JSON no UC Volume; o stdout
carrega só um marcador com o caminho, para caber no limite de saída.
"""

import argparse
import io
import json
import traceback
from datetime import datetime, timezone

RESULT_MARKER = "DQX_FORGE_RESULT::"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--table", required=True, help="Nome completo: catalog.schema.table"
    )
    parser.add_argument(
        "--output-path",
        required=True,
        help="Caminho do JSON de saída no UC Volume",
    )
    parser.add_argument(
        "--options", default="{}", help="Opções de profiling em JSON"
    )
    parser.add_argument(
        "--columns",
        default="",
        help="Colunas separadas por vírgula; vazio = todas",
    )
    parser.add_argument(
        "--criticality", default="error", choices=["error", "warn"]
    )
    parser.add_argument("--detect-primary-keys", default="false")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from databricks.sdk import WorkspaceClient
    from pyspark.sql import SparkSession

    ws = WorkspaceClient()
    spark = SparkSession.builder.getOrCreate()

    payload = {
        "task": "profile",
        "table": args.table,
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "ok": False,
    }

    try:
        from databricks.labs.dqx import __version__ as dqx_version
        from databricks.labs.dqx.config import InputConfig
        from databricks.labs.dqx.profiler.generator import DQGenerator
        from databricks.labs.dqx.profiler.profiler import DQProfiler

        payload["dqx_version"] = dqx_version

        options = json.loads(args.options) if args.options else {}
        columns = [
            c.strip() for c in args.columns.split(",") if c.strip()
        ] or None

        profiler = DQProfiler(ws, spark)
        input_config = InputConfig(location=args.table)

        summary_stats, profiles = profiler.profile_table(
            input_config=input_config,
            columns=columns,
            options=options or None,
        )

        generator = DQGenerator(ws)
        checks = generator.generate_dq_rules(
            profiles, criticality=args.criticality
        )

        if args.detect_primary_keys.lower() == "true":
            try:
                payload["primary_keys"] = (
                    profiler.detect_primary_keys_with_llm(input_config)
                )
            # A detecção por LLM é opcional: não derruba o profiling.
            except Exception as exc:
                payload["primary_keys_error"] = str(exc)

        payload["ok"] = True
        payload["summary_stats"] = _jsonable(summary_stats)
        payload["profiles"] = [_profile_to_dict(p) for p in profiles]
        payload["checks"] = _jsonable(checks)

    except Exception as exc:
        payload["error"] = str(exc)
        payload["traceback"] = traceback.format_exc()

    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    ws.files.upload(args.output_path, io.BytesIO(body), overwrite=True)

    marker = {
        "ok": payload["ok"],
        "path": args.output_path,
        "checks": len(payload.get("checks", [])),
    }
    print(f"{RESULT_MARKER}{json.dumps(marker)}")

    if not payload["ok"]:
        raise SystemExit(payload.get("error", "profiling falhou"))


def _profile_to_dict(profile: object) -> dict:
    """DQProfile é dataclass; preserva os campos sem depender do import."""
    raw = getattr(profile, "__dict__", None) or {}
    return {key: _jsonable(value) for key, value in raw.items()}


def _jsonable(value):
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_jsonable(v) for v in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


if __name__ == "__main__":
    main()

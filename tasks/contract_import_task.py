"""Converte um data contract ODCS v3.x em checks do DQX.

O DQX deriva regras de três fontes dentro do contrato: as propriedades do
schema, a seção `quality` explícita e expectativas escritas em linguagem
natural (estas exigem um LLM configurado).
"""

import argparse
import io
import json
import traceback
from datetime import datetime, timezone

RESULT_MARKER = "DQX_FORGE_RESULT::"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-path", required=True)
    parser.add_argument(
        "--contract-file",
        required=True,
        help="Caminho do contrato ODCS no Volume ou Workspace",
    )
    parser.add_argument(
        "--criticality", default="error", choices=["error", "warn"]
    )
    parser.add_argument("--process-text-rules", default="false")
    parser.add_argument("--schema-validation", default="true")
    parser.add_argument("--strict-schema", default="false")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from databricks.sdk import WorkspaceClient

    ws = WorkspaceClient()
    payload = {
        "task": "contract_import",
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "ok": False,
    }

    try:
        from databricks.labs.dqx import __version__ as dqx_version
        from databricks.labs.dqx.profiler.generator import DQGenerator

        payload["dqx_version"] = dqx_version

        generator = DQGenerator(ws)
        checks = generator.generate_rules_from_contract(
            contract_file=args.contract_file,
            contract_format="odcs",
            generate_predefined_rules=True,
            process_text_rules=args.process_text_rules.lower() == "true",
            generate_schema_validation=args.schema_validation.lower()
            == "true",
            strict_schema_validation=args.strict_schema.lower() == "true",
            default_criticality=args.criticality,
        )

        payload["ok"] = True
        payload["checks"] = _jsonable(checks)
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
        raise SystemExit(payload.get("error", "importação falhou"))


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

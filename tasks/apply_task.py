"""Execução oficial de um contrato: aplica os checks e grava os resultados.

É o que roda nos jobs agendados criados pelo DAB. Respeita o modo de saída
escolhido no contrato (quarentena separa as linhas, anotação só marca) e
alimenta a tabela de métricas que o dashboard do DQX consome.
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
        "--contract-path",
        required=True,
        help="YAML ou JSON do contrato, em Workspace file ou UC Volume",
    )
    parser.add_argument("--output-path", required=True)
    parser.add_argument(
        "--mode",
        default="",
        help="Sobrescreve output.modo do contrato (quarentena|anotacao)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from databricks.sdk import WorkspaceClient
    from pyspark.sql import SparkSession

    ws = WorkspaceClient()
    spark = SparkSession.builder.getOrCreate()

    payload = {
        "task": "apply",
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "ok": False,
    }

    try:
        from databricks.labs.dqx import __version__ as dqx_version
        from databricks.labs.dqx.config import InputConfig, OutputConfig
        from databricks.labs.dqx.engine import DQEngine

        payload["dqx_version"] = dqx_version

        contract = _load_contract(args.contract_path)
        meta = contract.get("meta", {})
        output = contract.get("output", {})
        checks = contract.get("checks", [])

        table = meta.get("table")
        if not table:
            raise ValueError("Contrato sem meta.table.")
        if not checks:
            raise ValueError("Contrato sem checks.")

        modo = args.mode or output.get("modo", "anotacao")
        payload["table"] = table
        payload["modo"] = modo

        observer = _build_observer(output)
        engine = (
            DQEngine(ws, spark)
            if observer is None
            else DQEngine(ws, spark, observer=observer)
        )

        status = engine.validate_checks(checks)
        if getattr(status, "has_errors", False):
            raise ValueError(f"Checks inválidos: {status}")

        destino = output.get("tabela_saida") or f"{table}_validado"
        # Reescrever a tabela de origem mudaria o schema dela; o default anexa
        # o sufixo em vez de sobrescrever o dado bruto.
        if destino == table:
            destino = f"{table}_validado"

        # Saída e quarentena são artefatos derivados, recriados a cada
        # execução. Trocar o modo (quarentena <-> anotação) muda o
        # schema delas; sem overwriteSchema o Delta recusa a escrita,
        # e com Table ACL ligado nem migra schema automaticamente.
        overwrite = {"overwriteSchema": "true"}

        quarantine_config = None
        if modo == "quarentena":
            quarentena = (
                output.get("tabela_quarentena") or f"{table}_quarentena"
            )
            quarantine_config = OutputConfig(
                location=quarentena, mode="overwrite", options=overwrite
            )

        metrics_config = None
        if output.get("tabela_metricas"):
            # Métricas acumulam histórico: append, sem overwriteSchema.
            metrics_config = OutputConfig(
                location=output["tabela_metricas"], mode="append"
            )

        # A API de alto nível lê, aplica, divide e grava — inclusive as
        # métricas que alimentam o dashboard.
        engine.apply_checks_by_metadata_and_save_in_table(
            input_config=InputConfig(location=table),
            output_config=OutputConfig(
                location=destino, mode="overwrite", options=overwrite
            ),
            checks=checks,
            quarantine_config=quarantine_config,
            metrics_config=metrics_config,
        )

        payload["destinos"] = [destino] + (
            [quarantine_config.location] if quarantine_config else []
        )
        if metrics_config:
            payload["tabela_metricas"] = metrics_config.location
        payload["ok"] = True

    except Exception as exc:
        payload["error"] = str(exc)
        payload["traceback"] = traceback.format_exc()

    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    ws.files.upload(args.output_path, io.BytesIO(body), overwrite=True)

    marker = {"ok": payload["ok"], "path": args.output_path}
    print(f"{RESULT_MARKER}{json.dumps(marker)}")

    if not payload["ok"]:
        raise SystemExit(payload.get("error", "apply falhou"))


def _load_contract(path: str) -> dict:
    """Aceita YAML ou JSON, de Volume, Workspace file ou caminho local."""
    if path.startswith("/Volumes/"):
        from databricks.sdk import WorkspaceClient

        with WorkspaceClient().files.download(path).contents as stream:
            raw = stream.read().decode("utf-8")
    else:
        with open(path, "r", encoding="utf-8") as handle:
            raw = handle.read()

    stripped = raw.lstrip()
    if stripped.startswith("{"):
        return json.loads(raw)

    import yaml

    return yaml.safe_load(raw)


def _build_observer(output: dict):
    if not output.get("tabela_metricas"):
        return None
    try:
        from databricks.labs.dqx.metrics_observer import DQMetricsObserver

        return DQMetricsObserver(name="dqx_forge")
    except Exception:
        # Sem o observer os checks ainda rodam; só ficam sem métricas.
        return None


if __name__ == "__main__":
    main()

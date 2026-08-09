"""Aplica um contrato numa amostra e reporta quantas linhas cada check reprova.

É o passo que transforma "achei que a regra estava certa" em "vi a regra
funcionando" — roda antes de gravar o contrato, sem escrever em lugar nenhum.
"""

import argparse
import io
import json
import traceback
from datetime import datetime, timezone

RESULT_MARKER = "DQX_FORGE_RESULT::"
MAX_EXEMPLOS = 20


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", required=True)
    parser.add_argument("--output-path", required=True)
    parser.add_argument(
        "--checks-path",
        required=True,
        help="JSON com a lista de checks, previamente gravado no Volume",
    )
    parser.add_argument(
        "--sample-percent",
        type=float,
        default=100.0,
        help="Percentual da tabela a avaliar (0-100). 100 usa tudo.",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=0,
        help="Teto de linhas após a amostragem. 0 = sem teto.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from databricks.sdk import WorkspaceClient
    from pyspark.sql import SparkSession

    ws = WorkspaceClient()
    spark = SparkSession.builder.getOrCreate()

    payload = {
        "task": "dry_run",
        "table": args.table,
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "ok": False,
    }

    try:
        import pyspark.sql.functions as F
        from databricks.labs.dqx import __version__ as dqx_version
        from databricks.labs.dqx.engine import DQEngine

        payload["dqx_version"] = dqx_version

        with ws.files.download(args.checks_path).contents as stream:
            checks = json.loads(stream.read().decode("utf-8"))

        engine = DQEngine(ws, spark)

        # Falha cedo e com mensagem clara se algum check for inválido.
        status = engine.validate_checks(checks)
        if getattr(status, "has_errors", False):
            payload["error"] = str(status)
            payload["validacao"] = str(status)
            _finish(ws, args, payload)
            return

        origem = spark.read.table(args.table)
        total_tabela = origem.count()

        # Amostragem aleatória, não LIMIT: as primeiras N linhas não
        # representam o resto da tabela, e limites inferidos desse
        # recorte reprovam dados válidos mais adiante.
        percentual = max(0.01, min(100.0, args.sample_percent))
        if percentual >= 100.0:
            df = origem
        else:
            df = origem.sample(fraction=percentual / 100.0, seed=42)

        if args.max_rows > 0:
            df = df.limit(args.max_rows)

        total = df.count()
        payload["percentualSolicitado"] = percentual

        # Sem cache(): serverless não suporta PERSIST. Com a amostra limitada,
        # recomputar sai mais barato que contornar.
        checked = engine.apply_checks_by_metadata(df, checks)

        erros = F.col("_errors")
        avisos = F.col("_warnings")
        com_erro = checked.filter(erros.isNotNull() & (F.size(erros) > 0))
        com_aviso = checked.filter(avisos.isNotNull() & (F.size(avisos) > 0))

        n_erro = com_erro.count()
        n_aviso = com_aviso.count()

        # Uma linha viola vários checks; explodir dá a contagem por regra.
        por_check = {}
        for coluna, criticidade in (
            ("_errors", "error"),
            ("_warnings", "warn"),
        ):
            exploded = (
                checked.select(F.explode_outer(F.col(coluna)).alias("issue"))
                .filter(F.col("issue").isNotNull())
                .select(
                    F.col("issue.name").alias("name"),
                    F.col("issue.function").alias("function"),
                    F.col("issue.columns").alias("columns"),
                )
                .groupBy("name", "function", "columns")
                .count()
            )
            for row in exploded.collect():
                colunas = row["columns"] or []
                chave = (row["name"], row["function"], tuple(colunas))
                por_check[chave] = {
                    "name": row["name"],
                    "function": row["function"],
                    "column": colunas[0] if colunas else None,
                    "criticality": criticidade,
                    "violacoes": int(row["count"]),
                    "percentual": (row["count"] / total * 100)
                    if total
                    else 0.0,
                }

        colunas_originais = [c for c in df.columns]
        exemplos = [
            {k: _cell(v) for k, v in row.asDict().items()}
            for row in com_erro.select(*colunas_originais)
            .limit(MAX_EXEMPLOS)
            .collect()
        ]

        payload["ok"] = True
        payload["linhasAmostradas"] = total
        # A UI precisa dizer o quanto da tabela foi coberto: limites inferidos
        # de uma amostra pequena reprovam dados válidos no resto da tabela.
        payload["linhasNaTabela"] = total_tabela
        payload["linhasComErro"] = n_erro
        payload["linhasComAviso"] = n_aviso
        payload["linhasValidas"] = total - n_erro
        payload["checks"] = sorted(
            por_check.values(), key=lambda c: c["violacoes"], reverse=True
        )
        payload["exemplos"] = exemplos

    except Exception as exc:
        payload["error"] = str(exc)
        payload["traceback"] = traceback.format_exc()

    _finish(ws, args, payload)


def _finish(ws, args, payload) -> None:
    body = json.dumps(payload, ensure_ascii=False, default=str).encode("utf-8")
    ws.files.upload(args.output_path, io.BytesIO(body), overwrite=True)

    marker = {
        "ok": payload["ok"],
        "path": args.output_path,
        "erros": payload.get("linhasComErro", 0),
    }
    print(f"{RESULT_MARKER}{json.dumps(marker)}")

    if not payload["ok"]:
        raise SystemExit(payload.get("error", "dry-run falhou"))


def _cell(value):
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


if __name__ == "__main__":
    main()

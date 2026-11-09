"""Flask controllers for development metrics."""

from __future__ import annotations

from flask import jsonify, request
from flask_smorest import Blueprint

try:
    from ..auth.controller import require_specific_permission
    from ..auth.repository import session
except ImportError:
    from features.auth.controller import require_specific_permission
    from features.auth.repository import session

from .model import serialize_metric
from .repository import (
    find_feature_metric,
    freeze_feature_metric,
    list_feature_metrics,
    save_feature_settings,
    unlock_feature_metric,
)
from .schema import (
    FeatureMetricSchema,
    FeatureSettingsSchema,
    FreezeMetricSchema,
    UnlockMetricSchema,
    WakaTimeQuerySchema,
)
from .wakatime import WakaTimeError, get_wakatime_metric


DEV_METRICS_BLUEPRINT = Blueprint(
    "devmetrics",
    __name__,
    url_prefix="/dev/feature-metrics",
    description="Métricas de desenvolvimento das features.",
)


@DEV_METRICS_BLUEPRINT.get("/wakatime")
@DEV_METRICS_BLUEPRINT.doc(
    summary="Consulta o tempo do WakaTime",
    description=(
        "Consulta o tempo registrado no WakaTime para uma branch, projeto, período inicial "
        "e timezone informados pelo frontend."
    ),
)
@DEV_METRICS_BLUEPRINT.arguments(WakaTimeQuerySchema, location="query")
@require_specific_permission("dev.metrics")
def wakatime_metric(data):
    try:
        return jsonify(
            get_wakatime_metric(
                data["branch"],
                data["project"],
                data["start_date"],
                data["timezone"],
                force_refresh=data["refresh"],
            )
        )
    except WakaTimeError as error:
        return jsonify({"error": str(error)}), error.status_code


@DEV_METRICS_BLUEPRINT.get("")
@DEV_METRICS_BLUEPRINT.doc(
    summary="Lista métricas de desenvolvimento",
    description=(
        "Lista todas as métricas persistidas. Quando o parâmetro `feature` é informado, "
        "retorna somente a métrica da feature solicitada."
    ),
)
@require_specific_permission("dev.metrics")
def list_metrics():
    feature_id = request.args.get("feature", "").strip()
    if feature_id:
        database = session()
        try:
            metric = find_feature_metric(database, feature_id)
            if metric is None:
                return jsonify({"error": "feature_metric_not_found"}), 404
            return jsonify(serialize_metric(metric))
        finally:
            database.close()
    return jsonify([serialize_metric(metric) for metric in list_feature_metrics()])


@DEV_METRICS_BLUEPRINT.put("/settings")
@DEV_METRICS_BLUEPRINT.doc(
    summary="Salva configurações da feature",
    description=(
        "Cria ou atualiza as configurações persistidas de uma feature, como branch, "
        "horas estimadas e pontos de função."
    ),
)
@DEV_METRICS_BLUEPRINT.arguments(FeatureSettingsSchema, error_status_code=422)
@DEV_METRICS_BLUEPRINT.response(200, FeatureMetricSchema)
@require_specific_permission("dev.metrics")
def save_settings(data):
    database = session()
    try:
        metric = save_feature_settings(database, data)
        database.commit()
        return jsonify(serialize_metric(metric))
    finally:
        database.close()


@DEV_METRICS_BLUEPRINT.post("/freeze")
@DEV_METRICS_BLUEPRINT.doc(
    summary="Congela a métrica da feature",
    description=(
        "Persiste os tempos de desenvolvimento atuais e marca a métrica como concluída "
        "e bloqueada para novas alterações."
    ),
)
@DEV_METRICS_BLUEPRINT.arguments(FreezeMetricSchema, error_status_code=422)
@DEV_METRICS_BLUEPRINT.response(200, FeatureMetricSchema)
@require_specific_permission("dev.metrics")
def freeze_metric(data):
    database = session()
    try:
        metric = freeze_feature_metric(database, data)
        database.commit()
        return jsonify(serialize_metric(metric))
    finally:
        database.close()


@DEV_METRICS_BLUEPRINT.post("/unlock")
@DEV_METRICS_BLUEPRINT.doc(
    summary="Reabre a métrica da feature",
    description="Desbloqueia uma métrica concluída para que ela possa ser atualizada novamente.",
)
@DEV_METRICS_BLUEPRINT.arguments(UnlockMetricSchema, error_status_code=422)
@DEV_METRICS_BLUEPRINT.response(200, FeatureMetricSchema)
@require_specific_permission("dev.metrics")
def unlock_metric(data):
    database = session()
    try:
        metric = unlock_feature_metric(database, data["feature_id"])
        if metric is None:
            return jsonify({"error": "feature_metric_not_found"}), 404
        database.commit()
        return jsonify(serialize_metric(metric))
    finally:
        database.close()


def register_devmetrics(app) -> None:
    app.extensions["rkm_openapi"].register_blueprint(DEV_METRICS_BLUEPRINT)

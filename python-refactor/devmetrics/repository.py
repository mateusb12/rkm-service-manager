"""ORM repository for development metrics."""

from __future__ import annotations

import json

from sqlalchemy import select

try:
    from ..auth.repository import now, session
except ImportError:
    from auth.repository import now, session

from .model import FeatureMetric


def list_feature_metrics() -> list[FeatureMetric]:
    database = session()
    try:
        return list(database.scalars(select(FeatureMetric).order_by(FeatureMetric.feature_id)).all())
    finally:
        database.close()


def find_feature_metric(database, feature_id: str) -> FeatureMetric | None:
    return database.get(FeatureMetric, feature_id.strip())


def freeze_feature_metric(database, data: dict) -> FeatureMetric:
    feature_id = data["feature_id"].strip()
    metric = find_feature_metric(database, feature_id)
    if metric and metric.locked:
        return metric
    timestamp = now()
    if metric is None:
        metric = FeatureMetric(feature_id=feature_id, updated_at=timestamp)
        database.add(metric)
    metric.branch = data["branch"].strip()
    metric.wakatime_seconds = data["wakatime_seconds"]
    metric.chatgpt_seconds = data["chatgpt_seconds"]
    metric.local_seconds = data["local_seconds"]
    metric.editors_json = json.dumps(
        [
            {"name": editor["name"], "totalSeconds": editor["total_seconds"]}
            for editor in data["editors"]
        ],
        ensure_ascii=False,
    )
    metric.locked = True
    metric.completed_at = timestamp
    metric.updated_at = timestamp
    database.flush()
    return metric


def unlock_feature_metric(database, feature_id: str) -> FeatureMetric | None:
    metric = find_feature_metric(database, feature_id)
    if metric is None:
        return None
    metric.locked = False
    metric.completed_at = 0
    metric.updated_at = now()
    database.flush()
    return metric


def save_feature_settings(database, data: dict) -> FeatureMetric:
    feature_id = data["feature_id"].strip()
    metric = find_feature_metric(database, feature_id)
    timestamp = now()
    if metric is None:
        metric = FeatureMetric(feature_id=feature_id, editors_json="[]", updated_at=timestamp)
        database.add(metric)
    if "branch" in data:
        metric.branch = data["branch"] or ""
    if "estimated_hours" in data:
        metric.estimated_hours = data["estimated_hours"]
    if "function_points" in data:
        metric.function_points = data["function_points"]
    metric.updated_at = timestamp
    database.flush()
    return metric

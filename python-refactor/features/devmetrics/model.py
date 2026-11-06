"""Persistence model and API serialization for development metrics."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

try:
    from ..auth.model import Base
except ImportError:
    from ..auth.model import Base


class FeatureMetric(Base):
    __tablename__ = "feature_metrics"

    feature_id: Mapped[str] = mapped_column(String(160), primary_key=True)
    branch: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    function_points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wakatime_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    chatgpt_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    local_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    editors_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[int] = mapped_column(Integer, nullable=False)


def serialize_metric(metric: FeatureMetric) -> dict[str, Any]:
    editors = json.loads(metric.editors_json or "[]")
    return {
        "featureId": metric.feature_id,
        "branch": metric.branch,
        "description": metric.description,
        "estimatedHours": metric.estimated_hours,
        "functionPoints": metric.function_points,
        "wakatimeSeconds": metric.wakatime_seconds,
        "chatGptSeconds": metric.chatgpt_seconds,
        "localSeconds": metric.local_seconds,
        "editors": editors,
        "locked": metric.locked,
        "completedAt": metric.completed_at,
        "updatedAt": metric.updated_at,
    }

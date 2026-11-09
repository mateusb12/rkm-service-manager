"""Persistence model for the flexible service order document."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

try:
    from ..auth.model import Base
except ImportError:
    from features.auth.model import Base


class ServiceOrder(Base):
    """Stable query envelope around an intentionally flexible OS payload."""

    __tablename__ = "service_orders"
    __table_args__ = (Index("ix_service_orders_status", "status"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    order_number: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Recebido")
    stage: Mapped[str] = mapped_column(String, nullable=False, default="recebimento")
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

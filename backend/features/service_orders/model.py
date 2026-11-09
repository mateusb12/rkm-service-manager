"""Persistence model for the flexible service order document."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, Index, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

try:
    from ..auth.model import Base
except ImportError:
    from features.auth.model import Base


class ArrivalMethod(StrEnum):
    COLETA_CLIENTE = "coleta_cliente"
    CLIENTE_ENTREGOU = "cliente_entregou"


class ServiceOrder(Base):
    """Stable query envelope around an intentionally flexible OS payload."""

    __tablename__ = "service_orders"
    __table_args__ = (Index("ix_service_orders_status", "status"),)

    id: Mapped[str] = mapped_column(String, primary_key=True)
    order_number: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    created_by_user: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    status: Mapped[str] = mapped_column(String, nullable=False, default="Recebido")
    stage: Mapped[str] = mapped_column(String, nullable=False, default="recebimento")
    arrival_method: Mapped[ArrivalMethod | None] = mapped_column(
        Enum(
            ArrivalMethod,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda enum: [method.value for method in enum],
        ),
        nullable=True,
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

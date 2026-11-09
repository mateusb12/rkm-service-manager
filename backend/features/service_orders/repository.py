"""Database operations for service orders."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from .model import ServiceOrder


def ensure_schema(database: Session) -> None:
    """Create the initial table if this feature is deployed incrementally."""

    ServiceOrder.__table__.create(database.get_bind(), checkfirst=True)


def list_service_orders(database: Session, status: str = "") -> list[ServiceOrder]:
    query = select(ServiceOrder).order_by(ServiceOrder.updated_at.desc())
    if status:
        query = query.where(ServiceOrder.status == status)
    return list(database.scalars(query).all())


def find_service_order(database: Session, order_id: str) -> ServiceOrder | None:
    return database.get(ServiceOrder, order_id)


def save_service_order(database: Session, order: ServiceOrder) -> ServiceOrder:
    database.add(order)
    database.flush()
    return order

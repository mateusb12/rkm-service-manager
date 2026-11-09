"""Database operations for service orders."""

from __future__ import annotations

from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session

from .model import ArrivalMethod, ServiceOrder


def ensure_schema(database: Session) -> None:
    """Create the initial table if this feature is deployed incrementally."""

    ServiceOrder.__table__.create(database.get_bind(), checkfirst=True)
    columns = {column["name"] for column in inspect(database.get_bind()).get_columns("service_orders")}
    if "arrival_method" not in columns:
        database.execute(text("ALTER TABLE service_orders ADD COLUMN arrival_method VARCHAR(32)"))
        database.commit()

    migrated = False
    for order in database.scalars(select(ServiceOrder)).all():
        legacy_value = (order.payload or {}).get("arrivalMethod")
        if not order.arrival_method and legacy_value:
            try:
                order.arrival_method = ArrivalMethod(legacy_value)
            except ValueError:
                pass
        if "arrivalMethod" in (order.payload or {}):
            order.payload = {
                key: value for key, value in order.payload.items() if key != "arrivalMethod"
            }
            migrated = True
    if migrated:
        database.commit()


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

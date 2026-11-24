"""Persistence model and serialization for price catalog items."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

try:
    from ..auth.model import Base
except ImportError:
    from features.auth.model import Base


class PriceCatalogItem(Base):
    __tablename__ = "price_catalog_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String(10), nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)


def serialize_price_catalog_item(item: PriceCatalogItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "name": item.name,
        "unit": item.unit,
        "unitPriceCents": item.unit_price_cents,
        "description": item.description,
        "type": item.type,
    }

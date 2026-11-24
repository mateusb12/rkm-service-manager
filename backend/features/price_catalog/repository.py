"""Database operations for the price catalog."""

from __future__ import annotations

from sqlalchemy import func, select

try:
    from ..auth.repository import session
except ImportError:
    from features.auth.repository import session

from .model import PriceCatalogItem


def list_price_catalog_items(search: str = "") -> list[PriceCatalogItem]:
    database = session()
    try:
        query = select(PriceCatalogItem).order_by(func.lower(PriceCatalogItem.name), PriceCatalogItem.id)
        normalized_search = search.strip().lower()
        if normalized_search:
            query = query.where(
                func.lower(PriceCatalogItem.name).contains(normalized_search)
                | func.lower(PriceCatalogItem.description).contains(normalized_search)
            )
        return list(database.scalars(query).all())
    finally:
        database.close()


def find_price_catalog_item(database, item_id: int) -> PriceCatalogItem | None:
    return database.get(PriceCatalogItem, item_id)


def create_price_catalog_item(database, item: PriceCatalogItem) -> PriceCatalogItem:
    database.add(item)
    database.flush()
    return item


def delete_price_catalog_item(database, item: PriceCatalogItem) -> None:
    database.delete(item)
    database.flush()

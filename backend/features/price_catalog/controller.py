"""HTTP controllers for the price catalog."""

from __future__ import annotations

from flask import jsonify, request
from flask_smorest import Blueprint

try:
    from ..auth.controller import require_specific_permission
    from ..auth.repository import session
except ImportError:
    from features.auth.controller import require_specific_permission
    from features.auth.repository import session

from .model import PriceCatalogItem, serialize_price_catalog_item
from .repository import create_price_catalog_item, delete_price_catalog_item, find_price_catalog_item, list_price_catalog_items
from .schema import PriceCatalogInputSchema, PriceCatalogOpenAPISchema


PRICE_CATALOG_BLUEPRINT = Blueprint(
    "price_catalog",
    __name__,
    url_prefix="/price-catalog",
    description="Cadastro de materiais e serviços com seus preços.",
)


def _item_id(value: str) -> int | None:
    try:
        item_id = int(value)
    except ValueError:
        return None
    return item_id if item_id > 0 else None


@PRICE_CATALOG_BLUEPRINT.get("")
@PRICE_CATALOG_BLUEPRINT.doc(summary="Lista materiais e serviços")
@PRICE_CATALOG_BLUEPRINT.response(200, PriceCatalogOpenAPISchema(many=True))
@require_specific_permission("price_catalog.manage")
def list_items():
    return jsonify([
        serialize_price_catalog_item(item)
        for item in list_price_catalog_items(request.args.get("search", ""))
    ])


@PRICE_CATALOG_BLUEPRINT.get("/<item_id>")
@PRICE_CATALOG_BLUEPRINT.doc(summary="Consulta um item do catálogo")
@PRICE_CATALOG_BLUEPRINT.response(200, PriceCatalogOpenAPISchema)
@require_specific_permission("price_catalog.manage")
def get_item(item_id: str):
    parsed_id = _item_id(item_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_price_catalog_item_id"}), 400
    database = session()
    try:
        item = find_price_catalog_item(database, parsed_id)
        return jsonify(serialize_price_catalog_item(item)) if item else (jsonify({"error": "price_catalog_item_not_found"}), 404)
    finally:
        database.close()


@PRICE_CATALOG_BLUEPRINT.post("")
@PRICE_CATALOG_BLUEPRINT.doc(summary="Cria um item no catálogo")
@PRICE_CATALOG_BLUEPRINT.arguments(PriceCatalogInputSchema, error_status_code=422)
@PRICE_CATALOG_BLUEPRINT.response(201, PriceCatalogOpenAPISchema)
@require_specific_permission("price_catalog.manage")
def create_item(data):
    database = session()
    try:
        item = create_price_catalog_item(database, PriceCatalogItem(
            name=data["name"].strip(),
            unit=data["unit"],
            unit_price_cents=data["unit_price_cents"],
            description=data["description"].strip(),
            type=data["type"],
        ))
        database.commit()
        return jsonify(serialize_price_catalog_item(item)), 201
    finally:
        database.close()


@PRICE_CATALOG_BLUEPRINT.put("/<item_id>")
@PRICE_CATALOG_BLUEPRINT.doc(summary="Atualiza um item do catálogo")
@PRICE_CATALOG_BLUEPRINT.arguments(PriceCatalogInputSchema, error_status_code=422)
@PRICE_CATALOG_BLUEPRINT.response(200, PriceCatalogOpenAPISchema)
@require_specific_permission("price_catalog.manage")
def update_item(data, item_id: str):
    parsed_id = _item_id(item_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_price_catalog_item_id"}), 400
    database = session()
    try:
        item = find_price_catalog_item(database, parsed_id)
        if not item:
            return jsonify({"error": "price_catalog_item_not_found"}), 404
        item.name = data["name"].strip()
        item.unit = data["unit"]
        item.unit_price_cents = data["unit_price_cents"]
        item.description = data["description"].strip()
        item.type = data["type"]
        database.commit()
        return jsonify(serialize_price_catalog_item(item))
    finally:
        database.close()


@PRICE_CATALOG_BLUEPRINT.delete("/<item_id>")
@PRICE_CATALOG_BLUEPRINT.doc(summary="Exclui definitivamente um item do catálogo")
@PRICE_CATALOG_BLUEPRINT.response(204)
@require_specific_permission("price_catalog.manage")
def delete_item(item_id: str):
    parsed_id = _item_id(item_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_price_catalog_item_id"}), 400
    database = session()
    try:
        item = find_price_catalog_item(database, parsed_id)
        if not item:
            return jsonify({"error": "price_catalog_item_not_found"}), 404
        delete_price_catalog_item(database, item)
        database.commit()
        return "", 204
    finally:
        database.close()


def register_price_catalog(app) -> None:
    app.extensions["rkm_openapi"].register_blueprint(PRICE_CATALOG_BLUEPRINT)

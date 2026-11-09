"""HTTP controllers for service orders."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import g, jsonify, request
from flask_smorest import Blueprint
from sqlalchemy.exc import IntegrityError

try:
    from ..auth.controller import require_one_of_permissions, require_specific_permission
    from ..auth.repository import session
except ImportError:
    from features.auth.controller import require_one_of_permissions, require_specific_permission
    from features.auth.repository import session

from .model import ServiceOrder
from .policy import (
    can_create_service_order,
    can_update_service_order,
)
from .repository import ensure_schema, find_service_order, list_service_orders, save_service_order
from .schema import ServiceOrderInputSchema, normalize_order_number
from .serialization import (
    order_stage,
    serialize_service_order,
    serialize_service_order_summary,
    serialize_stage_catalog,
)
from .stages import parse_stage


SERVICE_ORDERS_BLUEPRINT = Blueprint(
    "service_orders",
    __name__,
    url_prefix="/service-orders",
    description="Ordens de serviço e seu documento operacional flexível.",
)


@SERVICE_ORDERS_BLUEPRINT.get("/stages")
@require_one_of_permissions("service.view_assigned", "service.view_status")
def list_stages():
    return jsonify(serialize_stage_catalog(g.current_user.role))


def _validated_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, (jsonify({"error": "invalid_json"}), 400)
    try:
        data = ServiceOrderInputSchema().load(payload)
    except Exception:
        return None, (jsonify({"error": "validation_failed"}), 400)
    order_number = normalize_order_number(data["orderNumber"])
    if not order_number:
        return None, (jsonify({"error": "order_number_required"}), 400)
    try:
        stage = parse_stage(data["stage"])
    except ValueError as error:
        return None, (jsonify({"error": str(error)}), 400)
    normalized = {
        **payload,
        **data,
        "orderNumber": order_number,
        "stage": stage.value,
    }
    return normalized, None


@SERVICE_ORDERS_BLUEPRINT.get("")
@require_one_of_permissions("service.view_assigned", "service.view_status")
def list_orders():
    database = session()
    try:
        ensure_schema(database)
        orders = list_service_orders(database, request.args.get("status", "").strip())
        role = g.current_user.role
        return jsonify(
            [
                serialize_service_order(order, role)
                if role in {"admin", "mechanic", "pcp"}
                else serialize_service_order_summary(order)
                for order in orders
            ]
        )
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.get("/<order_id>")
@require_one_of_permissions("service.view_assigned", "service.view_status")
def get_order(order_id: str):
    database = session()
    try:
        ensure_schema(database)
        order = find_service_order(database, normalize_order_number(order_id))
        if not order:
            return jsonify({"error": "service_order_not_found"}), 404
        return jsonify(serialize_service_order(order, g.current_user.role))
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.post("")
@require_specific_permission("service.create")
def create_order():
    payload, error = _validated_payload()
    if error:
        return error
    if not can_create_service_order(g.current_user.role, parse_stage(payload["stage"])):
        return jsonify({"error": "service_order_stage_restricted"}), 403
    now = datetime.now(timezone.utc)
    order = ServiceOrder(
        id=payload["orderNumber"],
        order_number=payload["orderNumber"],
        created_by=g.current_user.id,
        status=payload.get("status", "Recebido"),
        stage=payload["stage"],
        payload=payload,
        created_at=now,
        updated_at=now,
    )
    database = session()
    try:
        ensure_schema(database)
        save_service_order(database, order)
        database.commit()
        return jsonify(serialize_service_order(order, g.current_user.role)), 201
    except IntegrityError:
        database.rollback()
        return jsonify({"error": "service_order_already_exists"}), 409
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.put("/<order_id>")
@require_one_of_permissions("service.edit_assigned", "service.update_initial")
def update_order(order_id: str):
    payload, error = _validated_payload()
    if error:
        return error
    normalized_id = normalize_order_number(order_id)
    if normalized_id != payload["orderNumber"]:
        return jsonify({"error": "order_number_cannot_change"}), 400
    database = session()
    try:
        ensure_schema(database)
        order = find_service_order(database, normalized_id)
        if not order:
            return jsonify({"error": "service_order_not_found"}), 404
        if not can_update_service_order(
            g.current_user.role,
            order_stage(order),
            parse_stage(payload["stage"]),
        ):
            return jsonify({"error": "service_order_update_restricted"}), 403
        order.status = payload.get("status", order.status)
        order.stage = payload["stage"]
        order.payload = payload
        order.updated_at = datetime.now(timezone.utc)
        database.commit()
        return jsonify(serialize_service_order(order, g.current_user.role))
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.delete("/<order_id>")
@require_specific_permission("service.edit_assigned")
def delete_order(order_id: str):
    database = session()
    try:
        ensure_schema(database)
        order = find_service_order(database, normalize_order_number(order_id))
        if not order:
            return jsonify({"error": "service_order_not_found"}), 404
        database.delete(order)
        database.commit()
        return "", 204
    finally:
        database.close()


def register_service_orders(app) -> None:
    app.extensions["rkm_openapi"].register_blueprint(SERVICE_ORDERS_BLUEPRINT)

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

from .model import ArrivalMethod, ServiceOrder
from .disassembly import apply_disassembly_transition, is_cylinder
try:
    from ..clients.repository import find_client
    from ..file_storage.repository import find_record_by_id
except ImportError:
    from features.clients.repository import find_client
    from features.file_storage.repository import find_record_by_id
from .policy import (
    can_create_service_order,
    can_update_service_order,
)
from .repository import find_service_order, list_service_orders, save_service_order
from .schema import ServiceOrderInputSchema, normalize_order_number
from .serialization import (
    get_service_order_stage,
    serialize_service_order,
    serialize_service_order_summary,
    serialize_service_order_stage_catalog,
)
from .stages import SERVICE_ORDER_STAGES, STAGE_STATUSES, parse_stage


PCP_RECEIVING_FIELDS = {
    "invoiceNumber",
    "expectedDeliveryDate",
    "urgent",
    "requester",
    "openingDate",
    "receivedBy",
    "deliveredBy",
    "receivedAccessories",
    "cylinderOptionalItems",
    "cylinderOptionalItemsOther",
}

MECHANIC_DISASSEMBLY_FIELDS = {
    "orderNumber", "stage", "status", "updatedAt", "disassemblyAction", "disassemblyIndex",
    "disassemblyOperator", "disassemblyStartedAt", "disassemblyEndedAt", "disassemblyComplete",
    "disassemblyTimingVersion", "disassemblyControlled", "partsSeparated", "oilCollected",
    "disassemblyNotes", "partsDisposition", "disassemblyChecklist", "cylinderOptionalItems",
    "cylinderOptionalItemsOther", "cylinderInternalDiameter", "cylinderExternalDiameter",
    "cylinderLength", "cylinderStroke", "cylinderRodDiameter",
}


def _merge_mechanic_payload(existing: dict, incoming: dict) -> dict:
    merged = {**existing, **{key: value for key, value in incoming.items() if key in MECHANIC_DISASSEMBLY_FIELDS}}
    old_photos = dict(existing.get("photos") or {})
    for category, files in (incoming.get("photos") or {}).items():
        if category == "disassembly" or category.startswith("disassemblyChecklist-"):
            old_photos[category] = files
    merged["photos"] = old_photos
    return merged

def _merge_pcp_receiving_payload(existing: dict, incoming: dict) -> dict:
    """Merge only PCP-owned receiving data into an already advanced order."""
    merged = dict(existing or {})
    for field in PCP_RECEIVING_FIELDS:
        if existing.get("disassemblyTimingVersion") and field in {"cylinderOptionalItems", "cylinderOptionalItemsOther"}:
            continue
        if field in incoming:
            merged[field] = incoming[field]
    existing_photos = dict(merged.get("photos") or {})
    incoming_photos = incoming.get("photos") or {}
    if "arrival" in incoming_photos:
        existing_photos["arrival"] = incoming_photos["arrival"]
    if existing_photos:
        merged["photos"] = existing_photos
    return merged


SERVICE_ORDERS_BLUEPRINT = Blueprint(
    "service_orders",
    __name__,
    url_prefix="/service-orders",
    description="Ordens de serviço e seu documento operacional flexível.",
)


@SERVICE_ORDERS_BLUEPRINT.get("/stages")
@require_one_of_permissions("service.view_assigned", "service.view_status")
def list_stages():
    return jsonify(serialize_service_order_stage_catalog(g.current_user.role))


def _validated_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, None, None, (jsonify({"error": "invalid_json"}), 400)
    try:
        data = ServiceOrderInputSchema().load(payload)
    except Exception:
        return None, None, None, (jsonify({"error": "validation_failed"}), 400)
    order_number = normalize_order_number(data["orderNumber"])
    if not order_number:
        return None, None, None, (jsonify({"error": "order_number_required"}), 400)
    try:
        stage = parse_stage(data["stage"])
    except ValueError as error:
        return None, None, None, (jsonify({"error": str(error)}), 400)
    normalized = {
        **payload,
        **data,
        "orderNumber": order_number,
        "stage": stage.value,
    }
    normalized.pop("clientId", None)
    normalized.pop("invoiceFileId", None)
    normalized.pop("invoiceFile", None)
    normalized.pop("client", None)
    normalized.pop("arrivalMethod", None)
    if g.current_user.role == "pcp":
        for field in (
            "cylinderInternalDiameter",
            "cylinderExternalDiameter",
            "cylinderLength",
            "cylinderStroke",
            "cylinderRodDiameter",
        ):
            normalized.pop(field, None)
    return normalized, data["clientId"], data.get("invoiceFileId"), None


@SERVICE_ORDERS_BLUEPRINT.get("")
@require_one_of_permissions("service.view_assigned", "service.view_status")
def list_orders():
    database = session()
    try:
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
        order = find_service_order(database, normalize_order_number(order_id))
        if not order:
            return jsonify({"error": "service_order_not_found"}), 404
        return jsonify(serialize_service_order(order, g.current_user.role))
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.post("")
@require_specific_permission("service.create")
def create_order():
    raw_payload = request.get_json(silent=True) or {}
    payload, client_id, invoice_file_id, error = _validated_payload()
    if error:
        return error
    if not can_create_service_order(g.current_user.role, parse_stage(payload["stage"])):
        return jsonify({"error": "service_order_stage_restricted"}), 403
    if payload.get("disassemblyAction"):
        return jsonify({"error": "save_order_before_disassembly"}), 409
    if g.current_user.role == "pcp":
        for field in ("disassemblyAction", "disassemblyIndex", "disassemblyStartedAt", "disassemblyEndedAt",
                      "disassemblyComplete", "disassemblyTimingVersion", "disassemblyChecklist"):
            payload.pop(field, None)
    database = session()
    client = find_client(database, client_id)
    if not client:
        database.close()
        return jsonify({"error": "client_required_or_not_found"}), 400
    invoice_file = (
        find_record_by_id(database, invoice_file_id)
        if invoice_file_id
        else None
    )
    if invoice_file_id and not invoice_file:
        database.close()
        return jsonify({"error": "invoice_file_not_found"}), 400
    now = datetime.now(timezone.utc)
    if is_cylinder(payload) and payload["stage"] in {"recebimento", "identificacao", "desmontagem"}:
        payload.pop("disassemblyTimingVersion", None)
        payload["disassemblyStartedAt"] = ""
        payload["disassemblyEndedAt"] = ""
        payload["disassemblyComplete"] = False
        for item in payload.get("disassemblyChecklist") or []:
            if item.get("status") or item.get("firstAssessedAt") or item.get("confirmedAt") or item.get("confirmedBy"):
                database.close()
                return jsonify({"error": "evaluation_before_start"}), 409
    payload["updatedAt"] = now.isoformat()
    order = ServiceOrder(
        id=payload["orderNumber"],
        order_number=payload["orderNumber"],
        client_id=client.id,
        invoice_file_id=invoice_file.id if invoice_file else None,
        created_by=g.current_user.id,
        status=payload.get("status", "Recebido"),
        stage=payload["stage"],
        arrival_method=ArrivalMethod(raw_payload["arrivalMethod"])
        if raw_payload.get("arrivalMethod")
        else None,
        payload=payload,
        created_at=now,
        updated_at=now,
    )
    try:
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
    raw_payload = request.get_json(silent=True) or {}
    payload, client_id, invoice_file_id, error = _validated_payload()
    if error:
        return error
    normalized_id = normalize_order_number(order_id)
    if normalized_id != payload["orderNumber"]:
        return jsonify({"error": "order_number_cannot_change"}), 400
    database = session()
    try:
        order = database.query(ServiceOrder).filter_by(id=normalized_id).with_for_update().one_or_none()
        if not order:
            return jsonify({"error": "service_order_not_found"}), 404
        current_stage = get_service_order_stage(order)
        requested_stage = parse_stage(payload["stage"])
        is_stage_downgrade = SERVICE_ORDER_STAGES.index(requested_stage) < SERVICE_ORDER_STAGES.index(current_stage)
        pcp_receiving_only = (
            g.current_user.role == "pcp" and current_stage not in {parse_stage("recebimento"), parse_stage("identificacao")}
        )
        if is_stage_downgrade:
            target_stage = current_stage
        else:
            target_stage = requested_stage
        if order.payload.get("disassemblyTimingVersion") and payload.get("updatedAt") != order.payload.get("updatedAt"):
            return jsonify({"error": "stale_service_order"}), 409
        if not can_update_service_order(
            g.current_user.role,
            current_stage,
            target_stage,
        ):
            return jsonify({"error": "service_order_update_restricted"}), 403
        if g.current_user.role == "pcp" and payload.get("disassemblyAction"):
            return jsonify({"error": "service_order_update_restricted"}), 403
        if order.payload.get("disassemblyTimingVersion") and payload.get("orderType") != order.payload.get("orderType"):
            return jsonify({"error": "disassembly_preparation_locked"}), 409
        if pcp_receiving_only:
            payload = _merge_pcp_receiving_payload(order.payload, payload)
        elif g.current_user.role == "mechanic":
            payload = _merge_mechanic_payload(order.payload, payload)
        transition_error = apply_disassembly_transition(
            order.payload, payload, g.current_user, current_stage.value, target_stage.value
        )
        if transition_error:
            return jsonify({"error": transition_error}), 409
        if pcp_receiving_only:
            payload["stage"] = current_stage.value
            payload["status"] = order.status
        else:
            order.status = payload.get("status", order.status)
            order.stage = target_stage.value
        if is_stage_downgrade:
            payload["stage"] = target_stage.value
            payload["status"] = STAGE_STATUSES[target_stage]
            order.status = STAGE_STATUSES[target_stage]
            order.stage = target_stage.value
        client = find_client(database, client_id)
        if not client:
            return jsonify({"error": "client_required_or_not_found"}), 400
        invoice_file = (
            find_record_by_id(database, invoice_file_id)
            if invoice_file_id
            else None
        )
        if invoice_file_id and not invoice_file:
            return jsonify({"error": "invoice_file_not_found"}), 400
        if g.current_user.role != "mechanic":
            order.client_id = client.id
            order.invoice_file_id = invoice_file.id if invoice_file else None
            order.arrival_method = (
                ArrivalMethod(raw_payload["arrivalMethod"])
                if raw_payload.get("arrivalMethod")
                else None
            )
        order.updated_at = datetime.now(timezone.utc)
        payload["updatedAt"] = order.updated_at.isoformat()
        order.payload = payload
        database.commit()
        return jsonify(serialize_service_order(order, g.current_user.role))
    finally:
        database.close()


@SERVICE_ORDERS_BLUEPRINT.delete("/<order_id>")
@require_specific_permission("service.edit_assigned")
def delete_order(order_id: str):
    database = session()
    try:
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

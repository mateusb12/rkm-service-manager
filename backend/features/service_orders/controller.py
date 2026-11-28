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
from . import service_order_orchestrator as orchestrator
from .disassembly import is_cylinder
try:
    from ..clients.repository import find_client
    from ..file_storage.repository import find_record_by_id
except ImportError:
    from features.clients.repository import find_client
    from features.file_storage.repository import find_record_by_id
from .policy import can_create_service_order
from .repository import find_service_order, list_service_orders, save_service_order
from .schema import ServiceOrderInputSchema, normalize_order_number
from .serialization import (
    serialize_service_order,
    serialize_service_order_summary,
    serialize_service_order_stage_catalog,
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
    return jsonify(serialize_service_order_stage_catalog(g.current_user.role))


def _validated_payload():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return None, None, None, (jsonify({"error": "invalid_json"}), 400)
    if payload.get("arrivalMethod") == "":
        payload["arrivalMethod"] = None
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
        workflow = orchestrator.update_service_order(
            order.payload, payload, g.current_user, current_status=order.status
        )
        if workflow.error:
            status_code = 403 if workflow.error == "service_order_update_restricted" else 409
            return jsonify({"error": workflow.error}), status_code
        payload = workflow.payload
        order.status = payload.get("status", order.status)
        order.stage = workflow.stage.value
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

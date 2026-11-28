"""Role-aware service order serialization."""

from __future__ import annotations

from typing import Any, Callable
from datetime import timezone

from .model import ServiceOrder
from ..file_storage.model import serialize_file
from .policy import MECHANIC_EDITABLE_STAGE, MECHANIC_REPAIR_STAGE, ServiceOrderSection, visible_sections
from .stages import SERVICE_ORDER_STAGES, STAGE_LABELS, STAGE_STATUSES, ServiceOrderStage


def _utc_iso(value):
    return value.replace(tzinfo=value.tzinfo or timezone.utc).astimezone(timezone.utc).isoformat() if value else None


def serialize_service_order_stage_catalog(role: str) -> list[dict[str, Any]]:
    initial_stage_ids = {ServiceOrderStage.RECEBIMENTO, ServiceOrderStage.IDENTIFICACAO}
    can_access_all = role == "admin"
    can_create_or_update = role in {"admin", "mechanic", "pcp"}

    return [
        {
            "id": stage.value,
            "label": STAGE_LABELS[stage],
            "status": STAGE_STATUSES[stage],
            "position": position,
            "canView": can_access_all
            or (role == "mechanic" and stage not in initial_stage_ids)
            or (role == "pcp" and stage in initial_stage_ids),
            "canEdit": can_access_all
            or (role == "mechanic" and stage in {MECHANIC_EDITABLE_STAGE, MECHANIC_REPAIR_STAGE})
            or (role == "pcp" and stage in initial_stage_ids),
            "canComplete": can_access_all
            or (role == "mechanic" and stage in {MECHANIC_EDITABLE_STAGE, MECHANIC_REPAIR_STAGE})
            or (role == "pcp" and stage in initial_stage_ids),
            "canAdvanceTo": can_create_or_update
            and (
                can_access_all
                or (role == "pcp" and (stage in initial_stage_ids or stage == ServiceOrderStage.DESMONTAGEM))
                or (role == "mechanic" and stage == MECHANIC_EDITABLE_STAGE)
            ),
        }
        for position, stage in enumerate(SERVICE_ORDER_STAGES, start=1)
    ]


def _section(
    payload: dict[str, Any],
    fields: tuple[str, ...],
    photo_category: str | None = None,
    photo_category_prefixes: tuple[str, ...] = (),
) -> dict[str, Any]:
    result = {field: payload[field] for field in fields if field in payload}
    if photo_category:
        photos = payload.get("photos") or {}
        result["photos"] = {
            category: files
            for category, files in photos.items()
            if category == photo_category
            or any(category.startswith(prefix) for prefix in photo_category_prefixes)
        }
    return result


def _build_service_order_payload(order: ServiceOrder) -> dict[str, Any]:
    payload = dict(order.payload or {})
    if order.client:
        payload["client"] = order.client.nome_fantasia or order.client.razao_social
    payload["clientId"] = order.client_id
    payload["invoiceFileId"] = order.invoice_file_id
    payload["invoiceFile"] = serialize_file(order.invoice_file) if order.invoice_file else None
    if order.arrival_method:
        payload["arrivalMethod"] = order.arrival_method.value
    return payload


SECTION_SERIALIZERS: dict[ServiceOrderSection, Callable[[dict[str, Any]], dict[str, Any]]] = {
    ServiceOrderSection.RECEBIMENTO: lambda payload: _section(
        payload,
        (
            "client", "orderNumber", "invoiceNumber", "invoiceFileId", "invoiceFile",
            "expectedDeliveryDate", "urgent",
            "requester", "openingDate", "arrivalMethod", "receivedBy", "deliveredBy",
            "receivedAccessories",
        ),
        "arrival",
    ),
    ServiceOrderSection.IDENTIFICACAO: lambda payload: _section(
        payload,
        (
            "orderType", "clientReference", "equipment", "claimedDefect", "hydraulic", "pneumatic", "fluidApplication",
            "equipmentLocation", "cylinderOptionalItems", "cylinderOptionalItemsOther",
        ),
    ),
    ServiceOrderSection.DESMONTAGEM: lambda payload: _section(
        payload,
        (
            "disassemblyOperator", "disassemblyStartedAt", "disassemblyEndedAt", "disassemblyComplete", "disassemblyTimingVersion",
            "disassemblyControlled", "partsSeparated", "oilCollected", "disassemblyNotes",
            "partsDisposition", "disassemblyChecklist", "cylinderInternalDiameter", "cylinderExternalDiameter",
            "cylinderLength", "cylinderStroke", "cylinderRodDiameter", "cylinderOptionalItems", "cylinderOptionalItemsOther",
        ),
        "disassembly",
        ("disassemblyChecklist-",),
    ),
    ServiceOrderSection.ORCAMENTO: lambda payload: _section(
        payload,
        (
            "diagnosis", "measurements", "repairRecommendation", "approvalRequired",
            "approvalStatus", "materialStatus", "approvalReference",
        ),
        "diagnosis",
    ),
    ServiceOrderSection.REPARO: lambda payload: _section(
        payload,
        (
            "repairMechanic", "repairMechanicAssignedAt", "repairMechanicAssignedBy", "repairStartedAt",
            "repairTimingVersion", "repairCompletedAt", "workPerformed", "testResult", "qualityApproved",
            "disassemblyChecklist",
        ),
        "execution",
    ),
    ServiceOrderSection.ENTREGA: lambda payload: _section(
        payload,
        ("dispatchMethod", "dispatchReference", "dispatchNotes", "dispatched"),
        "dispatch",
    ),
}


def get_service_order_stage(order: ServiceOrder) -> ServiceOrderStage:
    return ServiceOrderStage(order.stage)


def serialize_service_order_summary(order: ServiceOrder) -> dict[str, Any]:
    payload = _build_service_order_payload(order)
    stage = get_service_order_stage(order)
    return {
        "id": order.id,
        "orderNumber": order.order_number,
        "createdAt": _utc_iso(order.created_at),
        "createdBy": {
            "id": order.created_by,
            "name": order.created_by_user.name if order.created_by_user else "",
        },
        "client": payload.get("client", ""),
        "clientId": order.client_id,
        "arrivalMethod": order.arrival_method.value if order.arrival_method else None,
        "clientDetails": {
            "id": order.client.id,
            "razaoSocial": order.client.razao_social,
            "nomeFantasia": order.client.nome_fantasia,
        } if order.client else None,
        "invoiceFileId": order.invoice_file_id,
        "invoiceFile": serialize_file(order.invoice_file) if order.invoice_file else None,
        "orderType": payload.get("orderType", ""),
        "equipment": payload.get("equipment", ""),
        "status": order.status,
        "stage": stage.value,
        "stageLabel": STAGE_LABELS[stage],
        "updatedAt": _utc_iso(order.updated_at),
    }


def serialize_service_order(order: ServiceOrder, role: str) -> dict[str, Any]:
    payload = _build_service_order_payload(order)
    stage = get_service_order_stage(order)
    result = {
        **serialize_service_order_summary(order),
        "createdAt": _utc_iso(order.created_at),
    }
    if role == "pcp":
        result["availableThroughStage"] = ServiceOrderStage.IDENTIFICACAO.value
    for section in visible_sections(role):
        section_payload = SECTION_SERIALIZERS[section](payload)
        result[section.value] = section_payload
        if role in {"pcp", "mechanic"}:
            # Keep the current form compatible while exposing only permitted fields.
            if "photos" in section_payload:
                section_payload = {**section_payload, "photos": {**result.get("photos", {}), **section_payload["photos"]}}
            result.update(section_payload)

    # Keep the existing flat response for roles that can inspect the full OS.
    if role == "admin":
        result.update(payload)
        result.update(
            {
                "id": order.id,
                "orderNumber": order.order_number,
                "status": order.status,
                "stage": stage.value,
                "stageLabel": STAGE_LABELS[stage],
                "createdAt": _utc_iso(order.created_at),
                "updatedAt": _utc_iso(order.updated_at),
            }
        )
    return result

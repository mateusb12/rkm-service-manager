"""Role-aware service order serialization."""

from __future__ import annotations

from typing import Any, Callable

from .model import ServiceOrder
from .policy import ServiceOrderSection, visible_sections
from .stages import SERVICE_ORDER_STAGES, STAGE_LABELS, STAGE_STATUSES, ServiceOrderStage


def serialize_service_order_stage_catalog(role: str) -> list[dict[str, Any]]:
    initial_stage_ids = {ServiceOrderStage.RECEBIMENTO, ServiceOrderStage.IDENTIFICACAO}
    can_access_all = role in {"admin", "mechanic"}
    can_create_or_update = role in {"admin", "mechanic", "pcp"}

    return [
        {
            "id": stage.value,
            "label": STAGE_LABELS[stage],
            "status": STAGE_STATUSES[stage],
            "position": position,
            "canView": can_access_all or stage in initial_stage_ids,
            "canEdit": can_access_all or stage in initial_stage_ids,
            "canComplete": can_access_all or stage in initial_stage_ids,
            "canAdvanceTo": can_create_or_update
            and (can_access_all or stage in initial_stage_ids or stage == ServiceOrderStage.DESMONTAGEM),
        }
        for position, stage in enumerate(SERVICE_ORDER_STAGES, start=1)
    ]


def _section(
    payload: dict[str, Any],
    fields: tuple[str, ...],
    photo_category: str | None = None,
) -> dict[str, Any]:
    result = {field: payload[field] for field in fields if field in payload}
    if photo_category:
        result["photos"] = {
            photo_category: (payload.get("photos") or {}).get(photo_category, [])
        }
    return result


def _build_service_order_payload(order: ServiceOrder) -> dict[str, Any]:
    payload = dict(order.payload or {})
    if order.client:
        payload["client"] = order.client.nome_fantasia or order.client.razao_social
    payload["clientId"] = order.client_id
    if order.arrival_method:
        payload["arrivalMethod"] = order.arrival_method.value
    return payload


SECTION_SERIALIZERS: dict[ServiceOrderSection, Callable[[dict[str, Any]], dict[str, Any]]] = {
    ServiceOrderSection.RECEBIMENTO: lambda payload: _section(
        payload,
        (
            "client", "orderNumber", "invoiceNumber", "expectedDeliveryDate", "urgent",
            "requester", "openingDate", "arrivalMethod", "receivedBy", "deliveredBy",
            "receivedAccessories",
        ),
        "arrival",
    ),
    ServiceOrderSection.IDENTIFICACAO: lambda payload: _section(
        payload,
        (
            "orderType", "clientReference", "serialNumber", "manufacturer", "equipment",
            "model", "claimedDefect", "hydraulic", "pneumatic", "fluidApplication",
            "equipmentLocation",
        ),
    ),
    ServiceOrderSection.DESMONTAGEM: lambda payload: _section(
        payload,
        (
            "disassemblyOperator", "disassemblyStartedAt", "disassemblyComplete",
            "disassemblyControlled", "partsSeparated", "oilCollected", "disassemblyNotes",
            "partsDisposition",
        ),
        "disassembly",
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
        payload, ("workPerformed", "testResult", "qualityApproved"), "execution"
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
        "createdAt": order.created_at.isoformat() if order.created_at else None,
        "createdBy": {
            "id": order.created_by,
            "name": order.created_by_user.name if order.created_by_user else "",
        },
        "client": payload.get("client", ""),
        "clientId": order.client_id,
        "clientDetails": {
            "id": order.client.id,
            "razaoSocial": order.client.razao_social,
            "nomeFantasia": order.client.nome_fantasia,
        } if order.client else None,
        "equipment": payload.get("equipment", ""),
        "status": order.status,
        "stage": stage.value,
        "stageLabel": STAGE_LABELS[stage],
        "updatedAt": order.updated_at.isoformat() if order.updated_at else None,
    }


def serialize_service_order(order: ServiceOrder, role: str) -> dict[str, Any]:
    payload = _build_service_order_payload(order)
    stage = get_service_order_stage(order)
    result = {
        **serialize_service_order_summary(order),
        "createdAt": order.created_at.isoformat() if order.created_at else None,
    }
    if role == "pcp":
        result["availableThroughStage"] = ServiceOrderStage.IDENTIFICACAO.value
    for section in visible_sections(role):
        section_payload = SECTION_SERIALIZERS[section](payload)
        result[section.value] = section_payload
        if role == "pcp":
            # Keep the current form compatible while exposing only permitted fields.
            result.update(section_payload)

    # Keep the existing flat response for roles that can inspect the full OS.
    if role in {"admin", "mechanic"}:
        result.update(payload)
        result.update(
            {
                "id": order.id,
                "orderNumber": order.order_number,
                "status": order.status,
                "stage": stage.value,
                "stageLabel": STAGE_LABELS[stage],
                "createdAt": order.created_at.isoformat() if order.created_at else None,
                "updatedAt": order.updated_at.isoformat() if order.updated_at else None,
            }
        )
    return result

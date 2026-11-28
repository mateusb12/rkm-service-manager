"""Coordinate service-order workflow updates and server-owned transitions."""

from __future__ import annotations

from dataclasses import dataclass

from .disassembly import apply_disassembly_transition
from .policy import can_update_service_order
from .repair import apply_repair_transition
from .stages import SERVICE_ORDER_STAGES, STAGE_STATUSES, ServiceOrderStage, parse_stage


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

MECHANIC_REPAIR_FIELDS = {
    "orderNumber", "stage", "status", "updatedAt", "repairAction", "repairComponent", "repairLineIndex",
    "repairMechanic", "repairMechanicAssignedAt", "repairMechanicAssignedBy", "repairStartedAt",
    "repairTimingVersion", "repairCompletedAt", "workPerformed", "testResult",
    "qualityApproved", "disassemblyChecklist",
}

SERVER_TIMED_WORK = (
    "disassemblyTimingVersion",
    "repairMechanicAssignedAt",
    "repairTimingVersion",
)


@dataclass(frozen=True)
class ServiceOrderUpdateResult:
    error: str | None
    stage: ServiceOrderStage
    payload: dict


def _merge_mechanic_payload(existing: dict, incoming: dict, current_stage: ServiceOrderStage) -> dict:
    allowed_fields = MECHANIC_REPAIR_FIELDS if current_stage == ServiceOrderStage.REPARO else MECHANIC_DISASSEMBLY_FIELDS
    merged = {**existing, **{key: value for key, value in incoming.items() if key in allowed_fields}}
    old_photos = dict(existing.get("photos") or {})
    for category, files in (incoming.get("photos") or {}).items():
        if current_stage == ServiceOrderStage.REPARO and category == "execution":
            old_photos[category] = files
        elif current_stage != ServiceOrderStage.REPARO and (
            category == "disassembly" or category.startswith("disassemblyChecklist-")
        ):
            old_photos[category] = files
    merged["photos"] = old_photos
    return merged


def _merge_pcp_receiving_payload(existing: dict, incoming: dict) -> dict:
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


def update_service_order(existing: dict, incoming: dict, user, current_status: str) -> ServiceOrderUpdateResult:
    """Coordinate one service-order update through its role and transition rules."""
    current_stage = parse_stage(existing.get("stage", "recebimento"))
    requested_stage = parse_stage(incoming["stage"])
    is_downgrade = SERVICE_ORDER_STAGES.index(requested_stage) < SERVICE_ORDER_STAGES.index(current_stage)
    target_stage = current_stage if is_downgrade else requested_stage
    pcp_receiving_only = user.role == "pcp" and current_stage not in {
        ServiceOrderStage.RECEBIMENTO,
        ServiceOrderStage.IDENTIFICACAO,
    }

    has_server_owned_work = any(existing.get(field) for field in SERVER_TIMED_WORK)
    has_transition_action = incoming.get("disassemblyAction") or incoming.get("repairAction")
    if (has_server_owned_work or has_transition_action) and incoming.get("updatedAt") != existing.get("updatedAt"):
        return ServiceOrderUpdateResult("stale_service_order", current_stage, incoming)
    if not can_update_service_order(user.role, current_stage, target_stage):
        return ServiceOrderUpdateResult("service_order_update_restricted", current_stage, incoming)
    if user.role == "pcp" and incoming.get("disassemblyAction"):
        return ServiceOrderUpdateResult("service_order_update_restricted", current_stage, incoming)
    if existing.get("disassemblyTimingVersion") and incoming.get("orderType") != existing.get("orderType"):
        return ServiceOrderUpdateResult("disassembly_preparation_locked", current_stage, incoming)

    if pcp_receiving_only:
        incoming = _merge_pcp_receiving_payload(existing, incoming)
    elif user.role == "mechanic":
        incoming = _merge_mechanic_payload(existing, incoming, current_stage)

    error = apply_disassembly_transition(
        existing, incoming, user, current_stage.value, target_stage.value
    )
    if error:
        return ServiceOrderUpdateResult(error, current_stage, incoming)

    error = apply_repair_transition(
        existing, incoming, user, current_stage.value, target_stage.value
    )
    if error:
        return ServiceOrderUpdateResult(error, current_stage, incoming)

    if incoming.get("stage") != requested_stage.value:
        target_stage = parse_stage(incoming["stage"])
    elif is_downgrade:
        target_stage = current_stage
    else:
        target_stage = requested_stage
    if pcp_receiving_only:
        incoming["stage"] = current_stage.value
        incoming["status"] = current_status
        target_stage = current_stage
    elif is_downgrade:
        incoming["stage"] = target_stage.value
        incoming["status"] = STAGE_STATUSES[target_stage]

    return ServiceOrderUpdateResult(None, target_stage, incoming)

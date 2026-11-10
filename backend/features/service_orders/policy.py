"""Visibility policy for service order representations."""

from __future__ import annotations

from enum import StrEnum

from .stages import ServiceOrderStage


class ServiceOrderSection(StrEnum):
    RECEBIMENTO = "receiving"
    IDENTIFICACAO = "identification"
    DESMONTAGEM = "disassembly"
    ORCAMENTO = "budget"
    REPARO = "repair"
    ENTREGA = "delivery"


INITIAL_STAGES = {
    ServiceOrderStage.RECEBIMENTO,
    ServiceOrderStage.IDENTIFICACAO,
}

MECHANIC_EDITABLE_STAGE = ServiceOrderStage.DESMONTAGEM


def can_view_service_order_details(role: str, stage: ServiceOrderStage) -> bool:
    if role == "admin":
        return True
    if role == "mechanic":
        return stage not in INITIAL_STAGES
    return role == "pcp" and stage in INITIAL_STAGES


def can_create_service_order(role: str, stage: ServiceOrderStage) -> bool:
    return role == "admin" or (
        role == "mechanic" and stage == MECHANIC_EDITABLE_STAGE
    ) or (role == "pcp" and stage in INITIAL_STAGES)


def can_update_service_order(
    role: str,
    current_stage: ServiceOrderStage,
    target_stage: ServiceOrderStage,
) -> bool:
    if role == "admin":
        return True
    if role == "mechanic":
        return current_stage == MECHANIC_EDITABLE_STAGE and target_stage == MECHANIC_EDITABLE_STAGE
    if role != "pcp":
        return False
    if current_stage in INITIAL_STAGES:
        return target_stage in {
            ServiceOrderStage.RECEBIMENTO,
            ServiceOrderStage.IDENTIFICACAO,
            ServiceOrderStage.DESMONTAGEM,
        }
    # PCP may return to its receiving section without reopening the workflow.
    return target_stage == current_stage


def visible_sections(role: str) -> set[ServiceOrderSection]:
    if role == "admin":
        return set(ServiceOrderSection)
    if role == "mechanic":
        return {
            ServiceOrderSection.DESMONTAGEM,
            ServiceOrderSection.ORCAMENTO,
            ServiceOrderSection.REPARO,
            ServiceOrderSection.ENTREGA,
        }
    if role == "pcp":
        return {
            ServiceOrderSection.RECEBIMENTO,
            ServiceOrderSection.IDENTIFICACAO,
        }
    return set()

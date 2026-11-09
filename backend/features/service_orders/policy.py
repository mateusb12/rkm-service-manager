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


def can_view_service_order_details(role: str, stage: ServiceOrderStage) -> bool:
    return role in {"admin", "mechanic"} or (
        role == "pcp" and stage in INITIAL_STAGES
    )


def can_create_service_order(role: str, stage: ServiceOrderStage) -> bool:
    return role in {"admin", "mechanic"} or (
        role == "pcp" and stage in INITIAL_STAGES
    )


def can_update_service_order(
    role: str,
    current_stage: ServiceOrderStage,
    target_stage: ServiceOrderStage,
) -> bool:
    if role in {"admin", "mechanic"}:
        return True
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
    if role in {"admin", "mechanic"}:
        return set(ServiceOrderSection)
    if role == "pcp":
        return {
            ServiceOrderSection.RECEBIMENTO,
            ServiceOrderSection.IDENTIFICACAO,
        }
    return set()

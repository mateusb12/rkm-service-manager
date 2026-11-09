"""Service order stage vocabulary."""

from __future__ import annotations

from enum import StrEnum


class ServiceOrderStage(StrEnum):
    RECEBIMENTO = "recebimento"
    IDENTIFICACAO = "identificacao"
    DESMONTAGEM = "desmontagem"
    ORCAMENTO = "orcamento"
    REPARO = "reparo"
    ENTREGA = "entrega"


STAGE_LABELS = {
    ServiceOrderStage.RECEBIMENTO: "Recebimento",
    ServiceOrderStage.IDENTIFICACAO: "Identificação",
    ServiceOrderStage.DESMONTAGEM: "Desmontagem",
    ServiceOrderStage.ORCAMENTO: "Orçamento",
    ServiceOrderStage.REPARO: "Reparo",
    ServiceOrderStage.ENTREGA: "Entrega",
}

STAGE_STATUSES = {
    ServiceOrderStage.RECEBIMENTO: "Recebido",
    ServiceOrderStage.IDENTIFICACAO: "Em identificação",
    ServiceOrderStage.DESMONTAGEM: "Em desmontagem",
    ServiceOrderStage.ORCAMENTO: "Em orçamento",
    ServiceOrderStage.REPARO: "Em reparo",
    ServiceOrderStage.ENTREGA: "Em entrega",
}

SERVICE_ORDER_STAGES = tuple(ServiceOrderStage)


def parse_stage(value: str) -> ServiceOrderStage:
    try:
        return ServiceOrderStage(value)
    except ValueError as error:
        raise ValueError("invalid_service_order_stage") from error

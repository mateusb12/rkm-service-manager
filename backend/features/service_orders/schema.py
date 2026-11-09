"""Validation for service order requests."""

from __future__ import annotations

from typing import Any

from marshmallow import INCLUDE, Schema, fields, validate

from .model import ArrivalMethod


class ServiceOrderInputSchema(Schema):
    class Meta:
        unknown = INCLUDE

    orderNumber = fields.String(required=True, validate=validate.Length(min=1, max=80))
    status = fields.String(load_default="Recebido", validate=validate.Length(min=1, max=120))
    stage = fields.String(load_default="recebimento", validate=validate.Length(min=1, max=80))
    arrivalMethod = fields.String(
        allow_none=True,
        load_default=None,
        validate=validate.OneOf([method.value for method in ArrivalMethod]),
    )


def normalize_order_number(value: Any) -> str:
    clean = str(value or "").strip().upper()
    if not clean:
        return ""
    return clean if clean.startswith("OS-") else f"OS-{clean}"

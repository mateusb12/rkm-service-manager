"""Request and response schemas for the price catalog API."""

from __future__ import annotations

from marshmallow import Schema, fields, validate, validates_schema, ValidationError


PRICE_CATALOG_TYPES = ("material", "service")
PRICE_CATALOG_UNITS = ("un", "h", "m", "m²", "kg", "L")


class PriceCatalogInputSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=160))
    unit = fields.String(required=True, validate=validate.OneOf(PRICE_CATALOG_UNITS))
    unit_price_cents = fields.Integer(required=True, data_key="unitPriceCents", validate=validate.Range(min=0))
    description = fields.String(required=True, allow_none=False, validate=validate.Length(max=500))
    type = fields.String(required=True, validate=validate.OneOf(PRICE_CATALOG_TYPES))

    @validates_schema
    def validate_service_unit(self, data: dict, **kwargs) -> None:
        if data.get("type") == "service" and data.get("unit") != "h":
            raise ValidationError({"unit": ["Serviços devem usar hora como unidade."]})


class PriceCatalogOpenAPISchema(Schema):
    id = fields.Integer(required=True)
    name = fields.String(required=True)
    unit = fields.String(required=True)
    unit_price_cents = fields.Integer(required=True, data_key="unitPriceCents")
    description = fields.String(required=True)
    type = fields.String(required=True)

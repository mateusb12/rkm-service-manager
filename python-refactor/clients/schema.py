"""Request schemas and validation for the clients API."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from marshmallow import Schema, fields, validate, validates_schema, ValidationError


class SchemaError(ValueError):
    def __init__(self, error: str, fields: dict[str, str] | None = None):
        self.error = error
        self.fields = fields or {}
        super().__init__(error)


def _ensure_object(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise SchemaError("invalid_json")
    if set(payload) - {"cnpj", "razaoSocial", "nomeFantasia"}:
        raise SchemaError("invalid_json")
    return payload


@dataclass(frozen=True)
class ClientSchema:
    cnpj: str
    razao_social: str
    nome_fantasia: str

    @classmethod
    def from_payload(cls, payload: Any) -> "ClientSchema":
        data = _ensure_object(payload)
        raw_cnpj = str(data.get("cnpj", "") or "").strip()
        cnpj = re.sub(r"\D", "", raw_cnpj)
        razao_social = str(data.get("razaoSocial", "") or "").strip()
        nome_fantasia = str(data.get("nomeFantasia", "") or "").strip()
        fields: dict[str, str] = {}

        if not raw_cnpj:
            fields["cnpj"] = "Informe o CNPJ."
        elif not re.fullmatch(r"[0-9 ./-]+", raw_cnpj):
            fields["cnpj"] = "O CNPJ deve conter apenas números e os caracteres de formatação . / -."
        elif len(cnpj) != 14:
            fields["cnpj"] = "O CNPJ deve conter 14 dígitos."
        if not razao_social:
            fields["razaoSocial"] = "Informe a razão social."
        elif len(razao_social) > 160:
            fields["razaoSocial"] = "A razão social deve ter no máximo 160 caracteres."
        if not nome_fantasia:
            fields["nomeFantasia"] = "Informe o nome fantasia."
        elif len(nome_fantasia) > 120:
            fields["nomeFantasia"] = "O nome fantasia deve ter no máximo 120 caracteres."
        if fields:
            raise SchemaError("validation_failed", fields)
        return cls(cnpj, razao_social, nome_fantasia)


def normalize_search(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value.strip().lower())
    return "".join(char for char in decomposed if not unicodedata.combining(char))


class ClientInputOpenAPISchema(Schema):
    cnpj = fields.String(required=True, metadata={"example": "10.203.040/0001-50"})
    razao_social = fields.String(
        required=True,
        data_key="razaoSocial",
        validate=validate.Length(min=1, max=160),
    )
    nome_fantasia = fields.String(
        required=True,
        data_key="nomeFantasia",
        validate=validate.Length(min=1, max=120),
    )

    @validates_schema
    def validate_client(self, data: dict[str, Any], **kwargs) -> None:
        raw_cnpj = str(data.get("cnpj", "")).strip()
        if not re.fullmatch(r"[0-9 ./-]+", raw_cnpj):
            raise ValidationError({"cnpj": ["O CNPJ deve conter apenas números e os caracteres de formatação . / -."]})
        if len(re.sub(r"\D", "", raw_cnpj)) != 14:
            raise ValidationError({"cnpj": ["O CNPJ deve conter 14 dígitos."]})


class ClientOpenAPISchema(Schema):
    id = fields.Integer(required=True)
    cnpj = fields.String(required=True)
    razao_social = fields.String(required=True, data_key="razaoSocial")
    nome_fantasia = fields.String(required=True, data_key="nomeFantasia")

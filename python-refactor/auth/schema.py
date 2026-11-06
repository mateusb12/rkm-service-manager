"""Request schemas and validation for the authentication API."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .model import ADMIN_ROLE_LABELS


class SchemaError(ValueError):
    def __init__(self, error: str, fields: dict[str, str] | None = None):
        self.error = error
        self.fields = fields or {}
        super().__init__(error)


def _ensure_object(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise SchemaError("invalid_json")
    return payload


def _reject_unknown(payload: dict[str, Any], allowed: set[str]) -> None:
    if set(payload) - allowed:
        raise SchemaError("invalid_json")


def _email(value: Any) -> str:
    result = str(value or "").strip().lower()
    if "@" not in result or any(char.isspace() for char in result):
        raise SchemaError("validation_failed", {"email": "Informe um e-mail válido."})
    return result


def _role(value: Any) -> str:
    result = str(value or "").strip()
    if result not in ADMIN_ROLE_LABELS:
        raise SchemaError("validation_failed", {"role": "Informe um perfil válido."})
    return result


@dataclass(frozen=True)
class LoginSchema:
    email: str
    password: str

    @classmethod
    def from_payload(cls, payload: Any) -> "LoginSchema":
        data = _ensure_object(payload)
        _reject_unknown(data, {"email", "password"})
        email = str(data.get("email", "")).strip().lower()
        password = data.get("password", "")
        if not email or not password:
            raise SchemaError("email_and_password_required")
        return cls(email=email, password=str(password))


@dataclass(frozen=True)
class CreateUserSchema:
    name: str
    email: str
    role: str
    password: str

    @classmethod
    def from_payload(cls, payload: Any) -> "CreateUserSchema":
        data = _ensure_object(payload)
        _reject_unknown(data, {"name", "email", "role", "password"})
        fields = {}
        name = str(data.get("name", "")).strip()
        if not name:
            fields["name"] = "Informe o nome."
        try:
            email = _email(data.get("email"))
        except SchemaError as error:
            fields.update(error.fields)
            email = ""
        try:
            role = _role(data.get("role"))
        except SchemaError as error:
            fields.update(error.fields)
            role = ""
        password = str(data.get("password", ""))
        if len(password) < 8:
            fields["password"] = "A senha deve ter pelo menos 8 caracteres."
        if fields:
            raise SchemaError("validation_failed", fields)
        return cls(name=name, email=email, role=role, password=password)


@dataclass(frozen=True)
class UpdateUserSchema:
    changes: dict[str, str]

    @classmethod
    def from_payload(cls, payload: Any) -> "UpdateUserSchema":
        data = _ensure_object(payload)
        _reject_unknown(data, {"name", "email", "role", "password"})
        if not data:
            raise SchemaError("validation_failed", {"user": "Informe ao menos um campo para atualizar."})
        fields = {}
        changes: dict[str, str] = {}
        if "name" in data:
            changes["name"] = str(data["name"]).strip()
            if not changes["name"]:
                fields["name"] = "Informe o nome."
        if "email" in data:
            try:
                changes["email"] = _email(data["email"])
            except SchemaError as error:
                fields.update(error.fields)
        if "role" in data:
            try:
                changes["role"] = _role(data["role"])
            except SchemaError as error:
                fields.update(error.fields)
        if "password" in data:
            password = str(data["password"])
            if len(password) < 8:
                fields["password"] = "A senha deve ter pelo menos 8 caracteres."
            else:
                changes["password_hash"] = password
        if fields:
            raise SchemaError("validation_failed", fields)
        return cls(changes=changes)


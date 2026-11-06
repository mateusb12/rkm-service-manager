"""Flask controllers for the clients API."""

from __future__ import annotations

from flask import jsonify, request
from flask_smorest import Blueprint
from sqlalchemy.exc import IntegrityError

try:
    from ..auth.controller import require_permission, schema_error_response
    from ..auth.repository import session
except ImportError:
    from features.auth.controller import require_permission, schema_error_response
    from features.auth.repository import session

from .model import Client, serialize_client
from .repository import (
    create_client as create_client_record,
    delete_client as delete_client_record,
    find_client,
    list_clients as list_client_records,
)
from .schema import ClientInputOpenAPISchema, ClientOpenAPISchema, ClientSchema, SchemaError


CLIENTS_BLUEPRINT = Blueprint(
    "clients",
    __name__,
    url_prefix="/clients",
    description="Cadastro e consulta de clientes.",
)


def _client_id(value: str) -> int | None:
    try:
        client_id = int(value)
    except ValueError:
        return None
    return client_id if client_id > 0 else None


@CLIENTS_BLUEPRINT.get("")
@CLIENTS_BLUEPRINT.response(200, ClientOpenAPISchema(many=True))
@require_permission("clients.view")
def list_clients():
    return jsonify([serialize_client(client) for client in list_client_records(request.args.get("search", ""))])


@CLIENTS_BLUEPRINT.get("/<client_id>")
@CLIENTS_BLUEPRINT.response(200, ClientOpenAPISchema)
@require_permission("clients.view")
def get_client(client_id: str):
    parsed_id = _client_id(client_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_client_id"}), 400
    database = session()
    try:
        client = find_client(database, parsed_id)
        return jsonify(serialize_client(client)) if client else (jsonify({"error": "client_not_found"}), 404)
    finally:
        database.close()


@CLIENTS_BLUEPRINT.post("")
@CLIENTS_BLUEPRINT.arguments(ClientInputOpenAPISchema, error_status_code=400)
@CLIENTS_BLUEPRINT.response(201, ClientOpenAPISchema)
@require_permission("clients.manage")
def create_client(data):
    try:
        parsed = ClientSchema.from_payload(
            {
                "cnpj": data["cnpj"],
                "razaoSocial": data["razao_social"],
                "nomeFantasia": data["nome_fantasia"],
            }
        )
    except SchemaError as error:
        return schema_error_response(error)
    database = session()
    try:
        client = create_client_record(database, Client(cnpj=parsed.cnpj, razao_social=parsed.razao_social, nome_fantasia=parsed.nome_fantasia))
        database.commit()
        return jsonify(serialize_client(client)), 201
    except IntegrityError:
        return jsonify({"error": "cnpj_already_exists"}), 409
    finally:
        database.close()


@CLIENTS_BLUEPRINT.put("/<client_id>")
@CLIENTS_BLUEPRINT.arguments(ClientInputOpenAPISchema, error_status_code=400)
@CLIENTS_BLUEPRINT.response(200, ClientOpenAPISchema)
@require_permission("clients.manage")
def update_client(data, client_id: str):
    parsed_id = _client_id(client_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_client_id"}), 400
    try:
        parsed = ClientSchema.from_payload(
            {
                "cnpj": data["cnpj"],
                "razaoSocial": data["razao_social"],
                "nomeFantasia": data["nome_fantasia"],
            }
        )
    except SchemaError as error:
        return schema_error_response(error)
    database = session()
    try:
        client = find_client(database, parsed_id)
        if not client:
            return jsonify({"error": "client_not_found"}), 404
        client.cnpj, client.razao_social, client.nome_fantasia = parsed.cnpj, parsed.razao_social, parsed.nome_fantasia
        try:
            database.flush()
        except IntegrityError:
            database.rollback()
            return jsonify({"error": "cnpj_already_exists"}), 409
        database.commit()
        return jsonify(serialize_client(client))
    finally:
        database.close()


@CLIENTS_BLUEPRINT.delete("/<client_id>")
@CLIENTS_BLUEPRINT.response(204)
@require_permission("clients.manage")
def delete_client(client_id: str):
    parsed_id = _client_id(client_id)
    if parsed_id is None:
        return jsonify({"error": "invalid_client_id"}), 400
    database = session()
    try:
        client = find_client(database, parsed_id)
        if not client:
            return jsonify({"error": "client_not_found"}), 404
        delete_client_record(database, client)
        database.commit()
        return "", 204
    finally:
        database.close()


def register_clients(app) -> None:
    api = app.extensions["rkm_openapi"]
    api.register_blueprint(CLIENTS_BLUEPRINT)

"""HTTP controllers for files stored in Garage."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from pathlib import PurePath

from flask import jsonify, request, send_file
from flask_smorest import Blueprint
from werkzeug.datastructures import FileStorage

try:
    from ..auth.controller import require_permission
    from ..auth.repository import authenticate, session
except ImportError:
    from features.auth.controller import require_permission
    from features.auth.repository import authenticate, session

from .schema import FileResponseSchema, FileUploadSchema, StorageHealthSchema
from .model import File
from .repository import (
    delete_record,
    ensure_schema,
    find_record,
    list_records,
    migrate_legacy_objects,
    save_record,
)
from .storage import GarageObjectStorage, ObjectMetadata, ObjectStorage


FILE_STORAGE_BLUEPRINT = Blueprint(
    "file_storage",
    __name__,
    url_prefix="/files",
    description="Upload, consulta e gerenciamento de arquivos.",
)


def _storage_error(code: str):
    return jsonify({"error": code}), 502


def _metadata_value(metadata: dict[str, str], key: str) -> str:
    return next((value for name, value in metadata.items() if name.lower() == key), "")


def _original_name(metadata: ObjectMetadata) -> str:
    return PurePath(_metadata_value(metadata.metadata, "original-name") or metadata.key).name


def _file_response(record: File) -> dict:
    return {
        "key": record.storage_key,
        "name": record.original_name,
        "size": record.size,
        "etag": record.etag,
        "contentType": record.content_type,
        "uploadedById": record.uploaded_by_id,
        "uploadedBy": record.uploaded_by_name,
        "uploadedAt": record.uploaded_at,
    }


def _current_user() -> tuple[str, str] | None:
    authorization = request.headers.get("Authorization", "")
    if not authorization.lower().startswith("bearer "):
        return None
    database = session()
    try:
        user = authenticate(database, authorization[7:].strip())
        return (user.id, user.name) if user else None
    finally:
        database.close()


def _safe_filename(filename: str) -> str:
    name = PurePath(filename.replace("\\", "/")).name
    return name or "file.bin"


def _new_object_key(file: FileStorage) -> str:
    return f"files/{secrets.token_hex(12)}-{_safe_filename(file.filename or '')}"


@FILE_STORAGE_BLUEPRINT.get("/storage-health")
@FILE_STORAGE_BLUEPRINT.doc(
    summary="Verifica o storage de arquivos",
    description="Confirma se o bucket Garage está acessível pelo backend.",
)
@FILE_STORAGE_BLUEPRINT.response(200, StorageHealthSchema)
@require_permission("files.view")
def storage_health():
    try:
        _storage().health()
    except Exception:
        return jsonify({"status": "unhealthy", "error": "object_storage_unavailable"}), 503
    return jsonify({"status": "healthy", "provider": "garage"})


@FILE_STORAGE_BLUEPRINT.get("")
@FILE_STORAGE_BLUEPRINT.doc(
    summary="Lista arquivos",
    description="Lista os objetos armazenados, opcionalmente filtrados por prefixo.",
)
@FILE_STORAGE_BLUEPRINT.response(200, FileResponseSchema(many=True))
@require_permission("files.view")
def list_files():
    database = session()
    try:
        ensure_schema(database)
        if not list_records(database):
            migrate_legacy_objects(database, _storage())
        records = list_records(database, request.args.get("prefix", ""))
        return jsonify([_file_response(record) for record in records])
    except Exception:
        database.rollback()
        return _storage_error("files_list_failed")
    finally:
        database.close()


@FILE_STORAGE_BLUEPRINT.post("")
@require_permission("files.manage")
@FILE_STORAGE_BLUEPRINT.doc(
    summary="Envia um arquivo",
    description="Armazena um arquivo no Garage com metadados do usuário autenticado.",
)
@FILE_STORAGE_BLUEPRINT.arguments(FileUploadSchema, location="files")
@FILE_STORAGE_BLUEPRINT.response(201, FileResponseSchema)
def upload_file(data):
    file = data.get("file") or request.files.get("file")
    if not isinstance(file, FileStorage):
        return jsonify({"error": "file_required"}), 400
    user = _current_user()
    if not user:
        return jsonify({"error": "authentication_required"}), 401

    key = _new_object_key(file)
    uploaded_at = datetime.now(timezone.utc)
    content_type = file.mimetype or "application/octet-stream"
    original_name = _safe_filename(file.filename or "")
    database = session()
    try:
        etag = _storage().put(
            key,
            file.stream,
            content_type=content_type,
            size=file.content_length,
            metadata={},
        )
        ensure_schema(database)
        record = save_record(
            database,
            key=key,
            original_name=original_name,
            content_type=content_type,
            size=file.content_length or 0,
            etag=etag,
            uploaded_by_id=user[0],
            uploaded_by_name=user[1],
            uploaded_at=uploaded_at,
        )
        database.commit()
        return jsonify(_file_response(record)), 201
    except Exception:
        database.rollback()
        try:
            _storage().delete(key)
        except Exception:
            pass
        return _storage_error("file_upload_failed")
    finally:
        database.close()


@FILE_STORAGE_BLUEPRINT.get("/<path:key>")
@FILE_STORAGE_BLUEPRINT.doc(
    summary="Baixa ou visualiza um arquivo",
    description="Retorna o conteúdo do arquivo; use `download=1` para forçar download.",
)
@require_permission("files.view")
def download_file(key: str):
    database = session()
    try:
        storage = _storage()
        ensure_schema(database)
        record = find_record(database, key)
        if not record:
            return jsonify({"error": "file_not_found"}), 404
        body = storage.get(key)
    except Exception:
        return _storage_error("file_download_failed")
    finally:
        database.close()
    response = send_file(
        body,
        mimetype=record.content_type or "application/octet-stream",
        as_attachment=request.args.get("download") == "1",
        download_name=record.original_name,
        max_age=0,
    )
    if record.size >= 0:
        response.content_length = record.size
    return response


@FILE_STORAGE_BLUEPRINT.delete("/<path:key>")
@FILE_STORAGE_BLUEPRINT.doc(summary="Exclui um arquivo")
@FILE_STORAGE_BLUEPRINT.response(204)
@require_permission("files.manage")
def delete_file(key: str):
    database = session()
    try:
        ensure_schema(database)
        record = find_record(database, key)
        if not record:
            return jsonify({"error": "file_not_found"}), 404
        _storage().delete(record.storage_key)
        delete_record(database, record)
        database.commit()
    except Exception:
        database.rollback()
        return _storage_error("file_delete_failed")
    finally:
        database.close()
    return "", 204


def _storage() -> ObjectStorage:
    storage = FILE_STORAGE_BLUEPRINT._storage if hasattr(FILE_STORAGE_BLUEPRINT, "_storage") else None
    if storage is None:
        storage = GarageObjectStorage()
        FILE_STORAGE_BLUEPRINT._storage = storage
    return storage


def register_file_storage(app) -> None:
    api = app.extensions["rkm_openapi"]
    api.register_blueprint(FILE_STORAGE_BLUEPRINT)

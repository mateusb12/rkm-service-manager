"""Flask controllers and authorization decorators for the auth module."""

from __future__ import annotations

import os
import secrets
from functools import wraps
from typing import Any, Callable

from flask import current_app, g, jsonify, request
from flask_smorest import Blueprint
from .model import ROLE_LABELS, ROLE_PERMISSIONS, AuthSession, User, serialize_user, summarize_user
from .repository import (
    auth_database,
    authenticate,
    create_access_token,
    create_user as create_user_record,
    deactivate_user as deactivate_user_record,
    duration,
    find_active_session_by_access_token,
    find_active_session_by_refresh_token,
    find_any_user,
    find_user,
    find_user_by_id,
    hard_delete_user as hard_delete_user_record,
    list_active_users as list_active_user_records,
    list_users as list_user_records,
    now,
    password_hash,
    rotate_session_tokens,
    session,
    sha256,
    update_user as update_user_record,
    user_exists_with_email,
    verify_password,
)
from .schema import CreateUserSchema, LoginSchema, SchemaError, UpdateUserSchema


AUTH_TRANSPORT_HEADER = "X-Auth-Transport"
REFRESH_TOKEN_HEADER = "X-Refresh-Token"
AUTH_BLUEPRINT = Blueprint("auth", __name__, url_prefix="/auth")
ADMIN_BLUEPRINT = Blueprint("auth_admin", __name__, url_prefix="/admin")


def schema_error_response(error: SchemaError):
    payload = {"error": error.error}
    if error.fields:
        payload["fields"] = error.fields
    return jsonify(payload), 400


def token_response(user: dict[str, Any], access: str, refresh: str) -> dict[str, Any]:
    return {"user": user, "accessToken": access, "refreshToken": refresh,
            "expiresIn": duration("ACCESS_TTL", 15 * 60)}


def require_specific_permission(permission: str) -> Callable:
    def decorator(view: Callable) -> Callable:
        @wraps(view)
        def wrapped(*args, **kwargs):
            database = session()
            authorization = request.headers.get("Authorization", "")
            user = authenticate(database, authorization[7:].strip()) if authorization.lower().startswith("bearer ") else None
            if not user:
                database.close()
                return jsonify({"error": "authentication_required"}), 401
            try:
                if "*" not in ROLE_PERMISSIONS[user.role] and permission not in ROLE_PERMISSIONS[user.role]:
                    return jsonify({"error": "permission_denied"}), 403
                g.current_user = user
                return view(*args, **kwargs)
            finally:
                database.close()
        return wrapped
    return decorator


def require_one_of_permissions(*permissions: str) -> Callable:
    """Authorize a route when the user has at least one permission."""

    def decorator(view: Callable) -> Callable:
        @wraps(view)
        def wrapped(*args, **kwargs):
            database = session()
            authorization = request.headers.get("Authorization", "")
            user = authenticate(database, authorization[7:].strip()) if authorization.lower().startswith("bearer ") else None
            if not user:
                database.close()
                return jsonify({"error": "authentication_required"}), 401
            try:
                granted = ROLE_PERMISSIONS[user.role]
                if "*" not in granted and not any(permission in granted for permission in permissions):
                    return jsonify({"error": "permission_denied"}), 403
                g.current_user = user
                return view(*args, **kwargs)
            finally:
                database.close()
        return wrapped
    return decorator


@AUTH_BLUEPRINT.post("/login")
def login():
    try:
        credentials = LoginSchema.from_payload(request.get_json(silent=True))
    except SchemaError as error:
        return schema_error_response(error)
    database = session()
    try:
        user = find_user(database, credentials.email)
        if not user or not verify_password(user.password_hash, credentials.password):
            return jsonify({"error": "invalid_credentials"}), 401
        serialized = serialize_user(user)
        current_time = now()
        user.last_login_at = current_time
        access = create_access_token(serialized, current_time + duration("ACCESS_TTL", 15 * 60))
        refresh = secrets.token_hex(32)
        database.add(AuthSession(id=secrets.token_hex(32), user_id=user.id,
                                 access_hash=sha256(access), refresh_hash=sha256(refresh),
                                 created_at=current_time, last_used_at=current_time,
                                 access_expires_at=current_time + duration("ACCESS_TTL", 15 * 60),
                                 expires_at=current_time + duration("SESSION_TTL", 8 * 3600),
                                 absolute_expires_at=current_time + duration("SESSION_ABSOLUTE_TTL", 7 * 86400)))
        database.commit()
        return jsonify(token_response(serialized, access, refresh) if request.headers.get(AUTH_TRANSPORT_HEADER) == "bearer" else serialized)
    finally:
        database.close()


@AUTH_BLUEPRINT.post("/refresh")
def refresh():
    refresh_token = request.headers.get(REFRESH_TOKEN_HEADER, "").strip()
    if not refresh_token:
        return jsonify({"error": "refresh_required"}), 401
    database = session()
    try:
        auth_session = find_active_session_by_refresh_token(database, refresh_token)
        current_time = now()
        if not auth_session or current_time > auth_session.expires_at or current_time > auth_session.absolute_expires_at:
            return jsonify({"error": "refresh_expired"}), 401
        user = find_user_by_id(database, auth_session.user_id)
        if not user:
            return jsonify({"error": "user_not_found"}), 401
        serialized = serialize_user(user)
        access = create_access_token(serialized, current_time + duration("ACCESS_TTL", 15 * 60))
        rotated_refresh = secrets.token_hex(32)
        refresh_expires_at = min(
            current_time + duration("SESSION_TTL", 8 * 3600),
            auth_session.absolute_expires_at,
        )
        updated_sessions = rotate_session_tokens(
            database,
            auth_session,
            sha256(refresh_token),
            sha256(access),
            sha256(rotated_refresh),
            current_time,
            current_time + duration("ACCESS_TTL", 15 * 60),
            refresh_expires_at,
        )
        if updated_sessions != 1:
            database.rollback()
            return jsonify({"error": "refresh_expired"}), 401
        database.commit()
        return jsonify(token_response(serialized, access, rotated_refresh))
    finally:
        database.close()


@AUTH_BLUEPRINT.post("/logout")
def logout():
    database = session()
    try:
        authorization = request.headers.get("Authorization", "")
        if authorization.lower().startswith("bearer "):
            auth_session = find_active_session_by_access_token(database, authorization[7:].strip())
            if auth_session:
                auth_session.revoked_at = now()
                database.commit()
        return jsonify({"status": "logged_out"})
    finally:
        database.close()


@AUTH_BLUEPRINT.get("/me")
def current_user():
    database = session()
    try:
        authorization = request.headers.get("Authorization", "")
        user = authenticate(database, authorization[7:].strip()) if authorization.lower().startswith("bearer ") else None
        return jsonify(serialize_user(user)) if user else (jsonify({"error": "authentication_required"}), 401)
    finally:
        database.close()


@AUTH_BLUEPRINT.get("/active-users")
def active_users():
    database = session()
    try:
        authorization = request.headers.get("Authorization", "")
        user = authenticate(database, authorization[7:].strip()) if authorization.lower().startswith("bearer ") else None
        if not user:
            return jsonify({"error": "authentication_required"}), 401
        users = list_active_user_records(database)
        return jsonify([{"id": item.id, "email": item.email, "name": item.name, "role": item.role,
                         "roleLabel": ROLE_LABELS.get(item.role, "")} for item in users])
    finally:
        database.close()


@AUTH_BLUEPRINT.get("/dev-credentials")
def dev_credentials():
    if current_app.config["APP_ENV"] != "development":
        return "", 404
    credentials = [("admin@rkm.com.br", "DUMMY_PASSWORD_ADMIN", "admin", "Admin"),
                   ("mecanico@rkm.com.br", "DUMMY_PASSWORD_MECHANIC", "mechanic", "Mecânico"),
                   ("pcp@rkm.com.br", "DUMMY_PASSWORD_PCP", "pcp", "PCP"),
                   ("comercial@rkm.com.br", "DUMMY_PASSWORD_COMMERCIAL", "commercial", "Comercial")]
    return jsonify([{"email": email, "password": os.getenv(password, "Rkm@123456"), "role": role, "label": label}
                    for email, password, role, label in credentials])


@ADMIN_BLUEPRINT.get("/users")
@require_specific_permission("users.manage")
def list_users():
    database = session()
    try:
        return jsonify([summarize_user(user) for user in list_user_records(database)])
    finally:
        database.close()


@ADMIN_BLUEPRINT.post("/users")
@require_specific_permission("users.manage")
def create_user():
    try:
        input_data = CreateUserSchema.from_payload(request.get_json(silent=True))
    except SchemaError as error:
        return schema_error_response(error)
    database = session()
    try:
        if user_exists_with_email(database, input_data.email):
            return jsonify({"error": "email_already_exists"}), 409
        user = User(id="u-" + secrets.token_hex(12), email=input_data.email, name=input_data.name,
                    role=input_data.role, password_hash=password_hash(input_data.password),
                    active=True, created_at=now())
        create_user_record(database, user)
        database.commit()
        return jsonify(summarize_user(user)), 201
    finally:
        database.close()


@ADMIN_BLUEPRINT.get("/users/<user_id>")
@require_specific_permission("users.manage")
def get_user(user_id: str):
    database = session()
    try:
        user = find_any_user(database, user_id)
        return jsonify(summarize_user(user)) if user else (jsonify({"error": "user_not_found"}), 404)
    finally:
        database.close()


@ADMIN_BLUEPRINT.patch("/users/<user_id>")
@require_specific_permission("users.manage")
def update_user(user_id: str):
    try:
        input_data = UpdateUserSchema.from_payload(request.get_json(silent=True))
    except SchemaError as error:
        return schema_error_response(error)
    database = session()
    try:
        user = find_any_user(database, user_id)
        if not user:
            return jsonify({"error": "user_not_found"}), 404
        changes = dict(input_data.changes)
        if "password_hash" in changes:
            changes["password_hash"] = password_hash(changes["password_hash"])
        if "email" in changes and user_exists_with_email(database, changes["email"], excluding_id=user_id):
            return jsonify({"error": "email_already_exists"}), 409
        update_user_record(database, user, changes)
        database.commit()
        return jsonify(summarize_user(user))
    finally:
        database.close()


@ADMIN_BLUEPRINT.delete("/users/<user_id>")
@require_specific_permission("users.manage")
def deactivate_user(user_id: str):
    database = session()
    try:
        user = find_any_user(database, user_id)
        if not user:
            return jsonify({"error": "user_not_found"}), 404
        deactivate_user_record(database, user)
        database.commit()
        return jsonify(summarize_user(user))
    finally:
        database.close()


@ADMIN_BLUEPRINT.delete("/users/<user_id>/permanent")
@require_specific_permission("users.manage")
def hard_delete_user(user_id: str):
    database = session()
    try:
        user = find_any_user(database, user_id)
        if not user:
            return jsonify({"error": "user_not_found"}), 404
        if user.active:
            return jsonify({"error": "active_user_cannot_be_deleted"}), 409
        hard_delete_user_record(database, user)
        database.commit()
        return "", 204
    finally:
        database.close()


def register_auth(app) -> None:
    auth_database.init_app(app)
    api = app.extensions["rkm_openapi"]
    api.register_blueprint(AUTH_BLUEPRINT)
    api.register_blueprint(ADMIN_BLUEPRINT)


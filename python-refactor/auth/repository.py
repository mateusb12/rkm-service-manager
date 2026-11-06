"""ORM repository and security primitives for authentication."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
import time
from pathlib import Path
from typing import Any

import jwt
from argon2.low_level import Type, hash_secret_raw
from flask import current_app
from sqlalchemy import create_engine, event, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .model import AuthSession, Base, User, serialize_user


AUTH_ISSUER = "rkm-service-manager"
AUTH_AUDIENCE = "rkm-api"


def now() -> int:
    return int(time.time())


def duration(name: str, fallback: int) -> int:
    value = os.getenv(name)
    if not value:
        return fallback
    units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
    try:
        parsed = float(value[:-1]) * units[value[-1]] if value[-1:] in units else float(value)
        return int(parsed) if parsed > 0 else fallback
    except ValueError:
        return fallback


def database_path() -> str:
    configured = current_app.config.get("DB_PATH") or os.getenv("DB_PATH")
    return configured or str(Path(__file__).resolve().parents[2] / "rkm.db")


def _configure_sqlite(engine: Engine) -> None:
    @event.listens_for(engine, "connect")
    def configure(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys = ON")
        cursor.execute("PRAGMA busy_timeout = 5000")
        cursor.close()


class AuthDatabase:
    """Application extension that owns the auth engine and session factory."""

    extension_key = "rkm_auth_database"

    def init_app(self, app) -> None:
        app.extensions[self.extension_key] = self

        @app.cli.command("auth-init")
        def auth_init_command() -> None:
            self.create_schema()
            self.seed_users()
            print("Initialized auth database.")

    def engine(self) -> Engine:
        path = database_path()
        engines = current_app.extensions.setdefault("auth_engines", {})
        if path not in engines:
            if path == ":memory:":
                database_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
            else:
                database_engine = create_engine(
                    f"sqlite:///{Path(path).expanduser().resolve()}",
                    connect_args={"check_same_thread": False, "timeout": 5},
                )
            _configure_sqlite(database_engine)
            engines[path] = database_engine
        return engines[path]

    def session(self) -> Session:
        path = database_path()
        factories = current_app.extensions.setdefault("auth_sessionmakers", {})
        if path not in factories:
            factories[path] = sessionmaker(bind=self.engine(), expire_on_commit=False)
        return factories[path]()

    def create_schema(self) -> None:
        Base.metadata.create_all(self.engine())

    def seed_users(self) -> None:
        database = self.session()
        try:
            _seed_users(database)
        finally:
            database.close()


auth_database = AuthDatabase()


def session() -> Session:
    return auth_database.session()


def password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hash_secret_raw(
        password.encode(), salt, time_cost=3, memory_cost=64 * 1024,
        parallelism=2, hash_len=32, type=Type.ID,
    )
    encode = lambda value: base64.b64encode(value).decode().rstrip("=")
    return f"argon2id$v=19$m=65536,t=3,p=2${encode(salt)}${encode(digest)}"


def verify_password(encoded: str, password: str) -> bool:
    try:
        parts = encoded.split("$")
        if len(parts) != 5 or parts[:2] != ["argon2id", "v=19"]:
            return False
        parameters = dict(item.split("=", 1) for item in parts[2].split(","))
        memory = int(parameters["m"])
        iterations = int(parameters["t"])
        threads = int(parameters["p"])
        if not 0 < memory <= 1024 * 1024 or not 0 < iterations <= 10 or not 0 < threads <= 64:
            return False
        decode = lambda value: base64.b64decode(value + "===")
        salt = decode(parts[3])
        expected = decode(parts[4])
        if not salt or not expected or len(expected) > 128:
            return False
        actual = hash_secret_raw(
            password.encode(), salt, time_cost=iterations, memory_cost=memory,
            parallelism=threads, hash_len=len(expected), type=Type.ID,
        )
        return hmac.compare_digest(actual, expected)
    except (KeyError, TypeError, ValueError):
        return False


def _seed_users(database: Session) -> None:
    users = [
        ("u5", "admin@rkm.com.br", "Osmar Lamarck", "admin", "DUMMY_PASSWORD_ADMIN"),
        ("u1", "mecanico@rkm.com.br", "Carlos M.", "mechanic", "DUMMY_PASSWORD_MECHANIC"),
        ("u4", "pcp@rkm.com.br", "PCP RKM", "pcp", "DUMMY_PASSWORD_PCP"),
        ("u7", "comercial@rkm.com.br", "Comercial RKM", "commercial", "DUMMY_PASSWORD_COMMERCIAL"),
    ]
    for user_id, email, name, role, password_env in users:
        user = database.scalar(select(User).where(User.email == email))
        if user is None:
            database.add(User(id=user_id, email=email, name=name, role=role,
                              password_hash=password_hash(os.getenv(password_env, "Rkm@123456")),
                              active=True, created_at=now()))
        elif role == "admin":
            user.name = "Osmar Lamarck"
    database.commit()


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def create_access_token(user: dict[str, Any], expires_at: int) -> str:
    issued_at = now()
    claims = {
        "email": user["email"], "name": user["name"], "role": user["role"],
        "roleLabel": user["roleLabel"], "permissions": user["permissions"],
        "iss": AUTH_ISSUER, "sub": user["id"], "aud": AUTH_AUDIENCE,
        "exp": expires_at, "iat": issued_at, "nbf": issued_at,
        "jti": f"{user['id']}-{time.time_ns()}",
    }
    return jwt.encode(claims, os.getenv("AUTH_JWT_SECRET", "development-only-jwt-secret"), algorithm="HS256")


def parse_access_token(value: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(value, os.getenv("AUTH_JWT_SECRET", "development-only-jwt-secret"),
                          algorithms=["HS256"], audience=AUTH_AUDIENCE, issuer=AUTH_ISSUER)
    except jwt.PyJWTError:
        return None


def find_user(database: Session, email: str) -> User | None:
    user = database.scalar(select(User).where(User.email == email, User.active.is_(True)))
    return user if user and serialize_user(user) else None


def find_user_by_id(database: Session, user_id: str) -> User | None:
    user = database.get(User, user_id)
    return user if user and user.active and serialize_user(user) else None


def find_active_session_by_refresh_token(database: Session, refresh_token: str) -> AuthSession | None:
    return database.scalar(select(AuthSession).where(
        AuthSession.refresh_hash == sha256(refresh_token), AuthSession.revoked_at.is_(None)))


def find_active_session_by_access_token(database: Session, access_token: str) -> AuthSession | None:
    return database.scalar(select(AuthSession).where(
        AuthSession.access_hash == sha256(access_token), AuthSession.revoked_at.is_(None)))


def list_active_users(database: Session) -> list[User]:
    return list(database.scalars(select(User).where(User.active.is_(True)).order_by(User.name)).all())


def list_users(database: Session) -> list[User]:
    return list(database.scalars(select(User).order_by(User.name)).all())


def user_exists_with_email(database: Session, email: str, excluding_id: str | None = None) -> bool:
    query = select(User).where(User.email.ilike(email))
    if excluding_id:
        query = query.where(User.id != excluding_id)
    return database.scalar(query) is not None


def authenticate(database: Session, access: str) -> User | None:
    if not parse_access_token(access):
        return None
    auth_session = find_active_session_by_access_token(database, access)
    current_time = now()
    if not auth_session or current_time > auth_session.access_expires_at or current_time > auth_session.absolute_expires_at:
        return None
    user = find_user_by_id(database, auth_session.user_id)
    if user and current_time - auth_session.last_used_at > 60:
        auth_session.last_used_at = current_time
        database.commit()
    return user


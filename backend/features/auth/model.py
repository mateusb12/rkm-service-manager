"""Persistence models and auth domain constants."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


ROLE_PERMISSIONS = {
    "admin": ["*"],
    "mechanic": ["service.view_assigned", "service.create", "service.edit_assigned", "authorization.request", "dashboard.mybench", "files.view", "files.manage"],
    "pcp": ["service.view_status", "service.create", "service.update_initial", "service.close_administrative", "dashboard.pcp", "clients.view", "clients.manage", "files.view", "files.manage"],
    "commercial": ["dashboard.view"],
}

ROLE_LABELS = {"admin": "Admin", "mechanic": "Mecânico", "pcp": "PCP", "commercial": "Comercial"}
ADMIN_ROLE_LABELS = {"admin": "Administrador", "pcp": "PCP", "mechanic": "Mecânico", "commercial": "Comercial"}


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False)
    last_login_at: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sessions: Mapped[list["AuthSession"]] = relationship(back_populates="user")


class AuthSession(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    access_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    refresh_hash: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    created_at: Mapped[int] = mapped_column(Integer, nullable=False)
    last_used_at: Mapped[int] = mapped_column(Integer, nullable=False)
    access_expires_at: Mapped[int] = mapped_column(Integer, nullable=False)
    expires_at: Mapped[int] = mapped_column(Integer, nullable=False)
    absolute_expires_at: Mapped[int] = mapped_column(Integer, nullable=False)
    revoked_at: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user: Mapped[User] = relationship(back_populates="sessions")


def serialize_user(user: User) -> dict[str, Any] | None:
    permissions = ROLE_PERMISSIONS.get(user.role)
    if permissions is None:
        return None
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "roleLabel": ROLE_LABELS[user.role],
        "permissions": permissions,
    }


def summarize_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "roleLabel": ADMIN_ROLE_LABELS.get(user.role, ""),
        "active": user.active,
        "createdAt": user.created_at,
        "lastLoginAt": user.last_login_at,
    }


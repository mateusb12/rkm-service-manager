"""Persistence model and serialization for clients."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

try:
    from ..auth.model import Base
except ImportError:
    from ..auth.model import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cnpj: Mapped[str] = mapped_column(String(14), unique=True, nullable=False)
    razao_social: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    nome_fantasia: Mapped[str] = mapped_column(String(120), nullable=False, index=True)


def serialize_client(client: Client) -> dict[str, Any]:
    return {
        "id": client.id,
        "cnpj": client.cnpj,
        "razaoSocial": client.razao_social,
        "nomeFantasia": client.nome_fantasia,
    }

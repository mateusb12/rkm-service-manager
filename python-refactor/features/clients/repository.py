"""ORM repository for clients."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

try:
    from ..auth.repository import session
except ImportError:
    from features.auth.repository import session

from .model import Client
from .schema import normalize_search


def list_clients(search: str) -> list[Client]:
    database = session()
    try:
        clients = list(database.scalars(select(Client).order_by(func.lower(Client.razao_social), Client.id)).all())
        search = search.strip()
        if not search:
            return clients
        normalized = normalize_search(search)
        cnpj_search = "".join(char for char in search if char.isdigit()) if all(
            char.isdigit() or char in " ./-" for char in search
        ) else ""
        return [
            client for client in clients
            if normalized in normalize_search(client.razao_social)
            or normalized in normalize_search(client.nome_fantasia)
            or (cnpj_search and cnpj_search in client.cnpj)
        ]
    finally:
        database.close()


def find_client(database, client_id: int) -> Client | None:
    return database.get(Client, client_id)


def create_client(database, client: Client) -> Client:
    database.add(client)
    try:
        database.flush()
    except IntegrityError:
        database.rollback()
        raise
    return client


def delete_client(database, client: Client) -> None:
    database.delete(client)
    database.flush()

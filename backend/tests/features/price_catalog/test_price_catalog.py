import pytest

from app import app
from features.auth.repository import auth_database


@pytest.fixture
def price_catalog_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "price-catalog.db"))
    monkeypatch.setitem(app.config, "DATABASE_URL", "")
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    return app.test_client()


def login(client, email="pcp@rkm.com.br"):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    return {"Authorization": f"Bearer {response.json['accessToken']}"}


def catalog_payload(**overrides):
    return {
        "name": "Recuperar rosca do êmbolo",
        "unit": "h",
        "unitPriceCents": 7500,
        "description": "Serviço de demonstração",
        "type": "service",
        **overrides,
    }


def test_price_catalog_crud_and_service_unit_validation(price_catalog_client):
    headers = login(price_catalog_client)
    create = price_catalog_client.post("/price-catalog", headers=headers, json=catalog_payload())

    assert create.status_code == 201
    assert create.json["unit"] == "h"
    item_id = create.json["id"]

    listed = price_catalog_client.get("/price-catalog", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json) == 1

    invalid_service = price_catalog_client.post(
        "/price-catalog",
        headers=headers,
        json=catalog_payload(unit="un"),
    )
    assert invalid_service.status_code == 422

    update = price_catalog_client.put(
        f"/price-catalog/{item_id}",
        headers=headers,
        json=catalog_payload(name="Pintura", unitPriceCents=8500),
    )
    assert update.status_code == 200
    assert update.json["name"] == "Pintura"

    assert price_catalog_client.delete(f"/price-catalog/{item_id}", headers=headers).status_code == 204
    assert price_catalog_client.get(f"/price-catalog/{item_id}", headers=headers).status_code == 404


def test_price_catalog_allows_material_and_rejects_commercial(price_catalog_client):
    pcp_headers = login(price_catalog_client)
    material = price_catalog_client.post(
        "/price-catalog",
        headers=pcp_headers,
        json=catalog_payload(name="Gaxeta", type="material", unit="un"),
    )
    assert material.status_code == 201

    commercial_headers = login(price_catalog_client, "comercial@rkm.com.br")
    assert price_catalog_client.get("/price-catalog", headers=commercial_headers).status_code == 403
    assert price_catalog_client.post("/price-catalog", headers=commercial_headers, json=catalog_payload()).status_code == 403


def test_price_catalog_is_documented_in_openapi(price_catalog_client):
    document = price_catalog_client.get("/openapi.json")
    assert document.status_code == 200
    assert "/price-catalog" in document.json["paths"]
    assert "/price-catalog/{item_id}" in document.json["paths"]

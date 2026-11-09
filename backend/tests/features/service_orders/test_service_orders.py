import pytest

from app import app
from features.auth.repository import auth_database


@pytest.fixture
def service_orders_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "service-orders.db"))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
    return app.test_client()


def login(client, email="mecanico@rkm.com.br"):
    response = client.post(
        "/auth/login",
        json={"email": email, "password": "Rkm@123456"},
        headers={"X-Auth-Transport": "bearer"},
    )
    return {"Authorization": f"Bearer {response.json['accessToken']}"}


def order_payload(order_number="20265584"):
    return {
        "orderNumber": order_number,
        "client": "RKM HIDRAULICA",
        "invoiceNumber": "NF-123",
        "status": "Aguardando desmontagem",
        "stage": "desmontagem",
        "photos": {"arrival": [{"id": "photo-1", "name": "nf.jpg"}]},
        "futureField": {"canChangeWithoutMigration": True},
    }


def test_service_order_persists_flexible_document(service_orders_client):
    headers = login(service_orders_client)
    create = service_orders_client.post(
        "/service-orders", headers=headers, json=order_payload()
    )

    assert create.status_code == 201
    assert create.json["id"] == "OS-20265584"
    assert create.json["futureField"]["canChangeWithoutMigration"] is True

    listed = service_orders_client.get("/service-orders", headers=headers)
    assert listed.status_code == 200
    assert listed.json[0]["invoiceNumber"] == "NF-123"

    fetched = service_orders_client.get("/service-orders/20265584", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json["photos"]["arrival"][0]["id"] == "photo-1"


def test_stage_catalog_exposes_role_capabilities(service_orders_client):
    pcp = service_orders_client.get(
        "/service-orders/stages",
        headers=login(service_orders_client, "pcp@rkm.com.br"),
    )
    assert pcp.status_code == 200
    assert [stage["id"] for stage in pcp.json] == [
        "recebimento",
        "identificacao",
        "desmontagem",
        "orcamento",
        "reparo",
        "entrega",
    ]
    assert pcp.json[1]["canView"] is True
    assert pcp.json[1]["canComplete"] is True
    assert pcp.json[2]["canView"] is False
    assert pcp.json[2]["canAdvanceTo"] is True
    assert pcp.json[3]["canAdvanceTo"] is False

    mechanic = service_orders_client.get(
        "/service-orders/stages", headers=login(service_orders_client)
    )
    assert mechanic.status_code == 200
    assert all(stage["canView"] for stage in mechanic.json)
    assert all(stage["canEdit"] for stage in mechanic.json)
    assert all(stage["canComplete"] for stage in mechanic.json)


def test_service_order_updates_without_changing_identity(service_orders_client):
    headers = login(service_orders_client)
    assert service_orders_client.post(
        "/service-orders", headers=headers, json=order_payload()
    ).status_code == 201

    updated = service_orders_client.put(
        "/service-orders/OS-20265584",
        headers=headers,
        json={**order_payload(), "status": "Finalizado", "stage": "entrega"},
    )
    assert updated.status_code == 200
    assert updated.json["status"] == "Finalizado"
    assert updated.json["stage"] == "entrega"

    conflict = service_orders_client.post(
        "/service-orders", headers=headers, json=order_payload()
    )
    assert conflict.status_code == 409


def test_pcp_opens_order_but_gets_only_initial_details_after_identification(service_orders_client):
    mechanic_headers = login(service_orders_client)
    create = service_orders_client.post(
        "/service-orders",
        headers=mechanic_headers,
        json=order_payload(),
    )
    assert create.status_code == 201
    assert create.json["stage"] == "desmontagem"

    pcp_headers = login(service_orders_client, "pcp@rkm.com.br")
    listed = service_orders_client.get("/service-orders", headers=pcp_headers)
    assert listed.status_code == 200
    assert listed.json[0]["stage"] == "desmontagem"
    assert "diagnosis" not in listed.json[0]

    details = service_orders_client.get(
        "/service-orders/OS-20265584", headers=pcp_headers
    )
    assert details.status_code == 200
    assert details.json["stage"] == "desmontagem"
    assert details.json["availableThroughStage"] == "identificacao"
    assert "diagnosis" not in details.json


def test_pcp_can_create_initial_service_order(service_orders_client):
    headers = login(service_orders_client, "pcp@rkm.com.br")
    create = service_orders_client.post(
        "/service-orders",
        headers=headers,
        json={**order_payload("20265585"), "stage": "identificacao"},
    )

    assert create.status_code == 201
    assert create.json["stage"] == "identificacao"

    advance = service_orders_client.put(
        "/service-orders/OS-20265585",
        headers=headers,
        json={**order_payload("20265585"), "stage": "desmontagem"},
    )
    assert advance.status_code == 200
    assert advance.json["stage"] == "desmontagem"

    blocked = service_orders_client.put(
        "/service-orders/OS-20265585",
        headers=headers,
        json={**order_payload("20265585"), "stage": "orcamento"},
    )
    assert blocked.status_code == 403
    assert blocked.json == {"error": "service_order_update_restricted"}

from datetime import datetime, timezone

import pytest

from app import app
from features.auth.repository import auth_database
from features.clients.model import Client
from features.file_storage.model import File
from features.service_orders.model import ServiceOrder


@pytest.fixture
def service_orders_client(tmp_path, monkeypatch):
    monkeypatch.setitem(app.config, "DB_PATH", str(tmp_path / "service-orders.db"))
    monkeypatch.setitem(app.config, "APP_ENV", "development")
    monkeypatch.setenv("AUTH_JWT_SECRET", "test-secret-with-at-least-32-bytes")
    with app.app_context():
        auth_database.create_schema()
        auth_database.seed_users()
        database = auth_database.session()
        database.add(Client(id=1, cnpj="10203040000150", razao_social="RKM HIDRAULICA LTDA", nome_fantasia="RKM HIDRAULICA"))
        database.commit()
        database.close()
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
        "clientId": 1,
        "client": "RKM HIDRAULICA",
        "invoiceNumber": "NF-123",
        "status": "Aguardando desmontagem",
        "stage": "desmontagem",
        "photos": {"arrival": [{"id": "photo-1", "name": "nf.jpg"}]},
        "futureField": {"canChangeWithoutMigration": True},
    }


def test_service_order_persists_flexible_document(service_orders_client):
    headers = login(service_orders_client, "admin@rkm.com.br")
    create = service_orders_client.post(
        "/service-orders", headers=headers, json=order_payload()
    )

    assert create.status_code == 201
    assert create.json["id"] == "OS-20265584"
    assert create.json["futureField"]["canChangeWithoutMigration"] is True
    assert create.json["clientId"] == 1

    listed = service_orders_client.get("/service-orders", headers=headers)
    assert listed.status_code == 200
    assert listed.json[0]["invoiceNumber"] == "NF-123"

    fetched = service_orders_client.get("/service-orders/20265584", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json["photos"]["arrival"][0]["id"] == "photo-1"


def test_arrival_method_is_persisted_as_a_column(service_orders_client):
    headers = login(service_orders_client)
    create = service_orders_client.post(
        "/service-orders",
        headers=headers,
        json={**order_payload("20265586"), "arrivalMethod": "coleta_cliente"},
    )

    assert create.status_code == 201
    assert create.json["arrivalMethod"] == "coleta_cliente"

    with app.app_context():
        database = auth_database.session()
        try:
            order = database.get(ServiceOrder, "OS-20265586")
            assert order.arrival_method.value == "coleta_cliente"
            assert order.client_id == 1
            assert "arrivalMethod" not in order.payload
            assert "client" not in order.payload
        finally:
            database.close()


def test_disassembly_checklist_is_returned_to_mechanic(service_orders_client):
    checklist = [
        {
            "component": "Haste",
            "status": "Não conforme",
            "notes": "Veio quebrada",
        }
    ]
    create = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client, "admin@rkm.com.br"),
        json={**order_payload("20265588"), "disassemblyChecklist": checklist},
    )

    assert create.status_code == 201

    fetched = service_orders_client.get(
        "/service-orders/20265588",
        headers=login(service_orders_client),
    )

    assert fetched.status_code == 200
    assert fetched.json["disassemblyChecklist"] == checklist


def test_service_order_links_invoice_file_by_foreign_key(service_orders_client):
    with app.app_context():
        database = auth_database.session()
        database.add(
            File(
                id="f-invoice-1",
                storage_key="files/invoice-1.png",
                original_name="nota-fiscal.png",
                content_type="image/png",
                size=128,
                etag="etag-1",
                uploaded_by_id="u2",
                uploaded_by_name="Mecanico RKM",
                uploaded_at=datetime.now(timezone.utc),
            )
        )
        database.commit()
        database.close()

    response = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client),
        json={**order_payload("20265587"), "invoiceFileId": "f-invoice-1"},
    )

    assert response.status_code == 201
    assert response.json["invoiceFileId"] == "f-invoice-1"
    assert response.json["invoiceFile"]["name"] == "nota-fiscal.png"

    with app.app_context():
        database = auth_database.session()
        try:
            order = database.get(ServiceOrder, "OS-20265587")
            assert order.invoice_file_id == "f-invoice-1"
            assert "invoiceFileId" not in order.payload
        finally:
            database.close()


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
    assert [stage["canView"] for stage in mechanic.json] == [False, False, True, True, True, True]
    assert [stage["canEdit"] for stage in mechanic.json] == [False, False, True, False, False, False]
    assert [stage["canComplete"] for stage in mechanic.json] == [False, False, True, False, False, False]


def test_service_order_updates_without_changing_identity(service_orders_client):
    headers = login(service_orders_client, "admin@rkm.com.br")
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


def test_mechanic_gets_general_order_data_but_only_step_three_details(service_orders_client):
    create = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client),
        json={
            **order_payload("20265589"),
            "orderType": "Cilindro",
            "equipment": "Cilindro hidráulico",
            "serialNumber": "SER-1",
            "disassemblyNotes": "Abrir e registrar os componentes.",
            "diagnosis": "Informação restrita ao orçamento.",
        },
    )
    assert create.status_code == 201

    details = service_orders_client.get(
        "/service-orders/OS-20265589", headers=login(service_orders_client)
    )
    assert details.status_code == 200
    assert details.json["orderType"] == "Cilindro"
    assert details.json["equipment"] == "Cilindro hidráulico"
    assert "serialNumber" not in details.json
    assert details.json["disassemblyNotes"] == "Abrir e registrar os componentes."
    assert "diagnosis" in details.json


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


def test_pcp_can_update_receiving_on_advanced_order_without_editing_workshop_data(service_orders_client):
    create = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client),
        json={
            **order_payload("20265588"),
            "disassemblyNotes": "Registrado pela oficina",
        },
    )
    assert create.status_code == 201

    with app.app_context():
        database = auth_database.session()
        database.add(
            File(
                id="f-invoice-pcp-1",
                storage_key="files/invoice-pcp-1.png",
                original_name="nota-pcp.png",
                content_type="image/png",
                size=128,
                etag="etag-pcp-1",
                uploaded_by_id="u4",
                uploaded_by_name="PCP RKM",
                uploaded_at=datetime.now(timezone.utc),
            )
        )
        database.commit()
        database.close()

    update = service_orders_client.put(
        "/service-orders/OS-20265588",
        headers=login(service_orders_client, "pcp@rkm.com.br"),
        json={
            **order_payload("20265588"),
            "stage": "identificacao",
            "invoiceFileId": "f-invoice-pcp-1",
            "invoiceNumber": "NF-PCP-1",
            "disassemblyNotes": "Tentativa indevida do PCP",
        },
    )

    assert update.status_code == 200
    assert update.json["stage"] == "desmontagem"
    assert update.json["invoiceFileId"] == "f-invoice-pcp-1"
    assert update.json["invoiceNumber"] == "NF-PCP-1"

    with app.app_context():
        database = auth_database.session()
        try:
            order = database.get(ServiceOrder, "OS-20265588")
            assert order.payload["disassemblyNotes"] == "Registrado pela oficina"
        finally:
            database.close()

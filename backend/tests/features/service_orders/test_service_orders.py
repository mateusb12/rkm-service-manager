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


def test_update_never_downgrades_service_order_stage(service_orders_client):
    headers = login(service_orders_client, "admin@rkm.com.br")
    create = service_orders_client.post(
        "/service-orders",
        headers=headers,
        json={**order_payload("20265589"), "stage": "orcamento", "status": "Em orçamento"},
    )
    assert create.status_code == 201

    update_payload = {
        **create.json,
        "stage": "identificacao",
        "status": "Em identificação",
    }
    update = service_orders_client.put(
        "/service-orders/20265589",
        headers=headers,
        json=update_payload,
    )

    assert update.status_code == 200
    assert update.json["stage"] == "orcamento"
    assert update.json["status"] == "Em orçamento"

    with app.app_context():
        database = auth_database.session()
        try:
            order = database.get(ServiceOrder, "OS-20265589")
            assert order.stage == "orcamento"
            assert order.status == "Em orçamento"
            assert order.payload["stage"] == "orcamento"
            assert order.payload["status"] == "Em orçamento"
        finally:
            database.close()


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
    photos = {
        "disassembly": [{"id": "foto-desmontagem"}],
        "disassemblyChecklist-0": [{"id": "foto-haste"}],
    }
    create = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client, "admin@rkm.com.br"),
        json={**order_payload("20265588"), "disassemblyChecklist": checklist, "photos": photos},
    )

    assert create.status_code == 201

    fetched = service_orders_client.get(
        "/service-orders/20265588",
        headers=login(service_orders_client),
    )

    assert fetched.status_code == 200
    assert fetched.json["disassemblyChecklist"] == checklist
    assert fetched.json["photos"]["disassembly"] == photos["disassembly"]
    assert fetched.json["photos"]["disassemblyChecklist-0"] == photos["disassemblyChecklist-0"]


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
            "cylinderInternalDiameter": "80",
            "cylinderExternalDiameter": "95",
            "cylinderLength": "500",
            "cylinderRodDiameter": "50",
            "cylinderOptionalItems": ["Articulação traseira", "Garfo"],
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
    assert details.json["cylinderInternalDiameter"] == "80"
    assert details.json["cylinderOptionalItems"] == ["Articulação traseira", "Garfo"]
    assert "serialNumber" not in details.json
    assert details.json["disassemblyNotes"] == "Abrir e registrar os componentes."
    assert "diagnosis" in details.json


def test_mechanic_can_save_cylinder_dimensions_in_disassembly(service_orders_client):
    headers = login(service_orders_client)
    create = service_orders_client.post(
        "/service-orders",
        headers=headers,
        json={**order_payload("20265590"), "orderType": "Cilindro"},
    )
    assert create.status_code == 201

    update = service_orders_client.put(
        "/service-orders/OS-20265590",
        headers=headers,
        json={
            **create.json,
            "stage": "desmontagem",
            "cylinderInternalDiameter": "80",
            "cylinderExternalDiameter": "95",
            "cylinderLength": "500",
            "cylinderStroke": "300",
            "cylinderRodDiameter": "50",
        },
    )

    assert update.status_code == 200
    assert update.json["stage"] == "desmontagem"
    assert update.json["cylinderStroke"] == "300"


def test_pcp_cannot_fill_cylinder_dimensions(service_orders_client):
    response = service_orders_client.post(
        "/service-orders",
        headers=login(service_orders_client, "pcp@rkm.com.br"),
        json={
            **order_payload("20265591"),
            "stage": "identificacao",
            "orderType": "Cilindro",
            "cylinderInternalDiameter": "80",
        },
    )

    assert response.status_code == 201
    assert "cylinderInternalDiameter" not in response.json


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


def _new_cylinder(client, headers, number="30991", components=None):
    selected = components or ["Haste", "Vedação"]
    response = client.post("/service-orders", headers=headers, json={
        **order_payload(number), "orderType": "Cilindro hidráulico",
        "cylinderOptionalItems": selected,
        "disassemblyChecklist": [{"component": name, "status": "", "notes": ""} for name in selected],
    })
    assert response.status_code == 201
    return response.json


def _put_order(client, headers, order, **changes):
    return client.put(f"/service-orders/{order['id']}", headers=headers, json={**order, **changes})


def _prepared(order):
    return {**order, "disassemblyOperator": "Mecânico RKM", "cylinderInternalDiameter": "80",
            "cylinderExternalDiameter": "95", "cylinderLength": "500", "cylinderStroke": "300",
            "cylinderRodDiameter": "50"}


def test_disassembly_start_requires_dimensions_and_is_server_owned(service_orders_client):
    client = service_orders_client
    headers = login(client)
    order = _new_cylinder(client, headers)
    assert not order.get("disassemblyStartedAt")
    rejected = _put_order(client, headers, order, disassemblyAction="start")
    assert rejected.status_code == 409
    assert rejected.json["error"] == "disassembly_preparation_incomplete"
    started = _put_order(client, headers, _prepared(order), disassemblyAction="start")
    assert started.status_code == 200
    assert started.json["disassemblyStartedAt"].endswith("+00:00")
    assert started.json["disassemblyTimingVersion"] == 1
    duplicate = _put_order(client, headers, started.json, disassemblyAction="start")
    assert duplicate.status_code == 409
    assert duplicate.json["error"] == "disassembly_already_started"


def test_disassembly_assessment_confirmation_conflicts_and_budget_fields(service_orders_client):
    client = service_orders_client
    headers = login(client)
    order = _new_cylinder(client, headers, "30992")
    before = _put_order(client, headers, _prepared(order), disassemblyChecklist=[
        {"component": "Haste", "status": "Conforme", "notes": ""},
        {"component": "Vedação", "status": "", "notes": ""},
    ])
    assert before.status_code == 409
    assert before.json["error"] == "evaluation_before_start"
    started = _put_order(client, headers, _prepared(order), disassemblyAction="start").json
    first = _put_order(client, headers, started, disassemblyAction="assess", disassemblyIndex=0,
                       disassemblyChecklist=[{**started["disassemblyChecklist"][0], "status": "Conforme"}, started["disassemblyChecklist"][1]])
    assert first.status_code == 200
    first_at = first.json["disassemblyChecklist"][0]["firstAssessedAt"]
    changed = _put_order(client, headers, first.json, disassemblyAction="assess", disassemblyIndex=0,
                         disassemblyChecklist=[{**first.json["disassemblyChecklist"][0], "status": "Não conforme", "notes": "Risco"}, first.json["disassemblyChecklist"][1]])
    assert changed.status_code == 200
    assert changed.json["disassemblyChecklist"][0]["firstAssessedAt"] == first_at
    stale = _put_order(client, headers, first.json, disassemblyAction="confirm", disassemblyIndex=0)
    assert stale.status_code == 409
    assert stale.json["error"] == "stale_service_order"
    confirmed = _put_order(client, headers, changed.json, disassemblyAction="confirm", disassemblyIndex=0)
    assert confirmed.status_code == 200
    item = confirmed.json["disassemblyChecklist"][0]
    assert item["confirmedBy"]["id"]
    assert item["confirmedAt"].endswith("+00:00")
    assert not confirmed.json["disassemblyComplete"]
    tampered = _put_order(client, headers, confirmed.json, disassemblyChecklist=[
        {**item, "notes": "Alteração indevida"}, confirmed.json["disassemblyChecklist"][1]])
    assert tampered.status_code == 409
    assert tampered.json["error"] == "confirmed_evaluation_locked"
    assert _put_order(client, headers, confirmed.json, orderType="Acumulador").status_code == 409
    commercial = _put_order(client, headers, confirmed.json, disassemblyChecklist=[
        {**item, "budgetItem": "Haste nova", "budgetQuantity": "1"}, confirmed.json["disassemblyChecklist"][1]])
    assert commercial.status_code == 200
    assert commercial.json["disassemblyChecklist"][0]["budgetItem"] == "Haste nova"
    reloaded = client.get(f"/service-orders/{order['id']}", headers=headers)
    assert reloaded.json["disassemblyChecklist"][0]["confirmedAt"] == item["confirmedAt"]


def test_last_confirmation_finishes_without_advancing_and_requires_justification(service_orders_client):
    client = service_orders_client
    headers = login(client)
    order = _new_cylinder(client, headers, "30993", ["Vedação"])
    started = _put_order(client, headers, _prepared(order), disassemblyAction="start").json
    draft = _put_order(client, headers, started, disassemblyAction="assess", disassemblyIndex=0,
                       disassemblyChecklist=[{**started["disassemblyChecklist"][0], "status": "Não conforme"}]).json
    rejected = _put_order(client, headers, draft, disassemblyAction="confirm", disassemblyIndex=0)
    assert rejected.status_code == 409
    assert rejected.json["error"] == "justification_required"
    confirmed = _put_order(client, headers, draft, disassemblyAction="confirm", disassemblyIndex=0,
                           disassemblyChecklist=[{**draft["disassemblyChecklist"][0], "notes": "Vazamento"}])
    assert confirmed.status_code == 200
    assert confirmed.json["disassemblyComplete"] is True
    assert confirmed.json["disassemblyEndedAt"].endswith("+00:00")
    assert confirmed.json["stage"] == "desmontagem"
    assert _put_order(client, headers, confirmed.json, disassemblyAction="confirm", disassemblyIndex=0).status_code == 409
    admin = login(client, "admin@rkm.com.br")
    budget = _put_order(client, admin, confirmed.json, stage="orcamento", disassemblyChecklist=[
        {**confirmed.json["disassemblyChecklist"][0], "budgetItem": "Jogo de vedações", "budgetQuantity": "1"}])
    assert budget.status_code == 200
    assert budget.json["disassemblyChecklist"][0]["budgetItem"] == "Jogo de vedações"
    assert budget.json["disassemblyChecklist"][0]["confirmedAt"] == confirmed.json["disassemblyChecklist"][0]["confirmedAt"]
    stale_after_advance = _put_order(client, headers, confirmed.json, disassemblyNotes="Formulário antigo")
    assert stale_after_advance.status_code == 409
    assert stale_after_advance.json["error"] == "stale_service_order"


def test_legacy_and_non_cylinder_orders_keep_their_workflow(service_orders_client):
    client = service_orders_client
    headers = login(client, "admin@rkm.com.br")
    legacy = client.post("/service-orders", headers=headers, json={
        **order_payload("30994"), "orderType": "Cilindro hidráulico", "stage": "orcamento",
        "disassemblyStartedAt": "2025-01-02T10:00", "disassemblyChecklist": [
            {"component": "Haste", "status": "Conforme", "notes": ""}],
    })
    assert legacy.status_code == 201
    updated = _put_order(client, headers, legacy.json, stage="reparo", diagnosis="Orçamento histórico")
    assert updated.status_code == 200
    assert updated.json["disassemblyChecklist"][0].get("confirmedAt") is None
    assert updated.json["disassemblyStartedAt"] == "2025-01-02T10:00"
    other = client.post("/service-orders", headers=headers, json={**order_payload("30995"), "orderType": "Acumulador"})
    assert other.status_code == 201
    assert _put_order(client, headers, other.json, stage="orcamento").status_code == 200


def test_confirmed_photo_cannot_be_deleted_directly(service_orders_client):
    client = service_orders_client
    headers = login(client)
    with app.app_context():
        database = auth_database.session()
        database.add(File(id="f-confirmed", storage_key="files/confirmed.jpg", original_name="confirmed.jpg",
                          content_type="image/jpeg", size=10, etag="etag", uploaded_by_id="u1",
                          uploaded_by_name="Mecânico", uploaded_at=datetime.now(timezone.utc)))
        database.commit()
        database.close()
    order = _new_cylinder(client, headers, "30996", ["Haste"])
    started = _put_order(client, headers, _prepared(order), disassemblyAction="start").json
    draft = _put_order(client, headers, started, disassemblyAction="assess", disassemblyIndex=0,
                       disassemblyChecklist=[{**started["disassemblyChecklist"][0], "status": "Conforme"}]).json
    confirmed = _put_order(client, headers, draft, disassemblyAction="confirm", disassemblyIndex=0,
                           photos={**draft.get("photos", {}), "disassemblyChecklist-0": [{"id": "f-confirmed", "key": "files/confirmed.jpg"}]})
    assert confirmed.status_code == 200
    delete = client.delete("/files/files/confirmed.jpg", headers=headers)
    assert delete.status_code == 409
    assert delete.json["error"] == "confirmed_evidence_locked"


def test_pcp_cannot_start_or_confirm_disassembly(service_orders_client):
    client = service_orders_client
    admin = login(client, "admin@rkm.com.br")
    pcp = login(client, "pcp@rkm.com.br")
    order = _new_cylinder(client, admin, "30997", ["Haste"])
    attempted = _put_order(client, pcp, _prepared(order), disassemblyAction="start")
    assert attempted.status_code == 403
    started = _put_order(client, admin, _prepared(order), disassemblyAction="start").json
    attempted = _put_order(client, pcp, started, disassemblyAction="confirm", disassemblyIndex=0)
    assert attempted.status_code == 403


def test_legacy_in_disassembly_requires_explicit_new_start_without_inventing_assessment_time(service_orders_client):
    client = service_orders_client
    headers = login(client)
    order = _new_cylinder(client, headers, "30998", ["Haste"])
    with app.app_context():
        database = auth_database.session()
        saved = database.get(ServiceOrder, order["id"])
        saved.payload = {**saved.payload, "disassemblyStartedAt": "2025-01-02T10:00",
                         "disassemblyChecklist": [{"component": "Haste", "status": "Conforme", "notes": ""}]}
        database.commit()
        database.close()
    legacy = client.get(f"/service-orders/{order['id']}", headers=headers).json
    assert legacy["disassemblyChecklist"][0].get("firstAssessedAt") is None
    started = _put_order(client, headers, _prepared(legacy), disassemblyAction="start")
    assert started.status_code == 200
    assert started.json["disassemblyStartedAt"].endswith("+00:00")
    assert started.json["disassemblyStartedAt"] != "2025-01-02T10:00"
    assert started.json["disassemblyChecklist"][0].get("firstAssessedAt") is None
    rejected = _put_order(client, headers, started.json, disassemblyAction="confirm", disassemblyIndex=0)
    assert rejected.status_code == 409
    reassessed = _put_order(client, headers, started.json, disassemblyAction="assess", disassemblyIndex=0)
    assert reassessed.status_code == 200
    assert reassessed.json["disassemblyChecklist"][0]["firstAssessedAt"].endswith("+00:00")


def test_conforming_component_can_be_confirmed_immediately_after_assessment(service_orders_client):
    client = service_orders_client
    headers = login(client)
    order = _new_cylinder(client, headers, "30999", ["Camisa"])
    started = _put_order(client, headers, _prepared(order), disassemblyAction="start").json
    assessed = _put_order(client, headers, started, disassemblyAction="assess", disassemblyIndex=0,
                          disassemblyChecklist=[{**started["disassemblyChecklist"][0], "status": "Conforme"}]).json
    confirmed = _put_order(client, headers, assessed, disassemblyAction="confirm", disassemblyIndex=0)
    assert confirmed.status_code == 200
    assert confirmed.json["disassemblyChecklist"][0]["confirmedAt"]
    assert confirmed.json["disassemblyComplete"] is True


def test_mechanic_updates_preserve_receiving_fields_and_photos(service_orders_client):
    client = service_orders_client
    admin = login(client, "admin@rkm.com.br")
    mechanic = login(client)
    order = client.post("/service-orders", headers=admin, json={
        **order_payload("31000"), "orderType": "Cilindro hidráulico",
        "cylinderOptionalItems": ["Haste"], "disassemblyChecklist": [{"component": "Haste", "status": "", "notes": ""}],
        "receivedBy": "Recebimento RKM", "photos": {"arrival": [{"id": "arrival-photo"}]},
    }).json
    seen = client.get(f"/service-orders/{order['id']}", headers=mechanic).json
    started = _put_order(client, mechanic, _prepared(seen), disassemblyAction="start")
    assert started.status_code == 200
    reloaded = client.get(f"/service-orders/{order['id']}", headers=admin).json
    assert reloaded["receivedBy"] == "Recebimento RKM"
    assert reloaded["photos"]["arrival"] == [{"id": "arrival-photo"}]

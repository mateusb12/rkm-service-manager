from app import app


app.config.update(TESTING=True)


def client():
    return app.test_client()


def test_http_contract(subtests):
    with subtests.test(msg="0.1 health check deve responder OK e identificar a requisição"):
        response = client().get("/health")

        assert response.status_code == 200
        assert response.json["status"] == "ok"
        assert response.headers["X-Request-ID"]

    with subtests.test(msg="0.2 X-Request-ID recebido deve ser propagado"):
        response = client().get(
            "/api/health", headers={"X-Request-ID": "test-request"}
        )

        assert response.headers["X-Request-ID"] == "test-request"

    with subtests.test(msg="0.3 origem do frontend deve receber cabeçalho CORS"):
        response = client().get(
            "/health", headers={"Origin": "http://localhost:5173"}
        )

        assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"

    with subtests.test(msg="0.4 rota inexistente deve usar contrato JSON de erro"):
        response = client().get("/does-not-exist")

        assert response.status_code == 404
        assert response.json["error"]["code"] == 404
        assert response.json["request_id"]


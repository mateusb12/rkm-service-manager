import pytest

from features.auth.schema import CreateUserSchema, LoginSchema, SchemaError, UpdateUserSchema


def test_schema_contract(subtests):
    with subtests.test(msg="2.1 schema de login deve normalizar credenciais"):
        credentials = LoginSchema.from_payload(
            {"email": "  PCP@RKM.COM.BR ", "password": "Rkm@123456"}
        )

        assert credentials.email == "pcp@rkm.com.br"
        assert credentials.password == "Rkm@123456"

    with subtests.test(msg="2.2 schema de criação deve reportar erros de campo"):
        with pytest.raises(SchemaError) as error:
            CreateUserSchema.from_payload(
                {"name": "", "email": "invalid", "role": "unknown", "password": "short"}
            )

        assert error.value.error == "validation_failed"
        assert set(error.value.fields) == {"name", "email", "role", "password"}

    with subtests.test(msg="2.3 schema de atualização deve mapear senha para repository"):
        update = UpdateUserSchema.from_payload(
            {"name": " Novo Nome ", "password": "Senha@123"}
        )

        assert update.changes == {"name": "Novo Nome", "password_hash": "Senha@123"}

    with subtests.test(msg="2.4 schemas devem rejeitar campos desconhecidos"):
        with pytest.raises(SchemaError) as error:
            CreateUserSchema.from_payload(
                {"name": "User", "email": "user@example.com", "role": "admin",
                 "password": "password", "unknown": True}
            )

        assert error.value.error == "invalid_json"


# RKM Service Manager — Python backend

Backend Flask inicial para a migração incremental do serviço Go.

## Desenvolvimento

```bash
uv sync
uv run pytest
uv run flask --app app:app run --debug --port 8788
uv run flask --app app:app auth-init
```

Endpoints iniciais:

- `GET /health`
- `GET /docs/`
- `GET /openapi.json`

O middleware HTTP adiciona o cabeçalho `X-Request-ID`, registra duração/status das requisições e converte erros para uma resposta JSON consistente. Configure origens CORS separadas por vírgula em `CORS_ORIGINS`.

## Migração do auth

O módulo Python reutiliza as tabelas `users` e `sessions` do backend Go. Em produção, configure `DATABASE_URL` para o PostgreSQL; o override do Docker pode apontar essa URL para o túnel SSH. SQLite fica reservado para desenvolvimento local e testes.

O contrato migrado inclui login, refresh com rotação, logout, usuário atual, usuários ativos, credenciais de desenvolvimento e administração de usuários.

O schema e os usuários iniciais são preparados explicitamente pelo comando `auth-init`; importar a aplicação não cria banco nem executa seed.

Estrutura do módulo:

- `features/auth/model.py`: modelos ORM, papéis e serialização;
- `features/auth/schema.py`: schemas, normalização e validação dos payloads;
- `features/auth/repository.py`: persistência ORM e primitivas de segurança;
- `features/auth/controller.py`: controllers Flask e autorização.


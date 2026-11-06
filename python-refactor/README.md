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
- `GET /api/health`
- `GET /api`

O middleware HTTP adiciona o cabeçalho `X-Request-ID`, registra duração/status das requisições e converte erros para uma resposta JSON consistente. Configure origens CORS separadas por vírgula em `CORS_ORIGINS`.

## Migração do auth

O módulo Python reutiliza as tabelas `users` e `sessions` do backend Go. Para testar os dois backends contra o mesmo banco, configure `DB_PATH` para o arquivo SQLite compartilhado e use o mesmo `AUTH_JWT_SECRET`.

O contrato migrado inclui login, refresh com rotação, logout, usuário atual, usuários ativos, credenciais de desenvolvimento e administração de usuários.

O schema e os usuários iniciais são preparados explicitamente pelo comando `auth-init`; importar a aplicação não cria banco nem executa seed.

Estrutura do módulo:

- `auth/model.py`: modelos ORM, papéis e serialização;
- `auth/schema.py`: schemas, normalização e validação dos payloads;
- `auth/repository.py`: persistência ORM e primitivas de segurança;
- `auth/controller.py`: controllers Flask e autorização.


# RKM Service Manager — Python backend

Backend Flask inicial para a migração incremental do serviço Go.

## Desenvolvimento

```bash
uv sync
uv run pytest
uv run flask --app app:app run --debug --port 8788
```

Endpoints iniciais:

- `GET /health`
- `GET /api/health`
- `GET /api`

O middleware HTTP adiciona o cabeçalho `X-Request-ID`, registra duração/status das requisições e converte erros para uma resposta JSON consistente. Configure origens CORS separadas por vírgula em `CORS_ORIGINS`.


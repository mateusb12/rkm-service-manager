# Backend

API Go da autenticação do RKM Service Manager. Em desenvolvimento, o primeiro start cria o SQLite e faz o seed idempotente dos quatro usuários demonstrativos.

```bash
go run .
```

Variáveis principais estão em [.env.example](.env.example). O backend usa `8787` por padrão.

## Arquitetura

- `main.go`: inicialização, roteamento e servidor HTTP.
- `internal/features/auth`: autenticação, usuários, sessões, cargos e permissões.
- `internal/shared/config`: configuração por variáveis de ambiente.
- `internal/shared/database`: abertura da conexão SQLite.
- `internal/shared/httpx`: respostas HTTP, CORS e arquivos estáticos.

Os endpoints permanecem em `/api/auth/*`. O SQLite e seus dados
continuam no mesmo caminho configurado por `DB_PATH`.

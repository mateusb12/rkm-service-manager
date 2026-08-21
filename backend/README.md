# Backend

API Go da autenticação do RKM Service Manager. Em desenvolvimento, o primeiro start cria o SQLite e faz o seed idempotente dos cinco usuários dummy.

```bash
go run .
```

Variáveis principais estão em [.env.example](.env.example). O backend usa `8787` por padrão.

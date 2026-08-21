# RKM Service Manager

Vocabulário compartilhado para identidade, acesso e operação do RKM Service Manager.

## Identidade e acesso

**Usuário**:
Pessoa autenticável do sistema, identificada por e-mail e associada a um cargo.
_Evitar_: conta, operador (quando a pessoa pode ter outro cargo)

**Cargo**:
Função organizacional atribuída a um usuário e usada como base para definir seu acesso.
_Evitar_: perfil, tipo de usuário

**Permissão**:
Capacidade específica de visualizar ou executar uma ação no sistema.
_Evitar_: acesso genérico

**Visibilidade**:
Conjunto de registros e informações que um usuário pode visualizar conforme seu cargo e contexto operacional.
_Evitar_: escopo de tela

**Sessão**:
Período autenticado em que o sistema reconhece um usuário e aplica seu cargo, permissões e visibilidade.
_Evitar_: login (login é o ato de iniciar a sessão)

**Refresh de sessão**:
Renovação controlada de uma sessão válida sem exigir que o usuário informe novamente a senha.
_Evitar_: refresh token como termo de domínio

**RBAC**:
Modelo de autorização que relaciona cargos a permissões e visibilidades; a decisão final de acesso pertence ao backend.
_Evitar_: RBC, permissão somente no frontend

## Operação

**Admin**:
Cargo administrativo com acesso global ao sistema, sujeito apenas às proteções de segurança que não podem ser ignoradas.
_Evitar_: superusuário (quando o assunto for o cargo do RKM)

**Mapa de cargos**:
`admin` = Admin; `operator` = Operador / Técnico; `supervisor` = Supervisor; `quality` = Qualidade; `pcp` = PCP. Os identificadores técnicos permanecem estáveis e os nomes em português são a apresentação oficial.

**Usuários dummy**:
Usuários de desenvolvimento com e-mails no domínio `rkm.com.br`; não representam credenciais de produção.
_Evitar_: usuários reais

**Operador / Técnico**:
Cargo responsável pela execução e registro das etapas técnicas atribuídas.
_Evitar_: técnico, quando o contexto exigir o cargo formal

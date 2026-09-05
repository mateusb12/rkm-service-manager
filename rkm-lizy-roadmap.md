# RKM × Lizy — Roadmap de Paridade do Uso Real

> **Objetivo atual:** fazer o RKM atingir paridade com o subconjunto da Lizy que a RKM Hidráulica realmente utiliza hoje — não reproduzir 100% da Lizy.

## 1. Regra de escopo

Uma funcionalidade entra no roadmap de paridade somente quando houver evidência de que ela é usada pela RKM ou quando for dependência necessária de um fluxo usado.

Não entram no roadmap apenas porque existem na Lizy.

### Classificação

- **✅ Já existe no RKM** — capacidade operacional já implementada.
- **🟡 Parcial no RKM** — modelada ou disponível no MVP, mas ainda não equivalente ao uso real da Lizy.
- **❌ Falta no RKM** — usada na Lizy e ainda sem equivalente no RKM.
- **🔎 Validar** — uso/necessidade ainda precisa de confirmação cirúrgica.
- **🚫 Fora do escopo atual** — disponível na Lizy, porém sem evidência de uso pela RKM.

---

## 2. O que a RKM realmente usa na Lizy

A auditoria de 05/09/2026 encontrou uso recente principalmente em:

1. **Serviços / Ordens de Serviço**
2. **PCP / acompanhamento por setor**
3. **Orçamentos**
4. **Compras**
5. **Estoque e requisições**
6. **Recebimento**
7. **Financeiro / lançamentos**
8. **Faturamento**
9. **Documentos fiscais**

### Evidências recentes observadas

- Desmontagem/Análise: **22 OS**; peritagem observada em **04/09/2026 08:00**.
- Finalizados: **6 OS em setembro/2026** e **86 em 2026**; finalização visível em **03/09/2026**.
- Orçamentos: **130 aguardando envio**, **305 aguardando aprovação**, **63 aprovados**, **13 não aprovados**.
- Compras: **17 requisições**, **4 cotações**, **19 compras**; RC83 em **04/09/2026 14:37**.
- Estoque: **145 requisições** e **765 itens em estoque**; RE145 em **04/09/2026 08:41**.
- Financeiro: **185 lançamentos**, sendo **40 a receber** e **145 a pagar**.
- Faturamento: **150 OS liberadas**.
- Fiscal: **39 notas/protocolos autorizados**; NF 1285 em **27/08/2026**.

> A auditoria não conseguiu determinar com segurança qual foi a OS mais recentemente criada, pois a data de abertura não estava disponível de forma confiável.

---

## 3. O que não deve puxar o roadmap agora

As capacidades abaixo existem na Lizy, mas não apresentaram evidência de uso operacional suficiente no tenant auditado:

- 🚫 CRM / funil
- 🚫 Prospecção
- 🚫 Cobrança / boletos
- 🚫 Conciliação bancária
- 🚫 Atendimento Externo
- 🚫 Locações
- 🚫 Ativos imobilizados / movimentação de ferramentas
- 🚫 Centro de custo
- 🚫 Agentes de IA
- 🚫 Agenda, salvo confirmação posterior de necessidade

### Não concluir ainda

As filas **Testes** e **Qualidade** estavam vazias no momento da auditoria, mas aparecem no modelo operacional e dentro da estrutura das OS. Portanto, não devem ser descartadas somente por estarem com zero itens no instante da inspeção.

---

# 4. Estado atual do RKM

## 4.1 Capacidades já existentes

O RKM já possui uma base especializada para execução técnica:

- ✅ Autenticação real.
- ✅ Cargos e RBAC no backend:
  - Admin
  - Operador / Técnico
  - Supervisor
  - Qualidade
  - PCP
- ✅ Visões por cargo.
- ✅ IT001 — acumulador tipo bexiga.
- ✅ IT002 — acumulador tipo pistão.
- ✅ Fluxos técnicos de 20 etapas.
- ✅ Alertas e bloqueios críticos.
- ✅ Validação de supervisor.
- ✅ Validação de qualidade modelada.
- ✅ Não conformidade / interrupção modeladas.
- ✅ Pendências.
- ✅ Histórico de autorizações modelado.
- ✅ Resumo / laudo em tela.
- ✅ Identificação do equipamento.
- ✅ Status, prioridade e responsáveis.
- ✅ Dashboard e bancada do operador.

## 4.2 Limitações atuais importantes

Apesar da profundidade técnica, o MVP ainda não possui paridade operacional com a Lizy:

- 🟡 Registros de serviço ainda trabalham como rascunhos no frontend/localStorage.
- 🟡 A listagem operacional usa serviços de exemplo/mock.
- 🟡 Evidências são marcadas no modelo, mas o próprio sistema identifica upload real como futuro.
- 🟡 Resumo/laudo existe, mas ainda não equivale ao ciclo documental usado na Lizy.
- ❌ Não há fluxo produtivo real por setores.
- ❌ Não há apontamento real de início/fim/horas por serviço/setor.
- ❌ Não há peças vinculadas à OS.
- ❌ Não há estoque operacional.
- ❌ Não há requisições de estoque.
- ❌ Não há compras/cotações.
- ❌ Não há recebimento.
- ❌ Não há orçamento comercial equivalente.
- ❌ Não há financeiro operacional equivalente.
- ❌ Não há faturamento/fiscal equivalente.

---

# 5. Matriz de paridade — Lizy usada × RKM atual

| Capacidade usada na Lizy | Evidência de uso | RKM atual | Gap |
|---|---|---|---|
| Criar e acompanhar OS | Uso recente | 🟡 Parcial | Persistência real, CRUD e histórico |
| Cliente na OS | Uso estrutural | 🟡 Parcial | Cadastro/persistência operacional |
| Equipamento na OS | Uso estrutural | ✅/🟡 | Base técnica existe; persistência real falta |
| Técnico e responsáveis | Uso estrutural | ✅/🟡 | RBAC existe; operação ainda mock/local |
| Prioridade e status | Uso estrutural | ✅/🟡 | Persistência e transições reais |
| Inspeção técnica | Uso confirmado | ✅ | RKM é mais especializado em IT001/IT002 |
| Diagnóstico | Uso confirmado | ✅ | Consolidar no backend |
| Checklist | Uso confirmado | ✅ | Consolidar no backend |
| Regras/bloqueios técnicos | Lizy parcial / RKM forte | ✅ | Diferencial do RKM |
| Filas por setor | Uso ativo | ❌ | Implementar |
| PCP / acompanhamento da produção | 7 OS observadas | 🟡 | Tornar operacional e persistente |
| Limpeza | 5 OS | ❌ como fila real | Implementar setor |
| Usinagem | 3 OS | ❌ como fila real | Implementar setor |
| Montagem | 5 OS | ❌ como fila real | Implementar setor |
| Pintura | 2 OS | ❌ como fila real | Implementar setor |
| Testes | Estrutura existe; fila vazia | 🔎 | Validar histórico antes de definir |
| Qualidade | Estrutura existe; fila vazia | ✅/🔎 | Validar fluxo histórico e tornar persistente |
| Tempo no setor | Uso confirmado na OS | ❌ | Implementar apontamento |
| Início/fim/horas | Uso confirmado | ❌ | Implementar apontamento |
| Serviços da OS | Uso confirmado | 🟡 | Modelo técnico existe, catálogo operacional falta |
| Peças da OS | Uso confirmado | ❌ | Implementar |
| Custo/venda de peça | Uso confirmado | ❌ | Implementar |
| Serviço externo | 3 registros | ❌ | Implementar ou validar prioridade |
| Fotos | Estrutura Lizy confirmada | 🟡 | Upload/storage real |
| Arquivos | Estrutura Lizy confirmada | 🟡 | Upload/storage real |
| Laudo/relatório | Uso estrutural confirmado | 🟡 | Geração documental real |
| Finalização de OS | 86 em 2026 | 🟡 | Estado persistente e workflow real |
| Orçamentos | Uso forte | ❌ | Implementar |
| Requisições de estoque | 145 | ❌ | Implementar |
| Estoque | 765 itens | ❌ | Implementar |
| Compras/requisições/cotações | Uso recente | ❌ | Implementar |
| Recebimento | Uso recente | ❌ | Implementar |
| Financeiro / lançamentos | 185 lançamentos | ❌ | Implementar se saída total da Lizy for objetivo |
| Faturamento | 150 OS liberadas | ❌ | Implementar se saída total da Lizy for objetivo |
| Documentos fiscais | 39 autorizados | ❌ | Implementar/integrar se saída total da Lizy for objetivo |

---

# 5.1 Índice rápido — qual tela da Lizy abrir enquanto programa

| Se estiver implementando... | Abra na Lizy |
|---|---|
| Criação/persistência de OS | `Serviços → Desmontagem → Criar Ordem` |
| Lista/status da OS | `Serviços → Desmontagem` |
| Inspeção/checklist/diagnóstico | uma OS em `Serviços → Desmontagem → Alterar Ordem` |
| Setores/PCP | `Serviços → PCP` e a fila do setor correspondente |
| Apontamento de horas | uma OS aberta em `Análise - Cilindro` |
| Fotos/arquivos/laudo | abas da própria OS |
| Peças da OS | aba `Peças Ordem` |
| Estoque/requisição | `Suprimentos → Estoque` |
| Compras/cotações | `Suprimentos → Compras` |
| Recebimento | `Logística → Recebimento` |
| Orçamento | `Comercial → Orçamentos` |
| Financeiro | `Financeiro → Lançamentos` |
| Faturamento | `Financeiro → Faturamento` |
| Fiscal | `Financeiro → Faturamento → Faturados/Notas Fiscais` |

> Este índice é deliberadamente baseado no **uso real auditado**. Menus vazios ou não utilizados não são fonte de verdade do roadmap atual.

---

# 6. Roadmap

## Fase 0 — Base operacional real

**Objetivo:** tirar o núcleo de serviços do estado de protótipo e torná-lo fonte de verdade.

### Fonte de verdade na Lizy

Use estas telas abertas enquanto implementar a base da OS:

| O que comparar | Sidebar Lizy | Rota observada | O que olhar |
|---|---|---|---|
| Lista/fila de OS | `Serviços → Desmontagem` | `/servicos/fila/ed349c70-099e-4610-8512-e8f626004b90` | Número da OS, cliente, status, técnico, observações, prazo/dias restantes e ações |
| Criação da OS | `Serviços → Desmontagem → Criar Ordem` | `/FilaExpedicao/CriarOrdem/49` | Tipo Serviço/Garantia, nº OS, data prevista, cliente, nota, fabricante, equipamento, modelo, urgente, técnico, série, defeito, rastreabilidade e arquivo de chegada |
| Estrutura de uma OS | abrir uma OS pela fila de Desmontagem | `/FilaAnalise/EdicaoOrdem/6979/0` | Abas, identificação, inspeção, responsáveis, serviços, peças, fotos, arquivos e estados |
| OS encerradas | `Serviços → Finalizados` | `/servicos/fila/e331ca3a-4071-440f-a99e-94f4fec00188` | Estado final, data de término e histórico operacional visível |
| Cliente | `Base de Dados → Cadastros → Clientes` | `/cadastros/clientes` | Estrutura mínima do cadastro necessário para vincular uma OS |
| Usuários | `Base de Dados → Cadastros → Usuários` | `/cadastros/usuarios` | Usuários existentes e estrutura de identidade |
| Permissões | `Configurações` | `/conta` | Permissões/toggles por módulo e comportamento por perfil |

> **Tela principal para Alt+Tab nesta fase:** `Serviços → Desmontagem` + uma OS aberta em `Análise - Cilindro`.

### Entregas

- [ ] Persistir OS no backend/SQLite.
- [ ] CRUD real de OS.
- [ ] Persistir cliente/equipamento/responsáveis da OS.
- [ ] Persistir etapas IT001/IT002.
- [ ] Persistir status, prioridade e setor atual.
- [ ] Persistir autorizações e histórico.
- [ ] Remover dependência de `sampleServices` para operação.
- [ ] Remover `localStorage` como persistência principal de registros operacionais.
- [ ] Criar histórico/auditoria básico de mudanças da OS.

### Critério de saída

Uma OS deve poder ser criada, fechada, reaberta para consulta e continuar íntegra após logout/restart do navegador.

---

## Fase 1 — Paridade do núcleo de Serviços

**Objetivo:** o operador conseguir executar no RKM o fluxo que hoje depende da Lizy.

### Fonte de verdade na Lizy

O fluxo produtivo usado hoje está distribuído principalmente pelo menu `Serviços`.

| Etapa / capacidade | Sidebar Lizy | Rota observada | O que comparar no RKM |
|---|---|---|---|
| Desmontagem / análise | `Serviços → Desmontagem` | `/servicos/fila/ed349c70-099e-4610-8512-e8f626004b90` | Fila, status, técnico, início de serviço e entrada na análise |
| PCP / aprovados | `Serviços → PCP` | `/servicos/fila/410a9684-8b28-480f-be99-aa0e18cd6de8` | OS planejadas e estados dos serviços/setores |
| Serviço externo | `Serviços → Serviço Externo` | `/servicos/fila/a561ccf8-a43b-49eb-b11a-5d143984a2e1` | OS/serviço, fornecedor, prazo, envio/finalização |
| Limpeza | `Serviços → Limpeza` | `/servicos/fila/794d5d0f-3242-405a-a30a-b2ca6e16eadc` | Entrada na fila, estado Em andamento/Iniciar Serviço |
| Usinagem | `Serviços → Usinagem` | `/servicos/fila/1c66174e-fd10-45b7-9185-b70d9f959ce9` | Fila e início/fim do trabalho |
| Montagem | `Serviços → Montagem` | `/servicos/fila/602d944a-6cea-4865-892e-fa7362525036` | Fila e apontamento de montagem |
| Testes | `Serviços → Testes` | `/servicos/fila/d6e512b3-0c16-4f18-bfaa-daeacc414860` | Estrutura da fila; uso histórico ainda precisa ser validado |
| Pintura | `Serviços → Pintura` | `/servicos/fila/5b90bd0f-cb4e-4c1b-aef8-d1b308d80bf0` | OS Em andamento e transição do setor |
| Qualidade | `Serviços → Qualidade` | `/servicos/fila/2af52fe1-e486-46e3-a6c1-d91f78a0ae35` | Estrutura da fila; uso histórico ainda precisa ser validado |
| Finalização | `Serviços → Finalizados` | `/servicos/fila/e331ca3a-4071-440f-a99e-94f4fec00188` | Data fim, estados encerrados e saída do fluxo |
| Inspeção / peritagem | abrir uma OS em Desmontagem | `/FilaAnalise/EdicaoOrdem/6979/0` | C/NC/NA, causa provável, medições, serviços a executar, status final, assinatura técnica e visto da qualidade |
| Apontamento | mesma OS | `/FilaAnalise/EdicaoOrdem/6979/0` | Início, fim, tempo no setor, técnico responsável, horas e prioridade |
| Fotos | mesma OS → aba `Fotos` | `/FilaAnalise/EdicaoOrdem/6979/0` | Upload por componente e organização das evidências |
| Arquivos / laudo | mesma OS → aba `Arquivos` | `/FilaAnalise/EdicaoOrdem/6979/0` | Relatórios da ordem, arquivos e apresentação/impressão do relatório |

> **Tela principal para Alt+Tab nesta fase:** uma OS real em `Análise - Cilindro`. Ela concentra inspeção, apontamento, serviços, fotos, arquivos e qualidade.

### 1.1 Fluxo produtivo por setor

- [ ] Desmontagem / Análise
- [ ] PCP
- [ ] Serviço Externo
- [ ] Limpeza
- [ ] Usinagem
- [ ] Montagem
- [ ] Pintura
- [ ] Testes — condicionado à validação final
- [ ] Qualidade — condicionado à validação final
- [ ] Finalizados

Cada OS deve possuir:

- setor atual;
- histórico de setores;
- responsável;
- data/hora de entrada;
- data/hora de saída;
- status do setor;
- observação;
- bloqueios aplicáveis.

### 1.2 Apontamento

- [ ] Iniciar serviço.
- [ ] Pausar/retomar, se necessário.
- [ ] Finalizar serviço.
- [ ] Técnico responsável.
- [ ] Início.
- [ ] Fim.
- [ ] Horas.
- [ ] Tempo no setor.
- [ ] Histórico de apontamentos.

### 1.3 Evidências

- [ ] Upload real de fotos.
- [ ] Upload real de arquivos.
- [ ] Associação à OS.
- [ ] Associação à etapa/componente.
- [ ] Metadados de autoria/data.
- [ ] Consulta histórica.

### 1.4 Laudo

- [ ] Gerar laudo real a partir da OS.
- [ ] Incluir inspeção, diagnóstico, medições, decisões, peças, serviços e evidências.
- [ ] Registrar versão/data/responsável.
- [ ] Exportação adequada para uso operacional.

### Critério de saída da Fase 1

Uma OS real deve poder atravessar o fluxo produtivo principal sem exigir a Lizy para registrar execução técnica, setor, tempo, evidências, validações e laudo.

---

## Fase 2 — Peças, estoque e suprimentos

**Objetivo:** cobrir a dependência operacional mais forte da OS fora do fluxo técnico.

### Fonte de verdade na Lizy

Nesta fase existem duas fontes: a **OS**, onde nasce a necessidade, e os módulos de **Suprimentos/Logística**, onde ela é atendida.

| Capacidade | Sidebar Lizy | Rota observada | O que comparar no RKM |
|---|---|---|---|
| Peças necessárias da OS | abrir OS → aba `Peças Ordem` | `/FilaAnalise/EdicaoOrdem/6979/0` | Produto/peça, quantidade, unidade, custo, venda, recebido, NCM, IPI/ICMS e observação |
| Estoque operacional | `Suprimentos → Estoque` | `/suprimentos/estoque` | Saldo, níveis, requisições, movimentações e geração de requisição de compra |
| Compras | `Suprimentos → Compras` | `/suprimentos/compras` | Requisição, cotação, compra/pedido, fornecedor, aprovação e chegada |
| Recebimento | `Logística → Recebimento` | `/logistica/recebimento` | Chegada de compra, entrada por nota/XML e manifestação de não conformidade |
| Produtos | `Base de Dados → Cadastros → Produtos` | `/cadastros/produtos` | Cadastro de produto, kits, grupos, preço e dados que alimentam peças/estoque |
| Fornecedores | `Base de Dados → Cadastros → Fornecedores` | `/cadastros/fornecedores` | Cadastro mínimo necessário para compras e serviços externos |
| Locais de estoque | `Base de Dados → Cadastros → Estoques` | `/cadastros/estoque` | Estrutura dos estoques físicos (`01-Geral`, `02-Uso e Consumo`, `03-Ferramentas`) |

> **Tela principal para Alt+Tab nesta fase:** OS na aba `Peças Ordem` de um lado e `Suprimentos → Estoque` do outro. A implementação deve ligar esses dois mundos.

### 2.1 Peças da OS

- [ ] Produto/peça.
- [ ] Quantidade.
- [ ] Unidade.
- [ ] Custo.
- [ ] Venda.
- [ ] Recebido/disponível.
- [ ] Observação.
- [ ] Relação com serviço/componente da OS.

### 2.2 Estoque

- [ ] Cadastro de produtos.
- [ ] Locais de estoque.
- [ ] Saldo.
- [ ] Estoque mínimo.
- [ ] Movimentações.
- [ ] Requisição de material.
- [ ] Vínculo OS ↔ requisição.

### 2.3 Compras

- [ ] Requisição de compra.
- [ ] Cotação.
- [ ] Fornecedor.
- [ ] Pedido de compra.
- [ ] Status.
- [ ] Chegada/recebimento.
- [ ] Vínculo com necessidade originada na OS.

### 2.4 Recebimento

- [ ] Registrar chegada de compra.
- [ ] Dar entrada no estoque.
- [ ] Registrar divergência/não conformidade quando necessário.

### Critério de saída da Fase 2

Uma peça necessária à OS deve poder nascer como necessidade técnica, ser atendida pelo estoque ou virar compra e retornar à OS como disponível/recebida.

---

## Fase 3 — Orçamentos

**Objetivo:** substituir o fluxo comercial que possui evidência clara de uso, sem reconstruir CRM/prospecção não utilizados.

### Fonte de verdade na Lizy

| Capacidade | Sidebar Lizy | Rota observada | O que comparar no RKM |
|---|---|---|---|
| Lista e workflow de orçamento | `Comercial → Orçamentos` | `/comercial/orcamentos` | Referência, cliente, valor, versões e estados do orçamento |
| Serviços orçados da OS | abrir OS → `Serviços Orçamento da Ordem` | `/FilaAnalise/EdicaoOrdem/6979/0` | Quantidade, descrição, setor, valor unitário/total, prazo, custo/venda por hora, técnico e componente |
| Peças que entram no orçamento | abrir OS → `Peças Ordem` | `/FilaAnalise/EdicaoOrdem/6979/0` | Peça, quantidade, custo, venda, impostos e descrição para orçamento |
| Cliente | `Base de Dados → Cadastros → Clientes` | `/cadastros/clientes` | Dados comerciais necessários ao orçamento |

Estados observados na Lizy que devem servir de referência:

- `Aguardando Envio`
- `Aguardando Aprovação`
- `Aprovados`
- `Não Aprovados`
- `Finalizados`
- `Consolidados`

> **Tela principal para Alt+Tab nesta fase:** `Comercial → Orçamentos`. Para composição detalhada, mantenha também uma OS aberta nas abas `Serviços Orçamento da Ordem` e `Peças Ordem`.

### Entregas

- [ ] Criar orçamento.
- [ ] Cliente.
- [ ] Referência/OS.
- [ ] Serviços.
- [ ] Peças.
- [ ] Quantidades.
- [ ] Valores.
- [ ] Versões.
- [ ] Status:
  - aguardando envio;
  - aguardando aprovação;
  - aprovado;
  - não aprovado;
  - finalizado/consolidado quando aplicável.
- [ ] Histórico de alterações/status.

### Fora desta fase

- CRM/funil.
- Prospecção.
- Automação comercial genérica.

### Critério de saída

A RKM deve conseguir montar e acompanhar o orçamento associado ao serviço sem usar o módulo de Orçamentos da Lizy.

---

## Fase 4 — Financeiro, faturamento e fiscal

**Objetivo:** necessário **somente se o objetivo for abandonar a Lizy por completo**. A auditoria mostra que esses módulos são usados e, portanto, não podem ser ignorados em uma migração total.

### Fonte de verdade na Lizy

Não use Cobrança/Boletos ou Conciliação como referência obrigatória de paridade neste momento: ambas estavam sem evidência de uso. Foque somente no que apareceu ativo.

| Capacidade | Sidebar Lizy | Rota observada | O que comparar no RKM |
|---|---|---|---|
| Visão financeira | `Financeiro → Visão Geral` | `/financeiro/visao-geral` | Receitas, despesas, saldo, filtros de período e relatórios utilizados |
| Lançamentos | `Financeiro → Lançamentos` | `/financeiro/lancamentos-v2` | A pagar/a receber, emissão, vencimento, valor, status, conta e categoria |
| Faturamento de OS | `Financeiro → Faturamento` | `/financeiro/faturamento-v2` | OS liberadas, pronta/bloqueada para faturar, cliente, referência e emissão |
| Documentos fiscais | `Financeiro → Faturamento → Faturados/Notas Fiscais` | `/financeiro/notas-fiscais-v2` | NF-e/NFS-e, status, XML, protocolo, autorização/rejeição/cancelamento |
| Contas bancárias | `Base de Dados → Cadastros → Contas Bancárias` | `/cadastros/contas-bancarias` | Estrutura das contas usadas pelos lançamentos |
| Categorias financeiras | `Base de Dados → Cadastros → Categorias Financeiras` | `/cadastros/categorias-financeiras` | Classificação das receitas/despesas |

> **Tela principal para Alt+Tab nesta fase:** `Financeiro → Lançamentos` para o financeiro operacional e `Financeiro → Faturamento` para a transição OS → faturamento.

### 4.1 Financeiro operacional

- [ ] Contas a pagar.
- [ ] Contas a receber.
- [ ] Emissão/vencimento/pagamento.
- [ ] Categorias financeiras.
- [ ] Contas bancárias.
- [ ] Status.
- [ ] Visão de receitas/despesas.

### 4.2 Faturamento

- [ ] OS liberada para faturamento.
- [ ] Bloqueio/liberação.
- [ ] Cliente.
- [ ] Valor.
- [ ] Referência da OS/orçamento.
- [ ] Status de faturamento.

### 4.3 Fiscal

Decisão arquitetural obrigatória:

- [ ] implementar emissão fiscal no RKM; **ou**
- [ ] integrar com um provedor/sistema fiscal externo.

Cobertura observada na Lizy:

- NF-e;
- NFS-e;
- documentos/protocolos;
- XML;
- estados de autorização/rejeição/cancelamento.

### Critério de saída

Se a Lizy for cancelada totalmente, nenhuma rotina financeira/fiscal ativa pode depender dela.

---

# 7. Validação cirúrgica final — antes de congelar o roadmap

Vale uma última inspeção, mas **somente nos pontos que podem alterar o roadmap**.

Não refazer o crawl geral.

## Perguntas finais

### Testes e Qualidade

- [ ] Abrir OS finalizadas recentes e verificar se passaram por Testes.
- [ ] Verificar se houve registro/visto real de Qualidade.
- [ ] Estimar frequência: obrigatório, ocasional ou não usado.

### Fotos, arquivos e laudos

Em uma pequena amostra de OS recentes/finalizadas:

- [ ] Fotos realmente foram anexadas?
- [ ] Arquivos realmente foram anexados?
- [ ] Relatório/laudo foi gerado?
- [ ] Esses itens são rotina ou apenas capacidade disponível?

### Apontamento

Em OS recentes/finalizadas:

- [ ] Início/fim estão preenchidos?
- [ ] Horas são usadas de verdade?
- [ ] Tempo por setor é usado?
- [ ] Técnico responsável por serviço é preenchido?

### Peças / estoque

Em OS recentes:

- [ ] Peças da OS estão efetivamente preenchidas?
- [ ] Há vínculo observável entre OS e requisição de estoque?
- [ ] O status “recebido” da peça é usado?

### Serviço externo

- [ ] Os três registros representam fluxo atual ou histórico?
- [ ] Há OS recentes dependendo de fornecedor externo?

### Financeiro/fiscal

Não é necessário aprofundar funcionalidade. Apenas confirmar com o cliente:

- [ ] A intenção futura é cancelar a Lizy inteira?
- [ ] Se sim, financeiro/faturamento/fiscal entram obrigatoriamente no roadmap.
- [ ] Se não, definir qual sistema continuará sendo dono desses dados.

---

# 8. Definição de “paridade com a Lizy”

A paridade **não** será medida por quantidade de menus.

O RKM atinge o objetivo quando:

1. todas as capacidades da Lizy com **uso real confirmado pela RKM** possuem equivalente no RKM ou integração explicitamente definida;
2. o fluxo operacional pode ocorrer sem depender de uma funcionalidade ativa da Lizy;
3. dados e histórico necessários permanecem persistidos;
4. módulos não utilizados da Lizy não são reconstruídos apenas para aumentar cobertura nominal;
5. os diferenciais técnicos atuais do RKM — IT001/IT002, regras críticas, bloqueios e validações — são preservados.

## Métrica sugerida

```text
Paridade de uso =
capacidades ativas cobertas pelo RKM
────────────────────────────────────
capacidades ativas utilizadas na Lizy
```

A meta inicial é **100% de paridade sobre o uso real**, e não 100% de paridade sobre o catálogo da Lizy.

---

# 9. Ordem recomendada

```text
Fase 0 — Persistência e OS real
           ↓
Fase 1 — Serviços / setores / apontamento / evidências / laudo
           ↓
Fase 2 — Peças / estoque / compras / recebimento
           ↓
Fase 3 — Orçamentos
           ↓
Fase 4 — Financeiro / faturamento / fiscal
           somente se a saída total da Lizy for objetivo
```

Essa ordem protege o diferencial do RKM e fecha primeiro os gaps que impedem substituir a Lizy no dia a dia da operação técnica.

---

# 10. Fora do roadmap de paridade neste momento

Até surgir evidência contrária:

- CRM/funil;
- prospecção;
- boletos/remessa;
- conciliação bancária;
- atendimento externo;
- locações;
- ativos imobilizados;
- centro de custo;
- agentes de IA;
- agenda genérica.

Esses itens podem ser revisitados no futuro, mas **não contam como gap para o objetivo atual de paridade de uso real**.
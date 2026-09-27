# RKM × Lizy — Raio-X do Uso Atual

> **Objetivo:** registrar, de forma objetiva, o que pertence à OFICINA, o que pertence à NÃO-OFICINA, o que a RKM realmente usa, o que não apresenta uso e o que estava sem registro no momento da inspeção.

**Data da inspeção:** 27/09/2026  
**Empresa ativa:** Rkm Hidraulica  
**Fonte:** sidebar da Lizy e telas operacionais acessíveis a partir dela.

## Como ler este documento

- **USA**: há registros, volumes ou estados operacionais visíveis na tela.
- **NÃO USA / sem evidência**: a funcionalidade existe, mas a tela não apresentou operação ou registro que justifique considerá-la usada.
- **SEM REGISTRO ATUAL**: a tela existe, mas estava vazia, zerada ou sem itens carregados durante a inspeção. Isso não prova que nunca tenha sido usada.
- **USA INDIRETAMENTE**: não há necessariamente uma fila preenchida própria, mas o fluxo aparece registrado em outra tela operacional, principalmente no PCP.

---

# 1. OFICINA

OFICINA é tudo que participa da entrada, inspeção, execução, acompanhamento, validação e finalização de uma Ordem de Serviço.

## 1.1 O que a OFICINA USA

### Desmontagem / análise

**Status: USA**

Menu: `Serviços → Desmontagem`

Evidências:

- 17 ordens na fila durante a inspeção.
- Ordens com status `Aguardando Inspeções`.
- A fila apresenta número da OS, cliente, status, técnico, observações, dias restantes e funções.
- A tela permite criar ordem e acessar a ordem para análise.
- Havia OS recentes, inclusive números 20265592, 20265591, 20265590, 20265589 e OS-DEBUG-001.

O que isso representa:

- entrada operacional da OS;
- identificação do cliente e equipamento;
- fila de inspeção;
- distribuição/visualização de responsáveis;
- controle de prioridade e prazo;
- início do fluxo técnico da oficina.

### PCP / planejamento da oficina

**Status: USA**

Menu: `Serviços → PCP`

Evidências:

- 10 ordens no PCP.
- 0 ordens aguardando planejamento no momento da inspeção.
- A tela exibe as colunas ordem, cliente, categoria do equipamento, observações, prioridade, dias restantes e funções.
- O PCP mostra o estado de cada serviço dentro da ordem.
- Foram observados serviços `Em andamento`, `Finalizado`, `Iniciar Montagem` e `Não Possui Serviço`.

O PCP é a principal evidência de que a oficina não trabalha apenas com uma fila de desmontagem: existe acompanhamento por setor e por etapa produtiva.

### Limpeza

**Status: USA INDIRETAMENTE**

Evidência encontrada no PCP:

- ordens com Limpeza `Em andamento`;
- ordens com Limpeza `Finalizado`.

A rota própria de Limpeza não apresentou registros preenchidos durante o crawl. A existência de estados no PCP, porém, comprova que Limpeza participa do fluxo de algumas OS.

### Usinagem

**Status: USA INDIRETAMENTE**

Evidência encontrada no PCP:

- ordens com Usinagem `Finalizado`.

A rota própria de Usinagem não apresentou registros preenchidos durante o crawl, mas o serviço aparece efetivamente no acompanhamento das ordens.

### Montagem

**Status: USA INDIRETAMENTE**

Evidências encontradas no PCP:

- ordens com Montagem `Iniciar Montagem`;
- ordens com Montagem `Finalizado`.

Montagem deve ser considerada parte do fluxo da oficina, mesmo que a tela isolada não tenha sido usada como fonte principal de contagem.

### Testes

**Status: USA INDIRETAMENTE**

Evidência encontrada no PCP:

- ordens com Teste `Finalizado`.

A fila direta de Testes não apresentou registros durante o crawl, mas não deve ser classificada como não usada: há estados finalizados registrados dentro do PCP.

### Pintura

**Status: USA INDIRETAMENTE**

Evidência encontrada no PCP:

- ordens com Pintura `Finalizado`.

A tela direta de Pintura não apresentou registros no momento da inspeção, mas o setor aparece no fluxo produtivo das OS.

### Qualidade

**Status: USA INDIRETAMENTE**

Evidência encontrada no PCP:

- ordens com Qualidade `Em andamento`.

A fila própria não apresentou registros durante o crawl. Ainda assim, Qualidade está presente como etapa operacional real dentro de ordens acompanhadas pelo PCP.

### Finalização de OS

**Status: USA**

Menu: `Serviços → Finalizados`

Evidências:

- 31 ordens finalizadas no mês exibido.
- 111 ordens finalizadas no ano exibido.
- A listagem possui número da OS, cliente, data de fim, foto e funções.
- Foram observadas finalizações recentes, incluindo datas em 03/09/2026, 10/09/2026, 14/09/2026, 16/09/2026 e 22/09/2026.

Isso comprova que o fluxo da oficina chega a um estado de encerramento operacional e mantém histórico de ordens concluídas.

### Serviço externo dentro da oficina

**Status: SEM REGISTRO ATUAL**

Menu: `Serviços → Serviço Externo`

Evidência:

- a tela apresentou `Nenhum registro encontrado`;
- total exibido: 0 registros.

Não é possível concluir, apenas por essa tela vazia, que a RKM nunca usa fornecedor externo. A classificação correta é sem registro atual; o histórico anterior mencionava poucos registros, mas não foi confirmado nesta inspeção.

## 1.2 Capacidades da OFICINA sem comprovação suficiente nesta inspeção

Estas capacidades existem na estrutura da Lizy ou aparecem dentro das telas de OS, mas não tiveram seu uso efetivo comprovado pelo crawl da sidebar:

| Capacidade | Estado | O que foi possível observar |
|---|---|---|
| Apontamento de início/fim | SEM REGISTRO ATUAL / validar | A estrutura é esperada no fluxo de OS, mas não foi medida em uma OS aberta nesta inspeção |
| Horas e tempo por setor | SEM REGISTRO ATUAL / validar | Não houve amostra detalhada de apontamentos |
| Peças vinculadas à OS | SEM REGISTRO ATUAL / validar | A capacidade existe na OS, mas não foi contabilizada |
| Fotos | SEM REGISTRO ATUAL / validar | A coluna Foto existe em Finalizados, mas não foi aberta uma amostra para verificar anexos |
| Arquivos | SEM REGISTRO ATUAL / validar | A aba/capacidade existe, mas não houve comprovação de anexos nesta passagem |
| Laudo/relatório | SEM REGISTRO ATUAL / validar | A estrutura é mencionada no fluxo, mas o uso efetivo não foi observado |

## 1.3 Resumo da OFICINA

### Usa

- Desmontagem e análise.
- Ordens de Serviço.
- PCP e planejamento.
- Limpeza, Usinagem, Montagem, Testes, Pintura e Qualidade como etapas observadas no PCP.
- Finalização e histórico de OS.

### Não há evidência suficiente para chamar de “usa”

- apontamento de horas;
- tempo por setor;
- peças da OS;
- fotos efetivamente anexadas;
- arquivos efetivamente anexados;
- laudo efetivamente gerado;
- Serviço Externo como fluxo atual preenchido.

### Não deve ser descartado

Testes e Qualidade não podem ser classificados como “não usados” só porque suas filas diretas estavam vazias. Ambos aparecem como estados dentro de ordens do PCP.

---

# 2. NÃO-OFICINA

NÃO-OFICINA é tudo que apoia a operação ou pertence aos domínios comercial, suprimentos, logística, financeiro e fiscal, mas não é execução direta do serviço técnico na bancada.

## 2.1 Comercial

### Orçamentos

**Status: USA**

Menu: `Comercial → Orçamentos`

Evidências atuais:

- 120 orçamentos `Aguardando Envio`;
- 310 orçamentos `Aguardando Aprovação`;
- 69 orçamentos `Aprovados`;
- 16 orçamentos `Não Aprovados`.

Também foram observados:

- referências vinculadas a OS, como OS 2026593, OS 20265588 e OS 20265587;
- cliente;
- vendedor;
- equipamento;
- observação;
- situação do orçamento;
- data desde a qual está pendente;
- valor;
- indicação de agendamento.

Orçamento é uso real e prioritário. Não é apenas um menu disponível.

### CRM / funil

**Status: NÃO USA / sem evidência**

Menu: `Comercial → CRM`

Evidência:

- a tela informa `Nenhum funil cadastrado`.

Não há funil, oportunidade ou pipeline comercial registrado na tela inspecionada.

### Dashboard comercial

**Status: NÃO USA / sem evidência**

Menu: `Comercial → Dashboard`

Evidência:

- a tela possui cartões e relatórios disponíveis, mas não apresentou métricas preenchidas de clientes, ticket ou vendas durante a inspeção.

O dashboard existir não é evidência de uso operacional.

## 2.2 Suprimentos

### Compras

**Status: USA**

Menu: `Suprimentos → Compras`

Volumes exibidos:

- 22 requisições de compra;
- 4 cotações;
- 19 compras.

Evidências de operação:

- RC83 criada em 04/09/2026 às 14:37;
- requisições com status `Aguardando Suprimentos`;
- itens pendentes;
- prioridades `Urgente` e `Alta`;
- observações como `Para Uso na Oficina`, `Serviço`, `Uso Diário Oficina`, `Uso de Oficina` e `Uso Interno no Compressor`.

Compras é claramente parte da operação real e possui ligação explícita com necessidades da oficina.

### Estoque

**Status: USA**

Menu: `Suprimentos → Estoque`

Evidências atuais:

- 765 itens em estoque;
- 0 itens abaixo do estoque;
- 765 itens classificados como nível `ALTO`;
- 0 itens no nível `IDEAL`;
- 0 itens no nível `BAIXO`;
- 125 itens no nível `ZERO`.

A tela também possui a área `Requisições Estoque`, com ação para criar nova requisição.

### Requisições de estoque

**Status: USA**

Evidência concreta: 174 requisições. Primeiras 10 observadas:

| Data | Código | Referência | Status |
|---|---|---|---|
| 17/09/2026 15:07 | RE173 | Requisição OS 2026458 | Pendente |
| 17/09/2026 08:11 | RE172 | Requisição OS 20265586 | Pendente |
| 14/09/2026 13:10 | RE171 | Requisição OS 2026557 | Pendente |
| 14/09/2026 13:10 | RE170 | Requisição OS 2026556 | Pendente |
| 14/09/2026 13:10 | RE169 | Requisição OS 2026392 | Pendente |
| 14/09/2026 13:10 | RE168 | Requisição OS 2026393 | Pendente |
| 14/09/2026 13:10 | RE167 | Requisição OS 2026391 | Pendente |
| 14/09/2026 10:51 | RE166 | Requisição OS 2026522 | Pendente |
| 14/09/2026 10:50 | RE165 | Requisição OS 2026523 | Pendente |
| 14/09/2026 10:50 | RE164 | Requisição OS 2026524 | Pendente |

Isso comprova ligação direta entre estoque e OS da oficina.

## 2.3 Logística

### Recebimento

**Status: USA**

Menu: `Logística → Recebimento`

Evidências:

- notas emitidas de fornecedores listadas;
- fornecedores reais identificados;
- número da nota;
- chave de acesso;
- natureza da operação;
- valor;
- data de emissão;
- status `Não Baixada`.

Foram observadas notas como 23656, 67629, 30895, 15540, 5649, 11892, 95106, 23638 e 30816.

A tela oferece `Entrada Compra` e `Gerar XML das Notas Fornecedor`, indicando uso operacional de recebimento e entrada fiscal.

### Estoque terceiro

**Status: USA**

Menu: `Logística → Estoque Terceiro`

Evidências:

- registros de nota de entrada;
- cliente associado;
- chave de acesso;
- situação `Ag. Devolução`;
- datas de devolução.

Foram observados registros para Mizu Barauna, Teclav, Siemens Gamesa, Gerdau Caucaia e outros clientes.

### Expedição

**Status: SEM REGISTRO ATUAL**

Menu: `Logística → Expedição`

Evidência:

- a tela permaneceu em `Carregando registros...` e não mostrou itens operacionais.

Não há base suficiente para afirmar uso ou não uso; o estado correto é sem registro atual.

## 2.4 Financeiro e fiscal

### Visão financeira e lançamentos

**Status: USA**

Menus:

- `Financeiro → Visão Geral`;
- `Financeiro → Lançamentos`.

Evidências atuais:

- Total de Entradas: **R$ 404.267,43**;
- Total de Saídas: **R$ 457.890,57**;
- Saldo Atual: **R$ 189.972,27**;
- Saldo em 31/08/2026: **R$ 75.908,06**;
- Previsão em 30/09/2026: **R$ 27.433,00**;
- lançamentos com NF-e, fornecedor, categoria, conta bancária, parcela, boleto e status pago.

Há também relatórios de contas a pagar/receber, contas pagas/recebidas, fluxo de caixa, faturamento, comissão e lançamentos.

Financeiro é uso real. Deve entrar no escopo se a intenção for substituir a Lizy por completo.

### Faturamento

**Status: USA**

Menu: `Financeiro → Faturamento`

Evidências:

- registros de OS e OV;
- clientes;
- datas de emissão e vencimento;
- registros em atraso;
- situação `Pronta p/ faturar`;
- ação `Emitir Nota`.

Foram observados, entre outros, OS 14587, OS 30303120, OV 2, OV 4, OV 20, OV 31, OV 39, OV 40 e OV 28.

### Documentos fiscais

**Status: USA**

Evidências nas telas de Recebimento e Faturamento:

- NF-e;
- número da nota;
- chave de acesso;
- XML/geração de XML;
- emissão de nota;
- notas de fornecedores;
- estados de baixa e pendência.

Documentos fiscais fazem parte da operação observada, mesmo que a emissão própria ainda precise ser detalhada em uma etapa específica.

### Cobrança / boletos

**Status: NÃO USA / sem evidência atual**

Menu: `Financeiro → Cobrança`

Evidências:

- 0 boletos no período;
- valor total R$ 0,00;
- 0 boletos vencidos;
- 0 boletos com falha;
- `0 of 0` itens listados.

Não há evidência atual de operação de cobrança ou emissão de boletos.

### Conciliação bancária

**Status: SEM REGISTRO ATUAL**

Menu: `Financeiro → Conciliação`

Evidência:

- `Nenhum extrato carregado`;
- nenhum arquivo OFX ou PDF importado na tela;
- o fluxo aparece como disponível, mas depende de importação de extrato.

Não deve ser chamada de usada só porque há uma tela para ela.

## 2.5 Outros módulos da sidebar

### Agenda

**Status: SEM REGISTRO ATUAL**

Menu: `Agenda`

O calendário de setembro/2026 foi exibido, mas não havia evento operacional identificável na inspeção.

### Atendimento Externo

**Status: SEM REGISTRO ATUAL**

Menu: `Atendimento Externo`

A tela possui as seções `Atendimentos Ativos` e `Atendimentos Finalizados`, mas não apresentou registros carregados.

### Locações

**Status: SEM REGISTRO ATUAL**

Menu: `Ativos → Locações`

Evidências:

- Ativos: 0;
- Finalizados: 0;
- `Nenhum Registro Encontrado`;
- `0 of 0` itens.

### Ativos imobilizados / ferramentas

**Status: SEM REGISTRO ATUAL**

Menu: `Ativos → Imobilizados`

Evidência:

- tela de Movimentações sem registros;
- `Nenhum Registro Encontrado`;
- `0 of 0` itens.

### Agentes de IA

**Status: NÃO USA / indisponível para o tenant observado**

Na sidebar, Financeiro, Comercial e Engenheiro aparecem bloqueados na área `Agentes de IA`, sem operação acessível observada.

---

# 3. Cadastros que sustentam os dois escopos

Os cadastros não são classificados como oficina ou não-oficina isoladamente; eles servem de base para os dois lados.

| Cadastro | Estado observado |
|---|---:|
| Clientes | 168 clientes |
| Fornecedores | 341 fornecedores |
| Produtos | 890 produtos |
| Usuários | 12 usuários |
| Estoques físicos | 3 locais |
| Contas bancárias | 7 contas |
| Categorias financeiras | 146 categorias |
| Centro de custo | Nenhum cadastrado |
| Ativos imobilizados | Nenhum cadastrado |
| Transportadoras | 2 transportadoras |

---

# 4. Resumo final

## Usa com evidência atual

### OFICINA

- Desmontagem e análise.
- Ordens de Serviço.
- PCP.
- Limpeza, Usinagem, Montagem, Testes, Pintura e Qualidade como etapas registradas no PCP.
- Finalização de OS.

### NÃO-OFICINA

- Orçamentos.
- Compras, cotações e requisições de compra.
- Estoque.
- Recebimento.
- Estoque terceiro.
- Financeiro e lançamentos.
- Faturamento.
- Documentos fiscais.

## Não usa / não há evidência de uso

- CRM/funil.
- Dashboard comercial como operação recorrente.
- Cobrança e boletos.
- Agentes de IA.

## Sem registro atual — não concluir que nunca usa

- Serviço Externo.
- Apontamento de horas e tempo por setor.
- Peças da OS.
- Fotos, arquivos e laudos efetivamente anexados.
- Requisições de estoque.
- Expedição.
- Conciliação bancária.
- Agenda.
- Atendimento Externo.
- Locações.
- Ativos imobilizados e movimentação de ferramentas.

## 5. Evidências concretas dos cadastros-base

As tabelas abaixo substituem a leitura genérica de “há X cadastros” por exemplos do que efetivamente estava cadastrado.

### Clientes — 168 ativos, 0 inativos

| Código | Cliente | CNPJ/CPF |
|---:|---|---|
| 3 | Rkm Hidraulica | 42.325.935/0001-98 |
| 4 | As Hidropneumatica | 58.155.687/0001-14 |
| 5 | Unidade Joao Camara | 69.119.386/0037-62 |
| 6 | Lizy | 27.473.744/0001-80 |
| 7 | Apodi Caucaia | 10.260.249/0002-70 |
| 8 | Mossoro Plasticos | 09.403.980/0001-48 |
| 9 | Siemens Gamesa Ba | 69.119.386/0011-23 |
| 10 | Siemens Gamesa Trairi | 69.119.386/0070-83 |
| 11 | Rafael de Sousa Nunes | 050.882.863-50 |
| 12 | Magnesium | 07.207.806/0004-47 |

### Fornecedores — 341

| Código | Fornecedor | CNPJ |
|---:|---|---|
| 1 | Comercial Abrantes Ltda | 13.614.797/0002-40 |
| 2 | Marvitubos | 56.287.725/0006-71 |
| 3 | Jrg Saturno | 09.621.419/0001-35 |
| 4 | Filtrec Industria e Comercio de Filtros | 31.080.160/0001-11 |
| 5 | Bemax Servicos | 19.046.437/0001-94 |
| 6 | Btr Hidropneumatica | 41.092.712/0001-65 |
| 7 | Br Hidraulica | 12.196.927/0002-09 |
| 8 | So Vedacoes Centro | 73.728.297/0001-80 |
| 9 | Th Vedacoes | 22.255.463/0001-37 |
| 10 | Difertec | 05.298.238/0001-69 |

### Produtos — 889

| Código | Produto | Custo | Venda | Estoque físico | Unidade |
|---:|---|---:|---:|---:|---|
| 0 | Manometro Diametro 63mm Conexão 1/4 Vertical | R$ 1.500,00 | R$ 3.000,00 | 39,00 | — |
| 1 | Manometro 700 Bar 1/4 | R$ 216,00 | R$ 312,80 | 8,48 | — |
| 2 | Contador de Particulas para Óleo | R$ 27,00 | R$ 54,00 | 1,26 | UN |
| 3 | Sensor para Contador de Particulas Fmss01s0 | R$ 0,00 | R$ 0,00 | 0,00 | UN |
| 4 | Fuh015mg0bs0 — Sistema de Filtragem Movel 15 L/min | R$ 66.000,00 | R$ 0,00 | 1,00 | UN |
| 5 | Fmcs3 — Maleta de Controle Contaminacao e Umidade | R$ 48.000,00 | R$ 96.000,00 | 7,00 | UN |
| 6 | Oleo Hidraulico 68 | R$ 360,00 | R$ 0,00 | 9,00 | BD |
| 7 | Adaptador Cast Reto Macho 3/8 | R$ 47,00 | R$ 0,00 | 23,00 | UN |
| 8 | Macho Manual M16 X 2 | R$ 511,00 | R$ 0,00 | 2,00 | CJ |
| 9 | Filtro Sucção | R$ 142,00 | R$ 0,00 | 1,00 | UN |

### Usuários — 12 visíveis

| Usuário | E-mail |
|---|---|
| Rafael Nunes | rafael.nunes@rkmhidro.com.br |
| Débora Guimarães | financeiro@rkmhidro.com.br |
| Danilo Compras | compras@rkmhidro.com.br |
| Paulo Roberto da Silva | comercial@rkmhidro.com.br |
| Samila Rodrigues | srconsultoriaoficial@gmail.com |
| Rayssa de Sousa Lima | fiscal@rkmhidro.com.br |
| Jefferson Nunes | pcp@rkmhidro.com.br |
| Ricardo Caracas | ricardo.caracas@rkmhidro.com.br |
| Raimundo Nonato | manufatura@rkmhidro.com.br |
| Carlos Gurgel | gurgel@rkmhidro.com.br |
| Jonathan Carneiro | vendas1@rkmhidro.com.br |
| William Rodney | vendas2@rkmhidro.com.br |

### Contas, estoque, categorias e demais bases

| Cadastro | Volume/estado | Exemplos concretos |
|---|---:|---|
| Locais de estoque | 3 | 01 - Geral; 02 - Uso e Consumo; 03 - Ferramentas |
| Contas bancárias | 7 | Nubank Rafael (-R$ 1.872,34); Nubank Rkm (-R$ 8.874,96); Banco Santander (-R$ 5.885,14); Caixa Rkm (R$ 5,78); Cartao de Credito Nubank (-R$ 225,00); Bradesco (R$ 207.517,25); Cartao de Credito Bradesco (-R$ 693,32) |
| Categorias financeiras | 146 | Receita Bruta; Outras Receitas Operacionais; Receitas Financeiras; Aporte Dos Sócios; Devolução de Mercadoria; Importação; Impostos Sobre a Receita; Custo Das Mercadorias; Custo Dos Produtos; Custo Dos Serviços |
| Centro de custo | 0 | Nenhum Registro Encontrado |
| Ativos imobilizados | 0 | Nenhum Registro Encontrado |
| Transportadoras | 2 | Btu - Braspress - Itj; Rkm Hidraulica |

## 6. Tabelas de amostras operacionais

Esta seção concentra os exemplos concretos dos módulos operacionais, para que o estado atual possa ser conferido sem depender apenas dos totais.

### Oficina — Desmontagem

| OS | Cliente | Status |
|---|---|---|
| 20265592 | VLI PECEM | Aguardando Inspeções |
| 20265591 | RKM HIDRAULICA | Aguardando Inspeções |
| 20265590 | PLANALTO INDUSTRIA | Aguardando Inspeções |
| 20265589 | PLANALTO INDUSTRIA | Aguardando Inspeções |
| OS-DEBUG-001 | RKM HIDRAULICA | Aguardando Inspeções |
| 20265584 | RKM HIDRAULICA | Aguardando Inspeções |
| 2026465 | RES ENERGY | Aguardando Inspeções |
| 2026445 | RKM HIDRAULICA | Aguardando Inspeções |
| 2026390 | GERDAU CAUCAIA | Aguardando Inspeções |
| 2026388 | GERDAU CAUCAIA | Aguardando Inspeções |

### Oficina — PCP

| OS | Cliente | Equipamento | Estado resumido |
|---|---|---|---|
| 2026458 | Apodi Caucaia | Bomba manual | Limpeza em andamento; Montagem iniciar |
| 2026522 | Ecofor Ambiental G2 | Cilindro transportador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026524 | Ecofor Ambiental G2 | Cilindro compactador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026525 | Ecofor Ambiental G2 | Cilindro compactador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026526 | Ecofor Ambiental G2 | Cilindro compactador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026527 | Ecofor Ambiental G2 | Cilindro compactador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026530 | Ecofor Ambiental G2 | Cilindro transportador | Limpeza/Usinagem/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026531 | Ecofor Ambiental G2 | Cilindro transportador | Todas as etapas: Não Possui Serviço |
| 2026534 | Ecofor Ambiental G2 | Caixa comando hidráulico | Limpeza/Montagem/Teste/Pintura finalizados; Qualidade em andamento |
| 2026551 | Ecofor Ambiental G2 | Cilindro estribo | Todas as etapas: Não Possui Serviço |

### Oficina — Finalizados

| OS | Cliente | Data |
|---|---|---|
| 20265586 | Bemax Comercio Atacadista | 22/09/2026 |
| 20265579 | Ecofor Ambiental S/A | 10/09/2026 |
| 20265575 | Echoenergia | 14/09/2026 |
| 20265574 | Echoenergia | 14/09/2026 |
| 20265573 | Echoenergia | 14/09/2026 |
| 2026557 | Gerdau Aços Longos | 16/09/2026 |
| 2026556 | Gerdau Aços Longos | 22/09/2026 |
| 2026543 | Ecofor Ambiental S/A | 14/09/2026 |
| 2026537 | RES Energy Services | 03/09/2026 |
| 2026535 | Gerdau Aços Longos | 03/09/2026 |

### Comercial — Orçamentos

| OS | Cliente | Equipamento | Valor |
|---|---|---|---:|
| 2026593 | Mizu Barauna | Bomba — N.I — N.I | R$ 0,00 |
| 20265588 | Gerdau Caucaia | Cilindro guia amarradeira — Parker | R$ 0,00 |
| 20265587 | Can Pack Brasil | Bomba hidráulica para prensa — Bovenau | R$ 0,00 |
| 20265580 | Artur Arruda | Comando hidráulico | R$ 0,00 |
| 20265585 | Gerdau Caucaia | Bomba hidráulica dupla | R$ 0,00 |
| 20265583 | RKM Hidraulica | Bomba de pistão | R$ 0,00 |
| 20265581 | Planalto Industria | Telescópio | R$ 2.350,88 |
| 20265582 | Planalto Industria | Cilindro hidráulico | R$ 2.350,88 |
| 2026562 | Ecofor Ambiental G2 | Cilindro compactador G2 19 | R$ 0,00 |
| 2026358 | RKM Hidraulica | RKM — RKM — RKM | R$ 0,00 |

### Suprimentos — Compras

| Código | Data | Descrição/observação | Prioridade |
|---|---|---|---|
| RC83 | 04/09/2026 | sem descrição | — |
| RC82 | 31/08/2026 | Metalo 50x50; Para Uso na Oficina | Urgente |
| RC81 | 28/08/2026 | Serviço | Urgente |
| RC80 | 14/08/2026 | sem descrição | — |
| RC79 | 10/08/2026 | sem descrição | — |
| RC78 | 06/08/2026 | sem descrição | — |
| RC77 | 28/07/2026 | Uso Diário Oficina | — |
| RC76 | 20/07/2026 | Uso de Oficina | Urgente |
| RC75 | 13/07/2026 | uso oficina | Urgente |
| RC74 | 09/07/2026 | uso de oficina; compressor | Alta |

### Logística — Recebimento

| Fornecedor | NF | Data | Valor | Status |
|---|---:|---|---:|---|
| Bemax | 23656 | 17/09/2026 | R$ 3.783,99 | Não Baixada |
| Recautec Matriz | 67629 | 15/09/2026 | R$ 36,30 | Não Baixada |
| BTR | 30895 | 15/09/2026 | R$ 247,21 | Não Baixada |
| SV Comercio | 15540 | 15/09/2026 | R$ 432,51 | Não Baixada |
| Rolpaf Ceará | 5649 | 14/09/2026 | R$ 205,00 | Não Baixada |
| TH Vedações | 11892 | 14/09/2026 | R$ 4.026,00 | Não Baixada |
| Petral | 95106 | 14/09/2026 | R$ 473,46 | Não Baixada |
| Bemax | 23638 | 11/09/2026 | R$ 184,30 | Não Baixada |
| BTR | 30816 | 11/09/2026 | R$ 184,11 | Não Baixada |
| Difertec | 13727 | 11/09/2026 | R$ 1.645,00 | Não Baixada |

### Logística — Estoque terceiro

| Nota | Cliente | Situação | Devolução |
|---:|---|---|---|
| 754858 | Mizu Barauna | Ag. Devolução | 15/04/2026 |
| 12.997 | Teclav | Ag. Devolução | 19/02/2026 |
| 110.357 | Siemens Gamesa BA | Ag. Devolução | 19/02/2026 |
| 412 | Siemens Gamesa Trairi | Ag. Devolução | 26/02/2026 |
| 44389 | Gerdau Caucaia | Ag. Devolução | 06/05/2026 |
| 114717 | Siemens Gamesa BA | Ag. Devolução | 30/04/2026 |

### Financeiro — Lançamentos

| Tipo/documento | Contraparte | Categoria/descrição | Valor | Situação |
|---|---|---|---:|---|
| NF-E 122024 | Marvitubos | Uso e Consumo | R$ 1.111,10 | Pago |
| NF-E 123003 | Marvitubos | Uso e Consumo | R$ 1.320,17 | Pago |
| SEM NF | Banco Santander | Seguro Santander Auto | R$ 303,60 | Em atraso |
| NF-E 224 | Francisco Fábio | Nota de Serviço | R$ 1.700,00 | Pago |
| NF-E 25 | Unidade João Câmara | Recuperação de Cilindro Hidráulico | R$ 4.740,00 | Pago |
| NF-E 132 | Gerdau Caucaia | Pedido de compra 4524016741 | R$ 953,50 | Pago |
| SEM NF | Bradesco Est Unif | Previdência | R$ 127,91 | Pago |
| NFS-E 195 | Gerdau Caucaia | Nota Serviço | R$ 9.535,02 | Pago |
| NFS-E 194 | Gerdau Caucaia | Nota Serviço | R$ 7.714,33 | Pago |
| SEM NF | Nobre Variedades | Aluguel | R$ 5.000,00 | Pago |

### Financeiro — Faturamento

| Registro | Cliente | Atraso | Situação |
|---|---|---:|---|
| OS 14587 | Teste Razão Social | 366 dias | Pronta p/ faturar |
| OS 30303120 | Siemens Gamesa BA | 224 dias | Pronta p/ faturar |
| OV 2 | RKM Hidraulica | 213 dias | Pronta p/ faturar |
| OV 4 | Cordeiro Locação | 205 dias | Pronta p/ faturar |
| OV 20 | Mec Esa | 205 dias | Pronta p/ faturar |
| OV 31 | Interbelle | 204 dias | Pronta p/ faturar |
| OV 39 | Siemens Gamesa BA | 203 dias | Pronta p/ faturar |
| OV 40 | Siemens Gamesa BA | 203 dias | Pronta p/ faturar |
| OV 28 | ICT — Indústria | 199 dias | Pronta p/ faturar |

### Telas sem registros concretos

| Módulo | Evidência observada |
|---|---|
| CRM | Nenhum funil cadastrado |
| Dashboard comercial | Nenhuma métrica preenchida observada |
| Serviço Externo | 0 registros / nenhum registro encontrado |
| Expedição | Ficou em `Carregando registros...` |
| Cobrança | 0 boletos; R$ 0,00; `0 of 0` |
| Conciliação | Nenhum extrato carregado |
| Agenda | Nenhuma atividade identificável no calendário |
| Atendimento Externo | Nenhum atendimento carregado |
| Locações | Ativos 0; finalizados 0 |
| Ativos imobilizados | Nenhum registro encontrado |
| Centro de custo | Nenhum registro encontrado |
| Agentes de IA | Módulos bloqueados |

## Conclusão

A Lizy é usada pela RKM em dois grandes blocos:

1. **OFICINA:** execução e acompanhamento das OS, do recebimento técnico até a finalização, passando por PCP e setores produtivos.
2. **NÃO-OFICINA:** orçamento, suprimentos, estoque, recebimento, financeiro, faturamento e fiscal.

O roadmap do RKM deve priorizar esses dois blocos. Menus vazios ou sem evidência atual não devem virar requisito automaticamente, mas também não devem ser declarados definitivamente como “não usados” sem uma confirmação histórica.

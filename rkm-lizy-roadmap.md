# RKM Service Manager — Roadmap de Features da OFICINA

> Roadmap orientado a **features**, limitado ao que a Lizy oferece para a **OFICINA** e ao que a RKM demonstrou usar. Comercial, financeiro, compras, estoque, fiscal e logística ficam fora deste documento.

**Data da leitura da Lizy:** 27/09/2026  
**Empresa observada:** Rkm Hidraulica  
**Cobertura atual do RKM Service Manager:** **0%**  
**Meta do Gate 5:** **100% das features da Lizy que pertencem à oficina e que o cliente realmente usa**.

## Como interpretar

- **0% hoje** mede a cobertura do RKM Service Manager em relação ao recorte definido neste documento; não significa que a Lizy esteja vazia.
- **USA** significa que há registros concretos na Lizy.
- **USA INDIRETAMENTE** significa que a feature aparece dentro do PCP ou da OS, mesmo sem uma fila própria preenchida.
- **A CONFIRMAR** significa que a capacidade existe na Lizy, mas não houve evidência suficiente para colocá-la no escopo de 100%.
- Uma feature só entra no percentual do Gate 5 quando houver evidência de uso ou confirmação explícita do cliente.

---

# Visão executiva

| Marco | Cobertura planejada | Resultado esperado |
|---|---:|---|
| Hoje | **0%** | O RKM ainda não cobre o conjunto de features da oficina definido neste raio-X |
| V1 | 20% | Entrada da OS, identificação, inspeção e fila inicial |
| V2 | 45% | Execução por etapas e acompanhamento operacional |
| V3 | 65% | Evidências, materiais, apontamentos e pendências |
| V4 | 85% | Qualidade, aprovação, laudo e fechamento rastreável |
| Gate 5 | **100%** | Tudo que a Lizy oferece para a oficina e que a RKM efetivamente usa |

Os percentuais são marcos de cobertura de features, não percentual de tarefas concluídas.

## O que entra no Gate 5

| Bloco de feature | Entra? | Motivo |
|---|---|---|
| Recebimento e abertura da OS | Sim | É a porta de entrada do fluxo observado |
| Inspeção / peritagem / desmontagem | Sim | Havia 17 OS na fila de inspeções |
| PCP e etapas produtivas | Sim | Havia 10 OS acompanhadas por etapa |
| Limpeza, Usinagem, Montagem, Teste, Pintura e Qualidade | Sim | Estados concretos aparecem no PCP |
| Finalização da OS | Sim | Havia 31 finalizadas no mês e 111 no ano |
| Peças e materiais vinculados à OS | Provavelmente | Há 174 requisições de estoque vinculadas a OS; validar detalhe da baixa |
| Fotos, arquivos e laudo | A confirmar | A capacidade existe, mas os anexos não foram abertos |
| Horas e apontamentos | A confirmar | Não houve amostra de apontamento nesta inspeção |
| Serviço externo | Não entra por enquanto | Tela sem registros atuais |
| Comercial, financeiro e suprimentos | Não | Fora do recorte de OFICINA |

---

# Roadmap por Gates

## V1 — Entrada e diagnóstico da OS · 20%

### Objetivo

Reproduzir o início do fluxo da oficina: receber o equipamento, abrir a OS, identificar o cliente, colocar a ordem na fila de inspeção e controlar prazo/prioridade.

### Features

| Feature | Escopo funcional | Evidência Lizy | Critério de aceite |
|---|---|---|---|
| Criar Ordem de Serviço | Abrir uma ordem de serviço para o equipamento recebido | Menu `Serviços → Desmontagem` permite criar ordem | Usuário cria OS com número, cliente e equipamento |
| Identificação do cliente | Relacionar a OS ao cliente correto | OS 20265592: VLI PECEM; OS 20265591: RKM HIDRAULICA | Cliente selecionável e visível em toda a OS |
| Fila de inspeção | Listar ordens aguardando análise | 17 OS em `Aguardando Inspeções` | Fila filtrável por status e prioridade |
| Prazo e prioridade | Exibir urgência e dias restantes | OS 2026465 com -80 dias; OS 2026388 com -126 dias | Atraso e prioridade aparecem na lista |
| Acesso à análise | Abrir a OS a partir da fila | A fila possui funções para acessar a ordem | Usuário entra na OS sem perder o contexto da fila |

### Amostra de aceite da V1

| OS | Cliente | Estado observado |
|---|---|---|
| 20265592 | VLI PECEM | Aguardando Inspeções |
| 20265591 | RKM HIDRAULICA | Aguardando Inspeções |
| 20265590 | PLANALTO INDUSTRIA | Aguardando Inspeções |
| 20265589 | PLANALTO INDUSTRIA | Aguardando Inspeções |
| OS-DEBUG-001 | RKM HIDRAULICA | Aguardando Inspeções |
| 20265584 | RKM HIDRAULICA | Aguardando Inspeções |
| 2026465 | RES ENERGY | Aguardando Inspeções; -80 dias |
| 2026445 | RKM HIDRAULICA | Aguardando Inspeções; -97 dias |
| 2026390 | GERDAU CAUCAIA | Aguardando Inspeções; -126 dias |
| 2026388 | GERDAU CAUCAIA | Aguardando Inspeções; -126 dias |

### Gate V1

V1 está concluída quando uma OS consegue percorrer: **criação → identificação → fila de inspeção → abertura para análise**, mantendo histórico, prazo e prioridade.

---

## V2 — Execução por etapas · 45%

### Objetivo

Transformar a OS em uma sequência operacional acompanhável pelo PCP e pelos setores da oficina.

### Features

| Feature | Escopo funcional | Evidência Lizy | Critério de aceite |
|---|---|---|---|
| PCP da oficina | Listar OS em acompanhamento produtivo | 10 OS no PCP; 0 aguardando planejamento | PCP mostra todas as OS abertas e seus estados |
| Etapas configuráveis | Representar etapas aplicáveis à OS | Limpeza, Usinagem, Montagem, Teste, Pintura e Qualidade | Cada etapa tem estado próprio |
| Não aplicável | Marcar etapa que não pertence ao serviço | `Não Possui Serviço` em várias OS | Etapa não aplicável não bloqueia o fluxo |
| Em andamento | Indicar trabalho em execução | Limpeza da OS 2026458; Qualidade da OS 2026522 | Usuário identifica o setor atualmente responsável |
| Finalizado | Encerrar uma etapa | Usinagem, Montagem, Teste e Pintura finalizadas em várias OS | Encerramento fica registrado com data/usuário |
| Próxima etapa | Orientar a continuidade do serviço | Montagem `Iniciar Montagem` na OS 2026458 | Sistema aponta o próximo passo operacional |

### Amostra de aceite da V2

| OS | Equipamento | Estados observados |
|---|---|---|
| 2026458 | Bomba manual | Limpeza: Em andamento; Montagem: Iniciar Montagem |
| 2026522 | Cilindro hidráulico transportador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026524 | Cilindro hidráulico compactador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026525 | Cilindro hidráulico compactador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026526 | Cilindro hidráulico compactador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026527 | Cilindro hidráulico compactador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026530 | Cilindro hidráulico transportador | Limpeza/Usinagem/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026531 | Cilindro hidráulico transportador | Todas as etapas: Não Possui Serviço |
| 2026534 | Caixa de comando hidráulico | Limpeza/Montagem/Teste/Pintura: Finalizado; Qualidade: Em andamento |
| 2026551 | Cilindro estribo | Todas as etapas: Não Possui Serviço |

### Gate V2

V2 está concluída quando o PCP consegue mostrar, para cada OS, **em qual etapa está, o que já terminou, o que não se aplica e qual é o próximo passo**.

---

## V3 — Rastreabilidade da execução · 65%

### Objetivo

Registrar os elementos que provam o que aconteceu durante o serviço, sem depender de memória, conversa ou planilha paralela.

### Features

| Feature | Escopo funcional | Estado da evidência | Critério de aceite |
|---|---|---|---|
| Evidências fotográficas | Anexar fotos antes, durante e depois | Coluna `Foto` existe em Finalizados; anexos não foram abertos | Foto vinculada à OS e à etapa |
| Arquivos da OS | Guardar documentos e medições | Capacidade não validada nesta inspeção | Arquivo possui tipo, autor, data e vínculo |
| Peças e materiais | Registrar componentes usados ou necessários | 174 requisições de estoque vinculadas a OS | Peça pode ser requisitada, atendida e vinculada |
| Pendências | Impedir avanço silencioso de bloqueios | Não medida em OS da Lizy nesta passagem | Pendência tem responsável, motivo e estado |
| Apontamento de tempo | Registrar início, fim e duração | A confirmar | Tempo por etapa aparece no histórico |
| Histórico de alterações | Rastrear quem mudou a OS | A confirmar | Toda transição mostra usuário e data |

### Evidência concreta de materiais

Foram observadas 174 requisições de estoque, com vínculo direto a OS:

| Código | Referência | Status |
|---|---|---|
| RE173 | OS 2026458 | Pendente |
| RE172 | OS 20265586 | Pendente |
| RE171 | OS 2026557 | Pendente |
| RE170 | OS 2026556 | Pendente |
| RE169 | OS 2026392 | Pendente |
| RE168 | OS 2026393 | Pendente |
| RE167 | OS 2026391 | Pendente |
| RE166 | OS 2026522 | Pendente |
| RE165 | OS 2026523 | Pendente |
| RE164 | OS 2026524 | Pendente |

### Gate V3

V3 está concluída quando uma pessoa que não executou o serviço consegue reconstruir, pela OS, **o que foi feito, em qual etapa, com quais materiais, quais evidências e quais pendências**.

> Fotos, arquivos, laudo e horas continuam como itens de validação. Eles não devem ser marcados como “100% cobertos” antes de o cliente confirmar que realmente usa essas capacidades.

---

## V4 — Qualidade, aprovação e fechamento · 85%

### Objetivo

Garantir que a oficina não apenas execute, mas consiga validar, aprovar e encerrar a OS com um resultado rastreável.

### Features

| Feature | Escopo funcional | Evidência Lizy | Critério de aceite |
|---|---|---|---|
| Qualidade como etapa | Manter a OS em validação antes da liberação | Qualidade `Em andamento` em 2026522, 2026524, 2026534 | Qualidade pode aprovar, reprovar ou devolver |
| Teste | Registrar conclusão da etapa de teste | Teste `Finalizado` no PCP | Resultado do teste fica na OS |
| Finalização | Encerrar a OS e preservar seu histórico | 31 no mês e 111 no ano | Só finaliza com requisitos mínimos atendidos |
| Garantia | Identificar OS finalizada em garantia | 20265579, 2026543 e 2026535 marcadas como Garantia | Garantia é filtro/atributo rastreável |
| Laudo / resumo | Consolidar serviço e resultado | Capacidade a confirmar | Documento final é gerado a partir da OS |
| Reabertura controlada | Reabrir sem apagar o histórico | A confirmar | Reabertura exige motivo e autorização |

### Amostra de aceite da V4

| OS | Cliente | Data de finalização | Marca observada |
|---|---|---|---|
| 20265586 | Bemax Comercio Atacadista | 22/09/2026 | Finalizada |
| 20265579 | Ecofor Ambiental S/A | 10/09/2026 | Garantia |
| 20265575 | Echoenergia | 14/09/2026 | Finalizada |
| 20265574 | Echoenergia | 14/09/2026 | Finalizada |
| 20265573 | Echoenergia | 14/09/2026 | Finalizada |
| 2026557 | Gerdau Aços Longos | 16/09/2026 | Finalizada |
| 2026556 | Gerdau Aços Longos | 22/09/2026 | Finalizada |
| 2026543 | Ecofor Ambiental S/A | 14/09/2026 | Garantia |
| 2026537 | RES Energy Services | 03/09/2026 | Finalizada |
| 2026535 | Gerdau Aços Longos | 03/09/2026 | Garantia |

### Gate V4

V4 está concluída quando a OS percorre **execução → teste → qualidade → aprovação → laudo/resumo → finalização**, sem perder evidências ou histórico.

---

## Gate 5 — 100% da oficina usada pelo cliente

### Definição de pronto

O Gate 5 não significa implementar todos os menus da Lizy. Significa atingir 100% deste conjunto:

1. Toda feature da Lizy que pertence à OFICINA e possui uso comprovado pela RKM.
2. Toda capacidade adicional que o cliente confirmar como parte do trabalho real da oficina.
3. Todos os critérios de aceite das V1–V4 funcionando em conjunto na mesma OS.
4. Histórico e permissões suficientes para auditoria operacional.
5. Nenhuma etapa crítica dependendo de controle paralelo não rastreável.

### Checklist de fechamento do Gate 5

| Área | Pergunta de aceite | Estado |
|---|---|---|
| Entrada | Consigo criar e identificar uma OS real? | Pendente de implementação |
| Diagnóstico | A OS entra na fila de inspeção e peritagem? | Pendente de implementação |
| PCP | O PCP mostra todas as etapas e estados? | Pendente de implementação |
| Execução | O técnico sabe o próximo passo e registra a conclusão? | Pendente de implementação |
| Materiais | Peças e requisições ficam vinculadas à OS? | Pendente de implementação |
| Evidências | Fotos e arquivos ficam vinculados à etapa correta? | Pendente de confirmação + implementação |
| Pendências | Bloqueios têm dono, motivo e resolução? | Pendente de implementação |
| Qualidade | Qualidade consegue aprovar, reprovar ou devolver? | Pendente de implementação |
| Laudo | O resultado final é consolidado sem retrabalho? | Pendente de confirmação + implementação |
| Finalização | A OS é encerrada com histórico completo? | Pendente de implementação |

---

# Backlog de validação do cliente

Estes itens aparecem como capacidades possíveis da Lizy, mas não devem ser contados como features usadas até a RKM confirmar:

| Feature | Por que está pendente |
|---|---|
| Horas por etapa | Nenhum apontamento foi observado |
| Fotos anexadas | A coluna existe, mas nenhum anexo foi aberto |
| Arquivos da OS | Não houve documento aberto na inspeção |
| Laudo efetivamente emitido | Estrutura não foi validada em uma OS real |
| Serviço externo | Tela apresentou 0 registros |
| Reabertura / retrabalho | Não houve amostra do comportamento |
| Aprovação formal da Qualidade | Qualidade aparece no PCP, mas o fluxo decisório precisa ser confirmado |

## Regra de escopo

Enquanto esses itens não forem confirmados, o percentual do Gate 5 deve ser calculado sobre as features comprovadamente usadas: **entrada, inspeção, PCP, etapas produtivas, materiais vinculados quando aplicável, qualidade como etapa e finalização**.

# Resumo

O RKM Service Manager começa em **0% de cobertura** neste recorte. O caminho até o Gate 5 é evoluir de uma aplicação que apenas apresenta a operação para uma aplicação que controla o ciclo completo da oficina:

**Receber → Diagnosticar → Planejar → Executar → Evidenciar → Validar → Finalizar.**

O alvo não é copiar a Lizy inteira. O alvo é cobrir, com qualidade e rastreabilidade, **100% do que a Lizy oferece para a oficina e que o cliente realmente usa**.

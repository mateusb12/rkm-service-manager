/**
 * Roadmap do PRODUTO. Este arquivo pode ser entregue à RKM:
 * não colocar estimativas pessoais, métricas do WakaTime ou segredos aqui.
 * Os caminhos de branches são referências de planejamento, não branches criadas.
 */
export type RoadmapStatus = 'inProgress' | 'planned' | 'later' | 'done';

export interface RoadmapFeature {
  id: string;
  title: string;
  branch: string;
  status: RoadmapStatus;
  acceptance: string;
}

export interface RoadmapArea {
  id: string;
  title: string;
  owner: string;
  branch: string;
  features: RoadmapFeature[];
}

export interface RoadmapVersion {
  id: string;
  title: string;
  objective: string;
  status: RoadmapStatus;
  /** Branch planejada como checkpoint; só existe após ser criada no Git. */
  checkpoint: string;
  areas: RoadmapArea[];
}

export const ROADMAP: RoadmapVersion[] = [
  {
    id: 'V0',
    title: 'Entrada e diagnóstico',
    objective: 'Registrar a chegada da peça e permitir a peritagem inicial, com uma OS rastreável.',
    status: 'inProgress',
    checkpoint: 'versions/v0',
    areas: [
      {
        id: 'pcp',
        title: 'PCP · Recebimento',
        owner: 'PCP',
        branch: 'features/pcp-recebimento',
        features: [
          {
            id: 'pcp-clientes',
            title: 'Cadastro e busca de clientes',
            branch: 'features/pcp/clientes',
            status: 'planned',
            acceptance:
              'O PCP consegue cadastrar e consultar clientes.\nDurante a abertura da OS, consegue localizar um cliente por CNPJ, razão social ou nome fantasia.',
          },
          {
            id: 'pcp-nota-fiscal',
            title: 'Nota fiscal ou N/A',
            branch: 'features/pcp/nota-fiscal',
            status: 'planned',
            acceptance:
              'Durante o recebimento, o PCP consegue registrar a nota fiscal ou indicar N/A.\nA informação permanece vinculada à OS.',
          },
          {
            id: 'pcp-numeracao',
            title: 'Numeração automática da OS',
            branch: 'features/pcp/numeracao-os',
            status: 'planned',
            acceptance:
              'Ao criar uma OS, o sistema gera automaticamente um número único.\nO número permite identificar e consultar a OS posteriormente.',
          },
          {
            id: 'pcp-abertura',
            title: 'Abertura mínima da OS',
            branch: 'features/pcp/abertura-os',
            status: 'planned',
            acceptance:
              'O PCP consegue registrar a entrada de uma peça, identificando o cliente e o equipamento.\nA OS criada fica disponível para a etapa de peritagem.',
          },
          {
            id: 'pcp-fotos',
            title: 'Fotografias do produto',
            branch: 'features/pcp/fotografias',
            status: 'later',
            acceptance:
              'Futuramente permitir anexar fotos à OS; no MVP, no máximo reservar um espaço visual sem ação falsa.',
          },
        ],
      },
      {
        id: 'peritagem',
        title: 'Oficina · Peritagem',
        owner: 'Oficina',
        branch: 'features/oficina-peritagem',
        features: [
          {
            id: 'oficina-bancadas',
            title: 'Identificar bancada',
            branch: 'features/oficina/bancadas',
            status: 'planned',
            acceptance: 'Vincular a OS a uma bancada e identificar bancadas livres ou ocupadas.',
          },
          {
            id: 'oficina-inspecao',
            title: 'Inspeção e diagnóstico',
            branch: 'features/oficina/inspecao',
            status: 'planned',
            acceptance:
              'Registrar tipo de equipamento, componentes verificados, medidas, observações e diagnóstico inicial.',
          },
        ],
      },
    ],
  },
  {
    id: 'V1',
    title: 'Planejamento e execução',
    objective: 'Tornar visíveis as prioridades, os responsáveis e a evolução do serviço.',
    status: 'planned',
    checkpoint: 'versions/v1',
    areas: [
      {
        id: 'planejamento',
        title: 'PCP · Planejamento',
        owner: 'PCP',
        branch: 'features/pcp-planejamento',
        features: [
          {
            id: 'pcp-fila',
            title: 'Fila de OS',
            branch: 'features/pcp/fila',
            status: 'planned',
            acceptance: 'Consultar OS abertas e o estado de cada etapa.',
          },
          {
            id: 'pcp-prazos',
            title: 'Prazo e prioridade',
            branch: 'features/pcp/prazos',
            status: 'planned',
            acceptance: 'Identificar prazo, prioridade e atraso por OS.',
          },
        ],
      },
      {
        id: 'execucao',
        title: 'Oficina · Execução',
        owner: 'Técnicos',
        branch: 'features/oficina-execucao',
        features: [
          {
            id: 'execucao-etapas',
            title: 'Etapas produtivas',
            branch: 'features/oficina/etapas',
            status: 'planned',
            acceptance: 'Atualizar andamento por etapa, preservando histórico.',
          },
          {
            id: 'execucao-nao-aplicavel',
            title: 'Etapa não aplicável',
            branch: 'features/oficina/nao-aplicavel',
            status: 'planned',
            acceptance: 'Marcar uma etapa como sem serviço, sem bloquear o restante.',
          },
          {
            id: 'execucao-proxima-acao',
            title: 'Próximo passo',
            branch: 'features/oficina/proxima-acao',
            status: 'planned',
            acceptance: 'Identificar claramente a próxima ação e seu responsável.',
          },
        ],
      },
    ],
  },
  {
    id: 'V2',
    title: 'Evidências e liberação',
    objective: 'Documentar a execução e permitir a validação técnica antes da liberação.',
    status: 'planned',
    checkpoint: 'versions/v2',
    areas: [
      {
        id: 'controle',
        title: 'Controle técnico',
        owner: 'Qualidade e supervisão',
        branch: 'features/controle-tecnico',
        features: [
          {
            id: 'controle-evidencias',
            title: 'Evidências por etapa',
            branch: 'features/controle/evidencias',
            status: 'planned',
            acceptance: 'Vincular evidências ao serviço e à etapa correspondente.',
          },
          {
            id: 'controle-pendencias',
            title: 'Pendências',
            branch: 'features/controle/pendencias',
            status: 'planned',
            acceptance: 'Registrar e acompanhar pendências com responsáveis.',
          },
          {
            id: 'controle-liberacao',
            title: 'Validação e liberação',
            branch: 'features/controle/liberacao',
            status: 'planned',
            acceptance: 'Registrar a decisão técnica antes de liberar a OS.',
          },
        ],
      },
    ],
  },
  {
    id: 'V3',
    title: 'Gestão da oficina',
    objective: 'Acompanhar filas, atrasos, capacidade e histórico para apoiar decisões.',
    status: 'planned',
    checkpoint: 'versions/v3',
    areas: [
      {
        id: 'gestao',
        title: 'Gestão operacional',
        owner: 'PCP e gestão',
        branch: 'features/gestao-operacional',
        features: [
          {
            id: 'gestao-capacidade',
            title: 'Capacidade por setor',
            branch: 'features/gestao/capacidade',
            status: 'planned',
            acceptance: 'Exibir carga e filas dos setores.',
          },
          {
            id: 'gestao-atrasos',
            title: 'Prazos e atrasos',
            branch: 'features/gestao/atrasos',
            status: 'planned',
            acceptance: 'Visualizar ordens atrasadas e identificar gargalos.',
          },
          {
            id: 'gestao-historico',
            title: 'Histórico operacional',
            branch: 'features/gestao/historico',
            status: 'planned',
            acceptance: 'Consultar eventos e histórico de OS.',
          },
        ],
      },
    ],
  },
  {
    id: 'V4',
    title: 'Cobertura validada',
    objective: 'Consolidar o fluxo da oficina efetivamente utilizado e validado com a RKM.',
    status: 'planned',
    checkpoint: 'versions/v4',
    areas: [
      {
        id: 'cobertura',
        title: 'Validação final',
        owner: 'RKM e desenvolvimento',
        branch: 'features/cobertura-validada',
        features: [
          {
            id: 'cobertura-ponta-a-ponta',
            title: 'Fluxo ponta a ponta',
            branch: 'features/cobertura/ponta-a-ponta',
            status: 'planned',
            acceptance:
              'Acompanhar uma OS do recebimento à finalização sem controles paralelos críticos.',
          },
          {
            id: 'cobertura-auditoria',
            title: 'Rastreabilidade',
            branch: 'features/cobertura/auditoria',
            status: 'planned',
            acceptance: 'Consultar quem alterou o quê e em qual etapa.',
          },
          {
            id: 'cobertura-validacao',
            title: 'Aceite com a RKM',
            branch: 'features/cobertura/aceite',
            status: 'planned',
            acceptance: 'Confirmar com o cliente quais funcionalidades são realmente utilizadas.',
          },
        ],
      },
    ],
  },
];

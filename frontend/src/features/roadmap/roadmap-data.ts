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
    title: 'Sistema básico',
    objective: 'Abrir, acompanhar e finalizar uma OS do começo ao fim.',
    status: 'inProgress',
    checkpoint: 'versions/v0',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        owner: 'PCP',
        features: [
          {
            id: 'pcp-clientes',
            title: 'Cadastro e busca de clientes',
            branch: 'features/pcp/clientes',
            status: 'planned',
            acceptance:
              'O PCP consegue cadastrar e consultar clientes.\\nDurante a abertura da OS, consegue localizar um cliente por CNPJ, razão social ou nome fantasia.',
          },
          {
            id: 'pcp-abertura',
            title: 'Abertura mínima da OS',
            branch: 'features/pcp/abertura-os',
            status: 'planned',
            acceptance:
              'O PCP consegue abrir uma OS com o cliente selecionado e somente os dados disponíveis na chegada.\\nA ausência de nota fiscal ou fotografia não bloqueia a abertura.',
          },
          {
            id: 'pcp-numeracao',
            title: 'Numeração automática da OS',
            branch: 'features/pcp/numeracao-os',
            status: 'planned',
            acceptance:
              'Ao abrir uma OS, o sistema gera automaticamente um número único.\\nO número permite localizar a ordem posteriormente.',
          },
          {
            id: 'pcp-nota-fiscal',
            title: 'Nota fiscal ou N/A',
            branch: 'features/pcp/nota-fiscal',
            status: 'planned',
            acceptance:
              'O PCP pode registrar a nota fiscal, indicar N/A ou complementar a informação posteriormente.\\nO documento permanece associado à OS.',
          },
          {
            id: 'pcp-fotos',
            title: 'Fotografias básicas',
            branch: 'features/pcp/fotografias',
            status: 'planned',
            acceptance:
              'É possível adicionar fotografias à OS no recebimento ou posteriormente.\\nAs imagens ficam disponíveis para compor o relatório final.',
          },
          {
            id: 'pcp-fila',
            title: 'Acompanhamento mínimo',
            branch: 'features/pcp/fila',
            status: 'planned',
            acceptance:
              'O PCP consegue consultar as OS abertas e identificar a etapa ou situação atual de cada uma.',
          },
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        owner: 'Oficina',
        features: [
          {
            id: 'oficina-identificacao-minima',
            title: 'Identificação mínima',
            branch: 'features/oficina/identificacao-minima',
            status: 'planned',
            acceptance:
              'A oficina registra o tipo do equipamento, a bancada e o responsável com o mínimo necessário para seguir o fluxo.',
          },
          {
            id: 'oficina-diagnostico-minimo',
            title: 'Diagnóstico simples',
            branch: 'features/oficina/diagnostico-minimo',
            status: 'planned',
            acceptance:
              'O mecânico registra o diagnóstico inicial em texto livre.\\nA OS pode ser encaminhada para orçamento sem exigir checklist técnico detalhado.',
          },
          {
            id: 'oficina-execucao-minima',
            title: 'Andamento e conclusão',
            branch: 'features/oficina/execucao-minima',
            status: 'planned',
            acceptance:
              'A oficina consegue registrar que o serviço está em execução e informar sua conclusão sem depender de checklist detalhado.',
          },
        ],
      },
      {
        id: 'comercial',
        title: 'Comercial',
        owner: 'Comercial',
        features: [
          {
            id: 'comercial-orcamento-minimo',
            title: 'Orçamento operacional',
            branch: 'features/comercial/orcamento-minimo',
            status: 'planned',
            acceptance:
              'O comercial registra a descrição do serviço, valores necessários e total do orçamento.\\nA decisão pode ser registrada como aprovada, em revisão ou recusada.',
          },
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        owner: 'PCP e Comercial',
        features: [
          {
            id: 'finalizacao-encerramento',
            title: 'Saída e encerramento',
            branch: 'features/finalizacao/encerramento',
            status: 'planned',
            acceptance:
              'A OS pode ser finalizada e registrar a saída do material, preservando os dados produzidos ao longo do serviço.',
          },
          {
            id: 'finalizacao-relatorio-pdf',
            title: 'Relatório final em PDF',
            branch: 'features/finalizacao/relatorio-pdf',
            status: 'planned',
            acceptance:
              'O sistema gera um relatório final em PDF com os principais dados da OS, diagnóstico, serviço executado e fotografias vinculadas.',
          },
        ],
      },
    ],
  },
  {
    id: 'V1',
    title: 'Peritagem detalhada',
    objective: 'Registrar a inspeção e o diagnóstico com mais detalhes.',
    status: 'planned',
    checkpoint: 'versions/v1',
    areas: [
      {
        id: 'oficina',
        title: 'Oficina',
        owner: 'Oficina',
        features: [
          {
            id: 'oficina-tipos-equipamento',
            title: 'Tipos de equipamento',
            branch: 'features/oficina/tipos-equipamento',
            status: 'planned',
            acceptance:
              'A inspeção diferencia cilindro, bomba, motor hidráulico, unidade hidráulica, comando e outros tipos definidos com a RKM.',
          },
          {
            id: 'oficina-checklists',
            title: 'Checklists por tipo',
            branch: 'features/oficina/checklists',
            status: 'planned',
            acceptance:
              'Cada tipo de equipamento apresenta somente os componentes e verificações aplicáveis.',
          },
          {
            id: 'oficina-componentes',
            title: 'Componentes e condição',
            branch: 'features/oficina/componentes',
            status: 'planned',
            acceptance:
              'O mecânico registra a condição dos componentes e informa quando é necessário recuperar ou substituir uma peça.',
          },
          {
            id: 'oficina-medidas',
            title: 'Medidas e materiais',
            branch: 'features/oficina/medidas',
            status: 'planned',
            acceptance:
              'Quando necessário, registrar medidas, diâmetros, materiais e outras informações técnicas.',
          },
          {
            id: 'oficina-bancadas',
            title: 'Bancadas',
            branch: 'features/oficina/bancadas',
            status: 'planned',
            acceptance:
              'Visualizar bancadas livres ou ocupadas e identificar qual OS está em cada bancada.',
          },
          {
            id: 'oficina-diagnostico-estruturado',
            title: 'Diagnóstico detalhado',
            branch: 'features/oficina/diagnostico-estruturado',
            status: 'planned',
            acceptance:
              'O diagnóstico reúne as informações da inspeção e permite observações técnicas livres.',
          },
        ],
      },
    ],
  },
  {
    id: 'V2',
    title: 'Acompanhamento e aprovações',
    objective: 'Saber onde a OS está, quem é responsável, o que falta e quem aprovou.',
    status: 'planned',
    checkpoint: 'versions/v2',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        owner: 'PCP',
        features: [
          {
            id: 'pcp-prazos',
            title: 'Prazo e prioridade',
            branch: 'features/pcp/prazos',
            status: 'planned',
            acceptance:
              'Registrar prazo previsto, prioridade e identificar atrasos durante o acompanhamento da OS.',
          },
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        owner: 'Oficina',
        features: [
          {
            id: 'execucao-etapas',
            title: 'Etapas e histórico',
            branch: 'features/oficina/etapas',
            status: 'planned',
            acceptance:
              'Cada mudança de etapa fica registrada e a situação atual da OS permanece identificada.',
          },
          {
            id: 'execucao-proxima-acao',
            title: 'Próxima ação e responsável',
            branch: 'features/oficina/proxima-acao',
            status: 'planned',
            acceptance:
              'O sistema mostra o que precisa acontecer agora e quem é responsável pela próxima ação.',
          },
          {
            id: 'execucao-nao-aplicavel',
            title: 'Etapa não aplicável',
            branch: 'features/oficina/nao-aplicavel',
            status: 'planned',
            acceptance:
              'Uma etapa que não se aplica ao serviço pode ser ignorada sem interromper o fluxo.',
          },
        ],
      },
      {
        id: 'controle',
        title: 'Controle',
        owner: 'Admin',
        features: [
          {
            id: 'controle-pendencias',
            title: 'Pendências e motivo de parada',
            branch: 'features/controle/pendencias',
            status: 'planned',
            acceptance:
              'Uma OS parada pode registrar o motivo, desde quando está parada e quem precisa agir.',
          },
          {
            id: 'controle-liberacao',
            title: 'Aprovações e liberações',
            branch: 'features/controle/liberacao',
            status: 'planned',
            acceptance: 'Registrar decisões de aprovação ou liberação, quem decidiu e quando.',
          },
          {
            id: 'cobertura-auditoria',
            title: 'Histórico de alterações',
            branch: 'features/controle/auditoria',
            status: 'planned',
            acceptance:
              'Consultar as principais alterações feitas na OS, com responsável e etapa correspondente.',
          },
        ],
      },
    ],
  },
  {
    id: 'V3',
    title: 'Fotos e relatórios',
    objective: 'Guardar fotos, anexos e resultados dos testes e melhorar o relatório final.',
    status: 'planned',
    checkpoint: 'versions/v3',
    areas: [
      {
        id: 'oficina',
        title: 'Oficina',
        owner: 'Oficina',
        features: [
          {
            id: 'controle-evidencias',
            title: 'Fotos por etapa',
            branch: 'features/oficina/evidencias',
            status: 'planned',
            acceptance:
              'Fotos e outras evidências podem ser registradas na etapa do serviço em que foram produzidas.',
          },
          {
            id: 'controle-testes',
            title: 'Resultados de testes',
            branch: 'features/oficina/testes',
            status: 'planned',
            acceptance:
              'Registrar resultados e observações dos testes realizados antes da liberação do equipamento.',
          },
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        owner: 'PCP e Comercial',
        features: [
          {
            id: 'documentos-anexos',
            title: 'Anexos e documentos',
            branch: 'features/finalizacao/anexos',
            status: 'planned',
            acceptance: 'Arquivos importantes podem ser associados à OS.',
          },
          {
            id: 'documentos-relatorio-tecnico',
            title: 'Relatório técnico completo',
            branch: 'features/finalizacao/relatorio-tecnico',
            status: 'planned',
            acceptance:
              'O relatório final reúne peritagem, fotos, testes e informações importantes da execução.',
          },
        ],
      },
    ],
  },
  {
    id: 'V4',
    title: 'Gestão e automações',
    objective: 'Acompanhar atrasos, capacidade, indicadores e avisos da operação.',
    status: 'planned',
    checkpoint: 'versions/v4',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        owner: 'PCP',
        features: [
          {
            id: 'automacao-avisos-internos',
            title: 'Avisos internos',
            branch: 'features/pcp/avisos',
            status: 'planned',
            acceptance: 'O sistema destaca situações da operação que precisam de atenção.',
          },
        ],
      },
      {
        id: 'gestao',
        title: 'Gestão',
        owner: 'Admin',
        features: [
          {
            id: 'gestao-capacidade',
            title: 'Capacidade por setor',
            branch: 'features/gestao/capacidade',
            status: 'planned',
            acceptance:
              'Visualizar a carga de trabalho e a distribuição das OS entre setores e responsáveis.',
          },
          {
            id: 'gestao-atrasos',
            title: 'Atrasos e gargalos',
            branch: 'features/gestao/atrasos',
            status: 'planned',
            acceptance:
              'Identificar ordens atrasadas, itens parados e pontos recorrentes de gargalo.',
          },
          {
            id: 'gestao-indicadores',
            title: 'Indicadores',
            branch: 'features/gestao/indicadores',
            status: 'planned',
            acceptance: 'Acompanhar tempos, volumes e outros indicadores importantes da operação.',
          },
          {
            id: 'gestao-historico',
            title: 'Histórico',
            branch: 'features/gestao/historico',
            status: 'planned',
            acceptance: 'Consultar a evolução das OS e usar o histórico como apoio à gestão.',
          },
        ],
      },
      {
        id: 'admin',
        title: 'Administração',
        owner: 'Admin',
        features: [
          {
            id: 'rh-treinamentos',
            title: 'Treinamentos próximos do vencimento',
            branch: 'features/admin/treinamentos',
            status: 'planned',
            acceptance: 'Exibir avisos de treinamentos de funcionários próximos do vencimento.',
          },
        ],
      },
    ],
  },
];

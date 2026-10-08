import type { RoadmapFeature, RoadmapVersion } from './roadmap-model';

const feature = (
  id: string,
  title: string,
  acceptance: string,
  state = 'Planejada',
  completedAcceptanceCriteria: number[] = [],
): RoadmapFeature => ({
  id,
  title,
  acceptance,
  state,
  completedAcceptanceCriteria,
  branch: `features/${id}`,
});

export const ROADMAP: RoadmapVersion[] = [
  {
    id: 'V0',
    title: 'Sistema básico',
    description: 'Abrir, acompanhar e finalizar uma OS do começo ao fim.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Receber a peça, abrir a OS com o básico e acompanhar seu andamento.',
        features: [
          feature(
            'pcp/clientes',
            'Cadastro e busca de clientes',
            'O PCP consegue cadastrar e consultar clientes.\nDurante a abertura da OS, consegue localizar um cliente por CNPJ, razão social ou nome fantasia.',
            'Planejada',
            [0, 1],
          ),
          feature(
            'pcp/abertura-os',
            'Abertura mínima da OS',
            'O PCP consegue abrir uma OS com o cliente selecionado e somente os dados disponíveis na chegada.\nA ausência de nota fiscal ou fotografia não bloqueia a abertura.',
          ),
          feature(
            'pcp/numeracao-os',
            'Numeração automática da OS',
            'Ao abrir uma OS, o sistema gera automaticamente um número único.\nO número permite localizar a ordem posteriormente.',
          ),
          feature(
            'pcp/nota-fiscal',
            'Nota fiscal ou N/A',
            'O PCP pode registrar a nota fiscal, indicar N/A ou complementar a informação posteriormente.\nO documento permanece associado à OS.',
          ),
          feature(
            'pcp/fotografias',
            'Fotografias básicas',
            'É possível adicionar fotografias à OS no recebimento ou posteriormente.\nAs imagens ficam disponíveis para compor o relatório final.',
          ),
          feature(
            'pcp/fila',
            'Acompanhamento mínimo',
            'O PCP consegue consultar as OS abertas e identificar a etapa ou situação atual de cada uma.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Identificar o equipamento, registrar o diagnóstico e concluir o serviço.',
        features: [
          feature(
            'oficina/identificacao-minima',
            'Identificação mínima',
            'A oficina registra o tipo do equipamento, a bancada e o responsável com o mínimo necessário para seguir o fluxo.',
          ),
          feature(
            'oficina/diagnostico-minimo',
            'Diagnóstico simples',
            'O mecânico registra o diagnóstico inicial em texto livre.\nA OS pode ser encaminhada para orçamento sem exigir checklist técnico detalhado.',
          ),
          feature(
            'oficina/execucao-minima',
            'Andamento e conclusão',
            'A oficina consegue registrar que o serviço está em execução e informar sua conclusão sem depender de checklist detalhado.',
          ),
        ],
      },
      {
        id: 'comercial',
        title: 'Comercial',
        objective: 'Montar o orçamento e registrar a decisão sobre o serviço.',
        features: [
          feature(
            'comercial/orcamento-minimo',
            'Orçamento operacional',
            'O comercial registra a descrição do serviço, valores necessários e total do orçamento.\nA decisão pode ser registrada como aprovada, em revisão ou recusada.',
          ),
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        objective: 'Encerrar a OS e gerar o relatório final para o cliente.',
        features: [
          feature(
            'finalizacao/encerramento',
            'Saída e encerramento',
            'A OS pode ser finalizada e registrar a saída do material, preservando os dados produzidos ao longo do serviço.',
          ),
          feature(
            'finalizacao/relatorio-pdf',
            'Relatório final em PDF',
            'O sistema gera um relatório final em PDF com os principais dados da OS, diagnóstico, serviço executado e fotografias vinculadas.',
          ),
        ],
      },
    ],
  },
  {
    id: 'V1',
    title: 'Peritagem detalhada',
    description: 'Registrar a inspeção e o diagnóstico com mais detalhes.',
    areas: [
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Fazer uma peritagem completa, com componentes, medidas e informações técnicas.',
        features: [
          feature(
            'oficina/tipos-equipamento',
            'Tipos de equipamento',
            'A inspeção diferencia cilindro, bomba, motor hidráulico, unidade hidráulica, comando e outros tipos definidos com a RKM.',
          ),
          feature(
            'oficina/checklists',
            'Checklists por tipo',
            'Cada tipo de equipamento apresenta somente os componentes e verificações aplicáveis àquela peritagem.',
          ),
          feature(
            'oficina/componentes',
            'Componentes e condição',
            'O mecânico registra a condição dos componentes e informa quando é necessário recuperar ou substituir uma peça.',
          ),
          feature(
            'oficina/medidas',
            'Medidas e materiais',
            'Quando necessário, registrar medidas, diâmetros, materiais e outras informações técnicas.',
          ),
          feature(
            'oficina/bancadas',
            'Bancadas',
            'Visualizar bancadas livres ou ocupadas e identificar qual OS está em cada bancada.',
          ),
          feature(
            'oficina/diagnostico-estruturado',
            'Diagnóstico detalhado',
            'O diagnóstico reúne as informações da inspeção e permite observações técnicas livres.',
          ),
        ],
      },
    ],
  },
  {
    id: 'V2',
    title: 'Acompanhamento e aprovações',
    description: 'Saber onde a OS está, quem é responsável, o que falta e quem aprovou.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Acompanhar prazos e prioridades das OS.',
        features: [
          feature(
            'pcp/prazos',
            'Prazo e prioridade',
            'Registrar prazo previsto, prioridade e identificar atrasos durante o acompanhamento da OS.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Atualizar as etapas e deixar claro o próximo passo do serviço.',
        features: [
          feature(
            'oficina/etapas',
            'Etapas e histórico',
            'Cada mudança de etapa fica registrada e a situação atual da OS permanece identificada.',
          ),
          feature(
            'oficina/proxima-acao',
            'Próxima ação e responsável',
            'O sistema mostra o que precisa acontecer agora e quem é responsável pela próxima ação.',
          ),
          feature(
            'oficina/nao-aplicavel',
            'Etapa não aplicável',
            'Uma etapa que não se aplica ao serviço pode ser ignorada sem interromper o fluxo.',
          ),
        ],
      },
      {
        id: 'controle',
        title: 'Controle',
        objective: 'Registrar pendências, aprovações e o histórico das alterações.',
        features: [
          feature(
            'controle/pendencias',
            'Pendências e motivo de parada',
            'Uma OS parada pode registrar o motivo, desde quando está parada e quem precisa agir.',
          ),
          feature(
            'controle/liberacao',
            'Aprovações e liberações',
            'Registrar decisões de aprovação ou liberação, quem decidiu e quando.',
          ),
          feature(
            'controle/auditoria',
            'Histórico de alterações',
            'Consultar as principais alterações feitas na OS, com responsável e etapa correspondente.',
          ),
        ],
      },
    ],
  },
  {
    id: 'V3',
    title: 'Fotos e relatórios',
    description: 'Guardar fotos, anexos e resultados dos testes e melhorar o relatório final.',
    areas: [
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Registrar fotos e resultados dos testes durante o serviço.',
        features: [
          feature(
            'oficina/evidencias',
            'Fotos por etapa',
            'Fotos e outras evidências podem ser registradas na etapa do serviço em que foram produzidas.',
          ),
          feature(
            'oficina/testes',
            'Resultados de testes',
            'Registrar resultados e observações dos testes realizados antes da liberação do equipamento.',
          ),
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        objective: 'Organizar anexos e gerar um relatório técnico mais completo.',
        features: [
          feature(
            'finalizacao/anexos',
            'Anexos e documentos',
            'Arquivos importantes podem ser associados à OS.',
          ),
          feature(
            'finalizacao/relatorio-tecnico',
            'Relatório técnico completo',
            'O relatório final reúne peritagem, fotos, testes e informações importantes da execução.',
          ),
        ],
      },
    ],
  },
  {
    id: 'V4',
    title: 'Avisos',
    description: 'Destacar situações que precisam de atenção.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Avisar sobre atrasos e pendências das OS.',
        features: [
          feature(
            'pcp/avisos',
            'Atrasos e pendências',
            'O PCP consegue identificar OS atrasadas, paradas ou com pendências que precisam de atenção.',
          ),
        ],
      },
      {
        id: 'admin',
        title: 'Administração',
        objective: 'Avisar sobre treinamentos próximos do vencimento.',
        features: [
          feature(
            'admin/treinamentos',
            'Treinamentos próximos do vencimento',
            'Exibir avisos quando treinamentos de funcionários estiverem próximos do vencimento, conforme as regras definidas com a RKM.',
          ),
        ],
      },
    ],
  },
];

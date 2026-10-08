import type { RoadmapAreaProjection, RoadmapFeature, RoadmapVersion } from './roadmap-model';

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
    description: 'Receber, acompanhar e finalizar uma OS do começo ao fim.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Receber a peça, abrir a OS e acompanhar sua situação atual.',
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
            'Entrada e abertura da OS',
            'O PCP consegue abrir uma OS com o cliente selecionado e registrar o equipamento ou material recebido com os dados disponíveis na chegada.\nO sistema gera automaticamente um número único para a OS.\nA nota fiscal pode ser informada, marcada como N/A ou complementada posteriormente.',
          ),
          feature(
            'pcp/fila',
            'Acompanhamento das OS',
            'O PCP consegue consultar e localizar as OS em andamento.\nConsegue identificar a situação atual, com quem a OS está, se o serviço já começou e qual é a previsão informada.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Organizar onde o serviço acontece e registrar seu andamento básico.',
        features: [
          feature(
            'oficina/bancadas',
            'Cadastro de bancadas',
            'É possível cadastrar, editar e consultar as bancadas da oficina.\nFuncionários podem ser vinculados às bancadas.\nÉ possível identificar bancadas livres ou ocupadas e a OS atendida quando houver.',
          ),
          feature(
            'oficina/diagnostico-minimo',
            'Peritagem básica',
            'A oficina identifica o equipamento e registra um diagnóstico inicial em texto livre.\nA OS consegue seguir para orçamento sem exigir uma peritagem técnica detalhada.',
          ),
          feature(
            'oficina/execucao-minima',
            'Andamento do serviço',
            'A oficina consegue indicar que o serviço ainda não começou, está em execução ou foi concluído.\nÉ possível registrar o que está sendo feito, o responsável atual e o próximo passo necessário.',
          ),
        ],
      },
      {
        id: 'comercial',
        title: 'Comercial',
        objective: 'Definir preços e registrar o orçamento necessário para o serviço continuar.',
        features: [
          feature(
            'comercial/tabela-precos',
            'Tabela de preços',
            'O comercial consegue cadastrar e consultar itens e serviços utilizados na formação do orçamento, com seus respectivos valores.',
          ),
          feature(
            'comercial/orcamento-minimo',
            'Orçamento',
            'O comercial monta o orçamento da OS utilizando os serviços e valores aplicáveis.\nO orçamento registra a descrição do que será feito, os valores e o total.\nA decisão pode ser registrada como aprovada, em revisão ou recusada.',
          ),
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        objective: 'Encerrar a OS e gerar o documento básico do serviço realizado.',
        features: [
          feature(
            'finalizacao/encerramento',
            'Saída e encerramento',
            'A OS pode ser finalizada e registrar a saída do material, preservando as informações produzidas ao longo do serviço.',
          ),
          feature(
            'finalizacao/relatorio-pdf',
            'Relatório básico em PDF',
            'O sistema gera um PDF com os principais dados da OS, cliente, equipamento, diagnóstico e serviço executado.\nFotos e anexos não são obrigatórios nesta versão.',
          ),
        ],
      },
    ],
  },

  {
    id: 'V1',
    title: 'Detalhamento',
    description: 'Aprofundar a peritagem e organizar melhor prazos e prioridades.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Organizar melhor o que precisa ser atendido primeiro.',
        features: [
          feature(
            'pcp/prazos',
            'Prazo e prioridade',
            'O PCP consegue definir a prioridade da OS e trabalhar com prazos de forma mais estruturada.\nEssas informações ficam disponíveis durante o acompanhamento.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Registrar a peritagem de acordo com o tipo de equipamento.',
        features: [
          feature(
            'oficina/checklists',
            'Peritagem por tipo de equipamento',
            'A inspeção diferencia cilindro, bomba, motor hidráulico, unidade hidráulica, comando e outros tipos definidos com a RKM.\nCada tipo apresenta os componentes e verificações que fazem sentido para aquela peritagem.',
          ),
          feature(
            'oficina/componentes',
            'Componentes e medidas',
            'O mecânico registra a condição dos componentes e informa quando é necessário recuperar ou substituir uma peça.\nQuando necessário, registra medidas, diâmetros, materiais e demais informações técnicas.',
          ),
          feature(
            'oficina/diagnostico-estruturado',
            'Diagnóstico detalhado',
            'O diagnóstico reúne as informações da peritagem e permite complementar o resultado com observações técnicas.',
          ),
        ],
      },
    ],
  },

  {
    id: 'V2',
    title: 'Controle',
    description: 'Registrar pendências, exceções e decisões que afetam o andamento da OS.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Entender por que uma OS está parada e quem precisa agir.',
        features: [
          feature(
            'controle/pendencias',
            'Pendências e motivo de parada',
            'Uma OS parada pode registrar o motivo, desde quando está parada e quem precisa agir para que o serviço continue.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Dar mais controle ao fluxo sem tornar todas as etapas obrigatórias.',
        features: [
          feature(
            'oficina/nao-aplicavel',
            'Etapas flexíveis',
            'Uma etapa que não se aplica ao serviço pode ser marcada como não aplicável sem interromper o fluxo da OS.',
          ),
          feature(
            'controle/liberacao',
            'Aprovações e liberações',
            'É possível registrar decisões de aprovação ou liberação, incluindo quem tomou a decisão e quando ela ocorreu.',
          ),
        ],
      },
    ],
  },

  {
    id: 'V3',
    title: 'Rastreabilidade',
    description: 'Guardar o histórico e as evidências produzidas durante o serviço.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Consultar o que aconteceu com a OS ao longo do tempo.',
        features: [
          feature(
            'controle/auditoria',
            'Histórico da OS',
            'É possível consultar as principais mudanças ocorridas na OS, incluindo etapa, responsável e momento da alteração.',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina',
        objective: 'Guardar fotos, evidências e resultados produzidos durante a execução.',
        features: [
          feature(
            'oficina/evidencias',
            'Fotos e evidências por etapa',
            'Fotos e outras evidências podem ser registradas na etapa do serviço em que foram produzidas.',
          ),
          feature(
            'oficina/testes',
            'Resultados de testes',
            'É possível registrar resultados e observações dos testes realizados antes da liberação do equipamento.',
          ),
        ],
      },
      {
        id: 'finalizacao',
        title: 'Finalização',
        objective: 'Reunir a documentação do serviço em uma entrega técnica mais completa.',
        features: [
          feature(
            'finalizacao/anexos',
            'Anexos e documentos',
            'Arquivos importantes podem ser associados à OS e consultados junto das demais informações do serviço.',
          ),
          feature(
            'finalizacao/relatorio-tecnico',
            'Relatório técnico completo',
            'O relatório final reúne peritagem, medidas, fotos, testes, anexos e demais informações relevantes registradas durante o serviço.',
          ),
        ],
      },
    ],
  },

  {
    id: 'V4',
    title: 'Gestão e avisos',
    description: 'Destacar atrasos, gargalos e situações que precisam de atenção.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP',
        objective: 'Enxergar problemas da operação sem precisar procurar OS por OS.',
        features: [
          feature(
            'pcp/avisos',
            'Atrasos e OS paradas',
            'O PCP consegue identificar OS atrasadas, paradas ou com pendências que precisam de atenção.',
          ),
          feature(
            'pcp/indicadores',
            'Gargalos e indicadores',
            'A gestão consegue comparar o prazo previsto com o tempo efetivamente decorrido.\nConsegue visualizar há quanto tempo a OS está na etapa atual.\nO sistema ajuda a identificar pontos de acúmulo e gargalos da operação.',
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
            'O sistema exibe avisos quando treinamentos de funcionários estiverem próximos do vencimento, conforme as regras definidas com a RKM.',
          ),
        ],
      },
    ],
  },
];

export function getAreaProjections(roadmap: RoadmapVersion[]): RoadmapAreaProjection[] {
  const projections = new Map<string, RoadmapAreaProjection>();

  roadmap.forEach((version) => {
    version.areas.forEach((area) => {
      const projection = projections.get(area.id) ?? {
        id: area.id,
        title: area.title,
        versions: [],
      };

      projection.versions.push({
        id: version.id,
        title: version.title,
        description: version.description,
        objective: area.objective,
        features: area.features,
      });

      projections.set(area.id, projection);
    });
  });

  return Array.from(projections.values());
}

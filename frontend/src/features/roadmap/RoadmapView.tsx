// RKM_ROADMAP_COMPACT_V1
// @ts-nocheck
import React, { useState } from 'react';
const RoadmapMetricsDev = React.lazy(() => import('./RoadmapMetricsDev'));
const RoadmapWorklogDev = React.lazy(() => import('./RoadmapWorklogDev'));

const COLORS = {
  V0: {
    dot: 'bg-emerald-400 text-emerald-950',
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_15px_3px_rgba(52,211,153,.35)]',
    name: 'Básico',
  },
  V1: {
    dot: 'bg-blue-400 text-blue-950',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_15px_3px_rgba(96,165,250,.35)]',
    name: 'Peritagem',
  },
  V2: {
    dot: 'bg-amber-300 text-amber-950',
    border: 'border-amber-300',
    glow: 'shadow-[0_0_15px_3px_rgba(252,211,77,.35)]',
    name: 'Controle',
  },
  V3: {
    dot: 'bg-slate-500 text-white',
    border: 'border-slate-400',
    glow: 'shadow-[0_0_15px_3px_rgba(148,163,184,.3)]',
    name: 'Relatórios',
  },
  V4: {
    dot: 'bg-violet-400 text-violet-950',
    border: 'border-violet-400',
    glow: 'shadow-[0_0_15px_3px_rgba(167,139,250,.35)]',
    name: 'Avisos',
  },
};

const feature = (id, title, acceptance, state = 'Planejada', completedAcceptanceCriteria = []) => ({
  id,
  title,
  acceptance,
  state,
  completedAcceptanceCriteria,
  branch: `features/${id}`,
});

const ROADMAP = [
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
            'O PCP consegue cadastrar e consultar clientes.\\nDurante a abertura da OS, consegue localizar um cliente por CNPJ, razão social ou nome fantasia.',
            'Planejada',
            [0, 1],
          ),
          feature(
            'pcp/abertura-os',
            'Abertura mínima da OS',
            'O PCP consegue abrir uma OS com o cliente selecionado e somente os dados disponíveis na chegada.\\nA ausência de nota fiscal ou fotografia não bloqueia a abertura.',
          ),
          feature(
            'pcp/numeracao-os',
            'Numeração automática da OS',
            'Ao abrir uma OS, o sistema gera automaticamente um número único.\\nO número permite localizar a ordem posteriormente.',
          ),
          feature(
            'pcp/nota-fiscal',
            'Nota fiscal ou N/A',
            'O PCP pode registrar a nota fiscal, indicar N/A ou complementar a informação posteriormente.\\nO documento permanece associado à OS.',
          ),
          feature(
            'pcp/fotografias',
            'Fotografias básicas',
            'É possível adicionar fotografias à OS no recebimento ou posteriormente.\\nAs imagens ficam disponíveis para compor o relatório final.',
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
            'O mecânico registra o diagnóstico inicial em texto livre.\\nA OS pode ser encaminhada para orçamento sem exigir checklist técnico detalhado.',
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
            'O comercial registra a descrição do serviço, valores necessários e total do orçamento.\\nA decisão pode ser registrada como aprovada, em revisão ou recusada.',
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

// Métricas exclusivamente para desenvolvimento em localhost.
const LOCAL =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

// RKM_TASK_DONE_DEV_V1
const TASK_STATUS_KEY = 'rkm:private-dev-task-status';

function readTaskStatuses() {
  if (!LOCAL) return {};

  try {
    const value = JSON.parse(localStorage.getItem(TASK_STATUS_KEY) || '{}');

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function RoadmapView() {
  const [versionId, setVersionId] = useState('V0');
  const [areaId, setAreaId] = useState('pcp');
  const [featureId, setFeatureId] = useState('pcp/clientes');
  const [completedFeatures, setCompletedFeatures] = useState(readTaskStatuses);

  const version = ROADMAP.find((v) => v.id === versionId) || ROADMAP[0];

  const toggleTaskDone = (id) => {
    if (!LOCAL) return;

    const next = { ...completedFeatures };

    if (next[id]) {
      delete next[id];
    } else {
      next[id] = true;
    }

    try {
      localStorage.setItem(TASK_STATUS_KEY, JSON.stringify(next));

      setCompletedFeatures(next);
    } catch (error) {
      console.error('Erro ao salvar status:', error);
    }
  };

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rkm-card p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-300">
          Planejamento
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">Roadmap</h1>
        <p className="mt-1 text-sm text-slate-400">
          Selecione a versão e expanda a funcionalidade desejada.
        </p>

        <div className="relative mt-6 grid grid-cols-5 gap-1 sm:gap-3">
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-5 h-px bg-blue-400/50" />

          {ROADMAP.map((v) => {
            const c = COLORS[v.id];
            const selected = v.id === versionId;

            return (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setVersionId(v.id);
                  setAreaId(v.areas[0].id);
                  setFeatureId(v.areas[0].features[0].id);
                }}
                className={`relative rounded-lg border p-2 text-center transition ${
                  selected
                    ? `${c.border} bg-slate-800/70`
                    : 'border-transparent hover:bg-slate-800/30'
                }`}
              >
                <span
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ring-4 ring-rkmbg ${c.dot} ${selected ? c.glow : ''}`}
                >
                  {v.id}
                </span>
                <span className="mt-2 block text-[11px] font-medium text-slate-200">{c.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rkm-card overflow-hidden">
        <header className="border-b border-rkmborder p-5">
          <span className="text-xs font-bold text-blue-300">{version.id}</span>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">{version.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{version.description}</p>
          {LOCAL && (
            <code className="mt-2 block text-xs text-blue-300">
              versions/{version.id.toLowerCase()}
            </code>
          )}
        </header>

        <div className="space-y-3 p-4">
          {version.areas.map((area) => (
            <section
              key={area.id}
              className="overflow-hidden rounded-xl border border-sky-400/10 bg-rkmcard2/45"
            >
              <button
                type="button"
                onClick={() => setAreaId(areaId === area.id ? '' : area.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-100">
                  {areaId === area.id ? '▾' : '▸'} {area.title}
                </span>
              </button>

              {areaId === area.id && (
                <div className="space-y-2 border-t border-rkmborder p-3">
                  <p className="px-2 pb-1 text-sm text-slate-400">{area.objective}</p>

                  {area.features.map((item) => (
                    <article
                      key={item.id}
                      className={`rounded-lg border transition ${
                        LOCAL && completedFeatures[item.id]
                          ? 'border-emerald-400/20 bg-emerald-400/[0.025]'
                          : 'border-rkmborder bg-rkmbg/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFeatureId(featureId === item.id ? '' : item.id);
                        }}
                        className="flex w-full items-center justify-between gap-2 p-3 text-left"
                      >
                        <span className="text-sm text-slate-200">
                          {featureId === item.id ? '▾' : '▸'} {item.title}
                        </span>
                        <span
                          className={`tag ${
                            LOCAL && completedFeatures[item.id]
                              ? 'tag-emerald'
                              : item.state === 'Depois do MVP'
                                ? 'tag-amber'
                                : 'tag-slate'
                          }`}
                        >
                          {LOCAL && completedFeatures[item.id] ? 'Concluída' : item.state}
                        </span>
                      </button>

                      {featureId === item.id && (
                        <div className="space-y-3 border-t border-rkmborder p-3">
                          {LOCAL && (
                            <code className="block text-xs text-blue-300">{item.branch}</code>
                          )}

                          <div className="text-sm text-slate-300">
                            {/* RKM_ACCEPTANCE_BULLETS_V1 */}
                            <strong className="mb-1 block">Pronto quando:</strong>
                            {item.acceptance.includes('\n') ? (
                              <ul className="ml-5 list-disc space-y-1">
                                {item.acceptance.split('\n').map((criterion, index) => {
                                  const completed =
                                    item.completedAcceptanceCriteria.includes(index);

                                  return (
                                    <li
                                      key={index}
                                      className={
                                        completed ? 'list-none text-emerald-300' : undefined
                                      }
                                    >
                                      {completed && (
                                        <span className="mr-2 font-semibold" aria-hidden="true">
                                          ✓
                                        </span>
                                      )}
                                      {criterion}
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : (
                              <span>{item.acceptance}</span>
                            )}
                          </div>

                          {LOCAL && (
                            <React.Suspense fallback={null}>
                              <RoadmapWorklogDev featureId={item.id} />
                            </React.Suspense>
                          )}

                          {LOCAL && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rkmborder bg-rkmcard2/30 p-3">
                              <span className="text-xs font-medium text-slate-400">
                                STATUS DE DESENVOLVIMENTO
                              </span>

                              <button
                                type="button"
                                onClick={() => toggleTaskDone(item.id)}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                  completedFeatures[item.id]
                                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
                                    : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                                }`}
                              >
                                {completedFeatures[item.id]
                                  ? '↶ Reabrir feature'
                                  : '✓ Marcar como concluída'}
                              </button>
                            </div>
                          )}

                          {LOCAL && (
                            <React.Suspense fallback={null}>
                              <RoadmapMetricsDev
                                featureId={item.id}
                                defaultBranch={item.branch}
                                completed={Boolean(completedFeatures[item.id])}
                              />
                            </React.Suspense>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

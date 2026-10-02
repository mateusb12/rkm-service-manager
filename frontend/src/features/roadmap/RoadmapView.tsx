// RKM_ROADMAP_COMPACT_V1
// @ts-nocheck
import { DurationPicker } from '../../utils/DurationPicker';
import React, { useEffect, useState } from 'react';
// RKM_FUNCTION_POINTS_DEV_V1
import { FunctionPointsDev } from './FunctionPointsDev';

const COLORS = {
  V1: {
    dot: 'bg-emerald-400 text-emerald-950',
    border: 'border-emerald-400',
    glow: 'shadow-[0_0_15px_3px_rgba(52,211,153,.35)]',
    name: 'Entrada',
  },
  V2: {
    dot: 'bg-blue-400 text-blue-950',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_15px_3px_rgba(96,165,250,.35)]',
    name: 'Planejamento',
  },
  V3: {
    dot: 'bg-amber-300 text-amber-950',
    border: 'border-amber-300',
    glow: 'shadow-[0_0_15px_3px_rgba(252,211,77,.35)]',
    name: 'Controle',
  },
  V4: {
    dot: 'bg-slate-500 text-white',
    border: 'border-slate-400',
    glow: 'shadow-[0_0_15px_3px_rgba(148,163,184,.3)]',
    name: 'Gestão',
  },
  V5: {
    dot: 'bg-violet-400 text-violet-950',
    border: 'border-violet-400',
    glow: 'shadow-[0_0_15px_3px_rgba(167,139,250,.35)]',
    name: 'Escala',
  },
};

const feature = (id, title, acceptance, state = 'Planejada') => ({
  id,
  title,
  acceptance,
  state,
  branch: `features/${id}`,
});

const ROADMAP = [
  {
    id: 'V1',
    title: 'Entrada e diagnóstico',
    description: 'Da chegada da peça à peritagem inicial.',
    areas: [
      {
        id: 'pcp',
        title: 'PCP · Recebimento',
        branch: 'features/pcp-recebimento',
        features: [
          feature(
            'pcp/clientes',
            'Cadastro e busca de clientes',
            'O PCP consegue cadastrar e consultar clientes.\nDurante a abertura da OS, consegue localizar um cliente por CNPJ, razão social ou nome fantasia.\nConsegue vincular o cliente encontrado à nova OS.',
          ),
          feature(
            'pcp/nota-fiscal',
            'Nota fiscal ou N/A',
            'Durante o recebimento, o PCP consegue registrar a nota fiscal ou indicar N/A.\nA informação permanece vinculada à OS.',
          ),
          feature(
            'pcp/numeracao-os',
            'Numeração automática da OS',
            'Ao criar uma OS, o sistema gera automaticamente um número único.\nO número permite identificar e consultar a OS posteriormente.',
          ),
          feature(
            'pcp/abertura-os',
            'Abertura mínima da OS',
            'O PCP consegue registrar a entrada de uma peça, identificando o cliente e o equipamento.\nA OS criada fica disponível para a etapa de peritagem.',
          ),
          feature(
            'pcp/fotografias',
            'Fotografias',
            'Reservar espaço. Upload será implementado depois.',
            'Depois do MVP',
          ),
        ],
      },
      {
        id: 'oficina',
        title: 'Oficina · Peritagem',
        branch: 'features/oficina-peritagem',
        features: [
          feature('oficina/bancadas', 'Bancadas', 'Identificar bancada livre ou ocupada.'),
          feature(
            'oficina/inspecao',
            'Inspeção inicial',
            'Classificar equipamento e registrar análise.',
          ),
        ],
      },
    ],
  },
  {
    id: 'V2',
    title: 'Planejamento e execução',
    description: 'Responsáveis, prioridades e etapas.',
    areas: [
      {
        id: 'planejamento',
        title: 'PCP · Planejamento',
        branch: 'features/pcp-planejamento',
        features: [
          feature('pcp/fila', 'Fila de OS', 'Visualizar ordens abertas.'),
          feature('pcp/prazos', 'Prazos e prioridade', 'Acompanhar prazos e prioridades.'),
        ],
      },
      {
        id: 'execucao',
        title: 'Oficina · Execução',
        branch: 'features/oficina-execucao',
        features: [
          feature('oficina/etapas', 'Etapas produtivas', 'Atualizar status por etapa.'),
          feature('oficina/proxima-acao', 'Próximo passo', 'Identificar a próxima ação.'),
        ],
      },
    ],
  },
  {
    id: 'V3',
    title: 'Controle e liberação',
    description: 'Evidências, pendências e validação.',
    areas: [
      {
        id: 'controle',
        title: 'Controle técnico',
        branch: 'features/controle-tecnico',
        features: [
          feature('controle/evidencias', 'Evidências', 'Vincular evidências à OS.'),
          feature('controle/pendencias', 'Pendências', 'Registrar motivo e responsável.'),
          feature('controle/liberacao', 'Liberação', 'Registrar validação técnica.'),
        ],
      },
    ],
  },
  {
    id: 'V4',
    title: 'Gestão operacional',
    description: 'Filas, gargalos e atrasos.',
    areas: [
      {
        id: 'gestao',
        title: 'Gestão',
        branch: 'features/gestao-operacional',
        features: [
          feature('gestao/capacidade', 'Capacidade por setor', 'Visualizar carga de trabalho.'),
          feature('gestao/historico', 'Histórico operacional', 'Consultar evolução das OS.'),
        ],
      },
    ],
  },
  {
    id: 'V5',
    title: 'Cobertura validada',
    description: 'Fluxo completo utilizado pela RKM.',
    areas: [
      {
        id: 'escala',
        title: 'Cobertura da oficina',
        branch: 'features/cobertura-oficina',
        features: [
          feature('cobertura/ponta-a-ponta', 'Fluxo completo', 'Acompanhar até a finalização.'),
          feature('cobertura/aceite', 'Aceite da RKM', 'Validar funcionalidades com o cliente.'),
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

const STORAGE_KEY = 'rkm:private-dev-hours';
const BRANCH_STORAGE_KEY = 'rkm:private-dev-branches';

// RKM_TASK_DONE_DEV_V1
const TASK_STATUS_KEY = 'rkm:private-dev-task-status';

function readHours() {
  if (!LOCAL) return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function readBranches() {
  if (!LOCAL) return {};
  try {
    const value = JSON.parse(localStorage.getItem(BRANCH_STORAGE_KEY) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function readTaskStatuses() {
  if (!LOCAL) return {};

  try {
    const value = JSON.parse(localStorage.getItem(TASK_STATUS_KEY) || '{}');

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

const WAKATIME_RETRY_MS = 30 * 1000;

function WakatimeCountdown({ nextAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (!nextAt) return 'Aguardando sincronização...';

  const remaining = Math.max(0, Math.ceil((nextAt - now) / 1000));

  if (remaining === 0) {
    return 'Atualizando em instantes...';
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, '0');

  return `Próxima consulta em ${minutes}m${seconds}s`;
}

export function RoadmapView() {
  const [versionId, setVersionId] = useState('V1');
  const [areaId, setAreaId] = useState('pcp');
  const [featureId, setFeatureId] = useState('pcp/clientes');
  const [hours, setHours] = useState(readHours);
  const [branches, setBranches] = useState(readBranches);
  const [branchDraft, setBranchDraft] = useState('');
  const [completedFeatures, setCompletedFeatures] = useState(readTaskStatuses);

  const [wakatimeHours, setWakatimeHours] = useState({});
  const [nextWakatimeSyncAt, setNextWakatimeSyncAt] = useState(null);
  const activeBranch = branches[featureId] || `features/${featureId}`;

  useEffect(() => {
    if (!LOCAL || !featureId) return;

    let cancelled = false;
    let timer;

    async function refresh() {
      setWakatimeHours((previous) => ({
        ...previous,
        [featureId]: {
          ...previous[featureId],
          loading: true,
          error: '',
        },
      }));

      try {
        const response = await fetch(`/__dev/wakatime?branch=${encodeURIComponent(activeBranch)}`);

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Falha ao consultar WakaTime.');
        }

        const seconds = Number(result.totalSeconds);
        const nextAt = Number(result.nextRefreshAt);

        if (!Number.isFinite(seconds) || seconds < 0) {
          throw new Error('Tempo retornado é inválido.');
        }

        if (!Number.isFinite(nextAt) || nextAt <= 0) {
          throw new Error('Validade do cache não informada.');
        }

        if (cancelled) return;

        setWakatimeHours((previous) => ({
          ...previous,
          [featureId]: {
            loading: false,
            error: '',
            minutes: Math.round(seconds / 60),
            editors: Array.isArray(result.editors) ? result.editors : [],
          },
        }));

        setNextWakatimeSyncAt(nextAt);

        timer = window.setTimeout(refresh, Math.max(1000, nextAt - Date.now() + 250));
      } catch (error) {
        if (cancelled) return;

        setWakatimeHours((previous) => ({
          ...previous,
          [featureId]: {
            ...previous[featureId],
            loading: false,
            error: error instanceof Error ? error.message : 'WakaTime indisponível.',
          },
        }));

        const retryAt = Date.now() + WAKATIME_RETRY_MS;
        setNextWakatimeSyncAt(retryAt);

        timer = window.setTimeout(refresh, WAKATIME_RETRY_MS);
      }
    }

    setNextWakatimeSyncAt(null);
    refresh();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [featureId, activeBranch]);

  // RKM_ROADMAP_MODES_V1
  const [editingHoursId, setEditingHoursId] = useState(null);

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

      if (next[id]) {
        setEditingHoursId(null);
      }
    } catch (error) {
      console.error('Erro ao salvar status:', error);
    }
  };

  const recordHours = (id, field, value) => {
    // RKM_LOCK_COMPLETED_HOURS_V1
    if (!LOCAL || completedFeatures[id]) return;

    const next = {
      ...hours,
      [id]: { ...hours[id], [field]: value },
    };

    setHours(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const saveBranch = (id) => {
    if (!LOCAL) return;
    const branch = branchDraft.trim();
    if (!branch) return;

    const next = { ...branches, [id]: branch };
    try {
      localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(next));
      setBranches(next);
      setEditingHoursId(null);
    } catch (error) {
      console.error('Erro ao salvar branch:', error);
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
              className="overflow-hidden rounded-xl border border-rkmborder bg-rkmcard2/30"
            >
              <button
                type="button"
                onClick={() => setAreaId(areaId === area.id ? '' : area.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-sm font-semibold text-slate-100">
                  {areaId === area.id ? '▾' : '▸'} {area.title}
                </span>
                {LOCAL && (
                  <code className="hidden text-xs text-blue-300 sm:block">{area.branch}</code>
                )}
              </button>

              {areaId === area.id && (
                <div className="space-y-2 border-t border-rkmborder p-3">
                  {area.features.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-rkmborder bg-rkmbg/50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFeatureId(featureId === item.id ? '' : item.id);
                          setEditingHoursId(null);
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
                                {item.acceptance.split('\n').map((criterion, index) => (
                                  <li key={index}>{criterion}</li>
                                ))}
                              </ul>
                            ) : (
                              <span>{item.acceptance}</span>
                            )}
                          </div>

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
                            <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-amber-300">
                                  HORAS · APENAS LOCALHOST
                                </span>

                                <button
                                  type="button"
                                  disabled={Boolean(completedFeatures[item.id])}
                                  onClick={() => {
                                    if (editingHoursId === item.id) {
                                      setEditingHoursId(null);
                                    } else {
                                      setBranchDraft(branches[item.id] || item.branch);
                                      setEditingHoursId(item.id);
                                    }
                                  }}
                                  className="rounded-md border border-amber-400/30 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {completedFeatures[item.id]
                                    ? '🔒 Reabra para editar'
                                    : editingHoursId === item.id
                                      ? '✓ Concluir'
                                      : '✎ Editar'}
                                </button>
                              </div>

                              <div className="mb-3 border-t border-amber-400/20 pt-3">
                                <FunctionPointsDev
                                  featureId={item.id}
                                  editable={
                                    !completedFeatures[item.id] && editingHoursId === item.id
                                  }
                                />
                              </div>

                              {editingHoursId === item.id && (
                                <div className="mb-3 flex flex-wrap items-end gap-2">
                                  <label className="min-w-0 flex-1 text-xs text-slate-400">
                                    Branch WakaTime
                                    <input
                                      value={branchDraft}
                                      onChange={(event) => setBranchDraft(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === 'Enter') saveBranch(item.id);
                                      }}
                                      className="mt-1 w-full rounded-md border border-rkmborder bg-rkmcard2 px-3 py-2 text-sm text-slate-200"
                                      placeholder={item.branch}
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => saveBranch(item.id)}
                                    className="rounded-md border border-sky-400/30 px-3 py-2 text-xs font-medium text-sky-200 hover:bg-sky-400/10"
                                  >
                                    Salvar branch
                                  </button>
                                </div>
                              )}

                              <div className="grid gap-3 sm:grid-cols-2">
                                <DurationPicker
                                  label="Estimativa inicial"
                                  mode={
                                    !completedFeatures[item.id] && editingHoursId === item.id
                                      ? 'edit'
                                      : 'locked'
                                  }
                                  minutes={
                                    hours[item.id]?.estimated == null ||
                                    hours[item.id]?.estimated === ''
                                      ? null
                                      : Math.round(Number(hours[item.id].estimated) * 60)
                                  }
                                  onChange={(value) =>
                                    recordHours(
                                      item.id,
                                      'estimated',
                                      value === null ? '' : String(value / 60),
                                    )
                                  }
                                />

                                <div className="space-y-2">
                                  <DurationPicker
                                    label="Tempo real · WakaTime"
                                    mode="locked"
                                    minutes={wakatimeHours[item.id]?.minutes ?? null}
                                    onChange={() => undefined}
                                  >
                                    {wakatimeHours[item.id]?.editors?.length > 0 && (
                                      <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
                                        {wakatimeHours[item.id].editors.map((editor) => {
                                          const seconds = Math.round(editor.totalSeconds);
                                          const minutes = Math.floor(seconds / 60);
                                          const remainder = seconds % 60;

                                          return (
                                            <li key={editor.name}>
                                              <span className="text-slate-300">{editor.name}</span>
                                              {' — '}
                                              {minutes > 0 ? `${minutes}min ` : ''}
                                              {remainder}s
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </DurationPicker>

                                  <p
                                    role="status"
                                    className={`text-xs ${
                                      wakatimeHours[item.id]?.error
                                        ? 'text-rose-300'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {wakatimeHours[item.id]?.error ||
                                      (wakatimeHours[item.id]?.loading ? (
                                        'Sincronizando com WakaTime...'
                                      ) : (
                                        <WakatimeCountdown nextAt={nextWakatimeSyncAt} />
                                      ))}
                                  </p>
                                </div>

                                <div className="rounded-lg border border-rkmborder p-2 text-sm text-slate-300 sm:col-span-2 w-full">
                                  Desvio:{' '}
                                  {hours[item.id]?.estimated !== undefined &&
                                  hours[item.id]?.estimated !== '' &&
                                  wakatimeHours[item.id]?.minutes != null
                                    ? `${(
                                        wakatimeHours[item.id].minutes / 60 -
                                        Number(hours[item.id].estimated)
                                      ).toFixed(2)} h`
                                    : '—'}
                                </div>
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                Estimativa local. Tempo real por projeto e branch via WakaTime.
                              </p>
                            </div>
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

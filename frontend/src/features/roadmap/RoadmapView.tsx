// RKM_ROADMAP_COMPACT_V1
import React, { useState } from 'react';

import { Tooltip } from '../../Tooltip';
import {
  freezeFeatureMetric,
  listPersistedFeatureMetrics,
  unlockFeatureMetric,
  type FeatureMetricDraft,
} from './dev-feature-metrics-service';
import { useLocalDevelopment } from '../../shared/dev/local-development';
import { formatRoadmapDate, getRoadmapVersionTimebox } from '../time/roadmap-time';
import type { RoadmapFeature } from './roadmap-model';
import { RoadmapFeatureCard } from './RoadmapFeatureCard';
import { RoadmapGanttLocalDev } from './RoadmapGanttLocalDev';
import { getAreaProjections, ROADMAP } from './roadmap-data';

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
    name: 'Detalhamento',
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
    name: 'Rastreabilidade',
  },
  V4: {
    dot: 'bg-violet-400 text-violet-950',
    border: 'border-violet-400',
    glow: 'shadow-[0_0_15px_3px_rgba(167,139,250,.35)]',
    name: 'Gestão',
  },
};

const AREA_COLORS = {
  pcp: {
    dot: 'bg-cyan-400 text-cyan-950',
    border: 'border-cyan-400',
    glow: 'shadow-[0_0_15px_3px_rgba(34,211,238,.35)]',
  },
  oficina: {
    dot: 'bg-orange-400 text-orange-950',
    border: 'border-orange-400',
    glow: 'shadow-[0_0_15px_3px_rgba(251,146,60,.35)]',
  },
  comercial: {
    dot: 'bg-fuchsia-400 text-fuchsia-950',
    border: 'border-fuchsia-400',
    glow: 'shadow-[0_0_15px_3px_rgba(232,121,249,.35)]',
  },
  finalizacao: {
    dot: 'bg-lime-400 text-lime-950',
    border: 'border-lime-400',
    glow: 'shadow-[0_0_15px_3px_rgba(163,230,53,.35)]',
  },
  controle: {
    dot: 'bg-rose-400 text-rose-950',
    border: 'border-rose-400',
    glow: 'shadow-[0_0_15px_3px_rgba(251,113,133,.35)]',
  },
  admin: {
    dot: 'bg-indigo-400 text-indigo-950',
    border: 'border-indigo-400',
    glow: 'shadow-[0_0_15px_3px_rgba(129,140,248,.35)]',
  },
};

const V0_MILESTONE_FEATURES: Record<string, string[]> = {
  '2026-10-16': ['pcp/clientes'],
  '2026-10-23': ['comercial/tabela-precos'],
  '2026-10-30': ['pcp/abertura-os'],
  '2026-11-06': ['pcp/fila'],
  '2026-11-13': ['oficina/bancadas'],
  '2026-11-20': ['oficina/diagnostico-minimo'],
  '2026-11-27': ['oficina/execucao-minima'],
  '2026-12-04': ['comercial/orcamento-minimo'],
  '2026-12-08': ['finalizacao/encerramento', 'finalizacao/relatorio-pdf'],
};

function roadmapDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function RoadmapView() {
  const localDevelopmentEnabled = useLocalDevelopment();
  const [viewMode, setViewMode] = useState<'version' | 'area'>('version');
  const [versionId, setVersionId] = useState('V0');
  const [areaId, setAreaId] = useState('pcp');
  const [featureId, setFeatureId] = useState('');
  const [completedFeatures, setCompletedFeatures] = useState<Record<string, boolean>>({});
  const [taskStatusLoaded, setTaskStatusLoaded] = useState(false);
  const [taskStatusPending, setTaskStatusPending] = useState<Record<string, boolean>>({});
  const [taskStatusError, setTaskStatusError] = useState('');
  const [featureMetricDrafts, setFeatureMetricDrafts] = useState<
    Record<string, FeatureMetricDraft>
  >({});
  const visibleRoadmap = React.useMemo(
    () => (localDevelopmentEnabled ? ROADMAP : ROADMAP.filter((entry) => entry.id !== 'V4')),
    [localDevelopmentEnabled],
  );

  const areaProjections = React.useMemo(() => getAreaProjections(visibleRoadmap), [visibleRoadmap]);

  React.useEffect(() => {
    if (!localDevelopmentEnabled) {
      setTaskStatusLoaded(true);
      return;
    }

    let cancelled = false;

    void listPersistedFeatureMetrics()
      .then((metrics) => {
        if (cancelled) return;

        const persistedCompleted = Object.fromEntries(
          metrics.filter((metric) => metric.locked).map((metric) => [metric.featureId, true]),
        );

        setCompletedFeatures(persistedCompleted);
        setTaskStatusLoaded(true);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error('Erro ao carregar status DEV:', error);

        setTaskStatusError(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o status das features.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [localDevelopmentEnabled]);

  const version = visibleRoadmap.find((v) => v.id === versionId) || visibleRoadmap[0];
  const selectedArea = areaProjections.find((area) => area.id === areaId) || areaProjections[0];
  const roadmapTimebox = getRoadmapVersionTimebox(version.id);
  const versionProgress = React.useMemo(() => {
    const totalFeatures = version.areas.reduce((total, area) => total + area.features.length, 0);
    const delivered: string[] = [];
    const inProgress: string[] = [];

    version.areas.forEach((area) => {
      area.features.forEach((feature) => {
        const isDelivered = feature.state === 'Concluída' || Boolean(completedFeatures[feature.id]);

        if (isDelivered) delivered.push(feature.title);
        else if (feature.state === 'Em andamento') inProgress.push(feature.title);
      });
    });

    const workedFeatures = delivered.length + inProgress.length;

    return {
      actualPercentage: Math.round((workedFeatures / totalFeatures) * 100),
      delivered,
      inProgress,
      expectedPercentage: Math.min(
        100,
        Math.max(
          0,
          Math.round(
            ((roadmapTimebox.today.getTime() - roadmapTimebox.start.getTime()) /
              (roadmapTimebox.deadline.getTime() - roadmapTimebox.start.getTime())) *
              100,
          ),
        ),
      ),
    };
  }, [completedFeatures, roadmapTimebox, version]);
  const progressTooltipContent = (
    <div className="space-y-2">
      <strong className="block text-orange-200">
        Progresso realizado: {versionProgress.actualPercentage}%
      </strong>
      {versionProgress.delivered.length > 0 && (
        <div>
          <span className="font-semibold text-emerald-300">Entregues</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {versionProgress.delivered.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      )}
      {versionProgress.inProgress.length > 0 && (
        <div>
          <span className="font-semibold text-orange-300">Em andamento</span>
          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {versionProgress.inProgress.map((title) => (
              <li key={title}>{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  const stepperCount = Math.max(
    1,
    viewMode === 'version' ? visibleRoadmap.length : areaProjections.length,
  );

  React.useEffect(() => {
    const versionVisible = visibleRoadmap.some((entry) => entry.id === versionId);
    const areaVisible = areaProjections.some((area) => area.id === areaId);

    if (!versionVisible) {
      setVersionId('V0');
    }

    if (areaId && !areaVisible) {
      setAreaId('pcp');
    }

    if (!versionVisible || (areaId && !areaVisible)) {
      setFeatureId('pcp/clientes');
    }
  }, [visibleRoadmap, areaProjections, versionId, areaId]);

  const handleLiveMetricChange = React.useCallback(
    (id: string, metric: FeatureMetricDraft | null) => {
      setFeatureMetricDrafts((previous) => {
        if (!metric) {
          if (!previous[id]) {
            return previous;
          }

          const next = { ...previous };
          delete next[id];

          return next;
        }

        return {
          ...previous,
          [id]: metric,
        };
      });
    },
    [],
  );

  const toggleTaskDone = async (item: RoadmapFeature) => {
    if (!localDevelopmentEnabled || !taskStatusLoaded || taskStatusPending[item.id]) {
      return;
    }

    setTaskStatusError('');

    setTaskStatusPending((previous) => ({
      ...previous,
      [item.id]: true,
    }));

    try {
      if (completedFeatures[item.id]) {
        await unlockFeatureMetric(item.id);
      } else {
        const metric = featureMetricDrafts[item.id];

        if (!metric) {
          throw new Error('Aguarde as métricas atuais carregarem antes de concluir a feature.');
        }

        await freezeFeatureMetric(metric);
      }

      setCompletedFeatures((previous) => {
        const next = { ...previous };

        if (next[item.id]) {
          delete next[item.id];
        } else {
          next[item.id] = true;
        }

        return next;
      });
    } catch (error) {
      setTaskStatusError(
        error instanceof Error ? error.message : 'Não foi possível alterar o status da feature.',
      );
    } finally {
      setTaskStatusPending((previous) => ({
        ...previous,
        [item.id]: false,
      }));
    }
  };

  const renderFeatureCard = (item: RoadmapFeature) => (
    <RoadmapFeatureCard
      key={item.id}
      item={item}
      expanded={featureId === item.id}
      localDevelopmentEnabled={localDevelopmentEnabled}
      completed={Boolean(completedFeatures[item.id])}
      taskStatusLoaded={taskStatusLoaded}
      taskStatusPending={Boolean(taskStatusPending[item.id])}
      taskStatusError={taskStatusError}
      onToggle={() => setFeatureId(featureId === item.id ? '' : item.id)}
      onToggleTaskDone={(feature) => void toggleTaskDone(feature)}
      onLiveMetricChange={handleLiveMetricChange}
    />
  );

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rkm-card p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-300">
          Planejamento
        </div>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">Roadmap</h1>
        <p className="mt-1 text-sm text-slate-400">
          Escolha uma perspectiva e expanda a funcionalidade desejada.
        </p>

        <div className="mt-5 flex w-fit rounded-lg border border-rkmborder bg-rkmcard2/40 p-1">
          {[
            ['version', 'Por versão'],
            ['area', 'Por área'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode as 'version' | 'area')}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
                viewMode === mode
                  ? 'bg-blue-400/15 text-blue-200'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="relative mt-6 grid gap-1 sm:gap-3"
          style={{
            gridTemplateColumns: `repeat(${stepperCount}, minmax(0, 1fr))`,
          }}
        >
          <div
            className="pointer-events-none absolute top-[29px] h-px bg-blue-400/50"
            style={{
              left: `${50 / stepperCount}%`,
              right: `${50 / stepperCount}%`,
            }}
          />

          {viewMode === 'version'
            ? visibleRoadmap.map((v) => {
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
                    <span className="mt-2 block text-[11px] font-medium text-slate-200">
                      {c.name}
                    </span>
                  </button>
                );
              })
            : areaProjections.map((area) => {
                const c = AREA_COLORS[area.id] || AREA_COLORS.pcp;
                const selected = area.id === areaId;

                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      setAreaId(area.id);
                      setFeatureId(area.versions[0]?.features[0]?.id || '');
                    }}
                    className={`relative rounded-lg border p-2 text-center transition ${
                      selected
                        ? `${c.border} bg-slate-800/70`
                        : 'border-transparent hover:bg-slate-800/30'
                    }`}
                  >
                    <span
                      className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-rkmbg ${c.dot} ${selected ? c.glow : ''}`}
                    >
                      {area.title}
                    </span>
                    <span className="mt-2 block text-[11px] font-medium text-slate-200">
                      {area.title}
                    </span>
                  </button>
                );
              })}
        </div>
      </section>

      <section className="rkm-card overflow-hidden">
        <header className="border-b border-rkmborder p-5">
          <span className="text-xs font-bold text-blue-300">
            {viewMode === 'version' ? version.id : 'ÁREA'}
          </span>
          <h2 className="mt-2 text-xl font-semibold text-slate-100">
            {viewMode === 'version' ? version.title : selectedArea.title}
          </h2>
          {viewMode === 'version' && (
            <p className="mt-2 text-sm font-semibold text-sky-300">{version.question}</p>
          )}
          <p className="mt-1 text-sm text-slate-400">
            {viewMode === 'version'
              ? version.description
              : `Features de ${selectedArea.title} distribuídas ao longo das versões.`}
          </p>
          {viewMode === 'version' && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Perguntas que esta versão responde
              </p>
              <div className="flex flex-wrap gap-2">
                {(version.questions ?? []).map((question) => (
                  <span
                    key={question}
                    className="rounded-lg border border-sky-400/15 bg-sky-400/[0.05] px-3 py-1.5 text-xs text-slate-300"
                  >
                    {question}
                  </span>
                ))}
              </div>
            </div>
          )}
          {localDevelopmentEnabled && (
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
              <code className="text-xs text-blue-300">
                {viewMode === 'version'
                  ? `versions/${version.id.toLowerCase()}`
                  : `area/${selectedArea.id}`}
              </code>
              {viewMode === 'version' && (
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                    <span className="uppercase tracking-wide">Início</span>
                    <span>→ {formatRoadmapDate(roadmapTimebox.start)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200 shadow-[0_0_0_1px_rgba(252,211,77,0.04)]">
                    <span className="uppercase tracking-wide text-amber-100/80">Prazo</span>
                    <span className="text-amber-100">
                      → {formatRoadmapDate(roadmapTimebox.deadline)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-sky-200 shadow-[0_0_0_1px_rgba(125,211,252,0.04)]">
                    <span className="uppercase tracking-wide text-sky-100/80">Falta</span>
                    <span className="text-sky-100">→ {roadmapTimebox.remainingLabel}</span>
                  </span>
                </div>
              )}
            </div>
          )}
          {localDevelopmentEnabled && viewMode === 'version' && (
            <div className="mt-10 flex items-center gap-8 text-xs text-slate-400">
              <span className="shrink-0 uppercase tracking-wide text-slate-500">Dias</span>
              <div className="relative mx-5 h-10 min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-x-0 top-2 border-t border-slate-500/70" />

                {roadmapTimebox.days.map((day, index) => {
                  const isStart = index === 0;
                  const isDeadline = index === roadmapTimebox.days.length - 1;
                  const isToday = day.getTime() === roadmapTimebox.today.getTime();

                  // Evita duas bolinhas coladas perto do início e do prazo.
                  const isFriday =
                    day.getDay() === 5 && index >= 4 && index <= roadmapTimebox.days.length - 5;

                  const isMilestone = isStart || isDeadline || isFriday || isToday;

                  const showLabel = isMilestone;

                  const position = (index / Math.max(1, roadmapTimebox.days.length - 1)) * 100;
                  const milestoneFeatures =
                    version.id === 'V0'
                      ? V0_MILESTONE_FEATURES[roadmapDateKey(day)]?.flatMap((id) =>
                          version.areas.flatMap((area) =>
                            area.features.filter((feature) => feature.id === id),
                          ),
                        ) || []
                      : [];
                  const milestoneAreas = version.areas.filter((area) =>
                    milestoneFeatures.some((feature) =>
                      area.features.some((item) => item.id === feature.id),
                    ),
                  );
                  const milestoneIsDelivered =
                    milestoneFeatures.length > 0 &&
                    milestoneFeatures.every(
                      (feature) =>
                        feature.state === 'Concluída' || Boolean(completedFeatures[feature.id]),
                    );
                  const milestoneIsInProgress = milestoneFeatures.some(
                    (feature) => feature.state === 'Em andamento',
                  );
                  const milestoneHeadingClass = milestoneIsDelivered
                    ? 'text-emerald-300'
                    : milestoneIsInProgress
                      ? 'text-orange-300'
                      : 'text-slate-300';
                  const milestoneDotClass = milestoneIsDelivered
                    ? 'h-4 w-4 rounded-full border border-emerald-200 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.4)]'
                    : milestoneIsInProgress
                      ? 'h-4 w-4 rounded-full border border-orange-100 bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,.45)]'
                      : 'h-4 w-4 rounded-full border border-amber-300 bg-amber-300/90 shadow-[0_0_8px_rgba(252,211,77,.25)]';
                  const milestoneTooltipContent = milestoneFeatures.length ? (
                    <div className="space-y-1">
                      <strong className={`block ${milestoneHeadingClass}`}>
                        [{milestoneAreas.map((area) => area.title).join(' · ')}] Entregas previstas
                      </strong>
                      <ul className="list-disc space-y-0.5 pl-4">
                        {milestoneFeatures.map((feature) => (
                          <li key={feature.id}>{feature.title}</li>
                        ))}
                      </ul>
                    </div>
                  ) : isStart ? (
                    <strong className="text-emerald-200">Início da versão mínima</strong>
                  ) : isDeadline ? (
                    <strong className="text-amber-200">Prazo da versão mínima</strong>
                  ) : null;
                  const milestoneDot = (
                    <span
                      className={
                        isToday
                          ? 'relative z-20 h-4 w-4 rounded-full border-2 border-sky-200 bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.15),0_0_14px_rgba(56,189,248,0.7)]'
                          : milestoneDotClass
                      }
                    >
                      {isToday && (
                        <Tooltip content={progressTooltipContent}>
                          <span
                            className="block h-4 w-4"
                            aria-label="Detalhes do progresso realizado"
                          />
                        </Tooltip>
                      )}
                      {!isToday && milestoneTooltipContent && (
                        <Tooltip content={milestoneTooltipContent}>
                          <span className="block h-4 w-4" aria-label="Detalhes da entrega" />
                        </Tooltip>
                      )}
                    </span>
                  );

                  return (
                    <React.Fragment key={day.toISOString()}>
                      <span
                        className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
                        style={{ left: `${position}%` }}
                      >
                        {isToday && (
                          <span className="absolute bottom-full mb-2 whitespace-nowrap rounded-full border border-sky-400/50 bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-200">
                            HOJE
                          </span>
                        )}

                        {isMilestone ? (
                          milestoneDot
                        ) : (
                          <span className="mt-2 h-2 border-l border-slate-500/70" />
                        )}

                        {showLabel && (
                          <span
                            className={
                              isToday
                                ? 'whitespace-nowrap font-bold text-sky-300'
                                : 'whitespace-nowrap'
                            }
                          >
                            {formatRoadmapDate(day)}
                          </span>
                        )}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
          {localDevelopmentEnabled && viewMode === 'version' && (
            <div className="mt-5 grid gap-3 text-xs text-slate-400 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-8">
              <span className="shrink-0 uppercase tracking-wide text-slate-500">
                Progresso da versão mínima
              </span>
              <div className="relative mx-5 h-9 min-w-0">
                <span className="pointer-events-none absolute inset-x-0 top-2 border-t border-slate-500/70" />
                <span
                  className="pointer-events-none absolute left-0 top-[7px] h-1 rounded-full bg-sky-300/70"
                  style={{ width: `${versionProgress.expectedPercentage}%` }}
                />
                <span
                  className="pointer-events-none absolute left-0 top-[7px] h-1 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,.4)]"
                  style={{ width: `${versionProgress.actualPercentage}%` }}
                />
                {[0, 25, 50, 75, 100].map((percentage) => (
                  <span
                    key={percentage}
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1"
                    style={{ left: `${percentage}%` }}
                  >
                    <span
                      className={`h-4 w-px ${percentage <= versionProgress.actualPercentage ? 'bg-orange-300' : 'bg-slate-500/70'}`}
                    />
                    <span className="whitespace-nowrap text-[10px]">{percentage}%</span>
                  </span>
                ))}
                <span
                  className="absolute top-[-5px] z-10 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-orange-100 bg-orange-300 shadow-[0_0_10px_rgba(253,186,116,.55)]"
                  style={{ left: `${versionProgress.actualPercentage}%` }}
                />
                <span
                  className="absolute top-[-5px] z-[5] h-4 w-4 -translate-x-1/2 rounded-full border-2 border-sky-100 bg-sky-300 shadow-[0_0_10px_rgba(125,211,252,.45)]"
                  style={{ left: `${versionProgress.expectedPercentage}%` }}
                  title={`Esperado: ${versionProgress.expectedPercentage}%`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <span className="whitespace-nowrap text-sky-200">
                  Esperado {versionProgress.expectedPercentage}%
                </span>
                <span className="whitespace-nowrap font-semibold text-orange-200">
                  Realizado {versionProgress.actualPercentage}%
                </span>
              </div>
            </div>
          )}
        </header>

        {localDevelopmentEnabled && viewMode === 'area' && (
          <div className="px-4 pb-4 pt-2">
            <RoadmapGanttLocalDev />
          </div>
        )}

        {viewMode === 'version' ? (
          <div className="space-y-3 p-4">
            {version.areas.map((area) => (
              <section
                key={area.id}
                className="overflow-hidden rounded-xl border border-sky-400/10 bg-rkmcard2/45"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setAreaId(areaId === area.id ? '' : area.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setAreaId(areaId === area.id ? '' : area.id);
                      }
                    }}
                    className="flex min-h-12 cursor-pointer items-center self-stretch p-4 text-left sm:w-56 sm:flex-none"
                  >
                    <span className="text-sm font-semibold text-slate-100">
                      {areaId === area.id ? '▾' : '▸'} {area.title}
                    </span>
                  </div>

                  <div
                    className="min-w-0 flex-1 self-center overflow-x-auto p-4 sm:mr-[8%]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div
                      className={`relative grid gap-2 ${
                        area.features.length === 1
                          ? 'grid-cols-1'
                          : area.features.length === 2
                            ? 'grid-cols-2'
                            : area.features.length === 4
                              ? 'grid-cols-4 min-w-[560px]'
                              : 'grid-cols-3'
                      }`}
                    >
                      {area.features.length > 1 && (
                        <div
                          className={`pointer-events-none absolute top-3 h-px bg-slate-500/70 shadow-[0_0_4px_rgba(100,116,139,.35)] ${
                            area.features.length === 2
                              ? 'left-[25%] right-[25%]'
                              : area.features.length === 4
                                ? 'left-[12.5%] right-[12.5%]'
                                : 'left-[16.67%] right-[16.67%]'
                          }`}
                        />
                      )}
                      {area.features.map((feature, index) => {
                        const done =
                          feature.state === 'Concluída' || Boolean(completedFeatures[feature.id]);
                        const inProgress =
                          localDevelopmentEnabled && !done && feature.state === 'Em andamento';

                        return (
                          <div key={feature.id} className="relative text-center">
                            <span
                              className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                                done
                                  ? 'border-emerald-300 bg-emerald-400 text-emerald-950'
                                  : inProgress
                                    ? 'border-orange-300 bg-orange-300 text-orange-950 shadow-[0_0_10px_rgba(253,186,116,.35)]'
                                    : 'border-rkmborder bg-rkmcard2 text-slate-400'
                              }`}
                            >
                              {done ? '✓' : index + 1}
                            </span>
                            <span
                              className={`mt-2 block text-[10px] leading-tight ${
                                done
                                  ? 'text-emerald-300'
                                  : inProgress
                                    ? 'text-orange-300'
                                    : 'text-slate-400'
                              }`}
                            >
                              {feature.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {areaId === area.id && (
                  <div className="space-y-2 border-t border-rkmborder p-3">
                    <p className="px-2 pb-1 text-sm text-slate-400">{area.objective}</p>

                    {area.features.map(renderFeatureCard)}
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {selectedArea.versions.map((areaVersion) => {
              const areaTimebox = getRoadmapVersionTimebox(areaVersion.id);

              return (
                <section
                  key={areaVersion.id}
                  className="overflow-hidden rounded-xl border border-sky-400/10 bg-rkmcard2/45"
                >
                  <div className="flex items-start justify-between gap-3 p-4">
                    <div>
                      <span className="text-xs font-bold text-blue-300">{areaVersion.id}</span>
                      <h3 className="mt-1 text-sm font-semibold text-slate-100">
                        {areaVersion.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">{areaVersion.objective}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                          Início → {formatRoadmapDate(areaTimebox.start)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200">
                          Prazo → {formatRoadmapDate(areaTimebox.deadline)}
                        </span>
                      </div>
                    </div>
                    <span className="tag tag-slate">{areaVersion.features.length} features</span>
                  </div>
                  <div className="space-y-2 border-t border-rkmborder p-3">
                    {areaVersion.features.map(renderFeatureCard)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

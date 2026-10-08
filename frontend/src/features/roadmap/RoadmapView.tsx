// RKM_ROADMAP_COMPACT_V1
import React, { useState } from 'react';

import {
  freezeFeatureMetric,
  listPersistedFeatureMetrics,
  unlockFeatureMetric,
  type FeatureMetricDraft,
} from './dev-feature-metrics-service';
import { useLocalDevelopment } from '../../shared/dev/local-development';
import type { RoadmapFeature } from './roadmap-model';
import { RoadmapFeatureDetails } from './RoadmapFeatureDetails';
import { ROADMAP } from './roadmap-data';

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

export function RoadmapView() {
  const localDevelopmentEnabled = useLocalDevelopment();
  const [versionId, setVersionId] = useState('V0');
  const [areaId, setAreaId] = useState('pcp');
  const [featureId, setFeatureId] = useState('pcp/clientes');
  const [completedFeatures, setCompletedFeatures] = useState<Record<string, boolean>>({});
  const [taskStatusLoaded, setTaskStatusLoaded] = useState(false);
  const [taskStatusPending, setTaskStatusPending] = useState<Record<string, boolean>>({});
  const [taskStatusError, setTaskStatusError] = useState('');
  const [featureMetricDrafts, setFeatureMetricDrafts] = useState<
    Record<string, FeatureMetricDraft>
  >({});

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

  const version = ROADMAP.find((v) => v.id === versionId) || ROADMAP[0];

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
          <div className="pointer-events-none absolute left-[10%] right-[10%] top-[29px] h-px bg-blue-400/50" />

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
          {localDevelopmentEnabled && (
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
                        localDevelopmentEnabled && completedFeatures[item.id]
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
                            localDevelopmentEnabled && completedFeatures[item.id]
                              ? 'tag-emerald'
                              : item.state === 'Depois do MVP'
                                ? 'tag-amber'
                                : 'tag-slate'
                          }`}
                        >
                          {localDevelopmentEnabled && completedFeatures[item.id]
                            ? 'Concluída'
                            : item.state}
                        </span>
                      </button>

                      {featureId === item.id && (
                        <RoadmapFeatureDetails
                          item={item}
                          localDevelopmentEnabled={localDevelopmentEnabled}
                          completed={Boolean(completedFeatures[item.id])}
                          taskStatusLoaded={taskStatusLoaded}
                          taskStatusPending={Boolean(taskStatusPending[item.id])}
                          taskStatusError={taskStatusError}
                          onToggleTaskDone={(feature) => void toggleTaskDone(feature)}
                          onLiveMetricChange={handleLiveMetricChange}
                        />
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

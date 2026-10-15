import { useEffect, useState } from 'react';

import { useLocalDevelopment } from '../../shared/dev/local-development';
import { getPersistedFeatureMetric, saveFeatureSettings } from './dev-feature-metrics-service';

function isClientes(id: string) {
  return id === 'pcp-clientes' || id === 'pcp/clientes';
}

export function FunctionPointsDev({
  featureId,
  editable = false,
}: {
  featureId: string;
  editable?: boolean;
}) {
  const localDevelopmentEnabled = useLocalDevelopment();
  const [points, setPoints] = useState<number | null>(null);

  useEffect(() => {
    if (!localDevelopmentEnabled) return;

    let cancelled = false;
    setPoints(null);

    void getPersistedFeatureMetric(featureId)
      .then((metric) => {
        if (!cancelled) {
          setPoints(metric?.functionPoints ?? (isClientes(featureId) ? 13 : null));
        }
      })
      .catch((error) => {
        if (!cancelled) console.error('Erro ao carregar PF:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [featureId, localDevelopmentEnabled]);

  if (!localDevelopmentEnabled) return null;

  const sliderMax = Math.max(100, Math.ceil((points ?? 0) / 50) * 50);
  const progress = ((points ?? 0) / sliderMax) * 100;

  const update = (raw: string) => {
    const next = raw === '' ? null : Math.max(0, Math.floor(Number(raw)));
    if (next !== null && !Number.isFinite(next)) return;

    setPoints(next);

    void saveFeatureSettings(featureId, { functionPoints: next }).catch((error) =>
      console.error('Erro ao salvar PF:', error),
    );
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <div>
        <div className="text-xs font-medium text-slate-300">Pontos de função estimados</div>
        <div className="mt-1 text-[11px] text-slate-500">
          Apenas localhost · tamanho funcional preliminar
        </div>
      </div>

      <div className="flex w-full min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0 flex-1">
          <input
            type="range"
            aria-label="Pontos de função estimados"
            min={0}
            max={sliderMax}
            step={1}
            value={points ?? 0}
            onChange={(event) => update(event.target.value)}
            disabled={!editable}
            className={`rkm-pf-slider h-2 w-full appearance-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 ${editable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
            style={{
              background: `linear-gradient(to right, #38bdf8 ${progress}%, #1e3550 ${progress}%)`,
            }}
          />
          {/* RKM_PF_RULER_V1 */}
          <div className="relative mt-1.5 h-7 w-full select-none" aria-hidden="true">
            {Array.from({ length: 21 }, (_, index) => {
              const major = index % 5 === 0;
              const position = `calc(9px + (100% - 18px) * ${index / 20})`;

              return (
                <div key={index} className="absolute top-0" style={{ left: position }}>
                  <span
                    className={`block w-px -translate-x-1/2 rounded-full ${
                      major ? 'h-3 bg-sky-400/80' : 'h-1.5 bg-slate-500/60'
                    }`}
                  />

                  {major && (
                    <span
                      className={`absolute top-3.5 text-[10px] tabular-nums text-slate-500 ${
                        index === 0 ? '' : index === 20 ? '-translate-x-full' : '-translate-x-1/2'
                      }`}
                    >
                      {Math.round((sliderMax * index) / 20)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <span className="min-w-[65px] shrink-0 text-right text-sm font-semibold tabular-nums text-sky-300">
          {points ?? '—'} PF
        </span>
      </div>
    </div>
  );
}

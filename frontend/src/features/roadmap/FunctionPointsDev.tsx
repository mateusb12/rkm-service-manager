import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rkm:private-dev-function-points';

const LOCAL =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

type PointsMap = Record<string, number | null>;

function readPoints(): PointsMap {
  if (!LOCAL) return {};

  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

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
  const [points, setPoints] = useState<number | null>(() => {
    const stored = readPoints();

    if (Object.prototype.hasOwnProperty.call(stored, featureId)) {
      const value = stored[featureId];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }

    return isClientes(featureId) ? 13 : null;
  });

  useEffect(() => {
    if (!LOCAL || !isClientes(featureId)) return;

    const stored = readPoints();

    if (!Object.prototype.hasOwnProperty.call(stored, featureId)) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, [featureId]: 13 }));
      } catch (error) {
        console.error('Falha ao inicializar PF:', error);
      }
    }
  }, [featureId]);

  if (!LOCAL) return null;

  const sliderMax = Math.max(100, Math.ceil((points ?? 0) / 50) * 50);
  const progress = ((points ?? 0) / sliderMax) * 100;

  const update = (raw: string) => {
    const next = raw === '' ? null : Math.max(0, Math.floor(Number(raw)));

    if (next !== null && !Number.isFinite(next)) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...readPoints(),
          [featureId]: next,
        }),
      );
      setPoints(next);
    } catch (error) {
      console.error('Falha ao salvar PF:', error);
    }
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

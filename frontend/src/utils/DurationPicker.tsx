// RKM_DURATION_PICKER_V2
import { useEffect, useState } from 'react';

type Mode = 'locked' | 'edit';

type Props = {
  label: string;
  minutes: number | null;
  onChange: (minutes: number | null) => void;
  mode?: Mode;
};

const PRESETS = [
  [15, '15min'],
  [30, '30min'],
  [60, '1h'],
  [120, '2h'],
  [240, '4h'],
  [480, '8h'],
] as const;

export function formatDuration(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';

  const n = Math.max(0, Math.round(value));
  const h = Math.floor(n / 60);
  const m = n % 60;

  return [
    h ? `${h}h` : '',
    m || !h ? `${m}min` : '',
  ].filter(Boolean).join(' ');
}

export function DurationPicker({
  label,
  minutes,
  onChange,
  mode = 'locked',
}: Props) {
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (mode === 'locked') setManual(false);
  }, [mode]);

  const value = minutes === null ? null :
    Math.max(0, Math.round(minutes));

  const hours = Math.floor((value ?? 0) / 60);
  const mins = (value ?? 0) % 60;

  const update = (n: number | null) =>
    onChange(n === null ? null :
      Math.max(0, Math.min(599999, Math.round(n))));

  return (
    <div className="rounded-lg border border-rkmborder bg-rkmcard2/40 p-3">
      <div className={`flex items-center justify-between gap-2 ${
        mode === 'edit' ? 'mb-3' : ''
      }`}>
        <span className="text-xs text-slate-400">{label}</span>
        <strong className="text-sm tabular-nums text-blue-300">
          {formatDuration(value)}
        </strong>
      </div>

      {mode === 'edit' && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map(([n, text]) => (
              <button
                key={n}
                type="button"
                aria-pressed={value === n}
                onClick={() => update(n)}
                className={`rounded-md border px-2 py-2 text-xs transition ${
                  value === n
                    ? 'border-blue-400 bg-blue-500/25 text-blue-100'
                    : 'border-rkmborder bg-rkmbg text-slate-300 hover:border-blue-400/60'
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button"
              className="rounded-md border border-rkmborder px-2 py-1.5 text-xs"
              onClick={() => update((value ?? 0) - 15)}>
              −15min
            </button>

            <button type="button"
              className="rounded-md border border-rkmborder px-2 py-1.5 text-xs"
              onClick={() => update((value ?? 0) + 15)}>
              +15min
            </button>

            <button type="button"
              className="rounded-md border border-rkmborder px-2 py-1.5 text-xs text-blue-300"
              onClick={() => setManual(!manual)}>
              Personalizar
            </button>

            {value !== null && (
              <button type="button"
                className="ml-auto text-xs text-slate-400"
                onClick={() => update(null)}>
                Limpar
              </button>
            )}
          </div>

          {manual && (
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-rkmborder pt-3">
              <label className="text-xs text-slate-400">
                Horas
                <input
                  className="rkm-input mt-1"
                  type="number"
                  min="0"
                  max="9999"
                  value={hours}
                  onChange={e => update(
                    Math.min(9999, Math.max(0, Math.trunc(Number(e.target.value) || 0))) * 60 + mins
                  )}
                />
              </label>

              <label className="text-xs text-slate-400">
                Minutos
                <input
                  className="rkm-input mt-1"
                  type="number"
                  min="0"
                  max="59"
                  value={mins}
                  onChange={e => update(
                    hours * 60 +
                    Math.min(59, Math.max(0, Math.trunc(Number(e.target.value) || 0)))
                  )}
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// RKM_DURATION_PICKER_V5
import { useEffect, useMemo, useState } from 'react';

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

  return [h ? `${h}h` : '', m || !h ? `${m}min` : ''].filter(Boolean).join(' ');
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describeRingArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);

  const delta = (((endAngle - startAngle) % 360) + 360) % 360;
  const largeArc = delta > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    'Z',
  ].join(' ');
}

function ClockHand({
  angle,
  length,
  width,
  color,
}: {
  angle: number;
  length: number;
  width: number;
  color: string;
}) {
  const end = polarToCartesian(50, 50, length, angle);

  return (
    <line
      x1="50"
      y1="50"
      x2={end.x}
      y2={end.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
    />
  );
}

function DurationClock({ minutes }: { minutes: number | null }) {
  const total =
    minutes === null || !Number.isFinite(minutes) ? 0 : Math.max(0, Math.round(minutes));

  const fullHours = Math.floor(total / 60);
  const mins = total % 60;

  const normalizedTotal = total % 720;
  const totalAngle = (normalizedTotal / 720) * 360;
  const minuteAngle = (mins / 60) * 360;

  const innerBand = mins > 0 ? describeRingArc(50, 50, 29, 20, 0, minuteAngle) : null;

  const ticks = useMemo(() => {
    const highlightedHourTicks = Math.min(fullHours % 12, 12);

    return Array.from({ length: 12 }, (_, i) => {
      const angle = i * 30;
      const hourIndex = i === 0 ? 12 : i;

      const outer = polarToCartesian(50, 50, 42, angle);
      const inner = polarToCartesian(50, 50, i % 3 === 0 ? 34 : 37, angle);

      const active = hourIndex <= highlightedHourTicks && highlightedHourTicks > 0;

      return (
        <line
          key={i}
          x1={inner.x}
          y1={inner.y}
          x2={outer.x}
          y2={outer.y}
          stroke={
            active
              ? 'rgba(250,204,21,0.95)'
              : i % 3 === 0
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(255,255,255,0.22)'
          }
          strokeWidth={active ? 3 : i % 3 === 0 ? 2 : 1.2}
          strokeLinecap="round"
        />
      );
    });
  }, [fullHours]);

  return (
    <div className="flex min-w-[148px] flex-col items-center gap-2 rounded-lg border border-rkmborder bg-rkmbg/60 p-3">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-32 w-32">
          <defs>
            <radialGradient id="rkmClockFace" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.22)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.95)" />
            </radialGradient>
          </defs>

          <circle
            cx="50"
            cy="50"
            r="46"
            fill="url(#rkmClockFace)"
            stroke="rgba(96,165,250,0.35)"
            strokeWidth="2"
          />

          {innerBand && (
            <path
              d={innerBand}
              fill="rgba(96,165,250,0.28)"
              stroke="rgba(96,165,250,0.8)"
              strokeWidth="0.6"
            />
          )}

          {ticks}

          <ClockHand angle={totalAngle} length={25} width={4} color="rgba(250,204,21,0.95)" />

          <ClockHand angle={minuteAngle} length={35} width={2.5} color="rgba(96,165,250,0.95)" />

          <circle cx="50" cy="50" r="4.5" fill="rgba(255,255,255,0.95)" />
        </svg>

        {fullHours >= 12 && (
          <div className="absolute -right-2 -top-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
            {fullHours}h
          </div>
        )}
      </div>

      <div className="text-center">
        <div className="text-[11px] uppercase tracking-wider text-slate-500">Relógio</div>
        <div className="text-sm font-semibold text-blue-300">{formatDuration(total)}</div>
      </div>
    </div>
  );
}

export function DurationPicker({ label, minutes, onChange, mode = 'locked' }: Props) {
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (mode === 'locked') setManual(false);
  }, [mode]);

  const value = minutes === null ? null : Math.max(0, Math.round(minutes));
  const hours = Math.floor((value ?? 0) / 60);
  const mins = (value ?? 0) % 60;

  const update = (n: number | null) =>
    onChange(n === null ? null : Math.max(0, Math.min(599999, Math.round(n))));

  return (
    <div className="rounded-lg border border-rkmborder bg-rkmcard2/40 p-3">
      <div className={`flex items-center justify-between gap-2 ${mode === 'edit' ? 'mb-3' : ''}`}>
        <span className="text-xs text-slate-400">{label}</span>
        <strong className="text-sm tabular-nums text-blue-300">{formatDuration(value)}</strong>
      </div>

      {mode === 'edit' && (
        <>
          <div className="grid gap-3 lg:grid-cols-[1fr_148px]">
            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Duração rápida
              </div>

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

              {/* RKM_DURATION_FINE_TUNE_V1 */}
              <div className="mt-3 border-t border-rkmborder pt-3">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Ajuste fino
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-rkmborder bg-rkmbg px-2 py-2 text-xs text-slate-300 transition hover:border-blue-400/60"
                    onClick={() => update((value ?? 0) - 15)}
                  >
                    −15min
                  </button>

                  <button
                    type="button"
                    className="rounded-md border border-rkmborder bg-rkmbg px-2 py-2 text-xs text-slate-300 transition hover:border-blue-400/60"
                    onClick={() => update((value ?? 0) + 15)}
                  >
                    +15min
                  </button>

                  <button
                    type="button"
                    className="rounded-md border border-rkmborder bg-rkmbg px-2 py-2 text-xs text-blue-300 transition hover:border-blue-400/60"
                    onClick={() => setManual(!manual)}
                  >
                    Personalizar
                  </button>

                  <button
                    type="button"
                    disabled={value === null}
                    className="rounded-md border border-rkmborder bg-rkmbg px-2 py-2 text-xs text-slate-300 transition hover:border-blue-400/60 disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={() => update(null)}
                  >
                    Limpar
                  </button>
                </div>
              </div>
            </div>

            <DurationClock minutes={value} />
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
                  onChange={(e) =>
                    update(
                      Math.min(9999, Math.max(0, Math.trunc(Number(e.target.value) || 0))) * 60 +
                        mins,
                    )
                  }
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
                  onChange={(e) =>
                    update(
                      hours * 60 +
                        Math.min(59, Math.max(0, Math.trunc(Number(e.target.value) || 0))),
                    )
                  }
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}

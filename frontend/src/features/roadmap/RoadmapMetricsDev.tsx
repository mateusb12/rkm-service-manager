/**
 * Métricas de produtividade EXCLUSIVAS do ambiente local de desenvolvimento.
 * O módulo é carregado dinamicamente apenas por RoadmapView em localhost + DEV.
 * Nenhum dado é enviado ao backend ou ao cliente.
 */
import { DurationPicker } from '../../utils/DurationPicker';
import { useEffect, useState } from 'react';

type Hours = { estimated: string; actual: string };
const KEY = 'rkm-dev:roadmap-hours:v1';

function readAll(): Record<string, Hours> {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export default function RoadmapMetricsDev({ featureId }: { featureId: string }) {
  const [hours, setHours] = useState<Hours>(() => readAll()[featureId] || { estimated: '', actual: '' });

  useEffect(() => {
    setHours(readAll()[featureId] || { estimated: '', actual: '' });
  }, [featureId]);

  function update(field: keyof Hours, value: string) {
    const next = { ...hours, [field]: value };
    setHours(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [featureId]: next }));
    } catch {
      // Armazenamento bloqueado: o formulário continua utilizável nesta sessão.
    }
  }

  const hasEstimate = hours.estimated.trim() !== '';
  const hasActual = hours.actual.trim() !== '';
  const difference = hasEstimate && hasActual ? Number(hours.actual) - Number(hours.estimated) : null;

  return (
    <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/[.07] p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-amber-200">Medir esforço</h4>
        <span className="tag tag-amber">SÓ LOCALHOST</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <DurationPicker mode="edit"
              label="Estimativa inicial"
              minutes={
                hours.estimated === ''
                  ? null
                  : Math.round(Number(hours.estimated) * 60)
              }
              onChange={value =>
                update('estimated', value === null ? '' : String(value / 60))
              }
            />
        <DurationPicker mode="edit"
              label="Tempo registrado"
              minutes={
                hours.actual === ''
                  ? null
                  : Math.round(Number(hours.actual) * 60)
              }
              onChange={value =>
                update('actual', value === null ? '' : String(value / 60))
              }
            />
        <div className="rounded-lg border border-rkmborder bg-rkmbg p-3">
          <div className="text-xs text-slate-400">Desvio</div>
          <div className={`mt-2 text-lg font-semibold ${difference === null ? 'text-slate-500' : difference > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
            {difference === null ? '—' : `${difference > 0 ? '+' : ''}${difference.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} h`}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">
        Salvo apenas no localStorage deste navegador. Preencha a estimativa ANTES de iniciar;
        preserve o valor original para comparar com o WakaTime depois.
        A integração automática com o WakaTime ainda não foi implementada.
      </p>
    </div>
  );
}

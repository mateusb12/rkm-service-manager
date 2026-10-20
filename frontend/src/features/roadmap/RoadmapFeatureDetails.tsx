import React from 'react';

import type { FeatureMetricDraft } from './dev-feature-metrics-service';
import type { RoadmapFeature } from './roadmap-model';

const RoadmapMetricsDev = React.lazy(() => import('./RoadmapMetricsDev'));
const RoadmapWorklogDev = React.lazy(() => import('./RoadmapWorklogDev'));

const FEATURE_IMAGES: Record<string, string> = {
  'pcp/clientes': '/assets/cadastro-e-busca-de-clientes.png',
};

const V1_FEATURE_EXAMPLES: Record<string, string> = {
  'oficina/checklists':
    'O usuário abre a OS nº 123, acessa a peritagem e seleciona "Cilindro hidráulico". O sistema apresenta os campos específicos desse equipamento, como camisa, haste e êmbolo.',
  'oficina/componentes':
    'Na OS nº 123, o usuário seleciona o componente "Haste", define a condição como "Desgastada", adiciona a observação "Riscos na superfície cromada" e salva.',
  'oficina/medicoes':
    'Na ficha do componente "Haste", o usuário adiciona duas medições: "Diâmetro: 45,20 mm" e "Comprimento: 820 mm". Após salvar, consegue consultar esses valores vinculados ao componente.',
  'oficina/diagnostico-estruturado':
    'Na aba "Diagnóstico", o usuário visualiza as condições e medições registradas, indica "Recuperar haste" e "Substituir vedação", acrescenta uma conclusão e salva o diagnóstico na OS.',
};

type RoadmapFeatureDetailsProps = {
  item: RoadmapFeature;
  localDevelopmentEnabled: boolean;
  completed: boolean;
  taskStatusLoaded: boolean;
  taskStatusPending: boolean;
  taskStatusError: string;
  onToggleTaskDone: (item: RoadmapFeature) => void;
  onLiveMetricChange: (id: string, metric: FeatureMetricDraft | null) => void;
};

export function RoadmapFeatureDetails({
  item,
  localDevelopmentEnabled,
  completed,
  taskStatusLoaded,
  taskStatusPending,
  taskStatusError,
  onToggleTaskDone,
  onLiveMetricChange,
}: RoadmapFeatureDetailsProps) {
  return (
    <div className="space-y-3 border-t border-rkmborder p-3">
      {localDevelopmentEnabled && (
        <code className="block text-xs text-blue-300">{item.branch}</code>
      )}

      <div className="space-y-4">
        {FEATURE_IMAGES[item.id] && (
          <div className="flex justify-start pl-2">
            <div className="flex h-[104px] w-[104px] items-center justify-center rounded-xl border border-sky-400/30 bg-sky-400/[0.05] p-3 shadow-[0_0_24px_rgba(56,189,248,0.08)]">
              <img
                src={FEATURE_IMAGES[item.id]}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="text-sm text-slate-300">
          <strong className="mb-1 block">Pronto quando:</strong>
          {item.acceptance.includes('\n') ? (
            <ul className="ml-5 list-disc space-y-1">
              {item.acceptance.split('\n').map((criterion, index) => {
                const criterionCompleted = item.completedAcceptanceCriteria.includes(index);

                return (
                  <li
                    key={index}
                    className={criterionCompleted ? 'list-none text-emerald-300' : undefined}
                  >
                    {criterionCompleted && (
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

        {V1_FEATURE_EXAMPLES[item.id] && (
          <div className="rounded-md border-l-2 border-sky-400/40 bg-sky-400/[0.04] px-3 py-2 text-sm text-slate-300">
            <strong className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-300">
              Exemplo
            </strong>
            <p>{V1_FEATURE_EXAMPLES[item.id]}</p>
          </div>
        )}
      </div>

      {localDevelopmentEnabled && (
        <React.Suspense fallback={null}>
          <RoadmapWorklogDev featureId={item.id} />
        </React.Suspense>
      )}

      {localDevelopmentEnabled && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rkmborder bg-rkmcard2/30 p-3">
          <span className="text-xs font-medium text-slate-400">STATUS DE DESENVOLVIMENTO</span>

          <button
            type="button"
            onClick={() => onToggleTaskDone(item)}
            disabled={!taskStatusLoaded || taskStatusPending}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 ${
              completed
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
                : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
            }`}
          >
            {!taskStatusLoaded
              ? 'Carregando...'
              : taskStatusPending
                ? 'Salvando...'
                : completed
                  ? '↶ Reabrir feature'
                  : '✓ Marcar como concluída'}
          </button>
        </div>
      )}

      {localDevelopmentEnabled && taskStatusError && (
        <p className="text-xs text-rose-300">{taskStatusError}</p>
      )}

      {localDevelopmentEnabled && taskStatusLoaded && (
        <React.Suspense fallback={null}>
          <RoadmapMetricsDev
            featureId={item.id}
            defaultBranch={item.branch}
            completed={completed}
            onLiveMetricChange={onLiveMetricChange}
          />
        </React.Suspense>
      )}
    </div>
  );
}

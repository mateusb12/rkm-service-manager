import type { FeatureMetricDraft } from './dev-feature-metrics-service';
import { RoadmapFeatureDetails } from './RoadmapFeatureDetails';
import type { RoadmapFeature } from './roadmap-model';

type RoadmapFeatureCardProps = {
  item: RoadmapFeature;
  expanded: boolean;
  localDevelopmentEnabled: boolean;
  completed: boolean;
  taskStatusLoaded: boolean;
  taskStatusPending: boolean;
  taskStatusError: string;
  onToggle: () => void;
  onToggleTaskDone: (item: RoadmapFeature) => void;
  onLiveMetricChange: (id: string, metric: FeatureMetricDraft | null) => void;
};

export function RoadmapFeatureCard({
  item,
  expanded,
  localDevelopmentEnabled,
  completed,
  taskStatusLoaded,
  taskStatusPending,
  taskStatusError,
  onToggle,
  onToggleTaskDone,
  onLiveMetricChange,
}: RoadmapFeatureCardProps) {
  const displayedState = localDevelopmentEnabled && completed ? 'Concluída' : item.state;

  return (
    <article
      className={`rounded-lg border transition ${
        displayedState === 'Concluída'
          ? 'border-emerald-400/35 bg-emerald-400/[0.06] shadow-[0_0_18px_rgba(52,211,153,.06)]'
          : displayedState === 'Em andamento'
            ? 'border-orange-400/30 bg-orange-400/[0.05]'
            : 'border-rkmborder bg-rkmbg/50'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 p-3 text-left"
      >
        <span className="text-sm text-slate-200">
          {expanded ? '▾' : '▸'} {item.title}
        </span>
        <span
          className={`tag ${
            displayedState === 'Concluída'
              ? 'tag-emerald'
              : displayedState === 'Em andamento'
                ? 'tag-orange'
                : 'tag-slate'
          }`}
        >
          {displayedState}
        </span>
      </button>

      {expanded && (
        <RoadmapFeatureDetails
          item={item}
          localDevelopmentEnabled={localDevelopmentEnabled}
          completed={completed}
          taskStatusLoaded={taskStatusLoaded}
          taskStatusPending={taskStatusPending}
          taskStatusError={taskStatusError}
          onToggleTaskDone={onToggleTaskDone}
          onLiveMetricChange={onLiveMetricChange}
        />
      )}
    </article>
  );
}

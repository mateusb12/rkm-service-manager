export const ServiceEntryStageNavigator = ({
  stages,
  step,
  progressStep,
  hasEntry,
  onChangeStep,
}) => (
  <div
    className="service-entry-stepper service-entry-amazon-stepper"
    aria-label="Etapas do ciclo operacional"
  >
    {stages.map((stage, index) => {
      const isLocked = index > progressStep || (Boolean(hasEntry) && !stage.canView);
      const isCurrentLocked = Boolean(hasEntry) && progressStep === index && !stage.canView;
      return (
        <button
          type="button"
          key={stage.id}
          className={`service-entry-step ${step === index && progressStep <= index ? 'is-active' : ''} ${progressStep === index ? 'is-current' : ''} ${step === index && progressStep === index ? 'is-selected-current' : ''} ${progressStep > index ? 'is-done' : ''} ${step === index && progressStep > index ? 'is-selected-done' : ''} ${isLocked ? 'is-locked' : ''} ${isCurrentLocked ? 'is-current-locked' : ''}`}
          onClick={() => onChangeStep(index)}
          disabled={isLocked}
          aria-current={step === index ? 'step' : undefined}
          aria-label={stage.label}
          title={
            isCurrentLocked
              ? 'Etapa bloqueada para o PCP'
              : isLocked
                ? 'Etapa ainda não alcançada'
                : undefined
          }
        >
          <span>{progressStep > index ? '✓' : index + 1}</span>
          <strong>{stage.label}</strong>
        </button>
      );
    })}
  </div>
);

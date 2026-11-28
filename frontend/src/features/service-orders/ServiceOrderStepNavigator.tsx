export const ServiceOrderStepNavigator = ({ stages, step, progressStep, hasEntry, onChangeStep }) => (
  <div className="service-entry-stepper service-entry-amazon-stepper" aria-label="Etapas do ciclo operacional">
    {stages.map((stage, index) => {
      const isRoleRestricted = Boolean(hasEntry) && stage.id !== 'entrega' && stage.canView === false;
      const isLocked = index > progressStep || isRoleRestricted;
      const isCurrentLocked = Boolean(hasEntry) && progressStep === index && !stage.canView;
      return (
        <button
          type="button"
          key={stage.id}
          className={`service-entry-step ${step === index && progressStep <= index ? 'is-active' : ''} ${progressStep === index ? 'is-current' : ''} ${step === index && progressStep === index ? 'is-selected-current' : ''} ${progressStep > index ? 'is-done' : ''} ${step === index && progressStep > index ? 'is-selected-done' : ''} ${isLocked ? 'is-locked' : ''} ${isRoleRestricted ? 'is-role-restricted' : ''} ${isCurrentLocked ? 'is-current-locked' : ''}`}
          onClick={() => onChangeStep(index)}
          disabled={isLocked}
          aria-current={step === index ? 'step' : undefined}
          aria-label={stage.label}
          title={isCurrentLocked ? 'Etapa bloqueada para este cargo' : isLocked ? 'Etapa ainda não alcançada' : undefined}
        >
          <span>
            {isRoleRestricted ? (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            ) : progressStep > index ? (
              '✓'
            ) : (
              index + 1
            )}
          </span>
          <strong>{stage.label}</strong>
        </button>
      );
    })}
  </div>
);

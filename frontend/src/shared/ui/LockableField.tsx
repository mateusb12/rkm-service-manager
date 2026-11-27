import { Lock } from 'lucide-react';

/** Applies the same disabled behavior and visual treatment to any field control. */
export const LockableField = ({ locked, children, className = '' }) => (
  <fieldset
    disabled={locked}
    aria-disabled={locked || undefined}
    className={`lockable-field relative m-0 min-w-0 border-0 p-0 ${locked ? 'is-locked' : ''} ${className}`.trim()}
  >
    {children}
    {locked && <Lock className="lockable-field-icon" size={14} aria-hidden="true" />}
  </fieldset>
);

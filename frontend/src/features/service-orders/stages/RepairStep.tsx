import { Clock3, Lock } from 'lucide-react';

import { Field } from '../../../shared/ui/form-controls';
import { LockableField } from '../../../shared/ui/LockableField';
import { SearchableSelector } from '../../../shared/ui/SearchableSelector';
import { formatCompactDateTimeBR, formatOperationalDateTimeBR } from '../../../shared/utils/date';
import { listActiveUsers } from '../../auth/security/service';
import { getServiceOrderBudgetLines } from '../model';
import { ServiceEntrySection } from './common';

const formatQuantity = (value) => {
  const quantity = String(value ?? '').trim();
  if (!quantity) return '—';

  const numericQuantity = Number(quantity.replace(',', '.'));
  return Number.isFinite(numericQuantity) ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6 }).format(numericQuantity) : quantity;
};

const isTimeUnit = (unit) =>
  ['h', 'hr', 'hora', 'horas'].includes(
    String(unit || '')
      .trim()
      .toLocaleLowerCase('pt-BR'),
  );

export const ServiceOrderRepairStep = ({ form, set, stageLocked = false, saving = false, onSaveMechanic, onStartRepair, onCompleteBudgetLine }) => {
  const assigned = Boolean(form.repairMechanicAssignedAt);
  const started = Boolean(form.repairTimingVersion);
  const legacyAdvanced = form.stage === 'entrega' && !started;
  const repairLocked = stageLocked || legacyAdvanced || Boolean(form.repairCompletedAt);
  const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
  const tasks = checklist
    .filter((item) => item.status === 'Não conforme')
    .flatMap((item) =>
      getServiceOrderBudgetLines(item)
        .map((line, lineIndex) => ({ component: item.component, line, lineIndex }))
        .filter(({ line }) => line.budgetItem?.trim()),
    );
  const taskGroups = Array.from(
    tasks.reduce((groups, task) => {
      if (!groups.has(task.component)) groups.set(task.component, []);
      groups.get(task.component).push(task);
      return groups;
    }, new Map()),
    ([component, items]) => ({ component, items }),
  );
  const completedTasks = tasks.filter(({ line }) => line.repairCompletedAt).length;
  const canSaveMechanic = Boolean(form.id && form.repairMechanic?.trim()) && !assigned && !saving;

  return (
    <ServiceEntrySection title="Reparo" description="Acompanhe e marque os serviços definidos no orçamento.">
      <Field label="Mecânico responsável pelo reparo *" className="md:col-span-2">
        {assigned || legacyAdvanced ? (
          <LockableField locked>
            <div className="rkm-input zenit-field" aria-label={`Mecânico do reparo: ${form.repairMechanic || 'não registrado'}. Campo bloqueado.`}>
              {form.repairMechanic || 'Não registrado'}
            </div>
          </LockableField>
        ) : (
          <SearchableSelector
            value={form.repairMechanic || ''}
            loadOptions={listActiveUsers}
            getOptionKey={(user) => user.id}
            getOptionLabel={(user) => user.name}
            getOptionDescription={(user) => `${user.roleLabel} · ${user.email}`}
            placeholder="Nome, e-mail ou perfil"
            listLabel="Mecânicos ativos"
            filterOption={(user, search) =>
              (!search || `${user.name} ${user.email} ${user.roleLabel}`.toLocaleLowerCase('pt-BR').includes(search)) && user.role === 'mechanic'
            }
            onSelect={(user) => set('repairMechanic', user.name)}
            onClear={() => set('repairMechanic', '')}
          />
        )}
      </Field>
      {!assigned && !legacyAdvanced && (
        <div className="flex items-end">
          <button type="button" className="btn btn-primary" disabled={!canSaveMechanic} onClick={onSaveMechanic}>
            {saving ? 'Salvando...' : 'Salvar mecânico'}
          </button>
        </div>
      )}

      {assigned && !started && !legacyAdvanced && (
        <div className="md:col-span-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={saving || tasks.length === 0} onClick={onStartRepair}>
            {saving ? 'Registrando início...' : 'Iniciar reparo'}
          </button>
          <span className="text-xs text-slate-500">O horário de início será registrado pelo servidor.</span>
        </div>
      )}
      {started && (
        <div className="md:col-span-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <Lock size={14} className="text-slate-400" aria-hidden="true" />
          Reparo iniciado em {formatOperationalDateTimeBR(form.repairStartedAt)} por {form.repairMechanic}.
        </div>
      )}

      <div className="md:col-span-3 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Itens do reparo</span>
            {started ? (
              <p className="mt-1 text-xs text-slate-500">Marque cada item quando o serviço ou material tiver sido aplicado.</p>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Lock size={12} aria-hidden="true" />
                Checklist bloqueada até iniciar o reparo.
              </p>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {completedTasks}/{tasks.length} concluídos
          </span>
        </div>
        {taskGroups.length > 0 ? (
          <div className={`service-entry-repair-groups${started ? '' : ' is-locked'}`}>
            {taskGroups.map(({ component, items }) => (
              <section key={component} className="service-entry-repair-group">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-200">{component}</h3>
                  <span className="text-xs text-slate-400">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="service-entry-repair-list">
                  {items.map(({ component: taskComponent, line, lineIndex }) => {
                    const timeUnit = isTimeUnit(line.budgetUnit);
                    const quantity = formatQuantity(line.budgetQuantity);

                    return (
                      <label
                        key={`${taskComponent}-${lineIndex}`}
                        className={`service-entry-repair-task${line.repairCompletedAt ? ' is-complete' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(line.repairCompletedAt)}
                          disabled={!started || repairLocked || saving || Boolean(line.repairCompletedAt)}
                          onChange={() => onCompleteBudgetLine(taskComponent, lineIndex)}
                        />
                        <span className="service-entry-repair-task-name">
                          <strong>{line.budgetItem}</strong>
                          {line.repairCompletedAt && (
                            <span className="service-entry-repair-completion">
                              <small className="service-entry-repair-completion-date">
                                Concluído — {formatCompactDateTimeBR(line.repairCompletedAt)}
                              </small>
                              {line.repairCompletedBy?.name && <small>{line.repairCompletedBy.name}</small>}
                            </span>
                          )}
                        </span>
                        <span className="service-entry-repair-quantity">
                          {timeUnit && <Clock3 size={14} aria-hidden="true" />}
                          {quantity} {line.budgetUnit}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-rkmborder px-3 py-4 text-sm text-slate-500">
            Nenhum item de reparo foi definido no orçamento.
          </p>
        )}
      </div>
    </ServiceEntrySection>
  );
};

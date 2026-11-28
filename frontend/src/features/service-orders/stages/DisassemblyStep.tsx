import { Lock } from 'lucide-react';

import { BulletTextArea, Field, TextInput } from '../../../shared/ui/form-controls';
import { LockableField } from '../../../shared/ui/LockableField';
import { SearchableSelector } from '../../../shared/ui/SearchableSelector';
import { listActiveUsers } from '../../auth/security/service';
import { formatOperationalDateTimeBR } from '../../../shared/utils/date';
import { createEmptyDisassemblyChecklist, isCylinderOrderType } from '../model';
import { ServiceEntryChecklistFileField, ServiceEntrySection } from './common';

const elapsedTime = (start, end) => {
  if (!start || !end) return '—';
  const elapsedMinutes = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) return '—';
  const days = Math.floor(elapsedMinutes / 1440);
  const hours = Math.floor((elapsedMinutes % 1440) / 60);
  const minutes = elapsedMinutes % 60;
  if (days) return `${days}d ${hours}h ${minutes}min`;
  if (hours) return `${hours}h ${minutes}min`;
  return `${minutes} min`;
};
const dimensionFields = ['cylinderInternalDiameter', 'cylinderExternalDiameter', 'cylinderLength', 'cylinderStroke', 'cylinderRodDiameter'];

export const ServiceOrderDisassemblyStep = ({ form, set, addChecklistPhotos, removeChecklistPhoto, onStart, onAssess, saving, photoBusy }) => {
  const started = Boolean(form.disassemblyTimingVersion);
  const legacyAdvanced = !started && ['orcamento', 'reparo', 'entrega'].includes(form.stage);
  const checklist = Array.isArray(form.disassemblyChecklist)
    ? form.disassemblyChecklist
    : createEmptyDisassemblyChecklist(form.cylinderOptionalItems);
  const confirmations = checklist
    .filter((item) => item.confirmedAt)
    .map((item) => item.confirmedAt)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const lastConfirmationAt = confirmations[confirmations.length - 1];
  const disassemblyFinishedAt = form.disassemblyComplete && form.disassemblyEndedAt ? form.disassemblyEndedAt : lastConfirmationAt;

  const updateItem = (index, key, value) => {
    if (!started || saving || photoBusy || (checklist[index]?.confirmedAt && key !== 'notes')) return;
    const next = checklist.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [key]: value,
            ...(key === 'status' && value === 'Conforme' ? { notes: '' } : {}),
          }
        : item,
    );
    set('disassemblyChecklist', next);
  };
  const canStart =
    !saving &&
    !started &&
    !legacyAdvanced &&
    Boolean(form.id) &&
    Boolean(form.disassemblyOperator) &&
    checklist.length > 0 &&
    checklist.map((item) => item.component).join('|') === (form.cylinderOptionalItems || []).join('|') &&
    dimensionFields.every((field) => Number.isFinite(Number(form[field])) && Number(form[field]) > 0);

  return (
    <ServiceEntrySection title="Desmontagem" description="Preserve a identidade da OS e registre como os componentes foram encontrados.">
      <Field label="Responsável pela desmontagem *">
        {started || legacyAdvanced ? (
          <LockableField locked>
            <div
              className="rkm-input zenit-field"
              aria-label={`Responsável pela desmontagem: ${form.disassemblyOperator}. Campo bloqueado após o início.`}
              title="Bloqueado após o início da desmontagem"
            >
              {form.disassemblyOperator}
            </div>
          </LockableField>
        ) : (
          <SearchableSelector
            value={form.disassemblyOperator}
            loadOptions={listActiveUsers}
            getOptionKey={(user) => user.id}
            getOptionLabel={(user) => user.name}
            getOptionDescription={(user) => `${user.roleLabel} · ${user.email}`}
            placeholder="Nome, e-mail ou perfil"
            listLabel="Mecânicos ativos"
            filterOption={(user, search) =>
              (!search || `${user.name} ${user.email} ${user.roleLabel}`.toLocaleLowerCase('pt-BR').includes(search)) && user.role === 'mechanic'
            }
            onSelect={(user) => set('disassemblyOperator', user.name)}
            onClear={() => set('disassemblyOperator', '')}
          />
        )}
      </Field>
      {isCylinderOrderType(form.orderType) && (
        <>
          <div className="md:col-span-3 mt-2 border-t border-rkmborder pt-4">
            <h3 className="text-sm font-semibold text-slate-200">Dimensões do cilindro</h3>
            <p className="mt-1 text-xs text-slate-500">Preencha as medidas em milímetros antes de começar a desmontagem.</p>
          </div>
          <div className="md:col-span-3 grid gap-4 md:grid-cols-5">
            <Field label="Diâmetro interno (mm)" required>
              <LockableField locked={started || legacyAdvanced}>
                <TextInput
                  type="number"
                  value={form.cylinderInternalDiameter}
                  disabled={saving}
                  onChange={(value) => set('cylinderInternalDiameter', value)}
                  placeholder="Ex.: 80"
                />
              </LockableField>
            </Field>
            <Field label="Diâmetro externo (mm)" required>
              <LockableField locked={started || legacyAdvanced}>
                <TextInput
                  type="number"
                  value={form.cylinderExternalDiameter}
                  disabled={saving}
                  onChange={(value) => set('cylinderExternalDiameter', value)}
                  placeholder="Ex.: 95"
                />
              </LockableField>
            </Field>
            <Field label="Comprimento (mm)" required>
              <LockableField locked={started || legacyAdvanced}>
                <TextInput
                  type="number"
                  value={form.cylinderLength}
                  disabled={saving}
                  onChange={(value) => set('cylinderLength', value)}
                  placeholder="Ex.: 500"
                />
              </LockableField>
            </Field>
            <Field label="Curso (mm)" required>
              <LockableField locked={started || legacyAdvanced}>
                <TextInput
                  type="number"
                  value={form.cylinderStroke}
                  disabled={saving}
                  onChange={(value) => set('cylinderStroke', value)}
                  placeholder="Ex.: 300"
                />
              </LockableField>
            </Field>
            <Field label="Diâmetro da haste (mm)" required>
              <LockableField locked={started || legacyAdvanced}>
                <TextInput
                  type="number"
                  value={form.cylinderRodDiameter}
                  disabled={saving}
                  onChange={(value) => set('cylinderRodDiameter', value)}
                  placeholder="Ex.: 50"
                />
              </LockableField>
            </Field>
          </div>
          <div className="md:col-span-3 flex flex-wrap items-center gap-3">
            {!started && !legacyAdvanced && (
              <button type="button" className="btn btn-primary" disabled={!canStart} onClick={onStart}>
                {saving ? 'Salvando...' : 'Começar desmontagem'}
              </button>
            )}
            {started && <span className="text-sm text-slate-300">Início: {formatOperationalDateTimeBR(form.disassemblyStartedAt)}</span>}
            {legacyAdvanced && (
              <div className="flex items-center gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-100" role="status">
                <Lock size={18} className="shrink-0 text-amber-300" aria-hidden="true" />
                <p className="min-w-0 text-sm text-amber-100/80">
                  <strong className="font-semibold text-amber-100">Início da desmontagem:</strong>{' '}
                  {formatOperationalDateTimeBR(form.disassemblyStartedAt)}
                </p>
              </div>
            )}
            {form.disassemblyComplete && (
              <span className="text-sm text-emerald-300">Concluída: {formatOperationalDateTimeBR(form.disassemblyEndedAt)}</span>
            )}
            {!started && !legacyAdvanced && <span className="text-xs text-slate-500">O checklist será liberado após salvar o início.</span>}
          </div>
          <div className="md:col-span-3 space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Checklist de saúde do cilindro *</span>
                <p className="mt-1 text-xs text-slate-500">
                  Avalie todos os itens. A foto é opcional; a justificativa é obrigatória quando estiver não conforme.
                </p>
              </div>
              <span className="service-entry-checklist-progress">
                {checklist.filter((item) => item.confirmedAt).length}/{checklist.length} registrados
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {checklist.map((item, index) => {
                return (
                  <div
                    key={item.component}
                    className={`service-entry-checklist-card flex flex-col rounded-lg border border-rkmborder bg-rkmcard2/40 ${item.confirmedAt ? 'min-h-0 p-3' : 'p-4'}`}
                  >
                    <div className="flex min-h-6 items-start justify-between gap-2">
                      <span className="flex items-center gap-2 font-medium text-slate-200">
                        {item.component}
                        {(!started || legacyAdvanced) && (
                          <Lock size={14} className="text-slate-400" aria-label="Avaliação bloqueada" title="Avaliação bloqueada" />
                        )}
                      </span>
                    </div>
                    {item.confirmedAt && (
                      <small className="mt-1 text-slate-500">
                        Registrado em <time className="text-white">{formatOperationalDateTimeBR(item.confirmedAt)}</time>
                      </small>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Resultado de ${item.component}`}>
                      {['Conforme', 'Não conforme'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          aria-pressed={item.status === status}
                          disabled={Boolean(item.confirmedAt) || !started || legacyAdvanced || saving || photoBusy}
                          onClick={() => onAssess(index, status)}
                          className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                            item.status === status
                              ? status === 'Conforme'
                                ? 'border-emerald-400/70 bg-emerald-400/15 text-emerald-300'
                                : 'border-rose-400/70 bg-rose-400/15 text-rose-300'
                              : 'border-rkmborder text-slate-400 hover:border-blue-400/50 hover:text-slate-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    {!item.confirmedAt && legacyAdvanced && (
                      <small className="mt-2 text-slate-500">Avaliação histórica, sem registro de horário</small>
                    )}
                    {!item.confirmedAt && started && item.status && !item.firstAssessedAt && (
                      <small className="mt-2 text-amber-300">Avaliação antiga: selecione o resultado para registrar.</small>
                    )}
                  </div>
                );
              })}
            </div>
            {(started || legacyAdvanced) && checklist.some((item) => item.status === 'Não conforme') && (
              <div className="service-entry-checklist-details space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Detalhamento das não conformidades</h3>
                  <p className="mt-1 text-xs text-slate-500">Informe o motivo e, se necessário, adicione uma foto para cada item não conforme.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {checklist
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => item.status === 'Não conforme')
                    .map(({ item, index }) => {
                      const photoCategory = `disassemblyChecklist-${index}`;
                      return (
                        <div
                          key={item.component}
                          className="service-entry-checklist-detail-card flex h-full flex-col rounded-lg border border-rkmborder bg-rkmcard2/40 p-4"
                        >
                          <span className="service-entry-checklist-status service-entry-checklist-detail-badge is-pending">Não conforme</span>
                          <div className="service-entry-checklist-detail-body">
                            <div className="service-entry-checklist-upload">
                              <div className="service-entry-checklist-detail-heading">
                                <span className="service-entry-checklist-detail-title">{item.component}</span>
                                {form.photos[photoCategory]?.[0]?.name && (
                                  <small className="service-entry-checklist-detail-file" title={form.photos[photoCategory][0].name}>
                                    {form.photos[photoCategory][0].name}
                                  </small>
                                )}
                              </div>
                              <ServiceEntryChecklistFileField
                                label="Evidência fotográfica"
                                files={form.photos[photoCategory] || []}
                                category={`desmontagem (${item.component.toLowerCase()})`}
                                readOnly={Boolean(legacyAdvanced || saving || photoBusy)}
                                onFiles={(files) => addChecklistPhotos(photoCategory, item.component, files)}
                                onRemove={(file) => removeChecklistPhoto(photoCategory, file)}
                                onSelectExisting={(file) => set('photos', { ...form.photos, [photoCategory]: [file] })}
                              />
                            </div>
                            <div className="service-entry-checklist-notes">
                              <label className="service-entry-checklist-notes-label" htmlFor={`disassembly-note-${index}`}>
                                Justificativa <span aria-hidden="true">*</span>
                              </label>
                              {item.component === 'Vedação' ? (
                                <LockableField locked={Boolean(legacyAdvanced)}>
                                  <BulletTextArea
                                    rows={5}
                                    className="service-entry-checklist-notes-input w-full resize-y"
                                    value={item.notes}
                                    readOnly={Boolean(legacyAdvanced)}
                                    disabled={saving || photoBusy}
                                    onChange={(value) => updateItem(index, 'notes', value)}
                                    placeholder="Descreva cada não conformidade em uma linha..."
                                  />
                                </LockableField>
                              ) : (
                                <LockableField locked={Boolean(legacyAdvanced)}>
                                  <textarea
                                    id={`disassembly-note-${index}`}
                                    rows={5}
                                    className="rkm-input zenit-field service-entry-checklist-notes-input w-full resize-y"
                                    value={item.notes}
                                    readOnly={Boolean(legacyAdvanced)}
                                    disabled={saving || photoBusy}
                                    onChange={(event) => updateItem(index, 'notes', event.target.value)}
                                    placeholder="Explique o motivo da não conformidade..."
                                    aria-label={`Motivo da não conformidade em ${item.component}`}
                                  />
                                </LockableField>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            {(form.disassemblyStartedAt || disassemblyFinishedAt) && (
              <section className="rounded-lg border border-rkmborder bg-rkmcard2/30 p-3" aria-labelledby="disassembly-summary-title">
                <h3 id="disassembly-summary-title" className="text-sm font-semibold text-slate-200">
                  Resumo da desmontagem
                </h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md bg-slate-950/25 px-3 py-2">
                    <span className="block text-xs text-slate-400">Início</span>
                    <time className="mt-0.5 block text-sm text-slate-200">{formatOperationalDateTimeBR(form.disassemblyStartedAt)}</time>
                  </div>
                  <div className="rounded-md bg-slate-950/25 px-3 py-2">
                    <span className="block text-xs text-slate-400">Fim</span>
                    <time className="mt-0.5 block text-sm text-slate-200">{formatOperationalDateTimeBR(disassemblyFinishedAt)}</time>
                  </div>
                  <div className="rounded-md bg-slate-950/25 px-3 py-2">
                    <span className="block text-xs text-slate-400">Duração total</span>
                    <span className="mt-0.5 block text-sm text-slate-200">{elapsedTime(form.disassemblyStartedAt, disassemblyFinishedAt)}</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {checklist.map((item, index) => (
                    <div key={item.component} className="rounded-md border border-rkmborder/70 px-3 py-2">
                      <span className="block truncate text-xs text-slate-400" title={item.component}>
                        {item.component}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-200">
                        {elapsedTime(index === 0 ? form.disassemblyStartedAt : checklist[index - 1].confirmedAt, item.confirmedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </ServiceEntrySection>
  );
};

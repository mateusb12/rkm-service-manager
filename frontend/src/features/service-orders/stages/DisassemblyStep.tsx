import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';

import { BulletTextArea, Field, TextArea } from '../../../shared/ui/form-controls';
import { SearchableSelector } from '../../../shared/ui/SearchableSelector';
import { listActiveUsers } from '../../auth/security/service';
import { createEmptyDisassemblyChecklist, isCylinderOrderType } from '../model';
import { parseStoredDateTime, serializeDateTime } from '../../../utils/date';
import { ReadOnlyDatePickerInput, ServiceEntryChecklistFileField, ServiceEntryPhotoField, ServiceEntrySection } from './common';

registerLocale('pt-BR', ptBR);

export const ServiceOrderDisassemblyStep = ({ form, set, addPhotos, removePhoto, addChecklistPhotos, removeChecklistPhoto }) => {
  const checklist = Array.isArray(form.disassemblyChecklist)
    ? form.disassemblyChecklist
    : createEmptyDisassemblyChecklist(form.cylinderOptionalItems);

  const updateItem = (index, key, value) => {
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

  return (
    <ServiceEntrySection title="Desmontagem" description="Preserve a identidade da OS e registre como os componentes foram encontrados.">
      <Field label="Responsável pela desmontagem *">
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
      </Field>
      <Field label="Início">
        <DatePicker
          selected={parseStoredDateTime(form.disassemblyStartedAt)}
          onChange={(value) => set('disassemblyStartedAt', serializeDateTime(value))}
          dateFormat="dd 'de' MMMM 'de' yyyy 'às' HH'h'mm"
          locale="pt-BR"
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          timeCaption="Horário"
          placeholderText="DD de mês de YYYY às HHhmm"
          customInput={<ReadOnlyDatePickerInput />}
          wrapperClassName="service-entry-date-picker"
        />
      </Field>
      <Field label="Fim">
        <DatePicker
          selected={parseStoredDateTime(form.disassemblyEndedAt)}
          onChange={(value) => set('disassemblyEndedAt', serializeDateTime(value))}
          dateFormat="dd 'de' MMMM 'de' yyyy 'às' HH'h'mm"
          locale="pt-BR"
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          timeCaption="Horário"
          placeholderText="DD de mês de YYYY às HHhmm"
          customInput={<ReadOnlyDatePickerInput />}
          wrapperClassName="service-entry-date-picker"
        />
      </Field>
      {isCylinderOrderType(form.orderType) && (
        <div className="md:col-span-3 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Checklist de saúde do cilindro *</span>
              <p className="mt-1 text-xs text-slate-500">
                Avalie todos os itens. A foto é opcional; a justificativa é obrigatória quando estiver não conforme.
              </p>
            </div>
            <span className="service-entry-checklist-progress">
              {checklist.filter((item) => item.status === 'Conforme' || item.status === 'Não conforme').length}/{checklist.length} avaliados
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {checklist.map((item, index) => {
              const hasJustification = Boolean(String(item.notes || '').trim());
              const statusLabel =
                item.status === 'Conforme'
                  ? 'Conforme'
                  : item.status === 'Não conforme'
                    ? hasJustification
                      ? 'Justificativa preenchida'
                      : 'Justificativa pendente'
                    : 'Aguardando avaliação';

              return (
                <div
                  key={item.component}
                  className="service-entry-checklist-card flex flex-col rounded-lg border border-rkmborder bg-rkmcard2/40 p-4"
                >
                  <div className="flex min-h-6 items-start justify-between gap-2">
                    <span className="font-medium text-slate-200">{item.component}</span>
                    <span
                      className={`service-entry-checklist-status ${
                        item.status === 'Conforme'
                          ? 'is-compliant'
                          : item.status === 'Não conforme'
                            ? hasJustification
                              ? 'is-justified'
                              : 'is-pending'
                            : ''
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Resultado de ${item.component}`}>
                    {['Conforme', 'Não conforme'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={item.status === status}
                        onClick={() => updateItem(index, 'status', status)}
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
                </div>
              );
            })}
          </div>
          {checklist.some((item) => item.status === 'Não conforme') && (
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
                              <BulletTextArea
                                rows={5}
                                className="service-entry-checklist-notes-input w-full resize-y"
                                value={item.notes}
                                onChange={(value) => updateItem(index, 'notes', value)}
                                placeholder="Descreva cada não conformidade em uma linha..."
                              />
                            ) : (
                              <textarea
                                id={`disassembly-note-${index}`}
                                rows={5}
                                className="rkm-input zenit-field service-entry-checklist-notes-input w-full resize-y"
                                value={item.notes}
                                onChange={(event) => updateItem(index, 'notes', event.target.value)}
                                placeholder="Explique o motivo da não conformidade..."
                                aria-label={`Motivo da não conformidade em ${item.component}`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
      <Field label="Observações da desmontagem" className="md:col-span-3">
        <TextArea
          rows={3}
          value={form.disassemblyNotes}
          onChange={(value) => set('disassemblyNotes', value)}
          placeholder="Sequência, travamentos, danos observados ao abrir..."
        />
      </Field>
      <div className="md:col-span-3">
        <ServiceEntryPhotoField
          label="Evidências da desmontagem *"
          hint="Registre a abertura e os componentes antes de limpar ou substituir peças."
          photos={form.photos.disassembly}
          onFiles={(files) => addPhotos('disassembly', files)}
          onRemove={(photo) => removePhoto('disassembly', photo)}
        />
      </div>
    </ServiceEntrySection>
  );
};

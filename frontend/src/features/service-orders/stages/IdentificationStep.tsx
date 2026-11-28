import { Field, MultiSelectCheckboxes, TextArea, TextInput } from '../../../shared/ui/form-controls';
import { LockableField } from '../../../shared/ui/LockableField';
import { Lock } from 'lucide-react';
import { SearchableSelector } from '../../../shared/ui/SearchableSelector';
import { listActiveUsers } from '../../auth/security/service';
import { CYLINDER_OPTIONAL_ITEMS, isCylinderOrderType } from '../model';
import { SERVICE_ENTRY_ORDER_TYPE_ICONS, SERVICE_ENTRY_ORDER_TYPE_ICON_CLASSES } from './constants';
import { ServiceEntrySection } from './common';

export const ServiceOrderIdentificationStep = ({ form, set }) => {
  const locked = ['desmontagem', 'orcamento', 'reparo', 'entrega'].includes(form.stage);

  return (
    <>
      <ServiceEntrySection title="Identificação inicial" description="A oficina identifica o tipo de peça antes da avaliação e desmontagem.">
        <Field label="Categoria do equipamento" required className="md:col-span-3">
          <LockableField locked={locked} showIcon={false} className="service-entry-choice-lock">
            <div className="service-entry-order-types" role="radiogroup" aria-label="Categoria do equipamento">
              {Object.entries(SERVICE_ENTRY_ORDER_TYPE_ICONS).map(([type, icon]) => {
                const selected = form.orderType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`flex min-h-[128px] min-w-[148px] flex-col items-center justify-center gap-2 rounded-lg border p-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                      selected
                        ? 'border-blue-300/70 bg-blue-400/10 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,.14)]'
                        : 'border-rkmborder bg-rkmcard2/40 text-slate-400 hover:border-blue-400/50 hover:text-slate-200'
                    }`}
                    onClick={() => set('orderType', type)}
                  >
                    <span className="service-entry-choice-image relative flex h-20 w-20 items-center justify-center p-1">
                      <img
                        src={icon}
                        alt=""
                        aria-hidden="true"
                        className={`h-full w-full object-contain ${SERVICE_ENTRY_ORDER_TYPE_ICON_CLASSES[type] || ''}`}
                      />
                      {locked && selected && <Lock className="service-entry-choice-lock-icon" size={14} aria-hidden="true" />}
                    </span>
                    <span className="text-xs font-medium">{type}</span>
                  </button>
                );
              })}
            </div>
          </LockableField>
        </Field>
        <Field label="Equipamento" required className="md:col-span-2">
          <LockableField locked={locked}>
            <TextInput
              value={form.equipment}
              onChange={(value) => set('equipment', value)}
              placeholder="Ex.: Cilindro hidráulico soldado, dupla ação — Ø80/50 x 500 mm"
            />
          </LockableField>
        </Field>
        {isCylinderOrderType(form.orderType) && (
          <>
            <Field
              label="Componentes do cilindro"
              className="md:col-span-3"
              hint="Marque os componentes existentes. Eles serão avaliados na desmontagem."
            >
              <LockableField locked={locked} showIcon={false} className="service-entry-choice-lock">
                <MultiSelectCheckboxes
                  values={form.cylinderOptionalItems}
                  onChange={(value) => set('cylinderOptionalItems', value)}
                  options={CYLINDER_OPTIONAL_ITEMS}
                  className="cylinder-optional-items"
                />
              </LockableField>
            </Field>
          </>
        )}
      </ServiceEntrySection>
      <ServiceEntrySection title="Dados da chegada" description="Registre a cadeia de recebimento antes da avaliação e desmontagem.">
        <Field label="Como chegou" required className="md:col-span-3">
          <LockableField locked={locked} showIcon={false} className="service-entry-choice-lock">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Como chegou">
              {[
                ['coleta_cliente', 'Coleta no cliente', '/assets/coleta-no-cliente.png'],
                ['cliente_entregou', 'Cliente trouxe à oficina', '/assets/cliente-trouxe-pra-oficina.png'],
              ].map(([value, label, icon]) => {
                const selected = form.arrivalMethod === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`flex min-h-[128px] min-w-[148px] flex-col items-center justify-center gap-2 rounded-lg border p-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 ${
                      selected
                        ? 'border-blue-300/70 bg-blue-400/10 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,.14)]'
                        : 'border-rkmborder bg-rkmcard2/40 text-slate-400 hover:border-blue-400/50 hover:text-slate-200'
                    }`}
                    onClick={() => set('arrivalMethod', value)}
                  >
                    <span className="service-entry-choice-image relative flex h-20 w-20 items-center justify-center p-1">
                      <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                      {locked && selected && <Lock className="service-entry-choice-lock-icon" size={14} aria-hidden="true" />}
                    </span>
                    <span className={`text-xs font-medium ${selected ? 'text-sky-300' : 'text-white'}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </LockableField>
        </Field>
        <Field label="Recebido por" required>
          <LockableField locked={locked} className="lockable-field-icon-left">
            <SearchableSelector
              value={form.receivedBy}
              loadOptions={listActiveUsers}
              getOptionKey={(user) => user.id}
              getOptionLabel={(user) => user.name}
              getOptionDescription={(user) => `${user.roleLabel} · ${user.email}`}
              placeholder="Nome, e-mail ou perfil"
              listLabel="Usuários ativos"
              onSelect={(user) => set('receivedBy', user.name)}
              onClear={() => set('receivedBy', '')}
            />
          </LockableField>
        </Field>
        <Field label="Entregue por">
          <LockableField locked={locked}>
            <TextInput value={form.deliveredBy} onChange={(value) => set('deliveredBy', value)} placeholder="Motorista / cliente" />
          </LockableField>
        </Field>
        <Field label="Acessórios / itens recebidos" className="md:col-span-2">
          <LockableField locked={locked}>
            <TextArea
              rows={2}
              value={form.receivedAccessories}
              onChange={(value) => set('receivedAccessories', value)}
              placeholder="Conexões, válvulas, peças soltas, embalagem..."
            />
          </LockableField>
        </Field>
      </ServiceEntrySection>
    </>
  );
};

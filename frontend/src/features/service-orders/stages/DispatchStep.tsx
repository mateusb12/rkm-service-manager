import { Field, TextArea, TextInput } from '../../../shared/ui/form-controls';
import { ServiceEntryPhotoField, ServiceEntrySection } from './common';

export const ServiceOrderDispatchStep = ({ form, set, addPhotos, removePhoto }) => (
  <ServiceEntrySection title="Entrega" description="Registre como a ordem foi entregue e a confirmação de saída.">
    <Field label="Forma de entrega *">
      <select className="rkm-input zenit-field" value={form.dispatchMethod} onChange={(event) => set('dispatchMethod', event.target.value)}>
        <option value="">Selecione</option>
        <option>Retirada pelo cliente</option>
        <option>Transportadora</option>
        <option>Entrega RKM</option>
      </select>
    </Field>
    <Field label="Rastreio / comprovante">
      <TextInput value={form.dispatchReference} onChange={(value) => set('dispatchReference', value)} placeholder="Código ou referência de entrega" />
    </Field>
    <Field label="Observações de entrega" className="md:col-span-3">
      <TextArea
        rows={3}
        value={form.dispatchNotes}
        onChange={(value) => set('dispatchNotes', value)}
        placeholder="Embalagem, responsável pela retirada e observações..."
      />
    </Field>
    <div className="md:col-span-3">
      <ServiceEntryPhotoField
        label="Evidência final / embalagem"
        photos={form.photos.dispatch}
        onFiles={(files) => addPhotos('dispatch', files)}
        onRemove={(photo) => removePhoto('dispatch', photo)}
      />
    </div>
  </ServiceEntrySection>
);

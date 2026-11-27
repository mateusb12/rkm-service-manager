import { Field, TextArea } from '../../../shared/ui/form-controls';
import { ServiceEntryPhotoField, ServiceEntrySection } from './common';

export const ServiceOrderRepairStep = ({ form, set, addPhotos, removePhoto }) => (
  <ServiceEntrySection title="Reparo" description="Registre o serviço executado e os resultados da validação.">
    <Field label="Serviço executado *" className="md:col-span-3">
      <TextArea
        rows={4}
        value={form.workPerformed}
        onChange={(value) => set('workPerformed', value)}
        placeholder="Reparo, componentes substituídos, ajustes e referência à IT aplicada..."
      />
    </Field>
    <Field label="Resultado dos testes *">
      <select className="rkm-input zenit-field" value={form.testResult} onChange={(event) => set('testResult', event.target.value)}>
        <option value="">Selecione</option>
        <option>Aprovado</option>
        <option>Reprovado</option>
        <option>Não aplicável</option>
      </select>
    </Field>
    <div className="md:col-span-3">
      <ServiceEntryPhotoField
        label="Fotos da execução e teste *"
        photos={form.photos.execution}
        onFiles={(files) => addPhotos('execution', files)}
        onRemove={(photo) => removePhoto('execution', photo)}
      />
    </div>
  </ServiceEntrySection>
);

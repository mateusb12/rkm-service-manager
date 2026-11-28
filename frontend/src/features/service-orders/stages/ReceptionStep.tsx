import { Field, TextInput } from '../../../shared/ui/form-controls';
import { ClientSelector } from '../../pcp/clients';
import { ServiceEntryPhotoField, ServiceEntrySection, ServiceOrderInvoiceFileField } from './common';

export const ServiceOrderReceptionStep = ({ form, set, onInvoiceFileUpload, onInvoiceFileRemove, addPhotos, removePhoto, fieldsLocked = false }) => (
  <>
    <ServiceEntrySection
      title="Recebimento PCP"
      description="Registre somente o necessário para abrir a OS. A identificação técnica fica para a oficina."
    >
      <Field label="Cliente" required className="md:col-span-2">
        <ClientSelector
          value={form.client}
          onSelect={(client) => {
            set('client', client.nomeFantasia);
            set('clientId', client.id);
          }}
          onClear={() => {
            set('client', '');
            set('clientId', null);
          }}
        />
      </Field>
      <Field label="Nº da OS" required hint={form.id ? 'Identificador fixo após a abertura da OS.' : undefined}>
        <TextInput value={form.orderNumber} onChange={(value) => set('orderNumber', value)} placeholder="Ex.: 254186" disabled={!!form.id} />
      </Field>
    </ServiceEntrySection>
    <div className="service-entry-receiving-media-grid">
      <ServiceEntrySection title="Nota fiscal / documento" description="Registre o número e anexe uma única nota fiscal ou documento de entrada.">
        <Field label="Número da NF / documento" className="md:col-span-3" hint="Opcional — use N/A para registrar ausência de documento.">
          <TextInput
            value={form.invoiceNumber}
            onChange={(value) => set('invoiceNumber', value)}
            placeholder="Número da NF, N/A ou deixe em branco"
          />
        </Field>
        <div className="md:col-span-3">
          <ServiceOrderInvoiceFileField
            file={form.invoiceFile}
            locked={fieldsLocked}
            showLibrary={Boolean(form.id)}
            onUpload={onInvoiceFileUpload}
            onDeselect={() => {
              set('invoiceFileId', null);
              set('invoiceFile', null);
            }}
            onDelete={onInvoiceFileRemove}
            onSelectExisting={(existingFile) => {
              set('invoiceFileId', existingFile.id);
              set('invoiceFile', existingFile);
            }}
          />
        </div>
      </ServiceEntrySection>
      <ServiceEntrySection title="Fotos do equipamento" description="Adicione uma ou várias fotos para registrar como o equipamento chegou.">
        <div className="md:col-span-3">
          <ServiceEntryPhotoField
            label="Fotos da peça"
            hint="Opcional no recebimento — você pode adicionar várias fotos."
            photos={form.photos.arrival}
            onFiles={(files) => addPhotos('arrival', files)}
            onRemove={(photo) => removePhoto('arrival', photo)}
            onSelectExisting={(photo) => set('photos', { ...form.photos, arrival: [...form.photos.arrival, photo] })}
            locked={fieldsLocked}
          />
        </div>
      </ServiceEntrySection>
    </div>
  </>
);

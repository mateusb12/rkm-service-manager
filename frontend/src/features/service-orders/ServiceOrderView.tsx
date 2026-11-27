// @ts-nocheck
import { forwardRef, useEffect, useRef, useState } from 'react';

import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';
import { ArrowLeft, ArrowRight, Check, FileCheck2, LockKeyhole, Pencil, Save, Trash2, X } from 'lucide-react';

import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

import {
  createEmptyServiceEntry,
  createEmptyDisassemblyChecklist,
  getServiceEntryStageIndex,
  normalizeOrderNumber,
  normalizeCylinderComponent,
  normalizeCylinderComponents,
  CYLINDER_OPTIONAL_ITEMS,
  isCylinderOrderType,
  SERVICE_ENTRY_DEFAULT_STAGES,
} from './model';

import { deleteServiceEntry, loadServiceEntries, loadServiceEntryStages, saveServiceEntry } from './service';

import { BulletTextArea, Field, MultiSelectCheckboxes, TextArea, TextInput } from '../../shared/ui/form-controls';

import { LizyReferenceCard } from '../../shared/dev/lizy-reference';
import { useLocalDevelopment } from '../../shared/dev/local-development';

import { ClientSelector } from '../pcp/clients';
import { listActiveUsers } from '../auth/security/service';
import { listPriceCatalogItems } from '../commercial/price-catalog/service';
import { SearchableSelector } from '../../shared/ui/SearchableSelector';
import { deleteServiceEntryPhoto } from './photo-storage';
import { ServiceOrderStepNavigator } from './ServiceOrderStepNavigator';
import { ServiceOrderFileUpload } from './ServiceOrderFileUpload';
import { ServiceOrderBudgetReport } from './ServiceOrderBudgetReport';
import { getMissingServiceEntryFields } from './validation';
import { formatDateLabel, parseStoredDateTime, serializeDateTime } from '../../utils/date';
import { formatLongDateBR } from '../../utils/formatLongDateTimeBR';
import { formatPriceCents, formatPriceInput, parsePriceInput } from '../../utils/currency';
import { PRICE_CATALOG_UNITS } from '../commercial/price-catalog/model';
import { createDemoServiceEntry } from './demo-fixture';
import { deleteFile, getFilePreviewUrl, listFiles, uploadFile } from '../files/service';

const SERVICE_ENTRY_ORDER_TYPE_ICONS = {
  'Cilindro hidráulico': '/assets/cilindro.png',
  'Cilindro pneumático': '/assets/cilindro.png',
  Acumulador: '/assets/acumulador.png',
  Bomba: '/assets/bomba-hidraulica.png',
  'Motor hidráulico': '/assets/motor-hidraulico.png',
  Outro: '/assets/outro.png',
};

const ServiceEntrySection = ({ title, description, children, className = '' }) => (
  <section className={`service-entry-section ${className}`}>
    <div className="service-entry-section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
    <div className="service-entry-grid">{children}</div>
  </section>
);

const ServiceEntryPhotoField = ({ label, photos = [], onFiles, onRemove, onSelectExisting, hint }) => {
  const [previews, setPreviews] = useState({});
  const previewUrls = useRef([]);

  useEffect(() => () => previewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl)), []);

  useEffect(() => {
    let active = true;
    const pendingPhotos = photos.filter((photo) => {
      if (!photo.key) return false;
      const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
      return !previews[previewKey];
    });

    if (!pendingPhotos.length) return undefined;

    void Promise.all(
      pendingPhotos.map(async (photo) => {
        const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
        try {
          const previewUrl = await getFilePreviewUrl(photo.key);
          return [previewKey, previewUrl];
        } catch {
          return null;
        }
      }),
    ).then((loadedPreviews) => {
      if (!active) return;
      setPreviews((previous) => ({
        ...previous,
        ...Object.fromEntries(loadedPreviews.filter(Boolean)),
      }));
    });

    return () => {
      active = false;
    };
  }, [photos, previews]);

  const registerLocalPreviews = (files) => {
    const nextPreviews = {};
    files.forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`;
      nextPreviews[key] = URL.createObjectURL(file);
      previewUrls.current.push(nextPreviews[key]);
    });
    setPreviews((previous) => ({ ...previous, ...nextPreviews }));
  };

  const selectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    registerLocalPreviews(files);
    await onFiles(files);
    event.target.value = '';
  };

  return (
    <div className="service-entry-photo-field">
      <label className="service-entry-photo-label">{label}</label>
      {hint && <p>{hint}</p>}
      {onSelectExisting && (
        <ServiceOrderFileUpload
          onUpload={(selectedFile) => {
            registerLocalPreviews([selectedFile]);
            return onFiles([selectedFile]);
          }}
          onDeselect={() => undefined}
          onDelete={() => undefined}
          onSelectExisting={onSelectExisting}
          label="Origem das fotos"
          hint="Selecione um arquivo já armazenado ou envie uma nova foto."
          selectedBadge="Foto selecionada"
          addLabel="Adicionar foto"
          addHint="Clique ou arraste uma imagem por vez"
          uploadingLabel="Preparando fotos..."
          uploadingHint="Aguarde enquanto as fotos são preparadas."
          accept="image/*"
          category="recebimento"
          showLibrary
        />
      )}
      {!onSelectExisting && (
        <label className="service-entry-photo-picker">
          <input type="file" accept="image/*" capture="environment" multiple onChange={selectFiles} />
          <span aria-hidden="true">＋</span>
          <strong>Adicionar foto{photos.length > 0 ? 's' : ''}</strong>
          <small>JPG, PNG ou HEIC · armazenada no sistema</small>
        </label>
      )}
      {photos.length > 0 && (
        <div className="service-entry-photo-list">
          {photos.map((photo) => {
            const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
            return (
              <div className="service-entry-photo-item" key={photo.id}>
                {previews[previewKey] ? (
                  <img src={previews[previewKey]} alt={`Foto: ${photo.name}`} />
                ) : (
                  <span className="service-entry-photo-placeholder">{photo.demo ? 'DEMO' : 'IMG'}</span>
                )}
                <span title={photo.name}>{photo.name}</span>
                <button type="button" onClick={() => onRemove(photo)}>
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ServiceEntryInvoicePreview = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file?.key) {
      setPreviewUrl('');
      return undefined;
    }

    let active = true;
    void getFilePreviewUrl(file.key)
      .then((cachedPreviewUrl) => {
        if (!active) return;
        setPreviewUrl(cachedPreviewUrl);
      })
      .catch(() => {
        if (active) setPreviewUrl('');
      });

    return () => {
      active = false;
      // A URL de preview é mantida em cache pelo serviço para reutilização entre steps.
    };
  }, [file?.key]);

  return (
    <button
      type="button"
      className="service-entry-invoice-preview"
      title={`Abrir ${file.name}`}
      onClick={() => previewUrl && window.open(previewUrl, '_blank', 'noopener,noreferrer')}
    >
      {previewUrl && file.contentType?.startsWith('image/') ? (
        <img src={previewUrl} alt={`Prévia da nota fiscal ${file.name}`} />
      ) : previewUrl && file.contentType === 'application/pdf' ? (
        <iframe title={`Prévia da nota fiscal ${file.name}`} src={previewUrl} />
      ) : (
        <span className="service-entry-invoice-document">NF</span>
      )}
    </button>
  );
};

export const LegacyServiceEntryInvoiceFileField = ({
  file,
  onUpload,
  onDeselect,
  onDelete,
  onSelectExisting,
  label = 'Arquivo da nota fiscal',
  hint = 'Opcional — imagem ou PDF armazenado no sistema de arquivos.',
  selectedBadge = 'NF selecionada',
  addLabel = 'Adicionar nota fiscal',
  addHint = 'Clique ou arraste uma imagem ou PDF',
  accept = 'image/*,application/pdf',
  showLibrary = true,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [editingSelection, setEditingSelection] = useState(false);

  useEffect(() => {
    if (!showLibrary) return undefined;
    let active = true;
    void listFiles()
      .then((files) => {
        if (!active) return;
        setExistingFiles(
          files.filter(
            (candidate) => candidate.bytes > 0 && (candidate.contentType?.startsWith('image/') || candidate.contentType === 'application/pdf'),
          ),
        );
      })
      .catch(() => {
        if (active) setExistingFiles([]);
      });

    return () => {
      active = false;
    };
  }, [showLibrary]);

  const uploadSelectedFile = async (selectedFile) => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await onUpload(selectedFile);
    } finally {
      setUploading(false);
    }
  };

  const selectFile = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';
    await uploadSelectedFile(selectedFile);
  };

  const dropFile = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    await uploadSelectedFile(event.dataTransfer.files?.[0]);
  };

  const dragOverFile = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setDragging(true);
  };

  return (
    <div className="service-entry-photo-field" onDragOverCapture={dragOverFile} onDropCapture={dropFile}>
      <label className="service-entry-photo-label">{label}</label>
      <p>{hint}</p>
      {uploading ? (
        <div className="service-entry-invoice-card is-uploading" aria-live="polite">
          <div className="service-entry-invoice-preview service-entry-invoice-uploading-preview">
            <span className="service-entry-invoice-spinner" aria-hidden="true" />
          </div>
          <div className="service-entry-invoice-details">
            <strong>Enviando nota fiscal...</strong>
            <small>Aguarde enquanto o arquivo é armazenado.</small>
          </div>
        </div>
      ) : file && !editingSelection ? (
        <div className="service-entry-invoice-card service-entry-invoice-selected-card">
          <div className="service-entry-invoice-lock-badge">{selectedBadge}</div>
          <ServiceEntryInvoicePreview file={file} />
          <div className="service-entry-invoice-details">
            <strong title={file.name}>{file.name}</strong>
            <small>Arquivo vinculado a esta OS</small>
            <div>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-edit"
                aria-label={`Trocar ${file.name}`}
                title="Trocar nota fiscal"
                onClick={() => setEditingSelection(true)}
              >
                <Pencil size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-deselect"
                aria-label={`Desselecionar ${file.name}`}
                title="Desselecionar nota fiscal"
                onClick={onDeselect}
              >
                <X size={19} strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="service-entry-invoice-action service-entry-invoice-delete"
                aria-label={`Apagar ${file.name}`}
                title="Apagar arquivo da nota fiscal"
                onClick={onDelete}
              >
                <Trash2 size={18} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {file && editingSelection && (
            <button type="button" className="service-entry-invoice-cancel-edit" onClick={() => setEditingSelection(false)}>
              Cancelar troca
            </button>
          )}
          <div className="service-entry-invoice-library">
            {existingFiles.map((existingFile) => (
              <div className="service-entry-invoice-card service-entry-invoice-existing-card" key={existingFile.id}>
                <ServiceEntryInvoicePreview file={existingFile} />
                <div className="service-entry-invoice-details">
                  <strong title={existingFile.name}>{existingFile.name}</strong>
                  <small>{existingFile.size}</small>
                  <button
                    type="button"
                    className="service-entry-invoice-select"
                    aria-label={`Selecionar ${existingFile.name}`}
                    title="Selecionar nota fiscal"
                    onClick={() => {
                      onSelectExisting(existingFile);
                      setEditingSelection(false);
                    }}
                  >
                    <FileCheck2 size={23} strokeWidth={1.9} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            <label
              className={`service-entry-invoice-card service-entry-invoice-add-card${dragging ? ' is-dragging' : ''}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={dragOverFile}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragging(false);
              }}
              onDrop={dropFile}
            >
              <input type="file" accept={accept} onChange={selectFile} disabled={uploading} />
              <span className="service-entry-invoice-add-icon" aria-hidden="true">
                ＋
              </span>
              <strong>{addLabel}</strong>
              <small>{addHint}</small>
            </label>
          </div>
        </>
      )}
    </div>
  );
};

const ServiceOrderInvoiceFileField = (props) => (
  <ServiceOrderFileUpload {...props} uploadingLabel="Enviando nota fiscal..." uploadingHint="Aguarde enquanto o arquivo é armazenado." />
);

const ServiceEntryChecklistFileField = ({ label, files = [], onFiles, onRemove, onSelectExisting }) => {
  const file = files[0];

  return (
    <ServiceOrderFileUpload
      file={file}
      onUpload={(selectedFile) => onFiles([selectedFile])}
      onDeselect={() => file && onRemove(file)}
      onDelete={() => file && onRemove(file)}
      label={label}
      hint=""
      selectedBadge="Foto selecionada"
      addLabel="Adicionar foto"
      addHint="Clique ou arraste uma imagem"
      uploadingLabel="Enviando foto..."
      uploadingHint="Aguarde enquanto a foto é armazenada."
      accept="image/*"
      onSelectExisting={onSelectExisting}
      showLibrary
      variant="checklist"
    />
  );
};

const ReadOnlyDatePickerInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <input
    ref={ref}
    type="text"
    value={value || ''}
    placeholder={placeholder}
    className={className || 'rkm-input zenit-field'}
    onClick={onClick}
    onMouseDown={(event) => event.preventDefault()}
    readOnly
  />
));

const ServiceEntryArrivalStep = ({ form, set, onInvoiceFileUpload, onInvoiceFileRemove, addPhotos, removePhoto }) => (
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
          />
        </div>
      </ServiceEntrySection>
    </div>
  </>
);

const ServiceEntryIdentificationStep = ({ form, set }) => (
  <>
    <ServiceEntrySection title="Identificação inicial" description="A oficina identifica o tipo de peça antes da avaliação e desmontagem.">
      <Field label="Categoria do equipamento" required className="md:col-span-3">
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
                <span className="flex h-20 w-20 items-center justify-center p-1">
                  <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                </span>
                <span className="text-xs font-medium">{type}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Equipamento" required className="md:col-span-2">
        <TextInput
          value={form.equipment}
          onChange={(value) => set('equipment', value)}
          placeholder="Ex.: Cilindro hidráulico soldado, dupla ação — Ø80/50 x 500 mm"
        />
      </Field>
      {isCylinderOrderType(form.orderType) && (
        <>
          <div className="md:col-span-3 mt-2 border-t border-rkmborder pt-4">
            <h3 className="text-sm font-semibold text-slate-200">Dimensões do cilindro</h3>
            <p className="mt-1 text-xs text-slate-500">Informe as medidas em milímetros conforme recebido.</p>
          </div>
          <div className="md:col-span-3 grid gap-4 md:grid-cols-5">
            <Field label="Diâmetro interno (mm)" required>
              <TextInput
                type="number"
                value={form.cylinderInternalDiameter}
                onChange={(value) => set('cylinderInternalDiameter', value)}
                placeholder="Ex.: 80"
              />
            </Field>
            <Field label="Diâmetro externo (mm)" required>
              <TextInput
                type="number"
                value={form.cylinderExternalDiameter}
                onChange={(value) => set('cylinderExternalDiameter', value)}
                placeholder="Ex.: 95"
              />
            </Field>
            <Field label="Comprimento (mm)" required>
              <TextInput type="number" value={form.cylinderLength} onChange={(value) => set('cylinderLength', value)} placeholder="Ex.: 500" />
            </Field>
            <Field label="Curso (mm)" required>
              <TextInput type="number" value={form.cylinderStroke} onChange={(value) => set('cylinderStroke', value)} placeholder="Ex.: 300" />
            </Field>
            <Field label="Diâmetro da haste (mm)" required>
              <TextInput
                type="number"
                value={form.cylinderRodDiameter}
                onChange={(value) => set('cylinderRodDiameter', value)}
                placeholder="Ex.: 50"
              />
            </Field>
          </div>
          <Field
            label="Componentes do cilindro"
            className="md:col-span-3"
            hint="Marque os componentes existentes. Eles serão avaliados na desmontagem."
          >
            <MultiSelectCheckboxes
              values={form.cylinderOptionalItems}
              onChange={(value) => set('cylinderOptionalItems', value)}
              options={CYLINDER_OPTIONAL_ITEMS}
              className="cylinder-optional-items"
            />
          </Field>
        </>
      )}
    </ServiceEntrySection>
    <ServiceEntrySection title="Dados da chegada" description="Registre a cadeia de recebimento antes da avaliação e desmontagem.">
      <Field label="Como chegou" required className="md:col-span-3">
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
                <span className="flex h-20 w-20 items-center justify-center p-1">
                  <img src={icon} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                </span>
                <span className={`text-xs font-medium ${selected ? 'text-sky-300' : 'text-white'}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Recebido por" required>
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
      </Field>
      <Field label="Entregue por">
        <TextInput value={form.deliveredBy} onChange={(value) => set('deliveredBy', value)} placeholder="Motorista / cliente" />
      </Field>
      <Field label="Acessórios / itens recebidos" className="md:col-span-2">
        <TextArea
          rows={2}
          value={form.receivedAccessories}
          onChange={(value) => set('receivedAccessories', value)}
          placeholder="Conexões, válvulas, peças soltas, embalagem..."
        />
      </Field>
    </ServiceEntrySection>
  </>
);

const ServiceEntryDisassemblyChecklist = ({ form, set, addPhotos, removePhoto, addChecklistPhotos, removeChecklistPhoto }) => {
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

const ServiceEntryDisassemblyStep = (props) => <ServiceEntryDisassemblyChecklist {...props} />;

const ServiceEntryBudgetStep = ({ form, set }) => {
  const nonconformingItems = (Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : []).filter(
    (item) => item.status === 'Não conforme',
  );
  const emptyBudgetLine = () => ({ budgetItem: '', budgetItemId: null, budgetUnit: '', budgetUnitPriceCents: 0, budgetQuantity: '' });
  const getBudgetLines = (item) => {
    if (item.component !== 'Vedação') {
      return [
        {
          budgetItem: item.budgetItem || '',
          budgetItemId: item.budgetItemId || null,
          budgetUnit: item.budgetUnit || '',
          budgetUnitPriceCents: item.budgetUnitPriceCents || 0,
          budgetQuantity: item.budgetQuantity || '',
        },
      ];
    }

    if (Array.isArray(item.budgetItems) && item.budgetItems.length > 0) return item.budgetItems;
    if (item.budgetItem) {
      return [
        {
          budgetItem: item.budgetItem,
          budgetItemId: item.budgetItemId || null,
          budgetUnit: item.budgetUnit || '',
          budgetUnitPriceCents: item.budgetUnitPriceCents || 0,
          budgetQuantity: item.budgetQuantity || '',
        },
      ];
    }
    return [emptyBudgetLine()];
  };
  const isManualBudgetLine = (line) => line.budgetItemId == null && Boolean(line.budgetItem || line.budgetUnit);

  const getBudgetNotes = (item) => {
    if (item.component !== 'Vedação') return item.notes || 'Sem observação informada.';

    const notes = String(item.notes || '')
      .split('\n')
      .map((line) => line.replace(/^\s*(?:•|[-*])\s*/, '').trim())
      .filter(Boolean);

    return notes.length > 0 ? notes : ['Sem observação informada.'];
  };
  const updateBudgetLine = (component, lineIndex, changes) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    set(
      'disassemblyChecklist',
      checklist.map((item) => {
        if (item.component !== component) return item;
        if (component !== 'Vedação') return { ...item, ...changes };
        const lines = getBudgetLines(item).map((line) => ({ ...line }));
        lines[lineIndex] = { ...lines[lineIndex], ...changes };
        return { ...item, budgetItems: lines, budgetItem: '', budgetItemId: null, budgetUnit: '', budgetUnitPriceCents: 0, budgetQuantity: '' };
      }),
    );
  };
  const addBudgetLine = (component) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    set(
      'disassemblyChecklist',
      checklist.map((item) => (item.component === component ? { ...item, budgetItems: [...getBudgetLines(item), emptyBudgetLine()] } : item)),
    );
  };
  const removeBudgetLine = (component, lineIndex) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    set(
      'disassemblyChecklist',
      checklist.map((item) => {
        if (item.component !== component) return item;
        const remainingLines = getBudgetLines(item).filter((_, index) => index !== lineIndex);
        return {
          ...item,
          budgetItems: remainingLines.length > 0 ? remainingLines : [emptyBudgetLine()],
          budgetItem: '',
          budgetItemId: null,
          budgetUnit: '',
          budgetUnitPriceCents: 0,
          budgetQuantity: '',
        };
      }),
    );
  };
  const totalBudgetCents = nonconformingItems.reduce(
    (total, item) =>
      total +
      getBudgetLines(item).reduce(
        (lineTotal, line) =>
          lineTotal + (line.budgetItem?.trim() ? Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)) : 0),
        0,
      ),
    0,
  );

  return (
    <ServiceEntrySection title="Orçamento" description="Consulte os componentes não conformes identificados na desmontagem.">
      <div className="md:col-span-3">
        {nonconformingItems.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-rkmborder">
            <table className="service-entry-table min-w-[1100px]">
              <thead>
                <tr>
                  <th scope="col">Componente</th>
                  <th scope="col">Observação da desmontagem</th>
                  <th scope="col">Item</th>
                  <th scope="col">Qtd.</th>
                  <th scope="col">Valor unitário</th>
                  <th scope="col">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {nonconformingItems.flatMap((item) => {
                  const lines = getBudgetLines(item);
                  return lines.map((line, lineIndex) => (
                    <tr
                      key={`${item.component}-${lineIndex}`}
                      className={
                        item.component === 'Vedação' ? `is-budget-multiline${lineIndex === 0 ? ' is-budget-multiline-start' : ''}` : undefined
                      }
                    >
                      {lineIndex === 0 && (
                        <>
                          <td rowSpan={lines.length}>
                            <strong>{item.component}</strong>
                          </td>
                          <td rowSpan={lines.length}>
                            {item.component === 'Vedação' ? (
                              <div className="service-entry-budget-notes">
                                {getBudgetNotes(item).map((note, noteIndex) => (
                                  <div key={`${item.component}-note-${noteIndex}`}>• {note}</div>
                                ))}
                              </div>
                            ) : (
                              getBudgetNotes(item)
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        {isManualBudgetLine(line) ? (
                          <div className="relative">
                            <input
                              className="rkm-input zenit-field pr-9 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-950/60 disabled:text-slate-500 disabled:placeholder:text-slate-600"
                              value={line.budgetItem || ''}
                              placeholder="Nome do item avulso"
                              aria-label={`Item avulso de ${item.component}`}
                              disabled
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-sky-300"
                              aria-label="Desbloquear e buscar no catálogo"
                              title="Desbloquear e buscar no catálogo"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() =>
                                updateBudgetLine(item.component, lineIndex, {
                                  budgetItem: '',
                                  budgetItemId: null,
                                  budgetUnit: '',
                                  budgetUnitPriceCents: 0,
                                })
                              }
                            >
                              <LockKeyhole size={15} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <SearchableSelector
                            value={line.budgetItem || ''}
                            onSelectCustom={(name) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: name,
                                budgetItemId: null,
                                budgetUnit: 'un',
                                budgetUnitPriceCents: 0,
                              })
                            }
                            showCustomOption={true}
                            loadOptions={listPriceCatalogItems}
                            getOptionKey={(catalogItem) => catalogItem.id}
                            getOptionLabel={(catalogItem) => catalogItem.name}
                            getOptionDescription={(catalogItem) => `${catalogItem.type === 'service' ? 'Serviço' : 'Material'} · ${catalogItem.unit}`}
                            getOptionIcon={(catalogItem) => (catalogItem.type === 'service' ? '/assets/serviço.png' : '/assets/produto.png')}
                            placeholder="Buscar no catálogo"
                            listLabel="Catálogo"
                            emptyLabel="Nenhum item encontrado."
                            onSelect={(catalogItem) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: catalogItem.name,
                                budgetItemId: catalogItem.id,
                                budgetUnit: catalogItem.unit,
                                budgetUnitPriceCents: catalogItem.unitPriceCents,
                              })
                            }
                            onClear={() =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: '',
                                budgetItemId: null,
                                budgetUnit: '',
                                budgetUnitPriceCents: 0,
                              })
                            }
                          />
                        )}
                        {item.component === 'Vedação' && lineIndex === lines.length - 1 && (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-sky-300 hover:text-sky-200"
                            onClick={() => addBudgetLine(item.component)}
                          >
                            ＋ Adicionar item
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="rkm-input zenit-field service-entry-budget-quantity w-16 max-w-16 min-w-0"
                            value={line.budgetQuantity || ''}
                            onChange={(event) => updateBudgetLine(item.component, lineIndex, { budgetQuantity: event.target.value })}
                            placeholder="Ex.: 3"
                            aria-label={`Quantidade do orçamento para ${item.component}`}
                          />
                          {isManualBudgetLine(line) ? (
                            <select
                              className="rkm-input zenit-field w-20"
                              value={line.budgetUnit || 'un'}
                              aria-label={`Unidade do item de ${item.component}`}
                              onChange={(event) =>
                                updateBudgetLine(item.component, lineIndex, {
                                  budgetUnit: event.target.value,
                                })
                              }
                            >
                              {PRICE_CATALOG_UNITS.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className="min-w-7 text-sm font-semibold text-slate-300"
                              aria-label={`Unidade: ${line.budgetUnit || 'não definida'}`}
                            >
                              {line.budgetUnit || '—'}
                            </span>
                          )}
                          {item.component === 'Vedação' && (
                            <button
                              type="button"
                              className="service-entry-delete shrink-0"
                              aria-label={`Remover item de ${item.component}`}
                              onClick={() => removeBudgetLine(item.component, lineIndex)}
                            >
                              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {isManualBudgetLine(line) ? (
                          <input
                            className="rkm-input zenit-field min-w-[110px]"
                            inputMode="numeric"
                            value={formatPriceInput(line.budgetUnitPriceCents || 0)}
                            placeholder="R$ 0,00"
                            aria-label={`Valor unitário de ${item.component}`}
                            onChange={(event) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetUnitPriceCents: parsePriceInput(event.target.value),
                              })
                            }
                          />
                        ) : line.budgetItem ? (
                          <span className="text-sm text-slate-300">{formatPriceCents(line.budgetUnitPriceCents || 0)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-100">
                        {line.budgetItem?.trim()
                          ? formatPriceCents(Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)))
                          : '—'}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="5" scope="row" className="text-right">
                    Total do orçamento
                  </th>
                  <th className="whitespace-nowrap text-right text-base text-sky-200">{formatPriceCents(totalBudgetCents)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="service-entry-empty rounded-lg border border-dashed border-sky-400/30 bg-slate-950/20">
            Nenhum componente não conforme foi registrado na desmontagem.
          </div>
        )}
      </div>
      <ServiceOrderBudgetReport
        form={form}
        totalCents={totalBudgetCents}
        rows={nonconformingItems.flatMap((item) =>
          getBudgetLines(item).map((line) => ({
            ...line,
            component: item.component,
            subtotalCents: line.budgetItem?.trim() ? Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)) : 0,
          })),
        )}
      />
    </ServiceEntrySection>
  );
};

const ServiceEntryRepairStep = ({ form, set, addPhotos, removePhoto }) => (
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

const ServiceEntryDispatchStep = ({ form, set, addPhotos, removePhoto }) => (
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

export const ServiceOrderView = () => {
  const showDevGuides = useLocalDevelopment();
  const [form, setForm] = useState(() => createEmptyServiceEntry());
  const [entries, setEntries] = useState([]);
  const [stages, setStages] = useState(SERVICE_ENTRY_DEFAULT_STAGES);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState('');

  useEffect(() => {
    let active = true;
    setLoadingEntries(true);
    Promise.all([loadServiceEntries(), loadServiceEntryStages()])
      .then(([loadedEntries, loadedStages]) => {
        if (!active) return;
        setEntries(loadedEntries);
        setStages(loadedStages.length > 0 ? loadedStages : SERVICE_ENTRY_DEFAULT_STAGES);
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as ordens do servidor.');
      })
      .finally(() => {
        if (active) setLoadingEntries(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!error) return undefined;

    const timeoutId = window.setTimeout(() => setError(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [error]);

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeoutId = window.setTimeout(() => setSuccessMessage(''), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const set = (key, value) => {
    setForm((prev) => {
      if (key !== 'cylinderOptionalItems') return { ...prev, [key]: value };

      const selectedComponents = normalizeCylinderComponents(Array.isArray(value) ? value : []);
      const previousChecklist = Array.isArray(prev.disassemblyChecklist) ? prev.disassemblyChecklist : [];
      const disassemblyChecklist = selectedComponents.map((component) => {
        const existing = previousChecklist.find((item) => normalizeCylinderComponent(item.component) === component);
        return existing ? { ...existing, component } : createEmptyDisassemblyChecklist([component])[0];
      });

      return { ...prev, cylinderOptionalItems: selectedComponents, disassemblyChecklist };
    });

    if (error) setError('');
  };

  const reset = () => {
    setForm(createEmptyServiceEntry());
    setStep(0);
    setError('');
  };

  const fillDemo = () => {
    setForm(createDemoServiceEntry());
    setStep(0);
    setError('');
  };

  const uploadInvoiceFile = async (file) => {
    try {
      const uploaded = await uploadFile(file, 'nota_fiscal');
      setForm((prev) => ({ ...prev, invoiceFileId: uploaded.id, invoiceFile: uploaded }));
      setError('');
    } catch {
      setError('Não foi possível enviar o arquivo da nota fiscal.');
      throw new Error('invoice_file_upload_failed');
    }
  };

  const removeInvoiceFile = async () => {
    const file = form.invoiceFile;
    try {
      if (file?.key) await deleteFile(file.key);
      setForm((prev) => ({ ...prev, invoiceFileId: null, invoiceFile: null }));
      setError('');
    } catch {
      setError('Não foi possível remover o arquivo da nota fiscal.');
    }
  };

  const validateStep = () => {
    const missing = getMissingServiceEntryFields(form, step);

    if (missing.length) {
      setError(`Para avançar, complete: ${missing.join(', ')}.`);
      return false;
    }
    setError('');
    return true;
  };

  const persistEntry = async (statusOverride, stepOverride = step) => {
    setSuccessMessage('');
    const normalizedId = form.id || normalizeOrderNumber(form.orderNumber);
    if (!normalizedId) {
      setError('Informe o número da OS antes de salvar o progresso.');
      return false;
    }
    const duplicate = entries.find(
      (entry) => entry.id !== form.id && normalizeOrderNumber(entry.orderNumber) === normalizeOrderNumber(form.orderNumber),
    );
    if (duplicate) {
      setError(`A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada nesta demonstração.`);
      return false;
    }

    const photos = { ...form.photos };

    const entry = {
      ...form,
      id: normalizedId,
      orderNumber: normalizeOrderNumber(form.orderNumber),
      photos,
      status: statusOverride || stages[stepOverride].status,
      stage: stages[stepOverride].id,
      createdAt: form.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const previousInvoiceFile = form.id ? entries.find((item) => item.id === form.id)?.invoiceFile : null;
    try {
      const persistedEntry = await saveServiceEntry(entry, Boolean(form.id));
      if (previousInvoiceFile?.key && previousInvoiceFile.key !== persistedEntry.invoiceFile?.key) {
        await deleteFile(previousInvoiceFile.key).catch(() => undefined);
      }
      const next = [persistedEntry, ...entries.filter((item) => item.id !== normalizedId)];
      setEntries(next);
      setForm((previous) => ({
        ...previous,
        ...persistedEntry,
        photos: { ...previous.photos, ...(persistedEntry.photos || {}) },
      }));
      setSuccessMessage('Alterações salvas com sucesso.');
      window.dispatchEvent(new Event('service-orders-changed'));
      return true;
    } catch (saveError) {
      if (form.invoiceFile?.key && form.invoiceFile.key !== previousInvoiceFile?.key) {
        await deleteFile(form.invoiceFile.key).catch(() => undefined);
      }
      setError(
        saveError.message === 'service_order_already_exists'
          ? `A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada.`
          : 'Não foi possível salvar a OS no servidor.',
      );
      return false;
    }
  };

  const addPhotos = async (category, files) => {
    try {
      const uploadCategory = category === 'arrival' ? 'recebimento' : category;
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, uploadCategory)));
      setForm((prev) => ({
        ...prev,
        photos: { ...prev.photos, [category]: [...(prev.photos[category] || []), ...uploaded] },
      }));
      setError('');
    } catch {
      setError('Não foi possível enviar as fotos para o sistema de arquivos.');
    }
  };

  const addChecklistPhotos = async (category, component, files) => {
    try {
      const uploadCategory = `desmontagem (${component.toLowerCase()})`;
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, uploadCategory)));
      setForm((prev) => ({
        ...prev,
        photos: { ...prev.photos, [category]: [...(prev.photos[category] || []), ...uploaded] },
      }));
      setError('');
    } catch {
      setError('Não foi possível enviar as fotos do checklist.');
    }
  };

  const removeChecklistPhoto = async (category, file) => {
    try {
      if (file.key) await deleteFile(file.key);
      setForm((prev) => ({
        ...prev,
        photos: {
          ...prev.photos,
          [category]: (prev.photos[category] || []).filter((item) => item.id !== file.id),
        },
      }));
      setError('');
    } catch {
      setError('Não foi possível remover a foto do checklist.');
    }
  };

  const removePhoto = async (category, photo) => {
    try {
      if (photo.key) await deleteFile(photo.key);
      else await deleteServiceEntryPhoto(photo.id);
    } catch {}
    setForm((prev) => ({
      ...prev,
      photos: {
        ...prev.photos,
        [category]: (prev.photos[category] || []).filter((item) => item.id !== photo.id),
      },
    }));
  };

  const advance = async () => {
    if (!validateStep()) return;
    if (step === stages.length - 1) {
      if (await persistEntry('Finalizado')) setError('');
      return;
    }
    const nextStep = step + 1;
    const nextStage = stages[nextStep];
    const canAdvanceToNextStep = nextStep < stages.length && nextStep <= progressStep + 1 && nextStage?.canAdvanceTo !== false;
    if (await persistEntry(undefined, canAdvanceToNextStep ? nextStep : step)) {
      if (!canAdvanceToNextStep) return;
      setStep(Math.min(nextStep, visibleProgressStep));
    }
  };

  const saveProgress = async () => {
    // Voltar para editar uma etapa anterior não deve regredir o estágio
    // operacional já salvo para a OS. Para uma OS nova, o passo atual ainda
    // é o estágio correto a persistir.
    const persistedStep = form.id ? getServiceEntryStageIndex(stages, form.stage) : step;
    if (await persistEntry(undefined, persistedStep)) setError('');
  };

  const openEntry = (entry) => {
    setError('');
    const emptyEntry = createEmptyServiceEntry();

    const selectedComponents = normalizeCylinderComponents(entry.cylinderOptionalItems);
    const previousChecklist = Array.isArray(entry.disassemblyChecklist) ? entry.disassemblyChecklist : [];
    const disassemblyChecklist = selectedComponents.map((component) => {
      const existing = previousChecklist.find((item) => normalizeCylinderComponent(item.component) === component);
      return existing ? { ...existing, component } : createEmptyDisassemblyChecklist([component])[0];
    });

    setForm({
      ...emptyEntry,
      ...entry,
      cylinderOptionalItems: selectedComponents,
      disassemblyChecklist,
      disassemblyStartedAt: entry.disassemblyStartedAt || emptyEntry.disassemblyStartedAt,
      photos: { ...emptyEntry.photos, ...(entry.photos || {}) },
    });
    setStep(getServiceEntryStageIndex(stages, entry.availableThroughStage || entry.stage));
    requestAnimationFrame(() => document.querySelector('.service-entry-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const deleteEntry = async (entry) => {
    const confirmed = window.confirm(`Excluir a OS ${entry.orderNumber} e as fotos salvas no sistema? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    setDeletingOrderId(entry.id);
    try {
      const photos = [...Object.values(entry.photos || {}).flat(), ...(form.id === entry.id ? Object.values(form.photos || {}).flat() : [])];
      const deletedPhotos = new Set();
      for (const photo of photos) {
        const photoReference = photo.key || photo.id;
        if (!photoReference || deletedPhotos.has(photoReference)) continue;
        deletedPhotos.add(photoReference);
        if (photo.key) await deleteFile(photo.key);
        else await deleteServiceEntryPhoto(photo.id);
      }

      await deleteServiceEntry(entry);
      const next = entries.filter((item) => item.id !== entry.id);
      setEntries(next);
      window.dispatchEvent(new Event('service-orders-changed'));
      if (form.id === entry.id) reset();
    } catch {
      setError(`Não foi possível excluir a OS ${entry.orderNumber}. Tente novamente.`);
    } finally {
      setDeletingOrderId('');
    }
  };

  const currentStep = stages[step] || { label: '', status: '' };
  const canEditCurrentStep = currentStep.canEdit !== false;
  const currentStepMissingFields = getMissingServiceEntryFields(form, step);
  const canAdvanceCurrentStep = canEditCurrentStep && currentStepMissingFields.length === 0;
  const progressStep = form.id ? getServiceEntryStageIndex(stages, form.stage) : 0;
  const visibleProgressStep = form.id ? getServiceEntryStageIndex(stages, form.availableThroughStage || form.stage) : 0;

  const changeStep = (nextStep) => {
    if (nextStep <= visibleProgressStep && stages[nextStep]?.canView) {
      setStep(nextStep);
      setError('');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 service-entry-page">
      {showDevGuides && (
        <LizyReferenceCard
          source="Serviços → Desmontagem → Criar Ordem"
          detail="Fluxo operacional da chegada à expedição; fotos e registros ficam salvos no sistema."
        />
      )}

      <div className="service-entry-hero rkm-card">
        <div className="flex-1 min-w-0">
          <div className="service-entry-kicker">Ciclo operacional · Entrada</div>

          <h1>{form.id ? form.orderNumber : 'Criar ordem de serviço'}</h1>

          <p>Registre a entrada da peça ou equipamento e reúna as informações necessárias antes da peritagem.</p>
        </div>

        <div className="service-entry-hero-controls">
          {showDevGuides && (
            <button type="button" className="btn btn-ghost service-entry-demo-fill" onClick={fillDemo}>
              Preencher exemplo DEV
            </button>
          )}
          <div className="service-entry-hero-status">
            <span className="service-entry-status-dot" />

            {form.status || currentStep.status}
          </div>
        </div>
      </div>

      <section className="rkm-card service-entry-history">
        <div className="service-entry-history-head">
          <div>
            <div className="text-sm font-semibold">Ordens em acompanhamento</div>

            <div className="text-xs text-slate-500 mt-1">Registros criados nesta demonstração.</div>
          </div>

          <span className="service-entry-count">{entries.length}</span>
        </div>

        {loadingEntries ? (
          <div className="service-entry-skeleton-table" aria-label="Carregando ordens de serviço">
            <div className="service-entry-skeleton service-entry-skeleton-table-head" />
            {[1, 2].map((row) => (
              <div className="service-entry-skeleton-table-row" key={row}>
                <div className="service-entry-skeleton" />
                <div className="service-entry-skeleton" />
                <div className="service-entry-skeleton service-entry-skeleton-wide" />
                <div className="service-entry-skeleton" />
                <div className="service-entry-skeleton" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="service-entry-empty">Nenhuma ordem criada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="service-entry-table">
              <thead>
                <tr>
                  <th>OS</th>
                  <th>Cliente</th>
                  <th>Equipamento</th>
                  <th>Criação</th>
                  <th>Entrega</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {entries.slice(0, 8).map((entry) => {
                  const isSelected = form.id === entry.id;
                  const entryStep = Math.max(0, getServiceEntryStageIndex(stages, entry.stage));
                  return (
                    <tr
                      key={entry.id}
                      className={isSelected ? 'is-selected' : ''}
                      tabIndex={0}
                      aria-current={isSelected ? 'true' : undefined}
                      onClick={() => {
                        if (!isSelected) openEntry(entry);
                      }}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (!isSelected) openEntry(entry);
                        }
                      }}
                    >
                      <td>
                        <strong>{entry.orderNumber}</strong>

                        {entry.urgent && <span className="service-entry-urgent-tag">URGENTE</span>}
                      </td>

                      <td>{entry.client}</td>

                      <td>
                        <div className="service-entry-equipment-cell">
                          {SERVICE_ENTRY_ORDER_TYPE_ICONS[entry.orderType] && (
                            <img src={SERVICE_ENTRY_ORDER_TYPE_ICONS[entry.orderType]} alt="" aria-hidden="true" />
                          )}
                          <div>
                            <div>{entry.equipment || 'A identificar'}</div>
                            <small>
                              {entry.manufacturer}
                              {entry.model ? ` · ${entry.model}` : ''}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td className="service-entry-creation-cell">
                        <span className="tag tag-slate">{entry.createdBy?.name || '—'}</span>
                        <small className="service-entry-creation-date">{formatLongDateBR(entry.createdAt)}</small>
                      </td>

                      <td>{formatDateLabel(entry.expectedDeliveryDate)}</td>

                      <td className="service-entry-status-cell">
                        <span className={`tag ${entry.status === 'Bloqueado por segurança' ? 'tag-red' : 'tag-blue'}`}>
                          {entry.status || 'Recebido'}
                        </span>
                        <small className="service-entry-stage-count">
                          {entryStep + 1}/{stages.length}
                        </small>
                      </td>
                      <td>
                        <div className="service-entry-open-actions">
                          <button
                            type="button"
                            className="btn btn-ghost service-entry-open"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEntry(entry);
                            }}
                            aria-pressed={isSelected}
                            disabled={isSelected}
                          >
                            {isSelected ? 'Selecionada' : 'Abrir OS'}
                          </button>
                          {isSelected && (
                            <button
                              type="button"
                              className="service-entry-deselect"
                              aria-label={`Desselecionar OS ${entry.orderNumber}`}
                              title="Desselecionar OS"
                              onClick={(event) => {
                                event.stopPropagation();
                                reset();
                              }}
                            >
                              ×
                            </button>
                          )}
                          <button
                            type="button"
                            className="service-entry-delete w-9 h-9 !p-0 inline-flex items-center justify-center"
                            aria-label={`Excluir OS ${entry.orderNumber}`}
                            title={`Excluir OS ${entry.orderNumber}`}
                            disabled={deletingOrderId === entry.id}
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteEntry(entry);
                            }}
                          >
                            {deletingOrderId === entry.id ? (
                              <span aria-hidden="true">…</span>
                            ) : (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M7 6l1 14h8l1-14" />
                                <path d="M10 10v6" />
                                <path d="M14 10v6" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {error && (
        <div role="alert" className="service-entry-toast alert-critical rounded-lg p-4 pr-10 text-sm">
          {error}
          <button type="button" className="service-entry-toast-close" aria-label="Fechar mensagem de erro" onClick={() => setError('')}>
            ×
          </button>
          <span className="service-entry-toast-progress" aria-hidden="true" />
        </div>
      )}

      {successMessage && (
        <div role="status" className="service-entry-toast service-entry-toast-success rounded-lg p-4 pr-10 text-sm">
          {successMessage}
          <button type="button" className="service-entry-toast-close" aria-label="Fechar mensagem de sucesso" onClick={() => setSuccessMessage('')}>
            ×
          </button>
          <span className="service-entry-toast-progress" aria-hidden="true" />
        </div>
      )}

      <ServiceOrderStepNavigator stages={stages} step={step} progressStep={progressStep} hasEntry={Boolean(form.id)} onChangeStep={changeStep} />

      <div className="service-entry-step-context">
        <span>
          ETAPA {step + 1} DE {stages.length}
        </span>
        <strong>{currentStep.label}</strong>
        <small>
          {form.id
            ? `${form.orderNumber} · ${form.status || currentStep.status}`
            : 'Salve a primeira etapa para abrir a OS e continuar o acompanhamento.'}
        </small>
      </div>

      <form
        className="rkm-card service-entry-form"
        onSubmit={(event) => {
          event.preventDefault();
          advance();
        }}
      >
        {!canEditCurrentStep ? (
          <ServiceEntrySection
            title="Etapa somente para consulta"
            description="Seu cargo pode acompanhar os dados gerais da OS, mas não pode editar o conteúdo desta etapa."
          >
            <div className="md:col-span-3 text-sm text-slate-400">Selecione uma etapa permitida para continuar.</div>
          </ServiceEntrySection>
        ) : step === 0 ? (
          <ServiceEntryArrivalStep
            form={form}
            set={set}
            onInvoiceFileUpload={uploadInvoiceFile}
            onInvoiceFileRemove={removeInvoiceFile}
            addPhotos={addPhotos}
            removePhoto={removePhoto}
            addChecklistPhotos={addChecklistPhotos}
            removeChecklistPhoto={removeChecklistPhoto}
          />
        ) : null}
        {!canEditCurrentStep ? null : step === 1 ? <ServiceEntryIdentificationStep form={form} set={set} /> : null}
        {canEditCurrentStep && step === 2 && (
          <ServiceEntryDisassemblyStep
            form={form}
            set={set}
            addPhotos={addPhotos}
            removePhoto={removePhoto}
            addChecklistPhotos={addChecklistPhotos}
            removeChecklistPhoto={removeChecklistPhoto}
          />
        )}
        {canEditCurrentStep && step === 3 && <ServiceEntryBudgetStep form={form} set={set} addPhotos={addPhotos} removePhoto={removePhoto} />}
        {canEditCurrentStep && step === 4 && <ServiceEntryRepairStep form={form} set={set} addPhotos={addPhotos} removePhoto={removePhoto} />}
        {canEditCurrentStep && step === 5 && <ServiceEntryDispatchStep form={form} set={set} addPhotos={addPhotos} removePhoto={removePhoto} />}

        <div className="service-entry-actions service-entry-step-actions">
          <div className="service-entry-action-group">
            {step > 0 && (
              <button type="button" className="btn btn-ghost service-entry-action-back" onClick={() => changeStep(step - 1)}>
                <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
                Voltar
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary service-entry-save service-entry-action-save"
              disabled={!canEditCurrentStep}
              onClick={saveProgress}
            >
              <Save size={16} strokeWidth={2} aria-hidden="true" />
              Salvar
            </button>
            {canAdvanceCurrentStep && (
              <button type="submit" className="btn btn-primary service-entry-advance service-entry-action-advance">
                {step === stages.length - 1 ? 'Finalizar OS' : 'Avançar'}
                {step === stages.length - 1 ? (
                  <Check size={17} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <ArrowRight size={17} strokeWidth={2.2} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

/* ============================================================
   VIEW — Minha Bancada (Operador / Técnico)
   ============================================================ */

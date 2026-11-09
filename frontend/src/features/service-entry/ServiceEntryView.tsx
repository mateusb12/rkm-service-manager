// @ts-nocheck
import { forwardRef, useEffect, useRef, useState } from 'react';

import DatePicker, { registerLocale } from 'react-datepicker';
import { ptBR } from 'date-fns/locale/pt-BR';

import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pt-BR', ptBR);

import {
  createEmptyServiceEntry,
  getServiceEntryStageIndex,
  normalizeOrderNumber,
  SERVICE_ENTRY_DEFAULT_STAGES,
} from './model';

import {
  deleteServiceEntry,
  loadServiceEntries,
  loadServiceEntryStages,
  saveServiceEntry,
} from './service';

import { Field, TextArea, TextInput } from '../../shared/ui/form-controls';

import { LizyReferenceCard } from '../../shared/dev/lizy-reference';
import { useLocalDevelopment } from '../../shared/dev/local-development';

import { ClientSelector } from '../pcp/clients';
import { UserSelector } from './UserSelector';
import { deleteServiceEntryPhoto, storeServiceEntryPhoto } from './photo-storage';
import { ServiceEntryStageNavigator } from './ServiceEntryStageNavigator';
import { getMissingServiceEntryFields } from './validation';
import { formatDateLabel, parseStoredDateTime, serializeDateTime } from '../../utils/date';
import { formatLongDateBR } from '../../utils/formatLongDateTimeBR';
import { createDemoServiceEntry } from './demo-fixture';

const SERVICE_ENTRY_ORDER_TYPE_ICONS = {
  Cilindro: '/assets/cilindro.png',
  Acumulador: '/assets/acumulador.png',
  Bomba: '/assets/bomba-hidraulica.png',
  'Motor hidráulico': '/assets/motor-hidraulico.png',
  Outro: '/assets/outro.png',
};

const CYLINDER_HEALTH_COMPONENTS = [
  'Camisa',
  'Haste',
  'Êmbolo',
  'Cabeçote dianteiro',
  'Cabeçote traseiro',
  'Vedações',
  'Articulação dianteira',
  'Articulação traseira',
  'Outros',
];

const ServiceEntrySection = ({ title, description, children }) => (
  <section className="service-entry-section">
    <div className="service-entry-section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
    <div className="service-entry-grid">{children}</div>
  </section>
);

const ServiceEntryPhotoField = ({ label, photos = [], onFiles, onRemove, hint }) => {
  const [previews, setPreviews] = useState({});
  const previewUrls = useRef([]);

  useEffect(
    () => () => previewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl)),
    [],
  );

  const selectFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    const nextPreviews = {};
    files.forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`;
      nextPreviews[key] = URL.createObjectURL(file);
      previewUrls.current.push(nextPreviews[key]);
    });
    setPreviews((prev) => ({ ...prev, ...nextPreviews }));
    await onFiles(files);
    event.target.value = '';
  };

  return (
    <div className="service-entry-photo-field">
      <label className="service-entry-photo-label">{label}</label>
      {hint && <p>{hint}</p>}
      <label className="service-entry-photo-picker">
        <input type="file" accept="image/*" capture="environment" multiple onChange={selectFiles} />
        <span aria-hidden="true">＋</span>
        <strong>Adicionar fotos</strong>
        <small>JPG, PNG ou HEIC · armazenadas neste navegador</small>
      </label>
      {photos.length > 0 && (
        <div className="service-entry-photo-list">
          {photos.map((photo) => {
            const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
            return (
              <div className="service-entry-photo-item" key={photo.id}>
                {previews[previewKey] ? (
                  <img src={previews[previewKey]} alt={`Foto: ${photo.name}`} />
                ) : (
                  <span className="service-entry-photo-placeholder">
                    {photo.demo ? 'DEMO' : 'IMG'}
                  </span>
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

export const ServiceEntryView = () => {
  const showDevGuides = useLocalDevelopment();
  const [form, setForm] = useState(() => createEmptyServiceEntry());
  const [entries, setEntries] = useState([]);
  const [stages, setStages] = useState(SERVICE_ENTRY_DEFAULT_STAGES);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
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

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

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
    const normalizedId = form.id || normalizeOrderNumber(form.orderNumber);
    if (!normalizedId) {
      setError('Informe o número da OS antes de salvar o progresso.');
      return false;
    }
    const duplicate = entries.find(
      (entry) =>
        entry.id !== form.id &&
        normalizeOrderNumber(entry.orderNumber) === normalizeOrderNumber(form.orderNumber),
    );
    if (duplicate) {
      setError(`A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada nesta demonstração.`);
      return false;
    }

    const photos = { ...form.photos };
    try {
      for (const category of Object.keys(photos)) {
        photos[category] = await Promise.all(
          (photos[category] || []).map(async (photo) => {
            if (!photo.file) return photo;
            await storeServiceEntryPhoto(photo.id, photo.file);
            const { file, previewUrl, lastModified, ...metadata } = photo;
            return metadata;
          }),
        );
      }
    } catch (storageError) {
      setError(storageError.message || 'Não foi possível guardar as fotos neste navegador.');
      return false;
    }

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
    try {
      const persistedEntry = await saveServiceEntry(entry, Boolean(form.id));
      const next = [persistedEntry, ...entries.filter((item) => item.id !== normalizedId)];
      setEntries(next);
      setForm(persistedEntry);
      window.dispatchEvent(new Event('service-orders-changed'));
      return true;
    } catch (saveError) {
      setError(
        saveError.message === 'service_order_already_exists'
          ? `A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada.`
          : 'Não foi possível salvar a OS no servidor.',
      );
      return false;
    }
  };

  const addPhotos = async (category, files) => {
    const orderId = form.id || normalizeOrderNumber(form.orderNumber);
    if (!orderId) {
      setError('Informe o número da OS antes de anexar fotos.');
      return;
    }
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const id = `${orderId}:${category}:${crypto.randomUUID()}`;
          await storeServiceEntryPhoto(id, file);
          return {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          };
        }),
      );
      setForm((prev) => ({
        ...prev,
        photos: { ...prev.photos, [category]: [...(prev.photos[category] || []), ...uploaded] },
      }));
      setError('');
    } catch (storageError) {
      setError(storageError.message || 'Não foi possível anexar as fotos.');
    }
  };

  const removePhoto = async (category, photo) => {
    try {
      await deleteServiceEntryPhoto(photo.id);
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
    if (await persistEntry(undefined, nextStep)) {
      setStep(nextStep);
    }
  };

  const openEntry = (entry) => {
    setError('');
    const emptyEntry = createEmptyServiceEntry();

    setForm({
      ...emptyEntry,
      ...entry,
      disassemblyStartedAt: entry.disassemblyStartedAt || emptyEntry.disassemblyStartedAt,
      photos: { ...emptyEntry.photos, ...(entry.photos || {}) },
    });
    setStep(getServiceEntryStageIndex(stages, entry.availableThroughStage || entry.stage));
    requestAnimationFrame(() =>
      document
        .querySelector('.service-entry-stepper')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
    );
  };

  const deleteEntry = async (entry) => {
    const confirmed = window.confirm(
      `Excluir a OS ${entry.orderNumber} e as fotos salvas neste navegador? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setDeletingOrderId(entry.id);
    try {
      const photos = [
        ...Object.values(entry.photos || {}).flat(),
        ...(form.id === entry.id ? Object.values(form.photos || {}).flat() : []),
      ];
      const photoIds = new Set(photos.map((photo) => photo.id).filter(Boolean));
      for (const photoId of photoIds) await deleteServiceEntryPhoto(photoId);

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
  const progressStep = form.id
    ? getServiceEntryStageIndex(stages, form.availableThroughStage || form.stage)
    : 0;

  const changeStep = (nextStep) => {
    if (nextStep <= progressStep && stages[nextStep]?.canView) {
      setStep(nextStep);
      setError('');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 service-entry-page">
      {showDevGuides && (
        <LizyReferenceCard
          source="Serviços → Desmontagem → Criar Ordem"
          detail="Fluxo operacional da chegada à expedição; fotos e registros ficam salvos localmente neste navegador."
        />
      )}

      <div className="service-entry-hero rkm-card">
        <div className="flex-1 min-w-0">
          <div className="service-entry-kicker">Ciclo operacional · Entrada</div>

          <h1>{form.id ? `OS ${form.orderNumber}` : 'Criar ordem de serviço'}</h1>

          <p>
            Registre a entrada da peça ou equipamento e reúna as informações necessárias antes da
            peritagem.
          </p>
        </div>

        <div className="service-entry-hero-controls">
          {showDevGuides && (
            <button
              type="button"
              className="btn btn-ghost service-entry-demo-fill"
              onClick={fillDemo}
            >
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
                            <img
                              src={SERVICE_ENTRY_ORDER_TYPE_ICONS[entry.orderType]}
                              alt=""
                              aria-hidden="true"
                            />
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
                        <small className="service-entry-creation-date">
                          {formatLongDateBR(entry.createdAt)}
                        </small>
                      </td>

                      <td>{formatDateLabel(entry.expectedDeliveryDate)}</td>

                      <td className="service-entry-status-cell">
                        <span
                          className={`tag ${entry.status === 'Bloqueado por segurança' ? 'tag-red' : 'tag-blue'}`}
                        >
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
        <div
          role="alert"
          className="service-entry-toast alert-critical rounded-lg p-4 pr-10 text-sm"
        >
          {error}
          <button
            type="button"
            className="service-entry-toast-close"
            aria-label="Fechar mensagem de erro"
            onClick={() => setError('')}
          >
            ×
          </button>
          <span className="service-entry-toast-progress" aria-hidden="true" />
        </div>
      )}

      <ServiceEntryStageNavigator
        stages={stages}
        step={step}
        progressStep={progressStep}
        hasEntry={Boolean(form.id)}
        onChangeStep={changeStep}
      />

      <div className="service-entry-step-context">
        <span>
          ETAPA {step + 1} DE {stages.length}
        </span>
        <strong>{currentStep.label}</strong>
        <small>
          {form.id
            ? `OS ${form.orderNumber} · ${form.status || currentStep.status}`
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
        {step === 0 && (
          <>
            <ServiceEntrySection
              title="Recebimento PCP"
              description="Registre somente o necessário para abrir a OS. A identificação técnica fica para a oficina."
            >
              <Field label="Cliente" required className="md:col-span-2">
                <ClientSelector
                  value={form.client}
                  onSelect={(client) => set('client', client.nomeFantasia)}
                  onClear={() => set('client', '')}
                />
              </Field>

              <Field
                label="Nº da OS"
                required
                hint={form.id ? 'Identificador fixo após a abertura da OS.' : undefined}
              >
                <TextInput
                  value={form.orderNumber}
                  onChange={(value) => set('orderNumber', value)}
                  placeholder="Ex.: 254186"
                  disabled={!!form.id}
                />
              </Field>

              <Field
                label="Nota fiscal / documento"
                className="md:col-span-2"
                hint="Opcional — informe o número da NF quando houver. Você também pode usar N/A para registrar ausência de documento."
              >
                <TextInput
                  value={form.invoiceNumber}
                  onChange={(value) => set('invoiceNumber', value)}
                  placeholder="Número da NF, N/A ou deixe em branco"
                />
              </Field>

              <div className="md:col-span-3">
                <ServiceEntryPhotoField
                  label="Fotos da peça"
                  hint="Opcional no recebimento — pode ser adicionada depois, se necessário."
                  photos={form.photos.arrival}
                  onFiles={(files) => addPhotos('arrival', files)}
                  onRemove={(photo) => removePhoto('arrival', photo)}
                />
              </div>
            </ServiceEntrySection>
          </>
        )}

        {step === 1 && (
          <>
            <ServiceEntrySection
              title="Identificação inicial"
              description="A oficina identifica o tipo de peça antes da avaliação e desmontagem."
            >
              <Field label="Categoria do equipamento" required className="md:col-span-3">
                <div
                  className="service-entry-order-types"
                  role="radiogroup"
                  aria-label="Categoria do equipamento"
                >
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
                          <img
                            src={icon}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain"
                          />
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
                  placeholder="Descrição do equipamento"
                />
              </Field>
            </ServiceEntrySection>

            <ServiceEntrySection
              title="Dados da chegada"
              description="Registre a cadeia de recebimento antes da avaliação e desmontagem."
            >
              <Field label="Como chegou" required className="md:col-span-3">
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Como chegou">
                  {[
                    ['coleta_cliente', 'Coleta no cliente', '/assets/coleta-no-cliente.png'],
                    [
                      'cliente_entregou',
                      'Cliente trouxe à oficina',
                      '/assets/cliente-trouxe-pra-oficina.png',
                    ],
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
                          <img
                            src={icon}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain"
                          />
                        </span>
                        <span
                          className={`text-xs font-medium ${selected ? 'text-sky-300' : 'text-white'}`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              <Field label="Recebido por" required>
                <UserSelector
                  value={form.receivedBy}
                  onSelect={(user) => set('receivedBy', user.name)}
                  onClear={() => set('receivedBy', '')}
                />
              </Field>
              <Field label="Entregue por">
                <TextInput
                  value={form.deliveredBy}
                  onChange={(value) => set('deliveredBy', value)}
                  placeholder="Motorista / cliente"
                />
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
        )}

        {step === 2 && (
          <>
            <ServiceEntrySection
              title="Desmontagem"
              description="Preserve a identidade da OS e registre como os componentes foram encontrados."
            >
              <Field label="Responsável pela desmontagem *">
                <UserSelector
                  value={form.disassemblyOperator}
                  onSelect={(user) => set('disassemblyOperator', user.name)}
                  onClear={() => set('disassemblyOperator', '')}
                  roleFilter="mechanic"
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
              {form.orderType === 'Cilindro' && (
                <div className="md:col-span-3">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Checklist de saúde do cilindro
                  </span>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {CYLINDER_HEALTH_COMPONENTS.map((component) => (
                      <button
                        key={component}
                        type="button"
                        className="rounded-lg border border-rkmborder bg-rkmcard2/40 px-3 py-3 text-left text-sm text-slate-300 transition hover:border-blue-400/50 hover:bg-rkmcard2"
                      >
                        {component}
                      </button>
                    ))}
                  </div>
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
          </>
        )}

        {step === 3 && (
          <>
            <ServiceEntrySection
              title="Orçamento"
              description="Registre os achados, a recomendação de reparo e a aprovação do cliente."
            >
              <Field label="Diagnóstico técnico *" className="md:col-span-3">
                <TextArea
                  rows={4}
                  value={form.diagnosis}
                  onChange={(value) => set('diagnosis', value)}
                  placeholder="Causa provável, danos e conclusão da peritagem..."
                />
              </Field>
              <Field label="Medições / tolerâncias" className="md:col-span-2">
                <TextArea
                  rows={3}
                  value={form.measurements}
                  onChange={(value) => set('measurements', value)}
                  placeholder="Dimensões, folgas, pressão, valores de referência..."
                />
              </Field>
              <Field label="Destino das peças *">
                <select
                  className="rkm-input zenit-field"
                  value={form.partsDisposition}
                  onChange={(event) => set('partsDisposition', event.target.value)}
                >
                  <option value="">Selecione</option>
                  <option>Reaproveitar</option>
                  <option>Substituir</option>
                  <option>Enviar para análise</option>
                  <option>Condenar</option>
                </select>
              </Field>
              <Field label="Recomendação / escopo" className="md:col-span-3">
                <TextArea
                  rows={3}
                  value={form.repairRecommendation}
                  onChange={(value) => set('repairRecommendation', value)}
                  placeholder="Serviços e peças recomendados para orçamento/laudo..."
                />
              </Field>
              <Field label="Status da aprovação">
                <select
                  className="rkm-input zenit-field"
                  value={form.approvalStatus}
                  onChange={(event) => set('approvalStatus', event.target.value)}
                >
                  <option>Pendente</option>
                  <option>Aprovada</option>
                  <option>Reprovada</option>
                  <option>Ajuste solicitado</option>
                </select>
              </Field>
              <Field label="Referência da aprovação">
                <TextInput
                  value={form.approvalReference}
                  onChange={(value) => set('approvalReference', value)}
                  placeholder="E-mail, pedido ou autorização"
                />
              </Field>
              <Field label="Disponibilidade de material">
                <select
                  className="rkm-input zenit-field"
                  value={form.materialStatus}
                  onChange={(event) => set('materialStatus', event.target.value)}
                >
                  <option>A verificar</option>
                  <option>Disponível</option>
                  <option>Aguardando compra</option>
                  <option>Não necessário</option>
                </select>
              </Field>
              <div className="md:col-span-3">
                <ServiceEntryPhotoField
                  label="Fotos dos achados"
                  photos={form.photos.diagnosis}
                  onFiles={(files) => addPhotos('diagnosis', files)}
                  onRemove={(photo) => removePhoto('diagnosis', photo)}
                />
              </div>
            </ServiceEntrySection>
          </>
        )}

        {step === 4 && (
          <>
            <ServiceEntrySection
              title="Reparo"
              description="Registre o serviço executado e os resultados da validação."
            >
              <Field label="Serviço executado *" className="md:col-span-3">
                <TextArea
                  rows={4}
                  value={form.workPerformed}
                  onChange={(value) => set('workPerformed', value)}
                  placeholder="Reparo, componentes substituídos, ajustes e referência à IT aplicada..."
                />
              </Field>
              <Field label="Resultado dos testes *">
                <select
                  className="rkm-input zenit-field"
                  value={form.testResult}
                  onChange={(event) => set('testResult', event.target.value)}
                >
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
          </>
        )}

        {step === 5 && (
          <>
            <ServiceEntrySection
              title="Entrega"
              description="Registre como a ordem foi entregue e a confirmação de saída."
            >
              <Field label="Forma de entrega *">
                <select
                  className="rkm-input zenit-field"
                  value={form.dispatchMethod}
                  onChange={(event) => set('dispatchMethod', event.target.value)}
                >
                  <option value="">Selecione</option>
                  <option>Retirada pelo cliente</option>
                  <option>Transportadora</option>
                  <option>Entrega RKM</option>
                </select>
              </Field>
              <Field label="Rastreio / comprovante">
                <TextInput
                  value={form.dispatchReference}
                  onChange={(value) => set('dispatchReference', value)}
                  placeholder="Código ou referência de entrega"
                />
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
          </>
        )}

        <div className="service-entry-actions service-entry-step-actions">
          <div className="service-entry-action-group">
            {step > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => changeStep(step - 1)}>
                Voltar
              </button>
            )}
            <button type="submit" className="btn btn-primary service-entry-save">
              Salvar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* ============================================================
   VIEW — Minha Bancada (Operador / Técnico)
   ============================================================ */

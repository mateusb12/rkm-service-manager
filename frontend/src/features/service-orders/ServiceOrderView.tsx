// @ts-nocheck
import { useEffect, useRef, useState } from 'react';

import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';

import {
  createEmptyServiceEntry,
  createEmptyDisassemblyChecklist,
  getServiceEntryStageIndex,
  normalizeOrderNumber,
  normalizeCylinderComponent,
  normalizeCylinderComponents,
  SERVICE_ENTRY_DEFAULT_STAGES,
} from './model';
import { deleteServiceEntry, loadServiceEntries, loadServiceEntryStages, saveServiceEntry } from './service';
import { deleteServiceEntryPhoto } from './photo-storage';
import { getMissingServiceEntryFields } from './validation';
import { createDemoServiceEntry } from './demo-fixture';
import { ServiceOrderStepNavigator } from './ServiceOrderStepNavigator';
import { LizyReferenceCard } from '../../shared/dev/lizy-reference';
import { useLocalDevelopment } from '../../shared/dev/local-development';
import { formatDateLabel } from '../../utils/date';
import { formatLongDateBR } from '../../utils/formatLongDateTimeBR';
import { deleteFile, uploadFile } from '../files/service';
import { ServiceEntrySection } from './stages/common';
import { SERVICE_ENTRY_ORDER_TYPE_ICONS } from './stages/constants';
import { ServiceOrderReceptionStep } from './stages/ReceptionStep';
import { ServiceOrderIdentificationStep } from './stages/IdentificationStep';
import { ServiceOrderDisassemblyStep } from './stages/DisassemblyStep';
import { ServiceOrderBudgetStep } from './stages/BudgetStep';
import { ServiceOrderRepairStep } from './stages/RepairStep';
import { ServiceOrderDispatchStep } from './stages/DispatchStep';

export const ServiceOrderView = () => {
  const showDevGuides = useLocalDevelopment();
  const [form, setForm] = useState(() => createEmptyServiceEntry());
  const [entries, setEntries] = useState([]);
  const [stages, setStages] = useState(SERVICE_ENTRY_DEFAULT_STAGES);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [highlightMissingStock, setHighlightMissingStock] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [uploadingChecklist, setUploadingChecklist] = useState(false);
  const uploadingChecklistRef = useRef(false);

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
      if (prev.disassemblyTimingVersion && (key === 'cylinderOptionalItems' || key === 'cylinderOptionalItemsOther')) return prev;
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

  const persistEntry = async (statusOverride, stepOverride = step, changes = {}) => {
    if (uploadingChecklistRef.current) {
      setError('Aguarde o envio da fotografia antes de salvar ou confirmar.');
      return false;
    }
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    setSuccessMessage('');
    const normalizedId = form.id || normalizeOrderNumber(form.orderNumber);
    if (!normalizedId) {
      setError('Informe o número da OS antes de salvar o progresso.');
      savingRef.current = false;
      setSaving(false);
      return false;
    }
    const duplicate = entries.find(
      (entry) => entry.id !== form.id && normalizeOrderNumber(entry.orderNumber) === normalizeOrderNumber(form.orderNumber),
    );
    if (duplicate) {
      setError(`A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada nesta demonstração.`);
      savingRef.current = false;
      setSaving(false);
      return false;
    }

    const photos = { ...form.photos };

    const entry = {
      ...form,
      ...changes,
      id: normalizedId,
      orderNumber: normalizeOrderNumber(form.orderNumber),
      photos,
      status: statusOverride || stages[stepOverride].status,
      stage: stages[stepOverride].id,
      createdAt: form.createdAt || new Date().toISOString(),
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
      setSuccessMessage(
        changes.disassemblyAction === 'start'
          ? 'Desmontagem iniciada e salva.'
          : changes.disassemblyAction === 'assess'
            ? 'Resultado registrado e travado.'
            : 'Alterações salvas com sucesso.',
      );
      window.dispatchEvent(new Event('service-orders-changed'));
      return true;
    } catch (saveError) {
      if (form.invoiceFile?.key && form.invoiceFile.key !== previousInvoiceFile?.key) {
        await deleteFile(form.invoiceFile.key).catch(() => undefined);
      }
      setError(
        saveError.message === 'service_order_already_exists'
          ? `A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada.`
          : {
              stale_service_order:
                'Conflito: esta OS foi alterada em outra sessão. Reabra a OS para carregar a versão atual; nenhuma alteração foi salva.',
              disassembly_already_started: 'Conflito: a desmontagem já foi iniciada. Reabra a OS para ver o horário registrado.',
              confirmed_evaluation_locked: 'Conflito: esta avaliação já foi confirmada e está travada. Reabra a OS.',
              disassembly_preparation_incomplete: 'Informe responsável, dimensões válidas e componentes antes de começar.',
              justification_required: 'Informe a justificativa da não conformidade antes de avançar.',
              evaluation_before_start: 'Comece a desmontagem antes de avaliar componentes.',
              disassembly_incomplete: 'Confirme todos os componentes antes de avançar.',
              disassembly_preparation_locked: 'Conflito: responsável ou dimensões foram alterados após o início. Reabra a OS.',
              disassembly_checklist_locked: 'Conflito: a composição ou ordem do checklist está travada. Reabra a OS.',
              disassembly_completion_locked: 'Conflito: o término é registrado automaticamente pelo servidor. Reabra a OS.',
              evaluation_requires_action: 'Conflito: selecione um resultado antes de editar esta avaliação. Reabra a OS.',
              invalid_assessment: 'Conflito: resultado inválido ou avaliação já confirmada. Reabra a OS.',
              disassembly_stage_required: 'Conflito: abra a etapa Desmontagem antes de iniciar.',
            }[saveError.message] ||
              (saveError.message === 'service_order_save_failed'
                ? 'Não foi possível salvar a OS no servidor.'
                : `Conflito: ${saveError.message}. Reabra a OS para carregar a versão atual.`),
      );
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const startDisassembly = () => persistEntry(undefined, step, { disassemblyAction: 'start' });
  const assessComponent = (index, status) => {
    const checklist = form.disassemblyChecklist.map((item, position) =>
      position === index ? { ...item, status, ...(status === 'Conforme' ? { notes: '' } : {}) } : item,
    );
    return persistEntry(undefined, step, { disassemblyChecklist: checklist, disassemblyAction: 'assess', disassemblyIndex: index });
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
    if (uploadingChecklistRef.current || savingRef.current) return;
    uploadingChecklistRef.current = true;
    setUploadingChecklist(true);
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
    } finally {
      uploadingChecklistRef.current = false;
      setUploadingChecklist(false);
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
    if (step === 3) setHighlightMissingStock(true);
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
    const persistedStep = form.id ? getServiceEntryStageIndex(stages, form.stage) : step;
    if (await persistEntry(undefined, persistedStep)) setError('');
  };

  const openEntry = (entry) => {
    setError('');
    const emptyEntry = createEmptyServiceEntry();

    const previousChecklist = Array.isArray(entry.disassemblyChecklist) ? entry.disassemblyChecklist : [];
    const legacyAdvanced = !entry.disassemblyTimingVersion && ['orcamento', 'reparo', 'entrega'].includes(entry.stage);
    const legacyWithAssessments = !entry.disassemblyTimingVersion && previousChecklist.some((item) => item.status);
    const preserveChecklist = legacyAdvanced || legacyWithAssessments || entry.disassemblyTimingVersion;
    const selectedComponents = preserveChecklist
      ? (entry.cylinderOptionalItems || []).length
        ? entry.cylinderOptionalItems
        : previousChecklist.map((item) => item.component)
      : normalizeCylinderComponents(entry.cylinderOptionalItems);
    const disassemblyChecklist = preserveChecklist
      ? previousChecklist
      : selectedComponents.map((component) => {
          const existing = previousChecklist.find((item) => normalizeCylinderComponent(item.component) === component);
          return existing ? { ...existing, component } : createEmptyDisassemblyChecklist([component])[0];
        });

    setForm({
      ...emptyEntry,
      ...entry,
      cylinderOptionalItems: selectedComponents,
      disassemblyChecklist,
      disassemblyStartedAt: entry.disassemblyStartedAt || '',
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
      await deleteServiceEntry(entry);
      const deletedPhotos = new Set();
      let failedPhotoCleanup = false;
      for (const photo of photos) {
        const photoReference = photo.key || photo.id;
        if (!photoReference || deletedPhotos.has(photoReference)) continue;
        deletedPhotos.add(photoReference);
        try {
          if (photo.key) await deleteFile(photo.key);
          else await deleteServiceEntryPhoto(photo.id);
        } catch {
          failedPhotoCleanup = true;
        }
      }

      const next = entries.filter((item) => item.id !== entry.id);
      setEntries(next);
      window.dispatchEvent(new Event('service-orders-changed'));
      if (form.id === entry.id) reset();
      if (failedPhotoCleanup) setError(`A OS ${entry.orderNumber} foi excluída, mas alguns arquivos não puderam ser removidos.`);
    } catch {
      setError(`Não foi possível excluir a OS ${entry.orderNumber}. Tente novamente.`);
    } finally {
      setDeletingOrderId('');
    }
  };

  const currentStep = stages[step] || { label: '', status: '' };
  const canEditCurrentStep = currentStep.canEdit !== false;
  const currentStepMissingFields = getMissingServiceEntryFields(form, step);
  const canAdvanceCurrentStep = canEditCurrentStep && (currentStepMissingFields.length === 0 || step === 3);
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
          <ServiceOrderReceptionStep
            form={form}
            set={set}
            onInvoiceFileUpload={uploadInvoiceFile}
            onInvoiceFileRemove={removeInvoiceFile}
            addPhotos={addPhotos}
            removePhoto={removePhoto}
            fieldsLocked={Boolean(form.id && progressStep > 0)}
          />
        ) : null}
        {!canEditCurrentStep ? null : step === 1 ? <ServiceOrderIdentificationStep form={form} set={set} /> : null}
        {canEditCurrentStep && step === 2 && (
          <ServiceOrderDisassemblyStep
            form={form}
            set={set}
            addChecklistPhotos={addChecklistPhotos}
            removeChecklistPhoto={removeChecklistPhoto}
            onStart={startDisassembly}
            onAssess={assessComponent}
            saving={saving}
            photoBusy={uploadingChecklist}
          />
        )}
        {canEditCurrentStep && step === 3 && (
          <ServiceOrderBudgetStep
            form={form}
            set={set}
            highlightMissingStock={highlightMissingStock}
            saving={saving}
            onStockReceivedChange={(disassemblyChecklist) => persistEntry(undefined, step, { disassemblyChecklist })}
          />
        )}
        {canEditCurrentStep && step === 4 && (
          <ServiceOrderRepairStep form={form} set={set} addPhotos={addPhotos} removePhoto={removePhoto} photosLocked={progressStep > 4} />
        )}
        {canEditCurrentStep && step === 5 && (
          <ServiceOrderDispatchStep form={form} set={set} addPhotos={addPhotos} removePhoto={removePhoto} photosLocked={progressStep > 5} />
        )}

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
              disabled={!canEditCurrentStep || saving || uploadingChecklist}
              onClick={saveProgress}
            >
              <Save size={16} strokeWidth={2} aria-hidden="true" />
              Salvar
            </button>
            {canAdvanceCurrentStep && (
              <button
                type="submit"
                disabled={saving || uploadingChecklist}
                className="btn btn-primary service-entry-advance service-entry-action-advance"
              >
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

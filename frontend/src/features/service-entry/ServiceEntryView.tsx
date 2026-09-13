// @ts-nocheck
import {
    useState,
} from 'react';

import {
    SERVICE_ENTRY_STEPS,
    createEmptyServiceEntry,
    normalizeOrderNumber,
} from './model';

import {
    loadServiceEntries,
    saveServiceEntries,
} from './repository';

import {
    Field,
    TextArea,
    TextInput,
    Toggle,
} from '../../shared/ui/form-controls';

import {
    LizyReferenceCard,
    SHOW_DEV_GUIDES,
} from '../../shared/dev/lizy-reference';

const SERVICE_ENTRY_PHOTO_DB = 'rkm-service-entry-photo-store-v1';

const openServiceEntryPhotoDb = () => new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
        reject(new Error('Este navegador não oferece armazenamento local para fotos.'));
        return;
    }

    const request = window.indexedDB.open(SERVICE_ENTRY_PHOTO_DB, 1);
    request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('photos')) {
            request.result.createObjectStore('photos');
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento de fotos.'));
});

const storeServiceEntryPhoto = async (id, file) => {
    const db = await openServiceEntryPhotoDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        tx.objectStore('photos').put(file, id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error || new Error('Não foi possível salvar a foto.')); };
    });
};

const deleteServiceEntryPhoto = async (id) => {
    const db = await openServiceEntryPhotoDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('photos', 'readwrite');
        tx.objectStore('photos').delete(id);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error || new Error('Não foi possível remover a foto.')); };
    });
};

const createDemoServiceEntry = () => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() + 10);
    const localExpectedDate = new Date(expectedDate.getTime() - expectedDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    const orderNumber = `DEV-${String(now.getTime()).slice(-6)}`;
    const photoCategories = {
        arrival: 'Chegada',
        disassembly: 'Desmontagem',
        diagnosis: 'Achados',
        execution: 'Execução e teste',
        dispatch: 'Expedição',
    };

    return {
        ...createEmptyServiceEntry(),
        orderType: 'Acumulador',
        orderNumber,
        previousOrderNumber: 'OS-DEV-ANTERIOR',
        expectedDeliveryDate: localExpectedDate,
        urgent: true,
        client: 'Cliente de demonstração DEV',
        clientReference: 'PED-DEV-001',
        requester: 'Solicitante de exemplo',
        invoiceNumber: 'NF-DEV-001',
        serialNumber: 'AC-DEV-042',
        manufacturer: 'Parker (exemplo)',
        equipment: 'Acumulador hidráulico',
        model: 'Série de demonstração',
        claimedDefect: 'Perda de pressão relatada pelo cliente (exemplo).',
        shippingNotes: 'Acondicionar e enviar pela transportadora de exemplo.',
        equipmentLocation: 'Área de recebimento — DEV',
        serviceResponsible: 'Responsável de exemplo',
        expertTechnician: 'Técnico perito de exemplo',
        hydraulic: true,
        pneumatic: false,
        fluidApplication: 'Óleo hidráulico — aplicação de demonstração',
        receivedBy: 'Operador de recebimento DEV',
        deliveredBy: 'Transportadora de exemplo',
        arrivalCondition: 'Com avarias',
        receivedAccessories: 'Conexões e tampa de proteção (exemplo).',
        pressureState: 'Aliviada/verificada',
        safetyReviewed: true,
        safeToDisassemble: true,
        disassemblyOperator: 'Técnico de desmontagem DEV',
        disassemblyStartedAt: localDateTime,
        disassemblyComplete: true,
        disassemblyControlled: true,
        partsSeparated: true,
        oilCollected: true,
        disassemblyNotes: 'Desmontagem controlada; componentes identificados por OS (exemplo).',
        partsDisposition: 'Substituir',
        diagnosis: 'Vedação desgastada e perda de pressão. Diagnóstico demonstrativo.',
        measurements: 'Medições dimensionais registradas — valores fictícios para DEV.',
        repairRecommendation: 'Substituir jogo de vedações e executar teste de estanqueidade.',
        approvalRequired: true,
        approvalStatus: 'Aprovada',
        approvalReference: 'AUT-DEV-001',
        materialStatus: 'Disponível',
        workPerformed: 'Jogo de vedações substituído e conjunto remontado (exemplo DEV).',
        testResult: 'Aprovado',
        qualityApproved: true,
        dispatchMethod: 'Transportadora',
        dispatchReference: 'RASTREIO-DEV-001',
        dispatchNotes: 'Embalagem conferida; comprovante fictício de demonstração.',
        dispatched: true,
        photos: Object.fromEntries(Object.entries(photoCategories).map(([category, label]) => [category, [{
            id: `${orderNumber}:${category}:demo`,
            name: `EXEMPLO DEV — ${label} (substituir por foto)`,
            type: 'application/x-demo',
            size: 0,
            lastModified: now.getTime(),
            demo: true,
        }]])),
        currentStep: 0,
        status: 'Recebido',
    };
};

const serviceEntryDateLabel = (value) => {
    if (!value) return '—';

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('pt-BR');
};

const ServiceEntrySection = ({ title, description, children }) => (
    <section className="service-entry-section">
        <div className="service-entry-section-header">
            <div>
                <h2>{title}</h2>

                {description && (
                    <p>{description}</p>
                )}
            </div>
        </div>

        <div className="service-entry-grid">
            {children}
        </div>
    </section>
);

const ServiceEntryPhotoField = ({ label, photos = [], onFiles, onRemove, hint }) => {
    const [previews, setPreviews] = useState({});

    const selectFiles = async (event) => {
        const files = Array.from(event.target.files || []);
        const nextPreviews = {};
        files.forEach(file => {
            const key = `${file.name}-${file.lastModified}-${file.size}`;
            nextPreviews[key] = URL.createObjectURL(file);
        });
        setPreviews(prev => ({ ...prev, ...nextPreviews }));
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
                    {photos.map(photo => {
                        const previewKey = `${photo.name}-${photo.lastModified || ''}-${photo.size || ''}`;
                        return (
                            <div className="service-entry-photo-item" key={photo.id}>
                                {previews[previewKey]
                                    ? <img src={previews[previewKey]} alt={`Foto: ${photo.name}`} />
                                    : <span className="service-entry-photo-placeholder">{photo.demo ? 'DEMO' : 'IMG'}</span>}
                                <span title={photo.name}>{photo.name}</span>
                                <button type="button" onClick={() => onRemove(photo)}>Remover</button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const ServiceEntryView = () => {
    const [form, setForm] = useState(() => createEmptyServiceEntry());
    const [entries, setEntries] = useState(() => loadServiceEntries());
    const [step, setStep] = useState(0);
    const [error, setError] = useState('');
    const [savedOrder, setSavedOrder] = useState('');
    const [deletingOrderId, setDeletingOrderId] = useState('');

    const set = (key, value) => {
        setForm(prev => ({
            ...prev,
            [key]: value,
        }));

        if (error) setError('');
        if (savedOrder) setSavedOrder('');
    };

    const reset = () => {
        setForm(createEmptyServiceEntry());
        setStep(0);
        setError('');
        setSavedOrder('');
    };

    const fillDemo = () => {
        setForm(createDemoServiceEntry());
        setStep(0);
        setError('');
        setSavedOrder('');
    };

    const validateStep = () => {
        const requiredByStep = {
            0: [
                ['orderType', 'Categoria do equipamento'],
                ['orderNumber', 'Nº da ordem'],
                ['client', 'Cliente'],
                ['equipment', 'Equipamento'],
            ],
            1: [['receivedBy', 'Responsável pelo recebimento'], ['arrivalCondition', 'Condição de chegada']],
            2: [['disassemblyOperator', 'Responsável pela desmontagem']],
            3: [['diagnosis', 'Diagnóstico'], ['partsDisposition', 'Destino das peças']],
            4: [['workPerformed', 'Serviço executado'], ['testResult', 'Resultado dos testes']],
            5: [['dispatchMethod', 'Forma de expedição']],
        };
        const missing = (requiredByStep[step] || [])
            .filter(([key]) => !String(form[key] || '').trim())
            .map(([, label]) => label);

        if (step === 1 && (form.photos.arrival || []).length === 0) missing.push('ao menos uma foto da chegada');
        if (step === 1 && (form.pressureState !== 'Aliviada/verificada' && form.pressureState !== 'Não aplicável' || !form.safetyReviewed || !form.safeToDisassemble)) {
            setError('Desmontagem bloqueada: confirme pressão aliviada (ou não aplicável), conclua a checagem e libere a abertura.');
            return false;
        }
        if (step === 2) {
            if (form.pressureState !== 'Aliviada/verificada' && form.pressureState !== 'Não aplicável') {
                setError('Desmontagem bloqueada: confirme pressão aliviada ou registre que não se aplica.');
                return false;
            }
            if (!form.safetyReviewed || !form.safeToDisassemble) {
                setError('Desmontagem bloqueada: conclua a checagem de segurança e libere a abertura.');
                return false;
            }
            if (!form.disassemblyComplete) missing.push('confirmação da desmontagem');
            if (!form.disassemblyControlled || !form.partsSeparated) missing.push('desmontagem controlada e separação das peças');
            if ((form.photos.disassembly || []).length === 0) missing.push('foto da desmontagem');
        }
        if (step === 3 && form.approvalRequired && form.approvalStatus !== 'Aprovada') {
            setError('A OS fica aguardando aprovação do cliente antes de avançar para execução.');
            return false;
        }
        if (step === 4) {
            if (form.testResult !== 'Aprovado') missing.push('teste aprovado');
            if (!form.qualityApproved) missing.push('liberação da Qualidade');
            if ((form.photos.execution || []).length === 0) missing.push('evidência fotográfica da execução/teste');
        }
        if (step === 5 && !form.dispatched) missing.push('confirmação da expedição/entrega');

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
        const duplicate = entries.find(entry =>
            entry.id !== form.id && normalizeOrderNumber(entry.orderNumber) === normalizeOrderNumber(form.orderNumber)
        );
        if (duplicate) {
            setError(`A ${normalizeOrderNumber(form.orderNumber)} já foi cadastrada nesta demonstração.`);
            return false;
        }

        const photos = { ...form.photos };
        try {
            for (const category of Object.keys(photos)) {
                photos[category] = await Promise.all((photos[category] || []).map(async photo => {
                    if (!photo.file) return photo;
                    await storeServiceEntryPhoto(photo.id, photo.file);
                    const { file, previewUrl, lastModified, ...metadata } = photo;
                    return metadata;
                }));
            }
        }
        catch (storageError) {
            setError(storageError.message || 'Não foi possível guardar as fotos neste navegador.');
            return false;
        }

        const entry = {
            ...form,
            id: normalizedId,
            orderNumber: normalizeOrderNumber(form.orderNumber),
            photos,
            status: statusOverride || SERVICE_ENTRY_STEPS[stepOverride].status,
            currentStep: stepOverride,
            createdAt: form.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        const next = [entry, ...entries.filter(item => item.id !== normalizedId)];
        setEntries(next);
        saveServiceEntries(next);
        setForm(entry);
        setSavedOrder(normalizedId);
        return true;
    };

    const addPhotos = async (category, files) => {
        const orderId = form.id || normalizeOrderNumber(form.orderNumber);
        if (!orderId) {
            setError('Preencha e salve os dados da OS antes de anexar fotos.');
            return;
        }
        try {
            const uploaded = await Promise.all(files.map(async file => {
                const id = `${orderId}:${category}:${crypto.randomUUID()}`;
                await storeServiceEntryPhoto(id, file);
                return { id, name: file.name, type: file.type, size: file.size, lastModified: file.lastModified };
            }));
            setForm(prev => ({
                ...prev,
                photos: { ...prev.photos, [category]: [...(prev.photos[category] || []), ...uploaded] },
            }));
            setError('');
        }
        catch (storageError) {
            setError(storageError.message || 'Não foi possível anexar as fotos.');
        }
    };

    const removePhoto = async (category, photo) => {
        try { await deleteServiceEntryPhoto(photo.id); } catch {}
        setForm(prev => ({
            ...prev,
            photos: { ...prev.photos, [category]: (prev.photos[category] || []).filter(item => item.id !== photo.id) },
        }));
    };

    const advance = async () => {
        if (!validateStep()) return;
        if (step === SERVICE_ENTRY_STEPS.length - 1) {
            if (await persistEntry('Finalizado')) setError('');
            return;
        }
        const nextStep = step + 1;
        if (await persistEntry(undefined, nextStep)) {
            setStep(nextStep);
            setForm(prev => ({ ...prev, currentStep: nextStep }));
        }
    };

    const saveProgress = async () => {
        const blocked = (step === 1 || step === 2) && (
            !form.safeToDisassemble || !form.safetyReviewed ||
            (form.pressureState !== 'Aliviada/verificada' && form.pressureState !== 'Não aplicável')
        );
        const awaitingApproval = step === 3 && form.approvalRequired && form.approvalStatus !== 'Aprovada';
        await persistEntry(blocked ? 'Bloqueado por segurança' : awaitingApproval ? 'Aguardando aprovação' : undefined);
    };

    const openEntry = (entry) => {
        setForm({ ...createEmptyServiceEntry(), ...entry, photos: { ...createEmptyServiceEntry().photos, ...(entry.photos || {}) } });
        setStep(Math.max(0, Math.min(entry.currentStep || 0, SERVICE_ENTRY_STEPS.length - 1)));
        setError('');
        setSavedOrder(entry.id);
        requestAnimationFrame(() => document.querySelector('.service-entry-stepper')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    };

    const deleteEntry = async (entry) => {
        const confirmed = window.confirm(`Excluir a OS ${entry.orderNumber} e as fotos salvas neste navegador? Esta ação não pode ser desfeita.`);
        if (!confirmed) return;

        setDeletingOrderId(entry.id);
        try {
            const photos = [
                ...Object.values(entry.photos || {}).flat(),
                ...(form.id === entry.id ? Object.values(form.photos || {}).flat() : []),
            ];
            const photoIds = new Set(photos.map(photo => photo.id).filter(Boolean));
            for (const photoId of photoIds) await deleteServiceEntryPhoto(photoId);

            const next = entries.filter(item => item.id !== entry.id);
            setEntries(next);
            saveServiceEntries(next);
            if (form.id === entry.id) reset();
        }
        catch {
            setError(`Não foi possível excluir a OS ${entry.orderNumber}. Tente novamente.`);
        }
        finally {
            setDeletingOrderId('');
        }
    };

    const changeStep = (nextStep) => {
        const furthestReachedStep = Math.max(step, Number(form.currentStep) || 0);
        if (nextStep <= furthestReachedStep) {
            setStep(nextStep);
            setError('');
        }
    };

    const currentStep = SERVICE_ENTRY_STEPS[step];

    return (
        <div className="p-4 md:p-6 space-y-5 service-entry-page">

            {SHOW_DEV_GUIDES && (
                <LizyReferenceCard
                    source="Serviços → Desmontagem → Criar Ordem"
                    detail="Fluxo operacional da chegada à expedição; fotos e registros ficam salvos localmente neste navegador."
                />
            )}

            <div className="service-entry-hero rkm-card">
                <div className="flex-1 min-w-0">
                    <div className="service-entry-kicker">
                        Ciclo operacional · Entrada
                    </div>

                    <h1>{form.id ? `OS ${form.orderNumber}` : 'Criar ordem de serviço'}</h1>

                    <p>
                        Registre a entrada da peça ou equipamento e reúna as
                        informações necessárias antes da peritagem.
                    </p>
                </div>

                <div className="service-entry-hero-controls">
                    {SHOW_DEV_GUIDES && <button type="button" className="btn btn-ghost service-entry-demo-fill" onClick={fillDemo}>Preencher exemplo DEV</button>}
                    <div className="service-entry-hero-status">
                        <span className="service-entry-status-dot" />

                        {form.status || currentStep.status}
                    </div>
                </div>
            </div>

            <section className="rkm-card service-entry-history">
                <div className="service-entry-history-head">
                    <div>
                        <div className="text-sm font-semibold">
                            Ordens em acompanhamento
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                            Registros criados nesta demonstração.
                        </div>
                    </div>

                    <span className="service-entry-count">
                        {entries.length}
                    </span>
                </div>

                {entries.length === 0 ? (
                    <div className="service-entry-empty">
                        Nenhuma ordem criada ainda.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="service-entry-table">
                            <thead>
                                <tr>
                                    <th>OS</th>
                                    <th>Cliente</th>
                                    <th>Equipamento</th>
                                    <th>Entrega</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {entries.slice(0, 8).map(entry => {
                                    const isSelected = form.id === entry.id;
                                    return (
                                    <tr
                                        key={entry.id}
                                        className={isSelected ? 'is-selected' : ''}
                                        tabIndex={0}
                                        aria-current={isSelected ? 'true' : undefined}
                                        onClick={() => { if (!isSelected) openEntry(entry); }}
                                        onKeyDown={event => {
                                            if (event.target !== event.currentTarget) return;
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                if (!isSelected) openEntry(entry);
                                            }
                                        }}
                                    >
                                        <td>
                                            <strong>{entry.orderNumber}</strong>

                                            {entry.urgent && (
                                                <span className="service-entry-urgent-tag">
                                                    URGENTE
                                                </span>
                                            )}
                                        </td>

                                        <td>{entry.client}</td>

                                        <td>
                                            <div>{entry.equipment}</div>
                                            <small>
                                                {entry.manufacturer}
                                                {entry.model ? ` · ${entry.model}` : ''}
                                            </small>
                                        </td>

                                        <td>{serviceEntryDateLabel(entry.expectedDeliveryDate)}</td>

                                        <td>
                                            <span className={`tag ${entry.status === 'Bloqueado por segurança' ? 'tag-red' : 'tag-blue'}`}>
                                                {entry.status || 'Recebido'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="service-entry-open-actions">
                                                <button type="button" className="btn btn-ghost service-entry-open" onClick={event => { event.stopPropagation(); openEntry(entry); }} aria-pressed={isSelected} disabled={isSelected}>
                                                    {isSelected ? 'Selecionada' : 'Abrir OS'}
                                                </button>
                                                {isSelected && (
                                                    <button
                                                        type="button"
                                                        className="service-entry-deselect"
                                                        aria-label={`Desselecionar OS ${entry.orderNumber}`}
                                                        title="Desselecionar OS"
                                                        onClick={event => { event.stopPropagation(); reset(); }}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="service-entry-delete"
                                                    aria-label={`Excluir OS ${entry.orderNumber}`}
                                                    title={`Excluir OS ${entry.orderNumber}`}
                                                    disabled={deletingOrderId === entry.id}
                                                    onClick={event => { event.stopPropagation(); deleteEntry(entry); }}
                                                >
                                                    {deletingOrderId === entry.id ? 'Excluindo…' : 'Excluir'}
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

            {savedOrder && (
                <div className="service-entry-success">
                    <div className="service-entry-success-icon">✓</div>

                    <div>
                        <strong>{savedOrder} · {form.status === 'Finalizado' ? 'OS finalizada' : 'progresso salvo'}</strong>

                        <span>A OS e as fotos estão salvas neste navegador. O fluxo ainda não sincroniza com servidor.</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert-critical rounded-lg p-4 text-xs">
                    {error}
                </div>
            )}

            <div className="service-entry-stepper" aria-label="Etapas do ciclo operacional">
                {SERVICE_ENTRY_STEPS.map((item, index) => (
                    <button type="button" key={item.id} className={`service-entry-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => changeStep(index)} aria-current={step === index ? 'step' : undefined}>
                        <span>{step > index ? '✓' : index + 1}</span><strong>{item.label}</strong>
                    </button>
                ))}
            </div>

            <div className="service-entry-step-context">
                <span>ETAPA {step + 1} DE {SERVICE_ENTRY_STEPS.length}</span>
                <strong>{currentStep.label}</strong>
                <small>{form.id ? `OS ${form.orderNumber} · ${form.status || currentStep.status}` : 'Salve a primeira etapa para abrir a OS e continuar o acompanhamento.'}</small>
            </div>

            <form className="rkm-card service-entry-form" onSubmit={event => { event.preventDefault(); advance(); }}>
                {step === 0 && <>
                <ServiceEntrySection
                    title="Dados da ordem"
                    description="Registre o que é conhecido na entrada. Dados ainda indisponíveis podem ser complementados depois."
                >
                    <Field
                        label="Categoria do equipamento"
                        required
                        className="md:col-span-3"
                    >
                        <div
                            className="service-entry-order-types"
                            role="radiogroup"
                            aria-label="Categoria do equipamento"
                        >
                            {[
                                'Cilindro',
                                'Acumulador',
                                'Bomba',
                                'Motor hidráulico',
                                'Outro',
                            ].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    role="radio"
                                    aria-checked={form.orderType === type}
                                    className={
                                        'service-entry-order-type ' +
                                        (
                                            form.orderType === type
                                                ? 'is-active'
                                                : ''
                                        )
                                    }
                                    onClick={() => set('orderType', type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </Field>

                    <Field label="Nº da ordem" required hint={form.id ? 'Identificador fixo após a abertura da OS.' : undefined}>
                        <TextInput
                            value={form.orderNumber}
                            onChange={value => set('orderNumber', value)}
                            placeholder="Ex.: 2541"
                            disabled={!!form.id}
                        />
                    </Field>

                    <Field label="Nº da ordem anterior">
                        <TextInput
                            value={form.previousOrderNumber}
                            onChange={value => set('previousOrderNumber', value)}
                            placeholder="Opcional"
                        />
                    </Field>

                    <Field label="Data de abertura">
                        <TextInput
                            type="date"
                            value={form.openingDate}
                            onChange={value => set('openingDate', value)}
                        />
                    </Field>

                    <Field
                        label="Data prevista de entrega"
                        hint="Opcional — deixe em branco quando não houver prazo informado."
                    >
                        <TextInput
                            type="date"
                            value={form.expectedDeliveryDate}
                            onChange={value =>
                                set('expectedDeliveryDate', value)
                            }
                        />
                    </Field>

                    <Field label="Prioridade">
                        <Toggle
                            checked={form.urgent}
                            onChange={value => set('urgent', value)}
                            label="Atendimento urgente"
                        />
                    </Field>
                </ServiceEntrySection>

                <ServiceEntrySection
                    title="Cliente e solicitação"
                    description="Origem da ordem e referência administrativa."
                >
                    <Field
                        label="Cliente"
                        required
                        className="md:col-span-2"
                    >
                        <TextInput
                            value={form.client}
                            onChange={value => set('client', value)}
                            placeholder="Nome ou razão social"
                        />
                    </Field>

                    <Field label="Referência do cliente">
                        <TextInput
                            value={form.clientReference}
                            onChange={value => set('clientReference', value)}
                            placeholder="Pedido, chamado, referência..."
                        />
                    </Field>

                    <Field label="Solicitante">
                        <TextInput
                            value={form.requester}
                            onChange={value => set('requester', value)}
                            placeholder="Pessoa responsável"
                        />
                    </Field>

                    <Field
                        label="Nº da nota"
                        hint="Opcional — não use N.I.; deixe em branco quando não houver documento informado."
                    >
                        <TextInput
                            value={form.invoiceNumber}
                            onChange={value => set('invoiceNumber', value)}
                            placeholder="NF / documento de entrada"
                        />
                    </Field>
                </ServiceEntrySection>

                <ServiceEntrySection
                    title="Equipamento"
                    description="Identificação técnica inicial do item recebido."
                >
                    <Field label="Nº de série">
                        <TextInput
                            value={form.serialNumber}
                            onChange={value => set('serialNumber', value)}
                            placeholder="Número de série"
                        />
                    </Field>

                    <Field
                        label="Fabricante"
                        hint="Opcional — deixe em branco quando o fabricante não estiver identificado."
                    >
                        <TextInput
                            value={form.manufacturer}
                            onChange={value => set('manufacturer', value)}
                            placeholder="Ex.: Parker, HYDAC..."
                        />
                    </Field>

                    <Field
                        label="Equipamento"
                        required
                        className="md:col-span-2"
                    >
                        <TextInput
                            value={form.equipment}
                            onChange={value => set('equipment', value)}
                            placeholder="Descrição do equipamento"
                        />
                    </Field>

                    <Field
                        label="Modelo"
                        hint="Opcional — deixe em branco quando o modelo não estiver identificado."
                    >
                        <TextInput
                            value={form.model}
                            onChange={value => set('model', value)}
                            placeholder="Modelo"
                        />
                    </Field>

                    <Field label="Tipo">
                        <div className="service-entry-type-options">
                            <Toggle
                                checked={form.hydraulic}
                                onChange={value => set('hydraulic', value)}
                                label="Hidráulico"
                            />

                            <Toggle
                                checked={form.pneumatic}
                                onChange={value => set('pneumatic', value)}
                                label="Pneumático"
                            />
                        </div>
                    </Field>

                    <Field
                        label="Fluido / aplicação"
                        className="md:col-span-2"
                    >
                        <TextInput
                            value={form.fluidApplication}
                            onChange={value => set('fluidApplication', value)}
                            placeholder="Fluido utilizado e aplicação"
                        />
                    </Field>

                    <Field
                        label="Defeito alegado"
                        className="md:col-span-3"
                    >
                        <TextArea
                            rows={3}
                            value={form.claimedDefect}
                            onChange={value => set('claimedDefect', value)}
                            placeholder="Descreva o problema relatado pelo cliente..."
                        />
                    </Field>
                </ServiceEntrySection>

                <ServiceEntrySection
                    title="Atendimento e logística"
                    description="Responsáveis e informações de movimentação do equipamento."
                >
                    <Field label="Localização do equipamento">
                        <TextInput
                            value={form.equipmentLocation}
                            onChange={value =>
                                set('equipmentLocation', value)
                            }
                            placeholder="Bancada, setor, área..."
                        />
                    </Field>

                    <Field label="Responsável pelo atendimento">
                        <TextInput
                            value={form.serviceResponsible}
                            onChange={value =>
                                set('serviceResponsible', value)
                            }
                            placeholder="Responsável RKM"
                        />
                    </Field>

                    <Field label="Técnico perito">
                        <TextInput
                            value={form.expertTechnician}
                            onChange={value =>
                                set('expertTechnician', value)
                            }
                            placeholder="Técnico responsável"
                        />
                    </Field>

                    <Field
                        label="Observações de expedição"
                        className="md:col-span-3"
                    >
                        <TextArea
                            rows={3}
                            value={form.shippingNotes}
                            onChange={value => set('shippingNotes', value)}
                            placeholder="Transporte, acondicionamento, retirada, entrega..."
                        />
                    </Field>
                </ServiceEntrySection>
                </>}

                {step === 1 && <>
                    <ServiceEntrySection title="Condição da chegada" description="Registre a cadeia de recebimento e o estado da peça antes de qualquer abertura.">
                        <Field label="Recebido por" required><TextInput value={form.receivedBy} onChange={value => set('receivedBy', value)} placeholder="Pessoa que recebeu" /></Field>
                        <Field label="Entregue por"><TextInput value={form.deliveredBy} onChange={value => set('deliveredBy', value)} placeholder="Motorista / cliente" /></Field>
                        <Field label="Condição externa" required><select className="rkm-input zenit-field" value={form.arrivalCondition} onChange={event => set('arrivalCondition', event.target.value)}><option value="">Selecione</option><option>Íntegra</option><option>Com avarias</option><option>Vazamento / contaminação</option><option>Embalagem violada</option><option>Não foi possível avaliar</option></select></Field>
                        <Field label="Acessórios / itens recebidos" className="md:col-span-2"><TextArea rows={2} value={form.receivedAccessories} onChange={value => set('receivedAccessories', value)} placeholder="Conexões, válvulas, peças soltas, embalagem..." /></Field>
                        <div className="md:col-span-3"><ServiceEntryPhotoField label="Fotos da chegada *" hint="Fotografe a peça inteira, plaqueta/série, avarias e acessórios ainda como recebidos." photos={form.photos.arrival} onFiles={files => addPhotos('arrival', files)} onRemove={photo => removePhoto('arrival', photo)} /></div>
                    </ServiceEntrySection>
                    <ServiceEntrySection title="Triagem de segurança" description="A desmontagem só libera após checar energia/pressão residual e condição segura.">
                        <Field label="Estado da pressão *"><select className="rkm-input zenit-field" value={form.pressureState} onChange={event => set('pressureState', event.target.value)}><option>Desconhecida</option><option>Pressão residual</option><option>Aliviada/verificada</option><option>Não aplicável</option></select></Field>
                        <Field label="Checagem feita"><Toggle checked={form.safetyReviewed} onChange={value => set('safetyReviewed', value)} label="Risco, fluido e condição avaliados" /></Field>
                        <Field label="Liberação para abrir"><Toggle checked={form.safeToDisassemble} onChange={value => set('safeToDisassemble', value)} label="Peça segura para desmontagem" /></Field>
                        {(form.pressureState === 'Desconhecida' || form.pressureState === 'Pressão residual' || !form.safeToDisassemble) && <div className="service-entry-blocked md:col-span-3">A OS fica bloqueada para desmontagem até confirmar pressão aliviada (ou não aplicável) e liberar a condição segura.</div>}
                    </ServiceEntrySection>
                </>}

                {step === 2 && <>
                    <ServiceEntrySection title="Desmontagem controlada" description="Preserve a identidade da OS e registre como os componentes foram encontrados.">
                        <Field label="Responsável pela desmontagem *"><TextInput value={form.disassemblyOperator} onChange={value => set('disassemblyOperator', value)} placeholder="Técnico" /></Field>
                        <Field label="Início"><TextInput type="datetime-local" value={form.disassemblyStartedAt} onChange={value => set('disassemblyStartedAt', value)} /></Field>
                        <Field label="Desmontagem concluída"><Toggle checked={form.disassemblyComplete} onChange={value => set('disassemblyComplete', value)} label="Abertura concluída" /></Field>
                        <Field label="Controles do processo" className="md:col-span-3"><div className="service-entry-checks"><Toggle checked={form.disassemblyControlled} onChange={value => set('disassemblyControlled', value)} label="Abertura controlada e ferramentas compatíveis" /><Toggle checked={form.partsSeparated} onChange={value => set('partsSeparated', value)} label="Componentes separados e identificados por OS" /><Toggle checked={form.oilCollected} onChange={value => set('oilCollected', value)} label="Óleo/resíduo contido e destinado" /></div></Field>
                        <Field label="Observações da desmontagem" className="md:col-span-3"><TextArea rows={3} value={form.disassemblyNotes} onChange={value => set('disassemblyNotes', value)} placeholder="Sequência, travamentos, danos observados ao abrir..." /></Field>
                        <div className="md:col-span-3"><ServiceEntryPhotoField label="Evidências da desmontagem *" hint="Registre a abertura e os componentes antes de limpar ou substituir peças." photos={form.photos.disassembly} onFiles={files => addPhotos('disassembly', files)} onRemove={photo => removePhoto('disassembly', photo)} /></div>
                    </ServiceEntrySection>
                </>}

                {step === 3 && <>
                    <ServiceEntrySection title="Diagnóstico e destino dos componentes" description="Documente achados, medições e recomendação do técnico.">
                        <Field label="Diagnóstico técnico *" className="md:col-span-3"><TextArea rows={4} value={form.diagnosis} onChange={value => set('diagnosis', value)} placeholder="Causa provável, danos e conclusão da peritagem..." /></Field>
                        <Field label="Medições / tolerâncias" className="md:col-span-2"><TextArea rows={3} value={form.measurements} onChange={value => set('measurements', value)} placeholder="Dimensões, folgas, pressão, valores de referência..." /></Field>
                        <Field label="Destino das peças *"><select className="rkm-input zenit-field" value={form.partsDisposition} onChange={event => set('partsDisposition', event.target.value)}><option value="">Selecione</option><option>Reaproveitar</option><option>Substituir</option><option>Enviar para análise</option><option>Condenar</option></select></Field>
                        <Field label="Recomendação / escopo" className="md:col-span-3"><TextArea rows={3} value={form.repairRecommendation} onChange={value => set('repairRecommendation', value)} placeholder="Serviços e peças recomendados para orçamento/laudo..." /></Field>
                        <Field label="Exige aprovação do cliente"><Toggle checked={form.approvalRequired} onChange={value => set('approvalRequired', value)} label="Aguardar autorização antes do reparo" /></Field>
                        {form.approvalRequired && <>
                            <Field label="Status da aprovação"><select className="rkm-input zenit-field" value={form.approvalStatus} onChange={event => set('approvalStatus', event.target.value)}><option>Pendente</option><option>Aprovada</option><option>Reprovada</option><option>Ajuste solicitado</option></select></Field>
                            <Field label="Referência da aprovação"><TextInput value={form.approvalReference} onChange={value => set('approvalReference', value)} placeholder="E-mail, pedido ou autorização" /></Field>
                        </>}
                        <Field label="Disponibilidade de material"><select className="rkm-input zenit-field" value={form.materialStatus} onChange={event => set('materialStatus', event.target.value)}><option>A verificar</option><option>Disponível</option><option>Aguardando compra</option><option>Não necessário</option></select></Field>
                        <div className="md:col-span-3"><ServiceEntryPhotoField label="Fotos dos achados" photos={form.photos.diagnosis} onFiles={files => addPhotos('diagnosis', files)} onRemove={photo => removePhoto('diagnosis', photo)} /></div>
                    </ServiceEntrySection>
                </>}

                {step === 4 && <>
                    <ServiceEntrySection title="Execução, teste e qualidade" description="Registre o que foi feito e só libere após teste e validação da Qualidade.">
                        <Field label="Serviço executado *" className="md:col-span-3"><TextArea rows={4} value={form.workPerformed} onChange={value => set('workPerformed', value)} placeholder="Reparo, componentes substituídos, ajustes e referência à IT aplicada..." /></Field>
                        <Field label="Resultado dos testes *"><select className="rkm-input zenit-field" value={form.testResult} onChange={event => set('testResult', event.target.value)}><option value="">Selecione</option><option>Aprovado</option><option>Reprovado</option><option>Não aplicável</option></select></Field>
                        <Field label="Liberação da Qualidade"><Toggle checked={form.qualityApproved} onChange={value => set('qualityApproved', value)} label="Inspeção final aprovada" /></Field>
                        <div className="md:col-span-3"><ServiceEntryPhotoField label="Fotos da execução e teste *" photos={form.photos.execution} onFiles={files => addPhotos('execution', files)} onRemove={photo => removePhoto('execution', photo)} /></div>
                    </ServiceEntrySection>
                </>}

                {step === 5 && <>
                    <ServiceEntrySection title="Expedição e encerramento" description="Registre acondicionamento, saída e confirmação de entrega.">
                        <Field label="Forma de expedição *"><select className="rkm-input zenit-field" value={form.dispatchMethod} onChange={event => set('dispatchMethod', event.target.value)}><option value="">Selecione</option><option>Retirada pelo cliente</option><option>Transportadora</option><option>Entrega RKM</option></select></Field>
                        <Field label="Rastreio / comprovante"><TextInput value={form.dispatchReference} onChange={value => set('dispatchReference', value)} placeholder="Código ou referência de entrega" /></Field>
                        <Field label="Saída confirmada"><Toggle checked={form.dispatched} onChange={value => set('dispatched', value)} label="Peça expedida / entregue" /></Field>
                        <Field label="Observações de expedição" className="md:col-span-3"><TextArea rows={3} value={form.dispatchNotes} onChange={value => set('dispatchNotes', value)} placeholder="Embalagem, responsável pela retirada e observações..." /></Field>
                        <div className="md:col-span-3"><ServiceEntryPhotoField label="Evidência final / embalagem" photos={form.photos.dispatch} onFiles={files => addPhotos('dispatch', files)} onRemove={photo => removePhoto('dispatch', photo)} /></div>
                    </ServiceEntrySection>
                </>}

                <div className="service-entry-actions service-entry-step-actions">
                    <button type="button" className="btn btn-ghost" onClick={reset}>Nova OS</button>
                    <div className="service-entry-action-group">
                        {step > 0 && <button type="button" className="btn btn-ghost" onClick={() => changeStep(step - 1)}>Voltar</button>}
                        {form.id && <button type="button" className="btn btn-ghost" onClick={saveProgress}>Salvar progresso</button>}
                        <button type="submit" className="btn btn-primary service-entry-save">{step === SERVICE_ENTRY_STEPS.length - 1 ? 'Finalizar OS' : 'Salvar e continuar'}</button>
                    </div>
                </div>
            </form>

        </div>
    );
};


/* ============================================================
   VIEW — Minha Bancada (Operador / Técnico)
   ============================================================ */

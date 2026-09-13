// @ts-nocheck

/*
 * Shared Service Entry domain primitives.
 *
 * Keep this module free from React and browser persistence so
 * ServiceEntryView and import/populator workflows can reuse
 * the same defaults and normalization rules.
 */

export const SERVICE_ENTRY_STEPS = [
    { id: 'receiving', label: 'Recebimento', status: 'Recebido' },
    { id: 'triage', label: 'Condição e segurança', status: 'Em triagem' },
    { id: 'disassembly', label: 'Desmontagem', status: 'Aguardando desmontagem' },
    { id: 'diagnosis', label: 'Diagnóstico e aprovação', status: 'Em diagnóstico' },
    { id: 'execution', label: 'Execução e qualidade', status: 'Em execução' },
    { id: 'dispatch', label: 'Expedição', status: 'Pronto para expedição' },
];

export const createEmptyServiceEntry = () => ({
    orderType: '',
    orderNumber: '',
    previousOrderNumber: '',
    expectedDeliveryDate: '',
    urgent: false,

    client: '',
    clientReference: '',
    requester: '',
    openingDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: '',

    serialNumber: '',
    manufacturer: '',
    equipment: '',
    model: '',
    claimedDefect: '',

    shippingNotes: '',
    equipmentLocation: '',
    serviceResponsible: '',
    expertTechnician: '',

    hydraulic: true,
    pneumatic: false,
    fluidApplication: '',
    receivedBy: '',
    deliveredBy: '',
    arrivalCondition: '',
    receivedAccessories: '',
    pressureState: 'Desconhecida',
    safetyReviewed: false,
    safeToDisassemble: false,
    disassemblyOperator: '',
    disassemblyStartedAt: '',
    disassemblyComplete: false,
    disassemblyControlled: false,
    partsSeparated: false,
    oilCollected: false,
    disassemblyNotes: '',
    partsDisposition: '',
    diagnosis: '',
    measurements: '',
    repairRecommendation: '',
    approvalRequired: false,
    approvalStatus: 'Pendente',
    materialStatus: 'A verificar',
    approvalReference: '',
    workPerformed: '',
    testResult: '',
    qualityApproved: false,
    dispatchMethod: '',
    dispatchReference: '',
    dispatchNotes: '',
    dispatched: false,
    photos: { arrival: [], disassembly: [], diagnosis: [], execution: [], dispatch: [] },
    currentStep: 0,
});

export const normalizeOrderNumber = (value) => {
    const clean = String(value || '').trim().toUpperCase();

    if (!clean) return '';

    return clean.startsWith('OS-')
        ? clean
        : `OS-${clean}`;
};

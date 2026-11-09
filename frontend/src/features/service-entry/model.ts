// @ts-nocheck

/*
 * Shared Service Entry domain primitives.
 *
 * Keep this module free from React and browser persistence so
 * ServiceEntryView and import/populator workflows can reuse
 * the same defaults and normalization rules.
 */

export const generateOrderNumber = () => String(Math.floor(100000 + Math.random() * 900000));

export const SERVICE_ENTRY_DEFAULT_STAGES = [
  { id: 'recebimento', label: 'Recebimento', status: 'Recebido', canView: true },
  { id: 'identificacao', label: 'Identificação', status: 'Em identificação', canView: true },
  { id: 'desmontagem', label: 'Desmontagem', status: 'Em desmontagem', canView: true },
  { id: 'orcamento', label: 'Orçamento', status: 'Em orçamento', canView: true },
  { id: 'reparo', label: 'Reparo', status: 'Em reparo', canView: true },
  { id: 'entrega', label: 'Entrega', status: 'Em entrega', canView: true },
];

const currentLocalDateTime = () => {
  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

  return localNow.toISOString().slice(0, 16);
};

export const createEmptyServiceEntry = () => ({
  orderType: '',
  orderNumber: generateOrderNumber(),
  previousOrderNumber: '',
  expectedDeliveryDate: '',
  urgent: false,

  client: '',
  clientId: null,
  clientReference: '',
  requester: '',
  openingDate: new Date().toISOString().slice(0, 10),
  invoiceNumber: '',
  invoiceFileId: null,
  invoiceFile: null,

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
  arrivalMethod: '',
  receivedBy: '',
  deliveredBy: '',
  receivedAccessories: '',
  disassemblyOperator: '',
  disassemblyStartedAt: currentLocalDateTime(),
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
});

export const normalizeOrderNumber = (value) => {
  const clean = String(value || '')
    .trim()
    .toUpperCase();

  if (!clean) return '';

  return clean.startsWith('OS-') ? clean : `OS-${clean}`;
};

export const getServiceEntryStageIndex = (stages, stage) => {
  const index = stages.findIndex((item) => item.id === stage);
  return index < 0 ? 0 : index;
};

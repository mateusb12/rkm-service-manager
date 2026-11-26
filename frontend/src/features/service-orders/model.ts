// @ts-nocheck

/*
 * Shared Service Entry domain primitives.
 *
 * Keep this module free from React and browser persistence so
 * ServiceOrderView and import/populator workflows can reuse
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

export const CYLINDER_HEALTH_COMPONENTS = ['Camisa', 'Haste', 'Êmbolo', 'Cabeçote', 'Vedação', 'Articulação'];

export const CYLINDER_OPTIONAL_ITEMS = CYLINDER_HEALTH_COMPONENTS;

export const CYLINDER_ORDER_TYPES = ['Cilindro hidráulico', 'Cilindro pneumático'];

export const isCylinderOrderType = (orderType) => orderType === 'Cilindro' || CYLINDER_ORDER_TYPES.includes(orderType);

const LEGACY_CYLINDER_COMPONENTS = {
  'Cabeçote dianteiro': 'Cabeçote',
  'Cabeçote traseiro': 'Cabeçote',
  Vedações: 'Vedação',
  'Articulação dianteira': 'Articulação',
  'Articulação traseira': 'Articulação',
  Garfo: 'Articulação',
  Conexão: 'Articulação',
  Olhal: 'Articulação',
  Munhão: 'Articulação',
  Outros: null,
  Outro: null,
};

export const normalizeCylinderComponent = (component) => LEGACY_CYLINDER_COMPONENTS[component] || component;

export const normalizeCylinderComponents = (components = []) => [
  ...new Set(components.map(normalizeCylinderComponent).filter((component) => CYLINDER_HEALTH_COMPONENTS.includes(component))),
];

export const createEmptyDisassemblyChecklist = (components = []) =>
  components.map((component) => ({
    component,
    status: '',
    notes: '',
    budgetItem: '',
    budgetItemId: null,
    budgetUnit: '',
    budgetUnitPriceCents: 0,
    budgetQuantity: '',
    budgetItems: [],
  }));

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
  cylinderInternalDiameter: '',
  cylinderExternalDiameter: '',
  cylinderLength: '',
  cylinderStroke: '',
  cylinderRodDiameter: '',
  cylinderOptionalItems: [],
  cylinderOptionalItemsOther: '',

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
  disassemblyChecklist: createEmptyDisassemblyChecklist(),
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

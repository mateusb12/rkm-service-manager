import { createEmptyServiceEntry } from './model';

export const createDemoServiceEntry = () => {
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  const expectedDate = new Date(now);
  expectedDate.setDate(expectedDate.getDate() + 10);
  const localExpectedDate = new Date(
    expectedDate.getTime() - expectedDate.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);
  const orderNumber = `DEV-${String(now.getTime()).slice(-6)}`;
  const photoCategories = {
    arrival: 'Chegada',
    disassembly: 'Desmontagem',
    diagnosis: 'Achados',
    execution: 'Reparo',
    dispatch: 'Entrega',
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
    arrivalMethod: 'coleta_cliente',
    receivedBy: 'Operador de recebimento DEV',
    deliveredBy: 'Transportadora de exemplo',
    receivedAccessories: 'Conexões e tampa de proteção (exemplo).',
    disassemblyOperator: 'Técnico de desmontagem DEV',
    disassemblyStartedAt: localDateTime,
    disassemblyComplete: true,
    disassemblyControlled: true,
    partsSeparated: true,
    oilCollected: true,
    disassemblyNotes: 'Componentes identificados por OS durante a desmontagem (exemplo).',
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
    photos: Object.fromEntries(
      Object.entries(photoCategories).map(([category, label]) => [
        category,
        [
          {
            id: `${orderNumber}:${category}:demo`,
            name: `EXEMPLO DEV — ${label} (substituir por foto)`,
            type: 'application/x-demo',
            size: 0,
            lastModified: now.getTime(),
            demo: true,
          },
        ],
      ]),
    ),
    status: 'Recebido',
  };
};

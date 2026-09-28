// @ts-nocheck

export const formatDashboardDate = (value) => {
    if (!value) return '—';

    const rawValue = String(value);
    const date = new Date(rawValue.includes('T') ? rawValue : `${rawValue}T12:00:00`);

    return Number.isNaN(date.getTime())
        ? rawValue
        : date.toLocaleDateString('pt-BR');
};

export const mapServiceEntryToDashboardService = (entry) => ({
    id: entry.orderNumber || entry.id,
    client: entry.client || 'Cliente não informado',
    equipment: [entry.equipment, entry.manufacturer].filter(Boolean).join(' • ') || 'Equipamento não informado',
    tech: entry.serviceResponsible || entry.expertTechnician || entry.disassemblyOperator || 'Não atribuído',
    date: formatDashboardDate(entry.updatedAt || entry.openingDate),
    status: entry.status || 'Recebido',
    priority: entry.urgent ? 'Alta' : 'Média',
    step: Number(entry.currentStep || 0) + 1,
    stepTotal: 6,
});

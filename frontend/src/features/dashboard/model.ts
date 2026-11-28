// @ts-nocheck
import { formatDateLabel } from '../../shared/utils/date';

export const formatDashboardDate = formatDateLabel;

export const mapServiceEntryToDashboardService = (entry, stages = []) => {
  const stageIndex = stages.findIndex((stage) => stage.id === entry.stage);

  return {
    id: entry.orderNumber || entry.id,
    client: entry.client || 'Cliente não informado',
    equipment: entry.equipment || 'Equipamento não informado',
    tech: entry.serviceResponsible || entry.expertTechnician || entry.disassemblyOperator || 'Não atribuído',
    date: formatDashboardDate(entry.updatedAt || entry.openingDate),
    status: entry.status || 'Recebido',
    priority: entry.urgent ? 'Alta' : 'Média',
    step: stageIndex < 0 ? 1 : stageIndex + 1,
    stepTotal: stages.length || 6,
  };
};

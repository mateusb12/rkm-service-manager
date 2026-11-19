import { CYLINDER_HEALTH_COMPONENTS } from './model';

const REQUIRED_FIELDS_BY_STAGE = {
  0: [
    ['orderNumber', 'Nº da OS'],
    ['clientId', 'Cliente'],
    ['client', 'Cliente'],
  ],
  1: [
    ['orderType', 'Categoria do equipamento'],
    ['equipment', 'Equipamento'],
    ['arrivalMethod', 'Como chegou'],
    ['receivedBy', 'Responsável pelo recebimento'],
  ],
  2: [['disassemblyOperator', 'Responsável pela desmontagem']],
  3: [
    ['diagnosis', 'Diagnóstico do orçamento'],
    ['partsDisposition', 'Destino das peças'],
  ],
  4: [
    ['workPerformed', 'Serviço executado'],
    ['testResult', 'Resultado dos testes'],
  ],
  5: [['dispatchMethod', 'Forma de entrega']],
};

export const getMissingServiceEntryFields = (form, stageIndex) => {
  const missing = (REQUIRED_FIELDS_BY_STAGE[stageIndex] || [])
    .filter(([key]) => !String(form[key] || '').trim())
    .map(([, label]) => label);

  if (stageIndex === 4) {
    if (form.testResult !== 'Aprovado') missing.push('teste aprovado');
    if ((form.photos.execution || []).length === 0) {
      missing.push('evidência fotográfica da execução/teste');
    }
  }

  if (stageIndex === 2 && form.orderType === 'Cilindro') {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    CYLINDER_HEALTH_COMPONENTS.forEach((component, index) => {
      const item = checklist[index] || { component, status: '', notes: '' };
      if (!item.status) missing.push(`${item.component}: resultado`);
      if (item.status === 'Não conforme' && !String(item.notes || '').trim()) {
        missing.push(`${item.component}: motivo da não conformidade`);
      }
    });
  }

  return missing;
};

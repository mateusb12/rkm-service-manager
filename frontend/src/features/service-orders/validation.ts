import { isCylinderOrderType } from './model';

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
  const missing = (REQUIRED_FIELDS_BY_STAGE[stageIndex] || []).filter(([key]) => !String(form[key] || '').trim()).map(([, label]) => label);

  if (stageIndex === 4) {
    if (form.testResult !== 'Aprovado') missing.push('teste aprovado');
    if ((form.photos.execution || []).length === 0) {
      missing.push('evidência fotográfica da execução/teste');
    }
  }

  if (stageIndex === 2 && isCylinderOrderType(form.orderType)) {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    const selectedComponents = Array.isArray(form.cylinderOptionalItems) ? form.cylinderOptionalItems : [];
    selectedComponents.forEach((component) => {
      const item = checklist.find((checklistItem) => checklistItem.component === component) || { component, status: '', notes: '' };
      if (!item.status) missing.push(`${component}: resultado`);
      if (item.status === 'Não conforme' && !String(item.notes || '').trim()) {
        missing.push(`${component}: motivo da não conformidade`);
      }
    });
  }

  if (stageIndex === 1 && isCylinderOrderType(form.orderType)) {
    [
      ['cylinderInternalDiameter', 'Diâmetro interno do cilindro'],
      ['cylinderExternalDiameter', 'Diâmetro externo do cilindro'],
      ['cylinderLength', 'Comprimento do cilindro'],
      ['cylinderStroke', 'Curso do cilindro'],
      ['cylinderRodDiameter', 'Diâmetro da haste'],
    ].forEach(([key, label]) => {
      if (!String(form[key] || '').trim()) missing.push(label);
    });
  }

  return missing;
};

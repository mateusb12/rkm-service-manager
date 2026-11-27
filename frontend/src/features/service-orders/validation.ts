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
  3: [],
  4: [
    ['workPerformed', 'Serviço executado'],
    ['testResult', 'Resultado dos testes'],
  ],
  5: [['dispatchMethod', 'Forma de entrega']],
};

export const getMissingServiceEntryFields = (form, stageIndex) => {
  if (
    stageIndex === 2 &&
    isCylinderOrderType(form.orderType) &&
    !form.disassemblyTimingVersion &&
    ['orcamento', 'reparo', 'entrega'].includes(form.stage)
  )
    return [];
  const missing = (REQUIRED_FIELDS_BY_STAGE[stageIndex] || []).filter(([key]) => !String(form[key] || '').trim()).map(([, label]) => label);

  if (stageIndex === 3) {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    const budgetLines = checklist
      .filter((item) => item.status === 'Não conforme')
      .flatMap((item) => {
        if (Array.isArray(item.budgetItems) && item.budgetItems.length > 0) return item.budgetItems;
        return item.budgetItem ? [item] : [];
      })
      .filter((line) => String(line.budgetItem || '').trim());

    if (budgetLines.length === 0) {
      missing.push('pelo menos 1 item de orçamento');
    } else if (budgetLines.some((line) => !line.stockReceived)) {
      missing.push('estoque de todos os itens do orçamento');
    }
  }

  if (stageIndex === 4) {
    if (form.testResult !== 'Aprovado') missing.push('teste aprovado');
    if ((form.photos.execution || []).length === 0) {
      missing.push('evidência fotográfica da execução/teste');
    }
  }

  if (stageIndex === 2 && isCylinderOrderType(form.orderType)) {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    const selectedComponents = Array.isArray(form.cylinderOptionalItems) ? form.cylinderOptionalItems : [];
    if (!form.disassemblyTimingVersion) missing.push('início da desmontagem');
    if (form.disassemblyTimingVersion && !form.disassemblyComplete) missing.push('conclusão do checklist');
    if (!selectedComponents.length) missing.push('componentes do cilindro');
    selectedComponents.forEach((component) => {
      const item = checklist.find((checklistItem) => checklistItem.component === component) || { component, status: '', notes: '' };
      if (!item.confirmedAt) missing.push(`${component}: avaliação`);
      if (item.status === 'Não conforme' && !String(item.notes || '').trim()) {
        missing.push(`${component}: motivo da não conformidade`);
      }
    });
  }

  if (stageIndex === 2 && isCylinderOrderType(form.orderType)) {
    [
      ['cylinderInternalDiameter', 'Diâmetro interno do cilindro'],
      ['cylinderExternalDiameter', 'Diâmetro externo do cilindro'],
      ['cylinderLength', 'Comprimento do cilindro'],
      ['cylinderStroke', 'Curso do cilindro'],
      ['cylinderRodDiameter', 'Diâmetro da haste'],
    ].forEach(([key, label]) => {
      if (!Number.isFinite(Number(form[key])) || Number(form[key]) <= 0) missing.push(label);
    });
  }

  return missing;
};

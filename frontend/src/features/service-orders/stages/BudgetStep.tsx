import { LockKeyhole, Trash2 } from 'lucide-react';

import { SearchableSelector } from '../../../shared/ui/SearchableSelector';
import { listPriceCatalogItems } from '../../commercial/price-catalog/service';
import { PRICE_CATALOG_UNITS } from '../../commercial/price-catalog/model';
import { formatPriceCents, formatPriceInput, parsePriceInput } from '../../../utils/currency';
import { ServiceOrderBudgetReport } from '../ServiceOrderBudgetReport';
import { getServiceOrderBudgetLines } from '../model';
import { ServiceEntrySection } from './common';

export const ServiceOrderBudgetStep = ({ form, set, highlightMissingStock, saving = false, onStockReceivedChange }) => {
  const nonconformingItems = (Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : []).filter(
    (item) => item.status === 'Não conforme',
  );
  const emptyBudgetLine = () => ({
    budgetItem: '',
    budgetItemId: null,
    budgetUnit: '',
    budgetUnitPriceCents: 0,
    budgetQuantity: '',
    stockReceived: false,
  });
  const getBudgetLines = getServiceOrderBudgetLines;
  const isManualBudgetLine = (line) => line.budgetItemId == null && Boolean(line.budgetItem || line.budgetUnit);

  const getBudgetNotes = (item) => {
    if (item.component !== 'Vedação') return item.notes || 'Sem observação informada.';

    const notes = String(item.notes || '')
      .split('\n')
      .map((line) => line.replace(/^\s*(?:•|[-*])\s*/, '').trim())
      .filter(Boolean);

    return notes.length > 0 ? notes : ['Sem observação informada.'];
  };
  const updateBudgetLine = (component, lineIndex, changes, persist = false) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    const updatedChecklist = checklist.map((item) => {
      if (item.component !== component) return item;
      if (component !== 'Vedação') return { ...item, ...changes };
      const lines = getBudgetLines(item).map((line) => ({ ...line }));
      lines[lineIndex] = { ...lines[lineIndex], ...changes };
      return { ...item, budgetItems: lines, budgetItem: '', budgetItemId: null, budgetUnit: '', budgetUnitPriceCents: 0, budgetQuantity: '' };
    });
    if (persist) {
      void onStockReceivedChange(updatedChecklist);
      return;
    }
    set('disassemblyChecklist', updatedChecklist);
  };
  const addBudgetLine = (component) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    set(
      'disassemblyChecklist',
      checklist.map((item) => (item.component === component ? { ...item, budgetItems: [...getBudgetLines(item), emptyBudgetLine()] } : item)),
    );
  };
  const removeBudgetLine = (component, lineIndex) => {
    const checklist = Array.isArray(form.disassemblyChecklist) ? form.disassemblyChecklist : [];
    set(
      'disassemblyChecklist',
      checklist.map((item) => {
        if (item.component !== component) return item;
        const remainingLines = getBudgetLines(item).filter((_, index) => index !== lineIndex);
        return {
          ...item,
          budgetItems: remainingLines.length > 0 ? remainingLines : [emptyBudgetLine()],
          budgetItem: '',
          budgetItemId: null,
          budgetUnit: '',
          budgetUnitPriceCents: 0,
          budgetQuantity: '',
        };
      }),
    );
  };
  const totalBudgetCents = nonconformingItems.reduce(
    (total, item) =>
      total +
      getBudgetLines(item).reduce(
        (lineTotal, line) =>
          lineTotal + (line.budgetItem?.trim() ? Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)) : 0),
        0,
      ),
    0,
  );

  return (
    <ServiceEntrySection title="Orçamento" description="Consulte os componentes não conformes identificados na desmontagem.">
      <div className="md:col-span-3">
        {nonconformingItems.length > 0 ? (
          <div className="service-entry-budget-table-wrap rounded-lg border border-rkmborder">
            <table className="service-entry-table min-w-[1100px]">
              <thead>
                <tr>
                  <th scope="col">Componente</th>
                  <th scope="col">Observação da desmontagem</th>
                  <th scope="col">Item</th>
                  <th scope="col">Quantidade</th>
                  <th scope="col">Valor unitário</th>
                  <th scope="col">Subtotal</th>
                  <th scope="col">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {nonconformingItems.flatMap((item) => {
                  const lines = getBudgetLines(item);
                  return lines.map((line, lineIndex) => (
                    <tr
                      key={`${item.component}-${lineIndex}`}
                      className={`${item.component === 'Vedação' ? `is-budget-multiline${lineIndex === 0 ? ' is-budget-multiline-start' : ''}` : ''}${
                        highlightMissingStock && line.budgetItem?.trim() && !line.stockReceived ? ' is-budget-stock-missing' : ''
                      }`}
                    >
                      {lineIndex === 0 && (
                        <>
                          <td rowSpan={lines.length}>
                            <strong>{item.component}</strong>
                          </td>
                          <td rowSpan={lines.length}>
                            {item.component === 'Vedação' ? (
                              <div className="service-entry-budget-notes">
                                {getBudgetNotes(item).map((note, noteIndex) => (
                                  <div key={`${item.component}-note-${noteIndex}`}>• {note}</div>
                                ))}
                              </div>
                            ) : (
                              getBudgetNotes(item)
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        {isManualBudgetLine(line) ? (
                          <div className="relative">
                            <input
                              className="rkm-input zenit-field pr-9 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-950/60 disabled:text-slate-500 disabled:placeholder:text-slate-600"
                              value={line.budgetItem || ''}
                              placeholder="Nome do item avulso"
                              aria-label={`Item avulso de ${item.component}`}
                              disabled
                            />
                            <button
                              type="button"
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-sky-300"
                              aria-label="Desbloquear e buscar no catálogo"
                              title="Desbloquear e buscar no catálogo"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() =>
                                updateBudgetLine(item.component, lineIndex, {
                                  budgetItem: '',
                                  budgetItemId: null,
                                  budgetUnit: '',
                                  budgetUnitPriceCents: 0,
                                })
                              }
                            >
                              <LockKeyhole size={15} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <SearchableSelector
                            value={line.budgetItem || ''}
                            onSelectCustom={(name) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: name,
                                budgetItemId: null,
                                budgetUnit: 'un',
                                budgetUnitPriceCents: 0,
                              })
                            }
                            showCustomOption={true}
                            loadOptions={listPriceCatalogItems}
                            getOptionKey={(catalogItem) => catalogItem.id}
                            getOptionLabel={(catalogItem) => catalogItem.name}
                            getOptionDescription={(catalogItem) => `${catalogItem.type === 'service' ? 'Serviço' : 'Material'} · ${catalogItem.unit}`}
                            getOptionIcon={(catalogItem) => (catalogItem.type === 'service' ? '/assets/serviço.png' : '/assets/produto.png')}
                            placeholder="Buscar no catálogo"
                            listLabel="Catálogo"
                            emptyLabel="Nenhum item encontrado."
                            onSelect={(catalogItem) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: catalogItem.name,
                                budgetItemId: catalogItem.id,
                                budgetUnit: catalogItem.unit,
                                budgetUnitPriceCents: catalogItem.unitPriceCents,
                              })
                            }
                            onClear={() =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetItem: '',
                                budgetItemId: null,
                                budgetUnit: '',
                                budgetUnitPriceCents: 0,
                              })
                            }
                          />
                        )}
                        {item.component === 'Vedação' && lineIndex === lines.length - 1 && (
                          <button
                            type="button"
                            className="mt-2 text-xs font-medium text-sky-300 hover:text-sky-200"
                            onClick={() => addBudgetLine(item.component)}
                          >
                            ＋ Adicionar item
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="rkm-input zenit-field service-entry-budget-quantity w-16 max-w-16 min-w-0"
                            value={line.budgetQuantity || ''}
                            onChange={(event) => updateBudgetLine(item.component, lineIndex, { budgetQuantity: event.target.value })}
                            placeholder="Ex.: 3"
                            aria-label={`Quantidade do orçamento para ${item.component}`}
                          />
                          {isManualBudgetLine(line) ? (
                            <select
                              className="rkm-input zenit-field w-20"
                              value={line.budgetUnit || 'un'}
                              aria-label={`Unidade do item de ${item.component}`}
                              onChange={(event) =>
                                updateBudgetLine(item.component, lineIndex, {
                                  budgetUnit: event.target.value,
                                })
                              }
                            >
                              {PRICE_CATALOG_UNITS.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className="min-w-7 text-sm font-semibold text-slate-300"
                              aria-label={`Unidade: ${line.budgetUnit || 'não definida'}`}
                            >
                              {line.budgetUnit || '—'}
                            </span>
                          )}
                          {item.component === 'Vedação' && (
                            <button
                              type="button"
                              className="service-entry-delete shrink-0"
                              aria-label={`Remover item de ${item.component}`}
                              onClick={() => removeBudgetLine(item.component, lineIndex)}
                            >
                              <Trash2 size={15} strokeWidth={2} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {isManualBudgetLine(line) ? (
                          <input
                            className="rkm-input zenit-field min-w-[110px]"
                            inputMode="numeric"
                            value={formatPriceInput(line.budgetUnitPriceCents || 0)}
                            placeholder="R$ 0,00"
                            aria-label={`Valor unitário de ${item.component}`}
                            onChange={(event) =>
                              updateBudgetLine(item.component, lineIndex, {
                                budgetUnitPriceCents: parsePriceInput(event.target.value),
                              })
                            }
                          />
                        ) : line.budgetItem ? (
                          <span className="text-sm text-slate-300">{formatPriceCents(line.budgetUnitPriceCents || 0)}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="whitespace-nowrap font-semibold text-slate-100">
                        {line.budgetItem?.trim()
                          ? formatPriceCents(Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)))
                          : '—'}
                      </td>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="service-entry-stock-checkbox"
                          checked={Boolean(line.stockReceived)}
                          disabled={saving}
                          onChange={(event) => updateBudgetLine(item.component, lineIndex, { stockReceived: event.target.checked }, true)}
                          aria-label={`Item ${line.budgetItem || 'do orçamento'} chegou na oficina`}
                        />
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan="6" scope="row" className="text-right">
                    Total do orçamento
                  </th>
                  <th className="whitespace-nowrap text-right text-base text-sky-200">{formatPriceCents(totalBudgetCents)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="service-entry-empty rounded-lg border border-dashed border-sky-400/30 bg-slate-950/20">
            Nenhum componente não conforme foi registrado na desmontagem.
          </div>
        )}
      </div>
      <ServiceOrderBudgetReport
        form={form}
        totalCents={totalBudgetCents}
        rows={nonconformingItems.flatMap((item) =>
          getBudgetLines(item).map((line) => ({
            ...line,
            component: item.component,
            subtotalCents: line.budgetItem?.trim() ? Math.round(Number(line.budgetQuantity || 0) * Number(line.budgetUnitPriceCents || 0)) : 0,
          })),
        )}
      />
    </ServiceEntrySection>
  );
};

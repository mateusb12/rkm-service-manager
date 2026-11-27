// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';

import { isCylinderOrderType, normalizeOrderNumber } from './model';
import { formatDateLabel, parseStoredDateTime } from '../../utils/date';
import { formatLongDateTimeBR } from '../../utils/formatLongDateTimeBR';
import { formatPriceCents } from '../../utils/currency';
import { getFilePreviewUrl } from '../files/service';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const show = (value, suffix = '') => (String(value ?? '').trim() ? esc(value) + suffix : '—');

const dateTime = (value) => {
  const date = parseStoredDateTime(value);
  return date ? formatLongDateTimeBR(date) : '—';
};

const buildReportHtml = ({ form, rows, totalCents, entryPhotos = [] }) => {
  const orderNumber = normalizeOrderNumber(form.orderNumber);
  // Uma linha por item de orçamento; componente/situação/justificativa mesclados (rowspan) quando há várias (ex.: Vedação).
  const budgetCells = (row) =>
    row?.budgetItem
      ? `<td>${esc(row.budgetItem)}</td><td class="num">${show(row.budgetQuantity, row.budgetUnit ? ' ' + esc(row.budgetUnit) : '')}</td>
        <td class="num">${formatPriceCents(row.budgetUnitPriceCents || 0)}</td><td class="num">${formatPriceCents(row.subtotalCents)}</td>`
      : '<td>—</td><td class="num">—</td><td class="num">—</td><td class="num">—</td>';

  const checklistRows = (form.disassemblyChecklist || [])
    .map((item) => {
      const lines = rows.filter((row) => row.component === item.component);
      const [first, ...rest] = lines.length ? lines : [null];
      const span = rest.length ? ` rowspan="${rest.length + 1}"` : '';
      return `<tr><td${span}>${esc(item.component)}</td><td${span}>${show(item.status)}</td><td class="notes"${span}>${show(item.notes)}</td>${budgetCells(first)}</tr>${rest
        .map((row) => `<tr>${budgetCells(row)}</tr>`)
        .join('')}`;
    })
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Relatório ${esc(orderNumber)}</title><style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font: 12px/1.45 system-ui, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; }
    @media print { body { padding: 0; } }
    header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 16px; }
    header h1 { font-size: 18px; margin: 0; } header .os { font: 700 16px monospace; }
    h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin: 20px 0 8px; break-after: avoid; }
    dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 16px; margin: 0; }
    dt { font-size: 10px; text-transform: uppercase; color: #64748b; } dd { margin: 0 0 4px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; } .num { text-align: right; white-space: nowrap; }
    tfoot th { font-size: 12px; }
    .notes { white-space: pre-line; } .muted { color: #64748b; }
    .photos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
    .photos figure { margin: 0; break-inside: avoid; } .photos img { width: 100%; max-height: 260px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 4px; }
    .photos figcaption { font-size: 10px; color: #64748b; text-transform: uppercase; }
  </style></head><body>
    <header><div><h1>Relatório da OS</h1><span class="muted">RKM Hidráulica · emitido em ${esc(formatLongDateTimeBR(new Date()))}</span></div><span class="os">${esc(orderNumber)}</span></header>

    ${
      entryPhotos.length
        ? `<div class="photos">${entryPhotos.map((photo) => `<figure><img src="${esc(photo.url)}" alt="${esc(photo.label)}" /><figcaption>${esc(photo.label)}</figcaption></figure>`).join('')}</div>`
        : ''
    }

    <h2>1. Recebimento</h2>
    <dl>
      <div><dt>Nº da OS</dt><dd>${show(orderNumber)}</dd></div>
      <div><dt>Nota fiscal</dt><dd>${show(form.invoiceNumber)}</dd></div>
      <div><dt>Data de entrada</dt><dd>${esc(form.createdAt ? formatLongDateTimeBR(new Date(form.createdAt)) : formatDateLabel(form.openingDate))}</dd></div>
      <div><dt>Cliente</dt><dd>${show(form.client)}</dd></div>
    </dl>

    <h2>2. Identificação do item</h2>
    <dl>
      <div><dt>Tipo</dt><dd>${show(form.orderType)}</dd></div>
      <div style="grid-column: span 2"><dt>Equipamento</dt><dd>${show(form.equipment)}</dd></div>
      ${
        isCylinderOrderType(form.orderType)
          ? `
      <div><dt>Diâmetro interno</dt><dd>${show(form.cylinderInternalDiameter, ' mm')}</dd></div>
      <div><dt>Diâmetro externo</dt><dd>${show(form.cylinderExternalDiameter, ' mm')}</dd></div>
      <div><dt>Diâmetro da haste</dt><dd>${show(form.cylinderRodDiameter, ' mm')}</dd></div>
      <div><dt>Comprimento</dt><dd>${show(form.cylinderLength, ' mm')}</dd></div>
      <div><dt>Curso</dt><dd>${show(form.cylinderStroke, ' mm')}</dd></div>`
          : ''
      }
      <div style="grid-column: 1 / -1"><dt>Defeito relatado</dt><dd class="notes">${show(form.claimedDefect)}</dd></div>
    </dl>

    <h2>3. Desmontagem e orçamento</h2>
    <dl>
      <div><dt>Responsável</dt><dd>${show(form.disassemblyOperator)}</dd></div>
      <div><dt>Início</dt><dd>${esc(dateTime(form.disassemblyStartedAt))}</dd></div>
      <div><dt>Fim</dt><dd>${esc(dateTime(form.disassemblyEndedAt))}</dd></div>
    </dl>
    ${
      checklistRows
        ? `<table style="margin:8px 0"><thead><tr><th>Componente</th><th>Situação</th><th style="width:24%">Motivo / justificativa</th><th style="width:22%">Item</th><th class="num">Qtd.</th><th class="num">Valor unitário</th><th class="num">Subtotal</th></tr></thead>
      <tbody>${checklistRows}</tbody><tfoot><tr><th colspan="6" class="num">Total do orçamento</th><th class="num">${formatPriceCents(totalCents)}</th></tr></tfoot></table>`
        : '<p class="muted">Nenhum componente avaliado.</p>'
    }
    <dl><div style="grid-column: 1 / -1"><dt>Observações da desmontagem</dt><dd class="notes">${show(form.disassemblyNotes)}</dd></div></dl>
  </body></html>`;
};

export const ServiceOrderBudgetReport = ({ form, rows, totalCents }) => {
  const frameRef = useRef(null);
  const [entryPhotos, setEntryPhotos] = useState([]);
  const sources = (form.photos?.arrival || [])
    .filter((photo) => photo.key && photo.category === 'recebimento')
    .map((photo) => ({ key: photo.key, label: 'Foto de entrada' }));
  const sourcesKey = sources.map((source) => source.key).join('|');

  useEffect(() => {
    let cancelled = false;
    // ponytail: foto que falhar ao carregar só fica fora do relatório
    Promise.all(
      sources.map((source) =>
        getFilePreviewUrl(source.key).then(
          (url) => ({ ...source, url }),
          () => null,
        ),
      ),
    ).then((loaded) => {
      if (!cancelled) setEntryPhotos(loaded.filter(Boolean));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sourcesKey resume as chaves
  }, [sourcesKey]);

  const html = buildReportHtml({ form, rows, totalCents, entryPhotos });

  return (
    <div className="md:col-span-3 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300">Relatório da OS</span>
          <p className="mt-1 text-xs text-slate-500">Consolida recebimento, identificação, desmontagem e orçamento.</p>
        </div>
        {/* ponytail: PDF via diálogo de impressão do navegador ("Salvar como PDF"); lib de PDF só se precisar gerar sem diálogo */}
        <button type="button" className="btn btn-primary" onClick={() => frameRef.current?.contentWindow?.print()}>
          <FileDown size={16} strokeWidth={2} aria-hidden="true" />
          Gerar PDF
        </button>
      </div>
      <iframe ref={frameRef} title="Relatório da OS" srcDoc={html} className="h-[900px] w-full rounded-lg border border-rkmborder bg-white" />
    </div>
  );
};

// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import { FileDown } from 'lucide-react';

import { normalizeOrderNumber } from './model';
import { getServiceEntryPhoto } from './photo-storage';
import { getFilePreviewUrl } from '../files/service';
import { formatDateLabel, parseStoredDateTime } from '../../utils/date';
import { formatLongDateTimeBR } from '../../utils/formatLongDateTimeBR';
import { formatPriceCents } from '../../utils/currency';

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const show = (value, suffix = '') => (String(value ?? '').trim() ? esc(value) + suffix : '—');

const dateTime = (value) => {
  const date = parseStoredDateTime(value);
  return date ? formatLongDateTimeBR(date) : '—';
};

// Fotos da desmontagem: as gerais ficam no IndexedDB; as do checklist vão para o storage (têm key).
const collectDisassemblyPhotos = (form) =>
  Object.entries(form.photos || {})
    .filter(([category]) => category === 'disassembly' || category.startsWith('disassemblyChecklist-'))
    .flatMap(([category, photos]) => {
      const component = category === 'disassembly' ? 'Geral' : form.disassemblyChecklist?.[Number(category.split('-')[1])]?.component || 'Checklist';
      return (photos || []).map((photo) => ({ ...photo, component }));
    });

const useImageUrls = (form) => {
  const [urls, setUrls] = useState({});
  const photos = collectDisassemblyPhotos(form);
  const invoice = form.invoiceFile;
  const signature = [invoice?.key, ...photos.map((photo) => photo.key || photo.id)].join('|');

  useEffect(() => {
    let active = true;
    const ownedUrls = [];
    const resolve = async (photo) => {
      if (photo.key) return getFilePreviewUrl(photo.key);
      const blob = await getServiceEntryPhoto(photo.id);
      if (!blob) return '';
      const url = URL.createObjectURL(blob);
      ownedUrls.push(url);
      return url;
    };

    void Promise.all(
      [...(invoice?.key ? [{ ...invoice, id: 'invoice' }] : []), ...photos].map((photo) =>
        resolve(photo)
          .catch(() => '')
          .then((url) => [photo.id, url]),
      ),
    ).then((entries) => active && setUrls(Object.fromEntries(entries)));

    return () => {
      active = false;
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return { urls, photos };
};

const buildReportHtml = ({ form, rows, totalCents, urls, photos }) => {
  const orderNumber = normalizeOrderNumber(form.orderNumber);
  const invoice = form.invoiceFile;
  const invoiceBlock = !invoice
    ? '<p class="muted">Nenhuma nota fiscal anexada.</p>'
    : invoice.contentType?.startsWith('image/') && urls.invoice
      ? `<img class="invoice" src="${urls.invoice}" alt="Nota fiscal" />`
      : `<p class="muted">Arquivo anexado: ${esc(invoice.name)} (não é imagem; consulte o anexo original).</p>`;

  const photoBlock = photos.length
    ? `<div class="photos">${photos
        .map(
          (photo) => `<figure>${urls[photo.id] ? `<img src="${urls[photo.id]}" alt="" />` : '<div class="missing">Foto indisponível</div>'}
            <figcaption>${esc(photo.component)} · ${esc(photo.name)}</figcaption></figure>`,
        )
        .join('')}</div>`
    : '<p class="muted">Nenhuma foto registrada.</p>';

  const checklistRows = (form.disassemblyChecklist || [])
    .map((item) => `<tr><td>${esc(item.component)}</td><td>${show(item.status)}</td><td>${show(item.notes)}</td></tr>`)
    .join('');

  const budgetRows = rows
    .map(
      (row) => `<tr><td>${esc(row.component)}</td><td>${show(row.budgetItem)}</td>
        <td class="num">${row.budgetItem ? show(row.budgetQuantity, row.budgetUnit ? ' ' + esc(row.budgetUnit) : '') : '—'}</td>
        <td class="num">${row.budgetItem ? formatPriceCents(row.budgetUnitPriceCents || 0) : '—'}</td>
        <td class="num">${row.budgetItem ? formatPriceCents(row.subtotalCents) : '—'}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Orçamento ${esc(orderNumber)}</title><style>
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
    .invoice { max-width: 100%; max-height: 120mm; border: 1px solid #cbd5e1; }
    .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    figure { margin: 0; break-inside: avoid; } figure img, .missing { width: 100%; aspect-ratio: 4/3; object-fit: cover; border: 1px solid #cbd5e1; }
    .missing { display: flex; align-items: center; justify-content: center; color: #94a3b8; background: #f8fafc; }
    figcaption { font-size: 10px; color: #475569; margin-top: 2px; } .muted { color: #64748b; }
  </style></head><body>
    <header><div><h1>Relatório de orçamento</h1><span class="muted">RKM Hidráulica · emitido em ${esc(formatLongDateTimeBR(new Date()))}</span></div><span class="os">${esc(orderNumber)}</span></header>

    <h2>1. Recebimento</h2>
    <dl>
      <div><dt>Cliente</dt><dd>${show(form.client)}</dd></div>
      <div><dt>Abertura</dt><dd>${esc(formatDateLabel(form.openingDate))}</dd></div>
      <div><dt>Nota fiscal</dt><dd>${show(form.invoiceNumber)}</dd></div>
    </dl>
    ${invoiceBlock}

    <h2>2. Identificação</h2>
    <dl>
      <div><dt>Categoria</dt><dd>${show(form.orderType)}</dd></div>
      <div style="grid-column: span 2"><dt>Equipamento</dt><dd>${show(form.equipment)}</dd></div>
      <div><dt>Diâmetro interno</dt><dd>${show(form.cylinderInternalDiameter, ' mm')}</dd></div>
      <div><dt>Diâmetro externo</dt><dd>${show(form.cylinderExternalDiameter, ' mm')}</dd></div>
      <div><dt>Diâmetro da haste</dt><dd>${show(form.cylinderRodDiameter, ' mm')}</dd></div>
      <div><dt>Comprimento</dt><dd>${show(form.cylinderLength, ' mm')}</dd></div>
      <div><dt>Curso</dt><dd>${show(form.cylinderStroke, ' mm')}</dd></div>
    </dl>

    <h2>3. Desmontagem</h2>
    <dl>
      <div><dt>Responsável</dt><dd>${show(form.disassemblyOperator)}</dd></div>
      <div><dt>Entrada</dt><dd>${esc(dateTime(form.disassemblyStartedAt))}</dd></div>
      <div><dt>Saída</dt><dd>${esc(dateTime(form.disassemblyEndedAt))}</dd></div>
    </dl>
    ${checklistRows ? `<table style="margin:8px 0"><thead><tr><th>Componente</th><th>Situação</th><th>Observação</th></tr></thead><tbody>${checklistRows}</tbody></table>` : ''}
    ${photoBlock}

    <h2>4. Orçamento</h2>
    ${
      rows.length
        ? `<table><thead><tr><th>Componente</th><th>Item</th><th class="num">Qtd.</th><th class="num">Valor unitário</th><th class="num">Subtotal</th></tr></thead>
      <tbody>${budgetRows}</tbody><tfoot><tr><th colspan="4" class="num">Total do orçamento</th><th class="num">${formatPriceCents(totalCents)}</th></tr></tfoot></table>`
        : '<p class="muted">Nenhum componente não conforme.</p>'
    }
  </body></html>`;
};

export const ServiceOrderBudgetReport = ({ form, rows, totalCents }) => {
  const frameRef = useRef(null);
  const { urls, photos } = useImageUrls(form);
  const html = buildReportHtml({ form, rows, totalCents, urls, photos });

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

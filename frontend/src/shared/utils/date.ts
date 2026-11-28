type DateValue = Date | number | string;

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function parseDate(value: DateValue | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null;

  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimeBR(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).replace(':', 'h');
}

export function formatRoadmapDate(date: Date): string {
  return `${date.getDate()}/${MONTHS[date.getMonth()]}`;
}

export function formatMonthAbbreviationBR(date: Date): string {
  const abbreviation = MONTHS[date.getMonth()];
  return abbreviation.charAt(0).toLocaleUpperCase('pt-BR') + abbreviation.slice(1);
}

export const formatDateLabel = (value: string) => {
  if (!value) return '—';

  const dateValue = String(value);
  const date = new Date(dateValue.includes('T') ? dateValue : `${dateValue}T12:00:00`);
  return Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString('pt-BR');
};

export function formatDateTimeBR(value: DateValue | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return new Date(typeof value === 'number' ? value * 1000 : value).toLocaleString('pt-BR');
}

export function formatShortDateTimeBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export const parseStoredDateTime = (value: string) => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
  return Number.isNaN(date.getTime()) ? null : date;
};

export const serializeDateTime = (date: Date | null | undefined) => {
  if (!date) return '';

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function formatLongDateBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const label = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return label.replace(/(de )([a-zá-ú])/, (_, prefix, firstLetter) => `${prefix}${firstLetter.toUpperCase()}`);
}

export function formatLongDateTimeBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const dateLabel = formatLongDateBR(date);
  return `${dateLabel} às ${formatTimeBR(date)}`;
}

export function formatOperationalDateTimeBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const dateLabel = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${dateLabel} às ${formatTimeBR(date)}`;
}

export function formatCompactDateTimeBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  return `${date.toLocaleDateString('pt-BR')} às ${formatTimeBR(date)}`;
}

export function formatCommitDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getDate()}-${MONTHS[date.getMonth()]}, ${pad(date.getHours())}h${pad(date.getMinutes())}`;
}

type DateValue = Date | number | string;

function parseDate(value: DateValue | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLongDateBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const label = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return label.replace(
    /(de )([a-zá-ú])/,
    (_, prefix, firstLetter) => `${prefix}${firstLetter.toUpperCase()}`,
  );
}

export function formatLongDateTimeBR(value: DateValue | null | undefined): string {
  const date = parseDate(value);
  if (!date) return '—';

  const dateLabel = formatLongDateBR(value);
  const timeLabel = date
    .toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', 'h');

  return `${dateLabel} às ${timeLabel}`;
}

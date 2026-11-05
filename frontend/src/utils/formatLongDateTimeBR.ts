type DateValue = Date | number | string;

export function formatLongDateTimeBR(value: DateValue | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const date = new Date(typeof value === 'number' ? value * 1000 : value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const dateLabel = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeLabel = date
    .toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(':', 'h');

  return `${dateLabel} às ${timeLabel}`;
}

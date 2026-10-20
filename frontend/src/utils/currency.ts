export function formatPriceCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatPriceInput(cents: number): string {
  if (!cents) return '';

  return formatPriceCents(cents);
}

export function parsePriceInput(value: string): number {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

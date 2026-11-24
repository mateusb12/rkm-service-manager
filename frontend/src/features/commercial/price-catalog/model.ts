export const PRICE_CATALOG_STORAGE_KEY = 'rkm-demo-price-catalog-v1';

export const PRICE_CATALOG_TYPES = ['material', 'service'] as const;
export const PRICE_CATALOG_UNITS = ['un', 'h', 'm', 'm²', 'kg', 'L'] as const;
export const PRICE_CATALOG_SERVICE_UNIT = 'h' as const;

export type PriceCatalogType = (typeof PRICE_CATALOG_TYPES)[number];
export type PriceCatalogUnit = (typeof PRICE_CATALOG_UNITS)[number];

export type PriceCatalogItem = {
  id: string;
  name: string;
  description: string;
  type: PriceCatalogType;
  unit: PriceCatalogUnit;
  unitPriceCents: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type PriceCatalogInput = Pick<PriceCatalogItem, 'name' | 'description' | 'type' | 'unit' | 'unitPriceCents'>;

export type PriceCatalogErrors = Partial<Record<keyof PriceCatalogInput, string>>;

export const EMPTY_PRICE_CATALOG_INPUT: PriceCatalogInput = {
  name: '',
  description: '',
  type: 'material',
  unit: 'un',
  unitPriceCents: 0,
};

export const PRICE_CATALOG_TYPE_LABELS: Record<PriceCatalogType, string> = {
  material: 'Material',
  service: 'Serviço',
};

export const PRICE_CATALOG_REFERENCE_IDS = ['price-gaxeta-45-55-7'];

export function validatePriceCatalogInput(input: PriceCatalogInput): PriceCatalogErrors {
  const errors: PriceCatalogErrors = {};

  if (!input.name.trim()) errors.name = 'Informe o nome do cadastro.';
  if (!input.type || !PRICE_CATALOG_TYPES.includes(input.type)) errors.type = 'Selecione o tipo.';
  if (!input.unit || !PRICE_CATALOG_UNITS.includes(input.unit)) errors.unit = 'Selecione a unidade.';
  if (input.type === 'service' && input.unit !== PRICE_CATALOG_SERVICE_UNIT) {
    errors.unit = 'Serviços devem usar hora como unidade.';
  }
  if (!Number.isInteger(input.unitPriceCents) || input.unitPriceCents < 0) {
    errors.unitPriceCents = 'Informe um preço válido em reais.';
  }

  return errors;
}

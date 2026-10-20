import {
  PRICE_CATALOG_REFERENCE_IDS,
  PRICE_CATALOG_STORAGE_KEY,
  type PriceCatalogInput,
  type PriceCatalogItem,
} from './model';

export type PriceCatalogRemoval = {
  mode: 'permanent' | 'archived';
};

export class PriceCatalogServiceError extends Error {
  readonly errorCode: string;

  constructor(errorCode: string) {
    super(errorCode);
    this.name = 'PriceCatalogServiceError';
    this.errorCode = errorCode;
  }
}

const demoItems: PriceCatalogItem[] = [
  createDemoItem('price-adaptador-45-41-5', 'Adaptador 45 × 41,5', 'piece', 'un', 45000),
  createDemoItem('price-gaxeta-45-55-7', 'Gaxeta 45 × 55 × 7', 'piece', 'un', 32000),
  createDemoItem('price-o-ring-60-3', 'O-ring 60 × 3', 'piece', 'un', 3500),
  createDemoItem(
    'price-kit-vedacao-acumulador',
    'Kit de vedação para acumulador',
    'product',
    'un',
    68000,
    'Kit composto por elementos de vedação para manutenção de acumuladores hidráulicos.',
  ),
  createDemoItem(
    'price-recuperar-rosca-embolao',
    'Recuperar rosca do êmbolo',
    'service',
    'un',
    7500,
  ),
  createDemoItem('price-pintura', 'Pintura', 'service', 'un', 8500),
];
const DEMO_SEED_VERSION_KEY = `${PRICE_CATALOG_STORAGE_KEY}-seed`;
const DEMO_SEED_VERSION = '2';

function createDemoItem(
  id: string,
  name: string,
  type: PriceCatalogItem['type'],
  unit: PriceCatalogItem['unit'],
  unitPriceCents: number,
  description = 'Dado fictício de demonstração baseado nas anotações da RKM.',
): PriceCatalogItem {
  const timestamp = '2026-01-15T12:00:00.000Z';

  return {
    id,
    name,
    description,
    type,
    unit,
    unitPriceCents,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };
}

function readItems(): PriceCatalogItem[] {
  const stored = window.localStorage.getItem(PRICE_CATALOG_STORAGE_KEY);

  if (!stored) {
    writeItems(demoItems);
    window.localStorage.setItem(DEMO_SEED_VERSION_KEY, DEMO_SEED_VERSION);
    return demoItems;
  }

  try {
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed)) {
      const items = parsed as PriceCatalogItem[];
      if (window.localStorage.getItem(DEMO_SEED_VERSION_KEY) !== DEMO_SEED_VERSION) {
        const existingIds = new Set(items.map((item) => item.id));
        const missingDemoItems = demoItems.filter((item) => !existingIds.has(item.id));
        const mergedItems = [...items, ...missingDemoItems];
        writeItems(mergedItems);
        window.localStorage.setItem(DEMO_SEED_VERSION_KEY, DEMO_SEED_VERSION);
        return mergedItems;
      }
      return items;
    }
  } catch {
    // Recreate the demo dataset when a local browser value is invalid.
  }

  writeItems(demoItems);
  window.localStorage.setItem(DEMO_SEED_VERSION_KEY, DEMO_SEED_VERSION);
  return demoItems;
}

function writeItems(items: PriceCatalogItem[]) {
  window.localStorage.setItem(PRICE_CATALOG_STORAGE_KEY, JSON.stringify(items));
}

function generateId() {
  return `price-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export async function listPriceCatalogItems(): Promise<PriceCatalogItem[]> {
  return readItems();
}

export async function getPriceCatalogItem(id: string): Promise<PriceCatalogItem> {
  const item = readItems().find((candidate) => candidate.id === id);
  if (!item) throw new PriceCatalogServiceError('price_catalog_item_not_found');
  return item;
}

export async function createPriceCatalogItem(input: PriceCatalogInput): Promise<PriceCatalogItem> {
  const now = new Date().toISOString();
  const item: PriceCatalogItem = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  writeItems([...readItems(), item]);
  return item;
}

export async function updatePriceCatalogItem(
  id: string,
  input: PriceCatalogInput,
): Promise<PriceCatalogItem> {
  const items = readItems();
  const currentItem = items.find((item) => item.id === id);
  if (!currentItem) throw new PriceCatalogServiceError('price_catalog_item_not_found');
  if (currentItem.deletedAt) throw new PriceCatalogServiceError('price_catalog_item_archived');

  const updatedItem = { ...currentItem, ...input, updatedAt: new Date().toISOString() };
  writeItems(items.map((item) => (item.id === id ? updatedItem : item)));
  return updatedItem;
}

export async function removePriceCatalogItem(id: string): Promise<PriceCatalogRemoval> {
  const items = readItems();
  const currentItem = items.find((item) => item.id === id);
  if (!currentItem) throw new PriceCatalogServiceError('price_catalog_item_not_found');

  if (PRICE_CATALOG_REFERENCE_IDS.includes(id)) {
    const archivedItem = { ...currentItem, deletedAt: new Date().toISOString() };
    writeItems(items.map((item) => (item.id === id ? archivedItem : item)));
    return { mode: 'archived' };
  }

  writeItems(items.filter((item) => item.id !== id));
  return { mode: 'permanent' };
}

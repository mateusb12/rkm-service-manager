import { apiRequest } from '../../../shared/api/http';

import type { PriceCatalogErrors, PriceCatalogInput, PriceCatalogItem } from './model';

type PriceCatalogErrorPayload = {
  error?: string;
  fields?: PriceCatalogErrors;
};

export class PriceCatalogServiceError extends Error {
  readonly errorCode: string;
  readonly status: number;
  readonly fieldErrors: PriceCatalogErrors;

  constructor(errorCode: string, status: number, fieldErrors: PriceCatalogErrors = {}) {
    super(errorCode);
    this.name = 'PriceCatalogServiceError';
    this.errorCode = errorCode;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function throwPriceCatalogServiceError(response: Response, fallbackCode: string): Promise<never> {
  const payload = (await response.json().catch(() => null)) as PriceCatalogErrorPayload | null;
  throw new PriceCatalogServiceError(payload?.error || fallbackCode, response.status, payload?.fields || {});
}

export async function listPriceCatalogItems(search = ''): Promise<PriceCatalogItem[]> {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const response = await apiRequest(`/price-catalog${query}`);
  if (!response.ok) await throwPriceCatalogServiceError(response, 'price_catalog_query_failed');
  return response.json();
}

export async function getPriceCatalogItem(id: number): Promise<PriceCatalogItem> {
  const response = await apiRequest(`/price-catalog/${id}`);
  if (!response.ok) await throwPriceCatalogServiceError(response, 'price_catalog_item_not_found');
  return response.json();
}

export async function createPriceCatalogItem(input: PriceCatalogInput): Promise<PriceCatalogItem> {
  const response = await apiRequest('/price-catalog', { method: 'POST', body: JSON.stringify(input) });
  if (!response.ok) await throwPriceCatalogServiceError(response, 'price_catalog_item_creation_failed');
  return response.json();
}

export async function updatePriceCatalogItem(id: number, input: PriceCatalogInput): Promise<PriceCatalogItem> {
  const response = await apiRequest(`/price-catalog/${id}`, { method: 'PUT', body: JSON.stringify(input) });
  if (!response.ok) await throwPriceCatalogServiceError(response, 'price_catalog_item_update_failed');
  return response.json();
}

export async function removePriceCatalogItem(id: number): Promise<void> {
  const response = await apiRequest(`/price-catalog/${id}`, { method: 'DELETE' });
  if (!response.ok) await throwPriceCatalogServiceError(response, 'price_catalog_item_deletion_failed');
}

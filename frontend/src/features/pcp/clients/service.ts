import { apiRequest, csrfHeaders } from '../../../shared/api/http';

import type { Client, ClientErrors, ClientInput } from './clientModel';

type ClientErrorPayload = {
  error?: string;
  fields?: ClientErrors;
};

export class ClientServiceError extends Error {
  readonly errorCode: string;
  readonly fieldErrors: ClientErrors;

  constructor(errorCode: string, fieldErrors: ClientErrors = {}) {
    super(errorCode);

    this.name = 'ClientServiceError';
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }
}

async function throwClientServiceError(response: Response, fallbackCode: string): Promise<never> {
  const errorPayload = (await response.json().catch(() => null)) as ClientErrorPayload | null;

  throw new ClientServiceError(errorPayload?.error || fallbackCode, errorPayload?.fields || {});
}

export async function listClients(searchTerm = ''): Promise<Client[]> {
  const normalizedSearchTerm = searchTerm.trim();
  const query = normalizedSearchTerm ? `?search=${encodeURIComponent(normalizedSearchTerm)}` : '';

  const response = await apiRequest(`/clients${query}`);

  if (!response.ok) {
    await throwClientServiceError(response, 'clients_query_failed');
  }

  return response.json();
}

export async function createClient(clientInput: ClientInput): Promise<Client> {
  const response = await apiRequest('/clients', {
    method: 'POST',
    headers: csrfHeaders(),
    body: JSON.stringify(clientInput),
  });

  if (!response.ok) {
    await throwClientServiceError(response, 'client_creation_failed');
  }

  return response.json();
}

export async function updateClient(clientId: number, clientInput: ClientInput): Promise<Client> {
  const response = await apiRequest(`/clients/${clientId}`, {
    method: 'PUT',
    headers: csrfHeaders(),
    body: JSON.stringify(clientInput),
  });

  if (!response.ok) {
    await throwClientServiceError(response, 'client_update_failed');
  }

  return response.json();
}

export async function deleteClient(clientId: number): Promise<void> {
  const response = await apiRequest(`/clients/${clientId}`, {
    method: 'DELETE',
    headers: csrfHeaders(),
  });

  if (!response.ok) {
    await throwClientServiceError(response, 'client_deletion_failed');
  }
}

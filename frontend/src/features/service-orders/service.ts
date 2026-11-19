// @ts-nocheck

import { apiRequest } from '../../shared/api/http';

/*
 * HTTP service for service orders.
 *
 * React views and import tools use this module to communicate with the
 * backend API. Database persistence belongs to the backend repository.
 */

export const loadServiceEntries = async () => {
  const response = await apiRequest('/service-orders');
  if (!response.ok) throw new Error('service_orders_query_failed');
  const parsed = await response.json();
  return Array.isArray(parsed) ? parsed : [];
};

export const loadServiceEntryStages = async () => {
  const response = await apiRequest('/service-orders/stages');
  if (!response.ok) throw new Error('service_order_stages_query_failed');
  const parsed = await response.json();
  return Array.isArray(parsed) ? parsed : [];
};

export const getServiceEntry = async (id) => {
  const response = await apiRequest(`/service-orders/${encodeURIComponent(id)}`);
  if (!response.ok) {
    if (response.status === 403) throw new Error('service_order_details_restricted');
    if (response.status === 404) throw new Error('service_order_not_found');
    throw new Error('service_order_query_failed');
  }
  return response.json();
};

export const saveServiceEntry = async (entry, update = Boolean(entry.id)) => {
  const { availableThroughStage, ...payload } = entry;
  const response = await apiRequest(
    update && entry.id ? `/service-orders/${encodeURIComponent(entry.id)}` : '/service-orders',
    {
      method: update && entry.id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (!response.ok) {
    if (response.status === 409) throw new Error('service_order_already_exists');
    throw new Error('service_order_save_failed');
  }
  return response.json();
};

export const saveServiceEntries = async (entries) => {
  for (const entry of entries) {
    await saveServiceEntry(entry, Boolean(entry.id));
  }
  return true;
};

export const deleteServiceEntry = async (entry) => {
  const response = await apiRequest(`/service-orders/${encodeURIComponent(entry.id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('service_order_delete_failed');
};

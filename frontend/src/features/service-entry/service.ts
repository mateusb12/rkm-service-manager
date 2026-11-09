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

export const saveServiceEntry = async (entry, update = Boolean(entry.id)) => {
  const response = await apiRequest(
    update && entry.id ? `/service-orders/${encodeURIComponent(entry.id)}` : '/service-orders',
    {
      method: update && entry.id ? 'PUT' : 'POST',
      body: JSON.stringify(entry),
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

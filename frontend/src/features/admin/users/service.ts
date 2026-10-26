import { apiRequest } from '../../../shared/api/http';

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  active: boolean;
  createdAt: number;
  lastLoginAt: number | null;
};

export type UserInput = {
  name: string;
  email: string;
  role: string;
  password?: string;
};

export async function listUsers(): Promise<ApiUser[]> {
  const response = await apiRequest('/admin/users');

  if (!response.ok) {
    throw new Error('users_query_failed');
  }

  return response.json();
}

export async function getUser(userId: string): Promise<ApiUser> {
  const response = await apiRequest(`/admin/users/${userId}`);
  if (!response.ok) throw new Error('user_query_failed');
  return response.json();
}

export async function createUser(input: UserInput): Promise<ApiUser> {
  const response = await apiRequest('/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorCode(response, 'user_creation_failed'));
  return response.json();
}

export async function updateUser(userId: string, input: UserInput): Promise<ApiUser> {
  const response = await apiRequest(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await errorCode(response, 'user_update_failed'));
  return response.json();
}

export async function deactivateUser(userId: string): Promise<ApiUser> {
  const response = await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(await errorCode(response, 'user_deactivation_failed'));
  return response.json();
}

export async function hardDeleteUser(userId: string): Promise<void> {
  const response = await apiRequest(`/admin/users/${userId}/permanent`, { method: 'DELETE' });
  if (!response.ok) throw new Error(await errorCode(response, 'user_deletion_failed'));
}

async function errorCode(response: Response, fallback: string): Promise<string> {
  try {
    return (await response.json()).error || fallback;
  } catch {
    return fallback;
  }
}

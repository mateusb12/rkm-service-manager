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

export async function listUsers(): Promise<ApiUser[]> {
  const response = await apiRequest('/admin/users');

  if (!response.ok) {
    throw new Error('users_query_failed');
  }

  return response.json();
}

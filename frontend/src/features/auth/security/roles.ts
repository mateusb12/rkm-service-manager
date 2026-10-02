// @ts-nocheck

export const ROLES = [
  { key: 'admin', label: 'Admin', tagClass: 'tag-violet' },
  { key: 'mechanic', label: 'Mecânico', tagClass: 'tag-slate' },
  { key: 'pcp', label: 'PCP', tagClass: 'tag-amber' },
  { key: 'commercial', label: 'Comercial', tagClass: 'tag-blue' },
];

export const mockUsers = [
  { id: 'u5', name: 'Osmar Lamarck', role: 'admin', short: 'OL' },
  { id: 'u1', name: 'Carlos M.', role: 'mechanic', short: 'CM' },
  { id: 'u4', name: 'PCP RKM', role: 'pcp', short: 'PR' },
  { id: 'u7', name: 'Comercial RKM', role: 'commercial', short: 'CR' },
  { id: 'u6', name: 'Marcelo R.', role: 'mechanic', short: 'MR' },
];

export const ALL_ROLES = ['admin', 'mechanic', 'pcp', 'commercial'];

export const userById = (id) => mockUsers.find((u) => u.id === id);

export const filterServicesForRole = (services, role, userId) => {
  if (role === 'mechanic') {
    return services.filter((s) => s.assignedTo && s.assignedTo.operator === userId);
  }
  return services;
};

// @ts-nocheck

export const ROLES = [
    { key: 'admin', label: 'Admin', tagClass: 'tag-violet' },
    { key: 'supervisor', label: 'Supervisor', tagClass: 'tag-blue' },
    { key: 'quality', label: 'Qualidade', tagClass: 'tag-emerald' },
    { key: 'pcp', label: 'PCP', tagClass: 'tag-amber' },
    { key: 'operator', label: 'Operador / Técnico', tagClass: 'tag-slate' },
];

export const mockUsers = [
    { id: 'u1', name: 'Carlos M.', role: 'operator', short: 'CM' },
    { id: 'u2', name: 'Jeferson N.', role: 'supervisor', short: 'JN' },
    { id: 'u3', name: 'Qualidade RKM', role: 'quality', short: 'QR' },
    { id: 'u4', name: 'PCP RKM', role: 'pcp', short: 'PR' },
    { id: 'u5', name: 'Osmar Lamarck', role: 'admin', short: 'OL' },
    { id: 'u6', name: 'Marcelo R.', role: 'operator', short: 'MR' },
];

export const ALL_ROLES = ['admin', 'supervisor', 'quality', 'pcp', 'operator'];

export const userById = (id) => mockUsers.find(u => u.id === id);

export const filterServicesForRole = (services, role, userId) => {
    if (role === 'operator')
        return services.filter(s => s.assignedTo && s.assignedTo.operator === userId);
    return services;
};

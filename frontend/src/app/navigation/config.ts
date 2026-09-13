// @ts-nocheck

import {
    ALL_ROLES,
} from '../../features/role-access';
export const viewFromPath = (pathname) => {
    const view = pathname.replace(/^\/+/, '').split('/')[0];
    return view && SIDEBAR_ITEMS.some(item => item.key === view) ? view : 'dashboard';
};

export const SIDEBAR_ITEMS = [
    /* VISÃO GERAL */
    {
        key: 'dashboard',
        label: 'Painel',
        group: 'Visão geral',
        status: 'incomplete',
        roles: ALL_ROLES,
        icon: 'M3 12l2-2 4 4 8-8 4 4'
    },
    {
        key: 'mybench',
        label: 'Minha Bancada',
        group: 'Visão geral',
        status: 'incomplete',
        roles: ['admin', 'operator'],
        icon: 'M3 7h18M3 12h18M3 17h12'
    },

    /* CICLO OPERACIONAL */
    {
        key: 'receiving',
        label: 'Recebimento / Entrada',
        group: 'Operação',
        status: 'incomplete',
        placeholder: true,
        source: 'Serviços → Desmontagem → Criar Ordem',
        description: 'Entrada da peça/equipamento, abertura da OS e identificação inicial.',
        roles: ALL_ROLES,
        icon: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h5'
    },
    {
        key: 'inspection',
        label: 'Peritagem',
        group: 'Operação',
        status: 'incomplete',
        placeholder: true,
        source: 'Serviços → Desmontagem → Análise',
        description: 'Peritagem, inspeção, diagnóstico e decisão técnica.',
        roles: ALL_ROLES,
        icon: 'M9 3h6M10 3v4M8 8h8l2 12H6L8 8z'
    },
    {
        key: 'execution',
        label: 'Em Execução',
        group: 'Operação',
        status: 'incomplete',
        placeholder: true,
        source: 'OS + IT001 / IT002',
        description: 'Execução técnica do serviço e acompanhamento do progresso.',
        roles: ALL_ROLES,
        icon: 'M5 12h14M12 5v14'
    },
    {
        key: 'finished',
        label: 'Finalizados',
        group: 'Operação',
        status: 'missing',
        placeholder: true,
        source: 'Serviços → Finalizados',
        description: 'Histórico de serviços concluídos e encerrados.',
        roles: ALL_ROLES,
        icon: 'M5 13l4 4L19 7'
    },

    /* ITs */
    {
        key: 'it001',
        label: 'IT001 — Bexiga',
        group: 'Instruções de trabalho',
        status: 'ok',
        roles: ALL_ROLES,
        icon: 'M12 6v12m6-6H6'
    },
    {
        key: 'it002',
        label: 'IT002 — Pistão',
        group: 'Instruções de trabalho',
        status: 'ok',
        roles: ALL_ROLES,
        icon: 'M5 12h14M5 6h14M5 18h14'
    },

    /* GESTÃO */
    {
        key: 'supervisor',
        label: 'Supervisor',
        group: 'Gestão',
        status: 'incomplete',
        roles: ['admin', 'supervisor'],
        icon: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
        key: 'quality',
        label: 'Qualidade',
        group: 'Gestão',
        status: 'incomplete',
        roles: ['admin', 'quality'],
        icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'
    },
    {
        key: 'pcp',
        label: 'PCP',
        group: 'Gestão',
        status: 'incomplete',
        roles: ['admin', 'pcp'],
        icon: 'M3 3h18v4H3zM3 11h18v4H3zM3 19h18v2H3z'
    },

    /* ACESSO RÁPIDO */
    {
        key: 'pendencies',
        label: 'Pendências',
        group: 'Acesso rápido',
        status: 'ok',
        roles: ['admin', 'supervisor', 'quality', 'operator'],
        icon: 'M12 3 2.5 20h19L12 3Zm0 6v4m0 4h.01'
    },
    {
        key: 'evidences',
        label: 'Evidências',
        group: 'Acesso rápido',
        status: 'incomplete',
        roles: ['admin', 'quality', 'operator'],
        icon: 'M4 7h16M4 12h16M4 17h10'
    },
    {
        key: 'summary',
        label: 'Resumo / Laudo',
        group: 'Acesso rápido',
        status: 'incomplete',
        roles: ['admin', 'supervisor', 'quality', 'pcp'],
        icon: 'M9 12h6m-6 4h6m-7-9h8a2 2 0 012 2v11a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z'
    },

    /* FERRAMENTAS */
    {
        key: 'populator',
        label: 'Populador',
        group: 'Ferramentas',
        status: 'incomplete',
        roles: ['admin'],
        icon: 'M4 6c0-2 16-2 16 0s-16 2-16 0Zm0 0v12c0 2 16 2 16 0V6M4 12c0 2 16 2 16 0'
    },
];

export const SIDEBAR_STATUS_LABEL = {
    ok: 'OK',
    incomplete: 'INCOMPLETO',
    missing: 'INEXISTENTE',
};

// @ts-nocheck

import React, { useState } from 'react';

import {
    SIDEBAR_ITEMS,
    SIDEBAR_STATUS_LABEL,
} from './config';

import {
    ROLES,
    mockUsers,
} from '../../features/role-access';

import { SHOW_DEV_GUIDES } from '../../shared/dev/lizy-reference';

export const CleanTopBar = ({ view, alerts, onJumpAlerts, darkMode, onToggleDarkMode }) => {
    const labels = { dashboard: 'Painel', mybench: 'Minha Bancada', supervisor: 'Visão do Supervisor', quality: 'Visão da Qualidade', pcp: 'Visão do PCP', it001: 'IT001 — Bexiga', it002: 'IT002 — Pistão', pendencies: 'Pendências', evidences: 'Evidências', summary: 'Resumo / Laudo', authHistory: 'Histórico de autorizações' };
    return React.createElement("header", { className: "topbar px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-20" }, React.createElement("div", { className: "flex-1 min-w-0" }, React.createElement("div", { className: "text-xs text-slate-500" }, "RKM Service Manager"), React.createElement("div", { className: "text-base font-semibold text-slate-100 truncate" }, (SIDEBAR_ITEMS.find(item => item.key === view)?.label || labels[view] || 'Operações'))), React.createElement("button", { onClick: onJumpAlerts, className: 'btn ' + (alerts.length ? 'btn-danger' : 'btn-ghost') }, React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, React.createElement("path", { d: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 001.71 3L13.71 3.86a2 2 0 00-3.42 0z" })), alerts.length ? `${alerts.length} alerta${alerts.length > 1 ? 's' : ''}` : 'Sem alertas'), React.createElement("button", { onClick: onToggleDarkMode, className: "btn btn-ghost", title: darkMode ? "Ativar modo claro" : "Ativar modo escuro", "aria-label": darkMode ? "Ativar modo claro" : "Ativar modo escuro" }, darkMode ? "☀️" : "🌙"));
};

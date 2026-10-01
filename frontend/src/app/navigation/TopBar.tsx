// @ts-nocheck

import React from 'react';

import { SIDEBAR_ITEMS } from './config';

export const CleanTopBar = ({ view, darkMode, onToggleDarkMode, onHide }) => {
  const labels = {
    dashboard: 'Painel',
    mybench: 'Minha Bancada',
    supervisor: 'Visão do Supervisor',
    quality: 'Visão da Qualidade',
    pcp: 'Visão do PCP',
    it001: 'IT001 — Bexiga',
    it002: 'IT002 — Pistão',
    pendencies: 'Pendências',
    evidences: 'Evidências',
    summary: 'Resumo / Laudo',
    authHistory: 'Histórico de autorizações',
  };
  return React.createElement(
    'header',
    { className: 'topbar px-4 md:px-6 py-3 flex items-center gap-3 sticky top-0 z-20' },
    React.createElement(
      'div',
      { className: 'flex-1 min-w-0' },
      React.createElement('div', { className: 'text-xs text-slate-500' }, 'RKM Service Manager'),
      React.createElement(
        'div',
        { className: 'text-base font-semibold text-slate-100 truncate' },
        SIDEBAR_ITEMS.find((item) => item.key === view)?.label || labels[view] || 'Operações',
      ),
    ),
    React.createElement(
      'button',
      {
        onClick: onHide,
        className: 'btn btn-ghost',
        title: 'Ocultar topbar por 30 segundos',
        'aria-label': 'Ocultar topbar por 30 segundos',
      },
      React.createElement(
        'svg',
        {
          width: '16',
          height: '16',
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        React.createElement('path', { d: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z' }),
        React.createElement('circle', { cx: '12', cy: '12', r: '2.5' }),
      ),
    ),
    React.createElement(
      'button',
      {
        onClick: onToggleDarkMode,
        className: 'btn btn-ghost',
        title: darkMode ? 'Ativar modo claro' : 'Ativar modo escuro',
        'aria-label': darkMode ? 'Ativar modo claro' : 'Ativar modo escuro',
      },
      darkMode ? '☀️' : '🌙',
    ),
  );
};

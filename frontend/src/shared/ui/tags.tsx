// @ts-nocheck
import React from 'react';

export const StatusTag = ({ status, className = '' }) => {
    if (!status)
        return React.createElement("span", { className: 'tag tag-slate ' + className }, "\u2014");
    const s = status.toLowerCase();
    let cls = 'tag-slate';
    if (/(aprovado|liberado|conclu)/.test(s) && !/ressalva/.test(s))
        cls = 'tag-emerald';
    else if (/ressalva/.test(s))
        cls = 'tag-amber';
    else if (/(execu|análise|analise|recebido)/.test(s))
        cls = 'tag-blue';
    else if (/pendente/.test(s))
        cls = 'tag-amber';
    else if (/replanej/.test(s))
        cls = 'tag-blue';
    else if (/(reprovado|condenado|cancelad|bloqueado|interromp)/.test(s))
        cls = 'tag-red';
    return React.createElement("span", { className: 'tag ' + cls + ' ' + className }, status);
};

export const PriorityTag = ({ priority, className = '' }) => {
    const map = { 'Baixa': 'tag-emerald', 'Média': 'tag-amber', 'Alta': 'tag-red', 'Crítica': 'tag-red' };
    return React.createElement("span", { className: 'tag ' + (map[priority] || 'tag-slate') + ' ' + className }, priority || '—');
};

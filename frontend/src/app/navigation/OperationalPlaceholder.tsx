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

export const OperationalPlaceholder = ({ item }) => (
    React.createElement("div", { className: "p-4 md:p-6" },
        React.createElement("div", { className: "rkm-card w-full p-6 space-y-5" },

            React.createElement("div", { className: "flex items-start gap-3 flex-wrap" },
                React.createElement("div", { className: "flex-1" },
                    React.createElement(
                        "div",
                        { className: "text-xs uppercase tracking-wider text-blue-400 font-semibold mb-2" },
                        "Ciclo operacional"
                    ),
                    React.createElement(
                        "h1",
                        { className: "text-2xl font-semibold text-slate-100" },
                        item.label
                    ),
                    React.createElement(
                        "p",
                        { className: "text-sm text-slate-400 mt-2" },
                        item.description || ''
                    )
                ),
                SHOW_DEV_GUIDES &&
                React.createElement(
                    "span",
                    { className: `sidebar-progress sidebar-progress-${item.status}` },
                    SIDEBAR_STATUS_LABEL[item.status]
                )
            ),

            SHOW_DEV_GUIDES &&
            item.source &&
                React.createElement(
                    "div",
                    { className: "rkm-card-2 p-4" },
                    React.createElement(
                        "div",
                        { className: "text-xs uppercase tracking-wide text-slate-500 mb-1" },
                        "Referência atual na Lizy"
                    ),
                    React.createElement(
                        "div",
                        { className: "text-sm font-medium text-slate-200" },
                        item.source
                    )
                ),

            React.createElement(
                "div",
                { className: "text-xs text-slate-500" },
                item.status === 'missing'
                    ? 'Esta área faz parte do ciclo contratado, mas ainda não possui implementação equivalente.'
                    : 'Esta área já possui parte da estrutura, mas ainda não está concluída.'
            )
        )
    )
);

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

export const CleanSidebar = ({ view, setView, alertCount, activeIT, activeUser, activeRole, onLogout }) => {
    const [collapsed, setCollapsed] = useState(false);

    const [openGroups, setOpenGroups] = useState({
        'Visão geral': true,
        'Operação': true,
        'Instruções de trabalho': true,
        'Gestão': true,
        'Acesso rápido': true,
    });

    const items = SIDEBAR_ITEMS.filter(
        it => it.roles.includes(activeRole || 'admin')
    );

    const user = mockUsers.find(u => u.id === activeUser) || mockUsers[0];
    const role = ROLES.find(r => r.key === activeRole) || ROLES[0];

    const groupOrder = [
        'Visão geral',
        'Operação',
        'Instruções de trabalho',
        'Gestão',
        'Acesso rápido',
    ];

    const groups = groupOrder.map(group => [
        group,
        items.filter(item => item.group === group),
    ]);

    const toggleGroup = group =>
        setOpenGroups(prev => ({
            ...prev,
            [group]: !prev[group],
        }));

    return React.createElement(
        "aside",
        {
            className:
                `hidden md:flex sticky top-0 h-screen shrink-0 flex-col sidebar-shell ` +
                `${collapsed ? 'sidebar-collapsed w-[72px]' : 'w-80'}`
        },

        React.createElement(
            "div",
            { className: "sidebar-header" },

            React.createElement(
                "div",
                {
                    className:
                        "sidebar-brand w-9 h-9 shrink-0 rounded-lg " +
                        "bg-gradient-to-br from-blue-500 to-indigo-600 " +
                        "flex items-center justify-center font-bold"
                },
                "RK"
            ),

            React.createElement(
                "div",
                { className: "sidebar-label sidebar-brand-copy min-w-0" },
                React.createElement(
                    "div",
                    { className: "text-base font-semibold truncate" },
                    "RKM Service Manager"
                ),
                React.createElement(
                    "div",
                    { className: "text-xs text-slate-400 truncate" },
                    "Ciclo Operacional"
                )
            ),

            React.createElement(
                "button",
                {
                    type: "button",
                    className: "sidebar-toggle",
                    onClick: () => setCollapsed(v => !v),
                    title: collapsed ? 'Expandir sidebar' : 'Recolher sidebar'
                },
                React.createElement(
                    "svg",
                    {
                        width: "16",
                        height: "16",
                        viewBox: "0 0 24 24",
                        fill: "none",
                        stroke: "currentColor",
                        strokeWidth: "2"
                    },
                    React.createElement("path", {
                        d: collapsed
                            ? 'm9 18 6-6-6-6'
                            : 'm15 18-6-6 6-6'
                    })
                )
            )
        ),

        React.createElement(
            "nav",
            {
                className:
                    "sidebar-nav flex-1 min-h-0 overflow-y-auto px-3 pt-2"
            },

            groups.map(([groupLabel, groupItems]) =>
                groupItems.length > 0 &&
                React.createElement(
                    "div",
                    {
                        key: groupLabel,
                        className: "sidebar-section"
                    },

                    React.createElement(
                        "button",
                        {
                            type: "button",
                            className: "sidebar-label sidebar-group-toggle",
                            onClick: () => toggleGroup(groupLabel)
                        },

                        React.createElement("span", null, groupLabel),

                        React.createElement(
                            "span",
                            {
                                className:
                                    `sidebar-chevron ` +
                                    `${openGroups[groupLabel] ? 'is-open' : ''}`
                            },
                            "›"
                        )
                    ),

                    openGroups[groupLabel] &&
                        groupItems.map(it =>
                            React.createElement(
                                "button",
                                {
                                    key: it.key,
                                    onClick: () => setView(it.key),
                                    className:
                                        'sidebar-item ' +
                                        (view === it.key
                                            ? 'sidebar-item-active'
                                            : ''),
                                    title: SHOW_DEV_GUIDES
                                        ? `${it.label} — ${SIDEBAR_STATUS_LABEL[it.status]}`
                                        : it.label
                                },

                                React.createElement(
                                    "svg",
                                    {
                                        width: "17",
                                        height: "17",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "1.8",
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round"
                                    },
                                    React.createElement("path", {
                                        d: it.icon
                                    })
                                ),

                                React.createElement(
                                    "span",
                                    {
                                        className:
                                            "sidebar-label flex-1 min-w-0 truncate"
                                    },
                                    it.label
                                ),

                                it.key === 'pendencies' &&
                                    alertCount > 0 &&
                                    React.createElement(
                                        "span",
                                        { className: "badge-num" },
                                        alertCount
                                    ),

                                SHOW_DEV_GUIDES &&
                                React.createElement(
                                    "span",
                                    {
                                        className:
                                            `sidebar-progress ` +
                                            `sidebar-progress-${it.status}`
                                    },
                                    SIDEBAR_STATUS_LABEL[it.status]
                                )
                            )
                        )
                )
            )
        ),

        React.createElement(
            "div",
            { className: "sidebar-user" },

            React.createElement(
                "div",
                { className: "sidebar-user-main flex items-center gap-3" },

                React.createElement(
                    "div",
                    {
                        className:
                            "w-9 h-9 shrink-0 rounded-full " +
                            "bg-gradient-to-br from-emerald-500 to-cyan-600 " +
                            "flex items-center justify-center text-xs font-bold"
                    },
                    user.short
                ),

                React.createElement(
                    "div",
                    { className: "sidebar-label min-w-0 flex-1" },

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-xs font-medium text-slate-200 truncate"
                        },
                        user.name
                    ),

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-xs text-slate-500 truncate"
                        },
                        role.label
                    )
                )
            ),

            React.createElement(
                "button",
                {
                    className: "sidebar-logout",
                    onClick: onLogout,
                    title: "Sair"
                },
                React.createElement("span", {
                    className: "sidebar-logout-text"
                }, "Sair")
            )
        )
    );
};

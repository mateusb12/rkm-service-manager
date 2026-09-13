// @ts-nocheck
import React from 'react';

import {
    MyAuthRequestsList,
    mockUsers,
    userById,
} from '../role-access';

import {
    LizyReferenceCard,
    SHOW_DEV_GUIDES,
} from '../../shared/dev/lizy-reference';

import {
    PriorityTag,
    StatusTag,
} from '../../shared/ui/tags';

/* ============================================================
   UTILS — filtragem e agrupamento de serviços
   ============================================================ */
const matchAny = (s, regexes) => regexes.some(re => re.test(s.status));
const BENCH_DEMO_META = {
    'OS-1042': {
        dueDate: '08/09/2026',
        daysRemaining: 2,
        observations: 'Pré-carga em andamento'
    },
    'OS-2018': {
        dueDate: '10/09/2026',
        daysRemaining: 4,
        observations: 'Execução técnica em andamento'
    },
    'OS-1041': {
        dueDate: '06/09/2026',
        daysRemaining: 0,
        observations: 'Aprovado com ressalva'
    },
    'OS-2017': {
        dueDate: '07/09/2026',
        daysRemaining: 1,
        observations: 'Aguardando validação técnica'
    },
    'OS-1040': {
        dueDate: '04/09/2026',
        daysRemaining: -2,
        observations: 'Identificação / rastreabilidade pendente'
    },
    'OS-2016': {
        dueDate: '13/09/2026',
        daysRemaining: 7,
        observations: 'Liberado para entrega'
    },
    'OS-1039': {
        dueDate: '14/09/2026',
        daysRemaining: 8,
        observations: 'Serviço liberado'
    },
    'OS-2019': {
        dueDate: '09/09/2026',
        daysRemaining: 3,
        observations: 'Aguardando validação da Qualidade'
    },
    'OS-1043': {
        dueDate: '12/09/2026',
        daysRemaining: 6,
        observations: 'Aguardando início'
    },
    'OS-2020': {
        dueDate: '11/09/2026',
        daysRemaining: 5,
        observations: 'Aguardando componente / material'
    },
};

const getBenchStep = (service, itConfig) => {
    const config = itConfig[service.it];
    const step = config?.steps?.find(item => item.id === service.step);

    return {
        current: service.step || 0,
        total: config?.steps?.length || 20,
        label: step?.short || step?.label || 'Etapa não identificada',
    };
};

const getBenchDeadline = (service) => {
    const demo = BENCH_DEMO_META[service.id] || {};

    const days = service.daysRemaining ?? demo.daysRemaining;
    const dueDate = service.dueDate ?? demo.dueDate ?? '';

    if (days === undefined || days === null) {
        return {
            label: '—',
            detail: dueDate,
            className: 'bench-deadline-neutral'
        };
    }

    if (days < 0) {
        return {
            label: `Atrasado ${Math.abs(days)}d`,
            detail: dueDate ? `Entrega: ${dueDate}` : '',
            className: 'bench-deadline-overdue'
        };
    }

    if (days === 0) {
        return {
            label: 'Hoje',
            detail: dueDate ? `Entrega: ${dueDate}` : '',
            className: 'bench-deadline-today'
        };
    }

    return {
        label: days === 1 ? '1 dia' : `${days} dias`,
        detail: dueDate ? `Entrega: ${dueDate}` : '',
        className: days <= 2
            ? 'bench-deadline-soon'
            : 'bench-deadline-normal'
    };
};

const BenchEquipmentThumbnail = ({ service }) => {
    if (service.photoUrl) {
        return React.createElement("img", {
            src: service.photoUrl,
            alt: `Foto ${service.id}`,
            className: "bench-thumb",
        });
    }

    return React.createElement(
        "div",
        {
            className: "bench-thumb bench-thumb-empty",
            title: "Sem foto vinculada",
        },
        React.createElement(
            "svg",
            {
                width: "19",
                height: "19",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
            },
            React.createElement("rect", {
                x: "3",
                y: "5",
                width: "18",
                height: "14",
                rx: "2"
            }),
            React.createElement("circle", {
                cx: "8.5",
                cy: "10",
                r: "1.5"
            }),
            React.createElement("path", {
                d: "m21 15-5-5L5 19"
            })
        )
    );
};

const BenchActions = ({
    service,
    onOpenIT,
    onOpenEvidence,
    onOpenSummary
}) => (
    React.createElement(
        "details",
        { className: "bench-actions" },

        React.createElement(
            "summary",
            {
                className: "bench-actions-trigger",
                title: `Funções da ${service.id}`,
                "aria-label": `Funções da ${service.id}`
            },
            "•••"
        ),

        React.createElement(
            "div",
            { className: "bench-actions-menu" },

            React.createElement(
                "button",
                {
                    type: "button",
                    onClick: event => {
                        event.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');

                        onOpenIT?.(service.it);
                    }
                },
                "Abrir ",
                service.it
            ),

            React.createElement(
                "button",
                {
                    type: "button",
                    onClick: event => {
                        event.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');

                        onOpenEvidence?.(service.it);
                    }
                },
                "Ver evidências"
            ),

            React.createElement(
                "button",
                {
                    type: "button",
                    onClick: event => {
                        event.currentTarget
                            .closest('details')
                            ?.removeAttribute('open');

                        onOpenSummary?.(service.it);
                    }
                },
                "Resumo / Laudo"
            )
        )
    )
);


/* ============================================================
   VIEW — Recebimento / Entrada — Criar Ordem
   Paridade inicial: Lizy → Serviços → Desmontagem → Criar Ordem
   ============================================================ */

export const MyBenchView = ({
    itConfig,
    services,
    activeUser,
    openIT001,
    openIT002,
    rec001,
    rec002,
    onOpenIT,
    onOpenEvidence,
    onOpenSummary
}) => {
    const user = userById(activeUser) || mockUsers[0];

    const mine = services.filter(
        service =>
            service.assignedTo &&
            service.assignedTo.operator === activeUser
    );

    return (
        React.createElement(
            "div",
            { className: "p-4 md:p-6 space-y-5" },

            typeof LizyReferenceCard !== 'undefined' &&
                SHOW_DEV_GUIDES && React.createElement(LizyReferenceCard, {
                    source: "Serviços → Desmontagem",
                    detail:
                        "A Lizy concentra aqui a lista de OS e o técnico associado; " +
                        "a Minha Bancada especializa essa visão por operador."
                }),

            React.createElement(
                "div",
                {
                    className:
                        "rkm-card p-5 flex flex-col md:flex-row " +
                        "md:items-center gap-3"
                },

                React.createElement(
                    "div",
                    { className: "flex-1" },

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-[11px] text-blue-300 uppercase tracking-wider"
                        },
                        "Operador / Técnico"
                    ),

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-[18px] font-semibold mt-1"
                        },
                        "Minha Bancada — ",
                        user.name
                    ),

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-[12.5px] text-slate-400"
                        },
                        "Apenas serviços atribuídos a você. ",
                        mine.length,
                        " OS na bancada."
                    )
                ),

                React.createElement(
                    "div",
                    { className: "flex gap-2" },

                    React.createElement(
                        "button",
                        {
                            className: "btn btn-ghost",
                            onClick: openIT001
                        },
                        "Abrir IT001"
                    ),

                    React.createElement(
                        "button",
                        {
                            className: "btn btn-ghost",
                            onClick: openIT002
                        },
                        "Abrir IT002"
                    )
                )
            ),

            mine.length === 0
                ? React.createElement(
                    "div",
                    {
                        className:
                            "rkm-card p-8 text-center text-slate-400"
                    },

                    React.createElement(
                        "div",
                        {
                            className:
                                "text-[28px] mb-2 text-slate-500"
                        },
                        "∅"
                    ),

                    "Nenhum serviço atribuído a ",
                    user.name,
                    " no momento."
                )

                : React.createElement(
                    "div",
                    {
                        className:
                            "rkm-card overflow-visible"
                    },

                    React.createElement(
                        "div",
                        {
                            className:
                                "px-5 py-3.5 border-b border-rkmborder " +
                                "flex items-center gap-2"
                        },

                        React.createElement("span", {
                            className: "sec-bullet"
                        }),

                        React.createElement(
                            "div",
                            {
                                className:
                                    "text-[13.5px] font-semibold flex-1"
                            },
                            "Meus serviços"
                        ),

                        React.createElement(
                            "div",
                            {
                                className:
                                    "text-[11px] text-slate-500"
                            },
                            mine.length,
                            mine.length === 1
                                ? " OS atribuída"
                                : " OS atribuídas"
                        )
                    ),

                    React.createElement(
                        "div",
                        {
                            className:
                                "overflow-x-auto overflow-y-visible"
                        },

                        React.createElement(
                            "table",
                            {
                                className:
                                    "bench-table w-full text-[13px]"
                            },

                            React.createElement(
                                "thead",
                                null,

                                React.createElement(
                                    "tr",
                                    {
                                        className:
                                            "text-slate-400 text-[11px] " +
                                            "uppercase tracking-wide"
                                    },

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "OS / Foto"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Cliente"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Equipamento"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Etapa"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Status"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Prazo"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-left px-4 py-3"
                                        },
                                        "Observações"
                                    ),

                                    React.createElement(
                                        "th",
                                        {
                                            className:
                                                "text-center px-4 py-3"
                                        },
                                        "Funções"
                                    )
                                )
                            ),

                            React.createElement(
                                "tbody",
                                null,

                                mine.map(service => {
                                    const step =
                                        getBenchStep(service, itConfig);

                                    const deadline =
                                        getBenchDeadline(service);

                                    const demo =
                                        BENCH_DEMO_META[service.id] || {};

                                    const observations =
                                        service.observations ??
                                        demo.observations ??
                                        '—';

                                    return React.createElement(
                                        "tr",
                                        {
                                            key: service.id,
                                            className:
                                                "border-t border-rkmborder " +
                                                "hover:bg-rkmcard2/40 transition"
                                        },

                                        /* OS + FOTO + IT */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3"
                                            },

                                            React.createElement(
                                                "div",
                                                {
                                                    className:
                                                        "flex items-center gap-3"
                                                },

                                                React.createElement(
                                                    BenchEquipmentThumbnail,
                                                    { service }
                                                ),

                                                React.createElement(
                                                    "div",
                                                    {
                                                        className:
                                                            "min-w-0"
                                                    },

                                                    React.createElement(
                                                        "div",
                                                        {
                                                            className:
                                                                "font-medium text-slate-100 " +
                                                                "whitespace-nowrap"
                                                        },
                                                        service.id
                                                    ),

                                                    React.createElement(
                                                        "span",
                                                        {
                                                            className:
                                                                'tag mt-1 ' +
                                                                (
                                                                    service.it === 'IT001'
                                                                        ? 'tag-blue'
                                                                        : 'tag-violet'
                                                                )
                                                        },
                                                        service.it
                                                    )
                                                )
                                            )
                                        ),

                                        /* CLIENTE */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3 text-slate-300 " +
                                                    "bench-client"
                                            },
                                            service.client
                                        ),

                                        /* EQUIPAMENTO */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3 text-slate-300 " +
                                                    "bench-equipment"
                                            },
                                            service.equipment
                                        ),

                                        /* ETAPA */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3"
                                            },

                                            React.createElement(
                                                "div",
                                                {
                                                    className:
                                                        "text-slate-200 font-medium"
                                                },
                                                step.current,
                                                "/",
                                                step.total
                                            ),

                                            React.createElement(
                                                "div",
                                                {
                                                    className:
                                                        "text-[11px] text-slate-500 " +
                                                        "mt-0.5 whitespace-nowrap"
                                                },
                                                step.label
                                            )
                                        ),

                                        /* STATUS + PRIORIDADE */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3"
                                            },

                                            React.createElement(
                                                "div",
                                                {
                                                    className:
                                                        "flex flex-col items-start gap-1.5"
                                                },

                                                React.createElement(
                                                    StatusTag,
                                                    {
                                                        status:
                                                            service.status,
                                                        className:
                                                            "table-tag table-status"
                                                    }
                                                ),

                                                React.createElement(
                                                    PriorityTag,
                                                    {
                                                        priority:
                                                            service.priority,
                                                        className:
                                                            "table-tag table-priority"
                                                    }
                                                )
                                            )
                                        ),

                                        /* PRAZO */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3"
                                            },

                                            React.createElement(
                                                "span",
                                                {
                                                    className:
                                                        "bench-deadline " +
                                                        deadline.className,
                                                    title:
                                                        deadline.detail
                                                },
                                                deadline.label
                                            ),

                                            deadline.detail &&
                                                React.createElement(
                                                    "div",
                                                    {
                                                        className:
                                                            "text-[10.5px] text-slate-500 " +
                                                            "mt-1 whitespace-nowrap"
                                                    },
                                                    deadline.detail.replace(
                                                        "Entrega: ",
                                                        ""
                                                    )
                                                )
                                        ),

                                        /* OBSERVAÇÕES */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3 text-slate-400"
                                            },

                                            React.createElement(
                                                "div",
                                                {
                                                    className:
                                                        "bench-observation",
                                                    title:
                                                        observations
                                                },
                                                observations
                                            )
                                        ),

                                        /* FUNÇÕES */
                                        React.createElement(
                                            "td",
                                            {
                                                className:
                                                    "px-4 py-3 text-center " +
                                                    "relative"
                                            },

                                            React.createElement(
                                                BenchActions,
                                                {
                                                    service,
                                                    onOpenIT,
                                                    onOpenEvidence,
                                                    onOpenSummary
                                                }
                                            )
                                        )
                                    );
                                })
                            )
                        )
                    )
                ),

            rec001 &&
                rec002 &&
                React.createElement(
                    MyAuthRequestsList,
                    {
                        rec001,
                        rec002,
                        activeUser
                    }
                ),

            React.createElement(
                "div",
                { className: "rkm-card p-5" },

                React.createElement(
                    "div",
                    {
                        className:
                            "text-[13.5px] font-semibold mb-2"
                    },
                    "Diretrizes operacionais"
                ),

                React.createElement(
                    "ul",
                    {
                        className:
                            "text-[12.5px] text-slate-300 " +
                            "space-y-1.5 list-disc pl-5"
                    },

                    React.createElement(
                        "li",
                        null,
                        "Você só vê serviços atribuídos à sua bancada."
                    ),

                    React.createElement(
                        "li",
                        null,
                        "Etapas críticas (despressurização, isolamento, carga, " +
                        "validação da Qualidade) podem bloquear avanço — siga os alertas."
                    ),

                    React.createElement(
                        "li",
                        null,
                        "Em caso de dúvida técnica, ausência de referência ou erro de montagem, " +
                        "registre no checklist e acione o supervisor via \"Solicitar autorização\"."
                    ),

                    React.createElement(
                        "li",
                        null,
                        "Liberação final depende de validação técnica (supervisor) e " +
                        "validação da Qualidade (apenas IT002)."
                    )
                )
            )
        )
    );
};

/* ============================================================
   VIEW — Visão do Supervisor
   ============================================================ */

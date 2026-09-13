// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './features/auth';
import { ServiceEntryView } from './features/service-entry';
import { MyBenchView } from './features/bench';
import {
    STEPS_IT002,
    initialRecordIT002,
    computeAlertsIT002,
    STEP_RENDERERS_IT002,
} from './features/its/it002';
import {
    STEPS,
    initialRecord,
    computeAlerts,
    STEP_RENDERERS,
} from './features/its/it001';

import {
    ROLES,
    mockUsers,
    ALL_ROLES,
    userById,
    buildApprovalHistoryEntry,
    AuthRequestButton,
    AuthRequestModal,
    MyAuthRequestsList,
    AuthorizationHistoryPanel,
    SupervisorAuthQueue,
    QualityAuthQueue,
    PCPAuthQueue,
    AdminAuthQueueAll,
    AuthDecisionModal,
    getStepAuthorizationState,
    StepAuthorizationHistory,
} from './features/role-access';
import { AlertBox } from './shared/ui/feedback';
import { PriorityTag, StatusTag } from './shared/ui/tags';
import {
    Field,
    TextArea,
    TextInput,
    Select,
    Toggle,
    ChipMulti,
} from './shared/ui/form-controls';
import {
    LizyReferenceCard,
    SHOW_DEV_GUIDES,
} from './shared/dev/lizy-reference';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    viewFromPath,
    SIDEBAR_ITEMS,
    OperationalPlaceholder,
    CleanSidebar,
    CleanTopBar,
} from './app/navigation';
import {
    IT_CONFIG,
    loadDraft,
    saveDraft,
    clearDraft,
    ITForm,
    PendenciesView,
    EvidencesView,
    SummaryView,
} from './features/service-workflow';
/* ============================================================
   MODELO DE DADOS — alinhado ao prompt e à IT001 validada
   (NÃO INVENTAR critérios técnicos; lacunas são tratadas como
   pendência técnica, observação ou validação do supervisor.)
   ============================================================ */
/* ============================================================
   USUÁRIOS, PERFIS E PERMISSÕES (Tarefa 1 — base simulada)
   ============================================================ */
/* Sidebar — escopo operacional contratado */

/* ============================================================
   MOCK — serviços de exemplo (com atribuições de usuários)
   ============================================================ */
const sampleServices = [
    { id: 'OS-1042', it: 'IT001', client: 'Metalúrgica Andrade', equipment: 'Acumulador Bexiga 10L • Parker', tech: 'Carlos M.', date: '24/04/2026', status: 'Em execução', priority: 'Alta', step: 13, assignedTo: { operator: 'u1', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-2018', it: 'IT002', client: 'Refinaria Costa Leste', equipment: 'Acumulador Pistão 25L • HYDAC', tech: 'Jeferson N.', date: '24/04/2026', status: 'Em execução', priority: 'Alta', step: 13, assignedTo: { operator: 'u6', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-1041', it: 'IT001', client: 'Indústria HidroSul', equipment: 'Acumulador Bexiga 5L • Bosch Rexroth', tech: 'Jeferson N.', date: '23/04/2026', status: 'Aprovado com ressalva', priority: 'Média', step: 20, assignedTo: { operator: 'u6', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-2017', it: 'IT002', client: 'Siderúrgica Norte', equipment: 'Acumulador Pistão 50L • Roth', tech: 'Carlos M.', date: '23/04/2026', status: 'Pendente técnico', priority: 'Crítica', step: 9, assignedTo: { operator: 'u1', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-1040', it: 'IT001', client: 'Cliente confidencial', equipment: 'Acumulador s/ identificação', tech: 'Carlos M.', date: '22/04/2026', status: 'Bloqueado por rastreabilidade', priority: 'Crítica', step: 2, assignedTo: { operator: 'u1', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-2016', it: 'IT002', client: 'Mineração Vale Verde', equipment: 'Acumulador Pistão 30L • Parker', tech: 'Jeferson N.', date: '21/04/2026', status: 'Liberado', priority: 'Baixa', step: 20, assignedTo: { operator: 'u6', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-1039', it: 'IT001', client: 'Frota Logístico Sul', equipment: 'Acumulador Bexiga 20L • HYDAC', tech: 'Jeferson N.', date: '20/04/2026', status: 'Liberado', priority: 'Baixa', step: 20, assignedTo: { operator: 'u6', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-2019', it: 'IT002', client: 'Indústria Química Sul', equipment: 'Acumulador Pistão 15L • HYDAC', tech: 'Carlos M.', date: '25/04/2026', status: 'Aguardando qualidade', priority: 'Alta', step: 15, assignedTo: { operator: 'u1', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-1043', it: 'IT001', client: 'Petroquímica Norte', equipment: 'Acumulador Bexiga 8L • Parker', tech: 'Marcelo R.', date: '25/04/2026', status: 'Recebido', priority: 'Média', step: 1, assignedTo: { operator: 'u6', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
    { id: 'OS-2020', it: 'IT002', client: 'Açúcar e Álcool Cana', equipment: 'Acumulador Pistão 40L • Roth', tech: 'Carlos M.', date: '25/04/2026', status: 'Pendente material', priority: 'Média', step: 10, assignedTo: { operator: 'u1', supervisor: 'u2', quality: 'u3', pcp: 'u4' } },
];
/* ============================================================
   UTIL — persistência local (rascunho)
   ============================================================ */
/* ============================================================
   UTIL — atualizador imutável de caminhos aninhados
   ============================================================ */
/* ============================================================
   ALERTAS CRÍTICOS — 14 regras conforme prompt §10
   ============================================================ */
/* ============================================================
   COMPONENTES — Tags
   ============================================================ */
/* ============================================================
   COMPONENTES — Inputs primitivos
   ============================================================ */
/* ============================================================
   LAYOUT — Sidebar / TopBar
   ============================================================ */

/*
 * UI auxiliar de desenvolvimento.
 *
 * Local:      `vite`       -> import.meta.env.DEV === true
 * Produção:   `vite build` -> import.meta.env.DEV === false
 *
 * Usado somente para badges de progresso e referências da Lizy.
 */





/* ============================================================
   VIEW — Dashboard (cards + tabela referenciando o layout)
   ============================================================ */
const KPICard = ({ label, value, hint, accent, icon }) => (React.createElement("div", { className: "rkm-card kpi-card" },
    React.createElement("div", { className: "kpi-header" },
        React.createElement("div", { className: "kpi-label text-xs text-slate-400 uppercase tracking-wide" }, label),
        React.createElement("div", { className: 'kpi-icon rounded-lg flex items-center justify-center ' + accent }, icon)),
    React.createElement("div", { className: "kpi-value text-2xl font-semibold" }, value),
    React.createElement("div", { className: "kpi-hint text-xs text-slate-500" }, hint)));
const Dashboard = ({ services, onOpenIT001, onOpenIT002, onResume001, onResume002, hasDraft001, hasDraft002, alerts001, alerts002 }) => {
    const [filterIT, setFilterIT] = useState('all');
    const filtered = services.filter(s => filterIT === 'all' ? true : s.it === filterIT);
    const open = filtered.filter(s => /(execu|análise|recebido|pendente)/i.test(s.status)).length;
    const blocked = filtered.filter(s => /bloque/i.test(s.status)).length;
    const approved = filtered.filter(s => /(aprovad|liberad)/i.test(s.status)).length;
    const totalAlerts = alerts001.filter(a => a.severity === 'critical').length + alerts002.filter(a => a.severity === 'critical').length;
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-6" },
        SHOW_DEV_GUIDES && React.createElement(LizyReferenceCard, {
            source: "Serviços → Desmontagem",
            detail: "Referência para visão geral das OS, status, técnico responsável e andamento operacional."
        }),
        React.createElement("div", { className: "rkm-card operations-header" },
            React.createElement("div", { className: "operations-identity" },
                React.createElement("div", { className: "operations-kicker" }, "REGISTRO OPERACIONAL"),
                React.createElement("h1", { className: "text-xl md:text-2xl font-semibold" }, "Registro Operacional de Servi\u00E7os"),
                React.createElement("p", { className: "operations-description" }, "Cada IT possui checklist, alertas e rascunho independentes. Revis\u00F5es validadas: IT001 Rev. 00 \u00B7 IT002 Rev. 00"),
                React.createElement("div", { className: "operations-pilots" },
                    React.createElement("span", { className: "operations-meta-label" }, "Pilotos ativos"),
                    React.createElement("span", { className: "operations-chip" }, "IT001 \u00B7 Bexiga"),
                    React.createElement("span", { className: "operations-chip" }, "IT002 \u00B7 Pist\u00E3o"))),
            React.createElement("div", { className: "operations-actions" },
                React.createElement("div", { className: "operations-actions-title" }, "A\u00E7\u00F5es r\u00E1pidas"),
                React.createElement("div", { className: "operations-action-row" },
                    React.createElement("span", { className: "operations-it" }, "IT001"),
                    React.createElement("span", { className: `operations-status ${hasDraft001 ? '' : 'is-empty'}` }, hasDraft001 ? 'Rascunho' : 'Sem rascunho'),
                    hasDraft001 && React.createElement("button", { className: "btn btn-ghost operations-resume", onClick: onResume001, title: "Continuar rascunho IT001" }, "Continuar"),
                    React.createElement("button", { className: "btn btn-primary operations-new", onClick: onOpenIT001 }, "+ Novo servi\u00E7o")),
                React.createElement("div", { className: "operations-action-row" },
                    React.createElement("span", { className: "operations-it" }, "IT002"),
                    React.createElement("span", { className: `operations-status ${hasDraft002 ? '' : 'is-empty'}` }, hasDraft002 ? 'Rascunho' : 'Sem rascunho'),
                    hasDraft002 && React.createElement("button", { className: "btn btn-ghost operations-resume", onClick: onResume002, title: "Continuar rascunho IT002" }, "Continuar"),
                    React.createElement("button", { className: "btn btn-primary operations-new", onClick: onOpenIT002 }, "+ Novo servi\u00E7o")))),
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
            React.createElement(KPICard, { label: "Em execu\u00E7\u00E3o", value: open, hint: filterIT === 'all' ? 'Todos os módulos' : filterIT, accent: "bg-blue-500/20 text-blue-300", icon: React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("path", { d: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" }),
                    React.createElement("path", { d: "M14 2v6h6" })) }),
            React.createElement(KPICard, { label: "Aprovados / liberados", value: approved, hint: "Conforme IT", accent: "bg-emerald-500/20 text-emerald-300", icon: React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("path", { d: "M5 13l4 4L19 7" })) }),
            React.createElement(KPICard, { label: "Bloqueados", value: blocked, hint: "Seguran\u00E7a / rastreabilidade", accent: "bg-rose-500/20 text-rose-300", icon: React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("circle", { cx: "12", cy: "12", r: "10" }),
                    React.createElement("path", { d: "M4.93 4.93l14.14 14.14" })) }),
            React.createElement(KPICard, { label: "Alertas cr\u00EDticos", value: totalAlerts, hint: "Rascunhos IT001 + IT002", accent: "bg-amber-500/20 text-amber-300", icon: React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                    React.createElement("path", { d: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" })) })),
        React.createElement("div", { className: "rkm-card overflow-hidden" },
            React.createElement("div", { className: "px-5 py-3.5 border-b border-rkmborder flex items-center gap-2 flex-wrap" },
                React.createElement("span", { className: "sec-bullet" }),
                React.createElement("div", { className: "text-sm font-semibold flex-1" }, "Servi\u00E7os \u2014 Acompanhamento Operacional"),
                React.createElement("div", { className: "flex gap-1" }, [{ k: 'all', l: 'Todos' }, { k: 'IT001', l: 'IT001 — Bexiga' }, { k: 'IT002', l: 'IT002 — Pistão' }].map(opt => (React.createElement("button", { key: opt.k, onClick: () => setFilterIT(opt.k), className: 'btn text-xs ' + (filterIT === opt.k ? 'btn-primary' : 'btn-ghost') }, opt.l))))),
            React.createElement("div", { className: "overflow-x-auto" },
                React.createElement("table", { className: "w-full text-sm" },
                    React.createElement("thead", null,
                        React.createElement("tr", { className: "text-slate-400 text-xs uppercase tracking-wide" },
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "OS / Laudo"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "IT"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "Cliente"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "Equipamento"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "T\u00E9cnico"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "Data"),
                            React.createElement("th", { className: "text-center font-medium px-5 py-3" }, "Status"),
                            React.createElement("th", { className: "text-center font-medium px-5 py-3" }, "Prioridade"),
                            React.createElement("th", { className: "text-left font-medium px-5 py-3" }, "Etapa"),
                            React.createElement("th", { className: "text-right font-medium px-5 py-3" }, "A\u00E7\u00F5es"))),
                    React.createElement("tbody", null, filtered.map(s => (React.createElement("tr", { key: s.id, className: "border-t border-rkmborder hover:bg-rkmcard2/40 transition" },
                        React.createElement("td", { className: "px-5 py-3 font-medium text-slate-100" }, s.id),
                        React.createElement("td", { className: "px-5 py-3" },
                            React.createElement("span", { className: 'tag ' + (s.it === 'IT001' ? 'tag-blue' : 'tag-violet') }, s.it)),
                        React.createElement("td", { className: "px-5 py-3 text-slate-300" }, s.client),
                        React.createElement("td", { className: "px-5 py-3 text-slate-300" }, s.equipment),
                        React.createElement("td", { className: "px-5 py-3 text-slate-300" }, s.tech),
                        React.createElement("td", { className: "px-5 py-3 text-slate-400" }, s.date),
                        React.createElement("td", { className: "px-5 py-3 text-center" },
                            React.createElement(StatusTag, { status: s.status, className: "table-tag table-status" })),
                        React.createElement("td", { className: "px-5 py-3 text-center" },
                            React.createElement(PriorityTag, { priority: s.priority, className: "table-tag table-priority" })),
                        React.createElement("td", { className: "px-5 py-3 text-slate-400" },
                            s.step,
                            "/20"),
                        React.createElement("td", { className: "px-5 py-3 text-right" },
                            React.createElement("button", { className: "text-slate-400 hover:text-blue-300 px-2", title: "Visualizar" },
                                React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                                    React.createElement("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
                                    React.createElement("circle", { cx: "12", cy: "12", r: "3" }))))))))))),
        React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
            React.createElement("div", { className: "rkm-card p-5" },
                React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                    React.createElement("span", { className: "sec-bullet" }),
                    React.createElement("div", { className: "text-sm font-semibold" }, "Postura t\u00E9cnica \u2014 IT001 (Bexiga)")),
                React.createElement("ul", { className: "text-xs text-slate-300 space-y-1.5 list-disc pl-5" },
                    React.createElement("li", null, "Sem teste hidr\u00E1ulico formal \u2014 verifica\u00E7\u00E3o final por pr\u00E9-carga + estanqueidade (IT001 \u00A721)."),
                    React.createElement("li", null,
                        "Pr\u00E9-carga somente com ",
                        React.createElement("b", null, "nitrog\u00EAnio seco"),
                        "; sem fonte confi\u00E1vel \u2192 pend\u00EAncia t\u00E9cnica (IT001 \u00A719)."),
                    React.createElement("li", null, "Sem torque gen\u00E9rico \u2014 fabricante ou valida\u00E7\u00E3o do supervisor (IT001 \u00A718)."),
                    React.createElement("li", null, "Despressuriza\u00E7\u00E3o confirmada antes da abertura \u2014 ponto de bloqueio (IT001 \u00A711)."),
                    React.createElement("li", null, "Lacuna ambiental ainda imatura (IT001 \u00A724, plano ABX-18/19)."))),
            React.createElement("div", { className: "rkm-card p-5" },
                React.createElement("div", { className: "flex items-center gap-2 mb-2" },
                    React.createElement("span", { className: "w-2 h-2 rounded-full bg-violet-400", style: { boxShadow: '0 0 0 4px rgba(167,139,250,.18)' } }),
                    React.createElement("div", { className: "text-sm font-semibold" }, "Postura t\u00E9cnica \u2014 IT002 (Pist\u00E3o)")),
                React.createElement("ul", { className: "text-xs text-slate-300 space-y-1.5 list-disc pl-5" },
                    React.createElement("li", null,
                        "Aprova\u00E7\u00E3o trip\u00E9: ",
                        React.createElement("b", null, "mant\u00E9m press\u00E3o + sem vazamento + valida\u00E7\u00E3o da Qualidade"),
                        " (IT002 \u00A717)."),
                    React.createElement("li", null,
                        React.createElement("b", null, "Apenas nitrog\u00EAnio"),
                        " \u2014 nunca oxig\u00EAnio ou ar comprimido (IT002 \u00A710)."),
                    React.createElement("li", null,
                        "Antes de leitura/carga: ",
                        React.createElement("b", null, "isolar do sistema"),
                        " e ",
                        React.createElement("b", null, "descarregar lado fluido"),
                        " (IT002 \u00A710)."),
                    React.createElement("li", null,
                        "Sem placa/dado confi\u00E1vel \u2192 ",
                        React.createElement("b", null, "parar"),
                        " at\u00E9 valida\u00E7\u00E3o do supervisor (IT002 \u00A715)."),
                    React.createElement("li", null, "Erros cr\u00EDticos de montagem (corte veda\u00E7\u00E3o / veda\u00E7\u00E3o invertida / lubrifica\u00E7\u00E3o / alinhamento) bloqueiam a carga (IT002 \u00A714)."),
                    React.createElement("li", null, "Libera\u00E7\u00E3o operacional s\u00F3 com aprova\u00E7\u00E3o da Qualidade (IT002 \u00A719)."))))));
};
/* ============================================================
   VIEW — IT Form (multi-step)
   ============================================================ */
/* ===== Step renderers ===== */
/* ===== Inspeção (8) — sub-blocos ===== */
/* ============================================================
   VIEW — ITForm
   ============================================================ */
/* ============================================================
   VIEW — Pendências
   ============================================================ */
/* ============================================================
   VIEW — Evidências
   ============================================================ */
/* ============================================================
   VIEW — Resumo / Laudo (helper Row)
   ============================================================ */
/* ============================================================
   SELETOR de IT (Pendências/Evidências/Resumo)
   ============================================================ */
const SupervisorBucket = ({ title, count, hint, accent, services, onOpenService }) => (React.createElement("div", { className: "rkm-card p-4" },
    React.createElement("div", { className: "flex items-center gap-2" },
        React.createElement("div", { className: 'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold ' + accent }, count),
        React.createElement("div", { className: "flex-1 min-w-0" },
            React.createElement("div", { className: "text-sm font-semibold leading-tight" }, title),
            React.createElement("div", { className: "text-xs text-slate-500" }, hint))),
    services.length > 0 && (React.createElement("div", { className: "mt-3 pt-3 border-t border-rkmborder space-y-1.5" },
        services.slice(0, 4).map(s => (React.createElement("button", { key: s.id, onClick: () => onOpenService && onOpenService(s), className: "w-full flex items-center gap-2 text-left text-xs text-slate-300 hover:text-blue-300 hover:bg-rkmcard2/40 px-2 py-1 rounded" },
            React.createElement("span", { className: "font-medium text-slate-200" }, s.id),
            React.createElement("span", { className: 'tag ' + (s.it === 'IT001' ? 'tag-blue' : 'tag-violet') }, s.it),
            React.createElement("span", { className: "flex-1 truncate" }, s.client)))),
        services.length > 4 && React.createElement("div", { className: "text-xs text-slate-500 px-2" },
            "+ ",
            services.length - 4,
            " mais\u2026")))));
const SupervisorView = ({ services, rec001, rec002, activeRole, onDecisionClick }) => {
    const alertaCritico = services.filter(s => /(execu|análise|pendente t[ée]cnico|bloque)/i.test(s.status));
    const bloqueados = services.filter(s => /bloque/i.test(s.status));
    const aguardandoValid = services.filter(s => /pendente t[ée]cnico|aguardando valida/i.test(s.status));
    const condenado = services.filter(s => /condenado/i.test(s.status));
    const duvida = services.filter(s => /pendente t[ée]cnico/i.test(s.status));
    const ausenciaRef = services.filter(s => /bloqueado por rastreab/i.test(s.status));
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-xs text-blue-300 uppercase tracking-wider" }, "Supervisor"),
            React.createElement("div", { className: "text-lg font-semibold mt-1" }, "Vis\u00E3o T\u00E9cnica de Controle"),
            React.createElement("div", { className: "text-xs text-slate-400" }, "Solicita\u00E7\u00F5es t\u00E9cnicas pendentes + buckets anal\u00EDticos por status do servi\u00E7o.")),
        React.createElement(SupervisorAuthQueue, { rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: onDecisionClick }),
        React.createElement(AuthorizationHistoryPanel, { rec001: rec001, rec002: rec002, scope: "supervisor", title: "Hist\u00F3rico de autoriza\u00E7\u00F5es t\u00E9cnicas" }),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
            React.createElement(SupervisorBucket, { title: "Servi\u00E7os com alerta cr\u00EDtico", count: alertaCritico.length, hint: "Em execu\u00E7\u00E3o / an\u00E1lise / pendentes / bloqueados", accent: "bg-rose-500/15 text-rose-300", services: alertaCritico }),
            React.createElement(SupervisorBucket, { title: "Servi\u00E7os bloqueados", count: bloqueados.length, hint: "Seguran\u00E7a / rastreabilidade", accent: "bg-rose-500/15 text-rose-300", services: bloqueados }),
            React.createElement(SupervisorBucket, { title: "Aguardando valida\u00E7\u00E3o t\u00E9cnica", count: aguardandoValid.length, hint: "D\u00FAvida ou pendente do supervisor", accent: "bg-amber-500/15 text-amber-300", services: aguardandoValid }),
            React.createElement(SupervisorBucket, { title: "Componente condenado", count: condenado.length, hint: "Decis\u00F5es IT001 \u00A714 / IT002 \u00A712", accent: "bg-rose-500/15 text-rose-300", services: condenado }),
            React.createElement(SupervisorBucket, { title: "D\u00FAvida t\u00E9cnica", count: duvida.length, hint: "Pendentes de supervisor", accent: "bg-amber-500/15 text-amber-300", services: duvida }),
            React.createElement(SupervisorBucket, { title: "Aus\u00EAncia de refer\u00EAncia confi\u00E1vel", count: ausenciaRef.length, hint: "Sem placa / sem dado de fabricante", accent: "bg-rose-500/15 text-rose-300", services: ausenciaRef }))));
};
/* ============================================================
   VIEW — Visão da Qualidade
   ============================================================ */
const QualityView = ({ services, rec001, rec002, activeRole, onDecisionClick }) => {
    const aguardando = services.filter(s => /aguardando qualidade|pendente.*qualidade/i.test(s.status));
    const evidPendentes = services.filter(s => /em execu|pendente t[ée]cnico/i.test(s.status));
    const laudoPend = services.filter(s => !/liberado/i.test(s.status));
    const ressalva = services.filter(s => /ressalva/i.test(s.status));
    const reprovados = services.filter(s => /reprovado/i.test(s.status));
    const ncAberta = services.filter(s => /pendente|bloque/i.test(s.status));
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-xs text-emerald-300 uppercase tracking-wider" }, "Qualidade"),
            React.createElement("div", { className: "text-lg font-semibold mt-1" }, "Vis\u00E3o da Qualidade"),
            React.createElement("div", { className: "text-xs text-slate-400" }, "Valida\u00E7\u00E3o final, evid\u00EAncias e conformidade. IT002 \u00A717/\u00A719 destacada.")),
        React.createElement(QualityAuthQueue, { rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: onDecisionClick }),
        React.createElement(AuthorizationHistoryPanel, { rec001: rec001, rec002: rec002, scope: "quality", title: "Hist\u00F3rico de autoriza\u00E7\u00F5es da Qualidade" }),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" },
            React.createElement(SupervisorBucket, { title: "Aguardando valida\u00E7\u00E3o da Qualidade", count: aguardando.length, hint: "IT002 \u00A715 \u2014 etapa exclusiva", accent: "bg-emerald-500/15 text-emerald-300", services: aguardando }),
            React.createElement(SupervisorBucket, { title: "Evid\u00EAncias finais pendentes", count: evidPendentes.length, hint: "Foto/registro m\u00EDnimo do servi\u00E7o", accent: "bg-amber-500/15 text-amber-300", services: evidPendentes }),
            React.createElement(SupervisorBucket, { title: "Laudos pendentes", count: laudoPend.length, hint: "Pr\u00E9-emiss\u00E3o / aprova\u00E7\u00E3o", accent: "bg-amber-500/15 text-amber-300", services: laudoPend }),
            React.createElement(SupervisorBucket, { title: "Aprovados com ressalva", count: ressalva.length, hint: "Conformes com observa\u00E7\u00E3o", accent: "bg-amber-500/15 text-amber-300", services: ressalva }),
            React.createElement(SupervisorBucket, { title: "Reprovados", count: reprovados.length, hint: "Sem manter press\u00E3o / com vazamento", accent: "bg-rose-500/15 text-rose-300", services: reprovados }),
            React.createElement(SupervisorBucket, { title: "Servi\u00E7os com NC aberta", count: ncAberta.length, hint: "Pend\u00EAncia ou bloqueio identificado", accent: "bg-rose-500/15 text-rose-300", services: ncAberta })),
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-sm font-semibold mb-2" }, "Trip\u00E9 de aprova\u00E7\u00E3o IT002 \u00A717"),
            React.createElement("ul", { className: "text-xs text-slate-300 space-y-1.5 list-disc pl-5" },
                React.createElement("li", null,
                    React.createElement("b", null, "Mant\u00E9m press\u00E3o"),
                    " \u2014 verifica\u00E7\u00E3o operacional."),
                React.createElement("li", null,
                    React.createElement("b", null, "Sem vazamento"),
                    " \u2014 verifica\u00E7\u00E3o de estanqueidade."),
                React.createElement("li", null,
                    React.createElement("b", null, "Valida\u00E7\u00E3o da Qualidade"),
                    " \u2014 etapa exclusiva (IT002 \u00A715). Sem aprova\u00E7\u00E3o aqui, libera\u00E7\u00E3o fica bloqueada.")))));
};
/* ============================================================
   VIEW — Visão do PCP
   ============================================================ */
const PCPView = ({ services, rec001, rec002, activeRole, onDecisionClick }) => {
    const recebidos = services.filter(s => /recebido/i.test(s.status));
    const emExecucao = services.filter(s => /em execu/i.test(s.status));
    const aguardSup = services.filter(s => /pendente t[ée]cnico/i.test(s.status));
    const aguardQual = services.filter(s => /aguardando qualidade/i.test(s.status));
    const aguardMat = services.filter(s => /pendente material/i.test(s.status));
    const aguardCli = services.filter(s => /pendente cliente|aguardando cliente/i.test(s.status));
    const prontos = services.filter(s => /aprovado/i.test(s.status));
    const liberados = services.filter(s => /liberado/i.test(s.status));
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-xs text-amber-300 uppercase tracking-wider" }, "PCP"),
            React.createElement("div", { className: "text-lg font-semibold mt-1" }, "Vis\u00E3o do PCP \u2014 Andamento e Fechamento"),
            React.createElement("div", { className: "text-xs text-slate-400" }, "Status geral dos servi\u00E7os. PCP n\u00E3o aprova etapas t\u00E9cnicas cr\u00EDticas \u2014 apenas registra fechamento.")),
        React.createElement(PCPAuthQueue, { rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: onDecisionClick }),
        React.createElement(AuthorizationHistoryPanel, { rec001: rec001, rec002: rec002, scope: "pcp", title: "Hist\u00F3rico de autoriza\u00E7\u00F5es do PCP" }),
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
            React.createElement(SupervisorBucket, { title: "Recebidos", count: recebidos.length, hint: "Aguardando in\u00EDcio", accent: "bg-blue-500/15 text-blue-300", services: recebidos }),
            React.createElement(SupervisorBucket, { title: "Em execu\u00E7\u00E3o", count: emExecucao.length, hint: "Em andamento", accent: "bg-blue-500/15 text-blue-300", services: emExecucao }),
            React.createElement(SupervisorBucket, { title: "Aguardando supervisor", count: aguardSup.length, hint: "Valida\u00E7\u00E3o t\u00E9cnica pendente", accent: "bg-amber-500/15 text-amber-300", services: aguardSup }),
            React.createElement(SupervisorBucket, { title: "Aguardando qualidade", count: aguardQual.length, hint: "Valida\u00E7\u00E3o da Qualidade pendente", accent: "bg-emerald-500/15 text-emerald-300", services: aguardQual }),
            React.createElement(SupervisorBucket, { title: "Aguardando material", count: aguardMat.length, hint: "Componente em falta", accent: "bg-amber-500/15 text-amber-300", services: aguardMat }),
            React.createElement(SupervisorBucket, { title: "Aguardando cliente", count: aguardCli.length, hint: "Resposta / informa\u00E7\u00E3o", accent: "bg-amber-500/15 text-amber-300", services: aguardCli }),
            React.createElement(SupervisorBucket, { title: "Prontos para fechamento", count: prontos.length, hint: "Aprovados \u2014 fechar", accent: "bg-emerald-500/15 text-emerald-300", services: prontos }),
            React.createElement(SupervisorBucket, { title: "Liberados", count: liberados.length, hint: "J\u00E1 entregues", accent: "bg-emerald-500/15 text-emerald-300", services: liberados })),
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-sm font-semibold mb-2" }, "Pr\u00F3xima Tarefa (prepara\u00E7\u00E3o)"),
            React.createElement("p", { className: "text-xs text-slate-300" }, "Fila de fechamento administrativo do PCP, integra\u00E7\u00E3o futura com Lise (IT002 \u00A73, \u00A718; APH-15) e relat\u00F3rio de SLA. Bot\u00F5es para registrar fechamento ser\u00E3o adicionados na Tarefa 2 \u2014 Bloco 2B."))));
};
/* ============================================================
   APP RAIZ — dual IT + perfis + Bloco 2A (autorizações)
   ============================================================ */
const App = () => {
    const { user: authenticatedUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [view, setView] = useState(() => viewFromPath(location.pathname));
    const [activeIT, setActiveIT] = useState('IT001');
    const activeUser = authenticatedUser?.id || 'u5';
    const activeRole = authenticatedUser?.role || 'admin';
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rkm-theme') === 'dark');
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
        localStorage.setItem('rkm-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);
    // Modal de solicitação (Bloco 2A)
    const [authModal, setAuthModal] = useState({ open: false, context: null });
    const [decisionModal, setDecisionModal] = useState({ open: false, request: null, decision: '' });
    // Rascunhos independentes por IT
    const [step001, setStep001] = useState(1);
    const [step002, setStep002] = useState(1);
    const [rec001, setRec001] = useState(() => loadDraft('IT001') || initialRecord());
    const [rec002, setRec002] = useState(() => loadDraft('IT002') || initialRecordIT002());
    const [hasDraft001, setHasDraft001] = useState(!!loadDraft('IT001'));
    const [hasDraft002, setHasDraft002] = useState(!!loadDraft('IT002'));
    const didMount001 = useRef(false);
    const didMount002 = useRef(false);
    const [services] = useState(sampleServices);
    const alerts001 = useMemo(() => computeAlerts(rec001), [rec001]);
    const alerts002 = useMemo(() => computeAlertsIT002(rec002), [rec002]);
    useEffect(() => {
        if (didMount001.current) {
            saveDraft('IT001', rec001);
            setHasDraft001(true);
        }
        else {
            didMount001.current = true;
        }
    }, [rec001]);
    useEffect(() => {
        if (didMount002.current) {
            saveDraft('IT002', rec002);
            setHasDraft002(true);
        }
        else {
            didMount002.current = true;
        }
    }, [rec002]);
    const ctx = activeIT === 'IT002'
        ? { record: rec002, setRecord: setRec002, step: step002, setStep: setStep002, alerts: alerts002, hasDraft: hasDraft002 }
        : { record: rec001, setRecord: setRec001, step: step001, setStep: setStep001, alerts: alerts001, hasDraft: hasDraft001 };
    const totalAlerts = alerts001.length + alerts002.length;
    useEffect(() => {
        setView(viewFromPath(location.pathname));
    }, [location.pathname]);
    const handleSetView = (newView) => {
        if (newView === 'it001')
            setActiveIT('IT001');
        if (newView === 'it002')
            setActiveIT('IT002');
        navigate(`/${newView}`);
    };
    const openIT001 = () => {
        clearDraft('IT001');
        setRec001(initialRecord());
        setStep001(1);
        setHasDraft001(false);
        setActiveIT('IT001');
        navigate('/it001');
    };
    const openIT002 = () => {
        clearDraft('IT002');
        setRec002(initialRecordIT002());
        setStep002(1);
        setHasDraft002(false);
        setActiveIT('IT002');
        navigate('/it002');
    };
    const resumeIT001 = () => {
        setActiveIT('IT001');
        navigate('/it001');
    };
    const resumeIT002 = () => {
        setActiveIT('IT002');
        navigate('/it002');
    };
    const goToPendencies = () => {
        navigate('/pendencies');
    };
    const goToStep = (step) => {
        if (activeIT === 'IT002') {
            setStep002(step);
            navigate('/it002');
        }
        else {
            setStep001(step);
            navigate('/it001');
        }
    };
    const handleFinish = () => {
        const status = activeIT === 'IT002'
            ? (rec002.release.condicaoFinal || rec002.identification.currentStatus || 'Concluído')
            : (rec001.release.condicaoFinal || rec001.identification.currentStatus || 'Concluído');
        alert(`${activeIT} — registro concluído/simulado. Status: ${status}`);
    };
    const handleExport = (content) => {
        const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rkm-${activeIT.toLowerCase()}-registro.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const handleRequestAuth = (context) => {
        setAuthModal({ open: true, context });
    };
    const handleSubmitAuth = (payload) => {
        const user = mockUsers.find(u => u.id === activeUser) || mockUsers[0];
        const now = payload.requestedAt || new Date().toISOString();
        const creationHistory = buildApprovalHistoryEntry({
            request: payload,
            action: 'Solicitação criada',
            status: 'Pendente',
            user,
            userRole: user.role || activeRole,
            comment: payload.reason || '',
            dateTime: now,
        });
        const payloadWithHistory = {
            ...payload,
            history: (payload.history && payload.history.length ? payload.history : [{
                    id: creationHistory.id,
                    authorizationId: payload.id,
                    action: 'Solicitação criada',
                    status: 'Pendente',
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role || activeRole,
                    dateTime: now,
                    comment: payload.reason || '',
                }]),
        };
        if ((payload.it || activeIT) === 'IT002') {
            setRec002(prev => ({
                ...prev,
                authorizationRequests: [...(prev.authorizationRequests || []), payloadWithHistory],
                approvalHistory: [...(prev.approvalHistory || []), creationHistory],
            }));
        }
        else {
            setRec001(prev => ({
                ...prev,
                authorizationRequests: [...(prev.authorizationRequests || []), payloadWithHistory],
                approvalHistory: [...(prev.approvalHistory || []), creationHistory],
            }));
        }
    };
    const handleDecisionClick = (request, decision) => {
        setDecisionModal({ open: true, request, decision });
    };
    const handleConfirmDecision = (request, decision, justification) => {
        const user = mockUsers.find(u => u.id === activeUser) || mockUsers[0];
        const now = new Date().toISOString();
        const historyEntry = buildApprovalHistoryEntry({
            request,
            action: decision,
            status: decision,
            user,
            userRole: activeRole,
            comment: justification,
            dateTime: now,
        });
        const internalHistoryEntry = {
            id: historyEntry.id,
            authorizationId: request.id,
            action: decision,
            status: decision,
            userId: user.id,
            userName: user.name,
            userRole: activeRole,
            dateTime: now,
            comment: justification,
        };
        const updateRequest = (req) => req.id === request.id ? {
            ...req,
            status: decision,
            decision,
            decisionReason: justification,
            decidedByUserId: user.id,
            decidedByName: user.name,
            decidedByRole: activeRole,
            decidedAt: now,
            history: [
                ...(req.history || []),
                internalHistoryEntry,
            ]
        } : req;
        if ((request.it || request._itLabel) === 'IT002') {
            setRec002(prev => ({
                ...prev,
                authorizationRequests: (prev.authorizationRequests || []).map(updateRequest),
                approvalHistory: [...(prev.approvalHistory || []), historyEntry],
            }));
        }
        else {
            setRec001(prev => ({
                ...prev,
                authorizationRequests: (prev.authorizationRequests || []).map(updateRequest),
                approvalHistory: [...(prev.approvalHistory || []), historyEntry],
            }));
        }
        setDecisionModal({ open: false, request: null, decision: '' });
        alert('Decisão registrada com sucesso.');
    };
    const closeAuthModal = () => setAuthModal({ open: false, context: null });
    const closeDecisionModal = () => setDecisionModal({ open: false, request: null, decision: '' });
    const renderView = () => {
        if (view === 'receiving') {
            return React.createElement(ServiceEntryView);
        }
        if (view === 'dashboard') {
            return (React.createElement(Dashboard, { services: services, onOpenIT001: openIT001, onOpenIT002: openIT002, onResume001: resumeIT001, onResume002: resumeIT002, hasDraft001: hasDraft001, hasDraft002: hasDraft002, alerts001: alerts001, alerts002: alerts002 }));
        }
        if (view === 'mybench') {
            return React.createElement(MyBenchView, { itConfig: IT_CONFIG,
                services: services,
                activeUser: activeUser,
                openIT001: openIT001,
                openIT002: openIT002,
                rec001: rec001,
                rec002: rec002,

                onOpenIT: it => {
                    setActiveIT(it);
                    setView(it === 'IT002' ? 'it002' : 'it001');
                },

                onOpenEvidence: it => {
                    setActiveIT(it);
                    setView('evidences');
                },

                onOpenSummary: it => {
                    setActiveIT(it);
                    setView('summary');
                }
            });
        }
        if (view === 'supervisor') {
            return React.createElement(SupervisorView, { services: services, rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: handleDecisionClick });
        }
        if (view === 'quality') {
            return React.createElement(QualityView, { services: services, rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: handleDecisionClick });
        }
        if (view === 'pcp') {
            return React.createElement(PCPView, { services: services, rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: handleDecisionClick });
        }
        if (view === 'it001' || view === 'it002') {
            return (React.createElement(ITForm, { record: ctx.record, setRecord: ctx.setRecord, currentStep: ctx.step, setCurrentStep: ctx.setStep, alerts: ctx.alerts, onFinish: handleFinish, itCode: activeIT, activeRole: activeRole, onRequestAuth: handleRequestAuth }));
        }
        if (view === 'pendencies') {
            return React.createElement(PendenciesView, { alerts: ctx.alerts, record: ctx.record, goTo: goToStep, activeIT: activeIT, activeRole: activeRole, onRequestAuth: handleRequestAuth });
        }
        if (view === 'evidences') {
            return React.createElement(EvidencesView, { record: ctx.record, activeIT: activeIT });
        }
        if (view === 'summary') {
            return React.createElement(SummaryView, { record: ctx.record, alerts: ctx.alerts, onExport: handleExport, activeIT: activeIT });
        }
        if (view === 'authHistory') {
            if (activeRole === 'operator') {
                return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
                    React.createElement(MyAuthRequestsList, { rec001: rec001, rec002: rec002, activeUser: activeUser })));
            }
            return (React.createElement("div", { className: "p-4 md:p-6" },
                React.createElement(AuthorizationHistoryPanel, { rec001: rec001, rec002: rec002, scope: activeRole === 'admin' ? 'all' : activeRole, title: activeRole === 'admin' ? 'Histórico global de autorizações' : 'Histórico de autorizações' })));
        }
        const operationalItem = SIDEBAR_ITEMS.find(
            item => item.key === view && item.placeholder
        );

        if (operationalItem) {
            return React.createElement(
                OperationalPlaceholder,
                { item: operationalItem }
            );
        }

        return null;
    };
    return (React.createElement("div", { className: "app-shell min-h-screen flex bg-rkmbg text-slate-200" },
        React.createElement(CleanSidebar, { view: view, setView: handleSetView, alertCount: totalAlerts, activeIT: activeIT, activeUser: activeUser, activeRole: activeRole, onLogout: logout }),
        React.createElement("main", { className: "flex-1 min-w-0" },
            React.createElement(CleanTopBar, { view: view, alerts: ctx.alerts, onJumpAlerts: goToPendencies, darkMode: darkMode, onToggleDarkMode: () => setDarkMode(value => !value) }),
            activeRole === 'admin' && view === 'dashboard' && (React.createElement("div", { className: "px-4 md:px-6 pt-4" },
                React.createElement(AdminAuthQueueAll, { rec001: rec001, rec002: rec002, activeRole: activeRole, onDecisionClick: handleDecisionClick }),
                React.createElement("div", { className: "mt-4" },
                    React.createElement(AuthorizationHistoryPanel, { rec001: rec001, rec002: rec002, scope: "all", title: "Hist\u00F3rico global de autoriza\u00E7\u00F5es" })))),
            renderView()),
        React.createElement(AuthRequestModal, { open: authModal.open, onClose: closeAuthModal, onSubmit: handleSubmitAuth, context: authModal.context || {}, activeUser: activeUser, activeRole: activeRole }),
        React.createElement(AuthDecisionModal, { open: decisionModal.open, onClose: closeDecisionModal, request: decisionModal.request, decision: decisionModal.decision, activeUser: activeUser, activeRole: activeRole, onConfirm: handleConfirmDecision })));
};
export default App;

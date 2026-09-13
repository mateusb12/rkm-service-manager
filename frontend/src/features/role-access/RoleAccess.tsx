// @ts-nocheck
import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    Field,
    Select,
    TextArea,
} from '../../shared/ui/form-controls';

import {
    AlertBox,
} from '../../shared/ui/feedback';

import {
    ROLES,
    mockUsers,
} from './model';

/* ============================================================
   BLOCO 2A — Solicitações de autorização (somente criação)
   ============================================================ */
export const AUTH_REQUEST_TYPES = [
    'Validação técnica',
    'Liberação para prosseguir',
    'Dúvida técnica',
    'Condição insegura',
    'Rastreabilidade insuficiente',
    'Evidência pendente',
    'Validação da Qualidade',
    'Fechamento PCP',
    'NC / retrabalho',
    'Outro',
];
export const AUTH_CRITICALITY = ['Baixa', 'Média', 'Alta', 'Crítica'];
export const AUTH_STATUSES = ['Pendente', 'Aprovado', 'Reprovado', 'Ajuste solicitado'];
/* Mapa: tipo de solicitação → perfil responsável pela decisão */
export const REQUEST_TYPE_TO_APPROVER = {
    'Validação técnica': 'supervisor',
    'Liberação para prosseguir': 'supervisor',
    'Dúvida técnica': 'supervisor',
    'Condição insegura': 'supervisor',
    'Rastreabilidade insuficiente': 'supervisor',
    'NC / retrabalho': 'supervisor',
    'Evidência pendente': 'quality',
    'Validação da Qualidade': 'quality',
    'Fechamento PCP': 'pcp',
    'Outro': 'supervisor',
};
/* Tag visual de status de autorização */
export const AuthStatusTag = ({ status }) => {
    const map = {
        'Pendente': 'tag-amber',
        'Aprovado': 'tag-emerald',
        'Reprovado': 'tag-red',
        'Ajuste solicitado': 'tag-violet',
    };
    return React.createElement("span", { className: 'tag ' + (map[status] || 'tag-slate') }, status || '—');
};
/* Tag visual de criticidade */
export const CriticalityTag = ({ value }) => {
    const map = { 'Baixa': 'tag-emerald', 'Média': 'tag-amber', 'Alta': 'tag-red', 'Crítica': 'tag-red' };
    return React.createElement("span", { className: 'tag ' + (map[value] || 'tag-slate') }, value || '—');
};
/* Utilitários de histórico — Tarefa 2B.3 */
export const roleLabelFor = (roleKey) => (ROLES.find(r => r.key === roleKey) || {}).label || roleKey || '—';
export const roleTagFor = (roleKey) => (ROLES.find(r => r.key === roleKey) || {}).tagClass || 'tag-slate';
export const formatDateTimeBR = (value) => value ? new Date(value).toLocaleString('pt-BR') : '—';
export const normalizeActionLabel = (action) => {
    if (action === 'Decisão registrada')
        return 'Decisão registrada';
    return action || '—';
};
export const authReturnMessage = (status) => {
    if (status === 'Aprovado')
        return 'Autorização aprovada. A liberação real do próximo passo será controlada na Tarefa 3.';
    if (status === 'Reprovado')
        return 'Solicitação reprovada. Verificar justificativa e alinhar com o responsável.';
    if (status === 'Ajuste solicitado')
        return 'Ajuste solicitado — revisar a etapa e complementar as informações antes de nova validação.';
    return 'Solicitação pendente. Aguarde a decisão do responsável.';
};
export const authReturnClass = (status) => {
    if (status === 'Aprovado')
        return 'alert-info';
    if (status === 'Reprovado')
        return 'alert-critical';
    if (status === 'Ajuste solicitado')
        return 'alert-warn';
    return 'alert-info';
};
export const buildApprovalHistoryEntry = ({ request, action, status, user, userRole, comment, dateTime }) => ({
    id: 'HIST-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    authorizationId: request.id,
    it: request.it || request._itLabel || 'IT001',
    osNumber: request.osNumber || '',
    client: request.client || '',
    stepId: request.stepId || 0,
    stepLabel: request.stepLabel || '',
    requestType: request.requestType || '',
    criticality: request.criticality || '',
    assignedApproverRole: request.assignedApproverRole || '',
    action,
    status,
    userId: user.id,
    userName: user.name,
    userRole,
    dateTime,
    comment: comment || '',
});
/* Botão "Solicitar autorização" — visível apenas para operador */
export const AuthRequestButton = ({ activeRole, onClick, size = 'sm', label = 'Solicitar autorização' }) => {
    if (activeRole !== 'operator')
        return null;
    return (React.createElement("button", { onClick: onClick, className: 'btn btn-ghost ' + (size === 'sm' ? 'text-xs !py-1 !px-2.5' : 'text-xs'), title: "Abrir solicita\u00E7\u00E3o de autoriza\u00E7\u00E3o" },
        React.createElement("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" })),
        label));
};
/* Modal de criação de solicitação de autorização */
export const AuthRequestModal = ({ open, onClose, onSubmit, context, activeUser, activeRole }) => {
    const user = mockUsers.find(u => u.id === activeUser) || mockUsers[0];
    const roleLabel = (ROLES.find(r => r.key === user.role) || {}).label || '';
    const [requestType, setRequestType] = useState('');
    const [reason, setReason] = useState('');
    const [criticality, setCriticality] = useState('Média');
    useEffect(() => {
        if (open) {
            setRequestType((context === null || context === void 0 ? void 0 : context.requestType) || '');
            setReason((context === null || context === void 0 ? void 0 : context.suggestedReason) || '');
            setCriticality((context === null || context === void 0 ? void 0 : context.suggestedCriticality) || 'Média');
        }
    }, [open, context]);
    if (!open)
        return null;
    const approverRole = REQUEST_TYPE_TO_APPROVER[requestType] || '';
    const approverLabel = approverRole ? (ROLES.find(r => r.key === approverRole) || {}).label : '';
    const canSubmit = !!requestType && !!reason && !!criticality;
    const handleSubmit = () => {
        if (!canSubmit)
            return;
        const now = new Date();
        const ts = now.toISOString();
        const id = 'AUTH-' + Date.now();
        const histId = 'HIST-' + Date.now();
        const payload = {
            id,
            it: context.it || 'IT001',
            osNumber: context.osNumber || '',
            client: context.client || '',
            stepId: context.stepId || 0,
            stepLabel: context.stepLabel || '',
            requestType, reason, criticality,
            requestedByUserId: user.id,
            requestedByName: user.name,
            requestedByRole: user.role,
            requestedAt: ts,
            assignedApproverRole: approverRole,
            assignedApproverUserId: '',
            assignedApproverName: '',
            status: 'Pendente',
            decision: null,
            decisionReason: '',
            decidedByUserId: '',
            decidedByName: '',
            decidedAt: '',
            relatedAlertMessage: context.alertMessage || '',
            relatedEvidence: [],
            history: [{
                    id: histId,
                    authorizationId: id,
                    action: 'Solicitação criada',
                    status: 'Pendente',
                    userId: user.id,
                    userName: user.name,
                    userRole: user.role,
                    dateTime: ts,
                    comment: reason,
                }],
        };
        onSubmit(payload);
        onClose();
    };
    return (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", style: { background: 'rgba(2,8,20,.7)', backdropFilter: 'blur(4px)' }, onClick: onClose },
        React.createElement("div", { className: "rkm-card w-full max-w-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "px-5 py-4 border-b border-rkmborder flex items-center gap-3" },
                React.createElement("span", { className: "sec-bullet" }),
                React.createElement("div", { className: "flex-1" },
                    React.createElement("div", { className: "text-xs uppercase tracking-wider text-blue-300" }, "Bloco 2A"),
                    React.createElement("div", { className: "text-base font-semibold" }, "Nova solicita\u00E7\u00E3o de autoriza\u00E7\u00E3o")),
                React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-200", title: "Fechar" },
                    React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                        React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })))),
            React.createElement("div", { className: "p-5 space-y-4" },
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                    React.createElement(Field, { label: "IT" },
                        React.createElement("div", { className: "rkm-input flex items-center" },
                            React.createElement("span", { className: 'tag ' + (context.it === 'IT001' ? 'tag-blue' : 'tag-violet') }, context.it || 'IT001'))),
                    React.createElement(Field, { label: "OS / Laudo" },
                        React.createElement("div", { className: "rkm-input" }, context.osNumber || React.createElement("span", { className: "text-slate-500" }, "\u2014 sem OS"))),
                    React.createElement(Field, { label: "Cliente", className: "md:col-span-2" },
                        React.createElement("div", { className: "rkm-input" }, context.client || React.createElement("span", { className: "text-slate-500" }, "\u2014 sem cliente"))),
                    React.createElement(Field, { label: "Etapa" },
                        React.createElement("div", { className: "rkm-input" }, context.stepId ? `${context.stepId} • ${context.stepLabel}` : React.createElement("span", { className: "text-slate-500" }, "\u2014 etapa n\u00E3o identificada"))),
                    React.createElement(Field, { label: "Solicitante" },
                        React.createElement("div", { className: "rkm-input flex items-center gap-2" },
                            React.createElement("span", null, user.name),
                            React.createElement("span", { className: 'tag ' + ((ROLES.find(r => r.key === user.role) || {}).tagClass || 'tag-slate') }, roleLabel)))),
                context.alertMessage && (React.createElement(AlertBox, { severity: "warn", title: "Alerta de origem" }, context.alertMessage)),
                React.createElement(Field, { label: "Tipo de solicita\u00E7\u00E3o", required: true },
                    React.createElement(Select, { value: requestType, onChange: setRequestType, options: AUTH_REQUEST_TYPES, placeholder: "Selecione o tipo..." })),
                approverRole && (React.createElement("div", { className: "text-xs text-slate-400" },
                    "Respons\u00E1vel sugerido: ",
                    React.createElement("b", { className: "text-slate-200" }, approverLabel))),
                React.createElement(Field, { label: "Criticidade", required: true },
                    React.createElement("div", { className: "flex gap-2 flex-wrap" }, AUTH_CRITICALITY.map(c => (React.createElement("button", { key: c, onClick: () => setCriticality(c), className: 'btn text-xs ' + (criticality === c ? 'btn-primary' : 'btn-ghost') },
                        React.createElement(CriticalityTag, { value: c })))))),
                React.createElement(Field, { label: "Motivo da solicita\u00E7\u00E3o", required: true, hint: "Descreva o cen\u00E1rio que exige decis\u00E3o superior \u2014 refer\u00EAncia IT, lacuna, d\u00FAvida ou risco identificado." },
                    React.createElement(TextArea, { rows: 4, value: reason, onChange: setReason, placeholder: "Ex.: bexiga apresentou ind\u00EDcio de fadiga e n\u00E3o h\u00E1 fabricante na placa..." })),
                React.createElement("div", { className: "flex items-center gap-2 text-xs text-slate-500" },
                    React.createElement("span", null, "Status inicial:"),
                    " ",
                    React.createElement(AuthStatusTag, { status: "Pendente" }),
                    React.createElement("span", { className: "ml-auto text-slate-600" }, "ID ser\u00E1 gerado no envio"))),
            React.createElement("div", { className: "px-5 py-3 border-t border-rkmborder flex items-center gap-2 justify-end" },
                React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"),
                React.createElement("button", { className: 'btn btn-primary ' + (canSubmit ? '' : 'opacity-50 cursor-not-allowed'), onClick: handleSubmit, disabled: !canSubmit }, "Enviar solicita\u00E7\u00E3o")))));
};
/* Lista das solicitações do operador ativo (de ambos os rascunhos) */
export const MyAuthRequestsList = ({ rec001, rec002, activeUser }) => {
    const reqs001 = (rec001.authorizationRequests || []).map(r => ({ ...r, _itLabel: 'IT001' }));
    const reqs002 = (rec002.authorizationRequests || []).map(r => ({ ...r, _itLabel: 'IT002' }));
    const all = [...reqs001, ...reqs002]
        .filter(r => r.requestedByUserId === activeUser)
        .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
    return (React.createElement("div", { className: "rkm-card overflow-hidden" },
        React.createElement("div", { className: "px-5 py-3.5 border-b border-rkmborder flex items-center gap-2" },
            React.createElement("span", { className: "sec-bullet" }),
            React.createElement("div", { className: "flex-1" },
                React.createElement("div", { className: "text-sm font-semibold" }, "Minhas solicita\u00E7\u00F5es de autoriza\u00E7\u00E3o"),
                React.createElement("div", { className: "text-xs text-slate-500" }, "Retorno das decis\u00F5es recebidas \u2014 Tarefa 2B.3")),
            React.createElement("span", { className: "text-xs text-slate-500" },
                all.length,
                " registro",
                all.length !== 1 ? 's' : '')),
        all.length === 0 ? (React.createElement("div", { className: "p-6 text-center text-xs text-slate-400" }, "Nenhuma solicita\u00E7\u00E3o criada ainda. Use \"Solicitar autoriza\u00E7\u00E3o\" nos alertas ou pend\u00EAncias.")) : (React.createElement("div", { className: "p-4 space-y-3" }, all.map(r => {
            var _a;
            const decided = r.status && r.status !== 'Pendente';
            const decisionRole = r.decidedByRole || ((_a = (r.history || []).slice().reverse().find(h => h.status === r.status && h.userRole)) === null || _a === void 0 ? void 0 : _a.userRole) || '';
            return (React.createElement("div", { key: r.id, className: (r.status === 'Ajuste solicitado' ? 'alert-warn' : 'rkm-card-2') + ' p-4 space-y-3' },
                React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                    React.createElement("span", { className: 'tag ' + (r._itLabel === 'IT001' ? 'tag-blue' : 'tag-violet') }, r._itLabel),
                    React.createElement("span", { className: "font-mono text-xs text-slate-400" }, r.id),
                    React.createElement(AuthStatusTag, { status: r.status }),
                    React.createElement(CriticalityTag, { value: r.criticality }),
                    React.createElement("span", { className: "flex-1" }),
                    React.createElement("span", { className: "text-xs text-slate-500" }, formatDateTimeBR(r.requestedAt))),
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2 text-xs" },
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-slate-500" }, "OS / Laudo:"),
                        " ",
                        React.createElement("b", { className: "text-slate-200" }, r.osNumber || '—')),
                    React.createElement("div", { className: "md:col-span-2" },
                        React.createElement("span", { className: "text-slate-500" }, "Cliente:"),
                        " ",
                        React.createElement("span", { className: "text-slate-200" }, r.client || '—')),
                    React.createElement("div", { className: "md:col-span-2" },
                        React.createElement("span", { className: "text-slate-500" }, "Etapa:"),
                        " ",
                        React.createElement("span", { className: "text-slate-200" }, r.stepId ? `${r.stepId} • ${r.stepLabel}` : '—')),
                    React.createElement("div", null,
                        React.createElement("span", { className: "text-slate-500" }, "Tipo:"),
                        " ",
                        React.createElement("span", { className: "text-slate-200" }, r.requestType || '—'))),
                r.reason && (React.createElement("div", { className: "text-xs" },
                    React.createElement("div", { className: "text-slate-500 mb-0.5" }, "Motivo original:"),
                    React.createElement("div", { className: "text-slate-200 whitespace-pre-wrap" }, r.reason))),
                React.createElement("div", { className: (authReturnClass(r.status)) + ' rounded-md p-2.5 text-xs text-slate-200' }, authReturnMessage(r.status)),
                decided && (React.createElement("div", { className: "border-t border-rkmborder pt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300" },
                    React.createElement("div", null,
                        "Decidido por: ",
                        React.createElement("b", { className: "text-slate-100" }, r.decidedByName || '—'),
                        decisionRole && React.createElement("span", { className: 'tag ml-2 ' + roleTagFor(decisionRole) }, roleLabelFor(decisionRole))),
                    React.createElement("div", null,
                        "Data/hora da decis\u00E3o: ",
                        React.createElement("b", { className: "text-slate-100" }, formatDateTimeBR(r.decidedAt))),
                    React.createElement("div", { className: "md:col-span-2" },
                        "Justificativa: ",
                        React.createElement("span", { className: "text-slate-100" }, r.decisionReason || '—')))),
                (r.history || []).length > 0 && (React.createElement("div", { className: "border-t border-rkmborder pt-3" },
                    React.createElement("div", { className: "text-xs uppercase tracking-wider text-slate-500 mb-2" }, "Hist\u00F3rico da solicita\u00E7\u00E3o"),
                    React.createElement("div", { className: "space-y-1.5" }, (r.history || []).map(h => (React.createElement("div", { key: h.id, className: "text-xs text-slate-400 flex flex-col md:flex-row md:items-start gap-1 md:gap-2" },
                        React.createElement("span", { className: "text-slate-500" }, formatDateTimeBR(h.dateTime)),
                        React.createElement("span", { className: "text-slate-300" },
                            h.userName || '—',
                            " (",
                            roleLabelFor(h.userRole),
                            ") \u2014 ",
                            h.action || '—',
                            " \u2014 ",
                            h.status || '—'),
                        h.comment && React.createElement("span", { className: "text-slate-500" },
                            "Coment\u00E1rio: ",
                            h.comment)))))))));
        })))));
};
export const AuthorizationHistoryPanel = ({ rec001, rec002, scope = 'all', title = 'Histórico de autorizações' }) => {
    const [filter, setFilter] = useState('Todas');
    const allRequests = getAllAuthorizationRequests(rec001, rec002);
    const scopedRequests = scope === 'all' ? allRequests : filterByApprover(allRequests, scope);
    const scopedIds = new Set(scopedRequests.map(r => r.id));
    const raw = [
        ...((rec001.approvalHistory || []).map(h => ({ ...h, it: h.it || 'IT001' }))),
        ...((rec002.approvalHistory || []).map(h => ({ ...h, it: h.it || 'IT002' }))),
    ].filter(h => scope === 'all' || scopedIds.has(h.authorizationId) || h.assignedApproverRole === scope || h.userRole === scope)
        .sort((a, b) => (b.dateTime || '').localeCompare(a.dateTime || ''));
    const filtered = raw.filter(h => {
        if (filter === 'Todas')
            return true;
        if (filter === 'Pendentes')
            return h.status === 'Pendente';
        if (filter === 'Aprovadas')
            return h.status === 'Aprovado';
        if (filter === 'Reprovadas')
            return h.status === 'Reprovado';
        if (filter === 'Ajuste solicitado')
            return h.status === 'Ajuste solicitado';
        if (filter === 'IT001')
            return h.it === 'IT001';
        if (filter === 'IT002')
            return h.it === 'IT002';
        return true;
    });
    const filters = ['Todas', 'Pendentes', 'Aprovadas', 'Reprovadas', 'Ajuste solicitado', 'IT001', 'IT002'];
    return (React.createElement("div", { className: "rkm-card overflow-hidden" },
        React.createElement("div", { className: "px-5 py-3.5 border-b border-rkmborder flex items-center gap-2 flex-wrap" },
            React.createElement("span", { className: "sec-bullet" }),
            React.createElement("div", { className: "flex-1" },
                React.createElement("div", { className: "text-sm font-semibold" }, title),
                React.createElement("div", { className: "text-xs text-slate-500" }, "Registro n\u00E3o edit\u00E1vel de cria\u00E7\u00E3o e decis\u00F5es \u2014 Tarefa 2B.3")),
            React.createElement("span", { className: "tag tag-slate" },
                filtered.length,
                " evento",
                filtered.length !== 1 ? 's' : '')),
        React.createElement("div", { className: "px-5 py-3 border-b border-rkmborder flex gap-1 flex-wrap" }, filters.map(f => (React.createElement("button", { key: f, onClick: () => setFilter(f), className: 'btn text-xs !py-1.5 !px-2.5 ' + (filter === f ? 'btn-primary' : 'btn-ghost') }, f)))),
        filtered.length === 0 ? (React.createElement("div", { className: "p-6 text-center text-xs text-slate-400" }, "Nenhum evento de autoriza\u00E7\u00E3o registrado para este filtro.")) : (React.createElement("div", { className: "p-4 space-y-2" }, filtered.map(h => (React.createElement("div", { key: h.id, className: "rkm-card-2 p-3 space-y-1.5" },
            React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                React.createElement("span", { className: "text-xs text-slate-500" }, formatDateTimeBR(h.dateTime)),
                React.createElement("span", { className: 'tag ' + (h.it === 'IT001' ? 'tag-blue' : 'tag-violet') }, h.it || '—'),
                React.createElement(AuthStatusTag, { status: h.status }),
                React.createElement("span", { className: "text-xs font-mono text-slate-500" }, h.authorizationId || '—')),
            React.createElement("div", { className: "text-xs text-slate-300" },
                React.createElement("b", null, h.osNumber || '—'),
                " \u00B7 ",
                h.client || '—',
                " \u00B7 Etapa ",
                h.stepId || '—',
                h.stepLabel ? ` — ${h.stepLabel}` : ''),
            React.createElement("div", { className: "text-xs text-slate-200" },
                h.userName || '—',
                " ",
                React.createElement("span", { className: "text-slate-500" },
                    "(",
                    roleLabelFor(h.userRole),
                    ")"),
                " \u2014 ",
                normalizeActionLabel(h.action),
                " \u2014 ",
                h.status || '—'),
            h.comment && React.createElement("div", { className: "text-xs text-slate-400 whitespace-pre-wrap" },
                "Coment\u00E1rio/justificativa: ",
                h.comment))))))));
};
/* ============================================================
       BLOCO 2B.1 + 2B.2 — Filas e decisões de aprovação
       ============================================================ */
/* Agrega todas as solicitações de IT001 + IT002 */
export const getAllAuthorizationRequests = (rec001, rec002) => [
    ...((rec001 && rec001.authorizationRequests) || []).map(r => ({ ...r, _itLabel: r.it || 'IT001' })),
    ...((rec002 && rec002.authorizationRequests) || []).map(r => ({ ...r, _itLabel: r.it || 'IT002' })),
];
/* Tipos de solicitação considerados de cada perfil aprovador */
export const SUPERVISOR_TYPES = ['Validação técnica', 'Liberação para prosseguir', 'Dúvida técnica', 'Condição insegura', 'Rastreabilidade insuficiente', 'NC / retrabalho', 'Outro'];
export const QUALITY_TYPES = ['Validação da Qualidade', 'Evidência pendente'];
export const PCP_TYPES = ['Fechamento PCP'];
export const filterByApprover = (requests, role) => {
    const typeSet = role === 'supervisor' ? SUPERVISOR_TYPES : role === 'quality' ? QUALITY_TYPES : role === 'pcp' ? PCP_TYPES : [];
    return requests.filter(r => r.assignedApproverRole === role || typeSet.includes(r.requestType));
};
export const canDecideRequest = (req, activeRole) => {
    if (!req || req.status !== 'Pendente')
        return false;
    if (activeRole === 'operator')
        return false;
    return activeRole === req.assignedApproverRole || activeRole === 'admin';
};
export const decisionButtonsFor = (req) => {
    if (req.assignedApproverRole === 'pcp') {
        return [
            { label: 'Aprovar fechamento', decision: 'Aprovado', className: 'btn-primary' },
            { label: 'Reprovar fechamento', decision: 'Reprovado', className: 'btn-danger' },
            { label: 'Solicitar ajuste', decision: 'Ajuste solicitado', className: 'btn-ghost' },
        ];
    }
    return [
        { label: 'Aprovar', decision: 'Aprovado', className: 'btn-primary' },
        { label: 'Reprovar', decision: 'Reprovado', className: 'btn-danger' },
        { label: 'Solicitar ajuste', decision: 'Ajuste solicitado', className: 'btn-ghost' },
    ];
};
/* Card reutilizável para uma solicitação na fila */
export const AuthRequestCard = ({ req, showApproverHint, activeRole, onDecisionClick }) => {
    const reqRoleLabel = (ROLES.find(r => r.key === req.requestedByRole) || {}).label || '';
    const apprRoleLabel = (ROLES.find(r => r.key === req.assignedApproverRole) || {}).label || '';
    const canDecide = canDecideRequest(req, activeRole);
    const alreadyDecided = req.status && req.status !== 'Pendente';
    return (React.createElement("div", { className: "rkm-card-2 p-4 space-y-2.5" },
        React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
            React.createElement(CriticalityTag, { value: req.criticality }),
            React.createElement(AuthStatusTag, { status: req.status }),
            React.createElement("span", { className: 'tag ' + (req._itLabel === 'IT001' ? 'tag-blue' : 'tag-violet') }, req._itLabel),
            React.createElement("span", { className: "text-xs font-mono text-slate-400" }, req.id),
            React.createElement("span", { className: "flex-1" }),
            React.createElement("span", { className: "text-xs text-slate-500" }, req.requestedAt ? new Date(req.requestedAt).toLocaleString('pt-BR') : '—')),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2 text-xs" },
            React.createElement("div", null,
                React.createElement("span", { className: "text-slate-500" }, "OS / Laudo:"),
                " ",
                React.createElement("b", { className: "text-slate-200" }, req.osNumber || '—')),
            React.createElement("div", { className: "md:col-span-2" },
                React.createElement("span", { className: "text-slate-500" }, "Cliente:"),
                " ",
                React.createElement("span", { className: "text-slate-200" }, req.client || '—')),
            React.createElement("div", { className: "md:col-span-2" },
                React.createElement("span", { className: "text-slate-500" }, "Etapa:"),
                " ",
                React.createElement("span", { className: "text-slate-200" }, req.stepId ? req.stepId + ' — ' + (req.stepLabel || '') : '—')),
            React.createElement("div", null,
                React.createElement("span", { className: "text-slate-500" }, "Tipo:"),
                " ",
                React.createElement("span", { className: "text-slate-200" }, req.requestType || '—'))),
        React.createElement("div", { className: "text-xs" },
            React.createElement("div", { className: "text-slate-500 mb-0.5" }, "Solicitante:"),
            React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("span", { className: "text-slate-200" }, req.requestedByName || '—'),
                reqRoleLabel && React.createElement("span", { className: 'tag ' + ((ROLES.find(r => r.key === req.requestedByRole) || {}).tagClass || 'tag-slate') }, reqRoleLabel))),
        req.reason && (React.createElement("div", { className: "text-xs" },
            React.createElement("div", { className: "text-slate-500 mb-0.5" }, "Motivo:"),
            React.createElement("div", { className: "text-slate-200 whitespace-pre-wrap" }, req.reason))),
        req.relatedAlertMessage && (React.createElement("div", { className: "alert-warn rounded-md p-2.5 text-xs text-slate-200" },
            React.createElement("span", { className: "text-slate-400 mr-1" }, "Alerta de origem:"),
            req.relatedAlertMessage)),
        showApproverHint && apprRoleLabel && (React.createElement("div", { className: "text-xs text-slate-500" },
            "Respons\u00E1vel atribu\u00EDdo: ",
            React.createElement("b", { className: "text-slate-300" }, apprRoleLabel))),
        canDecide && (React.createElement("div", { className: "border-t border-rkmborder pt-3 flex flex-wrap gap-2" }, decisionButtonsFor(req).map(btn => (React.createElement("button", { key: btn.label, className: 'btn text-xs ' + btn.className, onClick: () => onDecisionClick && onDecisionClick(req, btn.decision) }, btn.label))))),
        alreadyDecided && (React.createElement("div", { className: "border-t border-rkmborder pt-3 space-y-1.5 text-xs text-slate-300" },
            React.createElement("div", { className: "font-medium text-slate-200" }, "Decis\u00E3o j\u00E1 registrada"),
            React.createElement("div", null,
                "Status atual: ",
                React.createElement(AuthStatusTag, { status: req.status })),
            React.createElement("div", null,
                "Respons\u00E1vel pela decis\u00E3o: ",
                React.createElement("b", null, req.decidedByName || '—')),
            React.createElement("div", null,
                "Data/hora da decis\u00E3o: ",
                React.createElement("b", null, req.decidedAt ? new Date(req.decidedAt).toLocaleString('pt-BR') : '—')),
            req.decisionReason && React.createElement("div", null,
                "Justificativa: ",
                React.createElement("span", { className: "text-slate-200" }, req.decisionReason)))),
        !canDecide && !alreadyDecided && (React.createElement("div", { className: "text-xs text-slate-500 italic border-t border-rkmborder pt-2" }, "Aguardando decis\u00E3o do perfil respons\u00E1vel."))));
};
/* Container/fila genérico: cabeçalho + lista de cards + estado vazio */
export const AuthRequestQueue = ({ title, hint, requests, emptyMessage, showApproverHint, activeRole, onDecisionClick }) => {
    const pending = requests.filter(r => r.status === 'Pendente');
    const decided = requests.filter(r => r.status !== 'Pendente');
    return (React.createElement("div", { className: "rkm-card overflow-hidden" },
        React.createElement("div", { className: "px-5 py-3.5 border-b border-rkmborder flex items-center gap-2 flex-wrap" },
            React.createElement("span", { className: "sec-bullet" }),
            React.createElement("div", { className: "flex-1" },
                React.createElement("div", { className: "text-sm font-semibold" }, title),
                hint && React.createElement("div", { className: "text-xs text-slate-500" }, hint)),
            React.createElement("span", { className: "tag tag-amber" },
                pending.length,
                " pendente",
                pending.length !== 1 ? 's' : ''),
            decided.length > 0 && React.createElement("span", { className: "tag tag-slate" },
                decided.length,
                " decidida",
                decided.length !== 1 ? 's' : '')),
        React.createElement("div", { className: "p-4 space-y-3" }, requests.length === 0 ? (React.createElement("div", { className: "text-center text-xs text-slate-400 py-6" }, emptyMessage)) : (requests.map(req => (React.createElement(AuthRequestCard, { key: req.id, req: req, showApproverHint: showApproverHint, activeRole: activeRole, onDecisionClick: onDecisionClick })))))));
};
/* Filas específicas — wrappers para legibilidade nas Visões */
export const SupervisorAuthQueue = ({ rec001, rec002, activeRole, onDecisionClick }) => {
    const all = getAllAuthorizationRequests(rec001, rec002);
    const mine = filterByApprover(all, 'supervisor');
    return (React.createElement(AuthRequestQueue, { title: "Solicita\u00E7\u00F5es pendentes de autoriza\u00E7\u00E3o t\u00E9cnica", hint: "Valida\u00E7\u00E3o t\u00E9cnica, d\u00FAvida, condi\u00E7\u00E3o insegura, rastreabilidade, NC / retrabalho.", requests: mine, emptyMessage: "Nenhuma solicita\u00E7\u00E3o t\u00E9cnica pendente para o Supervisor.", activeRole: activeRole, onDecisionClick: onDecisionClick }));
};
export const QualityAuthQueue = ({ rec001, rec002, activeRole, onDecisionClick }) => {
    const all = getAllAuthorizationRequests(rec001, rec002);
    const mine = filterByApprover(all, 'quality');
    return (React.createElement(AuthRequestQueue, { title: "Solicita\u00E7\u00F5es pendentes da Qualidade", hint: "Valida\u00E7\u00E3o da Qualidade (IT002 \u00A715) e evid\u00EAncias finais pendentes.", requests: mine, emptyMessage: "Nenhuma solicita\u00E7\u00E3o pendente da Qualidade.", activeRole: activeRole, onDecisionClick: onDecisionClick }));
};
export const PCPAuthQueue = ({ rec001, rec002, activeRole, onDecisionClick }) => {
    const all = getAllAuthorizationRequests(rec001, rec002);
    const mine = filterByApprover(all, 'pcp');
    return (React.createElement(AuthRequestQueue, { title: "Solicita\u00E7\u00F5es pendentes do PCP", hint: "Fechamento administrativo / libera\u00E7\u00E3o documental. PCP n\u00E3o aprova tecnicamente o servi\u00E7o.", requests: mine, emptyMessage: "Nenhuma solicita\u00E7\u00E3o pendente do PCP.", activeRole: activeRole, onDecisionClick: onDecisionClick }));
};
/* Visão Admin — agrega todas */
export const AdminAuthQueueAll = ({ rec001, rec002, activeRole, onDecisionClick }) => {
    const all = getAllAuthorizationRequests(rec001, rec002);
    return (React.createElement(AuthRequestQueue, { title: "Todas as solicita\u00E7\u00F5es de autoriza\u00E7\u00E3o", hint: "Vis\u00E3o consolidada IT001 + IT002 (auditoria). Admin pode simular decis\u00E3o no MVP.", requests: all, emptyMessage: "Nenhuma solicita\u00E7\u00E3o criada ainda em qualquer rascunho.", showApproverHint: true, activeRole: activeRole, onDecisionClick: onDecisionClick }));
};
/* Modal de decisão — Tarefa 2B.2 */
export const AuthDecisionModal = ({ open, onClose, request, decision, activeUser, activeRole, onConfirm }) => {
    const user = mockUsers.find(u => u.id === activeUser) || mockUsers[0];
    const [justification, setJustification] = useState('');
    const [error, setError] = useState('');
    useEffect(() => {
        if (open) {
            setJustification('');
            setError('');
        }
    }, [open, request, decision]);
    if (!open || !request)
        return null;
    const canDecide = activeRole === request.assignedApproverRole || activeRole === 'admin';
    const handleConfirm = () => {
        if (!canDecide) {
            setError('Seu perfil não possui permissão para decidir esta solicitação.');
            return;
        }
        if (!justification.trim()) {
            setError('Informe a justificativa da decisão para continuar.');
            return;
        }
        onConfirm(request, decision, justification.trim());
    };
    return (React.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", style: { background: 'rgba(2,8,20,.7)', backdropFilter: 'blur(4px)' }, onClick: onClose },
        React.createElement("div", { className: "rkm-card w-full max-w-2xl max-h-[90vh] overflow-y-auto", onClick: e => e.stopPropagation() },
            React.createElement("div", { className: "px-5 py-4 border-b border-rkmborder flex items-center gap-3" },
                React.createElement("span", { className: "sec-bullet" }),
                React.createElement("div", { className: "flex-1" },
                    React.createElement("div", { className: "text-xs uppercase tracking-wider text-blue-300" }, "Tarefa 2B.2"),
                    React.createElement("div", { className: "text-base font-semibold" }, "Registrar decis\u00E3o da solicita\u00E7\u00E3o")),
                React.createElement("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-200", title: "Fechar" },
                    React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
                        React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                        React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })))),
            React.createElement("div", { className: "p-5 space-y-4" },
                React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-xs" },
                    React.createElement(Field, { label: "ID da solicita\u00E7\u00E3o" },
                        React.createElement("div", { className: "rkm-input font-mono text-xs" }, request.id || '—')),
                    React.createElement(Field, { label: "IT" },
                        React.createElement("div", { className: "rkm-input" },
                            React.createElement("span", { className: 'tag ' + ((request.it || request._itLabel) === 'IT001' ? 'tag-blue' : 'tag-violet') }, request.it || request._itLabel || '—'))),
                    React.createElement(Field, { label: "OS / Laudo" },
                        React.createElement("div", { className: "rkm-input" }, request.osNumber || '—')),
                    React.createElement(Field, { label: "Cliente" },
                        React.createElement("div", { className: "rkm-input" }, request.client || '—')),
                    React.createElement(Field, { label: "Etapa" },
                        React.createElement("div", { className: "rkm-input" }, request.stepId ? request.stepId + ' — ' + (request.stepLabel || '') : '—')),
                    React.createElement(Field, { label: "Tipo de solicita\u00E7\u00E3o" },
                        React.createElement("div", { className: "rkm-input" }, request.requestType || '—')),
                    React.createElement(Field, { label: "Criticidade" },
                        React.createElement("div", { className: "rkm-input" },
                            React.createElement(CriticalityTag, { value: request.criticality }))),
                    React.createElement(Field, { label: "Solicitante" },
                        React.createElement("div", { className: "rkm-input" }, request.requestedByName || '—')),
                    React.createElement(Field, { label: "Data/hora da solicita\u00E7\u00E3o", className: "md:col-span-2" },
                        React.createElement("div", { className: "rkm-input" }, request.requestedAt ? new Date(request.requestedAt).toLocaleString('pt-BR') : '—'))),
                request.reason && (React.createElement("div", { className: "text-xs" },
                    React.createElement("div", { className: "text-slate-500 mb-1" }, "Motivo original:"),
                    React.createElement("div", { className: "rkm-card-2 p-3 text-slate-200 whitespace-pre-wrap" }, request.reason))),
                React.createElement(Field, { label: "Decis\u00E3o" },
                    React.createElement("div", { className: "rkm-input" },
                        React.createElement(AuthStatusTag, { status: decision }))),
                React.createElement(Field, { label: "Justificativa da decis\u00E3o", required: true, hint: "A justificativa \u00E9 obrigat\u00F3ria para aprovar, reprovar ou solicitar ajuste." },
                    React.createElement(TextArea, { rows: 4, value: justification, onChange: setJustification, placeholder: "Descreva a justificativa da decis\u00E3o..." })),
                error && React.createElement("div", { className: "alert-critical rounded-md p-2.5 text-xs text-slate-200" }, error),
                React.createElement("div", { className: "text-xs text-slate-500" },
                    "Decisor: ",
                    React.createElement("b", { className: "text-slate-300" }, user.name))),
            React.createElement("div", { className: "px-5 py-3 border-t border-rkmborder flex items-center gap-2 justify-end" },
                React.createElement("button", { className: "btn btn-ghost", onClick: onClose }, "Cancelar"),
                React.createElement("button", { className: "btn btn-primary", onClick: handleConfirm }, "Confirmar decis\u00E3o")))));
};
/* ============================================================
   ATIVIDADE 3 — Bloqueio real de fluxo por autorização
   ============================================================ */
export const BLOCKING_AUTH_STATUSES = ['Pendente', 'Reprovado', 'Ajuste solicitado'];
export const normalizeRequestIT = (req, fallbackIT) => (req === null || req === void 0 ? void 0 : req.it) || (req === null || req === void 0 ? void 0 : req._itLabel) || fallbackIT || 'IT001';
export const requestBelongsToStep = (req, itCode, stepId) => normalizeRequestIT(req, itCode) === itCode && Number(req.stepId) === Number(stepId);
export const getStepAuthorizationRequests = (record, itCode, stepId) => ((record && record.authorizationRequests) || [])
    .filter(req => requestBelongsToStep(req, itCode, stepId))
    .sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
export const getStepAuthorizationState = (record, itCode, stepId) => {
    const requests = getStepAuthorizationRequests(record, itCode, stepId);
    const blocking = requests.find(req => BLOCKING_AUTH_STATUSES.includes(req.status));
    const approved = requests.find(req => req.status === 'Aprovado');
    if (blocking) {
        const messageByStatus = {
            'Pendente': 'Esta etapa possui autorização pendente. Aguarde a decisão do responsável antes de avançar.',
            'Reprovado': 'Esta etapa foi reprovada pelo responsável. Corrija a condição ou abra nova tratativa antes de avançar.',
            'Ajuste solicitado': 'O responsável solicitou ajuste. Registre a tratativa antes de solicitar nova avaliação.',
        };
        return {
            blocked: true,
            status: blocking.status,
            request: blocking,
            requests,
            message: messageByStatus[blocking.status] || 'Esta etapa possui bloqueio ativo de autorização.',
        };
    }
    if (approved) {
        return {
            blocked: false,
            status: 'Aprovado',
            request: approved,
            requests,
            message: 'Autorização aprovada. Avanço liberado.',
        };
    }
    return { blocked: false, status: '', request: null, requests, message: '' };
};
export const StepAuthorizationHistory = ({ requests }) => {
    if (!requests || !requests.length)
        return null;
    return (React.createElement("div", { className: "rkm-card overflow-hidden" },
        React.createElement("div", { className: "px-5 py-3.5 border-b border-rkmborder flex items-center gap-2" },
            React.createElement("span", { className: "sec-bullet" }),
            React.createElement("div", { className: "text-sm font-semibold flex-1" }, "Hist\u00F3rico de valida\u00E7\u00F5es da etapa"),
            React.createElement("span", { className: "text-xs text-slate-500" },
                requests.length,
                " solicita\u00E7",
                requests.length === 1 ? 'ão' : 'ões')),
        React.createElement("div", { className: "p-4 space-y-3" }, requests.map(req => (React.createElement("div", { key: req.id, className: (req.status === 'Ajuste solicitado' ? 'alert-warn' : req.status === 'Reprovado' ? 'alert-critical' : req.status === 'Aprovado' ? 'alert-info' : 'rkm-card-2') + ' rounded-lg p-3 space-y-2' },
            React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                React.createElement(AuthStatusTag, { status: req.status }),
                React.createElement(CriticalityTag, { value: req.criticality }),
                React.createElement("span", { className: "text-xs font-mono text-slate-500" }, req.id),
                React.createElement("span", { className: "text-xs text-slate-500 ml-auto" }, req.requestedAt ? new Date(req.requestedAt).toLocaleString('pt-BR') : '—')),
            React.createElement("div", { className: "text-xs text-slate-300" },
                React.createElement("b", null, req.requestType || 'Solicitação'),
                " \u00B7 ",
                req.reason || 'Sem motivo registrado.'),
            req.decision && (React.createElement("div", { className: "text-xs text-slate-300 border-t border-rkmborder pt-2" },
                React.createElement("div", null,
                    "Decis\u00E3o: ",
                    React.createElement("b", null, req.decision)),
                React.createElement("div", null,
                    "Respons\u00E1vel: ",
                    React.createElement("b", null, req.decidedByName || '—'),
                    " \u00B7 ",
                    (ROLES.find(r => r.key === req.decidedByRole) || {}).label || req.decidedByRole || '—'),
                React.createElement("div", null,
                    "Data: ",
                    req.decidedAt ? new Date(req.decidedAt).toLocaleString('pt-BR') : '—'),
                req.decisionReason && React.createElement("div", { className: "mt-1" },
                    "Justificativa: ",
                    req.decisionReason)))))))));
};

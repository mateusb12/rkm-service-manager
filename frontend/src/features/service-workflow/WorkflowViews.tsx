// @ts-nocheck

import React, { useState } from 'react';

import { IT_CONFIG } from './registry';
import { setIn } from './path';

import {
    AuthRequestButton,
    StepAuthorizationHistory,
    getStepAuthorizationState,
} from '../role-access';

import { AlertBox } from '../../shared/ui/feedback';

import { StatusTag } from '../../shared/ui/tags';
const Stepper = ({ currentStep, setStep, alertsByStep, steps, itLabel, onStepClick, blockedInfo }) => (React.createElement("aside", { className: "rkm-card p-3 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:sticky lg:top-[80px]" },
    React.createElement("div", { className: "text-xs uppercase tracking-wider text-slate-500 px-2 py-1 mb-1" },
        "Etapas \u2014 ",
        itLabel || 'IT001'),
    React.createElement("div", { className: "flex flex-col gap-1" }, steps.map(s => {
        const isActive = currentStep === s.id;
        const stepAlerts = alertsByStep[s.id] || 0;
        const forwardBlocked = (blockedInfo === null || blockedInfo === void 0 ? void 0 : blockedInfo.blocked) && s.id > currentStep;
        return (React.createElement("button", { key: s.id, onClick: () => (onStepClick || setStep)(s.id), className: 'flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-xs border transition ' +
                (isActive ? 'step-active border-blue-500 text-blue-100' : 'border-transparent text-slate-300 hover:bg-rkmcard2') +
                (forwardBlocked ? ' opacity-60' : ''), title: forwardBlocked ? 'Avanço bloqueado por autorização da etapa atual' : '' },
            React.createElement("span", { className: 'badge-num ' + (isActive ? 'bg-blue-500 text-white' : 'bg-rkmcard2 text-slate-400 border border-rkmborder') }, s.id),
            React.createElement("span", { className: "flex-1 truncate" }, s.short),
            s.critical && React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-rose-400", title: "Etapa cr\u00EDtica" }),
            stepAlerts > 0 && React.createElement("span", { className: "text-xs px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded" }, stepAlerts),
            forwardBlocked && React.createElement("span", { className: "text-xs px-1.5 py-0.5 bg-rose-500/20 text-rose-300 rounded" }, "bloq.")));
    }))));

export const ITForm = ({ record, setRecord, currentStep, setCurrentStep, alerts, onFinish, itCode, activeRole, onRequestAuth }) => {
    const cfg = IT_CONFIG[itCode || 'IT001'];
    const set = (path, value) => setRecord(prev => setIn(prev, path, value));
    const Renderer = cfg.renderers[currentStep];
    const stepInfo = cfg.steps.find(s => s.id === currentStep);
    const alertsByStep = alerts.reduce((acc, a) => { acc[a.step] = (acc[a.step] || 0) + 1; return acc; }, {});
    const stepAlerts = alerts.filter(a => a.step === currentStep);
    const lastStep = cfg.steps.length;
    const authorizationState = getStepAuthorizationState(record, itCode, currentStep);
    const [blockedNavigationMessage, setBlockedNavigationMessage] = useState('');
    const handleBlockedNavigation = () => {
        const msg = authorizationState.message || 'Esta etapa possui bloqueio ativo de autorização.';
        setBlockedNavigationMessage(msg);
        setTimeout(() => setBlockedNavigationMessage(''), 4500);
    };
    const handleGoToStep = (targetStep) => {
        if (authorizationState.blocked && targetStep > currentStep) {
            handleBlockedNavigation();
            return;
        }
        setCurrentStep(targetStep);
    };
    const handleNextStep = () => {
        if (authorizationState.blocked) {
            handleBlockedNavigation();
            return;
        }
        setCurrentStep(s => Math.min(lastStep, s + 1));
    };
    const handleFinishWithBlockCheck = () => {
        if (authorizationState.blocked) {
            handleBlockedNavigation();
            return;
        }
        onFinish();
    };
    const handleRequestAuth = (alert) => {
        if (!onRequestAuth)
            return;
        onRequestAuth({
            it: itCode,
            osNumber: record.identification.osNumber || '',
            client: record.identification.client || '',
            stepId: (alert && alert.step) || currentStep,
            stepLabel: (cfg.steps.find(s => s.id === ((alert && alert.step) || currentStep)) || {}).label || '',
            alertMessage: (alert && alert.msg) || '',
            requestType: alert && alert.severity === 'critical' ? 'Validação técnica' : 'Dúvida técnica',
            suggestedReason: (alert && alert.msg) || '',
            suggestedCriticality: alert && alert.severity === 'critical' ? 'Crítica' : 'Alta',
        });
    };
    return (React.createElement("div", { className: "p-4 md:p-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5" },
        React.createElement(Stepper, { currentStep: currentStep, setStep: setCurrentStep, alertsByStep: alertsByStep, steps: cfg.steps, itLabel: cfg.label, onStepClick: handleGoToStep, blockedInfo: authorizationState }),
        React.createElement("div", { className: "space-y-4" },
            React.createElement("div", { className: "rkm-card p-4 flex flex-col md:flex-row gap-3 md:items-center" },
                React.createElement("div", { className: "flex-1" },
                    React.createElement("div", { className: "text-xs text-blue-300 uppercase tracking-wider" },
                        cfg.label,
                        " \u2022 Etapa ",
                        currentStep,
                        " de ",
                        lastStep),
                    React.createElement("div", { className: "text-base font-semibold mt-0.5" }, stepInfo.label),
                    React.createElement("div", { className: "text-xs text-slate-400" },
                        "OS: ",
                        React.createElement("b", { className: "text-slate-200" }, record.identification.osNumber || '—'),
                        " \u00B7 Cliente: ",
                        React.createElement("b", { className: "text-slate-200" }, record.identification.client || '—'),
                        " \u00B7 Status: ",
                        React.createElement(StatusTag, { status: record.identification.currentStatus }))),
                React.createElement("div", { className: "flex gap-2 flex-wrap" },
                    React.createElement(AuthRequestButton, { activeRole: activeRole, onClick: () => handleRequestAuth(stepAlerts[0] || null) }),
                    React.createElement("button", { className: "btn btn-ghost", disabled: currentStep === 1, onClick: () => setCurrentStep(s => Math.max(1, s - 1)) }, "\u2190 Anterior"),
                    React.createElement("button", { className: 'btn btn-primary ' + (authorizationState.blocked ? 'opacity-60' : ''), disabled: currentStep === lastStep, onClick: handleNextStep }, "Pr\u00F3xima \u2192"),
                    currentStep === lastStep && React.createElement("button", { className: 'btn btn-primary ' + (authorizationState.blocked ? 'opacity-60' : ''), onClick: handleFinishWithBlockCheck }, "Concluir registro"))),
            authorizationState.blocked && (React.createElement(AlertBox, { severity: "critical", title: "Avan\u00E7o bloqueado por autoriza\u00E7\u00E3o" }, authorizationState.message)),
            !authorizationState.blocked && authorizationState.status === 'Aprovado' && (React.createElement(AlertBox, { severity: "info", title: "Autoriza\u00E7\u00E3o aprovada" }, authorizationState.message)),
            blockedNavigationMessage && (React.createElement(AlertBox, { severity: "warn", title: "Tentativa de avan\u00E7o bloqueada" }, blockedNavigationMessage)),
            stepAlerts.length > 0 && (React.createElement("div", { className: "space-y-2" }, stepAlerts.map((a, i) => (React.createElement("div", { key: i, className: "space-y-1.5" },
                React.createElement(AlertBox, { severity: a.severity, title: a.severity === 'critical' ? 'Alerta crítico' : 'Atenção' }, a.msg),
                activeRole === 'operator' && (React.createElement("div", { className: "flex justify-end pr-1" },
                    React.createElement(AuthRequestButton, { activeRole: activeRole, onClick: () => handleRequestAuth(a) })))))))),
            React.createElement(StepAuthorizationHistory, { requests: authorizationState.requests }),
            React.createElement(Renderer, { r: record, set: set }))));
};

export const PendenciesView = ({ alerts, record, goTo, activeIT, activeRole, onRequestAuth }) => {
    const handleRequestAuthFor = (a) => {
        if (!onRequestAuth)
            return;
        const cfg = IT_CONFIG[activeIT || 'IT001'];
        const stepInfo = cfg.steps.find(s => s.id === a.step) || {};
        onRequestAuth({
            it: activeIT,
            osNumber: record.identification.osNumber || '',
            client: record.identification.client || '',
            stepId: a.step || 0,
            stepLabel: stepInfo.label || '',
            alertMessage: a.msg || '',
            requestType: a.severity === 'critical' ? 'Validação técnica' : 'Dúvida técnica',
            suggestedReason: a.msg || '',
            suggestedCriticality: a.severity === 'critical' ? 'Crítica' : 'Alta',
        });
    };
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "text-xs text-blue-300 uppercase tracking-wider" },
                activeIT || 'IT001',
                " \u2022 Pend\u00EAncias"),
            React.createElement("div", { className: "text-base font-semibold mt-0.5" }, "Pend\u00EAncias cr\u00EDticas \u2014 Rascunho atual"),
            React.createElement("div", { className: "text-xs text-slate-400" }, activeIT === 'IT002' ? 'Regras 1–16 do checklist IT002 (alertas críticos / atenção).' : 'Regras 1–14 do checklist IT001 (alertas críticos / atenção).')),
        alerts.length === 0 ? (React.createElement("div", { className: "rkm-card p-8 text-center text-slate-400" },
            React.createElement("div", { className: "text-emerald-300 text-3xl mb-2" }, "\u2713"),
            "Nenhum alerta cr\u00EDtico identificado no rascunho atual.")) : (React.createElement("div", { className: "space-y-2" }, alerts.map((a, i) => (React.createElement("div", { key: i, className: (a.severity === 'critical' ? 'alert-critical' : 'alert-warn') + ' rounded-lg p-3.5 flex items-center gap-3 flex-wrap' },
            React.createElement("span", { className: 'tag ' + (a.severity === 'critical' ? 'tag-red' : 'tag-amber') }, a.severity === 'critical' ? 'Crítico' : 'Atenção'),
            React.createElement("span", { className: "text-xs text-slate-400" },
                "Etapa ",
                a.step),
            React.createElement("div", { className: "flex-1 min-w-[200px] text-sm text-slate-200" }, a.msg),
            React.createElement(AuthRequestButton, { activeRole: activeRole, onClick: () => handleRequestAuthFor(a) }),
            React.createElement("button", { className: "btn btn-ghost text-xs", onClick: () => goTo(a.step) }, "Ir para etapa \u2192"))))))));
};

export const EvidencesView = ({ record, activeIT }) => {
    const items = activeIT === 'IT002' ? [
        { label: 'Identificação / placa', got: record.equipment.photoIdentificacao, step: 2 },
        { label: 'Visão geral do acumulador', got: record.receivedCondition.photos.overview, step: 3 },
        { label: 'Placa (estado recebido)', got: record.receivedCondition.photos.plate, step: 3 },
        { label: 'Pontos de dano', got: record.receivedCondition.photos.damage, step: 3 },
        { label: 'Condição final', got: record.receivedCondition.photos.finalCondition, step: 3 },
        { label: 'Foto pistão', got: record.assessment.piston.photo, step: 6 },
        { label: 'Foto carcaça/cilindro', got: record.assessment.shellCylinder.photo, step: 7 },
        { label: 'Foto tampas/vedações', got: record.assessment.capsThreadsChannelsSeals.photo, step: 8 },
        { label: 'Foto montagem', got: record.assemblyIntegrity.fotos, step: 11 },
        { label: 'Foto/vídeo da leitura (carga N₂)', got: record.nitrogenCharge.fotoLeitura, step: 13 },
        { label: 'Evidências finais', got: record.finalVerification.evidenciasFinais, step: 14 },
        { label: 'Evidência da Validação da Qualidade', got: record.qualityRelease.evidencia, step: 15 },
        { label: 'Foto ambiental', got: record.environmental.foto, step: 16 },
    ] : [
        { label: 'Identificação / placa', got: record.equipment.photoIdentificacao, step: 2 },
        { label: 'Visão geral do acumulador', got: record.receivedCondition.photos.overview, step: 3 },
        { label: 'Placa (estado recebido)', got: record.receivedCondition.photos.plate, step: 3 },
        { label: 'Pontos de dano', got: record.receivedCondition.photos.damage, step: 3 },
        { label: 'Válvulas/conexões', got: record.receivedCondition.photos.valves, step: 3 },
        { label: 'Vazamento/corrosão', got: record.receivedCondition.photos.leakCorrosion, step: 3 },
        { label: 'Evidência despressurização', got: record.depressurization.evidencia, step: 6 },
        { label: 'Foto desmontagem', got: record.disassembly.fotos, step: 7 },
        { label: 'Foto carcaça (inspeção)', got: record.inspection.shell.photo, step: 8 },
        { label: 'Foto montagem', got: record.assembly.fotos, step: 11 },
        { label: 'Foto/vídeo da leitura (pré-carga)', got: record.nitrogenPreCharge.fotoLeitura, step: 13 },
        { label: 'Foto/vídeo estabilização', got: record.stabilization.fotoVideo, step: 14 },
        { label: 'Evidências finais', got: record.finalVerification.evidenciasFinais, step: 15 },
        { label: 'Foto ambiental', got: record.environmental.foto, step: 16 },
    ];
    const got = items.filter(i => i.got).length;
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5 flex items-center gap-4" },
            React.createElement("div", { className: "flex-1" },
                React.createElement("div", { className: "text-xs text-blue-300 uppercase tracking-wider" },
                    activeIT || 'IT001',
                    " \u2022 Evid\u00EAncias"),
                React.createElement("div", { className: "text-base font-semibold mt-0.5" }, "Evid\u00EAncias do servi\u00E7o"),
                React.createElement("div", { className: "text-xs text-slate-400" },
                    got,
                    " de ",
                    items.length,
                    " evid\u00EAncias marcadas (mock \u2014 futuro upload real)")),
            React.createElement("div", { className: "text-2xl font-semibold" },
                Math.round((got / items.length) * 100),
                "%")),
        React.createElement("div", { className: "rkm-card overflow-hidden" },
            React.createElement("table", { className: "w-full text-sm" },
                React.createElement("thead", null,
                    React.createElement("tr", { className: "text-slate-400 text-xs uppercase tracking-wide" },
                        React.createElement("th", { className: "text-left px-5 py-3" }, "Evid\u00EAncia"),
                        React.createElement("th", { className: "text-left px-5 py-3" }, "Etapa"),
                        React.createElement("th", { className: "text-left px-5 py-3" }, "Status"))),
                React.createElement("tbody", null, items.map((it, idx) => (React.createElement("tr", { key: idx, className: "border-t border-rkmborder" },
                    React.createElement("td", { className: "px-5 py-3 text-slate-200" }, it.label),
                    React.createElement("td", { className: "px-5 py-3 text-slate-400" },
                        "Etapa ",
                        it.step),
                    React.createElement("td", { className: "px-5 py-3" }, it.got ? React.createElement("span", { className: "tag tag-emerald" }, "Registrada") : React.createElement("span", { className: "tag tag-amber" }, "Pendente"))))))))));
};

const Row = ({ label, value }) => (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-[260px_1fr] py-2 border-b border-rkmborder last:border-b-0" },
    React.createElement("div", { className: "text-xs text-slate-400 uppercase tracking-wide" }, label),
    React.createElement("div", { className: "text-sm text-slate-100" }, value || React.createElement("span", { className: "text-slate-500" }, "\u2014"))));

export const SummaryView = ({ record, alerts, onExport, activeIT }) => {
    const r = record;
    const exportable = JSON.stringify(r, null, 2);
    const isIT002 = activeIT === 'IT002';
    const titleLong = isIT002 ? 'IT002 — Manutenção de Acumulador Hidropneumático Tipo Pistão' : 'IT001 — Manutenção de Acumulador de Pressão Tipo Bexiga';
    return (React.createElement("div", { className: "p-4 md:p-6 space-y-5" },
        React.createElement("div", { className: "rkm-card p-5 flex flex-col md:flex-row md:items-center gap-3" },
            React.createElement("div", { className: "flex-1" },
                React.createElement("div", { className: "text-xs text-blue-300 uppercase tracking-wider" },
                    "Resumo / Vis\u00E3o de Laudo \u00B7 ",
                    activeIT || 'IT001'),
                React.createElement("div", { className: "text-lg font-semibold mt-1" }, titleLong),
                React.createElement("div", { className: "text-xs text-slate-400" },
                    "OS ",
                    r.identification.osNumber || '—',
                    " \u00B7 ",
                    r.identification.client || '—',
                    " \u00B7 ",
                    r.identification.date || '—')),
            React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", { className: "btn btn-ghost", onClick: () => onExport(exportable) }, "Simular exporta\u00E7\u00E3o (JSON)"),
                React.createElement("button", { className: "btn btn-primary", onClick: () => window.print() }, "Imprimir"))),
        alerts.length > 0 && (React.createElement("div", { className: "space-y-2" },
            alerts.slice(0, 5).map((a, i) => (React.createElement(AlertBox, { key: i, severity: a.severity },
                a.msg,
                " ",
                React.createElement("span", { className: "text-slate-400" },
                    "(etapa ",
                    a.step,
                    ")")))),
            alerts.length > 5 && React.createElement("div", { className: "text-xs text-slate-400" },
                "+ ",
                alerts.length - 5,
                " outro(s) \u2014 ver Pend\u00EAncias."))),
        React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-5" },
            React.createElement("div", { className: "rkm-card p-5" },
                React.createElement("div", { className: "font-semibold mb-2" }, "Identifica\u00E7\u00E3o"),
                React.createElement(Row, { label: "OS / Laudo", value: `${r.identification.osNumber || '—'} / ${r.identification.laudoNumber || '—'}` }),
                React.createElement(Row, { label: "Cliente", value: r.identification.client }),
                React.createElement(Row, { label: "Tipo de servi\u00E7o", value: r.identification.serviceType }),
                React.createElement(Row, { label: "T\u00E9cnico", value: r.identification.technician }),
                React.createElement(Row, { label: "Supervisor", value: r.identification.supervisor }),
                isIT002 && React.createElement(Row, { label: "Resp. da Qualidade", value: r.identification.qualityResponsible }),
                React.createElement(Row, { label: "PCP", value: r.identification.pcp }),
                React.createElement(Row, { label: "Status atual", value: React.createElement(StatusTag, { status: r.identification.currentStatus }) })),
            React.createElement("div", { className: "rkm-card p-5" },
                React.createElement("div", { className: "font-semibold mb-2" }, "Equipamento"),
                React.createElement(Row, { label: "Tag interna", value: r.equipment.tag }),
                React.createElement(Row, { label: "Marca / Modelo", value: `${r.equipment.brand || '—'} / ${r.equipment.model || '—'}` }),
                React.createElement(Row, { label: "Volume / Press\u00E3o", value: `${r.equipment.volume || '—'} · ${r.equipment.identifiedPressure || '—'}` }),
                React.createElement(Row, { label: "Placa/etiqueta", value: r.equipment.plate })),
            !isIT002 && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Despressuriza\u00E7\u00E3o & Pr\u00E9-carga"),
                    React.createElement(Row, { label: "Press\u00E3o aliviada", value: r.depressurization.pressaoAliviada ? 'Sim' : 'Não' }),
                    React.createElement(Row, { label: "G\u00E1s", value: r.nitrogenPreCharge.gas }),
                    React.createElement(Row, { label: "Fonte da pr\u00E9-carga", value: r.nitrogenPreCharge.fontePreCarga }),
                    React.createElement(Row, { label: "Press\u00E3o definida", value: `${r.nitrogenPreCharge.pressaoDefinida || '—'} ${r.nitrogenPreCharge.unidade || ''}` }),
                    React.createElement(Row, { label: "Press\u00E3o aplicada", value: r.nitrogenPreCharge.pressaoAplicada }),
                    React.createElement(Row, { label: "Estabiliza\u00E7\u00E3o \u2014 tempo", value: r.stabilization.tempo }),
                    React.createElement(Row, { label: "Estabilidade ap\u00F3s", value: r.stabilization.estavel }),
                    React.createElement(Row, { label: "Resultado confer\u00EAncia", value: React.createElement(StatusTag, { status: r.stabilization.resultado }) })),
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Inspe\u00E7\u00E3o & Decis\u00E3o"),
                    React.createElement(Row, { label: "Bexiga", value: r.inspection.bladder.decision }),
                    React.createElement(Row, { label: "Carca\u00E7a", value: r.inspection.shell.decision }),
                    React.createElement(Row, { label: "Roscas", value: r.inspection.threads.decision }),
                    React.createElement(Row, { label: "V\u00E1lvula g\u00E1s", value: r.inspection.gasValve.decision }),
                    React.createElement(Row, { label: "V\u00E1lvula \u00F3leo / conex\u00F5es", value: r.inspection.oilValveConnectionsFlanges.decision }),
                    React.createElement(Row, { label: "Veda\u00E7\u00F5es", value: r.inspection.sealsElastomers.decision }),
                    React.createElement(Row, { label: "Decis\u00E3o t\u00E9cnica", value: React.createElement(StatusTag, { status: r.technicalDecision.resultado }) }),
                    React.createElement(Row, { label: "Valida\u00E7\u00E3o supervisor", value: r.technicalDecision.validacaoSupervisor ? `Sim — ${r.technicalDecision.validador || '—'}` : 'Não' })),
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Verifica\u00E7\u00E3o final & Libera\u00E7\u00E3o"),
                    React.createElement(Row, { label: "Resultado final", value: React.createElement(StatusTag, { status: r.finalVerification.resultadoFinal }) }),
                    React.createElement(Row, { label: "Teste hidr\u00E1ulico", value: r.finalVerification.testeHidraulico ? 'Sim' : 'Não — verificação por pré-carga + estanqueidade (IT001 §21)' }),
                    React.createElement(Row, { label: "Laudo emitido", value: r.release.laudoEmitido ? `Sim — ${r.release.laudoFinal || '—'}` : 'Não' }),
                    React.createElement(Row, { label: "Condi\u00E7\u00E3o final", value: React.createElement(StatusTag, { status: r.release.condicaoFinal }) }),
                    React.createElement(Row, { label: "Resp. libera\u00E7\u00E3o", value: r.release.responsavelLiberacao }),
                    React.createElement(Row, { label: "Resp. PCP", value: r.release.responsavelPCP }),
                    React.createElement(Row, { label: "Data", value: r.release.dataLiberacao }))),
            isIT002 && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Isolamento & Carga de N\u2082"),
                    React.createElement(Row, { label: "Sistema isolado", value: r.safetyIsolation.sistemaIsolado ? 'Sim' : 'Não' }),
                    React.createElement(Row, { label: "Lado fluido descarregado", value: r.safetyIsolation.ladoFluidoDescarregado ? 'Sim' : 'Não' }),
                    React.createElement(Row, { label: "G\u00E1s", value: r.nitrogenCharge.gas }),
                    React.createElement(Row, { label: "Fonte da press\u00E3o", value: r.nitrogenCharge.fontePressao }),
                    React.createElement(Row, { label: "Press\u00E3o definida", value: `${r.nitrogenCharge.pressaoDefinida || '—'} ${r.nitrogenCharge.unidade || ''}` }),
                    React.createElement(Row, { label: "Press\u00E3o aplicada", value: r.nitrogenCharge.pressaoAplicada }),
                    React.createElement(Row, { label: "Conjunto de carga", value: r.nitrogenCharge.conjuntoCarga }),
                    React.createElement(Row, { label: "Man\u00F4metro", value: r.nitrogenCharge.manometroId })),
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Avalia\u00E7\u00E3o t\u00E9cnica & Decis\u00E3o"),
                    React.createElement(Row, { label: "Pist\u00E3o", value: r.assessment.piston.decision }),
                    React.createElement(Row, { label: "Carca\u00E7a/cilindro", value: r.assessment.shellCylinder.decision }),
                    React.createElement(Row, { label: "Inspe\u00E7\u00E3o dimensional", value: r.assessment.shellCylinder.dimensionalDone ? 'Realizada' : (r.assessment.shellCylinder.dimensionalTrigger ? 'Pendente — gatilho ativo' : 'Não aplicável') }),
                    React.createElement(Row, { label: "Tampas/roscas/canais/veda\u00E7\u00F5es", value: r.assessment.capsThreadsChannelsSeals.decision }),
                    React.createElement(Row, { label: "Decis\u00E3o consolidada", value: React.createElement(StatusTag, { status: r.acceptanceDecision.resultado }) }),
                    React.createElement(Row, { label: "Valida\u00E7\u00E3o supervisor", value: r.acceptanceDecision.validacaoSupervisor ? `Sim — ${r.acceptanceDecision.validador || '—'}` : 'Não' }),
                    React.createElement("div", { className: "pt-2 mt-2 border-t border-rkmborder" },
                        React.createElement("div", { className: "text-xs uppercase text-slate-500 mb-1" }, "Checkpoints anti-erro de montagem (IT002 \u00A714)"),
                        React.createElement("div", { className: "text-xs text-slate-300 grid grid-cols-2 gap-1" },
                            React.createElement("div", null,
                                r.assemblyIntegrity.semCorteVedacao ? '✓' : '×',
                                " Sem corte de veda\u00E7\u00E3o"),
                            React.createElement("div", null,
                                r.assemblyIntegrity.vedacaoCorreta ? '✓' : '×',
                                " Veda\u00E7\u00E3o n\u00E3o invertida"),
                            React.createElement("div", null,
                                r.assemblyIntegrity.lubrificacaoAplicada ? '✓' : '×',
                                " Lubrifica\u00E7\u00E3o aplicada"),
                            React.createElement("div", null,
                                r.assemblyIntegrity.pistaoAlinhado ? '✓' : '×',
                                " Pist\u00E3o alinhado")))),
                React.createElement("div", { className: "rkm-card p-5" },
                    React.createElement("div", { className: "font-semibold mb-2" }, "Verifica\u00E7\u00E3o final & Valida\u00E7\u00E3o da Qualidade"),
                    React.createElement(Row, { label: "Mant\u00E9m press\u00E3o", value: r.finalVerification.mantemPressao }),
                    React.createElement(Row, { label: "Sem vazamento", value: r.finalVerification.semVazamento }),
                    React.createElement(Row, { label: "Resultado final", value: React.createElement(StatusTag, { status: r.finalVerification.resultado }) }),
                    React.createElement(Row, { label: "Validador da Qualidade", value: r.qualityRelease.validador }),
                    React.createElement(Row, { label: "Decis\u00E3o da Qualidade", value: React.createElement(StatusTag, { status: r.qualityRelease.decisao }) }),
                    React.createElement(Row, { label: "Liberado pela Qualidade", value: r.qualityRelease.liberadoQualidade ? 'Sim' : 'Não' }),
                    React.createElement(Row, { label: "Laudo emitido", value: r.release.laudoEmitido ? `Sim — ${r.release.laudoFinal || '—'}` : 'Não' }),
                    React.createElement(Row, { label: "Condi\u00E7\u00E3o final", value: React.createElement(StatusTag, { status: r.release.condicaoFinal }) }),
                    React.createElement(Row, { label: "Lise", value: r.release.liseLancado ? `Lançado — ${r.release.liseId || 'sem ID'}` : 'Não lançado (sistema em implantação)' }))),
            React.createElement("div", { className: "rkm-card p-5" },
                React.createElement("div", { className: "font-semibold mb-2" }, "Qualidade"),
                React.createElement(Row, { label: "Classifica\u00E7\u00E3o", value: React.createElement(StatusTag, { status: r.classification.classificacao }) }),
                React.createElement(Row, { label: "Risco qualidade", value: r.classification.riscoQualidade ? 'Sim' : 'Não' }),
                React.createElement(Row, { label: "Risco SST", value: r.classification.riscoSST ? 'Sim' : 'Não' }),
                React.createElement(Row, { label: "Risco ambiental", value: r.classification.riscoAmbiental ? 'Sim' : 'Não' }),
                React.createElement(Row, { label: "Risco rastreabilidade", value: r.classification.riscoRastreabilidade ? 'Sim' : 'Não' }),
                React.createElement(Row, { label: "A\u00E7\u00E3o corretiva sugerida", value: r.classification.acaoCorretiva ? 'Sim' : 'Não' }))),
        React.createElement("div", { className: "rkm-card p-5" },
            React.createElement("div", { className: "font-semibold mb-2" }, "Estrutura de exporta\u00E7\u00E3o para Google Sheets"),
            React.createElement("div", { className: "text-xs text-slate-400 mb-3" },
                "Os campos abaixo s\u00E3o os que iriam para a planilha-m\u00E3e na pr\u00F3xima etapa (Apps Script / API). Roteamento por ",
                React.createElement("code", { className: "text-blue-300" }, "meta.itCode"),
                "."),
            React.createElement("div", { className: "bg-rkmbg border border-rkmborder rounded-lg p-3 text-xs font-mono text-slate-300 overflow-auto max-h-[420px] whitespace-pre" }, exportable))));
};

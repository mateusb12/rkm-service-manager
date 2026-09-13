// @ts-nocheck
import React from 'react';

import {
    Field,
    TextInput,
    TextArea,
    Select,
    Toggle,
    ChipMulti,
} from '../../../shared/ui/form-controls';

import { AlertBox } from '../../../shared/ui/feedback';

import {
    SectionCard,
} from '../../service-workflow/SectionCard';

import {
    EPI_LIST,
    STATUS_OPTIONS,
} from '../../service-workflow/constants';
/* ============================================================
   IT002 — Acumulador Hidropneumático tipo Pistão
   (NÃO INVENTAR critérios técnicos; lacunas viram pendência ou
    validação do supervisor / qualidade.)
   ============================================================ */
export const STEPS_IT002 = [
    { id: 1, key: 'opening', label: 'Abertura do serviço', short: 'Abertura', critical: false },
    { id: 2, key: 'equipment', label: 'Identificação do acumulador', short: 'Identificação', critical: true },
    { id: 3, key: 'receivedCondition', label: 'Estado inicial (recebimento)', short: 'Recebimento', critical: false },
    { id: 4, key: 'startConditions', label: 'Condições para início', short: 'Início', critical: false },
    { id: 5, key: 'safetyIsolation', label: 'Segurança e isolamento', short: 'Isolamento', critical: true },
    { id: 6, key: 'assessmentPiston', label: 'Avaliação técnica — Pistão', short: 'Pistão', critical: false },
    { id: 7, key: 'assessmentShell', label: 'Avaliação — Carcaça/cilindro', short: 'Carcaça', critical: false },
    { id: 8, key: 'assessmentCaps', label: 'Tampas, roscas, canais, vedações', short: 'Tampas/Vedações', critical: false },
    { id: 9, key: 'acceptanceDecision', label: 'Decisão técnica', short: 'Decisão', critical: false },
    { id: 10, key: 'cleaningPreservation', label: 'Limpeza e preservação', short: 'Limpeza', critical: false },
    { id: 11, key: 'assemblyIntegrity', label: 'Montagem e integridade', short: 'Montagem', critical: false },
    { id: 12, key: 'torque', label: 'Torque e aperto', short: 'Torque', critical: false },
    { id: 13, key: 'nitrogenCharge', label: 'Carga / pré-carga de N₂', short: 'Carga N₂', critical: true },
    { id: 14, key: 'finalVerification', label: 'Verificação final', short: 'Verificação', critical: true },
    { id: 15, key: 'qualityRelease', label: 'Validação da Qualidade', short: 'Qualidade', critical: true },
    { id: 16, key: 'environmental', label: 'Meio ambiente e resíduos', short: 'Ambiental', critical: false },
    { id: 17, key: 'nonConformity', label: 'NC, retrabalho, interrupção', short: 'NC', critical: false },
    { id: 18, key: 'technicalValidation', label: 'Validação técnica (supervisor)', short: 'Supervisor', critical: false },
    { id: 19, key: 'release', label: 'Liberação', short: 'Liberação', critical: false },
    { id: 20, key: 'classification', label: 'Classificação', short: 'Classificação', critical: false },
];
export const SERVICE_TYPES_IT002 = [
    'Avaliação técnica',
    'Manutenção',
    'Substituição de vedações',
    'Recarga / carga com nitrogênio',
    'Verificação para reaproveitamento',
    'Verificação para reparo',
    'Verificação para condenação',
    'Outro',
];
export const initialRecordIT002 = () => ({
    meta: { id: 'OS-' + Date.now().toString().slice(-6), itCode: 'IT002', createdAt: new Date().toISOString() },
    identification: { osNumber: '', laudoNumber: '', date: '', client: '', technician: '', auxiliary: '', supervisor: '', qualityResponsible: '', pcp: '', serviceType: '', initialStatus: 'Recebido', currentStatus: 'Recebido' },
    equipment: { tag: '', tagType: '', brand: '', model: '', volume: '', identifiedPressure: '', plate: '', notes: '', photoIdentificacao: false },
    receivedCondition: { externo: '', corrosion: '', marks: '', deformations: '', threadDamage: '', capsDamage: '', channelDamage: '', cleanliness: '', notes: '', photos: { overview: false, plate: false, damage: false, finalCondition: false } },
    startConditions: { vinculo: false, rastreabilidade: false, recursosMinimos: false, premissaRisco: false, segregacao: false, referenciaSuficiente: false, escalonamentoDefinido: false, ausenciaReferencia: false, duvidaCondicao: false, recursoFaltando: false, riscoFisico: false, result: '' },
    safetyIsolation: { sistemaIsolado: false, ladoFluidoDescarregado: false, areaSegura: false, equipImobilizado: false, pessoalQualificado: false, semOxigenio: false, epis: [], notes: '' },
    assessment: {
        piston: { inspected: false, conditions: [], decision: '', photo: false },
        shellCylinder: { inspected: false, conditions: [], decision: '', dimensionalTrigger: false, dimensionalDone: false, photo: false },
        capsThreadsChannelsSeals: { inspected: false, conditions: [], decision: '', photo: false },
    },
    acceptanceDecision: { resultado: '', reaproveitados: '', retrabalho: '', condenados: '', motivoCondenacao: '', duvida: false, validacaoSupervisor: false, validador: '', notes: '' },
    cleaningPreservation: { limpos: false, metodo: '', contaminacaoTratada: false, protegidos: false, semNovaContaminacao: false, semMistura: false, rastreabilidadeMantida: false, semDanoArmazenamento: false, notes: '' },
    assemblyIntegrity: { avaliacaoFeita: false, semCorteVedacao: false, vedacaoCorreta: false, lubrificacaoAplicada: false, pistaoAlinhado: false, integridadeCanais: false, conferenciaAntesCarga: false, outrosErros: '', tratativa: '', fotos: false, notes: '' },
    torque: { especificadoFabricante: '', fonte: '', valor: '', instrumento: '', validacaoTecnica: false, notes: '' },
    nitrogenCharge: { realizada: false, gas: '', fontePressao: '', pressaoDefinida: '', unidade: 'bar', pressaoAplicada: '', conjuntoCarga: '', manometroId: '', condicaoInstrumento: '', cargaLenta: false, anomalia: false, fotoLeitura: false, notes: '' },
    finalVerification: { mantemPressao: '', semVazamento: '', resultado: '', evidenciasFinais: false, notes: '' },
    qualityRelease: { validador: '', decisao: '', data: '', observacao: '', evidencia: false, liberadoQualidade: false },
    environmental: { oleoResidual: false, oleoSegregado: false, residuoContaminado: false, residuoSegregado: false, descarteVedacoes: false, separadosComuns: false, derramamento: false, contidoLimpo: false, absorvente: false, foto: false, notes: '' },
    nonConformity: { houve: false, tipos: [], interrompida: false, motivoInterrupcao: '', registroNum: '', acaoImediata: '', responsavel: '', evidencia: false },
    technicalValidation: { exigiu: false, motivo: '', validador: '', decisao: '', observacao: '', evidencia: false },
    release: { laudoEmitido: false, laudoFinal: '', checklistCompleto: false, evidenciasVinculadas: false, componentesRegistrados: false, pressaoAplicadaRegistrada: false, resultadoRegistrado: false, condicaoFinal: '', responsavelLiberacao: '', responsavelPCP: '', dataLiberacao: '', liseLancado: false, liseId: '', notes: '' },
    classification: { classificacao: '', riscoQualidade: false, riscoSST: false, riscoAmbiental: false, riscoRastreabilidade: false, impactoEstoque: false, acaoCorretiva: false, observacaoMelhoria: '' },
    assignedUsers: { operatorId: '', operatorName: '', supervisorId: '', supervisorName: '', qualityId: '', qualityName: '', pcpId: '', pcpName: '' },
    rolePermissions: {},
    visibility: { visibleToRoles: ['admin', 'supervisor', 'quality', 'pcp', 'operator'], editableByRoles: ['admin', 'operator'] },
    authorizationRequests: [],
    approvalHistory: [],
    attachments: [],
    statusHistory: [],
    actions: [],
});
/* ----- Alertas críticos IT002 (16 regras) ----- */
export const computeAlertsIT002 = (r) => {
    var _a, _b, _c, _d, _e, _f;
    const alerts = [];
    const id = r.identification || {};
    const eq = r.equipment || {};
    const safety = r.safetyIsolation || {};
    const assess = r.assessment || {};
    const ad = r.acceptanceDecision || {};
    const ai = r.assemblyIntegrity || {};
    const tq = r.torque || {};
    const nch = r.nitrogenCharge || {};
    const fv = r.finalVerification || {};
    const qr = r.qualityRelease || {};
    const env = r.environmental || {};
    const nc = r.nonConformity || {};
    const rel = r.release || {};
    const semIdentif = !eq.tag && !eq.brand && !eq.model && (!eq.plate || /Ausente|ilegível/i.test(eq.plate));
    if (semIdentif) {
        alerts.push({ severity: 'critical', step: 2, msg: 'Identificação insuficiente — sem placa/dado de fabricante. Parar até validação técnica (IT002 §15).' });
    }
    if (!id.client || !id.osNumber) {
        alerts.push({ severity: 'critical', step: 1, msg: 'Rastreabilidade mínima ausente — preencher cliente e OS/laudo.' });
    }
    if (!id.qualityResponsible) {
        alerts.push({ severity: 'warn', step: 1, msg: 'Responsável da Qualidade não informado — IT002 §5.2 exige para liberação.' });
    }
    if (nch.realizada && (!safety.sistemaIsolado || !safety.ladoFluidoDescarregado)) {
        alerts.push({ severity: 'critical', step: 5, msg: 'Carga em andamento sem isolamento do sistema ou sem descarga do lado fluido (IT002 §10).' });
    }
    if (nch.gas && nch.gas !== 'Nitrogênio') {
        alerts.push({ severity: 'critical', step: 13, msg: 'Gás diferente de nitrogênio. IT002 §10 proíbe oxigênio/ar comprimido. NÃO LIBERAR.' });
    }
    if (nch.fontePressao === 'Sem referência confiável') {
        alerts.push({ severity: 'critical', step: 13, msg: 'Sem fonte confiável de pressão — parar serviço até validação do supervisor (IT002 §15).' });
    }
    if (((_a = assess.shellCylinder) === null || _a === void 0 ? void 0 : _a.dimensionalTrigger) && !((_b = assess.shellCylinder) === null || _b === void 0 ? void 0 : _b.dimensionalDone)) {
        alerts.push({ severity: 'warn', step: 7, msg: 'Carcaça/cilindro com suspeita dimensional não confirmada por inspeção dimensional (APH-02).' });
    }
    const pisCond = ((_c = assess.piston) === null || _c === void 0 ? void 0 : _c.conditions) || [];
    const pisDec = ((_d = assess.piston) === null || _d === void 0 ? void 0 : _d.decision) || '';
    const pisCritico = pisCond.some(c => /trinca|corros[ãa]o relevante|risco profundo/i.test(c));
    if (pisCritico && (!pisDec || /reaproveit/i.test(pisDec))) {
        alerts.push({ severity: 'warn', step: 6, msg: 'Pistão com sinais críticos sem condenação ou validação do supervisor (IT002 §11.1).' });
    }
    if (ai.avaliacaoFeita && (!ai.semCorteVedacao || !ai.vedacaoCorreta || !ai.lubrificacaoAplicada || !ai.pistaoAlinhado) && !ai.tratativa) {
        alerts.push({ severity: 'critical', step: 11, msg: 'Erro crítico de montagem (corte vedação / vedação invertida / falta de lubrificação / pistão desalinhado) sem tratativa (IT002 §14).' });
    }
    if (fv.mantemPressao === 'Não' || fv.semVazamento === 'Não') {
        alerts.push({ severity: 'critical', step: 14, msg: 'Verificação final reprovada — pressão não mantida ou vazamento detectado (IT002 §17).' });
    }
    if (rel.condicaoFinal === 'Liberado para entrega' && !qr.liberadoQualidade) {
        alerts.push({ severity: 'critical', step: 15, msg: 'Liberação sem validação da Qualidade — IT002 §17/§19 exige aprovação da qualidade.' });
    }
    if (tq.fonte === 'Não havia especificação disponível' && !tq.validacaoTecnica) {
        alerts.push({ severity: 'warn', step: 12, msg: 'Torque sem fonte do fabricante e sem validação técnica registrada (APH-08).' });
    }
    if (ad.duvida && !ad.validacaoSupervisor) {
        alerts.push({ severity: 'critical', step: 9, msg: 'Decisão técnica com dúvida sem validação do supervisor (IT002 §12).' });
    }
    const evidPendente = !r.equipment.photoIdentificacao && !((_f = (_e = r.receivedCondition) === null || _e === void 0 ? void 0 : _e.photos) === null || _f === void 0 ? void 0 : _f.overview);
    if (evidPendente) {
        alerts.push({ severity: 'warn', step: 3, msg: 'Evidências fotográficas mínimas pendentes (placa / visão geral).' });
    }
    if (rel.condicaoFinal === 'Liberado para entrega' && nc.houve && !nc.registroNum) {
        alerts.push({ severity: 'critical', step: 19, msg: 'Liberação com NC aberta sem número de registro.' });
    }
    if (env.derramamento && !env.contidoLimpo) {
        alerts.push({ severity: 'critical', step: 16, msg: 'Derramamento sem contenção/limpeza registrada (APH-17).' });
    }
    return alerts;
};
/* ----- IT002 step renderers ----- */
export const StepOpeningIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "1. Abertura do servi\u00E7o", subtitle: "IT002 \u00A75, \u00A78 \u2014 identifica\u00E7\u00E3o b\u00E1sica + Respons\u00E1vel da Qualidade." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "N\u00BA da OS", required: true },
            React.createElement(TextInput, { value: r.identification.osNumber, onChange: v => set('identification.osNumber', v), placeholder: "Ex: OS-2042" })),
        React.createElement(Field, { label: "N\u00BA do laudo" },
            React.createElement(TextInput, { value: r.identification.laudoNumber, onChange: v => set('identification.laudoNumber', v) })),
        React.createElement(Field, { label: "Data", required: true },
            React.createElement(TextInput, { type: "date", value: r.identification.date, onChange: v => set('identification.date', v) })),
        React.createElement(Field, { label: "Cliente", required: true, className: "md:col-span-2" },
            React.createElement(TextInput, { value: r.identification.client, onChange: v => set('identification.client', v), placeholder: "Raz\u00E3o social" })),
        React.createElement(Field, { label: "Tipo de servi\u00E7o", required: true },
            React.createElement(Select, { value: r.identification.serviceType, onChange: v => set('identification.serviceType', v), options: SERVICE_TYPES_IT002 })),
        React.createElement(Field, { label: "T\u00E9cnico respons\u00E1vel", required: true },
            React.createElement(TextInput, { value: r.identification.technician, onChange: v => set('identification.technician', v) })),
        React.createElement(Field, { label: "Auxiliar (se aplic\u00E1vel)" },
            React.createElement(TextInput, { value: r.identification.auxiliary, onChange: v => set('identification.auxiliary', v) })),
        React.createElement(Field, { label: "Supervisor / apoio t\u00E9cnico" },
            React.createElement(TextInput, { value: r.identification.supervisor, onChange: v => set('identification.supervisor', v) })),
        React.createElement(Field, { label: "Respons\u00E1vel da Qualidade", required: true, hint: "IT002 \u00A75.2 \u2014 exigido para libera\u00E7\u00E3o" },
            React.createElement(TextInput, { value: r.identification.qualityResponsible, onChange: v => set('identification.qualityResponsible', v) })),
        React.createElement(Field, { label: "PCP" },
            React.createElement(TextInput, { value: r.identification.pcp, onChange: v => set('identification.pcp', v) })),
        React.createElement(Field, { label: "Status atual" },
            React.createElement(Select, { value: r.identification.currentStatus, onChange: v => set('identification.currentStatus', v), options: STATUS_OPTIONS })))));
export const StepEquipmentIT002 = ({ r, set }) => {
    const noId = !r.equipment.tag && !r.equipment.brand && !r.equipment.model && (!r.equipment.plate || /Ausente|ilegível/i.test(r.equipment.plate));
    return (React.createElement(SectionCard, { title: "2. Identifica\u00E7\u00E3o do acumulador", subtitle: "IT002 \u00A78 \u2014 placa, fabricante e dados do equipamento.", critical: true },
        noId && React.createElement(AlertBox, { severity: "critical", title: "Sem identifica\u00E7\u00E3o confi\u00E1vel" }, "IT002 \u00A715: na falta de placa leg\u00EDvel, dado confi\u00E1vel ou refer\u00EAncia suficiente \u2014 parar o servi\u00E7o e validar com supervisor antes de seguir."),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            React.createElement(Field, { label: "Identifica\u00E7\u00E3o f\u00EDsica (tag interna)" },
                React.createElement(TextInput, { value: r.equipment.tag, onChange: v => set('equipment.tag', v), placeholder: "Ex: APH-2026-019" })),
            React.createElement(Field, { label: "Tipo de identifica\u00E7\u00E3o" },
                React.createElement(Select, { value: r.equipment.tagType, onChange: v => set('equipment.tagType', v), options: ['Etiqueta interna', 'Placa do fabricante', 'Marcação a punção', 'Marcação manual', 'Sem identificação'] })),
            React.createElement(Field, { label: "Exist\u00EAncia de placa/etiqueta leg\u00EDvel" },
                React.createElement(Select, { value: r.equipment.plate, onChange: v => set('equipment.plate', v), options: ['Sim — legível', 'Sim — parcial', 'Sim — ilegível', 'Ausente'] })),
            React.createElement(Field, { label: "Marca" },
                React.createElement(TextInput, { value: r.equipment.brand, onChange: v => set('equipment.brand', v), placeholder: "Parker / HYDAC / Bosch Rexroth / Roth..." })),
            React.createElement(Field, { label: "Modelo" },
                React.createElement(TextInput, { value: r.equipment.model, onChange: v => set('equipment.model', v) })),
            React.createElement(Field, { label: "Volume nominal" },
                React.createElement(TextInput, { value: r.equipment.volume, onChange: v => set('equipment.volume', v), placeholder: "Ex: 25 L" })),
            React.createElement(Field, { label: "Press\u00E3o identificada (placa)" },
                React.createElement(TextInput, { value: r.equipment.identifiedPressure, onChange: v => set('equipment.identifiedPressure', v), placeholder: "Ex: 250 bar" })),
            React.createElement(Field, { className: "md:col-span-2", label: "Observa\u00E7\u00F5es" },
                React.createElement(TextArea, { rows: 2, value: r.equipment.notes, onChange: v => set('equipment.notes', v) }))),
        React.createElement(Field, { label: "Evid\u00EAncia fotogr\u00E1fica da placa/identifica\u00E7\u00E3o" },
            React.createElement(Toggle, { checked: r.equipment.photoIdentificacao, onChange: v => set('equipment.photoIdentificacao', v), label: "Foto anexada (placa/etiqueta \u2014 registrar mesmo se ileg\u00EDvel)" }))));
};
export const StepReceivedIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "3. Estado inicial (recebimento)", subtitle: "IT002 \u00A79 \u2014 condi\u00E7\u00E3o geral antes de qualquer decis\u00E3o de continuidade." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Estado externo" },
            React.createElement(Select, { value: r.receivedCondition.externo, onChange: v => set('receivedCondition.externo', v), options: ['Bom', 'Regular', 'Ruim', 'Crítico'] })),
        React.createElement(Field, { label: "Corros\u00E3o" },
            React.createElement(Select, { value: r.receivedCondition.corrosion, onChange: v => set('receivedCondition.corrosion', v), options: ['Não', 'Superficial', 'Pontual', 'Generalizada'] })),
        React.createElement(Field, { label: "Marcas" },
            React.createElement(Select, { value: r.receivedCondition.marks, onChange: v => set('receivedCondition.marks', v), options: ['Não', 'Leves', 'Relevantes'] })),
        React.createElement(Field, { label: "Deforma\u00E7\u00F5es" },
            React.createElement(Select, { value: r.receivedCondition.deformations, onChange: v => set('receivedCondition.deformations', v), options: ['Não', 'Suspeita', 'Sim — leve', 'Sim — relevante'] })),
        React.createElement(Field, { label: "Dano em roscas" },
            React.createElement(Select, { value: r.receivedCondition.threadDamage, onChange: v => set('receivedCondition.threadDamage', v), options: ['Não', 'Suspeito', 'Sim — leve', 'Sim — relevante'] })),
        React.createElement(Field, { label: "Dano em tampas" },
            React.createElement(Select, { value: r.receivedCondition.capsDamage, onChange: v => set('receivedCondition.capsDamage', v), options: ['Não', 'Leve', 'Relevante'] })),
        React.createElement(Field, { label: "Dano em canais" },
            React.createElement(Select, { value: r.receivedCondition.channelDamage, onChange: v => set('receivedCondition.channelDamage', v), options: ['Não', 'Leve', 'Relevante'] })),
        React.createElement(Field, { label: "Limpeza" },
            React.createElement(Select, { value: r.receivedCondition.cleanliness, onChange: v => set('receivedCondition.cleanliness', v), options: ['Adequada', 'Sujidade leve', 'Contaminação relevante'] })),
        React.createElement(Field, { className: "md:col-span-3", label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.receivedCondition.notes, onChange: v => set('receivedCondition.notes', v) }))),
    React.createElement("div", null,
        React.createElement("div", { className: "text-xs font-medium text-slate-300 uppercase tracking-wide mb-2" }, "Evid\u00EAncias fotogr\u00E1ficas m\u00EDnimas"),
        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2" },
            React.createElement(Toggle, { checked: r.receivedCondition.photos.overview, onChange: v => set('receivedCondition.photos.overview', v), label: "Vis\u00E3o geral" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.plate, onChange: v => set('receivedCondition.photos.plate', v), label: "Placa / identifica\u00E7\u00E3o" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.damage, onChange: v => set('receivedCondition.photos.damage', v), label: "Pontos de dano" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.finalCondition, onChange: v => set('receivedCondition.photos.finalCondition', v), label: "Condi\u00E7\u00E3o final (ap\u00F3s servi\u00E7o)" })))));
export const StepStartConditionsIT002 = ({ r, set }) => {
    const blocked = r.startConditions.ausenciaReferencia || r.startConditions.duvidaCondicao || r.startConditions.recursoFaltando || r.startConditions.riscoFisico;
    return (React.createElement(SectionCard, { title: "4. Condi\u00E7\u00F5es para in\u00EDcio", subtitle: "IT002 \u00A77 \u2014 s\u00F3 iniciar com v\u00EDnculo, recursos, refer\u00EAncia e premissa de risco assumida." },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
            React.createElement(Toggle, { checked: r.startConditions.vinculo, onChange: v => set('startConditions.vinculo', v), label: "Equipamento recebido e identificado" }),
            React.createElement(Toggle, { checked: r.startConditions.rastreabilidade, onChange: v => set('startConditions.rastreabilidade', v), label: "V\u00EDnculo m\u00EDnimo com cliente / servi\u00E7o" }),
            React.createElement(Toggle, { checked: r.startConditions.recursosMinimos, onChange: v => set('startConditions.recursosMinimos', v), label: "Recursos m\u00EDnimos para controle seguro" }),
            React.createElement(Toggle, { checked: r.startConditions.premissaRisco, onChange: v => set('startConditions.premissaRisco', v), label: "Premissa de risco (energia armazenada) assumida" }),
            React.createElement(Toggle, { checked: r.startConditions.segregacao, onChange: v => set('startConditions.segregacao', v), label: "Condi\u00E7\u00E3o m\u00EDnima de segrega\u00E7\u00E3o de pe\u00E7as" }),
            React.createElement(Toggle, { checked: r.startConditions.referenciaSuficiente, onChange: v => set('startConditions.referenciaSuficiente', v), label: "Refer\u00EAncia t\u00E9cnica suficiente" }),
            React.createElement(Toggle, { checked: r.startConditions.escalonamentoDefinido, onChange: v => set('startConditions.escalonamentoDefinido', v), label: "Caminho de escalonamento definido (se faltar refer\u00EAncia)" })),
        React.createElement("div", { className: "border-t border-rkmborder pt-4 grid grid-cols-1 md:grid-cols-2 gap-2" },
            React.createElement(Toggle, { checked: r.startConditions.ausenciaReferencia, onChange: v => set('startConditions.ausenciaReferencia', v), label: "AUS\u00CANCIA de refer\u00EAncia confi\u00E1vel sem valida\u00E7\u00E3o superior" }),
            React.createElement(Toggle, { checked: r.startConditions.duvidaCondicao, onChange: v => set('startConditions.duvidaCondicao', v), label: "D\u00DAVIDA cr\u00EDtica sobre condi\u00E7\u00E3o do equipamento" }),
            React.createElement(Toggle, { checked: r.startConditions.recursoFaltando, onChange: v => set('startConditions.recursoFaltando', v), label: "Falta de recurso m\u00EDnimo para controle seguro" }),
            React.createElement(Toggle, { checked: r.startConditions.riscoFisico, onChange: v => set('startConditions.riscoFisico', v), label: "Condi\u00E7\u00E3o f\u00EDsica que indique risco relevante" })),
        blocked && React.createElement(AlertBox, { severity: "critical", title: "Bloqueio at\u00E9 valida\u00E7\u00E3o" }, "IT002 \u00A77 lista esta condi\u00E7\u00E3o como impedimento de continuidade. N\u00E3o iniciar at\u00E9 valida\u00E7\u00E3o do supervisor / respons\u00E1vel t\u00E9cnico."),
        React.createElement(Field, { label: "Resultado da etapa" },
            React.createElement(Select, { value: r.startConditions.result, onChange: v => set('startConditions.result', v), options: ['Liberado para início', 'Liberado com ressalva', 'Bloqueado até validação do supervisor', 'Bloqueado por condição insegura', 'Bloqueado por falta de informação técnica'] }))));
};
export const StepSafetyIsolationIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "5. Seguran\u00E7a e isolamento", subtitle: "IT002 \u00A710 \u2014 isolar do sistema e descarregar lado fluido ANTES de leitura/carga.", critical: true },
    React.createElement(AlertBox, { severity: "info", title: "Diretriz IT002 \u00A710" },
        "Atividade restrita a pessoal qualificado. Antes de leitura/carga, o acumulador deve estar ",
        React.createElement("b", null, "isolado do sistema hidr\u00E1ulico"),
        " e com o ",
        React.createElement("b", null, "lado fluido descarregado"),
        ". ",
        React.createElement("b", null, "Nunca"),
        " usar oxig\u00EAnio ou ar comprimido \u2014 somente nitrog\u00EAnio."),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.safetyIsolation.sistemaIsolado, onChange: v => set('safetyIsolation.sistemaIsolado', v), label: "Sistema hidr\u00E1ulico ISOLADO" }),
        React.createElement(Toggle, { checked: r.safetyIsolation.ladoFluidoDescarregado, onChange: v => set('safetyIsolation.ladoFluidoDescarregado', v), label: "Lado fluido DESCARREGADO" }),
        React.createElement(Toggle, { checked: r.safetyIsolation.areaSegura, onChange: v => set('safetyIsolation.areaSegura', v), label: "\u00C1rea segura definida" }),
        React.createElement(Toggle, { checked: r.safetyIsolation.equipImobilizado, onChange: v => set('safetyIsolation.equipImobilizado', v), label: "Equipamento imobilizado / est\u00E1vel" }),
        React.createElement(Toggle, { checked: r.safetyIsolation.pessoalQualificado, onChange: v => set('safetyIsolation.pessoalQualificado', v), label: "Pessoal qualificado / autorizado internamente" }),
        React.createElement(Toggle, { checked: r.safetyIsolation.semOxigenio, onChange: v => set('safetyIsolation.semOxigenio', v), label: "Confirmado: N\u00C3O usar oxig\u00EAnio nem ar comprimido" })),
    React.createElement(Field, { label: "EPIs utilizados" },
        React.createElement(ChipMulti, { values: r.safetyIsolation.epis, onChange: v => set('safetyIsolation.epis', v), options: EPI_LIST })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.safetyIsolation.notes, onChange: v => set('safetyIsolation.notes', v) }))));
export const StepAssessmentPistonIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "6. Avalia\u00E7\u00E3o t\u00E9cnica \u2014 Pist\u00E3o", subtitle: "IT002 \u00A711.1 \u2014 reaproveitar somente se \u00EDntegro, sem trinca, sem corros\u00E3o relevante, sem riscos profundos." },
    React.createElement(Toggle, { checked: r.assessment.piston.inspected, onChange: v => set('assessment.piston.inspected', v), label: "Pist\u00E3o inspecionado" }),
    React.createElement(Field, { label: "Condi\u00E7\u00F5es observadas" },
        React.createElement(ChipMulti, { values: r.assessment.piston.conditions, onChange: v => set('assessment.piston.conditions', v), options: ['Íntegro visualmente', 'Trinca', 'Corrosão relevante', 'Risco profundo', 'Desgaste leve', 'Marcas superficiais', 'Condição duvidosa'] })),
    React.createElement(Field, { label: "Decis\u00E3o" },
        React.createElement(Select, { value: r.assessment.piston.decision, onChange: v => set('assessment.piston.decision', v), options: ['Reaproveitar', 'Reaproveitar com validação do supervisor', 'Retrabalho', 'Condenar', 'Pendente de validação técnica'] })),
    React.createElement(Toggle, { checked: r.assessment.piston.photo, onChange: v => set('assessment.piston.photo', v), label: "Foto do pist\u00E3o (sinais relevantes)" }),
    React.createElement(AlertBox, { severity: "info" },
        "IT002 \u00A712: pist\u00E3o e carca\u00E7a/cilindro ",
        React.createElement("b", null, "n\u00E3o devem ser liberados por presun\u00E7\u00E3o"),
        ". Em caso de incerteza, valida\u00E7\u00E3o t\u00E9cnica obrigat\u00F3ria.")));
export const StepAssessmentShellIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "7. Avalia\u00E7\u00E3o \u2014 Carca\u00E7a/cilindro", subtitle: "IT002 \u00A711.2 \u2014 base \u00E9 visual, com verifica\u00E7\u00E3o dimensional em casos espec\u00EDficos (APH-02)." },
    React.createElement(Toggle, { checked: r.assessment.shellCylinder.inspected, onChange: v => set('assessment.shellCylinder.inspected', v), label: "Carca\u00E7a/cilindro inspecionado" }),
    React.createElement(Field, { label: "Condi\u00E7\u00F5es observadas" },
        React.createElement(ChipMulti, { values: r.assessment.shellCylinder.conditions, onChange: v => set('assessment.shellCylinder.conditions', v), options: ['Sem dano aparente', 'Corrosão interna', 'Corrosão externa', 'Desgaste suspeito', 'Deformação', 'Ovalização', 'Folga incompatível', 'Dano em vedação', 'Condição duvidosa'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.assessment.shellCylinder.dimensionalTrigger, onChange: v => set('assessment.shellCylinder.dimensionalTrigger', v), label: "H\u00E1 GATILHO para inspe\u00E7\u00E3o dimensional (APH-02)" }),
        React.createElement(Toggle, { checked: r.assessment.shellCylinder.dimensionalDone, onChange: v => set('assessment.shellCylinder.dimensionalDone', v), label: "Inspe\u00E7\u00E3o dimensional realizada" })),
    React.createElement(Field, { label: "Decis\u00E3o" },
        React.createElement(Select, { value: r.assessment.shellCylinder.decision, onChange: v => set('assessment.shellCylinder.decision', v), options: ['Apta para continuidade', 'Apta com ressalva', 'Retrabalho', 'Condenar', 'Pendente de medição/ensaio', 'Pendente de validação técnica'] })),
    React.createElement(Toggle, { checked: r.assessment.shellCylinder.photo, onChange: v => set('assessment.shellCylinder.photo', v), label: "Foto da carca\u00E7a/cilindro" })));
export const StepAssessmentCapsIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "8. Tampas, roscas, canais, conex\u00F5es e veda\u00E7\u00F5es", subtitle: "IT002 \u00A711.3 \u2014 sinais que comprometam veda\u00E7\u00E3o, montagem ou seguran\u00E7a." },
    React.createElement(Toggle, { checked: r.assessment.capsThreadsChannelsSeals.inspected, onChange: v => set('assessment.capsThreadsChannelsSeals.inspected', v), label: "Itens inspecionados" }),
    React.createElement(Field, { label: "Condi\u00E7\u00F5es observadas" },
        React.createElement(ChipMulti, { values: r.assessment.capsThreadsChannelsSeals.conditions, onChange: v => set('assessment.capsThreadsChannelsSeals.conditions', v), options: ['Sem dano aparente', 'Deformação', 'Desgaste', 'Dano em rosca', 'Dano em canal de vedação', 'Corrosão', 'Comprometimento de vedação', 'Comprometimento de montagem', 'Condição que afeta segurança', 'Condição duvidosa'] })),
    React.createElement(Field, { label: "Decis\u00E3o" },
        React.createElement(Select, { value: r.assessment.capsThreadsChannelsSeals.decision, onChange: v => set('assessment.capsThreadsChannelsSeals.decision', v), options: ['Reaproveitar', 'Reaproveitar com validação', 'Retrabalho', 'Substituir', 'Condenar', 'Pendente de validação técnica'] })),
    React.createElement(Toggle, { checked: r.assessment.capsThreadsChannelsSeals.photo, onChange: v => set('assessment.capsThreadsChannelsSeals.photo', v), label: "Foto dos itens com sinais relevantes" })));
export const StepAcceptanceDecisionIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "9. Decis\u00E3o t\u00E9cnica", subtitle: "IT002 \u00A712 \u2014 consolida\u00E7\u00E3o da avalia\u00E7\u00E3o para aceita\u00E7\u00E3o, retrabalho ou condena\u00E7\u00E3o." },
    React.createElement(Field, { label: "Resultado consolidado" },
        React.createElement(Select, { value: r.acceptanceDecision.resultado, onChange: v => set('acceptanceDecision.resultado', v), options: ['Apto para continuidade', 'Apto com ressalva', 'Requer retrabalho', 'Requer substituição de componentes', 'Requer validação do supervisor', 'Condenado', 'Serviço interrompido'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Componentes reaproveitados" },
            React.createElement(TextArea, { rows: 2, value: r.acceptanceDecision.reaproveitados, onChange: v => set('acceptanceDecision.reaproveitados', v) })),
        React.createElement(Field, { label: "Componentes em retrabalho" },
            React.createElement(TextArea, { rows: 2, value: r.acceptanceDecision.retrabalho, onChange: v => set('acceptanceDecision.retrabalho', v) })),
        React.createElement(Field, { label: "Componentes condenados" },
            React.createElement(TextArea, { rows: 2, value: r.acceptanceDecision.condenados, onChange: v => set('acceptanceDecision.condenados', v) }))),
    React.createElement(Field, { label: "Motivo da condena\u00E7\u00E3o (se houver)" },
        React.createElement(TextArea, { rows: 2, value: r.acceptanceDecision.motivoCondenacao, onChange: v => set('acceptanceDecision.motivoCondenacao', v) })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2" },
        React.createElement(Toggle, { checked: r.acceptanceDecision.duvida, onChange: v => set('acceptanceDecision.duvida', v), label: "Existe d\u00FAvida t\u00E9cnica" }),
        React.createElement(Toggle, { checked: r.acceptanceDecision.validacaoSupervisor, onChange: v => set('acceptanceDecision.validacaoSupervisor', v), label: "Valida\u00E7\u00E3o do supervisor obtida" }),
        React.createElement(Field, { label: "Validador" },
            React.createElement(TextInput, { value: r.acceptanceDecision.validador, onChange: v => set('acceptanceDecision.validador', v) }))),
    r.acceptanceDecision.duvida && !r.acceptanceDecision.validacaoSupervisor && (React.createElement(AlertBox, { severity: "critical", title: "Decis\u00E3o com d\u00FAvida sem valida\u00E7\u00E3o" }, "IT002 \u00A712 \u2014 em caso de incerteza, o caso deve seguir para valida\u00E7\u00E3o t\u00E9cnica.")),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.acceptanceDecision.notes, onChange: v => set('acceptanceDecision.notes', v) }))));
export const StepCleaningPreservationIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "10. Limpeza e preserva\u00E7\u00E3o", subtitle: "IT002 \u00A713 \u2014 remover contaminantes sem agravar danos; preservar componentes." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.cleaningPreservation.limpos, onChange: v => set('cleaningPreservation.limpos', v), label: "Componentes limpos" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.contaminacaoTratada, onChange: v => set('cleaningPreservation.contaminacaoTratada', v), label: "Contamina\u00E7\u00E3o tratada" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.protegidos, onChange: v => set('cleaningPreservation.protegidos', v), label: "Componentes protegidos ap\u00F3s limpeza" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.semNovaContaminacao, onChange: v => set('cleaningPreservation.semNovaContaminacao', v), label: "Sem risco de nova contamina\u00E7\u00E3o" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.semMistura, onChange: v => set('cleaningPreservation.semMistura', v), label: "Sem mistura entre pe\u00E7as" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.rastreabilidadeMantida, onChange: v => set('cleaningPreservation.rastreabilidadeMantida', v), label: "Rastreabilidade mantida" }),
        React.createElement(Toggle, { checked: r.cleaningPreservation.semDanoArmazenamento, onChange: v => set('cleaningPreservation.semDanoArmazenamento', v), label: "Sem dano por impacto/armazenamento" })),
    React.createElement(Field, { label: "M\u00E9todo/produto de limpeza utilizado" },
        React.createElement(TextInput, { value: r.cleaningPreservation.metodo, onChange: v => set('cleaningPreservation.metodo', v) })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.cleaningPreservation.notes, onChange: v => set('cleaningPreservation.notes', v) }))));
export const StepAssemblyIntegrityIT002 = ({ r, set }) => {
    const erro = r.assemblyIntegrity.avaliacaoFeita && (!r.assemblyIntegrity.semCorteVedacao || !r.assemblyIntegrity.vedacaoCorreta || !r.assemblyIntegrity.lubrificacaoAplicada || !r.assemblyIntegrity.pistaoAlinhado);
    return (React.createElement(SectionCard, { title: "11. Montagem e integridade", subtitle: "IT002 \u00A714 \u2014 checkpoints anti-erro: corte de veda\u00E7\u00E3o, veda\u00E7\u00E3o invertida, lubrifica\u00E7\u00E3o, alinhamento." },
        React.createElement(Toggle, { checked: r.assemblyIntegrity.avaliacaoFeita, onChange: v => set('assemblyIntegrity.avaliacaoFeita', v), label: "Avalia\u00E7\u00E3o de integridade realizada antes da carga" }),
        React.createElement("div", null,
            React.createElement("div", { className: "text-xs font-medium text-slate-300 uppercase tracking-wide mb-2" }, "Erros cr\u00EDticos da IT002 \u00A714 \u2014 confirmar AUS\u00CANCIA"),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
                React.createElement(Toggle, { checked: r.assemblyIntegrity.semCorteVedacao, onChange: v => set('assemblyIntegrity.semCorteVedacao', v), label: "SEM corte de veda\u00E7\u00E3o" }),
                React.createElement(Toggle, { checked: r.assemblyIntegrity.vedacaoCorreta, onChange: v => set('assemblyIntegrity.vedacaoCorreta', v), label: "Veda\u00E7\u00E3o N\u00C3O invertida" }),
                React.createElement(Toggle, { checked: r.assemblyIntegrity.lubrificacaoAplicada, onChange: v => set('assemblyIntegrity.lubrificacaoAplicada', v), label: "Lubrifica\u00E7\u00E3o aplic\u00E1vel APLICADA" }),
                React.createElement(Toggle, { checked: r.assemblyIntegrity.pistaoAlinhado, onChange: v => set('assemblyIntegrity.pistaoAlinhado', v), label: "Pist\u00E3o ALINHADO" }),
                React.createElement(Toggle, { checked: r.assemblyIntegrity.integridadeCanais, onChange: v => set('assemblyIntegrity.integridadeCanais', v), label: "Integridade dos canais confirmada" }),
                React.createElement(Toggle, { checked: r.assemblyIntegrity.conferenciaAntesCarga, onChange: v => set('assemblyIntegrity.conferenciaAntesCarga', v), label: "Confer\u00EAncia ANTES da carga" }))),
        erro && (React.createElement(React.Fragment, null,
            React.createElement(AlertBox, { severity: "critical", title: "Erro cr\u00EDtico de montagem" }, "IT002 \u00A714 trata esses pontos como cr\u00EDticos para preven\u00E7\u00E3o de falha. Registrar tratativa antes de prosseguir para carga."),
            React.createElement(Field, { label: "Outros erros / detalhes" },
                React.createElement(TextArea, { value: r.assemblyIntegrity.outrosErros, onChange: v => set('assemblyIntegrity.outrosErros', v) })),
            React.createElement(Field, { label: "Tratativa adotada (obrigat\u00F3ria)" },
                React.createElement(TextArea, { value: r.assemblyIntegrity.tratativa, onChange: v => set('assemblyIntegrity.tratativa', v), placeholder: "Ex: veda\u00E7\u00E3o substitu\u00EDda, recolocada, valida\u00E7\u00E3o do supervisor..." })))),
        React.createElement(Toggle, { checked: r.assemblyIntegrity.fotos, onChange: v => set('assemblyIntegrity.fotos', v), label: "Fotos da montagem" }),
        React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.assemblyIntegrity.notes, onChange: v => set('assemblyIntegrity.notes', v) }))));
};
export const StepTorqueIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "12. Torque e aperto", subtitle: "IT002 \u00A716 \u2014 torque conforme fabricante; sem dado, valida\u00E7\u00E3o t\u00E9cnica controlada (APH-08)." },
    React.createElement(Field, { label: "Existe torque especificado pelo fabricante?" },
        React.createElement(Select, { value: r.torque.especificadoFabricante, onChange: v => set('torque.especificadoFabricante', v), options: ['Sim — usar fabricante', 'Não — usar validação técnica', 'Não aplicável'] })),
    React.createElement(Field, { label: "Fonte do torque/crit\u00E9rio adotado" },
        React.createElement(Select, { value: r.torque.fonte, onChange: v => set('torque.fonte', v), options: ['Manual/datasheet do fabricante', 'Especificação do cliente', 'Validação do supervisor/responsável técnico', 'Critério provisório interno registrado', 'Não havia especificação disponível', 'Não aplicável'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Valor aplicado" },
            React.createElement(TextInput, { value: r.torque.valor, onChange: v => set('torque.valor', v), placeholder: "Ex: 120 N\u00B7m" })),
        React.createElement(Field, { label: "Instrumento utilizado" },
            React.createElement(TextInput, { value: r.torque.instrumento, onChange: v => set('torque.instrumento', v) })),
        React.createElement("div", { className: "flex items-end" },
            React.createElement(Toggle, { checked: r.torque.validacaoTecnica, onChange: v => set('torque.validacaoTecnica', v), label: "Valida\u00E7\u00E3o t\u00E9cnica registrada" }))),
    (!r.torque.fonte || /Não havia/.test(r.torque.fonte)) && (React.createElement(AlertBox, { severity: "warn", title: "Crit\u00E9rio de torque n\u00E3o formalizado" }, "IT002 \u00A716 e APH-08: sem dado do fabricante e sem valida\u00E7\u00E3o t\u00E9cnica formalizada. N\u00E3o inventar valor \u2014 registrar a condi\u00E7\u00E3o.")),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.torque.notes, onChange: v => set('torque.notes', v) }))));
export const StepNitrogenChargeIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "13. Carga / pr\u00E9-carga de nitrog\u00EAnio", subtitle: "IT002 \u00A715 \u2014 apenas nitrog\u00EAnio; isolamento + descarga pr\u00E9vios; fonte hierarquizada.", critical: true },
    React.createElement(Toggle, { checked: r.nitrogenCharge.realizada, onChange: v => set('nitrogenCharge.realizada', v), label: "Carga / pr\u00E9-carga realizada" }),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "G\u00E1s utilizado" },
            React.createElement(Select, { value: r.nitrogenCharge.gas, onChange: v => set('nitrogenCharge.gas', v), options: ['Nitrogênio', 'Outro', 'Não aplicável'] })),
        React.createElement(Field, { label: "Fonte da press\u00E3o de carga" },
            React.createElement(Select, { value: r.nitrogenCharge.fontePressao, onChange: v => set('nitrogenCharge.fontePressao', v), options: ['Placa/etiqueta do equipamento', 'Manual/datasheet do fabricante', 'Informação formal do cliente', 'Critério técnico validado internamente', 'Sem referência confiável'] }))),
    r.nitrogenCharge.gas === 'Outro' && (React.createElement(AlertBox, { severity: "critical", title: "Verificar criticamente" }, "IT002 \u00A710: usar somente nitrog\u00EAnio. Nunca oxig\u00EAnio ou ar comprimido. N\u00E3o liberar.")),
    r.nitrogenCharge.fontePressao === 'Sem referência confiável' && (React.createElement(AlertBox, { severity: "critical", title: "Sem fonte confi\u00E1vel" }, "IT002 \u00A715: parar o servi\u00E7o at\u00E9 obter refer\u00EAncia t\u00E9cnica e validar com supervisor antes de seguir.")),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
        React.createElement(Field, { label: "Press\u00E3o definida" },
            React.createElement(TextInput, { value: r.nitrogenCharge.pressaoDefinida, onChange: v => set('nitrogenCharge.pressaoDefinida', v) })),
        React.createElement(Field, { label: "Unidade" },
            React.createElement(Select, { value: r.nitrogenCharge.unidade, onChange: v => set('nitrogenCharge.unidade', v), options: ['bar', 'psi', 'MPa', 'kgf/cm²'] })),
        React.createElement(Field, { label: "Press\u00E3o aplicada" },
            React.createElement(TextInput, { value: r.nitrogenCharge.pressaoAplicada, onChange: v => set('nitrogenCharge.pressaoAplicada', v) })),
        React.createElement(Field, { label: "Man\u00F4metro (ID/condi\u00E7\u00E3o)" },
            React.createElement(TextInput, { value: r.nitrogenCharge.manometroId, onChange: v => set('nitrogenCharge.manometroId', v) })),
        React.createElement(Field, { label: "Conjunto de carga utilizado" },
            React.createElement(TextInput, { value: r.nitrogenCharge.conjuntoCarga, onChange: v => set('nitrogenCharge.conjuntoCarga', v) })),
        React.createElement(Field, { label: "Condi\u00E7\u00E3o do instrumento" },
            React.createElement(Select, { value: r.nitrogenCharge.condicaoInstrumento, onChange: v => set('nitrogenCharge.condicaoInstrumento', v), options: ['OK — apto para uso', 'OK — verificação interna', 'Em análise', 'Reprovado'] }))),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2" },
        React.createElement(Toggle, { checked: r.nitrogenCharge.cargaLenta, onChange: v => set('nitrogenCharge.cargaLenta', v), label: "Carga realizada lentamente" }),
        React.createElement(Toggle, { checked: r.nitrogenCharge.anomalia, onChange: v => set('nitrogenCharge.anomalia', v), label: "Vazamento/instabilidade/anomalia" }),
        React.createElement(Toggle, { checked: r.nitrogenCharge.fotoLeitura, onChange: v => set('nitrogenCharge.fotoLeitura', v), label: "Foto/v\u00EDdeo da leitura" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.nitrogenCharge.notes, onChange: v => set('nitrogenCharge.notes', v) }))));
export const StepFinalVerificationIT002 = ({ r, set }) => {
    const reprovado = r.finalVerification.mantemPressao === 'Não' || r.finalVerification.semVazamento === 'Não';
    return (React.createElement(SectionCard, { title: "14. Verifica\u00E7\u00E3o final", subtitle: "IT002 \u00A717 \u2014 aprova\u00E7\u00E3o trip\u00E9: mant\u00E9m press\u00E3o + sem vazamento + qualidade.", critical: true },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            React.createElement(Field, { label: "Mant\u00E9m press\u00E3o?", required: true },
                React.createElement(Select, { value: r.finalVerification.mantemPressao, onChange: v => set('finalVerification.mantemPressao', v), options: ['Sim', 'Não', 'Parcialmente'] })),
            React.createElement(Field, { label: "Sem vazamento?", required: true },
                React.createElement(Select, { value: r.finalVerification.semVazamento, onChange: v => set('finalVerification.semVazamento', v), options: ['Sim', 'Não', 'Em análise'] })),
            React.createElement(Field, { label: "Resultado" },
                React.createElement(Select, { value: r.finalVerification.resultado, onChange: v => set('finalVerification.resultado', v), options: ['Aprovado (operacional)', 'Aprovado com ressalva', 'Reprovado', 'Pendente de validação da Qualidade', 'Pendente de retrabalho', 'Serviço interrompido'] }))),
        reprovado && React.createElement(AlertBox, { severity: "critical", title: "Verifica\u00E7\u00E3o final reprovada" }, "IT002 \u00A717 \u2014 sem manter press\u00E3o ou com vazamento, N\u00C3O liberar. Retrabalho ou valida\u00E7\u00E3o t\u00E9cnica."),
        React.createElement(Toggle, { checked: r.finalVerification.evidenciasFinais, onChange: v => set('finalVerification.evidenciasFinais', v), label: "Evid\u00EAncias finais anexadas" }),
        React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.finalVerification.notes, onChange: v => set('finalVerification.notes', v) }))));
};
export const StepQualityReleaseIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "15. Valida\u00E7\u00E3o da Qualidade", subtitle: "IT002 \u00A717, \u00A719 \u2014 etapa espec\u00EDfica IT002. Sem aprova\u00E7\u00E3o aqui, libera\u00E7\u00E3o fica bloqueada.", critical: true },
    React.createElement(AlertBox, { severity: "info", title: "Diretriz IT002 \u00A719" }, "A libera\u00E7\u00E3o n\u00E3o \u00E9 apenas operacional, mas tamb\u00E9m documental e qualitativa. Esse crit\u00E9rio deve constar expressamente no laudo."),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "Validador (Respons\u00E1vel da Qualidade)" },
            React.createElement(TextInput, { value: r.qualityRelease.validador, onChange: v => set('qualityRelease.validador', v) })),
        React.createElement(Field, { label: "Data da valida\u00E7\u00E3o" },
            React.createElement(TextInput, { type: "date", value: r.qualityRelease.data, onChange: v => set('qualityRelease.data', v) })),
        React.createElement(Field, { label: "Decis\u00E3o da Qualidade", className: "md:col-span-2" },
            React.createElement(Select, { value: r.qualityRelease.decisao, onChange: v => set('qualityRelease.decisao', v), options: ['Aprovado', 'Aprovado com ressalva', 'Reprovado', 'Pendente de informação adicional', 'Solicitar retrabalho'] })),
        React.createElement(Field, { label: "Observa\u00E7\u00E3o", className: "md:col-span-2" },
            React.createElement(TextArea, { value: r.qualityRelease.observacao, onChange: v => set('qualityRelease.observacao', v) }))),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.qualityRelease.evidencia, onChange: v => set('qualityRelease.evidencia', v), label: "Evid\u00EAncia registrada (assinatura/registro)" }),
        React.createElement(Toggle, { checked: r.qualityRelease.liberadoQualidade, onChange: v => set('qualityRelease.liberadoQualidade', v), label: "Liberado pela Qualidade (autoriza libera\u00E7\u00E3o operacional)" }))));
export const StepEnvironmentalIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "16. Meio ambiente e res\u00EDduos", subtitle: "IT002 \u00A720 \u2014 segrega\u00E7\u00E3o de \u00F3leo e res\u00EDduos contaminados (controle m\u00EDnimo, sem mascarar lacuna)." },
    React.createElement(AlertBox, { severity: "info", title: "Postura IT002 \u00A720" }, "A RKM ainda n\u00E3o tem estrutura ambiental madura. Esta etapa cumpre controle m\u00EDnimo at\u00E9 evolu\u00E7\u00E3o pelo plano APH-16/17."),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.environmental.oleoResidual, onChange: v => set('environmental.oleoResidual', v), label: "Gera\u00E7\u00E3o de \u00F3leo residual" }),
        React.createElement(Toggle, { checked: r.environmental.oleoSegregado, onChange: v => set('environmental.oleoSegregado', v), label: "\u00D3leo residual segregado" }),
        React.createElement(Toggle, { checked: r.environmental.residuoContaminado, onChange: v => set('environmental.residuoContaminado', v), label: "Gera\u00E7\u00E3o de estopa/pano/absorvente contaminado" }),
        React.createElement(Toggle, { checked: r.environmental.residuoSegregado, onChange: v => set('environmental.residuoSegregado', v), label: "Res\u00EDduo contaminado segregado" }),
        React.createElement(Toggle, { checked: r.environmental.descarteVedacoes, onChange: v => set('environmental.descarteVedacoes', v), label: "Descarte de veda\u00E7\u00F5es / componentes" }),
        React.createElement(Toggle, { checked: r.environmental.separadosComuns, onChange: v => set('environmental.separadosComuns', v), label: "Res\u00EDduos separados de res\u00EDduos comuns" }),
        React.createElement(Toggle, { checked: r.environmental.derramamento, onChange: v => set('environmental.derramamento', v), label: "Derramamento durante o servi\u00E7o" }),
        React.createElement(Toggle, { checked: r.environmental.contidoLimpo, onChange: v => set('environmental.contidoLimpo', v), label: "Derramamento contido e limpo" }),
        React.createElement(Toggle, { checked: r.environmental.absorvente, onChange: v => set('environmental.absorvente', v), label: "Material absorvente utilizado" }),
        React.createElement(Toggle, { checked: r.environmental.foto, onChange: v => set('environmental.foto', v), label: "Foto (quando aplic\u00E1vel)" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es ambientais" },
        React.createElement(TextArea, { value: r.environmental.notes, onChange: v => set('environmental.notes', v) }))));
export const StepNonConformityIT002 = ({ r, set }) => {
    const tipos = ['Ausência de referência técnica confiável', 'Condição insegura', 'Dúvida crítica sobre integridade', 'Instabilidade no processo de verificação', 'Anomalia relevante', 'Incompatibilidade de componente', 'Erro de montagem (corte vedação / vedação invertida / falta de lubrificação / desalinhamento)', 'Falha na carga', 'Perda de pressão', 'Vazamento', 'Reprovação na qualidade', 'Retrabalho', 'Condenação', 'Outro'];
    return (React.createElement(SectionCard, { title: "17. NC, retrabalho ou interrup\u00E7\u00E3o", subtitle: "IT002 \u00A721 \u2014 situa\u00E7\u00F5es que exigem interrup\u00E7\u00E3o imediata." },
        React.createElement(Toggle, { checked: r.nonConformity.houve, onChange: v => set('nonConformity.houve', v), label: "Houve n\u00E3o conformidade neste servi\u00E7o" }),
        r.nonConformity.houve && (React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Tipos de ocorr\u00EAncia" },
                React.createElement(ChipMulti, { values: r.nonConformity.tipos, onChange: v => set('nonConformity.tipos', v), options: tipos })),
            React.createElement(Toggle, { checked: r.nonConformity.interrompida, onChange: v => set('nonConformity.interrompida', v), label: "Atividade interrompida" }),
            r.nonConformity.interrompida && (React.createElement(Field, { label: "Motivo da interrup\u00E7\u00E3o" },
                React.createElement(TextArea, { value: r.nonConformity.motivoInterrupcao, onChange: v => set('nonConformity.motivoInterrupcao', v) }))),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement(Field, { label: "N\u00BA do registro de NC" },
                    React.createElement(TextInput, { value: r.nonConformity.registroNum, onChange: v => set('nonConformity.registroNum', v), placeholder: "Ex: NC-0042" })),
                React.createElement(Field, { label: "Respons\u00E1vel pela tratativa" },
                    React.createElement(TextInput, { value: r.nonConformity.responsavel, onChange: v => set('nonConformity.responsavel', v) }))),
            React.createElement(Field, { label: "A\u00E7\u00E3o imediata adotada" },
                React.createElement(TextArea, { value: r.nonConformity.acaoImediata, onChange: v => set('nonConformity.acaoImediata', v) })),
            React.createElement(Toggle, { checked: r.nonConformity.evidencia, onChange: v => set('nonConformity.evidencia', v), label: "Evid\u00EAncia da ocorr\u00EAncia registrada" })))));
};
export const StepTechnicalValidationIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "18. Valida\u00E7\u00E3o t\u00E9cnica (supervisor)", subtitle: "IT002 \u00A75.3 \u2014 quando h\u00E1 d\u00FAvida, aus\u00EAncia de refer\u00EAncia ou valida\u00E7\u00E3o adicional." },
    React.createElement(Toggle, { checked: r.technicalValidation.exigiu, onChange: v => set('technicalValidation.exigiu', v), label: "Servi\u00E7o exigiu valida\u00E7\u00E3o do supervisor / apoio t\u00E9cnico" }),
    r.technicalValidation.exigiu && (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "Motivo da valida\u00E7\u00E3o" },
            React.createElement(Select, { value: r.technicalValidation.motivo, onChange: v => set('technicalValidation.motivo', v), options: ['Dúvida técnica', 'Ausência de referência confiável', 'Reaproveitamento de componente', 'Condição estrutural duvidosa', 'Definição de carga/pré-carga', 'Definição de torque', 'Erro de montagem identificado', 'Aprovação com ressalva', 'Não conformidade', 'Outro'] })),
        React.createElement(Field, { label: "Validador" },
            React.createElement(TextInput, { value: r.technicalValidation.validador, onChange: v => set('technicalValidation.validador', v) })),
        React.createElement(Field, { label: "Decis\u00E3o", className: "md:col-span-2" },
            React.createElement(Select, { value: r.technicalValidation.decisao, onChange: v => set('technicalValidation.decisao', v), options: ['Aprovado', 'Aprovado com ressalva', 'Reprovado', 'Condenado', 'Bloqueado', 'Solicitar informação adicional', 'Abrir plano de ação/NC', 'Outro'] })),
        React.createElement(Field, { label: "Observa\u00E7\u00E3o", className: "md:col-span-2" },
            React.createElement(TextArea, { value: r.technicalValidation.observacao, onChange: v => set('technicalValidation.observacao', v) })),
        React.createElement(Toggle, { checked: r.technicalValidation.evidencia, onChange: v => set('technicalValidation.evidencia', v), label: "Evid\u00EAncia registrada" })))));
export const StepReleaseIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "19. Libera\u00E7\u00E3o", subtitle: "IT002 \u00A718 + \u00A722 \u2014 laudo, registros, integra\u00E7\u00E3o futura com Lise." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.release.laudoEmitido, onChange: v => set('release.laudoEmitido', v), label: "Laudo t\u00E9cnico emitido / atualizado" }),
        React.createElement(Toggle, { checked: r.release.checklistCompleto, onChange: v => set('release.checklistCompleto', v), label: "Checklist preenchido integralmente" }),
        React.createElement(Toggle, { checked: r.release.evidenciasVinculadas, onChange: v => set('release.evidenciasVinculadas', v), label: "Evid\u00EAncias vinculadas" }),
        React.createElement(Toggle, { checked: r.release.componentesRegistrados, onChange: v => set('release.componentesRegistrados', v), label: "Componentes substitu\u00EDdos registrados" }),
        React.createElement(Toggle, { checked: r.release.pressaoAplicadaRegistrada, onChange: v => set('release.pressaoAplicadaRegistrada', v), label: "Press\u00E3o aplicada registrada no laudo" }),
        React.createElement(Toggle, { checked: r.release.resultadoRegistrado, onChange: v => set('release.resultadoRegistrado', v), label: "Resultado final + libera\u00E7\u00E3o da Qualidade no laudo" })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "N\u00BA do laudo final" },
            React.createElement(TextInput, { value: r.release.laudoFinal, onChange: v => set('release.laudoFinal', v) })),
        React.createElement(Field, { label: "Data da libera\u00E7\u00E3o" },
            React.createElement(TextInput, { type: "date", value: r.release.dataLiberacao, onChange: v => set('release.dataLiberacao', v) })),
        React.createElement(Field, { label: "Condi\u00E7\u00E3o final do equipamento" },
            React.createElement(Select, { value: r.release.condicaoFinal, onChange: v => set('release.condicaoFinal', v), options: ['Liberado para entrega', 'Liberado com ressalva', 'Não liberado', 'Condenado', 'Aguardando cliente', 'Aguardando peça/componente', 'Aguardando validação da Qualidade'] })),
        React.createElement(Field, { label: "Respons\u00E1vel pela libera\u00E7\u00E3o t\u00E9cnica" },
            React.createElement(TextInput, { value: r.release.responsavelLiberacao, onChange: v => set('release.responsavelLiberacao', v) })),
        React.createElement(Field, { label: "Respons\u00E1vel pelo fechamento PCP" },
            React.createElement(TextInput, { value: r.release.responsavelPCP, onChange: v => set('release.responsavelPCP', v) }))),
    React.createElement("div", { className: "rkm-card-2 p-4 space-y-3" },
        React.createElement("div", { className: "text-xs uppercase tracking-wide text-blue-300 font-medium" }, "Integra\u00E7\u00E3o Lise (opcional \u2014 sistema em implanta\u00E7\u00E3o)"),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3 items-end" },
            React.createElement(Toggle, { checked: r.release.liseLancado, onChange: v => set('release.liseLancado', v), label: "Lan\u00E7ado no Lise" }),
            React.createElement(Field, { label: "ID/Refer\u00EAncia no Lise (se aplic\u00E1vel)", className: "md:col-span-2" },
                React.createElement(TextInput, { value: r.release.liseId, onChange: v => set('release.liseId', v), placeholder: "Ex: LISE-2026-019 (opcional)" }))),
        React.createElement("div", { className: "text-xs text-slate-500" }, "Campo preparado para evolu\u00E7\u00E3o. N\u00E3o bloqueia libera\u00E7\u00E3o enquanto Lise est\u00E1 em implanta\u00E7\u00E3o (IT002 \u00A73, \u00A718; APH-15).")),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es finais" },
        React.createElement(TextArea, { value: r.release.notes, onChange: v => set('release.notes', v) }))));
export const StepClassificationIT002 = ({ r, set }) => (React.createElement(SectionCard, { title: "20. Classifica\u00E7\u00E3o Qualidade", subtitle: "IT002 \u00A719 \u2014 fechamento e classifica\u00E7\u00E3o do servi\u00E7o para melhorias." },
    React.createElement(Field, { label: "Classifica\u00E7\u00E3o do servi\u00E7o para melhorias" },
        React.createElement(Select, { value: r.classification.classificacao, onChange: v => set('classification.classificacao', v), options: ['Conforme', 'Conforme com ressalva', 'Não conforme', 'Retrabalho', 'Condenado', 'Pendente técnico', 'Pendente cliente', 'Pendente material', 'Pendente validação Qualidade', 'Bloqueado por segurança', 'Bloqueado por rastreabilidade'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.classification.riscoQualidade, onChange: v => set('classification.riscoQualidade', v), label: "Houve risco de qualidade" }),
        React.createElement(Toggle, { checked: r.classification.riscoSST, onChange: v => set('classification.riscoSST', v), label: "Houve risco de SST" }),
        React.createElement(Toggle, { checked: r.classification.riscoAmbiental, onChange: v => set('classification.riscoAmbiental', v), label: "Houve risco ambiental" }),
        React.createElement(Toggle, { checked: r.classification.riscoRastreabilidade, onChange: v => set('classification.riscoRastreabilidade', v), label: "Risco de rastreabilidade" }),
        React.createElement(Toggle, { checked: r.classification.impactoEstoque, onChange: v => set('classification.impactoEstoque', v), label: "Impacto em estoque/componente" }),
        React.createElement(Toggle, { checked: r.classification.acaoCorretiva, onChange: v => set('classification.acaoCorretiva', v), label: "Necessidade de a\u00E7\u00E3o corretiva/preventiva" })),
    React.createElement(Field, { label: "Observa\u00E7\u00E3o para melhoria do processo / IT" },
        React.createElement(TextArea, { value: r.classification.observacaoMelhoria, onChange: v => set('classification.observacaoMelhoria', v) }))));
export const STEP_RENDERERS_IT002 = {
    1: StepOpeningIT002, 2: StepEquipmentIT002, 3: StepReceivedIT002, 4: StepStartConditionsIT002, 5: StepSafetyIsolationIT002,
    6: StepAssessmentPistonIT002, 7: StepAssessmentShellIT002, 8: StepAssessmentCapsIT002, 9: StepAcceptanceDecisionIT002,
    10: StepCleaningPreservationIT002, 11: StepAssemblyIntegrityIT002, 12: StepTorqueIT002, 13: StepNitrogenChargeIT002,
    14: StepFinalVerificationIT002, 15: StepQualityReleaseIT002, 16: StepEnvironmentalIT002, 17: StepNonConformityIT002,
    18: StepTechnicalValidationIT002, 19: StepReleaseIT002, 20: StepClassificationIT002,
};

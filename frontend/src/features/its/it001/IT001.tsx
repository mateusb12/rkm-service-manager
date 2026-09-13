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
export const STEPS = [
    { id: 1, key: 'opening', label: 'Abertura do serviço', short: 'Abertura', critical: false },
    { id: 2, key: 'equipment', label: 'Identificação do acumulador', short: 'Identificação', critical: true },
    { id: 3, key: 'receivedCondition', label: 'Estado "como recebido"', short: 'Recebimento', critical: false },
    { id: 4, key: 'startConditions', label: 'Condições para início', short: 'Início', critical: false },
    { id: 5, key: 'safety', label: 'Segurança operacional', short: 'Segurança', critical: false },
    { id: 6, key: 'depressurization', label: 'Despressurização', short: 'Despressurizar', critical: true },
    { id: 7, key: 'disassembly', label: 'Desmontagem', short: 'Desmontagem', critical: false },
    { id: 8, key: 'inspection', label: 'Inspeção técnica', short: 'Inspeção', critical: false },
    { id: 9, key: 'technicalDecision', label: 'Decisão técnica', short: 'Decisão', critical: false },
    { id: 10, key: 'cleaningPreparation', label: 'Limpeza e preparação', short: 'Limpeza', critical: false },
    { id: 11, key: 'assembly', label: 'Montagem', short: 'Montagem', critical: false },
    { id: 12, key: 'torque', label: 'Torque e aperto', short: 'Torque', critical: false },
    { id: 13, key: 'nitrogenPreCharge', label: 'Pré-carga com nitrogênio', short: 'Pré-carga N₂', critical: true },
    { id: 14, key: 'stabilization', label: 'Estabilização e conferência', short: 'Estabilização', critical: true },
    { id: 15, key: 'finalVerification', label: 'Verificação final', short: 'Verificação', critical: false },
    { id: 16, key: 'environmental', label: 'Meio ambiente e resíduos', short: 'Ambiental', critical: false },
    { id: 17, key: 'nonConformity', label: 'NC, retrabalho, interrupção', short: 'NC', critical: false },
    { id: 18, key: 'technicalValidation', label: 'Validação técnica', short: 'Validação', critical: false },
    { id: 19, key: 'release', label: 'Liberação', short: 'Liberação', critical: false },
    { id: 20, key: 'classification', label: 'Classificação', short: 'Classificação', critical: false },
];

const SERVICE_TYPES = [
    'Inspeção',
    'Recarga de nitrogênio',
    'Substituição de bexiga',
    'Manutenção corretiva associada',
    'Avaliação para reparo',
    'Avaliação para condenação',
    'Outro',
];

export const initialRecord = () => ({
    meta: { id: 'OS-' + Date.now().toString().slice(-6), itCode: 'IT001', createdAt: new Date().toISOString() },
    identification: { osNumber: '', laudoNumber: '', date: '', client: '', technician: '', auxiliary: '', supervisor: '', pcp: '', serviceType: '', initialStatus: 'Recebido', currentStatus: 'Recebido' },
    equipment: { tag: '', tagType: '', brand: '', model: '', volume: '', identifiedPressure: '', plate: '', notes: '', photoIdentificacao: false },
    receivedCondition: { visual: '', leak: '', corrosion: '', dent: '', threadDamage: '', cleanliness: '', safetyImpact: '', notes: '', photos: { overview: false, plate: false, damage: false, valves: false, leakCorrosion: false } },
    startConditions: { vinculo: false, rastreabilidade: false, visualInicial: false, areaOrganizada: false, bancada: false, ferramentas: false, conjuntoCarga: false, manometro: false, nitrogenio: false, regulador: false, duvidaPressao: false, duvidaCompatibilidade: false, riscoFisico: false, result: '' },
    safety: { epis: [], pressaoConsiderada: false, foraDeProjecao: false, equipEstavel: false, areaControlada: false, condicaoInsegura: false, atividadeInterrompida: false, notes: '' },
    depressurization: { pressaoVerificada: false, despressurizacaoFeita: false, ferramentaCompativel: false, liberacaoGradual: false, ocorrencia: '', pressaoAliviada: false, condicaoFinal: '', notes: '', evidencia: false },
    disassembly: { controlada: false, protecaoRoscas: false, separacaoConjunto: false, riscoMistura: false, oleoDestinado: false, separadosPorCondicao: { reaproveitavel: false, substituicao: false, analise: false, condenado: false }, danosAbertura: '', notes: '', fotos: false },
    inspection: {
        bladder: { inspected: false, conditions: [], decision: '' },
        shell: { inspected: false, conditions: [], decision: '', medicaoNecessaria: false, photo: false },
        threads: { inspected: false, conditions: [], decision: '' },
        gasValve: { inspected: false, conditions: [], decision: '' },
        oilValveConnectionsFlanges: { inspected: false, conditions: [], decision: '' },
        sealsElastomers: { inspected: false, conditions: [], decision: '' },
    },
    technicalDecision: { resultado: '', substituidos: '', reaproveitados: '', condenados: '', motivoCondenacao: '', duvida: false, validacaoSupervisor: false, validador: '', notes: '' },
    cleaningPreparation: { limpos: false, metodo: '', contaminacaoExcessiva: false, contaminacaoTratada: false, protegidos: false, bexigaSelecionada: false, compatibilidadeVerificada: false, documentacaoSuficiente: false, decisaoSemDoc: '', notes: '' },
    assembly: { limpa: false, semTorcao: false, lubrificante: false, reinstalacao: false, assentadosAntes: false, identidadeMantida: false, fotos: false, notes: '' },
    torque: { especificadoFabricante: '', fonte: '', valor: '', instrumento: '', validacaoTecnica: false, notes: '' },
    nitrogenPreCharge: { realizada: false, gas: '', fontePreCarga: '', pressaoDefinida: '', unidade: 'bar', pressaoAplicada: '', conjuntoCarga: '', manometroId: '', condicaoInstrumento: '', cargaLenta: false, ultrapassagemBrusca: false, anomalia: false, fotoLeitura: false, notes: '' },
    stabilization: { tempo: '', pressaoApos: '', estavel: '', perdaCarga: false, vazamento: false, pontoVazamento: '', resultado: '', fotoVideo: false, notes: '' },
    finalVerification: { realizada: false, itens: [], testeHidraulico: false, observacaoSemTeste: '', resultadoFinal: '', evidenciasFinais: false, notes: '' },
    environmental: { oleoResidual: false, oleoSegregado: false, residuoContaminado: false, residuoSegregado: false, descarteBexiga: false, separadosComuns: false, derramamento: false, contidoLimpo: false, absorvente: false, foto: false, notes: '' },
    nonConformity: { houve: false, tipos: [], interrompida: false, motivoInterrupcao: '', registroNum: '', acaoImediata: '', responsavel: '', evidencia: false },
    technicalValidation: { exigiu: false, motivo: '', validador: '', decisao: '', observacao: '', evidencia: false },
    release: { laudoEmitido: false, laudoFinal: '', checklistCompleto: false, evidenciasVinculadas: false, componentesRegistrados: false, preCargaRegistrada: false, resultadoRegistrado: false, condicaoFinal: '', responsavelLiberacao: '', responsavelPCP: '', dataLiberacao: '', notes: '' },
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

const getIn = (obj, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), obj);

export const computeAlerts = (r) => {
    var _a, _b, _c, _d, _e;
    const alerts = [];
    const id = r.identification || {};
    const eq = r.equipment || {};
    const dep = r.depressurization || {};
    const npc = r.nitrogenPreCharge || {};
    const stb = r.stabilization || {};
    const insp = r.inspection || {};
    const env = r.environmental || {};
    const rel = r.release || {};
    const td = r.technicalDecision || {};
    const nc = r.nonConformity || {};
    if (!eq.tag && !eq.brand && !eq.model && !eq.plate) {
        alerts.push({ severity: 'critical', step: 2, msg: 'Ausência de identificação do equipamento.' });
    }
    if (!id.client || !id.osNumber) {
        alerts.push({ severity: 'critical', step: 1, msg: 'Rastreabilidade mínima ausente — preencher cliente e OS/laudo.' });
    }
    if ((_a = r.startConditions) === null || _a === void 0 ? void 0 : _a.duvidaPressao) {
        alerts.push({ severity: 'critical', step: 4, msg: 'Dúvida sobre pressão residual — serviço bloqueado até validação.' });
    }
    if (!dep.pressaoAliviada && (dep.despressurizacaoFeita || dep.pressaoVerificada)) {
        alerts.push({ severity: 'critical', step: 6, msg: 'Despressurização não confirmada — não prosseguir com desmontagem.' });
    }
    if (npc.gas && npc.gas !== 'Nitrogênio seco') {
        alerts.push({ severity: 'critical', step: 13, msg: 'Pré-carga sem nitrogênio — verificar criticamente: a IT001 prevê uso de nitrogênio.' });
    }
    if (npc.fontePreCarga === 'Sem referência confiável') {
        alerts.push({ severity: 'critical', step: 13, msg: 'Sem fonte confiável para pressão de pré-carga — registrar pendência técnica.' });
    }
    if (stb.estavel === 'Não' || stb.perdaCarga) {
        alerts.push({ severity: 'critical', step: 14, msg: 'Perda de pressão após estabilização — retrabalho ou validação do supervisor.' });
    }
    if (stb.vazamento) {
        alerts.push({ severity: 'critical', step: 14, msg: 'Vazamento detectado — não liberar até saneamento.' });
    }
    const condenados = ['bladder', 'shell', 'threads', 'gasValve', 'oilValveConnectionsFlanges', 'sealsElastomers']
        .filter(k => { var _a; return ((_a = insp[k]) === null || _a === void 0 ? void 0 : _a.decision) && /condenar|condenad/i.test(insp[k].decision); });
    if (condenados.length) {
        alerts.push({ severity: 'warn', step: 8, msg: 'Componente(s) com decisão de condenação — exige validação do supervisor: ' + condenados.join(', ') });
    }
    if (td.duvida && !td.validacaoSupervisor) {
        alerts.push({ severity: 'critical', step: 9, msg: 'Decisão técnica com dúvida e sem validação do supervisor.' });
    }
    const evidPendentes = !((_c = (_b = r.receivedCondition) === null || _b === void 0 ? void 0 : _b.photos) === null || _c === void 0 ? void 0 : _c.overview) && !((_e = (_d = r.receivedCondition) === null || _d === void 0 ? void 0 : _d.photos) === null || _e === void 0 ? void 0 : _e.plate);
    if (evidPendentes) {
        alerts.push({ severity: 'warn', step: 3, msg: 'Evidências fotográficas mínimas pendentes (visão geral / placa).' });
    }
    if (rel.condicaoFinal === 'Liberado para entrega' && !rel.laudoEmitido) {
        alerts.push({ severity: 'critical', step: 19, msg: 'Serviço marcado como liberado, porém sem laudo emitido.' });
    }
    if (rel.condicaoFinal === 'Liberado para entrega' && nc.houve && !nc.registroNum) {
        alerts.push({ severity: 'critical', step: 19, msg: 'Liberação com NC aberta sem número de registro.' });
    }
    if (env.derramamento && !env.contidoLimpo) {
        alerts.push({ severity: 'critical', step: 16, msg: 'Derramamento sem contenção/limpeza registrada.' });
    }
    return alerts;
};

const StepOpening = ({ r, set }) => (React.createElement(SectionCard, { title: "1. Abertura do servi\u00E7o", subtitle: "Identifica\u00E7\u00E3o b\u00E1sica, respons\u00E1veis e tipo de servi\u00E7o \u2014 IT001 \u00A75, \u00A722." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "N\u00BA da OS", required: true },
            React.createElement(TextInput, { value: r.identification.osNumber, onChange: v => set('identification.osNumber', v), placeholder: "Ex: OS-1042" })),
        React.createElement(Field, { label: "N\u00BA do laudo" },
            React.createElement(TextInput, { value: r.identification.laudoNumber, onChange: v => set('identification.laudoNumber', v), placeholder: "Ex: LD-0421" })),
        React.createElement(Field, { label: "Data", required: true },
            React.createElement(TextInput, { type: "date", value: r.identification.date, onChange: v => set('identification.date', v) })),
        React.createElement(Field, { label: "Cliente", required: true, className: "md:col-span-2" },
            React.createElement(TextInput, { value: r.identification.client, onChange: v => set('identification.client', v), placeholder: "Raz\u00E3o social" })),
        React.createElement(Field, { label: "Tipo de servi\u00E7o", required: true },
            React.createElement(Select, { value: r.identification.serviceType, onChange: v => set('identification.serviceType', v), options: SERVICE_TYPES })),
        React.createElement(Field, { label: "T\u00E9cnico respons\u00E1vel", required: true },
            React.createElement(TextInput, { value: r.identification.technician, onChange: v => set('identification.technician', v) })),
        React.createElement(Field, { label: "Auxiliar (se aplic\u00E1vel)" },
            React.createElement(TextInput, { value: r.identification.auxiliary, onChange: v => set('identification.auxiliary', v) })),
        React.createElement(Field, { label: "Supervisor / Resp. t\u00E9cnico" },
            React.createElement(TextInput, { value: r.identification.supervisor, onChange: v => set('identification.supervisor', v) })),
        React.createElement(Field, { label: "PCP \u2014 fechamento" },
            React.createElement(TextInput, { value: r.identification.pcp, onChange: v => set('identification.pcp', v) })),
        React.createElement(Field, { label: "Status atual" },
            React.createElement(Select, { value: r.identification.currentStatus, onChange: v => set('identification.currentStatus', v), options: STATUS_OPTIONS })))));

const StepEquipment = ({ r, set }) => {
    const noId = !r.equipment.tag && !r.equipment.brand && !r.equipment.model && !r.equipment.plate;
    return (React.createElement(SectionCard, { title: "2. Identifica\u00E7\u00E3o do acumulador", subtitle: "IT001 \u00A78 \u2014 vincula\u00E7\u00E3o e preserva\u00E7\u00E3o da identifica\u00E7\u00E3o f\u00EDsica.", critical: true },
        noId && React.createElement(AlertBox, { severity: "critical", title: "Identifica\u00E7\u00E3o insuficiente" }, "N\u00E3o h\u00E1 tag, marca, modelo ou placa registrados. A IT exige rastreabilidade m\u00EDnima \u2014 preencher pelo menos um identificador antes de prosseguir."),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
            React.createElement(Field, { label: "Identifica\u00E7\u00E3o f\u00EDsica (tag interna)" },
                React.createElement(TextInput, { value: r.equipment.tag, onChange: v => set('equipment.tag', v), placeholder: "Ex: ACB-2026-042" })),
            React.createElement(Field, { label: "Tipo de identifica\u00E7\u00E3o" },
                React.createElement(Select, { value: r.equipment.tagType, onChange: v => set('equipment.tagType', v), options: ['Etiqueta interna', 'Placa do fabricante', 'Marcação a punção', 'Marcação manual', 'Sem identificação'] })),
            React.createElement(Field, { label: "Exist\u00EAncia de placa/etiqueta leg\u00EDvel" },
                React.createElement(Select, { value: r.equipment.plate, onChange: v => set('equipment.plate', v), options: ['Sim — legível', 'Sim — parcial', 'Sim — ilegível', 'Ausente'] })),
            React.createElement(Field, { label: "Marca" },
                React.createElement(TextInput, { value: r.equipment.brand, onChange: v => set('equipment.brand', v), placeholder: "Parker / Bosch Rexroth / HYDAC..." })),
            React.createElement(Field, { label: "Modelo" },
                React.createElement(TextInput, { value: r.equipment.model, onChange: v => set('equipment.model', v) })),
            React.createElement(Field, { label: "Volume nominal" },
                React.createElement(TextInput, { value: r.equipment.volume, onChange: v => set('equipment.volume', v), placeholder: "Ex: 10 L" })),
            React.createElement(Field, { label: "Press\u00E3o identificada (placa)" },
                React.createElement(TextInput, { value: r.equipment.identifiedPressure, onChange: v => set('equipment.identifiedPressure', v), placeholder: "Ex: 210 bar" })),
            React.createElement(Field, { className: "md:col-span-2", label: "Observa\u00E7\u00F5es" },
                React.createElement(TextArea, { rows: 2, value: r.equipment.notes, onChange: v => set('equipment.notes', v) }))),
        React.createElement(Field, { label: "Evid\u00EAncia fotogr\u00E1fica da placa/identifica\u00E7\u00E3o" },
            React.createElement(Toggle, { checked: r.equipment.photoIdentificacao, onChange: v => set('equipment.photoIdentificacao', v), label: "Foto anexada (placa/etiqueta/identifica\u00E7\u00E3o)" }))));
};

const StepReceived = ({ r, set }) => (React.createElement(SectionCard, { title: '3. Estado "como recebido"', subtitle: "IT001 \u00A79 \u2014 estado externo, vazamento, corros\u00E3o, danos." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Condi\u00E7\u00E3o visual geral" },
            React.createElement(Select, { value: r.receivedCondition.visual, onChange: v => set('receivedCondition.visual', v), options: ['Boa', 'Regular', 'Ruim', 'Crítica'] })),
        React.createElement(Field, { label: "Vazamento aparente" },
            React.createElement(Select, { value: r.receivedCondition.leak, onChange: v => set('receivedCondition.leak', v), options: ['Não', 'Suspeita', 'Sim — leve', 'Sim — relevante'] })),
        React.createElement(Field, { label: "Corros\u00E3o" },
            React.createElement(Select, { value: r.receivedCondition.corrosion, onChange: v => set('receivedCondition.corrosion', v), options: ['Não', 'Superficial', 'Pontual', 'Generalizada'] })),
        React.createElement(Field, { label: "Amassado / deforma\u00E7\u00E3o" },
            React.createElement(Select, { value: r.receivedCondition.dent, onChange: v => set('receivedCondition.dent', v), options: ['Não', 'Leve', 'Relevante', 'Severo'] })),
        React.createElement(Field, { label: "Dano em rosca/v\u00E1lvula/conex\u00F5es" },
            React.createElement(Select, { value: r.receivedCondition.threadDamage, onChange: v => set('receivedCondition.threadDamage', v), options: ['Não', 'Suspeito', 'Sim — leve', 'Sim — relevante'] })),
        React.createElement(Field, { label: "Limpeza" },
            React.createElement(Select, { value: r.receivedCondition.cleanliness, onChange: v => set('receivedCondition.cleanliness', v), options: ['Adequada', 'Sujidade leve', 'Contaminação relevante'] })),
        React.createElement(Field, { label: "Dano vis\u00EDvel com impacto em seguran\u00E7a" },
            React.createElement(Select, { value: r.receivedCondition.safetyImpact, onChange: v => set('receivedCondition.safetyImpact', v), options: ['Não', 'Possível', 'Sim'] })),
        React.createElement(Field, { className: "md:col-span-2", label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.receivedCondition.notes, onChange: v => set('receivedCondition.notes', v) }))),
    React.createElement("div", null,
        React.createElement("div", { className: "text-[12px] font-medium text-slate-300 uppercase tracking-wide mb-2" }, "Evid\u00EAncias fotogr\u00E1ficas m\u00EDnimas"),
        React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" },
            React.createElement(Toggle, { checked: r.receivedCondition.photos.overview, onChange: v => set('receivedCondition.photos.overview', v), label: "Vis\u00E3o geral do acumulador" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.plate, onChange: v => set('receivedCondition.photos.plate', v), label: "Identifica\u00E7\u00E3o / placa" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.damage, onChange: v => set('receivedCondition.photos.damage', v), label: "Pontos de dano" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.valves, onChange: v => set('receivedCondition.photos.valves', v), label: "V\u00E1lvulas / conex\u00F5es" }),
            React.createElement(Toggle, { checked: r.receivedCondition.photos.leakCorrosion, onChange: v => set('receivedCondition.photos.leakCorrosion', v), label: "Vazamento / corros\u00E3o (se houver)" })))));

const StepStartConditions = ({ r, set }) => {
    const blocked = r.startConditions.duvidaPressao || r.startConditions.duvidaCompatibilidade || r.startConditions.riscoFisico;
    return (React.createElement(SectionCard, { title: "4. Condi\u00E7\u00F5es para in\u00EDcio", subtitle: "IT001 \u00A77 \u2014 s\u00F3 iniciar com recursos, rastreabilidade e seguran\u00E7a garantidos." },
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
            React.createElement(Toggle, { checked: r.startConditions.vinculo, onChange: v => set('startConditions.vinculo', v), label: "Equipamento vinculado a cliente e OS/laudo" }),
            React.createElement(Toggle, { checked: r.startConditions.rastreabilidade, onChange: v => set('startConditions.rastreabilidade', v), label: "Condi\u00E7\u00E3o m\u00EDnima de rastreabilidade" }),
            React.createElement(Toggle, { checked: r.startConditions.visualInicial, onChange: v => set('startConditions.visualInicial', v), label: "Avalia\u00E7\u00E3o visual inicial realizada" }),
            React.createElement(Toggle, { checked: r.startConditions.areaOrganizada, onChange: v => set('startConditions.areaOrganizada', v), label: "\u00C1rea organizada (sem mistura de pe\u00E7as)" }),
            React.createElement(Toggle, { checked: r.startConditions.bancada, onChange: v => set('startConditions.bancada', v), label: "Bancada/local adequado" }),
            React.createElement(Toggle, { checked: r.startConditions.ferramentas, onChange: v => set('startConditions.ferramentas', v), label: "Ferramentas dispon\u00EDveis" }),
            React.createElement(Toggle, { checked: r.startConditions.conjuntoCarga, onChange: v => set('startConditions.conjuntoCarga', v), label: "Conjunto de carga e medi\u00E7\u00E3o compat\u00EDvel" }),
            React.createElement(Toggle, { checked: r.startConditions.manometro, onChange: v => set('startConditions.manometro', v), label: "Man\u00F4metro compat\u00EDvel com a press\u00E3o" }),
            React.createElement(Toggle, { checked: r.startConditions.nitrogenio, onChange: v => set('startConditions.nitrogenio', v), label: "Nitrog\u00EAnio seco dispon\u00EDvel" }),
            React.createElement(Toggle, { checked: r.startConditions.regulador, onChange: v => set('startConditions.regulador', v), label: "Regulador adequado p/ cilindro N\u2082" })),
        React.createElement("div", { className: "border-t border-rkmborder pt-4 grid grid-cols-1 md:grid-cols-3 gap-2" },
            React.createElement(Toggle, { checked: r.startConditions.duvidaPressao, onChange: v => set('startConditions.duvidaPressao', v), label: "D\u00DAVIDA sobre press\u00E3o residual" }),
            React.createElement(Toggle, { checked: r.startConditions.duvidaCompatibilidade, onChange: v => set('startConditions.duvidaCompatibilidade', v), label: "D\u00DAVIDA sobre compatibilidade da bexiga" }),
            React.createElement(Toggle, { checked: r.startConditions.riscoFisico, onChange: v => set('startConditions.riscoFisico', v), label: "Condi\u00E7\u00E3o f\u00EDsica de risco" })),
        blocked && React.createElement(AlertBox, { severity: "critical", title: "Bloqueio at\u00E9 valida\u00E7\u00E3o" }, "Conforme IT001 \u00A77, h\u00E1 condi\u00E7\u00E3o de bloqueio. N\u00E3o iniciar at\u00E9 valida\u00E7\u00E3o do supervisor / esclarecimento da d\u00FAvida."),
        React.createElement(Field, { label: "Resultado da etapa" },
            React.createElement(Select, { value: r.startConditions.result, onChange: v => set('startConditions.result', v), options: ['Liberado para início', 'Liberado com ressalva', 'Bloqueado até validação do supervisor', 'Bloqueado por condição insegura', 'Bloqueado por falta de informação técnica'] }))));
};

const StepSafety = ({ r, set }) => (React.createElement(SectionCard, { title: "5. Seguran\u00E7a operacional", subtitle: "IT001 \u00A710 \u2014 riscos da atividade, EPIs e postura segura." },
    React.createElement(Field, { label: "EPIs utilizados" },
        React.createElement(ChipMulti, { values: r.safety.epis, onChange: v => set('safety.epis', v), options: EPI_LIST })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.safety.pressaoConsiderada, onChange: v => set('safety.pressaoConsiderada', v), label: "Risco de press\u00E3o residual considerado" }),
        React.createElement(Toggle, { checked: r.safety.foraDeProjecao, onChange: v => set('safety.foraDeProjecao', v), label: "T\u00E9cnico fora da linha de proje\u00E7\u00E3o / fluxo pressurizado" }),
        React.createElement(Toggle, { checked: r.safety.equipEstavel, onChange: v => set('safety.equipEstavel', v), label: "Equipamento est\u00E1vel / imobilizado" }),
        React.createElement(Toggle, { checked: r.safety.areaControlada, onChange: v => set('safety.areaControlada', v), label: "\u00C1rea controlada" }),
        React.createElement(Toggle, { checked: r.safety.condicaoInsegura, onChange: v => set('safety.condicaoInsegura', v), label: "Existe condi\u00E7\u00E3o insegura" }),
        React.createElement(Toggle, { checked: r.safety.atividadeInterrompida, onChange: v => set('safety.atividadeInterrompida', v), label: "Atividade interrompida" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.safety.notes, onChange: v => set('safety.notes', v) }))));

const StepDepressurization = ({ r, set }) => {
    const blocked = (r.depressurization.despressurizacaoFeita || r.depressurization.pressaoVerificada) && !r.depressurization.pressaoAliviada;
    return (React.createElement(SectionCard, { title: "6. Despressuriza\u00E7\u00E3o", subtitle: "IT001 \u00A711 \u2014 atividade cr\u00EDtica. Sem confirma\u00E7\u00E3o de press\u00E3o aliviada, N\u00C3O prosseguir.", critical: true },
        blocked && React.createElement(AlertBox, { severity: "critical", title: "Processo bloqueado \u2014 n\u00E3o prosseguir com desmontagem" }, "A despressuriza\u00E7\u00E3o n\u00E3o foi confirmada como aliviada. Conforme IT001 \u00A711, o servi\u00E7o deve ser interrompido at\u00E9 esclarecimento."),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
            React.createElement(Toggle, { checked: r.depressurization.pressaoVerificada, onChange: v => set('depressurization.pressaoVerificada', v), label: "Possibilidade de press\u00E3o residual verificada" }),
            React.createElement(Toggle, { checked: r.depressurization.despressurizacaoFeita, onChange: v => set('depressurization.despressurizacaoFeita', v), label: "Despressuriza\u00E7\u00E3o realizada antes da abertura" }),
            React.createElement(Toggle, { checked: r.depressurization.ferramentaCompativel, onChange: v => set('depressurization.ferramentaCompativel', v), label: "Ferramenta/dispositivo compat\u00EDvel utilizado" }),
            React.createElement(Toggle, { checked: r.depressurization.liberacaoGradual, onChange: v => set('depressurization.liberacaoGradual', v), label: "Libera\u00E7\u00E3o gradual e controlada" })),
        React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            React.createElement(Field, { label: "Ocorr\u00EAncia durante o procedimento" },
                React.createElement(Select, { value: r.depressurization.ocorrencia, onChange: v => set('depressurization.ocorrencia', v), options: ['Nenhuma', 'Ruído anormal', 'Vazamento', 'Projeção de gás/óleo', 'Instabilidade', 'Outro'] })),
            React.createElement(Field, { label: "Condi\u00E7\u00E3o ap\u00F3s despressuriza\u00E7\u00E3o" },
                React.createElement(Select, { value: r.depressurization.condicaoFinal, onChange: v => set('depressurization.condicaoFinal', v), options: ['Aliviada', 'Suspeita de pressão residual', 'Indeterminada'] }))),
        React.createElement(Toggle, { checked: r.depressurization.pressaoAliviada, onChange: v => set('depressurization.pressaoAliviada', v), label: "Press\u00E3o considerada aliviada antes da abertura completa" }),
        React.createElement(Toggle, { checked: r.depressurization.evidencia, onChange: v => set('depressurization.evidencia', v), label: "Evid\u00EAncia registrada (foto/v\u00EDdeo)" }),
        React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.depressurization.notes, onChange: v => set('depressurization.notes', v) }))));
};

const StepDisassembly = ({ r, set }) => (React.createElement(SectionCard, { title: "7. Desmontagem", subtitle: "IT001 \u00A712 \u2014 controle, separa\u00E7\u00E3o por conjunto, \u00F3leo residual destinado." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.disassembly.controlada, onChange: v => set('disassembly.controlada', v), label: "Desmontagem controlada" }),
        React.createElement(Toggle, { checked: r.disassembly.protecaoRoscas, onChange: v => set('disassembly.protecaoRoscas', v), label: "Prote\u00E7\u00E3o de roscas, flanges, v\u00E1lvulas e conex\u00F5es" }),
        React.createElement(Toggle, { checked: r.disassembly.separacaoConjunto, onChange: v => set('disassembly.separacaoConjunto', v), label: "Separa\u00E7\u00E3o por conjunto / cliente / OS" }),
        React.createElement(Toggle, { checked: r.disassembly.riscoMistura, onChange: v => set('disassembly.riscoMistura', v), label: "Risco de mistura de pe\u00E7as identificado" }),
        React.createElement(Toggle, { checked: r.disassembly.oleoDestinado, onChange: v => set('disassembly.oleoDestinado', v), label: "\u00D3leo residual destinado a recipiente previsto" }),
        React.createElement(Toggle, { checked: r.disassembly.fotos, onChange: v => set('disassembly.fotos', v), label: "Fotos do processo registradas" })),
    React.createElement("div", null,
        React.createElement("div", { className: "text-[12px] font-medium text-slate-300 uppercase tracking-wide mb-2" }, "Componentes separados por condi\u00E7\u00E3o"),
        React.createElement("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2" },
            React.createElement(Toggle, { checked: r.disassembly.separadosPorCondicao.reaproveitavel, onChange: v => set('disassembly.separadosPorCondicao.reaproveitavel', v), label: "Reaproveit\u00E1vel" }),
            React.createElement(Toggle, { checked: r.disassembly.separadosPorCondicao.substituicao, onChange: v => set('disassembly.separadosPorCondicao.substituicao', v), label: "Para substitui\u00E7\u00E3o" }),
            React.createElement(Toggle, { checked: r.disassembly.separadosPorCondicao.analise, onChange: v => set('disassembly.separadosPorCondicao.analise', v), label: "Em an\u00E1lise" }),
            React.createElement(Toggle, { checked: r.disassembly.separadosPorCondicao.condenado, onChange: v => set('disassembly.separadosPorCondicao.condenado', v), label: "Condenado" }))),
    React.createElement(Field, { label: "Danos identificados na abertura" },
        React.createElement(TextArea, { value: r.disassembly.danosAbertura, onChange: v => set('disassembly.danosAbertura', v) })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.disassembly.notes, onChange: v => set('disassembly.notes', v) }))));

const InspBlock = ({ titulo, path, condOpts, decOpts, r, set, extra }) => {
    const data = getIn(r, path);
    return (React.createElement("div", { className: "rkm-card-2 p-4 space-y-3" },
        React.createElement("div", { className: "flex items-center gap-2" },
            React.createElement(Toggle, { checked: data.inspected, onChange: v => set(path + '.inspected', v), label: `Inspecionar — ${titulo}` })),
        React.createElement(Field, { label: `Condição — ${titulo}` },
            React.createElement(ChipMulti, { values: data.conditions, onChange: v => set(path + '.conditions', v), options: condOpts })),
        React.createElement(Field, { label: `Decisão — ${titulo}` },
            React.createElement(Select, { value: data.decision, onChange: v => set(path + '.decision', v), options: decOpts })),
        extra));
};

const StepInspection = ({ r, set }) => (React.createElement(SectionCard, { title: "8. Inspe\u00E7\u00E3o t\u00E9cnica", subtitle: "IT001 \u00A713 \u2014 inspe\u00E7\u00E3o obrigat\u00F3ria de bexiga, carca\u00E7a, roscas, v\u00E1lvulas, veda\u00E7\u00F5es e conex\u00F5es." },
    React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4" },
        React.createElement(InspBlock, { r: r, set: set, titulo: "Bexiga", path: "inspection.bladder", condOpts: ['Sem dano aparente', 'Corte', 'Trinca', 'Ressecamento', 'Deformação', 'Sinais de fadiga', 'Indício de vazamento', 'Incompatibilidade', 'Condição duvidosa', 'Substituição preventiva/técnica'], decOpts: ['Substituir', 'Reaproveitar com validação', 'Condenar', 'Pendente de validação técnica'] }),
        React.createElement(InspBlock, { r: r, set: set, titulo: "Carca\u00E7a", path: "inspection.shell", condOpts: ['Sem dano aparente', 'Corrosão interna', 'Corrosão externa', 'Perda de espessura aparente', 'Amassado', 'Deformação', 'Ovalização', 'Bolha sob pintura', 'Trinca/fissura', 'Condição estrutural duvidosa'], decOpts: ['Apta para continuidade', 'Apta com ressalva', 'Condenada', 'Pendente de medição/ensaio', 'Pendente de validação técnica'], extra: React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
                React.createElement(Toggle, { checked: r.inspection.shell.medicaoNecessaria, onChange: v => set('inspection.shell.medicaoNecessaria', v), label: "Necessidade de medi\u00E7\u00E3o/ensaio" }),
                React.createElement(Toggle, { checked: r.inspection.shell.photo, onChange: v => set('inspection.shell.photo', v), label: "Foto da carca\u00E7a" })) }),
        React.createElement(InspBlock, { r: r, set: set, titulo: "Roscas", path: "inspection.threads", condOpts: ['Íntegras', 'Filetes quebrados', 'Amassamento', 'Corrosão', 'Desgaste excessivo', 'Folga incompatível', 'Condição duvidosa'], decOpts: ['Aptas', 'Aptas com ressalva', 'Não conformes', 'Pendente de validação técnica'] }),
        React.createElement(InspBlock, { r: r, set: set, titulo: "V\u00E1lvula de g\u00E1s", path: "inspection.gasValve", condOpts: ['Boa condição', 'Oxidação', 'Deformação', 'Desgaste', 'Dano na vedação', 'Trinca', 'Dano de rosca', 'Vazamento', 'Condição duvidosa'], decOpts: ['Reaproveitar', 'Reaproveitar com validação', 'Substituir', 'Condenar', 'Pendente de validação técnica'] }),
        React.createElement(InspBlock, { r: r, set: set, titulo: "V\u00E1lvula de \u00F3leo / conex\u00F5es / flanges", path: "inspection.oilValveConnectionsFlanges", condOpts: ['Sem dano aparente', 'Oxidação', 'Deformação', 'Desgaste', 'Dano em sede de vedação', 'Trinca', 'Achatamento', 'Corte', 'Perda de forma original', 'Dano de rosca', 'Condição duvidosa'], decOpts: ['Reaproveitar', 'Reaproveitar com validação', 'Substituir', 'Condenar', 'Pendente de validação técnica'] }),
        React.createElement(InspBlock, { r: r, set: set, titulo: "Veda\u00E7\u00F5es e elast\u00F4meros", path: "inspection.sealsElastomers", condOpts: ['Sem dano aparente', 'Ressecamento', 'Corte', 'Deformação', 'Achatamento', 'Perda de elasticidade', 'Incompatibilidade', 'Substituição recomendada', 'Substituição obrigatória — critério interno'], decOpts: ['Substituir (prática conservadora)', 'Reaproveitar com validação', 'Condenar', 'Pendente de validação técnica'] })),
    React.createElement(AlertBox, { severity: "info", title: "Diretriz IT001 \u00A714.3" }, "Pr\u00E1tica conservadora: substituir componentes elastom\u00E9ricos relevantes durante o servi\u00E7o, conforme orienta\u00E7\u00E3o Parker para kit de recertifica\u00E7\u00E3o.")));

const StepTechnicalDecision = ({ r, set }) => (React.createElement(SectionCard, { title: "9. Decis\u00E3o t\u00E9cnica", subtitle: "IT001 \u00A714 \u2014 consolidar inspe\u00E7\u00E3o em decis\u00E3o \u00FAnica." },
    React.createElement(Field, { label: "Resultado geral da inspe\u00E7\u00E3o" },
        React.createElement(Select, { value: r.technicalDecision.resultado, onChange: v => set('technicalDecision.resultado', v), options: ['Apto para montagem', 'Apto com ressalva', 'Requer substituição de componentes', 'Requer validação do supervisor', 'Requer avaliação complementar', 'Condenado', 'Serviço interrompido'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Componentes substitu\u00EDdos" },
            React.createElement(TextArea, { rows: 2, value: r.technicalDecision.substituidos, onChange: v => set('technicalDecision.substituidos', v) })),
        React.createElement(Field, { label: "Componentes reaproveitados" },
            React.createElement(TextArea, { rows: 2, value: r.technicalDecision.reaproveitados, onChange: v => set('technicalDecision.reaproveitados', v) })),
        React.createElement(Field, { label: "Componentes condenados" },
            React.createElement(TextArea, { rows: 2, value: r.technicalDecision.condenados, onChange: v => set('technicalDecision.condenados', v) }))),
    React.createElement(Field, { label: "Motivo da condena\u00E7\u00E3o (se houver)" },
        React.createElement(TextArea, { rows: 2, value: r.technicalDecision.motivoCondenacao, onChange: v => set('technicalDecision.motivoCondenacao', v) })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2" },
        React.createElement(Toggle, { checked: r.technicalDecision.duvida, onChange: v => set('technicalDecision.duvida', v), label: "Existe d\u00FAvida t\u00E9cnica" }),
        React.createElement(Toggle, { checked: r.technicalDecision.validacaoSupervisor, onChange: v => set('technicalDecision.validacaoSupervisor', v), label: "Valida\u00E7\u00E3o do supervisor obtida" }),
        React.createElement(Field, { label: "Validador" },
            React.createElement(TextInput, { value: r.technicalDecision.validador, onChange: v => set('technicalDecision.validador', v) }))),
    r.technicalDecision.duvida && !r.technicalDecision.validacaoSupervisor && (React.createElement(AlertBox, { severity: "critical", title: "Decis\u00E3o com d\u00FAvida sem valida\u00E7\u00E3o" }, "Conforme IT001 \u00A714, exige valida\u00E7\u00E3o do supervisor antes de prosseguir.")),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.technicalDecision.notes, onChange: v => set('technicalDecision.notes', v) }))));

const StepCleaning = ({ r, set }) => (React.createElement(SectionCard, { title: "10. Limpeza e prepara\u00E7\u00E3o", subtitle: "IT001 \u00A715 e \u00A716." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.cleaningPreparation.limpos, onChange: v => set('cleaningPreparation.limpos', v), label: "Carca\u00E7a e componentes limpos" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.contaminacaoExcessiva, onChange: v => set('cleaningPreparation.contaminacaoExcessiva', v), label: "Contamina\u00E7\u00E3o excessiva identificada" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.contaminacaoTratada, onChange: v => set('cleaningPreparation.contaminacaoTratada', v), label: "Contamina\u00E7\u00E3o tratada antes da montagem" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.protegidos, onChange: v => set('cleaningPreparation.protegidos', v), label: "Componentes protegidos contra nova contamina\u00E7\u00E3o" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.bexigaSelecionada, onChange: v => set('cleaningPreparation.bexigaSelecionada', v), label: "Bexiga selecionada" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.compatibilidadeVerificada, onChange: v => set('cleaningPreparation.compatibilidadeVerificada', v), label: "Compatibilidade dimensional/aplica\u00E7\u00E3o verificada" }),
        React.createElement(Toggle, { checked: r.cleaningPreparation.documentacaoSuficiente, onChange: v => set('cleaningPreparation.documentacaoSuficiente', v), label: "Documenta\u00E7\u00E3o t\u00E9cnica suficiente" })),
    React.createElement(Field, { label: "M\u00E9todo/produto de limpeza utilizado" },
        React.createElement(TextInput, { value: r.cleaningPreparation.metodo, onChange: v => set('cleaningPreparation.metodo', v) })),
    !r.cleaningPreparation.documentacaoSuficiente && (React.createElement(Field, { label: "Decis\u00E3o quando N\u00C3O houver documenta\u00E7\u00E3o suficiente" },
        React.createElement(Select, { value: r.cleaningPreparation.decisaoSemDoc, onChange: v => set('cleaningPreparation.decisaoSemDoc', v), options: ['Prosseguir com validação do supervisor', 'Consultar cliente', 'Consultar fabricante', 'Bloquear serviço', 'Registrar pendência técnica'] }))),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.cleaningPreparation.notes, onChange: v => set('cleaningPreparation.notes', v) }))));

const StepAssembly = ({ r, set }) => (React.createElement(SectionCard, { title: "11. Montagem", subtitle: "IT001 \u00A717 \u2014 montagem limpa, sem tor\u00E7\u00E3o e com componentes assentados antes da pr\u00E9-carga." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.assembly.limpa, onChange: v => set('assembly.limpa', v), label: "Montagem em condi\u00E7\u00E3o limpa e controlada" }),
        React.createElement(Toggle, { checked: r.assembly.semTorcao, onChange: v => set('assembly.semTorcao', v), label: "Bexiga instalada sem tor\u00E7\u00E3o, corte ou dano aparente" }),
        React.createElement(Toggle, { checked: r.assembly.lubrificante, onChange: v => set('assembly.lubrificante', v), label: "Lubrificante compat\u00EDvel (quando aplic\u00E1vel)" }),
        React.createElement(Toggle, { checked: r.assembly.reinstalacao, onChange: v => set('assembly.reinstalacao', v), label: "V\u00E1lvulas, veda\u00E7\u00F5es, tampas e conex\u00F5es reinstaladas" }),
        React.createElement(Toggle, { checked: r.assembly.assentadosAntes, onChange: v => set('assembly.assentadosAntes', v), label: "Componentes assentados ANTES da pr\u00E9-carga" }),
        React.createElement(Toggle, { checked: r.assembly.identidadeMantida, onChange: v => set('assembly.identidadeMantida', v), label: "Identifica\u00E7\u00E3o mantida durante montagem" }),
        React.createElement(Toggle, { checked: r.assembly.fotos, onChange: v => set('assembly.fotos', v), label: "Fotos da montagem" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.assembly.notes, onChange: v => set('assembly.notes', v) }))));

const StepTorque = ({ r, set }) => (React.createElement(SectionCard, { title: "12. Torque e aperto", subtitle: "IT001 \u00A718 \u2014 sem inventar valor gen\u00E9rico. Sem especifica\u00E7\u00E3o confi\u00E1vel: aperto t\u00E9cnico do supervisor." },
    React.createElement(Field, { label: "Existe torque especificado pelo fabricante?" },
        React.createElement(Select, { value: r.torque.especificadoFabricante, onChange: v => set('torque.especificadoFabricante', v), options: ['Sim — usar fabricante', 'Não — usar validação técnica', 'Não aplicável'] })),
    React.createElement(Field, { label: "Fonte do torque/crit\u00E9rio adotado" },
        React.createElement(Select, { value: r.torque.fonte, onChange: v => set('torque.fonte', v), options: ['Manual/datasheet do fabricante', 'Especificação do cliente', 'Validação do supervisor/responsável técnico', 'Critério provisório interno registrado', 'Não havia especificação disponível', 'Não aplicável'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "Valor aplicado (com unidade)" },
            React.createElement(TextInput, { value: r.torque.valor, onChange: v => set('torque.valor', v), placeholder: "Ex: 90 N\u00B7m" })),
        React.createElement(Field, { label: "Instrumento utilizado" },
            React.createElement(TextInput, { value: r.torque.instrumento, onChange: v => set('torque.instrumento', v), placeholder: "Torqu\u00EDmetro estalo / digital..." })),
        React.createElement("div", { className: "flex items-end" },
            React.createElement(Toggle, { checked: r.torque.validacaoTecnica, onChange: v => set('torque.validacaoTecnica', v), label: "Valida\u00E7\u00E3o t\u00E9cnica registrada" }))),
    (!r.torque.fonte || /Não havia/.test(r.torque.fonte)) && (React.createElement(AlertBox, { severity: "warn", title: "Crit\u00E9rio de torque n\u00E3o formalizado" }, "A IT001 \u00A718 e o plano ABX-09 indicam que a RKM ainda n\u00E3o possui tabela formal de torque. N\u00E3o inventar valor gen\u00E9rico \u2014 registrar a condi\u00E7\u00E3o no laudo.")),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.torque.notes, onChange: v => set('torque.notes', v) }))));

const StepNitrogen = ({ r, set }) => (React.createElement(SectionCard, { title: "13. Pr\u00E9-carga com nitrog\u00EAnio", subtitle: "IT001 \u00A719 \u2014 somente nitrog\u00EAnio seco; carga lenta; fonte de press\u00E3o hierarquizada.", critical: true },
    React.createElement(Toggle, { checked: r.nitrogenPreCharge.realizada, onChange: v => set('nitrogenPreCharge.realizada', v), label: "Pr\u00E9-carga / recarga realizada" }),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "G\u00E1s utilizado" },
            React.createElement(Select, { value: r.nitrogenPreCharge.gas, onChange: v => set('nitrogenPreCharge.gas', v), options: ['Nitrogênio seco', 'Outro', 'Não aplicável'] })),
        React.createElement(Field, { label: "Fonte da press\u00E3o de pr\u00E9-carga" },
            React.createElement(Select, { value: r.nitrogenPreCharge.fontePreCarga, onChange: v => set('nitrogenPreCharge.fontePreCarga', v), options: ['Placa/etiqueta do equipamento', 'Manual/datasheet do fabricante', 'Informação formal do cliente', 'Critério técnico validado internamente', 'Sem referência confiável'] }))),
    r.nitrogenPreCharge.gas === 'Outro' && (React.createElement(AlertBox, { severity: "critical", title: "Verificar criticamente" }, "A IT001 prev\u00EA uso de nitrog\u00EAnio. N\u00E3o liberar sem valida\u00E7\u00E3o t\u00E9cnica.")),
    r.nitrogenPreCharge.fontePreCarga === 'Sem referência confiável' && (React.createElement(AlertBox, { severity: "critical", title: "Sem fonte confi\u00E1vel" }, "N\u00E3o liberar automaticamente. Registrar pend\u00EAncia t\u00E9cnica conforme IT001 \u00A719 e plano ABX-10.")),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4" },
        React.createElement(Field, { label: "Press\u00E3o definida" },
            React.createElement(TextInput, { value: r.nitrogenPreCharge.pressaoDefinida, onChange: v => set('nitrogenPreCharge.pressaoDefinida', v), placeholder: "Ex: 100" })),
        React.createElement(Field, { label: "Unidade" },
            React.createElement(Select, { value: r.nitrogenPreCharge.unidade, onChange: v => set('nitrogenPreCharge.unidade', v), options: ['bar', 'psi', 'MPa', 'kgf/cm²'] })),
        React.createElement(Field, { label: "Press\u00E3o aplicada" },
            React.createElement(TextInput, { value: r.nitrogenPreCharge.pressaoAplicada, onChange: v => set('nitrogenPreCharge.pressaoAplicada', v) })),
        React.createElement(Field, { label: "Man\u00F4metro (ID/condi\u00E7\u00E3o)" },
            React.createElement(TextInput, { value: r.nitrogenPreCharge.manometroId, onChange: v => set('nitrogenPreCharge.manometroId', v), placeholder: "Ex: MAN-007 / OK" })),
        React.createElement(Field, { label: "Conjunto de carga utilizado" },
            React.createElement(TextInput, { value: r.nitrogenPreCharge.conjuntoCarga, onChange: v => set('nitrogenPreCharge.conjuntoCarga', v) })),
        React.createElement(Field, { label: "Condi\u00E7\u00E3o do instrumento" },
            React.createElement(Select, { value: r.nitrogenPreCharge.condicaoInstrumento, onChange: v => set('nitrogenPreCharge.condicaoInstrumento', v), options: ['OK — apto para uso', 'OK — verificação interna', 'Em análise', 'Reprovado'] }))),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.nitrogenPreCharge.cargaLenta, onChange: v => set('nitrogenPreCharge.cargaLenta', v), label: "Carga realizada lentamente" }),
        React.createElement(Toggle, { checked: r.nitrogenPreCharge.ultrapassagemBrusca, onChange: v => set('nitrogenPreCharge.ultrapassagemBrusca', v), label: "Ultrapassagem brusca de press\u00E3o (anomalia)" }),
        React.createElement(Toggle, { checked: r.nitrogenPreCharge.anomalia, onChange: v => set('nitrogenPreCharge.anomalia', v), label: "Vazamento/instabilidade/anomalia" }),
        React.createElement(Toggle, { checked: r.nitrogenPreCharge.fotoLeitura, onChange: v => set('nitrogenPreCharge.fotoLeitura', v), label: "Foto/v\u00EDdeo da leitura registrada" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.nitrogenPreCharge.notes, onChange: v => set('nitrogenPreCharge.notes', v) }))));

const StepStabilization = ({ r, set }) => (React.createElement(SectionCard, { title: "14. Estabiliza\u00E7\u00E3o e confer\u00EAncia", subtitle: "IT001 \u00A720 \u2014 Parker indica 10\u201315 min; pr\u00E1tica RKM ~20\u201330 min (conservadora).", critical: true },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "Tempo de estabiliza\u00E7\u00E3o aguardado" },
            React.createElement(Select, { value: r.stabilization.tempo, onChange: v => set('stabilization.tempo', v), options: ['Menos de 10 minutos', '10 a 15 minutos', '16 a 20 minutos', '21 a 30 minutos', 'Mais de 30 minutos', 'Não aplicável'] })),
        React.createElement(Field, { label: "Press\u00E3o ap\u00F3s estabiliza\u00E7\u00E3o" },
            React.createElement(TextInput, { value: r.stabilization.pressaoApos, onChange: v => set('stabilization.pressaoApos', v), placeholder: "Ex: 99 bar" })),
        React.createElement(Field, { label: "Press\u00E3o permaneceu est\u00E1vel?" },
            React.createElement(Select, { value: r.stabilization.estavel, onChange: v => set('stabilization.estavel', v), options: ['Sim', 'Não', 'Parcialmente'] })),
        React.createElement(Field, { label: "Resultado da confer\u00EAncia" },
            React.createElement(Select, { value: r.stabilization.resultado, onChange: v => set('stabilization.resultado', v), options: ['Conforme', 'Conforme com ressalva', 'Não conforme', 'Requer retrabalho', 'Requer validação do supervisor', 'Serviço bloqueado'] }))),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-2" },
        React.createElement(Toggle, { checked: r.stabilization.perdaCarga, onChange: v => set('stabilization.perdaCarga', v), label: "Houve perda de carga" }),
        React.createElement(Toggle, { checked: r.stabilization.vazamento, onChange: v => set('stabilization.vazamento', v), label: "Houve vazamento" }),
        React.createElement(Toggle, { checked: r.stabilization.fotoVideo, onChange: v => set('stabilization.fotoVideo', v), label: "Foto/v\u00EDdeo registrado" })),
    (r.stabilization.vazamento || r.stabilization.perdaCarga) && (React.createElement(Field, { label: "Ponto do vazamento / detalhe" },
        React.createElement(TextInput, { value: r.stabilization.pontoVazamento, onChange: v => set('stabilization.pontoVazamento', v), placeholder: "Ex: v\u00E1lvula de g\u00E1s" }))),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
        React.createElement(TextArea, { value: r.stabilization.notes, onChange: v => set('stabilization.notes', v) }))));

const StepFinalVerification = ({ r, set }) => {
    const itens = ['Pré-carga realizada', 'Estabilização aguardada', 'Pressão final conferida', 'Estabilidade confirmada', 'Vazamento verificado', 'Válvula de gás verificada', 'Registro fotográfico/vídeo', 'Resultado registrado no laudo'];
    return (React.createElement(SectionCard, { title: "15. Verifica\u00E7\u00E3o final", subtitle: "IT001 \u00A721 \u2014 sem teste hidr\u00E1ulico formal; verifica\u00E7\u00E3o por pr\u00E9-carga + estanqueidade." },
        React.createElement(Toggle, { checked: r.finalVerification.realizada, onChange: v => set('finalVerification.realizada', v), label: "Verifica\u00E7\u00E3o final realizada conforme IT001" }),
        React.createElement(Field, { label: "Itens verificados" },
            React.createElement(ChipMulti, { values: r.finalVerification.itens, onChange: v => set('finalVerification.itens', v), options: itens })),
        React.createElement(Toggle, { checked: r.finalVerification.testeHidraulico, onChange: v => set('finalVerification.testeHidraulico', v), label: "Teste hidr\u00E1ulico formal realizado" }),
        !r.finalVerification.testeHidraulico && (React.createElement(AlertBox, { severity: "info", title: "Observa\u00E7\u00E3o padr\u00E3o IT001 \u00A721" }, "Verifica\u00E7\u00E3o final baseada em pr\u00E9-carga com nitrog\u00EAnio, estabiliza\u00E7\u00E3o, confer\u00EAncia de press\u00E3o e verifica\u00E7\u00E3o de vazamento \u2014 conforme pr\u00E1tica atual descrita na IT001.")),
        React.createElement(Field, { label: "Resultado final do servi\u00E7o" },
            React.createElement(Select, { value: r.finalVerification.resultadoFinal, onChange: v => set('finalVerification.resultadoFinal', v), options: ['Aprovado', 'Aprovado com ressalva', 'Reprovado', 'Condenado', 'Pendente de validação técnica', 'Pendente de informação do cliente', 'Pendente de componente/material', 'Serviço interrompido'] })),
        React.createElement(Toggle, { checked: r.finalVerification.evidenciasFinais, onChange: v => set('finalVerification.evidenciasFinais', v), label: "Evid\u00EAncias finais anexadas" }),
        React.createElement(Field, { label: "Observa\u00E7\u00F5es" },
            React.createElement(TextArea, { value: r.finalVerification.notes, onChange: v => set('finalVerification.notes', v) }))));
};

const StepEnvironmental = ({ r, set }) => (React.createElement(SectionCard, { title: "16. Meio ambiente e res\u00EDduos", subtitle: "IT001 \u00A724 \u2014 controle m\u00EDnimo (sem mascarar lacuna ambiental)." },
    React.createElement(AlertBox, { severity: "info", title: "Postura RKM (IT001 \u00A724)" }, "A RKM ainda n\u00E3o possui segrega\u00E7\u00E3o ambiental madura para este servi\u00E7o. Esta etapa cumpre controle m\u00EDnimo at\u00E9 estrutura\u00E7\u00E3o completa (plano ABX-18/19)."),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.environmental.oleoResidual, onChange: v => set('environmental.oleoResidual', v), label: "Gera\u00E7\u00E3o de \u00F3leo residual" }),
        React.createElement(Toggle, { checked: r.environmental.oleoSegregado, onChange: v => set('environmental.oleoSegregado', v), label: "\u00D3leo residual segregado" }),
        React.createElement(Toggle, { checked: r.environmental.residuoContaminado, onChange: v => set('environmental.residuoContaminado', v), label: "Gera\u00E7\u00E3o de estopa/pano/absorvente contaminado" }),
        React.createElement(Toggle, { checked: r.environmental.residuoSegregado, onChange: v => set('environmental.residuoSegregado', v), label: "Res\u00EDduo contaminado segregado" }),
        React.createElement(Toggle, { checked: r.environmental.descarteBexiga, onChange: v => set('environmental.descarteBexiga', v), label: "Descarte de bexiga / veda\u00E7\u00F5es" }),
        React.createElement(Toggle, { checked: r.environmental.separadosComuns, onChange: v => set('environmental.separadosComuns', v), label: "Res\u00EDduos separados de res\u00EDduos comuns" }),
        React.createElement(Toggle, { checked: r.environmental.derramamento, onChange: v => set('environmental.derramamento', v), label: "Derramamento durante o servi\u00E7o" }),
        React.createElement(Toggle, { checked: r.environmental.contidoLimpo, onChange: v => set('environmental.contidoLimpo', v), label: "Derramamento contido e limpo" }),
        React.createElement(Toggle, { checked: r.environmental.absorvente, onChange: v => set('environmental.absorvente', v), label: "Material absorvente utilizado" }),
        React.createElement(Toggle, { checked: r.environmental.foto, onChange: v => set('environmental.foto', v), label: "Foto (quando aplic\u00E1vel)" })),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es ambientais" },
        React.createElement(TextArea, { value: r.environmental.notes, onChange: v => set('environmental.notes', v) }))));

const StepNonConformity = ({ r, set }) => {
    const tipos = ['Falta de identificação/rastreabilidade', 'Falta de informação técnica', 'Ausência de componente adequado', 'Dano identificado no recebimento', 'Dano identificado na desmontagem', 'Incompatibilidade de peça', 'Falha na pré-carga', 'Perda de pressão', 'Vazamento', 'Instrumento inadequado', 'Condição insegura', 'Derramamento/resíduo não controlado', 'Retrabalho', 'Condenação', 'Outro'];
    return (React.createElement(SectionCard, { title: "17. NC, retrabalho ou interrup\u00E7\u00E3o", subtitle: "IT001 \u00A725 \u2014 situa\u00E7\u00F5es que exigem interrup\u00E7\u00E3o imediata." },
        React.createElement(Toggle, { checked: r.nonConformity.houve, onChange: v => set('nonConformity.houve', v), label: "Houve n\u00E3o conformidade neste servi\u00E7o" }),
        r.nonConformity.houve && (React.createElement(React.Fragment, null,
            React.createElement(Field, { label: "Tipos de ocorr\u00EAncia" },
                React.createElement(ChipMulti, { values: r.nonConformity.tipos, onChange: v => set('nonConformity.tipos', v), options: tipos })),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
                React.createElement(Toggle, { checked: r.nonConformity.interrompida, onChange: v => set('nonConformity.interrompida', v), label: "Atividade interrompida" })),
            r.nonConformity.interrompida && (React.createElement(Field, { label: "Motivo da interrup\u00E7\u00E3o" },
                React.createElement(TextArea, { value: r.nonConformity.motivoInterrupcao, onChange: v => set('nonConformity.motivoInterrupcao', v) }))),
            React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
                React.createElement(Field, { label: "N\u00BA do registro de NC/plano de a\u00E7\u00E3o" },
                    React.createElement(TextInput, { value: r.nonConformity.registroNum, onChange: v => set('nonConformity.registroNum', v), placeholder: "Ex: NC-0042" })),
                React.createElement(Field, { label: "Respons\u00E1vel pela tratativa" },
                    React.createElement(TextInput, { value: r.nonConformity.responsavel, onChange: v => set('nonConformity.responsavel', v) }))),
            React.createElement(Field, { label: "A\u00E7\u00E3o imediata adotada" },
                React.createElement(TextArea, { value: r.nonConformity.acaoImediata, onChange: v => set('nonConformity.acaoImediata', v) })),
            React.createElement(Toggle, { checked: r.nonConformity.evidencia, onChange: v => set('nonConformity.evidencia', v), label: "Evid\u00EAncia da ocorr\u00EAncia registrada" })))));
};

const StepValidation = ({ r, set }) => (React.createElement(SectionCard, { title: "18. Valida\u00E7\u00E3o t\u00E9cnica", subtitle: "Quando exigida pela IT001 (\u00A75.3, \u00A713, \u00A714, \u00A718, \u00A719) ou por d\u00FAvida t\u00E9cnica." },
    React.createElement(Toggle, { checked: r.technicalValidation.exigiu, onChange: v => set('technicalValidation.exigiu', v), label: "Servi\u00E7o exigiu valida\u00E7\u00E3o do supervisor / respons\u00E1vel t\u00E9cnico" }),
    r.technicalValidation.exigiu && (React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
        React.createElement(Field, { label: "Motivo da valida\u00E7\u00E3o" },
            React.createElement(Select, { value: r.technicalValidation.motivo, onChange: v => set('technicalValidation.motivo', v), options: ['Dúvida técnica', 'Condição estrutural duvidosa', 'Ausência de dado do fabricante', 'Ausência de placa/identificação', 'Definição de pré-carga', 'Reaproveitamento de componente', 'Condenação', 'Aprovação com ressalva', 'Não conformidade', 'Outro'] })),
        React.createElement(Field, { label: "Validador" },
            React.createElement(TextInput, { value: r.technicalValidation.validador, onChange: v => set('technicalValidation.validador', v) })),
        React.createElement(Field, { label: "Decis\u00E3o do validador", className: "md:col-span-2" },
            React.createElement(Select, { value: r.technicalValidation.decisao, onChange: v => set('technicalValidation.decisao', v), options: ['Aprovado', 'Aprovado com ressalva', 'Reprovado', 'Condenado', 'Bloqueado', 'Solicitar informação adicional', 'Abrir plano de ação/NC', 'Outro'] })),
        React.createElement(Field, { label: "Observa\u00E7\u00E3o", className: "md:col-span-2" },
            React.createElement(TextArea, { value: r.technicalValidation.observacao, onChange: v => set('technicalValidation.observacao', v) })),
        React.createElement(Toggle, { checked: r.technicalValidation.evidencia, onChange: v => set('technicalValidation.evidencia', v), label: "Evid\u00EAncia registrada" })))));

const StepRelease = ({ r, set }) => (React.createElement(SectionCard, { title: "19. Libera\u00E7\u00E3o", subtitle: "IT001 \u00A722 e \u00A723 \u2014 s\u00F3 liberar com laudo, evid\u00EAncias e valida\u00E7\u00F5es." },
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.release.laudoEmitido, onChange: v => set('release.laudoEmitido', v), label: "Laudo t\u00E9cnico emitido / atualizado" }),
        React.createElement(Toggle, { checked: r.release.checklistCompleto, onChange: v => set('release.checklistCompleto', v), label: "Checklist preenchido integralmente" }),
        React.createElement(Toggle, { checked: r.release.evidenciasVinculadas, onChange: v => set('release.evidenciasVinculadas', v), label: "Evid\u00EAncias vinculadas" }),
        React.createElement(Toggle, { checked: r.release.componentesRegistrados, onChange: v => set('release.componentesRegistrados', v), label: "Componentes substitu\u00EDdos registrados" }),
        React.createElement(Toggle, { checked: r.release.preCargaRegistrada, onChange: v => set('release.preCargaRegistrada', v), label: "Press\u00E3o de pr\u00E9-carga registrada" }),
        React.createElement(Toggle, { checked: r.release.resultadoRegistrado, onChange: v => set('release.resultadoRegistrado', v), label: "Resultado final registrado no laudo" })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4" },
        React.createElement(Field, { label: "N\u00BA do laudo final" },
            React.createElement(TextInput, { value: r.release.laudoFinal, onChange: v => set('release.laudoFinal', v) })),
        React.createElement(Field, { label: "Data da libera\u00E7\u00E3o" },
            React.createElement(TextInput, { type: "date", value: r.release.dataLiberacao, onChange: v => set('release.dataLiberacao', v) })),
        React.createElement(Field, { label: "Condi\u00E7\u00E3o final do equipamento" },
            React.createElement(Select, { value: r.release.condicaoFinal, onChange: v => set('release.condicaoFinal', v), options: ['Liberado para entrega', 'Liberado com ressalva', 'Não liberado', 'Condenado', 'Aguardando cliente', 'Aguardando peça/componente', 'Aguardando validação técnica'] })),
        React.createElement(Field, { label: "Respons\u00E1vel pela libera\u00E7\u00E3o t\u00E9cnica" },
            React.createElement(TextInput, { value: r.release.responsavelLiberacao, onChange: v => set('release.responsavelLiberacao', v) })),
        React.createElement(Field, { label: "Respons\u00E1vel pelo fechamento PCP" },
            React.createElement(TextInput, { value: r.release.responsavelPCP, onChange: v => set('release.responsavelPCP', v) }))),
    React.createElement(Field, { label: "Observa\u00E7\u00F5es finais" },
        React.createElement(TextArea, { value: r.release.notes, onChange: v => set('release.notes', v) }))));

const StepClassification = ({ r, set }) => (React.createElement(SectionCard, { title: "20. Classifica\u00E7\u00E3o Qualidade", subtitle: "Fechamento \u2014 classifica\u00E7\u00E3o do servi\u00E7o para melhorias." },
    React.createElement(Field, { label: "Classifica\u00E7\u00E3o do servi\u00E7o para melhorias" },
        React.createElement(Select, { value: r.classification.classificacao, onChange: v => set('classification.classificacao', v), options: ['Conforme', 'Conforme com ressalva', 'Não conforme', 'Retrabalho', 'Condenado', 'Pendente técnico', 'Pendente cliente', 'Pendente material', 'Bloqueado por segurança', 'Bloqueado por rastreabilidade'] })),
    React.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2" },
        React.createElement(Toggle, { checked: r.classification.riscoQualidade, onChange: v => set('classification.riscoQualidade', v), label: "Houve risco de qualidade" }),
        React.createElement(Toggle, { checked: r.classification.riscoSST, onChange: v => set('classification.riscoSST', v), label: "Houve risco de SST" }),
        React.createElement(Toggle, { checked: r.classification.riscoAmbiental, onChange: v => set('classification.riscoAmbiental', v), label: "Houve risco ambiental" }),
        React.createElement(Toggle, { checked: r.classification.riscoRastreabilidade, onChange: v => set('classification.riscoRastreabilidade', v), label: "Risco de rastreabilidade" }),
        React.createElement(Toggle, { checked: r.classification.impactoEstoque, onChange: v => set('classification.impactoEstoque', v), label: "Impacto em estoque/componente" }),
        React.createElement(Toggle, { checked: r.classification.acaoCorretiva, onChange: v => set('classification.acaoCorretiva', v), label: "Necessidade de a\u00E7\u00E3o corretiva/preventiva" })),
    React.createElement(Field, { label: "Observa\u00E7\u00E3o para melhoria do processo / IT" },
        React.createElement(TextArea, { value: r.classification.observacaoMelhoria, onChange: v => set('classification.observacaoMelhoria', v) }))));

export const STEP_RENDERERS = {
    1: StepOpening, 2: StepEquipment, 3: StepReceived, 4: StepStartConditions, 5: StepSafety,
    6: StepDepressurization, 7: StepDisassembly, 8: StepInspection, 9: StepTechnicalDecision,
    10: StepCleaning, 11: StepAssembly, 12: StepTorque, 13: StepNitrogen, 14: StepStabilization,
    15: StepFinalVerification, 16: StepEnvironmental, 17: StepNonConformity, 18: StepValidation,
    19: StepRelease, 20: StepClassification,
};

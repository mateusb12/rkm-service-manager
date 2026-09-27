// @ts-nocheck

import React, { useState } from 'react';

const GATES = [
    {
        version: 'V1', phase: 'Entrada', status: 'done', statusLabel: 'Concluído', title: 'Entrada até diagnóstico', description: 'Fazer a peça entrar corretamente na oficina e sair da recepção com o escopo inicial definido.', objective: 'A peça entra, ganha uma OS, é identificada, inspecionada e recebe um diagnóstico inicial.', outcome: 'Ao final, sabemos que peça entrou, de quem é, qual equipamento é, em que estado está e o que precisa ser feito.', exitCriteria: 'A peça percorre Entrada → OS → Identificação → Inspeção → Diagnóstico.', deliverables: ['Receber a peça e criar OS', 'Identificar cliente e equipamento', 'Inspecionar e desmontar', 'Registrar diagnóstico e escopo'], gate: 'Gate 1 · Diagnóstico iniciado', owner: 'Produto + Operação', coverage: '20%', summary: 'A V1 não entrega a execução completa: prepara a peça para ser planejada, deixando claro o que entrou e o que precisa ser feito.', features: [
            { name: 'Receber a peça e criar OS', status: 'done', owner: 'Recepção', evidence: 'A Lizy permite criar uma ordem pela fila de Desmontagem.', example: 'A peça do cliente VLI PECEM aparece cadastrada na OS 20265592; uma peça da RKM aparece na OS 20265591.', acceptance: 'Criar uma OS com número, cliente, equipamento e data de entrada.' },
            { name: 'Identificar cliente e equipamento', status: 'done', owner: 'Recepção', evidence: 'A OS mantém cliente e equipamento visíveis no fluxo.', example: 'OS 2026522 — Ecofor Ambiental S/A G2 — cilindro hidráulico transportador; OS 2026534 — caixa de comando hidráulico.', acceptance: 'A identificação permanece visível em todas as etapas da OS.' },
            { name: 'Inspecionar e desmontar', status: 'done', owner: 'Peritagem', evidence: '17 OS aguardavam inspeção na fila de Desmontagem.', example: 'A fila continha 20265592 VLI PECEM, 20265590 PLANALTO INDUSTRIA e OS-DEBUG-001 RKM HIDRAULICA em Aguardando Inspeções.', acceptance: 'Listar, filtrar e abrir a peça para inspeção e desmontagem.' },
            { name: 'Definir diagnóstico e escopo', status: 'next', owner: 'Peritagem + PCP', evidence: 'O PCP registra quais serviços entram ou não entram em cada OS.', example: 'Na OS 2026531, o cilindro hidráulico transportador aparece com etapas marcadas como Não Possui Serviço; na OS 2026458, Montagem aparece como Iniciar Montagem.', acceptance: 'Registrar o diagnóstico e as etapas aplicáveis antes de enviar a peça para execução.' },
        ]
    },
    {
        version: 'V2', phase: 'Planejamento', status: 'active', statusLabel: 'Em andamento', title: 'Planejamento e execução', description: 'Transformar o diagnóstico em uma sequência de trabalho clara e executável pela oficina.', objective: 'A OS diagnosticada entra no PCP, recebe prazo e prioridade e passa a ter etapas produtivas acompanháveis.', outcome: 'O PCP e os setores sabem o que precisa ser feito, qual é a prioridade, onde a peça está, quem deve agir e qual é o próximo passo.', exitCriteria: 'A OS percorre Diagnóstico → Planejamento → Priorização → Execução por etapas → Próximo passo.', deliverables: ['Enviar a OS para o PCP', 'Definir prazo e prioridade', 'Executar por etapa', 'Registrar avanço e próximo passo'], gate: 'Gate 2 · Fluxo executável', owner: 'PCP + Técnicos', coverage: '45%', summary: 'A V2 transforma o diagnóstico em trabalho executável, sem ainda fechar qualidade, entrega ou gestão avançada.', features: [
            { name: 'PCP da oficina', status: 'active', owner: 'PCP', evidence: '10 OS no PCP; 0 aguardando planejamento.', example: 'a OS 2026458 aparece para Apodi Caucaia como bomba manual; as OS 2026522 e 2026524 aparecem para Ecofor.', acceptance: 'Mostrar todas as OS abertas e o estado de cada etapa.' },
            { name: 'Prazo e prioridade', status: 'active', owner: 'PCP', evidence: 'A fila exibe dias restantes e atraso por OS.', example: 'OS 2026465 RES ENERGY com -80 dias; OS 2026388 GERDAU CAUCAIA com -126 dias.', acceptance: 'Ordenar a execução por prazo, atraso e prioridade.' },
            { name: 'Etapas produtivas', status: 'active', owner: 'Setores da oficina', evidence: 'Limpeza, Usinagem, Montagem, Teste, Pintura e Qualidade aparecem no PCP.', example: 'na OS 2026522, Limpeza/Usinagem/Montagem/Teste/Pintura estão Finalizados e Qualidade está Em andamento.', acceptance: 'Cada etapa possui estado próprio e histórico de mudança.' },
            { name: 'Estado Não Possui Serviço', status: 'active', owner: 'PCP', evidence: 'Etapas não aplicáveis aparecem explicitamente no PCP.', example: 'OS 2026531 — cilindro hidráulico transportador — tem Limpeza, Usinagem, Montagem, Teste, Pintura e Qualidade como Não Possui Serviço.', acceptance: 'Etapa não aplicável não bloqueia a execução.' },
            { name: 'Próximo passo operacional', status: 'next', owner: 'Técnico', evidence: 'A OS indica a etapa que deve começar.', example: 'OS 2026458 — bomba manual — está com Limpeza Em andamento e Montagem Iniciar Montagem.', acceptance: 'O técnico identifica claramente qual ação vem a seguir.' },
        ]
    },
    {
        version: 'V3', phase: 'Controle', status: 'next', statusLabel: 'Próximo', title: 'Evidência e liberação', description: 'Provar o que aconteceu durante a execução e decidir se a OS pode ser liberada com segurança.', objective: 'Consolidar evidências, materiais, pendências e validação técnica antes de encerrar a OS.', outcome: 'A oficina consegue provar o que foi feito, quais materiais foram usados, quais pendências existem e se a peça está pronta para liberação.', exitCriteria: 'A OS percorre Execução → Evidências → Validação técnica → Liberação.', deliverables: ['Registrar evidências da execução', 'Vincular peças e materiais', 'Tratar pendências', 'Validar e liberar a OS'], gate: 'Gate 3 · Liberação segura', owner: 'Qualidade + Supervisor', coverage: '65%', summary: 'A V3 transforma o trabalho executado em um registro confiável para validação e liberação da OS.', features: [
            { name: 'Evidências fotográficas', status: 'next', owner: 'Técnico', evidence: 'A Lizy exibe a coluna Foto nos finalizados; anexo ainda não foi aberto.', acceptance: 'Anexar fotos por OS e etapa, com data e autor.' },
            { name: 'Peças e materiais da OS', status: 'active', owner: 'Almoxarifado', evidence: '174 requisições de estoque ligadas a OS; RE173 ligada à OS 2026458.', acceptance: 'Requisitar, atender e rastrear materiais dentro da OS.' },
            { name: 'Pendências com responsável', status: 'next', owner: 'Supervisor', evidence: 'Capacidade prevista no fluxo, mas sem amostra aberta nesta inspeção.', acceptance: 'Toda pendência possui motivo, dono, prazo e resolução.' },
            { name: 'Apontamento de tempo', status: 'planned', owner: 'Setor executor', evidence: 'Nenhum apontamento foi medido na leitura da Lizy.', acceptance: 'Registrar início, fim e duração por etapa quando o cliente confirmar o uso.' },
        ]
    },
    {
        version: 'V4', phase: 'Gestão', status: 'planned', statusLabel: 'Planejado', title: 'Orquestrar a operação', description: 'Transformar os dados da oficina em decisões de capacidade, prioridade e prazo.', objective: 'Dar ao PCP e à gestão uma visão confiável da operação para antecipar gargalos e atrasos.', outcome: 'A gestão sabe onde estão as filas, quais setores estão sobrecarregados, quais OS estão atrasadas e onde precisa agir.', exitCriteria: 'A operação percorre Execução → Medição → Análise de gargalos → Ação gerencial.', deliverables: ['Visualizar capacidade por setor', 'Acompanhar SLA e atrasos', 'Ordenar prioridades da operação', 'Consultar histórico e indicadores'], gate: 'Gate 4 · Operação gerenciável', owner: 'PCP + Gestão', coverage: '85%', summary: 'A V4 transforma o histórico da operação em visão gerencial para agir antes que a OS fique parada ou atrasada.', features: [
            { name: 'Visão de capacidade', status: 'planned', owner: 'PCP', evidence: 'A Lizy organiza OS por setor; capacidade agregada ainda não foi medida.', acceptance: 'Exibir carga por setor, fila e capacidade disponível.' },
            { name: 'SLA por etapa', status: 'planned', owner: 'PCP', evidence: 'A fila mostra dias restantes e atraso por OS.', acceptance: 'Comparar tempo planejado, realizado e atraso por etapa.' },
            { name: 'Fila de prioridades', status: 'planned', owner: 'PCP', evidence: 'OS possuem prazo e prioridade na operação observada.', acceptance: 'Ordenar o trabalho por urgência, atraso e impacto.' },
            { name: 'Histórico operacional', status: 'planned', owner: 'Gestão', evidence: 'Finalizados conserva 31 OS do mês e 111 do ano.', acceptance: 'Consultar histórico e indicadores sem exportação manual.' },
        ]
    },
    {
        version: 'V5', phase: 'Escala', status: 'vision', statusLabel: 'Visão', title: 'Cobertura completa da oficina', description: 'Chegar a 100% do que a Lizy oferece para a oficina e que o cliente realmente usa.', objective: 'Consolidar em um único sistema todo o ciclo da oficina comprovadamente usado pelo cliente.', outcome: 'A RKM consegue operar a oficina de ponta a ponta, com rastreabilidade, sem depender de controles paralelos para nenhuma etapa crítica.', exitCriteria: 'Entrada → Diagnóstico → Planejamento → Execução → Evidências → Validação → Finalização, tudo funcionando na mesma OS.', deliverables: ['Cobrir o fluxo ponta a ponta', 'Garantir rastreabilidade completa', 'Eliminar controles paralelos críticos', 'Validar cobertura com o cliente'], gate: 'Gate 5 · 100% da oficina usada', owner: 'RKM + Produto', coverage: '100%', summary: 'A V5 consolida os gates anteriores em uma operação completa, cobrindo apenas o que pertence à oficina e é realmente usado pelo cliente.', features: [
            { name: 'Fluxo ponta a ponta', status: 'vision', owner: 'Produto', evidence: 'Receber → Diagnosticar → Planejar → Executar → Validar → Finalizar.', acceptance: 'Uma única OS atravessa o ciclo inteiro sem controle paralelo.' },
            { name: 'Escopo validado pelo cliente', status: 'vision', owner: 'Produto + RKM', evidence: 'Só entram features com uso observado ou confirmação explícita.', acceptance: 'Cada feature possui evidência, responsável e critério de aceite.' },
            { name: 'Auditoria operacional', status: 'vision', owner: 'Gestão', evidence: 'A Lizy mantém filas, estados, finalizações e referências de OS.', acceptance: 'Reconstruir quem fez o quê, quando e em qual etapa.' },
            { name: 'Melhoria contínua', status: 'vision', owner: 'RKM + Produto', evidence: 'Gate 5 encerra cobertura, não evolução do produto.', acceptance: 'Novas necessidades entram como novos gates sem quebrar o histórico.' },
        ]
    },
];

const STATUS_CLASS = { done: 'bg-emerald-400 text-emerald-950', active: 'bg-blue-400 text-blue-950', next: 'bg-amber-300 text-amber-950', planned: 'bg-slate-500 text-slate-100', vision: 'bg-violet-400 text-violet-950' };
const FEATURE_STATUS = { done: ['Concluída', 'tag-emerald'], active: ['Em construção', 'tag-blue'], next: ['Próxima', 'tag-amber'], planned: ['Planejada', 'tag-slate'], vision: ['Visão', 'tag-violet'] };

const FEATURE_ACCENT = {
    done: {
        border: 'border-emerald-400/35',
        bar: 'bg-emerald-400',
        soft: 'bg-emerald-400/10',
        text: 'text-emerald-300',
    },
    active: {
        border: 'border-blue-400/35',
        bar: 'bg-blue-400',
        soft: 'bg-blue-400/10',
        text: 'text-blue-300',
    },
    next: {
        border: 'border-amber-300/35',
        bar: 'bg-amber-300',
        soft: 'bg-amber-300/10',
        text: 'text-amber-300',
    },
    planned: {
        border: 'border-slate-500/45',
        bar: 'bg-slate-500',
        soft: 'bg-slate-500/10',
        text: 'text-slate-300',
    },
    vision: {
        border: 'border-violet-400/35',
        bar: 'bg-violet-400',
        soft: 'bg-violet-400/10',
        text: 'text-violet-300',
    },
};

const STEP_GLOW_STYLE: Record<string, React.CSSProperties> = {
    done: {
        boxShadow: '0 0 0 3px rgba(52,211,153,0.18), 0 0 12px 3px rgba(52,211,153,0.34)',
        transform: 'scale(1.08)',
    },
    active: {
        boxShadow: '0 0 0 3px rgba(96,165,250,0.18), 0 0 12px 3px rgba(96,165,250,0.34)',
        transform: 'scale(1.08)',
    },
    next: {
        boxShadow: '0 0 0 3px rgba(250,204,21,0.20), 0 0 13px 3px rgba(250,204,21,0.36)',
        transform: 'scale(1.08)',
    },
    planned: {
        boxShadow: '0 0 0 3px rgba(148,163,184,0.16), 0 0 10px 2px rgba(148,163,184,0.26)',
        transform: 'scale(1.06)',
    },
    vision: {
        boxShadow: '0 0 0 3px rgba(167,139,250,0.18), 0 0 12px 3px rgba(167,139,250,0.34)',
        transform: 'scale(1.08)',
    },
};


const RoadmapView = () => {
    const [selectedVersion, setSelectedVersion] = useState('V2');
    const selectedGate = GATES.find(item => item.version === selectedVersion) || GATES[1];

    return (
        <div className="p-4 md:p-6 space-y-5">
            <section className="rkm-card overflow-hidden">
                <div className="p-5 md:p-6 border-b border-rkmborder bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10">
                    <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
                        <div className="max-w-2xl"><div className="text-xs uppercase tracking-widest text-blue-300 font-semibold">Planejamento · select and inspect</div><h1 className="text-2xl md:text-3xl font-semibold text-slate-100 mt-2">Roadmap por gates</h1><p className="text-sm text-slate-400 mt-2 leading-6">Selecione um gate para destrinchar as features, evidências e critérios de aceite daquele estágio.</p></div>
                        <div className="flex flex-wrap gap-2 text-xs"><span className="tag tag-emerald">Concluído</span><span className="tag tag-blue">Em andamento</span><span className="tag tag-amber">Próximo</span><span className="tag tag-slate">Planejado</span></div>
                    </div>
                </div>

                <div className="p-5 md:p-6 overflow-x-auto">
                    <div className="min-w-[980px]">
                        <div className="px-6 mb-3 min-w-[980px]" style={{ position: 'relative' }}>
                            <div className="pointer-events-none" style={{ position: 'absolute', left: '10%', right: '10%', top: '23px', display: 'flex', zIndex: 0 }}>
                                {GATES.slice(0, -1).map((item, index) => <div key={`rail-${item.version}`} className={`${index < 2 ? 'bg-blue-400/70' : 'bg-slate-700'}`} style={{ height: '2px', flex: '1 1 0%' }} />)}
                            </div>
                            <div className="relative grid grid-cols-5">
                                {GATES.map(item => <button type="button" key={item.version} onClick={() => setSelectedVersion(item.version)} aria-pressed={selectedVersion === item.version} className={`flex flex-col items-center justify-start rounded-lg p-1 text-center transition hover:bg-slate-800/20`}>
                                    <div
                                        style={{
                                            position: 'relative',
                                            zIndex: 1,
                                            ...(selectedVersion === item.version ? STEP_GLOW_STYLE[item.status] : {}),
                                        }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-4 transition-all duration-300 ${STATUS_CLASS[item.status]} ${selectedVersion === item.version ? 'ring-white/30' : 'ring-rkmbg'}`}
                                    >{item.version}</div>
                                    <div className="mt-2"><div className="text-sm font-semibold text-slate-200">{item.phase}</div><div className="text-xs text-slate-500">{item.statusLabel}</div></div>
                                </button>)}
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {GATES.map(item => <button type="button" key={item.version} onClick={() => setSelectedVersion(item.version)} aria-pressed={selectedVersion === item.version} className={`text-left rounded-xl border p-4 min-h-[276px] flex flex-col transition ${selectedVersion === item.version ? 'border-blue-400 bg-blue-500/[.10] shadow-lg shadow-blue-950/20 -translate-y-1' : 'border-rkmborder bg-rkmcard2/30 hover:border-slate-500'}`}>
                                <div className="flex items-start justify-between gap-2"><span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_CLASS[item.status]}`}>{item.statusLabel}</span><span className="text-xs text-slate-500">{item.version}</span></div>
                                <h2 className="text-base font-semibold text-slate-100 mt-4">{item.title}</h2><p className="text-xs text-slate-400 leading-5 mt-2">{item.description}</p>
                                {item.objective && <div className="mt-4 rounded-lg border border-blue-400/20 bg-blue-500/[.06] p-3"><div className="text-[10px] uppercase tracking-wider text-blue-300">Objetivo</div><p className="text-xs text-slate-300 leading-5 mt-1">{item.objective}</p></div>}
                                <div className="mt-4 space-y-2 flex-1">{item.deliverables.map(deliverable => <div key={deliverable} className="flex items-start gap-2 text-xs text-slate-300"><span className="text-blue-300 mt-0.5">✓</span><span>{deliverable}</span></div>)}</div>
                                <div className="pt-3 mt-3 border-t border-rkmborder space-y-1"><div className="text-[11px] uppercase tracking-wide text-slate-500">Cobertura alvo</div><div className="text-lg font-semibold text-slate-100">{item.coverage}</div><div className="text-[11px] text-slate-500">Clique para inspecionar</div></div>
                            </button>)}
                        </div>
                    </div>
                </div>
            </section>

            <section className="rkm-card overflow-hidden" aria-live="polite">
                <div className="p-5 md:p-6 border-b border-rkmborder bg-slate-900/20">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"><div><div className="flex items-center gap-2"><span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_CLASS[selectedGate.status]}`}>{selectedGate.version} · {selectedGate.statusLabel}</span><span className="text-xs text-slate-500">{selectedGate.phase}</span></div><h2 className="text-xl font-semibold text-slate-100 mt-3">{selectedGate.title}</h2><p className="text-sm text-slate-400 mt-2 max-w-3xl">{selectedGate.summary}</p></div><div className="lg:text-right"><div className="text-xs uppercase tracking-wider text-slate-500">Gate de saída</div><div className="text-sm font-semibold text-blue-300 mt-1">{selectedGate.gate}</div><div className="text-xs text-slate-500 mt-1">Owner: {selectedGate.owner}</div></div></div>
                </div>
                <div className="p-5 md:p-6"><div className="mb-5"><div className="text-xs uppercase tracking-wider text-slate-500">Ordem natural da peça</div><div className="flex flex-wrap items-center gap-2 mt-3">{selectedGate.features.map((feature, index) => <React.Fragment key={`flow-${feature.name}`}><div className="inline-flex items-center gap-2 rounded-lg border border-blue-400/20 bg-blue-500/[.06] px-3 py-2 text-xs text-slate-300"><span className="font-semibold text-blue-300">{String(index + 1).padStart(2, '0')}</span><span>{feature.name}</span></div>{index < selectedGate.features.length - 1 && <span className="text-slate-600">→</span>}</React.Fragment>)}</div></div><div className="flex items-center justify-between mb-4"><div><div className="text-xs uppercase tracking-wider text-slate-500">Features do gate</div><div className="text-sm text-slate-300 mt-1">{selectedGate.features.length} itens para inspecionar</div></div><div className="text-right"><div className="text-2xl font-semibold text-blue-300">{selectedGate.coverage}</div><div className="text-[11px] text-slate-500">cobertura alvo</div></div></div>
                    {selectedGate.outcome && (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                            <div className="rounded-xl border border-blue-400/30 bg-blue-500/[.08] p-4 shadow-sm shadow-black/10">
                                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-blue-300">
                                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                                    Resultado esperado
                                </div>
                                <p className="text-sm text-slate-200 leading-6 mt-2">
                                    {selectedGate.outcome}
                                </p>
                            </div>
                    
                            <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[.07] p-4 shadow-sm shadow-black/10">
                                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    Critério de saída
                                </div>
                                <p className="text-sm text-slate-200 leading-6 mt-2">
                                    {selectedGate.exitCriteria}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="space-y-4">
                        {selectedGate.features.map((feature, index) => {
                            const [label, tag] = FEATURE_STATUS[feature.status];
                            const accent = FEATURE_ACCENT[feature.status] || FEATURE_ACCENT.planned;
                    
                            return (
                                <article
                                    key={feature.name}
                                    className={`relative overflow-hidden rounded-xl border ${accent.border} bg-rkmcard2 shadow-sm shadow-black/10`}
                                >
                                    <div className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} />
                    
                                    <div className="p-5 pl-6">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div
                                                    className={`w-8 h-8 shrink-0 rounded-lg border ${accent.border} ${accent.soft} ${accent.text} flex items-center justify-center text-xs font-bold`}
                                                >
                                                    {String(index + 1).padStart(2, '0')}
                                                </div>
                    
                                                <div className="min-w-0">
                                                    <h3 className="text-base font-semibold text-slate-100 leading-6">
                                                        {feature.name}
                                                    </h3>
                    
                                                    <div className="text-xs text-slate-400 mt-1">
                                                        Owner: <span className="text-slate-300">{feature.owner}</span>
                                                    </div>
                                                </div>
                                            </div>
                    
                                            <span className={`tag ${tag} shrink-0`}>
                                                {label}
                                            </span>
                                        </div>
                    
                                        <div
                                            className={`grid grid-cols-1 ${feature.example ? 'xl:grid-cols-3' : 'xl:grid-cols-2'} gap-3 mt-4`}
                                        >
                                            <section className="rounded-lg border border-slate-700/80 bg-slate-950/20 p-4">
                                                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                                                    Evidência
                                                </div>
                    
                                                <p className="text-sm text-slate-200 leading-6 mt-2">
                                                    {feature.evidence}
                                                </p>
                                            </section>
                    
                                            {feature.example && (
                                                <section className="rounded-lg border border-blue-400/30 bg-blue-500/[.08] p-4">
                                                    <div className="text-[11px] uppercase tracking-wider font-semibold text-blue-300">
                                                        Exemplo concreto
                                                    </div>
                    
                                                    <p className="text-sm text-slate-200 leading-6 mt-2">
                                                        {feature.example}
                                                    </p>
                                                </section>
                                            )}
                    
                                            <section className="rounded-lg border border-emerald-400/30 bg-emerald-400/[.07] p-4">
                                                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-emerald-300">
                                                    <span className="text-emerald-300">✓</span>
                                                    Critério de aceite
                                                </div>
                    
                                                <p className="text-sm text-slate-100 leading-6 mt-2">
                                                    {feature.acceptance}
                                                </p>
                                            </section>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><section className="rkm-card p-5 lg:col-span-2"><div className="flex items-center gap-2 mb-4"><span className="sec-bullet" /><h2 className="text-sm font-semibold">Como usar</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">1. Selecionar</div><p className="text-slate-500 mt-1">Clique em qualquer gate da timeline.</p></div><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">2. Inspecionar</div><p className="text-slate-500 mt-1">Leia features, evidências e owners.</p></div><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">3. Aceitar</div><p className="text-slate-500 mt-1">Use o critério para decidir se avança.</p></div></div></section><section className="rkm-card p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Gate atual</div><div className="text-lg font-semibold text-blue-300 mt-2">V2 · Execução</div><p className="text-xs text-slate-400 mt-2 leading-5">O foco atual é transformar a OS em uma sequência operacional acompanhável.</p><div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full w-2/5 rounded-full bg-blue-400" /></div><div className="flex justify-between text-[11px] text-slate-500 mt-2"><span>Progresso visual</span><span>40%</span></div></section></div>
        </div>
    );
};

export { RoadmapView };

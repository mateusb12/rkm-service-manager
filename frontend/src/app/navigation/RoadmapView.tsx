// @ts-nocheck

import React, { useState } from 'react';

const GATES = [
    {
        version: 'V1', phase: 'Entrada', status: 'done', statusLabel: 'Concluído', title: 'Entrada e diagnóstico da OS', description: 'Criar a OS, identificar o equipamento, iniciar a inspeção e controlar prazo e prioridade.', deliverables: ['Criar Ordem de Serviço', 'Identificar cliente e equipamento', 'Fila de inspeção', 'Prazo e prioridade'], gate: 'Gate 1 · Entrada operacional', owner: 'Produto + Operação', coverage: '20%', summary: 'A oficina consegue receber uma peça, registrar a OS e colocá-la na fila certa para análise.', features: [
            { name: 'Criar Ordem de Serviço', status: 'done', owner: 'Recepção', evidence: 'A Lizy permite criar uma ordem pela fila de Desmontagem.', acceptance: 'Criar uma OS com número, cliente, equipamento e data de entrada.' },
            { name: 'Identificar cliente e equipamento', status: 'done', owner: 'Recepção', evidence: 'OS 20265592 — VLI PECEM; OS 20265591 — RKM HIDRAULICA.', acceptance: 'A identificação permanece visível em todas as etapas da OS.' },
            { name: 'Fila de inspeção', status: 'done', owner: 'Peritagem', evidence: '17 OS em Aguardando Inspeções.', acceptance: 'Listar, filtrar e abrir as OS aguardando análise.' },
            { name: 'Prazo e prioridade', status: 'done', owner: 'PCP', evidence: 'OS 2026465 com -80 dias; OS 2026388 com -126 dias.', acceptance: 'Exibir atraso, prazo e prioridade sem depender de planilha.' },
        ]
    },
    {
        version: 'V2', phase: 'Execução', status: 'active', statusLabel: 'Em andamento', title: 'Digitalizar a execução', description: 'Registrar o trabalho técnico com rastreabilidade, evidências e pendências.', deliverables: ['Minha Bancada', 'Checklist por etapa', 'Evidências e pendências'], gate: 'Gate 2 · Fluxo executável', owner: 'Engenharia + Técnicos', coverage: '45%', summary: 'A OS vira uma sequência de trabalho: cada setor sabe o estado atual e o próximo passo.', features: [
            { name: 'PCP da oficina', status: 'active', owner: 'PCP', evidence: '10 OS no PCP; 0 aguardando planejamento.', acceptance: 'Mostrar todas as OS abertas e o estado de cada etapa.' },
            { name: 'Etapas produtivas', status: 'active', owner: 'Setores da oficina', evidence: 'Limpeza, Usinagem, Montagem, Teste, Pintura e Qualidade aparecem no PCP.', acceptance: 'Cada etapa possui estado próprio e histórico de mudança.' },
            { name: 'Estado Não Possui Serviço', status: 'active', owner: 'PCP', evidence: 'OS 2026531 e 2026551 têm etapas marcadas como Não Possui Serviço.', acceptance: 'Etapa não aplicável não bloqueia a execução.' },
            { name: 'Próximo passo operacional', status: 'next', owner: 'Técnico', evidence: 'OS 2026458 com Montagem: Iniciar Montagem.', acceptance: 'O técnico identifica claramente qual ação vem a seguir.' },
        ]
    },
    {
        version: 'V3', phase: 'Controle', status: 'next', statusLabel: 'Próximo', title: 'Fechar com qualidade', description: 'Criar uma passagem clara entre execução, validação técnica e liberação.', deliverables: ['Visão da Qualidade', 'Aprovações e bloqueios', 'Resumo / laudo'], gate: 'Gate 3 · Liberação segura', owner: 'Qualidade + Supervisor', coverage: '65%', summary: 'Nada importante fica apenas na memória: materiais, fotos, pendências e decisões ficam ligados à OS.', features: [
            { name: 'Evidências fotográficas', status: 'next', owner: 'Técnico', evidence: 'A Lizy exibe a coluna Foto nos finalizados; anexo ainda não foi aberto.', acceptance: 'Anexar fotos por OS e etapa, com data e autor.' },
            { name: 'Peças e materiais da OS', status: 'active', owner: 'Almoxarifado', evidence: '174 requisições de estoque ligadas a OS; RE173 ligada à OS 2026458.', acceptance: 'Requisitar, atender e rastrear materiais dentro da OS.' },
            { name: 'Pendências com responsável', status: 'next', owner: 'Supervisor', evidence: 'Capacidade prevista no fluxo, mas sem amostra aberta nesta inspeção.', acceptance: 'Toda pendência possui motivo, dono, prazo e resolução.' },
            { name: 'Apontamento de tempo', status: 'planned', owner: 'Setor executor', evidence: 'Nenhum apontamento foi medido na leitura da Lizy.', acceptance: 'Registrar início, fim e duração por etapa quando o cliente confirmar o uso.' },
        ]
    },
    {
        version: 'V4', phase: 'Gestão', status: 'planned', statusLabel: 'Planejado', title: 'Orquestrar a operação', description: 'Dar ao PCP uma visão de capacidade, gargalos, SLA e prioridades.', deliverables: ['Dashboard do PCP', 'SLA por etapa', 'Fila de prioridades'], gate: 'Gate 4 · Operação gerenciável', owner: 'PCP + Gestão', coverage: '85%', summary: 'A gestão acompanha gargalos e consegue agir antes que a OS fique parada ou atrasada.', features: [
            { name: 'Visão de capacidade', status: 'planned', owner: 'PCP', evidence: 'A Lizy organiza OS por setor; capacidade agregada ainda não foi medida.', acceptance: 'Exibir carga por setor, fila e capacidade disponível.' },
            { name: 'SLA por etapa', status: 'planned', owner: 'PCP', evidence: 'A fila mostra dias restantes e atraso por OS.', acceptance: 'Comparar tempo planejado, realizado e atraso por etapa.' },
            { name: 'Fila de prioridades', status: 'planned', owner: 'PCP', evidence: 'OS possuem prazo e prioridade na operação observada.', acceptance: 'Ordenar o trabalho por urgência, atraso e impacto.' },
            { name: 'Histórico operacional', status: 'planned', owner: 'Gestão', evidence: 'Finalizados conserva 31 OS do mês e 111 do ano.', acceptance: 'Consultar histórico e indicadores sem exportação manual.' },
        ]
    },
    {
        version: 'V5', phase: 'Escala', status: 'vision', statusLabel: 'Visão', title: 'Cobertura completa da oficina', description: 'Chegar a 100% do que a Lizy oferece para a oficina e que o cliente realmente usa.', deliverables: ['Fluxo ponta a ponta', 'Rastreabilidade completa', 'Melhoria contínua'], gate: 'Gate 5 · 100% da oficina usada', owner: 'RKM + Produto', coverage: '100%', summary: 'O RKM Service Manager cobre o conjunto completo de features comprovadamente usadas pela oficina, sem copiar módulos que o cliente não utiliza.', features: [
            { name: 'Fluxo ponta a ponta', status: 'vision', owner: 'Produto', evidence: 'Receber → Diagnosticar → Planejar → Executar → Validar → Finalizar.', acceptance: 'Uma única OS atravessa o ciclo inteiro sem controle paralelo.' },
            { name: 'Escopo validado pelo cliente', status: 'vision', owner: 'Produto + RKM', evidence: 'Só entram features com uso observado ou confirmação explícita.', acceptance: 'Cada feature possui evidência, responsável e critério de aceite.' },
            { name: 'Auditoria operacional', status: 'vision', owner: 'Gestão', evidence: 'A Lizy mantém filas, estados, finalizações e referências de OS.', acceptance: 'Reconstruir quem fez o quê, quando e em qual etapa.' },
            { name: 'Melhoria contínua', status: 'vision', owner: 'RKM + Produto', evidence: 'Gate 5 encerra cobertura, não evolução do produto.', acceptance: 'Novas necessidades entram como novos gates sem quebrar o histórico.' },
        ]
    },
];

const STATUS_CLASS = { done: 'bg-emerald-400 text-emerald-950', active: 'bg-blue-400 text-blue-950', next: 'bg-amber-300 text-amber-950', planned: 'bg-slate-500 text-slate-100', vision: 'bg-violet-400 text-violet-950' };
const FEATURE_STATUS = { done: ['Concluída', 'tag-emerald'], active: ['Em construção', 'tag-blue'], next: ['Próxima', 'tag-amber'], planned: ['Planejada', 'tag-slate'], vision: ['Visão', 'tag-violet'] };

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
                        <div className="flex items-center px-6 mb-3">
                            {GATES.map((item, index) => <React.Fragment key={item.version}>
                                <button type="button" onClick={() => setSelectedVersion(item.version)} aria-pressed={selectedVersion === item.version} className={`flex items-center gap-3 min-w-[154px] text-left rounded-lg p-1 transition ${selectedVersion === item.version ? 'bg-blue-500/10' : 'hover:bg-slate-800/40'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-rkmbg ${STATUS_CLASS[item.status]} ${selectedVersion === item.version ? 'ring-blue-400/30' : ''}`}>{item.version}</div>
                                    <div><div className="text-sm font-semibold text-slate-200">{item.phase}</div><div className="text-xs text-slate-500">{item.statusLabel}</div></div>
                                </button>
                                {index < GATES.length - 1 && <div className={`h-0.5 flex-1 min-w-[38px] ${index < 2 ? 'bg-blue-400/70' : 'bg-slate-700'}`} />}
                            </React.Fragment>)}
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {GATES.map(item => <button type="button" key={item.version} onClick={() => setSelectedVersion(item.version)} aria-pressed={selectedVersion === item.version} className={`text-left rounded-xl border p-4 min-h-[276px] flex flex-col transition ${selectedVersion === item.version ? 'border-blue-400 bg-blue-500/[.10] shadow-lg shadow-blue-950/20 -translate-y-1' : 'border-rkmborder bg-rkmcard2/30 hover:border-slate-500'}`}>
                                <div className="flex items-start justify-between gap-2"><span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${STATUS_CLASS[item.status]}`}>{item.statusLabel}</span><span className="text-xs text-slate-500">{item.version}</span></div>
                                <h2 className="text-base font-semibold text-slate-100 mt-4">{item.title}</h2><p className="text-xs text-slate-400 leading-5 mt-2">{item.description}</p>
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
                <div className="p-5 md:p-6"><div className="flex items-center justify-between mb-4"><div><div className="text-xs uppercase tracking-wider text-slate-500">Features do gate</div><div className="text-sm text-slate-300 mt-1">{selectedGate.features.length} itens para inspecionar</div></div><div className="text-right"><div className="text-2xl font-semibold text-blue-300">{selectedGate.coverage}</div><div className="text-[11px] text-slate-500">cobertura alvo</div></div></div>
                    <div className="space-y-3">{selectedGate.features.map((feature, index) => { const [label, tag] = FEATURE_STATUS[feature.status]; return <article key={feature.name} className="rounded-xl border border-rkmborder bg-rkmcard2/25 p-4"><div className="flex flex-col xl:flex-row xl:items-start gap-3"><div className="flex items-start gap-3 flex-1"><div className="w-7 h-7 shrink-0 rounded-lg bg-blue-500/15 text-blue-300 flex items-center justify-center text-xs font-semibold">{String(index + 1).padStart(2, '0')}</div><div><h3 className="text-sm font-semibold text-slate-100">{feature.name}</h3><div className="flex flex-wrap items-center gap-2 mt-2"><span className={`tag ${tag}`}>{label}</span><span className="text-xs text-slate-500">Owner: {feature.owner}</span></div></div></div><div className="xl:max-w-[42%] text-xs text-slate-400 leading-5"><span className="text-slate-500">Evidência: </span>{feature.evidence}</div></div><div className="mt-3 pt-3 border-t border-rkmborder text-xs"><span className="text-slate-500">Critério de aceite: </span><span className="text-slate-300">{feature.acceptance}</span></div></article>; })}</div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><section className="rkm-card p-5 lg:col-span-2"><div className="flex items-center gap-2 mb-4"><span className="sec-bullet" /><h2 className="text-sm font-semibold">Como usar</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">1. Selecionar</div><p className="text-slate-500 mt-1">Clique em qualquer gate da timeline.</p></div><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">2. Inspecionar</div><p className="text-slate-500 mt-1">Leia features, evidências e owners.</p></div><div className="rounded-lg border border-rkmborder p-3"><div className="font-semibold text-slate-200">3. Aceitar</div><p className="text-slate-500 mt-1">Use o critério para decidir se avança.</p></div></div></section><section className="rkm-card p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Gate atual</div><div className="text-lg font-semibold text-blue-300 mt-2">V2 · Execução</div><p className="text-xs text-slate-400 mt-2 leading-5">O foco atual é transformar a OS em uma sequência operacional acompanhável.</p><div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full w-2/5 rounded-full bg-blue-400" /></div><div className="flex justify-between text-[11px] text-slate-500 mt-2"><span>Progresso visual</span><span>40%</span></div></section></div>
        </div>
    );
};

export { RoadmapView };

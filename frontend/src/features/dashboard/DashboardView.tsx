// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { loadServiceEntries } from '../service-entry/repository';
import { mapServiceEntryToDashboardService } from './model';
import { PriorityTag, StatusTag } from '../../shared/ui/tags';
import { LizyReferenceCard, SHOW_DEV_GUIDES } from '../../shared/dev/lizy-reference';

const KPICard = ({ label, value, hint, accent, icon }) => (
    <div className="rkm-card kpi-card">
        <div className="kpi-header">
            <div className="kpi-label text-xs text-slate-400 uppercase tracking-wide">{label}</div>
            <div className={`kpi-icon rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
        </div>
        <div className="kpi-value text-2xl font-semibold">{value}</div>
        <div className="kpi-hint text-xs text-slate-500">{hint}</div>
    </div>
);

export const DashboardView = ({ onOpenServiceEntry }) => {
    const [entries, setEntries] = useState(() => loadServiceEntries());

    useEffect(() => {
        const refreshEntries = () => setEntries(loadServiceEntries());
        window.addEventListener('storage', refreshEntries);
        return () => window.removeEventListener('storage', refreshEntries);
    }, []);

    const services = useMemo(() => entries.map(mapServiceEntryToDashboardService), [entries]);
    const open = services.filter(s => /(execu|análise|recebido|pendente)/i.test(s.status)).length;
    const blocked = services.filter(s => /bloque/i.test(s.status)).length;
    const approved = services.filter(s => /(aprovad|liberad|finalizad)/i.test(s.status)).length;
    const pending = services.filter(s => /(bloque|pendente|aguardando|triagem)/i.test(s.status)).length;

    return (
        <div className="p-4 md:p-6 space-y-6">
            {SHOW_DEV_GUIDES && (
                <LizyReferenceCard
                    source="Serviços → Desmontagem"
                    detail="Referência para visão geral das OS, status, técnico responsável e andamento operacional."
                />
            )}

            <div className="rkm-card operations-header">
                <div className="operations-identity">
                    <div className="operations-kicker">ORDENS DE SERVIÇO</div>
                    <h1 className="text-xl md:text-2xl font-semibold">Visão geral das OS</h1>
                    <p className="operations-description">Acompanhe as ordens cadastradas em Criar ordem de serviço, com status, responsável e etapa atual.</p>
                </div>
                <div className="operations-actions">
                    <div className="operations-actions-title">Ação rápida</div>
                    <button className="btn btn-primary operations-new" onClick={onOpenServiceEntry}>+ Nova OS</button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Em andamento" value={open} hint="OS cadastradas" accent="bg-blue-500/20 text-blue-300" icon="◫" />
                <KPICard label="Finalizadas / liberadas" value={approved} hint="OS concluídas" accent="bg-emerald-500/20 text-emerald-300" icon="✓" />
                <KPICard label="Bloqueados" value={blocked} hint="Segurança / rastreabilidade" accent="bg-rose-500/20 text-rose-300" icon="⊘" />
                <KPICard label="Pendências" value={pending} hint="Bloqueios e aguardando" accent="bg-amber-500/20 text-amber-300" icon="!" />
            </div>

            <div className="rkm-card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-rkmborder flex items-center gap-2 flex-wrap">
                    <span className="sec-bullet" />
                    <div className="text-sm font-semibold flex-1">Serviços — Acompanhamento Operacional</div>
                    <span className="text-xs text-slate-500">{services.length} OS cadastrada{services.length === 1 ? '' : 's'}</span>
                </div>
                {services.length === 0 ? (
                    <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma OS cadastrada ainda. Crie uma ordem de serviço para acompanhar o andamento aqui.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase tracking-wide">
                                    {['OS / Laudo', 'Origem', 'Cliente', 'Equipamento', 'Técnico', 'Data', 'Status', 'Prioridade', 'Etapa', 'Ações'].map(label => <th key={label} className="text-left font-medium px-5 py-3">{label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(service => (
                                    <tr key={service.id} className="border-t border-rkmborder hover:bg-rkmcard2/40 transition">
                                        <td className="px-5 py-3 font-medium text-slate-100">{service.id}</td>
                                        <td className="px-5 py-3"><span className="tag tag-blue">RCM</span></td>
                                        <td className="px-5 py-3 text-slate-300">{service.client}</td>
                                        <td className="px-5 py-3 text-slate-300">{service.equipment}</td>
                                        <td className="px-5 py-3 text-slate-300">{service.tech}</td>
                                        <td className="px-5 py-3 text-slate-400">{service.date}</td>
                                        <td className="px-5 py-3 text-center"><StatusTag status={service.status} className="table-tag table-status" /></td>
                                        <td className="px-5 py-3 text-center"><PriorityTag priority={service.priority} className="table-tag table-priority" /></td>
                                        <td className="px-5 py-3 text-slate-400">{service.step}/{service.stepTotal}</td>
                                        <td className="px-5 py-3 text-right"><button className="text-slate-400 hover:text-blue-300 px-2" title="Visualizar">◉</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

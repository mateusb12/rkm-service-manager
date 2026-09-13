// @ts-nocheck

import React, {
    useState,
} from 'react';

import {
    planLizyPopulation,
    populateLizyServiceEntries,
} from './populate';


const formatStoredDate = value => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(
        'pt-BR',
        {
            dateStyle: 'short',
            timeStyle: 'short',
        }
    );
};


const StatCard = ({
    label,
    value,
    hint,
}) => (
    <div className="rkm-card p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">
            {label}
        </div>

        <div className="text-2xl font-semibold mt-1">
            {value}
        </div>

        {hint && (
            <div className="text-xs text-slate-500 mt-1">
                {hint}
            </div>
        )}
    </div>
);


export const PopulatorView = () => {
    const [plan, setPlan] = useState(
        () => planLizyPopulation()
    );

    const [lastResult, setLastResult] =
        useState(null);

    const refresh = () => {
        setPlan(
            planLizyPopulation()
        );
    };


    const execute = () => {
        if (
            plan.entriesToInsert.length === 0
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Popular ${plan.entriesToInsert.length} OS ` +
            `no Recebimento / Entrada?\n\n` +
            `OS existentes serão preservadas e ignoradas.`
        );

        if (!confirmed) {
            return;
        }

        const result =
            populateLizyServiceEntries();

        setLastResult(result);

        setPlan(
            planLizyPopulation()
        );
    };


    const hasDatasetDuplicates =
        plan.duplicateDatasetRecords.length > 0;


    return (
        <div className="p-4 md:p-6 space-y-5">

            <div className="rkm-card p-5">
                <div className="text-xs uppercase tracking-wider text-blue-300">
                    Ferramentas
                </div>

                <div className="text-lg font-semibold mt-1">
                    Populador de OS
                </div>

                <div className="text-sm text-slate-400 mt-2 max-w-3xl">
                    Importa as ordens coletadas da Lizy para
                    Recebimento / Entrada sem substituir OS
                    existentes e sem inventar dados ausentes.
                </div>
            </div>


            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    label="Fonte"
                    value={plan.totalSourceRecords}
                    hint="OS coletadas da Lizy"
                />

                <StatCard
                    label="Base atual"
                    value={plan.existingEntries.length}
                    hint="OS já cadastradas"
                />

                <StatCard
                    label="Prontas"
                    value={plan.entriesToInsert.length}
                    hint="podem ser inseridas agora"
                />

                <StatCard
                    label="Já existem da fonte"
                    value={plan.skippedExisting.length}
                    hint="serão ignoradas"
                />

                <StatCard
                    label="Inválidas"
                    value={plan.invalid.length}
                    hint="faltam dados obrigatórios"
                />
            </div>


            {hasDatasetDuplicates && (
                <div className="alert-critical rounded-lg p-4 text-xs">
                    O dataset possui números de OS duplicados.
                    A população foi bloqueada.
                </div>
            )}


            {lastResult && (
                <div className="rkm-card p-4">
                    <div className="text-sm font-semibold">
                        Última execução
                    </div>

                    <div className="text-xs text-slate-400 mt-2">
                        Inseridas: {lastResult.entriesToInsert.length}
                        {' · '}
                        Já existentes: {lastResult.skippedExisting.length}
                        {' · '}
                        Inválidas: {lastResult.invalid.length}
                        {' · '}
                        Persistência: {
                            lastResult.persisted
                                ? 'OK'
                                : 'FALHOU'
                        }
                    </div>
                </div>
            )}


            <div className="rkm-card overflow-hidden">
                <div className="p-4 border-b border-rkmborder">
                    <div className="text-sm font-semibold">
                        OS já cadastradas no Recebimento / Entrada
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                        Base atual utilizada pelo Populador para detectar duplicidades.
                        Total: {plan.existingEntries.length}.
                    </div>
                </div>

                {plan.existingEntries.length === 0 ? (
                    <div className="p-6 text-sm text-slate-500">
                        Nenhuma OS cadastrada nesta base.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs uppercase tracking-wide text-slate-500">
                                    <th className="text-left px-4 py-3">
                                        OS
                                    </th>

                                    <th className="text-left px-4 py-3">
                                        Cliente
                                    </th>

                                    <th className="text-left px-4 py-3">
                                        Equipamento
                                    </th>

                                    <th className="text-left px-4 py-3">
                                        Status
                                    </th>

                                    <th className="text-left px-4 py-3">
                                        Origem
                                    </th>

                                    <th className="text-left px-4 py-3">
                                        Atualização
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {plan.existingEntries.map(entry => (
                                    <tr
                                        key={
                                            entry.id ||
                                            entry.orderNumber
                                        }
                                        className="border-t border-rkmborder"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            {
                                                entry.orderNumber ||
                                                entry.id ||
                                                '—'
                                            }
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {entry.client || '—'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-400">
                                            {entry.equipment || '—'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-300">
                                            {entry.status || '—'}
                                        </td>

                                        <td className="px-4 py-3 text-slate-400">
                                            {
                                                entry.sourceMetadata?.system === 'lizy'
                                                    ? 'Lizy'
                                                    : 'Cadastro local'
                                            }
                                        </td>

                                        <td className="px-4 py-3 text-slate-500">
                                            {
                                                formatStoredDate(
                                                    entry.updatedAt ||
                                                    entry.createdAt
                                                )
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            <div className="rkm-card overflow-hidden">
                <div className="p-4 border-b border-rkmborder flex items-center gap-3">
                    <div className="flex-1">
                        <div className="text-sm font-semibold">
                            Preview da importação
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                            Nenhuma alteração é feita até confirmar a população.
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={refresh}
                    >
                        Atualizar
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={execute}
                        disabled={
                            hasDatasetDuplicates ||
                            plan.entriesToInsert.length === 0
                        }
                    >
                        Popular {plan.entriesToInsert.length} OS
                    </button>
                </div>


                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs uppercase tracking-wide text-slate-500">
                                <th className="text-left px-4 py-3">
                                    OS
                                </th>

                                <th className="text-left px-4 py-3">
                                    Cliente
                                </th>

                                <th className="text-left px-4 py-3">
                                    Categoria RKM
                                </th>

                                <th className="text-left px-4 py-3">
                                    Equipamento
                                </th>

                                <th className="text-left px-4 py-3">
                                    Status
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {plan.entriesToInsert.map(entry => (
                                <tr
                                    key={entry.id}
                                    className="border-t border-rkmborder"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {entry.orderNumber}
                                    </td>

                                    <td className="px-4 py-3 text-slate-300">
                                        {entry.client}
                                    </td>

                                    <td className="px-4 py-3 text-slate-300">
                                        {entry.orderType}
                                    </td>

                                    <td className="px-4 py-3 text-slate-400">
                                        {entry.equipment}
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className="text-xs text-emerald-300">
                                            PRONTA
                                        </span>
                                    </td>
                                </tr>
                            ))}


                            {plan.skippedExisting.map(item => (
                                <tr
                                    key={`existing-${item.orderNumber}`}
                                    className="border-t border-rkmborder"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {item.orderNumber}
                                    </td>

                                    <td
                                        className="px-4 py-3 text-slate-500"
                                        colSpan={3}
                                    >
                                        OS já cadastrada
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500">
                                            IGNORAR
                                        </span>
                                    </td>
                                </tr>
                            ))}


                            {plan.invalid.map(item => (
                                <tr
                                    key={`invalid-${item.orderNumber}`}
                                    className="border-t border-rkmborder"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {item.orderNumber}
                                    </td>

                                    <td
                                        className="px-4 py-3 text-slate-400"
                                        colSpan={3}
                                    >
                                        Faltando: {
                                            item.missing
                                                .map(field => field.label)
                                                .join(', ')
                                        }
                                    </td>

                                    <td className="px-4 py-3">
                                        <span className="text-xs text-amber-300">
                                            INVÁLIDA
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="rkm-card p-4 text-xs text-slate-500">
                <strong className="text-slate-300">
                    Política de importação:
                </strong>
                {' '}
                N.I. e campos vazios da Lizy permanecem vazios.
                Fotos não são simuladas. Marcações de checklist
                sem associação confiável não são convertidas em
                dados operacionais.
            </div>
        </div>
    );
};

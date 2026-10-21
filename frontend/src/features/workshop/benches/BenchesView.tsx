import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, MoreHorizontal, Plus, UserRound, Wrench } from 'lucide-react';

import { mockUsers } from '../../auth';
import { BenchForm } from './BenchForm';
import type { Bench, BenchInput } from './model';
import { BenchServiceError, createBench, deleteBench, listBenches, updateBench } from './service';

type BenchPage = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; benchId: string };

type BenchFilter = 'all' | 'free' | 'occupied' | 'inactive';

const PHASES = ['Entrada', 'Peritagem', 'Orçamento', 'Execução'] as const;

// Metadados exclusivamente demonstrativos.
// A integração com o andamento real da OS será feita posteriormente.
const DEMO_ORDER_META: Record<string, { equipment: string; mechanic: string; phaseIndex: number }> =
  {
    'OS-1042': {
      equipment: 'Acumulador de bexiga',
      mechanic: 'Carlos M.',
      phaseIndex: 3,
    },
    'OS-2018': {
      equipment: 'Acumulador de pistão',
      mechanic: 'Jeferson N.',
      phaseIndex: 3,
    },
  };

function sortBenches(items: Bench[]) {
  return [...items].sort((first, second) =>
    first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

function BenchProgress({ osNumber }: { osNumber: string }) {
  const metadata = DEMO_ORDER_META[osNumber];

  if (!metadata) {
    return <p className="text-xs text-slate-500">Andamento da OS ainda não disponível.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Etapa da OS
        </span>
        <span className="text-xs font-medium text-sky-300">{PHASES[metadata.phaseIndex]}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {PHASES.map((phase, index) => {
          const completed = index < metadata.phaseIndex;
          const current = index === metadata.phaseIndex;

          return (
            <div key={phase} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${
                  completed
                    ? 'bg-emerald-500/75'
                    : current
                      ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,.4)]'
                      : 'bg-slate-700'
                }`}
              />
              <p
                className={`mt-2 truncate text-[10px] ${
                  current ? 'font-semibold text-sky-300' : 'text-slate-500'
                }`}
                title={phase}
              >
                {phase}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BenchesView() {
  const [benches, setBenches] = useState<Bench[]>([]);
  const [page, setPage] = useState<BenchPage>({ mode: 'list' });
  const [filter, setFilter] = useState<BenchFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const employees = useMemo(
    () =>
      mockUsers
        .filter((user) => user.role === 'mechanic')
        .map((user) => ({ id: user.id, name: user.name })),
    [],
  );

  const employeeNames = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee.name])),
    [employees],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      setBenches(sortBenches(await listBenches()));
    } catch {
      setLoadError('Não foi possível carregar as bancadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: benches.length,
      free: benches.filter((bench) => bench.active && !bench.occupations.length).length,
      occupied: benches.filter((bench) => bench.active && bench.occupations.length > 0).length,
      inactive: benches.filter((bench) => !bench.active).length,
    }),
    [benches],
  );

  const visibleBenches = useMemo(
    () =>
      benches.filter((bench) => {
        const occupied = bench.occupations.length > 0;

        if (filter === 'free') return bench.active && !occupied;
        if (filter === 'occupied') return bench.active && occupied;
        if (filter === 'inactive') return !bench.active;
        return true;
      }),
    [benches, filter],
  );

  const metrics: {
    key: BenchFilter;
    label: string;
    value: number;
    valueColor: string;
  }[] = [
    { key: 'all', label: 'Total de bancadas', value: counts.all, valueColor: 'text-slate-100' },
    { key: 'free', label: 'Livres', value: counts.free, valueColor: 'text-emerald-300' },
    { key: 'occupied', label: 'Ocupadas', value: counts.occupied, valueColor: 'text-amber-300' },
    { key: 'inactive', label: 'Inativas', value: counts.inactive, valueColor: 'text-slate-400' },
  ];

  function openCreate() {
    setSuccess('');
    setActionError('');
    setPage({ mode: 'create' });
  }

  function openEdit(benchId: string) {
    setSuccess('');
    setActionError('');
    setPage({ mode: 'edit', benchId });
  }

  function returnToList() {
    setPage({ mode: 'list' });
    setPendingDeleteId(null);
  }

  async function save(input: BenchInput, id: string | null) {
    const saved = id ? await updateBench(id, input) : await createBench(input);

    setBenches((previous) =>
      sortBenches(
        id ? previous.map((bench) => (bench.id === id ? saved : bench)) : [...previous, saved],
      ),
    );

    setSuccess(id ? 'Bancada atualizada com sucesso.' : 'Bancada cadastrada com sucesso.');
    setFilter('all');
    returnToList();
  }

  async function remove(id: string) {
    setDeletingId(id);
    setActionError('');

    try {
      await deleteBench(id);
      setBenches((previous) => previous.filter((bench) => bench.id !== id));
      setSuccess('Bancada excluída com sucesso.');
      setPendingDeleteId(null);
    } catch (error) {
      setActionError(
        error instanceof BenchServiceError && error.code === 'occupied'
          ? 'Esta bancada está ocupada. Libere a OS antes de excluí-la.'
          : 'Não foi possível excluir a bancada.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (page.mode !== 'list') {
    const editingBench =
      page.mode === 'edit' ? benches.find((bench) => bench.id === page.benchId) : undefined;

    if (page.mode === 'edit' && !editingBench) {
      return (
        <main className="p-4 md:p-6">
          <section className="rkm-card space-y-4 p-6">
            <h1 className="text-xl font-semibold text-slate-100">Bancada não encontrada</h1>
            <button type="button" className="btn btn-primary" onClick={returnToList}>
              Voltar para bancadas
            </button>
          </section>
        </main>
      );
    }

    return (
      <BenchForm
        key={page.mode === 'edit' ? `edit-${page.benchId}` : 'create'}
        bench={editingBench}
        employees={employees}
        onCancel={returnToList}
        onSave={save}
      />
    );
  }

  return (
    <main data-rkm-bench-board className="space-y-5 p-4 md:p-6">
      <section className="rkm-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            OFICINA · BANCADAS
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Bancadas</h1>
          <p className="mt-2 text-sm text-slate-400">
            Visualize a ocupação e gerencie os postos de trabalho da oficina.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary shrink-0 justify-center"
          disabled={loading}
          onClick={openCreate}
        >
          <Plus size={17} strokeWidth={2} />
          Nova bancada
        </button>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
          Modo demonstração
        </span>
        <span>Dados salvos apenas neste navegador.</span>
      </div>

      {success && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"
        >
          {success}
          <button type="button" onClick={() => setSuccess('')} aria-label="Fechar aviso">
            ×
          </button>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"
        >
          {actionError}
          <button type="button" onClick={() => setActionError('')} aria-label="Fechar erro">
            ×
          </button>
        </div>
      )}

      <section aria-label="Resumo da ocupação" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            type="button"
            aria-pressed={filter === metric.key}
            onClick={() => setFilter(metric.key)}
            className={`rkm-card p-4 text-left transition hover:border-blue-400/40 ${
              filter === metric.key ? 'ring-2 ring-blue-400/50' : ''
            }`}
          >
            <p className={`text-2xl font-bold tabular-nums ${metric.valueColor}`}>{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.label}</p>
          </button>
        ))}
      </section>

      {loadError && (
        <section className="rkm-card space-y-3 p-6 text-center">
          <p className="text-rose-300">{loadError}</p>
          <button type="button" className="btn btn-primary" onClick={() => void load()}>
            Tentar novamente
          </button>
        </section>
      )}

      {loading && !loadError && (
        <section className="rkm-card p-8 text-center text-sm text-slate-400">
          Carregando bancadas...
        </section>
      )}

      {!loading && !loadError && visibleBenches.length === 0 && (
        <section className="rkm-card space-y-3 p-8 text-center">
          <p className="font-medium text-slate-200">Nenhuma bancada encontrada</p>
          <p className="text-sm text-slate-400">
            {benches.length
              ? 'Não há bancadas nesta situação.'
              : 'Cadastre o primeiro posto de trabalho.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={benches.length ? () => setFilter('all') : openCreate}
          >
            {benches.length ? 'Mostrar todas' : 'Nova bancada'}
          </button>
        </section>
      )}

      {!loading && !loadError && visibleBenches.length > 0 && (
        <section aria-label="Postos de trabalho" className="grid gap-4 xl:grid-cols-2">
          {visibleBenches.map((bench) => {
            const occupied = bench.occupations.length > 0;
            const currentOs = bench.occupations[0];
            const metadata = currentOs ? DEMO_ORDER_META[currentOs.number] : undefined;
            const staff = bench.employeeIds.map((id) => employeeNames.get(id)).filter(Boolean);

            return (
              <article
                key={bench.id}
                className={`rkm-card flex min-h-[315px] flex-col overflow-hidden border transition-colors ${
                  !bench.active
                    ? 'border-slate-600/40'
                    : occupied
                      ? 'border-amber-500/30'
                      : 'border-emerald-500/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-rkmborder bg-rkmcard2/60 text-slate-300">
                      <Wrench size={22} strokeWidth={1.7} />
                    </span>
                    <div>
                      <h2 className="font-semibold text-slate-100">{bench.name}</h2>
                      <p className="mt-0.5 text-xs text-slate-500">{bench.code || 'Sem código'}</p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      !bench.active
                        ? 'border-slate-500/30 bg-slate-500/10 text-slate-400'
                        : occupied
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    }`}
                  >
                    {!bench.active ? 'Inativa' : occupied ? 'Ocupada' : 'Livre'}
                  </span>
                </div>

                <div className="mx-5 border-t border-rkmborder" />

                {bench.active && occupied && currentOs ? (
                  <div className="flex flex-1 flex-col gap-5 p-5">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} className="text-sky-400" />
                        <span className="font-semibold text-sky-300">{currentOs.number}</span>
                      </div>

                      <p className="text-sm text-slate-200">
                        {metadata?.equipment || 'Equipamento não informado'}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <UserRound size={14} />
                        {metadata?.mechanic || staff.join(', ') || 'Responsável não informado'}
                      </div>
                    </div>

                    <div className="mt-auto rounded-lg border border-rkmborder bg-rkmcard2/30 p-4">
                      <BenchProgress osNumber={currentOs.number} />
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[185px] flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-full ${
                        bench.active
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      <CheckCircle2 size={28} strokeWidth={1.6} />
                    </span>

                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {bench.active ? 'Disponível para serviço' : 'Fora de operação'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {bench.active ? 'Nenhuma OS alocada' : 'Bancada desativada'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mx-5 border-t border-rkmborder" />

                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <UserRound size={14} />
                    {staff.length ? staff.join(', ') : 'Sem equipe vinculada'}
                  </span>

                  {pendingDeleteId === bench.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-rose-300">Excluir bancada?</span>
                      <button
                        type="button"
                        className="rounded-lg border border-rkmborder px-3 py-1.5 text-xs"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white"
                        disabled={deletingId === bench.id}
                        onClick={() => void remove(bench.id)}
                      >
                        Confirmar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-blue-500/25 px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/10"
                        onClick={() => openEdit(bench.id)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-rkmborder p-1.5 text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                        title={occupied ? 'Libere a OS antes de excluir' : 'Excluir bancada'}
                        aria-label={`Excluir ${bench.name}`}
                        disabled={occupied}
                        onClick={() => setPendingDeleteId(bench.id)}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      <p className="text-xs text-slate-500">
        Ocupação e andamento das OS são demonstrativos. A integração operacional será realizada
        posteriormente.
      </p>
    </main>
  );
}

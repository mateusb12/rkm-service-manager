import type { ReactNode } from 'react';

type CrudTableFilter = { key: string; label: string };

type CrudTableProps = {
  search?: {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
  };
  count?: {
    loadingLabel: string;
    count: number;
    singularLabel: string;
    pluralLabel: string;
  };
  filters?: {
    options: CrudTableFilter[];
    selectedKey: string;
    onChange: (key: string) => void;
    ariaLabel: string;
  };
  loading: boolean;
  error?: { message: string; hint?: string; onRetry: () => void };
  empty?: { title: string; description: string; actionLabel: string; onAction: () => void };
  footer?: ReactNode;
  children: ReactNode;
};

export function CrudTable({
  search,
  count,
  filters,
  loading,
  error,
  empty,
  footer,
  children,
}: CrudTableProps) {
  return (
    <section className="rkm-card overflow-hidden">
      {(search || count || filters) && (
        <div className="space-y-4 border-b border-rkmborder p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {search && (
              <div className="w-full max-w-lg">
                <label
                  htmlFor={search.id}
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  {search.label}
                </label>
                <input
                  id={search.id}
                  type="search"
                  className="rkm-input zenit-field"
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                  placeholder={search.placeholder}
                  disabled={loading}
                />
              </div>
            )}
            {count && (
              <p className="text-sm text-slate-400">
                {loading ? (
                  count.loadingLabel
                ) : (
                  <>
                    <strong className="text-slate-100">{count.count}</strong>{' '}
                    {count.count === 1 ? count.singularLabel : count.pluralLabel}
                  </>
                )}
              </p>
            )}
          </div>

          {filters && (
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={filters.ariaLabel}>
              {filters.options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="tab"
                  aria-selected={filters.selectedKey === option.key}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${filters.selectedKey === option.key ? 'border-blue-400/60 bg-blue-500/15 text-blue-300' : 'border-rkmborder text-slate-400 hover:text-slate-200'}`}
                  onClick={() => filters.onChange(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error ? (
        <div className="px-5 py-14 text-center">
          <h2 className="text-lg font-medium text-rose-300">{error.message}</h2>
          {error.hint && <p className="mt-2 text-sm text-slate-400">{error.hint}</p>}
          <button type="button" className="btn btn-primary mt-5" onClick={error.onRetry}>
            Tentar novamente
          </button>
        </div>
      ) : loading ? (
        <div className="px-5 py-14 text-center text-sm text-slate-400">
          {count?.loadingLabel || 'Carregando...'}
        </div>
      ) : empty ? (
        <div className="px-5 py-14 text-center">
          <h2 className="text-lg font-medium text-slate-200">{empty.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{empty.description}</p>
          <button type="button" className="btn btn-primary mt-5" onClick={empty.onAction}>
            {empty.actionLabel}
          </button>
        </div>
      ) : (
        children
      )}

      {footer && (
        <footer className="border-t border-rkmborder px-5 py-3 text-xs text-slate-500">
          {footer}
        </footer>
      )}
    </section>
  );
}

export function CrudTableActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        className="rounded-lg border border-blue-500/25 px-3 py-2 text-blue-300 hover:bg-blue-500/10"
        onClick={onEdit}
      >
        Editar
      </button>
      <button
        type="button"
        className="rounded-lg border border-rose-500/25 px-3 py-2 text-rose-300 hover:bg-rose-500/10"
        onClick={onDelete}
      >
        Excluir
      </button>
    </div>
  );
}

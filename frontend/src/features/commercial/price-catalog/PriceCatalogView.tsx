import { useCallback, useEffect, useMemo, useState } from 'react';

import { formatPriceCents } from '../../../utils/currency';
import { normalizeText } from '../../../utils/text';
import { PriceCatalogForm } from './PriceCatalogForm';
import { CrudTable, CrudTableActions } from '../../../shared/ui/CrudTable';
import { PRICE_CATALOG_TYPE_LABELS, type PriceCatalogInput, type PriceCatalogItem } from './model';
import {
  createPriceCatalogItem,
  getPriceCatalogItem,
  listPriceCatalogItems,
  removePriceCatalogItem,
  updatePriceCatalogItem,
} from './service';

type CatalogPage = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; itemId: string };
type CatalogFilter = 'active' | 'all' | 'piece' | 'product' | 'service' | 'archived';

const filters: { key: CatalogFilter; label: string }[] = [
  { key: 'active', label: 'Todos' },
  { key: 'piece', label: 'Peças' },
  { key: 'product', label: 'Produtos' },
  { key: 'service', label: 'Serviços' },
  { key: 'archived', label: 'Arquivados' },
];

const PRICE_CATALOG_TYPE_ICONS: Partial<Record<PriceCatalogItem['type'], string>> = {
  piece: '/assets/peça.png',
  service: '/assets/serviço.png',
};

export function PriceCatalogView() {
  const [items, setItems] = useState<PriceCatalogItem[]>([]);
  const [page, setPage] = useState<CatalogPage>({ mode: 'list' });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CatalogFilter>('active');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await listPriceCatalogItems());
    } catch {
      setLoadError('Não foi possível carregar a tabela de preços.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    return items
      .filter((item) => {
        if (filter === 'archived') return Boolean(item.deletedAt);
        if (item.deletedAt) return false;
        if (filter === 'active' || filter === 'all') return true;
        return item.type === filter;
      })
      .filter(
        (item) =>
          !normalizedSearch ||
          normalizeText(`${item.name} ${item.description}`).includes(normalizedSearch),
      )
      .sort((first, second) =>
        first.name.localeCompare(second.name, 'pt-BR', { sensitivity: 'base' }),
      );
  }, [filter, items, search]);

  function openCreate() {
    setSuccess('');
    setActionError('');
    setPage({ mode: 'create' });
  }

  function openEdit(itemId: string) {
    setSuccess('');
    setActionError('');
    setPage({ mode: 'edit', itemId });
  }

  function returnToList() {
    setPage({ mode: 'list' });
    setPendingDeleteId(null);
  }

  async function saveItem(input: PriceCatalogInput, itemId: string | null) {
    const saved = itemId
      ? await updatePriceCatalogItem(itemId, input)
      : await createPriceCatalogItem(input);
    setItems((previous) =>
      itemId ? previous.map((item) => (item.id === itemId ? saved : item)) : [...previous, saved],
    );
    setSuccess(itemId ? 'Cadastro atualizado com sucesso.' : 'Cadastro criado com sucesso.');
    setSearch('');
    returnToList();
  }

  async function deleteItem(itemId: string) {
    setActionError('');
    try {
      const removal = await removePriceCatalogItem(itemId);
      if (removal.mode === 'archived') {
        const archived = await getPriceCatalogItem(itemId);
        setItems((previous) => previous.map((item) => (item.id === itemId ? archived : item)));
        setSuccess('Arquivado por possuir histórico de orçamento.');
      } else {
        setItems((previous) => previous.filter((item) => item.id !== itemId));
        setSuccess('Excluído permanentemente.');
      }
      setPendingDeleteId(null);
    } catch {
      setActionError('Não foi possível excluir o cadastro.');
    }
  }

  if (page.mode !== 'list') {
    const editingItem =
      page.mode === 'edit' ? items.find((item) => item.id === page.itemId) : undefined;
    if (page.mode === 'edit' && !editingItem) {
      return (
        <main className="p-4 md:p-6">
          <section className="rkm-card space-y-4 p-6">
            <h1 className="text-xl font-semibold text-slate-100">Cadastro não encontrado</h1>
            <button type="button" className="btn btn-primary" onClick={returnToList}>
              Voltar para tabela de preços
            </button>
          </section>
        </main>
      );
    }
    return (
      <PriceCatalogForm
        key={page.mode === 'edit' ? `edit-${page.itemId}` : 'create'}
        item={editingItem}
        onCancel={returnToList}
        onSave={saveItem}
      />
    );
  }

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rkm-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            COMERCIAL · CATÁLOGO
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Tabela de preços</h1>
          <p className="mt-2 text-sm text-slate-400">
            Peças, produtos e serviços com preço de venda em BRL.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0 justify-center"
          onClick={openCreate}
          disabled={loading}
        >
          <span aria-hidden="true">＋</span> Novo cadastro
        </button>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300">
          Modo demonstração
        </span>
        <span>Dados salvos apenas neste navegador.</span>
      </div>

      {success && <Feedback kind="success" message={success} onDismiss={() => setSuccess('')} />}
      {actionError && (
        <Feedback kind="error" message={actionError} onDismiss={() => setActionError('')} />
      )}

      <CrudTable
        search={{
          id: 'price-catalog-search',
          label: 'Pesquisar no catálogo',
          value: search,
          placeholder: 'Nome ou descrição',
          onChange: setSearch,
        }}
        count={{
          loadingLabel: 'Carregando catálogo...',
          count: visibleItems.length,
          singularLabel: 'cadastro encontrado',
          pluralLabel: 'cadastros encontrados',
        }}
        filters={{
          options: filters,
          selectedKey: filter,
          onChange: (key) => setFilter(key as CatalogFilter),
          ariaLabel: 'Filtros da tabela de preços',
        }}
        loading={loading}
        error={loadError ? { message: loadError, onRetry: () => void loadItems() } : undefined}
        empty={
          visibleItems.length === 0
            ? {
                title: search.trim()
                  ? 'Nenhum cadastro encontrado'
                  : filter === 'archived'
                    ? 'Nenhum cadastro arquivado'
                    : 'Nenhum cadastro encontrado',
                description: search.trim()
                  ? 'Tente outro termo de pesquisa.'
                  : filter === 'archived'
                    ? 'Itens com histórico aparecerão aqui.'
                    : 'Cadastre o primeiro item para começar.',
                actionLabel: search.trim() ? 'Limpar pesquisa' : 'Novo cadastro',
                onAction: search.trim() ? () => setSearch('') : openCreate,
              }
            : undefined
        }
        footer="Dados mantidos em memória nesta demonstração."
      >
        {visibleItems.length > 0 && (
          <CatalogTable
            items={visibleItems}
            archived={filter === 'archived'}
            pendingDeleteId={pendingDeleteId}
            onEdit={openEdit}
            onDelete={setPendingDeleteId}
            onConfirmDelete={(id) => void deleteItem(id)}
            onCancelDelete={() => setPendingDeleteId(null)}
          />
        )}
      </CrudTable>
    </main>
  );
}

function CatalogTable({
  items,
  archived,
  pendingDeleteId,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  items: PriceCatalogItem[];
  archived: boolean;
  pendingDeleteId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-rkmcard2/40">
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="px-5 py-4 text-left font-medium">Nome</th>
            <th className="px-5 py-4 text-left font-medium">Tipo</th>
            <th className="px-5 py-4 text-left font-medium">Unidade</th>
            <th className="px-5 py-4 text-center font-medium">Preço</th>
            <th className="px-5 py-4 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-rkmborder/70">
              <td className="px-5 py-4">
                <div className="font-medium text-slate-100">{item.name}</div>
                {item.description && (
                  <div className="mt-1 max-w-md truncate text-xs text-slate-500">
                    {item.description}
                  </div>
                )}
              </td>
              <td className="px-5 py-4">
                {PRICE_CATALOG_TYPE_ICONS[item.type] ? (
                  <div className="flex w-fit flex-col items-center gap-1.5">
                    <div className="flex h-12 w-12 items-center justify-center p-1">
                      <img
                        src={PRICE_CATALOG_TYPE_ICONS[item.type]}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-medium leading-none text-sky-300">
                      {PRICE_CATALOG_TYPE_LABELS[item.type]}
                    </span>
                  </div>
                ) : (
                  <span className="tag tag-blue">{PRICE_CATALOG_TYPE_LABELS[item.type]}</span>
                )}
              </td>
              <td className="px-5 py-4 text-slate-300">{item.unit}</td>
              <td className="px-5 py-4 text-center font-medium text-slate-100">
                {formatPriceCents(item.unitPriceCents)}
              </td>
              <td className="px-5 py-4 text-right">
                {archived ? (
                  <span className="text-xs text-slate-500">Somente consulta</span>
                ) : pendingDeleteId === item.id ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-rose-300">Confirmar?</span>
                    <button
                      type="button"
                      className="text-xs text-rose-300 hover:text-rose-200"
                      onClick={() => onConfirmDelete(item.id)}
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-slate-200"
                      onClick={onCancelDelete}
                    >
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <CrudTableActions
                    onEdit={() => onEdit(item.id)}
                    onDelete={() => onDelete(item.id)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Feedback({
  kind,
  message,
  onDismiss,
}: {
  kind: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}) {
  const classes =
    kind === 'success'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${classes}`}
    >
      <span>{message}</span>
      <button
        type="button"
        aria-label="Dispensar mensagem"
        className="rounded px-2 hover:bg-white/5"
        onClick={onDismiss}
      >
        ✕
      </button>
    </div>
  );
}

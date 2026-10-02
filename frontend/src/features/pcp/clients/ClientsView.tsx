import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { ClientForm } from './ClientForm';

import {
  formatCnpj,
  normalizeText,
  onlyDigits,
  type Client,
  type ClientInput,
} from './clientModel';

type Page = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; id: number };

type Props = {
  clients: Client[];
  setClients: Dispatch<SetStateAction<Client[]>>;
};

export function ClientsView({ clients, setClients }: Props) {
  const [page, setPage] = useState<Page>({ mode: 'list' });
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const filtered = useMemo(() => {
    const term = normalizeText(search);
    const digits = onlyDigits(search);
    const cnpjSearch = /^[\d\s./-]+$/.test(search.trim());

    if (!term) return clients;

    return clients.filter((client) => {
      const nameMatch =
        normalizeText(client.razaoSocial).includes(term) ||
        normalizeText(client.nomeFantasia).includes(term);

      const cnpjMatch = cnpjSearch && digits.length > 0 && client.cnpj.includes(digits);

      return nameMatch || cnpjMatch;
    });
  }, [clients, search]);

  function openCreate() {
    setNotice('');
    setPage({ mode: 'create' });
  }

  function openEdit(id: number) {
    setNotice('');
    setPage({ mode: 'edit', id });
  }

  function returnToList() {
    setPage({ mode: 'list' });
    setDeleteId(null);
  }

  function saveClient(input: ClientInput, editingId: number | null) {
    if (editingId === null) {
      setClients((previous) => [
        ...previous,
        {
          id: Math.max(0, ...previous.map((client) => client.id)) + 1,
          ...input,
        },
      ]);

      setNotice('Cliente cadastrado com sucesso.');
    } else {
      setClients((previous) =>
        previous.map((client) => (client.id === editingId ? { ...client, ...input } : client)),
      );

      setNotice('Cliente atualizado com sucesso.');
    }

    setSearch('');
    returnToList();
  }

  function removeClient(id: number) {
    setClients((previous) => previous.filter((client) => client.id !== id));

    setDeleteId(null);
    setNotice('Cliente excluído com sucesso.');
  }

  if (page.mode !== 'list') {
    const editingClient =
      page.mode === 'edit' ? clients.find((client) => client.id === page.id) : undefined;

    if (page.mode === 'edit' && !editingClient) {
      return (
        <main className="p-4 md:p-6">
          <section className="rkm-card space-y-4 p-6">
            <h1 className="text-xl font-semibold text-slate-100">Cliente não encontrado</h1>

            <button type="button" className="btn btn-primary" onClick={returnToList}>
              Voltar para clientes
            </button>
          </section>
        </main>
      );
    }

    return (
      <ClientForm
        key={page.mode === 'edit' ? `edit-${page.id}` : 'create'}
        client={editingClient}
        clients={clients}
        onCancel={returnToList}
        onSave={saveClient}
      />
    );
  }

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rkm-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            PCP · CLIENTES
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Clientes</h1>

          <p className="mt-2 text-sm text-slate-400">Gerencie os clientes cadastrados na RKM.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary shrink-0 justify-center"
          onClick={openCreate}
        >
          <span aria-hidden="true">＋</span>
          Novo cliente
        </button>
      </section>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <span>{notice}</span>

          <button
            type="button"
            aria-label="Dispensar mensagem"
            className="rounded px-2 hover:bg-emerald-500/10"
            onClick={() => setNotice('')}
          >
            ✕
          </button>
        </div>
      )}

      <section className="rkm-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-rkmborder p-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-lg">
            <label
              htmlFor="clients-search"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Pesquisar clientes
            </label>

            <input
              id="clients-search"
              type="search"
              className="rkm-input zenit-field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="CNPJ, razão social ou nome fantasia"
            />
          </div>

          <p className="text-sm text-slate-400">
            <strong className="text-slate-100">{filtered.length}</strong>{' '}
            {filtered.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="text-lg font-medium text-slate-200">
              {search.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {search.trim()
                ? 'Tente outro termo de pesquisa.'
                : 'Cadastre o primeiro cliente para começar.'}
            </p>

            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={search.trim() ? () => setSearch('') : openCreate}
            >
              {search.trim() ? 'Limpar pesquisa' : 'Novo cliente'}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-sm">
              <thead className="bg-rkmcard2/40">
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th scope="col" className="px-5 py-4 text-left font-medium">
                    Razão social
                  </th>

                  <th scope="col" className="px-5 py-4 text-left font-medium">
                    Nome fantasia
                  </th>

                  <th scope="col" className="px-5 py-4 text-left font-medium">
                    CNPJ
                  </th>

                  <th scope="col" className="px-5 py-4 text-right font-medium">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-rkmborder transition-colors hover:bg-rkmcard2/40"
                  >
                    <td className="px-5 py-4 font-medium text-slate-100">{client.razaoSocial}</td>

                    <td className="px-5 py-4 text-slate-300">{client.nomeFantasia}</td>

                    <td className="whitespace-nowrap px-5 py-4 font-mono text-slate-400">
                      {formatCnpj(client.cnpj)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {deleteId === client.id ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-rose-300">Excluir?</span>

                          <button
                            type="button"
                            className="rounded-lg border border-rkmborder px-3 py-2 text-slate-300 hover:bg-rkmcard2"
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-300 hover:bg-rose-500/20"
                            onClick={() => removeClient(client.id)}
                          >
                            Confirmar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-blue-500/25 px-3 py-2 text-blue-300 hover:bg-blue-500/10"
                            onClick={() => openEdit(client.id)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-rose-500/25 px-3 py-2 text-rose-300 hover:bg-rose-500/10"
                            onClick={() => setDeleteId(client.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="border-t border-rkmborder px-5 py-3 text-xs text-slate-500">
          Dados demonstrativos em memória. Recarregar a aplicação restaura o cadastro inicial.
        </footer>
      </section>
    </main>
  );
}

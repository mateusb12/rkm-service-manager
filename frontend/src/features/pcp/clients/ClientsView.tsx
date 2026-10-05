import { useCallback, useEffect, useMemo, useState } from 'react';

import { ClientForm } from './ClientForm';

import {
  formatCnpj,
  normalizeText,
  onlyDigits,
  type Client,
  type ClientInput,
} from './clientModel';

import { createClient, deleteClient, listClients, updateClient } from './service';

type ClientPage = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; clientId: number };

function sortClients(clients: Client[]): Client[] {
  return [...clients].sort((firstClient, secondClient) =>
    firstClient.razaoSocial.localeCompare(secondClient.razaoSocial, 'pt-BR', {
      sensitivity: 'base',
    }),
  );
}

export function ClientsView() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientPage, setClientPage] = useState<ClientPage>({ mode: 'list' });
  const [clientSearch, setClientSearch] = useState('');
  const [clientPendingDeletionId, setClientPendingDeletionId] = useState<number | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [actionErrorMessage, setActionErrorMessage] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState('');

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setLoadErrorMessage('');

    try {
      const storedClients = await listClients();

      setClients(sortClients(storedClients));
    } catch {
      setLoadErrorMessage('Não foi possível carregar os clientes.');
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeText(clientSearch);
    const searchDigits = onlyDigits(clientSearch);
    const searchingByCnpj = /^[\d\s./-]+$/.test(clientSearch.trim());

    if (!normalizedSearch) return clients;

    return clients.filter((client) => {
      const nameMatch =
        normalizeText(client.razaoSocial).includes(normalizedSearch) ||
        normalizeText(client.nomeFantasia).includes(normalizedSearch);

      const cnpjMatch =
        searchingByCnpj && searchDigits.length > 0 && client.cnpj.includes(searchDigits);

      return nameMatch || cnpjMatch;
    });
  }, [clients, clientSearch]);

  function openCreate() {
    setSuccessMessage('');
    setActionErrorMessage('');
    setClientPage({ mode: 'create' });
  }

  function openEdit(clientId: number) {
    setSuccessMessage('');
    setActionErrorMessage('');
    setClientPage({ mode: 'edit', clientId });
  }

  function returnToList() {
    setClientPage({ mode: 'list' });
    setClientPendingDeletionId(null);
  }

  async function saveClient(clientInput: ClientInput, editingClientId: number | null) {
    if (editingClientId === null) {
      const createdClient = await createClient(clientInput);

      setClients((previous) => sortClients([...previous, createdClient]));
      setSuccessMessage('Cliente cadastrado com sucesso.');
    } else {
      const updatedClient = await updateClient(editingClientId, clientInput);

      setClients((previous) =>
        sortClients(
          previous.map((client) => (client.id === editingClientId ? updatedClient : client)),
        ),
      );

      setSuccessMessage('Cliente atualizado com sucesso.');
    }

    setActionErrorMessage('');
    setClientSearch('');
    returnToList();
  }

  async function removeClient(clientId: number) {
    setDeletingClientId(clientId);
    setActionErrorMessage('');

    try {
      await deleteClient(clientId);

      setClients((previous) => previous.filter((client) => client.id !== clientId));
      setClientPendingDeletionId(null);
      setSuccessMessage('Cliente excluído com sucesso.');
    } catch {
      setActionErrorMessage('Não foi possível excluir o cliente.');
    } finally {
      setDeletingClientId(null);
    }
  }

  if (clientPage.mode !== 'list') {
    const editingClient =
      clientPage.mode === 'edit'
        ? clients.find((client) => client.id === clientPage.clientId)
        : undefined;

    if (clientPage.mode === 'edit' && !editingClient) {
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
        key={clientPage.mode === 'edit' ? `edit-${clientPage.clientId}` : 'create'}
        client={editingClient}
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
          disabled={loadingClients}
        >
          <span aria-hidden="true">＋</span>
          Novo cliente
        </button>
      </section>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <span>{successMessage}</span>

          <button
            type="button"
            aria-label="Dispensar mensagem"
            className="rounded px-2 hover:bg-emerald-500/10"
            onClick={() => setSuccessMessage('')}
          >
            ✕
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          <span>{actionErrorMessage}</span>

          <button
            type="button"
            aria-label="Dispensar erro"
            className="rounded px-2 hover:bg-rose-500/10"
            onClick={() => setActionErrorMessage('')}
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
              value={clientSearch}
              onChange={(event) => setClientSearch(event.target.value)}
              placeholder="CNPJ, razão social ou nome fantasia"
              disabled={loadingClients}
            />
          </div>

          <p className="text-sm text-slate-400">
            {loadingClients ? (
              'Carregando clientes...'
            ) : (
              <>
                <strong className="text-slate-100">{filteredClients.length}</strong>{' '}
                {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
              </>
            )}
          </p>
        </div>

        {loadErrorMessage ? (
          <div className="px-5 py-14 text-center">
            <h2 className="text-lg font-medium text-rose-300">{loadErrorMessage}</h2>

            <p className="mt-2 text-sm text-slate-400">
              Verifique a conexão com o backend e tente novamente.
            </p>

            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={() => void loadClients()}
            >
              Tentar novamente
            </button>
          </div>
        ) : loadingClients ? (
          <div className="px-5 py-14 text-center text-sm text-slate-400">
            Carregando clientes...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="text-lg font-medium text-slate-200">
              {clientSearch.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {clientSearch.trim()
                ? 'Tente outro termo de pesquisa.'
                : 'Cadastre o primeiro cliente para começar.'}
            </p>

            <button
              type="button"
              className="btn btn-primary mt-5"
              onClick={clientSearch.trim() ? () => setClientSearch('') : openCreate}
            >
              {clientSearch.trim() ? 'Limpar pesquisa' : 'Novo cliente'}
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
                {filteredClients.map((client) => (
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
                      {clientPendingDeletionId === client.id ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-xs text-rose-300">Excluir?</span>

                          <button
                            type="button"
                            className="rounded-lg border border-rkmborder px-3 py-2 text-slate-300 hover:bg-rkmcard2"
                            disabled={deletingClientId === client.id}
                            onClick={() => setClientPendingDeletionId(null)}
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-300 hover:bg-rose-500/20"
                            disabled={deletingClientId === client.id}
                            onClick={() => void removeClient(client.id)}
                          >
                            {deletingClientId === client.id ? 'Excluindo...' : 'Confirmar'}
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
                            onClick={() => setClientPendingDeletionId(client.id)}
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
          Dados persistidos no sistema RKM.
        </footer>
      </section>
    </main>
  );
}

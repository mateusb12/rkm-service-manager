import { useCallback, useEffect, useMemo, useState } from 'react';

import { CrudTable, CrudTableActions } from '../../../shared/ui/CrudTable';
import { normalizeText } from '../../../utils/text';
import { ClientForm } from './ClientForm';
import { formatCnpj, onlyDigits, type Client, type ClientInput } from './clientModel';
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
      setClients(sortClients(await listClients()));
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
          <span aria-hidden="true">＋</span> Novo cliente
        </button>
      </section>
      {successMessage && (
        <Feedback kind="success" message={successMessage} onDismiss={() => setSuccessMessage('')} />
      )}
      {actionErrorMessage && (
        <Feedback
          kind="error"
          message={actionErrorMessage}
          onDismiss={() => setActionErrorMessage('')}
        />
      )}

      <CrudTable
        search={{
          id: 'clients-search',
          label: 'Pesquisar clientes',
          value: clientSearch,
          placeholder: 'CNPJ, razão social ou nome fantasia',
          onChange: setClientSearch,
        }}
        count={{
          loadingLabel: 'Carregando clientes...',
          count: filteredClients.length,
          singularLabel: 'cliente encontrado',
          pluralLabel: 'clientes encontrados',
        }}
        loading={loadingClients}
        error={
          loadErrorMessage
            ? {
                message: loadErrorMessage,
                hint: 'Verifique a conexão com o backend e tente novamente.',
                onRetry: () => void loadClients(),
              }
            : undefined
        }
        empty={
          filteredClients.length === 0
            ? {
                title: clientSearch.trim()
                  ? 'Nenhum cliente encontrado'
                  : 'Nenhum cliente cadastrado',
                description: clientSearch.trim()
                  ? 'Tente outro termo de pesquisa.'
                  : 'Cadastre o primeiro cliente para começar.',
                actionLabel: clientSearch.trim() ? 'Limpar pesquisa' : 'Novo cliente',
                onAction: clientSearch.trim() ? () => setClientSearch('') : openCreate,
              }
            : undefined
        }
        footer="Dados persistidos no sistema RKM."
      >
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
                      <CrudTableActions
                        onEdit={() => openEdit(client.id)}
                        onDelete={() => setClientPendingDeletionId(client.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CrudTable>
    </main>
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

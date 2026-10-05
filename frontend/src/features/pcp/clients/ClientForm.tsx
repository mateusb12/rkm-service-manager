import { useState, type FormEvent } from 'react';

import {
  EMPTY_CLIENT,
  formatCnpj,
  onlyDigits,
  validateClient,
  type Client,
  type ClientErrors,
  type ClientInput,
} from './clientModel';

import { ClientServiceError } from './service';

type Props = {
  client?: Client;
  onCancel: () => void;
  onSave: (clientInput: ClientInput, clientId: number | null) => Promise<void>;
};

const fields: {
  key: keyof ClientInput;
  label: string;
  placeholder: string;
  maxLength: number;
}[] = [
  {
    key: 'cnpj',
    label: 'CNPJ',
    placeholder: '00.000.000/0000-00',
    maxLength: 18,
  },
  {
    key: 'razaoSocial',
    label: 'Razão social',
    placeholder: 'Nome jurídico da empresa',
    maxLength: 160,
  },
  {
    key: 'nomeFantasia',
    label: 'Nome fantasia',
    placeholder: 'Nome comercial',
    maxLength: 120,
  },
];

export function ClientForm({ client, onCancel, onSave }: Props) {
  const [clientInput, setClientInput] = useState<ClientInput>(() =>
    client
      ? {
          cnpj: formatCnpj(client.cnpj),
          razaoSocial: client.razaoSocial,
          nomeFantasia: client.nomeFantasia,
        }
      : { ...EMPTY_CLIENT },
  );

  const [validationErrors, setValidationErrors] = useState<ClientErrors>({});
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState('');
  const [savingClient, setSavingClient] = useState(false);

  const editingClient = Boolean(client);

  function changeClientField(key: keyof ClientInput, value: string) {
    setClientInput((previousClientInput) => ({
      ...previousClientInput,
      [key]: key === 'cnpj' ? formatCnpj(value) : value,
    }));

    setValidationErrors((previousValidationErrors) => ({
      ...previousValidationErrors,
      [key]: undefined,
    }));

    setSubmissionErrorMessage('');
  }

  async function submitClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const clientId = client?.id ?? null;
    const currentValidationErrors = validateClient(clientInput);

    if (Object.values(currentValidationErrors).some(Boolean)) {
      setValidationErrors(currentValidationErrors);
      return;
    }

    setSavingClient(true);
    setSubmissionErrorMessage('');

    try {
      await onSave(
        {
          cnpj: onlyDigits(clientInput.cnpj),
          razaoSocial: clientInput.razaoSocial.trim(),
          nomeFantasia: clientInput.nomeFantasia.trim(),
        },
        clientId,
      );
    } catch (caughtError) {
      if (caughtError instanceof ClientServiceError) {
        const serviceValidationErrors: ClientErrors = {
          ...caughtError.fieldErrors,
        };

        if (caughtError.errorCode === 'cnpj_already_exists') {
          serviceValidationErrors.cnpj = 'Este CNPJ já está cadastrado.';
        }

        if (Object.values(serviceValidationErrors).some(Boolean)) {
          setValidationErrors(serviceValidationErrors);
          return;
        }

        if (caughtError.errorCode === 'permission_denied') {
          setSubmissionErrorMessage('Você não tem permissão para alterar clientes.');
          return;
        }
      }

      setSubmissionErrorMessage(
        editingClient
          ? 'Não foi possível salvar as alterações do cliente.'
          : 'Não foi possível cadastrar o cliente.',
      );
    } finally {
      setSavingClient(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <nav aria-label="Navegação de clientes">
        <button
          type="button"
          className="text-sm text-blue-400 hover:text-blue-300 focus-visible:underline"
          onClick={onCancel}
          disabled={savingClient}
        >
          ← Clientes
        </button>

        <span className="mx-2 text-slate-500">/</span>

        <span className="text-sm text-slate-300">
          {editingClient ? 'Editar cliente' : 'Novo cliente'}
        </span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          PCP · CLIENTES
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          {editingClient ? client?.nomeFantasia || 'Editar cliente' : 'Novo cliente'}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          {editingClient
            ? 'Atualize os dados cadastrais deste cliente.'
            : 'Preencha os dados para cadastrar um cliente.'}
        </p>
      </header>

      {submissionErrorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {submissionErrorMessage}
        </div>
      )}

      <form onSubmit={submitClient} noValidate>
        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5 md:px-6">
            <h2 className="font-semibold text-slate-100">Informações da empresa</h2>

            <p className="mt-1 text-sm text-slate-400">
              Identificação básica para utilização no PCP.
            </p>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            {fields.map((field) => {
              const fieldError = validationErrors[field.key];
              const inputId = `client-${field.key}`;

              return (
                <div
                  key={field.key}
                  className={field.key === 'cnpj' ? 'md:col-span-2 md:max-w-sm' : ''}
                >
                  <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    {field.label}
                    <span className="ml-1 text-rose-400">*</span>
                  </label>

                  <input
                    id={inputId}
                    name={field.key}
                    type="text"
                    className={
                      'rkm-input zenit-field ' +
                      'focus-visible:ring-2 focus-visible:ring-blue-400/30 ' +
                      (fieldError ? '!border-rose-500' : '')
                    }
                    value={clientInput[field.key]}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    inputMode={field.key === 'cnpj' ? 'numeric' : 'text'}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? `${inputId}-error` : undefined}
                    disabled={savingClient}
                    onChange={(event) => changeClientField(field.key, event.target.value)}
                  />

                  {fieldError && (
                    <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-rose-400">
                      {fieldError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-rkmborder p-4 md:px-6">
            <p className="text-xs text-slate-500">
              * Campos obrigatórios. O CNPJ é verificado por tamanho nesta etapa; duplicidade é
              validada pelo sistema ao salvar.
            </p>
          </div>
        </section>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost justify-center"
            onClick={onCancel}
            disabled={savingClient}
          >
            Cancelar
          </button>

          <button type="submit" className="btn btn-primary justify-center" disabled={savingClient}>
            {savingClient ? 'Salvando...' : editingClient ? 'Salvar alterações' : 'Salvar cliente'}
          </button>
        </div>
      </form>
    </main>
  );
}

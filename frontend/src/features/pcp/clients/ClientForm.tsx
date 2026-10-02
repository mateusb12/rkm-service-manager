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

type Props = {
  client?: Client;
  clients: Client[];
  onCancel: () => void;
  onSave: (data: ClientInput, id: number | null) => void;
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

export function ClientForm({ client, clients, onCancel, onSave }: Props) {
  const [data, setData] = useState<ClientInput>(() =>
    client
      ? {
          cnpj: formatCnpj(client.cnpj),
          razaoSocial: client.razaoSocial,
          nomeFantasia: client.nomeFantasia,
        }
      : { ...EMPTY_CLIENT },
  );

  const [errors, setErrors] = useState<ClientErrors>({});

  const editing = Boolean(client);

  function change(key: keyof ClientInput, value: string) {
    setData((previous) => ({
      ...previous,
      [key]: key === 'cnpj' ? formatCnpj(value) : value,
    }));

    setErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = client?.id ?? null;
    const validation = validateClient(data, clients, id);

    if (Object.values(validation).some(Boolean)) {
      setErrors(validation);
      return;
    }

    onSave(
      {
        cnpj: onlyDigits(data.cnpj),
        razaoSocial: data.razaoSocial.trim(),
        nomeFantasia: data.nomeFantasia.trim(),
      },
      id,
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <nav aria-label="Navegação de clientes">
        <button
          type="button"
          className="text-sm text-blue-400 hover:text-blue-300 focus-visible:underline"
          onClick={onCancel}
        >
          ← Clientes
        </button>
        <span className="mx-2 text-slate-500">/</span>
        <span className="text-sm text-slate-300">
          {editing ? 'Editar cliente' : 'Novo cliente'}
        </span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          PCP · CLIENTES
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          {editing ? client?.nomeFantasia || 'Editar cliente' : 'Novo cliente'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {editing
            ? 'Atualize os dados cadastrais deste cliente.'
            : 'Preencha os dados para cadastrar um cliente.'}
        </p>
      </header>

      <form onSubmit={submit} noValidate>
        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5 md:px-6">
            <h2 className="font-semibold text-slate-100">Informações da empresa</h2>
            <p className="mt-1 text-sm text-slate-400">
              Identificação básica para utilização no PCP.
            </p>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            {fields.map((field) => {
              const error = errors[field.key];
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
                      (error ? '!border-rose-500' : '')
                    }
                    value={data[field.key]}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    inputMode={field.key === 'cnpj' ? 'numeric' : 'text'}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    onChange={(event) => change(field.key, event.target.value)}
                  />

                  {error && (
                    <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-rose-400">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-rkmborder p-4 md:px-6">
            <p className="text-xs text-slate-500">
              * Campos obrigatórios. O CNPJ é verificado por tamanho e duplicidade nesta etapa.
            </p>
          </div>
        </section>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost justify-center" onClick={onCancel}>
            Cancelar
          </button>

          <button type="submit" className="btn btn-primary justify-center">
            {editing ? 'Salvar alterações' : 'Salvar cliente'}
          </button>
        </div>
      </form>
    </main>
  );
}

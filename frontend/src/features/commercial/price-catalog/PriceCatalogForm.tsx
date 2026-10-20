import { useState, type FormEvent } from 'react';

import { formatPriceInput, parsePriceInput } from '../../../utils/currency';
import {
  EMPTY_PRICE_CATALOG_INPUT,
  PRICE_CATALOG_TYPE_LABELS,
  PRICE_CATALOG_TYPES,
  PRICE_CATALOG_UNITS,
  validatePriceCatalogInput,
  type PriceCatalogErrors,
  type PriceCatalogInput,
  type PriceCatalogItem,
} from './model';
import { PriceCatalogServiceError } from './service';

type Props = {
  item?: PriceCatalogItem;
  onCancel: () => void;
  onSave: (input: PriceCatalogInput, itemId: string | null) => Promise<void>;
};

export function PriceCatalogForm({ item, onCancel, onSave }: Props) {
  const [input, setInput] = useState<PriceCatalogInput>(() =>
    item ? { ...item } : { ...EMPTY_PRICE_CATALOG_INPUT },
  );
  const [priceDisplay, setPriceDisplay] = useState(() =>
    formatPriceInput(item?.unitPriceCents || 0),
  );
  const [errors, setErrors] = useState<PriceCatalogErrors>({});
  const [submissionError, setSubmissionError] = useState('');
  const [saving, setSaving] = useState(false);

  const editing = Boolean(item);

  function changeField<Key extends keyof PriceCatalogInput>(
    key: Key,
    value: PriceCatalogInput[Key],
  ) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setSubmissionError('');
  }

  function changePrice(value: string) {
    const cents = parsePriceInput(value);
    setPriceDisplay(cents ? formatPriceInput(cents) : '');
    changeField('unitPriceCents', cents);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentErrors = validatePriceCatalogInput(input);

    if (Object.values(currentErrors).some(Boolean)) {
      setErrors(currentErrors);
      return;
    }

    setSaving(true);
    setSubmissionError('');

    try {
      await onSave(
        { ...input, name: input.name.trim(), description: input.description.trim() },
        item?.id || null,
      );
    } catch (error) {
      if (
        error instanceof PriceCatalogServiceError &&
        error.errorCode === 'price_catalog_item_archived'
      ) {
        setSubmissionError('Cadastros arquivados ficam disponíveis apenas para consulta.');
      } else {
        setSubmissionError(
          editing ? 'Não foi possível salvar as alterações.' : 'Não foi possível criar o cadastro.',
        );
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <nav aria-label="Navegação da tabela de preços">
        <button
          type="button"
          className="text-sm text-blue-400 hover:text-blue-300"
          onClick={onCancel}
          disabled={saving}
        >
          ← Tabela de preços
        </button>
        <span className="mx-2 text-slate-500">/</span>
        <span className="text-sm text-slate-300">
          {editing ? 'Editar cadastro' : 'Novo cadastro'}
        </span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          COMERCIAL · TABELA DE PREÇOS
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          {editing ? item?.name : 'Novo cadastro'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {editing
            ? 'Atualize as informações do item do catálogo.'
            : 'Cadastre uma peça, produto ou serviço no catálogo.'}
        </p>
      </header>

      {submissionError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {submissionError}
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5 md:px-6">
            <h2 className="font-semibold text-slate-100">Informações do cadastro</h2>
            <p className="mt-1 text-sm text-slate-400">
              O preço será usado como valor fixo em novos orçamentos.
            </p>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <Field label="Nome" required error={errors.name}>
              <input
                id="price-name"
                className={fieldClass(Boolean(errors.name))}
                value={input.name}
                maxLength={160}
                placeholder="Ex.: Adaptador 45 × 41,5"
                disabled={saving}
                onChange={(event) => changeField('name', event.target.value)}
              />
            </Field>

            <Field label="Tipo" required error={errors.type}>
              <select
                id="price-type"
                className={fieldClass(Boolean(errors.type))}
                value={input.type}
                disabled={saving}
                onChange={(event) =>
                  changeField('type', event.target.value as PriceCatalogInput['type'])
                }
              >
                {PRICE_CATALOG_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PRICE_CATALOG_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Unidade" required error={errors.unit}>
              <select
                id="price-unit"
                className={fieldClass(Boolean(errors.unit))}
                value={input.unit}
                disabled={saving}
                onChange={(event) =>
                  changeField('unit', event.target.value as PriceCatalogInput['unit'])
                }
              >
                {PRICE_CATALOG_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Preço de venda" required error={errors.unitPriceCents}>
              <input
                id="price-value"
                className={fieldClass(Boolean(errors.unitPriceCents))}
                value={priceDisplay}
                placeholder="R$ 0,00"
                inputMode="numeric"
                disabled={saving}
                onChange={(event) => changePrice(event.target.value)}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Armazenado em centavos, sem arredondamento de ponto flutuante.
              </span>
            </Field>

            <Field label="Descrição" className="md:col-span-2">
              <textarea
                id="price-description"
                className={fieldClass(false)}
                rows={4}
                maxLength={500}
                value={input.description}
                placeholder="Detalhes opcionais para identificar o cadastro"
                disabled={saving}
                onChange={(event) => changeField('description', event.target.value)}
              />
            </Field>
          </div>
        </section>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost justify-center"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary justify-center" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Salvar cadastro'}
          </button>
        </div>
      </form>
    </main>
  );
}

function fieldClass(hasError: boolean) {
  return `rkm-input zenit-field focus-visible:ring-2 focus-visible:ring-blue-400/30 ${hasError ? '!border-rose-500' : ''}`;
}

function Field({
  label,
  required,
  error,
  className = '',
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

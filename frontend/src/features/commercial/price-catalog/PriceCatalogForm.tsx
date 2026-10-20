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

const PRICE_CATALOG_TYPE_ICONS: Partial<Record<PriceCatalogInput['type'], string>> = {
  piece: '/assets/peça.png',
  service: '/assets/serviço.png',
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
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">
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

            <Field label="Tipo" required error={errors.type}>
              <div
                id="price-type"
                role="group"
                aria-label="Tipo de cadastro"
                className="grid grid-cols-3 gap-3"
              >
                {PRICE_CATALOG_TYPES.map((type) => {
                  const selected = input.type === type;
                  const icon = PRICE_CATALOG_TYPE_ICONS[type];

                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={selected}
                      disabled={saving}
                      className={`flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/50 disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? 'border-blue-300/70 bg-blue-400/10 text-sky-300 shadow-[0_0_12px_rgba(59,130,246,.14)]'
                          : 'border-rkmborder bg-rkmcard2/40 text-slate-400 hover:border-blue-400/50 hover:text-slate-200'
                      }`}
                      onClick={() => changeField('type', type)}
                    >
                      <span className="flex h-12 w-12 items-center justify-center p-1">
                        {icon && (
                          <img
                            src={icon}
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain"
                          />
                        )}
                      </span>
                      <span className="text-xs font-medium">{PRICE_CATALOG_TYPE_LABELS[type]}</span>
                    </button>
                  );
                })}
              </div>
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

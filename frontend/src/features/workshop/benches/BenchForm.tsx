import { useState, type FormEvent } from 'react';

import {
  EMPTY_BENCH_INPUT,
  validateBenchInput,
  type Bench,
  type BenchErrors,
  type BenchInput,
} from './model';
import { BenchServiceError } from './service';

type Employee = { id: string; name: string };

type Props = {
  bench?: Bench;
  employees: Employee[];
  onCancel: () => void;
  onSave: (input: BenchInput, id: string | null) => Promise<void>;
};

const fieldClass = (invalid = false) =>
  `rkm-input zenit-field ${invalid ? '!border-rose-500' : ''}`;

export function BenchForm({ bench, employees, onCancel, onSave }: Props) {
  const [input, setInput] = useState<BenchInput>(() =>
    bench
      ? {
          name: bench.name,
          code: bench.code,
          description: bench.description,
          employeeIds: [...bench.employeeIds],
          active: bench.active,
        }
      : { ...EMPTY_BENCH_INPUT, employeeIds: [] },
  );

  const [errors, setErrors] = useState<BenchErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const editing = Boolean(bench);
  const occupied = Boolean(bench?.occupations.length);

  function change<Key extends keyof BenchInput>(key: Key, value: BenchInput[Key]) {
    setInput((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
    setSaveError('');
  }

  function toggleEmployee(id: string, checked: boolean) {
    change(
      'employeeIds',
      checked
        ? [...input.employeeIds, id]
        : input.employeeIds.filter((employeeId) => employeeId !== id),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateBenchInput(input);
    if (Object.values(validation).some(Boolean)) {
      setErrors(validation);
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      await onSave(input, bench?.id || null);
    } catch (error) {
      if (error instanceof BenchServiceError) {
        if (error.code === 'duplicate') {
          setSaveError('Já existe uma bancada com esse nome ou código.');
        } else if (error.code === 'occupied') {
          setSaveError('Libere a OS antes de desativar a bancada.');
        } else {
          setSaveError('Não foi possível salvar a bancada.');
        }
      } else {
        setSaveError('Não foi possível salvar a bancada.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">
          {editing ? bench?.name : 'Nova bancada'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {editing
            ? 'Atualize as informações do posto de trabalho.'
            : 'Cadastre um posto físico da oficina.'}
        </p>
      </header>

      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          {saveError}
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-5">
        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5">
            <h2 className="font-semibold text-slate-100">Informações da bancada</h2>
            <p className="mt-1 text-sm text-slate-400">Identificação do posto físico na oficina.</p>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label htmlFor="bench-name" className="mb-2 block text-sm font-medium">
                Nome <span className="text-rose-400">*</span>
              </label>
              <input
                id="bench-name"
                className={fieldClass(Boolean(errors.name))}
                value={input.name}
                maxLength={100}
                placeholder="Ex.: Bancada 03"
                disabled={saving}
                onChange={(event) => change('name', event.target.value)}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-300">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="bench-code" className="mb-2 block text-sm font-medium">
                Código
              </label>
              <input
                id="bench-code"
                className={fieldClass(Boolean(errors.code))}
                value={input.code}
                maxLength={20}
                placeholder="Ex.: B03"
                disabled={saving}
                onChange={(event) => change('code', event.target.value)}
              />
              {errors.code && <p className="mt-1 text-xs text-rose-300">{errors.code}</p>}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="bench-description" className="mb-2 block text-sm font-medium">
                Descrição
              </label>
              <textarea
                id="bench-description"
                className={fieldClass()}
                rows={3}
                maxLength={500}
                value={input.description}
                placeholder="Informações opcionais sobre a bancada"
                disabled={saving}
                onChange={(event) => change('description', event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5">
            <h2 className="font-semibold text-slate-100">Funcionários vinculados</h2>
            <p className="mt-1 text-sm text-slate-400">
              Selecione os mecânicos que normalmente trabalham nesta bancada.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {employees.length === 0 && (
              <p className="text-sm text-slate-400">
                Nenhum mecânico disponível no cadastro demonstrativo.
              </p>
            )}

            {employees.map((employee) => (
              <label
                key={employee.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-rkmborder p-3 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={input.employeeIds.includes(employee.id)}
                  disabled={saving}
                  onChange={(event) => toggleEmployee(employee.id, event.target.checked)}
                  className="h-4 w-4 accent-blue-500"
                />
                {employee.name}
              </label>
            ))}
          </div>
        </section>

        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5">
            <h2 className="font-semibold text-slate-100">Disponibilidade</h2>
          </div>

          <div className="space-y-4 p-5">
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={input.active}
                disabled={saving || occupied}
                onChange={(event) => change('active', event.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
              Bancada ativa
            </label>

            <div className="rounded-lg border border-rkmborder bg-rkmcard2/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Ocupação atual</p>
              <p className="mt-2 font-medium text-slate-100">
                {bench?.occupations.length
                  ? bench.occupations.map((item) => item.number).join(', ')
                  : 'Livre'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                A ocupação é demonstrativa. A alocação será integrada ao fluxo de OS.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost justify-center"
            disabled={saving}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary justify-center" disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Cadastrar bancada'}
          </button>
        </div>
      </form>
    </main>
  );
}

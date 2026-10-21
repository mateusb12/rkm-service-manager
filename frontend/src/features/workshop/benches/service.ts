import { BENCHES_STORAGE_KEY, type Bench, type BenchInput, type BenchOccupation } from './model';

export class BenchServiceError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'BenchServiceError';
  }
}

const demoDate = '2026-10-21T12:00:00.000Z';

function demoBench(
  id: string,
  name: string,
  code: string,
  occupations: BenchOccupation[] = [],
): Bench {
  return {
    id,
    name,
    code,
    description: '',
    employeeIds: [],
    active: true,
    occupations,
    createdAt: demoDate,
    updatedAt: demoDate,
  };
}

const demoBenches: Bench[] = [
  demoBench('bench-demo-1', 'Bancada 01', 'B01', [{ osId: 'OS-1042', number: 'OS-1042' }]),
  demoBench('bench-demo-2', 'Bancada 02', 'B02', [{ osId: 'OS-2018', number: 'OS-2018' }]),
  demoBench('bench-demo-3', 'Bancada 03', 'B03'),
  demoBench('bench-demo-4', 'Bancada 04', 'B04'),
];

function writeBenches(items: Bench[]) {
  window.localStorage.setItem(BENCHES_STORAGE_KEY, JSON.stringify(items));
}

function readBenches(): Bench[] {
  const stored = window.localStorage.getItem(BENCHES_STORAGE_KEY);

  if (stored !== null) {
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed as Bench[];
    } catch {
      // Dados demonstrativos inválidos serão reinicializados.
    }
  }

  writeBenches(demoBenches);
  return demoBenches;
}

function assertUnique(input: BenchInput, items: Bench[], ignoredId?: string) {
  const name = input.name.trim().toLocaleLowerCase('pt-BR');
  const code = input.code.trim().toLocaleLowerCase('pt-BR');

  const duplicate = items.some((item) => {
    if (item.id === ignoredId) return false;

    return (
      item.name.trim().toLocaleLowerCase('pt-BR') === name ||
      (code !== '' && item.code.trim().toLocaleLowerCase('pt-BR') === code)
    );
  });

  if (duplicate) throw new BenchServiceError('duplicate');
}

export async function listBenches(): Promise<Bench[]> {
  return readBenches();
}

export async function createBench(input: BenchInput): Promise<Bench> {
  const items = readBenches();
  assertUnique(input, items);

  const timestamp = new Date().toISOString();

  const bench: Bench = {
    ...input,
    name: input.name.trim(),
    code: input.code.trim(),
    description: input.description.trim(),
    employeeIds: [...input.employeeIds],
    id: `bench-${crypto.randomUUID?.() || Date.now()}`,
    occupations: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeBenches([...items, bench]);
  return bench;
}

export async function updateBench(id: string, input: BenchInput): Promise<Bench> {
  const items = readBenches();
  const current = items.find((item) => item.id === id);

  if (!current) throw new BenchServiceError('not_found');
  if (!input.active && current.occupations.length) {
    throw new BenchServiceError('occupied');
  }

  assertUnique(input, items, id);

  const updated: Bench = {
    ...current,
    ...input,
    name: input.name.trim(),
    code: input.code.trim(),
    description: input.description.trim(),
    employeeIds: [...input.employeeIds],
    updatedAt: new Date().toISOString(),
  };

  writeBenches(items.map((item) => (item.id === id ? updated : item)));
  return updated;
}

export async function deleteBench(id: string): Promise<void> {
  const items = readBenches();
  const current = items.find((item) => item.id === id);

  if (!current) throw new BenchServiceError('not_found');
  if (current.occupations.length) {
    throw new BenchServiceError('occupied');
  }

  writeBenches(items.filter((item) => item.id !== id));
}

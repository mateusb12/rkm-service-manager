export const BENCHES_STORAGE_KEY = 'rkm-demo-benches-v1';

export type BenchOccupation = {
  osId: string;
  number: string;
};

export type Bench = {
  id: string;
  name: string;
  code: string;
  description: string;
  employeeIds: string[];
  active: boolean;
  occupations: BenchOccupation[];
  createdAt: string;
  updatedAt: string;
};

export type BenchInput = Pick<Bench, 'name' | 'code' | 'description' | 'employeeIds' | 'active'>;

export type BenchErrors = Partial<Record<keyof BenchInput, string>>;

export const EMPTY_BENCH_INPUT: BenchInput = {
  name: '',
  code: '',
  description: '',
  employeeIds: [],
  active: true,
};

export function validateBenchInput(input: BenchInput): BenchErrors {
  const errors: BenchErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Informe o nome da bancada.';
  } else if (input.name.trim().length > 100) {
    errors.name = 'O nome deve ter até 100 caracteres.';
  }

  if (input.code.trim().length > 20) {
    errors.code = 'O código deve ter até 20 caracteres.';
  }

  return errors;
}

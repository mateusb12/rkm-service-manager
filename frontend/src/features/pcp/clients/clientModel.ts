export type Client = {
  id: number;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
};

export type ClientInput = Omit<Client, 'id'>;

export type ClientErrors = Partial<Record<keyof ClientInput, string>>;

export const EMPTY_CLIENT: ClientInput = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
};

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

export function formatCnpj(value: string): string {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function validateClient(clientInput: ClientInput): ClientErrors {
  const validationErrors: ClientErrors = {};
  const normalizedCnpj = onlyDigits(clientInput.cnpj);

  if (!normalizedCnpj) {
    validationErrors.cnpj = 'Informe o CNPJ.';
  } else if (normalizedCnpj.length !== 14) {
    validationErrors.cnpj = 'O CNPJ deve conter 14 dígitos.';
  }

  if (!clientInput.razaoSocial.trim()) {
    validationErrors.razaoSocial = 'Informe a razão social.';
  }

  if (!clientInput.nomeFantasia.trim()) {
    validationErrors.nomeFantasia = 'Informe o nome fantasia.';
  }

  return validationErrors;
}

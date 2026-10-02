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

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 1,
    cnpj: '10203040000150',
    razaoSocial: 'Metalúrgica Atlântico Ltda.',
    nomeFantasia: 'Metal Atlântico',
  },
  {
    id: 2,
    cnpj: '20304050000160',
    razaoSocial: 'Indústria Hidráulica Nordeste Ltda.',
    nomeFantasia: 'HidroNordeste',
  },
  {
    id: 3,
    cnpj: '30405060000170',
    razaoSocial: 'Comercial de Equipamentos Fortaleza Ltda.',
    nomeFantasia: 'EquipFort',
  },
  {
    id: 4,
    cnpj: '40506070000180',
    razaoSocial: 'Serviços Industriais Ceará Ltda.',
    nomeFantasia: 'SIC Industrial',
  },
];

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

export function validateClient(
  input: ClientInput,
  clients: Client[],
  editingId: number | null,
): ClientErrors {
  const errors: ClientErrors = {};
  const cnpj = onlyDigits(input.cnpj);

  if (!cnpj) {
    errors.cnpj = 'Informe o CNPJ.';
  } else if (cnpj.length !== 14) {
    errors.cnpj = 'O CNPJ deve conter 14 dígitos.';
  } else if (
    clients.some((client) => client.id !== editingId && onlyDigits(client.cnpj) === cnpj)
  ) {
    errors.cnpj = 'Este CNPJ já está cadastrado.';
  }

  if (!input.razaoSocial.trim()) {
    errors.razaoSocial = 'Informe a razão social.';
  }

  if (!input.nomeFantasia.trim()) {
    errors.nomeFantasia = 'Informe o nome fantasia.';
  }

  return errors;
}

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Ellipsis,
  Mail,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

import { formatLongDateTimeBR } from '../../../utils/formatLongDateTimeBR';
import { listUsers, type ApiUser } from './service';

type UserStatus = 'active' | 'invited' | 'suspended';
type UserRole = 'admin' | 'pcp' | 'mechanic' | 'commercial';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  lastLogin: string;
  initials: string;
  color: string;
};

type UserInput = Pick<ManagedUser, 'name' | 'email' | 'role' | 'status' | 'department'>;
type Page = { mode: 'list' } | { mode: 'create' } | { mode: 'edit'; userId: string };

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  pcp: 'PCP',
  mechanic: 'Mecânico',
  commercial: 'Comercial',
};

const statusLabels: Record<UserStatus, string> = {
  active: 'Ativo',
  invited: 'Convite pendente',
  suspended: 'Suspenso',
};

const roleClasses: Record<UserRole, string> = {
  admin: 'border-violet-400/30 bg-violet-500/10 text-violet-300',
  pcp: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  mechanic: 'border-slate-400/30 bg-slate-500/10 text-slate-300',
  commercial: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
};

const statusClasses: Record<UserStatus, string> = {
  active: 'bg-emerald-400',
  invited: 'bg-amber-400',
  suspended: 'bg-rose-400',
};

function mapApiUser(user: ApiUser): ManagedUser {
  const role = user.role as UserRole;
  const status: UserStatus = user.active ? 'active' : 'suspended';
  const departmentByRole: Record<UserRole, string> = {
    admin: 'Gestão',
    pcp: 'PCP',
    mechanic: 'Oficina',
    commercial: 'Comercial',
  };
  const colorByRole: Record<UserRole, string> = {
    admin: 'from-violet-500 to-indigo-600',
    pcp: 'from-amber-500 to-orange-600',
    mechanic: 'from-sky-500 to-cyan-600',
    commercial: 'from-blue-500 to-indigo-600',
  };

  const lastLoginLabel = formatLongDateTimeBR(user.lastLoginAt);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role in roleLabels ? role : 'mechanic',
    status,
    department: departmentByRole[role] || '—',
    lastLogin: lastLoginLabel,
    initials: initialsFor(user.name),
    color: colorByRole[role] || 'from-slate-500 to-slate-600',
  };
}

const emptyInput: UserInput = {
  name: '',
  email: '',
  role: 'mechanic',
  status: 'active',
  department: 'Oficina',
};

function initialsFor(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'US'
  );
}

export function UsersView() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState<Page>({ mode: 'list' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    void listUsers()
      .then((items) => {
        if (!cancelled) setUsers(items.map(mapApiUser));
      })
      .catch(() => {
        if (!cancelled) setLoadError('Não foi possível carregar os usuários do backend.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleUsers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return users.filter((user) => {
      const matchesSearch =
        !term ||
        `${user.name} ${user.email} ${user.department}`.toLocaleLowerCase('pt-BR').includes(term);
      return (
        matchesSearch &&
        (statusFilter === 'all' || user.status === statusFilter) &&
        (roleFilter === 'all' || user.role === roleFilter)
      );
    });
  }, [roleFilter, search, statusFilter, users]);

  function openCreate() {
    setNotice('');
    setPage({ mode: 'create' });
  }

  function openEdit(userId: string) {
    setNotice('');
    setPage({ mode: 'edit', userId });
  }

  function saveUser(input: UserInput) {
    const editingId = page.mode === 'edit' ? page.userId : null;
    const existing = editingId ? users.find((user) => user.id === editingId) : undefined;
    const saved: ManagedUser = {
      id: existing?.id || `u-${Date.now()}`,
      ...input,
      lastLogin: existing?.lastLogin || 'Ainda não acessou',
      initials: initialsFor(input.name),
      color: existing?.color || 'from-blue-500 to-cyan-600',
    };
    setUsers((current) =>
      editingId
        ? current.map((user) => (user.id === editingId ? saved : user))
        : [saved, ...current],
    );
    setPage({ mode: 'list' });
    setNotice(
      editingId
        ? 'Usuário atualizado com sucesso.'
        : 'Usuário criado com sucesso. O convite está pronto para envio.',
    );
  }

  function removeUser(userId: string) {
    setUsers((current) => current.filter((user) => user.id !== userId));
    setPendingDelete(null);
    setNotice('Usuário removido da demonstração.');
  }

  if (page.mode !== 'list') {
    const editingUser =
      page.mode === 'edit' ? users.find((user) => user.id === page.userId) : undefined;
    return (
      <UserForm user={editingUser} onCancel={() => setPage({ mode: 'list' })} onSave={saveUser} />
    );
  }

  const activeCount = users.filter((user) => user.status === 'active').length;
  const invitedCount = users.filter((user) => user.status === 'invited').length;
  const suspendedCount = users.filter((user) => user.status === 'suspended').length;

  return (
    <main className="space-y-5 p-4 md:p-6">
      <section className="rkm-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            GESTÃO · ACESSOS
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">Usuários</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Gerencie quem pode acessar o RKM Service Manager e o que cada perfil pode fazer.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0 justify-center"
          onClick={openCreate}
        >
          <Plus size={17} /> Novo usuário
        </button>
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-300">
          Dados do backend
        </span>
        <span>Nome, e-mail, perfil e status vêm do banco.</span>
      </div>

      {loadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {loadError}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          icon={<UsersRound size={18} />}
          label="Total de usuários"
          value={users.length}
          detail="cadastros no sistema"
          accent="text-blue-300"
        />
        <MetricCard
          icon={<Check size={18} />}
          label="Acessos ativos"
          value={activeCount}
          detail="podem entrar agora"
          accent="text-emerald-300"
        />
        <MetricCard
          icon={<Mail size={18} />}
          label="Convites pendentes"
          value={invitedCount}
          detail={`${suspendedCount} acesso${suspendedCount === 1 ? '' : 's'} suspenso${suspendedCount === 1 ? '' : 's'}`}
          accent="text-amber-300"
        />
      </section>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          <span>{notice}</span>
          <button type="button" aria-label="Dispensar mensagem" onClick={() => setNotice('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <section className="rkm-card overflow-hidden">
        <div className="border-b border-rkmborder p-4 md:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold text-slate-100">Todos os usuários</h2>
              <p className="mt-1 text-sm text-slate-500">
                {visibleUsers.length} de {users.length} usuários exibidos
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 sm:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <span className="sr-only">Pesquisar usuários</span>
                <input
                  className="rkm-input pl-9"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nome, e-mail ou setor"
                />
              </label>
              <FilterSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as typeof statusFilter)}
                ariaLabel="Filtrar por status"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativos</option>
                <option value="invited">Convites pendentes</option>
                <option value="suspended">Suspensos</option>
              </FilterSelect>
              <FilterSelect
                value={roleFilter}
                onChange={(value) => setRoleFilter(value as typeof roleFilter)}
                ariaLabel="Filtrar por perfil"
              >
                <option value="all">Todos os perfis</option>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-14 text-center text-sm text-slate-500">Carregando usuários…</div>
        ) : visibleUsers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <UserRound className="mx-auto text-slate-600" size={32} />
            <h3 className="mt-3 font-medium text-slate-200">Nenhum usuário encontrado</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tente limpar a busca ou ajustar os filtros.
            </p>
            <button
              type="button"
              className="btn btn-ghost mt-4"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setRoleFilter('all');
              }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-sm">
              <thead className="bg-rkmcard2/40">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5 font-medium">Usuário</th>
                  <th className="px-5 py-3.5 font-medium">Perfil</th>
                  <th className="px-5 py-3.5 font-medium">Setor</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="w-px whitespace-nowrap px-5 py-3.5 font-medium">Último acesso</th>
                  <th className="w-px whitespace-nowrap px-5 py-3.5 text-right font-medium">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-rkmborder transition-colors hover:bg-rkmcard2/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${user.color}`}
                        >
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-100">{user.name}</div>
                          <div className="truncate text-xs text-slate-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs ${roleClasses[user.role]}`}
                      >
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-400">{user.department}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusClasses[user.status]}`}
                        />
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="w-px whitespace-nowrap px-5 py-4 text-slate-400">
                      {user.lastLogin}
                    </td>
                    <td className="w-px whitespace-nowrap px-5 py-4 text-right">
                      {pendingDelete === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-rose-300">Remover?</span>
                          <button
                            type="button"
                            className="rounded-lg border border-rkmborder px-2.5 py-1.5 text-xs text-slate-300 hover:bg-rkmcard2"
                            onClick={() => setPendingDelete(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
                            onClick={() => removeUser(user.id)}
                          >
                            Confirmar
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-500/10 hover:text-blue-300"
                            aria-label={`Editar ${user.name}`}
                            title="Editar usuário"
                            onClick={() => openEdit(user.id)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300"
                            aria-label={`Remover ${user.name}`}
                            title="Remover usuário"
                            onClick={() => setPendingDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-500/10 hover:text-slate-200"
                            aria-label={`Mais opções para ${user.name}`}
                            title="Mais opções"
                          >
                            <Ellipsis size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="border-t border-rkmborder px-5 py-3 text-xs text-slate-500">
          Dica: revise os acessos suspensos e convites pendentes periodicamente.
        </footer>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  accent: string;
}) {
  return (
    <div className="rkm-card flex items-center gap-3 p-4">
      <div className={`rounded-lg bg-slate-500/10 p-2 ${accent}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <strong className="text-xl text-slate-100">{value}</strong>
          <span className="text-xs text-slate-500">{detail}</span>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{ariaLabel}</span>
      <select
        className="rkm-input min-w-[148px] pr-8"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </label>
  );
}

function UserForm({
  user,
  onCancel,
  onSave,
}: {
  user?: ManagedUser;
  onCancel: () => void;
  onSave: (input: UserInput) => void;
}) {
  const [input, setInput] = useState<UserInput>(
    user
      ? {
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
        }
      : emptyInput,
  );
  const [error, setError] = useState('');
  const editing = Boolean(user);
  const change = (key: keyof UserInput, value: string) => {
    setInput((current) => ({ ...current, [key]: value }) as UserInput);
    setError('');
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!input.name.trim() || !input.email.trim() || !input.department.trim()) {
      setError('Preencha nome, e-mail e setor para continuar.');
      return;
    }
    onSave({
      ...input,
      name: input.name.trim(),
      email: input.email.trim(),
      department: input.department.trim(),
    });
  }
  return (
    <main className="mx-auto max-w-4xl space-y-5 p-4 md:p-6">
      <nav aria-label="Navegação de usuários">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          onClick={onCancel}
        >
          <ArrowLeft size={15} /> Usuários
        </button>
        <span className="mx-2 text-slate-500">/</span>
        <span className="text-sm text-slate-300">
          {editing ? 'Editar usuário' : 'Novo usuário'}
        </span>
      </nav>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          GESTÃO · ACESSOS
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          {editing ? user?.name : 'Novo usuário'}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {editing
            ? 'Atualize o perfil e os dados de acesso deste usuário.'
            : 'Cadastre uma pessoa e defina o nível de acesso inicial.'}
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        <section className="rkm-card overflow-hidden">
          <div className="border-b border-rkmborder p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-300">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-100">Dados de acesso</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Essas informações aparecem para o administrador da conta.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <FormField label="Nome completo" required>
              <input
                className="rkm-input"
                value={input.name}
                onChange={(event) => change('name', event.target.value)}
                placeholder="Ex.: Ana Souza"
                autoFocus
              />
            </FormField>
            <FormField label="E-mail corporativo" required>
              <input
                className="rkm-input"
                type="email"
                value={input.email}
                onChange={(event) => change('email', event.target.value)}
                placeholder="nome@empresa.com.br"
              />
            </FormField>
            <FormField label="Perfil de acesso" required>
              <select
                className="rkm-input"
                value={input.role}
                onChange={(event) => change('role', event.target.value)}
              >
                {Object.entries(roleLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Setor" required>
              <input
                className="rkm-input"
                value={input.department}
                onChange={(event) => change('department', event.target.value)}
                placeholder="Ex.: Oficina"
              />
            </FormField>
            <FormField label="Status da conta">
              <select
                className="rkm-input"
                value={input.status}
                onChange={(event) => change('status', event.target.value)}
              >
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="border-t border-rkmborder px-5 py-4 text-xs text-slate-500">
            O usuário receberá as instruções de acesso no e-mail informado.
          </div>
        </section>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost justify-center" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary justify-center">
            {editing ? 'Salvar alterações' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </main>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
      {label}
      {required && <span className="ml-1 text-rose-400">*</span>}
      {children}
    </label>
  );
}

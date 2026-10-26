import { useEffect, useId, useRef, useState } from 'react';

import { listActiveUsers } from '../auth/security/service';
import type { ActiveUser } from '../auth/security/types';

type Props = {
  value: string;
  onSelect: (user: ActiveUser) => void;
  onClear: () => void;
};

export function UserSelector({ value, onSelect, onClear }: Props) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (!open || users.length > 0) return;

    let cancelled = false;
    setLoading(true);
    void listActiveUsers()
      .then((items) => {
        if (!cancelled) setUsers(items);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os usuários.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, users.length]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const visibleUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.roleLabel}`
      .toLocaleLowerCase('pt-BR')
      .includes(normalizedSearch),
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          className="rkm-input pr-9"
          value={searchTerm}
          placeholder="Nome, e-mail ou perfil"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setOpen(true);
            setError('');
          }}
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-slate-500 hover:text-slate-200"
            aria-label="Limpar usuário recebido"
            onClick={() => {
              setSearchTerm('');
              onClear();
            }}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-rkmborder bg-rkmcard shadow-xl"
        >
          {loading && <div className="px-3 py-3 text-xs text-slate-500">Carregando usuários…</div>}
          {error && <div className="px-3 py-3 text-xs text-rose-300">{error}</div>}
          {!loading && !error && visibleUsers.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500">Nenhum usuário ativo encontrado.</div>
          )}
          {!loading &&
            !error &&
            visibleUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                role="option"
                className="block w-full border-b border-rkmborder px-3 py-2.5 text-left last:border-b-0 hover:bg-rkmcard2"
                onClick={() => {
                  setSearchTerm(user.name);
                  setOpen(false);
                  onSelect(user);
                }}
              >
                <span className="block text-sm text-slate-200">{user.name}</span>
                <span className="block text-xs text-slate-500">
                  {user.roleLabel} · {user.email}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

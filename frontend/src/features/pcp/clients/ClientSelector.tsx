import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';

import { formatCnpj, type Client } from './clientModel';
import { listClients } from './service';

type Props = {
  value: string;
  onSelect: (client: Client) => void;
  onClear: () => void;
};

const SEARCH_DEBOUNCE_MS = 250;
const MINIMUM_SEARCH_LENGTH = 2;
const MAXIMUM_VISIBLE_RESULTS = 8;

function getClientDisplayName(client: Client): string {
  return client.nomeFantasia || client.razaoSocial;
}

export function ClientSelector({ value, onSelect, onClear }: Props) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [loadingClients, setLoadingClients] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');

  const normalizedSearchTerm = searchTerm.trim();

  const selectedClientMatchesValue =
    selectedClient !== null && getClientDisplayName(selectedClient) === value;

  useEffect(() => {
    if (!selectedClientMatchesValue) {
      setSelectedClient(null);
    }
  }, [selectedClientMatchesValue]);

  useEffect(() => {
    function handleOutsideMouseDown(event: MouseEvent) {
      const clickedNode = event.target;

      if (
        clickedNode instanceof Node &&
        containerRef.current &&
        !containerRef.current.contains(clickedNode)
      ) {
        setComboboxOpen(false);
        setSearchTerm('');
        setClientResults([]);
        setActiveResultIndex(-1);
        setSearchErrorMessage('');
      }
    }

    document.addEventListener('mousedown', handleOutsideMouseDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideMouseDown);
    };
  }, []);

  useEffect(() => {
    if (!comboboxOpen) {
      return;
    }

    if (normalizedSearchTerm.length > 0 && normalizedSearchTerm.length < MINIMUM_SEARCH_LENGTH) {
      setClientResults([]);
      setActiveResultIndex(-1);
      setLoadingClients(false);
      setSearchErrorMessage('');
      return;
    }

    let cancelled = false;

    const searchDelay =
      normalizedSearchTerm.length >= MINIMUM_SEARCH_LENGTH ? SEARCH_DEBOUNCE_MS : 0;

    const searchTimer = window.setTimeout(() => {
      setLoadingClients(true);
      setSearchErrorMessage('');

      void listClients(normalizedSearchTerm)
        .then((clients) => {
          if (cancelled) {
            return;
          }

          setClientResults(clients.slice(0, MAXIMUM_VISIBLE_RESULTS));
          setActiveResultIndex(-1);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }

          setClientResults([]);
          setActiveResultIndex(-1);
          setSearchErrorMessage('Não foi possível pesquisar clientes.');
        })
        .finally(() => {
          if (cancelled) {
            return;
          }

          setLoadingClients(false);
        });
    }, searchDelay);

    return () => {
      cancelled = true;
      window.clearTimeout(searchTimer);
    };
  }, [comboboxOpen, normalizedSearchTerm]);

  function openCombobox() {
    setComboboxOpen(true);
  }

  function closeCombobox() {
    setComboboxOpen(false);
    setSearchTerm('');
    setClientResults([]);
    setActiveResultIndex(-1);
    setSearchErrorMessage('');
  }

  function selectClient(client: Client) {
    setSelectedClient(client);
    setSearchTerm('');
    setClientResults([]);
    setActiveResultIndex(-1);
    setComboboxOpen(false);
    setSearchErrorMessage('');

    onSelect(client);
  }

  function clearSelection() {
    setSelectedClient(null);
    setSearchTerm('');
    setClientResults([]);
    setActiveResultIndex(-1);
    setSearchErrorMessage('');

    onClear();
  }

  function changeSearchTerm(event: ChangeEvent<HTMLInputElement>) {
    if (value) {
      setSelectedClient(null);
      onClear();
    }

    setSearchTerm(event.target.value);
    setComboboxOpen(true);
  }

  function handleKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCombobox();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      openCombobox();

      if (clientResults.length > 0) {
        setActiveResultIndex((currentIndex) =>
          currentIndex >= clientResults.length - 1 ? 0 : currentIndex + 1,
        );
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      openCombobox();

      if (clientResults.length > 0) {
        setActiveResultIndex((currentIndex) =>
          currentIndex <= 0 ? clientResults.length - 1 : currentIndex - 1,
        );
      }

      return;
    }

    if (event.key === 'Enter' && comboboxOpen) {
      event.preventDefault();

      if (activeResultIndex >= 0 && clientResults[activeResultIndex]) {
        selectClient(clientResults[activeResultIndex]);
      }
    }
  }

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget;

    if (!nextFocusedElement) {
      return;
    }

    if (nextFocusedElement instanceof Node && event.currentTarget.contains(nextFocusedElement)) {
      return;
    }

    closeCombobox();
  }

  const activeResult = activeResultIndex >= 0 ? clientResults[activeResultIndex] : null;

  const selectedClientDescription =
    selectedClientMatchesValue && selectedClient
      ? `${selectedClient.razaoSocial} · ${formatCnpj(selectedClient.cnpj)}`
      : value
        ? 'Cliente registrado nesta OS.'
        : '';

  const displayedValue =
    searchTerm ||
    (selectedClientMatchesValue && selectedClient ? getClientDisplayName(selectedClient) : value);

  return (
    <div ref={containerRef} className="relative" onBlur={handleContainerBlur}>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500"
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>

        <input
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={comboboxOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeResult ? `${listboxId}-option-${activeResult.id}` : undefined
          }
          className="rkm-input zenit-field !pl-10 !pr-20"
          value={displayedValue}
          onFocus={openCombobox}
          onChange={changeSearchTerm}
          onKeyDown={handleKeyboard}
          placeholder="CNPJ, razão social ou nome fantasia"
          autoComplete="off"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-100"
              aria-label="Limpar cliente selecionado"
              title="Limpar cliente"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearSelection}
            >
              ×
            </button>
          )}

          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-700/50 hover:text-slate-100"
            aria-label={comboboxOpen ? 'Fechar lista de clientes' : 'Abrir lista de clientes'}
            aria-expanded={comboboxOpen}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (comboboxOpen) {
                closeCombobox();
              } else {
                openCombobox();
              }
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={comboboxOpen ? 'rotate-180 transition' : 'transition'}
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {selectedClientDescription && (
        <p className="mt-1.5 truncate text-xs text-slate-500">{selectedClientDescription}</p>
      )}

      {comboboxOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Clientes"
          className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-rkmborder bg-[#0a1729] shadow-2xl shadow-black/30"
        >
          <div className="border-b border-rkmborder px-4 py-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {normalizedSearchTerm ? 'Resultados' : 'Clientes'}
            </span>
          </div>

          {normalizedSearchTerm.length === 1 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              Digite pelo menos {MINIMUM_SEARCH_LENGTH} caracteres para pesquisar.
            </div>
          ) : loadingClients ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-400">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400"
                aria-hidden="true"
              />
              Pesquisando clientes...
            </div>
          ) : searchErrorMessage ? (
            <div role="alert" className="px-4 py-4 text-sm text-rose-400">
              {searchErrorMessage}
            </div>
          ) : clientResults.length === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              {normalizedSearchTerm ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
            </div>
          ) : (
            clientResults.map((client, clientIndex) => {
              const active = clientIndex === activeResultIndex;

              const selected = selectedClientMatchesValue && selectedClient?.id === client.id;

              return (
                <button
                  id={`${listboxId}-option-${client.id}`}
                  key={client.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    'flex w-full cursor-pointer items-start gap-3 border-b border-rkmborder px-4 py-3 text-left outline-none last:border-b-0 ' +
                    (active
                      ? 'bg-blue-500/10'
                      : selected
                        ? 'bg-blue-500/5'
                        : 'hover:bg-blue-500/10')
                  }
                  onMouseEnter={() => setActiveResultIndex(clientIndex)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectClient(client)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <strong className="truncate text-sm font-medium text-slate-100">
                        {getClientDisplayName(client)}
                      </strong>

                      <span className="shrink-0 font-mono text-xs text-slate-500">
                        {formatCnpj(client.cnpj)}
                      </span>
                    </div>

                    <div className="mt-1 truncate text-xs text-slate-400">{client.razaoSocial}</div>
                  </div>

                  <span
                    className={selected ? 'mt-0.5 text-emerald-300' : 'mt-0.5 text-transparent'}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

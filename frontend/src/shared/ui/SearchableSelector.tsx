import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';

type SearchableSelectorProps<Option> = {
  value: string;
  onSelect: (option: Option) => void;
  onClear: () => void;
  onSelectCustom?: (value: string) => void;
  showCustomOption?: boolean;
  loadOptions: () => Promise<Option[]>;
  getOptionKey: (option: Option) => string | number;
  getOptionLabel: (option: Option) => string;
  getOptionDescription?: (option: Option) => string;
  getOptionIcon?: (option: Option) => string | undefined;
  filterOption?: (option: Option, searchTerm: string) => boolean;
  placeholder?: string;
  listLabel?: string;
  loadingLabel?: string;
  emptyLabel?: string;
  errorLabel?: string;
};

export function SearchableSelector<Option>({
  value,
  onSelect,
  onClear,
  onSelectCustom,
  showCustomOption = true,
  loadOptions,
  getOptionKey,
  getOptionLabel,
  getOptionDescription,
  getOptionIcon,
  filterOption,
  placeholder = 'Pesquisar',
  listLabel = 'Opções',
  loadingLabel = 'Carregando…',
  emptyLabel = 'Nenhuma opção encontrada.',
  errorLabel = 'Não foi possível carregar as opções.',
}: SearchableSelectorProps<Option>) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setSearchTerm(value), [value]);

  useEffect(() => {
    if (!open || options.length > 0) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');
    void loadOptions()
      .then((loadedOptions) => {
        if (!cancelled) setOptions(loadedOptions);
      })
      .catch(() => {
        if (!cancelled) setError(errorLabel);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [errorLabel, loadOptions, open, options.length]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setOpen(false);
        setActiveIndex(-1);
        if (onSelectCustom) setSearchTerm(value);
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [value, onSelectCustom]);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const visibleOptions = options.filter((option) =>
    filterOption
      ? filterOption(option, normalizedSearch)
      : `${getOptionLabel(option)} ${getOptionDescription?.(option) || ''}`.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
  );

  const keyboardOptions = loading || error ? [] : visibleOptions;
  const customIndex = keyboardOptions.length;
  const canSelectCustom = Boolean(onSelectCustom && showCustomOption && !loading && !error && visibleOptions.length === 0);
  const optionCount = customIndex + (canSelectCustom ? 1 : 0);

  function selectCustom() {
    const name = searchTerm.trim();
    setSearchTerm(name);
    setOpen(false);
    setActiveIndex(-1);
    onSelectCustom?.(name);
  }

  function selectOption(option: Option) {
    setSearchTerm(getOptionLabel(option));
    setOpen(false);
    setActiveIndex(-1);
    onSelect(option);
  }

  function handleKeyboard(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      if (onSelectCustom) setSearchTerm(value);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);

      if (optionCount > 0) {
        setActiveIndex((current) => {
          if (current < 0 || current >= optionCount) {
            return event.key === 'ArrowDown' ? 0 : optionCount - 1;
          }

          const direction = event.key === 'ArrowDown' ? 1 : -1;
          return (current + direction + optionCount) % optionCount;
        });
      }

      return;
    }

    if (event.key === 'Enter' && open) {
      if (canSelectCustom && activeIndex === customIndex) {
        event.preventDefault();
        selectCustom();
      } else if (keyboardOptions[activeIndex]) {
        event.preventDefault();
        selectOption(keyboardOptions[activeIndex]);
      }
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setOpen(false);
    setActiveIndex(-1);
    if (onSelectCustom) setSearchTerm(value);
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <div className="relative">
        <input
          className="rkm-input zenit-field pr-9"
          value={searchTerm}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            !open
              ? undefined
              : canSelectCustom && activeIndex === customIndex
                ? `${listboxId}-custom`
                : keyboardOptions[activeIndex]
                  ? `${listboxId}-option-${getOptionKey(keyboardOptions[activeIndex])}`
                  : undefined
          }
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
            setError('');
          }}
          onKeyDown={handleKeyboard}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1 text-slate-500 hover:text-slate-200"
            aria-label="Limpar seleção"
            onMouseDown={(event) => event.preventDefault()}
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
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-rkmborder bg-[var(--zenit-color-page)] shadow-xl"
        >
          <div className="border-b border-rkmborder px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{listLabel}</div>
          {loading && <div className="px-3 py-3 text-xs text-slate-500">{loadingLabel}</div>}
          {error && <div className="px-3 py-3 text-xs text-rose-300">{error}</div>}
          {!loading && !error && visibleOptions.length === 0 && <div className="px-3 py-3 text-xs text-slate-500">{emptyLabel}</div>}
          {!loading &&
            !error &&
            visibleOptions.map((option, index) => (
              <button
                key={getOptionKey(option)}
                id={`${listboxId}-option-${getOptionKey(option)}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`block w-full border-b border-rkmborder px-3 py-2.5 text-left last:border-b-0 ${index === activeIndex ? 'bg-rkmcard2' : 'hover:bg-rkmcard2'}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
              >
                <span className="flex items-center gap-2.5">
                  {getOptionIcon?.(option) && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rkmborder bg-rkmcard2/60 p-1">
                      <img src={getOptionIcon(option)} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-200">{getOptionLabel(option)}</span>
                    {getOptionDescription && <span className="block truncate text-xs text-slate-500">{getOptionDescription(option)}</span>}
                  </span>
                </span>
              </button>
            ))}
          {canSelectCustom && (
            <button
              id={`${listboxId}-custom`}
              type="button"
              role="option"
              aria-selected={activeIndex === customIndex}
              className={`sticky bottom-0 block w-full border-t border-rkmborder px-3 py-2.5 text-left ${
                activeIndex === customIndex ? 'bg-rkmcard2' : 'bg-[var(--zenit-color-page)] hover:bg-rkmcard2'
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={selectCustom}
            >
              <span className="block text-sm font-medium text-sky-300">
                {searchTerm.trim() ? `+ Usar "${searchTerm.trim()}" como item avulso` : '+ Informar item avulso'}
              </span>
              <span className="block text-xs text-slate-500">Informar nome e preço sem cadastrar no catálogo</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

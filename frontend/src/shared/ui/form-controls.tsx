import React from 'react';

export const Field = ({ label, hint, children, required, error, className = '' }) =>
  React.createElement(
    'div',
    { className: 'flex flex-col gap-1.5 ' + className },
    React.createElement(
      'label',
      {
        className: 'text-xs font-medium text-slate-300 uppercase tracking-wide flex items-center gap-1.5',
      },
      label,
      ' ',
      required && React.createElement('span', { className: 'text-rose-400' }, '*'),
    ),
    children,
    hint && React.createElement('span', { className: 'text-xs text-slate-500' }, hint),
    error && React.createElement('span', { className: 'text-xs text-rose-400' }, error),
  );
export const TextInput = ({ value, onChange, placeholder, type = 'text', disabled = false }) =>
  React.createElement('input', {
    className: 'rkm-input zenit-field',
    type: type,
    value: value || '',
    placeholder: placeholder || '',
    disabled,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
  });
export const TextArea = ({ value, onChange, placeholder, rows = 3 }) =>
  React.createElement('textarea', {
    className: 'rkm-input zenit-field',
    rows: rows,
    value: value || '',
    placeholder: placeholder || '',
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value),
  });

const formatBulletText = (value) =>
  String(value || '')
    .split('\n')
    .map((line) => {
      const cleanLine = line.replace(/^\s*(?:•|[-*])\s*/, '');
      if (cleanLine) return `• ${cleanLine}`;
      return line.trim().startsWith('•') ? '• ' : '';
    })
    .filter((line) => line !== '')
    .join('\n');

export const BulletTextArea = ({ value, onChange, placeholder, rows = 4, className = '' }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const displayValue = formatBulletText(value);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    const lineStart = currentValue.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEndIndex = currentValue.indexOf('\n', start);
    const lineEnd = lineEndIndex === -1 ? currentValue.length : lineEndIndex;

    if (event.key === 'Backspace' && start === end) {
      const currentLine = currentValue.slice(lineStart, lineEnd);
      const isEmptyBullet = /^\s*•\s*$/.test(currentLine);

      if (isEmptyBullet && start <= lineStart + 2) {
        event.preventDefault();
        const removalStart = lineStart > 0 ? lineStart - 1 : lineStart;
        const removalEnd = lineEnd < currentValue.length ? lineEnd + 1 : lineEnd;
        const nextValue = formatBulletText(currentValue.slice(0, removalStart) + currentValue.slice(removalEnd));
        onChange(nextValue);

        window.requestAnimationFrame(() => {
          textareaRef.current?.setSelectionRange(removalStart, removalStart);
        });
      }
      return;
    }

    if (event.key !== 'Enter' || event.shiftKey) return;

    const currentLine = currentValue
      .slice(lineStart, start)
      .replace(/^\s*•\s*/, '')
      .trim();

    if (!currentValue.trim() || !currentLine) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    const nextDisplayValue = `${currentValue.slice(0, start)}\n• ${currentValue.slice(end)}`;
    const nextValue = formatBulletText(nextDisplayValue);
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      const nextCursorPosition = start + 3;
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  return React.createElement('textarea', {
    ref: textareaRef,
    className: `rkm-input zenit-field service-entry-bullet-textarea ${className}`.trim(),
    rows,
    value: displayValue,
    placeholder: placeholder || '',
    onKeyDown: handleKeyDown,
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(formatBulletText(event.target.value)),
  });
};
export const Select = ({ value, onChange, options, placeholder = 'Selecione...' }) =>
  React.createElement(
    'select',
    {
      className: 'rkm-input zenit-field',
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value),
    },
    React.createElement('option', { value: '' }, placeholder),
    options.map((o) => React.createElement('option', { key: o, value: o }, o)),
  );
export const Toggle = ({ checked, onChange, label }) =>
  React.createElement(
    'label',
    { className: 'rkm-check ' + (checked ? 'checked' : '') },
    React.createElement('input', {
      type: 'checkbox',
      checked: !!checked,
      onChange: (e) => onChange(e.target.checked),
    }),
    React.createElement('span', { className: 'text-sm text-slate-200' }, label),
  );
export const MultiSelectCheckboxes = ({ values = [], onChange, options, className = '' }) =>
  React.createElement(
    'div',
    { className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 ' + className },
    options.map((option) => {
      const checked = values.includes(option);
      return React.createElement(
        'label',
        { key: option, className: 'rkm-check ' + (checked ? 'checked' : '') },
        React.createElement('input', {
          type: 'checkbox',
          checked: checked,
          onChange: () => {
            onChange(checked ? values.filter((selectedValue) => selectedValue !== option) : [...values, option]);
          },
        }),
        React.createElement('span', { className: 'text-sm text-slate-200' }, option),
      );
    }),
  );

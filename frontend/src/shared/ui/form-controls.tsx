import React from 'react';

export const Field = ({ label, hint, children, required, error, className = '' }) => (React.createElement("div", { className: 'flex flex-col gap-1.5 ' + className },
    React.createElement("label", { className: "text-[12px] font-medium text-slate-300 uppercase tracking-wide flex items-center gap-1.5" },
        label,
        " ",
        required && React.createElement("span", { className: "text-rose-400" }, "*")),
    children,
    hint && React.createElement("span", { className: "text-[11px] text-slate-500" }, hint),
    error && React.createElement("span", { className: "text-[11px] text-rose-400" }, error)));
export const TextInput = ({ value, onChange, placeholder, type = 'text', disabled = false }) => (React.createElement("input", { className: "rkm-input zenit-field", type: type, value: value || '', placeholder: placeholder || '', disabled, onChange: e => onChange(e.target.value) }));
export const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (React.createElement("textarea", { className: "rkm-input zenit-field", rows: rows, value: value || '', placeholder: placeholder || '', onChange: e => onChange(e.target.value) }));
export const Select = ({ value, onChange, options, placeholder = 'Selecione...' }) => (React.createElement("select", { className: "rkm-input zenit-field", value: value || '', onChange: e => onChange(e.target.value) },
    React.createElement("option", { value: "" }, placeholder),
    options.map(o => React.createElement("option", { key: o, value: o }, o))));
export const Toggle = ({ checked, onChange, label }) => (React.createElement("label", { className: 'rkm-check ' + (checked ? 'checked' : '') },
    React.createElement("input", { type: "checkbox", checked: !!checked, onChange: e => onChange(e.target.checked) }),
    React.createElement("span", { className: "text-[13px] text-slate-200" }, label)));
export const ChipMulti = ({ values = [], onChange, options }) => (React.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, options.map(opt => {
    const checked = values.includes(opt);
    return (React.createElement("label", { key: opt, className: 'rkm-check ' + (checked ? 'checked' : '') },
        React.createElement("input", { type: "checkbox", checked: checked, onChange: () => {
                onChange(checked ? values.filter(v => v !== opt) : [...values, opt]);
            } }),
        React.createElement("span", { className: "text-[13px] text-slate-200" }, opt)));
})));

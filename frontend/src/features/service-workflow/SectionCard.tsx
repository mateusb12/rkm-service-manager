// @ts-nocheck
import React from 'react';

export const SectionCard = ({ title, subtitle, critical, children, headerRight }) => (React.createElement("div", { className: "rkm-card zenit-surface overflow-hidden" },
    React.createElement("div", { className: "px-5 py-4 border-b border-rkmborder flex items-center gap-3" },
        React.createElement("span", { className: 'w-2 h-2 rounded-full ' + (critical ? 'bg-rose-400' : 'bg-blue-400') }),
        React.createElement("div", { className: "flex-1 min-w-0" },
            React.createElement("div", { className: "text-[14.5px] font-semibold flex items-center gap-2" },
                title,
                critical && React.createElement("span", { className: "tag tag-red" }, "Etapa cr\u00EDtica")),
            subtitle && React.createElement("div", { className: "text-[12px] text-slate-400 mt-0.5" }, subtitle)),
        headerRight),
    React.createElement("div", { className: "p-5 space-y-5" }, children)));

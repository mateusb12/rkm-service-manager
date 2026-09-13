// @ts-nocheck
import React from 'react';

export const AlertBox = ({ severity = 'critical', title, children }) => (React.createElement("div", { className: (severity === 'critical' ? 'alert-critical' : severity === 'warn' ? 'alert-warn' : 'alert-info') + ' rounded-lg p-3.5 flex gap-3' },
    React.createElement("div", { className: 'shrink-0 w-7 h-7 rounded-md flex items-center justify-center ' + (severity === 'critical' ? 'bg-rose-500/20 text-rose-300' : severity === 'warn' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300') },
        React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
            React.createElement("path", { d: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" }))),
    React.createElement("div", { className: "flex-1 text-[12.5px]" },
        title && React.createElement("div", { className: "font-semibold text-slate-100 mb-0.5" }, title),
        React.createElement("div", { className: "text-slate-300 leading-relaxed" }, children))));

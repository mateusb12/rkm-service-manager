import React from 'react';

export const SHOW_DEV_GUIDES = import.meta.env.DEV;

export const LizyReferenceCard = ({ source, detail }) =>
    React.createElement(
        "div",
        { className: "rkm-card-2 p-4 flex flex-col md:flex-row md:items-center gap-3" },

        React.createElement(
            "div",
            { className: "flex-1 min-w-0" },

            React.createElement(
                "div",
                {
                    className:
                        "text-[10px] uppercase tracking-wider text-slate-500 mb-1"
                },
                "Referência atual na Lizy"
            ),

            React.createElement(
                "div",
                {
                    className:
                        "text-[13.5px] font-medium text-slate-200"
                },
                source
            ),

            detail &&
                React.createElement(
                    "div",
                    {
                        className:
                            "text-[11.5px] text-slate-500 mt-1"
                    },
                    detail
                )
        ),

        React.createElement(
            "span",
            {
                className:
                    "text-[10px] px-2 py-1 rounded-md " +
                    "border border-blue-500/25 bg-blue-500/10 text-blue-300 " +
                    "whitespace-nowrap"
            },
            "FONTE DE VERDADE"
        )
    );

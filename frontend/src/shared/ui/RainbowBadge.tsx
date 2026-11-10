import React from 'react';

const BADGE_COLORS = [
  'border-sky-300/30 bg-sky-400/15 text-sky-200',
  'border-violet-300/30 bg-violet-400/15 text-violet-200',
  'border-fuchsia-300/30 bg-fuchsia-400/15 text-fuchsia-200',
  'border-amber-300/30 bg-amber-400/15 text-amber-200',
  'border-emerald-300/30 bg-emerald-400/15 text-emerald-200',
];

function colorIndex(value: string): number {
  return (
    [...value].reduce((total, character) => total + character.charCodeAt(0), 0) %
    BADGE_COLORS.length
  );
}

type RainbowBadgeProps = {
  children: React.ReactNode;
  colorKey?: string;
};

export function RainbowBadge({ children, colorKey }: RainbowBadgeProps) {
  const key = colorKey ?? String(children);

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-medium ${BADGE_COLORS[colorIndex(key)]}`}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export type RoadmapTimebox = {
  today: Date;
  start: Date;
  deadline: Date;
  days: Date[];
  remainingDays: number;
  remainingLabel: string;
  fridays: Date[];
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatRoadmapDate(date: Date) {
  return `${date.getDate()}/${MONTHS[date.getMonth()]}`;
}

// Períodos internos de planejamento.
// Meses em JavaScript começam em zero.
const ROADMAP_VERSION_PERIODS: Record<string, { start: Date; deadline: Date }> = {
  V0: {
    start: new Date(2026, 9, 8),
    deadline: new Date(2026, 11, 8),
  },
  V1: {
    start: new Date(2026, 11, 9),
    deadline: new Date(2027, 1, 8),
  },
  V2: {
    start: new Date(2027, 1, 9),
    deadline: new Date(2027, 2, 8),
  },
  V3: {
    start: new Date(2027, 2, 9),
    deadline: new Date(2027, 4, 8),
  },
  V4: {
    start: new Date(2027, 4, 9),
    deadline: new Date(2027, 6, 8),
  },
};

export function getRoadmapVersionTimebox(versionId: string, now = new Date()): RoadmapTimebox {
  const period = ROADMAP_VERSION_PERIODS[versionId];

  if (!period) {
    throw new Error(`Período não definido para ${versionId}`);
  }

  return getRoadmapTimebox(now, period.deadline, period.start);
}

export function getRoadmapTimebox(
  now = new Date(),
  deadline = new Date(2026, 11, 8),
  start = new Date(2026, 9, 8),
): RoadmapTimebox {
  const today = startOfDay(now);
  const target = startOfDay(deadline);
  const startDate = startOfDay(start);
  const remainingDays = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
  const fridays: Date[] = [];
  const days: Date[] = [];

  for (let date = new Date(startDate); date <= target; date.setDate(date.getDate() + 1)) {
    days.push(new Date(date));
    if (date.getDay() === 5) {
      fridays.push(new Date(date));
    }
  }

  return {
    today,
    start: startDate,
    deadline: target,
    days,
    remainingDays,
    remainingLabel: `${Math.floor(remainingDays / 7)}w${remainingDays % 7}d`,
    fridays,
  };
}

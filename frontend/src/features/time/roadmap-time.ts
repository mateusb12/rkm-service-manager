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

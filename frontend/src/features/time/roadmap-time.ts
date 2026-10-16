const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export type RoadmapTimebox = {
  deadline: Date;
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
  deadline = new Date(2026, 10, 1),
): RoadmapTimebox {
  const today = startOfDay(now);
  const target = startOfDay(deadline);
  const remainingDays = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
  const fridays: Date[] = [];

  for (let date = new Date(today); date <= target; date.setDate(date.getDate() + 1)) {
    if (date.getDay() === 5) {
      fridays.push(new Date(date));
    }
  }

  return {
    deadline: target,
    remainingDays,
    remainingLabel: `${Math.floor(remainingDays / 7)}w${remainingDays % 7}d`,
    fridays,
  };
}

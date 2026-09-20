export interface DateRange {
  from: string;
  to: string;
}

export interface NormalizationWindow {
  timedStart: Date;
  timedEnd: Date;
  allDayStart: Date;
  allDayEnd: Date;
}

export const HISTORY_MONTHS = 12;
export const FUTURE_MONTHS = 2;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function formatLocalDate(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function addCalendarMonthsClamped(value: Date, months: number): Date {
  const result = new Date(value.getTime());
  const targetMonth = result.getMonth() + months;
  const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const targetDay = Math.min(result.getDate(), daysInMonth(targetYear, normalizedMonth));
  result.setDate(1);
  result.setFullYear(targetYear, normalizedMonth, targetDay);
  return result;
}

export function defaultDateRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return {
    from: formatLocalDate(start),
    to: formatLocalDate(addCalendarMonthsClamped(start, FUTURE_MONTHS)),
  };
}

export function normalizationWindow(now = new Date()): NormalizationWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = addCalendarMonthsClamped(start, FUTURE_MONTHS);
  const timedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return {
    timedStart: addCalendarMonthsClamped(start, -HISTORY_MONTHS),
    timedEnd,
    allDayStart: addCalendarMonthsClamped(start, -HISTORY_MONTHS),
    allDayEnd: end,
  };
}

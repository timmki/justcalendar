import type { CalendarOccurrence } from './calendar.js';
import { formatLocalDate } from './date-range.js';

export type EventRelevance = 'past' | 'ongoing' | 'upcoming';

export function occurrenceRelevance(occurrence: Pick<CalendarOccurrence, 'start' | 'end' | 'allDay'>, now = new Date()): EventRelevance {
  if (occurrence.allDay) {
    const today = formatLocalDate(now);
    const start = occurrence.start.slice(0, 10);
    const end = (occurrence.end ?? occurrence.start).slice(0, 10);
    if (end < today) return 'past';
    if (start > today) return 'upcoming';
    return 'ongoing';
  }

  const start = Date.parse(occurrence.start);
  const end = Date.parse(occurrence.end ?? occurrence.start);
  if (end < now.getTime()) return 'past';
  if (start > now.getTime()) return 'upcoming';
  return 'ongoing';
}
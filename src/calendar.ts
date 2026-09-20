import ICAL from 'ical.js';
import { normalizationWindow } from './date-range.js';

export interface CalendarOccurrence {
  uid: string;
  recurrenceId: string | null;
  start: string;
  end: string | null;
  allDay: boolean;
  recurring: boolean;
  title: string;
  location: string | null;
  description: string | null;
  attachments?: CalendarAttachment[];
  timeZone: string | null;
  sourceUrl: string;
}

export interface CalendarAttachment {
  url: string;
  name: string | null;
}

export interface NormalizedCalendar {
  occurrences: CalendarOccurrence[];
  partialData: boolean;
}

export interface FilterSelection {
  from: string | null;
  to: string | null;
  query: string;
}

export const MAX_OCCURRENCES = 5000;

function formatDate(value: ICAL.Time, allDay: boolean): string {
  if (allDay) {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
  }
  return value.toJSDate().toISOString();
}

function eventOccurrence(
  event: ICAL.Event,
  sourceUrl: string,
  start: ICAL.Time,
  end: ICAL.Time | null,
  recurrenceId: ICAL.Time | null,
  recurring: boolean,
): CalendarOccurrence {
  const allDay = start.isDate;
  const summary = typeof event.summary === 'string' && event.summary.trim() ? event.summary.trim() : 'Untitled event';
  const location = typeof event.location === 'string' && event.location.trim() ? event.location.trim() : null;
  const description = typeof event.description === 'string' && event.description.trim() ? event.description.trim() : null;
  const attachments = event.component.getAllProperties('attach').flatMap((property): CalendarAttachment[] => {
    if (property.getFirstParameter('value')?.toLowerCase() === 'binary') return [];
    const value = property.getFirstValue();
    if (typeof value !== 'string') return [];
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return [];
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return [];
    const rawName = property.getFirstParameter('filename');
    const name = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : null;
    return [{ url: url.toString(), name }];
  });
  return {
    uid: event.uid,
    recurrenceId: recurrenceId ? formatDate(recurrenceId, recurrenceId.isDate) : null,
    start: formatDate(start, allDay),
    end: end ? formatDate(end, allDay) : null,
    allDay,
    recurring,
    title: summary,
    location,
    description,
    attachments,
    timeZone: start.zone?.tzid ?? null,
    sourceUrl,
  };
}

function isExcluded(event: ICAL.Event, occurrence: ICAL.Time): boolean {
  return event.component.getAllProperties('exdate').some((property) =>
    property.getValues().some((excluded) => {
      if (!(excluded instanceof ICAL.Time)) return false;
      if (excluded.isDate || occurrence.isDate) {
        return excluded.year === occurrence.year && excluded.month === occurrence.month && excluded.day === occurrence.day;
      }
      return excluded.toJSDate().getTime() === occurrence.toJSDate().getTime();
    }));
}

export function normalizeCalendar(ics: string, sourceUrl: string, now = new Date()): NormalizedCalendar {
  const component = new ICAL.Component(ICAL.parse(ics));
  if (component.name !== 'vcalendar' || component.getFirstPropertyValue('version') !== '2.0') {
    throw new Error('Only iCalendar VERSION:2.0 feeds are supported.');
  }
  const events = component.getAllSubcomponents('vevent');
  const window = normalizationWindow(now);
  const windowStart = ICAL.Time.fromJSDate(window.timedStart, false);
  const allDayStart = ICAL.Time.fromJSDate(window.allDayStart, false);
  const windowEnd = ICAL.Time.fromJSDate(window.timedEnd, false);
  const allDayEnd = ICAL.Time.fromJSDate(window.allDayEnd, false);
  const occurrences: CalendarOccurrence[] = [];
  let partialData = false;
  const inWindow = (value: ICAL.Time) => {
    const start = value.isDate ? allDayStart : windowStart;
    const end = value.isDate ? allDayEnd : windowEnd;
    return value.compare(start) >= 0 && value.compare(end) <= 0;
  };

  for (const eventComponent of events) {
    if (occurrences.length >= MAX_OCCURRENCES) {
      partialData = true;
      break;
    }
    try {
      if (eventComponent.hasProperty('dtend') && eventComponent.hasProperty('duration')) {
        partialData = true;
        continue;
      }
      const event = new ICAL.Event(eventComponent);
      if (event.isRecurrenceException()) continue;
      if (!event.uid || !event.startDate) {
        partialData = true;
        continue;
      }
      const starts: ICAL.Time[] = [];
      if (event.isRecurring()) {
        const iterator = event.iterator(startDate(event));
        let next = iterator.next();
        while (next && next.compare(next.isDate ? allDayEnd : windowEnd) <= 0 && starts.length < MAX_OCCURRENCES) {
          if (!isExcluded(event, next) && inWindow(next)) starts.push(next);
          next = iterator.next();
        }
        if (next && starts.length >= MAX_OCCURRENCES) partialData = true;
      } else if (inWindow(event.startDate)) {
        starts.push(event.startDate);
      }
      for (const start of starts) {
        const details = event.isRecurring()
          ? event.getOccurrenceDetails(start)
          : { item: event, startDate: start, endDate: event.endDate, recurrenceId: null };
        const recurrenceId = details.item === event ? null : details.recurrenceId;
        occurrences.push(eventOccurrence(details.item, sourceUrl, details.startDate, details.endDate, recurrenceId, event.isRecurring() || recurrenceId !== null));
      }
    } catch {
      partialData = true;
    }
  }

  const unique = new Map<string, CalendarOccurrence>();
  for (const occurrence of occurrences) unique.set(`${occurrence.uid}:${occurrence.start}`, occurrence);
  return {
    occurrences: [...unique.values()].sort((a, b) => a.start.localeCompare(b.start)),
    partialData,
  };
}

function startDate(event: ICAL.Event): ICAL.Time {
  return event.startDate;
}

export function filterOccurrences(
  occurrences: CalendarOccurrence[],
  filters: FilterSelection,
): CalendarOccurrence[] {
  const query = filters.query.trim().toLocaleLowerCase();
  return occurrences.filter((occurrence) => {
    const day = occurrence.start.slice(0, 10);
    if (filters.from && day < filters.from) return false;
    if (filters.to && day > filters.to) return false;
    if (!query) return true;
    return [occurrence.title, occurrence.location, occurrence.description]
      .filter(Boolean)
      .some((value) => value?.toLocaleLowerCase().includes(query));
  });
}

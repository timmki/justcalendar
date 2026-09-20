import { describe, expect, it } from 'vitest';
import { occurrenceRelevance } from '../../src/relevance.js';
import type { CalendarOccurrence } from '../../src/calendar.js';

function occurrence(overrides: Partial<CalendarOccurrence>): CalendarOccurrence {
  return {
    uid: 'event',
    recurrenceId: null,
    start: '2026-09-20T10:00:00.000Z',
    end: '2026-09-20T11:00:00.000Z',
    allDay: false,
    recurring: false,
    title: 'Event',
    location: null,
    description: null,
    timeZone: null,
    sourceUrl: 'https://example.test/calendar.ics',
    ...overrides,
  };
}

describe('occurrence relevance', () => {
  const now = new Date('2026-09-20T12:00:00.000Z');

  it('marks completed timed occurrences as past', () => {
    expect(occurrenceRelevance(occurrence({ end: '2026-09-20T11:00:00.000Z' }), now)).toBe('past');
  });

  it('keeps an ongoing timed occurrence relevant', () => {
    expect(occurrenceRelevance(occurrence({ end: '2026-09-20T13:00:00.000Z' }), now)).toBe('ongoing');
  });

  it('marks a future timed occurrence as upcoming', () => {
    expect(occurrenceRelevance(occurrence({ start: '2026-09-20T13:00:00.000Z', end: '2026-09-20T14:00:00.000Z' }), now)).toBe('upcoming');
  });

  it('uses local calendar dates for all-day boundaries', () => {
    expect(occurrenceRelevance(occurrence({ allDay: true, start: '2026-09-19', end: '2026-09-20' }), now)).toBe('ongoing');
    expect(occurrenceRelevance(occurrence({ allDay: true, start: '2026-09-18', end: '2026-09-19' }), now)).toBe('past');
  });

  it('uses start when a timed occurrence has no end', () => {
    expect(occurrenceRelevance(occurrence({ start: '2026-09-20T13:00:00.000Z', end: null }), now)).toBe('upcoming');
  });
});

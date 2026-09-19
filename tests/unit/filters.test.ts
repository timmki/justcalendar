import { describe, expect, it } from 'vitest';
import { filterOccurrences, type CalendarOccurrence } from '../../src/calendar.js';

const occurrences: CalendarOccurrence[] = [
  {
    uid: 'one', recurrenceId: null, start: '2026-01-02T09:00:00.000Z', end: null, allDay: false, recurring: false,
    title: 'Planning', location: 'Room A', description: 'Team meeting', timeZone: null, sourceUrl: 'https://example.test/a.ics',
  },
  {
    uid: 'two', recurrenceId: null, start: '2026-01-10T09:00:00.000Z', end: null, allDay: false, recurring: false,
    title: 'Review', location: 'Room B', description: null, timeZone: null, sourceUrl: 'https://example.test/a.ics',
  },
];

describe('calendar filters', () => {
  it('uses inclusive date bounds and case-insensitive text matching', () => {
    expect(filterOccurrences(occurrences, { from: '2026-01-02', to: '2026-01-02', query: '' })).toHaveLength(1);
    expect(filterOccurrences(occurrences, { from: null, to: null, query: 'TEAM MEETING' })[0].uid).toBe('one');
  });

  it('returns an empty result deliberately when no event matches', () => {
    expect(filterOccurrences(occurrences, { from: null, to: null, query: 'does not exist' })).toEqual([]);
  });

  it('filters a 5,000-occurrence snapshot within the target budget', () => {
    const large = Array.from({ length: 5000 }, (_, index) => ({ ...occurrences[0], uid: `event-${index}` }));
    const started = performance.now();
    expect(filterOccurrences(large, { from: '2026-01-02', to: '2026-01-02', query: 'planning' })).toHaveLength(5000);
    expect(performance.now() - started).toBeLessThan(2000);
  });

  it('does not accept impossible or reversed URL dates', async () => {
    const { filtersFromSearch } = await import('../../src/app.js');
    expect(filtersFromSearch('?from=2026-02-30')).toEqual({ from: null, to: null, query: '' });
    expect(filtersFromSearch('?from=2026-02-03&to=2026-02-01')).toEqual({ from: null, to: null, query: '' });
  });
});

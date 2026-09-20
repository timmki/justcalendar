import { describe, expect, it } from 'vitest';
import { isValidSnapshot, type CalendarSnapshot } from '../../src/storage.js';

const url = 'https://calendar.example.test/public.ics';
const occurrence = {
  uid: 'event',
  recurrenceId: null,
  start: '2026-01-02T09:00:00.000Z',
  end: null,
  allDay: false,
  recurring: false,
  title: 'Event',
  location: null,
  description: null,
  timeZone: null,
  sourceUrl: url,
};

const snapshot: CalendarSnapshot = {
  schemaVersion: 1,
  sourceUrl: url,
  fetchedAt: '2026-01-01T00:00:00.000Z',
  occurrences: [occurrence],
  partialData: false,
};

describe('snapshot validation', () => {
  it('accepts a normalized snapshot', () => {
    expect(isValidSnapshot(snapshot, url)).toBe(true);
  });

  it('accepts legacy snapshots without attachment data and validates attachment values', () => {
    expect(isValidSnapshot(snapshot, url)).toBe(true);
    expect(isValidSnapshot({
      ...snapshot,
      occurrences: [{ ...occurrence, attachments: [{ url: 'https://files.example.test/agenda.pdf', name: 'Agenda.pdf' }] }],
    }, url)).toBe(true);
    expect(isValidSnapshot({
      ...snapshot,
      occurrences: [{ ...occurrence, attachments: [{ url: 'javascript:alert(1)', name: null }] }],
    }, url)).toBe(false);
  });

  it('rejects unsafe or oversized stored data', () => {
    expect(isValidSnapshot({ ...snapshot, sourceUrl: 'https://example.test:8443/feed.ics' }, url)).toBe(false);
    expect(isValidSnapshot({ ...snapshot, occurrences: Array.from({ length: 5001 }, () => occurrence) }, url)).toBe(false);
    expect(isValidSnapshot({ ...snapshot, occurrences: [{ ...occurrence, start: 'not-a-date' }] }, url)).toBe(false);
    expect(isValidSnapshot({ ...snapshot, occurrences: [null] }, url)).toBe(false);
    expect(isValidSnapshot({ ...snapshot, occurrences: [{ ...occurrence, start: '2026-02-30T09:00:00.000Z' }] }, url)).toBe(false);
  });
});

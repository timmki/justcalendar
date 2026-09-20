import { describe, expect, it } from 'vitest';
import { filterOccurrences, normalizeCalendar } from '../../src/calendar.js';

const fixture = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:first@example.test\r\nDTSTAMP:20260101T000000Z\r\nDTSTART:20260102T090000Z\r\nDTEND:20260102T100000Z\r\nSUMMARY:First event\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:second@example.test\r\nDTSTAMP:20260101T000000Z\r\nDTSTART;VALUE=DATE:20260103\r\nSUMMARY:All day event\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;

describe('calendar normalization', () => {
  it('normalizes timed and all-day events in start order', () => {
    const result = normalizeCalendar(fixture, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z'));
    expect(result.occurrences).toHaveLength(2);
    expect(result.occurrences[0].title).toBe('First event');
    expect(result.occurrences[1].allDay).toBe(true);
  });

  it('expands recurrence exclusions and occurrence overrides', () => {
    const fixture = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:recurring
DTSTART:20260102T090000Z
DTEND:20260102T100000Z
RRULE:FREQ=DAILY;COUNT=3
EXDATE:20260103T090000Z
SUMMARY:Base
END:VEVENT
BEGIN:VEVENT
UID:overridden
DTSTART:20260102T090000Z
DTEND:20260102T100000Z
RRULE:FREQ=DAILY;COUNT=2
SUMMARY:Original
END:VEVENT
BEGIN:VEVENT
UID:overridden
RECURRENCE-ID:20260103T090000Z
DTSTART:20260103T110000Z
DTEND:20260103T120000Z
SUMMARY:Changed
END:VEVENT
END:VCALENDAR`;
    const result = normalizeCalendar(fixture, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z'));
    expect(result.occurrences.map((event) => event.title)).toEqual(['Base', 'Original', 'Changed', 'Base']);
    expect(result.occurrences.find((event) => event.title === 'Changed')?.start).toBe('2026-01-03T11:00:00.000Z');
    expect(result.occurrences.find((event) => event.title === 'Changed')?.recurrenceId).toBe('2026-01-03T09:00:00.000Z');
    expect(result.occurrences.find((event) => event.title === 'Original')?.recurring).toBe(true);
  });

  it('filters title and location text without mutating the source list', () => {
    const result = normalizeCalendar(fixture, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z'));
    const filtered = filterOccurrences(result.occurrences, { from: null, to: null, query: 'all day' });
    expect(filtered).toHaveLength(1);
    expect(result.occurrences).toHaveLength(2);
  });

  it('handles folded and escaped text plus duration-based ends', () => {
    const folded = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:text\r\nDTSTART:20260102T090000Z\r\nDURATION:PT2H\r\nSUMMARY:Folded\r\n continuation\r\nDESCRIPTION:Line 1\\nLine 2\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
    const [event] = normalizeCalendar(folded, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z')).occurrences;
    expect(event.title).toBe('Foldedcontinuation');
    expect(event.description).toBe('Line 1\nLine 2');
    expect(event.end).toBe('2026-01-02T11:00:00.000Z');
  });

  it('retains bounded recent history and the full two-month future boundary', () => {
    const horizon = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:history-outside
DTSTART:20250130T090000Z
SUMMARY:Outside history
END:VEVENT
BEGIN:VEVENT
UID:history
DTSTART:20250131T090000Z
SUMMARY:History
END:VEVENT
BEGIN:VEVENT
UID:future-boundary
DTSTART:20260331T090000Z
SUMMARY:Future boundary
END:VEVENT
BEGIN:VEVENT
UID:future-outside
DTSTART:20260401T090000Z
SUMMARY:Outside future
END:VEVENT
END:VCALENDAR`;
    const result = normalizeCalendar(horizon, 'https://calendar.example.test/public.ics', new Date(2026, 0, 31, 12));
    expect(result.occurrences.map((event) => event.title)).toEqual(['History', 'Future boundary']);
  });

  it('rejects non-v2 calendar envelopes', () => {
    expect(() => normalizeCalendar('BEGIN:VCALENDAR\nVERSION:1.0\nEND:VCALENDAR', 'https://calendar.example.test/public.ics')).toThrow();
  });

  it('bounds the normalized occurrence count', () => {
    const events = Array.from({ length: 5001 }, (_, index) => [
      'BEGIN:VEVENT',
      `UID:event-${index}`,
      'DTSTART:20260102T090000Z',
      'SUMMARY:Event',
      'END:VEVENT',
    ].join('\n')).join('\n');
    const result = normalizeCalendar(`BEGIN:VCALENDAR\nVERSION:2.0\n${events}\nEND:VCALENDAR`, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z'));
    expect(result.occurrences).toHaveLength(5000);
    expect(result.partialData).toBe(true);
  });

  it('deduplicates identical occurrences and keeps recurrence dates', () => {
    const duplicate = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:duplicate\nDTSTART:20260102T090000Z\nRDATE:20260103T090000Z\nSUMMARY:First\nEND:VEVENT\nBEGIN:VEVENT\nUID:duplicate\nDTSTART:20260102T090000Z\nSUMMARY:Second\nEND:VEVENT\nBEGIN:VEVENT\nUID:missing-start\nSUMMARY:Invalid\nEND:VEVENT\nEND:VCALENDAR`;
    const result = normalizeCalendar(duplicate, 'https://calendar.example.test/public.ics', new Date('2026-01-01T00:00:00Z'));
    expect(result.occurrences).toHaveLength(2);
    expect(result.partialData).toBe(true);
  });

  it('keeps today all-day events and excludes conflicting end fields', () => {
    const result = normalizeCalendar(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:today
DTSTART;VALUE=DATE:20260101
SUMMARY:Today
END:VEVENT
BEGIN:VEVENT
UID:conflict
DTSTART:20260102T090000Z
DTEND:20260102T100000Z
DURATION:PT2H
SUMMARY:Invalid end
END:VEVENT
END:VCALENDAR`, 'https://calendar.example.test/public.ics', new Date(2026, 0, 1, 12));
    expect(result.occurrences.map((event) => event.title)).toEqual(['Today']);
    expect(result.partialData).toBe(true);
  });
});

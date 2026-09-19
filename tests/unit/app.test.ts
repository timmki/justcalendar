import { describe, expect, it } from 'vitest';
import { createCalendarApp, filtersFromSearch, searchFromFilters } from '../../src/app.js';
import type { CalendarSnapshot } from '../../src/storage.js';

const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:one\nDTSTART:20260102T090000Z\nSUMMARY:One\nEND:VEVENT\nEND:VCALENDAR`;

function dependencies(overrides: Partial<Parameters<typeof createCalendarApp>[0]> = {}) {
  let snapshot: CalendarSnapshot | null = null;
  let override: string | null = null;
  return {
    config: { schemaVersion: 1 as const, defaultFeedUrl: 'https://example.test/default.ics', telemetryEndpoint: null },
    request: async () => ics,
    loadLocalOverride: async () => override,
    saveLocalOverride: async (url: string | null) => { override = url; },
    loadSnapshot: async () => snapshot,
    saveSnapshot: async (value: CalendarSnapshot) => { snapshot = value; },
    now: () => new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('calendar app state', () => {
  it('loads the deployment feed and persists a validated replacement', async () => {
    const app = createCalendarApp(dependencies());
    await app.start();
    expect(app.getState().status).toBe('ready');
    await app.replace('https://example.test/replacement.ics');
    expect(app.getState().activeUrl).toBe('https://example.test/replacement.ics');
    expect(app.getState().localOverride).toBe('https://example.test/replacement.ics');
  });

  it('preserves the active feed after a replacement fails', async () => {
    const app = createCalendarApp(dependencies({ request: async () => { throw new Error('bad feed'); } }));
    await app.start();
    expect(app.getState().activeUrl).toBe('https://example.test/default.ics');
    await app.replace('https://example.test/replacement.ics');
    expect(app.getState().activeUrl).toBe('https://example.test/default.ics');
    expect(app.getState().localOverride).toBeNull();
  });

  it('keeps a successful online view when snapshot storage is unavailable', async () => {
    const app = createCalendarApp(dependencies({ saveSnapshot: async () => { throw new Error('storage unavailable'); } }));
    await app.start();
    expect(app.getState().status).toBe('ready');
    expect(app.getState().snapshot?.occurrences).toHaveLength(1);
  });

  it('keeps the in-memory snapshot when a later refresh cannot read storage', async () => {
    let fail = false;
    const app = createCalendarApp(dependencies({
      request: async () => {
        if (fail) throw new Error('offline');
        return ics;
      },
      loadSnapshot: async () => { throw new Error('storage unavailable'); },
    }));
    await app.start();
    fail = true;
    await app.refresh();
    expect(app.getState().stale).toBe(true);
    expect(app.getState().snapshot?.occurrences).toHaveLength(1);
  });
});

describe('filter URL state', () => {
  it('round-trips supported filters and drops malformed dates', () => {
    const filters = filtersFromSearch('?from=2026-01-01&to=bad&query=team%20meeting');
    expect(filters).toEqual({ from: '2026-01-01', to: null, query: 'team meeting' });
    expect(searchFromFilters(filters)).toBe('?from=2026-01-01&query=team+meeting');
  });

  it('normalizes reversed ranges when written by the app', async () => {
    const { createCalendarApp } = await import('../../src/app.js');
    const app = createCalendarApp(dependencies());
    app.setFilters({ from: '2026-02-03', to: '2026-02-01', query: 'x' });
    expect(app.getState().filters).toEqual({ from: null, to: null, query: '' });
  });

  it('reloads missing runtime configuration when refresh is requested', async () => {
    const app = createCalendarApp(dependencies({
      config: null,
      loadConfig: async () => ({ schemaVersion: 1, defaultFeedUrl: 'https://example.test/default.ics', telemetryEndpoint: null }),
    }));
    await app.start();
    expect(app.getState().status).toBe('ready');
  });
});

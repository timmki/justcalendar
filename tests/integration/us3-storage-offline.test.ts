import { describe, expect, it } from 'vitest';
import { createCalendarApp } from '../../src/app.js';
import type { CalendarSnapshot } from '../../src/storage.js';

const url = 'https://calendar.example.test/public.ics';
const ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:offline\nDTSTART:20260102T090000Z\nSUMMARY:Offline event\nEND:VEVENT\nEND:VCALENDAR';

describe('US3 snapshot journey', () => {
  it('opens a stale snapshot and keeps filters usable after refresh failure', async () => {
    let saved: CalendarSnapshot | null = null;
    const online = createCalendarApp({
      config: { schemaVersion: 1, defaultFeedUrl: url, telemetryEndpoint: null },
      request: async () => ics,
      loadLocalOverride: async () => null,
      saveLocalOverride: async () => undefined,
      loadSnapshot: async () => saved,
      saveSnapshot: async (snapshot) => { saved = snapshot; },
      now: () => new Date('2026-01-01T00:00:00Z'),
    });
    await online.start();
    const offline = createCalendarApp({
      config: { schemaVersion: 1, defaultFeedUrl: url, telemetryEndpoint: null },
      request: async () => { throw new Error('offline'); },
      loadLocalOverride: async () => null,
      saveLocalOverride: async () => undefined,
      loadSnapshot: async () => saved,
      saveSnapshot: async () => undefined,
      now: () => new Date('2026-01-01T00:00:00Z'),
    });
    await offline.start();
    offline.setFilters({ from: '2026-01-02', to: '2026-01-02', query: 'offline' });
    expect(offline.getState().stale).toBe(true);
    expect(offline.getState().snapshot?.occurrences).toHaveLength(1);
  });

  it('shows an explicit no-snapshot error when offline storage is empty', async () => {
    const app = createCalendarApp({
      config: { schemaVersion: 1, defaultFeedUrl: url, telemetryEndpoint: null },
      request: async () => { throw new Error('offline'); },
      loadLocalOverride: async () => null,
      saveLocalOverride: async () => undefined,
      loadSnapshot: async () => null,
      saveSnapshot: async () => undefined,
    });
    await app.start();
    expect(app.getState().status).toBe('error');
    expect(app.getState().snapshot).toBeNull();
  });
});

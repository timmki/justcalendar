import { describe, expect, it } from 'vitest';
import { createCalendarApp } from '../../src/app.js';
import type { CalendarSnapshot } from '../../src/storage.js';

const defaultFeed = 'https://calendar.example.test/default.ics';
const replacementFeed = 'https://calendar.example.test/replacement.ics';
const ics = (title: string) => `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:${title}\nDTSTART:20260102T090000Z\nSUMMARY:${title}\nLOCATION:Room A\nEND:VEVENT\nEND:VCALENDAR`;

function setup() {
  let local: string | null = null;
  const snapshots = new Map<string, CalendarSnapshot>();
  const app = createCalendarApp({
    config: { schemaVersion: 1, defaultFeedUrl: defaultFeed, telemetryEndpoint: null },
    request: async (url) => url === replacementFeed ? ics('Replacement') : ics('Default'),
    loadLocalOverride: async () => local,
    saveLocalOverride: async (url) => { local = url; },
    loadSnapshot: async (url) => snapshots.get(url) ?? null,
    saveSnapshot: async (snapshot) => { snapshots.set(snapshot.sourceUrl, snapshot); },
    now: () => new Date('2026-01-01T00:00:00Z'),
  });
  return { app, getLocal: () => local };
}

describe('US1 feed journey', () => {
  it('loads default, validates replacement, persists it, and resets it', async () => {
    const { app, getLocal } = setup();
    await app.start();
    expect(app.getState().snapshot?.occurrences[0].title).toBe('Default');
    await app.replace(replacementFeed);
    expect(app.getState().snapshot?.occurrences[0].title).toBe('Replacement');
    expect(getLocal()).toBe(replacementFeed);
    await app.reset();
    expect(app.getState().activeUrl).toBe(defaultFeed);
    expect(app.getState().snapshot?.occurrences[0].title).toBe('Default');
  });

  it('keeps a last-known-good snapshot when refresh fails', async () => {
    const { app } = setup();
    await app.start();
    const state = app.getState();
    const failed = createCalendarApp({
      config: { schemaVersion: 1, defaultFeedUrl: defaultFeed, telemetryEndpoint: null },
      request: async () => { throw new Error('proxy unavailable'); },
      loadLocalOverride: async () => null,
      saveLocalOverride: async () => undefined,
      loadSnapshot: async () => state.snapshot,
      saveSnapshot: async () => undefined,
      now: () => new Date('2026-01-01T00:00:00Z'),
    });
    await failed.start();
    expect(failed.getState().stale).toBe(true);
    expect(failed.getState().snapshot?.occurrences[0].title).toBe('Default');
  });
});

import { describe, expect, it } from 'vitest';
import { buildProxyRequest, parseRuntimeConfig, readProxyResponse, requestCalendar, requestRuntimeConfig } from '../../src/feed.js';

describe('feed boundary', () => {
  it('validates versioned runtime configuration', () => {
    expect(
      parseRuntimeConfig({
        schemaVersion: 1,
        defaultFeedUrl: 'https://calendar.example.test/public.ics',
        telemetryEndpoint: null,
      }).defaultFeedUrl,
    ).toBe('https://calendar.example.test/public.ics');
    expect(() => parseRuntimeConfig({ schemaVersion: 2 })).toThrow();
    expect(() => parseRuntimeConfig({ schemaVersion: 1, defaultFeedUrl: 'https://example.test:8443/feed.ics' })).toThrow();
  });

  it('builds the versioned same-origin proxy request', () => {
    expect(buildProxyRequest('https://calendar.example.test/public.ics')).toEqual({
      schemaVersion: 1,
      url: 'https://calendar.example.test/public.ics',
    });
  });

  it('maps successful calendar and problem responses', async () => {
    await expect(
      readProxyResponse(new Response('BEGIN:VCALENDAR', { headers: { 'content-type': 'text/calendar' } })),
    ).resolves.toEqual({ kind: 'calendar', body: 'BEGIN:VCALENDAR' });
    await expect(
      readProxyResponse(
        new Response(JSON.stringify({ schemaVersion: 1, type: 'https://example.test/problems/unavailable', title: 'Unavailable', status: 504 }), {
          status: 504,
          headers: { 'content-type': 'application/problem+json' },
        }),
      ),
    ).resolves.toEqual({ kind: 'problem', status: 504, title: 'Unavailable', type: 'unavailable' });
  });

  it('rejects unversioned problem responses', async () => {
    await expect(
      readProxyResponse(new Response(JSON.stringify({ title: 'Unavailable', schemaVersion: 2 }), {
        status: 502,
        headers: { 'content-type': 'application/problem+json' },
      })),
    ).resolves.toEqual({ kind: 'problem', status: 502, title: 'Calendar feed unavailable', type: 'upstream_unavailable' });
  });

  it('maps malformed problem responses to a stable error', async () => {
    await expect(readProxyResponse(new Response('{', {
      status: 502,
      headers: { 'content-type': 'application/problem+json' },
    }))).resolves.toMatchObject({ kind: 'problem', type: 'upstream_unavailable' });
  });

  it('rejects incomplete Problem Details responses', async () => {
    await expect(readProxyResponse(new Response(JSON.stringify({ schemaVersion: 1, title: 'Unavailable' }), {
      status: 502,
      headers: { 'content-type': 'application/problem+json' },
    }))).resolves.toMatchObject({ kind: 'problem', type: 'upstream_unavailable' });
  });

  it('aborts a request at the configured deadline', async () => {
    const fetchImpl: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
    await expect(requestCalendar('https://calendar.example.test/public.ics', fetchImpl, 5)).rejects.toThrow('timed out');
  });

  it('times out runtime configuration loading', async () => {
    const fetchImpl: typeof fetch = async (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
    await expect(requestRuntimeConfig(fetchImpl, 5)).rejects.toThrow('timed out');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createTelemetry } from '../../src/telemetry.js';

describe('telemetry contract', () => {
  it('sends versioned redacted events with an app revision', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 200 }));
    const telemetry = createTelemetry('https://telemetry.example.test/events', fetchImpl, {
      appVersion: 'test-revision',
      timeoutMs: 50,
      throttleMs: 0,
    });
    telemetry.report('feed_load_failed', { reason: 'upstream_timeout' });
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
    const payload = JSON.parse(String(fetchImpl.mock.calls[0][1]?.body));
    expect(payload).toMatchObject({ schemaVersion: 1, appVersion: 'test-revision', event: 'feed_load_failed' });
    expect(JSON.stringify(payload)).not.toContain('calendar.example');
  });

  it('drops unsafe or unsupported detail fields at the telemetry boundary', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 200 }));
    const telemetry = createTelemetry('https://telemetry.example.test/events', fetchImpl, { throttleMs: 0 });
    telemetry.report('feed_load_failed', { reason: 'https://calendar.example.test/private.ics', description: 'event text' });
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledOnce());
    expect(JSON.parse(String(fetchImpl.mock.calls[0][1]?.body)).details).toEqual({});
  });

  it('throttles repeated events and isolates endpoint failures', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
    const telemetry = createTelemetry('https://telemetry.example.test/events', fetchImpl, { throttleMs: 60_000 });
    telemetry.report('configuration_error');
    telemetry.report('configuration_error');
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

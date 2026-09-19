import { onCLS, onINP, onLCP, type Metric } from 'web-vitals';

type TelemetryEvent = 'configuration_error' | 'feed_load_failed' | 'snapshot_loaded' | 'web_vital';

interface TelemetryPayload {
  schemaVersion: 1;
  event: TelemetryEvent;
  occurredAt: string;
  appVersion: string;
  details: Record<string, string | number | boolean>;
}

export interface Telemetry {
  report(event: TelemetryEvent, details?: Record<string, string | number | boolean>): void;
  registerVitals(): void;
}

interface TelemetryOptions {
  appVersion?: string;
  timeoutMs?: number;
  throttleMs?: number;
}

function safeDetails(event: TelemetryEvent, details: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
  const allowed = event === 'web_vital'
    ? ['name', 'value', 'rating', 'navigationType']
    : event === 'snapshot_loaded'
      ? ['stale']
      : ['reason'];
  const entries: Array<[string, string | number | boolean]> = [];
  for (const key of allowed) {
    const value = details[key];
    if (typeof value === 'boolean' || typeof value === 'number') entries.push([key, value]);
    if (typeof value === 'string' && /^[a-zA-Z0-9_.:-]+$/.test(value)) entries.push([key, value]);
  }
  return Object.fromEntries(entries);
}

export function createTelemetry(
  endpoint: string | null,
  fetchImpl: typeof fetch = fetch,
  options: TelemetryOptions = {},
): Telemetry {
  const appVersion = options.appVersion ?? 'development';
  const timeoutMs = options.timeoutMs ?? 3000;
  const throttleMs = options.throttleMs ?? 30_000;
  const lastSent = new Map<string, number>();
  const report = (event: TelemetryEvent, details: Record<string, string | number | boolean> = {}) => {
    if (!endpoint) return;
    const safe = safeDetails(event, details);
    const key = `${event}:${String(safe.reason ?? safe.name ?? '')}`;
    const now = Date.now();
    if (throttleMs > 0 && now - (lastSent.get(key) ?? 0) < throttleMs) return;
    lastSent.set(key, now);
    const payload: TelemetryPayload = { schemaVersion: 1, event, occurredAt: new Date().toISOString(), appVersion, details: safe };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    void fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: controller.signal,
    }).catch(() => undefined).finally(() => clearTimeout(timeout));
  };
  const vital = (metric: Metric) => report('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });
  return {
    report,
    registerVitals: () => {
      if (typeof window === 'undefined') return;
      onCLS(vital);
      onINP(vital);
      onLCP(vital);
    },
  };
}

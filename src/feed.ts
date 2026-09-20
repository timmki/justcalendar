export interface RuntimeConfig {
  schemaVersion: 1;
  defaultFeedUrl: string | null;
  telemetryEndpoint: string | null;
  appVersion?: string | null;
  title?: string | null;
  subtitle?: string | null;
}

export interface ProxyRequest {
  schemaVersion: 1;
  url: string;
}

export type ProxyResponse =
  | { kind: 'calendar'; body: string }
  | { kind: 'problem'; status: number; title: string; type?: string };

export const CLIENT_REQUEST_TIMEOUT_MS = 10_000;
export const MAX_FEED_URL_LENGTH = 2048;
export const MAX_BRANDING_LENGTH = 120;

export class FeedError extends Error {
  constructor(message: string, readonly reason: string) {
    super(message);
    this.name = 'FeedError';
  }
}

function validateHttpsUrl(value: unknown, nullable: boolean, proxyPolicy = false): string | null {
  if (value === null && nullable) return null;
  if (typeof value !== 'string') throw new Error('Expected an HTTPS URL or null.');
  if (proxyPolicy && value.length > MAX_FEED_URL_LENGTH) throw new Error('The feed URL is too long.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (proxyPolicy && url.port && url.port !== '443')) {
    throw new Error('Only credential-free HTTPS URLs are supported.');
  }
  return url.href;
}

function validateBranding(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new Error('Branding values must be strings or null.');
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, MAX_BRANDING_LENGTH) : null;
}

export function parseRuntimeConfig(input: unknown): RuntimeConfig {
  if (!input || typeof input !== 'object') throw new Error('Invalid runtime configuration.');
  const value = input as Record<string, unknown>;
  if (value.schemaVersion !== 1) throw new Error('Unsupported runtime configuration version.');
  return {
    schemaVersion: 1,
    defaultFeedUrl: validateHttpsUrl(value.defaultFeedUrl ?? null, true, true),
    telemetryEndpoint: validateHttpsUrl(value.telemetryEndpoint ?? null, true),
    appVersion: typeof value.appVersion === 'string' && value.appVersion.trim() ? value.appVersion.trim() : null,
    title: validateBranding(value.title),
    subtitle: validateBranding(value.subtitle),
  };
}

export function buildProxyRequest(url: string): ProxyRequest {
  const normalized = validateHttpsUrl(url, false, true);
  if (!normalized) throw new Error('A feed URL is required.');
  return { schemaVersion: 1, url: normalized };
}

export async function readProxyResponse(response: Response): Promise<ProxyResponse> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.ok && contentType.includes('text/calendar')) {
    return { kind: 'calendar', body: await response.text() };
  }
  if (contentType.includes('application/problem+json')) {
    let body: { title?: unknown; schemaVersion?: unknown; type?: unknown; status?: unknown };
    try {
      body = (await response.json()) as { title?: unknown; schemaVersion?: unknown; type?: unknown; status?: unknown };
    } catch {
      return { kind: 'problem', status: response.status, title: 'Calendar feed unavailable', type: 'upstream_unavailable' };
    }
    if (body.schemaVersion !== 1 || typeof body.type !== 'string' || !body.type || typeof body.title !== 'string' || typeof body.status !== 'number' || body.status !== response.status) {
      return { kind: 'problem', status: response.status, title: 'Calendar feed unavailable', type: 'upstream_unavailable' };
    }
    return {
      kind: 'problem',
      status: response.status,
      title: typeof body.title === 'string' ? body.title : 'Calendar feed unavailable',
      type: typeof body.type === 'string' ? body.type.split('/').pop() : undefined,
    };
  }
  return { kind: 'problem', status: response.status, title: 'Calendar feed unavailable', type: 'upstream_unavailable' };
}

export async function requestRuntimeConfig(
  fetchImpl: typeof fetch = fetch,
  timeoutMs = CLIENT_REQUEST_TIMEOUT_MS,
): Promise<RuntimeConfig> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/config.json', { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error('Runtime configuration unavailable.');
    return parseRuntimeConfig(await response.json());
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Runtime configuration timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function requestCalendar(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = CLIENT_REQUEST_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl('/api/v1/ics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildProxyRequest(url)),
      signal: controller.signal,
    });
    const result = await readProxyResponse(response);
    if (result.kind === 'problem') throw new FeedError(result.title, result.type ?? 'upstream_unavailable');
    return result.body;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Calendar request timed out.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

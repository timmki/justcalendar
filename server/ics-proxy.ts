import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { isIP } from 'node:net';
import type { IncomingHttpHeaders } from 'node:http';

export const MAX_URL_LENGTH = 2048;
export const MAX_BODY_BYTES = 1024 * 1024;
export const MAX_UPSTREAM_MS = 10_000;
export const MAX_CONCURRENT_REQUESTS = 16;

export class ProxyError extends Error {
  constructor(
    readonly status: number,
    readonly type: string,
    readonly title: string,
    message: string,
  ) {
    super(message);
    this.name = 'ProxyError';
  }
}

export function validateTarget(rawUrl: string): URL {
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new ProxyError(400, 'invalid-target', 'Invalid calendar URL', 'The URL is too long.');
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    throw new ProxyError(400, 'invalid-target', 'Invalid calendar URL', 'The URL is not valid.');
  }

  if (
    target.protocol !== 'https:' ||
    target.username ||
    target.password ||
    target.hash ||
    (target.port && target.port !== '443')
  ) {
    throw new ProxyError(
      400,
      'invalid-target',
      'Invalid calendar URL',
      'Only credential-free HTTPS URLs on the default port are supported.',
    );
  }

  return target;
}

function ipv4Value(address: string): number {
  return address.split('.').reduce((value, part) => value * 256 + Number(part), 0);
}

function inIpv4Range(address: string, network: string, prefix: number): boolean {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipv4Value(address) & mask) === (ipv4Value(network) & mask);
}

function expandIpv6(address: string): number[] | null {
  const withoutZone = address.toLowerCase().split('%')[0];
  const sections = withoutZone.split('::');
  if (sections.length > 2) return null;
  let invalid = false;

  const parseSection = (section: string): number[] => {
    if (!section) return [];
    return section.split(':').flatMap((part) => {
      if (!part.includes('.')) {
        if (!/^[0-9a-f]{1,4}$/.test(part)) invalid = true;
        const value = Number.parseInt(part, 16);
        return Number.isNaN(value) ? [] : [value];
      }
      if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(part)) {
        invalid = true;
        return [];
      }
      const value = ipv4Value(part);
      return [(value >>> 16) & 0xffff, value & 0xffff];
    });
  };

  const left = parseSection(sections[0]);
  const right = parseSection(sections[1] ?? '');
  const missing = sections.length === 2 ? 8 - left.length - right.length : 0;
  if (invalid || missing < 0 || (sections.length === 1 && left.length !== 8)) return null;
  return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function ipv6Value(address: string): bigint | null {
  const sections = expandIpv6(address);
  if (!sections) return null;
  return sections.reduce((value, section) => (value << 16n) | BigInt(section), 0n);
}

function inIpv6Range(address: string, network: string, prefix: number): boolean {
  const value = ipv6Value(address);
  const networkValue = ipv6Value(network);
  if (value === null || networkValue === null) return true;
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  return (value & mask) === (networkValue & mask);
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const blocked = [
      ['0.0.0.0', 8],
      ['10.0.0.0', 8],
      ['100.64.0.0', 10],
      ['127.0.0.0', 8],
      ['169.254.0.0', 16],
      ['172.16.0.0', 12],
      ['192.0.0.0', 24],
      ['192.0.2.0', 24],
      ['192.168.0.0', 16],
      ['198.18.0.0', 15],
      ['198.51.100.0', 24],
      ['203.0.113.0', 24],
      ['224.0.0.0', 4],
      ['240.0.0.0', 4],
    ] as const;
    return !blocked.some(([network, prefix]) => inIpv4Range(address, network, prefix));
  }

  if (isIP(address) === 6) {
    const value = ipv6Value(address);
    if (value === null) return false;
    if (value >> 32n === 0xffffn) {
      const mapped = Number(value & 0xffffffffn);
      return isPublicAddress(`${mapped >>> 24}.${(mapped >>> 16) & 255}.${(mapped >>> 8) & 255}.${mapped & 255}`);
    }
    const blocked = [
      ['::', 128],
      ['::1', 128],
      ['100::', 64],
      ['fc00::', 7],
      ['fe80::', 10],
      ['ff00::', 8],
      ['2001:2::', 48],
      ['2001:10::', 28],
      ['2001::', 32],
      ['2001:db8::', 32],
      ['3fff::', 20],
    ] as const;
    return !blocked.some(([network, prefix]) => inIpv6Range(address, network, prefix));
  }

  return false;
}

type LookupResult = { address: string; family: number };
type LookupFn = (hostname: string, options: { all: true; verbatim: true }) => Promise<LookupResult[]>;

export interface ProxyDependencies {
  resolver?: LookupFn;
  request?: typeof request;
  concurrency?: { activeRequests: number };
}

export type RetrieveIcs = (rawUrl: string, dependencies?: ProxyDependencies) => Promise<{ body: string; headers: IncomingHttpHeaders }>;

export function createRetrieveIcs(defaults: ProxyDependencies = {}): RetrieveIcs {
  const concurrency = defaults.concurrency ?? { activeRequests: 0 };
  return (rawUrl, overrides = {}) => retrieveIcs(rawUrl, {
    ...defaults,
    ...overrides,
    concurrency,
  });
}

export async function resolvePublicAddress(target: URL, resolver: LookupFn = lookup): Promise<LookupResult> {
  let addresses: LookupResult[];
  try {
    addresses = await resolver(target.hostname, { all: true, verbatim: true });
  } catch {
    throw new ProxyError(502, 'dns-failure', 'Calendar feed unavailable', 'The feed host could not be resolved.');
  }
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new ProxyError(403, 'unsafe-target', 'Calendar feed rejected', 'The feed host is not a public network destination.');
  }
  return addresses[0];
}

function problem(status: number, type: string, title: string, detail: string): ProxyError {
  return new ProxyError(status, type, title, detail);
}

function readBody(response: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    response.on('data', (chunk: Buffer) => {
      size += chunk.byteLength;
      if (size > MAX_BODY_BYTES) {
        response.destroy();
        reject(problem(413, 'body-too-large', 'Calendar feed rejected', 'The feed is larger than 1 MiB.'));
        return;
      }
      chunks.push(chunk);
    });
    response.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    response.on('error', reject);
  });
}

export async function retrieveIcs(rawUrl: string, dependencies: ProxyDependencies = {}): Promise<{ body: string; headers: IncomingHttpHeaders }> {
  const concurrency = dependencies.concurrency ?? { activeRequests: 0 };
  if (concurrency.activeRequests >= MAX_CONCURRENT_REQUESTS) {
    throw problem(429, 'too-many-requests', 'Calendar feed busy', 'Too many feed requests are active. Retry shortly.');
  }
  concurrency.activeRequests += 1;

  try {
    const target = validateTarget(rawUrl);
    const resolved = await resolvePublicAddress(target, dependencies.resolver);
    const path = `${target.pathname || '/'}${target.search}`;
    const requestFn = dependencies.request ?? request;

    const response = await new Promise<import('node:http').IncomingMessage>((resolve, reject) => {
      const requestHandle = requestFn(
        {
          hostname: resolved.address,
          port: 443,
          path,
          method: 'GET',
          servername: target.hostname,
          headers: {
            Accept: 'text/calendar',
            'Accept-Encoding': 'identity',
            Host: target.host,
            'User-Agent': 'JustCalendar/1',
          },
          maxHeaderSize: 16 * 1024,
          rejectUnauthorized: true,
        },
        resolve,
      );
      requestHandle.setTimeout(MAX_UPSTREAM_MS, () => {
        requestHandle.destroy(problem(504, 'upstream-timeout', 'Calendar feed unavailable', 'The feed timed out.'));
      });
      requestHandle.on('error', reject);
      requestHandle.end();
    });

    const status = response.statusCode ?? 502;
    if (status >= 300 && status < 400) {
      throw problem(502, 'redirect-rejected', 'Calendar feed rejected', 'Redirects are not followed.');
    }
    if (status < 200 || status >= 300) {
      throw problem(502, 'upstream-failure', 'Calendar feed unavailable', `The feed returned status ${status}.`);
    }
    const length = Number(response.headers['content-length'] ?? 0);
    if (length > MAX_BODY_BYTES) {
      throw problem(413, 'body-too-large', 'Calendar feed rejected', 'The feed is larger than 1 MiB.');
    }
    return { body: await readBody(response), headers: response.headers };
  } catch (error) {
    if (error instanceof ProxyError) throw error;
    throw problem(502, 'upstream-failure', 'Calendar feed unavailable', 'The feed could not be retrieved.');
  } finally {
    concurrency.activeRequests -= 1;
  }
}

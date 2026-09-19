import { EventEmitter } from 'node:events';
import type { IncomingMessage } from 'node:http';
import type { ClientRequest } from 'node:http';
import type { RequestOptions } from 'node:https';
import { describe, expect, it } from 'vitest';
import {
  MAX_BODY_BYTES,
  MAX_CONCURRENT_REQUESTS,
  ProxyError,
  createRetrieveIcs,
  isPublicAddress,
  resolvePublicAddress,
  retrieveIcs,
  validateTarget,
} from '../../server/ics-proxy.js';

const target = 'https://calendar.example.test/public.ics';
const resolver = async () => [{ address: '93.184.216.34', family: 4 }];

function fakeResponse(statusCode: number, headers: IncomingMessage['headers'], body = ''): IncomingMessage {
  const response = new EventEmitter() as IncomingMessage;
  response.statusCode = statusCode;
  response.headers = headers;
  response.destroy = () => response;
  setImmediate(() => {
    if (body) response.emit('data', Buffer.from(body));
    response.emit('end');
  });
  return response;
}

function fakeRequest(response: IncomingMessage, onTimeout?: (destroy: (error: Error) => void) => void): typeof import('node:https').request {
  return ((options: RequestOptions, callback: (response: IncomingMessage) => void) => {
    const listeners = new Map<string, (...args: Error[]) => void>();
    const handle = {
      setTimeout: (_ms: number, _callback: () => void) => queueMicrotask(() => onTimeout?.((error) => listeners.get('error')?.(error))),
      on: (event: string, listener: (...args: Error[]) => void) => { listeners.set(event, listener); return handle; },
      destroy: (error?: Error) => { if (error) listeners.get('error')?.(error); return handle; },
      end: () => { queueMicrotask(() => callback(response)); },
    } as unknown as ClientRequest;
    return handle;
  }) as typeof import('node:https').request;
}

describe('proxy security boundary', () => {
  it('rejects credentialed, non-HTTPS, oversized, and non-global targets', () => {
    expect(() => validateTarget('http://example.test/a')).toThrow();
    expect(() => validateTarget('https://user:pass@example.test/a')).toThrow();
    expect(() => validateTarget(`https://example.test/${'x'.repeat(2048)}`)).toThrow();
    expect(isPublicAddress('169.254.169.254')).toBe(false);
    expect(isPublicAddress('100::1')).toBe(false);
  });

  it('rejects mixed DNS results before connecting', async () => {
    await expect(resolvePublicAddress(new URL(target), async () => [
      { address: '93.184.216.34', family: 4 },
      { address: '169.254.169.254', family: 4 },
    ])).rejects.toMatchObject({ status: 403 });
  });

  it('rejects redirects and oversized response declarations', async () => {
    const redirectRequest = fakeRequest(fakeResponse(302, { location: 'https://other.example.test' }));
    await expect(retrieveIcs(target, { resolver, request: redirectRequest })).rejects.toMatchObject({ type: 'redirect-rejected' });
    const oversizedRequest = fakeRequest(fakeResponse(200, { 'content-length': String(MAX_BODY_BYTES + 1) }));
    await expect(retrieveIcs(target, { resolver, request: oversizedRequest })).rejects.toMatchObject({ type: 'body-too-large' });
  });

  it('maps an upstream timeout and enforces the concurrency limit', async () => {
    const timeoutRequest = fakeRequest(fakeResponse(200, {}), (destroy) => destroy(new ProxyError(504, 'upstream-timeout', 'timeout', 'timeout')));
    await expect(retrieveIcs(target, { resolver, request: timeoutRequest })).rejects.toMatchObject({ type: 'upstream-timeout' });

    const callbacks: Array<(response: IncomingMessage) => void> = [];
    const pendingRequest = ((options: RequestOptions, callback: (response: IncomingMessage) => void) => {
      callbacks.push(callback);
      return { setTimeout: () => undefined, on: (_event: string, _listener: (...args: Error[]) => void) => pendingRequest, destroy: () => pendingRequest, end: () => undefined } as unknown as ClientRequest;
    }) as typeof import('node:https').request;
    const retrieve = createRetrieveIcs({ resolver, request: pendingRequest });
    const pending = Array.from({ length: MAX_CONCURRENT_REQUESTS }, () => retrieve(target));
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(callbacks).toHaveLength(MAX_CONCURRENT_REQUESTS);
    await expect(retrieve(target)).rejects.toMatchObject({ status: 429 });
    callbacks.forEach((callback) => callback(fakeResponse(200, {}, 'BEGIN:VCALENDAR')));
    await Promise.all(pending);
  });
});

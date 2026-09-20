import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ProxyError } from '../../server/ics-proxy.js';
import { createAppServer, MAX_REQUEST_HEADER_BYTES } from '../../server/server.js';

const servers: ReturnType<typeof createAppServer>[] = [];
const staticDirs: string[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
  await Promise.all(staticDirs.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('same-origin server contract', () => {
  it('uses an explicit inbound header-size bound', () => {
    expect(MAX_REQUEST_HEADER_BYTES).toBe(16 * 1024);
  });

  it('returns the proxied calendar body for a versioned request', async () => {
    const server = createAppServer({
      retrieve: async () => ({ body: 'BEGIN:VCALENDAR', headers: {} }),
      staticDir: 'missing-dist',
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not bind.');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/ics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, url: 'https://calendar.example.test/public.ics' }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/calendar');
    expect(await response.text()).toBe('BEGIN:VCALENDAR');
  });

  it('returns problem details for malformed requests', async () => {
    const server = createAppServer({
      retrieve: async () => ({ body: 'unused', headers: {} }),
      staticDir: 'missing-dist',
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not bind.');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/ics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 2 }),
    });
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
  });

  it.each([
    [504, 'upstream-timeout'],
    [502, 'redirect-rejected'],
    [413, 'body-too-large'],
    [429, 'too-many-requests'],
  ])('maps upstream %s errors to problem details', async (status, type) => {
    const server = createAppServer({
      retrieve: async () => { throw new ProxyError(status, type, 'Calendar feed unavailable', type); },
      staticDir: 'missing-dist',
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not bind.');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/ics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schemaVersion: 1, url: 'https://calendar.example.test/public.ics' }),
    });
    expect(response.status).toBe(status);
    expect((await response.json()).type).toContain(type);
  });

  it('rejects wrong methods and content types', async () => {
    const server = createAppServer({ staticDir: 'missing-dist' });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not bind.');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/ics`, { method: 'GET' });
    expect(response.status).toBe(405);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
  });

  it('serves the root health target and image assets with their media types', async () => {
    const staticDir = await mkdtemp(join(tmpdir(), 'justcalendar-static-'));
    staticDirs.push(staticDir);
    await writeFile(join(staticDir, 'index.html'), '<!doctype html><title>JustCalendar</title>');
    await writeFile(join(staticDir, 'logo.png'), Buffer.from([137, 80, 78, 71]));
    await writeFile(join(staticDir, 'logo.jpg'), Buffer.from([255, 216, 255, 217]));
    const server = createAppServer({ staticDir });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not bind.');

    const rootResponse = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(rootResponse.status).toBe(200);
    expect(await rootResponse.text()).toContain('JustCalendar');

    const pngResponse = await fetch(`http://127.0.0.1:${address.port}/logo.png`);
    expect(pngResponse.headers.get('content-type')).toContain('image/png');
    expect((await pngResponse.arrayBuffer()).byteLength).toBe(4);

    const jpgResponse = await fetch(`http://127.0.0.1:${address.port}/logo.jpg`);
    expect(jpgResponse.headers.get('content-type')).toContain('image/jpeg');
    expect((await jpgResponse.arrayBuffer()).byteLength).toBe(4);
  });
});

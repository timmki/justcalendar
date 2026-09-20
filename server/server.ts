import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRetrieveIcs, ProxyError, type RetrieveIcs } from './ics-proxy.js';

const MAX_REQUEST_BYTES = 16 * 1024;
export const MAX_REQUEST_HEADER_BYTES = 16 * 1024;
const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
};

interface AppOptions {
  retrieve?: RetrieveIcs;
  staticDir?: string;
}

function problemResponse(response: ServerResponse, error: unknown): void {
  const proxyError = error instanceof ProxyError
    ? error
    : new ProxyError(500, 'internal-error', 'Calendar service unavailable', 'The calendar service failed.');
  response.writeHead(proxyError.status, {
    'content-type': 'application/problem+json; charset=utf-8',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify({
    type: `https://justcalendar.example/problems/${proxyError.type}`,
    title: proxyError.title,
    status: proxyError.status,
    detail: proxyError.message,
    schemaVersion: 1,
  }));
}

function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => {
      size += chunk.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        request.destroy();
        reject(new ProxyError(413, 'request-too-large', 'Request rejected', 'The request body is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('object required');
        resolveBody(value as Record<string, unknown>);
      } catch {
        reject(new ProxyError(400, 'invalid-request', 'Request rejected', 'The request body is not valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

async function serveStatic(response: ServerResponse, requestPath: string, staticDir: string): Promise<void> {
  const requested = requestPath === '/' ? '/index.html' : requestPath;
  const root = resolve(staticDir);
  const filePath = resolve(root, `.${normalize(requested)}`);
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error('not a file');
    response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    if (requested !== '/index.html') {
      await serveStatic(response, '/index.html', staticDir);
      return;
    }
    response.writeHead(404).end();
  }
}

export function createAppServer(options: AppOptions = {}): Server {
  const retrieve = options.retrieve ?? createRetrieveIcs();
  const staticDir = options.staticDir ?? resolve(process.cwd(), 'dist');
  return createServer({ maxHeaderSize: MAX_REQUEST_HEADER_BYTES }, async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');
    if (requestUrl.pathname === '/api/v1/ics') {
      if (request.method !== 'POST' || request.headers['content-type']?.split(';')[0] !== 'application/json') {
        problemResponse(response, new ProxyError(405, 'method-not-allowed', 'Request rejected', 'Use POST with JSON.'));
        return;
      }
      try {
        const body = await readJson(request);
        if (body.schemaVersion !== 1 || typeof body.url !== 'string') {
          throw new ProxyError(400, 'invalid-request', 'Request rejected', 'schemaVersion 1 and url are required.');
        }
        const result = await retrieve(body.url);
        response.writeHead(200, { 'content-type': 'text/calendar; charset=utf-8', 'cache-control': 'no-store' });
        response.end(result.body);
      } catch (error) {
        problemResponse(response, error);
      }
      return;
    }
    await serveStatic(response, requestUrl.pathname, staticDir);
  });
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
const currentFile = fileURLToPath(import.meta.url);
if (entrypoint === currentFile || entrypoint.endsWith('server.js')) {
  const server = createAppServer();
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? '0.0.0.0';
  server.listen(port, host, () => console.log(`JustCalendar server listening on ${host}:${port}`));
}

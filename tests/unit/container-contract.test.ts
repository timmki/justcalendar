import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(process.cwd());
const read = (file: string) => readFile(resolve(root, file), 'utf8');

describe('container delivery contract', () => {
  it('defines a minimal non-root multi-stage Docker runtime', async () => {
    const dockerfile = await read('Dockerfile');
    expect(dockerfile).toContain('FROM node:22-alpine AS build');
    expect(dockerfile).toContain('npm ci');
    expect(dockerfile).toContain('npm run build');
    expect(dockerfile).toContain('FROM node:22-alpine AS runtime');
    expect(dockerfile).toContain('COPY --from=build --chown=node:node /app/dist ./dist');
    expect(dockerfile).toContain('COPY --from=build --chown=node:node /app/dist-server ./dist-server');
    expect(dockerfile).toContain('USER node');
    expect(dockerfile).toContain('EXPOSE 8787');
    expect(dockerfile).toContain('HEALTHCHECK');
    expect(dockerfile).not.toContain('npm install');
  });

  it('defines a signal-aware runtime configuration entrypoint', async () => {
    const entrypoint = await read('scripts/container-entrypoint.mjs');
    expect(entrypoint).toContain('generate-config.mjs');
    expect(entrypoint).toContain('dist-server/server/server.js');
    expect(entrypoint).toContain('spawn');
    expect(entrypoint).toContain('SIGTERM');
    expect(entrypoint).toContain('stdio: \'inherit\'');
    expect(entrypoint).toContain("copyFile('public/config.json', 'dist/config.json')");
  });

  it('defines validation-first multi-platform GHCR publication', async () => {
    const workflow = await read('.github/workflows/container.yml');
    expect(workflow).toContain('pull_request:');
    expect(workflow).toContain('branches: [master]');
    expect(workflow).toContain("tags: ['v*.*.*']");
    expect(workflow).toContain('packages: write');
    expect(workflow).toContain('docker/setup-qemu-action@v3');
    expect(workflow).toContain('docker/setup-buildx-action@v3');
    expect(workflow).toContain('linux/amd64,linux/arm64,linux/arm/v7');
    expect(workflow).toContain('docker/build-push-action@v6');
    expect(workflow).toContain('push: ${{ github.event_name != \'pull_request\' }}');
    expect(workflow.indexOf('npm run e2e')).toBeLessThan(workflow.indexOf('docker/build-push-action@v6'));
  });

  it('documents Raspberry Pi runtime targets and reverse-proxy scope', async () => {
    const readme = await read('README.md');
    const contract = await read('specs/005-docker-arm-ci/contracts/container.md');
    expect(readme).toContain('linux/arm64');
    expect(readme).toContain('linux/arm/v7');
    expect(readme).toContain('ghcr.io/OWNER/REPOSITORY');
    expect(contract).toContain('reverse proxy');
    expect(contract).toContain('0.0.0.0:8787');
  });
});

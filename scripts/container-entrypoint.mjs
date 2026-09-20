import { spawn, spawnSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';

const config = spawnSync(process.execPath, ['scripts/generate-config.mjs'], { stdio: 'inherit' });
if (config.error) throw config.error;
if (config.status !== 0) process.exit(config.status ?? 1);
const runtime = spawnSync(process.execPath, ['scripts/configure-runtime.mjs'], { stdio: 'inherit' });
if (runtime.error) throw runtime.error;
if (runtime.status !== 0) process.exit(runtime.status ?? 1);
await copyFile('public/config.json', 'dist/config.json');

const server = spawn(process.execPath, ['dist-server/server/server.js'], { stdio: 'inherit' });
let stopping = false;

const forwardSignal = (signal) => {
  if (stopping) return;
  stopping = true;
  server.kill(signal);
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

server.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exit(stopping ? 0 : code ?? 1);
});

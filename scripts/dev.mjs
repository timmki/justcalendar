import { spawn } from 'node:child_process';

const env = { ...process.env, PORT: '8787' };
const children = [
  spawn(process.execPath, ['--import', 'tsx/esm', 'server/server.ts'], {
    env,
    stdio: 'inherit',
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], {
    env,
    stdio: 'inherit',
  }),
];

const stop = (code = 0) => {
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
};

for (const child of children) child.on('exit', (code) => code && stop(code));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());

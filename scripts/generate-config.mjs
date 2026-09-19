import { mkdir, writeFile } from 'node:fs/promises';

const config = {
  schemaVersion: 1,
  defaultFeedUrl: process.env.JUSTCALENDAR_DEFAULT_ICS_URL || null,
  telemetryEndpoint: process.env.JUSTCALENDAR_TELEMETRY_URL || null,
  appVersion: process.env.JUSTCALENDAR_APP_VERSION || null,
};

await mkdir('public', { recursive: true });
await writeFile('public/config.json', `${JSON.stringify(config, null, 2)}\n`, 'utf8');

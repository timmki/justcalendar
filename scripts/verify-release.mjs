const origin = process.env.RELEASE_ORIGIN;
const probeUrl = process.env.RELEASE_ICS_URL;
const rollbackOrigin = process.env.RELEASE_ROLLBACK_ORIGIN;

if (!origin || !probeUrl || !rollbackOrigin) {
  throw new Error('RELEASE_ORIGIN, RELEASE_ICS_URL, and RELEASE_ROLLBACK_ORIGIN are required.');
}

function originUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Release origins must be credential-free HTTPS URLs.');
  return url;
}

const release = originUrl(origin);
const rollback = originUrl(rollbackOrigin);
const releaseRoot = await fetch(new URL('/', release));
if (!releaseRoot.ok) throw new Error(`Release root returned ${releaseRoot.status}.`);

const configResponse = await fetch(new URL('/config.json', release), { cache: 'no-store' });
if (!configResponse.ok) throw new Error(`Release config returned ${configResponse.status}.`);
const config = await configResponse.json();
if (config.schemaVersion !== 1 || typeof config.defaultFeedUrl !== 'string' || !config.defaultFeedUrl.startsWith('https://') || typeof config.telemetryEndpoint !== 'string' || !config.telemetryEndpoint.startsWith('https://') || typeof config.appVersion !== 'string' || !config.appVersion || config.appVersion === 'development') {
  throw new Error('Release config does not provide a valid feed and telemetry endpoint.');
}

const telemetryResponse = await fetch(config.telemetryEndpoint, { method: 'HEAD' }).catch(() => null);
if (!telemetryResponse || telemetryResponse.status >= 500) throw new Error('Release telemetry endpoint is unavailable.');

const proxyResponse = await fetch(new URL('/api/v1/ics', release), {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ schemaVersion: 1, url: probeUrl }),
});
const proxyType = proxyResponse.headers.get('content-type') ?? '';
if (proxyType.includes('text/calendar')) {
  if (!(await proxyResponse.text()).includes('VCALENDAR')) throw new Error('Release proxy returned an invalid calendar body.');
} else if (proxyType.includes('application/problem+json')) {
  const problem = await proxyResponse.json();
  if (problem.schemaVersion !== 1) throw new Error('Release proxy returned an unversioned problem response.');
} else {
  throw new Error('Release proxy returned an unknown response type.');
}

const rollbackRoot = await fetch(new URL('/', rollback));
if (!rollbackRoot.ok) throw new Error(`Rollback target returned ${rollbackRoot.status}.`);
console.log('Release and rollback smoke checks passed.');

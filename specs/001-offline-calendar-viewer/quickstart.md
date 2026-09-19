# Quickstart Validation: Offline Calendar Viewer

## Prerequisites

- Node.js and npm versions supported by the repository toolchain.
- A public HTTPS ICS feed, whether or not its response permits browser CORS
  requests.
- A browser with IndexedDB and service-worker support.

## Configure a Local Run

Generate the local runtime configuration from deployment-style values:

```text
JUSTCALENDAR_DEFAULT_ICS_URL=https://calendar.example.test/public.ics
JUSTCALENDAR_TELEMETRY_URL=
```

The generated application must serve this as same-origin `/config.json`. Do
not place secrets in the configuration.

## Commands

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run e2e
npm run build
```

## Manual Scenarios

1. Open the app with a valid default URL. Confirm events appear without asking
   for a feed URL, are sorted by start time, and show the configured details.
2. Replace the URL with another valid public HTTPS ICS URL, including one that
   lacks CORS headers. Confirm the new URL is the only active source after
   reload. Reset and confirm the deployment URL is restored.
3. Remove or invalidate the deployment default. Confirm a configuration error
   appears, then enter a valid replacement and confirm recovery.
4. Apply date and text filters. Confirm URL parameters reflect the view,
   results update within two seconds for the performance fixture, and clearing
   filters restores the default view.
5. Load a feed successfully, disable network access, and reopen the app.
   Confirm the saved snapshot appears with its last-refresh time and stale
   notice. Confirm filtering still works offline.
6. Refresh with a malformed, proxy-rejected, or unreachable feed. Confirm the
   previous last-known-good snapshot remains visible, the error explains
   recovery, and retry is available.
7. Navigate the complete flow with keyboard only and verify focus order,
   labels, status announcements, and visible focus styling.

## Expected Gates

- Unit tests cover iCalendar normalization, recurrence bounds, URL precedence,
  snapshot atomicity, and filter behavior.
- Browser tests cover configuration recovery, local override persistence,
  offline shell and snapshot, retry states, and keyboard access.
- Performance checks meet LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, filter result
  within 2s for 5,000 occurrences, and offline snapshot open within 5s.
- Production deployment exposes `/config.json`, `/api/v1/ics`, a telemetry
  endpoint, and an HTTPS origin. Proxy success, timeout, rate-limit, SSRF, and
  malformed-feed behavior are tested with public fixtures.

See [data-model.md](data-model.md),
[deployment-config.md](contracts/deployment-config.md),
[ics-feed.md](contracts/ics-feed.md), and
[telemetry.md](contracts/telemetry.md) for the detailed contracts.

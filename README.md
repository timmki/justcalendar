# JustCalendar

Read-only ICS viewer with same-origin feed retrieval, URL filters, IndexedDB snapshots, and a mobile PWA shell.

## Local

```sh
npm install
npm run config:generate
npm run dev
```

Open `http://127.0.0.1:5173`. Set `JUSTCALENDAR_DEFAULT_ICS_URL` before `npm run config:generate` to provide the deployment feed.

## Checks

```sh
npm run typecheck
npm test
npm run e2e
npm run lint
npm run build
npm run verify:release
```

## Deployment

Run `npm run config:generate` before `npm run build`, then start the Node service with `npm start`. Set `PORT` and optionally `HOST`; the default production host is `0.0.0.0`.

The application accepts only public HTTPS ICS URLs. The Node proxy performs DNS and response checks, rejects redirects, and does not require upstream CORS headers. Put TLS termination and any optional Basic Authentication at the ingress. The application has no credentials, sessions, or event-management operations.

Set `JUSTCALENDAR_TELEMETRY_URL` only when an allowed deployment telemetry endpoint is available, and set `JUSTCALENDAR_APP_VERSION` to the deployment revision. Telemetry excludes feed URLs, event UIDs, descriptions, credentials, and conference tokens.

Release validation requires `RELEASE_ORIGIN`, `RELEASE_ICS_URL`, and `RELEASE_ROLLBACK_ORIGIN`; it checks the deployed config, proxy response, telemetry configuration, and rollback target. `npm run ci` runs the local CI-equivalent checks.

## Recovery

A visitor's local feed replacement remains active until reset. Failed refreshes retain the last validated snapshot for offline or stale viewing. To roll back, deploy the previous built artifact and regenerate configuration only if the feed endpoint changed.

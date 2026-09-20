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

## Branding

The header uses the configured `JUSTCALENDAR_TITLE` and `JUSTCALENDAR_SUBTITLE` values. To add a
deployment logo without changing application code, place `logo.png` in `public/`; if it is not
available, the application tries `public/logo.jpg`. When neither asset exists, the text branding
is shown without a broken-image placeholder.

## Docker and Raspberry Pi

The production image uses a multi-stage Node 22 Alpine build. The runtime image contains the
compiled frontend/server without npm-installed development dependencies, runs as the non-root
`node` user, listens on `0.0.0.0:8787` by default, and has a local root healthcheck.

Build and run locally:

```sh
docker build -t justcalendar:local .
docker run --rm --name justcalendar -p 8787:8787 \
  -e JUSTCALENDAR_DEFAULT_ICS_URL=https://calendar.example.test/public.ics \
  -e JUSTCALENDAR_TITLE='Raspberry Kalender' \
  justcalendar:local
```

GitHub Actions builds `linux/amd64`, `linux/arm64`, and `linux/arm/v7`. Successful non-pull-request
builds are published to `ghcr.io/<owner>/<repository>` with branch/tag/SHA metadata; pull requests
build without publishing.

On a Raspberry Pi, pull and run the architecture-appropriate manifest:

```sh
docker pull ghcr.io/OWNER/REPOSITORY:master
docker run -d --name justcalendar --restart unless-stopped \
  -p 127.0.0.1:8787:8787 \
  -e JUSTCALENDAR_DEFAULT_ICS_URL=https://calendar.example.test/public.ics \
  ghcr.io/OWNER/REPOSITORY:master
```

Use `linux/arm64` with 64-bit Raspberry Pi OS or `linux/arm/v7` with 32-bit ARMv7 Raspberry Pi
OS. The existing reverse proxy can forward to `127.0.0.1:8787`; reverse-proxy, TLS, DNS,
authentication, and firewall configuration are intentionally outside this feature.

Release validation requires `RELEASE_ORIGIN`, `RELEASE_ICS_URL`, and `RELEASE_ROLLBACK_ORIGIN`; it checks the deployed config, proxy response, telemetry configuration, and rollback target. `npm run ci` runs the local CI-equivalent checks.

## Recovery

A visitor's local feed replacement remains active until reset. Failed refreshes retain the last validated snapshot for offline or stale viewing. To roll back, deploy the previous built artifact and regenerate configuration only if the feed endpoint changed.

# Quickstart: Docker Image and ARM CI Delivery

## Prerequisites

- Node.js 22 and npm for repository checks.
- Docker with Buildx for local image build/run, or a GitHub Actions runner for the authoritative multi-platform build.
- A GitHub repository with GHCR package write permission for publishing.

## Local Build and Run

From the repository root:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build

docker build -t justcalendar:local .
docker run --rm --name justcalendar -p 8787:8787 \
  -e JUSTCALENDAR_DEFAULT_ICS_URL=https://calendar.example.test/public.ics \
  -e JUSTCALENDAR_TITLE='Raspberry Kalender' \
  justcalendar:local
```

Expected results:

- `http://127.0.0.1:8787/` returns the application shell.
- `http://127.0.0.1:8787/config.json` contains the runtime-generated public configuration.
- Docker reports the container healthy after the root healthcheck succeeds.
- The process runs as the non-root Node user.

## Raspberry Pi Run

The published manifest selects the local architecture automatically:

```sh
docker pull ghcr.io/OWNER/REPOSITORY:master
docker run -d --name justcalendar \
  --restart unless-stopped \
  -p 127.0.0.1:8787:8787 \
  -e JUSTCALENDAR_DEFAULT_ICS_URL=https://calendar.example.test/public.ics \
  -e JUSTCALENDAR_TITLE='Raspberry Kalender' \
  ghcr.io/OWNER/REPOSITORY:master
```

Use `linux/arm64` for 64-bit Raspberry Pi OS and `linux/arm/v7` for 32-bit ARMv7 Raspberry Pi
OS. Point the existing reverse proxy at `127.0.0.1:8787`; proxy/TLS setup is intentionally not
part of this feature.

## GitHub Actions

- Pull requests build all three platforms without publishing.
- Pushes to `master`, version tags such as `v1.2.3`, and manual runs publish successful images to GHCR.
- The workflow must fail before publication if any existing application validation command fails.

## Local Environment Limitation

If the local Docker daemon is unavailable, run all npm checks and inspect the Docker/Action
contracts locally; the GitHub Buildx/QEMU workflow is required to exercise the ARM image builds.

# Container Contract: Docker Image and ARM CI Delivery

## Runtime Contract

- Image: `ghcr.io/<owner>/<repository>:<tag>`.
- Supported platforms: `linux/amd64`, `linux/arm64`, `linux/arm/v7`.
- Default command: the Node container entrypoint.
- Default bind: `0.0.0.0:8787`.
- Overrides: `HOST` and `PORT` environment variables.
- Runtime configuration: `JUSTCALENDAR_DEFAULT_ICS_URL`, `JUSTCALENDAR_TELEMETRY_URL`, `JUSTCALENDAR_APP_VERSION`, `JUSTCALENDAR_TITLE`, and `JUSTCALENDAR_SUBTITLE`.
- Static root: `/`.
- Calendar proxy: existing `POST /api/v1/ics` with the existing versioned request/error contract.
- Health: local `GET /` success means healthy; connection/non-success means unhealthy.
- Process: non-root user; runtime has no npm-installed development dependencies.

## GitHub Actions Contract

- Workflow file: `.github/workflows/container.yml`.
- Events: pull requests, pushes to `master`, version tags, and manual dispatch.
- Validation: `npm ci`, Playwright browser install, lint, typecheck, unit/integration tests, build, and E2E before image publication.
- Build platforms: `linux/amd64,linux/arm64,linux/arm/v7`.
- Registry: `ghcr.io` using `GITHUB_TOKEN` with `packages: write` only for publishing.
- Pull request: build only, no push.
- Default branch/version tag/manual publish event: push multi-platform manifest with branch/tag/SHA metadata.
- No credentials are stored in repository files.

## Scope Boundary

The reverse proxy, TLS termination, public DNS, authentication, and Raspberry Pi host
firewall/network setup are operator responsibilities and are not image or workflow contracts.

# Data Model: Docker Image and ARM CI Delivery

## Production Image

| Field | Type | Rules |
|---|---|---|
| `repository` | OCI image name | `ghcr.io/<owner>/<repository>` derived from GitHub repository metadata. |
| `platforms` | list | Exactly `linux/amd64`, `linux/arm64`, `linux/arm/v7`. |
| `runtimeArtifacts` | list | Compiled `dist`, compiled `dist-server`, public assets, config generator, and container entrypoint only. |
| `user` | string | Non-root Node runtime user. |
| `port` | number | Default `8787`, overridable through `PORT`. |

## Runtime Configuration Boundary

- Environment inputs: existing `JUSTCALENDAR_DEFAULT_ICS_URL`, `JUSTCALENDAR_TELEMETRY_URL`,
  `JUSTCALENDAR_APP_VERSION`, `JUSTCALENDAR_TITLE`, `JUSTCALENDAR_SUBTITLE`, `HOST`, and `PORT`.
- Generated output: `public/config.json` before server startup.
- The generated config is public application configuration and contains no credentials.
- Missing optional values preserve the existing null/fallback behavior.

## Container Health State

- `healthy`: local root request returns a successful HTTP response within the health timeout.
- `unhealthy`: connection fails, times out, or returns a non-success status.
- The health probe does not depend on the reverse proxy.

## CI Publication Outcome

- `validated`: named repository checks passed.
- `built`: all declared platform images built successfully.
- `published`: non-PR event pushed the manifest and traceable tags to GHCR.
- `not-published`: pull-request event intentionally built without registry mutation.
- `failed`: validation or image build failed; publication is not attempted.

## Lifecycle

1. GitHub event starts the workflow.
2. Application validation runs.
3. Buildx/QEMU builds the platform matrix.
4. Non-PR push/tag events authenticate to GHCR and publish tags/labels.
5. Raspberry Pi pulls the matching manifest variant.
6. Container entrypoint generates config, starts the Node server, and reports health.

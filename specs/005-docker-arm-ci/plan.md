# Implementation Plan: Docker Image and ARM CI Delivery

**Branch**: `005-docker-arm-ci` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-docker-arm-ci/spec.md`

## Summary

Add a multi-stage, non-root Docker image for the existing Node.js static/proxy server and a
GitHub Actions workflow that validates the repository, builds Linux `amd64`, `arm64`, and
`arm/v7` variants with Buildx/QEMU, and publishes successful non-PR builds to GHCR. Runtime
configuration is generated when the container starts so feed, branding, telemetry, and version
values do not require image rebuilds. Reverse proxy and TLS remain outside the feature boundary.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 22; Docker image uses the official Node 22 Alpine runtime

**Primary Dependencies**: Existing npm lockfile, Vite, TypeScript, Buildx, QEMU, GitHub Actions Docker actions; no application dependency added

**Storage**: No new persistent storage; runtime `public/config.json` is generated inside the container's writable application directory at startup

**Testing**: Existing Vitest/Playwright suites; container contract tests inspect Docker/Action contracts; local Docker build/run when the Docker daemon is available; GitHub-hosted multi-arch build is the authoritative ARM execution gate

**Target Platform**: Linux containers on `linux/amd64`, `linux/arm64`, and `linux/arm/v7`, with Raspberry Pi reverse-proxy operation assumed outside the container

**Project Type**: Existing single-project TypeScript web application with a Node HTTP server

**Performance Goals**: Runtime image excludes dev dependencies/source/tests, starts the server with the existing application behavior, and has no added browser bundle dependency or request path

**Constraints**: Non-root runtime; `HOST=0.0.0.0` and configurable `PORT`; no secrets in image/workflow; PR builds do not publish; only successful validation can publish; runtime configuration must be regenerated safely at startup; no x86-only native module or shell-specific runtime dependency

**Scale/Scope**: One root Dockerfile, one Docker ignore file, one container entrypoint, one GH Actions workflow, server MIME/health contract coverage, and deployment documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion, Not Extension**: PASS. Use one Dockerfile, one small entrypoint, and one workflow; no container abstraction framework.
- II. **Make Dependencies Explicit**: PASS. The entrypoint explicitly generates configuration and spawns the compiled server; Docker stages explicitly copy runtime artifacts.
- III. **Treat the Network as the Boundary**: PASS. The existing versioned proxy contract is unchanged; image serving does not add an external API.
- IV. **Render What Can Be Proven**: PASS. The container healthcheck probes the existing root response; missing feed configuration remains the existing intentional configuration state.
- V. **Accessibility Is a Correctness Property**: PASS. No UI interaction changes; existing accessibility tests run before image publication.
- VI. **Measure What Users Feel**: PASS. Production image omits development dependencies and browser bundle behavior remains covered by existing budgets.
- VII. **Keep State at the Edge Where It Is Needed**: PASS. Runtime config is generated at the container boundary; application/server state and snapshots remain unchanged.
- VIII. **Make Commands Discoverable and CI-Consistent**: PASS. The workflow calls the same named npm validation/build commands documented in the repository.
- IX. **Realize Value at the User**: PASS within scope. GHCR publication is traceable and revertible by image tag/digest; reverse proxy/deployment smoke remains operator scope.

## Phase 0: Research Decisions

See [research.md](research.md) for base image, multi-platform publishing, runtime configuration, process, and healthcheck decisions.

## Phase 1: Design Artifacts

- [data-model.md](data-model.md) defines the image manifest, runtime configuration boundary, workflow outcome, and health state.
- [contracts/container.md](contracts/container.md) defines the Docker runtime and CI publication contracts.
- [quickstart.md](quickstart.md) defines local image/runner validation and Raspberry Pi run instructions.

## Project Structure

### Documentation (this feature)

```text
specs/005-docker-arm-ci/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── container.md
├── quickstart.md
├── checklists/
│   ├── requirements.md
│   └── delivery.md
└── tasks.md
```

### Source and Delivery Files

```text
Dockerfile                         # multi-stage build and non-root runtime
.dockerignore                      # minimal Docker build context
scripts/container-entrypoint.mjs   # runtime config generation + server process
server/server.ts                   # static MIME additions if needed
.github/workflows/container.yml    # validation, multi-arch build, GHCR publication
README.md                          # Docker/Pi/operator documentation
tests/unit/container-contract.test.ts
```

**Structure Decision**: Keep deployment artifacts at repository root, use a small Node entrypoint
instead of a shell PID-1 wrapper, and reuse the existing `scripts/generate-config.mjs` and server
entrypoint. The runtime image does not install npm dependencies; compiled server code uses Node
built-ins and the frontend dependencies are bundled by Vite.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The build remains a single multi-stage Dockerfile and one workflow. |

## Post-Design Constitution Check

- The Dockerfile and entrypoint keep state and network behavior at the deployment boundary.
- The container starts non-root, forwards termination signals, exposes a local health contract, and does not add credentials.
- GitHub Actions validates before publication and uses `GITHUB_TOKEN` package permissions only.
- Multi-architecture support is declared explicitly, not implied by a single local build.
- If the local Docker daemon is unavailable, static/container-contract tests remain runnable and the GitHub workflow is the authoritative ARM build gate.

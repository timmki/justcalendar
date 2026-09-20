# Research: Docker Image and ARM CI Delivery

## Decision 1: Use a multi-stage Node 22 Alpine image

- Decision: Build with `node:22-alpine`, then copy only `dist`, `dist-server`, public assets, and the two runtime scripts into a fresh `node:22-alpine` stage.
- Rationale: The project already targets Node 22, Alpine keeps the runtime small, and no native runtime dependency requires a larger distribution.
- Alternatives considered:
  - Debian-based Node image: rejected because it adds runtime weight without a project requirement.
  - Distroless image: rejected because the runtime configuration entrypoint and Node debugging/health behavior are clearer with the official Node runtime, while the image remains non-root and dependency-free.

## Decision 2: Build one manifest for three Linux platforms

- Decision: GitHub Actions uses Buildx/QEMU for `linux/amd64`, `linux/arm64`, and `linux/arm/v7`.
- Rationale: This covers common Raspberry Pi 64-bit and 32-bit ARM installations while preserving ordinary CI/developer verification.
- Alternatives considered:
  - ARM64 only: rejected because Raspberry Pi OS installations may still be 32-bit ARMv7.
  - Native Raspberry Pi runner: rejected because it slows delivery and does not provide a reproducible hosted build boundary.

## Decision 3: Generate public runtime configuration at container start

- Decision: A Node entrypoint runs the existing configuration generator, then spawns the compiled server with signal forwarding. Runtime environment values are therefore applied without rebuilding the image.
- Rationale: Feed and branding values are deployment-specific and should not be baked into a shared image; Node avoids shell quoting and PID-1 forwarding pitfalls.
- Alternatives considered:
  - Bake config during Docker build: rejected because each deployment would require a separate image and public configuration could become stale.
  - Shell `sh -c` command: rejected because signal forwarding and JSON/environment quoting are less explicit.

## Decision 4: Publish to GHCR only after validation

- Decision: A separate workflow runs existing lint/typecheck/unit/build/browser checks before Buildx. Pull requests build without pushing; default-branch/version-tag pushes publish with `GITHUB_TOKEN` package permission, OCI labels, and branch/tag/SHA tags.
- Rationale: The user requested GitHub Actions delivery, and GHCR is integrated with repository permissions and multi-arch manifests.
- Alternatives considered:
  - Docker Hub: rejected because it introduces an external credential/registry requirement not requested.
  - Publish before E2E: rejected because failed application validation must never create a deployable tag.

## Decision 5: Use the existing root response as the health contract

- Decision: Docker `HEALTHCHECK` requests the local `/` endpoint and fails on connection or non-2xx response.
- Rationale: The server already has no separate health endpoint; root verifies the static runtime is available without adding an API surface.
- Alternatives considered:
  - Add `/healthz`: rejected because it expands the server contract for a deployment-only concern.

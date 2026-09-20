# Feature Specification: Docker Image and ARM CI Delivery

**Feature Branch**: `005-docker-arm-ci`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Die Software soll als Dockerimage gebaut werden. Das Dockerimage will ich auf einem Raspberry Pi ARM System laufen lassen. Der Build soll als Github Action umgesetzt werden. Die Software soll als minimaler Server laufen und wird über einen Reverse Proxy im Raspberry zugänglich gemacht. Dieser Part ist daher nicht Scope und kann als vorausgesetzt angenommen werden."

## User Scenarios & Testing

### User Story 1 - Build a Minimal Production Image (Priority: P1)

As a maintainer, I want a production Docker image that contains only the built JustCalendar application and the minimum Node.js runtime needed to serve it, so deployments do not need the repository or development dependencies.

**Why this priority**: A reproducible runtime image is the prerequisite for every Raspberry Pi deployment.

**Independent Test**: Build the image from a clean checkout, start it with a deployment feed environment value, request `/`, and confirm the German calendar shell and same-origin calendar endpoint are served by the container.

**Acceptance Scenarios**:

1. **Given** a clean repository checkout, **When** the Docker image is built, **Then** the frontend and server compile successfully without requiring host-installed Node.js tooling.
2. **Given** the image is started with `PORT` and optional runtime branding/feed environment values, **When** a client requests `/`, **Then** the minimal server listens on the configured port and serves the generated runtime configuration and frontend.
3. **Given** the image is inspected or run, **When** the process identity is checked, **Then** the application does not run as root and development-only files/dependencies are not required at runtime.
4. **Given** the container is running, **When** its health check is executed, **Then** a successful HTTP response from the local application marks it healthy and an unavailable application marks it unhealthy.

### User Story 2 - Build and Publish through GitHub Actions (Priority: P1)

As a maintainer, I want GitHub Actions to validate and build the image consistently, so image delivery does not depend on a developer workstation.

**Why this priority**: The requested delivery mechanism must be repeatable and reviewable in the repository.

**Independent Test**: Open a pull request and push a branch/tag in a repository with package permissions; confirm the workflow validates the application, builds all declared platforms, and publishes only for non-PR events.

**Acceptance Scenarios**:

1. **Given** a pull request, **When** the container workflow runs, **Then** it builds the image for every declared target platform without publishing a registry tag.
2. **Given** a push to the default branch or a version tag, **When** the workflow runs, **Then** it publishes the multi-platform image to GitHub Container Registry with traceable branch/tag and commit metadata.
3. **Given** a workflow run, **When** its permissions and credentials are inspected, **Then** it uses the repository-provided package token with least-privilege contents/package permissions and does not require a committed secret.
4. **Given** a failed application validation step, **When** the workflow proceeds, **Then** image publication is prevented.

### User Story 3 - Run on Raspberry Pi ARM (Priority: P1)

As an operator, I want to pull the published image on a Raspberry Pi ARM system and run it behind my existing reverse proxy, so the calendar is accessible without exposing or configuring the application server directly.

**Why this priority**: Raspberry Pi ARM execution is the explicit deployment target.

**Independent Test**: Pull the image on a supported Raspberry Pi architecture, start it with the documented environment variables and port mapping, and confirm it responds locally; reverse-proxy routing and TLS are not part of this feature.

**Acceptance Scenarios**:

1. **Given** a Raspberry Pi using 64-bit ARM, **When** the published image is pulled, **Then** the registry resolves the `linux/arm64` image variant and the server starts successfully.
2. **Given** a Raspberry Pi using 32-bit ARMv7, **When** the published image is pulled, **Then** the registry resolves the `linux/arm/v7` image variant and the server starts successfully.
3. **Given** an operator starts the container with `HOST=0.0.0.0`, a chosen `PORT`, and runtime configuration variables, **When** the local port is requested, **Then** the server is reachable and the configured application behavior is preserved.
4. **Given** a reverse proxy is present on the Raspberry Pi, **When** it forwards traffic to the container port, **Then** the application needs no proxy-specific configuration from this feature.

### Edge Cases

- A build must fail rather than publish when TypeScript, lint, unit, browser, or Docker build validation fails.
- A missing deployment feed remains a valid image configuration and must expose the existing application configuration/recovery state rather than making the container image unusable.
- Runtime environment values must be generated safely as JSON and must not require rebuild/publish for each Raspberry Pi deployment.
- A stopped or failed server must fail the container health check.
- The image must not depend on an x86-only native package or an architecture-specific shell utility.
- A Raspberry Pi deployment may use either `linux/arm64` or `linux/arm/v7`; unsupported architectures are outside the declared image contract.
- Reverse-proxy TLS, hostname, certificates, authentication, rate limits, and public DNS are explicitly out of scope.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST contain a reproducible Docker build for the production frontend and minimal Node.js server.
- **FR-002**: The runtime image MUST contain only the compiled application, required static assets/scripts, and the minimum runtime needed to start the server; development dependencies and source/test artifacts MUST NOT be required at runtime.
- **FR-003**: The container MUST run as a non-root user, listen on `0.0.0.0` by default, expose the application port, and support overriding `HOST` and `PORT` through runtime environment variables.
- **FR-004**: Runtime configuration variables already supported by the application, including feed URL, title, subtitle, telemetry endpoint, and app version, MUST be applied when the container starts without requiring an image rebuild.
- **FR-005**: The container MUST provide a local HTTP health check that reports unhealthy when the application cannot serve its root response.
- **FR-006**: A GitHub Actions workflow MUST run application validation before the container publication step.
- **FR-007**: The GitHub Actions workflow MUST build `linux/arm64`, `linux/arm/v7`, and `linux/amd64` image variants using a reproducible multi-platform build.
- **FR-008**: Pull-request workflow runs MUST build but MUST NOT publish registry images; non-PR pushes to the default branch and version tags MUST publish to GitHub Container Registry using repository-provided permissions.
- **FR-009**: Published image tags MUST include traceable branch/tag and commit identity metadata so an operator can identify the deployed source revision.
- **FR-010**: The repository MUST document image build, local run, Raspberry Pi architecture support, runtime configuration, health behavior, and the explicit reverse-proxy boundary.
- **FR-011**: The application server MUST continue to serve the existing static frontend, runtime configuration, and versioned calendar proxy endpoint from inside the image.
- **FR-012**: The implementation MUST preserve the existing lint, typecheck, unit/integration, build, browser, bundle, and security behavior.

### Key Entities

- **Production Image**: A versioned multi-platform OCI image containing the compiled JustCalendar application and minimal Node.js runtime.
- **Image Variant**: One platform-specific image selected by the registry manifest for `linux/amd64`, `linux/arm64`, or `linux/arm/v7`.
- **Runtime Configuration**: Environment-derived public configuration generated when the container starts.
- **Container Health State**: Healthy/unhealthy result derived from the local HTTP root response.
- **CI Publication**: A GitHub Actions run that validates, builds, labels, and conditionally publishes the image to GHCR.

## Success Criteria

### Measurable Outcomes

- **SC-001**: From a clean checkout on a supported developer runner, one documented Docker command produces a runnable production image without a manual build step outside the repository.
- **SC-002**: The runtime image contains no `node_modules` directory and runs successfully with a non-root process identity.
- **SC-003**: One multi-platform CI build publishes image variants for all three declared platforms, including both Raspberry Pi ARM targets, when run on a publish-enabled branch/tag event.
- **SC-004**: A started container serves the application root and reports healthy within 10 seconds under normal local conditions.
- **SC-005**: Changing runtime feed/branding environment values changes the generated public configuration on the next container start without rebuilding the image.
- **SC-006**: Pull-request runs publish zero registry images, while successful default-branch/version-tag runs publish a traceable GHCR image.
- **SC-007**: Existing application validation remains green after the Docker and workflow additions.

## Assumptions

- The GitHub repository uses GitHub Container Registry at `ghcr.io/<owner>/<repository>` and permits `GITHUB_TOKEN` package publication.
- The default branch is `master`, matching the current repository state; workflow branch configuration may be adjusted if the repository default changes.
- Raspberry Pi support means both common 64-bit ARM and 32-bit ARMv7 deployments; `linux/arm64` and `linux/arm/v7` are therefore declared.
- The existing Node.js server on port `8787` is the minimal application server; reverse proxy, TLS, hostnames, certificates, and public exposure are excluded.
- Runtime configuration is public application configuration, not a secret store; no credentials or tokens are added to the image or workflow.
- Docker Buildx/QEMU and GitHub-hosted runners are the supported CI build environment.

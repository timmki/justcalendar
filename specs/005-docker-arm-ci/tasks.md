# Tasks: Docker Image and ARM CI Delivery

**Input**: Design documents from `/specs/005-docker-arm-ci/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/container.md, quickstart.md

**Tests**: Required by the specification for runtime behavior, image/workflow contracts, health behavior, ARM platform declarations, and preserved application validation.

## Phase 1: Setup

- [x] T001 Confirm the active feature metadata, npm lockfile, server entrypoint, existing CI commands, and local Docker availability in `specs/005-docker-arm-ci/plan.md`, `package.json`, `package-lock.json`, `server/server.ts`, and `.github/workflows/ci.yml`.

## Phase 2: Foundational

- [x] T002 [P] Add unit/integration contract tests for Dockerfile runtime stages, non-root execution, runtime artifact boundaries, healthcheck, and workflow platform/publication declarations in `tests/unit/container-contract.test.ts`.
- [x] T003 [P] Add server contract coverage for static PNG/JPG MIME types and root health responses in `tests/integration/server-contract.test.ts`.
- [x] T004 [P] Verify the existing `.gitignore` and define the Docker build-context exclusions in `.dockerignore` without excluding files required by the TypeScript build.

---

## Phase 3: User Story 1 - Build a Minimal Production Image (Priority: P1) MVP

**Goal**: Build a reproducible non-root production image that runs the existing server with runtime configuration and health reporting.

**Independent Test**: Build and start the image, request `/` and `/config.json`, inspect the process user/runtime contents, and observe the healthcheck.

### Tests for User Story 1

- [x] T005 [US1] Add failing-first runtime contract assertions for the Dockerfile, entrypoint, and runtime configuration behavior in `tests/unit/container-contract.test.ts`.
- [x] T006 [US1] Add integration coverage for container-compatible root/static response and image MIME behavior in `tests/integration/server-contract.test.ts`.

### Implementation for User Story 1

- [x] T007 [US1] Create the multi-stage `Dockerfile` using Node 22 Alpine, compile with `npm ci` and `npm run build`, copy only `dist`, `dist-server`, public assets, and runtime scripts, set `HOST=0.0.0.0`/`PORT=8787`, expose the port, configure a non-root user, and add the local HTTP healthcheck.
- [x] T008 [US1] Create `scripts/container-entrypoint.mjs` to run `scripts/generate-config.mjs`, spawn `dist-server/server/server.js` as the child process, forward termination signals, and propagate the server exit status.
- [x] T009 [US1] Add `.dockerignore` entries for `node_modules/`, VCS metadata, build/test output, logs, environment files, and coverage while retaining source/tests needed by `npm run build`.
- [x] T010 [US1] Add `.png`, `.jpg`, and `.jpeg` static content types to `server/server.ts` so code-hosted logos are served with correct media types in the container.

**Checkpoint**: The production image builds, starts as non-root, generates runtime configuration, serves the application, and reports health.

---

## Phase 4: User Story 2 - Build and Publish through GitHub Actions (Priority: P1)

**Goal**: Validate the application before building and conditionally publish a traceable multi-platform image to GHCR.

**Independent Test**: Workflow content declares the required triggers, permissions, validation order, Buildx/QEMU platform matrix, conditional login/push, and traceable metadata.

### Tests for User Story 2

- [x] T011 [US2] Extend `tests/unit/container-contract.test.ts` with failing-first assertions for the GitHub Actions workflow validation-before-publish order, PR no-push behavior, GHCR permissions, and platform matrix.

### Implementation for User Story 2

- [x] T012 [US2] Create `.github/workflows/container.yml` with pull-request, `master`, version-tag, and manual triggers; run the existing npm validation commands before Docker; configure QEMU/Buildx; build `linux/amd64`, `linux/arm64`, and `linux/arm/v7`; and publish only for non-PR events.
- [x] T013 [US2] Configure GHCR metadata and immutable source traceability in `.github/workflows/container.yml` using repository-derived image naming, branch/tag/SHA tags, OCI labels, and least-privilege `GITHUB_TOKEN` package permissions.
- [x] T014 [US2] Ensure the workflow does not embed feed URLs, credentials, or deployment-specific runtime configuration and that failed validation cannot reach the login/push step.

**Checkpoint**: Pull requests build without publishing; successful branch/tag/manual runs publish the multi-architecture GHCR manifest.

---

## Phase 5: User Story 3 - Run on Raspberry Pi ARM (Priority: P1)

**Goal**: Document and validate Raspberry Pi architecture selection, runtime environment, local port, health behavior, and reverse-proxy boundary.

**Independent Test**: The published manifest advertises both Raspberry Pi platform variants, and the documented `docker run` command starts the local server for an operator-managed reverse proxy.

### Tests for User Story 3

- [x] T015 [US3] Add contract assertions for Raspberry Pi `arm64`/`arm/v7` support, default port/host, runtime configuration names, and reverse-proxy scope in `tests/unit/container-contract.test.ts`.
- [x] T016 [US3] Add or update server integration coverage to assert that a missing/static build still returns an intentional response and that the health target uses the existing root route in `tests/integration/server-contract.test.ts`.

### Implementation for User Story 3

- [x] T017 [US3] Document local Docker build/run, GHCR pull, Raspberry Pi 64-bit/32-bit architecture behavior, runtime environment variables, healthcheck, and the reverse-proxy boundary in `README.md`.
- [x] T018 [US3] Add a deployment contract note in `specs/005-docker-arm-ci/contracts/container.md` and executable quickstart commands in `specs/005-docker-arm-ci/quickstart.md` matching the final Dockerfile/workflow behavior.

**Checkpoint**: Operators can pull the correct ARM variant, run the minimal server locally on the Pi, and hand the local port to their existing reverse proxy.

---

## Phase 6: Polish and Verification

- [x] T019 [P] Run the Dockerfile/workflow contract tests and existing server/application tests; fix regressions without changing the reverse-proxy scope.
- [x] T020 Run the available local Docker build/run/healthcheck validation; if the Docker daemon is unavailable, record the exact blocker and rely on static contract validation plus GitHub Actions for ARM execution.
- [x] T021 Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run e2e`, and `git diff --check`.
- [x] T022 Run the Spec Kit analyze gate and resolve cross-artifact inconsistencies without rewriting prior tasks.
- [x] T023 Run the Spec Kit converge gate; if it appends tasks, implement them and repeat implement/converge until the result is `Converged`.
- [x] T024 Execute all `specs/005-docker-arm-ci/quickstart.md` validation that is possible in the environment and inspect `git status` for the final report.

---

## Dependencies & Execution Order

- T001 precedes all work; T002–T004 are parallel foundational tasks.
- T005–T010 implement the P1 image/runtime MVP.
- T011–T014 depend on the Dockerfile contract and implement CI publication.
- T015–T018 depend on the final platform/runtime contract and complete Pi documentation.
- T019–T024 are final verification and Spec Kit gates.

## Parallel Opportunities

- T002, T003, and T004 can run in parallel because they touch separate test/context concerns.
- T007 and T012 are sequential at the contract level: the workflow must build the final Dockerfile, but documentation/test scaffolding can be parallel.
- T015 and T017 can proceed in parallel after the runtime/platform contract is fixed.

## Implementation Strategy

1. Write failing container/runtime/workflow contract tests.
2. Build the smallest non-root runtime image and entrypoint.
3. Add the validation-first multi-arch GitHub workflow.
4. Document Raspberry Pi pull/run behavior and reverse-proxy boundary.
5. Run local tests and Docker validation where possible, then complete analyze/converge and final repository gates.

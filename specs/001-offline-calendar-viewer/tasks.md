---

description: "Task list for Offline Calendar Viewer"
---

# Tasks: Offline Calendar Viewer

**Input**: Design documents from `/specs/001-offline-calendar-viewer/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, and `quickstart.md`

**Tests**: Included because the plan and quickstart define unit, integration,
browser, security, accessibility, and performance gates.

**Organization**: Tasks are grouped by user story so each story can be
implemented and validated as an incremental delivery.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the TypeScript, Vite, Node.js 22, lint, and test
toolchain.

- [X] T001 Initialize `package.json` with Node.js 22 engine constraints, Vite, `ical.js`, `web-vitals`, Vitest, Playwright, and named `dev`, `build`, `test`, `lint`, `typecheck`, and `e2e` scripts.
- [X] T002 [P] Create `tsconfig.json`, `vite.config.ts`, and `index.html` for the vanilla TypeScript browser entrypoint and Node-compatible build output.
- [X] T003 [P] Create `eslint.config.js`, `vitest.config.ts`, and `playwright.config.ts` with TypeScript, browser, and Node test targets.
- [X] T004 [P] Create `public/manifest.webmanifest` and baseline responsive/focus styles in `src/styles.css` without adding a UI framework.
- [X] T005 [P] Create `scripts/generate-config.mjs` and `.env.example` to map `JUSTCALENDAR_DEFAULT_ICS_URL` and `JUSTCALENDAR_TELEMETRY_URL` into same-origin `/config.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the shared boundaries required by every user story.

**Checkpoint**: The proxy, feed boundary, calendar normalization, storage,
telemetry, and server routing are independently testable before story UI work
begins.

- [X] T006 [P] Define SSRF and upstream-policy cases in `tests/unit/ics-proxy.test.ts`, including absolute HTTPS URLs, no credentials/fragments, 2 KiB URL limit, mixed DNS results, non-global addresses, redirects, 1 MiB bodies, 10-second deadlines, and 16-request concurrency.
- [X] T007 Implement the hardened upstream proxy in `server/ics-proxy.ts` after T006 defines its policy cases, with DNS resolution on every request, validated-IP connections, fixed headers, redirect rejection, response limits, timeout handling, and RFC 9457 error mapping.
- [X] T008 [P] Define runtime-config and `POST /api/v1/ics` boundary cases in `tests/unit/feed.test.ts`, including `schemaVersion: 1`, successful `text/calendar`, and versioned `application/problem+json` errors.
- [X] T009 Implement config and proxy boundary validation in `src/feed.ts` after T008 defines its cases, including same-origin `POST /api/v1/ics`, timeout handling, Problem Details mapping, HTTPS URL validation, and preservation of the active URL after failure.
- [X] T010 [P] Define iCalendar normalization cases in `tests/unit/calendar.test.ts` for folded lines, escaped text, UTC/floating/TZID times, all-day events, `DTEND`/`DURATION`, recurrence, exclusions, `RECURRENCE-ID`, duplicate occurrences, malformed items, and the occurrence limit.
- [X] T011 Implement parsing, normalization, bounded recurrence expansion, deduplication, sorting, and text sanitization in `src/calendar.ts` after T010 defines its cases, using `ical.js`; never execute `VALARM` or dereference external feed properties.
- [X] T012 Implement same-origin static serving and `POST /api/v1/ics` routing in `server/server.ts` after T007, including JSON/body/header limits, allowed response headers, status mapping, and static frontend fallback.
- [X] T013 Implement IndexedDB settings and snapshot persistence in `src/storage.ts` with schema version `1`, one effective URL, local override/reset state, and atomic replacement of only fully validated snapshots.
- [X] T014 Implement deployment-safe error and Web Vitals reporting in `src/telemetry.ts` for the allowed event names, excluding feed URLs, event UIDs, descriptions, credentials, and conference tokens.
- [X] T015 Add proxy/server integration coverage in `tests/integration/server-contract.test.ts` after T012, using local HTTP fixtures for success, malformed feed, timeout, redirect, oversize, rate-limit, and SSRF rejection responses.

---

## Phase 3: User Story 1 - View Upcoming Events (Priority: P1) - MVP

**Goal**: Open directly to the deployment feed, display validated upcoming
events in order, and support one validated local URL replacement or reset.

**Independent Test**: With a valid deployment config and a public ICS fixture,
open the app without setup, inspect ordered event details, replace the URL,
reload, reset it, and exercise a feed without browser-readable CORS headers
through the same-origin proxy.

### Tests for User Story 1

- [X] T016 [P] [US1] Define the default-feed, replacement, reset, ordered-event, empty-feed, malformed-feed, and CORS-blocked-upstream journey in `tests/integration/us1-feed-view.test.ts`.
- [X] T017 [P] [US1] Define browser acceptance coverage for first visit, event details, URL replacement persistence, reset, configuration recovery, retry, keyboard focus, and proxy errors in `tests/e2e/us1-feed-view.spec.ts`.

### Implementation for User Story 1

- [X] T018 [US1] Create semantic event-list, event-detail, source replacement/reset, loading, empty, error, and retry markup/rendering in `src/ui.ts` using text nodes and accessible labels/status regions.
- [X] T019 [US1] Implement explicit app state transitions in `src/app.ts` for config loading, effective URL selection, proxy retrieval, validation, last-known-good preservation, replacement validation, reset, and deliberate error/empty states.
- [X] T020 [US1] Bootstrap the viewer in `src/main.ts`, load `/config.json`, connect `src/app.ts` to `src/ui.ts`, register telemetry, and start the Node-served application without requiring initial feed entry.
- [X] T021 [US1] Complete the P1 integration and browser scenarios in `tests/integration/us1-feed-view.test.ts` and `tests/e2e/us1-feed-view.spec.ts`, keeping all new task checks green before the story checkpoint.

**Checkpoint**: User Story 1 is independently usable and deployable as the MVP.

---

## Phase 4: User Story 2 - Filter Events on Demand (Priority: P2)

**Goal**: Filter the active snapshot by date range and text, represent filter
state in the URL, and restore the default view when filters are cleared.

**Independent Test**: With a snapshot containing events across dates and text,
apply date and query filters, reload the filtered URL, inspect the result state,
and clear filters to restore the upcoming list.

### Tests for User Story 2

- [X] T022 [P] [US2] Define filter normalization, invalid-parameter fallback, inclusive date bounds, case-insensitive text matching, empty results, clear behavior, and 5,000-occurrence timing cases in `tests/unit/filters.test.ts`.
- [X] T023 [P] [US2] Define date-filter, query-filter, URL-reload, clear-filter, empty-result, keyboard, and mobile viewport scenarios in `tests/e2e/us2-filters.spec.ts`.

### Implementation for User Story 2

- [X] T024 [US2] Implement `from`, `to`, and `query` URL parameter parsing/serialization and invalid-value fallback in `src/app.ts` without introducing global client state.
- [X] T025 [US2] Implement date-range and text-filter controls, active-filter summary, clear action, and deliberate no-match copy in `src/ui.ts` with semantic labels and focus order.
- [X] T026 [US2] Implement pure filtering and sorting over normalized occurrences in `src/calendar.ts`, preserving the stored snapshot and meeting the two-second target for 5,000 occurrences.
- [X] T027 [US2] Complete the P2 unit and browser scenarios in `tests/unit/filters.test.ts` and `tests/e2e/us2-filters.spec.ts` at the story checkpoint.

**Checkpoint**: User Stories 1 and 2 remain independently usable; filtering is
URL-addressable and does not mutate feed selection or stored snapshots.

---

## Phase 5: User Story 3 - View the Last Snapshot Offline (Priority: P3)

**Goal**: Open the app shell and latest validated snapshot offline, show stale
status and last refresh time, and retain useful filtering without connectivity.

**Independent Test**: Load a feed, disable network access, reopen on a mobile
browser context, confirm the snapshot and stale state appear, filter offline,
and confirm the no-snapshot state when storage has no saved data.

### Tests for User Story 3

- [X] T028 [P] [US3] Define snapshot atomicity, stale timestamp, storage-unavailable, no-snapshot, and offline filter cases in `tests/integration/us3-storage-offline.test.ts`.
- [X] T029 [P] [US3] Define mobile browser offline, service-worker shell, stale snapshot, no-snapshot recovery, reload, and keyboard scenarios in `tests/e2e/us3-offline.spec.ts`.

### Implementation for User Story 3

- [X] T030 [US3] Implement app-shell caching and service-worker lifecycle in `public/service-worker.js`, including safe cache versioning, update cleanup, and a network-independent shell fallback.
- [X] T031 [US3] Integrate `src/storage.ts` snapshots with `src/app.ts` so failed refreshes preserve last-known-good data, offline data is marked stale with `fetchedAt`, and no-snapshot recovery remains explicit.
- [X] T032 [US3] Wire service-worker registration and offline startup in `src/main.ts`, including browser/storage failure states and the five-second snapshot-open target.
- [X] T033 [US3] Complete mobile/PWA metadata and responsive behavior in `index.html`, `public/manifest.webmanifest`, and `src/styles.css` without requiring an install prompt.
- [X] T034 [US3] Complete the P3 integration and mobile-browser scenarios in `tests/integration/us3-storage-offline.test.ts` and `tests/e2e/us3-offline.spec.ts` at the story checkpoint.

**Checkpoint**: All three user stories work independently from a deployed
Node.js 22 service and remain usable with an outdated local snapshot offline.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Close release gates across stories without adding product scope.

- [X] T035 [P] Add focused telemetry contract tests in `tests/unit/telemetry.test.ts` for allowed event names, payload redaction, sampling/throttling, and endpoint failure isolation.
- [X] T036 [P] Add security regression coverage in `tests/integration/security-proxy.test.ts` for DNS rebinding, private/local/metadata address rejection, credentials, redirects, oversized bodies, and concurrency exhaustion.
- [X] T037 [P] Add accessibility and keyboard requirements coverage in `tests/e2e/accessibility.spec.ts` for labels, focus order, status announcements, visible focus, contrast hooks, and no clickable non-semantic elements.
- [X] T038 [P] Add Core Web Vitals and route-budget checks in `tests/e2e/performance.spec.ts` for LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, filtering <= 2s at 5,000 occurrences, and offline snapshot open <= 5s.
- [X] T039 [P] Document local commands, environment configuration, proxy deployment, optional ingress Basic Authentication, no in-app credentials/sessions, rollback, and telemetry setup in `README.md`.
- [X] T040 Run every scenario in `specs/001-offline-calendar-viewer/quickstart.md`, record any requirement gaps, and update only the affected implementation or test files before release.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; creates the toolchain and runtime skeleton.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user-story work.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1's app shell and normalized snapshot flow.
- **User Story 3 (Phase 5)**: Depends on User Story 1's app shell and storage flow; can proceed in parallel with User Story 2 after Phase 3.
- **Polish (Phase 6)**: Depends on all desired stories and their checkpoints.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on another user story; requires Phase 2.
- **User Story 2 (P2)**: Requires the P1 event list and snapshot model; no dependency on P3.
- **User Story 3 (P3)**: Requires the P1 app lifecycle and snapshot model; can proceed in parallel with P2.

### Parallel Opportunities

- Phase 1 tasks T002-T005 can run in parallel after T001 defines the package scripts.
- Phase 2 policy, feed, and calendar test/implementation pairs can proceed in parallel where they touch different files; T012 and T015 wait for proxy implementation.
- After Phase 2, US1 test authoring T016-T017 can run in parallel before UI/app integration.
- After US1, US2 and US3 can be assigned to separate contributors; within each story, unit and browser test authoring can run in parallel.
- Phase 6 tasks T035-T039 can run in parallel after the story checkpoints.

## Parallel Example: User Story 1

```text
T016: Write tests/integration/us1-feed-view.test.ts
T017: Write tests/e2e/us1-feed-view.spec.ts
```

## Parallel Example: User Story 2

```text
T022: Write tests/unit/filters.test.ts
T023: Write tests/e2e/us2-filters.spec.ts
```

## Parallel Example: User Story 3

```text
T028: Write tests/integration/us3-storage-offline.test.ts
T029: Write tests/e2e/us3-offline.spec.ts
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational proxy, feed, parser, storage, telemetry, and server work.
3. Complete Phase 3 User Story 1.
4. Stop and validate default-feed viewing, URL replacement/reset, CORS-independent proxy access, and retry states.
5. Deploy/demo the P1 slice before adding filters or offline enhancements.

### Incremental Delivery

1. Add User Story 2 after the P1 checkpoint and deploy/demo filtering independently.
2. Add User Story 3 after the P1 checkpoint and deploy/demo offline snapshot behavior independently.
3. Complete Phase 6 release gates and rerun `quickstart.md`.

### Notes

- `[P]` means the task uses different files and has no dependency on incomplete work.
- `[US1]`, `[US2]`, and `[US3]` map tasks to the prioritized stories in `spec.md`.
- Every task includes the implementation or test file path it changes.
- No application-level credentials, sessions, or account features are included.

## Phase 7: Convergence

- [X] T041 Add an abortable client request deadline and explicit timeout/retry state transitions per FR-010 and plan loading constraint (partial).
- [X] T042 Validate IndexedDB snapshot schema/source/occurrences on reads and keep successful online viewing usable when storage is unavailable per FR-012, T013, and T031 (partial).
- [X] T043 Complete the public/non-global address policy matrix and add DNS rebinding, metadata, redirect, body-limit, timeout, and concurrency regression coverage per FR-004, T006, T007, and T036 (partial).
- [X] T044 Enforce `application/problem+json` schema version and `VCALENDAR`/`VERSION:2.0` response validation before display per FR-004 and the ICS retrieval contract (partial).
- [X] T045 Complete telemetry payloads and behavior with app revision, stable redacted reasons, navigation type, sampling/throttling, short timeout, all allowed event emissions, and contract tests per the telemetry contract, T014, and T035 (partial).
- [X] T046 Add and pass the US1 integration and Playwright journeys for default loading, details, replacement/reset, recovery, malformed feeds, CORS-independent proxy use, retry, and keyboard access per US1/AC1-7, SC-005, SC-007, T016, T017, and T021 (missing).
- [X] T047 Normalize impossible/reversed filter dates and add US2 browser, reload, clear, mobile, and 5,000-occurrence performance coverage per US2/AC1-3, SC-003, T022, T023, and T027 (partial).
- [X] T048 Add storage/offline integration and mobile browser coverage for atomic snapshots, stale display, storage failure, no-snapshot recovery, offline filtering, shell reload, and keyboard use per US3/AC1-3, SC-004, SC-005, T028, T029, and T034 (missing).
- [X] T049 Restrict the service-worker offline root fallback to navigation requests and verify cached static assets support a network-independent shell per FR-012 and T030 (partial).
- [X] T050 Add accessibility, keyboard, Core Web Vitals, filter-scale, and offline-open browser gates per FR-013, SC-001, SC-003, SC-006, T037, and T038 (missing).
- [X] T051 Execute and record every configured-feed, proxy, retry, offline, keyboard, and production-deployment scenario in the quickstart per T040 (missing).

## Phase 8: Convergence

- [X] T052 CRITICAL Replace the hidden module-level `activeRequests` limiter in `server/ics-proxy.ts` with explicitly owned/injected concurrency state and preserve the 16-request policy per Constitution II (contradicts).
- [X] T053 CRITICAL Add an abortable runtime-config load and a configuration retry path that reloads `/config.json` in `src/main.ts`/`src/app.ts` per Constitution IV, FR-010, and the deployment-config contract (partial).
- [X] T054 CRITICAL Replace synthetic/fallback performance checks with real LCP/INP/CLS assertions, measure offline snapshot-open time, and enforce a tracked route bundle-size budget per Constitution VI, the plan performance goals, and SC-003/SC-004 (partial).
- [X] T055 CRITICAL Add CI and release-validation commands/workflow covering the documented checks, deployed `/config.json` and proxy behavior, telemetry availability, and rollback verification per Constitution VIII/IX (missing).
- [X] T056 Preserve the in-memory last-known-good snapshot when a refresh fails and IndexedDB is unavailable, with regression coverage per FR-003, FR-011, T031, and the snapshot data model (partial).
- [X] T057 Merge `RECURRENCE-ID` overrides into their parent series so the replaced base occurrence is not also displayed per the ICS contract, FR-006, and the occurrence data model (partial).
- [X] T058 Reject or mark events containing both `DTEND` and `DURATION` as invalid while retaining valid feed items per the ICS parsing contract (partial).
- [X] T059 Deep-validate IndexedDB snapshot URLs, occurrence dates/fields, and the 5,000-occurrence bound before display per T013 and the snapshot data model (partial).
- [X] T060 Normalize reversed or impossible filter ranges when filters are written from the UI, not only when read from the URL, per FR-008, FR-009, and the filter data model (partial).
- [X] T061 Enforce telemetry detail redaction, provide a deployment revision instead of the hardcoded `development` value, and preserve stable proxy/validation reason codes per the telemetry contract and T014/T045 (partial).
- [X] T062 Apply the proxy URL policy, including length, port, credential, fragment, and public-HTTPS checks, to runtime configuration and persisted local overrides per FR-001, FR-004, and the deployment/config contracts (partial).
- [X] T063 Convert malformed `application/problem+json` responses into a stable retryable feed error instead of exposing a JSON parser exception per FR-004, FR-010, and the ICS contract (partial).
- [X] T064 Include the current calendar date when determining the upcoming window for all-day events per FR-005 and the calendar edge cases (partial).
- [X] T065 Preserve and present recurrence metadata for base occurrences, not only `RECURRENCE-ID` overrides, per FR-005/FR-006 and the occurrence data model (partial).

## Phase 9: Convergence

- [ ] T066 CRITICAL Execute the deployment, telemetry, and rollback smoke gate with real HTTPS release values, make `verify:release` probe telemetry reachability, and record the result per Constitution IX, T055, and the quickstart (partial).
- [X] T067 Harden `isValidSnapshot()` against null/primitive occurrence records and strictly validate stored dates so malformed IndexedDB data fails closed without throwing per FR-015, T059, and the snapshot data model (partial).
- [X] T068 Validate the complete Problem Details response shape, including `status` and `type`, before mapping proxy errors per Constitution III, FR-004, and the ICS contract (partial).
- [X] T069 Add an explicit inbound HTTP header-size limit and regression coverage to `server/server.ts` per the plan network constraints and T012 (partial).
- [X] T070 Require a non-development deployment revision in release configuration and release validation while retaining the fallback only for local development per the telemetry and deployment-config contracts (partial).

## Phase 10: Convergence

- [ ] T071 CRITICAL Supply real HTTPS release, probe-feed, and rollback values, run `npm run verify:release`, and record successful deployment smoke output per Constitution IX, T066, and the quickstart (partial).

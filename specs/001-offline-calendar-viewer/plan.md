# Implementation Plan: Offline Calendar Viewer

**Branch**: `001-offline-calendar-viewer` | **Date**: 2026-09-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-offline-calendar-viewer/spec.md`

## Summary

Build a read-only, mobile-friendly calendar viewer that starts with one
deployment-provided public ICS URL, permits one validated local replacement,
and retains the latest successful snapshot for offline viewing. Use a
standards-first vanilla TypeScript web app with a minimal Node.js 22 same-origin
service: Vite for build tooling, `ical.js` for iCalendar parsing and recurrence,
IndexedDB for application data, and a small service worker with Cache Storage
for the application shell. Keep filters in the URL and render feed values as
text through semantic HTML.

## Technical Context

<!--
  Technical context selected for the offline calendar viewer.
-->

**Language/Version**: TypeScript 5.x and Node.js 22 targeting evergreen browsers

**Primary Dependencies**: Node built-ins (`node:http`, `node:https`, `node:dns`,
`node:net`), Vite, `ical.js`, `web-vitals`, and Vitest; Playwright covers
browser validation

**Storage**: IndexedDB for settings and validated snapshots; Cache Storage for
same-origin application assets

**Testing**: Vitest for domain and boundary tests; Playwright for browser,
keyboard, mobile, offline, and service-worker flows

**Target Platform**: Node.js 22 service serving HTTPS traffic to mobile and
desktop evergreen browsers; the app shell is offline-capable, but install
prompts are not required

**Project Type**: Single-project web application with a minimal same-origin
proxy and offline-first behavior

**Performance Goals**: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at the 75th
percentile; filters visible within 2s for 5,000 occurrences; saved snapshots
open within 5s

**Constraints**: One active feed URL; runtime configuration comes from a
same-origin deployment-generated `/config.json`; feed retrieval uses the
same-origin versioned `/api/v1/ics` proxy with pinned DNS, no redirects,
public-HTTPS SSRF checks, bounded headers/body/timeouts, and concurrency limits;
loading has a timeout, errors have retry, snapshots are last-known-good, feed
strings are never rendered as markup, and no event editing or provider
authentication is supported

**Scale/Scope**: One viewer route, one active feed, one local snapshot, and up
to 5,000 event occurrences in the supported display window; one narrow
same-origin feed retrieval endpoint, no accounts, event mutations, or multi-feed
aggregation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion**: PASS. Use a small vanilla TypeScript surface;
  the same-origin proxy is the minimum user-required server boundary and uses
  Node built-ins instead of a framework.
- II. **Explicit Dependencies**: PASS. Pass storage, network, clock, and
  telemetry dependencies into modules; no import-time effects or implicit
  context.
- III. **Network Boundary**: PASS. Version and validate deployment config,
  proxy requests/responses, and feed data at boundary modules; require HTTPS,
  DNS/IP checks, no redirects, timeouts, bounded responses, parser checks, and
  text-only rendering.
- IV. **Proven State**: PASS. Define loading timeout, retryable errors,
  configuration errors, stale snapshots, and deliberate empty states.
- V. **Accessibility**: PASS. Use native controls, labels, semantic event
  structure, visible focus, status announcements, and keyboard end-to-end tests.
- VI. **User-Perceived Performance**: PASS. Enforce the Core Web Vitals and
  filter/snapshot targets above; keep the shell and dependency set small.
- VII. **State at the Edge**: PASS. Store filters in URL parameters, external
  feed state as a validated snapshot, and local feed override/snapshot in IndexedDB;
  use no global client store.
- VIII. **Discoverable Commands**: PASS. Add named `dev`, `build`, `test`,
  `lint`, `typecheck`, and `e2e` scripts and document the same commands CI
  runs.
- IX. **User-Realized Value**: PASS. Add deployment-configured error and
  Web Vitals reporting, a rollback-safe static deployment, and a release
  checklist covering deployed offline behavior.

**Post-Design Re-check**: PASS. Phase 1 keeps one active URL, validates all
network/configuration/proxy inputs at boundaries, stores only last-known-good
data, uses URL state for filters, defines retry/stale/empty states, and
documents proxy security, performance, accessibility, telemetry, and rollback
validation. No constitution exception or unresolved design clarification
remains.

## Project Structure

### Documentation (this feature)

```text
specs/001-offline-calendar-viewer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  Target source layout for the offline calendar viewer.
-->

```text
package.json
index.html
vite.config.ts

src/
├── main.ts                 # bootstrap, config load, and app lifecycle
├── app.ts                  # explicit UI state transitions and commands
├── calendar.ts             # normalized occurrences, recurrence, and filters
├── feed.ts                 # config/feed fetch, timeout, and validation boundary
├── storage.ts              # IndexedDB settings and last-known-good snapshot
├── ui.ts                   # semantic DOM rendering and event wiring
├── telemetry.ts            # error and Web Vitals reporting adapter
├── public/service-worker.js # app-shell Cache Storage lifecycle
└── styles.css              # responsive layout and visible focus styles

server/
├── server.ts               # same-origin static and /api/v1/ics routing
└── ics-proxy.ts            # URL policy, DNS pinning, limits, and upstream fetch

tests/
├── unit/                   # calendar, proxy policy, feed validation, storage
├── integration/            # config, proxy, snapshot, and offline state flows
└── e2e/                    # keyboard, mobile viewport, and network failures

public/
└── manifest.webmanifest    # metadata only; installation is not required

scripts/
└── generate-config.mjs      # maps deployment env vars to config.json
```

**Structure Decision**: Use one browser application with shallow domain modules
under `src/` and one minimal Node service under `server/`, avoiding a framework
component tree, global state library, and separate proxy service. Keep proxy
policy, parser/network/storage seams independently testable, with browser
behavior covered by integration and end-to-end tests. The repository currently
contains only Spec Kit documents, so this is the target structure to create
during implementation.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The design follows the constitution without an exception. |

# Implementation Plan: German, Brandable Event-First Calendar UI

**Branch**: `002-event-first-layout` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-event-first-layout/spec.md`

## Summary

Extend the existing vanilla TypeScript calendar viewer so the complete application-owned
interface is German, deployment owners can configure the two heading strings through
runtime environment configuration, and event cards become the dominant, separately
presented interactive content. Preserve the existing feed, URL filter, snapshot, offline,
and recovery boundaries. Add safe Google Maps search links for event locations and refine
secondary panels and refresh status into compact, modern responsive controls.

The implementation reuses the existing Vite/Node configuration pipeline and semantic
native elements. It adds no dependency, global state, persisted UI state, or new network
endpoint.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22; browser UI targets evergreen desktop and mobile browsers

**Primary Dependencies**: Existing Vite, TypeScript, Vitest, and Playwright toolchain; no new dependency

**Storage**: No new storage. Existing IndexedDB feed/snapshot state and URL filter state remain unchanged; open event/panel state is transient DOM/UI state.

**Testing**: Existing Vitest unit tests plus Playwright browser tests for German copy, branding fallback, event disclosure, Google Maps links, accessibility, mobile layout, filtering, feed settings, offline states, and performance

**Target Platform**: Existing Node.js-served web application in evergreen desktop and mobile browsers, including 320 CSS-pixel mobile layouts

**Project Type**: Single-project web application with a vanilla TypeScript browser UI

**Performance Goals**: Preserve current LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, 5,000-occurrence filtering within 2s, and offline snapshot open within 5s; event disclosure and compact controls must not block rendering or introduce overflow

**Constraints**: Application-owned copy is German; configured branding is plain text; events precede secondary content; event cards are separated and clearly expandable; settings and filters are hidden by default and mutually exclusive; refresh and recency remain after primary content; native semantic controls, safe external links, visible focus, and deliberate loading/error/empty/stale states are required

**Scale/Scope**: One existing viewer route, up to 5,000 occurrences, two heading values, one event list, one settings disclosure, one filter disclosure, one bottom refresh utility, and existing feed/snapshot boundaries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion**: PASS. Keep translation and presentation helpers small and local to the existing UI/config modules; add no framework or speculative abstraction.
- II. **Make Dependencies Explicit**: PASS. Extend the explicit runtime config shape and keep event/panel presentation state local to `src/ui.ts`; no hidden global state or import-time side effects.
- III. **Treat the Network as the Boundary**: PASS. Validate optional branding fields in `parseRuntimeConfig`; keep calendar data validation unchanged; Google Maps is a derived external link, not a new fetch path.
- IV. **Render What Can Be Proven**: PASS. Translate and retain deliberate loading, retry, error, empty, stale, partial, and no-snapshot states.
- V. **Accessibility Is a Correctness Property**: PASS. Use native `details/summary`, buttons, anchors, German accessible names, safe focus order, keyboard activation, Escape for panels, and visible focus.
- VI. **Measure What Users Feel**: PASS. Preserve existing web-vitals, bundle, filtering, and offline budgets; add event hierarchy, mobile reflow, and no-overflow checks.
- VII. **Keep State at the Edge Where It Is Needed**: PASS. Keep URL filters and snapshots in their existing boundaries; event expansion and panel visibility remain transient UI state.
- VIII. **Make Commands Discoverable and CI-Consistent**: PASS. Reuse the existing `lint`, `typecheck`, `test`, `build`, `e2e`, and release verification commands.
- IX. **Realize Value at the User**: PASS with existing release gate. The visible language, branding, and layout changes remain covered by the existing deployment, telemetry, and rollback validation.

## Phase 0: Research Decisions

See [research.md](research.md) for the decisions that resolve localization, branding,
semantic disclosure, and map-link behavior.

## Phase 1: Design Artifacts

- [data-model.md](data-model.md) defines the existing state boundaries plus derived brand,
  event-card, and map-link presentation data.
- [contracts/ui.md](contracts/ui.md) defines document order, German accessible labels,
  disclosure semantics, branding configuration, and safe map links.
- [quickstart.md](quickstart.md) defines runnable validation and manual review scenarios.

## Project Structure

### Documentation (this feature)

```text
specs/002-event-first-layout/
├── plan.md              # This file
├── research.md          # Phase 0 decisions and sources
├── data-model.md        # Presentation state and existing state boundaries
├── quickstart.md        # Validation scenarios and commands
├── contracts/
│   └── ui.md            # German UI, disclosure, branding, and map-link contract
└── tasks.md             # Phase 2 output from /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.ts               # Existing feed, filter, snapshot, and recovery state
├── feed.ts              # Runtime config contract and validated branding fields
├── main.ts              # Existing bootstrapping and runtime config loading
├── styles.css           # Event-card hierarchy and compact responsive controls
└── ui.ts                # German copy, event/map rendering, disclosures, utility placement

scripts/
└── generate-config.mjs  # Environment variables -> public runtime config

index.html               # German document language and loading shell

tests/
├── unit/
│   └── feed.test.ts     # Runtime config branding validation regressions
└── e2e/
    ├── accessibility.spec.ts   # German names, disclosure state, focus, Escape, links
    ├── us1-feed-view.spec.ts   # Event-first cards, details, maps, settings actions
    ├── us2-filters.spec.ts     # German filter disclosure and URL-backed behavior
    ├── us3-offline.spec.ts     # German state copy and bottom refresh utility
    └── performance.spec.ts     # Event-first render, responsive overflow, existing budgets
```

**Structure Decision**: Keep the existing shallow single-project structure. The runtime
configuration remains a versioned response validated at the feed boundary. Presentation
copy and transient disclosure state stay in `src/ui.ts`; visual hierarchy remains in the
existing stylesheet; browser tests continue to validate user-visible contracts.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature reuses existing UI, config, storage, and test boundaries. |

## Post-Design Constitution Check

- Optional runtime branding fields remain validated before rendering, so no untrusted config
  string reaches the DOM as markup.
- User-provided event fields remain text nodes; only the derived Google Maps URL is encoded.
- No new persistent or global state is introduced.
- The final validation must run the documented local commands and `git diff --check`.

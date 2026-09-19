# Implementation Plan: Event-First Calendar Layout

**Branch**: `002-event-first-layout` | **Date**: 2026-09-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-event-first-layout/spec.md`

## Summary

Reorder the existing calendar viewer so event content is the first primary
content and the most prominent visual element. Keep feed settings and filter
fields closed by default behind accessible disclosure buttons, allow only one
secondary panel open at a time, and move refresh plus recency information into
a static utility area after the event content. Keep feed, snapshot, filter URL,
offline, and error state behavior unchanged. Use the existing vanilla
TypeScript/Vite UI without adding dependencies, global state, or persisted UI
state.

## Technical Context

**Language/Version**: TypeScript 5.x and Node.js 22; browser UI targets evergreen desktop and mobile browsers

**Primary Dependencies**: Existing Vite, TypeScript, Vitest, and Playwright toolchain; no new dependency

**Storage**: No new storage. Existing IndexedDB feed/snapshot state and URL filter state remain unchanged; panel visibility is transient UI state.

**Testing**: Existing Vitest unit tests plus Playwright browser tests for accessibility, mobile layout, filtering, feed settings, offline states, and performance

**Target Platform**: Existing Node.js-served web application in evergreen desktop and mobile browsers, including 320 CSS-pixel mobile layouts

**Project Type**: Single-project web application with a vanilla TypeScript browser UI

**Performance Goals**: Preserve current LCP <= 2.5s, INP <= 200ms, CLS <= 0.1, 5,000-occurrence filtering within 2s, and offline snapshot open within 5s; disclosure actions must not introduce visible layout overflow or block event rendering

**Constraints**: Events must precede expanded secondary content; settings and filters are hidden by default and mutually exclusive; update and recency remain after primary event content; no new global or persisted panel state; native semantic controls, predictable keyboard focus, Escape close, visible focus, and deliberate loading/error/empty/stale states are required

**Scale/Scope**: One existing viewer route, one event list, one settings disclosure, one filter disclosure, one bottom refresh utility, and the existing supported snapshot size of up to 5,000 occurrences

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion**: PASS. Change the existing `src/ui.ts` and `src/styles.css` directly; add no component framework, disclosure abstraction, or dependency.
- II. **Make Dependencies Explicit**: PASS. Keep the presentation-only open-panel value local to the UI mount; do not add hidden module state or change `AppState` dependencies.
- III. **Treat the Network as the Boundary**: PASS. No network contract changes. Existing feed and snapshot validation remain the only sources for rendered event data.
- IV. **Render What Can Be Proven**: PASS. Preserve loading, retry, error, empty, stale, and no-snapshot content while moving the refresh utility.
- V. **Accessibility Is a Correctness Property**: PASS. Use semantic buttons, `aria-expanded`, `aria-controls`, native forms, logical DOM order, Escape close, focus return, and visible focus tests.
- VI. **Measure What Users Feel**: PASS. Preserve existing web-vitals, bundle, filtering, and offline budgets; add viewport overflow and event-first layout checks.
- VII. **Keep State at the Edge Where It Is Needed**: PASS. Keep filter values in the URL and feed/snapshot state in existing app/storage boundaries; panel visibility is ephemeral presentation state.
- VIII. **Make Commands Discoverable and CI-Consistent**: PASS. Reuse existing `lint`, `typecheck`, `test`, `build`, and `e2e` commands; no new command is needed.
- IX. **Realize Value at the User**: PASS with existing release gate. The feature changes user-visible layout only, so existing deployment, telemetry, and rollback validation remain required.

## Project Structure

### Documentation (this feature)

```text
specs/002-event-first-layout/
├── plan.md              # This file
├── research.md          # Phase 0 decisions and sources
├── data-model.md        # Presentation state and existing state boundaries
├── quickstart.md        # Validation scenarios and commands
├── contracts/
│   └── ui.md            # Disclosure and layout contract
└── tasks.md             # Phase 2 output from /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── ui.ts                # event-first DOM order, disclosures, focus, utility placement
└── styles.css           # hierarchy, panel styling, responsive reflow, overflow prevention

tests/
├── unit/
│   └── app.test.ts      # regression coverage for unchanged feed/filter state boundaries
└── e2e/
    ├── accessibility.spec.ts   # names, expanded state, focus, Escape, panel visibility
    ├── us1-feed-view.spec.ts   # settings disclosure and unchanged feed actions
    ├── us2-filters.spec.ts     # filter disclosure, active state, reload, clear
    ├── us3-offline.spec.ts      # offline filtering and bottom refresh utility
    └── performance.spec.ts      # event-first render and existing budgets
```

**Structure Decision**: Keep the existing shallow single-project structure.
Presentation state belongs in `src/ui.ts` because it does not affect feed,
snapshot, or URL state. The implementation uses normal document flow rather
than overlays so expanded content remains reachable and responsive. Tests stay
in the existing unit and browser suites.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature reuses existing UI, state, and test boundaries. |

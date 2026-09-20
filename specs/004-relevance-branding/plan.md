# Implementation Plan: Relevance Styling and Filter Reset

**Branch**: `004-relevance-branding` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-relevance-branding/spec.md`

## Summary

Extend the existing German event-first viewer with a derived past-event presentation state, a
cohesive blue palette, optional same-origin PNG/JPG logo support, and reload-only filter reset.
Past events remain fully interactive but receive a muted card treatment. The logo loader prefers
`/logo.png`, falls back to `/logo.jpg`, and removes failed imagery without affecting text brand
layout. On full bootstrap, only date/query filter state is reset; feed overrides, snapshots,
branding, and offline behavior remain unchanged.

The implementation reuses the existing vanilla TypeScript UI, two-month date-range helper,
URL-backed in-session filter actions, CSS, and Playwright/Vitest setup. No new dependency,
endpoint, storage area, or upload flow is required.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22; evergreen desktop and mobile browsers

**Primary Dependencies**: Existing `ical.js`, Vite, Vitest, and Playwright toolchain; no new dependency

**Storage**: No new storage. Relevance is derived presentation state; logo is a public asset; filter reset occurs at bootstrap.

**Testing**: Existing Vitest unit/integration tests plus Playwright relevance, logo fallback, blue-theme, reload-reset, offline, accessibility, and performance scenarios

**Target Platform**: Existing Node.js-served web application, including 320 CSS-pixel mobile layouts

**Project Type**: Single-project web application with a vanilla TypeScript browser UI

**Performance Goals**: Preserve current LCP, INP, CLS, bundle-size, offline-open, and 5,000-occurrence filtering budgets; logo failure must not block app rendering.

**Constraints**: Past events remain keyboard accessible; blue styling preserves contrast and event prominence; PNG is preferred over JPG; absent/failed assets leave text branding intact; reload resets only filter state; explicit filter application remains in-session URL-backed.

**Scale/Scope**: One header brand area, one event-card relevance class, one CSS palette, two optional public asset paths, and one bootstrap filter-reset boundary.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion**: PASS. Add small relevance/logo helpers and adjust existing UI/styles without introducing a framework or generic branding layer.
- II. **Make Dependencies Explicit**: PASS. Relevance receives the current `Date`; logo behavior stays local to the UI; bootstrap reset is explicit in `main.ts`.
- III. **Treat the Network as the Boundary**: PASS. Logo loading is same-origin static asset handling with failure fallback; no new API or unvalidated server data is added.
- IV. **Render What Can Be Proven**: PASS. Missing logo has an intentional text fallback; failed asset loading does not blank the brand; existing error/loading/empty states remain.
- V. **Accessibility Is a Correctness Property**: PASS. Past cards stay native `details/summary` controls, logo is decorative/non-interactive, focus styling remains, and muted text is tested for readability.
- VI. **Measure What Users Feel**: PASS. Optional logo loading cannot block feed rendering, CSS changes are scoped, and all existing performance gates remain required.
- VII. **Keep State at the Edge Where It Is Needed**: PASS. Filter reset is bootstrap-local URL/UI state; feed and snapshot state are untouched; relevance is derived from event data and current time.
- VIII. **Make Commands Discoverable and CI-Consistent**: PASS. Reuse existing lint, typecheck, test, build, e2e, and release commands.
- IX. **Realize Value at the User**: PASS with existing deployment/telemetry/rollback gates; the feature remains reversible through the built artifact.

## Phase 0: Research Decisions

See [research.md](research.md) for past-state semantics, asset fallback, palette, and reload-boundary decisions.

## Phase 1: Design Artifacts

- [data-model.md](data-model.md) defines derived event relevance, logo loading state, and reload filter state.
- [contracts/ui.md](contracts/ui.md) defines card classes, German past labels, logo behavior, theme surfaces, and reset semantics.
- [quickstart.md](quickstart.md) defines runnable validation for all four requested changes and preserved behavior.

## Project Structure

### Documentation (this feature)

```text
specs/004-relevance-branding/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui.md
├── checklists/
│   ├── requirements.md
│   └── ux.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app.ts                 # Existing filter/feed state boundary
├── main.ts                # Reload filter reset and clean URL state
├── styles.css             # Blue palette, muted past cards, logo dimensions
├── ui.ts                  # Relevance labels, optional logo loader, brand markup
└── date-range.ts          # Existing default range/current-date helpers

public/
├── logo.png               # Optional deployment-provided asset (not created by default)
└── logo.jpg               # Optional fallback asset (not created by default)

tests/
├── unit/
│   ├── app.test.ts        # Reload/reset boundary regression
│   └── calendar.test.ts   # Past/ongoing/upcoming relevance fixtures if needed
└── e2e/
    ├── accessibility.spec.ts
    ├── fixtures.ts
    ├── performance.spec.ts
    ├── us1-feed-view.spec.ts
    ├── us2-filters.spec.ts
    └── us3-offline.spec.ts
```

**Structure Decision**: Keep the existing shallow single-project structure. The public logo paths
are conventions rather than committed binary assets because no user logo was supplied. The UI
tries those paths only when needed and gracefully falls back to configured text branding.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature stays within existing presentation, URL, and static-asset boundaries. |

## Post-Design Constitution Check

- Past-state styling is derived and cannot mutate event/feed/snapshot state.
- Logo input is a same-origin static image and never becomes an interactive or unsanitized HTML surface.
- Reload reset is limited to filter query parameters and does not clear persisted feed/snapshot state.
- The final validation must run the documented local commands and `git diff --check`.

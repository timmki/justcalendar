# Implementation Plan: Two-Month Calendar Filter

**Branch**: `003-two-month-filter` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-two-month-filter/spec.md`

## Summary

Extend the existing German calendar viewer so a clean load defaults to an inclusive local-date
range from today through two calendar months later. Keep explicit date selections in the
existing URL-backed filter state so reloads preserve custom and historical ranges. Expand the
normalized feed horizon enough to make recent past events available to those filters while
retaining the existing occurrence cap and performance protections.

The implementation reuses the existing vanilla TypeScript app, URL state, snapshot storage,
calendar normalization, and filter disclosure. No new dependency, endpoint, persistence store,
or separate past-events mode is needed.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 22; evergreen desktop and mobile browsers

**Primary Dependencies**: Existing `ical.js`, Vite, Vitest, and Playwright toolchain; no new dependency

**Storage**: No new storage. Explicit date filters remain URL state; snapshots retain normalized occurrences.

**Testing**: Existing Vitest unit/integration tests plus Playwright filter, reload, mobile, offline, and performance scenarios

**Target Platform**: Existing Node.js-served web application, including 320 CSS-pixel mobile layouts

**Project Type**: Single-project web application with a vanilla TypeScript browser UI

**Performance Goals**: Preserve the existing 5,000-occurrence filtering-under-two-seconds, offline-open, bundle, and Core Web Vitals budgets; default filtering must not add a blocking network request.

**Constraints**: Date boundaries are inclusive; the default uses local calendar dates; month-end targets clamp to the last valid target-month day; explicit past dates are accepted; clean URLs derive fresh defaults; URL-selected ranges survive reload; feed and snapshot state remain unchanged.

**Scale/Scope**: One viewer route, one existing date/text filter form, up to 5,000 normalized occurrences, a two-month future horizon, and a bounded recent-history horizon for past filtering.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. **Optimize for Deletion**: PASS. Add one small date-range helper and extend existing filter/normalization boundaries; no speculative abstraction layer.
- II. **Make Dependencies Explicit**: PASS. Date calculations receive an explicit `Date`; app tests inject deterministic time; no hidden UI or storage state is added.
- III. **Treat the Network as the Boundary**: PASS. No new network path or response contract; the existing validated ICS boundary supplies occurrences for filtering.
- IV. **Render What Can Be Proven**: PASS. Existing loading, empty, stale, error, and no-snapshot states remain deliberate; malformed/reversed ranges normalize to a safe state.
- V. **Accessibility Is a Correctness Property**: PASS. Existing native date inputs, labels, disclosure buttons, keyboard flow, and German accessible names remain the filter interaction.
- VI. **Measure What Users Feel**: PASS. Filtering remains bounded and tested at 5,000 occurrences; expanding the feed window is bounded by history, future horizon, and occurrence cap.
- VII. **Keep State at the Edge Where It Is Needed**: PASS. Explicit ranges stay in URL state, occurrences stay in existing server/snapshot state, and default calculation is derived at app startup.
- VIII. **Make Commands Discoverable and CI-Consistent**: PASS. Reuse the existing lint, typecheck, test, build, e2e, and release commands.
- IX. **Realize Value at the User**: PASS with existing deployment/telemetry/rollback gates; the feature changes local date selection and presentation only.

## Phase 0: Research Decisions

See [research.md](research.md) for date arithmetic, URL-state, normalization, and testing decisions.

## Phase 1: Design Artifacts

- [data-model.md](data-model.md) defines derived default and explicit date-filter state.
- [contracts/ui.md](contracts/ui.md) defines date-field, URL, reload, clear, and historical-range behavior.
- [quickstart.md](quickstart.md) defines runnable validation for clean defaults, boundaries, past ranges, reloads, and existing regressions.

## Project Structure

### Documentation (this feature)

```text
specs/003-two-month-filter/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── app.ts                 # URL-backed filter defaults, normalization, and clear behavior
├── calendar.ts            # Bounded history/future normalization window
├── date-range.ts          # Local date formatting and clamped calendar-month arithmetic
├── main.ts                # Clean-load URL filter initialization
└── ui.ts                  # German filter values, active state, and reset URL updates

tests/
├── unit/
│   ├── app.test.ts        # Deterministic default, URL, clear, and reload state
│   ├── calendar.test.ts   # Normalization horizon and historical occurrences
│   └── filters.test.ts    # Date arithmetic and inclusive filter boundaries
└── e2e/
    ├── fixtures.ts        # Stable relative-date ICS fixtures
    ├── us2-filters.spec.ts
    ├── us3-offline.spec.ts
    └── performance.spec.ts
```

**Structure Decision**: Keep the existing shallow single-project structure. A focused
`src/date-range.ts` module owns reusable local-date rules so `app.ts`, `calendar.ts`, and tests
share one clamping definition without adding a state store or dependency.

## Complexity Tracking

> No constitution exceptions require justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | The feature stays within existing app, calendar, URL, storage, and test boundaries. |

## Post-Design Constitution Check

- Date input values remain validated plain URL data and are never rendered as markup.
- Explicit date selection remains URL state; no new persistence or global state is introduced.
- Calendar normalization remains bounded by a recent-history horizon, two-month future horizon, and existing 5,000-occurrence cap.
- The final validation must run the documented local commands and `git diff --check`.

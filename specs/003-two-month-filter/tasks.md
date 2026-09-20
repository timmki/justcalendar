---

description: "Task list for Two-Month Calendar Filter"
---

# Tasks: Two-Month Calendar Filter

**Input**: Design documents from `/specs/003-two-month-filter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Required by the feature specification and quickstart; write failing tests before implementation tasks.

## Phase 1: Setup

**Purpose**: Verify the existing date-filter, calendar-normalization, URL-state, and browser-test boundaries before changing behavior.

- [X] T001 Verify the existing filter, normalization, URL-state, and quickstart commands in `src/app.ts`, `src/calendar.ts`, `tests/unit/filters.test.ts`, and `package.json`

---

## Phase 2: Foundational

**Purpose**: Establish shared deterministic local-date rules before user-story work.

**Checkpoint**: Default-range arithmetic and validation contracts are specified in tests before app or calendar integration changes.

- [X] T002 [P] Add unit tests for clamped two-calendar-month arithmetic, `YYYY-MM-DD` formatting, and clean-load default ranges in `tests/unit/filters.test.ts`
- [X] T003 [P] Add unit tests for historical/future normalization horizons, inclusive boundaries, and preserved 5,000-occurrence caps in `tests/unit/calendar.test.ts`
- [X] T004 Implement the focused local-date helper with clamped calendar-month addition and default-range derivation in `src/date-range.ts`

---

## Phase 3: User Story 1 - See the Next Two Months by Default (Priority: P1) MVP

**Goal**: A clean calendar view defaults to today through the valid date two calendar months later and excludes events outside that range.

**Independent Test**: Open a clean URL with fixture events before, on, inside, and after the default range; verify date fields, event boundaries, and month-end behavior.

### Tests for User Story 1

- [X] T005 [P] [US1] Add clean-load default date-field, inclusive-boundary, outside-range, and month-end scenarios in `tests/e2e/us2-filters.spec.ts`
- [X] T006 [P] [US1] Extend relative-date ICS fixtures with past, default-boundary, and future events in `tests/e2e/fixtures.ts`

### Implementation for User Story 1

- [X] T007 [US1] Expand normalized calendar retention to the bounded recent-history and two-calendar-month future horizon while preserving `MAX_OCCURRENCES` behavior in `src/calendar.ts`
- [X] T008 [US1] Apply the derived clean-load default range when no explicit date parameters exist, while preserving explicit URL ranges and text queries in `src/app.ts` and `src/main.ts`
- [X] T009 [US1] Keep default date values and active-filter state synchronized with the German filter form and URL updates in `src/ui.ts`

**Checkpoint**: Clean loads show the inclusive two-month horizon, month-end defaults are valid, and all existing feed/snapshot state boundaries remain unchanged.

---

## Phase 4: User Story 2 - Choose Past or Custom Date Ranges (Priority: P1)

**Goal**: Visitors can replace the default range with valid historical or mixed custom dates without an artificial minimum-date restriction.

**Independent Test**: Enter a past range, apply it, and verify historical events appear while the selected feed and snapshot remain unchanged.

### Tests for User Story 2

- [X] T010 [P] [US2] Add unit coverage for past, mixed, explicit partial, malformed, reversed, and inclusive custom ranges in `tests/unit/filters.test.ts`
- [X] T011 [P] [US2] Add browser coverage for selecting a past range, applying it, showing historical events, and preserving URL parameters in `tests/e2e/us2-filters.spec.ts`

### Implementation for User Story 2

- [X] T012 [US2] Preserve valid past date input and normalize explicit ranges without applying a today-based minimum in `src/app.ts`
- [X] T013 [US2] Ensure historical occurrences are available to filter results and remain bounded by the normalization horizon and occurrence cap in `src/calendar.ts`
- [X] T014 [US2] Preserve German labels, active-filter indication, no-results copy, and responsive date-input behavior for historical ranges in `src/ui.ts` and `src/styles.css`

**Checkpoint**: A past or mixed range is selectable, visible in the URL and form, and does not mutate feed, snapshot, or text-search state unexpectedly.

---

## Phase 5: User Story 3 - Preserve the Date Selection on Reload (Priority: P1)

**Goal**: Explicit date choices survive reload, while a clean URL derives a fresh current default; reset returns to the default range.

**Independent Test**: Apply a past range, reload, verify it remains; then use a clean URL and verify the current two-month default; finally reset and verify the default returns.

### Tests for User Story 3

- [X] T015 [P] [US3] Add deterministic app-state tests for clean defaults, explicit URL ranges, fresh-date derivation, and reset behavior in `tests/unit/app.test.ts`
- [X] T016 [P] [US3] Add reload, clean-URL, active-filter, and full-reset scenarios in `tests/e2e/us2-filters.spec.ts`

### Implementation for User Story 3

- [X] T017 [US3] Preserve explicit `from`/`to` URL parameters across reload and derive a fresh default only when both are absent in `src/app.ts` and `src/main.ts`
- [X] T018 [US3] Make the existing full filter reset restore the current two-month default, clear text search, and write the resulting range to URL state in `src/app.ts` and `src/ui.ts`

**Checkpoint**: Reload and reset behavior are deterministic, shareable, German, and compatible with existing text-search persistence.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Confirm regressions, performance, responsive behavior, and documented quickstart gates.

- [X] T019 [P] Extend offline, recovery, mobile overflow, and 5,000-occurrence performance fixtures/assertions for the new default range in `tests/e2e/us3-offline.spec.ts` and `tests/e2e/performance.spec.ts`
- [X] T020 Run the complete feature validation commands from `specs/003-two-month-filter/quickstart.md`, including `git diff --check`, and record/fix any failures in the implementation

---

## Dependencies & Execution Order

- T001 precedes all feature work.
- T002-T004 establish and implement the shared date-range foundation; T004 follows the tests.
- T005-T009 deliver the P1 default-range MVP; T005/T006 should be written before T007-T009.
- T010-T014 deliver historical/custom ranges after the normalization window exists.
- T015-T018 deliver reload and reset persistence after URL defaults exist.
- T019-T020 validate all stories together after implementation.

## Parallel Opportunities

- T002 and T003 can proceed in parallel because they touch separate test files.
- T005 and T006 can proceed in parallel because they touch separate browser files.
- T010 and T011 can proceed in parallel after the test fixture shape is agreed.
- T015, T016, and T019 can proceed in parallel after the UI contract is stable.

## Implementation Strategy

1. Complete the shared date arithmetic and normalization-window tests and helper.
2. Deliver User Story 1 as the MVP: clean two-month default with inclusive boundaries.
3. Add historical/custom range behavior while preserving the existing URL and app boundaries.
4. Add reload/reset guarantees and then run all regression/performance gates.

## Notes

- `[P]` tasks touch independent files and have no incomplete-task dependency.
- Existing German UI and prior event-first feature behavior remain in scope and must not regress.
- Do not widen the historical horizon or alter `MAX_OCCURRENCES` without updating the spec, plan, and performance tests.

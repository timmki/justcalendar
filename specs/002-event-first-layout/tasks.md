---

description: "Task list for Event-First Calendar Layout"
---

# Tasks: Event-First Calendar Layout

**Input**: Design documents from `/specs/002-event-first-layout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Browser regression coverage is required by the implementation plan and quickstart.

## Phase 1: Setup

**Purpose**: Verify existing project configuration supports the feature.

- [X] T001 Verify existing Node ignore patterns and feature commands in .gitignore and package.json

---

## Phase 2: Foundational

**Purpose**: No shared infrastructure is required; this feature reuses existing application, storage, and URL state.

**Checkpoint**: Existing state boundaries remain authoritative.

---

## Phase 3: User Story 1 - See Events First (Priority: P1) MVP

**Goal**: Put event content first and make event details dominant on every viewport.

**Independent Test**: Open a populated calendar on desktop and mobile and confirm events precede secondary content without horizontal scrolling.

- [X] T002 [P] [US1] Add event-first ordering and responsive overflow assertions in tests/e2e/performance.spec.ts
- [X] T003 [US1] Reorder viewer DOM so primary event states precede secondary panels in src/ui.ts
- [X] T004 [US1] Strengthen event hierarchy and responsive wrapping in src/styles.css

---

## Phase 4: User Story 2 - Reveal Filters on Demand (Priority: P2)

**Goal**: Keep filter fields hidden until explicitly opened while preserving URL-backed filter behavior.

**Independent Test**: Open filters, apply and hide active filters, reload, reopen, and clear without changing the feed.

- [X] T005 [P] [US2] Add filter disclosure, keyboard, persistence, and mutual-exclusion scenarios in tests/e2e/us2-filters.spec.ts
- [X] T006 [US2] Add local filters disclosure state and preserve existing URL filter actions in src/ui.ts

---

## Phase 5: User Story 3 - Keep Settings and Refresh Utilities Secondary (Priority: P3)

**Goal**: Hide feed management by default and put refresh status after primary content.

**Independent Test**: Open and close settings, press Escape, and confirm refresh and recency remain below events in all application states.

- [X] T007 [P] [US3] Add settings disclosure, Escape/focus, and bottom utility scenarios in tests/e2e/accessibility.spec.ts
- [X] T008 [P] [US3] Add feed action and bottom refresh utility scenarios in tests/e2e/us1-feed-view.spec.ts
- [X] T009 [P] [US3] Add offline and state-specific bottom utility scenarios in tests/e2e/us3-offline.spec.ts
- [X] T010 [US3] Add settings disclosure state, Escape focus return, and bottom refresh utility in src/ui.ts
- [X] T011 [US3] Style secondary disclosures and bottom utility responsively in src/styles.css

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate unchanged state boundaries and feature acceptance commands.

- [X] T012 [P] Preserve feed, snapshot, and filter state-boundary regression coverage in tests/unit/app.test.ts
- [X] T013 Run feature quickstart validation commands from specs/002-event-first-layout/quickstart.md

---

## Dependencies & Execution Order

- T001 precedes feature work.
- T002-T004 deliver the MVP event-first layout.
- T005-T006 add filters without altering existing filter state.
- T007-T011 add settings and the utility area; T010 precedes T011.
- T012-T013 complete cross-cutting validation after implementation.

## Parallel Opportunities

- T002 can proceed independently of T003-T004.
- T005 can proceed independently of T006.
- T007-T009 affect separate browser test files and can proceed in parallel.

## Implementation Strategy

1. Deliver the event-first DOM and responsive styling.
2. Add local disclosure state while retaining existing app, storage, and URL boundaries.
3. Verify browser flows and all quickstart commands.

---

## Phase 7: Convergence

- [X] T014 Preserve logical disclosure focus after filter and settings form actions re-render the viewer per contracts/ui.md (partial)
- [X] T015 Close the settings disclosure before refresh moves to the primary utility action per FR-004 and US3/AC3 (partial)

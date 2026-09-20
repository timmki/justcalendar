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

---

## Phase 8: User Story 1 - Read and Expand Events First (Priority: P1)

**Goal**: Make each event a dominant, separately presented, clearly expandable card with a safe Google Maps location link.

**Independent Test**: Open a populated calendar, inspect distinct event cards, expand one with pointer and keyboard input, and follow a location link.

- [X] T016 [P] [US1] Add event-card separation, visible German expand affordance, independent details, and Google Maps link assertions in tests/e2e/us1-feed-view.spec.ts
- [X] T017 [US1] Render German event-card affordances, recurrence/details copy, and encoded safe Google Maps location links in src/ui.ts
- [X] T018 [US1] Style each event as a distinct dominant card with responsive spacing, state affordance, and readable detail content in src/styles.css

**Checkpoint**: Events are primary, separately identifiable, keyboard-expandable, and location links preserve the original location text.

---

## Phase 9: User Story 2 - Use a Completely German, Configurable Brand (Priority: P1)

**Goal**: Translate application-owned UI and expose validated title/subtitle environment configuration with German fallbacks.

**Independent Test**: Generate config with configured, blank, and markup-like values; load normal and recovery states; verify German copy, headings, document language, and document title.

- [X] T019 [P] [US2] Add runtime branding parsing, trimming, fallback, and compatibility assertions in tests/unit/feed.test.ts
- [X] T020 [US2] Validate optional title and subtitle fields in the runtime configuration contract in src/feed.ts
- [X] T021 [US2] Emit trimmed JUSTCALENDAR_TITLE and JUSTCALENDAR_SUBTITLE values in scripts/generate-config.mjs
- [X] T022 [P] [US2] Set the German document language and loading shell fallback in index.html
- [X] T023 [P] [US2] Add German copy, configured branding, document title, and locale-formatting acceptance scenarios in tests/e2e/accessibility.spec.ts
- [X] T024 [US2] Centralize application-owned German copy, configured heading fallbacks, and German date/time formatting in src/ui.ts

**Checkpoint**: Every application-owned UI state is German, branding is configurable as plain text, and older config fixtures remain valid.

---

## Phase 10: User Story 3 - Keep Secondary Controls Slim and Modern (Priority: P2)

**Goal**: Keep filter/settings panels hidden by default and make controls and refresh/recency utility compact without reducing accessibility.

**Independent Test**: Use German filter/settings disclosures with keyboard input and verify mutually exclusive panels, active-filter indication, focus return, and bottom utility placement on desktop/mobile.

- [X] T025 [P] [US3] Update filter disclosure, active-filter, German labels, reload, clear, and URL-preservation scenarios in tests/e2e/us2-filters.spec.ts
- [X] T026 [P] [US3] Update German offline, error, empty, stale, and bottom refresh-utility scenarios in tests/e2e/us3-offline.spec.ts and tests/e2e/performance.spec.ts
- [X] T027 [US3] Apply compact German settings/filter disclosure copy, focus behavior, state messages, and bottom utility rendering in src/ui.ts
- [X] T028 [US3] Refine secondary controls, panels, refresh utility, and mobile reflow into a slim modern visual hierarchy in src/styles.css

**Checkpoint**: Secondary controls remain discoverable and accessible but no longer compete with event cards.

---

## Phase 11: User Story 4 - Preserve Calendar and Recovery Behavior (Priority: P3)

**Goal**: Preserve feed, filter, snapshot, offline, refresh, and recovery behavior while applying the German presentation and new hierarchy.

**Independent Test**: Run existing feed replacement/reset, filter persistence, refresh recovery, no-feed, stale, and offline journeys with the updated fixtures and copy.

- [X] T029 [P] [US4] Extend tests/e2e/fixtures.ts and tests/unit/app.test.ts coverage for configured branding, unchanged feed/filter boundaries, and recovery state inputs
- [X] T030 [US4] Run the complete feature validation commands from specs/002-event-first-layout/quickstart.md and record any fixes needed in the feature implementation

---

## Dependencies & Execution Order (Updated)

- Existing completed tasks T001-T015 establish the prior event-first disclosure baseline.
- T016-T018 deliver the event-card MVP; T016 should be written before T017/T018.
- T019-T024 extend and verify the runtime config and German UI; T020-T022 precede T024.
- T025-T028 refine secondary controls after German copy and event hierarchy are available; T027 precedes T028 for selector/style alignment.
- T029-T030 validate preserved state behavior and the full quickstart after all story work.

## Parallel Opportunities (Updated)

- T016 can run independently of T017-T018; T018 follows the event markup contract.
- T019, T022, and T023 touch separate test/config files and can run in parallel.
- T025 and T026 touch separate browser test files and can run in parallel.
- T029 can run independently of the UI implementation tasks once test fixtures are defined.

## Implementation Strategy (Updated)

1. Keep the already completed event-first/panel foundation and add distinct event cards plus map links as the P1 MVP.
2. Add runtime branding validation and German copy before visual polish so all selectors and accessible names are stable.
3. Refine compact secondary controls and refresh utility without moving state boundaries.
4. Run the full unit, lint, typecheck, build, e2e, and diff checks; use convergence for any remaining spec gap.

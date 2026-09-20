# Tasks: Relevance Styling and Filter Reset

**Input**: Design documents from `/specs/004-relevance-branding/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Required by the specification for past-event state, logo fallback, blue theme, reload reset, accessibility, and preserved regression behavior.

## Phase 1: Setup

- [x] T001 Confirm active feature metadata and existing test commands in `specs/004-relevance-branding/plan.md` and `package.json`.

## Phase 2: Foundational

- [x] T002 [P] [US1] Add pure occurrence relevance classification tests for completed, ongoing, upcoming, and all-day boundary cases in `tests/unit/relevance.test.ts`.
- [x] T003 [P] [US4] Add unit coverage for removing only filter query parameters while preserving unrelated URL parameters in `tests/unit/app.test.ts`.
- [x] T004 [P] [US3] Add a reusable Playwright fixture/helper for serving optional PNG/JPG logo responses in `tests/e2e/fixtures.ts`.

---

## Phase 3: User Story 1 - Distinguish Past Events (Priority: P1) MVP

**Goal**: Completed events visibly recede in German while remaining interactive and accessible.

**Independent Test**: A feed containing past, ongoing, all-day-current, and upcoming events renders only completed events with the past class/label, and a past disclosure opens with its location link.

### Tests for User Story 1

- [x] T005 [US1] Add unit tests for `occurrenceRelevance` effective-end and local all-day semantics in `tests/unit/relevance.test.ts` and verify they fail before implementation.
- [x] T006 [US1] Add Playwright coverage for past/ongoing/upcoming card classes, German `Vergangen` text, keyboard expansion, and location-link access in `tests/e2e/us1-feed-view.spec.ts`.

### Implementation for User Story 1

- [x] T007 [US1] Implement the pure `occurrenceRelevance` helper and relevance types in `src/relevance.ts`.
- [x] T008 [US1] Integrate relevance state, `Vergangen` presentation text, and the stable past card class into `createEventCard`/event rendering in `src/ui.ts` without disabling native disclosure controls.
- [x] T009 [US1] Add scoped muted past-card, state-label, ongoing/upcoming, and focus-preserving styles in `src/styles.css`.

**Checkpoint**: Past cards are visually muted, clearly labeled, still expandable, and location links remain usable.

---

## Phase 4: User Story 2 - Use a Cooler Blue Visual Theme (Priority: P2)

**Goal**: The existing event-first UI uses a coherent blue palette at desktop and narrow mobile widths.

**Independent Test**: Theme assertions and accessibility checks pass with no horizontal overflow at 320 CSS pixels.

### Tests for User Story 2

- [x] T010 [P] [US2] Add E2E assertions for blue-toned page/card/control/status computed colors and 320-pixel overflow safety in `tests/e2e/accessibility.spec.ts` or a dedicated theme scenario.

### Implementation for User Story 2

- [x] T011 [US2] Replace warm palette values with centralized cool blue surfaces, borders, text, accents, links, controls, focus, and status colors in `src/styles.css` while preserving event prominence and contrast.

**Checkpoint**: Desktop/mobile blue theme is readable, responsive, and regression-safe.

---

## Phase 5: User Story 3 - Provide an Optional Code-Hosted Logo (Priority: P2)

**Goal**: Deployments can add `public/logo.png` or `public/logo.jpg` without changing UI code, with safe text fallback.

**Independent Test**: PNG displays preferentially, JPG displays when PNG fails, and neither leaves a broken image or layout gap.

### Tests for User Story 3

- [x] T012 [US3] Add Playwright coverage for PNG success, JPG fallback after PNG failure, missing assets, decorative accessibility semantics, and constrained layout in `tests/e2e/us1-feed-view.spec.ts`.

### Implementation for User Story 3

- [x] T013 [US3] Implement a mount-scoped optional logo loader in `src/ui.ts` that tries `/logo.png`, then `/logo.jpg`, hides failed assets, and preserves configured/text branding.
- [x] T014 [US3] Add semantic brand-lockup markup and responsive logo sizing styles in `src/ui.ts` and `src/styles.css`; document the optional asset convention in `README.md`.

**Checkpoint**: All logo paths work without broken-image UI, redundant controls, or layout shift that blocks events.

---

## Phase 6: User Story 4 - Reset Filters on Reload (Priority: P1)

**Goal**: Full page reloads return to a fresh two-month date range and empty text query without clearing feed state.

**Independent Test**: Apply custom date/query filters, reload, verify clean defaults and no filter URL params, while the same feed remains rendered.

### Tests for User Story 4

- [x] T015 [US4] Update Playwright filtering coverage in `tests/e2e/us2-filters.spec.ts` so custom date/query filters reset on reload while in-session filter application and historical selection still work.
- [x] T016 [US4] Add unit coverage for the reload URL cleanup helper and app default preservation in `tests/unit/app.test.ts`.

### Implementation for User Story 4

- [x] T017 [US4] Add a pure filter-parameter cleanup helper in `src/app.ts` that removes only `from`, `to`, and `query` while preserving unrelated URL parameters.
- [x] T018 [US4] Change `src/main.ts` bootstrap to apply fresh app defaults and clean filter URL parameters on full load instead of restoring filter values from `window.location.search`.
- [x] T019 [US4] Preserve current-session `searchFromFilters` updates, inclusive two-month defaults, historical ranges, and feed/snapshot/local-override state through regression tests.

**Checkpoint**: Reload reset is isolated to filters and does not regress feed configuration or offline recovery.

---

## Phase 7: Polish and Verification

- [x] T020 [P] Update `tests/e2e/us3-offline.spec.ts`, accessibility coverage, and performance fixtures only where needed to assert preserved behavior under blue styling, past cards, logo fallback, and clean reload defaults.
- [x] T021 Run targeted unit and Playwright tests for all four user stories and fix implementation or test regressions.
- [x] T022 Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run e2e`, and `git diff --check`.
- [x] T023 Run the Spec Kit analyze gate and resolve any cross-artifact inconsistency without rewriting prior tasks.
- [x] T024 Run the Spec Kit converge gate; if it appends tasks, implement them and repeat implement/converge until the result is `Converged`.
- [x] T025 Execute all documented `quickstart.md` validation and inspect `git status` for the final report.

---

## Dependencies & Execution Order

- T001 precedes all implementation.
- T002–T004 are parallel foundation preparation tasks.
- T005–T009 implement and validate US1; T010–T011 implement US2; T012–T014 implement US3; T015–T019 implement US4.
- US2 and US3 are independent after foundation; US4 depends on existing two-month filter behavior; US1 provides the shared event-card state used by performance/accessibility regression tests.
- T020–T025 run after all four stories are implemented.

## Implementation Strategy

1. Establish pure relevance and URL-cleanup tests first.
2. Implement past-state rendering and the blue palette without changing feed/domain models.
3. Add optional logo loading with failure-safe text fallback.
4. Change only bootstrap filter restoration; retain in-session URL synchronization.
5. Run targeted tests, then the complete validation suite and Spec Kit analyze/converge loop.

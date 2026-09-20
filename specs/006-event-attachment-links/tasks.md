# Tasks: Event Attachment Links

**Input**: Design documents from `/specs/006-event-attachment-links/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui.md, quickstart.md

**Tests**: Required by the specification for normalization, safety, accessibility, and preserved behavior.

## Phase 1: Setup

- [X] T001 Confirm the active feature metadata and existing calendar normalization, snapshot, UI, and test entry points in `specs/006-event-attachment-links/plan.md`, `src/calendar.ts`, `src/ui.ts`, `src/storage.ts`, and `package.json`.

## Phase 2: Foundational

- [X] T002 [P] Add the attachment fixture shape and normalization expectations to `tests/unit/calendar.test.ts` before implementation, covering HTTP(S), display names, source order, unsupported schemes, binary values, and malformed values.
- [X] T003 [P] Add the event-details attachment rendering expectations to `tests/integration/us1-feed-view.test.ts` or the closest existing DOM integration test file, including absent attachments and legacy snapshots without the field.
- [X] T004 [P] Add a browser accessibility scenario for named and unnamed attachment links to `tests/e2e/us1-feed-view.spec.ts`, including external-link attributes and safe text rendering.

---

## Phase 3: User Story 1 - Open Event Attachments (Priority: P1) MVP

**Goal**: Show every valid URL attachment in expanded event details with useful link text.

**Independent Test**: Load an event with multiple valid `ATTACH` properties, expand it, and verify the links appear in source order with their original destinations.

### Tests for User Story 1

- [X] T005 [US1] Extend `tests/unit/calendar.test.ts` with failing-first assertions that `normalizeCalendar` exposes an ordered `attachments` collection with URL and optional display name fields.
- [X] T006 [US1] Extend `tests/e2e/us1-feed-view.spec.ts` with failing-first assertions for the localized attachment section, named links, fallback link labels, and semantic anchor behavior.

### Implementation for User Story 1

- [X] T007 [US1] Extend `CalendarOccurrence` and the occurrence normalizer in `src/calendar.ts` with a `CalendarAttachment` type and ordered extraction of valid HTTP(S) `ATTACH` properties using the optional `FILENAME` parameter.
- [X] T008 [US1] Render the occurrence attachment section in `src/ui.ts` only when `attachments` contains entries, using text-safe labels, localized copy, and one external semantic link per attachment.

**Checkpoint**: Events with valid attachments show all links in expanded details, while events without attachments have no empty section.

---

## Phase 4: User Story 2 - Preserve Safe and Usable Event Details (Priority: P1)

**Goal**: Keep malformed or unsupported attachment values from breaking event normalization or introducing unsafe links.

**Independent Test**: Load mixed valid, unsupported, binary, malformed, and escaped attachment values and verify valid links remain while invalid values are omitted and the event remains visible.

### Tests for User Story 2

- [X] T009 [US2] Add mixed-input and malformed-attachment cases to `tests/unit/calendar.test.ts`, including non-HTTP schemes, `VALUE=BINARY`, invalid URL text, escaped URLs, blank names, and preserved source order.
- [X] T010 [US2] Add an offline compatibility case to `tests/integration/us1-feed-view.test.ts` proving a saved occurrence without `attachments` still renders normally.
- [X] T011 [US2] Add browser assertions in `tests/e2e/us1-feed-view.spec.ts` that feed-provided labels render as literal text and links retain `target="_blank"` with `rel="noreferrer noopener"`.

### Implementation for User Story 2

- [X] T012 [US2] Make attachment parsing in `src/calendar.ts` non-fatal per property, omit unsupported/binary/malformed values, and preserve existing event normalization and partial-data behavior.
- [X] T013 [US2] Make `src/ui.ts` treat a missing legacy `attachments` field as empty, render localized fallback labels, and preserve existing location, description, recurrence, filtering, and external-link behavior.

**Checkpoint**: Invalid attachment input is safely ignored, valid links remain usable, and existing events/snapshots behave unchanged.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] Update `specs/006-event-attachment-links/quickstart.md` if final labels or test commands differ from the implementation.
- [X] T015 Run the feature quickstart plus `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run e2e` and resolve any regressions in the affected source/test files.
- [X] T016 Run `git diff --check` and inspect `git status` for unintended files before convergence.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependency.
- Phase 2 depends on Phase 1 and blocks user-story implementation.
- Phase 3 and Phase 4 depend on Phase 2; they touch the same normalization/UI surfaces and should execute sequentially.
- Phase 5 depends on both user stories.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel because they target separate test files.
- T014 can run in parallel with final source/test cleanup after behavior is settled.

### Implementation Strategy

1. Complete setup and add failing coverage.
2. Implement the normalized attachment model and primary rendering path.
3. Harden invalid-input and legacy-snapshot behavior.
4. Run the complete project validation suite, then converge.

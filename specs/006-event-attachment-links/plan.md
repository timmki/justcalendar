# Implementation Plan: Event Attachment Links

**Branch**: `006-event-attachment-links` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-event-attachment-links/spec.md`

## Summary

Expose valid HTTP(S) iCalendar `ATTACH` properties on normalized calendar occurrences, then render them as safe, accessible external links in the existing expandable event details. Keep unsupported or malformed attachments out of the UI without invalidating the containing event.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js >=22

**Primary Dependencies**: `ical.js`, existing DOM rendering helpers, Vitest, Playwright

**Storage**: Existing offline `CalendarSnapshot` persistence; attachment data travels with each occurrence

**Testing**: Vitest unit/integration tests and Playwright browser/accessibility coverage; existing lint, typecheck, build, and e2e commands

**Target Platform**: Browser-based static frontend served by the existing Node.js server

**Project Type**: Single-project web application with TypeScript frontend and Node server

**Performance Goals**: Attachment normalization remains linear in event attachment properties and does not add network requests during rendering

**Constraints**: Treat feed data as untrusted; preserve existing external-link protection; no new dependency or global state; no binary attachment download/proxy behavior

**Scale/Scope**: Existing normalization limit of 5,000 occurrences; each occurrence supports zero or more attachment links in source order

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle II: PASS — attachment fields are explicit on `CalendarOccurrence`; rendering receives the occurrence directly.
- Principle III: PASS — attachment values are parsed and restricted at the calendar normalization boundary before UI consumption.
- Principle IV: PASS — no attachment section is rendered for an empty list; existing event states remain deliberate.
- Principle V: PASS — use semantic anchors with accessible names and existing keyboard/focus behavior.
- Principle VII: PASS — attachments remain server-derived snapshot data; no new global client state.
- Principle VIII: PASS — existing named validation commands remain the verification path.
- Engineering constraints: PASS — no new dependency, hidden state, or network boundary is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/006-event-attachment-links/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/ui.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── calendar.ts       # normalize ATTACH values into occurrence data
└── ui.ts             # render attachment links in event details

tests/
├── unit/calendar.test.ts
├── integration/us1-feed-view.test.ts
└── e2e/us1-feed-view.spec.ts
```

**Structure Decision**: Keep the change in the existing calendar normalization and UI rendering modules. Add focused tests beside current normalization, integration, and browser journey coverage; no new abstraction or state layer is justified for this small, localized feature.

## Complexity Tracking

No constitution violations.

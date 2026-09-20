# Feature Specification: Two-Month Calendar Filter

**Feature Branch**: `003-two-month-filter`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "The calender should show events for the next two months. this should be the default setting of the filter, which reloads on reload of page. The user can change the filter to show events in the past"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the Next Two Months by Default (Priority: P1)

When a visitor opens the calendar without an explicit date filter, the viewer should focus on upcoming events from today through the date two calendar months in the future.

**Why this priority**: The default view should provide a useful planning horizon without requiring visitors to configure dates before seeing relevant events.

**Independent Test**: Open the calendar with no date parameters and confirm the date fields show today and the date two calendar months later, while events outside that inclusive range are not shown.

**Acceptance Scenarios**:

1. **Given** the calendar URL has no date filter, **When** the visitor opens the viewer, **Then** the date filter defaults to today as the start date and the date two calendar months later as the end date.
2. **Given** events exist before, within, and after the default range, **When** the viewer opens, **Then** only events inside the inclusive default range appear.
3. **Given** today falls near the end of a month, **When** the default end date is calculated, **Then** it uses the last valid date of the target month rather than producing an invalid or skipped date.

---

### User Story 2 - Choose Past or Custom Date Ranges (Priority: P1)

When a visitor needs historical information, they can replace the default range with explicit dates, including dates in the past.

**Why this priority**: Calendar history is a direct user need and must not be blocked by an upcoming-only default.

**Independent Test**: Open the filter controls, enter a past start and end date, apply the filter, and confirm the results and URL reflect the selected range.

**Acceptance Scenarios**:

1. **Given** the default date range is active, **When** the visitor enters a past start and end date and applies the filter, **Then** events in that past range are shown and the date values remain visible.
2. **Given** a visitor enters any valid custom range, **When** the filter is applied, **Then** the explicit range replaces the default range without changing the selected feed or saved snapshot.
3. **Given** a visitor enters an invalid or reversed range, **When** the filter is applied, **Then** the viewer does not show an invalid range as active and provides deliberate German filter behavior consistent with the existing viewer.

---

### User Story 3 - Preserve the Date Selection on Reload (Priority: P1)

When a visitor reloads the page, the active date range should remain selected; when no explicit date range is present, the default should be recalculated for the current day.

**Why this priority**: Reloading must not silently discard a historical or custom range, while a clean link should remain current over time.

**Independent Test**: Apply a custom past range, reload, and confirm the same range and results remain; then open a clean URL and confirm it receives the current two-month default.

**Acceptance Scenarios**:

1. **Given** a visitor applied an explicit date range, **When** the page is reloaded, **Then** the date fields, URL parameters, and visible results preserve that range.
2. **Given** a clean URL has no explicit date parameters, **When** the page is reloaded on a later day, **Then** the default start and end dates are based on the later current day rather than stale dates.
3. **Given** the visitor clears the date filter, **When** the clear action completes, **Then** the filter returns to the default two-month range rather than exposing an unbounded date range.

### Edge Cases

- A month-end current date must produce a valid end date when adding two calendar months; the result is clamped to the last valid date of the target month.
- Date boundaries are inclusive, so events on the start or end date remain visible.
- A past range must be accepted without a minimum-date restriction on the date inputs.
- A reversed or malformed URL range must not become an active filter; the viewer retains deliberate German validation behavior.
- Existing text search can remain combined with date filtering, and changing dates must not clear the search query.
- Feed replacement, reset, offline snapshots, and refresh behavior remain unchanged apart from the date range applied to visible events.
- A clean URL with no date parameters must not persist yesterday's default through a stale browser URL update.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST default the date filter to an inclusive range beginning on the current local calendar date and ending on the date two calendar months later when no explicit date range is present.
- **FR-002**: The viewer MUST show only events whose calendar dates fall within the active inclusive date range, without changing feed selection, snapshots, or event data.
- **FR-003**: The viewer MUST calculate a valid two-calendar-month end date for month-end start dates by clamping to the last valid date in the target month.
- **FR-004**: The viewer MUST allow visitors to enter valid dates in the past and apply a custom past or mixed historical/future range.
- **FR-005**: The viewer MUST preserve an explicitly selected `from` and `to` date range in the existing URL-backed filter state across page reloads.
- **FR-006**: The viewer MUST derive a fresh default range on a clean load with no explicit date parameters instead of persisting an old default range.
- **FR-007**: The viewer MUST return the clear action to the default two-month range and clear the existing text-search value, matching the existing full-filter reset behavior.
- **FR-008**: The viewer MUST reject malformed or reversed date ranges without presenting them as an active valid range, while preserving deliberate German labels and recovery behavior.
- **FR-009**: The viewer MUST keep date fields usable at supported desktop and 320 CSS-pixel mobile widths without horizontal scrolling.
- **FR-010**: The viewer MUST preserve existing feed replacement/reset, refresh, offline snapshot, error, and performance behavior while applying the active date range.

### Key Entities *(include if feature involves data)*

- **Default Date Range**: A derived inclusive pair of local calendar dates from today through two calendar months later, recalculated when a clean URL is loaded.
- **Explicit Date Range**: A validated inclusive `from` and `to` pair selected by the visitor and represented in the existing URL state.
- **Date Filter State**: The active date range combined with the existing text-search value and applied to normalized calendar occurrences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of clean-load acceptance flows, the date filter shows today through the valid date two calendar months later and no unbounded date range is active.
- **SC-002**: In 100% of boundary checks, events on the start and end dates are included while events outside the active range are excluded.
- **SC-003**: In 100% of historical-range flows, a visitor can select a valid past range, apply it, and see the range preserved after reload.
- **SC-004**: In 100% of month-end checks, the calculated two-month end date is valid and deterministic for the local calendar.
- **SC-005**: Existing feed, snapshot, offline, recovery, text-search, layout, and 5,000-occurrence performance scenarios remain passing after the default range is added.

## Assumptions

- “Next two months” means an inclusive local calendar-date range through the corresponding date two calendar months later, not a fixed 60-day duration.
- When the corresponding day does not exist in the target month, the end date is clamped to that month’s last valid day.
- Existing URL parameters remain the source of truth for explicit filter selections; clean URLs are the only case where the default is derived.
- The existing German interface remains the presentation language, and no new feed endpoint or storage mechanism is required.
- The existing date inputs are sufficient for historical selection; no separate “past events” mode is required.

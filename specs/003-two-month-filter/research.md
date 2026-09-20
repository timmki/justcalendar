# Research: Two-Month Calendar Filter

## Decision 1: Use local calendar-month arithmetic with clamping

- Decision: Derive the default range from the browser/application local calendar date, adding two calendar months and clamping the day to the target month’s last valid day.
- Rationale: “Next two months” is a calendar concept, not a fixed 60-day duration. Local date strings match the existing date inputs and avoid daylight-saving-hour drift.
- Alternatives considered:
  - Fixed 60 days: rejected because month lengths vary and it produces surprising month-end results.
  - Native date overflow without clamping: rejected because January 31 plus two months can skip into a different month.

## Decision 2: Keep explicit dates in the existing URL state

- Decision: Preserve `from`, `to`, and `query` as the source of truth for explicit filters. A clean URL with neither date parameter receives a derived default; a URL with explicit dates is not overwritten on reload.
- Rationale: Existing reload and share behavior already uses URL-backed filters, so no storage migration or new state boundary is needed.
- Alternatives considered:
  - Persisting date filters in IndexedDB: rejected because it would make shared links and reload behavior less predictable.
  - Rewriting every clean URL immediately: rejected because a clean URL should remain clean while still deriving the current default in application state.

## Decision 3: Make the clear action restore the default range

- Decision: The existing full-filter reset clears text search and restores the current two-month default rather than returning to an unbounded date range.
- Rationale: The requested range is the viewer’s default setting; clearing should return to the default view and remain consistent on reload.
- Alternatives considered:
  - Clearing all date bounds: rejected because it would silently broaden the result set beyond the requested default.
  - Adding a second reset control: rejected because the existing slim filter UI should not gain unnecessary controls.

## Decision 4: Normalize a bounded recent history plus the requested future horizon

- Decision: Expand calendar normalization to retain a bounded recent-history horizon (12 calendar months) through the date two calendar months ahead, still respecting the existing 5,000-occurrence cap. Explicit past filters can therefore show recent events already present in the feed.
- Rationale: The current normalizer only retains upcoming events for a 30-day horizon, so date filters alone cannot reveal past occurrences. A bounded history avoids unbounded recurring expansion and preserves performance.
- Alternatives considered:
  - Normalize only the future range: rejected because past filters would always be empty.
  - Normalize the entire feed without a history bound: rejected because recurring feeds can produce unbounded work and exceed the existing occurrence cap before reaching future events.

## Decision 5: Test with deterministic dates and relative browser fixtures

- Decision: Unit tests inject fixed `Date` values; browser fixtures calculate dates relative to the test run and cover clean defaults, month ends, past ranges, reloads, and boundaries.
- Rationale: Calendar behavior must be deterministic in unit tests while E2E fixtures must not expire as the real date advances.
- Alternatives considered:
  - Fixed E2E dates: rejected because they eventually become historical and disappear from a future-only fixture window.

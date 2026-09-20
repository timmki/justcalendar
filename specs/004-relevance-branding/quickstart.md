# Quickstart Validation: Relevance Styling and Filter Reset

## Commands

Run from the repository root:

```text
npm run lint
npm run typecheck
npm run test
npm run build
npm run e2e
```

## Automated Scenarios

The implementation is valid when the suites verify:

1. Completed timed and all-day events receive the German muted past treatment; ongoing and future events do not.
2. Muted past cards remain keyboard-expandable and preserve location links.
3. Primary surfaces, cards, controls, links, focus states, and utility status use the blue palette at desktop and 320 CSS-pixel mobile widths.
4. A provided PNG logo is displayed, JPG is used when PNG fails, and absent assets leave text branding without a broken image.
5. Reloading after custom date/query filters starts with the current two-month default and empty query.
6. Reload reset does not clear feed overrides, saved snapshots, offline behavior, or configured branding.
7. In-session filter application and URL updates continue to work after reload.
8. Existing event-first, historical filtering, recovery, and 5,000-occurrence performance tests remain green.

## Manual Review

1. Provide `public/logo.png`, run the app, and inspect the header brand area.
2. Remove PNG and provide `public/logo.jpg`; confirm the JPG fallback.
3. Remove both assets; confirm the text header has no broken image or empty gap.
4. Open a feed with a past, ongoing, and upcoming event and compare card opacity and state labels.
5. Expand a past event with the keyboard and follow its location link.
6. Apply a historical/date/search filter, reload, and confirm the filter returns to the fresh default while the feed remains selected.
7. Inspect desktop and 320-pixel mobile views for blue contrast and no horizontal scrolling.

## Expected Gates

- Existing and new unit/integration/accessibility/offline/filter/performance tests pass.
- Bundle and Core Web Vitals budgets remain within the existing limits.
- `git diff --check` reports no whitespace errors.

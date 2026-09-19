# Quickstart Validation: Event-First Calendar Layout

## Prerequisites

- Node.js 22 or newer and npm.
- Repository dependencies installed with `npm install`.
- A browser supported by the existing Playwright configuration.

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

The implementation is valid when the browser suite verifies:

1. Upcoming event content appears before expanded settings or filter content on
   desktop and mobile.
2. Settings and filter fields are hidden on first load, while their labeled
   disclosure buttons remain available.
3. Settings opens and closes without changing the active feed; Escape closes it
   and returns focus to its button.
4. Filters open on demand, expose their existing fields, preserve active results
   when hidden or after reload, and clear without changing feed selection.
5. Opening one secondary panel closes the other and keeps `aria-expanded` and
   panel visibility synchronized.
6. Update/retry and recency information appear after the event content for
   ready, stale, error, loading, empty, and no-snapshot states.
7. The layout has no horizontal overflow at desktop and 320 CSS-pixel mobile
   widths.
8. Existing offline snapshot, keyboard, filtering, feed replacement/reset, and
   performance scenarios remain green.

## Manual Review

1. Open the viewer with several upcoming events and confirm the next event is
   immediately identifiable without opening a panel.
2. Open settings, replace or reset the feed, then close settings and confirm the
   event view remains the same behaviorally.
3. Open filters, apply a text or date filter, close the panel, reload, reopen it,
   and clear the filter.
4. Use only the keyboard to open each panel, tab through its controls, press
   Escape, and confirm focus returns to the correct disclosure button.
5. Resize to a narrow mobile viewport and confirm panels, event text, update,
   and recency content fit without horizontal scrolling.

## Expected Gates

- Existing unit and integration tests pass.
- Existing accessibility, offline, filter, feed, and performance browser tests
  pass with updated selectors/assertions for hidden panels.
- Layout checks confirm event-first order, mutually exclusive panels, focus
  behavior, and bottom utility placement.
- Existing Core Web Vitals, bundle-size, 5,000-occurrence filter, and offline
  snapshot-open budgets remain within their current limits.

See [data-model.md](data-model.md) and
[contracts/ui.md](contracts/ui.md) for the presentation state and UI contract.

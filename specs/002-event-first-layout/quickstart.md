# Quickstart Validation: German, Brandable Event-First Calendar UI

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

## Branding Configuration

Generate runtime configuration with German fallback branding:

```text
npm run config:generate
```

Generate with deployment branding (PowerShell):

```text
$env:JUSTCALENDAR_TITLE = "Mein Kalender"
$env:JUSTCALENDAR_SUBTITLE = "Heute und demnächst"
npm run config:generate
```

The generated `public/config.json` must contain trimmed optional branding fields and must
not contain secrets. Do not commit deployment-specific generated values.

## Automated Scenarios

The implementation is valid when the browser suite verifies:

1. `html[lang="de"]`, German headings, controls, status messages, accessible names, and
   German date/time formatting are used for all application-owned copy.
2. Configured title/subtitle values appear in the two heading positions and document title;
   missing or blank values use non-empty German fallbacks and markup-like values remain text.
3. Upcoming event content appears before expanded settings, filters, or refresh utility on
   desktop and mobile.
4. Event cards have distinct boundaries/spacing, visible German expand affordances, and
   independent native details behavior.
5. Location-bearing events expose safe Google Maps search links with encoded location text;
   events without locations expose no empty map link.
6. Settings and filter fields are hidden on first load, while compact German disclosure
   buttons remain available.
7. Settings opens and closes without changing the active feed; Escape closes it and returns
   focus to its button.
8. Filters open on demand, expose German fields, preserve active results when hidden or after
   reload, and clear without changing feed selection.
9. Opening one secondary panel closes the other and keeps `aria-expanded` and panel
   visibility synchronized.
10. Update/retry and German recency information appear after event content for ready, stale,
    error, loading, empty, and no-snapshot states.
11. The layout has no horizontal overflow at desktop and 320 CSS-pixel mobile widths.
12. Existing offline snapshot, feed replacement/reset, keyboard, filtering, and performance
    scenarios remain green.

## Manual Review

1. Open the viewer with several upcoming events and confirm the first event is immediately
   identifiable without opening a panel.
2. Activate an event with pointer and keyboard; confirm the card clearly changes state and
   neighboring cards stay separate.
3. Open a location link and confirm it goes to a Google Maps search for the visible location.
4. Set both branding environment values, regenerate config, and confirm the subtitle, title,
   and browser tab title update. Repeat with blank values to confirm German fallbacks.
5. Open settings, replace or reset the feed, then close settings and confirm event behavior
   remains unchanged.
6. Open filters, apply a text or date filter, close the panel, reload, reopen it, and clear
   the filter.
7. Use only the keyboard to open each panel, tab through controls, press Escape, and confirm
   focus returns to the correct disclosure button.
8. Resize to a narrow mobile viewport and confirm event text, panels, update, and recency
   content fit without horizontal scrolling.

## Expected Gates

- Existing unit and integration tests pass.
- Accessibility, offline, filter, feed, and performance browser tests pass with German
  selectors/assertions and the new event/map contracts.
- Layout checks confirm event-first order, distinct cards, mutually exclusive panels, focus
  behavior, safe location links, and bottom utility placement.
- Existing Core Web Vitals, bundle-size, 5,000-occurrence filter, and offline snapshot-open
  budgets remain within their current limits.
- `git diff --check` reports no whitespace errors.

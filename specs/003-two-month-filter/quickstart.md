# Quickstart Validation: Two-Month Calendar Filter

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

The implementation is valid when the browser and unit suites verify:

1. A clean URL derives today through two calendar months later as the default date range.
2. Month-end defaults clamp to a valid target-month date.
3. Inclusive start/end boundaries include events exactly on both dates.
4. Events beyond the default future horizon are excluded from the default result.
5. A valid past range can be entered and applied without a minimum-date restriction.
6. Explicit past/custom ranges remain in the URL and survive reload.
7. A clean reload recalculates the default from the current date rather than stale defaults.
8. Full filter reset restores the default two-month range and clears text search.
9. Malformed/reversed date inputs remain safe and are not presented as active valid filters.
10. Existing feed replacement/reset, offline snapshot, recovery, German UI, mobile overflow, and 5,000-occurrence performance scenarios remain green.

## Manual Review

1. Open the viewer from a clean URL and inspect the `Von` and `Bis` values.
2. Confirm events on the two boundary dates are visible and later events are not.
3. Open filters, choose a past start/end range, apply it, and confirm historical events appear.
4. Reload the page and confirm the selected past range and URL remain unchanged.
5. Open a clean URL again later and confirm its default range is based on the current day.
6. Use the full reset action and confirm the default range returns.
7. Resize to 320 CSS pixels and confirm date inputs do not create horizontal scrolling.

## Expected Gates

- Existing unit, integration, accessibility, offline, filtering, and performance tests pass.
- The 5,000-occurrence filter remains within its existing two-second budget.
- The default two-month range and bounded historical normalization do not change feed, snapshot, or recovery behavior.
- `git diff --check` reports no whitespace errors.

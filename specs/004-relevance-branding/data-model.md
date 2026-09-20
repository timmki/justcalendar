# Data Model: Relevance Styling and Filter Reset

## Event Relevance State

| Field | Type | Rules |
|---|---|---|
| `relevance` | `past | ongoing | upcoming` | Derived at render time from occurrence start/end and the current local date/time. |
| `isPast` | `boolean` | True only for completed timed events or all-day events ending before today. |
| `pastLabel` | `string` | German presentation label `Vergangen` when `isPast` is true; absent otherwise. |

The existing normalized occurrence entity remains unchanged. Relevance is presentation state and
must not be persisted or sent to the server.

## Logo Asset State

- Candidate order: `/logo.png`, then `/logo.jpg`.
- `loading`: candidate request is pending.
- `available`: candidate loaded and displayed as decorative brand imagery.
- `unavailable`: both candidates failed; image is removed and text branding remains.
- Logo dimensions are constrained by the header layout and must not create page overflow.

## Reload Filter State

- On full bootstrap: `from` and `to` become a fresh current two-month default; `query` becomes empty.
- Existing filter URL parameters are removed from the browser URL at bootstrap.
- Feed URL/local override, snapshot, branding, and offline state are not modified.
- After bootstrap, applying filters continues to use the existing normalized app state and URL update behavior until the next full reload.

## State Transitions

1. Feed snapshot renders → derive each card’s relevance state from current time.
2. Header renders → try PNG, then JPG, then text-only fallback.
3. Page boot with stale filters → remove filter parameters → apply fresh default date range and empty query.
4. Current-session filter apply → update app state and URL as before.
5. Feed refresh/offline/recovery → preserve active session filters and relevance presentation rules.

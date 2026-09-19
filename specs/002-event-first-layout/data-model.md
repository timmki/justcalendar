# Data Model: Event-First Calendar Layout

This feature adds no persisted domain data. Existing feed selection, URL filter,
calendar snapshot, and application status models remain authoritative.

## Presentation State

Transient state owned by the viewer UI for the current render session.

| Field | Type | Rules |
|---|---|---|
| `openPanel` | `null` or `settings` or `filters` | At most one secondary panel is open. Defaults to `null`. |
| `activeFilter` | boolean derived from existing filter selection | Indicates active filtering even when filter fields are hidden. |
| `focusedDisclosure` | derived DOM focus, not persisted | Escape close returns focus to the disclosure that opened the panel. |

State transitions:

```text
closed -> settings open
closed -> filters open
settings open -> closed
filters open -> closed
settings open -> filters open
filters open -> settings open
open panel + Escape -> closed + focus returned to opener
```

Opening a panel does not change the active feed, snapshot, or filter values.
Closing a panel does not clear or apply filters.

## Event View

The existing ordered occurrence list displayed as the primary content. It reads
from the existing `CalendarSnapshot` and `FilterSelection` models and does not
copy or mutate them.

Rules:

- Event content appears before expanded settings and filter content in normal
  document flow.
- Existing title, start time, optional end time, location, description,
  recurrence, empty, partial, stale, and error presentation remains valid.
- The event list remains readable at supported mobile widths without horizontal
  scrolling.

## Secondary Panel

A temporarily revealed form area associated with one disclosure button.

| Field | Type | Rules |
|---|---|---|
| `kind` | `settings` or `filters` | Identifies the panel and its stable DOM id. |
| `visible` | boolean derived from `openPanel` | Closed panels use the native hidden state. |
| `expanded` | boolean | Must match the disclosure button's `aria-expanded` value. |
| `controlsId` | string | Must match the panel id in `aria-controls`. |

The settings panel reads and writes only through existing feed replacement and
reset actions. The filter panel reads and writes only through existing filter
actions and URL serialization.

## Refresh Utility

The bottom utility derives from existing application status, snapshot timestamp,
stale flag, and error state.

Rules:

- The update/retry action and recency text appear after primary event content.
- A missing timestamp produces explicit unavailable or never-refreshed copy.
- Loading, error, stale, empty, and no-snapshot meanings remain unchanged.
- The utility does not become sticky, fixed, or a second source of application
  state.

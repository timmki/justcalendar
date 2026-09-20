# Data Model: German, Brandable Event-First Calendar UI

This feature adds no persisted domain data. Existing feed selection, URL filter, calendar
snapshot, and application status models remain authoritative.

## Runtime Brand Configuration

Optional public configuration fields parsed at the existing `/config.json` boundary.

| Field | Type | Rules |
|---|---|---|
| `title` | `string | null` | Trimmed plain text, bounded for display, German fallback when absent/blank. |
| `subtitle` | `string | null` | Trimmed plain text, bounded for display, German fallback when absent/blank. |

The generated config reads `JUSTCALENDAR_TITLE` and `JUSTCALENDAR_SUBTITLE`. The values
contain no secrets and are rendered with text nodes. The existing `schemaVersion: 1`
contract remains the response version because the fields are optional and older fixtures
remain valid.

## Presentation State

Transient state owned by the viewer UI for the current render session.

| Field | Type | Rules |
|---|---|---|
| `openPanel` | `null | settings | filters` | At most one secondary panel is open; defaults to `null`. |
| `activeFilter` | boolean derived from existing filter selection | Indicates active filtering even when filter fields are hidden. |
| `eventExpanded` | native `details.open` state | Owned by each event card; never persisted and never changes feed/filter state. |
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

Opening or closing a panel does not change the active feed, snapshot, or filter values.
Expanding an event does not change any application state.

## Event Card

A separately presented view of an existing normalized calendar occurrence.

| Field | Source | Presentation rule |
|---|---|---|
| `title` | occurrence title | Text node, visually dominant heading/summary content. |
| `start` / `end` | occurrence dates | German `de-DE` date/time formatting; all-day events use German all-day copy. |
| `recurring` | occurrence flag | German recurrence label when true. |
| `location` | optional occurrence location | Text node plus derived Google Maps search link when non-empty. |
| `description` | optional occurrence description | Text node with preserved line breaks. |
| `expanded` | native details state | Clear visible affordance; independent per card. |
| `mapUrl` | derived from location | `https://www.google.com/maps/search/?api=1&query=` plus encoded location; opened externally with safe rel attributes. |

The card reads from `CalendarSnapshot` after existing `FilterSelection` processing. It does
not copy or mutate domain data. Missing optional fields do not produce empty labels or map
links.

## Secondary Panel

A temporarily revealed form area associated with one disclosure button.

| Field | Type | Rules |
|---|---|---|
| `kind` | `settings | filters` | Identifies the panel and stable DOM id. |
| `visible` | boolean derived from `openPanel` | Closed panels use native hidden state. |
| `expanded` | boolean | Matches the disclosure button's `aria-expanded` value. |
| `controlsId` | string | Matches the panel id in `aria-controls`. |

The settings panel reads and writes only through existing feed replacement and reset
actions. The filter panel reads and writes only through existing filter actions and URL
serialization.

## Refresh Utility

The bottom utility derives from existing application status, snapshot timestamp, stale flag,
and error state.

Rules:

- Update/retry action and recency text appear after primary event content.
- German explicit copy is shown for loading, errors, stale snapshots, empty data, and no
  snapshot; missing timestamps never produce a blank area.
- The utility is compact and normal-flow, not sticky or fixed.
- It does not become a second source of application state.

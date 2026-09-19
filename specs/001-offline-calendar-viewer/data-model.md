# Data Model: Offline Calendar Viewer

## Runtime Configuration

The deployment-generated `/config.json` is the versioned application input.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `schemaVersion` | integer | yes | Must be `1`. Unknown versions are rejected. |
| `defaultFeedUrl` | URL or null | no | Must be an absolute HTTPS URL in production. Null means deployment configuration is missing and recovery mode is shown. |
| `telemetryEndpoint` | URL or null | no | Must be HTTPS in production. A deployed release requires a usable endpoint; local development may omit it. |

The configuration contains no secrets. Environment values are converted to this
same-origin document during deployment. The browser validates the document
before using any field.

## Proxy Request and Failure

The browser-to-proxy request is transient and is not persisted.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Must be `1`. |
| `url` | URL | Absolute HTTPS URL, no credentials or fragment, maximum 2 KiB. |

The proxy validates DNS results and rejects non-global destinations before the
upstream request. It rejects redirects, caps the body at 1 MiB, caps total
upstream time at 10 seconds, and limits concurrent upstream requests to 16.
Failures are versioned RFC 9457 Problem Details and never replace a good local
snapshot.

## Feed Selection

Represents the one URL that can be active at a time.

| Field | Type | Rules |
|---|---|---|
| `deploymentUrl` | URL or null | The validated deployment default. |
| `localOverride` | URL or null | The visitor's validated replacement, persisted locally. |
| `effectiveUrl` | URL or null | `localOverride` when present, otherwise `deploymentUrl`. |
| `sourceKind` | enum | `deployment` or `local-override`. |

Invariants:

- `effectiveUrl` is never more than one URL.
- A local override is saved only after its feed is validated successfully.
- Reset removes the local override and restores the deployment URL.
- If both URLs are unusable, the app shows configuration recovery mode.

State transitions:

```text
deployment default -> active
active + valid replacement -> local override active
local override active + reset -> deployment default active
replacement invalid -> previous selection and snapshot unchanged
no valid URL -> configuration recovery
```

## Calendar Event Occurrence

An immutable, normalized occurrence shown by the viewer.

| Field | Type | Rules |
|---|---|---|
| `uid` | string | Required by the source event; retained for deduplication only. |
| `recurrenceId` | date-time or null | Identifies an overridden recurrence instance. |
| `start` | date-time/date | Required. Date-only values remain all-day dates. |
| `end` | date-time/date or null | Optional; source `DTEND` is non-inclusive. |
| `allDay` | boolean | True for date-valued start/end. |
| `title` | string | Validated text; empty values use deliberate fallback copy. |
| `location` | string or null | Validated text; never rendered as markup. |
| `description` | string or null | Validated text; never rendered as markup. |
| `timeZone` | string or null | Source timezone context when available. |
| `sourceUrl` | URL | The effective feed URL used for the snapshot. |

Normalization must support UTC, floating time, `TZID`, `VTIMEZONE`, all-day
events, `DTEND`/`DURATION`, recurrence rules, recurrence dates, exclusions, and
`RECURRENCE-ID` overrides. Occurrences are expanded only within the display
window and an explicit maximum count. Invalid occurrences are excluded with a
user-visible partial-data notice.

## Calendar Snapshot

The last completely validated result for one effective feed URL.

| Field | Type | Rules |
|---|---|---|
| `schemaVersion` | integer | Must be `1`; permits future migration. |
| `sourceUrl` | URL | Matches the selection used to create the snapshot. |
| `fetchedAt` | date-time | Successful retrieval time. |
| `validUntil` | date-time or null | Optional display-window boundary. |
| `occurrences` | list | Normalized, deduplicated occurrences sorted by start time. |
| `partialData` | boolean | True if unusable source items were excluded. |

Snapshots are replaced atomically only after retrieval, parsing, validation,
normalization, and bounded recurrence expansion complete. A failed refresh
leaves the previous snapshot available and marks it stale when offline or when
the refresh fails.

## Filter Selection

View-only state represented by URL parameters.

| Field | Type | Rules |
|---|---|---|
| `from` | date or null | Inclusive lower bound. |
| `to` | date or null | Inclusive user-facing upper bound. |
| `query` | string | Case-insensitive text match over title, location, and description. |

Invalid filter parameters are ignored and replaced with the default upcoming
view. Filtering never mutates the stored snapshot.

## Application States

- **Starting**: runtime configuration and local selection are loading.
- **Configuration recovery**: no usable effective URL; visitor can enter one
  replacement URL or retry configuration loading.
- **Loading**: active feed is being retrieved or validated; timeout is visible.
- **Ready**: current validated snapshot is displayed.
- **Ready but stale**: last-known-good snapshot is displayed with its refresh
  time and stale explanation.
- **Partial**: usable events are displayed with a notice about excluded data.
- **Empty**: valid feed has no occurrences in the active display window.
- **Error with snapshot**: refresh failed, previous snapshot remains visible,
  and retry is available.
- **Error without snapshot**: no data is available; explanation and retry are
  visible.

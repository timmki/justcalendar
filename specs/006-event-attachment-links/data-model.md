# Data Model: Event Attachment Links

## CalendarOccurrence

Existing normalized event occurrence extended with:

| Field | Type | Required | Description |
|---|---|---:|---|
| `attachments` | `CalendarAttachment[]` | yes | Valid URL attachments in source order; empty when none are usable |

## CalendarAttachment

New normalized value:

| Field | Type | Required | Validation |
|---|---|---:|---|
| `url` | `string` | yes | Must parse as an absolute `http` or `https` URL |
| `name` | `string \| null` | no | Trimmed `FILENAME` parameter, or `null` when absent/blank |

## Source Mapping

- Source entity: iCalendar `VEVENT`.
- Source property: one or more `ATTACH` properties.
- Optional source parameter: `FILENAME`.
- `BINARY` attachments and non-HTTP(S) schemes are omitted.
- Attachment order follows the order of accepted `ATTACH` properties in the source event.

## Rendering Contract

The event details view receives `CalendarOccurrence.attachments` and:

- renders one semantic external link per attachment;
- uses `name` when available, otherwise the localized fallback label;
- preserves `url` exactly as the normalized destination;
- does not render a heading/list when the collection is empty.

## Compatibility

Existing snapshots with schema version 1 may not contain `attachments`. Readers/renderers must treat a missing field as an empty collection so previously saved offline data remains usable.

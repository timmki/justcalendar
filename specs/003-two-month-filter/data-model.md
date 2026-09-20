# Data Model: Two-Month Calendar Filter

## Date Range Values

| Field | Type | Rules |
|---|---|---|
| `from` | `string | null` | Valid `YYYY-MM-DD` local calendar date or null; inclusive lower bound. |
| `to` | `string | null` | Valid `YYYY-MM-DD` local calendar date or null; inclusive upper bound. |
| `query` | `string` | Existing trimmed text-search value; unchanged by date derivation except full reset. |

## Derived Default Date Range

- `from`: current local calendar date.
- `to`: current local calendar date plus two calendar months, clamped to the target month’s final valid day.
- The default is derived only when the URL has neither `from` nor `to`.
- The default is recalculated on each clean page load.

## Explicit Date Range

- A valid explicit `from` and/or `to` from URL state replaces the corresponding default behavior.
- A valid past date is allowed; date inputs have no minimum of today.
- A reversed or impossible date range normalizes to the existing safe empty-range behavior and is not presented as active.
- Explicit ranges survive reload because `from` and `to` remain in the URL.

## Normalized Calendar Window

- The existing normalized occurrence entity remains unchanged.
- The normalizer retains recent history through a bounded 12-calendar-month lower horizon and the requested two-calendar-month future upper horizon.
- The existing `MAX_OCCURRENCES` limit remains authoritative; overflow continues to set partial-data state.

## State Transitions

1. Clean URL → derive current two-month default → filter normalized occurrences.
2. URL with explicit dates → validate and use explicit range → filter occurrences.
3. Visitor applies date inputs → normalize filters → write explicit `from`/`to` to URL.
4. Page reload → read explicit URL dates or derive a fresh default.
5. Full reset → clear query and restore a newly derived two-month default.
6. Feed replacement, snapshot load, refresh, and offline transitions → preserve active filter selection.

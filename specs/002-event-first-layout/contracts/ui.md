# UI Contract: German, Brandable Event-First Calendar

## Default Document Order

The viewer presents these regions in normal document flow:

1. German page identity: configured subtitle and title, with German fallbacks.
2. Primary event content, including loading, empty, error, partial, stale, and no-snapshot
   state content as applicable.
3. Separately presented event cards with visible expand/collapse affordances.
4. Settings disclosure button and its closed-by-default German settings panel.
5. Filters disclosure button and its closed-by-default German filter panel.
6. Compact refresh utility containing the German update/retry action and recency information.

The event region must not be pushed below expanded settings or filter content. The refresh
utility must remain after the primary event content on desktop and mobile.

## Language and Branding Contract

- `html[lang]` is `de`.
- All application-owned visible copy and accessible names are German.
- User-provided event fields, configured title/subtitle, and external URLs are not translated.
- The runtime config may contain optional `title` and `subtitle` fields.
- Missing/blank fields use stable German fallbacks; values are trimmed, bounded, and rendered
  as text, never HTML.
- The configured main title is also used for the document title.
- Dates and times use German locale formatting.

## Event Disclosure Contract

Each occurrence is rendered as one native event disclosure:

| Element | Required behavior |
|---|---|
| Event card | Distinct surface, border, spacing, and readable responsive content. |
| `summary` | Contains title/time plus a visible German affordance such as `Details anzeigen` or `Details ausblenden`. |
| Detail region | Shows existing optional end, recurrence, location, and description fields as text. |
| Location anchor | Labeled in German, preserves location text, uses a Google Maps search URL with encoded query, `target="_blank"`, and `rel="noreferrer noopener"`. |

Native details interaction must remain available to pointer, keyboard, and assistive
technology users. Event expansion does not mutate feed, filter, or snapshot state.

## Secondary Disclosure Contract

Each panel has one native button and one associated panel:

| Control | Required behavior |
|---|---|
| Settings button | German accessible name, `type="button"`, `aria-expanded`, and `aria-controls`; toggles settings panel. |
| Filters button | German accessible name, `type="button"`, `aria-expanded`, and `aria-controls`; toggles filters panel and indicates active filters. |
| Settings panel | Contains existing feed replacement/reset controls; hidden by default; no feed mutation on close. |
| Filters panel | Contains existing German date/text filters and clear action; hidden by default; no filter mutation on close. |

The button `aria-expanded` value matches panel visibility. Only one panel may be visible at
once. Activating the other disclosure closes the current panel without clearing or applying
data.

## Focus Contract

- All controls are native keyboard controls in logical document order.
- Opening a panel keeps focus on its disclosure button; Tab enters the panel.
- Escape closes the open secondary panel and returns focus to its disclosure button.
- Re-rendering after an app action must not leave focus on a removed element.
- Event summaries remain keyboard activatable through native details behavior.
- No panel uses a focus trap, tabindex workaround, or surprising automatic focus.
- Visible focus styling remains present.

## State and Data Contract

- Filter values remain represented by existing URL parameters.
- Feed selection and snapshots remain represented by existing app/storage state.
- Showing, hiding, or expanding presentation controls cannot change feed selection, snapshots,
  or active filter values.
- Existing text-only rendering and deliberate state messages remain in effect.

## Responsive and Visual Contract

- Events have stronger visual hierarchy than secondary controls.
- Each event card remains distinct at all supported widths.
- Secondary controls and refresh/recency use compact spacing and do not dominate the event
  list.
- The layout reflows at the existing mobile breakpoint and at 320 CSS pixels.
- No page-level horizontal scrolling is allowed when either panel is open.
- Labels, event text, buttons, and form fields may wrap; fixed-width panels must not clip them.

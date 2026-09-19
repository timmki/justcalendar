# UI Layout and Disclosure Contract

## Default Document Order

The viewer presents these regions in normal document flow:

1. Page heading and identity.
2. Primary event content, including loading, empty, error, partial, stale, and
   no-snapshot state content as applicable.
3. Settings disclosure button and its closed-by-default settings panel.
4. Filters disclosure button and its closed-by-default filter panel.
5. Refresh utility containing update/retry action and recency information.

The event region must not be pushed below expanded settings or filter content on
desktop or mobile layouts. The refresh utility must remain after the primary
event content.

## Disclosure Contract

Each panel has one native button and one associated panel:

| Control | Required behavior |
|---|---|
| Settings button | Accessible name, `type="button"`, `aria-expanded`, and `aria-controls`; toggles settings panel. |
| Filters button | Accessible name, `type="button"`, `aria-expanded`, and `aria-controls`; toggles filter panel. |
| Settings panel | Contains existing feed replacement/reset controls; hidden by default; no feed mutation on close. |
| Filters panel | Contains existing date/text filters and clear action; hidden by default; no filter mutation on close. |

The button's `aria-expanded` value must match the associated panel's visibility.
Only one panel may be visible at a time. Activating the other disclosure closes
the currently open panel without clearing or applying data.

## Focus Contract

- All controls are native keyboard controls in logical document order.
- Opening a panel keeps focus on its disclosure button; Tab enters the panel.
- Escape closes the open panel and returns focus to its disclosure button.
- Re-rendering after an app action must not leave focus on a removed element.
- No panel uses a focus trap, `tabindex` workaround, or automatic focus that
  surprises the visitor.
- Visible focus styling remains present.

## State and Data Contract

- Filter values remain represented by the existing URL parameters.
- Feed selection and snapshots remain represented by existing app/storage state.
- Hiding or showing a panel cannot change feed selection, snapshots, or active
  filter values.
- Existing text-only rendering and deliberate state messages remain in effect.

## Responsive Contract

- The layout must reflow at the existing mobile breakpoint and at 320 CSS px.
- No page-level horizontal scrolling is allowed when either panel is open.
- Labels, event text, buttons, and form fields may wrap; no fixed-width panel may
  clip them.
- The event list remains visually primary on both mobile and desktop.

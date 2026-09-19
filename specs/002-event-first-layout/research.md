# Research: Event-First Calendar Layout

## Decision: Use Explicit Disclosure Controls

Use native buttons named for `Settings` and `Filters`, each associated with its
panel through `aria-controls` and reporting open state through
`aria-expanded`. Hide closed panels with the native `hidden` attribute. Treat
the panels as disclosures containing forms, not as ARIA menus.

**Rationale**: The settings and filter areas contain form controls rather than
menu items. The disclosure pattern provides an explicit state contract without
requiring menu-specific arrow-key and `menuitem` behavior. It uses existing DOM
and CSS capabilities and adds no dependency.

**Alternatives considered**: A `role="menu"` would impose interactions that do
not fit forms. Native `<details>` is shorter, but explicit buttons make the
mutual-exclusion, expanded-state, and focus-return behavior easier to test.

## Decision: Keep Panel State Local to the UI

Use one presentation-only value, `openPanel: 'settings' | 'filters' | null`,
inside the UI mounting scope. Opening one panel closes the other. Closing a
panel never clears filters or changes feed/snapshot state. Keep the active-filter
indication available even while filter fields are hidden.

**Rationale**: Panel visibility is transient view state, not calendar domain
state. Keeping it out of `AppState` avoids persistence and synchronization
coupling while satisfying the state-at-the-edge principle.

**Constraint**: `src/ui.ts` currently replaces the root on each app-state
update. The implementation must preserve or reapply the open-panel state after
rerenders and return focus to the corresponding disclosure button when Escape
closes a panel.

## Decision: Use Predictable Keyboard Focus

Keep focus on the disclosure button when opening so the next Tab enters the
panel in document order. Escape closes the open panel and returns focus to its
button. Activating the same button closes its panel. Do not close panels on
blur, use `tabindex` hacks, or rely on `autofocus`.

**Rationale**: This preserves context for keyboard and assistive-technology
users and avoids trapping focus inside a non-modal panel.

## Decision: Put Events Before Secondary Content

Use this normal-flow order: header, primary event content, settings disclosure
and panel, filter disclosure and panel, then the refresh/recency utility.

**Rationale**: The event list is the first useful content and cannot be pushed
below expanded controls. Normal flow keeps expanded content visible and avoids
overlaying or hiding events on small screens.

## Decision: Use a Static Bottom Refresh Utility

Move the current status and refresh action after the event and secondary-panel
content. Keep status announcements polite and show explicit copy such as
`Not refreshed yet` when no snapshot exists. Do not make the utility sticky or
fixed.

**Rationale**: Static flow prevents focus obstruction and keeps the update and
recency information consistently below the primary content across viewport
sizes.

## Decision: Preserve Existing Responsive and Performance Budgets

Retain the existing focus outline, wrapping controls, event text wrapping, and
current Core Web Vitals, filter-scale, offline-open, and bundle budgets. Add
checks for 320 CSS-pixel reflow, panel visibility/state, event-first ordering,
and bottom utility placement.

**Rationale**: This is a presentation change, not a new data path. The lowest
browser gates.

## Sources

- [WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [WAI-ARIA Disclosure Navigation Example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
- [WHATWG `hidden` attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)
- [WCAG 2.2 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [WCAG 2.2 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)
- [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

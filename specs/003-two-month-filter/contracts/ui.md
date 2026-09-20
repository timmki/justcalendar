# UI Contract: Two-Month Calendar Filter

## Clean-Load Defaults

- A clean URL with no `from` or `to` date parameters shows the German date fields with:
  - `Von`: today’s local calendar date.
  - `Bis`: the valid date two calendar months later.
- The event list uses that inclusive range immediately after the feed/snapshot is available.
- The clean URL is not required to be rewritten just to derive the default.

## Explicit and Historical Ranges

- The existing labeled date inputs remain the control for explicit ranges.
- The inputs accept valid dates before today; no minimum-date restriction prevents historical selection.
- Applying a valid range updates visible events and writes `from=YYYY-MM-DD` and `to=YYYY-MM-DD` to the existing URL.
- Date boundaries are inclusive.
- A valid custom range remains active after page reload.

## Clear and Validation Behavior

- The existing full reset action clears the text query and restores the current default two-month date range.
- Impossible or reversed dates are not shown as an active valid range; existing German validation/empty behavior remains deliberate.
- Changing date values does not change the selected feed, snapshot, or event expansion state beyond the normal rerender.

## Responsive and Accessibility Contract

- Date labels remain `Von` and `Bis` with native date inputs and keyboard access.
- Filter disclosure remains hidden by default, mutually exclusive with settings, and URL-backed.
- The default and historical date controls fit at 320 CSS pixels without horizontal overflow.
- Active date filters continue to be indicated by the German filter disclosure label.

# UI Contract: Relevance Styling and Filter Reset

## Past Event Cards

- A completed event card receives a stable past-state class and visible German state text `Vergangen`.
- Past cards are visually muted but retain normal native `details/summary` interaction, visible focus, readable text, and working location links.
- Ongoing and upcoming cards do not receive the past class or label.
- All-day events remain relevant through the current local calendar date.

## Blue Theme

- Header, event surfaces, borders, controls, links, focus rings, and status utility use a coordinated cool blue palette.
- The event list remains visually dominant over secondary panels.
- Past-event opacity remains high enough for readable text and focus indication.
- The 320 CSS-pixel layout remains free of horizontal overflow.

## Optional Logo

- The header may contain a decorative logo image before the subtitle/title text.
- Candidate order is `/logo.png`, then `/logo.jpg`.
- If both fail or are absent, the image is removed and the configured/text brand remains without a broken-image icon or reserved blank space.
- The logo is non-interactive, constrained, and has empty alternative text because the adjacent text identity names the page.

## Reload Reset

- A full reload starts with the current two-month default date range and an empty search query.
- Filter parameters from the prior URL are removed or replaced before the initial filter state is presented.
- Feed selection, saved snapshots, configured title/subtitle, and offline/recovery state remain unchanged.
- Filter controls remain German, URL-backed, and functional after the reload until the next full reload.

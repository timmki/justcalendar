# Research: German, Brandable Event-First Calendar UI

## Decision: Use a Small German Copy Catalog in the Existing UI Module

Keep application-owned strings in a local `src/ui.ts` catalog and format dates with
`Intl.DateTimeFormat('de-DE', ...)`. Translate headings, controls, status/error/empty/
loading/stale messages, accessible names, event affordances, and filter summaries. Do not
translate event titles, descriptions, locations, configured branding, or URLs because those
are user/deployment content.

**Rationale**: The viewer has one route and a small fixed vocabulary. A dependency or a
full localization framework would add a new abstraction and bundle cost without solving a
current product need. Centralizing the copy avoids leaving English fragments in state paths.

**Alternatives considered**: Browser-language detection would make the requested German
behavior inconsistent. Scattered inline translations would be harder to audit for complete
coverage.

## Decision: Extend the Existing Runtime Config With Optional Branding Fields

Add optional `title` and `subtitle` fields to the existing schema-versioned `/config.json`
response. `scripts/generate-config.mjs` reads `JUSTCALENDAR_TITLE` and
`JUSTCALENDAR_SUBTITLE`, trims them, and emits `null` when blank. `parseRuntimeConfig`
validates the fields as bounded plain strings and applies stable German fallback values in
the UI when they are absent.

**Rationale**: The existing config generation path already exposes deployment-safe public
settings and avoids baking deployment branding into source. Optional fields preserve
compatibility with current schema-version-1 fixtures while keeping validation at the
network boundary.

**Alternatives considered**: Reading `import.meta.env` would couple runtime branding to a
build environment and would not match the existing server-generated configuration. A new
endpoint would duplicate the current config boundary.

## Decision: Use Native Event Disclosure With an Explicit Affordance

Keep each event in native `<details>` with a `<summary>` containing title, German date/time,
and a visible state label such as `Details anzeigen` / `Details ausblenden`. Style each
`li` as an individual card with spacing, border, and surface contrast. Render detail fields
as text nodes; render a location as a Google Maps search anchor using
`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` with
`target="_blank"` and `rel="noreferrer noopener"`.

**Rationale**: Native disclosure supplies pointer, keyboard, and assistive-technology
behavior without a custom event state machine. A visible label supplements the browser
marker so the click-to-expand affordance is clear. The Maps URL format supports free-form
ICS location text without requiring a place lookup or third-party SDK.

**Alternatives considered**: A custom button plus hidden region would duplicate native
keyboard/state semantics. An embedded map or geocoding request would add network cost,
privacy concerns, and an unnecessary dependency.

## Decision: Use Compact Normal-Flow Secondary Utilities

Retain explicit settings and filter buttons with `aria-expanded`, `aria-controls`, and native
`hidden` panels. Keep one local `openPanel` value, use compact grouped controls, and place a
non-sticky refresh utility after the event/secondary content. Use normal flow at all widths;
never overlay the event list or create a fixed utility that can obscure focus.

**Rationale**: This preserves the existing state boundaries and makes the slim visual style
responsive without introducing a modal interaction model. The disclosure contract remains
straightforward to test.

**Alternatives considered**: ARIA menus do not fit form content. A sticky footer or overlay
would compete with events and risks focus/viewport obstruction on mobile.

## Decision: Keep Branding Plain Text and Bounded

Trim branding values at the config boundary, reject non-string values, and cap display text
to a conservative length before rendering. Use `textContent` rather than `innerHTML` so
markup-like configuration is never interpreted.

**Rationale**: Branding is deployment input and should be safe even when it contains HTML
syntax or accidental whitespace. A bounded value keeps the visual hierarchy predictable on
small screens.

## Sources

- [WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [WHATWG `details` and `summary`](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-details-element)
- [WHATWG `hidden` attribute](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started)
- [WCAG 2.2 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

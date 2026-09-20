# Feature Specification: German, Brandable Event-First Calendar UI

**Feature Branch**: `002-event-first-layout`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "I want the whole application in german language. The title and small title above should be configurable via env vars. The events should be the dominant element and each event needs to be more separatly displayed from each other. It must be visible that you can click them to show more. if it has a location, i want a link to google maps. The filter, settings and refresh information should be more slim and more state of the art visual style."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and Expand Events First (Priority: P1)

When a visitor opens the calendar, upcoming events are the first and dominant content. Each event is visually separated from the next one and clearly communicates that it can be activated to reveal more information. An event location, when present, can be opened in Google Maps.

**Why this priority**: Finding and understanding the next appointment is the primary value of the calendar. Clear event hierarchy and discoverable details reduce cognitive load.

**Independent Test**: Open a populated calendar on desktop and at a narrow mobile width, identify the first event without opening a secondary control, activate an event with pointer and keyboard, and follow a location link when one exists.

**Acceptance Scenarios**:

1. **Given** a valid calendar with upcoming events, **When** the visitor opens the viewer, **Then** the event list is the first primary content and event title and start time are visually dominant.
2. **Given** multiple events, **When** the visitor views the list, **Then** every event is separated by a distinct card boundary and spacing, not only a thin shared divider.
3. **Given** a collapsed event, **When** the visitor inspects it, **Then** an obvious German expand affordance and the event's interactive state make it clear that more details are available.
4. **Given** an event with details, **When** the visitor activates its event control, **Then** the details open and the event remains separately identifiable from neighboring events.
5. **Given** an event with a location, **When** the visitor opens the details, **Then** the location is a clearly labeled Google Maps link that preserves the location text.
6. **Given** a narrow mobile viewport, **When** the visitor opens the viewer, **Then** events remain readable and usable without horizontal scrolling or control clutter above them.

---

### User Story 2 - Use a Completely German, Configurable Brand (Priority: P1)

When a visitor uses the calendar, all application-provided interface copy is German, including headings, controls, status messages, empty states, accessibility labels, and date/time presentation. The deployment owner can configure the large title and the small title above it through environment variables without changing source code.

**Why this priority**: The requested language and brand are part of every screen and must be correct before visual refinements can be trusted.

**Independent Test**: Generate runtime configuration with and without title environment variables, load the application, and inspect visible and accessible UI text, document language, document title, and German date/time formatting.

**Acceptance Scenarios**:

1. **Given** the application is loaded with normal, empty, loading, stale, and error states, **When** the visitor reads the interface, **Then** every application-provided string is German; user-provided event content and external URLs are not translated.
2. **Given** configured title and subtitle environment values, **When** the deployment configuration is generated and the viewer loads, **Then** the small title above and the main title display those values and the document title uses the configured main title.
3. **Given** title environment values are missing or blank, **When** the viewer loads, **Then** stable German fallback title and subtitle text is shown and no empty heading area is left.
4. **Given** configured branding includes markup-like characters or excess whitespace, **When** it is displayed, **Then** it is rendered as plain text after trimming and cannot inject markup into the page.

---

### User Story 3 - Keep Secondary Controls Slim and Modern (Priority: P2)

When a visitor only wants to read events, filter, settings, and refresh information stay visually quiet and compact. The filter fields and feed settings are revealed on demand, and refresh status appears in a slim utility area after the event content.

**Why this priority**: Secondary controls should remain discoverable without competing with the event list or consuming the initial viewport.

**Independent Test**: Open the viewer, verify that the default state prioritizes event cards, reveal filters and settings independently, apply and clear a filter, and confirm refresh/recency status remains compact and below events on desktop and mobile.

**Acceptance Scenarios**:

1. **Given** the viewer has loaded, **When** no secondary action has occurred, **Then** filters and settings content are hidden behind compact, clearly labeled German controls.
2. **Given** one secondary panel is open, **When** the visitor opens the other, **Then** the first closes and the event list is not surrounded by multiple expanded panels.
3. **Given** an active filter, **When** the visitor hides the filter controls or reloads the view, **Then** the filtered results remain active and the compact control indicates that a filter is applied.
4. **Given** a successful, failed, loading, empty, stale, or no-snapshot state, **When** the visitor views the page, **Then** refresh/retry and recency information are presented in a slim utility area after or within the primary state content and remain reachable.
5. **Given** the visitor uses only a keyboard, **When** they open, use, and close filters or settings, **Then** controls expose their expanded state, focus remains predictable, and Escape closes the active panel.

---

### User Story 4 - Preserve Calendar and Recovery Behavior (Priority: P3)

When the visitor replaces or resets a feed, refreshes, loses network access, or returns to a saved snapshot, the existing calendar behavior remains intact while the new German presentation and hierarchy apply.

**Why this priority**: Visual changes must not regress the read-only feed, filtering, offline, and recovery behavior users depend on.

**Independent Test**: Run the existing feed replacement/reset, filter persistence, refresh recovery, offline snapshot, empty, and error journeys and compare their outcomes while checking the new language and layout.

**Acceptance Scenarios**:

1. **Given** a feed replacement or reset, **When** the visitor completes the action, **Then** the active feed and event results update as before and the interface remains German.
2. **Given** a failed refresh with a saved snapshot, **When** the visitor views the page, **Then** stale data, the German error message, and a reachable retry action are all deliberate.
3. **Given** no saved snapshot or no configured feed, **When** the visitor views the page, **Then** a German explanation and reachable recovery action are shown without an empty frame.

---

### Edge Cases

- When both filters and settings are available, opening one secondary panel closes the other.
- When filters are active, hiding the filter controls does not silently clear them or change the event results.
- When an event has no location, no empty map link or placeholder is shown.
- When a location contains spaces, punctuation, or non-ASCII characters, the Google Maps link remains correctly encoded and safe.
- When user-provided event titles, descriptions, or locations contain markup-like text, they remain text and do not create page markup.
- When the event list is empty, unavailable, or showing a stale snapshot, the layout still provides clear German state text and reachable recovery or update actions.
- When the settings menu is opened on mobile, it fits the viewport without horizontal scrolling.
- When the visitor uses only a keyboard, event details and secondary panels expose state, support Escape where applicable, and preserve a logical focus order.
- When a configured title or subtitle is missing, blank, unusually long, or contains markup-like characters, fallback, trimming, wrapping, and plain-text behavior remain deliberate.
- When the recency value is unavailable, the page shows a clear German unavailable or never-refreshed message rather than an empty area.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST present the upcoming event list as the primary content on initial load, before expanded settings, filter controls, or refresh utilities.
- **FR-002**: The viewer MUST give event titles and start times greater visual prominence than secondary controls in the default view.
- **FR-003**: Each event MUST have its own visually distinct presentation with a clear boundary and spacing from adjacent events at desktop and mobile widths.
- **FR-004**: Each event MUST expose a visible German affordance that communicates it can be activated to show more details, and the activation MUST work with pointer and keyboard input.
- **FR-005**: Activating an event MUST reveal its available end time, location, description, recurrence, or other existing details without changing neighboring events or feed state.
- **FR-006**: When an event has a location, the viewer MUST provide a clearly labeled Google Maps search link using the location as the query; the link MUST preserve safe external-link behavior and the original location text.
- **FR-007**: The viewer MUST render all application-provided user interface copy in German, including headings, controls, status/error/empty/loading/stale messages, accessible names, and date/time formatting; external content and user-provided event fields remain unchanged.
- **FR-008**: The deployment MUST accept `JUSTCALENDAR_TITLE` and `JUSTCALENDAR_SUBTITLE` environment variables for the main title and small title above it, and MUST use stable German fallback values when either is missing or blank.
- **FR-009**: Configured title and subtitle values MUST be trimmed and rendered as plain text, not interpreted as markup, and the configured main title MUST be reflected in the document title.
- **FR-010**: The viewer MUST provide compact, clearly labeled German controls for settings and filters, keep their content hidden by default, and reveal each panel on demand.
- **FR-011**: Settings and filter panels MUST be mutually exclusive, expose their open/closed state accessibly, support predictable focus and Escape close behavior, and MUST NOT change feed or snapshot state when merely opened or closed.
- **FR-012**: The viewer MUST preserve active filter results when controls are hidden or the page reloads, and MUST keep filter values in the existing URL-backed state.
- **FR-013**: The viewer MUST place refresh/retry action and recency information in a slim utility area after the event content on desktop and mobile layouts, with deliberate content for every loading, empty, error, stale, and no-snapshot state.
- **FR-014**: The viewer MUST avoid horizontal scrolling, preserve readable event content, and maintain keyboard reachability, accessible names, visible focus, and logical focus order for every interactive element.
- **FR-015**: The viewer MUST keep feed selection, event filtering, refresh, recency, offline snapshot, and recovery behavior functionally equivalent to the existing feature except for language, content hierarchy, and presentation.

### Key Entities *(include if feature involves data)*

- **Event Card**: A separately presented calendar occurrence with title, time, optional details, expanded/collapsed state, and optional location link.
- **Brand Configuration**: The main title and small title above it, supplied by deployment environment values with validated German fallbacks.
- **Secondary Panel**: A temporarily revealed settings or filter area with an open/closed state and predictable focus behavior.
- **Refresh Utility**: The compact update/retry action and recency information associated with the active feed and displayed snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of acceptance flows with available events, the event list appears before expanded settings, filters, or refresh utilities on desktop and mobile viewports.
- **SC-002**: In 100% of populated-list layout checks, each event has a distinct boundary and at least one clear activation affordance that is visible without expanding it.
- **SC-003**: At least 90% of usability-test participants can identify the next event within 10 seconds of opening the viewer without first opening settings or filters.
- **SC-004**: In 100% of language checks, application-provided UI copy, accessible names, status messages, and date/time presentation are German, excluding user-provided content and external destinations.
- **SC-005**: In 100% of configuration checks, non-blank environment values appear in the two branding positions and document title, while missing or blank values produce non-empty German fallbacks.
- **SC-006**: In 100% of events containing a location, the expanded details include a Google Maps link whose query represents the original location text.
- **SC-007**: At least 95% of keyboard acceptance runs can open, use, and close event details and both secondary panels without focus loss or accidental feed changes.
- **SC-008**: In 100% of layout checks, refresh/recency utilities appear after event content and the application has no horizontal overflow at supported desktop and 320 CSS-pixel mobile widths.
- **SC-009**: Existing event viewing, filter results, feed replacement/reset, refresh recovery, and offline snapshot acceptance scenarios pass without behavioral regressions.

## Assumptions

- The existing read-only calendar viewer, event data, feed selection, filtering, refresh, recency, and offline snapshot behavior remain in scope; this feature changes language, presentation hierarchy, and control visibility rather than domain behavior.
- `JUSTCALENDAR_TITLE` is the large main heading and `JUSTCALENDAR_SUBTITLE` is the small title above it; fallback values are German and stable across deployments.
- Environment values are supplied during the existing deployment configuration-generation step and are safe to expose as public display text because they contain no secrets.
- Google Maps links use a search query rather than a place identifier because the ICS location field may contain free-form text.
- Event details use the existing native disclosure behavior or an equivalent semantic interaction; no new event-management capability is added.
- Settings and filter panels remain mutually exclusive and transient; filter values remain URL-backed and feed/snapshot state remains in existing application/storage boundaries.
- The refresh action remains available after the event content even when the current state is loading, empty, stale, or error; its label and enabled state may reflect that state.
- Desktop and mobile use the same information hierarchy, with responsive changes limited to fitting the available viewport.
- German translations cover application-owned strings only; event titles, descriptions, locations, configured branding, and URLs are displayed as supplied plain text.

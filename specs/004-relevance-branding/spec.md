# Feature Specification: Relevance Styling and Filter Reset

**Feature Branch**: `004-relevance-branding`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Events of the past are shown slightly transparent or disabled, like they are no longer relevant. The Theme is more like a bluish color. We can provide a png/jpg in the code as a logo for the page. The filter settings are resetted on reload of the page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinguish Past Events (Priority: P1)

When a visitor reviews a calendar containing both completed and upcoming events, completed events should remain available but visually recede so the upcoming events are easier to prioritize.

**Why this priority**: Relevance is the core purpose of a calendar view; users need to identify what still matters without losing access to history.

**Independent Test**: Open a feed containing a completed event and a future event, confirm the completed card is visually muted and labeled as past, and confirm both remain keyboard-accessible and expandable.

**Acceptance Scenarios**:

1. **Given** an event whose end has passed, **When** the visitor views the event list, **Then** its card is visually muted compared with an upcoming event and exposes German past-state text.
2. **Given** a past event is visually muted, **When** the visitor activates it with pointer or keyboard, **Then** its details still open and its location link remains usable.
3. **Given** an event is ongoing or upcoming, **When** the visitor views it, **Then** it is not marked as past or muted.
4. **Given** an all-day event ended before the current local calendar date, **When** the visitor views it, **Then** it is marked as past; an all-day event on the current date remains relevant.

---

### User Story 2 - Use a Cooler Blue Visual Theme (Priority: P2)

When a visitor uses the application, the page surfaces, event cards, controls, links, and status utility use a cohesive blue-toned visual palette while preserving readable contrast and the event-first hierarchy.

**Why this priority**: The requested theme change should make the visual identity feel intentional without reducing event readability or accessibility.

**Independent Test**: Inspect the page in desktop and 320 CSS-pixel mobile layouts and confirm the primary surfaces and controls use the blue palette, remain readable, and do not introduce overflow.

**Acceptance Scenarios**:

1. **Given** the normal page is loaded, **When** the visitor views the header, event cards, controls, and utility area, **Then** the primary theme surfaces and accents are blue-toned and visually consistent.
2. **Given** a past event is displayed in the blue theme, **When** it is muted, **Then** it remains distinguishable without becoming unreadable or losing its focus state.
3. **Given** the page is viewed at the supported narrow mobile width, **When** filters or settings open, **Then** the blue theme remains responsive without horizontal scrolling.

---

### User Story 3 - Provide an Optional Code-Hosted Logo (Priority: P2)

When a deployment provides a logo file in the application’s public assets, the page displays it with the brand identity; when no file is provided, the existing text identity remains clean and unbroken.

**Why this priority**: A deployment-specific logo lets the same viewer fit different organizations without requiring source changes to the header structure.

**Independent Test**: Serve a PNG and a JPG through the public asset paths in separate runs, confirm the logo appears, then serve neither and confirm the text branding remains without a broken-image icon or empty gap.

**Acceptance Scenarios**:

1. **Given** `public/logo.png` exists, **When** the page loads, **Then** it displays that image in the brand area before the subtitle/title text.
2. **Given** no PNG exists but `public/logo.jpg` exists, **When** the page loads, **Then** it displays the JPG fallback.
3. **Given** neither supported logo file exists or an asset fails to load, **When** the page loads, **Then** no broken image is visible and the configured/text fallback branding remains usable.
4. **Given** a logo is present, **When** the page is viewed with a keyboard or assistive technology, **Then** the logo does not create a redundant unlabeled control or disrupt heading and focus order.

---

### User Story 4 - Reset Filters on Reload (Priority: P1)

When a visitor reloads the page, date and text filter settings return to the current default two-month range and an empty search, while feed selection, snapshots, and deployment settings remain unchanged.

**Why this priority**: The viewer should start from a predictable current view rather than silently applying stale or historical filter choices from a previous URL.

**Independent Test**: Apply a custom date and text filter, reload, and confirm the default date range and empty search return while the same feed and event snapshot remain available.

**Acceptance Scenarios**:

1. **Given** explicit date and text filters are active, **When** the visitor reloads the page, **Then** the filters reset to today through two calendar months later and the text query is empty.
2. **Given** filter parameters are present in the browser URL at reload, **When** the page initializes, **Then** those filter parameters are removed or replaced by the clean default state rather than reapplied.
3. **Given** a feed replacement or offline snapshot exists, **When** the page reloads and filters reset, **Then** the active feed, snapshot, and recovery behavior remain unchanged.
4. **Given** the visitor applies a filter after reload, **When** they use it during the current session, **Then** the existing URL-backed filtering behavior still works until the next full reload.

### Edge Cases

- A timed event with an end time in the past is muted; an event currently in progress is not muted.
- An all-day event on the current local date is not muted, while an all-day event ending before today is.
- A past event remains keyboard-reachable and expandable; visual muting must not use a disabled state that blocks details.
- If a logo file returns an error, the alternate file is tried and then the image is removed without layout residue.
- A logo must be constrained so unusually large aspect ratios do not create overflow or displace event content.
- Missing logo assets must not produce a console-blocking application error or broken-image UI.
- Resetting filters on reload must not clear the local feed override, IndexedDB snapshot, or configured branding.
- A clean reload must calculate the default dates from the current local date, including month-end clamping from the prior feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST identify completed timed and all-day occurrences using the current local date/time and distinguish them from ongoing and upcoming occurrences.
- **FR-002**: The viewer MUST visually mute completed event cards with a modest opacity/relevance treatment while keeping their text, focus, native expansion, and available links usable.
- **FR-003**: The viewer MUST provide German past-state text or accessible state information for completed events and MUST NOT label ongoing or upcoming events as past.
- **FR-004**: The viewer MUST apply a cohesive blue-toned palette to page surfaces, event cards, interactive controls, links, and utility status while preserving readable contrast and the existing event-first hierarchy.
- **FR-005**: The viewer MUST support an optional code-hosted `public/logo.png` asset and use `public/logo.jpg` as a fallback when PNG is unavailable; absent or failed assets MUST leave the text brand intact without a broken-image artifact.
- **FR-006**: The viewer MUST render a provided logo as non-interactive brand imagery with constrained responsive dimensions and no redundant accessible control.
- **FR-007**: The viewer MUST reset date and text filter state to the current clean-load default whenever the page is fully reloaded, even if old filter parameters are present in the URL.
- **FR-008**: Filter reset on reload MUST NOT reset the active feed selection, local feed override, saved snapshot, configured branding, or offline/recovery state.
- **FR-009**: The viewer MUST preserve in-session filter application, inclusive date boundaries, historical ranges, URL updates, and German filter controls until the next full reload.
- **FR-010**: The viewer MUST remain keyboard reachable, responsive at 320 CSS pixels, and free of horizontal overflow after adding past-state styling, blue theme surfaces, optional logo imagery, and reload reset behavior.

### Key Entities *(include if feature involves data)*

- **Event Relevance State**: Derived presentation state for an occurrence: past, ongoing, or upcoming, based on its end/start and the current local date/time.
- **Logo Asset**: Optional same-origin PNG or JPG file supplied in the public code-hosted asset directory, with fallback and failure handling.
- **Reload Filter State**: The clean default date range plus empty text query applied at full page initialization, independent of feed and snapshot state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of populated acceptance flows, completed events receive the muted past treatment while ongoing and upcoming events do not.
- **SC-002**: In 100% of keyboard acceptance flows, muted past events remain expandable and their available links remain reachable.
- **SC-003**: In 100% of theme checks at desktop and 320 CSS-pixel mobile widths, blue-toned surfaces and controls remain readable with no horizontal overflow.
- **SC-004**: In 100% of logo asset checks, PNG preference, JPG fallback, and absent-asset text branding produce no broken-image artifact.
- **SC-005**: In 100% of reload checks with stale date/query URL parameters, the viewer starts with the current two-month default and empty query while preserving the active feed/snapshot.
- **SC-006**: Existing event-first, historical-filter, offline, recovery, and 5,000-occurrence performance scenarios remain passing after the presentation and reload changes.

## Assumptions

- “Past” means a timed occurrence whose end has passed, or an all-day occurrence whose represented end date is before the current local calendar date; current-day all-day events remain relevant.
- The optional logo convention is same-origin `public/logo.png` first, then `public/logo.jpg`; no upload UI or remote logo URL is added.
- Filter settings means the date bounds and text query, not feed settings or persisted snapshots.
- Full reload reset removes active filter parameters from the URL while preserving unrelated URL parameters if any are introduced later.
- The existing two-calendar-month default and bounded historical normalization from feature 003 remain authoritative.
- A blue theme must preserve existing German copy, accessibility, event prominence, and responsive behavior.

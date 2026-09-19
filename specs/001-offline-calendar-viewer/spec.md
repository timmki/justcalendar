# Feature Specification: Offline Calendar Viewer

**Feature Branch**: `001-offline-calendar-viewer`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Develop Justcalender, a app for displaying a calender ics in a ordered manner. The user does not edit enything, just view upcoming events. The app does not manage calender events, it just integrates existing publicly available calender feeds and show them, nothing else beside easy use and easy filtering on demand and providing the calender on mobile devices even if offline due to storage of a maybe outdated snapshot."

## Clarifications

### Session 2026-09-19

- Q: When a visitor replaces the deployment-provided calendar URL, should the app
  offer a reset that restores the deployment URL? -> A: Option A: The local URL
  wins until the visitor explicitly resets to the deployment default.
- Q: If deployment provides no usable default calendar URL, should the app let
  the visitor enter a replacement URL as a recovery path? -> A: Option A: Show
  the configuration error and allow one replacement URL as recovery.
- Q: Do the ICS feed servers allow the deployed app's origin through CORS, or
  must the app support feeds that provide no browser-readable CORS headers? ->
  A: Option B: Add a same-origin proxy for feeds without browser-readable CORS.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Upcoming Events (Priority: P1)

As a visitor, I can immediately see upcoming events from the publicly accessible
ICS calendar configured by the deployment. I can replace that URL with my own
and reset it to the deployment default, without editing or managing events.

**Why this priority**: Viewing upcoming events is the core value and is useful
without filtering or offline access.

**Independent Test**: Configure a valid public feed containing known events,
open the app without setup, replace the URL, and verify that the active feed's
next events are displayed in chronological order with their essential details.

**Acceptance Scenarios**:

1. **Given** a valid deployment-provided ICS feed and no local replacement,
   **When** the visitor opens the app, **Then** upcoming event occurrences are
   displayed from soonest to latest without requiring feed setup.
2. **Given** a displayed event, **When** the visitor selects it, **Then** the
   event title, start time, end time when available, and location when available
   are visible.
3. **Given** a feed with no upcoming events, **When** the visitor views it,
   **Then** the app shows an explanatory empty state instead of a blank view.
4. **Given** an active feed URL, **When** the visitor replaces it with another
   valid public ICS URL, **Then** the replacement becomes the only active URL
   and is retained for later visits.
5. **Given** a locally replaced URL, **When** the visitor selects reset,
   **Then** the deployment-provided URL becomes the only active URL again.
6. **Given** no usable deployment URL is available, **When** the visitor opens
   the app, **Then** a configuration error is shown and the visitor can provide
   one replacement URL as a recovery path.
7. **Given** the active feed does not provide browser-readable CORS headers,
   **When** the visitor opens or refreshes the calendar, **Then** the app uses
   the same-origin retrieval path and displays the validated events or a clear
   retryable proxy error.

---

### User Story 2 - Filter Events on Demand (Priority: P2)

As a visitor, I can narrow the displayed events by date range and text in event
details, so I can quickly find the events relevant to me.

**Why this priority**: Filtering makes a combined or busy calendar useful while
remaining separate from the core read-only viewing experience.

**Independent Test**: Load a fixture with events across dates and searchable
text, apply each filter, and verify that only matching events remain visible and
that clearing filters restores the unfiltered list.

**Acceptance Scenarios**:

1. **Given** a loaded event list, **When** the visitor selects a date range,
   **Then** only occurrences within that range are shown.
2. **Given** a loaded event list, **When** the visitor enters search text,
   **Then** events matching their title, location, or description are shown.
3. **Given** one or more active filters, **When** the visitor clears them,
   **Then** the complete upcoming event list is restored.

---

### User Story 3 - View the Last Snapshot Offline (Priority: P3)

As a mobile visitor, I can open the app without network access and view the
last successfully loaded calendar snapshot, so the calendar remains useful when
connectivity is unavailable even if the data is outdated.

**Why this priority**: Offline access is important for mobile use, but it
depends on having a usable online calendar view and a successful prior refresh.

**Independent Test**: Load a feed successfully, disable network access, reopen
the app, and verify that the saved events and their last-refresh time are
available with a clear stale-data indication.

**Acceptance Scenarios**:

1. **Given** a previously successful feed load, **When** the visitor opens the
   app without network access, **Then** the latest saved snapshot is displayed
   and marked with its last successful refresh time.
2. **Given** an offline snapshot, **When** the visitor applies a supported
   filter, **Then** filtering works against the saved events.
3. **Given** no saved snapshot exists, **When** the visitor opens the app
   offline, **Then** the app explains that no offline calendar is available and
   provides a retry action for when connectivity returns.

---

### Edge Cases

- An invalid, unreachable, or non-ICS feed shows a specific error, preserves
  the previous good snapshot when one exists, and offers retry.
- A feed contains malformed events or unsupported fields; unusable events are
  excluded from the list and the visitor is told that some data could not be
  displayed.
- Events have different time zones, are all-day events, span multiple days, or
  recur; displayed occurrences use a consistent local presentation and retain
  the all-day or recurrence meaning.
- A feed has duplicate occurrences; identical occurrences from the same source
  are not shown more than once.
- A feed changes after a snapshot was saved; the previous snapshot remains
  available until a newer successful refresh replaces it.
- The deployment provides no usable default URL, or a locally replaced URL
  becomes invalid; the app explains the configuration problem and, when no
  active URL exists, allows one replacement URL as recovery without showing a
  blank view.
- The active feed does not provide browser-readable CORS headers, or the
  same-origin retrieval path is unavailable; the app preserves any prior good
  snapshot and shows a retryable error.
- A feed has no events, only past events, or events outside the selected range;
  each condition has an explanatory empty state.
- Event text contains unexpected or unsafe content; it is validated before
  display and does not alter the page or expose raw untrusted markup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST use exactly one publicly accessible ICS feed URL
  supplied through deployment configuration, without requiring the visitor to
  add a source before first use. If that configuration is missing or unusable,
  the app MUST show a configuration error and allow one replacement URL as
  recovery.
- **FR-002**: The app MUST allow the visitor to replace the active feed URL with
  another public ICS URL, persist that replacement locally, and use only that
  URL until the visitor resets to the deployment default.
- **FR-003**: The app MUST validate a replacement feed before activating it;
  when validation or retrieval fails, it MUST preserve the current active URL
  and snapshot and provide a clear error and retry action.
- **FR-004**: The app MUST retrieve and validate the active feed before
  displaying its contents. Retrieval MUST use a same-origin proxy capable of
  accessing feeds without browser-readable CORS headers. The proxy MUST accept
  only public HTTPS destinations after SSRF validation, reject private or local
  network destinations, and provide a clear retryable error when retrieval
  fails.
- **FR-005**: The app MUST display valid upcoming event occurrences in
  chronological order by start time, with a consistent presentation for
  time zones and all-day events.
- **FR-006**: The app MUST support recurring event occurrences within the
  displayed date range.
- **FR-007**: The app MUST show an event's title and start time, and MUST show
  its end time, location, and description when those values are available and
  valid.
- **FR-008**: The app MUST provide on-demand filters for date range and text
  matching against event title, location, or description.
- **FR-009**: The app MUST allow visitors to clear active filters and return to
  the default upcoming-event view.
- **FR-010**: The app MUST show deliberate loading, error, and empty states;
  loading states MUST time out and error states MUST offer retry.
- **FR-011**: The app MUST show when the active feed was last refreshed and MUST
  preserve the last successful snapshot when a later refresh fails.
- **FR-012**: The app MUST retain the latest successful snapshot on the device
  and display it when the device is offline, with a clear indication that the
  data may be outdated.
- **FR-013**: The app MUST provide a responsive, keyboard-accessible view on
  mobile and desktop screen sizes, with accessible names, roles, and focus
  order for every interactive control.
- **FR-014**: The app MUST be read-only for calendar events; it MUST NOT create,
  edit, delete, RSVP to, or otherwise manage calendar events.
- **FR-015**: The app MUST not render unvalidated feed text as executable or
  raw markup, and invalid feed data MUST NOT produce a blank or broken view.

### Key Entities *(include if feature involves data)*

- **Calendar Feed**: The single active publicly accessible ICS source, with an
  address, whether it is the deployment default or local replacement, refresh
  status, and last successful refresh time.
- **Calendar Event Occurrence**: A viewable occurrence with title, start and
  optional end time, time-zone context, location, description, source feed, and
  recurrence or all-day meaning when applicable.
- **Calendar Snapshot**: The most recent successfully validated set of event
  occurrences retained for viewing when a feed cannot currently be reached.
- **Filter Selection**: The visitor's active date range and text query used to
  narrow visible occurrences.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: At least 90% of first-time users in usability testing can open a
  correctly configured deployment and identify the next event within one minute
  without adding a feed or receiving guidance.
- **SC-002**: 100% of valid event occurrences in the acceptance dataset appear
  in chronological order, and no past occurrence appears in the default view.
- **SC-003**: For a snapshot containing up to 5,000 event occurrences, a filter
  result is visible within two seconds on a supported mobile device.
- **SC-004**: After one successful refresh, 100% of offline acceptance tests
  can open the saved snapshot within five seconds and can identify when it was
  last refreshed.
- **SC-005**: 100% of invalid-feed, empty-feed, and no-offline-snapshot tests
  show explanatory copy and a recovery or retry action rather than a blank
  screen.
- **SC-006**: At least 90% of usability-test participants can complete the
  primary view and filter tasks using keyboard navigation and accessible
  controls without assistance.
- **SC-007**: 100% of acceptance tests using a public ICS feed without browser
  CORS headers either display validated events through the same-origin retrieval
  path or show an explanatory retryable error without a blank view.

## Assumptions

- Deployment supplies one public ICS feed URL through environment-backed
  configuration in normal operation; a missing or unusable default is treated
  as a visible deployment configuration error. Version one does not require
  accounts, private-feed authentication, or calendar-provider sign-in.
- The deployment includes a same-origin retrieval service for public HTTPS ICS
  feeds; direct browser CORS access is not required from feed providers.
- A local replacement takes precedence over the deployment default until the
  visitor explicitly resets it; only one active URL exists at any time.
- The default view shows upcoming occurrences for the next 30 days; visitors
  can use date filters to inspect another period.
- The latest successfully validated snapshot remains available until replaced
  by a newer successful refresh, regardless of its age.
- Standard ICS event data is in scope; unsupported attachments, invitations,
  event editing, and provider-specific actions are out of scope.
- Mobile visitors may have intermittent or absent connectivity, so offline
  viewing is an expected operating condition rather than an error-only case.

# Feature Specification: Event-First Calendar Layout

**Feature Branch**: `002-event-first-layout`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "As a user i want to see the events more dominantly. They should be the first i see. I want the settings hidden behind some menu button and the filter should only e visible when i activate them via another button. The update buttoon and recency information should be at the bottom."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Events First (Priority: P1)

When a visitor opens the calendar, the upcoming events are the primary content and are the first useful information they encounter. Secondary controls do not compete with the event list for the initial view.

**Why this priority**: Finding the next event is the main purpose of the calendar. Reducing surrounding controls makes that task faster and clearer.

**Independent Test**: Open a calendar with upcoming events on desktop and mobile, then verify that the event list is visible before settings or filter controls and that event details remain readable.

**Acceptance Scenarios**:

1. **Given** a valid calendar with upcoming events, **When** the visitor opens the viewer, **Then** the event list is the first primary content shown and event title and start time are visually dominant.
2. **Given** a calendar with event details, **When** the visitor views the initial page, **Then** the event list is not pushed below expanded settings or filter controls.
3. **Given** a narrow mobile viewport, **When** the visitor opens the viewer, **Then** upcoming events remain immediately visible without horizontal scrolling or control clutter above them.

---

### User Story 2 - Reveal Filters on Demand (Priority: P2)

When a visitor wants to narrow the event list, they can reveal the filter controls with a clearly labeled filter button. The controls stay out of the way when filtering is not needed.

**Why this priority**: Filtering is useful but secondary to reading events, so it should be available without occupying the default view.

**Independent Test**: Open a calendar, verify filter controls are hidden, activate the filter button, apply a date or text filter, and clear the filter while using both pointer and keyboard input.

**Acceptance Scenarios**:

1. **Given** the viewer has loaded, **When** no filter interaction has occurred, **Then** filter fields and filter actions are hidden while a labeled filter button remains available.
2. **Given** filter controls are hidden, **When** the visitor activates the filter button, **Then** the filter controls become visible, receive an understandable focus location, and can be used to filter events.
3. **Given** an active date or text filter, **When** the visitor reloads or returns to the view, **Then** the active filtered results remain represented and the visitor can reopen the filter controls to change or clear them.
4. **Given** the filter controls are visible, **When** the visitor activates the filter button again or clears the filters, **Then** the controls close or return to the default upcoming-event view without changing the selected feed.

---

### User Story 3 - Keep Settings and Refresh Utilities Secondary (Priority: P3)

When a visitor needs feed settings or a refresh, they can access those actions without making them part of the default event-reading flow. Settings are available from a menu, while update and recency information are placed after the primary calendar content.

**Why this priority**: Feed management and refresh status are important supporting actions, but they should not displace the events visitors came to read.

**Independent Test**: Open the viewer, verify settings are closed, open and close the settings menu, then verify the update action and last-refreshed information appear below the event content on desktop and mobile.

**Acceptance Scenarios**:

1. **Given** the viewer has loaded, **When** the visitor has not opened settings, **Then** feed replacement and reset controls are hidden behind one clearly labeled settings/menu button.
2. **Given** settings are hidden, **When** the visitor activates the settings/menu button, **Then** the settings content opens with an accessible name and the existing feed replacement and reset actions remain available.
3. **Given** settings are open, **When** the visitor closes the menu, presses Escape, or moves to another primary action, **Then** the settings content closes without changing the active feed or event results.
4. **Given** a successful or failed refresh, **When** the visitor views the page, **Then** the update action and recency information appear in a utility area after the event content rather than above it.
5. **Given** an empty, loading, error, or stale snapshot state, **When** the visitor views the page, **Then** the state remains deliberate and the relevant update or retry action is still reachable below or within the primary state content.

---

### Edge Cases

- When both filters and settings are available, opening one secondary panel closes the other so the event list is not surrounded by multiple expanded panels.
- When filters are active, hiding the filter controls does not silently clear the selected filters or change the event results.
- When the event list is empty, unavailable, or showing a stale snapshot, the layout still provides clear state text and keeps recovery or update actions reachable.
- When the settings menu is opened on mobile, it must fit the viewport and remain keyboard accessible without horizontal scrolling.
- When the visitor uses only a keyboard, menu and filter buttons must expose their expanded state, move focus predictably, and support Escape to close an open panel.
- When the recency value is unavailable, the page shows a clear unavailable or never-refreshed message rather than an empty area.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST present the upcoming event list as the primary content on initial load, before expanded settings or filter controls.
- **FR-002**: The viewer MUST give event titles and start times greater visual prominence than secondary controls in the default view.
- **FR-003**: The viewer MUST provide a clearly labeled settings/menu control that keeps feed replacement and reset actions hidden until activated.
- **FR-004**: The settings/menu control MUST expose its open or closed state and MUST allow the visitor to close the settings content without changing the active feed or snapshot.
- **FR-005**: The viewer MUST keep filter controls hidden by default and MUST provide a clearly labeled control to reveal and hide them.
- **FR-006**: Revealing, hiding, or clearing filters MUST NOT change the active feed selection or stored snapshot.
- **FR-007**: The viewer MUST preserve active filter results when the visitor hides the filter controls or reloads the view, consistent with the existing filter behavior.
- **FR-008**: The viewer MUST place the update action and last-refresh or recency information in a utility area after the primary event content on desktop and mobile layouts.
- **FR-009**: The viewer MUST retain deliberate loading, empty, error, stale, and no-snapshot states while applying the new content hierarchy.
- **FR-010**: Every menu, filter, update, replacement, reset, close, and clear interaction MUST remain keyboard reachable, have an accessible name and state, and support a logical focus order.
- **FR-011**: The viewer MUST avoid horizontal scrolling and preserve readable event content when settings or filter controls are opened on supported mobile and desktop sizes.
- **FR-012**: The viewer MUST keep the event list, feed selection, filtering, refresh, recency, and offline behavior functionally equivalent to the existing feature except for their presentation and visibility hierarchy.

### Key Entities *(include if feature involves data)*

- **Event View**: The primary ordered presentation of upcoming or saved calendar occurrences, including their existing title, time, and optional details.
- **Secondary Panel**: A temporarily revealed settings or filter area with an open/closed state and predictable focus behavior.
- **Refresh Utility**: The update action and recency information associated with the active feed and displayed snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of acceptance flows with available events, the event list appears before any expanded settings or filter content on desktop and mobile viewports.
- **SC-002**: At least 90% of usability-test participants can identify the next event within 10 seconds of opening the viewer without first opening settings or filters.
- **SC-003**: In 100% of default-state checks, filter fields and settings content are hidden while their labeled activation controls remain discoverable.
- **SC-004**: At least 95% of keyboard acceptance runs can open, use, and close both secondary panels without focus loss or accidental feed changes.
- **SC-005**: In 100% of layout checks, the update action and recency information appear after the event content and remain reachable on desktop and mobile without horizontal scrolling.
- **SC-006**: Existing event viewing, filter results, feed replacement/reset, refresh recovery, and offline snapshot acceptance scenarios pass without behavioral regressions.

## Assumptions

- The existing calendar viewer, event data, feed selection, filtering, refresh, recency, and offline snapshot behavior remain in scope; this feature changes presentation hierarchy and control visibility rather than domain behavior.
- The settings/menu button contains the existing feed replacement and reset actions; no new feed-management capabilities are added.
- The filter button may show a compact indication that filters are active, but filter fields remain hidden until the visitor opens the filter controls.
- Settings and filter panels are mutually exclusive when both are available, reducing simultaneous secondary content around the event list.
- The update action remains available after the event content even when the current state is loading, empty, stale, or error; its label and enabled state may reflect that state.
- Desktop and mobile use the same information hierarchy, with layout changes limited to fitting the available viewport.

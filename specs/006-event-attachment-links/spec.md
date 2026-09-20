# Feature Specification: Event Attachment Links

**Feature Branch**: `006-event-attachment-links`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Add links to attachments of an event"

## User Scenarios & Testing

### User Story 1 - Open Event Attachments (Priority: P1)

As a calendar viewer, I want each event's linked attachments to be visible in the event details, so I can open the documents or resources associated with that event.

**Why this priority**: Attachment links are the complete user-facing value of the feature and must be available in the event detail view.

**Independent Test**: Load a calendar containing an event with one or more URL attachments, expand the event, and confirm each attachment is presented as an accessible link with the original destination.

**Acceptance Scenarios**:

1. **Given** an event has one HTTP or HTTPS attachment, **When** the event details are expanded, **Then** the details include an attachment link that opens the attachment destination.
2. **Given** an event has multiple URL attachments, **When** the event details are expanded, **Then** every valid attachment is listed as a separate link without changing its destination.
3. **Given** an attachment has a display name, **When** it is presented, **Then** the link uses that display name; otherwise it uses a clear attachment fallback label.
4. **Given** an event has no valid URL attachments, **When** the event details are expanded, **Then** no empty attachment section is shown.

### User Story 2 - Preserve Safe and Usable Event Details (Priority: P1)

As a calendar viewer, I want attachment data from an external calendar feed to be handled safely and consistently with existing event details, so malformed or unsupported attachment values do not break the calendar view.

**Why this priority**: Calendar feeds are untrusted input and invalid attachment values must not make events unusable.

**Independent Test**: Load events with valid, unsupported, malformed, and escaped attachment values and confirm valid links remain usable while unsupported values are omitted and existing event content remains visible.

**Acceptance Scenarios**:

1. **Given** an attachment is not an HTTP or HTTPS URL, **When** the event is normalized, **Then** it is omitted from the user-facing attachment links.
2. **Given** an attachment value is malformed or cannot be represented as a URL, **When** the calendar is normalized, **Then** the event remains available and the malformed attachment is omitted.
3. **Given** an attachment link is rendered, **When** keyboard and assistive technology users inspect it, **Then** it has a meaningful accessible name and follows the application's existing external-link behavior.

### Edge Cases

- Events with no `ATTACH` properties must retain their current details layout and show no attachment heading or empty list.
- Multiple `ATTACH` properties and repeated attachment URLs must remain separate entries in the source order; deduplication is not required.
- URL attachments may contain escaped iCalendar text and query parameters; the resulting destination must preserve the decoded URL semantics.
- `BINARY` attachments and non-HTTP(S) schemes are out of scope for v1 and must not be rendered as clickable links.
- A malformed attachment must not cause the entire event or calendar normalization to fail.
- Attachment link text must be treated as text, not interpreted as HTML.

## Requirements

### Functional Requirements

- **FR-001**: The calendar data model MUST expose zero or more attachment links for each normalized event occurrence.
- **FR-002**: The normalizer MUST extract URL-valued `ATTACH` properties from events while preserving their source order.
- **FR-003**: Only valid `http` and `https` attachment URLs MUST be exposed as clickable links; binary attachments, unsupported schemes, and malformed values MUST be omitted.
- **FR-004**: The event details view MUST render every exposed attachment as a separate semantic link and MUST omit the attachment section when no links exist.
- **FR-005**: Attachment links MUST open externally using the application's existing safe external-link conventions, including a new browsing context and appropriate opener protection.
- **FR-006**: Attachment link labels MUST use the attachment's supplied display name when available and a clear localized fallback label otherwise.
- **FR-007**: Attachment URL and label values MUST be rendered as text/attributes without interpreting feed-provided content as markup.
- **FR-008**: Existing event title, date, location, description, recurrence, filtering, offline snapshot, and error behavior MUST remain unchanged for events without valid attachments.
- **FR-009**: Automated coverage MUST verify normalization, URL filtering, display-name/fallback labeling, multiple attachments, malformed input resilience, and accessible external-link rendering.

### Key Entities

- **Event Attachment**: A URL-valued attachment associated with an event occurrence, containing a destination URL and optional display name.
- **Calendar Occurrence**: The normalized event record that owns zero or more event attachments and is displayed by the event details view.

## Success Criteria

### Measurable Outcomes

- **SC-001**: For every valid HTTP(S) attachment in a loaded event, users can reach the original destination from the expanded event details in one activation.
- **SC-002**: Events with invalid, unsupported, or binary attachments remain visible with the same non-attachment details as before the feature.
- **SC-003**: The attachment behavior passes automated coverage for single, multiple, absent, malformed, unsupported-scheme, display-name, and accessibility scenarios.
- **SC-004**: No feed-provided attachment label or URL can inject markup into the rendered event details.
- **SC-005**: Existing project lint, typecheck, unit/integration, build, and browser validation commands remain passing after the feature is added.

## Assumptions

- The iCalendar `ATTACH` property is the source of event attachments.
- v1 supports URI attachments that use HTTP or HTTPS; downloading, proxying, uploading, or displaying inline binary attachments is out of scope.
- The optional iCalendar `FILENAME` parameter is used as the display name when present; otherwise the UI uses a localized generic attachment label.
- Attachment links are shown only in the expandable event details, not in the collapsed event summary.
- Existing browser behavior for external links is retained: links open in a new browsing context with `noopener` and `noreferrer`.

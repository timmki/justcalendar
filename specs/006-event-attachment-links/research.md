# Research: Event Attachment Links

## Decision: Normalize URL-valued ATTACH properties at the calendar boundary

- Decision: Read `ATTACH` properties from each `VEVENT`, preserve property order, and expose only values that parse as `http` or `https` URLs.
- Rationale: The normalizer is the existing trust boundary for external ICS strings. Filtering there prevents malformed or unsafe values from spreading into snapshots and UI code.
- Alternatives considered: Rendering raw `ATTACH` properties in the UI was rejected because it duplicates parsing and weakens validation; accepting every URL scheme was rejected because schemes such as `javascript:` or `data:` are not appropriate user-facing attachment links.

## Decision: Use the iCalendar FILENAME parameter for optional labels

- Decision: Read the `FILENAME` parameter from each accepted `ATTACH` property and use it as the display name when non-empty; otherwise use a localized generic label.
- Rationale: `FILENAME` is the standard iCalendar hint for an attachment name and allows useful link text without fetching the resource.
- Alternatives considered: Deriving labels from URL path segments was rejected because paths may be opaque or expose implementation details; fetching metadata was rejected because it adds latency, privacy exposure, and failure modes.

## Decision: Render links with existing safe external-link conventions

- Decision: Render semantic `<a>` elements with the original URL, `target="_blank"`, `rel="noreferrer noopener"`, and accessible text.
- Rationale: The UI already uses this convention for Google Maps links, making behavior consistent and avoiding a new link abstraction.
- Alternatives considered: Opening in the same page was rejected because it replaces the calendar; proxying or downloading through the server is out of scope and would introduce a new network contract.

## Decision: Keep invalid attachments non-fatal

- Decision: Catch URL parsing failures per attachment and skip only that property; normalization of the event continues.
- Rationale: External feeds can contain malformed optional properties. One bad attachment should not hide an otherwise valid event.
- Alternatives considered: Marking the whole event partial and dropping it was rejected because attachment data is supplemental.

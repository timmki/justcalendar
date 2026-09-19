# ICS Retrieval Contract

## Browser-to-Proxy Request

The browser calls the same-origin endpoint:

```text
POST /api/v1/ics
Content-Type: application/json

{
  "schemaVersion": 1,
  "url": "https://calendar.example.test/public.ics"
}
```

The request is same-origin, so the upstream feed does not need to grant browser
CORS access. The proxy performs the upstream request as a fixed read-only `GET`.

Validation rules:

- `schemaVersion` must be `1`.
- `url` must be an absolute HTTPS URL with no credentials or fragment.
- The URL must not exceed 2 KiB.
- The proxy must reject private, local, link-local, metadata, multicast, and
  otherwise non-global resolved addresses, including mixed DNS results.
- The proxy must resolve DNS for each request and connect to the validated IP.
- The proxy must not forward client cookies, authorization, or arbitrary headers.

## Successful Response

The proxy returns the complete upstream body with `Content-Type: text/calendar`.
The body must contain a `VCALENDAR` with iCalendar `VERSION:2.0`; this is the
calendar payload schema consumed by the browser parser. The API contract is
versioned by `/api/v1/ics` and the request `schemaVersion`.

Limits:

- Upstream response body: 1 MiB maximum.
- Upstream deadline: 10 seconds maximum.
- Maximum concurrent upstream requests: 16; excess requests receive `429`.
- Redirects are rejected and never followed.

The proxy must return only an explicit response-header allowlist. It must not
forward `Location`, `Set-Cookie`, or hop-by-hop headers.

## Error Response

Errors use RFC 9457 Problem Details with `Content-Type:
application/problem+json` and an API error schema version of `1`:

```json
{
  "type": "https://justcalendar.example/problems/upstream-timeout",
  "title": "Calendar feed unavailable",
  "status": 504,
  "detail": "The calendar feed did not respond before the timeout.",
  "schemaVersion": 1
}
```

The browser maps proxy errors to deliberate configuration, loading, or retry
states. Error details must not contain credentials, response bodies, feed URLs,
event UIDs, or private network addresses.

## ICS Parsing Boundary

After a successful proxy response, the application performs the authoritative
parse and validation. It must handle folded lines, escaped text,
case-insensitive property names and parameters, UTC and floating times, `TZID`,
`VTIMEZONE`, all-day dates, `DTEND`, `DURATION`, recurrence rules, recurrence
dates, exclusions, and `RECURRENCE-ID` overrides. `DTEND` and `DURATION` must not
both define an event.

Feed data is normalized to snapshot schema version `1` before UI use. Recurrence
expansion is bounded to the display window and an occurrence limit. `VALARM` is
never executed.

Invalid event items may be excluded while valid items remain visible with a
partial-data notice. Feed text is rendered as text, never as HTML or executable
content. `URL`, `SOURCE`, `ALTREP`, `ATTACH`, `IMAGE`, `CONFERENCE`, and `TZURL`
are not dereferenced automatically.

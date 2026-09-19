# Research: Offline Calendar Viewer

## Decision: Use Vanilla TypeScript with Vite

**Rationale**: The feature is one read-only route with a small number of
explicit states. Native forms, DOM APIs, CSS, and TypeScript avoid a runtime
component framework, global store, router, and UI dependency while keeping
keyboard behavior visible and testable.

**Alternatives considered**: React with Vite was rejected as unnecessary
rendering and lifecycle complexity for this scope. A full SSR framework was
rejected because the app has no server-rendered data requirement or account
workflow.

## Decision: Generate Runtime Configuration as `/config.json`

**Rationale**: Browser code cannot read deployment environment variables after a
static build. Deployment should generate a same-origin JSON contract from
`JUSTCALENDAR_DEFAULT_ICS_URL` and `JUSTCALENDAR_TELEMETRY_URL`. The app can
therefore use one build across deployments, validate configuration at runtime,
and show the specified recovery state when the default URL is missing.

**Alternatives considered**: Build-time `VITE_*` variables were rejected
because changing a deployment value would require rebuilding the app. Reading
arbitrary environment variables in browser code is not available.

## Decision: Use a Node.js 22 Same-Origin ICS Proxy

**Rationale**: The browser retrieves the effective feed through `POST
/api/v1/ics`, so public feeds do not need browser-readable CORS headers. A
minimal Node.js 22 service can serve the built frontend and proxy from one
origin using built-in HTTP, HTTPS, DNS, networking, and test primitives. The
proxy performs a fixed upstream `GET`, accepts only public HTTPS destinations,
applies time, size, header, and concurrency limits, and returns raw iCalendar
or RFC 9457 Problem Details. The application still performs the authoritative
ICS parse and validation before a snapshot is stored.

The proxy parses the URL once, rejects credentials and unsafe schemes, resolves
every A and AAAA result for every request, rejects any non-global address, and
connects to the validated IP to prevent DNS rebinding. It does not follow
redirects; if redirects become necessary later, every hop must repeat URL,
scheme, port, DNS, and IP validation.

**Alternatives considered**: Direct browser fetch was rejected because public
feed availability does not guarantee CORS. `no-cors` responses are opaque and
cannot be parsed. An unrestricted fetch proxy was rejected because it would
create an SSRF and data-exfiltration boundary. A server framework was rejected
because Node built-ins are sufficient for this narrow endpoint.

## Decision: Use a Narrow, Versioned Proxy Contract

**Rationale**: The browser sends one URL in a versioned JSON request and
receives either a validated ICS body or a structured error. The proxy forwards
only fixed upstream headers, never cookies, authorization, or arbitrary client
headers. It returns no `Location`, `Set-Cookie`, or hop-by-hop headers. Upstream
bodies are capped at 1 MiB and total upstream time at 10 seconds; excess
concurrency receives a retryable `429` response.

**Alternatives considered**: A generic URL fetch endpoint was rejected because
it would become an SSRF primitive. Forwarding arbitrary request/response
headers was rejected because it leaks credentials and transport metadata.

## Decision: Use `ical.js` at the Feed Boundary

**Rationale**: iCalendar line folding, escaping, case-insensitive properties,
time zones, recurrence exceptions, and `RECURRENCE-ID` overrides are unsafe to
reimplement casually. Parse and normalize one validated feed before the UI sees
it. Expand recurrence only inside the visible date range with a hard occurrence
limit, and never execute `VALARM`.

**Alternatives considered**: A home-grown parser was rejected because RFC 5545
edge cases would become application code and test burden. Parsing in the proxy
was rejected because the browser needs one normalized snapshot model and the
proxy should remain a narrow retrieval boundary.

## Decision: Store Calendar Data in IndexedDB

**Rationale**: IndexedDB supports asynchronous structured data suitable for
event snapshots and the single local URL override. Save a new snapshot only
after complete validation so a failed refresh cannot destroy the last-known-good
view. Treat browser storage as best-effort and show the snapshot timestamp.

**Alternatives considered**: `localStorage` is synchronous and string-only;
Cache Storage is a request/response cache rather than the application's data
model. Both were rejected for calendar snapshots.

## Decision: Cache Only the App Shell in a Small Service Worker

**Rationale**: Cache Storage and a service worker can make the application shell
open offline. IndexedDB remains the source of truth for parsed calendar data.
No background polling is promised; refresh occurs on open, explicit retry, or
an explicit refresh action.

**Alternatives considered**: A PWA/workbox plugin and periodic background sync
were rejected as unnecessary dependencies and unsupported reliability promises
for this first version.

## Decision: Keep Filters in the URL

**Rationale**: Date range and text query are user-facing view state. URL
parameters make the filtered view refreshable and shareable without introducing
a global client store. The active feed override and snapshot remain local data
because they are device-specific and potentially sensitive.

## Decision: Report Errors and Web Vitals Through Deployment Configuration

**Rationale**: The constitution requires observability. Use a small telemetry
adapter with a deployment-provided endpoint, send structured feed/configuration
errors and Web Vitals, and never send feed URLs, event UIDs, descriptions, or
conference tokens. If no endpoint is configured, local development remains
usable but release readiness fails the observability gate.

**Alternatives considered**: Vendor-specific error tracking was rejected until
the deployment identifies a provider and privacy policy. Logging full feed
payloads or URLs was rejected because public does not mean safe to retain.

## Sources

- [RFC 5545 iCalendar](https://www.rfc-editor.org/rfc/rfc5545)
- [RFC 7986 iCalendar extensions](https://www.rfc-editor.org/rfc/rfc7986)
- [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457)
- [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)
- [RFC 6585 Additional HTTP Status Codes](https://www.rfc-editor.org/rfc/rfc6585)
- [Node HTTP](https://nodejs.org/docs/latest-v22.x/api/http.html)
- [Node HTTPS](https://nodejs.org/docs/latest-v22.x/api/https.html)
- [Node DNS](https://nodejs.org/docs/latest-v22.x/api/dns.html)
- [Node `net.BlockList`](https://nodejs.org/docs/latest-v22.x/api/net.html#class-netblocklist)
- [Fetch Standard](https://fetch.spec.whatwg.org/)
- [URL Standard](https://url.spec.whatwg.org/)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [ICAL.js](https://github.com/kewisch/ical.js)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Vite environment variables](https://vite.dev/guide/env-and-mode)
- [Vite guide](https://vite.dev/guide/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Core Web Vitals](https://web.dev/articles/vitals)
- [Vitest](https://vitest.dev/guide/)
- [Playwright](https://playwright.dev/docs/intro)

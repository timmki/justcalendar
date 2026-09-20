# Feature Specification: Prevent Automated Crawling

**Feature Branch**: `007-prevent-automated-crawling`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Implement policies to prevent webscrapers, crawlers and ai bots to crawl the page."

## User Scenarios & Testing

### User Story 1 - Publish Crawl Exclusion Policies (Priority: P1)

As a site operator, I want the application to publish standard crawler exclusion instructions, so compliant search engines, web crawlers, web scrapers, and AI crawlers are told not to retrieve or index the calendar page.

**Why this priority**: A machine-readable exclusion policy is the primary, standards-based way to communicate the operator's intent to automated clients.

**Independent Test**: Request `/robots.txt` and the application HTML, then confirm the responses contain directives that disallow all user agents from crawling and indexing the page.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** a client requests `/robots.txt`, **Then** the response is successful, identifies all user agents, disallows all paths, and is served as plain text.
2. **Given** the application serves the HTML page, **When** a client inspects its response headers, **Then** it receives a `noindex, nofollow, noarchive` robots directive.
3. **Given** the application HTML is viewed by a client that does not process response headers, **When** its metadata is inspected, **Then** it contains an equivalent robots exclusion directive.
4. **Given** a request for an application asset or fallback route, **When** the response is served, **Then** the same no-index policy is applied consistently rather than only on `/`.

### User Story 2 - Keep Exclusion Policy Consistent in Deployment (Priority: P1)

As a site operator, I want the crawler policy to remain present in local, production, and container-served builds, so deployment packaging cannot accidentally expose the page to compliant crawlers.

**Why this priority**: The policy is ineffective if it exists only in source files but is omitted from the built or containerized application.

**Independent Test**: Build the application and inspect the produced static/server artifacts and a running production server to confirm `/robots.txt`, response headers, and HTML metadata are all present.

**Acceptance Scenarios**:

1. **Given** a production build is created, **When** the output is served by the Node server, **Then** `/robots.txt` and the no-index policy are available without development tooling.
2. **Given** a route is not a static file and falls back to the application HTML, **When** it is requested, **Then** the response still contains the no-index policy.
3. **Given** a crawler policy file is requested with a query string, **When** the request is handled, **Then** it receives the same policy and content type as the canonical path.

### Edge Cases

- The policy must not rely on a specific crawler name; it applies to `User-agent: *` because clients can identify themselves arbitrarily.
- A robots policy is advisory and cannot stop spoofed user agents, direct HTTP clients, or clients that intentionally ignore standards; hard blocking belongs at an ingress/WAF boundary and is out of scope.
- The policy must not block the application's same-origin calendar API from functioning for normal users.
- The application must not expose a permissive or conflicting robots policy through another static or fallback route.
- The no-index directive must be applied to responses even when the requested asset or fallback route returns an error status, where the server controls the response.

## Requirements

### Functional Requirements

- **FR-001**: The application MUST serve `/robots.txt` with a successful plain-text response containing `User-agent: *` and `Disallow: /`.
- **FR-002**: The application MUST send `X-Robots-Tag: noindex, nofollow, noarchive` on HTML, static asset, API, and application error responses it controls.
- **FR-003**: The application HTML MUST include a `robots` metadata directive equivalent to `noindex, nofollow, noarchive`.
- **FR-004**: The crawler exclusion policy MUST be independent of individual crawler names and MUST apply uniformly to search crawlers, scrapers, and AI crawlers that honor standard directives.
- **FR-005**: The policy MUST remain available in the built application and the production Docker image without requiring development-only files or runtime configuration.
- **FR-006**: The policy MUST NOT disable normal browser use of the application or same-origin calendar retrieval.
- **FR-007**: The implementation MUST document that robots and no-index directives are advisory and do not provide enforcement against clients that ignore or spoof crawler identity.
- **FR-008**: Automated coverage MUST verify the robots file, response headers on success and error paths, HTML metadata, fallback routes, query strings, and preserved calendar API behavior.

### Key Entities

- **Crawler Exclusion Policy**: The shared set of robots instructions exposed through `robots.txt`, response headers, and HTML metadata.
- **Application Response**: Any HTML, static, API, fallback, or controlled error response to which the no-index header applies.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of application-controlled HTTP response classes tested for this feature contain the no-index response header.
- **SC-002**: A standards-compliant crawler requesting `/robots.txt` receives an all-path disallow policy in one successful response.
- **SC-003**: The built and container-served application exposes the same robots policy as local development output.
- **SC-004**: Existing browser, calendar retrieval, build, lint, typecheck, and test behavior remains passing after the policy is added.
- **SC-005**: Deployment documentation clearly states the policy's advisory limitation and identifies ingress/WAF controls as the option for hard blocking.

## Assumptions

- The requested behavior means standards-based exclusion, not guaranteed network-level bot prevention.
- One wildcard policy is preferred over maintaining an incomplete list of current AI or scraper user-agent names.
- No sitemap is published by the application, so no sitemap exclusion entry is needed.
- The existing server is the response boundary for this feature; reverse proxies may add stronger controls separately.
- The policy applies to all application-controlled responses, while robots directives do not interfere with same-origin fetches made by the browser application.

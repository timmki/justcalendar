# Research: Prevent Automated Crawling

## Decision: Use a wildcard robots.txt exclusion

- Decision: Serve `User-agent: *` followed by `Disallow: /` from `/robots.txt`.
- Rationale: This is the standard machine-readable exclusion mechanism and covers compliant search, scraper, and AI crawlers without maintaining an incomplete user-agent list.
- Alternatives considered: Listing named bots was rejected because clients can change or spoof names; a permissive robots file was rejected because the operator wants the entire application excluded.

## Decision: Add defense-in-depth no-index directives

- Decision: Send `X-Robots-Tag: noindex, nofollow, noarchive` on all application-controlled responses and include the equivalent `<meta name="robots">` directive in the HTML shell.
- Rationale: Headers cover non-HTML responses and error paths; HTML metadata helps clients that only inspect the document.
- Alternatives considered: HTML metadata alone was rejected because it does not cover assets/API/error responses; headers alone were rejected because some clients inspect HTML metadata directly.

## Decision: Apply policy at the server boundary

- Decision: Set the header immediately when the Node request handler creates a response, then preserve existing route-specific headers/content types.
- Rationale: This covers static files, fallback routes, API responses, and controlled errors without duplicating policy logic in every route.
- Alternatives considered: Adding headers only in Vite or only in Docker was rejected because local and production behavior could diverge.

## Decision: Document the enforcement boundary

- Decision: State in deployment documentation that robots directives are advisory and that hard blocking requires reverse-proxy, WAF, authentication, or network controls.
- Rationale: No application-level policy can prevent direct clients or spoofed user agents from connecting.
- Alternatives considered: User-agent rejection in the application was rejected as brittle, bypassable, and likely to block legitimate clients.

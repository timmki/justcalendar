# Data Model: Prevent Automated Crawling

## Crawler Exclusion Policy

| Field | Value | Purpose |
|---|---|---|
| `robotsUserAgent` | `*` | Applies to every crawler identity that honors robots rules |
| `robotsDisallow` | `/` | Requests compliant crawlers not to crawl any path |
| `robotsHeader` | `noindex, nofollow, noarchive` | Requests clients not to index, follow, or archive controlled responses |
| `htmlMetadata` | `robots` with the same directives | Provides an HTML-level equivalent |

## Application Response

The policy applies to:

- `robots.txt` success response;
- HTML/static success responses;
- fallback HTML responses;
- calendar API success and problem responses;
- controlled static 403/404 responses.

Route-specific content types, cache behavior, status codes, and request validation remain unchanged.

## Deployment Artifact

`public/robots.txt` is copied into the production image through the existing public-assets build/copy path and is served at the canonical root path.

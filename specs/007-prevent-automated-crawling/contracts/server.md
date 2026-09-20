# Server Contract: Prevent Automated Crawling

## `GET /robots.txt`

- Status: 200
- Content-Type: `text/plain; charset=utf-8`
- Body contains:

```text
User-agent: *
Disallow: /
```

- Response includes `X-Robots-Tag: noindex, nofollow, noarchive`.
- A query string does not change the policy.

## Controlled application responses

- Every response produced by the application includes `X-Robots-Tag: noindex, nofollow, noarchive`.
- Existing route-specific status, content type, and body contracts remain unchanged.
- The HTML document contains `<meta name="robots" content="noindex, nofollow, noarchive">`.

## Enforcement boundary

This contract communicates policy to compliant crawlers. It does not authenticate clients, reject spoofed user agents, or prevent direct requests. Deployment-level enforcement is outside this application contract.

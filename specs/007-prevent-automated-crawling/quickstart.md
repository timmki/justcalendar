# Quickstart: Prevent Automated Crawling

## Automated validation

From the repository root:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Expected outcomes:

- Server contract tests confirm `/robots.txt`, no-index headers on success/error/API responses, fallback routes, and query strings.
- Browser tests confirm the HTML robots metadata and existing calendar behavior.
- The built output contains the packaged robots policy.
- Existing lint, typecheck, unit/integration, build, and browser checks pass.

## Manual validation

1. Start the production server with `npm start` after building.
2. Request `/robots.txt` and confirm `User-agent: *` and `Disallow: /`.
3. Request `/` and inspect `X-Robots-Tag` and the HTML `robots` metadata.
4. Request an unknown route and the calendar API, confirming the header remains present.
5. For hard blocking against non-compliant clients, configure the deployment reverse proxy or WAF; this feature does not claim to provide that enforcement.

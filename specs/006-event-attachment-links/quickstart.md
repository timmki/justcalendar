# Quickstart: Event Attachment Links

## Prerequisites

- Node.js >=22
- Dependencies installed with `npm ci`

## Automated validation

From the repository root:

```sh
npm test -- --run tests/unit/calendar.test.ts tests/integration/us1-feed-view.test.ts
npm run lint
npm run typecheck
npm run build
npm run e2e -- tests/e2e/us1-feed-view.spec.ts
```

Expected outcomes:

- Unit tests prove ATTACH normalization, HTTP(S) filtering, display-name handling, ordering, and malformed-value resilience.
- Integration tests prove attachment data survives the application journey and existing event behavior remains intact.
- Browser tests prove visible, accessible links and safe external-link attributes.
- Lint, typecheck, build, and the focused browser suite pass.

## Manual scenario

1. Start the app with a feed containing an event with two `ATTACH;FILENAME=...:https://...` properties.
2. Expand the event details.
3. Confirm both named links appear in source order.
4. Confirm each link opens externally and has safe `noopener`/`noreferrer` protection.
5. Repeat with an event containing no valid attachments and confirm no empty attachment section appears.

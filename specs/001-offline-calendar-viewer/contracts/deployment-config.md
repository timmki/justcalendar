# Deployment Configuration Contract

## Endpoint

The deployed application serves a same-origin `/config.json` document. The
document is generated from deployment environment values, not bundled as a
build-time application constant.

Environment mapping:

- `JUSTCALENDAR_DEFAULT_ICS_URL` -> `defaultFeedUrl`
- `JUSTCALENDAR_TELEMETRY_URL` -> `telemetryEndpoint`

## Response Schema

Contract version: `1`

```json
{
  "schemaVersion": 1,
  "defaultFeedUrl": "https://calendar.example.test/public.ics",
  "telemetryEndpoint": "https://telemetry.example.test/events"
}
```

`defaultFeedUrl` may be `null` when deployment configuration is missing. The
application must then show configuration recovery and allow one validated local
replacement URL. `telemetryEndpoint` may be `null` during local development;
release deployment must provide a usable endpoint to pass the observability
gate.

## Validation

- The document must be valid JSON and have `schemaVersion: 1`.
- Feed and telemetry URLs must be absolute HTTPS URLs in production.
- No credentials, private tokens, or feed contents may appear in this file.
- Unknown schema versions are configuration errors, not silently accepted.
- Configuration errors must have visible copy and a retry action.

# Telemetry Contract

## Endpoint

The deployment-provided `telemetryEndpoint` accepts best-effort `POST` events.
Telemetry failure must never block calendar viewing, refresh, replacement, or
offline access.

Contract version: `1`

```json
{
  "schemaVersion": 1,
  "event": "feed_load_failed",
    "occurredAt": "2026-09-19T12:00:00Z",
    "appVersion": "deployment-revision",
    "details": {
      "reason": "upstream_timeout"
  }
}
```

Allowed event names are `configuration_error`, `feed_load_failed`,
`snapshot_loaded`, and `web_vital`. Web Vital details contain metric name,
value, rating, and navigation type only.

Feed failure reasons use the stable proxy or validation codes from the ICS feed
contract, such as `invalid_request`, `target_not_allowed`,
`upstream_unavailable`, `upstream_timeout`, and `response_too_large`.

Telemetry must not contain feed URLs, event UIDs, event text, calendar contents,
credentials, or conference tokens. The client must sample or throttle repeated
failures and must use a short timeout.

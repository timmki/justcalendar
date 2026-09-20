# Research: Relevance Styling and Filter Reset

## Decision 1: Mark completed events by their effective end

- Decision: A timed occurrence is past when its end is before the current instant; if no end exists, its start is used. An all-day occurrence is past only when its represented end date is before the current local date.
- Rationale: An ongoing event should not look obsolete, and an all-day event should remain relevant for its entire local day.
- Alternatives considered:
  - Compare every start to now: rejected because ongoing events would be muted prematurely.
  - Compare all-day values as UTC instants: rejected because date-only events are local calendar concepts.

## Decision 2: Use a non-blocking optional public logo fallback

- Decision: Try `/logo.png` first, then `/logo.jpg` on load failure. Remove the image element if both fail and retain the text identity.
- Rationale: This gives deployments a simple code-hosted replacement convention without adding configuration, upload UI, or remote network dependencies.
- Alternatives considered:
  - Add another environment variable: rejected because the request specifically asks for a PNG/JPG supplied in code.
  - Commit a placeholder binary: rejected because no user logo was provided and a fake logo would be misleading.

## Decision 3: Apply a scoped blue palette through existing CSS variables

- Decision: Replace the warm neutral palette with cool blue-tinted surfaces, borders, text, accents, links, and focus states while retaining the existing card hierarchy and responsive rules.
- Rationale: Centralized variables minimize visual drift and keep the theme reversible without changing component structure.
- Alternatives considered:
  - Add a user theme switch: rejected because only the visual direction changed, not a user preference requirement.

## Decision 4: Reset only filters at bootstrap

- Decision: On full page initialization, ignore and remove the existing filter query parameters, apply the current two-month default plus empty query, and leave feed selection, local overrides, snapshots, branding, and unrelated URL parameters intact. During the current session, filter application continues to update the URL.
- Rationale: This directly implements reload reset without breaking in-session sharing/navigation or persisted feed behavior.
- Alternatives considered:
  - Clear all browser storage: rejected because it would destroy feed overrides and offline snapshots.
  - Disable URL updates entirely: rejected because in-session filter behavior already depends on URL state.

## Decision 5: Preserve accessibility and performance budgets

- Decision: Past cards remain native disclosures with a German `Vergangen` state label; logo loading is event-driven and failure-safe; existing 5,000-occurrence and layout tests remain mandatory.
- Rationale: Visual muting must not become an inaccessible disabled control, and optional imagery must not block calendar content.

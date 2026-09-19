<!--
Sync Impact Report:
- Version change: unratified scaffold -> 1.0.0
- Modified principles: PRINCIPLE_1_NAME through PRINCIPLE_5_NAME replaced by nine
  project principles supplied by the user.
- Added sections: Engineering Constraints; Development Workflow.
- Removed sections: none.
- Follow-up TODOs: record the original adoption date in RATIFICATION_DATE.
-->

# justcalendar Constitution

## Core Principles

### I. Optimize for Deletion, Not Extension

Components MUST be small enough for one engineer to delete and rewrite in one
day. Teams MUST reject speculative abstractions, including HOCs, render-prop
towers, and generic wrapper layers. Code MUST remain inline until duplication
creates a concrete maintenance problem; fewer than three occurrences SHOULD be
duplicated rather than abstracted prematurely. This keeps replacement cheaper
than preserving accidental design.

### II. Make Dependencies Explicit

Components MUST declare every prop they read. Hooks MUST declare their
dependencies. Modules MUST NOT rely on hidden module-level state, implicit
context providers, or import-time side effects. Dependencies MUST be visible at
the point where behavior is used so code can be tested and removed safely.

### III. Treat the Network as the Boundary

Every fetch MUST have a versioned request and response schema. Responses MUST
be validated at the network boundary before components consume them. The
server MUST be treated as an untrusted producer; raw server strings MUST NOT
be rendered without validation and appropriate presentation handling. This
contains external change and prevents invalid data from spreading through the
UI.

### IV. Render What Can Be Proven

Loading states MUST have a timeout. Error states MUST provide a retry path.
Empty states MUST include deliberate explanatory copy. Components that can
render no data for any reason MUST render an intentional nothing state rather
than a blank frame. Visible UI MUST correspond to a known state of the data
contract.

### V. Accessibility Is a Correctness Property

Every interactive element MUST be keyboard reachable, follow a logical focus
order, expose an appropriate accessible name and role, and meet color-contrast
requirements. New code MUST NOT use a clickable div in place of a semantic
interactive element. Accessibility failures are correctness failures and MUST
block release of the affected behavior.

### VI. Measure What Users Feel

Core Web Vitals, including LCP, INP, and CLS, MUST be treated as latency and
stability budgets. Regressions MUST be handled like test failures. Bundle size
MUST be tracked per route. A dependency that exceeds the remaining route
budget MUST have written justification before adoption. This ties technical
cost to user-visible impact.

### VII. Keep State at the Edge Where It Is Needed

URL state MUST remain in the URL. Server state MUST remain server state and be
cached rather than copied into a client store. Form state MUST remain local.
Global client state is a last resort; each new global entry MUST document why
URL, server, and local state cannot hold it. State placement MUST minimize
coupling and synchronization paths.

### VIII. Make Commands Discoverable and CI-Consistent

Development, build, test, lint, typecheck, and end-to-end actions MUST each be
available through one named command listed in one discoverable location. CI
MUST run the same commands developers run locally. A new contributor MUST be
able to find the complete command list within 30 seconds.

### IX. Realize Value at the User

A change MUST NOT be considered shipped at merge. It MUST be deployed, made
observable through error tracking and web-vitals reporting where applicable,
and remain revertible through a feature flag or redeploy. Release readiness is
measured by user access, observability, and reversibility rather than by merge
status alone.

## Engineering Constraints

These principles apply to all application code and user-facing routes. New
dependencies, global state, abstractions, network contracts, and performance
costs MUST be justified at the boundary where they are introduced. Security,
input validation, error handling, keyboard access, and explicit empty or error
states MUST NOT be removed for expedience.

## Development Workflow

Each change MUST identify its affected state boundaries, network contracts,
accessibility behavior, performance budget, and rollback path. Reviews MUST
check those concerns before merge. Before release, the named local commands
MUST pass, user-visible telemetry MUST be available for the affected behavior,
and the deployed change MUST have a practical rollback path.

## Governance

This constitution supersedes conflicting project practices. An amendment MUST
be proposed with its rationale, a Sync Impact Report, updated dates, and a
compliance impact assessment. The amendment MUST be reviewed before it is
adopted, and any required migration or follow-up MUST be recorded explicitly.

Constitution versions follow Semantic Versioning. A MAJOR version is required
for a backward-incompatible removal or redefinition of a principle. A MINOR
version is required for a new principle or materially expanded governance
section. A PATCH version is required for clarification, wording, or typo fixes
that do not change obligations.

Compliance MUST be checked during design, code review, and release validation.
Any exception MUST name the violated rule, the reason, the owner, the expiry
or review date, and the compensating control. Unresolved violations block
release. The constitution MUST be reviewed whenever a principle changes and
at least once per major release.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): record original adoption date in YYYY-MM-DD | **Last Amended**: 2026-09-19

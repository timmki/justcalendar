# Implementation Plan: Prevent Automated Crawling

**Branch**: `007-prevent-automated-crawling` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-prevent-automated-crawling/spec.md`

## Summary

Add one shared crawler-exclusion policy at the Node server response boundary, serve a static `robots.txt` policy, add a robots metadata directive to the HTML shell, and document the advisory limitation. Every response the application controls receives `X-Robots-Tag: noindex, nofollow, noarchive`, while same-origin API behavior remains unchanged.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js >=22

**Primary Dependencies**: Node `http` server, Vite-generated HTML, Vitest, Playwright

**Storage**: None

**Testing**: Existing server contract tests, browser tests, lint, typecheck, build, and full e2e suite

**Target Platform**: Browser application served by the existing Node server and Docker image

**Project Type**: Single-project web application with static frontend and Node server

**Performance Goals**: Policy headers added without extra network calls or measurable application startup work

**Constraints**: Use wildcard robots semantics rather than a brittle bot-name list; do not block same-origin browser API requests; preserve existing content types and error responses

**Scale/Scope**: All application-controlled response paths: static success, fallback HTML, API success/error, and controlled static errors

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Principle III: PASS — the policy is an explicit response contract at the server boundary; no unvalidated external data is introduced.
- Principle IV: PASS — policy resources and error responses remain deliberate and testable.
- Principle V: PASS — robots metadata does not alter interactive semantics.
- Principle VIII: PASS — existing named validation commands remain unchanged.
- Principle IX: PASS with documented boundary — advisory directives are not presented as hard enforcement; deployment operators may add ingress/WAF controls.
- Engineering constraints: PASS — no dependency, state, or network request is added.

## Project Structure

### Documentation (this feature)

```text
specs/007-prevent-automated-crawling/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/server.md
└── tasks.md
```

### Source Code (repository root)

```text
server/server.ts                    # response policy and robots.txt route
index.html                          # HTML robots metadata
public/robots.txt                   # packaged canonical robots policy
README.md                           # advisory limitation and deployment guidance
tests/integration/server-contract.test.ts
 tests/e2e/accessibility.spec.ts   # browser-visible metadata/policy smoke coverage
```

**Structure Decision**: Keep the policy at the existing HTTP server boundary and package `public/robots.txt` with the application. Do not add middleware or a bot-name registry for this narrowly scoped policy feature.

## Complexity Tracking

No constitution violations.

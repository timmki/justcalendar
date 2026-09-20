# Tasks: Prevent Automated Crawling

**Input**: Design documents from `/specs/007-prevent-automated-crawling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server.md, quickstart.md

**Tests**: Required by the specification for response classes, packaging, metadata, and preserved API behavior.

## Phase 1: Setup

- [X] T001 Confirm the active feature metadata and existing server/static/build/test entry points in `specs/007-prevent-automated-crawling/plan.md`, `server/server.ts`, `index.html`, `public/`, `Dockerfile`, and `package.json`.

## Phase 2: Foundational

- [X] T002 [P] Add server contract tests in `tests/integration/server-contract.test.ts` for `/robots.txt`, wildcard disallow content, query-string handling, and the no-index header on static, fallback, API success, and API error responses.
- [X] T003 [P] Add browser coverage in `tests/e2e/accessibility.spec.ts` for the HTML robots metadata while preserving normal page and calendar behavior.
- [X] T004 [P] Add a build/package assertion in `tests/unit/container-contract.test.ts` or the closest existing release contract test proving the robots policy is included in the packaged public assets.

---

## Phase 3: User Story 1 - Publish Crawl Exclusion Policies (Priority: P1) MVP

**Goal**: Publish a wildcard robots policy and defense-in-depth no-index directives on every application-controlled response.

**Independent Test**: Request the canonical robots file, HTML, static asset, fallback route, and API response/error and verify policy headers/content.

### Tests for User Story 1

- [X] T005 [US1] Extend `tests/integration/server-contract.test.ts` with failing-first assertions for `X-Robots-Tag: noindex, nofollow, noarchive` on successful static/fallback responses and the exact `robots.txt` content type/body.
- [X] T006 [US1] Extend `tests/integration/server-contract.test.ts` with failing-first assertions that API success, API problem, controlled 404/403, and `/robots.txt?query=1` retain the policy header.

### Implementation for User Story 1

- [X] T007 [US1] Add `public/robots.txt` containing the wildcard `User-agent: *` and `Disallow: /` policy.
- [X] T008 [US1] Add `<meta name="robots" content="noindex, nofollow, noarchive">` to `index.html` and ensure the built HTML retains it.
- [X] T009 [US1] Apply a shared `X-Robots-Tag` response header in `server/server.ts` before route handling, preserve existing route-specific headers, and serve `/robots.txt` as plain text without changing API behavior.

**Checkpoint**: Compliant crawlers receive a complete wildcard exclusion policy from both robots.txt and application responses; normal browser requests still work.

---

## Phase 4: User Story 2 - Keep Exclusion Policy Consistent in Deployment (Priority: P1)

**Goal**: Preserve the policy in built/containerized output and clearly document its advisory enforcement boundary.

**Independent Test**: Build and serve the production output, inspect robots.txt, HTML metadata, response headers, fallback behavior, and deployment documentation.

### Tests for User Story 2

- [X] T010 [US2] Add or extend `tests/unit/container-contract.test.ts` to assert `public/robots.txt` and the HTML robots metadata are included in the production packaging contract.
- [X] T011 [US2] Extend `tests/e2e/accessibility.spec.ts` with a browser smoke check that normal calendar retrieval and page interaction remain functional while metadata is present.

### Implementation for User Story 2

- [X] T012 [US2] Update `README.md` with the standards-based crawler exclusion policy, its advisory limitation, and the reverse-proxy/WAF boundary for hard blocking.
- [X] T013 [US2] Update `specs/007-prevent-automated-crawling/quickstart.md` if final response paths, commands, or packaging behavior differ from implementation.

**Checkpoint**: Local and Docker production artifacts expose the same policy, and operators understand what it does and does not enforce.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] Run the repository's documented validation commands and resolve any regressions in affected source/test files.
- [X] T015 Run `git diff --check` and inspect `git status` for unintended files before convergence.

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no dependency.
- Phase 2 depends on Phase 1 and blocks implementation.
- Phase 3 depends on Phase 2.
- Phase 4 depends on Phase 3 because packaging and documentation must describe final behavior.
- Phase 5 depends on all previous phases.

### Parallel Opportunities

- T002, T003, and T004 can run in parallel because they target separate test files.
- T007 and T008 can run in parallel; T009 depends on the policy contract but can be developed alongside them.

### Implementation Strategy

1. Add failing server/browser/package coverage.
2. Implement the shared response header, robots file, and HTML metadata.
3. Verify packaging, documentation, and preserved browser/API behavior.
4. Run the full validation suite and converge.

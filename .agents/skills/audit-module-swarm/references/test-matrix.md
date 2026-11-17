# Module Test Matrix

The audit is not complete merely because existing tests pass. For every discovered endpoint, public method, state transition, authorization boundary and important UI flow, create a test inventory with four states: `EXISTING_STRONG`, `EXISTING_WEAK`, `MISSING`, `NOT_APPLICABLE`.

## Per-endpoint API matrix

For each endpoint/route/action, derive expected behavior from implementation and contract. Consider:

- Valid authenticated request.
- Missing authentication.
- Invalid, expired, revoked or malformed token.
- Authenticated but insufficient role/permission.
- Cross-user/cross-tenant resource identifier.
- Missing, malformed, unknown and wrong-type fields.
- Boundary values, empty/null strings, oversized payloads.
- Duplicate requests and idempotency.
- Resource not found and already-deleted state.
- Rate limit and request-size behavior.
- Database unavailable, unique constraint, transaction rollback.
- Downstream timeout, malformed response and retry behavior.
- Error response does not disclose secrets/internal stack traces.

Do not assume all endpoints should return identical status codes. Use the established API contract and record ambiguity rather than inventing expected behavior.

## Backend service and database

- Happy-path behavior for each public service method.
- Branch/condition coverage for nontrivial business rules.
- DTO/schema validation and transformation.
- Authorization at service/data-access boundary, not only UI/controller.
- Prisma relation correctness, uniqueness and indexes.
- ZenStack policy coverage and enhanced-client usage where applicable.
- Transaction atomicity and rollback.
- Concurrent updates, race/TOCTOU, duplicate jobs and idempotency.
- Query bounds, pagination, N+1 and query-plan evidence for expensive paths.
- Connection pool behavior, PgBouncer mode, timeout/retry semantics.
- Redis key isolation, TTL and invalidation.
- BullMQ retries, deduplication, backoff and dead-letter handling.

## Frontend and browser

- Component render and required props.
- Form validation parity with backend.
- Loading, empty, error, offline and retry states.
- Duplicate submission and pending-state protection.
- Invalid/partial API response handling.
- Auth/session expiry and permission changes.
- XSS/unsafe HTML and sensitive data exposure.
- Keyboard navigation, semantic labels and focus handling.
- Responsive behavior for relevant breakpoints.
- Browser console/page errors and failed network calls.

Use React Testing Library/Vitest/Jest for component behavior where the project uses them; use Playwright Test for deterministic browser journeys. `playwright-cli` is for exploratory/interactive QA and does not replace the test runner.

## Domain-specific conditional matrices

### Payments and subscriptions

- Duplicate webhook delivery.
- Invalid webhook signature.
- Out-of-order webhook events.
- Payment success but enrollment/order write failure.
- Refund/chargeback/failed payment state transitions.
- Reconciliation and idempotent retries.
- Amount/currency/ownership consistency.

### File upload and object storage

- Content-type spoofing, extension mismatch, oversized file.
- Path traversal and object-key ownership.
- Presigned URL scope, expiry and method restrictions.
- Unauthorized direct object access.
- Partial upload and cleanup failure.

### Video/HLS/FFmpeg

- Manifest authorization and segment authorization separately.
- Encryption-key authorization and leakage.
- Cross-user/course segment access.
- Malformed media metadata and path handling.
- FFmpeg argument injection, resource exhaustion and process cleanup.
- Resume, seeking, expiry and CDN/cache behavior.

### AI/LangGraph/tool calling

- Schema validation at every tool boundary.
- Unauthorized tools and privilege crossing.
- Prompt injection through user-controlled documents/data.
- Invalid or partial agent state.
- Retry, loop limit and timeout behavior.
- Secret leakage in traces/logs/output.
- Untrusted tool output handling.

## Coverage and test effectiveness

- Collect line, branch, function and statement coverage for the target module if the project's runner supports it.
- Report exact include/exclude patterns and coverage provider.
- Coverage percentage is not proof of test quality.
- Use StrykerJS only for critical/high-risk logic and only in a disposable worktree or isolated copy.
- Use fast-check for property/invariant-heavy logic where appropriate.
- Use Schemathesis only against an isolated API target with test credentials and disposable data.
- Avoid unbounded load/stress tests in the default profile.

## Generated test cases without source changes

Default behavior: do not edit application files or the user's existing tests.

For a high-risk missing test, the auditor may propose an executable test scenario. It may generate a temporary test harness only inside a disposable worktree or disposable repository copy, with explicit isolation. If that is unavailable, report `PROPOSED_NOT_EXECUTED`; do not say the generated test passed.

Never add temporary test files to the user's existing test directories. Never run mutating generated tests against production/shared DB, Redis, buckets, queues or third-party APIs.

## Final classification

Use mutually exclusive primary finding categories:

- `IMPLEMENTATION_DEFECT`
- `SECURITY_VULNERABILITY`
- `MISSING_TEST`
- `TEST_QUALITY_DEFECT`
- `PERFORMANCE_RELIABILITY`
- `INTEGRATION_DEFECT`
- `CONFIGURATION_DEPLOYMENT`
- `GIT_HYGIENE`
- `OTHER`

A missing test is a coverage gap, not automatically a production-code defect. If a test exposes a real implementation defect, create a linked implementation/security finding and a separate missing-test finding only if the coverage gap is independently meaningful. Count unique findings once in the overall primary total and show linked relationships separately.

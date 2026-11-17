---
name: audit-integration
description: Test whether all backend and frontend modules work correctly together. Audits cross-module contracts, authorization, transactions, caches, queues, webhooks, UI journeys, integration tests and E2E workflows. Use after module audits or to find defects between modules.
---

# Cross-Module Integration Audit

This command tests **the seams between modules**, not another copy of every individual module audit. Use native Antigravity `/swarm` for broad independent investigation when available. Otherwise use supported subagents/workflow delegation and record the actual mode.

## Guardrails

- Never edit application source, existing tests, migrations, schemas, environment files or deployment configuration.
- Never connect to production or remote VPS.
- Integration/E2E tests require positively verified isolated databases, Redis namespace, queue names, bucket and mocked/sandbox providers.
- No destructive resets, broad Docker cleanup, process killing or live payment/email/SMS/call operations.
- Local test/build/browser work uses the shared conservative local process budget; read-only analysis may fan out.

## Phase 0 — Discover architecture and prior module evidence

1. Record repository identity, branch, commit and dirty status.
2. Discover all backend/frontend modules and shared packages. Use Graphify if fresh; verify through imports, route registration, schemas, events, queues and actual callers.
3. Build a cross-module dependency matrix.
4. Perform a blind-first current-code review before using previous QA findings. Do not read previous integration or module `latest.json` files until the fresh review/hunting waves finish.

## Phase 1 — Native swarm tracks

Use independent cross-cutting workers, not a repeated per-module swarm:

1. **API and contract compatibility:** frontend/backend DTO drift, OpenAPI/client generation, shared types, status/error format, pagination and version compatibility. Invoke installed Sentry/contract skills if present.
2. **Authentication and authorization boundaries:** role transitions, tenant/object ownership, shared guards, global pipes, service-level checks, cache-stored authorization and cross-module privilege escalation. Invoke Ponytail Sec, Sentry security-review, Cloudflare, Semgrep and Trail of Bits validation skills as applicable.
3. **Database and distributed state:** transaction boundaries, partial commits, uniqueness, concurrent updates, cache invalidation, Redis TTL, PgBouncer pooling, queue retries and idempotency. Invoke Supabase Postgres/NestJS/Prisma skills when applicable.
4. **External workflows:** payment/webhook ordering and signatures, file storage, presigned URL ownership, media/HLS segment/key authorization, FFmpeg jobs and AI/LangGraph tool boundaries when present.
5. **Frontend-to-backend journeys:** authentication, forms, route guards, loading/error states, retries, stale state and real browser network behavior. Use installed frontend/Playwright skills.
6. **Independent verifier:** challenge serious cross-boundary findings and deduplicate evidence.

Each worker must invoke original specialist skills through the skill resolver. The coordinator records native swarm availability/mode, every worker and every skill execution.

## Phase 2 — Build integration scenario matrix

Discover actual user journeys and system boundaries. Candidate flows when present:

- Signup → login → role/tenant assignment → profile.
- Browse → purchase → webhook → enrollment → access.
- Upload → storage → processing job → metadata update → retrieval.
- Course authorization → HLS manifest → segment → key → progress.
- Admin permission change → cache invalidation → next API request.
- Queue producer → worker → DB transaction → retry/DLQ.
- AI request → validated state → permitted tool → validated output → persistence.

For each flow, identify success, unauthorized, malformed input, timeout, retry, duplicate event, partial failure and recovery behavior.

## Phase 3 — Sequential local integration verification

1. Validate schemas/migrations without applying migrations to shared/prod DB.
2. Run workspace lint/typecheck/build once, not once per worker.
3. Run isolated integration suites one at a time.
4. Run Playwright Test with one browser worker/session by default.
5. Run Schemathesis only against an isolated target and with explicit disposable data.
6. Use contract tests (for example Pact) only if the repo has/needs consumer/provider contracts.
7. Capture all command receipts, versions, exit codes and failures.

## Phase 4 — Correlate module audit results

After blind-first integration work:

- Read current module reports.
- Verify every expected module has a report for the same repository/branch/commit or explain why not.
- Identify stale/missing module reports.
- Carry unresolved Critical/High module defects into the integration release backlog.
- Link cross-module findings to source module finding IDs when relevant.
- Do not close module findings merely because end-to-end tests passed.

## Phase 5 — Findings and release verdict

Separate implementation/integration defects, security vulnerabilities, missing tests, test-quality defects and configuration/reliability issues. Count unique findings once. A missing test and a bug discovered by that test are related records, not two counts of the same implementation defect.

The final verdict cannot be PASS if mandatory integration checks were skipped, test isolation was unverified, any module is missing from scope, or a verified blocking defect remains.

Render the consolidated result into the shared monochrome dashboard and an integration detail report. State explicitly what was not tested.

### Canonical integration run shape

Return `run.kind = integration`, a `modules` array containing one synthetic result named `Cross-module integration` (with the integration scope, test matrix and all required integration check receipts), and put cross-boundary defects in `crossModuleFindings`. This synthetic result is an integration gate, not a replacement for individual module audit results. When a prior dashboard for the same repository/branch exists, the renderer preserves its module reports and appends/updates this integration result. If no prior module reports exist, report that module-level evidence is unavailable; do not imply all modules were individually audited.

---
name: audit-backend-swarm
description: Run a baseline audit of an untested backend using Antigravity's native swarm: one primary worker per discovered backend module, nested specialist skill workers per module, plus once-only repository-wide Git, supply-chain and architecture checks. Use as /audit-backend-swarm.
---

# Full Backend Baseline Swarm

Use this when the backend is untested, inherited, newly assembled or needs a broad first-pass QA baseline. This is different from `/audit-integration`: this command audits every module independently and performs a limited once-only cross-cutting inventory.

## Native swarm requirement

Use Antigravity's built-in `/swarm` coordinator when available. Do not replace it with a hand-written Python parallel runner or a fixed custom-agent pool. If native swarm is unavailable in the active surface, report `NATIVE_SWARM_UNAVAILABLE`; use documented subagents/workflows only if exposed, and clearly label the execution mode.

## Phase 0 — Discover all backend modules

1. Identify repository/backend roots from manifests, workspace files, source layout, framework module registration and route composition.
2. Use Graphify if installed/fresh, then verify the result through imports, module registrations, routes, ORM relations, queues and package ownership.
3. Create a complete inventory with module name, source roots, owned files, shared dependencies, related tests, framework and module entry points.
4. Exclude generated/vendor/build directories with reasons; do not silently omit modules.
5. Record repo identity, branch, commit, dirty status and scope manifest.

## Phase 1 — Native swarm: one primary worker per module

Create one primary swarm worker for every discovered backend module. Example names: `module-users-lead`, `module-auth-lead`, `module-payments-lead`. Do not cap remote reasoning workers to three; the user's environment supports substantial read-heavy agent concurrency. Allow each primary worker to create its own nested specialist workers.

Each module lead must activate the existing `audit-module` skill for its exact module. If nested skill invocation is not supported by the active host, read `.agents/skills/audit-module/SKILL.md` and follow it fully. This includes explicit discovery and invocation of applicable installed specialist skills. Do not let the backend swarm replace the module orchestrator or specialist skills with generic checklists.

Module leads must:

- Own only their module and listed shared dependencies.
- Avoid broad whole-repo scans; repository-wide checks are handled once by designated workers.
- Return one canonical module JSON result.
- Record all worker/skill/scanner/test receipts.
- Never edit application code, existing tests, migrations or configuration.

## Phase 2 — Once-only repository-wide workers

In parallel with module code reading, assign separate read-heavy tracks for:

1. **Git hygiene:** uncommitted/staged/untracked files, `git diff --check`, merge markers, accidentally tracked env/secrets/dumps/build artifacts, suspicious lockfile changes and Git history secrets. Use installed Gitleaks and differential-review skills when available.
2. **Supply chain:** root/workspace manifests and lockfiles, direct/transitive dependency advisories, abandoned/upstream risk, install scripts, provenance and CI workflow permissions. Use installed Trail of Bits/Sentry skills, Gitleaks, Trivy and OSV-Scanner as available. Do not repeat a full dependency scan per module.
3. **Architecture/contracts:** cross-module imports, circular dependencies, shared DTO/type contracts, global guards/validation/CORS/throttling, DB boundaries, queue/event producers and consumers, cache keys and external integration edges. This is an inventory only; full workflow execution belongs to `/audit-integration`.

## Phase 3 — Shared local execution queue

Remote agent reasoning and source reading may remain parallel. Local resource-intensive commands share one conservative budget across all module workers:

- One heavy build/typecheck/test runner by default.
- One browser session.
- One Docker build/rehearsal.
- One mutation-testing process.

Do not let every module agent start its own local test runner simultaneously. Module leads submit scoped jobs to the coordinator, which queues them. Prefer one scoped test runner at a time and avoid duplicate full-workspace commands.

Before integration/E2E tests, inspect setup hooks and verify disposable PostgreSQL, Redis, queue, bucket and mocked external-provider targets. `.env.test` existence alone is insufficient.

## Phase 4 — Aggregate and reconcile

1. Wait for every discovered module worker or record its timeout/failure.
2. Verify no discovered module lacks a report.
3. Deduplicate with evidence-aware fingerprints; preserve distinct issues in different functions/endpoints.
4. Keep primary classifications mutually exclusive: implementation/security/integration defect, missing test, test-quality defect, performance/reliability, config/deploy or Git hygiene.
5. Distinguish a missing test from an actual implementation bug. Link a test-discovered bug to the test case without double-counting the same underlying defect.
6. Re-verify Critical/High findings with fresh independent review and the original triage/false-positive skills.
7. Do not call a finding fixed because a module worker omitted it or a scanner was skipped.
8. Calculate backend verdict conservatively from module completeness, required check receipts and open findings.

## Phase 5 — Dashboard

Produce:

- `reports/qa/index.html` — monochrome module table, summaries, expandable findings, completion status and links.
- `reports/qa/dashboard.json` — source of truth.
- `reports/qa/module/<slug>/latest.json` and `latest.html` for every module.
- `reports/qa/backend-swarm/latest.json` and `latest.html` for the consolidated run.

The index must show module counts for implementation/security defects, missing tests, test-quality defects and open/fixed status. Include skill execution coverage, scanner availability, modules not audited, agent failures and skipped tests.

## Not included

This command does not replace the dedicated `/audit-integration` cross-module journey tests or `/audit-deploy` deployment rehearsal. It inventories cross-cutting risks and points to those follow-up gates.

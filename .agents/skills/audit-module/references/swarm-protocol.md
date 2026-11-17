# Native Swarm Protocol

## Non-negotiable behavior

- Do not replace, rename, shadow or imitate Antigravity's built-in `/swarm` command.
- A swarm wrapper supplies a task plan and worker topology to the **native** swarm coordinator.
- Use native swarm when the active Antigravity surface exposes it.
- Current official documentation describes `/swarm` on Antigravity App and Antigravity CLI. Standalone IDE skill discovery is documented separately. If native swarm is unavailable in the current surface, state `NATIVE_SWARM_UNAVAILABLE`; only use supported subagent or workflow fallback if actually available.
- Never claim a native swarm ran if it did not.

## Resource model

Do not impose a global cap on remote reasoning or read-only code investigation. Let the native swarm manage the worker hierarchy and its idle-worker behavior.

Do enforce a separate **local process budget** shared by all workers:

- Default heavy local process slots: 1.
- Browser slots: 1.
- Docker build/rehearsal slots: 1.
- Mutation testing: serialized, critical paths only.
- DB integration/E2E runner: serialized per isolated database/namespace.
- Static scanners may run in parallel only after measuring local resource usage and confirming they do not contend for the same outputs/cache/database.

Remote code reading, independent reasoning, and skill review can proceed concurrently. Local commands are requested through the coordinating module lead and admitted through the shared local budget. A worker must not independently launch heavy commands outside that budget.

## `/audit-module-swarm <module>` topology

1. Parent coordinator validates exactly one module and captures repository identity, branch, commit and dirty status.
2. Start native `/swarm` mode in the active host, with **one primary worker** named `module-<slug>-lead`.
3. The primary worker runs the same scope and skill-resolution protocol as `/audit-module`.
4. The primary worker may create nested subagents for independent tracks, for example:
   - `module-<slug>-security`: original installed security skills.
   - `module-<slug>-quality`: Ponytail/Sentry code quality skills.
   - `module-<slug>-backend`: framework/database skills.
   - `module-<slug>-tests`: test inventory/matrix/runner analysis.
   - Add frontend or infrastructure child only when the module actually touches those areas.
5. The primary worker owns its module findings, runs required local commands through the shared process budget, and writes one canonical module JSON result.
6. Parent coordinator validates the module result, invokes independent verification for serious findings, then updates the dashboard.

Do not fan out every child role for every module if the relevant files/technology do not exist. Nested agents must invoke actual installed specialist skills and record receipts.

## `/audit-backend-swarm` topology

1. Discover backend modules and shared packages before creating module workers.
2. Create one primary worker for each discovered backend module. This is a whole-backend baseline audit; do not arbitrarily cap module workers if native swarm and host capacity permit.
3. Each module worker owns exactly one module and may create its own nested specialists.
4. Create separate one-time workers for repository-wide Git hygiene, dependency/supply-chain exposure and cross-module architecture. Repository-wide scans must not be duplicated by every module worker.
5. Module workers do not edit application code or existing tests.
6. Coordinator waits for every worker or records timeout/failure. It must never silently omit a module.
7. Merge all module JSON findings, preserve source module/agent/skill provenance, deduplicate only with stable evidence-aware fingerprints, and generate one index plus standalone module reports.
8. Report modules not discovered, partially audited or missing results explicitly.

## `/audit-integration` topology

Use native swarm for cross-cutting independent investigation tracks, not one duplicate module audit per module:

- API/schema/DTO contract compatibility.
- Authentication, authorization and tenant boundaries across modules.
- Database transactions, cache coherence, queues and asynchronous events.
- Payments, webhooks, storage and media workflows where present.
- Frontend-to-backend end-to-end journeys.
- Repository-wide build, test and dependency coordination.

The integration coordinator runs expensive local suites serially using the shared local budget. It consumes prior module reports only after its blind-first scan has completed.

## Shared message-board protocol

Each worker publishes:

- Assigned scope and excluded files.
- Skills loaded/invoked and exact invocation modes.
- Commands/scanners executed, exit codes and versions.
- Findings in the canonical schema.
- Missing test cases and tests actually executed.
- Blockers, assumptions, conflicts and incomplete work.

The parent coordinator challenges contradictions and checks for missing worker output before creating a final report.

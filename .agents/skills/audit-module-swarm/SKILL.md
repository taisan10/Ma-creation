---
name: audit-module-swarm
description: Wrapper for Antigravity's native swarm to deeply audit one named module. Creates one module-lead swarm worker that can create its own nested specialists, each invoking the original installed QA/security/testing skills. Use as /audit-module-swarm <module>.
---

# Audit One Module with Native Swarm

This is a **wrapper around Antigravity's native swarm**, not a custom swarm engine and not a replacement for `audit-module` or installed specialist skills.

## Invocation

`/audit-module-swarm <module> [--profile standard|deep|security]`

## Critical behavior

1. Resolve the active Antigravity surface and check whether native `/swarm` is available.
2. If available, use the built-in native swarm coordinator for this task. Do not merely write a plan describing agents; actually delegate the task through the native swarm mechanism.
3. If native swarm is unavailable, state `NATIVE_SWARM_UNAVAILABLE`. Use ordinary subagents only if the host exposes them and the user has allowed fallback. Do not claim native swarm ran.
4. Create exactly one primary worker for the named module: `module-<slug>-lead`.
5. That module lead owns the module audit and may create nested specialists for security, quality, backend/framework, frontend and tests as relevant. Child agents are scoped to the same module manifest and do not start additional whole-repository audits.
6. Each child must resolve/load/invoke the actual installed specialist skill(s) from the registry. Generic review prompts are not substitutes.
7. The module lead invokes and follows `/audit-module`'s workflow and produces exactly one canonical module result. The parent validates receipts and renders the report.

## Primary worker prompt contract

Assign the module lead this task:

> Audit only `<module>` using the `audit-module` skill and the shared skill registry. Discover the exact scope first. Create nested specialist workers for independent tracks only where relevant. Each specialist must read and invoke the original installed skill instructions; do not replace specialist skills with generic checklists. Remote/read-only reasoning may fan out according to native swarm capacity. All local scanners, builds, databases, browsers, Docker and mutation testing use the shared conservative local process budget. Do not change application source, existing tests, migrations or configuration. Verify isolation before side-effecting tests. Return canonical JSON with findings, test matrix, coverage and skill/scanner execution receipts.

## Nested worker routing

A module lead may create:

- Security specialist: Ponytail Sec variants, Sentry `security-review`, Cloudflare `security-audit`, Semgrep/Trail of Bits where installed.
- Code quality/bugs specialist: Ponytail scoped audit/review, Sentry `code-review`/`find-bugs`.
- Backend specialist: NestJS, PostgreSQL, Prisma/ZenStack, Redis/BullMQ guidance as applicable.
- Frontend specialist: Vercel React/web-design and existing UI skills only if module owns frontend files.
- Test specialist: existing tests, test matrix, coverage, Playwright/API/property/mutation testing as applicable.

Do not spawn roles that have no relevant files. Do not duplicate a repository-wide scanner in every child.

## Execution budget

Native swarm concurrency for remote reasoning/file reading is host-managed and is not globally capped by this skill. Local process work is a separate shared budget: default one heavy local runner, one browser, one Docker rehearsal and one mutation-testing job at a time across the whole task. Queue rather than kill unrelated processes.

## Output

Write one module run JSON and report using `audit-module`'s canonical report contract. Update the shared monochrome `reports/qa/index.html`. The report must prove native swarm availability/invocation, list every primary/nested worker, and record which original skills were actually invoked. If a worker/skill is missing or timed out, show it as incomplete.

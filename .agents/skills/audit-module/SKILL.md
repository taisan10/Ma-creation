---
name: audit-module
description: Run a focused, read-only QA, code-quality, testing, security and dependency audit for one named application module. Explicitly discovers and invokes already-installed specialist skills instead of replacing them with a generic QA checklist. Use after finishing or changing one module, for example /audit-module users.
---

# Audit One Module — Specialist-Skill Orchestrator

This skill is an **orchestrator, not a replacement QA methodology**. Its main responsibility is to discover and invoke the original specialist skills already installed in this Antigravity environment, coordinate real test/scanner execution, and consolidate evidence. Never suppress, silently skip, or imitate an available specialist skill.

## Invocation

`/audit-module <module> [--profile standard|deep|security]`

Default profile: `standard`.

- `standard`: scoped code/security review, required static scanners, existing module unit tests, isolated integration tests where safe, targeted coverage, missing-test matrix and report.
- `deep`: standard plus targeted browser/API flows, property-based tests and mutation testing for critical logic when supported and isolated.
- `security`: security skills and scanners, relevant auth/negative tests, dependency/secrets review. No active DAST unless explicitly enabled for a local isolated target.

If module is missing or ambiguous, list discovered backend/frontend modules and ask one focused question. Never interpret an unknown module as the whole repository.

## Hard boundaries

1. Never edit application source, existing test files, migrations, schemas, `.env*`, Docker/Caddy/CI configuration, lockfiles or other project configuration.
2. Write only QA artifacts beneath `reports/qa/` and temporary data in a run-specific scratch area. If an executable generated test is needed, use a disposable Git worktree or repository copy; never add tests to the user's source/test directories.
3. Never connect to production, a remote VPS, production databases, live payments, real email/SMS/calling providers or production storage.
4. Verify test isolation by inspecting runner setup/hooks and resolved connection targets. The existence of `.env.test` alone is not proof of isolation.
5. No destructive DB commands, migration resets, Docker volume deletion, process killing, `git reset`, `git clean`, commits or pushes.
6. Never print secret values. Redact tokens, passwords, connection strings, private URLs and credentials from reports/logs.
7. Do not declare a finding fixed merely because it disappeared. Historical resolution requires matching repo/branch/scope, relevant checks executed again and independent confirmation.

## Phase 0 — Resolve repository, module and execution profile

1. Record repository identity, root, branch, commit and dirty status. Do not alter Git state.
2. Discover workspaces/package manager/frameworks by inspecting lockfiles, workspace manifests, package manifests and test configuration. Do not assume `pnpm`, `backend`, `@lms/db`, NestJS, Prisma or any particular folder name.
3. Use Graphify if it is installed and its graph is fresh for the current commit. Otherwise use import/reference search and route/model/test discovery.
4. Map module-owned files and shared dependencies:
   - routes/controllers/handlers/actions;
   - services/use-cases/repositories;
   - DTOs, validators, schemas and serializers;
   - guards, policies, decorators, middleware and interceptors;
   - ORM/database models, migrations and policy files;
   - queues, events, webhooks, cache keys and external adapters;
   - matching frontend pages/components/hooks/API clients when applicable;
   - unit, component, integration and E2E tests.
5. Produce a scope manifest containing included files, shared dependencies, excluded files, reasons, source revision and any graph staleness. Do not silently expand to the whole repository.

## Phase 1 — Discover and invoke installed specialist skills (mandatory)

Read `references/skill-registry.md` and execute its mandatory resolver protocol.

- Inspect workspace/global/plugin skills and the actual local names/descriptions/paths.
- Resolve exact local names first. Respect the user's existing names and forks, including `ponytail-audit`, `ponytail-sec`, `ponytail-sec-audit`, `ponytail-sec-triage`, Cloudflare `security-audit`, Graphify, Impeccable, UI/UX Pro Max and Taste when installed.
- For each relevant skill, read its complete original `SKILL.md` and obey its mode, scope, write rules and invocation rules.
- If the active host supports invoking the skill's slash command from the current agent, invoke that original command. Otherwise load the exact skill file and follow its own procedure. Record the invocation mode.
- Do not create a home-grown replacement review when the original is present.
- If a skill is unavailable, record `NOT_AVAILABLE`; continue with other independent skills, but do not claim equivalent coverage.

### Routing for a backend module

Invoke each available and applicable specialist; do not stop after the first review:

1. **Code quality and bug review:** Ponytail's actual scoped audit/review skill; Sentry `code-review` and/or `find-bugs` where installed.
2. **Security:** the user's installed Ponytail Sec variants; Sentry `security-review`; Cloudflare `security-audit` following its guidance/full-audit mode; Semgrep `code-security` guidance plus Semgrep CLI if installed.
3. **Security validation:** Trail of Bits `fp-check`, `insecure-defaults`, `sharp-edges`, `variant-analysis` or other matching installed skill. Use Sentry `security-model` if trust boundaries are unclear; do not overwrite an existing security model.
4. **Stack-specific:** load NestJS, PostgreSQL, Prisma/ZenStack, React/Next.js or queue/cache guidance only when the scope actually uses it.
5. **Supply chain:** inspect module dependency ownership and relevant manifest/lockfile changes; do not run duplicate repo-wide dependency scans from every module.
6. **Frontend:** load Vercel React and web-design skills or the user's existing UI skills only when matching frontend files are included. Design polish is not a substitute for behavior/accessibility/browser testing.

The exact current official skills and sources are listed in `references/skill-registry.md`. The list is a discovery map; local installation state is authoritative.

## Phase 2 — Build the module test matrix

Use `references/test-matrix.md`.

For each endpoint, service method, state transition, permission boundary, DB interaction and relevant UI flow, classify tests as:

- `EXISTING_STRONG`
- `EXISTING_WEAK`
- `MISSING`
- `NOT_APPLICABLE`

Create separate inventories for:
1. Existing tests that adequately cover behavior.
2. Existing tests that are weak, vacuous, flaky or missing negative paths.
3. Missing test cases.
4. Bugs actually discovered by executed tests.

Do not confuse a test gap with an implementation defect. A missing test is a coverage gap. If a newly executed test reveals a production-code bug, create a linked implementation/security finding and retain the missing-test gap only when it is independently meaningful.

### Mandatory risk-based scenarios

Where relevant, inspect happy paths, malformed input, missing/expired auth, forbidden role, cross-user/cross-tenant access, boundary values, duplicate requests, invalid state transitions, DB constraints/rollback, downstream timeouts, retry/idempotency, concurrency/races, cache invalidation and error-data leakage.

### Execute tests honestly

1. Identify actual project scripts and test configs; never guess commands.
2. Run scoped unit tests that already exist.
3. Collect line/branch/function/statement coverage for the target module if supported; record the include/exclude pattern and provider.
4. Run integration tests only after inspecting setup hooks and proving DB/Redis/bucket/queue/provider isolation.
5. In `deep`, add targeted Playwright/API tests only when an isolated local app and test accounts exist. Use the project's Playwright Test runner for repeatable suites; use `playwright-cli` for exploratory browser QA.
6. In `deep`, use fast-check for invariant-heavy logic when a harness exists; use StrykerJS on critical logic only, in a disposable worktree/copy.
7. Schemathesis may target only a declared isolated API base URL with disposable data. It must not discover or probe remote/prod targets.
8. If generated tests cannot be safely run in a disposable copy/worktree, report them as `PROPOSED_NOT_EXECUTED`.

## Phase 3 — Deterministic scanners and local process budget

Use `references/resource-budget.md`.

- Run scoped Semgrep/SAST, lint, typecheck, unit and integration commands when installed and supported.
- Read the scanner's actual help/version before using uncertain flags.
- Capture command, version, scope, start/end time, exit code and status.
- A scanner skill being loaded does not mean the scanner ran.
- Remote reasoning and file reading can be highly parallel. Heavy local builds/tests/browser/Docker/mutation commands share one local process budget; default one heavy slot.
- Never launch a local runner independently from nested subagents. The module lead owns local execution scheduling.

## Phase 4 — Independent verification and finding normalization

1. Verify every Critical/High security candidate using a fresh independent verifier and the relevant original validation skill (for example Ponytail triage, Sentry security review, Cloudflare verifier phases or Trail of Bits `fp-check`).
2. Require concrete affected principal/resource, evidence, reachable path and impact for confirmed security vulnerabilities.
3. Deduplicate across tools/agents using an evidence-aware identity: category/rule + normalized path + function/symbol + evidence signature. Do not use line number alone and do not collapse distinct findings in one file.
4. Preserve source agent and source skill provenance.
5. Distinguish severity, confidence, verification, lifecycle and developer triage as separate fields.
6. Do not mark a previous finding resolved if scope/branch/repository changed or its relevant scanner/check was skipped/blocked.

## Phase 5 — Report

Use `references/report-contract.md` and the bundled renderer.

Write:
- `reports/qa/module/<module-slug>/latest.json`
- `reports/qa/module/<module-slug>/latest.html`
- immutable run JSON/HTML under `runs/`
- the shared `reports/qa/index.html` and `dashboard.json`

The main index must display module counts/status and expand details inline; standalone module reports are additional links, not the only way to inspect findings.

The module report must include scope/exclusions, skill execution receipts, scanner receipts, executed tests, coverage, missing-test matrix, code/security defects, test-quality defects, performance concerns, blockers and remediation suggestions.

## Final response

Summarize module verdict, high-priority findings, tests actually executed, test gaps, skills actually invoked/not available, and exact report path. State what was not tested. Never claim all possible bugs were found.

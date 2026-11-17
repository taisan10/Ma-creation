# Specialist Skill Registry

This is a **routing catalogue**, not a bundled replacement for the skills listed below. At run time, discover the user's actual installed skills and use their original `SKILL.md`. Public repository names and local skill aliases can differ.

## Mandatory resolver protocol

1. Discover workspace skills in `.agents/skills/` and legacy `.agent/skills/`.
2. Discover standalone IDE global skills in `~/.gemini/config/skills/` and legacy `~/.gemini/antigravity/skills/` when accessible.
3. Inspect enabled plugin skill manifests/paths using Antigravity Customizations. If `agy plugin list --json` is available, use it as an additional source; do not assume its JSON structure without inspecting it.
4. Match exact skill name first, then aliases and description. Read the actual `SKILL.md` before delegating.
5. If a skill exposes a native slash command in the active host, invoke that original command. Otherwise load and follow the exact skill instructions from its file path. Record the invocation mode honestly (`NATIVE_COMMAND`, `SKILL_FILE_LOADED`, or `NOT_INVOKED`).
6. Never create an internal imitation of an installed specialist skill and label it as that skill. Never report a skill as executed merely because its name was mentioned.
7. If two skills overlap, invoke both only when their methods add independent value. Do not repeatedly run whole-repository audits for every module.

## Existing user-installed skills — resolve first

| Preferred alias / known name | Route | Notes |
|---|---|---|
| `graphify` | Scope and dependency map | Use only if installed and graph is fresh; fall back to import/reference analysis |
| `ponytail-audit` | Code quality / audit | User may have a scoped fork. Inspect its actual instructions; public Ponytail currently documents `/ponytail-audit` as repository-wide |
| `ponytail-review` | Focused code review | Use target-aware mode only if local skill supports it |
| `ponytail-sec` | Security review | User-local alias; inspect the actual installed path/metadata and do not assume a public repository |
| `ponytail-sec-audit` | Deep security audit | User-local alias; inspect the actual installed path/metadata |
| `ponytail-sec-triage` | Triage and validate security findings | User-local alias; inspect the actual installed path/metadata |
| `security-audit` / Cloudflare | Multi-phase source-first security audit | Follow its guidance/full-audit mode rules exactly |
| `impeccable`, `ui-ux-pro-max`, `taste` | Frontend visual/UX review | Conditional; not substitutes for backend QA or browser behavior tests |

## Highest-priority external skill candidates

The following repositories were checked during preparation. Availability in the user's local Antigravity environment is **not** assumed.

| Skill name / family | Source | Best use |
|---|---|---|
| `security-audit` | https://github.com/cloudflare/security-audit-skill | Source-first security audit with phased hunting, candidate validation and structured findings |
| `security-review` | https://github.com/getsentry/skills | Security code review and vulnerability analysis |
| `code-review` | https://github.com/getsentry/skills | Engineering code review |
| `find-bugs` | https://github.com/getsentry/skills | Bug/security/code-quality review of local branch changes |
| `skill-scanner` | https://github.com/getsentry/skills | Review third-party agent skills for security issues |
| `security-model` | https://github.com/getsentry/skills | Trust boundaries, security invariants, reportable classes and exclusions |
| `gha-security-review` | https://github.com/getsentry/skills | GitHub Actions workflow security |
| `audit-context-building` | https://github.com/trailofbits/skills | Build source context before bug hunting |
| `differential-review` | https://github.com/trailofbits/skills | Security-focused diff and Git-history review |
| `fp-check` | https://github.com/trailofbits/skills | Independent false-positive verification |
| `insecure-defaults` | https://github.com/trailofbits/skills | Find fail-open defaults and insecure configurations |
| `sharp-edges` | https://github.com/trailofbits/skills | Dangerous APIs, configuration footguns and error-prone design |
| `static-analysis` | https://github.com/trailofbits/skills | CodeQL/Semgrep/SARIF workflow guidance |
| `supply-chain-risk-auditor` | https://github.com/trailofbits/skills | Dependency provenance, advisories, install scripts and upstream risk |
| `testing-handbook-skills` | https://github.com/trailofbits/skills | Fuzzing, sanitizers, static analysis and coverage guidance |
| `mutation-testing` | https://github.com/trailofbits/skills | Evaluate whether tests detect introduced faults |
| `property-based-testing` | https://github.com/trailofbits/skills | Hypothesis, fast-check, proptest and invariant testing |
| `regression-hunt` | https://github.com/trailofbits/skills | Discover and validate regressions across commits |
| `variant-analysis` | https://github.com/trailofbits/skills | Find related vulnerability variants across code |
| `code-security` | https://github.com/semgrep/skills | Secure coding and OWASP-oriented review guidance |
| `playwright-cli` | https://github.com/microsoft/playwright | Browser exploration, interaction testing and local UI QA |
| `supabase-postgres-best-practices` | https://github.com/supabase/agent-skills | PostgreSQL performance, indexes, locks, pooling, RLS/security |
| `vercel-react-best-practices` | https://github.com/vercel-labs/agent-skills | React/Next.js data fetching, bundle, rendering and runtime performance |
| `web-design-guidelines` | https://github.com/vercel-labs/agent-skills | Frontend accessibility and UX review |
| `nestjs-best-practices` | https://github.com/xirothedev/agent-skills | NestJS security, validation, architecture, database and testing guidance |

## Deterministic tools are not agent skills

The orchestrator must distinguish skill instructions from executable scanners/test runners. Discover and record both separately.

| Tool | Purpose | Typical audit stage |
|---|---|---|
| Semgrep CLI | SAST and taint/code patterns | Module / integration |
| Gitleaks | Working-tree and Git-history secret scan | Module / integration / deploy |
| Trivy | Filesystem, misconfiguration, dependency and image scanning | Integration / deploy |
| OSV-Scanner | Known dependency vulnerabilities from manifests/lockfiles/SBOMs | Module / integration |
| Vitest/Jest | Unit and integration test execution | Module / integration |
| Vitest coverage / Istanbul | Line, branch, function and statement coverage | Module / integration |
| Playwright Test | Repeatable browser E2E | Module deep / integration |
| `playwright-cli` | Exploratory browser interaction | Module deep / integration |
| StrykerJS | JavaScript/TypeScript mutation testing | Module deep, critical logic only |
| fast-check | TypeScript property-based testing | Module deep, invariant-heavy logic |
| Schemathesis | OpenAPI/GraphQL/gRPC schema-driven API testing | Module deep / integration, isolated target only |
| Pact | Consumer-driven contract testing | Integration where contracts exist |
| Hadolint | Dockerfile linting | Deploy |
| actionlint | GitHub Actions workflow lint/security hygiene | Integration / deploy |
| Syft + Grype | SBOM generation and vulnerability scanning | Deploy / supply chain, optional when Trivy is already comprehensive |
| OWASP ZAP | DAST/API scanning | Deploy, isolated authorized target only |
| Nuclei | Template-based targeted probes | Deploy, isolated authorized target only |
| `docker compose config` | Validate Compose model | Deploy |
| `caddy validate` | Validate Caddy configuration | Deploy |
| `ss -ltnp` | Inspect local listening sockets/port owners | Deploy |

Do not duplicate equivalent scanners without a reason. For example, Trivy plus OSV can provide complementary coverage, but run Syft/Grype only when SBOM/provenance needs justify the added scan.

## Routing policy by command

### `/audit-module`

- Code quality: installed Ponytail scoped skill + Sentry `code-review`/`find-bugs` when available.
- Security: installed Ponytail Sec variants + Sentry `security-review` + scoped Semgrep. Cloudflare skill must be used according to its own mode rules and only for useful scoped analysis.
- Stack: NestJS, PostgreSQL, Prisma/ZenStack, React/Next.js skill only when relevant files use them.
- Tests: existing Vitest/Jest/Playwright suites; coverage collection; deep profile adds fast-check, Schemathesis, StrykerJS only where the harness supports safe execution.
- Verification: Trail of Bits `fp-check` and/or Ponytail triage for high-impact candidates.

### `/audit-module-swarm`

Same skill/tool routing as `/audit-module`, but one primary module worker owns the scope and may create its own native nested specialists. Skill invocations remain explicit and receipted.

### `/audit-backend-swarm`

One primary worker per discovered backend module. Add one-time repository-wide workers for Git hygiene, dependency/supply chain and cross-module architecture. Do not run whole-repository security audits once per module. Aggregate one module dashboard plus backend summary.

### `/audit-integration`

Sentry/Trail of Bits/Cloudflare skills only where they provide cross-cutting value; Graphify/import graph, API contracts, DB/cache/queue/webhook interactions, full isolated test suites and Playwright journeys. Avoid repeating every module scanner if module reports at the same commit already prove it ran.

### `/audit-deploy`

Use deployment/security skills and deterministic tools for secrets, dependencies, Docker, Compose, Caddy, ports and image checks. Active DAST and local Compose rehearsal require explicit opt-in and a verified isolated target.

## External skill trust

Before adding a new third-party skill:

- Inspect its full `SKILL.md`, helper scripts, MCP configuration, hooks and declared permissions.
- Run an installed skill security scanner such as Sentry `skill-scanner` if available.
- Pin a tag or commit for repeatability where practical.
- Record source URL, revision, date checked and local installation path.
- Do not run installation scripts as part of an audit.

---
name: audit-deploy
description: Pre-deployment readiness audit for Git cleanliness, secrets, dependencies, Dockerfiles, Compose, ports, Caddy, images, health checks and optional isolated local deployment rehearsal. Never deploys or accesses a production VPS.
---

# Pre-Deployment Readiness Audit

This is the final local release gate before the developer deploys manually. It orchestrates existing specialist DevSecOps skills and real scanners; it is not a generic replacement for them.

## Hard restrictions

- Never SSH to, scan, deploy to or otherwise access a remote production VPS.
- Never run `docker compose down -v`, `docker system prune`, `docker volume rm`, database reset/drop commands, production migrations or deployment commands.
- Never print `.env` values, tokens, private keys, passwords or full connection strings.
- Never kill existing processes to free ports.
- Never start Compose against existing volumes/networks unless a unique isolated QA project has been proven.
- Docker build/rehearsal, browser and DAST jobs use the shared local process budget.
- Any local Compose rehearsal or active DAST requires explicit config enablement and positively verified isolated targets.

## Phase 0 — Discover environment and Git state

Record repo identity, branch, commit, dirty state and target deployment profile. Discover package manager, build scripts, Dockerfiles, `.dockerignore`, all Compose files/profiles, Caddy/Nginx config, env templates, migrations, CI workflows, image references, service ports and environment consumers.

Do not assume paths or service names. Use Graphify if fresh and verify with source/config search.

## Phase 1 — Invoke existing specialist skills

Resolve actual installed skills and read their original instructions. Invoke applicable skills such as:

- Ponytail review/audit for unexpected or risky changes.
- Cloudflare security-audit for repository security according to its mode.
- Sentry `gha-security-review`, `security-review`, `skill-scanner` as relevant.
- Trail of Bits `supply-chain-risk-auditor`, `agentic-actions-auditor`, `insecure-defaults`, `static-analysis`, `fp-check` when installed.
- Docker/container security skill if installed.

Do not claim a skill ran unless its procedure ran and a receipt exists.

## Phase 2 — Git cleanliness and supply chain

Read-only checks, as supported:

- `git status --short --branch`, staged/unstaged/untracked inventory.
- `git diff --check` and conflict-marker scan.
- Accidental `.env`, dumps, logs, keys, build artifacts and binaries.
- Gitleaks working-tree/directory scan and Git-history scan as separate receipts.
- Package-manager lockfile audit and OSV-Scanner/Trivy filesystem checks.
- New dependency provenance, install scripts, unpinned/unmaintained packages and license/policy concerns when configured.
- GitHub Actions permissions, untrusted expression interpolation and action pinning with Sentry skills/actionlint as available.

Do not automatically stage, stash, commit, checkout, reset, clean or rewrite Git history.

## Phase 3 — Docker, Compose, network and proxy static checks

Inspect:

- Multi-stage build, non-root runtime, base image pinning/provenance, `.dockerignore`, build secrets, unnecessary packages, capabilities, read-only filesystem and resource limits.
- Compose networks, `ports` vs `expose`, host bindings, health checks, startup dependencies, restart policy, log rotation, volumes, environment variable parity and secret handling.
- Caddy/Nginx TLS, redirects, HSTS, CSP, CORS, trusted proxy, upstreams, timeouts, body size, WebSockets and documentation/debug-route exposure.
- PostgreSQL, Redis and PgBouncer not unintentionally exposed publicly.
- HLS/media/worker ports and storage paths only when present.

Run config validation with actual installed versions, e.g. `docker compose config -q`, `caddy validate`, Hadolint, Trivy filesystem scan and Checkov only when applicable IaC exists.

## Phase 4 — Build and image scans

If Docker build is explicitly allowed and resources permit:

1. Discover the actual build target(s); do not assume image names.
2. Build locally without passing secrets in build args or printing build logs containing secrets.
3. Scan each resulting image with Trivy.
4. Record exact image digest/tag, scanner version, database timestamp, exit code and severity summary.

Do not report an image scan as executed when no image was built/found or the scanner failed.

## Phase 5 — Optional isolated local rehearsal

Only when `qa.config.json` explicitly enables `allowLocalComposeRehearsal`:

1. Verify target Compose file/profile, dedicated disposable DB, isolated Redis namespace/instance, queue names, test bucket, mocked providers and unique project name.
2. Use a unique Compose project and unique temporary resources. Do not reuse existing volumes or production-like shared infrastructure.
3. Start only the intended QA profile, validate health and service-to-service communication, check port bindings, `/health`, security headers, Caddy routes and docs/debug route restrictions.
4. Run an approved local smoke suite and optional DAST against the exact isolated local base URL.
5. Stop/remove only resources created by this QA run; never use `-v` or broad prune commands.
6. If isolation cannot be proven, mark rehearsal/DAST `BLOCKED`; continue static review.

## Phase 6 — Port and VPS boundary

Use host socket inspection such as `ss -ltnp` where available to distinguish configured ports from currently occupied ports. A Compose mapping alone does not prove public reachability. Do not claim external firewall exposure has been tested unless an explicitly authorized non-production external vantage point was actually used.

Always include:

`Local deployment readiness verified - remote VPS state not verified.`

Add a manual VPS checklist for DNS, cloud firewall, UFW, disk/RAM/CPU, Docker daemon, TLS certificates, secrets, backups, monitoring, log rotation, restart-after-reboot and rollback procedure.

## Phase 7 — Report

Produce deployment JSON with one synthetic module result named `Deployment / Infrastructure` (or a discovered deployment-scope name), its own required check receipts, and a monochrome detail report linked from `reports/qa/index.html`. This is a deployment gate, not a replacement for module audit results. When a prior dashboard for the same repository/branch exists, preserve those module reports and the latest integration findings. Verdict must be BLOCKED/CONDITIONAL/FAIL when mandatory checks cannot execute or a required build/image/runtime proof is missing. Never treat scanner unavailability as success.

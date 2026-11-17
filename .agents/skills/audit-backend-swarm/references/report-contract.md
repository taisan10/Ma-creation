# QA Run JSON Contract

All agents return structured JSON. The coordinator normalizes their results into this contract before rendering. JSON is the source of truth; HTML is a read-only presentation.

## Required top-level fields

```json
{
  "schemaVersion": "1.0",
  "run": {
    "id": "run-unique-id",
    "kind": "module|module-swarm|backend-swarm|integration|deployment",
    "title": "Backend QA",
    "startedAt": "ISO-8601",
    "completedAt": "ISO-8601",
    "repo": {
      "id": "stable-repository-id",
      "root": ".",
      "branch": "main",
      "commit": "full-or-short-commit",
      "dirty": true
    },
    "scope": {
      "modules": ["users"],
      "filesInspected": [],
      "filesExcluded": [],
      "sharedDependencies": []
    }
  },
  "checks": [],
  "skillExecutions": [],
  "modules": [],
  "crossModuleFindings": [],
  "notes": []
}
```

## Check receipt

```json
{
  "id": "semgrep-users",
  "name": "semgrep",
  "kind": "SCANNER|TEST|BUILD|LINT|TYPECHECK|INFRA",
  "required": true,
  "status": "PASS|FAIL|SKIPPED|NOT_AVAILABLE|BLOCKED|RUNNING",
  "scope": "apps/api/src/users",
  "version": "when-known",
  "command": "redacted-safe-command",
  "exitCode": 0,
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "note": "No secrets in this field"
}
```

A receipt with `status=PASS` must be backed by an actual run and a successful exit/parsed result. `RAN` is not a pass status. Preserve raw stdout/stderr only in a controlled log artifact; redact tokens, passwords, connection strings and secrets before reporting.

## Skill invocation receipt

```json
{
  "name": "security-review",
  "source": "https://github.com/getsentry/skills",
  "installedPath": ".agents/skills/security-review/SKILL.md",
  "revision": "commit-or-version-when-known",
  "invocationMode": "NATIVE_COMMAND|SKILL_FILE_LOADED",
  "status": "EXECUTED|LOADED_ONLY|SKIPPED|NOT_AVAILABLE|FAILED",
  "scope": "apps/api/src/users",
  "findingsProduced": ["finding-id"]
}
```

Never record `EXECUTED` when the instructions were only mentioned or discovered. `LOADED_ONLY` means the original skill instructions were read but no actual procedure was run.

## Finding

```json
{
  "id": "finding-unique-id",
  "fingerprint": "stable-evidence-aware-fingerprint",
  "primaryCategory": "IMPLEMENTATION_DEFECT",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
  "confidence": "HIGH|MEDIUM|LOW",
  "verification": "VERIFIED|LIKELY|SUSPECTED|NOT_REPRODUCED|BLOCKED",
  "lifecycle": "NEW|PERSISTENT|REOPENED|RESOLVED_CANDIDATE|CONFIRMED_FIXED",
  "triage": "OPEN|ACKNOWLEDGED|FIXED_PENDING_AUDIT|VERIFIED_FIXED|ACCEPTED_RISK|FALSE_POSITIVE|DEFERRED",
  "title": "Finding title",
  "location": {"file": "path/from/repo/root", "lineStart": 1, "lineEnd": 3, "symbol": "methodName"},
  "evidence": "Minimal source evidence; no secrets",
  "scenario": "Concrete failure/attack scenario",
  "impact": "Affected principal/resource and consequence",
  "reproduction": "Safe local-only reproduction or explanation why not reproducible",
  "remediation": "Suggested fix; do not apply it",
  "regressionTest": "Specific test scenario",
  "discoveredByTest": false,
  "sourceAgents": [],
  "sourceSkills": [],
  "relatedFindingIds": []
}
```

## Module result

```json
{
  "name": "users",
  "status": "OPEN|IN_PROGRESS|READY|CONDITIONAL|BLOCKED",
  "scope": {"files": [], "sharedDependencies": [], "excluded": []},
  "testMatrix": [],
  "coverage": {"line": null, "branch": null, "function": null, "statement": null, "source": null},
  "findings": [],
  "skillExecutions": [],
  "checks": []
}
```

## Verdict calculation

Do not trust caller-supplied `verdict`. The renderer/coordinator must calculate it from receipts and findings:

- `BLOCKED`: no meaningful audit/required receipts, scope/repository identity unknown, or critical safety preflight not passed.
- `FAIL`: any required check failed, or verified open CRITICAL/HIGH finding exists.
- `CONDITIONAL`: required check skipped/not available, scope incomplete, or unresolved MEDIUM/LOW findings remain.
- `PASS`: all required checks passed, scope is complete, no open findings at or above configured blocking threshold, and no required evidence is missing.

A missing skill is not silently pass. It is `NOT_AVAILABLE`; whether that makes the run CONDITIONAL or BLOCKED depends on whether the skill was mandatory for that audit profile.

## Counts

Primary categories are mutually exclusive. Report:

- unique implementation/security/integration defects;
- unique missing-test gaps;
- unique test-quality defects;
- total unique findings;
- findings discovered by newly executed tests (a cross-cutting attribute, not a second count);
- linked findings to explain when one missing test exposed an implementation defect.

Never add missing-test counts to implementation defects. Never count the same fingerprint twice because two agents found it.

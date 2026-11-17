#!/usr/bin/env python3
"""Render a lightweight, monochrome QA dashboard from the canonical JSON contract.

No third-party dependencies. The input verdict is deliberately ignored; verdicts
are derived from required check receipts, scope completeness and open findings.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import re
import sys
from pathlib import Path
from typing import Any

VALID_SEVERITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"}
CODE_CATEGORIES = {"IMPLEMENTATION_DEFECT", "SECURITY_VULNERABILITY", "INTEGRATION_DEFECT"}
TEST_GAP_CATEGORIES = {"MISSING_TEST"}
TEST_QUALITY_CATEGORIES = {"TEST_QUALITY_DEFECT"}
OPEN_TRIAGE = {"OPEN", "ACKNOWLEDGED", "FIXED_PENDING_AUDIT", "DEFERRED"}
PASS_CHECK = "PASS"
INCOMPLETE_CHECKS = {"SKIPPED", "NOT_AVAILABLE", "BLOCKED", "RUNNING"}
FAIL_CHECKS = {"FAIL"}


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value)


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:72] or "unnamed-module"


def finding_key(finding: dict[str, Any], module: str) -> str:
    fp = text(finding.get("fingerprint")).strip()
    if fp:
        return f"{module}:{fp}"
    loc = finding.get("location") or {}
    if not isinstance(loc, dict):
        loc = {"file": text(loc)}
    stable = "|".join([
        module,
        text(finding.get("primaryCategory") or finding.get("category")).upper(),
        text(finding.get("ruleId")),
        text(loc.get("file")).replace("\\", "/"),
        text(loc.get("symbol")),
        text(finding.get("title")).lower().strip(),
        re.sub(r"\s+", " ", text(finding.get("evidence")).lower()).strip()[:500],
    ])
    return hashlib.sha256(stable.encode("utf-8")).hexdigest()


def normalize_finding(raw: Any, module: str) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raw = {"title": text(raw)}
    item = dict(raw)
    category = text(item.get("primaryCategory") or item.get("category") or "OTHER").upper()
    severity = text(item.get("severity") or "INFO").upper()
    if severity not in VALID_SEVERITIES:
        severity = "INFO"
    item["primaryCategory"] = category
    item["severity"] = severity
    item["verification"] = text(item.get("verification") or "SUSPECTED").upper()
    item["lifecycle"] = text(item.get("lifecycle") or "NEW").upper()
    item["triage"] = text(item.get("triage") or "OPEN").upper()
    item["module"] = text(item.get("module") or module)
    item["fingerprint"] = text(item.get("fingerprint") or finding_key(item, module))
    item["id"] = text(item.get("id") or item["fingerprint"][:16])
    item["title"] = text(item.get("title") or "Untitled finding")
    location = item.get("location") or {}
    if not isinstance(location, dict):
        location = {"file": text(location)}
    item["location"] = {
        "file": text(location.get("file")),
        "lineStart": location.get("lineStart"),
        "lineEnd": location.get("lineEnd"),
        "symbol": text(location.get("symbol")),
    }
    for field in ("evidence", "scenario", "impact", "reproduction", "remediation", "regressionTest"):
        item[field] = text(item.get(field))
    return item


def normalize_module(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raw = {"name": text(raw)}
    module = dict(raw)
    name = text(module.get("name") or module.get("module") or "unnamed-module")
    module["name"] = name
    module["slug"] = slugify(name)
    module["findings"] = [normalize_finding(x, name) for x in (module.get("findings") or [])]
    module["checks"] = module.get("checks") or []
    module["skillExecutions"] = module.get("skillExecutions") or []
    module["testMatrix"] = module.get("testMatrix") or []
    module["coverage"] = module.get("coverage") or {}
    return module


def check_state(checks: list[Any]) -> tuple[str, list[str]]:
    required = [c for c in checks if isinstance(c, dict) and c.get("required") is True]
    if not required:
        return "BLOCKED", ["No required-check manifest was supplied."]
    statuses = [text(c.get("status")).upper() for c in required]
    notes: list[str] = []
    if any(s in FAIL_CHECKS for s in statuses) or any(
        text(c.get("status")).upper() == "PASS" and c.get("exitCode") not in (None, 0)
        for c in required if isinstance(c, dict)
    ):
        notes.append("At least one required check failed or returned a non-zero exit code.")
        return "FAIL", notes
    if any(s == "BLOCKED" for s in statuses):
        notes.append("At least one required check was blocked.")
        return "BLOCKED", notes
    if any(s in INCOMPLETE_CHECKS for s in statuses):
        notes.append("At least one required check was skipped, unavailable, blocked or still running.")
        return "CONDITIONAL", notes
    if any(s != PASS_CHECK for s in statuses):
        notes.append("At least one required check has an unknown status.")
        return "BLOCKED", notes
    return "PASS", notes


def module_verdict(module: dict[str, Any]) -> tuple[str, list[str]]:
    checks = module.get("checks") or []
    state, notes = check_state(checks)
    findings = module.get("findings") or []
    active = [f for f in findings if f.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"}]
    if any(f.get("severity") in {"CRITICAL", "HIGH"} and f.get("verification") == "VERIFIED" for f in active):
        return "FAIL", notes + ["At least one verified open Critical/High finding exists."]
    if any(f.get("severity") in {"CRITICAL", "HIGH"} for f in active):
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("An open Critical/High candidate is not yet independently verified.")
    if any(f.get("severity") in {"MEDIUM", "LOW"} for f in active):
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("Open Medium/Low findings remain.")
    if any(f.get("primaryCategory") in (TEST_GAP_CATEGORIES | TEST_QUALITY_CATEGORIES) for f in active):
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("Missing test coverage or test-quality defects remain.")
    return state, notes


def overall_verdict(checks: list[Any], modules: list[dict[str, Any]], cross_findings: list[dict[str, Any]]) -> tuple[str, list[str]]:
    state, notes = check_state(checks)
    if not modules:
        return "BLOCKED", notes + ["No module results were supplied."]
    if any(not m.get("findings") and not m.get("checks") for m in modules):
        # Empty module result with no test/check receipts is an incomplete audit, not a clean module.
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("At least one module has no finding list and no check receipts.")
    findings = [f for m in modules for f in m.get("findings", [])] + cross_findings
    active = [f for f in findings if f.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"}]
    if any(f.get("severity") in {"CRITICAL", "HIGH"} and f.get("verification") == "VERIFIED" for f in active):
        return "FAIL", notes + ["At least one verified open Critical/High finding exists."]
    if any(f.get("severity") in {"CRITICAL", "HIGH"} for f in active):
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("An open Critical/High candidate is not yet independently verified.")
    if any(f.get("severity") in {"MEDIUM", "LOW"} for f in active) or any(f.get("primaryCategory") in (TEST_GAP_CATEGORIES | TEST_QUALITY_CATEGORIES) for f in active):
        if state == "PASS":
            state = "CONDITIONAL"
        notes.append("Unresolved findings or test gaps remain.")
    module_states = [m.get("computedVerdict", "BLOCKED") for m in modules]
    if "FAIL" in module_states:
        return "FAIL", notes + ["At least one module failed."]
    if "BLOCKED" in module_states:
        return "BLOCKED", notes + ["At least one module is blocked or incomplete."]
    if "CONDITIONAL" in module_states and state == "PASS":
        state = "CONDITIONAL"
        notes.append("At least one module is conditional.")
    return state, notes


def unique_findings(modules: list[dict[str, Any]], cross: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: dict[str, dict[str, Any]] = {}
    for m in modules:
        for f in m.get("findings", []):
            key = finding_key(f, m["name"])
            if key not in seen:
                seen[key] = f
            else:
                # Preserve provenance without duplicating the finding count.
                prior = seen[key]
                prior["sourceAgents"] = sorted(set((prior.get("sourceAgents") or []) + (f.get("sourceAgents") or [])))
                prior["sourceSkills"] = sorted(set((prior.get("sourceSkills") or []) + (f.get("sourceSkills") or [])))
    for f in cross:
        key = finding_key(f, "cross-module")
        if key not in seen:
            seen[key] = f
    return list(seen.values())


def merge_module_finding_history(
    current_module: dict[str, Any],
    previous_module: dict[str, Any],
    run_id: str,
    previous_run_id: str,
) -> None:
    """Carry historical findings forward without silently closing them."""
    current = current_module.get("findings", [])
    previous = previous_module.get("findings", [])
    current_by_key = {finding_key(f, current_module["name"]): f for f in current}
    scope = current_module.get("scope") or {}
    scoped_files = scope.get("files") or scope.get("includedFiles") or []
    normalized_scope_files = {text(x.get("path") if isinstance(x, dict) else x).replace("\\", "/") for x in scoped_files}
    carried = []

    for old in previous:
        key = finding_key(old, current_module["name"])
        new = current_by_key.get(key)
        if new is not None:
            new.setdefault("firstSeenRunId", old.get("firstSeenRunId") or previous_run_id)
            new["lastSeenRunId"] = run_id
            if old.get("triage") == "VERIFIED_FIXED" or old.get("lifecycle") == "CONFIRMED_FIXED":
                new["triage"] = "OPEN"
                new["lifecycle"] = "REOPENED"
                new["reopenedFromRunId"] = previous_run_id
                new["historyNote"] = "A finding previously marked fixed was detected again."
            else:
                if old.get("triage") and old.get("triage") != "OPEN":
                    new["triage"] = old["triage"]
                if old.get("lifecycle") in {"NEW", "RESOLVED_CANDIDATE"}:
                    new["lifecycle"] = "PERSISTENT"
                for field in ("developerNotes", "acceptedRiskReason", "firstSeenAt", "firstSeenRunId"):
                    if field in old and field not in new:
                        new[field] = old[field]
            continue

        carried_finding = dict(old)
        if carried_finding.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"}:
            file_path = text((carried_finding.get("location") or {}).get("file")).replace("\\", "/")
            if file_path and normalized_scope_files and file_path in normalized_scope_files:
                carried_finding["lifecycle"] = "RESOLVED_CANDIDATE"
                carried_finding["resolutionNote"] = "Not observed in the latest scan of the same declared module scope; independent fix verification is still required."
            else:
                carried_finding["lifecycle"] = "PERSISTENT"
                carried_finding["resolutionNote"] = "Not observed, but the current scope does not prove that the affected file/path was re-audited."
        carried_finding["notObservedInCurrentRun"] = True
        carried_finding.setdefault("lastSeenRunId", previous_run_id)
        carried.append(carried_finding)

    current_module["findings"] = current + carried


def merge_cross_finding_history(
    current: list[dict[str, Any]],
    previous: list[dict[str, Any]],
    module_scope_hash: str,
    previous_scope_hash: str,
    run_id: str,
    previous_run_id: str,
) -> list[dict[str, Any]]:
    current_by_key = {finding_key(f, "cross-module"): f for f in current}
    carried = []
    same_scope = bool(module_scope_hash and previous_scope_hash and module_scope_hash == previous_scope_hash)
    for old in previous:
        key = finding_key(old, "cross-module")
        new = current_by_key.get(key)
        if new is not None:
            new.setdefault("firstSeenRunId", old.get("firstSeenRunId") or previous_run_id)
            new["lastSeenRunId"] = run_id
            if old.get("triage") == "VERIFIED_FIXED" or old.get("lifecycle") == "CONFIRMED_FIXED":
                new["triage"] = "OPEN"
                new["lifecycle"] = "REOPENED"
            elif old.get("triage") and old.get("triage") != "OPEN":
                new["triage"] = old["triage"]
            continue
        old_copy = dict(old)
        if old_copy.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"}:
            old_copy["lifecycle"] = "RESOLVED_CANDIDATE" if same_scope else "PERSISTENT"
            old_copy["resolutionNote"] = (
                "Not observed in the latest integration scan of the same scope; independent fix verification is still required."
                if same_scope else
                "Not observed, but integration scope identity was not proven equal; keep this finding open."
            )
        old_copy["notObservedInCurrentRun"] = True
        old_copy.setdefault("lastSeenRunId", previous_run_id)
        carried.append(old_copy)
    return current + carried


def count_summary(findings: list[dict[str, Any]]) -> dict[str, int]:
    return {
        "total": len(findings),
        "codeDefects": sum(f.get("primaryCategory") in CODE_CATEGORIES for f in findings),
        "missingTests": sum(f.get("primaryCategory") in TEST_GAP_CATEGORIES for f in findings),
        "testQualityDefects": sum(f.get("primaryCategory") in TEST_QUALITY_CATEGORIES for f in findings),
        "critical": sum(f.get("severity") == "CRITICAL" for f in findings),
        "high": sum(f.get("severity") == "HIGH" for f in findings),
        "medium": sum(f.get("severity") == "MEDIUM" for f in findings),
        "low": sum(f.get("severity") == "LOW" for f in findings),
        "info": sum(f.get("severity") == "INFO" for f in findings),
        "discoveredByTests": sum(bool(f.get("discoveredByTest")) for f in findings),
    }


def esc(value: Any) -> str:
    return html.escape(text(value), quote=True)


def render_finding(f: dict[str, Any]) -> str:
    loc = f.get("location") or {}
    where = text(loc.get("file"))
    if loc.get("lineStart") is not None:
        where += f":{loc['lineStart']}"
        if loc.get("lineEnd") and loc.get("lineEnd") != loc.get("lineStart"):
            where += f"-{loc['lineEnd']}"
    fields = [
        ("Evidence", f.get("evidence")),
        ("Scenario", f.get("scenario")),
        ("Impact", f.get("impact")),
        ("Reproduction", f.get("reproduction")),
        ("Suggested remediation", f.get("remediation")),
        ("Regression test", f.get("regressionTest")),
    ]
    detail = "".join(
        f'<section class="detail"><h4>{esc(label)}</h4><pre>{esc(value)}</pre></section>'
        for label, value in fields if value
    )
    source_skills = ", ".join(f.get("sourceSkills") or [])
    source_agents = ", ".join(f.get("sourceAgents") or [])
    meta = " · ".join(x for x in [source_skills, source_agents] if x)
    return f'''<details class="finding" data-severity="{esc(f.get('severity'))}" data-category="{esc(f.get('primaryCategory'))}">
      <summary><span class="severity">{esc(f.get('severity'))}</span><span class="finding-title">{esc(f.get('title'))}</span><span class="tag">{esc(f.get('primaryCategory'))}</span><span class="tag">{esc(f.get('triage'))}</span></summary>
      <div class="finding-body"><p class="muted">{esc(where)} · {esc(f.get('verification'))} confidence: {esc(f.get('confidence'))}</p>
      {detail}<p class="muted">{esc(meta)}</p></div></details>'''


def page_shell(title: str, body: str, extra_js: str = "") -> str:
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title>
<style>
:root{{color-scheme:light;--ink:#111;--muted:#666;--line:#d9d9d9;--paper:#fff;--wash:#f4f4f4}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}}
main{{max-width:1160px;margin:0 auto;padding:28px 20px 60px}}h1{{font-size:22px;letter-spacing:-.03em;margin:0}}h2{{font-size:16px;margin:24px 0 10px}}h3{{font-size:14px;margin:0 0 8px}}h4{{font-size:12px;margin:14px 0 5px;text-transform:uppercase;letter-spacing:.04em}}p{{margin:6px 0}}a{{color:#111;text-decoration:underline;text-underline-offset:2px}}.top{{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:14px}}.muted,small{{color:var(--muted)}}.summary{{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:18px 0}}.metric{{border:1px solid var(--line);padding:12px}}.metric strong{{display:block;font-size:24px;line-height:1.2}}.metric span{{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}}.status{{display:inline-block;border:1px solid #111;padding:3px 8px;font-size:11px;font-weight:700;letter-spacing:.04em}}.filters{{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}}input,select{{border:1px solid #999;background:#fff;padding:8px;color:#111;font:inherit}}input{{min-width:220px}}table{{border-collapse:collapse;width:100%;font-size:13px}}th,td{{text-align:left;padding:9px 8px;border-bottom:1px solid var(--line);vertical-align:top}}th{{font-size:11px;text-transform:uppercase;color:var(--muted);letter-spacing:.04em}}.module{{border:1px solid var(--line);margin:10px 0}}.module>summary{{list-style:none;cursor:pointer;padding:11px;display:grid;grid-template-columns:minmax(120px,1.3fr) repeat(4,minmax(70px,.6fr)) auto;gap:10px;align-items:center}}.module>summary::-webkit-details-marker,.finding>summary::-webkit-details-marker{{display:none}}.module>summary:hover,.finding>summary:hover{{background:var(--wash)}}.module-body{{padding:4px 12px 14px;border-top:1px solid var(--line)}}.finding{{border:1px solid var(--line);margin:8px 0}}.finding>summary{{display:flex;gap:9px;align-items:center;flex-wrap:wrap;padding:9px;cursor:pointer}}.finding-title{{font-weight:650;flex:1;min-width:180px}}.severity,.tag{{border:1px solid #888;padding:1px 6px;font-size:10px;white-space:nowrap}}.finding-body{{border-top:1px solid var(--line);padding:8px 10px}}pre{{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--wash);padding:9px;margin:4px 0;font:12px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}}.detail{{margin:8px 0}}.note{{border-left:3px solid #111;padding:8px 12px;background:var(--wash);margin:12px 0}}.empty{{padding:16px;border:1px dashed #aaa;color:var(--muted)}}.footer{{border-top:1px solid var(--line);margin-top:30px;padding-top:12px;color:var(--muted);font-size:11px}}
@media(max-width:760px){{main{{padding:18px 12px}}.summary{{grid-template-columns:repeat(2,minmax(0,1fr))}}.module>summary{{grid-template-columns:1fr 1fr}}table{{display:block;overflow-x:auto}}}}
@media print{{.filters{{display:none}}main{{max-width:none;padding:0}}details{{break-inside:avoid}}}}
</style></head><body><main>{body}<div class="footer">Generated by Antigravity QA Orchestrator · Monochrome local report · JSON is the source of truth</div></main>{extra_js}</body></html>'''


def render_test_matrix(items: list[Any]) -> str:
    if not items:
        return '<div class="empty">No test matrix was supplied. This must not be interpreted as complete test coverage.</div>'
    rows = []
    for item in items:
        if not isinstance(item, dict):
            rows.append(f"<tr><td>{esc(item)}</td><td>UNCLASSIFIED</td><td></td><td></td></tr>")
            continue
        rows.append(
            "<tr>"
            f"<td>{esc(item.get('area') or item.get('endpoint') or item.get('method') or item.get('scenario') or item.get('title'))}</td>"
            f"<td>{esc(item.get('status') or item.get('coverageStatus') or item.get('classification') or 'UNCLASSIFIED')}</td>"
            f"<td>{esc(item.get('expected') or item.get('expectedResult') or item.get('expectation'))}</td>"
            f"<td>{esc(item.get('existingTest') or item.get('test') or item.get('note') or item.get('gap'))}</td>"
            "</tr>"
        )
    return '<table><thead><tr><th>Area / scenario</th><th>Coverage status</th><th>Expected result</th><th>Existing test / gap</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table>'


def render_receipt_table(items: list[Any], columns: list[tuple[str, str]]) -> str:
    if not items:
        return '<div class="empty">No receipts supplied.</div>'
    header = ''.join(f"<th>{esc(label)}</th>" for label, _ in columns)
    rows = []
    for item in items:
        if not isinstance(item, dict):
            continue
        cells = ''.join(f"<td>{esc(item.get(key))}</td>" for _, key in columns)
        rows.append(f"<tr>{cells}</tr>")
    return f"<table><thead><tr>{header}</tr></thead><tbody>{''.join(rows)}</tbody></table>" if rows else '<div class="empty">No structured receipts supplied.</div>'


def module_page(module: dict[str, Any], run: dict[str, Any]) -> str:
    findings = module.get("findings", [])
    counts = count_summary(findings)
    state, notes = module_verdict(module)
    if module.get("stale"):
        state = "CONDITIONAL"
        notes.append("This module report is stale relative to the current commit.")
    open_count = sum(1 for f in findings if f.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"})
    fixed_count = sum(1 for f in findings if f.get("triage") == "VERIFIED_FIXED" or f.get("lifecycle") == "CONFIRMED_FIXED")
    repo = run.get("repo") or {}
    audited_branch = module.get("auditBranch") or repo.get("branch")
    audited_commit = module.get("auditCommit") or repo.get("commit")
    audited_repo = module.get("auditRepoId") or repo.get("id")
    body = f'''<div class="top"><div><h1>{esc(module['name'])} — QA Report</h1><p class="muted">{esc(run.get('id'))} · {esc(audited_repo)} · {esc(audited_branch)} · {esc(audited_commit)}</p></div><span class="status">{esc(state)}</span></div>
    <div class="summary"><div class="metric"><strong>{counts['total']}</strong><span>Total findings</span></div><div class="metric"><strong>{counts['codeDefects']}</strong><span>Code/security/integration</span></div><div class="metric"><strong>{counts['missingTests']}</strong><span>Missing tests</span></div><div class="metric"><strong>{counts['testQualityDefects']}</strong><span>Test quality</span></div></div>
    <p class="muted">{open_count} open · {fixed_count} verified fixed</p><p><a href="../../index.html">← Back to QA index</a></p>
    <h2>Scope</h2><pre>{esc(module.get('scope') or {})}</pre>
    <h2>Module test matrix</h2>{render_test_matrix(module.get('testMatrix') or [])}
    <h2>Findings</h2>{''.join(render_finding(f) for f in findings) or '<div class="empty">No findings were supplied. This is not proof of PASS; inspect required check receipts.</div>'}
    <h2>Tests and checks</h2>{render_receipt_table(module.get('checks', []), [('Name','name'),('Status','status'),('Required','required'),('Exit','exitCode'),('Note','note')])}
    <h2>Specialist skill receipts</h2>{render_receipt_table(module.get('skillExecutions', []), [('Skill','name'),('Invocation','invocationMode'),('Status','status'),('Scope','scope')])}
    <h2>Coverage</h2><pre>{esc(module.get('coverage') or {})}</pre>
    <h2>Completion notes</h2><pre>{esc(notes)}</pre>'''
    return page_shell(f"{module['name']} QA", body)


def run_detail_page(payload: dict[str, Any]) -> str:
    run = payload.get("run") or {}
    repo = run.get("repo") or {}
    modules = payload.get("modules") or []
    cross = payload.get("crossModuleFindings") or []
    checks = payload.get("checks") or []
    findings = unique_findings(modules, cross)
    counts = count_summary(findings)
    verdict = payload.get("computedVerdict", "BLOCKED")
    title = text(run.get("title") or {"integration": "Integration Audit", "backend-swarm": "Backend Swarm Audit", "deployment": "Deployment Readiness"}.get(text(run.get("kind")), "QA Run"))
    module_rows = []
    for module in modules:
        state, _ = module_verdict(module)
        if module.get("stale"):
            state = "CONDITIONAL"
        module_rows.append(
            f"<tr><td>{esc(module.get('name'))}</td><td>{esc(state)}</td>"
            f"<td>{count_summary(module.get('findings', []))['codeDefects']}</td>"
            f"<td>{count_summary(module.get('findings', []))['missingTests']}</td>"
            f"<td><a href='../module/{esc(module.get('slug') or slugify(text(module.get('name'))))}/latest.html'>Module report</a></td></tr>"
        )
    body = f'''<div class="top"><div><h1>{esc(title)}</h1><p class="muted">{esc(run.get('id'))} · {esc(repo.get('id'))} · {esc(repo.get('branch'))} · {esc(repo.get('commit'))}</p></div><span class="status">{esc(verdict)}</span></div>
    <div class="summary"><div class="metric"><strong>{counts['total']}</strong><span>Unique findings</span></div><div class="metric"><strong>{counts['codeDefects']}</strong><span>Code/security/integration</span></div><div class="metric"><strong>{counts['missingTests']}</strong><span>Missing tests</span></div><div class="metric"><strong>{counts['testQualityDefects']}</strong><span>Test quality</span></div></div>
    <p><a href="../index.html">← Back to QA index</a></p>
    <h2>Module results</h2><table><thead><tr><th>Module</th><th>Verdict</th><th>Code defects</th><th>Missing tests</th><th>Detail</th></tr></thead><tbody>{''.join(module_rows) or '<tr><td colspan="5">No module results supplied.</td></tr>'}</tbody></table>
    <h2>Cross-module findings</h2>{''.join(render_finding(f) for f in cross) or '<div class="empty">No cross-module findings supplied.</div>'}
    <h2>All findings</h2>{''.join(render_finding(f) for f in findings) or '<div class="empty">No findings supplied.</div>'}
    <h2>Required check receipts</h2>{render_receipt_table(checks, [('Check','name'),('Kind','kind'),('Status','status'),('Required','required'),('Exit','exitCode'),('Note','note')])}
    <h2>Specialist skill receipts</h2>{render_receipt_table(payload.get('skillExecutions', []), [('Skill','name'),('Invocation','invocationMode'),('Status','status'),('Scope','scope')])}
    <h2>Run notes</h2><pre>{esc(payload.get('notes') or [])}</pre>'''
    return page_shell(title, body)


def render_index(payload: dict[str, Any], modules: list[dict[str, Any]], cross: list[dict[str, Any]], checks: list[Any], output: Path) -> None:
    run = payload.get("run") or {}
    repo = run.get("repo") or {}
    all_findings = unique_findings(modules, cross)
    counts = count_summary(all_findings)
    verdict, notes = overall_verdict(checks, modules, cross)
    rows = []
    for m in modules:
        state, mnotes = module_verdict(m)
        if m.get("stale"):
            state = "CONDITIONAL"
            mnotes.append("This module report is stale relative to the current commit.")
        mcounts = count_summary(m.get("findings", []))
        detail_link = f"module/{m['slug']}/latest.html"
        findings_html = "".join(render_finding(f) for f in m.get("findings", []))
        skills = m.get("skillExecutions", [])
        skill_line = ", ".join(f"{text(s.get('name'))}:{text(s.get('status'))}" for s in skills if isinstance(s, dict)) or "No skill receipts"
        open_count = sum(1 for f in m.get("findings", []) if f.get("triage") not in {"VERIFIED_FIXED", "FALSE_POSITIVE", "ACCEPTED_RISK"})
        fixed_count = sum(1 for f in m.get("findings", []) if f.get("triage") == "VERIFIED_FIXED" or f.get("lifecycle") == "CONFIRMED_FIXED")
        rows.append(f'''<details class="module" data-module="{esc(m['name'].lower())}" data-status="{esc(state)}"><summary><strong>{esc(m['name'])}</strong><span>{mcounts['codeDefects']} code defects</span><span>{mcounts['missingTests']} test gaps</span><span>{mcounts['testQualityDefects']} test defects</span><span class="status">{esc(state)}</span><a href="{esc(detail_link)}">Report ↗</a></summary><div class="module-body"><p class="muted">{open_count} open · {fixed_count} verified fixed · {esc(skill_line)}</p><p class="muted">{esc(mnotes)}</p>{findings_html or '<div class="empty">No findings supplied for this module. Check execution receipts.</div>'}</div></details>''')
    cross_html = "".join(render_finding(f) for f in cross)
    check_rows = "".join(f"<tr><td>{esc(c.get('name') or c.get('id'))}</td><td>{esc(c.get('kind'))}</td><td>{esc(c.get('status'))}</td><td>{'Yes' if c.get('required') else 'No'}</td><td>{esc(c.get('exitCode'))}</td></tr>" for c in checks if isinstance(c, dict))
    run_kind = text(run.get("kind"))
    system_link = {"integration": "integration/latest.html", "backend-swarm": "backend-swarm/latest.html", "deployment": "deployment/latest.html"}.get(run_kind)
    system_link_html = f'<p><a href="{esc(system_link)}">Open latest {esc(run_kind)} detail report ↗</a></p>' if system_link else ""
    body = f'''<div class="top"><div><h1>QA / BACKEND</h1><p class="muted">{esc(run.get('id'))} · {esc(repo.get('id'))} · {esc(repo.get('branch'))} · {esc(repo.get('commit'))}</p></div><span class="status">{esc(verdict)}</span></div>
    {system_link_html}
    <div class="summary"><div class="metric"><strong>{len(modules)}</strong><span>Modules</span></div><div class="metric"><strong>{counts['codeDefects']}</strong><span>Code/security/integration defects</span></div><div class="metric"><strong>{counts['missingTests']}</strong><span>Missing tests</span></div><div class="metric"><strong>{counts['testQualityDefects']}</strong><span>Test-quality defects</span></div><div class="metric"><strong>{counts['critical']}</strong><span>Critical</span></div><div class="metric"><strong>{counts['high']}</strong><span>High</span></div><div class="metric"><strong>{counts['total']}</strong><span>Unique findings</span></div><div class="metric"><strong>{counts['discoveredByTests']}</strong><span>Found by test execution</span></div></div>
    <div class="note"><strong>Classification:</strong> Code defects, missing tests and test-quality defects are counted separately. Test-discovered code defects are a cross-cutting attribute and are not added a second time. The computed verdict ignores any input-supplied verdict.</div>
    <h2>Modules</h2><div class="filters"><input id="search" placeholder="Filter modules or findings…"><select id="status"><option value="">All statuses</option><option>PASS</option><option>FAIL</option><option>CONDITIONAL</option><option>BLOCKED</option></select></div>
    {''.join(rows) or '<div class="empty">No module results available.</div>'}
    <h2>Cross-module findings</h2>{cross_html or '<div class="empty">No cross-module findings supplied.</div>'}
    <h2>Required check receipts</h2><table><thead><tr><th>Check</th><th>Type</th><th>Status</th><th>Required</th><th>Exit</th></tr></thead><tbody>{check_rows}</tbody></table>
    <h2>Verdict notes</h2><pre>{esc(notes)}</pre>
    <p class="muted">Created: {esc(run.get('completedAt') or utc_now())}. Dirty worktree: {esc(repo.get('dirty'))}</p>'''
    js = '''<script>
(function(){const search=document.getElementById('search'),status=document.getElementById('status');function apply(){const q=(search.value||'').toLowerCase(),s=status.value;document.querySelectorAll('.module').forEach(el=>{const hay=(el.innerText||'').toLowerCase();el.hidden=!!((q&&!hay.includes(q))||(s&&el.dataset.status!==s));});}search.addEventListener('input',apply);status.addEventListener('change',apply);})();
</script>'''
    output.write_text(page_shell("QA Backend Index", body, js), encoding="utf-8")


def safe_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Canonical QA JSON input")
    parser.add_argument("--out-dir", required=True, type=Path, help="reports/qa output directory")
    parser.add_argument("--replace-dashboard", action="store_true", help="replace, rather than merge, the current dashboard")
    args = parser.parse_args()

    try:
        payload = json.loads(args.input.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"ERROR: cannot read JSON input: {exc}", file=sys.stderr)
        return 2
    if not isinstance(payload, dict):
        print("ERROR: top-level JSON value must be an object", file=sys.stderr)
        return 2
    if not isinstance(payload.get("run"), dict):
        print("ERROR: `run` object is required", file=sys.stderr)
        return 2

    modules_raw = payload.get("modules")
    if not isinstance(modules_raw, list):
        print("ERROR: `modules` must be an array", file=sys.stderr)
        return 2
    modules = [normalize_module(m) for m in modules_raw]
    names = [m["name"].casefold() for m in modules]
    if len(names) != len(set(names)):
        print("ERROR: duplicate module names in one run", file=sys.stderr)
        return 2

    cross_raw = payload.get("crossModuleFindings") or []
    if not isinstance(cross_raw, list):
        print("ERROR: `crossModuleFindings` must be an array", file=sys.stderr)
        return 2
    cross = [normalize_finding(f, "cross-module") for f in cross_raw]
    checks = payload.get("checks") or []
    if not isinstance(checks, list):
        print("ERROR: `checks` must be an array", file=sys.stderr)
        return 2

    output = args.out_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    run = payload["run"]
    run_id = slugify(text(run.get("id") or dt.datetime.now().strftime("run-%Y%m%d-%H%M%S")))
    payload["run"]["id"] = run_id

    repo = run.get("repo") or {}
    identity_missing = not all(text(repo.get(k)).strip() for k in ("id", "branch", "commit"))
    for module in modules:
        module["auditRepoId"] = text(repo.get("id"))
        module["auditBranch"] = text(repo.get("branch"))
        module["auditCommit"] = text(repo.get("commit"))
        module["auditRunId"] = run_id
        module["computedVerdict"], module["verdictNotes"] = module_verdict(module)

    # A single-module run updates that module in the shared dashboard and keeps
    # other modules visible. Old module entries are marked stale on commit change.
    previous = None
    dashboard_path = output / "dashboard.json"
    if dashboard_path.exists() and not args.replace_dashboard:
        try:
            previous = json.loads(dashboard_path.read_text(encoding="utf-8"))
        except Exception:
            previous = None
    incoming_kind = text(run.get("kind"))
    merge_previous = (
        previous
        and incoming_kind in {"module", "module-swarm", "backend-swarm", "integration", "deployment"}
        and (incoming_kind not in {"module", "module-swarm"} or len(modules) == 1)
        and text(((previous.get("run") or {}).get("repo") or {}).get("id")) == text(repo.get("id"))
        and text(((previous.get("run") or {}).get("repo") or {}).get("branch")) == text(repo.get("branch"))
    )
    if merge_previous:
        old_modules = [normalize_module(m) for m in (previous.get("modules") or []) if isinstance(m, dict)]
        current_by_name = {m["name"].casefold(): m for m in modules}
        previous_run_id = text((previous.get("run") or {}).get("id"))
        merged = []
        for old in old_modules:
            current_module = current_by_name.get(old["name"].casefold())
            if current_module is not None:
                if incoming_kind in {"module", "module-swarm", "backend-swarm"}:
                    merge_module_finding_history(current_module, old, run_id, previous_run_id)
                continue
            old_repo = text(old.get("auditRepoId") or (((previous.get("run") or {}).get("repo") or {}).get("id")))
            old_branch = text(old.get("auditBranch") or (((previous.get("run") or {}).get("repo") or {}).get("branch")))
            old_commit = text(old.get("auditCommit") or (((previous.get("run") or {}).get("repo") or {}).get("commit")))
            old["stale"] = (old_repo != text(repo.get("id")) or old_branch != text(repo.get("branch")) or old_commit != text(repo.get("commit")))
            if incoming_kind == "backend-swarm":
                old["notInCurrentDiscovery"] = True
                old["stale"] = True
            old["computedVerdict"], old["verdictNotes"] = module_verdict(old)
            merged.append(old)
        modules = merged + modules
        if incoming_kind in {"integration", "backend-swarm"}:
            previous_scope_hash = text(((previous.get("run") or {}).get("scope") or {}).get("scopeHash"))
            current_scope_hash = text((run.get("scope") or {}).get("scopeHash"))
            cross = merge_cross_finding_history(
                cross,
                [normalize_finding(f, "cross-module") for f in (previous.get("crossModuleFindings") or [])],
                current_scope_hash,
                previous_scope_hash,
                run_id,
                previous_run_id,
            )
        elif not cross:
            # Module and deployment runs do not erase the last cross-module findings.
            cross = [normalize_finding(f, "cross-module") for f in (previous.get("crossModuleFindings") or [])]

    # Every module's own required receipts participate in the dashboard verdict.
    all_checks = list(checks)
    for module in modules:
        all_checks.extend([c for c in module.get("checks", []) if isinstance(c, dict)])
    # De-duplicate check receipts by their id/name + module scope.
    check_map = {}
    for c in all_checks:
        if isinstance(c, dict):
            key = (text(c.get("id") or c.get("name")), text(c.get("scope")))
            check_map[key] = c
    checks = list(check_map.values())
    verdict, notes = overall_verdict(checks, modules, cross)
    if identity_missing:
        verdict = "BLOCKED"
        notes.append("Repository id, branch and commit metadata are required for a trustworthy report/history comparison.")
    if any(m.get("stale") for m in modules):
        if verdict == "PASS":
            verdict = "CONDITIONAL"
        notes.append("At least one module report is stale relative to the current commit.")
    # Deliberately ignore payload['verdict']; computed status is canonical.
    payload["computedVerdict"] = verdict
    payload["verdictNotes"] = notes
    payload["modules"] = modules
    payload["crossModuleFindings"] = cross
    payload["checks"] = checks
    serialized = json.dumps(payload, indent=2, ensure_ascii=False)

    # Immutable whole-run artifacts. Refuse an ID collision instead of overwriting history.
    history_file = output / "history" / f"{run_id}.json"
    if history_file.exists():
        print(f"ERROR: run id already exists; choose a unique run.id: {run_id}", file=sys.stderr)
        return 2
    safe_write(history_file, serialized)
    safe_write(output / "dashboard.json", serialized)

    for module in modules:
        slug = module["slug"]
        module_payload = {"schemaVersion": payload.get("schemaVersion", "1.0"), "run": run, "modules": [module], "checks": module.get("checks", []), "crossModuleFindings": []}
        mjson = json.dumps(module_payload, indent=2, ensure_ascii=False)
        base = output / "module" / slug
        safe_write(base / "latest.json", mjson)
        safe_write(base / "runs" / f"{run_id}.json", mjson)
        page = module_page(module, run)
        safe_write(base / "latest.html", page)
        safe_write(base / "runs" / f"{run_id}.html", page)
        # Dashboard-relative link path is /module/<slug>/latest.html.
        module["dashboardDetailPath"] = f"module/{slug}/latest.html"

    # Also write a standalone detail page for cross-cutting run types promised by
    # the public report layout. The dashboard remains the shared landing page.
    system_dirs = {
        "integration": output / "integration",
        "backend-swarm": output / "backend-swarm",
        "deployment": output / "deployment",
    }
    if incoming_kind in system_dirs:
        system_dir = system_dirs[incoming_kind]
        safe_write(system_dir / "latest.json", serialized)
        safe_write(system_dir / "latest.html", run_detail_page(payload))
        safe_write(system_dir / "runs" / f"{run_id}.json", serialized)
        safe_write(system_dir / "runs" / f"{run_id}.html", run_detail_page(payload))

    # Recreate index after module outputs. Standalone detail reports are also linked from index.
    render_index(payload, modules, cross, checks, output / "index.html")
    safe_write(output / "latest.json", serialized)
    print(json.dumps({"verdict": verdict, "modules": len(modules), "findings": len(unique_findings(modules, cross)), "index": str(output / "index.html")}, indent=2))
    return 0 if verdict == "PASS" else 1 if verdict == "FAIL" else 3


if __name__ == "__main__":
    raise SystemExit(main())

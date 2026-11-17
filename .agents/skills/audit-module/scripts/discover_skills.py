#!/usr/bin/env python3
"""Read-only inventory of Antigravity Agent Skills in common workspace/global paths."""
from __future__ import annotations
import argparse
import json
import os
import re
from pathlib import Path


def parse_frontmatter(path: Path) -> dict[str, str]:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return {}
    if not content.startswith("---"):
        return {}
    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}
    result: dict[str, str] = {}
    for line in parts[1].splitlines():
        m = re.match(r"^([A-Za-z0-9_-]+):\s*(.*?)\s*$", line)
        if m:
            result[m.group(1)] = m.group(2).strip().strip("'\"")
    return result


def roots(workspace: Path) -> list[tuple[str, Path]]:
    home = Path.home()
    candidates = [
        ("workspace", workspace / ".agents" / "skills"),
        ("workspace-legacy", workspace / ".agent" / "skills"),
        ("workspace-plugin", workspace / ".agents" / "plugins"),
        ("global", home / ".gemini" / "config" / "skills"),
        ("global-legacy", home / ".gemini" / "antigravity" / "skills"),
        ("global-plugin", home / ".gemini" / "config" / "plugins"),
    ]
    return candidates


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--workspace", type=Path, default=Path.cwd())
    p.add_argument("--json", action="store_true")
    args = p.parse_args()
    workspace = args.workspace.resolve()
    found = []
    seen = set()
    for scope, root in roots(workspace):
        if not root.is_dir():
            continue
        candidates = root.glob("*/skills/*/SKILL.md") if scope.endswith("plugin") else root.glob("*/SKILL.md")
        for path in candidates:
            try:
                resolved = path.resolve(strict=True)
            except OSError:
                continue
            if resolved in seen or not resolved.is_file():
                continue
            seen.add(resolved)
            meta = parse_frontmatter(resolved)
            folder = resolved.parent.name
            found.append({
                "name": meta.get("name") or folder,
                "description": meta.get("description", ""),
                "scope": scope,
                "path": str(resolved),
            })
    found.sort(key=lambda x: (x["name"].lower(), x["scope"], x["path"]))
    if args.json:
        print(json.dumps({"workspace": str(workspace), "skills": found}, indent=2))
    else:
        print(f"Workspace: {workspace}\nDiscovered skills: {len(found)}")
        for item in found:
            print(f"- {item['name']} [{item['scope']}] {item['path']}")
            if item["description"]:
                print(f"  {item['description']}")
        print("\nNote: plugin-bundled skills may require Antigravity Customizations or `agy plugin list --json` to inspect.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# Resource Budget: Remote Agent Work vs Local Processes

Do not impose an arbitrary global concurrency limit on read-only agent reasoning. The user has confirmed that high parallelism for remote/API-side reasoning and file reading works on their device.

Use two separate resource classes:

## Class A — Agent-side work (host-managed)

- File reading, code search, graph interpretation and independent reasoning may fan out according to native Antigravity swarm capacity.
- Each module lead owns its nested specialists.
- Do not serialize independent read-only reviews merely because local CPU is limited.
- Avoid duplicate full-repository scans and repeated loading of the same large skill instructions where possible.

## Class B — Local device processes (shared budget)

Default conservative limits:

| Local process | Default concurrent slots |
|---|---:|
| Heavy build/typecheck | 1 |
| Vitest/Jest suite using DB or high memory | 1 |
| Playwright browser | 1 |
| Docker build/rehearsal | 1 |
| Mutation testing | 1, serialized |
| Active local DAST | 1, serialized |
| Lightweight read-only grep/git status | May run concurrently |
| Static scanner | May run concurrently only after memory/CPU/output collision check |

The orchestrator should observe CPU/memory when metrics are available. If usage approaches configured limits, queue local jobs instead of killing processes. Never kill unrelated processes to free ports/resources.

A single shared local budget is required across all swarm workers. A per-agent semaphore is insufficient because ten workers could each believe they own one slot.

# Backend Supply Chain and Dependency Audit Report

**Scope:** `backend/package.json`, `backend/package-lock.json`  
**Auditor Agent:** `repo-supplychain`  
**Verdict:** FAIL (1 High, 2 Medium, 3 Low findings; 1 failed check receipt)

---

## 1. Check Receipts

| ID | Name | Kind | Required | Status | Exit Code | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `supplychain-npm-ls` | npm-ls-integrity-validation | LINT | Yes | **FAIL** | 1 | 7 dependencies marked invalid due to desynchronization between `package.json` pinned declarations and `package-lock.json` resolved versions |
| `supplychain-npm-audit` | npm-audit-offline-check | SCANNER | No | **BLOCKED** | 1 | Offline sandbox network isolation prevented registry access; evaluated via AST & lockfile graph analysis |
| `supplychain-install-scripts-audit` | package-lock-lifecycle-scripts-scanner | SCANNER | Yes | **PASS** | 0 | 3 packages with install scripts detected: `@scarf/scarf`, `argon2`, `msgpackr-extract` |
| `supplychain-license-compliance-audit` | license-spdx-conformance-check | SCANNER | Yes | **PASS** | 0 | 264 packages analyzed: 221 MIT, 12 Apache-2.0, 10 ISC, 7 BlueOak, 8 BSD, 1 FSL-1.1, 3 undefined legacy licenses |
| `supplychain-scripts-audit` | package-json-scripts-audit | LINT | Yes | **PASS** | 0 | 10 scripts audited in `package.json`; missing standard test/lint scripts |

---

## 2. Supply Chain Findings

### [SUPPLY-CHAIN-001] Package-lock.json Desynchronization with package.json (Breaks CI npm ci and Build Reproducibility)
- **Severity:** HIGH
- **Category:** CONFIG_DEPLOY_DEFECT
- **Location:** `backend/package.json` (lines 24-38)
- **Evidence:** `npm ls` in `backend` fails with `ELSPROBLEMS`. 7 dependencies are pinned in `package.json` to older versions than resolved in `package-lock.json` and present in `node_modules`:
  - `cors`: declared `"2.8.5"`, lockfile has `"2.8.6"`
  - `dotenv`: declared `"16.4.7"`, lockfile has `"16.6.1"`
  - `express`: declared `"5.1.0"`, lockfile has `"5.2.1"`
  - `helmet`: declared `"8.1.0"`, lockfile has `"8.3.0"`
  - `mongoose`: declared `"8.18.0"`, lockfile has `"8.24.9"`
  - `razorpay`: declared `"2.9.6"`, lockfile has `"2.9.8"`
  - `zod`: declared `"4.6.5"`, lockfile has `"4.6.7"`
- **Scenario & Impact:** Line 23 of `backend/Dockerfile` runs `npm ci --omit=dev`. In clean CI/CD runner environments, `npm ci` verifies `package.json` against `package-lock.json`. Because exact pinned versions mismatch, `npm ci` fails or alters resolution, breaking deterministic production builds.
- **Remediation:** Synchronize `package.json` to match tested lockfile versions or regenerate `package-lock.json` with `npm install --package-lock-only`.

---

### [SUPPLY-CHAIN-002] Third-Party Telemetry & Network Egress via Install Script (`@scarf/scarf` in `swagger-ui-dist`)
- **Severity:** MEDIUM
- **Category:** SECURITY_DEFECT
- **Location:** `backend/package-lock.json` (`node_modules/@scarf/scarf`)
- **Evidence:** `node_modules/@scarf/scarf@1.4.0` specifies `hasInstallScript: true`. Its postinstall script executes `node ./report.js`, which sends telemetry to `gateway.scarf.sh` unless opt-out environment variables are present.
- **Scenario & Impact:** During local `npm install` or CI/CD container builds, developer/server IP address, host OS, and Node version are transmitted to a third-party commercial endpoint. Violates airgap/zero-trust compliance policies.
- **Remediation:** Add `ENV SCARF_ANALYTICS=false` and `DO_NOT_TRACK=1` to `Dockerfile` and CI workflows, or use `--ignore-scripts`.

---

### [SUPPLY-CHAIN-003] Unmaintained Dependency fluent-ffmpeg 2.1.3 Executing Subprocesses
- **Severity:** MEDIUM
- **Category:** SECURITY_DEFECT
- **Location:** `backend/package.json` (line 28)
- **Evidence:** `fluent-ffmpeg@2.1.3` has not received maintenance in years, relying on legacy `async@^0.2.9` and `which@^1.1.1`.
- **Scenario & Impact:** Used in `transcode.service.js` and `hls.service.js` to spawn FFmpeg processes. Edge cases or unpatched runtime issues in child process argument passing create security and maintenance liabilities.
- **Remediation:** Replace with direct, parameterized `child_process.execFile` or `execa` wrappers with strict argument allowlisting.

---

### [SUPPLY-CHAIN-004] Missing Standard Quality Gate Scripts (test, lint, typecheck) in package.json
- **Severity:** LOW
- **Category:** CONFIG_DEPLOY_DEFECT
- **Location:** `backend/package.json` (lines 6-17)
- **Evidence:** Only `check` (syntax check), `dev`, `start`, `seed`, and load-testing k6 scripts exist. No standard `npm test`, `npm run lint`, or typechecking scripts exist.
- **Impact:** Automated CI pre-commit/pre-merge hooks executing standard `npm test` fail with `Missing script: test`.
- **Remediation:** Add `"test": "node --test src/**/*.test.js"` and configure linting in `package.json`.

---

### [SUPPLY-CHAIN-005] Legacy SPDX Metadata and Single-Maintainer Risk for Streaming Multipart Parser (busboy 1.6.0)
- **Severity:** LOW
- **Category:** CONFIG_DEPLOY_DEFECT
- **Location:** `backend/package.json` (line 22)
- **Evidence:** `busboy@1.6.0` uses legacy `licenses: [{ type: "MIT" }]`, resolving as `license: undefined` in modern lockfiles. Single maintainer project.
- **Impact:** May trigger automated license compliance check failures in strict enterprise CI environments.
- **Remediation:** Configure license override mapping or monitor for SPDX-compliant upstream updates.

---

### [SUPPLY-CHAIN-006] Native Build Toolchain and Execution Surface (argon2 and msgpackr-extract)
- **Severity:** LOW
- **Category:** SECURITY_DEFECT
- **Location:** `backend/package-lock.json`
- **Evidence:** `argon2` (0.45.1) and `msgpackr-extract` (3.0.4) specify `hasInstallScript: true` and execute C++ native compilers (`node-gyp-build` / `cross-env`).
- **Impact:** Execution of arbitrary compilation scripts during install; expands build container toolchain requirements.
- **Remediation:** Verify that Dockerfile isolates build tools into virtual packages and purges them post-build (already implemented).

# Architecture & Edge Perimeter Audit Report

- **Date:** 2026-11-14
- **Auditor:** repo-architecture (Native Swarm Worker)
- **Specialist Skill:** `edge-perimeter-guard`
- **Scope:** `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/*`, `backend/src/middleware/*`, `backend/src/queues/*`, `backend/src/workers/*`, `Caddyfile`, `docker-compose.yml`
- **Verdict:** **FAIL (15 Findings: 1 Critical, 7 High, 4 Medium, 3 Low)**

---

## Executive Summary

A comprehensive architectural and edge perimeter audit of the LMS backend was conducted adhering strictly to the `edge-perimeter-guard` serial audit pathway (Config -> Middlewares -> Network & Ingress -> Storage & Infrastructure Boundaries).

Key systemic risks identified:
1. **Critical CORS Origin Reflection:** CORS regex permits arbitrary attacker-controlled origins matching `*localhost*`, `*pinggy*`, `*trycloudflare*`, or prefixing `env.clientUrl` with `credentials: true`. This allows cross-origin credentialed exfiltration of user data and payment history.
2. **Direct Public Host Exposure of Storage & Telemetry:** In `docker-compose.yml`, MinIO S3 (port 9000), MinIO Console (port 9001), and Dozzle Docker Daemon log viewer (port 8080) are directly mapped to `0.0.0.0` on the host VM, bypassing Caddy and Cloudflare.
3. **Unencrypted HTTP Ingress:** `Caddyfile` is configured solely on plaintext HTTP `:80` with Automatic HTTPS disabled and the CDN proxy commented out.
4. **Flawed Rate Limiting & Proxy Trust:** In-memory rate limiting is completely bypassed in non-production/load-test mode, omits SSE `/api/public/events`, and relies on `trust proxy: 1` which causes shared proxy IP lockouts.
5. **Database Bottleneck Risks:** Compound performance indexes for `Payment`, `Video`, `PlaybackSession`, and `RefreshToken` were left commented out in the Mongoose schemas, risking catastrophic `COLLSCAN` under concurrent student traffic.
6. **Graceful Shutdown & Transcoder Abort:** The transcode worker forcefully exits after 2 seconds on `SIGTERM`, killing active FFmpeg transcodes mid-job, while `server.js` omits closing Redis and BullMQ queues.

---

## Detailed Findings

| Finding ID | Severity | Category | Title | Location |
|---|---|---|---|---|
| `ARCH-FINDING-001` | **CRITICAL** | SECURITY_DEFECT | Permissive CORS Origin Validation Allows Cross-Origin Credentialed Data Exfiltration | `backend/src/app.js:56-64` |
| `ARCH-FINDING-002` | **HIGH** | CONFIGURATION_DEFECT | Blind Trust Proxy (`trust proxy 1`) Enables IP Spoofing and Shared Proxy Lockout | `backend/src/app.js:30` |
| `ARCH-FINDING-003` | **HIGH** | SECURITY_DEFECT | In-Memory Rate Limiting Unshared Across Replicas, Bypassed in Load-Test Mode, Omits SSE | `backend/src/app.js:65-85` |
| `ARCH-FINDING-004` | **HIGH** | CONFIGURATION_DEFECT | Direct Public Host Exposure of MinIO S3 API & Web Console Ports (9000 & 9001) | `docker-compose.yml:62-64` |
| `ARCH-FINDING-005` | **HIGH** | CONFIGURATION_DEFECT | Public Host Exposure of Dozzle Docker Daemon Log Viewer on Port 8080 | `docker-compose.yml:138-140` |
| `ARCH-FINDING-006` | **HIGH** | CONFIGURATION_DEFECT | Caddy Reverse Proxy Bound Exclusively to Plaintext HTTP Port 80 Without TLS Enforcement | `Caddyfile:3-12` |
| `ARCH-FINDING-007` | **HIGH** | RELIABILITY_DEFECT | Incomplete Graceful Shutdown Leaks Redis Connections and Prematurely Aborts Video Transcoding | `backend/src/server.js:41-48`, `workers/transcode.worker.js:149-161` |
| `ARCH-FINDING-008` | **HIGH** | CONFIGURATION_DEFECT | Default Admin Password Fallback and Shared Video DRM Key Secret in Production Configuration | `backend/src/config/env.js:8-53` |
| `ARCH-FINDING-009` | **MEDIUM** | PERFORMANCE_DEFECT | High-Concurrency Compound MongoDB Indexes Commented Out in Mongoose Schema Models | `backend/src/models/LMS/Payment.js:19-20`, `models/LMS/Video.js:75` |
| `ARCH-FINDING-010` | **MEDIUM** | SECURITY_DEFECT | Content Security Policy (CSP) Globally Disabled in Helmet Configuration | `backend/src/app.js:47-54` |
| `ARCH-FINDING-011` | **MEDIUM** | IMPLEMENTATION_DEFECT | Refresh CSRF Guard Contracts Mismatch Between Mobile App Documentation and Enforcement Logic | `backend/src/middleware/refreshCsrf.guard.js:10-29` |
| `ARCH-FINDING-012` | **MEDIUM** | RELIABILITY_DEFECT | Unhandled Promise Rejections Logged Without Initiating Clean Process Shutdown | `backend/src/server.js:52-54` |
| `ARCH-FINDING-013` | **LOW** | SECURITY_DEFECT | Global Error Handler Leaks Stack Traces in Non-Production and Internal Database Keys | `backend/src/middleware/error.js:42-87` |
| `ARCH-FINDING-014` | **LOW** | CONFIGURATION_DEFECT | MinIO Video Bucket Initialization Does Not Enforce Explicit Private Read Policy | `backend/src/config/minio.js:40-46` |
| `ARCH-FINDING-015` | **LOW** | IMPLEMENTATION_DEFECT | Razorpay Payment Webhook Lacks Explicit Raw Body Size Limit | `backend/src/app.js:90-102` |

---

## Remediation Roadmap

1. **Immediate P0 Security Fixes:**
   - Harden CORS origin callback to an exact Set of allowed origins (e.g. `allowedOrigins.has(origin)`). Reject passing `Error` object to CORS callback.
   - Remove `ports: 9000:9000, 9001:9001` and `8080:8080` from `docker-compose.yml`. MinIO must remain internal; Dozzle must bind to `127.0.0.1:8080`.
   - Update `Caddyfile` with domain configuration and automated TLS certificate issuance (`{$APP_DOMAIN}`).
   - Update `assertProductionEnv()` to strictly require `ADMIN_PASSWORD` and `VIDEO_DRM_SECRET`.

2. **High Priority Reliability & Database Fixes:**
   - Uncomment high-concurrency compound indexes in Mongoose models (`Payment`, `Video`, `PlaybackSession`, `RefreshToken`).
   - Switch `express-rate-limit` to `rate-limit-redis` with Redis store; apply connection limiting on `/api/public/events`.
   - Harden graceful shutdown in `server.js` and `transcode.worker.js` with structured timeouts and Redis/BullMQ cleanup.

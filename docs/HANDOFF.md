# MA Creation — Project Handoff & Context (single source of truth)

> **Purpose:** This file is the complete context for the MA Creation project. If you
> start a new session, just say *"pehle `docs/HANDOFF.md` padh lo"* and the assistant
> will understand the whole project, its architecture, deployment, and what still needs
> to be done before production.
>
> **Stack:** MERN — React 19 + React Router 6 + Vite 5 + React Three Fiber (3D),
> Express 5 + Mongoose 8, MongoDB, JWT auth, Zod validation, Razorpay, SSE real-time.
> Target deploy: **Hostinger VPS KVM-2** (2 vCPU / 8 GB RAM, Ubuntu assumed).

---

## 1. Project overview

MA Creation is a full-stack website for a GeM (Government e-Marketplace) consultancy.
It is a marketing + client-portal site with:

- A **database-backed global theme CMS** (colours + typography) edited from admin and
  applied live across the whole site (incl. 3D scenes) via CSS tokens.
- A **live service/plan catalog** (GeM registration, OEM, add-ons, training plans).
- **Razorpay checkout** (guest-friendly, duplicate-purchase guarded).
- A **leads** pipeline (demo / callback forms).
- A **book library** (PDFs stored in MongoDB GridFS).
- A **role-protected admin CMS** (dashboard, users, leads, payments, catalog, pages,
  FAQs, partners, theme/brand settings, books).

The repo is a **two-process monorepo**: an Express/Mongoose API and a Vite/React SPA.

---

## 2. Repository structure

```
MA-Creation/
├── backend/                  # Express API (src/)
│   └── src/
│       ├── server.js         # boots app.js + connects DB
│       ├── app.js            # middleware chain + route mounting
│       ├── config/           # db.js (mongoose), env.js (dotenv + assert)
│       ├── routes/           # auth, leads, catalog, payments, public, admin, books
│       ├── controllers/      # auth, lead, catalog, payment, public, admin, book
│       ├── models/           # User, Payment, Plan, Service, Page, FAQ, Lead, Partner, Book, SiteSettings
│       ├── middleware/       # auth, validate, error, multipartBook
│       ├── services/         # realtime.js (SSE), token.js (JWT)
│       ├── utils/            # AppError, asyncHandler
│       └── seed/seed.js      # seeds services, plans, pages, faqs (NOT users/payments)
├── frontend/                 # Vite SPA (src/)
│   └── src/
│       ├── main.jsx          # React root
│       ├── App.jsx           # providers (LiveUpdates)
│       ├── routes/AppRoutes.jsx   # single source of truth for routes
│       ├── pages/            # route components + per-feature folders
│       ├── components/       # ui/, three/, admin/, shared
│       ├── context/          # LiveUpdatesContext
│       ├── lib/              # api.js, realtime.js, printReceipt.js, utils.js
│       └── theme.jsx         # useTheme() token hook
├── docs/                     # architecture.md, flow.md, Pages.md, HANDOFF.md (this file)
└── README.md
```

---

## 3. Architecture

### 3.1 Frontend
- **Render pipeline:** `main.jsx` → `App.jsx` (wraps `LiveUpdatesProvider`) →
  `AppRoutes.jsx` → page component → page **orchestrator** (`HomePage`, …) →
  **section** components under `pages/<feature>/sections/`.
- **Page/section pattern:** the page file (`pages/Home.jsx`) is a thin re-export of the
  orchestrator (`pages/home/HomePage.jsx`). The orchestrator owns all `api()` data
  fetching and renders one component per visual section. Sections are presentational,
  receiving `cms`/data via props.
- **Components:**
  - `components/ui/` — `Button`, `Card`, `Input`, `Textarea` (shadcn-style, local source).
  - `components/three/` — R3F scenes: `ThreeHero`, `ThreeCaseFile`, `Industry3DCard`,
    `Journey3D`, `Stat3DIcon` (all respect `prefers-reduced-motion`).
  - `components/admin/AdminShell.jsx` — shared admin layout/nav.
  - Shared: `Header`, `Footer`, `DemoForm`, `Accordion`, `Tabs`, `CountUp`, `Seal`,
    `CheckoutInfoModal`, `ScrollToHash`, `ErrorBoundary`.
- **State & data access:**
  - `lib/api.js` — `api(path, options)` fetch wrapper. Reads JWT from `localStorage`
    (`mac_token`), attaches `Authorization: Bearer`, auto-retries retryable statuses
    (408/429/502/503/504), on `401` clears session + redirects to `/login`. Helpers:
    `setSession`, `clearSession`, `getUser`.
  - `lib/realtime.js` — `EventSource` to `/api/public/events`, dispatches `cms:updated`,
    exponential-backoff reconnect.
  - `context/LiveUpdatesContext.jsx` — exposes `revision`/`lastUpdate`.
  - `theme.jsx` — `useTheme()` resolves token object from `/public/settings/theme`,
    with `DEFAULT_THEME`, `THEME_LABELS`, color/font normalization.
- **Routing & auth:** `AppRoutes.jsx` defines every route. Admin routes wrapped in
  `AdminRoute` (reads `getUser()`, redirects non-admins to `/login`).

### 3.2 Backend
- **Middleware chain (`app.js`):**
  1. `helmet()` — security headers.
  2. `cors({ origin: env.clientUrl, credentials: true })`.
  3. `rateLimit` — 600/15min in production (100k in dev); SSE `/api/public/events`
     excluded.
  4. Razorpay webhook mounted **before** `express.json()` so raw body is preserved
     (`req.rawBody`) for signature verification.
  5. `express.json({ limit: '1mb' })`.
  6. `/api/health` — DB connection status.
  7. Route mounting.
  8. Central `errorHandler`.
- **Layers:** controllers → models; middleware (`auth`, `validate`, `error`,
  `multipartBook`); services (`realtime`, `token`); utils (`AppError`, `asyncHandler`).
  `asyncHandler` forwards async errors to the error handler.
- **Route map:**

  | Mount                | Router        | Auth | Notes |
  |----------------------|---------------|------|-------|
  | `/api/auth`          | auth.js       | none / `authenticate` | register, login, `me` |
  | `/api/leads`         | leads.js      | `authenticate,requireAdmin` for list | POST rate-limited (10/15min) |
  | `/api/catalog`       | catalog.js    | none | list services, list plans |
  | `/api/payments`      | payments.js   | `optionalAuthenticate` / `authenticate` | order, verify, failed, `mine` |
  | `/api/public`        | public.js     | none | pages, faqs, partners, settings, **events (SSE)** |
  | `/api/public/books`  | books.js (public) | none | read/download book |
  | `/api/admin`         | admin.js      | `authenticate,requireAdmin` | dashboard, users, leads, payments, generic resources, settings |
  | `/api/admin/books`   | books.js (admin) | `authenticate,requireAdmin` | upload/list/update/delete book |

- **Data models:** `User` (name,email,phone,company,passwordHash,role,interest),
  `Plan` (name,price,billing,duration,category,features,active),
  `Service` (name,category,price,description,active),
  `Page` (slug,content,published — CMS),
  `FAQ`/`Partner` (ordered, active),
  `Lead` (demo/callback + contact/business fields, status),
  `Payment` (razorpay ids, amount, status, user↔plan),
  `Book` (GridFS fileId, metadata),
  `SiteSettings` (keyed `theme`/`brand` — powers global theme CMS).

### 3.3 Cross-cutting systems
- **Auth & roles:** JWT in `localStorage`; `authenticate` populates `req.user`;
  `requireAdmin` restricts admin routes; frontend mirrors with `AdminRoute` + `getUser()`.
- **Theme CMS:** stored in `SiteSettings` (`theme`, `brand`). Admin edits via
  `PUT /api/admin/settings/:key`; public reads via `GET /api/public/settings/:key` +
  `useTheme()`. A save broadcasts `cms:updated` (SSE) for instant visitor updates.
- **Real-time:** `GET /api/public/events` SSE stream; `services/realtime.js` keeps a
  registry; `cms:updated` broadcast.
- **Payments:** guest-friendly (`optionalAuthenticate`); duplicate-purchase guard by
  user **or** email; verification client-side (`/verify`) + server-side webhook.
- **Seeding:** `npm run seed` reseeds Service/Plan/Page/FAQ only — never Users/Payments.

---

## 4. Data & request flows

### 4.1 Global request lifecycle
```
Browser (React) ──fetch lib/api.js (Bearer JWT)──► Vite /api proxy ─► :5000
  └─► Express: helmet, cors, rate-limit, (webhook raw body), express.json()
      └─► route ─► validate(Zod) ─► authenticate ─► controller(asyncHandler)
          └─► Mongoose model ⇄ MongoDB ─► JSON {success:true,...} | errorHandler
```

### 4.2 Auth
- **Register:** `POST /api/auth/register` → bcrypt hash → create User → JWT →
  `setSession()` → navigate `/`.
- **Login:** `POST /api/auth/login` → verify → JWT + user → `setSession()` →
  `/admin` (admin) or `/` (customer).
- Session reused via `Authorization` header; `getUser()` reads cached user.

### 4.3 CMS / page content
Admin edits → `PUT /api/admin/resources/pages` → `GET /api/public/pages/:slug`
(`published:true`) → orchestrator passes `cms.content` into sections. On save, SSE
`cms:updated` bumps `LiveUpdatesContext.revision` → subscribers refetch. Sections render
safe defaults when CMS fields missing.

### 4.4 Theme CMS
`AdminSettings.jsx` → `GET/PUT /api/admin/settings/{theme,brand}` → `SiteSettings` →
broadcast `cms:updated` → public `useTheme()` resolves tokens → CSS variables used
everywhere. "Quick colour" previews locally; only "Save Theme" persists.

### 4.5 Catalog
Seed populates `Service` (registration|oem|addon) + `Plan` (training|service|…).
Public: `GET /api/catalog/services`, `GET /api/catalog/plans`. `ServicesPage` splits by
category; `PlansPage` splits training vs service.

### 4.6 Razorpay payment
```
PlansPage → PurchaseButton
  POST /api/payments/order {planId,name,email,phone,company}  (optionalAuthenticate)
    ├─ load Plan(active); duplicate check (user OR email) → 409
    ├─ Razorpay orders.create(amount=price*100 INR)
    ├─ create Payment{status:'created', razorpayOrderId}
    └─ return {keyId, order, paymentId, plan}
  Browser Razorpay modal
    ├─ SUCCESS → POST /api/payments/verify {order_id,payment_id,signature}
    │            HMAC-SHA256 verify → Payment.status='paid'
    ├─ FAILURE → POST /api/payments/failed → status='failed'
    └─ WEBHOOK → POST /api/payments/webhook (raw body, x-razorpay-signature)
                 HMAC verify → payment.captured / failed
```
`GET /api/payments/mine` returns paid payments and links historical **guest** purchases
by verified email back to the account. `AccountPage` caches in `sessionStorage` per user.

### 4.7 Leads
`DemoForm`/callback → `POST /api/leads` (rate-limited 10/15min + Zod) → `Lead`.
Admin: `GET /api/admin/leads`, `PATCH` status, `DELETE`.

### 4.8 Book library
Admin `POST /api/admin/books/upload` (multipart via `multipartBook.js`, ≤50 MB) → PDF
stored in **MongoDB GridFS** (`books` bucket) — not local disk. Public
`GET /api/public/books`, `/:id/read`, `/:id/download`.

### 4.9 Real-time (SSE)
Backend `services/realtime.js` registry ← `EventSource('/api/public/events')` ←
`lib/realtime.js` `subscribeToLiveUpdates`. Admin save → `cms:updated` →
`LiveUpdatesContext` revision++ → refetch/re-render. Reconnect exponential backoff
(1s→30s, max 20).

---

## 5. Pages inventory

Routes defined in `frontend/src/routes/AppRoutes.jsx`. **Public** = open; **Admin** =
`AdminRoute`-guarded.

### Public
| Route | File → Orchestrator | Data | Sections |
|-------|--------------------|------|----------|
| `/` Home | `Home.jsx` → `home/HomePage.jsx` | `public/pages/home`, `public/faqs` | Hero, GemOverview, FeaturedIndustries, ServicesOverview, Certifications, WhyChooseGem, Demo, CaseFileSummary, Industries, Documentation, Partners, TrainingHub, Testimonials, Faq, CtaBand |
| `/about` | `About.jsx` → `about/AboutPage.jsx` | `public/pages/about` | AboutHero, Story, Founder, MissionVision, WhyDifferent, HowWeWork, CapabilityMap, ClientOutcomes, GemJourney, AiAdvantage, AiRoadmap, CertificationsCta |
| `/services` | `Services.jsx` → `services/ServicesPage.jsx` | `public/pages/services`, `catalog/services`, `catalog/plans` | ServiceHero, ServiceCatalog, ServicePillars, ServiceDocuments |
| `/plans` | `Plans.jsx` → `plans/PlansPage.jsx` | `catalog/plans`, `public/pages/plans`, `payments/mine` (if logged in) | PlansHero, Retainer, ServicePackages, TrainingPackages, TrustBuilder, PaymentFaq |
| `/login` | `Login.jsx` | writes `auth/login`, `auth/register` | tabbed login/register |
| `/account` | `Account.jsx` → `account/AccountPage.jsx` | `payments/mine` (cached) | AccountHeader, AccountSummary, PurchaseCard, AccountSupport |
| `/theme` | `Theme.jsx` | `useTheme()` (`public/settings/theme`) | colour-system showcase |
| `/policies` | `Policies.jsx` | — | static |
| `*` NotFound | `NotFound.jsx` | — | 404 |

### Admin (`/admin/*`, all `AdminRoute`)
| Route | File | Purpose | Endpoint(s) |
|-------|------|---------|-------------|
| `/admin` | `AdminDashboard.jsx` | overview + quick actions | `admin/dashboard` |
| `/admin/users` | `AdminUsers.jsx` | manage customers/admins | `admin/users` |
| `/admin/leads` | `AdminLeads.jsx` | review leads | `admin/leads` |
| `/admin/payments` | `AdminPayments.jsx` | payment records | `admin/payments` |
| `/admin/catalog` | `AdminCatalog.jsx` | edit services & plans | `admin/resources/{services,plans}` |
| `/admin/pages` | `AdminPages.jsx` | edit CMS content | `admin/resources/pages` |
| `/admin/faqs` | `AdminFaqs.jsx` | manage FAQs | `admin/resources/faqs` |
| `/admin/partners` | `AdminPartners.jsx` | manage partners | `admin/resources/partners` |
| `/admin/settings` | `AdminSettings.jsx` | **global theme + typography + brand CMS** | `admin/settings/{theme,brand}` |
| `/admin/books` | `AdminBooks.jsx` | upload/manage books | `admin/books` |

---

## 6. Deployment plan — Hostinger KVM-2 (Ubuntu)

> **Decisions (user choices):** SSL handled by user (certbot); **local MongoDB** on VPS;
> **PM2** for Node; **instructions-only** (no config files generated). Frontend served by
> nginx; `/api` proxied same-origin to Node → no CORS.

### 6.1 Server prep (one time)
```bash
ssh root@<VPS_IP>
apt update && apt upgrade -y

# Node 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v        # v20+

apt install -y nginx
npm install -g pm2

# Local MongoDB (official repo)
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl enable --now mongod
mongosh --eval "db.runCommand({ping:1})"   # { ok: 1 }

# Firewall (MongoDB stays private)
ufw allow 22/tcp; ufw allow 80/tcp; ufw allow 443/tcp; ufw enable
```
Ensure `/etc/mongod.conf` has `net.bindIp: 127.0.0.1` (default) so Mongo is not public.

### 6.2 Upload code
```bash
# git
cd /var/www && git clone <repo-url> ma-creation
# or scp
scp -r ./backend ./frontend root@<VPS_IP>:/var/www/ma-creation/
```

### 6.3 Backend (Node + PM2)
```bash
cd /var/www/ma-creation/backend && npm install
```
Create `backend/.env` (production requires **all** — `assertProductionEnv` will crash otherwise):
```ini
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
MONGODB_URI=mongodb://127.0.0.1:27017/ma_creation
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_STRING
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```
```bash
npm run seed            # populate catalog/pages/faqs (safe)
pm2 start npm --name ma-api -- start
pm2 save
pm2 startup             # run the printed command to persist reboots
curl http://localhost:5000/api/health   # {...,"status":"ok"}
```

### 6.4 Frontend build
> `VITE_API_URL` is baked in at build time — set before building.
```bash
cd /var/www/ma-creation/frontend
echo 'VITE_API_URL=/api' > .env
npm install && npm run build      # outputs dist/
```

### 6.5 Nginx (user adds SSL via certbot later)
`/etc/nginx/sites-available/ma-creation`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/ma-creation/frontend/dist;
    index index.html;

    client_max_body_size 64m;   # book uploads up to 50MB

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;   # keep Razorpay webhook raw body intact
    }

    location / {
        try_files $uri $uri/ /index.html;   # SPA fallback
    }
}
```
```bash
ln -s /etc/nginx/sites-available/ma-creation /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```
Then user runs SSL, e.g. `certbot --nginx -d yourdomain.com -d www.yourdomain.com`
(certbot wraps the block in HTTPS automatically).

### 6.6 Verify
- Open `https://yourdomain.com` → site + theme render.
- Razorpay webhook URL = `https://yourdomain.com/api/payments/webhook` (secret =
  `RAZORPAY_WEBHOOK_SECRET`).
- Test a plan purchase end-to-end.

### 6.7 Redeploy
```bash
# Frontend
cd /var/www/ma-creation/frontend && npm install && npm run build   # nginx serves immediately
# Backend
cd /var/www/ma-creation/backend && npm install && pm2 restart ma-api
```

---

## 7. Production-readiness audit

### ✅ Already correctly separated / production-shaped
- **Frontend:** no hardcoded backend URLs (all via `VITE_API_URL`, default `/api`);
  theme + SSE use relative `/api`; `dist/` and `.env` gitignored; no secrets in frontend.
- **Backend:** 100% env-driven config (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`,
  `RAZORPAY_*`, `PORT`, `BOOK_MAX_BYTES`); `assertProductionEnv()` forces required vars;
  helmet, CORS via `CLIENT_URL`, rate-limit (600/15min prod), Zod, bcrypt, JWT all present;
  DB connection tuned (pool 2–20, timeouts).
- **Database:** `MONGODB_URI` fully configurable; book PDFs stored in **MongoDB GridFS**
  (not local disk) → survive redeploys; `npm run seed` never touches Users/Payments.

### ⚠️ Still must be set / done before go-live
1. **Real production values** — committed `backend/.env` has DEV/test values
   (`localhost` Mongo, `rzp_test_...` keys, placeholder `JWT_SECRET`,
   `CLIENT_URL=http://localhost:5173`). On the server set: strong `JWT_SECRET`, **live**
   Razorpay keys + webhook secret, `CLIENT_URL=https://yourdomain.com`, prod `MONGODB_URI`.
2. **`.env.example` files missing** (README references them but they don't exist) — doc gap only.
3. **nginx `client_max_body_size`** must be ≥ 50 MB for book uploads (set to `64m` above).
4. **DB backups** not configured — add `mongodump` cron or Atlas backups for prod.
5. (Minor) No explicit MongoDB indexes; not blocking.

---

## 8. Decisions log (this project)
- Deploy target: **Hostinger VPS KVM-2**, Ubuntu.
- SSL: **user-handled** (certbot) — assistant provides plain nginx config.
- Database: **local MongoDB** on the same VPS.
- Node runner: **PM2**.
- Deliverables: assistant generated `docs/architecture.md`, `docs/flow.md`,
  `docs/Pages.md`, and this consolidated `docs/HANDOFF.md` (no files deleted).
- Format preference: **Markdown** (best for AI context reuse).

---

## 9. Quick "new session" onboarding prompt
When starting fresh, paste this:
> "Pehle `docs/HANDOFF.md` padh lo. Ye MA Creation (MERN) project hai — frontend React 19 +
> Vite, backend Express 5 + Mongoose, Razorpay + JWT + SSE. Deploy Hostinger KVM-2 pe
> hone wala hai (nginx + PM2 + local MongoDB, SSL user handle karega). Ab mujhe <task> me
> help chahiye."

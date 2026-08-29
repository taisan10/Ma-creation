# MA Creation — Data & Request Flows

This document traces how data moves through the MA Creation system, from the browser
to MongoDB and back, for every major feature.

---

## 1. Global request lifecycle

```
Browser (React)
  │  fetch via lib/api.js  (Bearer JWT from localStorage)
  ▼
Vite dev server  ── /api proxy ──►  http://localhost:5000
  ▼
Express app.js
  ├─ helmet, cors, rate-limit
  ├─ (Razorpay webhook: raw body preserved)
  ├─ express.json()
  ├─ route router
  │    ├─ validate (Zod)        → 400 on bad input
  │    ├─ authenticate / optionalAuthenticate / requireAdmin
  │    └─ controller (asyncHandler)
  │         └─ Mongoose model  ⇄  MongoDB
  └─ central errorHandler  →  JSON { success:false, message, code }
```

Conventions:
- All responses are JSON `{ success: true, ... }` or an error shape
  `{ success:false, message, code }`.
- `asyncHandler` forwards thrown `AppError`s to `errorHandler`.
- `api()` retries GETs on 408/429/502/503/504 and forces a `/login` redirect on 401.

---

## 2. Authentication flow

**Register**
1. `Login.jsx` posts to `/api/auth/register` (`name, email, phone, company, password, interest`).
2. `authController.register` validates (Zod), hashes password (`bcryptjs`), creates a
   `User` (`role: customer`), signs a JWT, returns `{ token, user }`.
3. `setSession()` stores token + user in `localStorage`; UI navigates to `/`.

**Login**
1. `Login.jsx` posts to `/api/auth/login`.
2. `authController.login` verifies credentials, returns JWT + user.
3. `setSession()` persists; admin role routes to `/admin`, customer to `/`.

**Session reuse**
- Every later `api()` call attaches `Authorization: Bearer <token>`.
- `authenticate` middleware verifies the JWT and sets `req.user`.
- `getUser()` reads the cached user on the client (e.g. `AdminRoute`, `PlansPage`).

---

## 3. CMS / page-content flow

1. Admin edits content in the CMS (Pages admin) →
   `PUT /api/admin/resources/pages` (generic resource router in `admin.js`).
2. `publicController.getPage` serves it: `GET /api/public/pages/:slug`
   (`slug` ∈ `home, about, services, plans`, `published: true`).
3. Page orchestrators call `api('/public/pages/<slug>')` and pass `cms.content` into
   each section component as the `cms` prop.
4. On any settings save, the backend broadcasts a `cms:updated` SSE event; the
   `LiveUpdatesContext` bumps `revision`, prompting subscribers to refetch.

Fallback: sections render safe defaults when `cms` fields are missing (no crash on
empty MongoDB content).

---

## 4. Global theme CMS flow

```
Admin (AdminSettings.jsx)
  │  GET  /api/admin/settings/theme , /brand
  │  PUT  /api/admin/settings/theme   { value: { ...colors, fontFamily, sectionFonts } }
  │  PUT  /api/admin/settings/brand    { value: {...} }
  ▼
adminController.upsertSetting  →  SiteSettings (key 'theme' | 'brand')
  │
  │  broadcasts cms:updated (SSE)
  ▼
Public site
  │  GET /api/public/settings/theme  (allowed keys: theme, brand)
  │  useTheme() resolves tokens → CSS variables
  ▼
Header, buttons, cards, forms, admin, 3D scenes, status badges all read the same tokens.
```

- "Quick colour" (`applyQuick`) previews one HEX/RGB across the brand palette locally;
  only "Save Theme" persists via `PUT`.
- `normalizeColor`/`normalizeFontFamily` coerce inputs to HEX / CSS stacks.

---

## 5. Catalog (services & plans) flow

1. Seed populates `Service` (categories `registration|oem|addon`) and `Plan`
   (categories `training|service|...`) in MongoDB.
2. Public reads:
   - `GET /api/catalog/services` → `catalogController.listServices`
   - `GET /api/catalog/plans` → `catalogController.listPlans`
3. `ServicesPage` splits services by category and renders `ServiceCatalogSection`,
   `ServicePillarsSection`, `ServiceDocumentsSection`.
4. `PlansPage` splits plans by category (`training` vs `service`) and renders
   `ServicePackagesSection` / `TrainingPackagesSection`.

---

## 6. Payment (Razorpay checkout) flow

```
PlansPage → PurchaseButton
  │  POST /api/payments/order  { planId, name, email, phone, company }
  │    (optionalAuthenticate — works for guests AND logged-in users)
  ▼
paymentController.createOrder
  ├─ loads Plan (active)
  ├─ duplicate check: paid Payment for same plan + (user OR email) → 409
  ├─ Razorpay orders.create(amount=price*100 INR)
  ├─ creates Payment { status:'created', razorpayOrderId }
  └─ returns { keyId, order, paymentId, plan }
  │
  ▼  Browser opens Razorpay modal (keyId + order)
  │
  ├─ SUCCESS ─► POST /api/payments/verify { razorpay_order_id, payment_id, signature }
  │              HMAC-SHA256 verify → Payment.status='paid' (populated plan)
  │
  ├─ FAILURE ─► POST /api/payments/failed { razorpay_order_id }
  │              Payment.status='failed'
  │
  └─ WEBHOOK ─► POST /api/payments/webhook (raw body, x-razorpay-signature)
                HMAC verify → payment.captured / payment.failed
```

**Customer history**
- `GET /api/payments/mine` (`authenticate`) returns the user's paid payments.
- It also links historical **guest** purchases made with the same verified email
  (`user: null, email: user.email`) back to the account.
- `AccountPage` caches `/payments/mine` in `sessionStorage` (per-user key) to avoid the
  earlier 429 request-loop bug; it creates the cache once per navigation.

---

## 7. Leads (demo / callback) flow

1. `DemoForm` (Home) or a callback form posts to `/api/leads` with
   `type: 'demo' | 'callback'` plus contact/business fields.
2. `leadRateLimit` (10/15min) + Zod validation run first.
3. `leadController.createLead` stores a `Lead`.
4. Admin opens `/admin/leads` → `GET /api/admin/leads` (`requireAdmin`); can
   `PATCH` status (`new|contacted|closed`) or `DELETE`.

---

## 8. Book library flow

- **Admin upload**: `POST /api/admin/books/upload` (multipart via `multipartBook.js`)
  → `bookController.uploadBook` stores `Book` + cover.
- **Admin manage**: list/update/delete under `/api/admin/books`.
- **Public read**: `GET /api/public/books` (metadata), `/:id/read`, `/:id/download`.
- `AdminBooks.jsx` is the admin UI; public consumption is surfaced through the catalog
  / training areas.

---

## 9. Real-time (SSE) flow

```
Backend                                   Frontend
services/realtime.js                      lib/realtime.js
  maintains Set of res objects  ◄── SSE ──  EventSource('/api/public/events')
  addRealtimeClient(res)                   subscribeToLiveUpdates(cb)
                                           │
Admin saves theme/CMS ──► broadcast('cms:updated', detail)
                                           │
                                           ▼
                                  LiveUpdatesContext revision++
                                  → subscribers refetch / re-render
```

- `publicController.events` sets `text/event-stream`, sends `: connected`, and registers
  the response.
- Reconnect uses exponential backoff (1s → 30s, max 20 attempts) when the connection drops.

---

## 10. Seed flow

```
npm run seed  →  backend/src/seed/seed.js
  ├─ connects to MongoDB
  ├─ (re)creates Service, Plan, Page, FAQ collections
  └─ does NOT touch User or Payment
```

Run it only when you intend to reset catalog/page/faq content.

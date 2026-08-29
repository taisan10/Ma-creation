# MA Creation — Architecture

A full-stack MERN application for **MA Creation**, a GeM (Government e-Marketplace)
consultancy. The product is a marketing + client-portal website with a database-backed
global theme CMS, a live service/plan catalog, Razorpay checkout, a leads pipeline,
a book library, and a role-protected admin CMS.

The repository is a **two-process monorepo**: an Express/Mongoose API and a Vite/React SPA.

---

## 1. Technology stack

| Layer        | Choice |
|--------------|--------|
| Frontend     | React 19, React Router 6, Vite 5, Tailwind CSS 3 |
| 3D           | `@react-three/fiber` 9, `three` 0.177, `@react-three/drei` 10 |
| UI primitives| Local shadcn-style components (`class-variance-authority`, `clsx`, `tailwind-merge`), `lucide-react` icons |
| Backend      | Node 20+, Express 5 (ESM), Mongoose 8 |
| Database     | MongoDB (via Mongoose) |
| Auth         | JWT (`jsonwebtoken`) in `localStorage`, bcrypt password hashing (`bcryptjs`) |
| Validation   | Zod (request schemas in route files) |
| Payments     | Razorpay (orders, verify, webhook, failed) |
| Security     | Helmet, CORS (origin = `CLIENT_URL`), `express-rate-limit` |
| Real-time    | Server-Sent Events (SSE) for live CMS/theme updates |

---

## 2. Repository layout

```
MA-Creation/
├── backend/                 # Express API (src/)
│   └── src/
│       ├── server.js        # boots app.js + connects DB
│       ├── app.js           # middleware chain + route mounting
│       ├── config/          # db.js (mongoose), env.js (dotenv + assert)
│       ├── routes/          # express routers (auth, leads, catalog, payments, public, admin, books)
│       ├── controllers/     # request handlers
│       ├── models/          # Mongoose schemas
│       ├── middleware/      # auth, validate, error, multipartBook
│       ├── services/        # realtime.js (SSE), token.js
│       ├── utils/           # AppError, asyncHandler
│       └── seed/seed.js     # seeds services, plans, pages, faqs (not users/payments)
├── frontend/                # Vite SPA (src/)
│   └── src/
│       ├── main.jsx         # React root
│       ├── App.jsx          # providers (LiveUpdates)
│       ├── routes/AppRoutes.jsx  # single source of truth for routes
│       ├── pages/           # route components + per-feature folders
│       ├── components/      # ui/, three/, admin/, shared
│       ├── context/         # LiveUpdatesContext
│       ├── lib/             # api.js, realtime.js, printReceipt.js, utils.js
│       └── theme.js         # useTheme() token hook (frontend)
└── docs/                    # this documentation set
```

---

## 3. Frontend architecture

### 3.1 Render pipeline
`main.jsx` → `App.jsx` (wraps app in `LiveUpdatesProvider`) → `AppRoutes.jsx`
→ a **page** component → page **orchestrator** (`HomePage`, `AboutPage`, …) →
**section** components under `pages/<feature>/sections/`.

### 3.2 Page / section pattern
Each public feature follows the same rule used across the app:
- The page file (`pages/Home.jsx`, etc.) is a thin re-export of the orchestrator
  (`pages/home/HomePage.jsx`).
- The **orchestrator** owns all `api()` data fetching and holds state, then renders
  one component per visual section.
- **Section components** are pure presentational units receiving `cms` / data via props.

This keeps API logic out of JSX and makes sections easy to compose.

### 3.3 Component layers
- `components/ui/` — `Button`, `Card`, `Input`, `Textarea` (shadcn-style, local source).
- `components/three/` — R3F scenes: `ThreeHero`, `ThreeCaseFile`, `Industry3DCard`,
  `Journey3D`, `Stat3DIcon` (all respect `prefers-reduced-motion`).
- `components/admin/AdminShell.jsx` — shared admin layout/nav.
- Shared: `Header`, `Footer`, `DemoForm`, `Accordion`, `Tabs`, `CountUp`, `Seal`,
  `CheckoutInfoModal`, `ScrollToHash`, `ErrorBoundary`.

### 3.4 State & data access
- `lib/api.js` — `api(path, options)` fetch wrapper. Reads JWT from
  `localStorage` (`mac_token`), attaches `Authorization: Bearer`, auto-retries
  retryable statuses (408/429/502/503/504), and on `401` clears the session and
  redirects to `/login`. Session helpers: `setSession`, `clearSession`, `getUser`.
- `lib/realtime.js` — opens an `EventSource` to `/api/public/events` and dispatches
  `cms:updated` events; reconnects with exponential backoff.
- `context/LiveUpdatesContext.jsx` — exposes `revision`/`lastUpdate` so any component
  can react to admin CMS edits without a manual refresh.
- `theme.js` — `useTheme()` returns the resolved token object (from `/theme` settings),
  with `DEFAULT_THEME`, `THEME_LABELS`, color/font normalization helpers.

### 3.5 Routing & auth guarding
`AppRoutes.jsx` defines every route. Admin routes are wrapped in `AdminRoute`, which
reads `getUser()` and redirects non-admins to `/login`. Public routes are open.

---

## 4. Backend architecture

### 4.1 Middleware chain (`app.js`)
1. `helmet()` — security headers.
2. `cors({ origin: env.clientUrl, credentials: true })`.
3. `rateLimit` — 600 req/15min in production, 100k in dev; SSE `/api/public/events`
   is excluded from the limiter.
4. Razorpay webhook route mounted **before** `express.json()` so the raw body is
   preserved for signature verification (`req.rawBody`).
5. `express.json({ limit: '1mb' })`.
6. `/api/health` — returns DB connection status.
7. Route mounting (see §4.3).
8. Central `errorHandler`.

### 4.2 Controllers / models / middleware
- **Controllers**: `auth`, `lead`, `catalog`, `payment`, `public`, `admin`, `book`.
- **Middleware**: `auth.js` (`authenticate`, `optionalAuthenticate`, `requireAdmin`),
  `validate.js` (Zod), `error.js` (central handler), `multipartBook.js` (book uploads).
- **Models**: `User`, `Payment`, `Plan`, `Service`, `Page`, `FAQ`, `Lead`, `Partner`,
  `Book`, `SiteSettings`.
- **Services**: `realtime.js` (SSE client registry), `token.js` (JWT sign/verify).
- **Utils**: `AppError`, `asyncHandler` (wraps controllers so async errors reach the
  error handler).

### 4.3 Route map
| Mount                | Router        | Auth | Notes |
|----------------------|---------------|------|-------|
| `/api/auth`          | auth.js       | none / `authenticate` | register, login, `me` |
| `/api/leads`         | leads.js      | `authenticate,requireAdmin` for list | POST is rate-limited (10/15min) |
| `/api/catalog`       | catalog.js    | none | list services, list plans |
| `/api/payments`      | payments.js   | `optionalAuthenticate` / `authenticate` | order, verify, failed, `mine` |
| `/api/public`        | public.js     | none | pages, faqs, partners, settings, **events (SSE)** |
| `/api/public/books`  | books.js (public) | none | read/download book |
| `/api/admin`         | admin.js      | `authenticate,requireAdmin` | dashboard, users, leads, payments, generic resources, settings |
| `/api/admin/books`   | books.js (admin) | `authenticate,requireAdmin` | upload/list/update/delete book |

### 4.4 Data model summary
- **User** — `name, email, phone, company, passwordHash, role(customer|admin), interest`.
- **Plan** — `name, price, billing, duration, category(training|service|...), features[], active`.
- **Service** — `name, category(registration|oem|addon), price, description, active`.
- **Page** — CMS content keyed by `slug` (`home`, `about`, `services`, `plans`), `content`, `published`.
- **FAQ / Partner** — ordered, `active`-flagged lists.
- **Lead** — demo/callback submissions (`type`, contact + business fields, `status`).
- **Payment** — Razorpay order/payment ids, `amount`, `status(created|paid|failed)`,
  links to `user` and `plan`.
- **Book** — uploaded document with `coverImageUrl`, `active`.
- **SiteSettings** — keyed store (`theme`, `brand`) powering the global theme CMS.

---

## 5. Cross-cutting systems

### 5.1 Authentication & roles
JWT issued at `/api/auth/login` (and `/register`). The token is stored in
`localStorage` and sent as a Bearer header. `authenticate` populates `req.user`;
`requireAdmin` restricts admin routes. The frontend mirrors this with `AdminRoute`
and `getUser()`.

### 5.2 Global theme CMS
Theme + brand live in `SiteSettings` (`theme`, `brand` keys). Admin edits them via
`PUT /api/admin/settings/:key`; the public site reads them via
`GET /api/public/settings/:key` and `useTheme()`. A saved change emits a
`cms:updated` SSE event and connected visitors update instantly.

### 5.3 Real-time updates
`GET /api/public/events` is an SSE stream. `services/realtime.js` keeps a registry of
connected responses; `setTheme`/CMS edits broadcast `cms:updated`. The frontend
`realtime.js` + `LiveUpdatesContext` subscribe automatically.

### 5.4 Payments (Razorpay)
Guest-friendly checkout: `optionalAuthenticate` keeps purchases linked to a logged-in
user when available. Prevents duplicate purchases (by user **or** email). Verification
happens both client-side (`/verify`) and server-side via the `/webhook` signature check.

### 5.5 Seeding
`npm run seed` reseeds `Service`, `Plan`, `Page`, and `FAQ` collections only.
`User` and `Payment` records are **never** deleted by the seed script.

---

## 6. Environments & config
- Backend: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`,
  `NODE_ENV`. Production env is asserted on boot (`assertProductionEnv`).
- Frontend: `VITE_API_URL` (defaults to `/api`, proxied by Vite to port 5000).
- `.env` is git-ignored; only `.env.example` is committed.

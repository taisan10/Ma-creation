# MA Creation — Pages & Routes

A complete inventory of every route in the application, with its file location,
purpose, the data it fetches, and its composed sections.

Routes are defined in `frontend/src/routes/AppRoutes.jsx`. Page files under
`frontend/src/pages/` are thin re-exports of orchestrators in
`pages/<feature>/<Feature>Page.jsx`, which own data fetching and render section
components from `pages/<feature>/sections/`.

Legend: **Public** = open route · **Admin** = `AdminRoute`-guarded (`requireAdmin`).

---

## 1. Public pages

### `/` — Home
- **File**: `pages/Home.jsx` → `pages/home/HomePage.jsx`
- **Data**: `GET /api/public/pages/home`, `GET /api/public/faqs` (fallback to local `./data`).
- **Purpose**: Primary marketing landing page.
- **Sections** (`pages/home/sections/`): `HeroSection`, `GemOverviewSection`,
  `FeaturedIndustriesSection`, `ServicesOverviewSection`, `CertificationsSection`,
  `WhyChooseGemSection`, `DemoSection`, `CaseFileSummarySection`, `IndustriesSection`,
  `DocumentationSection`, `PartnersSection`, `TrainingHubSection`,
  `TestimonialsSection`, `FaqSection`, `CtaBandSection`.
- **3D**: `ThreeHero` / `ThreeCaseFile` / `Industry3DCard` / `Stat3DIcon` (via sections).

### `/about` — About
- **File**: `pages/About.jsx` → `pages/about/AboutPage.jsx`
- **Data**: `GET /api/public/pages/about`.
- **Purpose**: Company story, mission, capabilities, outcomes.
- **Sections** (`pages/about/sections/`): `AboutHeroSection`, `StorySection`,
  `FounderSection`, `MissionVisionSection`, `WhyDifferentSection`,
  `HowWeWorkSection`, `CapabilityMapSection`, `ClientOutcomesSection`,
  `GemJourneySection`, `AiAdvantageSection`, `AiRoadmapSection`,
  `CertificationsCtaSection`.

### `/services` — Services
- **File**: `pages/Services.jsx` → `pages/services/ServicesPage.jsx`
- **Data**: `GET /api/public/pages/services`, `GET /api/catalog/services`,
  `GET /api/catalog/plans`.
- **Purpose**: Live GeM service catalog (registration, OEM, add-ons) + packages.
- **Sections** (`pages/services/sections/`): `ServiceHero`, `ServiceCatalogSection`
  (splits services by `registration`/`oem`/`addon` + `service` plans),
  `ServicePillarsSection`, `ServiceDocumentsSection`.
- **Resilience**: catalog load errors render a non-blocking warning; page content
  still renders from CMS fallback.

### `/plans` — Plans & Pricing
- **File**: `pages/Plans.jsx` → `pages/plans/PlansPage.jsx`
- **Data**: `GET /api/catalog/plans`, `GET /api/public/pages/plans`,
  `GET /api/payments/mine` (only when logged in, to mark owned plans).
- **Purpose**: Pricing for service + training plans with Razorpay checkout.
- **Sections** (`pages/plans/sections/`): `PlansHero`, `RetainerSection`,
  `PlanGridSection`/`ServicePackagesSection`, `TrainingPackagesSection`,
  `TrustBuilderSection`, `PaymentFaqSection`. Components: `PlanCard`, `PurchaseButton`.
- **Behaviour**: `purchasedByPlan` map greys out already-owned plans for the user.

### `/login` — Login / Register
- **File**: `pages/Login.jsx`
- **Data**: `POST /api/auth/login`, `POST /api/auth/register`.
- **Purpose**: Client portal authentication. Tabbed login/register; on success
  `setSession()` then navigate (`/admin` for admins, `/` for customers).

### `/account` — Account
- **File**: `pages/Account.jsx` → `pages/account/AccountPage.jsx`
- **Data**: `GET /api/payments/mine` (cached per-user in `sessionStorage`); reads user
  from `getUser()`.
- **Purpose**: Customer dashboard — purchased plans, totals, support.
- **Sections** (`pages/account/sections/`): `AccountHeader` (logout), `AccountSummary`
  (paid-total computed in INR), `PurchaseCard`, `AccountSupport`.
- **Guard**: redirects to `/login` if no user.

### `/theme` — Design System
- **File**: `pages/Theme.jsx`
- **Data**: `useTheme()` (resolves `GET /api/public/settings/theme`).
- **Purpose**: Public showcase of the global colour system + typography tokens.

### `/policies` — Policies
- **File**: `pages/Policies.jsx`
- **Purpose**: Static legal/policy content page.

### `*` — Not Found
- **File**: `pages/NotFound.jsx`
- **Purpose**: Catch-all 404 route.

---

## 2. Admin pages (`/admin/*`, all `AdminRoute`-guarded)

All admin screens share `components/admin/AdminShell.jsx` for layout/nav and call the
`/api/admin/*` endpoints (all behind `authenticate, requireAdmin`).

| Route | Component file | Purpose | Primary endpoint(s) |
|-------|---------------|---------|---------------------|
| `/admin` | `pages/admin/AdminDashboard.jsx` | Overview stats + quick actions | `GET /api/admin/dashboard` |
| `/admin/users` | `pages/admin/AdminUsers.jsx` | Manage customers/admins | `GET/PATCH/DELETE /api/admin/users` |
| `/admin/leads` | `pages/admin/AdminLeads.jsx` | Review demo/callback leads | `GET /api/admin/leads`, `PATCH/DELETE /api/admin/leads/:id` |
| `/admin/payments` | `pages/admin/AdminPayments.jsx` | Payment records | `GET /api/admin/payments` |
| `/admin/catalog` | `pages/admin/AdminCatalog.jsx` | Edit services & plans | `GET/POST/PATCH/DELETE /api/admin/resources/{services,plans}` |
| `/admin/pages` | `pages/admin/AdminPages.jsx` | Edit CMS page content | `GET/POST/PATCH/DELETE /api/admin/resources/pages` |
| `/admin/faqs` | `pages/admin/AdminFaqs.jsx` | Manage FAQ entries | `GET/POST/PATCH/DELETE /api/admin/resources/faqs` |
| `/admin/partners` | `pages/admin/AdminPartners.jsx` | Manage partner logos | `GET/POST/PATCH/DELETE /api/admin/resources/partners` |
| `/admin/settings` | `pages/admin/AdminSettings.jsx` | **Global theme + typography + brand CMS** | `GET/PUT /api/admin/settings/{theme,brand}` |
| `/admin/books` | `pages/admin/AdminBooks.jsx` | Upload/manage book library | `GET/POST /api/admin/books`, `PATCH/DELETE /api/admin/books/:id` |

### AdminSettings detail
`pages/admin/AdminSettings.jsx` is the most feature-rich admin screen:
- Typography: one global `fontFamily` + per-section overrides (`sectionFonts`).
- Quick colour: paste one HEX/RGB and "Apply to all" previews the brand palette.
- Section map: shows exactly which colour tokens each public section consumes.
- Persists via `PUT /api/admin/settings/theme` and `PUT /api/admin/settings/brand`;
  connected visitors update instantly through the SSE `cms:updated` event.
- Reuses `components/admin/components/`: `CmsFieldEditor`, `CmsPageSelector`,
  `DashboardQuickActions`, `DashboardStats`.

---

## 3. Page ↔ API quick reference

| Page | Reads | Writes |
|------|-------|--------|
| Home | `public/pages/home`, `public/faqs` | — |
| About | `public/pages/about` | — |
| Services | `public/pages/services`, `catalog/services`, `catalog/plans` | — |
| Plans | `catalog/plans`, `public/pages/plans`, `payments/mine` | `payments/order`, `payments/verify` (via Razorpay) |
| Login | — | `auth/login`, `auth/register` |
| Account | `payments/mine` | — (logout clears session) |
| Theme | `public/settings/theme` | — |
| Admin (all) | `admin/*` | `admin/*` (resources, settings, users, leads, payments, books) |

---

## 4. Conventions enforced across pages
- API calls live in orchestrators or `lib/api.js`, never buried in deep JSX.
- Visual blocks live in their own `sections/` file.
- Reusable UI lives in `components/ui` / `components/three` / `components/admin`.
- Route definitions stay in `routes/AppRoutes.jsx` only.
- CMS content falls back safely when MongoDB fields are missing.

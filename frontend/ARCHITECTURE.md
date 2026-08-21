# MA Creation Frontend Architecture

## Entry flow

`main.jsx` → `App.jsx` → `AppRoutes.jsx` → page orchestrator → section components.

## Public pages

- `pages/home/HomePage.jsx` — data fetching + section composition only.
- `pages/home/sections/*` — one component per Home section.
- `pages/about/AboutPage.jsx` — data fetching + section composition only.
- `pages/about/sections/*` — one component per About section.
- `pages/services/ServicesPage.jsx` — catalog fetching + composition.
- `pages/services/sections/*` — hero, catalog, pillars, documentation.
- `pages/plans/PlansPage.jsx` — catalog fetching + composition.
- `pages/plans/sections/*` — hero, retainer, package grids, trust, FAQ, purchase flow.
- `pages/account/AccountPage.jsx` — account data fetching + composition.
- `pages/account/sections/*` — header, summary, purchase card, support.

## Admin

Admin screens remain isolated under `pages/admin/` and are protected centrally by `AdminRoute` in `routes/AppRoutes.jsx`.

## Rules for future work

1. Keep API calls in page orchestrators or dedicated hooks/services.
2. Keep visual sections in their own files.
3. Keep reusable UI in `components/`.
4. Keep route definitions in `routes/AppRoutes.jsx`.
5. Do not put large JSX sections into `App.jsx`.
6. CMS fallback content should remain safe when MongoDB fields are missing.

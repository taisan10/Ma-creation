# MA Creation — Production-Oriented Refactor

## What changed

### Frontend
- `App.jsx` is now a small application shell.
- Routing moved to `frontend/src/routes/AppRoutes.jsx`.
- Home is split into one component per section under `frontend/src/pages/home/sections/`.
- About is split into one component per section under `frontend/src/pages/about/sections/`.
- Services is split into hero, catalog, pillars and documentation sections.
- Plans is split into hero, retainer comparison, service/training package grids, trust builder, FAQ and purchase flow.
- My Account is split into header, summary, purchase card and support sections.
- Admin dashboard and CMS editor are split into reusable admin components.
- Fixed the About AI section `SearchCheck is not defined` runtime error by explicitly importing `SearchCheck`.

### Backend
- `backend/src/server.js` is now only the process/bootstrap entry point.
- Express configuration, middleware, webhook handling and route registration moved to `backend/src/app.js`.
- Existing controllers/routes/models/services remain separated by responsibility.

### Existing functionality preserved
- Global theme/CMS
- Home/About CMS
- Services and plans catalog
- Razorpay order + verification flow
- Client purchase history
- Admin dashboard/CMS/catalog/payments/users
- 3D Journey and industry components
- `.env.example` files and root `.gitignore`

## Verification

- Backend JavaScript syntax was checked with `node --check` for the refactored app/server and payment/admin controllers.
- A full Vite production build could not be executed in this environment because the supplied dependency tree contains an incomplete Vite installation and the environment cannot download missing packages from npm. Run `npm install` in `frontend` on the development machine, then `npm run build`.

# MA Creation — Stability & Data Persistence Fix

## Root cause found

The main `429` bug was in `frontend/src/pages/account/AccountPage.jsx`.

The account data loader depended on the entire `user` object:

- `/payments/mine` returned a fresh `user` object.
- The component called `setUser(data.user)`.
- React saw a new object reference and ran the effect again.
- The request repeated continuously.
- The backend rate limiter eventually returned `429`.
- The component then showed an empty purchase list, making it look as if MongoDB data had disappeared.

## Fixes included

- Account purchase loader now runs once per account-page mount instead of depending on the mutable user object.
- Latest successful purchase data is cached in `sessionStorage` as a temporary UI fallback during a transient API failure.
- User profile returned by the API is persisted back to the existing session.
- API GET requests now have a small retry for transient `408/429/502/503/504` responses and network failures.
- Vite/EventSource now consistently use the same `/api` origin, so port changes and CORS do not create a second API path.
- The whole React route tree is no longer remounted for every CMS live-update event. Only Header/Footer are remounted for brand refreshes; Theme refreshes only when the theme setting changes.
- Development rate limiting is disabled. Production keeps a protective rate limiter.
- Backend MongoDB connection uses explicit timeouts and pool settings.
- Backend has graceful SIGINT/SIGTERM shutdown and clearer startup diagnostics.
- `/api/health` now reports whether MongoDB is actually connected.
- Vite `strictPort: true` prevents multiple dev servers from silently moving from 5173 to 5174.
- Added `.env.example` files and local troubleshooting documentation.

## Data safety

Restarting Node/Vite does not delete MongoDB records. The seed script intentionally replaces only the service, plan, page and FAQ seed collections. It does not delete users or payments.

## Verification

- All backend source `.js` files pass `node --check`.
- Backend/frontend package JSON files parse successfully.
- The old Account dependency pattern and hard-coded frontend EventSource API URL were checked and are no longer present.
- A clean frontend `npm install`/Vite build could not be completed in the sandbox because npm dependency installation timed out; run `npm install` and `npm run build` locally after extracting this package.

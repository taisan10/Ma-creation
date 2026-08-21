# MA Creation — MERN Full-Stack Website (Theme CMS + 3D)

This build updates the supplied MA Creation source into a MERN application with a database-backed global theme editor, responsive layouts, shadcn-style UI primitives, and React Three Fiber 3D sections.

## Added in this build

### 1. Dynamic global theme CMS
- Admin: `/admin/settings`
- Public design-system page: `/theme`
- Theme is stored in MongoDB under `SiteSettings` key `theme`.
- Admin can paste:
  - `#5B4FE0`
  - `#5B4FE`
  - `rgb(91,79,224)`
  - `rgba(91,79,224,.9)`
- **Apply to all** updates the main brand/status palette in one click.
- Individual theme tokens can also be edited with a colour picker or text input.
- Public website, admin dashboard, buttons, cards, forms, status badges, gradients and 3D scenes use the same CSS token system.

### 2. 3D homepage
- 3D case-file summary with animated folder/document scene.
- Animated 3D industry cards for:
  - Manufacturing
  - Healthcare
  - IT & Digital
  - Business Services
- Uses `@react-three/fiber`, `three` and `@react-three/drei` already declared in the frontend.
- Respects `prefers-reduced-motion` at the CSS level.

### 3. Responsive UI
The layout uses responsive Tailwind breakpoints and small-screen rules for:
- Android/iPhone phones
- Samsung Fold-style narrow screens
- Tablets
- Laptops/desktops
- Large screens

### 4. Supplied logo
The uploaded MA Creation logo is now used as `frontend/public/logo.jpg`.

### 5. shadcn-style component layer
Reusable components are kept under `frontend/src/components/ui/`:
- `Button`
- `Card`
- `Input`
- existing `Textarea`

The project uses the shadcn approach: components are local source code, not a runtime UI dependency.

## Run locally

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` if the API is not running on `http://localhost:5000/api`.

## Local development — important

This project has two processes: MongoDB + the Express API, and Vite. Start the API before opening the frontend.

### Terminal 1 — backend

```bash
cd backend
npm install
npm run dev
```

The API must report `API running on http://localhost:5000`. Check `http://localhost:5000/api/health`; it should return database status `ok`.

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend intentionally uses `/api` and Vite proxies it to port 5000. Do not start multiple Vite instances. The dev server now uses `strictPort: true` so a second process cannot silently move to 5174 and create confusing API/CORS behaviour.

### If the browser shows `ECONNREFUSED`

That means the Express backend is not listening on port 5000. It is not a React rendering error. Start `backend` and verify `/api/health`.

### If the browser shows `429`

The previous Account page had an effect dependency bug: after `/payments/mine` returned a user object, it stored a new object in state, which retriggered the same effect indefinitely. That request loop eventually exhausted the rate limiter. The Account page now loads once per navigation, and successful purchase data is cached for the current browser session as a temporary fallback. Development rate limiting is also disabled; production keeps the limiter.

### Data safety

Restarting the Express or Vite process does not delete MongoDB data. The seed script is the operation that intentionally replaces the service, plan, page and FAQ seed collections. Do not run `npm run seed` unless you intend to reseed those collections. Payment and user records are not deleted by the seed script.

## Theme workflow

1. Login as an admin.
2. Open **Admin → Site Settings**.
3. Paste a HEX/RGB colour in **Quick colour**.
4. Click **Apply to all**.
5. Review the individual token values.
6. Click **Save Theme**.
7. Open `/theme` to see the complete public colour system.

The backend endpoint is:
- `GET /api/public/settings/theme`
- `GET /api/admin/settings/theme`
- `PUT /api/admin/settings/theme`

## Important deployment notes

- Configure MongoDB and the backend `.env` before production use.
- Configure Razorpay keys if online checkout is enabled.
- Use a production `JWT_SECRET` and admin seed password.
- Set the correct frontend URL in the backend CORS configuration.

## Local environment setup

Create the environment files from the examples before running the app:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

In a second terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

The frontend uses `VITE_API_URL` and defaults to `http://localhost:5000/api`. The backend uses `CLIENT_URL` for CORS and `MONGODB_URI` for MongoDB.

Never commit `.env` to Git. Only `.env.example` should be committed.

# MA Creation — React + Vite + Express + MongoDB + Razorpay

Rebuilt from the supplied MA Creation React prototype and the two supplied design/pricing references.

## Stack

- Frontend: React 18, Vite, React Router, Tailwind CSS, shadcn-style UI primitives
- 3D: animated 3D hero surface with a dependency-free fallback; package declarations include `three`, `@react-three/fiber`, and `@react-three/drei` for the WebGL scene upgrade
- Backend: Node.js, Express REST API, JWT auth, Helmet, rate limiting, Zod validation
- Database: MongoDB + Mongoose
- Payments: Razorpay order creation, checkout, signature verification, webhook handler

## Project structure

```text
src/
  components/
    ui/              # shadcn-style primitives
    three/           # 3D hero surface
  data/
  lib/api.js
  pages/
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
    seed/
```

## Local setup

### Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

`VITE_API_URL` defaults to `http://localhost:5000/api`.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Run MongoDB locally or use MongoDB Atlas. The default local database is `ma_creation`.

### Razorpay test mode

Put your Razorpay **Test Mode** credentials in `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Configure the Razorpay webhook endpoint as:

```text
https://YOUR-BACKEND-DOMAIN/api/payments/webhook
```

For local development, expose port 5000 through a secure tunnel before registering a webhook.

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/leads`
- `GET /api/leads` (admin JWT)
- `GET /api/catalog/services`
- `GET /api/catalog/plans`
- `POST /api/payments/order` (JWT)
- `POST /api/payments/verify` (JWT)
- `POST /api/payments/webhook`

## Important launch checks

The supplied PDFs contain placeholder contact details and several figures marked `XXXX`/`XXXXX`, and the design reference asks for founder/training-space/client assets that were not supplied. Replace those before production. Legal policy text should also receive final legal review.

The sandbox could not install new npm packages because external npm access timed out, and the uploaded `node_modules` was built for Windows while this verification environment is Linux. Therefore the source was updated and backend syntax was checked, but a clean dependency install, browser test, live MongoDB test, and live Razorpay checkout could not be completed here. Run `npm install` on the target machine before final browser/payment QA.

## Admin CMS

The rebuild now includes a JWT-protected admin console at `/admin`.

### Admin capabilities
- Dashboard metrics
- User list, role promotion/demotion, deletion
- Demo/callback lead management and status updates
- Razorpay payment records
- CRUD for Services and Plans
- CMS editing for Home, About, Services, Plans and Policies pages
- FAQ CRUD
- Partner/client logo CRUD
- Global brand/contact settings

### Admin seed account
The seed creates an admin only if one does not already exist:

- Email: `admin@macreation.in`
- Password: `ADMIN_SEED_PASSWORD` from backend `.env`
- Development fallback if omitted: `ChangeMe@12345`

Change the seed password before production use.

### CMS flow
Public pages read content from:
- `GET /api/public/pages/:slug`
- `GET /api/public/faqs`
- `GET /api/public/settings/:key`

Admin writes content through `/api/admin/*`, protected by both JWT authentication and the `admin` role.


## API / proxy

Local Vite requests use `/api` and are proxied to `http://localhost:5000`. Start the backend first. `ECONNREFUSED` means the backend is not listening; `429` previously came from an Account-page request loop and has been fixed.

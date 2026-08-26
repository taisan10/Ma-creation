# MA Creation API

Node.js + Express + MongoDB API for authentication, demo/callback leads, catalog data and Razorpay payments.

## Run

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

Required `.env`: `MONGODB_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CLIENT_URL`.

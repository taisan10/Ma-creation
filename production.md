# ⏳ Pending for Production (VPS Deployment)

VPS par deploy karte waqt sirf ye cheezein update aur run karni hain:

---

### 1. Production `.env` me Secrets Update karna:

- [ ] **`ADMIN_PASSWORD`** ➡️ `Admin@12345` ko badal kar apna strong production password rakhein.
- [ ] **`RAZORPAY_KEY_ID`** ➡️ Test key (`rzp_test_...`) ko badal kar apni live key (`rzp_live_...`) daalein.
- [ ] **`RAZORPAY_KEY_SECRET`** ➡️ Razorpay live secret key paste karein.
- [ ] **`RAZORPAY_WEBHOOK_SECRET`** ➡️ Strong random string banayein aur use Razorpay dashboard me bhi enter karein.
- [ ] **`MINIO_ROOT_PASSWORD` / `MINIO_SECRET_KEY`** ➡️ `devpassword@$123` ko badal kar random 32-character secret banayein.
- [ ] **`NODE_ENV`** ➡️ `development` se badal kar `production` karein.
- [ ] **`APP_DOMAIN` / `CLIENT_URL`** ➡️ `localhost` se badal kar apna real domain (jaise `https://macreation.in`) karein.

---

### 2. VPS par First-Time Commands:

VPS par container start karne ke baad ye 2 commands terminal me chalani hain:

```bash
# 1. Database me Plans aur Categories seed karne ke liye:
docker compose exec backend npm run seed

# 2. Database me high-speed indexes lagane ke liye:
docker compose exec backend npm run db:indexes
```

---

### 3. Development Tunnels (`pinggy` / `trycloudflare`) Restrict karna:

Mobile app / Flutter testing ke baad, production me tunnels ko restrict karna:

- [ ] **Point 1: [backend/src/services/video.service.js](file:///c:/Users/Asus/Downloads/MA-Creation(update26)/backend/src/services/video.service.js#L95-L98) (Line 95-98)**  
  DRM Key delivery me `origin.includes('pinggy')` aur `origin.includes('trycloudflare')` ko production me disable karein taaki sirf official domain (`env.clientUrl`) par hi key deliver ho.

- [ ] **Point 2: [backend/src/app.js](file:///c:/Users/Asus/Downloads/MA-Creation(update26)/backend/src/app.js#L59) (Line 59)**  
  CORS origin allowlist me se `pinggy` aur `trycloudflare` ko production me block karein taaki bahar se koi unauthorized domain API access na kar sake.

---

### 4. MinIO Web Console Security (Caddy HTTPS Reverse Proxy):

- [ ] **MinIO Ports Host Binding:** `docker-compose.yml` me MinIO ke raw ports (`9000:9000`, `9001:9001`) ko public IP par expose na karein.
- [ ] **Caddy Subdomain (Enterprise Pattern):** `Caddyfile` ke zariye MinIO Web Console ko secure HTTPS subdomain se chalayein (e.g. `storage.macreation.in { reverse_proxy minio:9001 }`), taaki dashboard SSL encrypted rahe aur sirf MinIO ID/Password se login ho.

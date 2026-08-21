# Changes & Testing

## Implemented

- Database-backed `theme` SiteSettings record.
- Public theme API already exposed through the existing public settings route.
- Admin theme editor with:
  - global one-input HEX/RGB apply
  - individual colour picker
  - individual HEX/RGB input
  - reset defaults
  - save/apply state
- Central CSS variables + Tailwind aliases.
- Removed the remaining hard-coded application colours from the main UI surfaces.
- Updated Razorpay checkout colour to use the active theme primary colour.
- Updated SVG seal colours to use theme variables.
- Added `/theme` public design-system page.
- Added 3D case-file summary to Home.
- Added 3D Top Industries on GeM section.
- Reused supplied MA Creation logo.
- Responsive small-screen rules and reduced-motion support.
- Added local shadcn-style UI primitives and `cn()` helper.

## Validation performed

- Backend: all 31 `.js` source files pass `node --check`.
- Source tree inspected for remaining hard-coded colour declarations; remaining HEX values are intentional defaults/examples in the theme system and admin inputs.

## Frontend build

The supplied environment contained an incomplete `node_modules` tree, so a clean Vite production build could not be completed in the sandbox. Run `npm install` (or `npm ci`) in `frontend/` on a normal Node environment, then run `npm run build`.


## Client Portal / Purchase History
- Added authenticated GET /api/payments/mine.
- Added automatic linking of paid guest purchases to an account when the customer registers/logs in with the same email.
- Added public /account customer portal with purchase details, total paid, payment/order IDs, plan features, status, and print/save receipt.
- Added My Account navigation for logged-in customers.
- Added post-payment View My Purchase action on the Plans page.
- Guest checkout remains supported.

## Production CMS live updates + typography controls

### Fixed
- Home page runtime crash: `CaseFileRow` was referenced by `HeroSection` but not defined. The missing component is now implemented.
- Public CMS changes no longer require a browser refresh.

### Live update architecture
- Implemented a native Server-Sent Events (SSE) channel at `GET /api/public/events`.
- Admin CMS/settings writes broadcast a `cms:updated` event after MongoDB confirms the write.
- Connected public clients receive the event immediately and remount the active public route, causing its existing API loaders to fetch the new database state without a full browser refresh.
- Theme and brand data are also refreshed immediately.
- SSE was chosen instead of Socket.IO because this feature only requires one-way server-to-browser notifications; admin writes already use normal HTTP requests. It avoids another runtime dependency and automatically reconnects in browsers.
- For a future multi-instance deployment, place the broadcast layer behind a shared Redis/pub-sub adapter so events reach clients connected to every Node instance.

### Typography CMS
- Added a global `fontFamily` setting under Site Settings → Typography.
- Added per-section `sectionFonts` overrides for Home, About, Services and Plans sections.
- Empty section values inherit the global font-family.
- The global font controls the normal, display and mono typography utilities so a single value can standardise the whole site.
- Font-family values are sanitised before being applied as CSS custom properties.

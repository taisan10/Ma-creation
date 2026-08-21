# Rebuild analysis and gap register

## Existing code before rebuild

The supplied project was a frontend-only React 18 + Vite + Tailwind 3 app with React Router. It had routes for Home, About, Services, Plans, Login/Register and Policies. Reusable pieces included Header, Footer, DemoForm, Accordion, Tabs, ScrollToHash and SVG seals. Forms were prototype-only and did not persist data or authenticate users. The README explicitly described the app as static/no-server and called out placeholder contact details, stats and training-space photos.

## What the references require

The UX reference asks for a founder demo/callback form, GeM explanation with photos, three core service boxes, impact numbers, partner logos/names, seller/buyer document checklists, flexible retainer comparison, demo video, certificates/training-space imagery, 15 FAQs, industry section and a policy-rich footer. It also specifies privacy and terms sections and a daily tender email policy.

The pricing/reference PDF provides concrete training packages, registration services, GeM service packages, OEM/vendor services and add-ons. It also requires MA Creation-specific T&C, privacy, refund/cancellation, GeM services, training, confidentiality, liability and grievance coverage.

## Gaps/conflicts found

1. **Backend missing:** all forms were frontend-only; no API, database, auth or payment layer existed.
2. **Payment missing:** no Razorpay integration existed.
3. **Real persistence missing:** demo/callback requests were only shown as a prototype success message.
4. **Pricing coverage:** the old frontend covered many service rows, but the rebuild adds a seeded MongoDB catalog for those services and purchasable training/service plans.
5. **Retainer ambiguity:** the UX reference gives order-cover amounts for 6/12/24/36 month retainers, not a separate plan price. The rebuild preserves these as order-cover values and does not invent a purchase price.
6. **Assets missing:** the UX PDF requests founder photo, GeM photos, partner logos/names, certificates and training-space photos, but those assets were not supplied. Existing placeholders are retained/flagged instead of inventing real client claims.
7. **Legal placeholders:** contact fields and effective dates are still placeholders and need final business/legal review.
8. **3D dependency installation:** the target package declares Three.js/R3F dependencies. The sandbox could not download npm packages, so the runnable verification used a dependency-free 3D visual fallback rather than a WebGL R3F scene.

## Implemented

- Express REST API with routes/controllers/models/middleware.
- Mongoose User, Lead, Service, Plan and Payment models.
- JWT login/register and protected endpoints.
- Zod input validation, Helmet and rate limiting.
- Demo/callback lead persistence.
- Catalog seed data from the supplied pricing reference.
- Razorpay order creation, browser checkout bootstrap, signature verification and webhook handling.
- API-driven login/register and plan purchasing.
- shadcn-style UI primitives for Button/Card/Input/Textarea.
- Animated 3D hero surface.
- Existing pages/features retained, with Plans and Login upgraded.

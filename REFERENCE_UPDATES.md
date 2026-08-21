# MA Creation – Reference-driven UX update

This build extends the existing MERN CMS using the supplied GeM website research and MA Creation UX references.

## Home additions
- Partner / client trust grid
- 5-step GeM Journey: Documents -> Listing -> Bidding -> Orders -> Payment
- AI Advantage cards: Chatbot, Document Checker, Tender Finder, Proposal Writer
- Training & Learning Hub
- Client Testimonials / story slots

## About additions
- Mission & Vision
- Why MA Creation / differentiators
- How We Work (Discover -> Prepare -> Execute -> Improve)
- Capability Map
- Client Outcomes

## CMS
Admin -> Pages / CMS now exposes the new Home and About content fields, including JSON editors for repeatable cards.

## Theme mapping
Admin -> Site Settings continues to show token-to-section mappings. New Home and About sections are also included in the mapping with direct preview anchors.

## Existing functionality retained
- MERN stack
- MongoDB-backed CMS pages
- Dynamic global theme (HEX/RGB/RGBA)
- 3D Case File and Industry cards
- Services / Plans catalog
- Admin dashboard
- User purchase/account portal
- Razorpay payment flow
- .env.example and .gitignore

## Run
Frontend:
  cd frontend
  npm install
  npm run dev

Backend:
  cd backend
  npm install
  npm run dev

Do not commit real .env files or secrets.

# MA Creation Admin CMS

## Login
Open `/login` and use the seeded admin account. Successful admin login redirects to `/admin`.

## What can be managed
1. Dashboard — counts for users, leads, payments, services, plans, CMS pages, FAQs and partners.
2. Users — view all registered users; promote/demote admin role; delete users.
3. Demo Leads — view demo/callback enquiries; change status; delete records.
4. Payments — view Razorpay payment/order records with customer and plan information.
5. Services & Plans — add/edit/delete records. The editor accepts JSON so every schema field remains editable.
6. Pages / CMS — edit JSON for Home, About, Services, Plans and Policies. Public pages fetch these values from MongoDB.
7. FAQs — add/edit/delete/reorder FAQs.
8. Partners — add/edit/delete client/partner names and logo URLs.
9. Site Settings — edit global brand name, email, phone, support and address.

## Important
The CMS stores content in MongoDB. Do not paste invalid JSON into the JSON editors.

For production, replace the development admin password, configure a strong JWT secret, MongoDB, Razorpay test/live keys, and review all legal policy text before publishing.

## Global Theme Editor

Open **Admin → Site Settings**.

### Quick change
Paste a HEX or RGB colour in **Quick colour** and press **Apply to all**. This updates the draft palette for the full site.

Examples:
- `#5B4FE0`
- `#5BF`
- `rgb(91,79,224)`
- `rgba(91,79,224,.9)`

Then press **Save Theme** to store the palette in MongoDB.

### Individual colours
Every colour token also has:
- native colour picker
- text input for HEX/RGB
- live swatch preview

### Public colour page
The complete active palette is visible at `/theme`.

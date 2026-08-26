# Admin CMS update

## Theme section mapping
Admin -> Site Settings now includes a **Where the theme is applied** map. Every mapped section lists the exact theme tokens it consumes and has a Preview button that opens that public section in a new tab.

## Page CMS
Admin -> Pages / CMS now exposes real fields for Home, About, Services, Plans and Policies instead of only a raw JSON box. Advanced JSON remains available for extra fields.

## Services catalog
The public Services page now reads live `Service` records and service `Plan` records from MongoDB. Therefore edits made in Admin -> Services & Plans are reflected on `/services` after refresh.

## Home / About / Plans
Home stats and industries, About story/founder/team/roadmap, and Plans section headings now consume CMS fields from MongoDB.

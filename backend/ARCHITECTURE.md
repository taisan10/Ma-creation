# MA Creation Backend Architecture

`server.js` is intentionally only the production boot entry point.

`app.js` owns Express middleware, security, webhook handling and route mounting.

## Feature boundaries

- `routes/` — HTTP route definitions.
- `controllers/` — request/response orchestration.
- `models/` — MongoDB schemas.
- `services/` — reusable domain helpers.
- `middleware/` — auth, validation and error handling.
- `config/` — environment and database configuration.
- `seed/` — initial CMS/catalog data.

This keeps the API testable: importing `app.js` does not open a database connection or start a listening socket.

import { Router } from "express";
import { swaggerSpec } from "../config/swagger.js";

const router = Router();

// Try to use swagger-ui-express if available, else fallback cleanly
let swaggerUiMiddleware = null;
try {
  const swaggerUi = (await import("swagger-ui-express")).default;
  swaggerUiMiddleware = swaggerUi;
} catch {
  // Graceful fallback: Container has not rebuilt node_modules yet, serve CDN UI
}

// 1. Raw OpenAPI JSON spec endpoint (useful for Postman import / automated tools)
router.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// 2. Standalone HTML Template with Swagger UI
const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MA Creation LMS - API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { display: none !important; }
    .custom-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 16px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .custom-banner h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .custom-banner .links a {
      color: #38bdf8;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-left: 16px;
      background: rgba(56, 189, 248, 0.1);
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.2);
    }
    .custom-banner .links a:hover {
      background: rgba(56, 189, 248, 0.2);
    }
  </style>
</head>
<body>
  <div class="custom-banner">
    <div>
      <h1>🚀 MA Creation API Documentation</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Interactive REST API Documentation for Flutter & Web Integration</p>
    </div>
    <div class="links">
      <a href="/api-docs/swagger.json" target="_blank" download="swagger.json">📥 Download OpenAPI JSON</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        docExpansion: "list"
      });
    };
  </script>
</body>
</html>`;

if (swaggerUiMiddleware) {
  router.use("/", swaggerUiMiddleware.serve);
  router.get("/", (req, res, next) => {
    return swaggerUiMiddleware.setup(swaggerSpec, {
      customSiteTitle: "MA Creation API Docs",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })(req, res, next);
  });
} else {
  router.get("/", (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.send(swaggerHtml);
  });
}

export default router;


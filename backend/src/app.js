import * as Sentry from "@sentry/node";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env, assertProductionEnv } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import leadRoutes from "./routes/leads.js";
import catalogRoutes from "./routes/catalog.js";
import paymentRoutes from "./routes/payments.js";
import adminRoutes from "./routes/admin.js";
import publicRoutes from "./routes/public.js";
import { publicBooksRouter, adminBooksRouter } from "./routes/books.js";
import adminLmsRoutes from "./routes/adminLms.js";
import courseRoutes from "./routes/courses.js";
import videoRoutes from "./routes/videos.js";
import swaggerRouter from "./routes/swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { webhook } from "./controllers/paymentController.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';


assertProductionEnv();

const app = express();


app.set("trust proxy", 1);
app.use(pinoHttp({ logger }));

// if (process.env.NODE_ENV !== "production") {
//   app.use((req, res, next) => {
//     const start = Date.now();
//     res.on("finish", () => {
//       console.log(
//         `[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`,
//       );
//     });
//     next();
//   });
// }


// peoduction se pahle ek baar read krna hai ye files ko iska update dena mu
app.use(
  helmet({
    // 1. CSP ko false rakhein kyunki pure REST API hai aur Swagger UI smoothly chale
    contentSecurityPolicy: false,
    // 2. Cross-Origin allow karein taaki frontend video aur PDF bina block hue stream kar sake
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
// production se pahle remove krna hai 
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.startsWith(env.clientUrl) || origin.includes('localhost') || origin.includes('pinggy') || origin.includes('trycloudflare')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    // production se pahle test mode remove kr dunga 
    // max: process.env.NODE_ENV === 'production' ? 600 : 100000,
    max:
      process.env.LOAD_TEST_MODE === "true"
        ? 200000
        : process.env.NODE_ENV === "production"
          ? 1200
          : 100000, // production production mai upload se pahle muje ye sb add btaye ki remove krna h ok only information remove nahi krna ok
    standardHeaders: "draft-8",
    legacyHeaders: false,
    // skip: req => process.env.NODE_ENV !== 'production' || req.path === '/api/public/events',
    skip: (req) =>
      process.env.NODE_ENV !== "production" ||
      process.env.LOAD_TEST_MODE === "true" ||
      req.path === "/api/public/events" ||
      req.path.startsWith("/api-docs"), // production production mai upload se pahle muje ye sb add btaye ki remove krna h ok only information remove nahi krna ok
  }),
);

app.use(cookieParser());

// Razorpay signature verification needs the untouched request body.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.body.toString("utf8"));
      webhook(req, res).catch(next);
    } catch (error) {
      next(error);
    }
  },
);

app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res
    .status(connected ? 200 : 503)
    .json({
      success: connected,
      status: connected ? "Hello Gorilla" : "database_unavailable",
      service: "ma-creation-api",
      database: mongoose.connection.readyState,
    });
});


app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/public/books", publicBooksRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/books", adminBooksRouter);
app.use("/api/admin/lms", adminLmsRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/videos", videoRoutes);

// localhost pr show hoga 
if (process.env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerRouter);
}



Sentry.setupExpressErrorHandler(app);

app.use(notFoundHandler);
app.use(errorHandler);


export default app;

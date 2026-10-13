import rateLimit from 'express-rate-limit'

/**
 * Strict Rate Limiter specifically for Authentication Endpoints (e.g. /login).
 * Argon2id computation is intentionally CPU and memory heavy (19 MiB per hash).
 * This rate limiter stops DoS attacks and high-speed automated brute forcing.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 4, // Max 4 attempts per IP per 15 minutes
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
})

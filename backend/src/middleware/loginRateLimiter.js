import rateLimit from 'express-rate-limit'

/**
 * Strict Rate Limiter specifically for Authentication Endpoints (e.g. /login).
 * Argon2id computation is intentionally CPU and memory heavy (19 MiB per hash).
 * This rate limiter stops DoS attacks and high-speed automated brute forcing.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.LOAD_TEST_MODE === 'true' ? 100000 : 10,  // production production mai upload se pahle muje ye sb add btaye ki remove krna h ok only information remove nahi krna ok 
  // max: 4, // Max 4 attempts per IP per 15 minutes
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false,
   skip: () => process.env.NODE_ENV !== 'production' || process.env.LOAD_TEST_MODE === 'true',
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
    },
  },
})

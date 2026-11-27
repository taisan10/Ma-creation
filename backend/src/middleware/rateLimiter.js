import rateLimit from 'express-rate-limit'

const isBypassed = () =>
  process.env.NODE_ENV !== 'production' || process.env.LOAD_TEST_MODE === 'true'

/**
 * 1. Global DDoS / Traffic Limiter (Used in app.js)
 * Protects entire API against volumetric floods (1200 req / 15m in prod).
 * Excludes Swagger docs, public SSE events, and Razorpay webhook.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isBypassed() ? 200000 : 1200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) =>
    isBypassed() ||
    req.path === '/api/public/events' ||
    req.path.startsWith('/api-docs') ||
    req.path === '/api/payments/webhook',
})

/**
 * Factory helper for targeted action limiters
 */
function createActionLimiter(max, message) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isBypassed() ? 100000 : max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: isBypassed,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message,
      },
    },
  })
}

/**
 * 2. Auth Limiter (Login, Register - 10 attempts / 15m)
 * Protects Argon2id CPU computation from brute-force & credential stuffing.
 */
export const authLimiter = createActionLimiter(
  10,
  'Too many authentication attempts. Please try again after 15 minutes.'
)

/**
 * 3. Leads Limiter (Demo Contact Form - 10 submissions / 15m)
 * Prevents spam lead submissions.
 */
export const leadLimiter = createActionLimiter(
  10,
  'Too many demo requests submitted. Please try again after 15 minutes.'
)

/**
 * 4. Refund Limiter (Student Refund Ticket - 5 requests / 15m)
 * Prevents malicious ticket flooding.
 */
export const refundLimiter = createActionLimiter(
  5,
  'Too many refund requests submitted from this IP. Please try again after 15 minutes.'
)

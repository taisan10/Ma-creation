import { Router } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth.service.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { refreshCsrfGuard } from '../middleware/refreshCsrf.guard.js'
import { loginRateLimiter } from '../middleware/loginRateLimiter.js'
import { hashPassword } from '../utils/password.util.js'
import User from '../models/User.auth-fields.js'

const router = Router()

// Helper: Configure HttpOnly Refresh Cookie
function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', token, {
    httpOnly: true, // Prevents JavaScript (XSS) from reading the token
    secure: isProd, // HTTPS only in production
    sameSite: isProd ? 'strict' : 'lax', // CSRF defense
    path: '/api/auth', // Scoped exclusively to auth routes
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  })
}

function clearRefreshCookie(res) {
  const isProd = process.env.NODE_ENV === 'production'
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth',
  })
}

// Zod Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  company: z.string().max(120).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
})

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body)
    const existing = await User.findOne({ email: data.email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'An account with this email already exists' },
      })
    }

    const passwordHash = await hashPassword(data.password)
    const user = await User.create({
      ...data,
      email: data.email.toLowerCase().trim(),
      passwordHash,
    })

    const context = {
      platform: (req.headers['x-client-platform'] || 'WEB').toUpperCase(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceLabel: req.headers['x-device-label'],
    }

    const { accessToken, refreshToken, user: profile } = await AuthService.issueTokens(user, context)

    if (context.platform === 'WEB') {
      setRefreshCookie(res, refreshToken)
      return res.status(201).json({ success: true, accessToken, user: profile })
    }

    return res.status(201).json({ success: true, accessToken, refreshToken, user: profile })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/login
 * Protected by loginRateLimiter (Argon2 CPU exhaustion & Brute force defense)
 */
router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body)
    const user = await AuthService.validateCredentials(email, password)

    const context = {
      platform: (req.headers['x-client-platform'] || 'WEB').toUpperCase(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceLabel: req.headers['x-device-label'],
    }

    const { accessToken, refreshToken, user: profile } = await AuthService.issueTokens(user, context)

    if (context.platform === 'WEB') {
      setRefreshCookie(res, refreshToken)
      return res.json({ success: true, accessToken, user: profile })
    }

    // Mobile clients receive refreshToken in response body
    return res.json({ success: true, accessToken, refreshToken, user: profile })
  } catch (err) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      })
    }
    next(err)
  }
})

/**
 * POST /api/auth/refresh
 * Protected by refreshCsrfGuard (requires 'x-refresh-token: 1' for Web cookies)
 */
router.post('/refresh', refreshCsrfGuard, async (req, res, next) => {
  try {
    const platform = (req.headers['x-client-platform'] || 'WEB').toUpperCase()
    const rawRefreshToken =
      platform === 'WEB'
        ? req.cookies?.refreshToken
        : req.body?.refreshToken || req.cookies?.refreshToken

    if (!rawRefreshToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Refresh token not found' },
      })
    }

    const context = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      platform,
    }

    const { accessToken, refreshToken, user: profile } = await AuthService.refreshTokens(
      rawRefreshToken,
      context
    )

    if (platform === 'WEB') {
      setRefreshCookie(res, refreshToken)
      return res.json({ success: true, accessToken, user: profile })
    }

    return res.json({ success: true, accessToken, refreshToken, user: profile })
  } catch (err) {
    clearRefreshCookie(res)
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.message || 'Token refresh failed' },
    })
  }
})

/**
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, refreshCsrfGuard, async (req, res, next) => {
  try {
    const platform = (req.headers['x-client-platform'] || 'WEB').toUpperCase()
    const rawRefreshToken =
      platform === 'WEB' ? req.cookies?.refreshToken : req.body?.refreshToken || req.cookies?.refreshToken

    await AuthService.logout(req.user.userId, rawRefreshToken, req.user.jti)

    if (platform === 'WEB') {
      clearRefreshCookie(res)
    }

    return res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/logout-all (Revokes sessions on all devices)
 */
router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    await AuthService.logoutAll(req.user.userId)
    clearRefreshCookie(res)
    return res.json({ success: true, message: 'All active sessions have been terminated' })
  } catch (err) {
    next(err)
  }
})

/**
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body)
    await AuthService.changePassword(req.user.userId, currentPassword, newPassword)
    clearRefreshCookie(res)
    return res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    })
  } catch (err) {
    if (err.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: err.message },
      })
    }
    next(err)
  }
})

/**
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash')
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      })
    }
    return res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

export default router

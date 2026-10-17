import jwt from 'jsonwebtoken'
import User from '../models/User.auth-fields.js'
import AccessTokenSession from '../models/AccessTokenSession.js'

/**
 * High-Security Authentication Middleware:
 * 1. Verifies JWT signature and expiry.
 * 2. Checks DB session by `jti` to ensure token was not revoked (Logout / Logout All).
 * 3. Confirms user is still active and account is not locked.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    })
  }

  const token = authHeader.slice(7)
  const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-it'

  let payload
  try {
    payload = jwt.verify(token, jwtSecret)
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    })
  }

  try {
    // Real-Time Token Revocation Check:
    // If the token was logged out or revoked, its JTI session will not exist in DB
    const session = await AccessTokenSession.findOne({ jti: payload.jti })
    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Session revoked or expired' },
      })
    }

    // Verify user status in DB
    const user = await User.findById(payload.sub).select('role isActive lockedUntil')
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User account is inactive or not found' },
      })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Account is temporarily locked' },
      })
    }

    req.user = {
      userId: user._id.toString(),
      email: payload.email,
      role: user.role,
      jti: payload.jti,
      sessionId: payload.sessionId,
    }

    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Role-Based Access Control (RBAC) middleware helper
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied: Insufficient privileges' },
      })
    }
    next()
  }
}

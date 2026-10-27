import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import RefreshToken from '../models/RefreshToken.js'
import AccessTokenSession from '../models/AccessTokenSession.js'
import { hashPassword, verifyPassword, DUMMY_ARGON2_HASH } from '../utils/password.util.js'
import { generateRefreshToken, hashToken, parseDurationToMs } from '../utils/token.util.js'
import { AppError } from '../utils/AppError.js'

// Exponential backoff configuration for failed attempts
const LOCKOUT_TIERS = [
  [15, 4 * 60 * 60 * 1000], // 15+ failures -> 4 hours lock
  [10, 60 * 60 * 1000],     // 10+ failures -> 1 hour lock
  [5, 15 * 60 * 1000],      // 5+ failures -> 15 minutes lock
]

function getLockoutDuration(failures) {
  for (const [threshold, duration] of LOCKOUT_TIERS) {
    if (failures >= threshold) return duration
  }
  return 15 * 60 * 1000
}

export class AuthService {
  /**
   * Validate user credentials with OWASP Anti-Timing Attack and Account Lockout protections.
   * Uniform error message is always returned to prevent user enumeration.
   */
  static async validateCredentials(email, password) {
    const normalizedEmail = (email || '').toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash')

    // Timing Attack Mitigation: If user does not exist, still verify against dummy hash
    if (!user) {
      await verifyPassword(DUMMY_ARGON2_HASH, password).catch(() => {})
      throw new Error('Invalid email or password')
    }

    // Check account active status
    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 403, 'ACCOUNT_INACTIVE')
    }

    // Check account lockout status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      throw new AppError(`Account is temporarily locked due to failed attempts. Please try again in ${waitMinutes} minute(s).`, 423, 'ACCOUNT_LOCKED')
    }

    // Verify password with Argon2id
    const isValid = await verifyPassword(user.passwordHash, password)
    if (!isValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + getLockoutDuration(user.failedLoginAttempts))
      }
      await user.save()
      throw new Error('Invalid email or password')
    }

    // Successful login: reset failed attempts & update lastLoginAt
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    await user.save()

    return user
  }

  /**
   * Issue short-lived Access Token (JWT) & high-entropy Refresh Token
   */
  static async issueTokens(user, context = {}) {
    const jwtSecret = process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-it'
    const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'
    const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d'

    const jti = randomUUID()
    const sessionId = context.sessionId || randomUUID()

    // 1. Sign short-lived Access Token with JTI and SessionID
    const accessToken = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        jti,
        sessionId,
      },
      jwtSecret,
      { expiresIn: accessExpiry }
    )

    // Save AccessTokenSession for instant revocation check
    const accessExpiryMs = parseDurationToMs(accessExpiry, 15 * 60 * 1000)
    await AccessTokenSession.create({
      jti,
      userId: user._id,
      sessionId,
      expiresAt: new Date(Date.now() + accessExpiryMs),
    })

    // 2. Generate cryptographically strong 512-bit Refresh Token
    const rawRefreshToken = generateRefreshToken()
    const tokenHash = hashToken(rawRefreshToken)
    const refreshExpiryMs = parseDurationToMs(refreshExpiry, 7 * 24 * 60 * 60 * 1000)

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      sessionId,
      platform: context.platform || 'WEB',
      deviceLabel: context.deviceLabel || 'Browser Session',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt: new Date(Date.now() + refreshExpiryMs),
    })

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      sessionId,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }

  /**
   * Refresh Token Rotation (RTR):
   * Each refresh token can only be used once. If a reused token is detected,
   * all sessions for that family are revoked immediately (Automatic Breach Containment).
   */
  static async refreshTokens(rawRefreshToken, context = {}) {
    if (!rawRefreshToken) {
      throw new Error('Refresh token is required')
    }

    const tokenHash = hashToken(rawRefreshToken)
    const existingToken = await RefreshToken.findOne({ tokenHash })

    // Breach Detection: If token is not found or already revoked, potential token reuse attempt
    if (!existingToken) {
      throw new Error('Invalid or expired refresh token')
    }

    if (existingToken.isRevoked) {
      // Automatic Breach Containment: Invalidate all sessions of this user
      await RefreshToken.updateMany(
        { userId: existingToken.userId, sessionId: existingToken.sessionId },
        { $set: { isRevoked: true, revokedReason: 'POSSIBLE_TOKEN_THEFT_DETECTED' } }
      )
      await AccessTokenSession.deleteMany({
        userId: existingToken.userId,
        sessionId: existingToken.sessionId,
      })
      throw new Error('Token reuse detected. All sessions terminated for security.')
    }

    if (existingToken.expiresAt <= new Date()) {
      throw new Error('Refresh token has expired')
    }

    const user = await User.findById(existingToken.userId)
    if (!user || !user.isActive) {
      throw new Error('User account is inactive or not found')
    }

    // Invalidate old refresh token (One-Time Use)
    existingToken.isRevoked = true
    existingToken.revokedReason = 'TOKEN_ROTATION'
    existingToken.revokedAt = new Date()
    await existingToken.save()

    // Clear old access token session
    await AccessTokenSession.deleteMany({
      userId: user._id,
      sessionId: existingToken.sessionId,
    })

    // Issue new pair with the same sessionId
    return await this.issueTokens(user, {
      ...context,
      sessionId: existingToken.sessionId,
      platform: existingToken.platform,
    })
  }

  /**
   * Logout current session: revokes refresh token and deletes access token session
   */
  static async logout(userId, rawRefreshToken, jti) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken)
      await RefreshToken.updateOne(
        { tokenHash, userId },
        { $set: { isRevoked: true, revokedReason: 'USER_LOGOUT', revokedAt: new Date() } }
      )
    }

    if (jti) {
      await AccessTokenSession.deleteOne({ jti, userId })
    }
  }

  /**
   * Terminate all active sessions across all devices (e.g. after password change)
   */
  static async logoutAll(userId) {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true, revokedReason: 'LOGOUT_ALL', revokedAt: new Date() } }
    )
    await AccessTokenSession.deleteMany({ userId })
  }

  /**
   * Secure Password Change:
   * Verifies old password, applies Argon2id to new password, and revokes all active sessions.
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash')
    if (!user) throw new Error('User not found')

    const isValid = await verifyPassword(user.passwordHash, currentPassword)
    if (!isValid) throw new Error('Current password is incorrect')

    user.passwordHash = await hashPassword(newPassword)
    await user.save()

    // Revoke all sessions across all devices
    await this.logoutAll(userId)
  }

  /**
   * Complete Registration Flow:
   * Validates duplicate email, hashes password with Argon2id, links guest payments, issues tokens.
   */
  static async registerUser(data, context = {}) {
    const normalizedEmail = (data.email || '').toLowerCase().trim()

    if (await User.exists({ email: normalizedEmail })) {
      throw new AppError('An account with this email already exists', 409, 'CONFLICT')
    }

    const passwordHash = await hashPassword(data.password)
    const user = await User.create({
      ...data,
      email: normalizedEmail,
      passwordHash,
    })

    // Link guest payments
    await Payment.updateMany(
      { $or: [{ user: { $exists: false }, email: user.email }, { user: null, email: user.email }], status: 'paid' },
      { $set: { user: user._id } }
    )

    return await this.issueTokens(user, context)
  }

  /**
   * Complete Login Flow:
   * Validates credentials (with anti-timing & lockout), links guest payments, issues tokens.
   */
  static async loginUser(email, password, context = {}) {
    let user
    try {
      user = await this.validateCredentials(email, password)
    } catch (err) {
      if (err instanceof AppError) throw err
      throw new AppError(err.message || 'Invalid email or password', 401, 'INVALID_CREDENTIALS')
    }

    // Link guest payments
    await Payment.updateMany(
      { $or: [{ user: { $exists: false }, email: user.email }, { user: null, email: user.email }], status: 'paid' },
      { $set: { user: user._id } }
    )

    return await this.issueTokens(user, context)
  }

  /**
   * Fetch user profile excluding password hash
   */
  static async getProfile(userId) {
    const user = await User.findById(userId).select('-passwordHash')
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND')
    }
    return user
  }
}

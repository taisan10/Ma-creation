import { AuthService } from '../services/auth.service.js'
import { AppError } from '../utils/AppError.js'

// Helper: Configure HttpOnly Refresh Cookie
function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
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

function getContext(req) {
  return {
    platform: (req.headers['x-client-platform'] || 'WEB').toUpperCase(),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
    deviceLabel: req.headers['x-device-label'],
  }
}

export async function register(req, res) {
  const context = getContext(req)
  const { accessToken, refreshToken, user } = await AuthService.registerUser(req.body, context)

  if (context.platform === 'WEB') {
    setRefreshCookie(res, refreshToken)
    return res.status(201).json({ success: true, token: accessToken, accessToken, user })
  }
  return res.status(201).json({ success: true, token: accessToken, accessToken, refreshToken, user })
}

export async function login(req, res) {
  const { email, password } = req.body
  const context = getContext(req)
  const { accessToken, refreshToken, user } = await AuthService.loginUser(email, password, context)

  if (context.platform === 'WEB') {
    setRefreshCookie(res, refreshToken)
    return res.json({ success: true, token: accessToken, accessToken, user })
  }
  return res.json({ success: true, token: accessToken, accessToken, refreshToken, user })
}

export async function refresh(req, res) {
  const platform = (req.headers['x-client-platform'] || 'WEB').toUpperCase()
  const rawRefreshToken =
    platform === 'WEB' ? req.cookies?.refreshToken : req.body?.refreshToken || req.cookies?.refreshToken

  if (!rawRefreshToken) {
    throw new AppError('Refresh token not found', 401, 'UNAUTHORIZED')
  }

  try {
    const context = { ipAddress: req.ip, userAgent: req.headers['user-agent'], platform }
    const { accessToken, refreshToken, user } = await AuthService.refreshTokens(rawRefreshToken, context)

    if (platform === 'WEB') {
      setRefreshCookie(res, refreshToken)
      return res.json({ success: true, token: accessToken, accessToken, user })
    }
    return res.json({ success: true, token: accessToken, accessToken, refreshToken, user })
  } catch (err) {
    clearRefreshCookie(res)
    throw new AppError(err.message || 'Token refresh failed', 401, 'UNAUTHORIZED')
  }
}

export async function logout(req, res) {
  const platform = (req.headers['x-client-platform'] || 'WEB').toUpperCase()
  const rawRefreshToken =
    platform === 'WEB' ? req.cookies?.refreshToken : req.body?.refreshToken || req.cookies?.refreshToken

  await AuthService.logout(req.user.userId, rawRefreshToken, req.user.jti)

  if (platform === 'WEB') {
    clearRefreshCookie(res)
  }
  return res.json({ success: true, message: 'Logged out successfully' })
}

export async function logoutAll(req, res) {
  await AuthService.logoutAll(req.user.userId)
  clearRefreshCookie(res)
  return res.json({ success: true, message: 'All active sessions have been terminated' })
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body
  try {
    await AuthService.changePassword(req.user.userId, currentPassword, newPassword)
    clearRefreshCookie(res)
    return res.json({ success: true, message: 'Password changed successfully. Please log in again.' })
  } catch (err) {
    throw new AppError(err.message, 400, 'BAD_REQUEST')
  }
}

export async function me(req, res) {
  const user = await AuthService.getProfile(req.user.userId)
  return res.json({ success: true, user })
}

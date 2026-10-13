/**
 * RefreshCsrfGuard:
 * For WEB platforms where refresh tokens are stored in HttpOnly cookies,
 * this middleware ensures that requests come from the legitimate frontend app
 * by requiring a custom HTTP header: `x-refresh-token: 1`.
 *
 * Browsers do not permit third-party cross-origin scripts to send custom headers
 * without explicitly passing CORS preflight checks, effectively thwarting CSRF.
 */
export function refreshCsrfGuard(req, res, next) {
  const platform = (req.headers['x-client-platform'] || 'WEB').toUpperCase()

  // Native mobile apps don't use cookies and send refresh tokens in request body
  if (platform === 'MOBILE_IOS' || platform === 'MOBILE_ANDROID') {
    return next()
  }

  // Web platform: requires custom header
  if (req.headers['x-refresh-token'] === '1') {
    return next()
  }

  return res.status(403).json({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'CSRF check failed: missing or invalid x-refresh-token header',
    },
  })
}

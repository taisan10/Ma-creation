export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500

  // 🛡️ Sirf 500 (Actual Server Crash) par hi terminal mein stack trace log karein
  // 401, 404, 400 normal client responses hain, unse terminal flood nahi hoga
  if (status >= 500) {
    console.error(err)
  }

  const isProd = process.env.NODE_ENV === 'production'
  const message = (status === 500 && isProd) ? 'An internal server error occurred' : err.message
  res.status(status).json({ success: false, code: err.code || 'SERVER_ERROR', message })
}

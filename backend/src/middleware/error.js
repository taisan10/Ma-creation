/**
 * Centralized Global Error Handler & 404 Catch-All
 * Handles: AppError, Zod, Mongoose (Cast, Validation, Duplicate 11000), JWT, SyntaxError, and Server Crashes
 */

export function notFoundHandler(req, res, next) {
  res.status(404).j
  son({
    success: false,
    code: 'ROUTE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`
  })
}

export function errorHandler(err, req, res, next) {
  let status = err.statusCode || err.status || 500
  let code = err.code || 'SERVER_ERROR'
  let source = 'App' // Default source
  let message = err.message || 'An internal server error occurred'

  // 1. Zod Validation Errors (Direct Zod or validate() middleware)
  if (err.name === 'ZodError' || Array.isArray(err.issues) || err.code === 'VALIDATION_ERROR') {
    status = 400
    code = 'ZOD_VALIDATION_ERROR'
    source = 'Zod'
    message = err.issues?.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join(', ') || err.message
  }
  // 2. Mongoose Invalid ObjectId (CastError)
  else if (err.name === 'CastError') {
    status = 400
    code = 'MONGO_INVALID_ID'
    source = 'Mongoose'
    message = `Invalid ID format for parameter '${err.path}' (received: "${err.value}")`
  }
  // 3. Mongoose Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    status = 409
    code = 'MONGO_DUPLICATE_KEY'
    source = 'Mongoose'
    const field = Object.keys(err.keyValue || {})[0]
    message = `Duplicate value: '${field}' already exists in database`
  }
  // 4. Mongoose Schema Validation Error
  else if (err.name === 'ValidationError') {
    status = 400
    code = 'MONGO_SCHEMA_ERROR'
    source = 'Mongoose'
    message = Object.values(err.errors || {}).map(e => e.message).join(', ')
  }
  // 5. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    status = 401
    code = 'JWT_INVALID_TOKEN'
    source = 'JWT'
    message = 'Invalid authentication token'
  } else if (err.name === 'TokenExpiredError') {
    status = 401
    code = 'JWT_TOKEN_EXPIRED'
    source = 'JWT'
    message = 'Session expired. Please login again'
  }
  // 6. Malformed JSON Body (SyntaxError)
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400
    code = 'MALFORMED_JSON_ERROR'
    source = 'BodyParser'
    message = 'Malformed JSON syntax in request payload'
  }

  // 🛡️ Terminal Logging: Crashes log with stack; API errors log clean source and code
  if (status >= 500) {
    console.error(`🔥 [500 Server Crash | Source: ${source}] ${req.method} ${req.originalUrl}:`, err)
  } else {
    console.warn(`⚠️ [API Error ${status} | Source: ${source} | Code: ${code}] ${req.method} ${req.originalUrl} -> ${message}`)
  }

  const isProd = process.env.NODE_ENV === 'production'
  res.status(status).json({
    success: false,
    code,
    source,
    message: (status === 500 && isProd) ? 'An internal server error occurred' : message,
    ...(isProd ? {} : (status >= 500 && err.stack ? { stack: err.stack } : {}))
  })
}

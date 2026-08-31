import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env, assertProductionEnv } from './config/env.js'
import authRoutes from './routes/auth.js'
import leadRoutes from './routes/leads.js'
import catalogRoutes from './routes/catalog.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import { publicBooksRouter, adminBooksRouter } from './routes/books.js'
import adminLmsRoutes from './routes/adminLms.js'
import { errorHandler } from './middleware/error.js'
import { webhook } from './controllers/paymentController.js'
import mongoose from 'mongoose'

assertProductionEnv()

const app = express()

app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 600 : 100000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: req => process.env.NODE_ENV !== 'production' || req.path === '/api/public/events',
}))

// Razorpay signature verification needs the untouched request body.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body
  try {
    req.body = JSON.parse(req.body.toString('utf8'))
    webhook(req, res).catch(next)
  } catch (error) {
    next(error)
  }
})

app.use(express.json({ limit: '1mb' }))
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1
  res.status(connected ? 200 : 503).json({ success: connected, status: connected ? 'ok' : 'database_unavailable', service: 'ma-creation-api', database: mongoose.connection.readyState })
})

app.use('/api/auth', authRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/public/books', publicBooksRouter)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/books', adminBooksRouter)
app.use('/api/admin/lms', adminLmsRoutes)


app.use(errorHandler)

export default app

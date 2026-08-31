import app from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'
import { ensureVideoBucket } from './config/minio.js'


let server

async function start() {
  try {
    await connectDB()
    await ensureVideoBucket()
    server = app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`)
    })
  } catch (error) {
    console.error('Backend startup failed:', error.message)
    console.error('Check backend/.env and make sure MongoDB is running/reachable.')
    process.exit(1)
  }
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`)
  if (server) {
    await new Promise(resolve => server.close(resolve))
  }
  await disconnectDB().catch(() => {})
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error)
})
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  shutdown('uncaughtException').catch(() => process.exit(1))
})

if (process.env.NODE_ENV !== 'test') start()

export default app

// import app from './app.js'
// import { connectDB, disconnectDB } from './config/db.js'
// import { env } from './config/env.js'
// import { ensureVideoBucket } from './config/minio.js'


// let server

// async function start() {
//   try {
//     await connectDB()
//     await ensureVideoBucket()
//     server = app.listen(env.port, () => {
//       console.log(`API running on http://localhost:${env.port}`)
//     })
//   } catch (error) {
//     console.error('Backend startup failed:', error.message)
//     console.error('Check backend/.env and make sure MongoDB is running/reachable.')
//     process.exit(1)
//   }
// }

// async function shutdown(signal) {
//   console.log(`${signal} received. Shutting down gracefully...`)
//   if (server) {
//     await new Promise(resolve => server.close(resolve))
//   }
//   await disconnectDB().catch(() => {})
//   process.exit(0)
// }

// process.on('SIGINT', () => shutdown('SIGINT'))
// process.on('SIGTERM', () => shutdown('SIGTERM'))
// process.on('unhandledRejection', error => {
//   console.error('Unhandled promise rejection:', error)
// })
// process.on('uncaughtException', error => {
//   console.error('Uncaught exception:', error)
//   shutdown('uncaughtException').catch(() => process.exit(1))
// })

// if (process.env.NODE_ENV !== 'test') start()

// export default app



import app from './app.js'
import { connectDB, disconnectDB } from './config/db.js'
import { env } from './config/env.js'
import { ensureVideoBucket } from './config/minio.js'


let server

async function start() {
  try {
    await connectDB()

    // MongoDB is required -- if that fails, stop the whole app (handled by
    // the outer catch below). MinIO is treated differently: it's normal for
    // MinIO to be temporarily unreachable (container restarting, .env
    // misconfigured, network hiccup) without that being a reason to take
    // down login/payments/everything else. So a MinIO failure here is
    // logged as a WARNING, not a fatal crash -- every feature except video
    // upload/playback still works fine without it.
    try {
      await ensureVideoBucket()
    } catch (minioError) {
      console.warn('[minio] could not connect -- video upload/playback will not work until this is fixed.')
      console.warn(`[minio] ${minioError.message}`)
      console.warn('[minio] check backend/.env MINIO_* values and confirm the MinIO container/service is running.')
    }

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
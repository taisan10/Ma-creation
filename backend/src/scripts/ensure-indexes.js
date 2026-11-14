import { connectDB, disconnectDB } from '../config/db.js'
import Payment from '../models/LMS/Payment.js'
import Video from '../models/LMS/Video.js'
import RefreshToken from '../models/AUTH/RefreshToken.js'
import PlaybackSession from '../models/LMS/PlaybackSession.js'

async function ensureHighConcurrencyIndexes() {
  console.log(`\n======================================================`)
  console.log(`⚡ APPLYING HIGH-CONCURRENCY DATABASE INDEXES`)
  console.log(`======================================================\n`)

  await connectDB()

  console.log(`Applying indexes to prevent COLLSCAN (Sequential Scans)...`)

  // 1. Payment: Entitlement and access check optimization
  console.log(`-> Creating Payment compound indexes...`)
  await Payment.collection.createIndex(
    { user: 1, plan: 1, status: 1 },
    { name: 'idx_payment_entitlement', background: true }
  )
  await Payment.collection.createIndex(
    { user: 1, status: 1 },
    { name: 'idx_payment_user_status', background: true }
  )

  // 2. Video: Course video listing optimization
  console.log(`-> Creating Video compound indexes...`)
  await Video.collection.createIndex(
    { course: 1, status: 1, active: 1, order: 1 },
    { name: 'idx_video_course_ready_active', background: true }
  )

  // 3. RefreshToken: Session termination & revocation optimization
  console.log(`-> Creating RefreshToken compound indexes...`)
  await RefreshToken.collection.createIndex(
    { userId: 1, isRevoked: 1 },
    { name: 'idx_refreshtoken_user_revoked', background: true }
  )

  // 4. PlaybackSession: Watch progress token validation optimization
  console.log(`-> Creating PlaybackSession compound indexes...`)
  await PlaybackSession.collection.createIndex(
    { token: 1, user: 1, video: 1 },
    { name: 'idx_playbacksession_lookup', background: true }
  )

  console.log(`\n✅ High-concurrency compound indexes created successfully!`)
  console.log(`Run 'node src/scripts/diagnose-db-scans.js' to verify 100% index utilization.`)

  await disconnectDB()
}

ensureHighConcurrencyIndexes().catch(err => {
  console.error('Failed to create indexes:', err)
  process.exit(1)
})


import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/AUTH/User.js'
import AccessTokenSession from '../models/AUTH/AccessTokenSession.js'
import RefreshToken from '../models/AUTH/RefreshToken.js'
import Course from '../models/LMS/Course.js'
import Video from '../models/LMS/Video.js'
import Payment from '../models/LMS/Payment.js'
import WatchLog from '../models/LMS/WatchLog.js'
import PlaybackSession from '../models/LMS/PlaybackSession.js'

function inspectStage(stage) {
  const stagesFound = []
  function traverse(s) {
    if (!s) return
    if (s.stage) stagesFound.push(s.stage)
    if (s.inputStage) traverse(s.inputStage)
    if (s.inputStages && Array.isArray(s.inputStages)) {
      s.inputStages.forEach(traverse)
    }
  }
  traverse(stage)
  return stagesFound
}

function findIndexName(stage) {
  if (!stage) return 'NONE'
  if (stage.indexName) return stage.indexName
  if (stage.inputStage) return findIndexName(stage.inputStage)
  if (stage.inputStages && Array.isArray(stage.inputStages)) {
    for (const s of stage.inputStages) {
      const name = findIndexName(s)
      if (name !== 'NONE') return name
    }
  }
  return 'NONE'
}

async function runDatabaseScanDiagnostics() {
  console.log(`\n======================================================`)
  console.log(`🔍 DATABASE QUERY EXECUTION PLAN & SCAN AUDIT`)
  console.log(`======================================================\n`)

  await connectDB()

  // Grab sample student, course, video, session
  const sampleUser = await User.findOne({ role: 'customer' })
  const sampleCourse = await Course.findOne()
  const sampleVideo = await Video.findOne()
  const samplePayment = await Payment.findOne()

  if (!sampleUser || !sampleCourse) {
    console.error(`⚠️ Need at least 1 user and 1 course in DB to run explain tests!`)
    console.log(`👉 Please run: node src/scripts/seed-load-test-data.js first.`)
    await disconnectDB()
    return
  }

  const queries = [
    {
      name: '1. User Login: Email Lookup',
      collection: 'users',
      queryDesc: `User.findOne({ email: "${sampleUser.email}" })`,
      explainPromise: User.find({ email: sampleUser.email }).explain('executionStats'),
    },
    {
      name: '2. Auth Guard: Access Token JTI Lookup',
      collection: 'accesstokensessions',
      queryDesc: `AccessTokenSession.findOne({ jti: "<uuid>" })`,
      explainPromise: AccessTokenSession.find({ jti: 'test-jti-uuid' }).explain('executionStats'),
    },
    {
      name: '3. Auth Guard: User Profile by ID',
      collection: 'users',
      queryDesc: `User.findById("${sampleUser._id}")`,
      explainPromise: User.find({ _id: sampleUser._id }).explain('executionStats'),
    },
    {
      name: '4. Entitlement: User Course Access Check',
      collection: 'payments',
      queryDesc: `Payment.exists({ user: "${sampleUser._id}", plan: "${sampleCourse.plan}", status: "paid" })`,
      explainPromise: Payment.find({ user: sampleUser._id, plan: sampleCourse.plan, status: 'paid' }).explain('executionStats'),
    },
    {
      name: '5. Dashboard: Distinct Paid Plans',
      collection: 'payments',
      queryDesc: `Payment.distinct("plan", { user: "${sampleUser._id}", status: "paid" })`,
      explainPromise: Payment.find({ user: sampleUser._id, status: 'paid' }).explain('executionStats'),
    },
    {
      name: '6. My Courses: Filter Courses by Paid Plans',
      collection: 'courses',
      queryDesc: `Course.find({ plan: { $in: [samplePlan] }, active: true })`,
      explainPromise: Course.find({ plan: { $in: [sampleCourse.plan] }, active: true }).explain('executionStats'),
    },
    {
      name: '7. Course Content: Fetch Video Playlist',
      collection: 'videos',
      queryDesc: `Video.find({ course: "${sampleCourse._id}", status: "READY", active: true })`,
      explainPromise: Video.find({ course: sampleCourse._id, status: 'READY', active: true }).explain('executionStats'),
    },
    {
      name: '8. DRM Token: User WatchLog Lookup',
      collection: 'watchlogs',
      queryDesc: `WatchLog.findOne({ user: "${sampleUser._id}", video: "${sampleVideo?._id}" })`,
      explainPromise: WatchLog.find({ user: sampleUser._id, video: sampleVideo?._id }).explain('executionStats'),
    },
    {
      name: '9. Watch Progress: PlaybackSession Lookup',
      collection: 'playbacksessions',
      queryDesc: `PlaybackSession.findOne({ token: "<uuid>", user: "${sampleUser._id}", video: "${sampleVideo?._id}" })`,
      explainPromise: PlaybackSession.find({ token: 'test-token', user: sampleUser._id, video: sampleVideo?._id }).explain('executionStats'),
    },
    {
      name: '10. Session Cleanup: Revoke Old Refresh Tokens',
      collection: 'refreshtokens',
      queryDesc: `RefreshToken.find({ userId: "${sampleUser._id}", isRevoked: false })`,
      explainPromise: RefreshToken.find({ userId: sampleUser._id, isRevoked: false }).explain('executionStats'),
    },
  ]

  let sequentialScanCount = 0
  let indexScanCount = 0
  const findings = []

  for (const q of queries) {
    try {
      const exp = await q.explainPromise
      const stats = exp.executionStats || {}
      const stages = inspectStage(stats.executionStages)
      const hasCollScan = stages.includes('COLLSCAN')
      const hasIxScan = stages.includes('IXSCAN') || stages.includes('IDHACK')
      const indexUsed = findIndexName(stats.executionStages)

      if (hasCollScan) sequentialScanCount++
      if (hasIxScan) indexScanCount++

      findings.push({
        name: q.name,
        collection: q.collection,
        query: q.queryDesc,
        hasCollScan,
        hasIxScan,
        stages: stages.join(' -> '),
        indexUsed,
        docsExamined: stats.totalDocsExamined ?? 'N/A',
        docsReturned: stats.nReturned ?? 'N/A',
        executionTimeMs: stats.executionTimeMillis ?? 0,
      })
    } catch (err) {
      findings.push({
        name: q.name,
        collection: q.collection,
        query: q.queryDesc,
        error: err.message,
      })
    }
  }

  // Print Formatted Report
  console.log(`------------------------------------------------------------------------------------------------------------------------`)
  console.log(`QUERY NAME                               | SCAN TYPE    | INDEX USED                      | DOCS EXAM / RET | TIME(ms)`)
  console.log(`------------------------------------------------------------------------------------------------------------------------`)

  for (const f of findings) {
    if (f.error) {
      console.log(`${f.name.padEnd(40)} | ERROR: ${f.error}`)
      continue
    }

    const scanType = f.hasCollScan
      ? '❌ COLLSCAN (Sequential)'
      : f.hasIxScan
      ? '✅ IXSCAN (Index)'
      : '⚠️ OTHER'

    const docsRatio = `${f.docsExamined}/${f.docsReturned}`
    console.log(
      `${f.name.padEnd(40)} | ${scanType.padEnd(23)} | ${f.indexUsed.padEnd(31)} | ${docsRatio.padEnd(15)} | ${f.executionTimeMs}ms`
    )
  }
  console.log(`------------------------------------------------------------------------------------------------------------------------\n`)

  console.log(`📊 SUMMARY OF SCAN BEHAVIOR:`)
  console.log(`  - Total Queries Tested        : ${queries.length}`)
  console.log(`  - Index Scans (IXSCAN)        : ${indexScanCount}`)
  console.log(`  - Sequential Scans (COLLSCAN) : ${sequentialScanCount}`)

  // Global Engine Stats
  try {
    const adminDb = mongoose.connection.db.admin()
    const serverStatus = await adminDb.serverStatus()
    const metrics = serverStatus?.metrics?.queryExecutor || {}
    console.log(`\n📈 GLOBAL MONGO ENGINE QUERY EXECUTOR METRICS:`)
    console.log(`  - Scanned Index Keys (scanned)       : ${metrics.scanned ?? 'N/A'}`)
    console.log(`  - Scanned Full Docs (scannedObjects) : ${metrics.scannedObjects ?? 'N/A'}`)
  } catch {
    // If not admin user, skip serverStatus
  }

  if (sequentialScanCount > 0) {
    console.log(`\n⚠️ WARNING: Detected ${sequentialScanCount} sequential collection scans!`)
    console.log(`Under 200-400 concurrent students and 1,000-4,000 records, COLLSCAN will saturate CPU & disk I/O.`)
    console.log(`Run 'node src/scripts/ensure-indexes.js' to add missing compound indexes!`)
  } else {
    console.log(`\n🎉 GREAT NEWS: All audited endpoints are utilizing indexes properly!`)
  }

  await disconnectDB()
}

runDatabaseScanDiagnostics().catch(err => {
  console.error('Diagnostic run failed:', err)
  process.exit(1)
})


import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/AUTH/User.js'
import Plan from '../models/CMS/Plan.js'
import Category from '../models/LMS/Category.js'
import Course from '../models/LMS/Course.js'
import Video from '../models/LMS/Video.js'
import Payment from '../models/LMS/Payment.js'
import WatchLog from '../models/LMS/WatchLog.js'
import PlaybackSession from '../models/LMS/PlaybackSession.js'
import { hashPassword } from '../utils/password.util.js'
import { randomUUID } from 'node:crypto'

async function seedCrankedData() {
  const TARGET_STUDENTS = parseInt(process.env.STUDENT_COUNT || '8000', 10)
  console.log(`\n======================================================`)
  console.log(`🚀 CRANKING UP REAL-WORLD DATASET`)
  console.log(`🎯 Target: ${TARGET_STUDENTS} Students, 12 Courses, 240+ Lessons, 15,000+ WatchLogs`)
  console.log(`======================================================\n`)

  await connectDB()

  // 1. Categories
  const categoryDefs = [
    { name: 'Web & Microservices Architecture', slug: 'web-microservices', order: 1 },
    { name: 'Cloud Infrastructure & DevOps', slug: 'cloud-devops', order: 2 },
    { name: 'High-Throughput Databases & Caching', slug: 'databases-caching', order: 3 },
    { name: 'Video Streaming & DRM Engineering', slug: 'video-drm-streaming', order: 4 },
  ]

  const categories = []
  for (const cat of categoryDefs) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    )
    categories.push(doc)
  }
  console.log(`✅ Seeded ${categories.length} Curriculum Categories`)

  // 2. Plans
  const planDefs = [
    { name: 'Full Stack Web Pro Plan', price: 1999, category: 'training', active: true },
    { name: 'Cloud & Kubernetes Pro Plan', price: 2499, category: 'training', active: true },
    { name: 'Database Scalability Pro Plan', price: 2999, category: 'training', active: true },
    { name: 'Video Streaming & DRM Pro Plan', price: 3499, category: 'training', active: true },
    { name: 'All-Access Engineering Fellowship', price: 7999, category: 'training', active: true, featured: true },
  ]

  const plans = []
  for (const p of planDefs) {
    const doc = await Plan.findOneAndUpdate(
      { name: p.name },
      { $set: { ...p, billing: 'One-time', duration: 'Lifetime' } },
      { upsert: true, new: true }
    )
    plans.push(doc)
  }
  console.log(`✅ Seeded ${plans.length} Pricing & Enrollment Plans`)

  // 3. Courses (12 realistic courses, 3 per category)
  const courseDefs = [
    // Category 0: Web
    { title: 'Advanced Node.js Event Loop & Libuv Internals', catIdx: 0, planIdx: 0 },
    { title: 'Enterprise NestJS & Hexagonal Architecture', catIdx: 0, planIdx: 0 },
    { title: 'High-Performance API Gateway Design', catIdx: 0, planIdx: 4 },
    // Category 1: Cloud
    { title: 'Production Kubernetes & Zero-Downtime Rollouts', catIdx: 1, planIdx: 1 },
    { title: 'Docker Security Hardening & CIS Benchmarks', catIdx: 1, planIdx: 1 },
    { title: 'Cloudflare Workers & Edge Caching Deep Dive', catIdx: 1, planIdx: 4 },
    // Category 2: Databases
    { title: 'MongoDB Index Architecture & WiredTiger Tuning', catIdx: 2, planIdx: 2 },
    { title: 'PostgreSQL vs Mongo: Query Optimization & Profiling', catIdx: 2, planIdx: 2 },
    { title: 'Redis Enterprise: Multi-Layer Caching & Streams', catIdx: 2, planIdx: 4 },
    // Category 3: Video Streaming
    { title: 'HLS & DASH Adaptive Bitrate (ABR) Pipeline', catIdx: 3, planIdx: 3 },
    { title: 'AES-128 DRM Key Exchange & Anti-Piracy Defense', catIdx: 3, planIdx: 3 },
    { title: 'Cloudflare R2 Object Storage & Video CDN Delivery', catIdx: 3, planIdx: 4 },
  ]

  const courses = []
  for (let i = 0; i < courseDefs.length; i++) {
    const cd = courseDefs[i]
    const doc = await Course.findOneAndUpdate(
      { title: cd.title },
      {
        $set: {
          title: cd.title,
          category: categories[cd.catIdx]._id,
          plan: plans[cd.planIdx]._id,
          description: `Industry-grade engineering course covering ${cd.title}.`,
          order: i + 1,
          active: true,
        },
      },
      { upsert: true, new: true }
    )
    courses.push(doc)
  }
  console.log(`✅ Seeded ${courses.length} Comprehensive Technical Courses`)

  // 4. Lessons / Videos (20 lessons per course = 240 lessons total!)
  const LESSONS_PER_COURSE = 20
  const allVideoIds = []
  const videoDocsToInsert = []

  for (const c of courses) {
    const existingCount = await Video.countDocuments({ course: c._id })
    if (existingCount < LESSONS_PER_COURSE) {
      for (let l = 1; l <= LESSONS_PER_COURSE; l++) {
        const vId = new mongoose.Types.ObjectId()
        allVideoIds.push({ videoId: vId, courseId: c._id })
        videoDocsToInsert.push({
          _id: vId,
          course: c._id,
          title: `Lesson ${l}: Architectural Deep Dive Part ${l}`,
          description: `In-depth theoretical and practical breakdown of core concepts in lesson ${l}.`,
          order: l,
          durationSeconds: 900 + (l * 120), // 15m to 55m
          status: 'READY',
          isHlsReady: true,
          hlsDirectory: `courses/${c._id}/${vId}/hls`,
          hlsManifestKey: `courses/${c._id}/${vId}/hls/master.m3u8`,
          active: true,
          encryptionKeyHex: '0123456789abcdef0123456789abcdef',
        })
      }
    } else {
      const existing = await Video.find({ course: c._id }).select('_id')
      existing.forEach(v => allVideoIds.push({ videoId: v._id, courseId: c._id }))
    }
  }

  if (videoDocsToInsert.length > 0) {
    await Video.insertMany(videoDocsToInsert, { ordered: false })
    console.log(`✅ Inserted ${videoDocsToInsert.length} Lessons into database`)
  }
  const totalVideos = await Video.countDocuments()
  console.log(`🎬 Total Lessons/Videos in Database: ${totalVideos}`)

  // 5. Crank Up Registered Students (up to TARGET_STUDENTS)
  const currentStudentCount = await User.countDocuments({ email: { $regex: /^student_\d+@loadtest\.macreation\.in$/ } })
  console.log(`ℹ️ Current test students in DB: ${currentStudentCount}`)

  const DEFAULT_PASSWORD = 'Student@12345'
  const sharedPasswordHash = await hashPassword(DEFAULT_PASSWORD)

  if (currentStudentCount < TARGET_STUDENTS) {
    console.log(`⏳ Seeding ${TARGET_STUDENTS - currentStudentCount} additional students in batches of 1,000...`)
    const BATCH_SIZE = 1000

    for (let i = currentStudentCount + 1; i <= TARGET_STUDENTS; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, TARGET_STUDENTS)
      const userBatch = []
      const paymentBatch = []

      for (let j = i; j <= batchEnd; j++) {
        const studentId = new mongoose.Types.ObjectId()
        const email = `student_${j}@loadtest.macreation.in`

        userBatch.push({
          _id: studentId,
          name: `Student ${j}`,
          email,
          phone: `98000${String(j).padStart(5, '0')}`,
          passwordHash: sharedPasswordHash,
          role: 'customer',
          isActive: true,
          failedLoginAttempts: 0,
          playbackLocked: false,
          recordingStrikes: 0,
        })

        // Enroll in plans:
        // Student j % 5 chooses their plan tier (creates diverse enrollment):
        const assignedPlan = plans[j % plans.length]
        paymentBatch.push({
          user: studentId,
          plan: assignedPlan._id,
          name: `Student ${j}`,
          email,
          phone: `98000${String(j).padStart(5, '0')}`,
          razorpayOrderId: `order_real_${j}`,
          razorpayPaymentId: `pay_real_${j}`,
          amount: assignedPlan.price,
          currency: 'INR',
          status: 'paid',
          verifiedAt: new Date(),
        })

        // 30% of students also have the All-Access pass
        if (j % 3 === 0) {
          const allAccessPlan = plans[4]
          paymentBatch.push({
            user: studentId,
            plan: allAccessPlan._id,
            name: `Student ${j}`,
            email,
            phone: `98000${String(j).padStart(5, '0')}`,
            razorpayOrderId: `order_allaccess_${j}`,
            razorpayPaymentId: `pay_allaccess_${j}`,
            amount: allAccessPlan.price,
            currency: 'INR',
            status: 'paid',
            verifiedAt: new Date(),
          })
        }
      }

      await User.insertMany(userBatch, { ordered: false })
      await Payment.insertMany(paymentBatch, { ordered: false })
      process.stdout.write(`  -> Seeded students up to ${batchEnd}/${TARGET_STUDENTS}\r`)
    }
    console.log(`\n✅ Finished seeding students and payments!`)
  }

  // 6. Crank up WatchLogs (Simulate 15,000+ realistic watch history records)
  const currentLogs = await WatchLog.countDocuments()
  console.log(`ℹ️ Current WatchLogs in DB: ${currentLogs}`)

  if (currentLogs < 15000 && allVideoIds.length > 0) {
    console.log(`⏳ Seeding 15,000 realistic WatchLog history entries...`)
    const sampleUsers = await User.find({ email: { $regex: /^student_\d+@loadtest\.macreation\.in$/ } })
      .select('_id')
      .limit(3000)

    const logBatch = []
    const seenPairs = new Set()

    for (let u = 0; u < sampleUsers.length; u++) {
      const user = sampleUsers[u]
      // Each sampled student has watched 4 to 6 random lessons
      const watchedCount = Math.floor(Math.random() * 3) + 4
      for (let w = 0; w < watchedCount; w++) {
        const randVideo = allVideoIds[Math.floor(Math.random() * allVideoIds.length)]
        const pairKey = `${user._id}_${randVideo.videoId}`
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey)
          logBatch.push({
            user: user._id,
            video: randVideo.videoId,
            totalWatchedSeconds: Math.floor(Math.random() * 800) + 120,
            lastWatchedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
            history: [
              { startedAt: new Date(Date.now() - 3600000), suspicious: false }
            ]
          })
        }
      }

      if (logBatch.length >= 15000) break
    }

    if (logBatch.length > 0) {
      await WatchLog.insertMany(logBatch, { ordered: false }).catch(() => {})
      console.log(`✅ Seeded ${logBatch.length} realistic WatchLog entries`)
    }
  }

  const finalUsers = await User.countDocuments()
  const finalCourses = await Course.countDocuments()
  const finalVideos = await Video.countDocuments()
  const finalPayments = await Payment.countDocuments()
  const finalLogs = await WatchLog.countDocuments()

  console.log(`\n======================================================`)
  console.log(`📊 CRANKED DATASET SUMMARY`)
  console.log(`======================================================`)
  console.log(`Total Registered Users : ${finalUsers}`)
  console.log(`Total Courses          : ${finalCourses}`)
  console.log(`Total Lessons (Videos) : ${finalVideos}`)
  console.log(`Total Payment Records  : ${finalPayments}`)
  console.log(`Total Watch History    : ${finalLogs}`)
  console.log(`Test Passwords         : Student@12345`)
  console.log(`======================================================\n`)

  await disconnectDB()
}

seedCrankedData().catch(err => {
  console.error('Cranked seed failed:', err)
  process.exit(1)
})

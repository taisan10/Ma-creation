import mongoose from 'mongoose'
import { connectDB, disconnectDB } from '../config/db.js'
import User from '../models/AUTH/User.js'
import Plan from '../models/CMS/Plan.js'
import Category from '../models/LMS/Category.js'
import Course from '../models/LMS/Course.js'
import Video from '../models/LMS/Video.js'
import Payment from '../models/LMS/Payment.js'
import { hashPassword } from '../utils/password.util.js'

/**
 * Seeder for Load Testing:
 * Creates 1,000 to 4,000 students, sample course plans, courses, videos,
 * and pre-paid payment entitlements.
 *
 * Uses precomputed Argon2id hash so generating 4,000 users takes ~10 seconds
 * instead of 10 minutes of CPU hashing.
 */
async function seedLoadTestData() {
  const TOTAL_STUDENTS = parseInt(process.env.STUDENT_COUNT || '4000', 10)
  const BATCH_SIZE = 500

  console.log(`\n======================================================`)
  console.log(`🚀 SEEDING LOAD TEST DATA: ${TOTAL_STUDENTS} STUDENTS`)
  console.log(`======================================================\n`)

  await connectDB()

  // 1. Ensure a Category exists
  let category = await Category.findOne({ slug: 'load-test-cat' })
  if (!category) {
    category = await Category.create({
      name: 'Load Test Category',
      slug: 'load-test-cat',
      description: 'Category for performance and load testing',
      order: 1,
    })
    console.log(`✅ Created test Category: ${category._id}`)
  } else {
    console.log(`ℹ️ Existing Category found: ${category._id}`)
  }

  // 2. Ensure a Plan exists
  let plan = await Plan.findOne({ name: 'Load Test Masterclass Plan' })
  if (!plan) {
    plan = await Plan.create({
      name: 'Load Test Masterclass Plan',
      price: 999,
      billing: 'One-time',
      duration: 'Lifetime',
      category: 'training',
      features: ['Full course access', 'High-res videos', 'DRM protection'],
      active: true,
      featured: true,
    })
    console.log(`✅ Created test Plan: ${plan._id}`)
  } else {
    console.log(`ℹ️ Existing Plan found: ${plan._id}`)
  }

  // 3. Ensure a Course exists
  let course = await Course.findOne({ title: 'System Scalability & Performance Masterclass' })
  if (!course) {
    course = await Course.create({
      title: 'System Scalability & Performance Masterclass',
      category: category._id,
      plan: plan._id,
      description: 'Comprehensive high-concurrency architecture course.',
      order: 1,
      active: true,
    })
    console.log(`✅ Created test Course: ${course._id}`)
  } else {
    console.log(`ℹ️ Existing Course found: ${course._id}`)
  }

  // 4. Ensure Sample Videos exist for this Course
  const existingVideoCount = await Video.countDocuments({ course: course._id })
  if (existingVideoCount < 5) {
    const videoData = [
      { title: '01. Architecture Overview & High-Load Basics', durationSeconds: 1200 },
      { title: '02. Database Indexes & Query Execution Plans', durationSeconds: 1800 },
      { title: '03. Caching Strategies & Connection Pool Tuning', durationSeconds: 2400 },
      { title: '04. Single Device Session & Token Security', durationSeconds: 1500 },
      { title: '05. Distributed Video Delivery & AES DRM', durationSeconds: 2100 },
    ]

    for (let i = 0; i < videoData.length; i++) {
      const v = videoData[i]
      await Video.findOneAndUpdate(
        { course: course._id, title: v.title },
        {
          $set: {
            course: course._id,
            title: v.title,
            description: `Lecture video ${i + 1} explaining database and system performance.`,
            order: i + 1,
            durationSeconds: v.durationSeconds,
            status: 'READY',
            isHlsReady: true,
            hlsManifestKey: `courses/${course._id}/test-video-${i + 1}/master.m3u8`,
            active: true,
            encryptionKeyHex: '0123456789abcdef0123456789abcdef',
          },
        },
        { upsert: true, new: true }
      )
    }
    console.log(`✅ Seeded 5 test videos for course ${course._id}`)
  } else {
    console.log(`ℹ️ Found ${existingVideoCount} videos for test course`)
  }

  // 5. Precompute Password Hash once for all load-test students
  const DEFAULT_PASSWORD = 'Student@12345'
  console.log(`🔑 Computing Argon2id hash for student password "${DEFAULT_PASSWORD}"...`)
  const sharedPasswordHash = await hashPassword(DEFAULT_PASSWORD)
  console.log(`✅ Password hash computed.`)

  // 6. Check existing students count
  const existingStudents = await User.countDocuments({ email: { $regex: /^student_\d+@loadtest\.macreation\.in$/ } })
  console.log(`ℹ️ Currently existing load-test students: ${existingStudents}`)

  if (existingStudents < TOTAL_STUDENTS) {
    console.log(`⏳ Seeding remaining ${TOTAL_STUDENTS - existingStudents} students in batches of ${BATCH_SIZE}...`)

    for (let i = existingStudents + 1; i <= TOTAL_STUDENTS; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE - 1, TOTAL_STUDENTS)
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

        paymentBatch.push({
          user: studentId,
          plan: plan._id,
          name: `Student ${j}`,
          email,
          phone: `98000${String(j).padStart(5, '0')}`,
          razorpayOrderId: `order_loadtest_${j}`,
          razorpayPaymentId: `pay_loadtest_${j}`,
          amount: plan.price,
          currency: 'INR',
          status: 'paid',
          verifiedAt: new Date(),
        })
      }

      await User.insertMany(userBatch, { ordered: false })
      await Payment.insertMany(paymentBatch, { ordered: false })
      process.stdout.write(`  -> Seeded students up to ${batchEnd}/${TOTAL_STUDENTS}\r`)
    }
    console.log(`\n✅ Finished seeding ${TOTAL_STUDENTS} students and payment entitlements!`)
  } else {
    console.log(`✅ Already have ${existingStudents} students. No additional seeding needed.`)
  }

  console.log(`\n======================================================`)
  console.log(`📋 SEEDING SUMMARY`)
  console.log(`======================================================`)
  console.log(`Course ID   : ${course._id}`)
  console.log(`Plan ID     : ${plan._id}`)
  console.log(`Total Users : ${await User.countDocuments()}`)
  console.log(`Total Payments: ${await Payment.countDocuments()}`)
  console.log(`Test Email Pattern: student_<1-${TOTAL_STUDENTS}>@loadtest.macreation.in`)
  console.log(`Test Password     : ${DEFAULT_PASSWORD}`)
  console.log(`======================================================\n`)

  await disconnectDB()
}

seedLoadTestData().catch(err => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})


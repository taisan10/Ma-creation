import { AppError } from '../utils/AppError.js'
import Category from '../models/Category.js'
import Course from '../models/Course.js'
import Video from '../models/Video.js'
import Payment from '../models/Payment.js'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'

// ============================================================
// ADMIN -- Category
// ============================================================

export async function createCategory(req, res) {
  const { name, slug, description, order } = req.body
  if (!name || !slug) throw new AppError('name and slug are required', 400, 'BAD_REQUEST')
  const category = await Category.create({ name, slug, description, order })
  res.status(201).json({ success: true, category })
}

export async function listCategoriesAdmin(req, res) {
  const categories = await Category.find().sort({ order: 1, createdAt: 1 })
  res.json({ success: true, categories })
}

// ============================================================
// ADMIN -- Course
// ============================================================

export async function createCourse(req, res) {
  const { category, plan, title, description, thumbnailUrl, order } = req.body
  if (!category || !plan || !title) throw new AppError('category, plan and title are required', 400, 'BAD_REQUEST')
  const course = await Course.create({ category, plan, title, description, thumbnailUrl, order })
  res.status(201).json({ success: true, course })
}

export async function listCoursesAdmin(req, res) {
  const courses = await Course.find()
    .populate('category', 'name slug')
    .populate('plan', 'name price')
    .sort({ order: 1, createdAt: 1 })
  res.json({ success: true, courses })
}

// ============================================================
// ADMIN -- Video (two-step create: metadata first, file upload second)
// ============================================================

// Step 1: create the Video record with a placeholder storage key. `active`
// stays false so it can never appear on the public unlock page until a real
// file has actually landed in MinIO (see uploadVideoFile below).
export async function createVideoMeta(req, res) {
  const { course, title, description, order, durationSeconds, maxWatchCount } = req.body
  if (!course || !title) throw new AppError('course and title are required', 400, 'BAD_REQUEST')

  const video = await Video.create({
    course,
    title,
    description,
    order,
    durationSeconds,
    maxWatchCount,
    minioObjectKey: `pending/${Date.now()}`,
    active: false
  })
  res.status(201).json({ success: true, video })
}

export async function listVideosAdmin(req, res) {
  const { courseId } = req.query
  const filter = courseId ? { course: courseId } : {}
  const videos = await Video.find(filter).sort({ order: 1, createdAt: 1 })
  res.json({ success: true, videos })
}

// Step 2: called AFTER streamVideoUpload middleware has already streamed the
// file into MinIO -- req.uploadedVideo = { objectKey, mimeType } is set by
// that middleware. This handler just finalizes the DB record.
export async function uploadVideoFile(req, res) {
  const video = await Video.findById(req.params.id)
  if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

  const previousKey = video.minioObjectKey
  video.minioObjectKey = req.uploadedVideo.objectKey
  video.mimeType = req.uploadedVideo.mimeType
  video.active = true
  await video.save()

  // Re-upload case: if this video already pointed at a real (non-placeholder)
  // MinIO object, delete the old one so storage doesn't fill up with orphaned
  // files nobody references anymore. Done fire-and-forget so it doesn't slow
  // down the admin's response.
  if (previousKey && !previousKey.startsWith('pending/')) {
    minioClient.removeObject(VIDEO_BUCKET, previousKey).catch(err => {
      console.error(`[minio] failed to remove superseded object ${previousKey}:`, err.message)
    })
  }

  res.json({ success: true, video })
}

export async function deleteVideo(req, res) {
  const video = await Video.findById(req.params.id)
  if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

  if (video.minioObjectKey && !video.minioObjectKey.startsWith('pending/')) {
    await minioClient.removeObject(VIDEO_BUCKET, video.minioObjectKey).catch(err => {
      console.error(`[minio] failed to remove object ${video.minioObjectKey}:`, err.message)
    })
  }
  await video.deleteOne()
  res.json({ success: true })
}


// ============================================================
// CUSTOMER-FACING -- "My Unlocked Courses"
// ============================================================
 
// Returns every active Course whose `plan` matches a plan this logged-in
// user has actually paid for (Payment.status === 'paid'). This is what
// powers the page the user lands on right after payment verification
// succeeds (see paymentController.verify -> frontend redirect in Part 6).
export async function listMyCourses(req, res) {
  // Payment.distinct('plan', ...) returns a de-duplicated array of plan IDs
  // this user has a 'paid' record for -- one query, no loop needed.
  const paidPlanIds = await Payment.distinct('plan', { user: req.user.id, status: 'paid' })
 
  if (paidPlanIds.length === 0) {
    return res.json({ success: true, categories: [] })
  }
 
  const courses = await Course.find({ plan: { $in: paidPlanIds }, active: true })
    .populate('category', 'name slug order')
    .populate('plan', 'name')
    .sort({ order: 1, createdAt: 1 })
 
  // Group by category so the frontend can render section-by-section
  // (e.g. "GeM Registration" header, then its courses) without having to
  // do the grouping itself.
  const grouped = new Map()
  for (const course of courses) {
    const cat = course.category
    const key = cat?._id?.toString() || 'uncategorized'
    if (!grouped.has(key)) grouped.set(key, { category: cat, courses: [] })
    grouped.get(key).courses.push({
      _id: course._id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      planName: course.plan?.name
    })
  }
 
  res.json({ success: true, categories: Array.from(grouped.values()) })
}
 
// Requires requireCourseEntitlement (middleware/requireEntitlement.js) to
// have already run and set req.course -- this handler assumes ownership is
// already confirmed.
//
// IMPORTANT: .select(...) deliberately leaves OUT `minioObjectKey`. The
// frontend gets everything it needs to render a video list (title,
// thumbnail, duration) but never the private MinIO storage path. Actual
// playback links are only issued one-at-a-time, on demand, by the
// videoController built in Part 5 -- never as part of a list response.
export async function getCourseVideos(req, res) {
  const videos = await Video.find({ course: req.course._id, active: true })
    .select('title description order durationSeconds thumbnailUrl maxWatchCount')
    .sort({ order: 1, createdAt: 1 })
 
  res.json({
    success: true,
    course: { _id: req.course._id, title: req.course.title, description: req.course.description },
    videos
  })
}
 
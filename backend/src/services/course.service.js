import { AppError } from '../utils/AppError.js'
import Category from '../models/Category.js'
import Course from '../models/Course.js'
import Video from '../models/Video.js'
import Payment from '../models/Payment.js'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'
import { HlsService } from './hls.service.js'
import ffmpeg from 'fluent-ffmpeg'

function detectVideoDuration(bucket, objectKey) {
  return new Promise(resolve => {
    minioClient
      .getObject(bucket, objectKey)
      .then(stream => {
        ffmpeg(stream).ffprobe((err, data) => {
          if (err) return resolve(0)
          const duration = data?.format?.duration
          resolve(duration ? Math.ceil(duration) : 0)
        })
      })
      .catch(() => resolve(0))
  })
}

export class CourseService {
  // Category operations
  static async createCategory({ name, slug, description, order }) {
    if (!name || !slug) throw new AppError('name and slug are required', 400, 'BAD_REQUEST')
    return await Category.create({ name, slug, description, order })
  }

  static async listCategoriesAdmin() {
    return await Category.find().sort({ order: 1, createdAt: 1 })
  }

  static async deleteCategory(categoryId) {
    const category = await Category.findById(categoryId)
    if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND')

    const courses = await Course.find({ category: category._id })
    const courseIds = courses.map(c => c._id)

    const videos = await Video.find({ course: { $in: courseIds } })
    for (const video of videos) {
      if (video.minioObjectKey && !video.minioObjectKey.startsWith('pending/')) {
        await minioClient.removeObject(VIDEO_BUCKET, video.minioObjectKey).catch(err => {
          console.error(`[minio] failed to remove object ${video.minioObjectKey}:`, err.message)
        })
      }
    }

    await Video.deleteMany({ course: { $in: courseIds } })
    await Course.deleteMany({ category: category._id })
    await category.deleteOne()
  }

  // Course operations
  static async createCourse({ category, plan, title, description, thumbnailUrl, order }) {
    if (!category || !plan || !title) throw new AppError('category, plan and title are required', 400, 'BAD_REQUEST')
    return await Course.create({ category, plan, title, description, thumbnailUrl, order })
  }

  static async listCoursesAdmin() {
    return await Course.find()
      .populate('category', 'name slug')
      .populate('plan', 'name price')
      .sort({ order: 1, createdAt: 1 })
  }

  static async deleteCourse(courseId) {
    const course = await Course.findById(courseId)
    if (!course) throw new AppError('Course not found', 404, 'NOT_FOUND')

    const videos = await Video.find({ course: course._id })
    for (const video of videos) {
      if (video.minioObjectKey && !video.minioObjectKey.startsWith('pending/')) {
        await minioClient.removeObject(VIDEO_BUCKET, video.minioObjectKey).catch(err => {
          console.error(`[minio] failed to remove object ${video.minioObjectKey}:`, err.message)
        })
      }
    }
    await Video.deleteMany({ course: course._id })
    await course.deleteOne()
  }

  // Video operations
  static async createVideoMeta({ course, title, description, order, durationSeconds, maxWatchMultiplier }) {
    if (!course || !title) throw new AppError('course and title are required', 400, 'BAD_REQUEST')
    return await Video.create({
      course,
      title,
      description,
      order,
      durationSeconds,
      maxWatchMultiplier,
      minioObjectKey: `pending/${Date.now()}`,
      active: false,
    })
  }

  static async listVideosAdmin(courseId) {
    const filter = courseId ? { course: courseId } : {}
    return await Video.find(filter).sort({ order: 1, createdAt: 1 })
  }

  static async finalizeVideoUpload(videoId, uploadedVideo) {
    const video = await Video.findById(videoId)
    if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

    const previousKey = video.minioObjectKey
    video.minioObjectKey = uploadedVideo.objectKey
    video.mimeType = uploadedVideo.mimeType
    video.active = true

    if (!video.durationSeconds || video.durationSeconds === 0) {
      try {
        const duration = await detectVideoDuration(VIDEO_BUCKET, video.minioObjectKey)
        if (duration > 0) video.durationSeconds = duration
      } catch (err) {
        console.error(`[video] Could not auto-detect duration for ${video._id}:`, err.message)
      }
    }

    await video.save()

    // Trigger background HLS AES-128 transcoding
    HlsService.transcodeVideo(video._id).catch(err => {
      console.error(`[HLS] Background transcode failed for video ${video._id}:`, err.message)
    })

    if (previousKey && !previousKey.startsWith('pending/')) {
      minioClient.removeObject(VIDEO_BUCKET, previousKey).catch(err => {
        console.error(`[minio] failed to remove superseded object ${previousKey}:`, err.message)
      })
    }

    return video
  }

  static async deleteVideo(videoId) {
    const video = await Video.findById(videoId)
    if (!video) throw new AppError('Video not found', 404, 'NOT_FOUND')

    if (video.minioObjectKey && !video.minioObjectKey.startsWith('pending/')) {
      await minioClient.removeObject(VIDEO_BUCKET, video.minioObjectKey).catch(err => {
        console.error(`[minio] failed to remove object ${video.minioObjectKey}:`, err.message)
      })
    }

    if (video.hlsDirectory) {
      try {
        const stream = minioClient.listObjects(VIDEO_BUCKET, video.hlsDirectory, true)
        const toDelete = []
        for await (const obj of stream) {
          if (obj?.name) toDelete.push(obj.name)
        }
        if (toDelete.length > 0) {
          await minioClient.removeObjects(VIDEO_BUCKET, toDelete)
        }
      } catch (err) {
        console.error(`[minio] failed to remove HLS objects for ${video._id}:`, err.message)
      }
    }

    await video.deleteOne()
  }

  // Customer Course checks
  static async hasAnyPaidCourse(userId) {
    const paidPlanIds = await Payment.distinct('plan', { user: userId, status: 'paid' })
    if (!paidPlanIds.length) return false
    const count = await Course.countDocuments({ plan: { $in: paidPlanIds }, active: true })
    return count > 0
  }

  static async listUserCourses(userId) {
    const paidPlanIds = await Payment.distinct('plan', { user: userId, status: 'paid' })
    if (paidPlanIds.length === 0) return []

    const courses = await Course.find({ plan: { $in: paidPlanIds }, active: true })
      .populate('category', 'name slug order')
      .populate('plan', 'name')
      .sort({ order: 1, createdAt: 1 })

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
        planName: course.plan?.name,
      })
    }
    return Array.from(grouped.values())
  }

  static async getCourseVideos(courseId) {
    return await Video.find({ course: courseId, active: true })
      .select('title description order durationSeconds thumbnailUrl maxWatchMultiplier')
      .sort({ order: 1, createdAt: 1 })
  }
}

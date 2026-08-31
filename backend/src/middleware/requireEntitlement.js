import { AppError } from '../utils/AppError.js'
import Course from '../models/Course.js'
import Payment from '../models/Payment.js'
import Video from '../models/Video.js'


export async function requireCourseEntitlement(req, res, next) {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, active: true })
    if (!course) return next(new AppError('Course not found', 404, 'NOT_FOUND'))

    const owns = await Payment.exists({ user: req.user.sub, plan: course.plan, status: 'paid' })
    if (!owns) {
      return next(new AppError('You have not purchased the plan that unlocks this course', 403, 'NOT_ENTITLED'))
    }

    req.course = course
    next()
  } catch (err) {
    next(err)
  }
}



export async function requireVideoEntitlement(req, res, next) {
  try {
    const video = await Video.findOne({ _id: req.params.videoId, active: true })
    if (!video) return next(new AppError('Video not found', 404, 'NOT_FOUND'))
 
    const course = await Course.findOne({ _id: video.course, active: true })
    if (!course) return next(new AppError('Course not found', 404, 'NOT_FOUND'))
 
    const owns = await Payment.exists({ user: req.user.sub, plan: course.plan, status: 'paid' })
    if (!owns) {
      return next(new AppError('You have not purchased the plan that unlocks this video', 403, 'NOT_ENTITLED'))
    }
 
    req.video = video
    req.course = course
    next()
  } catch (err) {
    next(err)
  }
}
 
import { AppError } from '../utils/AppError.js'
import Course from '../models/Course.js'
import Payment from '../models/Payment.js'

/**
 * Route guard for any endpoint with a ":courseId" param. A user is
 * "entitled" to a course if they have at least one Payment document with
 * status 'paid' whose `plan` field matches this course's `plan` field --
 * this is the SAME Payment model your existing Razorpay flow already
 * writes to, we're not creating a separate "enrollment" table.
 *
 * On success, attaches `req.course` (the Course document) so downstream
 * handlers don't need to re-fetch it.
 *
 * Must run AFTER `authenticate` in the route chain -- it needs req.user.
 */
export async function requireCourseEntitlement(req, res, next) {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, active: true })
    if (!course) return next(new AppError('Course not found', 404, 'NOT_FOUND'))

    const owns = await Payment.exists({ user: req.user.id, plan: course.plan, status: 'paid' })
    if (!owns) {
      return next(new AppError('You have not purchased the plan that unlocks this course', 403, 'NOT_ENTITLED'))
    }

    req.course = course
    next()
  } catch (err) {
    next(err)
  }
}
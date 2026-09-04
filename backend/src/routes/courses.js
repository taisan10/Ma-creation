import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireCourseEntitlement } from '../middleware/requireEntitlement.js'
import * as c from '../controllers/courseController.js'

const router = Router()

// Every route here requires a logged-in user -- there is no guest browsing
// of paid course content, unlike e.g. the public catalog/plans routes.
router.use(authenticate)

router.get('/has-access', asyncHandler(c.hasAnyPaidCourse))
router.get('/mine', asyncHandler(c.listMyCourses))
router.get('/:courseId/videos', requireCourseEntitlement, asyncHandler(c.getCourseVideos))

export default router
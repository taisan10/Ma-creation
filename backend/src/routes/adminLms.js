import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { streamVideoUpload } from '../middleware/streamUpload.js'
import { zeroRamVideoUpload } from '../middleware/zeroRamUpload.js'
import * as c from '../controllers/courseController.js'

const router = Router()
router.use(authenticate, requireAdmin)

router.post('/categories', asyncHandler(c.createCategory))
router.get('/categories', asyncHandler(c.listCategoriesAdmin))

router.post('/courses', asyncHandler(c.createCourse))
router.get('/courses', asyncHandler(c.listCoursesAdmin))

router.post('/videos', asyncHandler(c.createVideoMeta))
router.get('/videos', asyncHandler(c.listVideosAdmin))
router.post('/videos/upload', asyncHandler(zeroRamVideoUpload))
router.post('/videos/:id/upload', asyncHandler(zeroRamVideoUpload))
router.delete('/videos/:id', asyncHandler(c.deleteVideo))
router.delete('/categories/:id', asyncHandler(c.deleteCategory))
router.delete('/courses/:id', asyncHandler(c.deleteCourse))

export default router

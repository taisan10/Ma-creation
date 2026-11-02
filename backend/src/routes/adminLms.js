import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadRawVideo } from '../middleware/upload.middleware.js'
import {
  objectIdParamSchema,
  createCategorySchema,
  createCourseSchema,
  createVideoMetaSchema,
} from '../validators/course.validator.js'
import * as c from '../controllers/courseController.js'

const router = Router()
router.use(authenticate, requireAdmin)

router.post('/categories', validate(createCategorySchema), asyncHandler(c.createCategory))
router.get('/categories', asyncHandler(c.listCategoriesAdmin))

router.post('/courses', validate(createCourseSchema), asyncHandler(c.createCourse))
router.get('/courses', asyncHandler(c.listCoursesAdmin))

router.post('/videos', validate(createVideoMetaSchema), asyncHandler(c.createVideoMeta))
router.get('/videos', asyncHandler(c.listVideosAdmin))
router.post('/videos/upload', asyncHandler(uploadRawVideo))
router.post('/videos/:id/upload', validate(objectIdParamSchema, 'params'), asyncHandler(uploadRawVideo))
router.delete('/videos/:id', validate(objectIdParamSchema, 'params'), asyncHandler(c.deleteVideo))
router.delete('/categories/:id', validate(objectIdParamSchema, 'params'), asyncHandler(c.deleteCategory))
router.delete('/courses/:id', validate(objectIdParamSchema, 'params'), asyncHandler(c.deleteCourse))

export default router

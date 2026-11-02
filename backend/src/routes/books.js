import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { uploadBookFiles } from '../middleware/upload.middleware.js'
import { updateBookSchema } from '../validators/book.validator.js'
import * as c from '../controllers/bookController.js'

const publicRouter = Router()
publicRouter.get('/', asyncHandler(c.getPublicBook))
publicRouter.get('/:id/read', asyncHandler(c.readBook))
publicRouter.get('/:id/download', asyncHandler(c.downloadBook))

const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)
adminRouter.get('/', asyncHandler(c.listBooks))
adminRouter.post('/upload', uploadBookFiles, asyncHandler(c.uploadBook))
adminRouter.patch('/:id', validate(updateBookSchema), asyncHandler(c.updateBook))
adminRouter.delete('/:id', asyncHandler(c.deleteBook))

export { publicRouter as publicBooksRouter, adminRouter as adminBooksRouter }

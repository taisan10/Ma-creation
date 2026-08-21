import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { parseBookMultipart } from '../middleware/multipartBook.js'
import * as c from '../controllers/bookController.js'

const publicRouter = Router()
publicRouter.get('/', asyncHandler(c.getPublicBook))
publicRouter.get('/:id/read', asyncHandler(c.readBook))
publicRouter.get('/:id/download', asyncHandler(c.downloadBook))

const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)
adminRouter.get('/', asyncHandler(c.listBooks))
adminRouter.post('/upload', parseBookMultipart, asyncHandler(c.uploadBook))
adminRouter.patch('/:id', validate(z.object({ title: z.string().min(1).max(180).optional(), description: z.string().max(2000).optional(), coverImageUrl: z.string().max(500).optional(), active: z.boolean().optional() })), asyncHandler(c.updateBook))
adminRouter.delete('/:id', asyncHandler(c.deleteBook))

export { publicRouter as publicBooksRouter, adminRouter as adminBooksRouter }

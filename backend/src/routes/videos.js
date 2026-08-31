import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireVideoEntitlement } from '../middleware/requireEntitlement.js'
import * as c from '../controllers/videoController.js'

const router = Router()
router.use(authenticate)

// Watch-limit + entitlement are both checked BEFORE a presigned URL is ever
// generated -- requireVideoEntitlement first (do they own the plan?), then
// inside the controller itself (have they hit the watch cap?).
router.post('/:videoId/playback-token', requireVideoEntitlement, asyncHandler(c.requestPlaybackToken))

// No entitlement re-check needed here -- reportWatchEvent already scopes its
// PlaybackSession lookup to { token, user: req.user.id, video: :videoId },
// so a session belonging to someone else simply won't be found.
router.post('/:videoId/watch-event', asyncHandler(c.reportWatchEvent))

export default router
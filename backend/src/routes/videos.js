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

// Secure AES-128 Key Delivery for HLS Decryption
// Protected by requireVideoEntitlement (purchased plan or admin) + watch quota check
router.get('/:videoId/key', requireVideoEntitlement, asyncHandler(c.getVideoKey))

// Stream HLS AES-128 Encrypted Playlist & Segments
router.get('/:videoId/hls/manifest.m3u8', requireVideoEntitlement, asyncHandler(c.getHlsManifest))
router.get('/:videoId/hls/:segment', requireVideoEntitlement, asyncHandler(c.getHlsSegment))

// Transcode video into AES-128 HLS (accessible by admin/entitled)
router.post('/:videoId/transcode-hls', requireVideoEntitlement, asyncHandler(c.transcodeVideoHls))

export default router
import { randomUUID } from 'crypto'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { minioPublicClient, VIDEO_BUCKET } from '../config/minio.js'
import WatchLog from '../models/WatchLog.js'
import PlaybackSession from '../models/PlaybackSession.js'

// ============================================================
// STEP 1: Request a playback token
// Runs AFTER requireVideoEntitlement (req.video, req.course already set +
// ownership already confirmed). This is where the "max 3 watches" rule is
// actually enforced -- BEFORE any video URL is ever generated.
// ============================================================
export async function requestPlaybackToken(req, res) {
  const video = req.video
  const maxAllowed = video.maxWatchCount ?? env.videoMaxWatchCount

  // One WatchLog document per (user, video) -- see models/WatchLog.js.
  // If it doesn't exist yet, this user has never watched this video before
  // (count effectively 0), which is fine.
  const existingLog = await WatchLog.findOne({ user: req.user.id, video: video._id })
  const currentCount = existingLog?.count || 0

  if (currentCount >= maxAllowed) {
    // THE BLOCK. No presigned URL is generated, no PlaybackSession is
    // created -- the request stops here with a specific error code the
    // frontend checks for to show the "can't watch a 4th time" popup
    // (see Part 7's WatchLimitModal).
    throw new AppError(
      `You have already watched this video ${currentCount} times, which is the maximum allowed on your plan.`,
      403,
      'WATCH_LIMIT_REACHED'
    )
  }

  // Create the "ticket" (see models/PlaybackSession.js) -- a random token,
  // valid for a short window (default 6 minutes, from VIDEO_PLAYBACK_URL_TTL_SECONDS).
  const token = randomUUID()
  const ttlSeconds = env.videoPlaybackUrlTtlSeconds
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await PlaybackSession.create({
    user: req.user.id,
    video: video._id,
    token,
    expiresAt,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })

  // Generate the actual temporary, signed MinIO URL. minioPublicClient (see
  // config/minio.js) is used specifically here so the returned URL's host is
  // the PUBLIC domain (cdn.yourdomain.com), not the internal "minio" service
  // name -- the browser needs a URL it can actually reach.
  const url = await minioPublicClient.presignedGetObject(VIDEO_BUCKET, video.minioObjectKey, ttlSeconds)

  res.json({
    success: true,
    url,
    sessionToken: token,
    expiresAt,
    watchCount: currentCount,
    maxWatchCount: maxAllowed,
    watchesRemaining: maxAllowed - currentCount
  })
}

// ============================================================
// STEP 2: The frontend player reports back what actually happened
// Called by the <video> player once playback genuinely starts (not just on
// page load / URL fetch), and also used to report suspicious signals
// (screen-recording detected, incognito detected) built in Part 8.
// ============================================================
export async function reportWatchEvent(req, res) {
  const { token, type } = req.body
  if (!token || !type) throw new AppError('token and type are required', 400, 'BAD_REQUEST')

  const session = await PlaybackSession.findOne({ token, user: req.user.id, video: req.params.videoId })
  if (!session) throw new AppError('Playback session not found or expired', 404, 'SESSION_NOT_FOUND')

  if (type === 'started') {
    // `consumed` makes this idempotent: if the frontend's timeupdate
    // listener fires the 'started' event twice (re-renders, etc.), the
    // count only ever increments once per session/ticket.
    if (!session.consumed) {
      session.consumed = true
      await session.save()

      await WatchLog.findOneAndUpdate(
        { user: req.user.id, video: req.params.videoId },
        {
          $inc: { count: 1 },
          $set: { lastWatchedAt: new Date() },
          $push: { history: { startedAt: new Date(), suspicious: false } }
        },
        { upsert: true, new: true }
      )
    }
    return res.json({ success: true, counted: true })
  }

  if (type === 'recording_suspected' || type === 'incognito_suspected') {
    // Doesn't affect the watch count (a session already consumed stays
    // consumed) -- this is purely for the admin audit trail, so you can see
    // WHY a session ended abnormally.
    session.flags.push(type)
    await session.save()

    await WatchLog.findOneAndUpdate(
      { user: req.user.id, video: req.params.videoId },
      { $push: { history: { startedAt: new Date(), suspicious: true, reason: type } } },
      { upsert: true }
    )
    return res.json({ success: true, flagged: type })
  }

  if (type === 'ended') {
    // Best-effort: record when playback stopped, for admin visibility only.
    await WatchLog.updateOne(
      { user: req.user.id, video: req.params.videoId, 'history.0': { $exists: true } },
      { $set: { 'history.$[last].endedAt': new Date() } },
      { arrayFilters: [{ 'last.endedAt': { $exists: false } }] }
    ).catch(() => {}) // non-critical, never fail the request over this
    return res.json({ success: true })
  }

  throw new AppError(`Unknown watch-event type: ${type}`, 400, 'BAD_REQUEST')
}
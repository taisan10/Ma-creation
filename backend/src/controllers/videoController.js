import { randomUUID } from 'crypto'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { minioPublicClient, VIDEO_BUCKET } from '../config/minio.js'
import WatchLog from '../models/WatchLog.js'
import PlaybackSession from '../models/PlaybackSession.js'

// ============================================================
// STEP 1: Request a playback token
// Runs AFTER requireVideoEntitlement (req.video, req.course already set +
// . This is where the "max 2x watches" rule is
// actually enforced -- BEFORE any video URL is ever generated.
// ============================================================
export async function requestPlaybackToken(req, res) {
  const video = req.video
  const multiplier = video.maxWatchMultiplier ?? env.videoWatchMultiplier
  const maxAllowedSeconds = (video.durationSeconds || 0) * multiplier

  const existingLog = await WatchLog.findOne({ user: req.user.sub, video: video._id })
  const currentSeconds = existingLog?.totalWatchedSeconds || 0

  if (maxAllowedSeconds > 0 && currentSeconds >= maxAllowedSeconds) {
    throw new AppError(
      `You have already watched this video for ${Math.floor(currentSeconds / 60)} minutes, which is the maximum allowed on your plan.`,
      403,
      'WATCH_LIMIT_REACHED'
    )
  }

  const token = randomUUID()
  const ttlSeconds = env.videoPlaybackUrlTtlSeconds
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

  await PlaybackSession.create({
    user: req.user.sub,
    video: video._id,
    token,
    expiresAt,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  })

  const url = await minioPublicClient.presignedGetObject(VIDEO_BUCKET, video.minioObjectKey, ttlSeconds)

  const remainingSeconds = Math.max(0, maxAllowedSeconds - currentSeconds)

  res.json({
    success: true,
    url,
    sessionToken: token,
    expiresAt,
    totalWatchedSeconds: currentSeconds,
    maxAllowedSeconds,
    videoDurationSeconds: video.durationSeconds || 0,
    multiplier,
    remainingSeconds
  })
}

// ============================================================
// STEP 2: The frontend player reports back what actually happened
// Called by the <video> player once playback genuinely starts (not just on
// page load / URL fetch), and also used to report suspicious signals
// (screen-recording detected, incognito detected) built in Part 8.
// ============================================================
export async function reportWatchEvent(req, res) {
  const { token, type, seconds } = req.body
  if (!token || !type) throw new AppError('token and type are required', 400, 'BAD_REQUEST')

  const session = await PlaybackSession.findOne({ token, user: req.user.sub, video: req.params.videoId })
  if (!session) throw new AppError('Playback session not found or expired', 404, 'SESSION_NOT_FOUND')

  if (type === 'started') {
    if (!session.consumed) {
      session.consumed = true
      await session.save()

      const watchedSeconds = Math.max(0, Math.floor(Number(seconds) || 0))

      await WatchLog.findOneAndUpdate(
        { user: req.user.sub, video: req.params.videoId },
        {
          $inc: { totalWatchedSeconds: watchedSeconds },
          $set: { lastWatchedAt: new Date() },
          $push: { history: { startedAt: new Date(), suspicious: false } }
        },
        { upsert: true, new: true }
      )
    }
    return res.json({ success: true, counted: true })
  }

  if (type === 'recording_suspected' || type === 'incognito_suspected') {
    session.flags.push(type)
    await session.save()

    await WatchLog.findOneAndUpdate(
      { user: req.user.sub, video: req.params.videoId },
      { $push: { history: { startedAt: new Date(), suspicious: true, reason: type } } },
      { upsert: true }
    )
    return res.json({ success: true, flagged: type })
  }

       if (type === 'heartbeat') {
    const hbSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
    if (hbSeconds > 0) {
      const updated = await WatchLog.findOneAndUpdate(
        { user: req.user.sub, video: req.params.videoId },
        { $inc: { totalWatchedSeconds: hbSeconds } },
        { upsert: true, new: true }
      )
      const video = await import('../models/Video.js').then(m => m.default.findById(req.params.videoId))
      const multiplier = video?.maxWatchMultiplier ?? (await import('../config/env.js').then(m => m.env.videoWatchMultiplier))
      const maxAllowed = (video?.durationSeconds || 0) * multiplier
      if (maxAllowed > 0 && updated.totalWatchedSeconds >= maxAllowed) {
        return res.json({ success: true, watchLimitReached: true })
      }
    }
    return res.json({ success: true })
  }

   if (type === 'ended') {
    const endedSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
    const incOps = { totalWatchedSeconds: endedSeconds }
    await WatchLog.findOneAndUpdate(
      { user: req.user.sub, video: req.params.videoId, 'history.0': { $exists: true } },
      {
        $inc: incOps,
        $set: { 'history.$[last].endedAt': new Date() }
      },
      { arrayFilters: [{ 'last.endedAt': { $exists: false } }] }
    ).catch(() => {})
    return res.json({ success: true })
  }

  throw new AppError(`Unknown watch-event type: ${type}`, 400, 'BAD_REQUEST')
}
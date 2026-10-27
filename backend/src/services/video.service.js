import { randomUUID, createHmac } from 'crypto'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'
import { minioPublicClient, VIDEO_BUCKET } from '../config/minio.js'
import WatchLog from '../models/WatchLog.js'
import PlaybackSession from '../models/PlaybackSession.js'
import Video from '../models/Video.js'
import User from '../models/User.js'
import SecurityIncident from '../models/SecurityIncident.js'

export class VideoService {

  //  * Request a secure, time-bound playback token enforcing max watch limit and lock status
 
  static async requestPlaybackToken({ video, userId, ip, userAgent }) {
    const user = await User.findById(userId)
    if (user?.playbackLocked) {
      const lastIncident = await SecurityIncident.findOne({ user: userId, status: 'pending_review' }).sort({ createdAt: -1 })
      const lastSecs = lastIncident?.lastWatchedSeconds || 0
      throw new AppError(
        `Playback is locked due to suspected screen recording or capture attempt. Please wait for Admin approval to resume from ${Math.floor(lastSecs / 60)}m ${lastSecs % 60}s.`,
        403,
        'PLAYBACK_LOCKED_PENDING_ADMIN'
      )
    }

    const multiplier = video.maxWatchMultiplier ?? env.videoWatchMultiplier
    const maxAllowedSeconds = (video.durationSeconds || 0) * multiplier

    const existingLog = await WatchLog.findOne({ user: userId, video: video._id })
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
      user: userId,
      video: video._id,
      token,
      expiresAt,
      ip,
      userAgent,
    })

    const url = (video.isHlsReady && video.hlsManifestKey)
      ? `/api/videos/${video._id}/hls/manifest.m3u8`
      : await minioPublicClient.presignedGetObject(VIDEO_BUCKET, video.minioObjectKey, ttlSeconds)
    const remainingSeconds = Math.max(0, maxAllowedSeconds - currentSeconds)

    return {
      url,
      sessionToken: token,
      expiresAt,
      totalWatchedSeconds: currentSeconds,
      maxAllowedSeconds,
      videoDurationSeconds: video.durationSeconds || 0,
      multiplier,
      remainingSeconds,
      clientIp: ip
    }
  }

  /**
   * Derive a deterministic, military-grade 16-byte AES-128 key for a video using HMAC-SHA256
   */
  static getVideoKeyBuffer(videoId) {
    return createHmac('sha256', env.videoDrmSecret || env.jwtSecret)
      .update(String(videoId))
      .digest()
      .subarray(0, 16)
  }

  /**
   * Secure key delivery: Verifies entitlement and watch quota before serving AES-128 key
   */
  static async getVideoKey({ video, userId, req }) {
    const user = await User.findById(userId)
    if (user?.playbackLocked) {
      throw new AppError('Playback locked by security policy. Admin approval required.', 403, 'PLAYBACK_LOCKED')
    }

    // Anti-leech / Hotlinking Protection (Works dynamically for both Localhost & Production Domain)
    if (req && env.clientUrl) {
      const origin = req.headers.origin || req.headers.referer || '';
      if (origin && !origin.startsWith(env.clientUrl)) {
        throw new AppError('Key request from unauthorized domain denied', 403, 'UNAUTHORIZED_DOMAIN')
      }
    }

    const multiplier = video.maxWatchMultiplier ?? env.videoWatchMultiplier ?? 2;
    const maxAllowedSeconds = (video.durationSeconds || 0) * multiplier

    if (maxAllowedSeconds > 0) {
      const existingLog = await WatchLog.findOne({ user: userId, video: video._id })
      const currentSeconds = existingLog?.totalWatchedSeconds || 0
      if (currentSeconds >= maxAllowedSeconds) {
        throw new AppError('Watch limit reached for this video. Key delivery denied.', 403, 'WATCH_LIMIT_REACHED')
      }
    }

    // 2. Fetch Actual AES-128 key from MongoDB (Explicity selecting hidden key field)
    const videoWithKey = await Video.findById(video._id).select("+encryptionKeyHex");
    if(videoWithKey?.encryptionKeyHex){
      return Buffer.from(videoWithKey.encryptionKeyHex,'hex');
    }

    // fallback for Legacy videos:
    return this.getVideoKeyBuffer(video._id)
  }

  
  //  Handle video player lifecycle events (started, heartbeat, recording/incognito, ended)
   
  static async reportWatchEvent({ token, type, seconds, userId, videoId }) {
    if (!token || !type) throw new AppError('token and type are required', 400, 'BAD_REQUEST')

    const session = await PlaybackSession.findOne({ token, user: userId, video: videoId })
    if (!session) throw new AppError('Playback session not found or expired', 404, 'SESSION_NOT_FOUND')

    if (type === 'started') {
      if (!session.consumed) {
        session.consumed = true
        await session.save()

        const watchedSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
        await WatchLog.findOneAndUpdate(
          { user: userId, video: videoId },
          {
            $inc: { totalWatchedSeconds: watchedSeconds },
            $set: { lastWatchedAt: new Date() },
            $push: { history: { startedAt: new Date(), suspicious: false } },
          },
          { upsert: true, new: true }
        )
      }
      return { counted: true }
    }

    if (type === 'incognito_suspected') {
      // Incognito does NOT increment strikes or lock the user account permanently
      session.consumed = true
      session.expiresAt = new Date()
      session.flags.push(type)
      await session.save()
      return { flagged: type, locked: false, message: 'Please open in normal window' }
    }

    if (type === 'recording_suspected' || type === 'screenshot_suspected' || type === 'blur_suspected') {
      // 1. Immediately kill active playback session
      session.consumed = true
      session.expiresAt = new Date()
      session.flags.push(type)
      await session.save()

      // 2. Increment user's recording strikes and lock playback
      await User.findByIdAndUpdate(userId, {
        $inc: { recordingStrikes: 1 },
        $set: { playbackLocked: true, playbackLockedAt: new Date() },
      })

      // 3. Find latest watch progress to preserve exact time
      const watchLog = await WatchLog.findOne({ user: userId, video: videoId })
      const lastWatchedSeconds = watchLog?.totalWatchedSeconds || 0

      // 4. Create SecurityIncident for Admin Review
      const videoDoc = await Video.findById(videoId)
      await SecurityIncident.create({
        user: userId,
        video: videoId,
        course: videoDoc?.course,
        type,
        ip: session.ip,
        userAgent: session.userAgent,
        lastWatchedSeconds,
        status: 'pending_review',
      })

      await WatchLog.findOneAndUpdate(
        { user: userId, video: videoId },
        { $push: { history: { startedAt: new Date(), suspicious: true, reason: type } } },
        { upsert: true }
      )
      return { flagged: type, locked: true, lastWatchedSeconds }
    }

    if (type === 'heartbeat') {
      const hbSeconds = Math.max(0, Math.min(60, Math.floor(Number(seconds) || 0))); // Cap Heartbeat to max 60s
      if (hbSeconds > 0) {
        const updated = await WatchLog.findOneAndUpdate(
          { user: userId, video: videoId },
          { $inc: { totalWatchedSeconds: hbSeconds }, $set: {lastWatchedAt: new Date()} },
          { upsert: true, new: true }
        )
        const video = await Video.findById(videoId)
        const multiplier = video?.maxWatchMultiplier ?? env.videoWatchMultiplier ?? 2;
        const maxAllowed = (video?.durationSeconds || 0) * multiplier;
        const remainingSeconds = Math.max(0, maxAllowed - updated.totalWatchedSeconds);

        if (maxAllowed > 0 && updated.totalWatchedSeconds >= maxAllowed) {
          return { watchLimitReached: true, remainingSeconds: 0, totalWatchedSeconds: updated.totalWatchedSeconds};
        }
        return { remainingSeconds, totalWatchedSeconds: updated.totalWatchedSeconds };
      }
      return {}
    }

    if (type === 'ended') {
      const endedSeconds = Math.max(0, Math.min(60, Math.floor(Number(seconds) || 0)))
      await WatchLog.findOneAndUpdate(
        { user: userId, video: videoId, 'history.0': { $exists: true } },
        {
          $inc: { totalWatchedSeconds: endedSeconds },
          $set: { 'history.$[last].endedAt': new Date() },
        },
        { arrayFilters: [{ 'last.endedAt': { $exists: false } }] }
      ).catch(() => {})
      return {}
    }

    throw new AppError(`Unknown watch-event type: ${type}`, 400, 'BAD_REQUEST')
  }
}

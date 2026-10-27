import { VideoService } from '../services/video.service.js'
import { HlsService } from '../services/hls.service.js'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'
import { AppError } from '../utils/AppError.js'

export async function requestPlaybackToken(req, res) {
  const result = await VideoService.requestPlaybackToken({
    video: req.video,
    userId: req.user.sub,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  })
  res.json({ success: true, ...result })
}

export async function reportWatchEvent(req, res) {
  const result = await VideoService.reportWatchEvent({
    token: req.body.token,
    type: req.body.type,
    seconds: req.body.seconds,
    userId: req.user.sub,
    videoId: req.params.videoId,
  })
  res.json({ success: true, ...result })
}

export async function getVideoKey(req, res) {
  const keyBuffer = await VideoService.getVideoKey({
    video: req.video,
    userId: req.user.sub,
    req,
  })

  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': keyBuffer.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
  })

  res.send(keyBuffer)
}

export async function getHlsManifest(req, res) {
  const video = req.video
  if (!video.isHlsReady || !video.hlsManifestKey) {
    throw new AppError('HLS stream not ready for this video', 404, 'HLS_NOT_READY')
  }

  res.set({
    'Content-Type': 'application/vnd.apple.mpegurl',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  })

  const stream = await minioClient.getObject(VIDEO_BUCKET, video.hlsManifestKey)
  stream.pipe(res)
}

export async function getHlsSegment(req, res) {
  const video = req.video
  const segment = req.params.segment

  // Security check against path traversal
  if (!/^(master\.m3u8|res_\w+\.m3u8|res_\w+_seg_\d+\.ts|segment_\d+\.ts)$/.test(segment)) {
    throw new AppError('Invalid segment requested', 400, 'BAD_REQUEST')
  }

  if (!video.isHlsReady || !video.hlsDirectory) {
    throw new AppError('HLS stream not ready for this video', 404, 'HLS_NOT_READY')
  }

  const isplaylist = segment.endsWith('.m3u8');
  res.set({
    'Content-Type': isplaylist ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
    'Cache-Control': isplaylist ? 'no-cache, no-store, must-revalidate' : 'public, max-age=31536000, immutable',
  })

  const objectKey = `${video.hlsDirectory}/${segment}`
  const stream = await minioClient.getObject(VIDEO_BUCKET, objectKey)
  stream.pipe(res)
}

export async function transcodeVideoHls(req, res) {
  const result = await HlsService.transcodeVideo(req.params.videoId)
  res.json({ success: true, ...result })
}
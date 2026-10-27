import fs from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'
import { minioClient, VIDEO_BUCKET } from '../config/minio.js'
import { VideoService } from './video.service.js'
import Video from '../models/Video.js'

function getFfmpegBinary() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH

  // Windows: Check WinGet packages dynamically via LOCALAPPDATA
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const wingetBase = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Packages')
    try {
      if (fs.existsSync(wingetBase)) {
        const dirs = fs.readdirSync(wingetBase)
        const ffmpegDir = dirs.find(d => d.toLowerCase().includes('gyan.ffmpeg'))
        if (ffmpegDir) {
          const fullDir = path.join(wingetBase, ffmpegDir)
          const subdirs = fs.readdirSync(fullDir)
          const buildDir = subdirs.find(d => d.toLowerCase().includes('build'))
          if (buildDir) {
            const binPath = path.join(fullDir, buildDir, 'bin', 'ffmpeg.exe')
            if (fs.existsSync(binPath)) return binPath
          }
        }
      }
    } catch {
      // ignore and fallback to system ffmpeg
    }
  }

  // Default: System PATH (standard for Linux VPS / Docker / macOS / Windows PATH)
  return 'ffmpeg'
}

export class HlsService {
  /**
   * Transcode a Video document's source MP4 into an AES-128 encrypted HLS stream
   */
  static async transcodeVideo(videoId) {
    const video = await Video.findById(videoId)
    if (!video) throw new Error(`Video not found: ${videoId}`)
    if (!video.minioObjectKey || video.minioObjectKey.startsWith('pending/')) {
      throw new Error(`Video source object not found in MinIO for video: ${videoId}`)
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `hls-${videoId}-`))
    const inputPath = path.join(tempDir, 'source.mp4')
    const keyPath = path.join(tempDir, 'enc.key')
    const keyInfoPath = path.join(tempDir, 'enc.keyinfo')
    const manifestPath = path.join(tempDir, 'manifest.m3u8')
    const segmentPattern = path.join(tempDir, 'segment_%03d.ts')

    try {
      console.log(`[HLS] Starting AES-128 encryption pipeline for video ${videoId}...`)

      // 1. Download source MP4 from MinIO to tempDir
      await minioClient.fGetObject(VIDEO_BUCKET, video.minioObjectKey, inputPath)

      // 2. Derive deterministic 16-byte AES-128 key
      const keyBuffer = VideoService.getVideoKeyBuffer(video._id)
      fs.writeFileSync(keyPath, keyBuffer)

      // 3. Write keyinfo file (Line 1: Key delivery URI, Line 2: Local key path)
      const keyDeliveryUri = `/api/videos/${videoId}/key`
      const keyInfoContent = `${keyDeliveryUri}\n${keyPath}\n`
      fs.writeFileSync(keyInfoPath, keyInfoContent, 'utf8')

      // 4. Run FFmpeg HLS slicing & AES-128 encryption
      const ffmpegBin = getFfmpegBinary()
      await this.runFfmpegHls({ ffmpegBin, inputPath, keyInfoPath, manifestPath, segmentPattern })

      // 5. Upload generated HLS files (.m3u8 and .ts) to MinIO
      const hlsDirPrefix = `courses/${video.course}/hls/${video._id}`
      const generatedFiles = fs.readdirSync(tempDir)
      const hlsFiles = generatedFiles.filter(f => f.endsWith('.m3u8') || f.endsWith('.ts'))

      console.log(`[HLS] Uploading ${hlsFiles.length} encrypted stream files to MinIO (${hlsDirPrefix})...`)

      for (const file of hlsFiles) {
        const filePath = path.join(tempDir, file)
        const objectKey = `${hlsDirPrefix}/${file}`
        const mimeType = file.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T'
        await minioClient.fPutObject(VIDEO_BUCKET, objectKey, filePath, {
          'Content-Type': mimeType,
          'Cache-Control': file.endsWith('.m3u8') ? 'no-cache' : 'public, max-age=31536000',
        })
      }

      // 6. Update Video model
      video.isHlsReady = true
      video.hlsDirectory = hlsDirPrefix
      video.hlsManifestKey = `${hlsDirPrefix}/manifest.m3u8`
      await video.save()

      console.log(`[HLS] Video ${videoId} successfully transcoded with AES-128 DRM!`)
      return { success: true, hlsManifestKey: video.hlsManifestKey }
    } finally {
      // Clean up temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true })
      } catch (err) {
        console.warn(`[HLS] Failed to clean tempDir ${tempDir}:`, err.message)
      }
    }
  }

  /**
   * Execute FFmpeg command with fast copy or fallback re-encode
   */
  static runFfmpegHls({ ffmpegBin, inputPath, keyInfoPath, manifestPath, segmentPattern }) {
    return new Promise((resolve, reject) => {
      // Try fast stream copy first
      const copyArgs = [
        '-y',
        '-i', inputPath,
        '-c:v', 'copy',
        '-c:a', 'copy',
        '-hls_time', '6',
        '-hls_playlist_type', 'vod',
        '-hls_key_info_file', keyInfoPath,
        '-hls_segment_filename', segmentPattern,
        manifestPath,
      ]

      const proc = spawn(ffmpegBin, copyArgs)
      let stderr = ''

      proc.stderr.on('data', chunk => {
        stderr += chunk.toString()
      })

      proc.on('close', code => {
        if (code === 0) return resolve()

        console.warn(`[HLS] Fast copy failed (code ${code}), falling back to libx264 re-encoding...`)
        // Fallback re-encode args
        const encodeArgs = [
          '-y',
          '-i', inputPath,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '22',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-hls_time', '6',
          '-hls_playlist_type', 'vod',
          '-hls_key_info_file', keyInfoPath,
          '-hls_segment_filename', segmentPattern,
          manifestPath,
        ]

        const fallbackProc = spawn(ffmpegBin, encodeArgs)
        let fallbackStderr = ''

        fallbackProc.stderr.on('data', chunk => {
          fallbackStderr += chunk.toString()
        })

        fallbackProc.on('close', fallbackCode => {
          if (fallbackCode === 0) return resolve()
          reject(new Error(`FFmpeg HLS failed (code ${fallbackCode}): ${fallbackStderr.slice(-500)}`))
        })

        fallbackProc.on('error', err => reject(err))
      })

      proc.on('error', err => reject(err))
    })
  }
}

import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Video from '../models/Video.js'
import Course from '../models/Course.js'
import { Client as MinioClient } from 'minio'

const minio = new MinioClient({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY
})

const BUCKET = 'ma-course-videos'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return 'N/A'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`
  }
  return `${mins}m ${secs}s`
}

async function runDetailedScan() {
  await connectDB()

  console.log(`\n======================================================`)
  console.log(`🔍 DIRECT MINIO API SCANNING: bucket "${BUCKET}"`)
  console.log(`======================================================`)

  // Structure: coursesMap[courseId][videoId] = { files, 1080p, 720p, 360p, other, total }
  const coursesMap = new Map()

  const stream = minio.listObjects(BUCKET, '', true)

  let totalObjectsCount = 0
  let totalBucketBytes = 0

  for await (const obj of stream) {
    totalObjectsCount++
    totalBucketBytes += obj.size

    const parts = obj.name.split('/')
    let courseId = 'uncategorized'
    let videoId = 'unknown'

    if (parts[0] === 'courses') {
      courseId = parts[1] || 'root'
      videoId = parts[2] || 'root'
    } else {
      courseId = 'other_folders'
      videoId = parts[0]
    }

    if (!coursesMap.has(courseId)) {
      coursesMap.set(courseId, new Map())
    }
    const videosInCourse = coursesMap.get(courseId)

    if (!videosInCourse.has(videoId)) {
      videosInCourse.set(videoId, {
        videoId,
        courseId,
        fullPath: `courses/${courseId}/${videoId}/hls`,
        bytes1080p: 0,
        count1080p: 0,
        bytes720p: 0,
        count720p: 0,
        bytes360p: 0,
        count360p: 0,
        bytesPlaylists: 0,
        countPlaylists: 0,
        totalBytes: 0,
        totalFiles: 0,
      })
    }

    const vStat = videosInCourse.get(videoId)
    vStat.totalBytes += obj.size
    vStat.totalFiles += 1

    const fileName = parts[parts.length - 1].toLowerCase()
    if (fileName.includes('1080p')) {
      vStat.bytes1080p += obj.size
      vStat.count1080p += 1
    } else if (fileName.includes('720p')) {
      vStat.bytes720p += obj.size
      vStat.count720p += 1
    } else if (fileName.includes('360p')) {
      vStat.bytes360p += obj.size
      vStat.count360p += 1
    } else if (fileName.endsWith('.m3u8')) {
      vStat.bytesPlaylists += obj.size
      vStat.countPlaylists += 1
    }
  }

  const detailedReport = []

  for (const [courseId, videosMap] of coursesMap.entries()) {
    let courseDoc = null
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      courseDoc = await Course.findById(courseId).select('title')
    }

    const courseData = {
      courseId,
      courseTitle: courseDoc?.title || (courseId.startsWith('6') ? `Course (${courseId.slice(-6)})` : courseId),
      videos: []
    }

    for (const [videoId, vStat] of videosMap.entries()) {
      let videoDoc = null
      if (mongoose.Types.ObjectId.isValid(videoId)) {
        videoDoc = await Video.findById(videoId).select('title durationSeconds status isHlsReady')
      }

      courseData.videos.push({
        videoId,
        title: videoDoc?.title || `Video_${videoId.slice(-6)}`,
        status: videoDoc?.status || 'N/A',
        durationSeconds: videoDoc?.durationSeconds || 0,
        durationFormatted: formatDuration(videoDoc?.durationSeconds || 0),
        bytes1080p: vStat.bytes1080p,
        size1080pFormatted: formatBytes(vStat.bytes1080p),
        count1080p: vStat.count1080p,
        bytes720p: vStat.bytes720p,
        size720pFormatted: formatBytes(vStat.bytes720p),
        count720p: vStat.count720p,
        bytes360p: vStat.bytes360p,
        size360pFormatted: formatBytes(vStat.bytes360p),
        count360p: vStat.count360p,
        totalBytes: vStat.totalBytes,
        totalFormatted: formatBytes(vStat.totalBytes),
        totalFiles: vStat.totalFiles,
        folderPath: vStat.fullPath
      })
    }

    detailedReport.push(courseData)
  }

  console.log(`TOTAL_OBJECTS: ${totalObjectsCount}`)
  console.log(`TOTAL_BUCKET_SIZE: ${formatBytes(totalBucketBytes)} (${(totalBucketBytes / (1024 * 1024)).toFixed(2)} MB)`)
  console.log('\n---DETAILED_JSON_START---')
  console.log(JSON.stringify(detailedReport, null, 2))
  console.log('---DETAILED_JSON_END---')

  await mongoose.disconnect()
}

runDetailedScan().catch(err => {
  console.error('Scan error:', err)
  process.exit(1)
})

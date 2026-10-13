import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Video from '../models/Video.js'
import { HlsService } from '../services/hls.service.js'

async function transcodeAll() {
  console.log('Connecting to database...')
  await connectDB()

  const videos = await Video.find({
    active: true,
    minioObjectKey: { $exists: true, $not: /^pending\// },
  })

  console.log(`Found ${videos.length} eligible videos in database.`)

  for (const video of videos) {
    console.log(`\n--------------------------------------------------`)
    console.log(`Processing: "${video.title}" (ID: ${video._id})`)
    if (video.isHlsReady && video.hlsManifestKey) {
      console.log(`Video already has HLS ready at: ${video.hlsManifestKey}. Skipping.`)
      continue
    }

    try {
      const result = await HlsService.transcodeVideo(video._id)
      console.log(`SUCCESS: Transcoded to HLS:`, result.hlsManifestKey)
    } catch (err) {
      console.error(`ERROR transcoding ${video._id}:`, err.message)
    }
  }

  console.log('\nAll done!')
  await mongoose.disconnect()
}

transcodeAll().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})

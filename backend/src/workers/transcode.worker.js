import { Worker } from "bullmq";
import fs from "fs";
import path from "path";

import { connectDB, disconnectDB } from "../config/db.js";
import { redisOptions } from "../config/redis.js";
import { VIDEO_TRANSCODE_QUEUE } from "../queues/video.queue.js";
import { TranscodeService } from "../services/transcode.service.js";
import Video from "../models/Video.js";

async function processTranscodeJob(job) {
  const { videoId, rawFilePath } = job.data;
  let courseId = job.data.courseId;
  
  console.log(`\n[Worker] 🎬 Processing video: ${videoId}`);

  // 🛡️ Check file existence before processing
  if (!fs.existsSync(rawFilePath)) {
    throw new Error(`Raw video file not found at: ${rawFilePath}`);
  }

  // 🛡️ Check if video was deleted from MongoDB while in queue
  const videoExists = await Video.findById(videoId);
  if (!videoExists) {
    console.log(`[Worker] ⚠️ Video ${videoId} was deleted from database. Skipping and cleaning NVMe.`);
    try {
      fs.rmSync(path.dirname(rawFilePath), { recursive: true, force: true });
    } catch {}
    return;
  }

  const uploadDir = path.dirname(rawFilePath);
  const hlsOutputDir = path.join(uploadDir, "hls");
  fs.mkdirSync(hlsOutputDir, { recursive: true });

  try{
   // 1. Probe Metadata (Duration, Codecs)
  console.log(`[Worker] Probing video duration via ffprobe...`);
  const meta = await TranscodeService.probeMetadata(rawFilePath);
  console.log(`[Worker] Duration: ${meta.durationSeconds}s | Res: ${meta.width}x${meta.height}`);

   // 2. Mark Processing with accurate duration in MongoDB
  await Video.findByIdAndUpdate(videoId, {
    status: "PROCESSING",
    durationSeconds: meta.durationSeconds,
    processingProgress: 5,
    errorMessage: null,
  });

    // 3. Generate AES-128 Key & Info file
  console.log(`[Worker] Generating unique AES-128 DRM Key...`);
  const { keyInfoPath } = await TranscodeService.setupDrmKey(videoId, uploadDir);

  // 4. Run FFmpeg ABR Transcoding (1080p, 720p, 360p)
  let lastProgress = 5;
  await TranscodeService.runFfmpegAbr({
    rawFilePath,
    hlsOutputDir,
    keyInfoPath,
    totalDurationSeconds: meta.durationSeconds,
    onProgress: async (progress) => {
      if (progress - lastProgress >= 5) {
        lastProgress = progress;
        // Check if video was deleted mid-transcode by admin
        const updated = await Video.findByIdAndUpdate(videoId, { processingProgress: progress });
        if (!updated) {
          console.log(`[Worker] ⚠️ Video ${videoId} was deleted mid-transcode. Aborting and cleaning NVMe.`);
          try { fs.rmSync(uploadDir, { recursive: true, force: true }); } catch {}
          await job.remove().catch(() => {});
          throw new Error('VIDEO_DELETED_BY_ADMIN');
        }
        job.updateProgress(progress).catch(() => {});
        console.log(`[Worker Progress] Video ${videoId}: ${progress}%`);
      }
    },
  });
  
  console.log(`[Worker] ✅ Transcoding finished for video ${videoId}! Multi-Bitrate HLS ready.`);

   // 5. Phase 4: Upload HLS to MinIO (Excludes enc.key automatically)
    if (!courseId) {
      const vDoc = await Video.findById(videoId).select("course");
      courseId = vDoc?.course?.toString() || "default";
    }
    const { hlsDirectory, hlsManifestKey } = await TranscodeService.uploadHlsToMinio({
      videoId,
      courseId,
      hlsOutputDir,
    });
    // 6. Mark Video as READY in MongoDB and activate for students
    await Video.findByIdAndUpdate(videoId, {
      status: "READY",
      isHlsReady: true,
      hlsDirectory,
      hlsManifestKey,
      processingProgress: 100,
      errorMessage: null,
      active: true,
    });
    console.log(`[Worker] 🎉 Video ${videoId} is now READY and ACTIVE for students on MinIO!`);
    return { videoId, status: "READY", hlsManifestKey };
  } finally {
    // 🛡️ GUARANTEED CLEANUP: Wipe /tmp/uploads/{videoId} to keep NVMe at 0% residue
    try {
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
        console.log(`[Worker NVMe Cleanup] Purged temporary directory: ${uploadDir}`);
      }
    } catch (cleanupErr) {
      console.error(`[Worker Cleanup Error] Failed to delete ${uploadDir}:`, cleanupErr.message);
    }
  }
}



async function startWorker() {
  // Reusing existing connectDB
  await connectDB();

  
  const worker = new Worker(
    VIDEO_TRANSCODE_QUEUE,
    async (job) => {
              try {
        return await processTranscodeJob(job);
      } catch (err) {
        console.error(`[Worker Job Failed] Video ${job.data.videoId}:`, err.message);
        await Video.findByIdAndUpdate(job.data.videoId, {
          status: "FAILED",
          errorMessage: err.message,
        }).catch(() => {});
        throw err;
      }
    },
     {
      connection: redisOptions,
      concurrency: 1, // 🔒 Strict 1-Job Limit for KVM-2 2 vCPU stability
      lockDuration: 1800000, // 30 minutes lock for long lectures
    }
  );

   worker.on("active", (job) => console.log(`[Worker] Job ${job.id} active`));
  worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} completed!`));
  worker.on("failed", (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));

  console.log(`[BullMQ Worker] 🚀 Transcoder listening on '${VIDEO_TRANSCODE_QUEUE}' (Concurrency: 1)`);

    const shutdown = async () => {
    console.log("\n[Worker] Graceful shutdown...");
    try {
      await Promise.race([
        worker.close(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch {
      // ignore
    }
    await disconnectDB().catch(() => {});
    process.exit(0);
  };


   process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorker();
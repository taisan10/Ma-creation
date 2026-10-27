import { Queue } from "bullmq";
import { redisOptions } from "../config/redis.js";

export const VIDEO_TRANSCODE_QUEUE = "video-transcode-queue";

// BullMQ Producer : queue ka use for Video Transcoding
// BullMQ Worker : Worker COntainer jo queue mai se job lega or ose manage krega

export const videoTranscodeQueue = new Queue(VIDEO_TRANSCODE_QUEUE, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true, // Permanent auto-delete from Redis when finished
    removeOnFail: true, // Permanent auto-delete from Redis if failed/cancelled
  },
});

videoTranscodeQueue.on("error", (err) => {
  console.error("[BullMQ Queue Error]:", err.message);
});

//  Dispatch video transcoding job to BullMQ
export async function addVideoToTranscodeQueue({
  videoId,
  courseId,
  rawFilePath,
}) {
  const vid = String(videoId);
  const targetJobId = `transcode-${vid}`;

  
  // Purane failed/stale job ko clean karein taaki re-upload fail na ho
  try {
    const existingJob = await videoTranscodeQueue.getJob(targetJobId);
    if (existingJob) {
      await existingJob.remove();
    }
  } catch (err) {
    console.warn(`[BullMQ] Warning cleaning existing job ${targetJobId}:`, err.message);
  }

  return await videoTranscodeQueue.add(
    "transcode-job",
    {
      videoId: vid,
      courseId: String(courseId),
      rawFilePath,
    },
     {
      jobId: targetJobId,
    },
  );
}

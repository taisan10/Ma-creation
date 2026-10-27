import Busboy from "busboy";
import fs from "fs";
import path from "path";
import Video from "../models/Video.js";
import Course from "../models/Course.js";
import { AppError } from "../utils/AppError.js";
import { uploadVideoHeadersSchema } from "../validators/video.validator.js";
import { addVideoToTranscodeQueue } from "../queues/video.queue.js";

const ALLOWED_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/matroska",
  "video/mkv",
];
const ALLOWED_EXTENSIONS = [".mp4", ".webm", ".mov", ".mkv"];
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024;
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function zeroRamVideoUpload(req, res, next) {
  let videoDoc = null;

  
  // 1. Resolve or Create Video Document
  try{
  if (req.params.id) {
     // Mode A: Existing video ID passed in URL (:id) - Admin UI ke liye
       if (!OBJECT_ID_REGEX.test(req.params.id)) {
        return next(new AppError("Invalid Video ID format", 400, "INVALID_ID"));
      }
    videoDoc = await Video.findById(req.params.id);
    if (!videoDoc) {
      return next(new AppError("Video not found", 404, "NOT_FOUND"));
    }
    videoDoc.status = "UPLOADING";
    await videoDoc.save();
    } else {
    // Mode B: Single-step upload with headers
    const headerResult = uploadVideoHeadersSchema.safeParse(req.headers);
    if (!headerResult.success) {
      const errorMsg = headerResult.error.issues.map((i) => i.message).join(", ");
      return next(new AppError(`Invalid upload headers: ${errorMsg}`, 400, "BAD_REQUEST"));
    }

      const {
      "x-course-id": courseId,
      "x-video-title": title,
      "x-video-description": description,
      "x-video-order": order,
      "x-max-watch-multiplier": maxWatchMultiplier,
    } = headerResult.data;

  const courseExists = await Course.exists({ _id: courseId });
    if (!courseExists) {
      return next(new AppError("Course not found for this video", 404, "COURSE_NOT_FOUND"));
    }

     videoDoc = await Video.create({
      course: courseId,
      title,
      description: description || "",
      order: order || 0,
      maxWatchMultiplier: maxWatchMultiplier || null,
      status: "UPLOADING",
      active: false,
    });
  }
}
catch (err) {
    return next(err);
  }

  
  const videoId = videoDoc._id.toString();
  const uploadDir = path.join("/tmp/uploads", videoId);
  const rawFilePath = path.join(uploadDir, "raw.mp4");

   // NVMe shared volume par folder banayein
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    return next(new AppError(`Failed to initialize upload directory: ${err.message}`, 500, "FS_ERROR"));
  }

  
  let busboy;
  try {
    busboy = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_VIDEO_BYTES },
    });
  } catch (err) {
    fs.rmSync(uploadDir, { recursive: true, force: true });
    return next(new AppError("Invalid multipart request", 400, "BAD_REQUEST"));
  }

  let fileFieldSeen = false;
  let uploadCompleted = false;
  let hasError = false;
  let activeFileStream = null;
  let fileWriteStream = null;
  let bytesWritten = 0;

  // 🛡️ Abort Safety: Cleans up partial files if client disconnects midway
  const cleanupPartialUpload = async (reason = "aborted") => {
    if (uploadCompleted) return;
    uploadCompleted = true;

    if (activeFileStream) {
      try {
        activeFileStream.unpipe();
        activeFileStream.resume(); // drain remaining incoming chunks to prevent write-after-destroy
      } catch (_) {}
    }

    if (fileWriteStream && !fileWriteStream.destroyed) {
      try {
        fileWriteStream.destroy();
      } catch (_) {}
    }
    try {
      if (fs.existsSync(uploadDir)) {
        fs.rmSync(uploadDir, { recursive: true, force: true });
        console.warn(`[Zero-RAM Ingestion] Partial upload deleted for video ${videoId} (Reason: ${reason})`);
      }
    } catch (e) {
      console.error("[Zero-RAM Ingestion] Cleanup error:", e.message);
    }

    await Video.findByIdAndUpdate(videoId, {
      status: "FAILED",
      errorMessage: `Upload interrupted: ${reason}`,
    }).catch(() => {});
  };

  req.on("aborted", () => cleanupPartialUpload("client_aborted"));
  req.on("close", () => {
    // 🛡️ CRITICAL FIX: In Node.js, req emits 'close' when the request stream completes!
    // Only treat as aborted if req.complete is FALSE (meaning client actually disconnected midway).
    // If req.complete is TRUE, the entire video body was received successfully!
    if (!req.complete && !uploadCompleted && !res.writableEnded) {
      cleanupPartialUpload("connection_closed_prematurely");
    }
  });

  busboy.on("file", (fieldName, fileStream, info) => {
    const { filename, mimeType } = info;
    const ext = path.extname(filename || "").toLowerCase();
    const isAllowed =
      ALLOWED_EXTENSIONS.includes(ext) &&
      ALLOWED_MIME_TYPES.includes(mimeType?.toLowerCase());

    if (!isAllowed) {
      fileStream.resume(); // drain stream to prevent hang
      cleanupPartialUpload(`unsupported_file_${ext}_${mimeType}`);
      return next(
        new AppError(
          `Invalid file format. Only video files (.mp4, .webm, .mov, .mkv) with matching video MIME types are allowed.`,
          400,
          "UNSUPPORTED_MEDIA_TYPE"
        )
      );
    }

    fileFieldSeen = true;
    activeFileStream = fileStream;
    fileWriteStream = fs.createWriteStream(rawFilePath);

    // Busboy 5GB truncation vulnerability
    fileStream.on("limit", () => {
      hasError = true;
      fileStream.resume(); // drain remaining
      cleanupPartialUpload("file_size_exceeded_5gb");
      return next(new AppError("Video file exceeds the 5GB maximum size limit", 413, "PAYLOAD_TOO_LARGE"));
    });

    fileStream.on("data", (chunk) => {
      bytesWritten += chunk.length;
    });

    fileStream.pipe(fileWriteStream);

    fileWriteStream.on("error", (err) => {
      if (uploadCompleted) return;
      hasError = true;
      cleanupPartialUpload(`write_error_${err.message}`);
      next(new AppError(`File write error: ${err.message}`, 500, "DISK_WRITE_ERROR"));
    });
  });

  busboy.on("filesLimit", () => {
    hasError = true;
    cleanupPartialUpload("files_limit_exceeded");
    next(new AppError("Only one video file is allowed per upload", 400, "BAD_REQUEST"));
  });
  busboy.on("error", (err) => {
    hasError = true;
    cleanupPartialUpload(`busboy_error_${err.message}`);
    next(new AppError(`Upload parser error: ${err.message}`, 400, "BAD_REQUEST"));
  });
  busboy.on("finish", async () => {

    // 🛡️ Race condition & double response guard
    if (hasError || uploadCompleted || res.headersSent) return;

    if (!fileFieldSeen) {
      await cleanupPartialUpload("no_file_found");
      return next(new AppError("No video file found in request form-data", 400, "BAD_REQUEST"));
    }

    // 🛡️ Ensure file handle is fully closed on NVMe disk before queueing to worker
    if (fileWriteStream && !fileWriteStream.writableEnded) {
      await new Promise((resolve) => fileWriteStream.end(resolve));
    }

    uploadCompleted = true;

    try {
      // 1. Update Video in MongoDB
      videoDoc.status = "QUEUED";
      videoDoc.fileSizeBytes = bytesWritten;
      videoDoc.errorMessage = null;
      await videoDoc.save();

      // 2. Dispatch Job to BullMQ Queue
      await addVideoToTranscodeQueue({
        videoId: videoDoc._id.toString(),
        courseId: videoDoc.course.toString(),
        rawFilePath,
      });

      console.log(`[Zero-RAM Ingestion] Video ${videoId} (${(bytesWritten / 1024 / 1024).toFixed(2)} MB) queued for transcoding`);

      // 3. Immediate 202 Accepted Response to Admin
      return res.status(202).json({
        success: true,
        message: "Upload Successful! Video is queued for background transcoding.",
        videoId: videoDoc._id,
        status: "QUEUED",
        fileSizeBytes: bytesWritten,
      });
    } catch (err) {
      console.error("[Zero-RAM Ingestion] Queue dispatch failed:", err.message);
      await Video.findByIdAndUpdate(videoId, { status: "FAILED", errorMessage: err.message });
      return next(new AppError(`Failed to queue video for transcoding: ${err.message}`, 500, "QUEUE_ERROR"));
    }
  });
  req.pipe(busboy);
}


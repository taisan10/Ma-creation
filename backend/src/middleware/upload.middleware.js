import Busboy from "busboy";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";
import { minioClient, VIDEO_BUCKET } from "../config/minio.js";
import Video from "../models/LMS/Video.js";
import Course from "../models/LMS/Course.js";
import { AppError } from "../utils/AppError.js";
import { uploadVideoHeadersSchema } from "../validators/video.validator.js";
import { addVideoToTranscodeQueue } from "../queues/video.queue.js";

// --- Configuration Constants ---
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".mkv"];
const VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
  "video/matroska",
  "video/mkv",
];
const MAX_VIDEO_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
const MAX_BOOK_BYTES = 50 * 1024 * 1024; // 50 MB
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// --- Shared Reusable Helpers ---
const drain = (stream) => {
  stream?.unpipe?.();
  stream?.resume?.();
};

const safeFilename = (name, fallback = "file") =>
  path
    .basename(name || fallback)
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "");

const bindAbortWatcher = (req, cleanup) => {
  req.on("aborted", () => cleanup("client_aborted"));
  req.on("close", () => {
    if (!req.complete) cleanup("connection_closed_prematurely");
  });
};

/**
 * Safely creates a Busboy instance with defensive payload and field limits
 */
const createBusboy = (req, limits = {}) => {
  try {
    return Busboy({
      headers: req.headers,
      limits: {
        fieldSize: 256 * 1024, // 256 KB max per text field
        fields: 20, // 20 text fields max
        ...limits,
      },
    });
  } catch (err) {
    throw new AppError(
      "Invalid multipart upload request. Missing or malformed boundary.",
      400,
      "BAD_MULTIPART",
    );
  }
};

/**
 * Resolves or creates Video document for Mode A (:id) or Mode B (headers)
 */
async function resolveVideoDoc(req) {
  if (req.params.id) {
    if (!OBJECT_ID_REGEX.test(req.params.id)) {
      throw new AppError("Invalid Video ID format", 400, "INVALID_ID");
    }
    const video = await Video.findById(req.params.id);
    if (!video) throw new AppError("Video not found", 404, "NOT_FOUND");
    video.status = "UPLOADING";
    return await video.save();
  }

  const result = uploadVideoHeadersSchema.safeParse(req.headers);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join(", ");
    throw new AppError(`Invalid upload headers: ${msg}`, 400, "BAD_REQUEST");
  }

  const {
    "x-course-id": courseId,
    "x-video-title": title,
    "x-video-description": description,
    "x-video-order": order,
    "x-max-watch-multiplier": maxWatchMultiplier,
  } = result.data;

  const courseExists = await Course.exists({ _id: courseId });
  if (!courseExists)
    throw new AppError(
      "Course not found for this video",
      404,
      "COURSE_NOT_FOUND",
    );

  return await Video.create({
    course: courseId,
    title,
    description: description || "",
    order: order || 0,
    maxWatchMultiplier: maxWatchMultiplier || null,
    status: "UPLOADING",
    active: false,
  });
}

/**
 * 1. VIDEO UPLOAD: Zero-RAM Disk Stream + BullMQ Queue
 */
export async function uploadRawVideo(req, res, next) {
  const videoDoc = await resolveVideoDoc(req);
  const videoId = videoDoc._id.toString();
  const uploadDir = path.join("/tmp/uploads", videoId);
  const rawFilePath = path.join(uploadDir, "raw.mp4");

  fs.mkdirSync(uploadDir, { recursive: true });

  const busboy = createBusboy(req, { files: 1, fileSize: MAX_VIDEO_BYTES });

  let fileSeen = false;
  let writeStream = null;
  let activeStream = null;
  let totalBytes = 0;
  let completed = false;

  const cleanup = async (reason) => {
    if (completed) return;
    completed = true;
    drain(activeStream);
    if (writeStream && !writeStream.destroyed) writeStream.destroy();
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
    await Video.findByIdAndUpdate(videoId, {
      status: "FAILED",
      errorMessage: `Upload interrupted: ${reason}`,
    }).catch(() => {});
  };

  bindAbortWatcher(req, cleanup);

  busboy.on("file", (fieldName, fileStream, { filename, mimeType }) => {
    switch (fieldName) {
      case "video":
      case "file": {
        if (fileSeen) return drain(fileStream);
        fileSeen = true;

        const ext = path.extname(filename || "").toLowerCase();
        if (
          !VIDEO_EXTENSIONS.includes(ext) ||
          !VIDEO_MIME_TYPES.includes(mimeType?.toLowerCase())
        ) {
          drain(fileStream);
          cleanup(`unsupported_file_${ext}`);
          return next(
            new AppError(
              "Invalid format. Only video files (.mp4, .webm, .mov, .mkv) are allowed.",
              400,
              "UNSUPPORTED_MEDIA_TYPE",
            ),
          );
        }

        activeStream = fileStream;
        writeStream = fs.createWriteStream(rawFilePath);

        fileStream.on("limit", () => {
          drain(fileStream);
          cleanup("file_size_exceeded_5gb");
          next(
            new AppError(
              "Video file exceeds the 5GB maximum size limit",
              413,
              "PAYLOAD_TOO_LARGE",
            ),
          );
        });

        fileStream.on("data", (chunk) => {
          totalBytes += chunk.length;
        });

        fileStream.on("error", (err) => {
          cleanup(`stream_error_${err.message}`);
          next(
            new AppError(
              `File stream error: ${err.message}`,
              500,
              "STREAM_ERROR",
            ),
          );
        });

        fileStream.pipe(writeStream);
        break;
      }
      default:
        drain(fileStream);
        break;
    }
  });

  busboy.on("error", (err) => {
    cleanup(`busboy_parser_error_${err.message}`);
    if (!res.headersSent) {
      next(
        new AppError(`Upload parser error: ${err.message}`, 400, "BAD_REQUEST"),
      );
    }
  });

  busboy.on("finish", async () => {
    if (completed || res.headersSent) return;
    if (!fileSeen) {
      await cleanup("no_file");
      return next(
        new AppError(
          "No video file found in request form-data",
          400,
          "BAD_REQUEST",
        ),
      );
    }

    if (writeStream && !writeStream.writableEnded) {
      await new Promise((r) => writeStream.end(r));
    }
    completed = true;

    videoDoc.status = "QUEUED";
    videoDoc.fileSizeBytes = totalBytes;
    await videoDoc.save();

    await addVideoToTranscodeQueue({
      videoId,
      courseId: videoDoc.course.toString(),
      rawFilePath,
    });

    res.status(202).json({
      success: true,
      message: "Upload Successful! Video is queued for background transcoding.",
      videoId,
      status: "QUEUED",
      fileSizeBytes: totalBytes,
    });
  });

  req.pipe(busboy);
}

/**
 * 2. BOOK UPLOAD: Zero-RAM MinIO S3 Stream
 */
export function uploadBookFiles(req, res, next) {
  let busboy;
  try {
    busboy = createBusboy(req, { files: 2, fileSize: MAX_BOOK_BYTES });
  } catch (err) {
    return next(err);
  }

  req.body = {};
  let fileSeen = false;
  let fileUploadPromise = null;
  let fileMetadata = null;
  let activePass = null;
  let activeStream = null;
  let activeKey = null;
  let completed = false;

  const cleanup = async (reason) => {
    if (completed) return;
    completed = true;
    drain(activeStream);
    if (activePass && !activePass.destroyed) activePass.destroy();
    if (activeKey) {
      await minioClient.removeObject(VIDEO_BUCKET, activeKey).catch(() => {});
    }
  };

  const fail = async (err) => {
    await cleanup(err.code || "error");
    if (!res.headersSent) next(err);
  };

  bindAbortWatcher(req, cleanup);

  busboy.on("field", (name, val) => {
    req.body[name] = val;
  });

  busboy.on("file", (fieldName, fileStream, { filename, mimeType }) => {
    switch (fieldName) {
      case "file": {
        if (fileSeen) return drain(fileStream);
        fileSeen = true;

        const ext = path.extname(filename || "").toLowerCase();
        if (ext !== ".pdf" || mimeType?.toLowerCase() !== "application/pdf") {
          drain(fileStream);
          return fail(
            new AppError(
              "Only valid PDF books are supported",
              415,
              "INVALID_BOOK_TYPE",
            ),
          );
        }

        const pass = new PassThrough();
        let bytesCount = 0;
        let headerBuffer = Buffer.alloc(0);
        let headerChecked = false;

        activePass = pass;
        activeStream = fileStream;

        fileStream.on("limit", () => {
          drain(fileStream);
          pass.destroy();
          fail(
            new AppError(
              "Book file is too large. Maximum size is 50 MB.",
              413,
              "BOOK_TOO_LARGE",
            ),
          );
        });

        fileStream.on("data", (chunk) => {
          // 🛡️ Magic Byte: Must start with '%PDF-'
          if (!headerChecked) {
            headerBuffer = Buffer.concat([headerBuffer, chunk]);
            if (headerBuffer.length >= 5) {
              headerChecked = true;
              if (headerBuffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
                drain(fileStream);
                pass.destroy();
                return fail(
                  new AppError(
                    "Invalid PDF content. File signature does not match PDF format.",
                    415,
                    "INVALID_PDF_CONTENT",
                  ),
                );
              }
            }
          }
          bytesCount += chunk.length;
        });

        fileStream.on("end", () => {
          if (!headerChecked) {
            pass.destroy();
            return fail(
              new AppError(
                "Invalid PDF content. File is empty or corrupt.",
                415,
                "INVALID_PDF_CONTENT",
              ),
            );
          }
        });

        fileStream.pipe(pass);

        const cleanName = safeFilename(filename, "guide.pdf");
        const fileKey = `books/${Date.now()}_${cleanName}`;
        activeKey = fileKey;

        fileUploadPromise = minioClient
          .putObject(VIDEO_BUCKET, fileKey, pass, undefined, {
            "Content-Type": "application/pdf",
          })
          .then(() => {
            fileMetadata = {
              fileKey,
              filename: cleanName,
              mimeType: "application/pdf",
              size: bytesCount,
              bucket: VIDEO_BUCKET,
            };
          })
          .catch((err) => {
            throw new AppError(
              `MinIO storage error: ${err.message}`,
              500,
              "STORAGE_ERROR",
            );
          });
        break;
      }
      default:
        drain(fileStream);
        break;
    }
  });

  busboy.on("error", (err) => {
    cleanup(`busboy_parser_error_${err.message}`);
    if (!res.headersSent) {
      next(
        new AppError(`Upload parser error: ${err.message}`, 400, "BAD_REQUEST"),
      );
    }
  });

  busboy.on("finish", async () => {
    if (completed || res.headersSent) return;
    if (!fileUploadPromise) {
      return fail(
        new AppError(
          "Please choose a PDF book file.",
          400,
          "BOOK_FILE_REQUIRED",
        ),
      );
    }

    try {
      await fileUploadPromise;
      completed = true;
      req.file = fileMetadata;
      next();
    } catch (err) {
      fail(err);
    }
  });

  req.pipe(busboy);
}

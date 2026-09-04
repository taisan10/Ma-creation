import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxLength: 160 },
    description: { type: String, maxLength: 2000 },
    order: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    thumbnailUrl: { type: String, maxLength: 500 },

    // Path INSIDE the private MinIO bucket, e.g. "courses/<courseId>/<uuid>.mp4".
    // Never expose this raw key to the frontend -- only ever hand out a
    // presigned URL generated from it, on demand, after entitlement +
    // watch-count checks pass (see videoController in Part 5).
    minioObjectKey: { type: String, required: true, trim: true },
    fileSizeBytes: { type: Number },
    mimeType: { type: String, default: "video/mp4" },

     // Per-video override of the global VIDEO_WATCH_MULTIPLIER env default (2).
    // e.g. multiplier 2 means user can watch totalDuration * 2 seconds.
    // null = use global env default.
    maxWatchMultiplier: { type: Number, default: null },

    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

schema.index({ course: 1, order: 1 });

export default mongoose.model("Video", schema);

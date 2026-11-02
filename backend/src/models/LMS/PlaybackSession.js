import mongoose from "mongoose";

// Created every time the server issues a presigned playback URL. The
// frontend player must report a 'started' watch-event back with this
// session's id/token before the watch count increments (see Part 5) -- this
// closes the loop between "we handed out a URL" and "they actually pressed
// play", and `consumed` makes the increment idempotent even if the frontend
// sends the started-event twice (e.g. a re-render).
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },
    token: { type: String, required: true, unique: true }, // opaque random id, returned to the client
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // Mongo TTL auto-cleanup
    consumed: { type: Boolean, default: false }, // true once a 'started' event has counted a watch
    ip: String,
    userAgent: String,
    flags: [{ type: String, maxLength: 60 }], // e.g. 'recording_suspected', 'incognito_suspected'
  },
  { timestamps: true },
);

export default mongoose.model("PlaybackSession", schema);

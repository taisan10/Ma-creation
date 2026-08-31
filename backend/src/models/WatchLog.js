import mongoose from "mongoose";

// ONE document per (user, video) pair. `count` is the server-authoritative
// number of times this user has watched this video -- this is the field the
// "max 3 watches" rule is enforced against. It is NEVER incremented directly
// from a client request; it's only incremented inside videoController when a
// PlaybackSession reports a genuine "started" event (see Part 5), so
// clearing localStorage / using a new browser tab cannot reset or fake it.
const historyEntrySchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    suspicious: { type: Boolean, default: false },
    reason: { type: String, maxLength: 200 }, // e.g. 'recording_suspected', 'incognito_suspected'
  },
  { _id: false },
);

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
    count: { type: Number, default: 0 },
    lastWatchedAt: Date,
    history: [historyEntrySchema],
  },
  { timestamps: true },
);

// A user can only have one watch-log row per video -- this is what makes the
// increment operation in videoController safe to do with a single atomic
// findOneAndUpdate + upsert instead of racy read-then-write.
schema.index({ user: 1, video: 1 }, { unique: true });

export default mongoose.model("WatchLog", schema);

import mongoose from "mongoose";

// A Course sits under one Category (for grouping/display) and is unlocked by
// EXACTLY one Plan (per your clarification: different plans unlock different
// courses). If a course should ever be unlockable by more than one plan,
// change `plan` to `plans: [{ type: ObjectId, ref: 'Plan' }]` later -- kept
// singular for now to match "different plan and courses video also
// different" exactly as described.
const schema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxLength: 160 },
    description: { type: String, maxLength: 2000 },
    thumbnailUrl: { type: String, maxLength: 500 },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

schema.index({ plan: 1, active: 1 });

export default mongoose.model("Course", schema);

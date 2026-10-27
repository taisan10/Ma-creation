import { z } from "zod";
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const uploadVideoHeadersSchema = z.object({
  "x-course-id": z
    .string({ required_error: "Course ID is required in header" })
    .regex(objectIdRegex, "Invalid Course ObjectId"),
  "x-video-title": z
    .string({ required_error: "Video title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(160, "Title cannot exceed 160 characters"),
  "x-video-order": z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Order must be a non-negative number",
    )
    .transform((val) => (val ? Number(val) : 0)),
  "x-video-description": z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),
  "x-max-watch-multiplier": z
    .string()
    .optional()
    .refine(
      (val) =>
        !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 10),
      "Multiplier must be between 1 and 10",
    )
    .transform((val) => (val ? Number(val) : null)),
});

export const createVideoMetaSchema = z.object({
  courseId: z
    .string({ required_error: "Course ID is required" })
    .regex(objectIdRegex, "Invalid Course ID"),
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(2)
    .max(160),
  description: z.string().max(2000).optional().default(""),
  order: z.number().int().min(0).optional().default(0),
  maxWatchMultiplier: z.number().min(1).max(10).optional().nullable(),
});

export const updateVideoSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  maxWatchMultiplier: z.number().min(1).max(10).optional().nullable(),
  active: z.boolean().optional(),
});

export const watchEventSchema = z.object({
  token: z.string().uuid("Invalid playback session token"),
  type: z.enum([
    "started",
    "heartbeat",
    "ended",
    "recording_suspected",
    "screenshot_suspected",
    "incognito_suspected",
    "blur_suspected",
  ]),
  seconds: z
    .number()
    .min(0)
    .max(60, "Single heartbeat cannot exceed 60 seconds")
    .optional()
    .default(0),
});

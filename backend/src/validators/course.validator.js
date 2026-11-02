import { z } from 'zod'

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

export const objectIdParamSchema = z.object({
  id: z.string().regex(OBJECT_ID_REGEX, 'Invalid ID format'),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(120),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
})

export const createCourseSchema = z.object({
  category: z.string().regex(OBJECT_ID_REGEX, 'Invalid category ID'),
  plan: z.string().regex(OBJECT_ID_REGEX, 'Invalid plan ID'),
  title: z.string().min(1, 'Course title is required').max(180),
  description: z.string().max(2000).optional(),
  thumbnailUrl: z.string().max(500).optional(),
  order: z.number().int().min(0).optional(),
})

export const createVideoMetaSchema = z.object({
  course: z.string().regex(OBJECT_ID_REGEX, 'Invalid course ID'),
  title: z.string().min(1, 'Video title is required').max(200),
  description: z.string().max(2000).optional(),
  order: z.number().int().min(0).optional(),
  durationSeconds: z.number().min(0).optional(),
  maxWatchMultiplier: z.number().min(1).max(10).optional(),
})

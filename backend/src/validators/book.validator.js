import { z } from 'zod'

export const updateBookSchema = z.object({
  title: z.string().min(1, 'Book title is required').max(180).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().max(500).optional(),
  active: z.boolean().optional(),
})


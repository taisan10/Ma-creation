import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(80).optional().default(''),
  email: z.string().trim().email().optional().default(''),
  phone: z.string().trim().min(8).max(20),
  company: z.string().trim().max(120).optional().default(''),
  business: z.string().trim().max(120).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(80).optional().default(''),
  need: z.string().trim().max(80).optional().default(''),
  experience: z.string().trim().max(40).optional().default(''),
  message: z.string().trim().max(1000).optional().default(''),
  type: z.enum(['demo', 'callback']),
})


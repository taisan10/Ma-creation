import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().min(2).max(80).optional().default(''),
  email: z.string().email().optional().default(''),
  phone: z.string().min(8).max(20),
  company: z.string().max(120).optional().default(''),
  business: z.string().max(120).optional().default(''),
  location: z.string().max(120).optional().default(''),
  category: z.string().max(80).optional().default(''),
  need: z.string().max(80).optional().default(''),
  experience: z.string().max(40).optional().default(''),
  message: z.string().max(1000).optional().default(''),
  type: z.enum(['demo', 'callback']),
})


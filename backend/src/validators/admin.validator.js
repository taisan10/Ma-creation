import { z } from 'zod'

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  company: z.string().max(120).optional(),
  role: z.enum(['customer', 'admin']).optional(),
  interest: z.string().max(200).optional(),
})

export const updateLeadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed']),
})

export const upsertSettingSchema = z.object({
  value: z.any(),
})

export const resolveIncidentSchema = z.object({
  adminNotes: z.string().max(500).optional(),
})


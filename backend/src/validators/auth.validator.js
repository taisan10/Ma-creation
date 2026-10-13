import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  company: z.string().max(120).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
})

import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().min(10, 'Contact number must be at least 10 digits').max(15, 'Contact number cannot exceed 15 digits'),
  company: z.string().trim().max(120).optional(),
  interest: z.string().trim().max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(128),
})

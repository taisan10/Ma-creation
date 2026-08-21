import {Router} from 'express'
import {z} from 'zod'
import {asyncHandler} from '../utils/asyncHandler.js'
import {validate} from '../middleware/validate.js'
import {authenticate} from '../middleware/auth.js'
import * as c from '../controllers/authController.js'
const router=Router();const register=z.object({name:z.string().min(2).max(80),email:z.string().email(),phone:z.string().min(8).max(20),company:z.string().max(120).optional().default(''),password:z.string().min(8).max(128),interest:z.string().max(80).optional().default('')});const login=z.object({email:z.string().email(),password:z.string().min(8).max(128)});router.post('/register',validate(register),asyncHandler(c.register));router.post('/login',validate(login),asyncHandler(c.login));router.get('/me',authenticate,asyncHandler(c.me));export default router

import {Router} from 'express'
import {z} from 'zod'
import {asyncHandler} from '../utils/asyncHandler.js'
import {validate} from '../middleware/validate.js'
import {authenticate,requireAdmin} from '../middleware/auth.js'
import * as c from '../controllers/adminController.js'
const router=Router();router.use(authenticate,requireAdmin)
router.get('/dashboard',asyncHandler(c.dashboard))
router.get('/users',asyncHandler(c.listUsers));router.patch('/users/:id',validate(z.object({name:z.string().min(2).max(80).optional(),phone:z.string().min(8).max(20).optional(),company:z.string().max(120).optional(),role:z.enum(['customer','admin']).optional()})),asyncHandler(c.updateUser));router.delete('/users/:id',asyncHandler(c.deleteUser))
router.get('/leads',asyncHandler(c.listLeads));router.patch('/leads/:id',validate(z.object({status:z.enum(['new','contacted','closed'])})),asyncHandler(c.updateLead));router.delete('/leads/:id',asyncHandler(c.deleteLead))
router.get('/payments',asyncHandler(c.listPayments))
const resourceSchema=z.object({}).passthrough();router.get('/resources/:resource',asyncHandler(c.listResource));router.post('/resources/:resource',validate(resourceSchema),asyncHandler(c.createResource));router.patch('/resources/:resource/:id',validate(resourceSchema),asyncHandler(c.updateResource));router.delete('/resources/:resource/:id',asyncHandler(c.deleteResource))
router.get('/settings/:key',asyncHandler(c.getSetting));router.put('/settings/:key',validate(z.object({value:z.any()})),asyncHandler(c.upsertSetting))
export default router

import {Router} from 'express'
import {asyncHandler} from '../utils/asyncHandler.js'
import * as c from '../controllers/publicController.js'
const router=Router();router.get('/pages/:slug',asyncHandler(c.getPage));router.get('/faqs',asyncHandler(c.getFaqs));router.get('/partners',asyncHandler(c.getPartners));router.get('/settings/:key',asyncHandler(c.getSetting));router.get('/events',c.events);export default router

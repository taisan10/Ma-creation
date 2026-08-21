import Page from '../models/Page.js'
import FAQ from '../models/FAQ.js'
import Partner from '../models/Partner.js'
import SiteSettings from '../models/SiteSettings.js'
import { addRealtimeClient } from '../services/realtime.js'

export async function getPage(req,res){const page=await Page.findOne({slug:req.params.slug,published:true});if(!page)return res.status(404).json({success:false,message:'Page content not found'});res.json({success:true,page})}
export async function getFaqs(req,res){res.json({success:true,faqs:await FAQ.find({active:true}).sort({order:1,createdAt:1})})}
export async function getPartners(req,res){res.json({success:true,partners:await Partner.find({active:true}).sort({order:1,createdAt:1})})}
export async function getSetting(req,res){const setting=await SiteSettings.findOne({key:req.params.key});res.json({success:true,setting:setting||{key:req.params.key,value:{}}})}

export function events(req,res){
  res.status(200)
  res.setHeader('Content-Type','text/event-stream')
  res.setHeader('Cache-Control','no-cache, no-transform')
  res.setHeader('Connection','keep-alive')
  res.setHeader('X-Accel-Buffering','no')
  res.flushHeaders?.()
  res.write(': connected\n\n')
  addRealtimeClient(res)
}

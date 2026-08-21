import User from '../models/User.js'
import Lead from '../models/Lead.js'
import Payment from '../models/Payment.js'
import Service from '../models/Service.js'
import Plan from '../models/Plan.js'
import Page from '../models/Page.js'
import FAQ from '../models/FAQ.js'
import Partner from '../models/Partner.js'
import SiteSettings from '../models/SiteSettings.js'
import Book from '../models/Book.js'
import { AppError } from '../utils/AppError.js'
import { broadcastCmsUpdate } from '../services/realtime.js'

const models={services:Service,plans:Plan,pages:Page,faqs:FAQ,partners:Partner}
const publicResources = new Set(['services','plans','pages','faqs','partners'])

function publish(resource, action, key = null) {
  if (publicResources.has(resource) || resource === 'settings' || resource === 'brand' || resource === 'theme') {
    broadcastCmsUpdate({resource, action, key})
  }
}

export async function dashboard(req,res){const [users,leads,payments,services,plans,pages,faqs,partners,books]=await Promise.all([User.countDocuments(),Lead.countDocuments(),Payment.countDocuments(),Service.countDocuments(),Plan.countDocuments(),Page.countDocuments(),FAQ.countDocuments(),Partner.countDocuments(),Book.countDocuments()]);res.json({success:true,stats:{users,leads,payments,services,plans,pages,faqs,partners,books}})}
export async function listUsers(req,res){res.json({success:true,users:await User.find().select('-passwordHash').sort({createdAt:-1}).limit(500)})}
export async function updateUser(req,res){if(String(req.user.sub)===String(req.params.id)&&req.body.role==='customer')throw new AppError('You cannot remove your own admin access',400,'SELF_ROLE_CHANGE');const user=await User.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true}).select('-passwordHash');if(!user)throw new AppError('User not found',404,'NOT_FOUND');res.json({success:true,user})}
export async function deleteUser(req,res){if(String(req.user.sub)===String(req.params.id))throw new AppError('You cannot delete your own account',400,'SELF_DELETE');const user=await User.findByIdAndDelete(req.params.id);if(!user)throw new AppError('User not found',404,'NOT_FOUND');res.json({success:true})}
export async function listLeads(req,res){res.json({success:true,leads:await Lead.find().sort({createdAt:-1}).limit(500)})}
export async function updateLead(req,res){const lead=await Lead.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});if(!lead)throw new AppError('Lead not found',404,'NOT_FOUND');res.json({success:true,lead})}
export async function deleteLead(req,res){const lead=await Lead.findByIdAndDelete(req.params.id);if(!lead)throw new AppError('Lead not found',404,'NOT_FOUND');res.json({success:true})}
export async function listPayments(req,res){res.json({success:true,payments:await Payment.find().populate('user','name email phone company').populate('plan','name price').sort({createdAt:-1}).limit(500)})}
export async function listResource(req,res){const Model=models[req.params.resource];if(!Model)throw new AppError('Unknown resource',404,'NOT_FOUND');res.json({success:true,items:await Model.find().sort({order:1,createdAt:-1}).limit(500)})}
export async function createResource(req,res){const resource=req.params.resource;const Model=models[resource];if(!Model)throw new AppError('Unknown resource',404,'NOT_FOUND');const item=await Model.create(req.body);publish(resource,'created',String(item._id));res.status(201).json({success:true,item})}
export async function updateResource(req,res){const resource=req.params.resource;const Model=models[resource];if(!Model)throw new AppError('Unknown resource',404,'NOT_FOUND');const item=await Model.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});if(!item)throw new AppError('Resource not found',404,'NOT_FOUND');publish(resource,'updated',String(item._id));res.json({success:true,item})}
export async function deleteResource(req,res){const resource=req.params.resource;const Model=models[resource];if(!Model)throw new AppError('Unknown resource',404,'NOT_FOUND');const item=await Model.findByIdAndDelete(req.params.id);if(!item)throw new AppError('Resource not found',404,'NOT_FOUND');publish(resource,'deleted',String(item._id));res.json({success:true})}
export async function getSetting(req,res){const item=await SiteSettings.findOne({key:req.params.key});res.json({success:true,setting:item||{key:req.params.key,value:{}}})}
export async function upsertSetting(req,res){const key=req.params.key;const item=await SiteSettings.findOneAndUpdate({key},{key,value:req.body.value},{new:true,upsert:true,setDefaultsOnInsert:true});publish('settings','updated',key);res.json({success:true,setting:item})}

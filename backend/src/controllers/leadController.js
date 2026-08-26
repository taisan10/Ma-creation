import Lead from '../models/Lead.js'
export async function createLead(req,res){const lead=await Lead.create(req.body);res.status(201).json({success:true,lead})}
export async function listLeads(req,res){const leads=await Lead.find().sort({createdAt:-1}).limit(500);res.json({success:true,leads})}

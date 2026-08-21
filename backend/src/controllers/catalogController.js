import Service from '../models/Service.js'
import Plan from '../models/Plan.js'
export async function listServices(req,res){res.json({success:true,services:await Service.find({active:true}).sort({category:1,price:1})})}
export async function listPlans(req,res){res.json({success:true,plans:await Plan.find({active:true}).sort({category:1,price:1})})}

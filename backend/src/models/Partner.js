import mongoose from 'mongoose'
const schema = new mongoose.Schema({name:{type:String,required:true,trim:true,maxLength:120},logoUrl:{type:String,default:''},website:{type:String,default:''},partnerSince:{type:String,default:''},active:{type:Boolean,default:true},order:{type:Number,default:0}},{timestamps:true})
export default mongoose.model('Partner',schema)

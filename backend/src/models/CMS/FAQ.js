import mongoose from 'mongoose'
const schema = new mongoose.Schema({question:{type:String,required:true,trim:true,maxLength:300},answer:{type:String,required:true,trim:true,maxLength:2000},active:{type:Boolean,default:true},order:{type:Number,default:0}},{timestamps:true})
export default mongoose.model('FAQ',schema)

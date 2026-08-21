import mongoose from 'mongoose'
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,maxLength:80},email:{type:String,required:true,lowercase:true,trim:true},phone:{type:String,required:true,trim:true},company:{type:String,trim:true,maxLength:120},message:{type:String,trim:true,maxLength:1000},type:{type:String,enum:['demo','callback'],required:true},status:{type:String,enum:['new','contacted','closed'],default:'new'}},{timestamps:true})
export default mongoose.model('Lead',schema)

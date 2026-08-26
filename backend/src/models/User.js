import mongoose from 'mongoose'
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true,minLength:2,maxLength:80},email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},phone:{type:String,required:true,trim:true},company:{type:String,trim:true,maxLength:120},passwordHash:{type:String,required:true},interest:{type:String,trim:true},role:{type:String,enum:['customer','admin'],default:'customer'}},{timestamps:true})
export default mongoose.model('User',schema)

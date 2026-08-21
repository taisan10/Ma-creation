import mongoose from 'mongoose'
const schema=new mongoose.Schema({category:{type:String,enum:['retainer','training','service'],required:true},name:{type:String,required:true},price:{type:Number,required:true,min:0},billing:String,duration:String,description:String,features:[String],featured:{type:Boolean,default:false},active:{type:Boolean,default:true}},{timestamps:true})
export default mongoose.model('Plan',schema)

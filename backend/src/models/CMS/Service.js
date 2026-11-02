import mongoose from 'mongoose'
const schema=new mongoose.Schema({category:{type:String,required:true},service:{type:String,required:true},planName:String,price:{type:Number,required:true,min:0},priceLabel:String,features:String,active:{type:Boolean,default:true}},{timestamps:true})
export default mongoose.model('Service',schema)

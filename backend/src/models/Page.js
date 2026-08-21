import mongoose from 'mongoose'
const schema = new mongoose.Schema({slug:{type:String,required:true,unique:true,index:true,trim:true},title:{type:String,required:true,trim:true},content:{type:mongoose.Schema.Types.Mixed,default:{}},published:{type:Boolean,default:true}},{timestamps:true})
export default mongoose.model('Page',schema)

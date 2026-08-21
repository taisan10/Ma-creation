import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Payment from '../models/Payment.js'
import {AppError} from '../utils/AppError.js'
import {signToken} from '../services/token.js'
export async function register(req,res){const {name,email,phone,company,password,interest}=req.body;if(await User.exists({email}))throw new AppError('An account with this email already exists',409,'CONFLICT');const passwordHash=await bcrypt.hash(password,12);const user=await User.create({name,email,phone,company,passwordHash,interest});await Payment.updateMany({user:null,email:user.email,status:'paid'},{$set:{user:user._id}});res.status(201).json({success:true,token:signToken(user),user:{id:user._id,name:user.name,email:user.email,phone:user.phone,company:user.company,role:user.role}})}
export async function login(req,res){const {email,password}=req.body;const user=await User.findOne({email});if(!user||!(await bcrypt.compare(password,user.passwordHash)))throw new AppError('Invalid email or password',401,'INVALID_CREDENTIALS');await Payment.updateMany({user:null,email:user.email,status:'paid'},{$set:{user:user._id}});res.json({success:true,token:signToken(user),user:{id:user._id,name:user.name,email:user.email,phone:user.phone,company:user.company,role:user.role}})}
export async function me(req,res){const user=await User.findById(req.user.sub).select('-passwordHash');if(!user)throw new AppError('User not found',404,'NOT_FOUND');res.json({success:true,user})}

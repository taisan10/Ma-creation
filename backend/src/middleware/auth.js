import jwt from 'jsonwebtoken'
import {env} from '../config/env.js'
import {AppError} from '../utils/AppError.js'
export function authenticate(req,res,next){const header=req.headers.authorization;if(!header?.startsWith('Bearer '))return next(new AppError('Authentication required',401,'UNAUTHORIZED'));try{req.user=jwt.verify(header.slice(7),env.jwtSecret);next()}catch{next(new AppError('Invalid or expired token',401,'UNAUTHORIZED'))}}
export function optionalAuthenticate(req,res,next){const header=req.headers.authorization;if(!header?.startsWith('Bearer '))return next();try{req.user=jwt.verify(header.slice(7),env.jwtSecret)}catch{/* ignore invalid token, proceed as guest */}next()}
export function requireAdmin(req,res,next){if(req.user?.role!=='admin')return next(new AppError('Admin access required',403,'FORBIDDEN'));next()}

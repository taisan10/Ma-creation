import jwt from 'jsonwebtoken'
import {env} from '../config/env.js'
import {AppError} from '../utils/AppError.js'
import AccessTokenSession from '../models/AccessTokenSession.js'
import User from '../models/User.js'


export async function authenticate(req, res, next) {
  const rawToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.query?.token

  if (!rawToken) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  }

  let payload
  try {
    payload = jwt.verify(rawToken, env.jwtSecret)
  } catch {
    return next(new AppError('Invalid or expired token', 401, 'UNAUTHORIZED'))
  }

  try {
    // 1. Instant Revocation Check (Logout ke baad token instantly dead hoga)
    if (payload.jti) {
      const session = await AccessTokenSession.findOne({ jti: payload.jti })
      if (!session || session.expiresAt <= new Date()) {
        return next(new AppError('Session revoked or expired', 401, 'UNAUTHORIZED'))
      }
    }

    // 2. Active status check
    const user = await User.findById(payload.sub).select('role isActive lockedUntil')
    if (!user || !user.isActive) {
      return next(new AppError('User account inactive or not found', 401, 'UNAUTHORIZED'))
    }

    req.user = {
      sub: user._id.toString(),
      userId: user._id.toString(),
      id: user._id.toString(),
      email: payload.email,
      role: user.role,
      jti: payload.jti,
      sessionId: payload.sessionId,
    }
    next()
  } catch (err) {
    next(err)
  }
}

export function optionalAuthenticate(req,res,next){const header=req.headers.authorization;if(!header?.startsWith('Bearer '))return next();try{req.user=jwt.verify(header.slice(7),env.jwtSecret)}catch{/* ignore invalid token, proceed as guest */}next()}
export function requireAdmin(req,res,next){if(req.user?.role!=='admin')return next(new AppError('Admin access required',403,'FORBIDDEN'));next()}

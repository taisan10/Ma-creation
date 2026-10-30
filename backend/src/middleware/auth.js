import jwt from 'jsonwebtoken'
import {env} from '../config/env.js'
import {AppError} from '../utils/AppError.js'
import AccessTokenSession from '../models/AccessTokenSession.js'
import User from '../models/User.js'
import PlaybackSession from '../models/PlaybackSession.js'

export async function authenticate(req, res, next) {
   // 1. Header se token lein; agar header na ho to query parameter se
  const rawToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.query?.token || null

  if (!rawToken) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'))
  }

// Android ke liye playback session token
 if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawToken)) {
    // 🛡️ Security Check 1: Playback token ko sirf video routes par allow karein
 const isVideoRoute = req.baseUrl?.startsWith('/api/videos') || req.originalUrl?.includes('/api/videos')
 if(!isVideoRoute){
  return next(new AppError('Playback session token can only be used for video streaming', 403, 'FORBIDDEN'))
 }
  try {
    const session = await PlaybackSession.findOne({token : rawToken})
    if(!session || (session.expiresAt && session.expiresAt <= new Date() )) {
      return next(new AppError('Playback session expired or invalid', 401, 'UNAUTHORIZED'))
    }

    // Video ID Binding check (Token usi video ka hona chahiye)
const videoIdMatch = req.originalUrl.match(/\/api\/videos\/([0-9a-fA-F]{24})/)
if (videoIdMatch && session.video.toString() !== videoIdMatch[1]) {
  return next(new AppError('Playback session does not belong to this video', 403, 'FORBIDDEN'))
}
    const user = await User.findById(session.user).select('role isActive lockedUntil email')
    if(!user || !user.isActive){
      return next(new AppError('User account inactive or not found', 401, 'UNAUTHORIZED'))
    }
    req.user = {
       sub: user._id.toString(),
        userId: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        playbackSessionId: session._id,
    }
    return next()
    }
    catch (err){
      return next(err)
    }
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

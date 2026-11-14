import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  if (!env.mongoUri) throw new Error('MONGODB_URI is missing')
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    // production mai jaane se pahle in 2 line ko update krna hai 
    // maxPoolSize: 
    // minPoolSize:
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || (process.env.LOAD_TEST_MODE === 'true' ? 100 : 50)),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 10),
  })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

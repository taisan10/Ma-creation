import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  if (!env.mongoUri) throw new Error('MONGODB_URI is missing')
  mongoose.set('strictQuery', true)
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 2,
  })
  console.log(`MongoDB connected: ${mongoose.connection.name}`)
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

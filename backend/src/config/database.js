import mongoose from 'mongoose'
import { env } from './env.js'

mongoose.set('strictQuery', true)

export async function connectDatabase() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log(`MongoDB connected: ${mongoose.connection.name}`)
    return mongoose.connection
  } catch (error) {
    console.error('MongoDB connection failed.')
    console.error(`  URI:   ${env.mongoUri}`)
    console.error(`  Error: ${error.message}`)
    console.error('  Is the local MongoDB service running?')
    throw error
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

/** 0 disconnected, 1 connected, 2 connecting, 3 disconnecting. */
export function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    database: mongoose.connection.name || null,
  }
}

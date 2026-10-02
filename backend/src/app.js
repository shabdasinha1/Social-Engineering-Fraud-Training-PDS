import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { apiRoutes } from './routes/index.js'

export function createApp() {
  const app = express()

  // Never advertise the framework. See env.trustProxy for why this is opt-in.
  app.disable('x-powered-by')
  app.set('trust proxy', env.trustProxy)

  app.use(securityHeaders)
  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser(env.sessionSecret))

  app.use('/api', apiRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}

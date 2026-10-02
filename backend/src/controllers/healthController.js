import { databaseStatus } from '../config/database.js'
import { isProduction } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const getHealth = asyncHandler(async (_req, res) => {
  const status = databaseStatus()
  // Unauthenticated: a production server reports the connection state, not the database name.
  const database = isProduction ? { state: status.state } : status

  res.status(database.state === 'connected' ? 200 : 503).json({
    status: database.state === 'connected' ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    database,
  })
})

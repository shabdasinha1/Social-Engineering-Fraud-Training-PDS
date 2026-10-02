import { connectDatabase, disconnectDatabase } from './config/database.js'
import { env } from './config/env.js'
import { createApp } from './app.js'
import {
  recoverExpiredAttemptsOnStartup,
  startExpirySweeper,
  stopExpirySweeper,
} from './services/attemptExpiryService.js'

async function start() {
  await connectDatabase()

  /**
   * IMMERSIVE-001, layer 3: startup recovery, BEFORE the server accepts a request.
   *
   * An attempt whose 90-minute deadline passed while this process was down is finalised
   * here, from its stored absolute deadline. Downtime is therefore not credited back to
   * the learner, and no timer is ever "resumed" - there is no timer to resume, only a
   * timestamp to compare against.
   *
   * Deliberately not fatal. A recovery sweep that cannot run is a reason to serve traffic
   * and retry on the next tick, not a reason to refuse to start an offline training
   * machine: the lazy route guard still enforces every deadline on its own.
   */
  try {
    await recoverExpiredAttemptsOnStartup()
  } catch (error) {
    console.error('Startup expiry recovery failed (the route guard still enforces):', error.message)
  }

  const app = createApp()
  // Explicit host: without it Express binds every interface. See env.host (DEPLOY-001).
  const server = app.listen(env.port, env.host, () => {
    console.log(`API listening on http://${env.host}:${env.port}/api`)
  })

  /**
   * Idle keep-alive sockets outlive the reverse proxy's upstream keep-alive (Nginx: 60 s
   * by default). With Node's 5 s default the API could close a pooled socket at the moment
   * the proxy reuses it, which surfaces as an intermittent 502 under load.
   */
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000

  /**
   * Layer 2: the periodic sweeper. This is what finalises an assessment nobody is looking
   * at - the learner closed the browser and never came back - so the result exists without
   * anyone having to ask for it.
   */
  startExpirySweeper()

  let stopping = false
  const shutdown = (signal) => {
    if (stopping) return
    stopping = true
    console.log(`${signal} received, shutting down.`)
    stopExpirySweeper()
    // In-flight requests finish (each engine write is one transaction, so none is left
    // half-written either way); a request that never ends cannot hold the restart hostage.
    setTimeout(() => process.exit(1), 10_000).unref()
    server.close(() => {
      disconnectDatabase().finally(() => process.exit(0))
    })
    server.closeIdleConnections?.()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('Server failed to start:', error.message)
  process.exit(1)
})

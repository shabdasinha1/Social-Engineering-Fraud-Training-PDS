import mongoose from 'mongoose'
import { ApiError } from '../utils/ApiError.js'
import { isProduction } from '../config/env.js'

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    })
  }

  /**
   * Domain errors raised by the scenario engine and the selection solver. Both carry
   * `isDomainError`, a stable `code` and an intended `status`, so they are surfaced as-is
   * rather than collapsing into a 500 - the frontend needs to tell a stale state from a
   * genuine failure.
   *
   * `status` is clamped into the error range: ENGINE_ERRORS maps DUPLICATE_INTENT to 200
   * because the normal path replays the original outcome instead of throwing. If it ever
   * does throw, it is a conflict, not a success.
   */
  if (error?.isDomainError && error.code) {
    const status = error.status >= 400 && error.status <= 599 ? error.status : 409
    return res.status(status).json({
      error: { code: error.code, message: error.message, details: error.details ?? null },
    })
  }

  /**
   * A request the body parser refused before any route ran: malformed JSON (400), a body
   * over the 1 MB limit (413), an unsupported charset or encoding (415). `express.json()`
   * marks these `expose: true` with a 4xx status; without this branch they fell through to
   * the 500 below. The parser's own message is not echoed.
   */
  const parserStatus = error?.status ?? error?.statusCode
  if (error?.expose === true && typeof error?.type === 'string'
    && parserStatus >= 400 && parserStatus < 500) {
    return res.status(parserStatus).json({
      error: {
        code: error.type === 'entity.parse.failed' ? 'INVALID_JSON' : 'INVALID_REQUEST_BODY',
        message: 'The request body could not be read.',
        details: null,
      },
    })
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The submitted data is not valid.',
        details: Object.values(error.errors).map((e) => e.message),
      },
    })
  }

  if (error?.code === 11000) {
    return res.status(409).json({
      error: { code: 'DUPLICATE_KEY', message: 'That record already exists.', details: error.keyValue },
    })
  }

  console.error(error)
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
      details: isProduction ? null : error.message,
    },
  })
}

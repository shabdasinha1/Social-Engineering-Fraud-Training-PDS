export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(code, message, details) {
    return new ApiError(400, code, message, details)
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message)
  }

  static conflict(code, message, details) {
    return new ApiError(409, code, message, details)
  }

  static unprocessable(code, message, details) {
    return new ApiError(422, code, message, details)
  }
}

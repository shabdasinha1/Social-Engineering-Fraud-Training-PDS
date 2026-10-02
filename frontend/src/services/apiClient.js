/**
 * Fetch wrapper for the Express backend. Every API call goes through here so
 * cookies, error shapes and network failures are handled in one place.
 *
 * The session is a signed httpOnly cookie set by the backend - nothing about
 * it is readable or storable by this code, which is the point.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export class ApiError extends Error {
  constructor({ message, status, code, details }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  get isSessionExpired() {
    return this.status === 401
  }
}

/**
 * Did this request fail because the backend or the store behind it could not be reached,
 * rather than because of anything the learner typed?
 *
 * `status: 0` is the fetch itself failing (server down, socket refused) and 5xx is the
 * server failing to complete the request - on `/candidates` that includes MongoDB being
 * unreachable, which surfaces as INTERNAL_ERROR. Both mean the session could not be read
 * or written and are worth a Retry. A 401, 403 or 422 is a real answer to a real question
 * and must not be retried: LOGIN-001 shows those on the form instead.
 */
export function isInfrastructureError(error) {
  return error?.status === 0 || error?.status >= 500
}

async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError({
      message: 'Cannot reach the training server. Please check it is running and try again.',
      status: 0,
      code: 'NETWORK_ERROR',
    })
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError({
      message: data?.error?.message || 'Something went wrong. Please try again.',
      status: response.status,
      code: data?.error?.code || 'UNKNOWN',
      details: data?.error?.details ?? null,
    })
  }

  return data
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  /** Partial update. ADMIN-004's feedback configuration is the only caller. */
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

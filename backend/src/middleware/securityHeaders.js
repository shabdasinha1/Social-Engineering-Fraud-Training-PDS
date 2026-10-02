/**
 * Baseline HTTP security headers for every API response.
 *
 * The API serves JSON and, for the admin export route, file attachments - never HTML - so
 * the policy can be the strictest one: nothing may load, nothing may frame it, and nothing
 * is stored in a browser or proxy cache. Learner results and training records are read on
 * shared classroom machines, which is what `no-store` is for.
 *
 * HSTS is deliberately absent: it only means something over HTTPS, and TLS terminates at
 * the reverse proxy, which sets it (see docs/PRODUCTION_DEPLOYMENT_LINUX.md). The page
 * itself (index.html and its assets) is also served by the proxy, which owns its CSP.
 */
export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  next()
}

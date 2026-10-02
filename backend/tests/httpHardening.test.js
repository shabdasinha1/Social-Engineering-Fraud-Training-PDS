import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from '../src/app.js'
import { securityHeaders } from '../src/middleware/securityHeaders.js'

/**
 * Production audit, 30 Sep 2026 - HTTP hardening that needs no database.
 *
 * Every API response carries the baseline security headers, is not cacheable, and does not
 * advertise the framework. Proven over real HTTP on a route that never touches MongoDB (the
 * 404 handler), and on the middleware directly.
 */

let server
let base

test.before(async () => {
  server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}/api`
})

test.after(() => new Promise((resolve) => server.close(resolve)))

test('API responses do not advertise Express', async () => {
  const res = await fetch(`${base}/no-such-route`)
  assert.equal(res.status, 404)
  assert.equal(res.headers.get('x-powered-by'), null)
})

test('API responses carry the baseline security headers', async () => {
  const res = await fetch(`${base}/no-such-route`)
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(res.headers.get('x-frame-options'), 'DENY')
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/)
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/)
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer')
})

test('API responses are never stored by a browser or proxy cache', async () => {
  const res = await fetch(`${base}/no-such-route`)
  assert.equal(res.headers.get('cache-control'), 'no-store')
})

test('error responses keep the headers too (malformed JSON body)', async () => {
  const res = await fetch(`${base}/candidates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"name":',
  })
  assert.equal(res.status, 400)
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(res.headers.get('cache-control'), 'no-store')
})

test('the middleware sets its headers and always continues', () => {
  const set = {}
  let continued = false
  securityHeaders({}, { setHeader: (k, v) => { set[k.toLowerCase()] = v } }, () => { continued = true })
  assert.equal(continued, true)
  assert.equal(set['x-frame-options'], 'DENY')
  assert.equal(set['cache-control'], 'no-store')
})

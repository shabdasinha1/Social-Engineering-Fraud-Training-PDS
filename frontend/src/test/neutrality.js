import { expect } from 'vitest'
import { FORBIDDEN_TOKENS } from '@/test/actionMap'

/**
 * SECURITY-001 assertions: what a learner with developer tools can see must not say what
 * any control means.
 */

const TOKEN = new RegExp(`\\b(${FORBIDDEN_TOKENS.join('|')})\\b`)
/** Neutral control ids are not secret, but they have no business in markup or on the wire. */
const CONTROL_ID = /\b(?:[weis]\d{2}|gen)-c\d{2}\b/
export const ACTION_CODE = /^ac_[0-9a-f]{20}$/

/** Markup: no intent, no control id, no scoring vocabulary - in any attribute or text. */
export function expectNeutralMarkup(html, where = 'markup') {
  expect(html, where).not.toMatch(TOKEN)
  expect(html, where).not.toMatch(CONTROL_ID)
  expect(html, where).not.toMatch(/data-intent|data-affordance/)
}

/**
 * Every request the device sent: an opaque action code, never an intent, a verification
 * source or a control id, and nothing in it that names what the code means.
 */
export function expectNeutralRequests(calls) {
  const posts = calls.filter((call) => call.method === 'POST' && /\/runs\//.test(call.path))
  expect(posts.length).toBeGreaterThan(0)
  for (const call of posts) {
    const raw = JSON.stringify({ path: call.path, body: call.body })
    expect(call.body).not.toHaveProperty('intent')
    expect(call.body.metadata ?? {}).not.toHaveProperty('verify_source')
    expect(call.body.action_code).toMatch(ACTION_CODE)
    expect(raw).not.toMatch(TOKEN)
    expect(raw).not.toMatch(CONTROL_ID)
  }
}

/** Browser storage holds nothing about the run - no code, no intent, no control. */
export function expectNeutralStorage() {
  for (const store of [globalThis.localStorage, globalThis.sessionStorage]) {
    const dump = JSON.stringify(Object.fromEntries(
      Array.from({ length: store.length }, (_, index) => {
        const key = store.key(index)
        return [key, store.getItem(key)]
      }),
    ))
    expect(dump).not.toMatch(TOKEN)
    expect(dump).not.toMatch(CONTROL_ID)
    expect(dump).not.toMatch(/ac_[0-9a-f]{20}/)
  }
}

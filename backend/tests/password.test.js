import assert from 'node:assert/strict'
import test from 'node:test'
import { ARGON2_PARAMS, hashPassword, parsePhc, verifyPassword } from '../src/utils/password.js'

const PASSWORD = 'a-long-enough-admin-password'

test('a hash is an Argon2id PHC string and never contains the password', async () => {
  const hash = await hashPassword(PASSWORD)

  assert.match(hash, /^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[^$]+\$[^$]+$/)
  assert.ok(!hash.includes(PASSWORD), 'the plaintext password must not appear in the hash')
})

test('the recorded cost parameters are the ones that were used', async () => {
  const parsed = parsePhc(await hashPassword(PASSWORD))
  assert.deepEqual(parsed.params, {
    memory: ARGON2_PARAMS.memory,
    passes: ARGON2_PARAMS.passes,
    parallelism: ARGON2_PARAMS.parallelism,
  })
})

test('the same password hashes differently every time - the salt is random', async () => {
  const [a, b] = [await hashPassword(PASSWORD), await hashPassword(PASSWORD)]
  assert.notEqual(a, b)
  assert.notDeepEqual(parsePhc(a).salt, parsePhc(b).salt)
})

test('the correct password verifies', async () => {
  assert.equal(await verifyPassword(PASSWORD, await hashPassword(PASSWORD)), true)
})

test('a wrong password does not verify', async () => {
  const hash = await hashPassword(PASSWORD)
  assert.equal(await verifyPassword('not-the-password', hash), false)
  assert.equal(await verifyPassword(`${PASSWORD} `, hash), false)
  assert.equal(await verifyPassword(PASSWORD.toUpperCase(), hash), false)
})

test('verification of a malformed or missing hash returns false rather than throwing', async () => {
  for (const bad of [null, undefined, '', 'plaintext', '$argon2i$v=19$m=1,t=1,p=1$aaaa$bbbb', {}]) {
    assert.equal(await verifyPassword(PASSWORD, bad), false)
  }
})

test('an empty password never verifies', async () => {
  assert.equal(await verifyPassword('', await hashPassword(PASSWORD)), false)
})

test('a hash cannot be reversed by parsing - only salt and tag come back', async () => {
  const parsed = parsePhc(await hashPassword(PASSWORD))
  assert.deepEqual(Object.keys(parsed).sort(), ['params', 'salt', 'tag'])
  assert.ok(!parsed.tag.toString('utf8').includes(PASSWORD))
})

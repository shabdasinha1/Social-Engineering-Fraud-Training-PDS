import assert from 'node:assert/strict'
import test from 'node:test'
import { ask, askHidden } from '../scripts/prompt.js'

/**
 * A stand-in for the parts of a readline interface the prompts actually use.
 * `type()` replays what readline would push through `_writeToOutput` as the
 * user types, so the test sees exactly what would reach the terminal.
 */
function fakeReadline() {
  const written = []

  const rl = {
    output: { write: (chunk) => written.push(chunk) },
    _writeToOutput: (chunk) => written.push(chunk),
    question(text, callback) {
      rl._writeToOutput(text) // readline echoes the prompt through the same hook
      rl.answer = (value) => {
        for (const character of value) rl._writeToOutput(character)
        callback(value)
      }
    },
  }

  return { rl, written }
}

test('a hidden prompt still shows the question', async () => {
  const { rl, written } = fakeReadline()
  const pending = askHidden(rl, 'Password: ')
  rl.answer('hunter2-hunter2')
  await pending

  assert.ok(written.includes('Password: '), 'the prompt itself must be visible')
})

test('a hidden prompt never echoes the typed password', async () => {
  const { rl, written } = fakeReadline()
  const pending = askHidden(rl, 'Password: ')
  rl.answer('hunter2-hunter2')

  assert.equal(await pending, 'hunter2-hunter2', 'the value still reaches the caller')
  assert.ok(
    !written.join('').includes('hunter2'),
    'no part of the password may reach the terminal',
  )
})

test('a hidden prompt restores the original output hook afterwards', async () => {
  const { rl, written } = fakeReadline()
  const before = rl._writeToOutput

  const pending = askHidden(rl, 'Password: ')
  rl.answer('secret-secret-1')
  await pending

  assert.equal(rl._writeToOutput, before, 'muting must not leak into later prompts')

  written.length = 0
  rl._writeToOutput('visible again')
  assert.deepEqual(written, ['visible again'])
})

test('two hidden prompts in a row both stay hidden', async () => {
  const { rl, written } = fakeReadline()

  let pending = askHidden(rl, 'Password: ')
  rl.answer('first-password-1')
  await pending

  pending = askHidden(rl, 'Confirm password: ')
  rl.answer('second-password-2')
  await pending

  const output = written.join('')
  assert.ok(!output.includes('first-password'))
  assert.ok(!output.includes('second-password'))
  assert.ok(output.includes('Confirm password: '))
})

test('a visible prompt does echo - the username is not a secret', async () => {
  const { rl, written } = fakeReadline()
  const pending = ask(rl, 'Username: ')
  rl.answer('operator')

  assert.equal(await pending, 'operator')
  assert.ok(written.join('').includes('operator'))
})

/**
 * Terminal prompts for the operator scripts.
 *
 * Split out of createAdmin.js so the echo-suppression can be unit tested.
 * That is the one part worth testing on its own: if muting ever broke, a
 * typed admin password would be echoed to the screen and left in the
 * terminal scrollback, and nothing else in the flow would fail.
 */

/** A visible prompt - the answer is echoed as normal. */
export function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

/**
 * A prompt whose answer is not echoed.
 *
 * readline writes the prompt through the same `_writeToOutput` hook it uses
 * for the typed characters, so the hook is installed first and muting is
 * switched on only after `question()` has written the prompt. Everything the
 * user then types is swallowed.
 */
export function askHidden(rl, question) {
  return new Promise((resolve) => {
    let muted = false

    // Kept unbound and re-invoked with `call`, so the exact original value can
    // be put back. Binding here would restore a different function object each
    // time and stack a new wrapper on every prompt.
    const original = rl._writeToOutput

    rl._writeToOutput = (chunk) => {
      if (!muted && original) original.call(rl, chunk)
    }

    rl.question(question, (answer) => {
      muted = false
      rl._writeToOutput = original
      rl.output?.write('\n')
      resolve(answer)
    })

    muted = true
  })
}

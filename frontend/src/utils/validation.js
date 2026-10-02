const NAME_PATTERN = /^[A-Za-z][A-Za-z\s.'-]*$/
const IDENTIFIER_PATTERN = /^[A-Za-z0-9\s/-]+$/

/**
 * Client-side checks only, for a helpful form experience.
 * The backend will validate these fields again once it exists.
 */
export function validateName(value) {
  const name = value.trim()
  if (!name) return 'Please enter your full name.'
  if (name.length < 3) return 'Name must be at least 3 characters.'
  if (name.length > 60) return 'Name must be 60 characters or less.'
  if (!NAME_PATTERN.test(name)) return 'Name can contain only letters and spaces.'
  return ''
}

/**
 * The section 2 "Personal / Service Number".
 *
 * IMMERSIVE-000 corrected the user-facing wording only. This rule is UNCHANGED and is
 * knowingly WIDER AND NARROWER than the specification in different places - section 2 says
 * "Required; 3-24 alphanumeric characters plus hyphen", whereas this accepts 6-20
 * characters and also permits spaces and a slash, while additionally demanding at least
 * four digits that section 2 never asks for.
 *
 * Tightening it is deliberately NOT part of IMMERSIVE-000: it changes which inputs are
 * accepted, and a returning learner whose stored profile key no longer validates would be
 * locked out of their own record. That needs its own task, with the existing profile keys
 * audited first. Recorded in PROJECT_MASTER_PLAN.md 16.11 as a deferred item.
 *
 * The messages below no longer name a phone number, because section 2's login data
 * contract prohibits collecting one.
 */
export function validateIdentifier(value) {
  const id = value.trim()
  if (!id) return 'Please enter your personal or service number.'
  if (id.length < 6) return 'This must be at least 6 characters.'
  if (id.length > 20) return 'This must be 20 characters or less.'
  if (!IDENTIFIER_PATTERN.test(id)) return 'Use only letters, numbers, - and /.'
  if ((id.match(/\d/g) || []).length < 4) return 'This must include at least 4 numbers.'
  return ''
}

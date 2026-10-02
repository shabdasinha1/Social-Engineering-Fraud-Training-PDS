import {
  SERVICE_NO_MASK_CHAR,
  SERVICE_NO_MASK_MAX,
  SERVICE_NO_VISIBLE_CHARS,
} from '../constants/attemptViewer.js'

/**
 * Service-number masking (specification section 2: only the last four characters of a
 * service number are ever shown).
 *
 * Lifted out of `attemptViewerService.js` by PROFILE-001 without a change of behaviour.
 * `Candidate` now stores `service_no_masked` and has to compute it, and that service
 * imports `Candidate` - so leaving the function there would have made the model and the
 * service import each other. The constants, the algorithm and the results are identical;
 * `attemptViewerService` re-exports this so every existing import site still resolves.
 */
export function maskServiceNumber(identifier) {
  const value = String(identifier ?? '').trim()
  if (value.length <= SERVICE_NO_VISIBLE_CHARS) return value
  const hidden = Math.min(value.length - SERVICE_NO_VISIBLE_CHARS, SERVICE_NO_MASK_MAX)
  return `${SERVICE_NO_MASK_CHAR.repeat(hidden)}${value.slice(-SERVICE_NO_VISIBLE_CHARS)}`
}

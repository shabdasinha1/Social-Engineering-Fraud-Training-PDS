import mongoose from 'mongoose'

const { Schema } = mongoose

/** Lowercased and trimmed, so "Admin" and " admin " are the same account. */
export function normaliseUsername(value = '') {
  return value.trim().toLowerCase()
}

/** Development-phase credential rules. Not a product decision - see BE-005a. */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/
export const MIN_PASSWORD_LENGTH = 12

/**
 * The administrator account.
 *
 * A separate collection on purpose. The Candidate model upserts on an
 * unrecognised identifier (`findOrCreateCandidate`), so any admin marker
 * living on that model would be one typo away from self-provisioning an
 * administrator. Keeping the two apart makes that structurally impossible
 * rather than something a guard has to remember to prevent.
 *
 * Created only by `npm run admin:create`. There is no HTTP route that
 * creates, updates or deletes an AdminUser.
 */
const adminUserSchema = new Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 32 },
    usernameNormalised: { type: String, required: true, unique: true },

    /**
     * Argon2id PHC string from `utils/password.js`. Never a plaintext
     * password. `select: false` keeps it out of ordinary queries - the auth
     * service must ask for it explicitly with `.select('+passwordHash')` -
     * and toPublicJSON() strips it regardless, the same two-layer guard used
     * for Scenario.evaluation.
     */
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
)

adminUserSchema.pre('validate', function setNormalised() {
  if (this.username) this.usernameNormalised = normaliseUsername(this.username)
})

/** The ONLY shape an AdminUser is ever allowed to leave the server in. */
adminUserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    username: this.username,
  }
}

export const AdminUser = mongoose.model('AdminUser', adminUserSchema)

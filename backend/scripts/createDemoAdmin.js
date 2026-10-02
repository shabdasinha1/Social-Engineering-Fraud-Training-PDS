/**
 * DEMO ONLY - creates the temporary client-demo administrator (username "admin").
 *
 *   npm run admin:create-demo
 *
 * The demo credential is shorter than the MIN_PASSWORD_LENGTH that `admin:create`
 * enforces, so it cannot go through that script. Everything else is the real
 * mechanism: the same AdminUser model, the same Argon2id hash from
 * `utils/password.js` (never a plaintext password), and the same single-admin rule -
 * if any administrator already exists this script stops and changes nothing.
 *
 * It refuses to run with NODE_ENV=production. The demo credential MUST be replaced
 * (delete this account, then run `npm run admin:create`) before any real deployment.
 */
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { isProduction } from '../src/config/env.js'
import { AdminUser } from '../src/models/AdminUser.js'
import { countAdmins } from '../src/services/adminService.js'
import { hashPassword } from '../src/utils/password.js'

const DEMO_USERNAME = 'admin'
const DEMO_PASSWORD = 'admin'

async function main() {
  if (isProduction) {
    console.error('Refusing to create the demo administrator with NODE_ENV=production.')
    console.error('Use `npm run admin:create` for a real account.')
    process.exitCode = 1
    return
  }

  await connectDatabase()

  if ((await countAdmins()) > 0) {
    console.error('\nAn administrator account already exists.')
    console.error('This script will not overwrite it. Nothing was changed.')
    process.exitCode = 1
    return
  }

  const passwordHash = await hashPassword(DEMO_PASSWORD)
  const admin = await AdminUser.create({ username: DEMO_USERNAME, passwordHash })

  console.log(`\nDemo administrator "${admin.username}" created (Argon2id hash stored).`)
  console.log('DEMO ONLY: replace this credential before any real deployment.')
}

try {
  await main()
} finally {
  await disconnectDatabase()
}

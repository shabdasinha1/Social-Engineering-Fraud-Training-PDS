/**
 * OPERATOR SCRIPT - creates the administrator account.
 *
 *   npm run admin:create
 *
 * This is the only way an AdminUser comes into existence. There is no HTTP
 * route, no seed file, no startup hook and no default account anywhere in the
 * product. The credential is typed by the operator at install time, hashed
 * with Argon2id and never written to disk in any other form.
 *
 * Single-admin for the development phase: if an administrator already exists
 * the script stops and changes nothing.
 */
import readline from 'node:readline'
import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { MIN_PASSWORD_LENGTH } from '../src/models/AdminUser.js'
import { countAdmins, createAdminUser, validateCredentialShape } from '../src/services/adminService.js'
import { ask, askHidden } from './prompt.js'

async function main() {
  if (!process.stdin.isTTY) {
    console.error('This script needs an interactive terminal so the password is not echoed.')
    console.error('Run it directly:  npm run admin:create')
    process.exitCode = 1
    return
  }

  await connectDatabase()

  // Checked before anything is typed, so the operator is not asked for a
  // credential the script is going to refuse anyway.
  if ((await countAdmins()) > 0) {
    console.error('\nAn administrator account already exists.')
    console.error('This script will not overwrite it. Nothing was changed.')
    process.exitCode = 1
    return
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  })

  try {
    console.log('\nCreate the administrator account')
    console.log('--------------------------------')
    console.log(`Username: 3-32 characters, letters, digits, dot, underscore or hyphen.`)
    console.log(`Password: at least ${MIN_PASSWORD_LENGTH} characters. It is not shown as you type.\n`)

    const username = (await ask(rl, 'Username: ')).trim()
    const password = await askHidden(rl, 'Password: ')
    const confirm = await askHidden(rl, 'Confirm password: ')

    if (password !== confirm) {
      console.error('\nThe passwords do not match. Nothing was created.')
      process.exitCode = 1
      return
    }

    const problems = validateCredentialShape(username, password)
    if (problems.length) {
      console.error('')
      for (const problem of problems) console.error(`- ${problem}`)
      console.error('\nNothing was created.')
      process.exitCode = 1
      return
    }

    const admin = await createAdminUser({ username, password })

    console.log(`\nAdministrator "${admin.username}" created.`)
    console.log('Store the password in your own password manager - it cannot be recovered')
    console.log('from the database, and this build has no password-reset flow.')
  } catch (error) {
    console.error(`\n${error.message}`)
    process.exitCode = 1
  } finally {
    rl.close()
  }
}

try {
  await main()
} finally {
  await disconnectDatabase()
}

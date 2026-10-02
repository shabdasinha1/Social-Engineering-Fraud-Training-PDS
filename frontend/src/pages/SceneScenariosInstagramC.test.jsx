import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CandidateProvider } from '@/context/CandidateProvider'
import { ROUTES } from '@/constants/routes'
import { SimulationPage } from '@/pages/SimulationPage'
import { createFakeServer, installFetch } from '@/test/attemptFixtures'

/**
 * Instagram I11 to I15, end to end, through the real controller and the attempt API
 * (IMMERSIVE-004C) - the third Instagram batch.
 *
 * Same posture as the two Instagram suites before it: the fake server owns the stage, so the only
 * way a test can move a scenario forward is to make the server accept an intent. Each scenario is
 * checked for the interaction it was built around: a welfare notice whose only danger is what the
 * learner says in public and whose comparison panel is their own Saved collection; a recovery
 * "case" that manufactures the code it then asks for; four months of thread settled by a local
 * image index; an attachment picker holding the learner's own documents; and a friend's own
 * account, whose every documentary check comes back clean.
 */

configure({ asyncUtilTimeout: 4000 })

const BANK = (() => {
  const path = resolve(process.cwd(), '../backend/data/synthetic/v1/synthetic.instagram.json')
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  const records = Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
  return Object.fromEntries(records.map((record) => [record.scenario_id, record]))
})()

function scenarioPayload(scenarioId) {
  const record = BANK[scenarioId]
  return {
    id: `def-${scenarioId}`,
    scenario_id: record.scenario_id,
    version: record.definition_version,
    platform: record.platform,
    synthetic: record.synthetic,
    stages: [],
  }
}

function renderSimulation() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.ASSESSMENT]}>
      <CandidateProvider>
        <Routes>
          <Route path={ROUTES.ASSESSMENT} element={<SimulationPage />} />
          <Route path={ROUTES.DASHBOARD} element={<p>Dashboard</p>} />
        </Routes>
      </CandidateProvider>
    </MemoryRouter>,
  )
}

let server

function startAt(scenarioId, stage) {
  server = createFakeServer({ scenario: scenarioPayload(scenarioId) })
  server.stage = stage
  installFetch(server)
  return renderSimulation()
}

const sentIntents = () =>
  server.calls.filter((call) => call.method === 'POST').map((call) => call.intent)

const posts = () => server.calls.filter((call) => call.method === 'POST')

const openMenu = async (user) =>
  user.click(await screen.findByRole('button', { name: 'More options' }))

const click = async (user, name) => user.click(await screen.findByRole('button', { name }))

const surface = () => screen.findByTestId('scene-surface')

const inSurface = async (user, name) =>
  user.click(await within(await surface()).findByRole('button', { name }))

async function fill(user, values) {
  const inputs = within(await surface()).getAllByRole('textbox')
  for (const [index, value] of values.entries()) await user.type(inputs[index], value)
}

const wire = () => JSON.stringify(posts().map((call) => call.body))

const contained = (container) => {
  expect(container.querySelectorAll('a[href], form, iframe, embed, object')).toHaveLength(0)
  expect(container.querySelectorAll('img, video, audio, source, [src]')).toHaveLength(0)
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

beforeEach(() => {
  server = null
})

/* ------------------------------------------------------------------ *
 * I11 - the welfare notice
 * ------------------------------------------------------------------ */

describe('I11 - the official welfare helpline update', () => {
  it('reads the notice, compares it with the saved August one, saves it and checks the directory', async () => {
    const user = userEvent.setup()
    startAt('I11', 'open')

    const row = await screen.findByRole('button', { name: 'Open the notice' })
    expect(row.textContent).toContain('Helpline extension updated. Use the contact in the approved directory.')
    await user.click(row)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The cell's own rule, and its own correction of somebody else, are in the thread.
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/please do not put case numbers/i)).toBeTruthy()
    expect(within(thread).getByText(/the comments are public/i)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    // A professional account's action row carries the extension itself.
    expect(within(await surface()).getByTestId('ig-profile-actions').textContent).toContain('ext 4477')
    await inSurface(user, /^Call/)
    expect(await screen.findByText('4477 (from 16 September)')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'About this account')
    expect(await screen.findByText('March 2019')).toBeTruthy()
    expect(screen.getByText('This account has no former usernames.')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/the directory is the one to use/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // A friend is telling the learner to put their case in the comments.
    expect(await screen.findByText(/put your file no here/)).toBeTruthy()

    // The Saved collection is the comparison: August's notice still says 4412.
    await openMenu(user)
    await click(user, /Open Saved › Unit notices/)
    const collection = await surface()
    expect(within(collection).getByText(/extension 4412/)).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, /File it under Unit notices/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Compare the account and the extension/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(screen.getAllByText('@forces_welfare_official').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Close Trusted directory' }))

    await click(user, 'Keep the saved notice and carry on')
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_retain',
    ])
  }, 40_000)

  it('records the public comment as the release, and never sends the words', async () => {
    const user = userEvent.setup()
    startAt('I11', 'branch')
    await click(user, /Comment with your file number/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('WF/2026')
  })

  it('offers muting and reporting, because a false positive has to be reachable', async () => {
    const user = userEvent.setup()
    startAt('I11', 'branch')
    await openMenu(user)
    await click(user, /Mute the account/)
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
    cleanup()

    startAt('I11', 'verify')
    await openMenu(user)
    await click(user, 'Report the post')
    await waitFor(() => expect(sentIntents()).toEqual(['report']))
  })

  it('reads the helpline in the unit application without leaving a mark on the ledger', async () => {
    const user = userEvent.setup()
    startAt('I11', 'verify')
    await openMenu(user)
    await click(user, /Open the unit welfare application/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText(/ext 4477/)).toBeTruthy()
    const before = posts().length
    await inSurface(user, 'Leave Unit Falcon Welfare')
    expect(posts().length).toBe(before)
  })
})

/* ------------------------------------------------------------------ *
 * I12 - the recovery case
 * ------------------------------------------------------------------ */

describe('I12 - the account recovery backup code', () => {
  it('walks the account’s history, leaves the request alone and reads its own Login activity', async () => {
    const user = userEvent.setup()
    startAt('I12', 'open')
    await click(user, 'Open the message request')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/We stopped a hacker/)).toBeTruthy()
    // The code has not arrived yet: it belongs to the branch.
    expect(within(thread).queryByText(/419 302/)).toBeNull()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('September 2026 (6 days ago)')).toBeTruthy()
    expect(screen.getByText('@ig.helpdesk.team')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'See where this account comments')
    expect(await screen.findByText(/under three strangers’ posts/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // Now the code really is on the learner's own screen, and the account asks for it.
    expect(await screen.findByText(/419 302 is your Instagram code/)).toBeTruthy()

    await openMenu(user)
    await click(user, /Send nothing and leave the request/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Settings › Password and security yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await inSurface(user, /Login activity/)
    expect(await screen.findByText(/Password reset requested/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, /Support requests/)
    expect(await screen.findByText('Cases opened about your account')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, 'Report the request and delete it')
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('sends the code from the composer as a secret, and never puts the digits on the wire', async () => {
    const user = userEvent.setup()
    startAt('I12', 'branch')
    await click(user, /Send the code that just arrived/)
    expect(screen.getByTestId('ig-composer-field').textContent).toBe('419 302')
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(wire()).not.toContain('419 302')
    expect(wire()).not.toContain('419302')
  })

  it('submits the security check with a password and a backup code, sending neither', async () => {
    const user = userEvent.setup()
    startAt('I12', 'branch')
    await openMenu(user)
    await click(user, /Open the security check they linked/)
    expect(await within(await surface()).findByText('i12.training.example')).toBeTruthy()
    await inSurface(user, 'Confirm ownership')
    await fill(user, ['rao.outdoors', 'trailpass55', '44117722'])
    await inSurface(user, 'Continue')
    await inSurface(user, 'Unlock the account')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['trailpass55', '44117722', 'rao.outdoors']) {
      expect(wire()).not.toContain(value)
    }
    // The page moves to its own outcome screen; the engine decided, the page did not.
    expect(await within(await surface()).findByText(/handed back to its owner/)).toBeTruthy()
  }, 25_000)
})

/* ------------------------------------------------------------------ *
 * I13 - the deployed officer
 * ------------------------------------------------------------------ */

describe('I13 - the deployed officer romance profile', () => {
  it('reads four months of thread, refuses, and checks the photograph in the local index', async () => {
    const user = userEvent.setup()
    startAt('I13', 'open')

    // The main inbox, not Requests.
    const list = await screen.findByTestId('ig-list')
    expect(within(list).queryByText('Requests')).toBeNull()
    await click(user, /Open your conversation with Aarav Menon/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText('12 JUNE')).toBeTruthy()
    expect(within(thread).getByText(/I woke thinking of you before the shift/)).toBeTruthy()
    expect(within(thread).getByText(/only text on the satellite link/)).toBeTruthy()
    expect(within(thread).getByText(/My baggage is held/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('May 2026 (4 months ago)')).toBeTruthy()
    expect(screen.getByText('@capt.aarav.intl')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/with a different name, is that you/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // The portal is readable, method page and all, before anything is decided.
    await click(user, 'Open the release page')
    expect(await within(await surface()).findByText(/Consignment GCR-7741 is held/)).toBeTruthy()
    await inSurface(user, 'Release the consignment')
    expect(await screen.findByText(/Retail gift cards, or a wallet transfer/)).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Back to the previous page')
    await inSurface(user, 'Close the browser and go back')

    await openMenu(user)
    await click(user, /Say you will not send money/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Check the profile photograph in Image Match/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('3 matches in the local index')).toBeTruthy()
    expect(screen.getByText(/Still active. Same photograph, different name and rank./)).toBeTruthy()
    await inSurface(user, 'Leave Image Match')

    await click(user, /Keep the conversation as evidence and report/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('applies the gift cards and never puts a card number or a PIN on the wire', async () => {
    const user = userEvent.setup()
    startAt('I13', 'branch')
    await click(user, 'Open the release page')
    await inSurface(user, 'Release the consignment')
    await inSurface(user, 'Pay with gift cards')
    await fill(user, ['1111222233334444', '901901', '5555666677778888', '404404'])
    await inSurface(user, 'Review')
    await inSurface(user, /Apply INR 21,500 in gift cards/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['1111222233334444', '901901', '5555666677778888', '404404']) {
      expect(wire()).not.toContain(value)
    }
  }, 25_000)

  it('sends the wallet transfer and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I13', 'branch')
    await click(user, 'Open the release page')
    await inSurface(user, 'Release the consignment')
    await inSurface(user, 'Pay from a wallet')
    expect(await screen.findByText('tb1qgcr7741release0training0example')).toBeTruthy()
    await user.type((await within(await surface()).getAllByRole('textbox')).at(-1), '556677')
    await click(user, 'Send INR 21,500')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('556677')
  }, 20_000)

  it('treats the identity card sent from the chat as the same release', async () => {
    const user = userEvent.setup()
    startAt('I13', 'branch')
    await click(user, /Send a photo of your ID card/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
  })
})

/* ------------------------------------------------------------------ *
 * I14 - the commendation page
 * ------------------------------------------------------------------ */

describe('I14 - the commendation page requesting documents', () => {
  it('finds last month’s documents in the highlights, clears the picker and rings the office', async () => {
    const user = userEvent.setup()
    startAt('I14', 'open')
    await click(user, 'Open the message request')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/3\.3 lakh followers/)).toBeTruthy()
    expect(within(thread).getByText(/Send service card and posting proof/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    // The DM's claim and the profile's own count disagree.
    expect(within(await surface()).getByText('3,383')).toBeTruthy()
    await inSurface(user, 'Open the SEPT FEATURES highlight')
    expect(await screen.findByText(/service card as submitted/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/my card photo is still on your September highlight/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@viral.army.status')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // The picker is the decision; opening it and looking at a file is not.
    await click(user, 'Attach files')
    const picker = await surface()
    expect(within(picker).getByText('Posting order 2026.pdf')).toBeTruthy()
    await user.click(within(picker).getByRole('button', { name: /Posting order 2026\.pdf/ }))
    expect(await screen.findByText(/Station, reporting date, movement route/)).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Clear the selection and close')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /from the trusted directory/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await screen.findByRole('dialog', { name: 'Trusted directory' })
    await user.click(screen.getByRole('button', { name: 'Close Trusted directory' }))

    await click(user, /report the page for asking for documents/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_report',
    ])
  }, 40_000)

  it('sends the two files as the release, and reports which was chosen to nobody', async () => {
    const user = userEvent.setup()
    startAt('I14', 'branch')
    await click(user, 'Attach files')
    const picker = await surface()
    await user.click(within(picker).getByRole('button', { name: /Service identity card \(back\)/ }))
    await inSurface(user, 'Send the two selected files')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('Service identity card')
    expect(wire()).not.toContain('Posting order')
  }, 20_000)

  it('opens the page’s own form as the untrusted channel, and asks for no fields there', async () => {
    const user = userEvent.setup()
    startAt('I14', 'branch')
    await openMenu(user)
    await click(user, /Open the feature form on their site/)
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
    const page = await surface()
    expect(within(page).getByText('honourroll.training.example')).toBeTruthy()
    expect(within(page).queryAllByRole('textbox')).toHaveLength(0)
  })

  it('reads the unit media desk instruction without recording a second decision', async () => {
    const user = userEvent.setup()
    startAt('I14', 'verify')
    await openMenu(user)
    await click(user, /Open the unit media desk/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('No personnel documents to any page')).toBeTruthy()
    const before = posts().length
    await inSurface(user, 'Leave Unit Falcon · Media desk')
    expect(posts().length).toBe(before)
  })
})

/* ------------------------------------------------------------------ *
 * I15 - the friend's own account
 * ------------------------------------------------------------------ */

describe('I15 - “you are in this video”', () => {
  it('finds every check clean, refuses the login prompt and rings the friend', async () => {
    const user = userEvent.setup()
    startAt('I15', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText('has Rohit messaged you today?')).toBeTruthy()
    await click(user, /Open your chat with Rohit Kamath/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/did you find the trek poles/)).toBeTruthy()
    expect(within(thread).getByText(/Is this you in the video\?\? I can’t believe it/)).toBeTruthy()
    expect(within(thread).getByText('ig-vid-share.training.example/v/8ha2k')).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('June 2015')).toBeTruthy()
    expect(screen.getByText('This account has no former usernames.')).toBeTruthy()
    expect(screen.getByText(/nothing about this account has changed/i)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // The learner's own phone raises the login request while they are deciding.
    expect(await screen.findByText(/someone is trying to log in to your account/i)).toBeTruthy()
    await click(user, 'Open the login request')
    const sheet = await surface()
    expect(within(sheet).getByText('Nagpur, IN')).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'It wasn’t me')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Ring Rohit Kamath on the number saved/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 30418')).toBeTruthy()
    await inSurface(user, 'Back to the conversation')

    await click(user, /Report the message and warn Rohit Kamath/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  }, 40_000)

  it('approves the login request as a release, with nothing typed anywhere', async () => {
    const user = userEvent.setup()
    startAt('I15', 'branch')
    await click(user, 'Open the login request')
    const sheet = await surface()
    expect(within(sheet).queryAllByRole('textbox')).toHaveLength(0)
    await inSurface(user, 'Yes, it was me')
    await waitFor(() => expect(sentIntents()).toEqual(['approve_device_link']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  })

  it('logs in on the gate and sends neither the password nor the code', async () => {
    const user = userEvent.setup()
    startAt('I15', 'branch')
    await click(user, 'Open the link')
    expect(await within(await surface()).findByText('i15.training.example')).toBeTruthy()
    await inSurface(user, 'Log in to watch')
    await fill(user, ['rao.outdoors', 'trailpass55'])
    await inSurface(user, 'Log in')
    await fill(user, ['884422'])
    await inSurface(user, 'Continue')
    await inSurface(user, 'Confirm and play the clip')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['trailpass55', '884422', 'rao.outdoors']) {
      expect(wire()).not.toContain(value)
    }
  }, 25_000)

  it('shows the learner’s own Login activity waiting on the same attempt', async () => {
    const user = userEvent.setup()
    startAt('I15', 'verify')
    await openMenu(user)
    await click(user, /Open Settings › Login activity yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText(/waiting for approval/)).toBeTruthy()
    /**
     * Every row is drawn. A login list repeats itself by nature, and keying those rows on
     * their label alone dropped one of them - found in IMMERSIVE-004C browser play as a
     * React duplicate-key warning on I12 and I15.
     */
    expect(within(await surface()).getAllByRole('listitem')).toHaveLength(3)
    await inSurface(user, 'Close and go back')
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on I11-I15', () => {
  const IDS = ['I11', 'I12', 'I13', 'I14', 'I15']

  it.each(IDS)('%s sends no stage, score or event code, and only allowlisted metadata', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'verify')
    await openMenu(user)
    const menu = await screen.findByTestId('ig-menu')
    const scored = within(menu).getAllByRole('button')
      .filter((button) => button.getAttribute('data-control') !== 'nav')
    await user.click(scored[0])
    await waitFor(() => expect(posts().length).toBeGreaterThan(0))

    for (const call of posts()) {
      for (const forbidden of [
        'stage', 'current_stage', 'next_stage', 'score', 'points', 'points_delta',
        'event_code', 'outcome_code', 'expires_at', 'evaluation',
      ]) {
        expect(call.body).not.toHaveProperty(forbidden)
      }
      for (const key of Object.keys(call.body.metadata ?? {})) {
        expect([
          // SECURITY-001: the only metadata a client may send; the rest is server-written.
          'dwell_ms', 'open_latency_ms', 'link_hover_ms',
        ]).toContain(key)
      }
    }
  })

  it.each(IDS)('%s rebuilds from the server after a remount, with no pushed screen and nothing replayed', async (id) => {
    const user = userEvent.setup()
    const { unmount } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')

    await openMenu(user)
    const menu = await screen.findByTestId('ig-menu')
    const local = within(menu).getAllByRole('button')
      .filter((button) => button.getAttribute('data-control') === 'nav')
    if (local.length > 0) {
      await user.click(local[0])
      await surface()
    }
    const before = posts().length

    unmount()
    installFetch(server)
    renderSimulation()
    await screen.findByTestId('phone-app')

    expect(server.stage).toBe('branch')
    expect(posts().length).toBe(before)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
  })

  it.each(IDS)('%s names the client’s handle on the toast, never the placeholder', async (id) => {
    startAt(id, 'notify')
    const tray = await screen.findByTestId('notification-tray')
    const handle = /^@([^:]+):/.exec(BANK[id].synthetic.assets
      .find((a) => a.kind === 'notification').content.body)[1]
    expect(within(tray).getByText(handle)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/unknownsender/)
  })

  it.each(IDS)('%s puts no verdict word on the page at any stage', async (id) => {
    for (const stage of ['inspect', 'branch', 'resolve']) {
      startAt(id, stage)
      await screen.findByTestId('phone-app')
      expect(document.body.textContent.toLowerCase())
        .not.toMatch(/\b(malicious|legitimate|phishing|fraudulent|scam|fake|deepfake|impersonat\w*|genuine)\b/)
      cleanup()
    }
  })

  it.each(IDS)('%s contacts no external origin and loads nothing', async (id) => {
    const { container } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')
    contained(container)
  })
})

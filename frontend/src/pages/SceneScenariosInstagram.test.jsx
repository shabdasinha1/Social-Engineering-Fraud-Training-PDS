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
import {
  expectNeutralMarkup, expectNeutralRequests, expectNeutralStorage,
} from '@/test/neutrality'

/**
 * Instagram I01 to I05, end to end, through the real controller and the real attempt API
 * (IMMERSIVE-004A) - the first Instagram batch.
 *
 * Same posture as the WhatsApp suites: the fake server owns the stage, so the only way a test
 * can move a scenario forward is to make the server accept an intent. Each scenario is checked
 * for the interaction it was built around: a public giveaway post and an in-app brand search, a
 * copyright-appeal request settled against the app's own Account Status, a genuine verified post
 * that must not be over-reported, a cloned friend laid beside the real one, and an elicitation DM
 * whose quick replies are the release.
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
 * I01 - the giveaway post and the brand's real account
 * ------------------------------------------------------------------ */

describe('I01 - the flash giveaway winner', () => {
  it('walks the post, the profile, and searches the brand to settle it', async () => {
    const user = userEvent.setup()
    startAt('I01', 'open')

    // The delivered row is drawn, not just named: a browser run found it empty once.
    const row = await screen.findByRole('button', { name: /Open the post .* mentioned you in/ })
    expect(row.textContent).toContain('mega_rewards_help')
    expect(row.textContent).toContain('mentioned you in a post')
    expect(within(await screen.findByTestId('ig-list')).getByText(/nisha\.bakes/).textContent)
      .not.toMatch(/nisha\.bakes.*nisha\.bakes/)

    await click(user, /Open the post .* mentioned you in/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The post view shows the client's headline and that comments are off.
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText('@mega_rewards_help: You won! Claim in 10 minutes or we redraw.')).toBeTruthy()
    expect(within(thread).getByText(/Comments on this post have been turned off/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    // The account history is on About this account.
    await inSurface(user, 'About this account')
    expect(await screen.findByText('September 2026 (2 days ago)')).toBeTruthy()
    expect(screen.getByText('@cricket_highlights_4k')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())

    // Leave the post rather than claiming (safe pivot), from the menu.
    await openMenu(user)
    await click(user, /Leave the post without claiming/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Search Instagram for Mega Rewards yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    // The search shows the verified brand first; its pinned post states the rules.
    await inSurface(user, /1\.2M followers/)
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/We never ask winners to log in on a website/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, /Report the post and remove your tag/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 30_000)

  it('logs in on the claim page and never sends what was typed', async () => {
    const user = userEvent.setup()
    startAt('I01', 'branch')
    await openMenu(user)
    await click(user, /Open the link in their bio/)
    await inSurface(user, 'Continue with Instagram')
    await fill(user, ['winner_account', 'hunter2secret'])
    await inSurface(user, 'Log in')
    await inSurface(user, 'Allow')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    const sent = JSON.stringify(posts().map((call) => call.body))
    expect(sent).not.toContain('hunter2secret')
    expect(sent).not.toContain('winner_account')
  }, 20_000)

  it('pays the delivery fee and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I01', 'branch')
    await openMenu(user)
    await click(user, /Open the link in their bio/)
    await inSurface(user, 'Continue with Instagram')
    // From the login page, the guest link leads to the delivery fee without logging in.
    await inSurface(user, /pay delivery as a guest/)
    expect(await screen.findByText('SWIFTSHIP LOGISTICS')).toBeTruthy()
    await inSurface(user, /Pay INR 49 by UPI/)
    await user.type((await within(await surface()).getAllByRole('textbox')).at(-1), '424242')
    await click(user, 'Pay INR 49')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('424242')
  }, 20_000)
})

/* ------------------------------------------------------------------ *
 * I02 - the copyright appeal and Account Status
 * ------------------------------------------------------------------ */

describe('I02 - the copyright appeal countdown', () => {
  it('checks the app’s own Account Status instead of the DM link', async () => {
    const user = userEvent.setup()
    startAt('I02', 'verify')
    await openMenu(user)
    await click(user, /Open Settings . Account Status yourself/)
    await waitFor(() => expect(sentIntents()).toEqual(['verify_known_app']))
    await inSurface(user, /Account Status/)
    expect(await screen.findByText(/No reports against your account/)).toBeTruthy()
  })

  it('submits the appeal login and backup code, sending none of them', async () => {
    const user = userEvent.setup()
    startAt('I02', 'branch')
    await openMenu(user)
    await click(user, /Open the appeal link/)
    await inSurface(user, 'Start appeal')
    await fill(user, ['my_handle', 'pass9word', '11223344'])
    await inSurface(user, 'Submit appeal')
    await inSurface(user, 'Submit the appeal')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    const sent = JSON.stringify(posts().map((call) => call.body))
    for (const value of ['pass9word', '11223344', 'my_handle']) expect(sent).not.toContain(value)
  }, 20_000)
})

/* ------------------------------------------------------------------ *
 * I03 - the legitimate blood-donation post
 * ------------------------------------------------------------------ */

describe('I03 - the published blood-donation drive', () => {
  it('saves the verified post and confirms it against the directory', async () => {
    const user = userEvent.setup()
    startAt('I03', 'open')
    await click(user, /Open .*’s post/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/Approved for public release: PA\/FAL\/2026\/214/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('February 2019')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')
    // The stranger's shortcut arrives underneath the post at the branch stage.
    expect(await screen.findByText(/Skip the queue/)).toBeTruthy()

    await click(user, 'Save the post')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Compare the handle with the official-account directory/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    const dialog = await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(within(dialog).getByText(/Unit Falcon \(Public Information\)/)).toBeTruthy()

    await user.keyboard('{Escape}')
    await click(user, /Keep the post and share it normally/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_continue',
    ])
  }, 30_000)

  it('records the stranger’s registration link as the untrusted channel', async () => {
    const user = userEvent.setup()
    startAt('I03', 'branch')
    await openMenu(user)
    await click(user, /Register through the form donor_link_fast posted/)
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
    expect(await within(await surface()).findByText('Unit and service number')).toBeTruthy()
    // The page is shown, not offered: the decision has already been taken.
    expect(within(await surface()).queryAllByRole('textbox')).toHaveLength(0)
  })

  it('does not put a verdict word on the page', async () => {
    startAt('I03', 'branch')
    await screen.findByTestId('phone-app')
    const text = document.body.textContent.toLowerCase()
    expect(text).not.toMatch(/\b(malicious|legitimate|phishing|fraudulent)\b/)
  })
})

/* ------------------------------------------------------------------ *
 * I04 - the cloned friend
 * ------------------------------------------------------------------ */

describe('I04 - the cloned friend in distress', () => {
  it('opens the clone, compares the real friend, and calls her saved number', async () => {
    const user = userEvent.setup()
    startAt('I04', 'open')
    await click(user, /Open the message request/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText(/last four days/)).toBeTruthy()
    // The real friend is one tap away for comparison, and she posted a story 25 minutes ago.
    await inSurface(user, 'Search: riya.kapoor')
    expect(await screen.findByText(/commented on each other/)).toBeTruthy()
    await inSurface(user, /Riya’s story/)
    expect(await screen.findByText('📍 Café Mocha, FC Road')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])

    await openMenu(user)
    await click(user, /check with Riya first/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Call Riya on her saved number/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    // The call screen opens on Riya's own saved number; captions arrive on the call's clock.
    const call = await surface()
    expect(within(call).getByText('+91 00000 44120')).toBeTruthy()

    expect(sentIntents()).toEqual(['read', 'inspect_profile', 'safe_pivot', 'verify_known_number'])
  }, 30_000)

  it('pays the clone and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I04', 'branch')
    const thread = await screen.findByTestId('ig-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open the payment request' }))
    expect(await within(await surface()).findByText('anandi.collect@trainingpay')).toBeTruthy()
    await user.type((await within(await surface()).getAllByRole('textbox')).at(-1), '424242')
    await click(user, 'Pay INR 4,500')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('424242')
  })
})

/* ------------------------------------------------------------------ *
 * I05 - the elicitation questionnaire
 * ------------------------------------------------------------------ */

describe('I05 - the friendly new follower', () => {
  it('keeps it friendly without sharing, then checks a known mutual', async () => {
    const user = userEvent.setup()
    startAt('I05', 'open')
    await click(user, /Open the message request/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    // The pattern is on the account's comment history elsewhere.
    await inSurface(user, /See where this account comments/)
    expect(await screen.findByText(/Which unit and what time/)).toBeTruthy()
    await inSurface(user, /Back to the previous screen|Close and go back/)

    await openMenu(user)
    await click(user, /Don’t reply to the questions/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Phone Karan from the run club/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 91340')).toBeTruthy()
    await inSurface(user, 'Back to the conversation')

    // Reviewing the learner's own privacy is local and records nothing.
    await openMenu(user)
    await click(user, /Settings › Account privacy/)
    expect(await screen.findByText(/Added to 23 of your last 30 stories/)).toBeTruthy()
    await inSurface(user, 'Close and go back')

    await click(user, /Restrict and report the account/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  }, 30_000)

  it('carries the claimed mutual into the thread, so there is something to check', async () => {
    startAt('I05', 'inspect')
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/Karan from the Sunday run club/)).toBeTruthy()
    expect(within(thread).getByText('Great training! Which city, unit and daily route do you use?')).toBeTruthy()
  })

  it('sends a quick reply as an intent only; the text never reaches the wire', async () => {
    const user = userEvent.setup()
    startAt('I05', 'branch')
    await click(user, /Send your daily route and time/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(JSON.stringify(posts().map((call) => call.body))).not.toContain('Same trail every morning')
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on I01-I05', () => {
  const IDS = ['I01', 'I02', 'I03', 'I04', 'I05']

  it.each(IDS)('%s sends no stage, score or event code, and only allowlisted metadata', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'inspect')
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

  it.each(IDS)('%s rebuilds from the server after a remount, replaying nothing', async (id) => {
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

  it.each(IDS)('%s never prints the bank’s placeholder sender, on the toast or in the directory', async (id) => {
    const user = userEvent.setup()
    startAt(id, 'notify')
    const tray = await screen.findByTestId('notification-tray')
    const handle = /^@([^:]+):/.exec(BANK[id].synthetic.assets
      .find((a) => a.kind === 'notification').content.body)[1]
    expect(within(tray).getByText(handle)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/unknownsender/)
    cleanup()

    startAt(id, 'verify')
    await openMenu(user)
    await click(user, /trusted directory|official-account directory/)
    await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(document.body.textContent).not.toMatch(/unknownsender/)
    expect(screen.getAllByText(`@${handle}`).length).toBeGreaterThan(0)
  })

  it.each(IDS)('%s contacts no external origin and loads nothing', async (id) => {
    const { container } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')
    contained(container)
  })
})

/* ------------------------------------------------------------------ *
 * SECURITY-001 - what developer tools can see on an Instagram scene
 * ------------------------------------------------------------------ */

describe('SECURITY-001 - I01 exposes no evaluation vocabulary', () => {
  it('walks the safe route with neutral markup, opaque codes on the wire and nothing stored', async () => {
    const user = userEvent.setup()
    startAt('I01', 'open')
    const snaps = []
    const snap = () => snaps.push(document.body.innerHTML)

    await screen.findByTestId('ig-list')
    snap()
    await click(user, /Open the post .* mentioned you in/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    await screen.findByTestId('ig-thread')
    snap()
    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await surface()
    snap()
    await inSurface(user, 'Close and go back')
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    await openMenu(user)
    snap()
    await click(user, /Leave the post without claiming/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    snap()
    await click(user, /Search Instagram for Mega Rewards yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    snap()
    await inSurface(user, 'Close and go back')
    snap()
    await click(user, /Report the post and remove your tag/)
    await waitFor(() => expect(server.resolved).toBe(1))
    snap()

    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
    snaps.forEach((html, index) => expectNeutralMarkup(html, `I01 snapshot ${index}`))
    expectNeutralRequests(server.calls)
    expectNeutralStorage()
  }, 30_000)

  it('walks an unsafe route the same way, and the server still scores what was chosen', async () => {
    const user = userEvent.setup()
    startAt('I01', 'branch')
    await screen.findByTestId('ig-thread')

    await openMenu(user)
    expectNeutralMarkup(document.body.innerHTML, 'branch menu')
    await click(user, /Share this post to your story to confirm your entry/)
    await waitFor(() => expect(server.stage).toBe('verify'))
    await openMenu(user)
    expectNeutralMarkup(document.body.innerHTML, 'verify menu')
    await click(user, /and ask for proof you won/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await openMenu(user)
    expectNeutralMarkup(document.body.innerHTML, 'resolve menu')
    await click(user, /Go back and finish claiming/)
    await waitFor(() => expect(server.resolved).toBe(1))

    expect(sentIntents()).toEqual(['reply', 'verify_in_message_contact', 'resolve_continue'])
    expectNeutralRequests(server.calls)
    expectNeutralStorage()
  }, 30_000)
})

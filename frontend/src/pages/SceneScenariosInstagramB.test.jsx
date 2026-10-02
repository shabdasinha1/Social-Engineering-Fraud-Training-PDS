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
 * Instagram I06 to I10, end to end, through the real controller and the attempt API
 * (IMMERSIVE-004B) - the second Instagram batch.
 *
 * Same posture as the I01-I05 suite: the fake server owns the stage, so the only way a test can
 * move a scenario forward is to make the server accept an intent. Each scenario is checked for
 * the interaction it was built around: a comment under the learner's own post and the Add
 * location sheet, a friend's reel used normally and checked against the chat's own history, a
 * badge "agent" set against the app's Request verification page, a sponsored reel whose landing
 * page funnels into a group, an app, KYC and a deposit, and a creator agreement whose clauses
 * carry the turn.
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
 * I06 - the comment under the learner's own post
 * ------------------------------------------------------------------ */

describe('I06 - where was this exercise?', () => {
  it('reads the comment on your own post, walks the account, leaves it unanswered and calls the cell', async () => {
    const user = userEvent.setup()
    startAt('I06', 'open')

    const row = await screen.findByRole('button', { name: /Open the comment defence_fan_archive left on your post/ })
    expect(row.textContent).toContain('commented on your post')
    await user.click(row)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The post is the learner's own; the question sits in its comments.
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText('Impressive! Which base and what dates was this taken? DM me the route.')).toBeTruthy()
    expect(within(thread).getByText(/PA\/FAL\/2026\/188/)).toBeTruthy()
    // The author row is the learner and opens nothing.
    expect(within(thread).queryByRole('button', { name: /rao\.outdoors.*open profile/ })).toBeNull()

    await click(user, /View defence_fan_archive/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/Exercise season so far/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@cantonment.memes')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // A friend has answered for everyone by the time the learner decides.
    expect(await screen.findByText(/back Friday/)).toBeTruthy()
    // The comment box says what a reply is.
    expect(screen.getByText('Comments on your post are public.')).toBeTruthy()

    // Opening Add location is navigation; Cancel is the decision.
    await openMenu(user)
    await click(user, /Edit post › Add location/)
    expect(await within(await surface()).findByText('Falcon Cantonment · Range 3')).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Cancel')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Call the Unit Falcon Public Information Cell/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 25990')).toBeTruthy()
    await inSurface(user, 'Back to the conversation')

    // The release note stays readable, and records nothing.
    await openMenu(user)
    await click(user, /View the release note on your post/)
    expect(await screen.findByText(/Location, base, range, dates, routes/)).toBeTruthy()
    await inSurface(user, 'Close and go back')

    await click(user, /Hide the comment and report it/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  }, 40_000)

  it('tags the range on the post as the release', async () => {
    const user = userEvent.setup()
    startAt('I06', 'branch')
    await openMenu(user)
    await click(user, /Edit post › Add location/)
    await inSurface(user, /Add “Falcon Cantonment · Range 3”/)
    await waitFor(() => expect(sentIntents()).toEqual(['share_location']))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
  })

  it('replies in public with a chosen comment, sending the intent and never the words', async () => {
    const user = userEvent.setup()
    startAt('I06', 'branch')
    await click(user, /Reply with the range and the dates/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('Range 3 at Falcon')
  })
})

/* ------------------------------------------------------------------ *
 * I07 - the friend's reel
 * ------------------------------------------------------------------ */

describe('I07 - a known friend shares a reel', () => {
  it('reads yesterday’s chat, likes the reel in the player and checks the chat history', async () => {
    const user = userEvent.setup()
    startAt('I07', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).queryByText('Requests')).toBeNull()
    await click(user, /Open your chat with Neel Verma/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/did you get the recipe from her/)).toBeTruthy()
    expect(within(thread).getByText('This is the recipe we discussed yesterday.')).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('June 2016')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // Watching is navigation; Like on the player is the decision.
    await click(user, 'Watch the reel')
    const player = await surface()
    expect(within(player).getByText(/Original audio · spice_route_kitchen/)).toBeTruthy()
    await inSurface(user, 'spice_route_kitchen')
    expect(await screen.findByText('Spice Route Kitchen')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, '♡ Like')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Search your chat with Neel for “recipe”/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText(/shared 23 reels in this chat/)).toBeTruthy()
    await inSurface(user, 'Close and go back')

    await click(user, /Save the recipe and reply to Neel/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  }, 40_000)

  it('records the downloader site as the untrusted channel and shows it without a form', async () => {
    const user = userEvent.setup()
    startAt('I07', 'branch')
    await openMenu(user)
    await click(user, /reel-downloader site/)
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
    expect(await within(await surface()).findByText('reelsave.training.example')).toBeTruthy()
    expect(within(await surface()).queryAllByRole('textbox')).toHaveLength(0)
  })

  it('offers report and block, and reporting sends only the intent', async () => {
    const user = userEvent.setup()
    startAt('I07', 'verify')
    await openMenu(user)
    await click(user, 'Report the message')
    await waitFor(() => expect(sentIntents()).toEqual(['report']))
  })
})

/* ------------------------------------------------------------------ *
 * I08 - the badge agent
 * ------------------------------------------------------------------ */

describe('I08 - the verification badge agent', () => {
  it('compares the ✔️ in the name with About, and checks Request verification in the app', async () => {
    const user = userEvent.setup()
    startAt('I08', 'open')
    await click(user, /Open the message request/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('September 2026 (9 days ago)')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/Still no badge/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await openMenu(user)
    await click(user, /Leave the request without applying/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Settings › Request verification yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await inSurface(user, /Account type and tools/)
    expect(await screen.findByText(/No agent, partner or page can submit, speed up or guarantee a badge/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, /Report the account; request a badge in Settings/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('submits the application with an ID number and password, sending none of them', async () => {
    const user = userEvent.setup()
    startAt('I08', 'branch')
    const thread = await screen.findByTestId('ig-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open the application' }))
    await inSurface(user, 'Start application')
    await fill(user, ['Asha Rao', '123456789012', '01/01/1995'])
    await inSurface(user, 'Continue')
    await fill(user, ['rao_outdoors_x', 'badgepass77'])
    await inSurface(user, 'Review application')
    await inSurface(user, 'Submit application')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['Asha Rao', '123456789012', '01/01/1995', 'rao_outdoors_x', 'badgepass77']) {
      expect(wire()).not.toContain(value)
    }
  }, 20_000)

  it('pays the priority fee and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I08', 'branch')
    const thread = await screen.findByTestId('ig-thread')
    await user.click(within(thread).getByRole('button', { name: 'Open the application' }))
    await inSurface(user, 'Start application')
    await fill(user, ['Asha Rao', '123456789012', '01/01/1995'])
    await inSurface(user, 'Continue')
    await inSurface(user, /Pay the priority fee/)
    expect(await screen.findByText('bpverify.desk@trainingpay')).toBeTruthy()
    await user.type((await within(await surface()).getAllByRole('textbox')).at(-1), '909090')
    await click(user, 'Pay INR 2,999')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('909090')
  }, 20_000)
})

/* ------------------------------------------------------------------ *
 * I09 - the sponsored reel
 * ------------------------------------------------------------------ */

describe('I09 - the trading advertisement', () => {
  it('steps the reel, reads the ad’s history, hides it and checks the register', async () => {
    const user = userEvent.setup()
    startAt('I09', 'open')
    const row = await screen.findByRole('button', { name: 'Watch the sponsored reel' })
    expect(row.textContent).toContain('Sponsored: Exclusive AI trading window - join the private group before midnight.')
    await user.click(row)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/Original audio · alphaedge\.trading/)).toBeTruthy()
    // Frames are stepped by hand, and stepping records nothing.
    await user.click(within(thread).getByRole('button', { name: 'Next slide' }))
    await user.click(within(thread).getByRole('button', { name: 'Next slide' }))
    expect(within(thread).getByText(/His mouth stays closed/)).toBeTruthy()
    expect(sentIntents()).toEqual(['read'])

    await openMenu(user)
    await click(user, /About this ad/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(await screen.findByText(/credited to @alphaedge\.trading/)).toBeTruthy()
    await inSurface(user, 'Close and go back')

    // The advertiser's other ads are one tap into its profile, later.
    await openMenu(user)
    await click(user, /View alphaedge\.trading’s profile/)
    await inSurface(user, 'Ads from this account')
    expect(await screen.findByText(/each reading the same script/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@crypto.gains.club')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await openMenu(user)
    await click(user, 'Hide ad')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Search the regulator’s Investor Register app/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('Not registered as an adviser or research analyst')).toBeTruthy()
    await user.click(await screen.findByRole('button', { name: 'Leave Investor Register' }))

    await click(user, /Report the ad and hide it/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_link', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('follows the call to action to KYC and submits it, sending none of the documents', async () => {
    const user = userEvent.setup()
    startAt('I09', 'branch')
    await click(user, 'Join the group ›')
    expect(await within(await surface()).findByText('3% daily, guaranteed')).toBeTruthy()
    await inSurface(user, /Get the AlphaEdge AI app/)
    await inSurface(user, /Open a trading account/)
    await fill(user, ['Asha Rao', 'ABCDE1234F', '111122223333', '9000000000'])
    await inSurface(user, 'Continue')
    await inSurface(user, 'Submit KYC')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['ABCDE1234F', '111122223333', '9000000000', 'Asha Rao']) {
      expect(wire()).not.toContain(value)
    }
  }, 20_000)

  it('installs the app from the landing page as its own decision', async () => {
    const user = userEvent.setup()
    startAt('I09', 'branch')
    await click(user, 'Join the group ›')
    await inSurface(user, /Get the AlphaEdge AI app/)
    await inSurface(user, 'Install the app')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
  })

  it('titles the toast with the client’s “Sponsored” and never the placeholder identifier', async () => {
    startAt('I09', 'notify')
    const tray = await screen.findByTestId('notification-tray')
    expect(within(tray).getByText('Sponsored')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/sponsored829/)
  })
})

/* ------------------------------------------------------------------ *
 * I10 - the creator agreement
 * ------------------------------------------------------------------ */

describe('I10 - the brand collaboration shipping fee', () => {
  it('reads the pinned post’s comments, declines, and checks the brand’s own website', async () => {
    const user = userEvent.setup()
    startAt('I10', 'open')
    await click(user, /Open the message request/)
    await waitFor(() => expect(server.stage).toBe('inspect'))
    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/still no tracking number/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    // The agreement in the bio is readable, clauses and all, before anything is decided.
    await inSurface(user, /training\.example\/verify/)
    expect(await screen.findByText(/INR 1,499 per month/)).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Close the agreement')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Type peakgear\.training\.example yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await inSurface(user, /Creators and ambassadors/)
    await inSurface(user, /Check an account that says it is us/)
    expect(await screen.findByText('Not a PeakGear account')).toBeTruthy()
    // Back walks the site's own pages before it leaves the browser.
    await inSurface(user, 'Back to the previous page')
    await inSurface(user, 'Back to the previous page')
    await inSurface(user, 'Close the browser and go back')

    await click(user, /Decline, and report the account and its link/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('signs the agreement with address, card and Instagram login, sending none of them', async () => {
    const user = userEvent.setup()
    startAt('I10', 'branch')
    await openMenu(user)
    await click(user, /Open the link in their bio/)
    await inSurface(user, 'Accept and continue')
    await fill(user, ['Asha Rao', '12 Hill Road, Pune', '4111111111111111', '1229', '321', 'rao.outdoors', 'trailpass55'])
    await inSurface(user, 'Review')
    await inSurface(user, 'Sign and pay INR 199')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['12 Hill Road', '4111111111111111', 'trailpass55', '321']) {
      expect(wire()).not.toContain(value)
    }
  }, 25_000)

  it('pays the shipping by UPI and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I10', 'branch')
    await openMenu(user)
    await click(user, /Open the link in their bio/)
    await inSurface(user, /Pay shipping by UPI instead/)
    expect(await screen.findByText('pgcreator.ship@trainingpay')).toBeTruthy()
    await user.type((await within(await surface()).getAllByRole('textbox')).at(-1), '747474')
    await click(user, 'Pay INR 199')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('747474')
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on I06-I10', () => {
  const IDS = ['I06', 'I07', 'I08', 'I09', 'I10']

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

  it.each(['I06', 'I07', 'I08', 'I10'])('%s names the client’s handle on the toast and in the directory, never the placeholder', async (id) => {
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
    await click(user, /trusted directory/)
    await screen.findByRole('dialog', { name: 'Trusted directory' })
    expect(document.body.textContent).not.toMatch(/unknownsender/)
    expect(screen.getAllByText(`@${handle}`).length).toBeGreaterThan(0)
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

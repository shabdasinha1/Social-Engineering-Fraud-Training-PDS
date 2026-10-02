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
 * Instagram I21 to I25, end to end, through the real controller and the attempt API
 * (IMMERSIVE-004E) - the fifth and final Instagram batch.
 *
 * Same posture as the four Instagram suites before it: the fake server owns the stage, so the only
 * way a test moves a scenario forward is to make the server accept an intent. Each scenario is
 * checked for the interaction it was built around: a published post's tag-review sheet with a local
 * audience choice; an Instagram video chat whose three asks are behind the call's own controls; a
 * broadcast channel with no reply box; a sponsored carousel's download page, dashboard and tax; and a
 * code inside a reel, read from a screenshot.
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
 * I21 - the tag request on the published post
 * ------------------------------------------------------------------ */

describe('I21 - the post-event teammate tag', () => {
  it('reads the thread, checks Arjun, chooses an audience, approves and looks PF-311 up', async () => {
    const user = userEvent.setup()
    startAt('I21', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/Public-release photo PF-311 is up\. May I tag you\?/)).toBeTruthy()
    await click(user, 'Open the chat with Arjun K. Singh')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/PF-311 · Inter-unit football final/)).toBeTruthy()
    expect(within(thread).getByText(/Totally fine if you’d rather not be tagged/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('June 2015')).toBeTruthy()
    expect(screen.getByText('This account has no former usernames.')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Posts you’re both tagged in')
    expect(await screen.findByText('Monsoon trek')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    expect(await screen.findByText(/want me to add anything/)).toBeTruthy()
    await click(user, 'Review tag request')
    const sheet = await surface()
    expect(within(sheet).getByText('None added')).toBeTruthy()
    // The audience is a real, local choice.
    const onlyMe = within(sheet).getByRole('radio', { name: 'Only me' })
    expect(within(sheet).getByRole('radio', { name: 'Followers only' }).getAttribute('aria-checked')).toBe('true')
    await user.click(onlyMe)
    expect(onlyMe.getAttribute('aria-checked')).toBe('true')
    await inSurface(user, 'View the post')
    expect(await screen.findByText(/Full HD album of the whole final/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Your tag settings')
    expect(await screen.findByText('Manually approve tags')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])

    await inSurface(user, 'Approve tag')
    await waitFor(() => expect(server.stage).toBe('verify'))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())
    expect(wire()).not.toContain('Only me')

    await openMenu(user)
    await click(user, /Look up PF-311 in the Release Register/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('Released for public use')).toBeTruthy()
    expect(screen.getByText(/Your release preferences/)).toBeTruthy()
    await inSurface(user, 'Leave Release Register')

    await click(user, 'Keep your tag choice and carry on')
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  }, 40_000)

  it('records declining the tag as the same normal path', async () => {
    const user = userEvent.setup()
    startAt('I21', 'branch')
    await click(user, 'Review tag request')
    await inSurface(user, 'Decline tag')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('offers the stranger’s album link only on the post, and records it as leaving the app', async () => {
    const user = userEvent.setup()
    startAt('I21', 'branch')
    await click(user, 'Review tag request')
    expect(within(await surface()).queryByRole('button', { name: /full HD album/ })).toBeNull()
    await inSurface(user, 'View the post')
    await inSurface(user, /Open the “full HD album”/)
    await waitFor(() => expect(sentIntents()).toEqual(['open_link']))
    expect(await screen.findByText(/unlock HD downloads/)).toBeTruthy()
  })

  it('records the caption detail as a submission and never sends the words', async () => {
    const user = userEvent.setup()
    startAt('I21', 'branch')
    await click(user, /Suggest the next fixture’s date and ground/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('east ground')
    expect(wire()).not.toContain('3 Oct')
  })

  it('offers leaving it unanswered and reporting Arjun, so a false positive is reachable', async () => {
    const user = userEvent.setup()
    startAt('I21', 'branch')
    await openMenu(user)
    await click(user, /Leave the tag request unanswered/)
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
    cleanup()

    startAt('I21', 'verify')
    await openMenu(user)
    await click(user, 'Report arjun.k.singh')
    await waitFor(() => expect(sentIntents()).toEqual(['report']))
  })
})

/* ------------------------------------------------------------------ *
 * I22 - the video chat
 * ------------------------------------------------------------------ */

describe('I22 - the live support video call', () => {
  it('checks the account, joins, hangs up and opens Account Status', async () => {
    const user = userEvent.setup()
    startAt('I22', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText('Requests')).toBeTruthy()
    expect(within(list).getByText(/Accept our video verification now to prevent account removal/)).toBeTruthy()
    await click(user, 'Open the message request')
    await waitFor(() => expect(server.stage).toBe('inspect'))
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/do not change your password/)).toBeTruthy()
    expect(within(thread).getByText(/started a video chat · 11:04 · Missed/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@help.center.case')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, 'Join video chat')
    const call = await surface()
    expect(within(call).getByTestId('call-video')).toBeTruthy()
    // Once connected, the call's own controls lead to the three asks.
    expect(await within(call).findByRole('button', { name: /Turn on camera/ }, { timeout: 3000 })).toBeTruthy()
    expect(within(call).getByRole('button', { name: /Share screen/ })).toBeTruthy()
    expect(within(call).getByRole('button', { name: /Backup codes/ })).toBeTruthy()
    // End call is the scene's, not a second local one.
    expect(within(call).getAllByRole('button', { name: 'End call' })).toHaveLength(1)
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'End call')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Settings › Account Status yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    await inSurface(user, /^Account Status/)
    expect(await screen.findByText(/no issues/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, /^Support requests/)
    expect(await screen.findByText('None open')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, /Report the account for pretending to be Instagram/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('records holding the ID up to the camera as a release, from the phone’s own prompt', async () => {
    const user = userEvent.setup()
    startAt('I22', 'branch')
    await click(user, 'Join video chat')
    await user.click(await within(await surface()).findByRole('button', { name: /Turn on camera/ }, { timeout: 3000 }))
    const prompt = await surface()
    expect(within(prompt).getByRole('dialog', { name: /Turn on your camera/ })).toBeTruthy()
    expect(sentIntents()).toEqual([])
    await inSurface(user, 'Turn on camera and hold up my ID')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(await screen.findByText(/Now turn the card over/)).toBeTruthy()
  }, 20_000)

  it('records reading a backup code aloud as a release, and never sends the code', async () => {
    const user = userEvent.setup()
    startAt('I22', 'branch')
    await click(user, 'Join video chat')
    await user.click(await within(await surface()).findByRole('button', { name: /Backup codes/ }, { timeout: 3000 }))
    expect(await screen.findByText('4821 7730')).toBeTruthy()
    await inSurface(user, 'Read code 1 aloud to the agent')
    await waitFor(() => expect(sentIntents()).toEqual(['share_secret']))
    expect(wire()).not.toContain('4821')
  }, 20_000)

  it('refuses the screen share on the system prompt as the pivot, and asking for a case number is engagement', async () => {
    const user = userEvent.setup()
    startAt('I22', 'branch')
    await click(user, 'Join video chat')
    await user.click(await within(await surface()).findByRole('button', { name: /Share screen/ }, { timeout: 3000 }))
    expect(await screen.findByText(/codes and notifications that arrive/)).toBeTruthy()
    await inSurface(user, 'Don’t share')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
    cleanup()

    startAt('I22', 'branch')
    await click(user, 'Join video chat')
    await inSurface(user, /Stay on and ask for the case number/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  }, 20_000)

  it('treats joining straight from the request list as acting before reading', async () => {
    const user = userEvent.setup()
    startAt('I22', 'open')
    await click(user, 'Join the video chat from the request list')
    await waitFor(() => expect(sentIntents()).toEqual(['call_number']))
  })
})

/* ------------------------------------------------------------------ *
 * I23 - the broadcast channel
 * ------------------------------------------------------------------ */

describe('I23 - the compromised charity influencer', () => {
  it('reads the channel, checks the fundraiser history, holds off and opens the trust’s site', async () => {
    const user = userEvent.setup()
    startAt('I23', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText('Channels')).toBeTruthy()
    await click(user, 'Open Maya’s Care Circle 💛')
    await waitFor(() => expect(server.stage).toBe('inspect'))
    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/Emergency surgery fund - crypto only for the next two hours/)).toBeTruthy()
    expect(within(thread).getByText(/give only through the fundraiser on my post/)).toBeTruthy()
    // A broadcast channel has no message box.
    expect(screen.getByTestId('ig-readonly').textContent).toMatch(/Only carewithmaya can send messages/)
    expect(screen.queryByTestId('ig-composer-field')).toBeNull()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(within(await surface()).getByText(/Comments are turned off on the 3 newest posts/)).toBeTruthy()
    await inSurface(user, 'Fundraisers')
    expect(await screen.findByText(/no fundraiser attached/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Story · 40m')
    expect(await screen.findByText('EMERGENCY · CRYPTO ONLY')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    expect(await screen.findByText(/1 hour 20 minutes left/)).toBeTruthy()
    await openMenu(user)
    await click(user, /Send nothing and share nothing/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Asha Care Trust’s website/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('ashacare.training.example')).toBeTruthy()
    expect(await screen.findByText(/were not sent by Maya/)).toBeTruthy()
    expect(screen.getByText('We do not accept it')).toBeTruthy()
    await inSurface(user, 'Close the browser and go back')

    await click(user, /Report the post, and let Asha Care Trust know/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('sends only after a PIN, and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I23', 'branch')
    await click(user, 'Open in wallet')
    const sheet = await surface()
    expect(within(sheet).getByText('9e41k77ab02fdq')).toBeTruthy()
    expect(within(sheet).queryByRole('button', { name: /Send ₹5,000/ })).toBeNull()
    await user.type(within(sheet).getAllByRole('textbox').at(-1), '135790')
    await click(user, 'Send ₹5,000')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('135790')
    expect(await screen.findByText(/cannot be reversed/)).toBeTruthy()
  }, 20_000)

  it('records sharing to story from the message itself', async () => {
    const user = userEvent.setup()
    startAt('I23', 'branch')
    await click(user, 'Share to your story')
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    expect(await screen.findByText(/under your name/)).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * I24 - the sponsored carousel
 * ------------------------------------------------------------------ */

describe('I24 - the institutional trading app', () => {
  it('steps the carousel, finds the comment cohort, says Not now and searches the phone’s store', async () => {
    const user = userEvent.setup()
    startAt('I24', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/Sponsored: Institutional account access for service professionals/)).toBeTruthy()
    await click(user, 'Open the sponsored post')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const media = await screen.findByTestId('ig-media')
    await user.click(within(media).getByRole('button', { name: 'Next slide' }))
    await user.click(within(media).getByRole('button', { name: 'Next slide' }))
    expect(within(media).getByText(/Regd\. INV-00417/)).toBeTruthy()
    expect(screen.getByText(/confirmed” before it has even been decided/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'People who commented on this ad')
    expect(await screen.findByText(/186 of them say/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, 'Install app ›')
    const store = await surface()
    expect(within(store).getByText('i24.training.example (a website)')).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Not now')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Search your phone’s own app store/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('No results')).toBeTruthy()
    await inSurface(user, 'Leave App Store')

    await click(user, /Report the ad and the advertiser/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('walks the pre-credited dashboard to KYC and submits it without sending a value', async () => {
    const user = userEvent.setup()
    startAt('I24', 'branch')
    await click(user, 'Install app ›')
    await inSurface(user, /Use the web dashboard instead/)
    expect(await screen.findByText('₹68,240')).toBeTruthy()
    await inSurface(user, /Withdraw ₹18,240/)
    expect(await screen.findByText('₹3,283 due')).toBeTruthy()
    await inSurface(user, /Step 1 · Complete KYC/)
    await fill(user, ['Asha Rao', '123456789012', '555566667777'])
    await inSurface(user, 'Continue')
    await inSurface(user, 'Submit KYC')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['Asha Rao', '123456789012', '555566667777']) expect(wire()).not.toContain(value)
    expect(await screen.findByText('Received ✅')).toBeTruthy()
  }, 30_000)

  it('installs from the download page, and pays the tax only after a PIN', async () => {
    const user = userEvent.setup()
    startAt('I24', 'branch')
    await click(user, 'Install app ›')
    await inSurface(user, 'Install')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_install']))
    expect(await screen.findByText(/send and view SMS messages/)).toBeTruthy()
    cleanup()

    startAt('I24', 'branch')
    await click(user, 'Install app ›')
    await inSurface(user, /Use the web dashboard instead/)
    await inSurface(user, /Withdraw ₹18,240/)
    await inSurface(user, /Step 2 · Pay the profit tax/)
    const sheet = await surface()
    await user.type(within(sheet).getAllByRole('textbox').at(-1), '975310')
    await click(user, 'Pay ₹3,283')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('975310')
  }, 30_000)

  it('records an “Interested” comment as engagement and Hide ad as the pivot', async () => {
    const user = userEvent.setup()
    startAt('I24', 'branch')
    expect(screen.queryByText('Comments on your post are public.')).toBeNull()
    await click(user, /Comment “Interested”/)
    expect(screen.getByText('Comments on ads are public.')).toBeTruthy()
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    cleanup()

    startAt('I24', 'branch')
    await openMenu(user)
    await click(user, 'Hide ad')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })
})

/* ------------------------------------------------------------------ *
 * I25 - the reel with a code in it
 * ------------------------------------------------------------------ */

describe('I25 - the canteen coupon reel', () => {
  it('reads the code without opening it, follows the audio credit, closes the scanner and checks the notices', async () => {
    const user = userEvent.setup()
    startAt('I25', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/Scan for the first 200 service-family coupon packs/)).toBeTruthy()
    await click(user, 'Open falcon_family_deals’s reel')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    // The audio credit is local navigation.
    await user.click(within(await screen.findByTestId('ig-audio')).getByRole('button', { name: 'Audio page' }))
    expect(await screen.findByText('July 2025 · original')).toBeTruthy()
    expect(sentIntents()).toEqual(['read'])
    await inSurface(user, 'Close and go back')

    await click(user, /Read the code from a screenshot, without opening it/)
    await waitFor(() => expect(server.stage).toBe('branch'))
    const scanner = await surface()
    expect(within(scanner).getByText('https://i25.training.example/qr')).toBeTruthy()
    // At inspect the scanner offers nothing to press.
    await inSurface(user, 'Close the scanner')

    expect(await screen.findByText(/20 packs left/)).toBeTruthy()
    await openMenu(user)
    await click(user, /View falcon_family_deals’s profile/)
    await inSurface(user, /Search “falcon welfare”/)
    await inSurface(user, /falconwelfare\.official/)
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/Offers are only ever announced here/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, 'Scan the code from a screenshot')
    await inSurface(user, 'Close without opening')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Welfare Notices/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('No coupon scheme')).toBeTruthy()
    await inSurface(user, 'Leave Welfare Notices')

    await click(user, /Report the reel and the account/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('fills the eligibility form from the bio link and never sends a detail', async () => {
    const user = userEvent.setup()
    startAt('I25', 'branch')
    await openMenu(user)
    await click(user, /View falcon_family_deals’s profile/)
    await inSurface(user, /i25\.training\.example\/verify/)
    expect(await screen.findByText('Claim your coupon pack')).toBeTruthy()
    await inSurface(user, 'Confirm eligibility')
    expect(await within(await surface()).findByText('https://i25.training.example/verify')).toBeTruthy()
    await fill(user, ['FX4471', 'spouse', 'Asha, Kiran', '9988776655'])
    await inSurface(user, 'Continue')
    expect(posts()).toHaveLength(0)
    await inSurface(user, 'Confirm eligibility')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['FX4471', 'spouse', 'Kiran', '9988776655']) expect(wire()).not.toContain(value)
    expect(await screen.findByText('Confirmed ✅')).toBeTruthy()
  }, 30_000)

  it('records opening the code and sharing the reel as risky, and the fee as a release', async () => {
    const user = userEvent.setup()
    startAt('I25', 'branch')
    await click(user, 'Scan the code from a screenshot')
    await inSurface(user, 'Open link')
    await waitFor(() => expect(sentIntents()).toEqual(['scan_qr']))
    // The page it opened is shown, with nothing left to fill in.
    expect(await screen.findByText('Claim your coupon pack')).toBeTruthy()
    cleanup()

    startAt('I25', 'branch')
    await openMenu(user)
    await click(user, 'Send the reel to your family group chat')
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    cleanup()

    // Once the branch decision is spent on opening the code, the form states what it asks for
    // but offers nothing to type into.
    startAt('I25', 'branch')
    await click(user, 'Scan the code from a screenshot')
    await inSurface(user, 'Open link')
    await waitFor(() => expect(server.stage).toBe('verify'))
    await inSurface(user, 'Confirm eligibility')
    expect(await within(await surface()).findByText('Service number')).toBeTruthy()
    expect(within(await surface()).queryAllByRole('textbox')).toHaveLength(0)
  }, 30_000)

  it('pays the activation only after a PIN, and never sends it', async () => {
    const user = userEvent.setup()
    startAt('I25', 'branch')
    await openMenu(user)
    await click(user, /View falcon_family_deals’s profile/)
    await inSurface(user, /i25\.training\.example\/verify/)
    await inSurface(user, 'Pay the activation first')
    const sheet = await surface()
    expect(within(sheet).getByText('deepak.s4471@trainingpay')).toBeTruthy()
    await user.type(within(sheet).getAllByRole('textbox').at(-1), '112233')
    await click(user, 'Pay ₹49')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('112233')
  }, 20_000)
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on I21-I25', () => {
  const IDS = ['I21', 'I22', 'I23', 'I24', 'I25']

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

  it.each(IDS)('%s rebuilds from the server after a remount at verify, with no pushed screen and nothing replayed', async (id) => {
    const user = userEvent.setup()
    const { unmount } = startAt(id, 'verify')
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

    expect(server.stage).toBe('verify')
    expect(posts().length).toBe(before)
    expect(screen.queryByTestId('scene-surface')).toBeNull()
  })

  it.each(IDS)('%s names the client’s account on the toast, never the placeholder', async (id) => {
    startAt(id, 'notify')
    const tray = await screen.findByTestId('notification-tray')
    const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
    const match = /^@([^:]+):/.exec(body)
    const expected = match ? match[1] : BANK[id].synthetic.sender.display_name
    expect(within(tray).getByText(expected)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/unknownsender|sponsored126/)
  })

  it.each(IDS)('%s puts no verdict word on the page at any stage', async (id) => {
    for (const stage of ['inspect', 'branch', 'verify', 'resolve']) {
      startAt(id, stage)
      await screen.findByTestId('phone-app')
      expect(document.body.textContent.toLowerCase())
        .not.toMatch(/\b(malicious|legitimate|phishing|fraudulent|scam|fake|deepfake|impersonat\w*|genuine|clone|compromised|hacked|takeover|coercion|spoof\w*|quishing)\b/)
      cleanup()
    }
  })

  it.each(IDS)('%s contacts no external origin and loads nothing', async (id) => {
    const { container } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')
    contained(container)
  })
})

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
 * Instagram I16 to I20, end to end, through the real controller and the attempt API
 * (IMMERSIVE-004D) - the fourth Instagram batch.
 *
 * Same posture as the three Instagram suites before it: the fake server owns the stage, so the only
 * way a test moves a scenario forward is to make the server accept an intent. Each scenario is
 * checked for the interaction it was built around: a consent card in Tags and mentions; a photo
 * behind the sensitive-content screen and Instagram's Restrict; a copy whose numbers all pass and
 * whose history does not; a share tray and story composer; and a month of rapport that ends in a
 * questionnaire.
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
 * I16 - the consent card
 * ------------------------------------------------------------------ */

describe('I16 - the approved photo release request', () => {
  it('reads the thread, checks the page, confirms on the card and looks PF-204 up in the register', async () => {
    const user = userEvent.setup()
    startAt('I16', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/Approved image PF-204 is ready/)).toBeTruthy()
    await click(user, /Open the message from Unit Falcon Public Information/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/PF-198 is up/)).toBeTruthy()
    expect(within(thread).getByText(/decline on the card and we will crop you out/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(within(await surface()).getByTestId('ig-profile-actions').textContent).toContain('+91 00000 31254')
    await inSurface(user, 'About this account')
    expect(await screen.findByText('March 2017')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/we never send links to sign/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Recently published')
    expect(await screen.findByText(/One person declined/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    // The decision is in Settings › Tags and mentions, reached from the tag notice.
    await click(user, 'Review the tag request')
    await inSurface(user, /Preview the tagged post/)
    expect(await screen.findByText('Draft · not published')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, /Tag request · PF-204/)
    const card = await surface()
    expect(within(card).getByText('Consent request · PF-204')).toBeTruthy()
    expect(within(card).getByRole('button', { name: 'Decline consent for PF-204' })).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Confirm consent for PF-204')
    await waitFor(() => expect(server.stage).toBe('verify'))
    await waitFor(() => expect(screen.queryByTestId('scene-surface')).toBeNull())

    await openMenu(user)
    await click(user, /Look up PF-204 in the Release Register/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('Cleared 14 September 2026')).toBeTruthy()
    expect(screen.getByText(/A\. Rao outstanding/)).toBeTruthy()
    const before = posts().length
    await inSurface(user, 'Leave Release Register')
    expect(posts().length).toBe(before)

    await click(user, 'Keep following the page and carry on')
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue',
    ])
  }, 40_000)

  it('records declining on the card as the same normal path', async () => {
    const user = userEvent.setup()
    startAt('I16', 'branch')
    await click(user, 'Review the tag request')
    await inSurface(user, /Tag request · PF-204/)
    await inSurface(user, 'Decline consent for PF-204')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('records the caption detail as a submission and never sends the words', async () => {
    const user = userEvent.setup()
    startAt('I16', 'branch')
    await click(user, /Send the date, place and sub-unit/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('pavilion')
    expect(wire()).not.toContain('2 Coy')
  })

  it('offers leaving it pending and reporting the page, so a false positive is reachable', async () => {
    const user = userEvent.setup()
    startAt('I16', 'branch')
    await openMenu(user)
    await click(user, /Leave the tag request pending/)
    await waitFor(() => expect(sentIntents()).toEqual(['reject_ignore']))
    cleanup()

    startAt('I16', 'verify')
    await openMenu(user)
    await click(user, 'Report unitfalcon_public')
    await waitFor(() => expect(sentIntents()).toEqual(['report']))
  })
})

/* ------------------------------------------------------------------ *
 * I17 - the screened photo
 * ------------------------------------------------------------------ */

describe('I17 - the edited-photo threat', () => {
  it('keeps the photo screened until asked, restricts the account and opens support', async () => {
    const user = userEvent.setup()
    startAt('I17', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText('Requests')).toBeTruthy()
    await click(user, 'Open the message request')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText('Sensitive content')).toBeTruthy()
    expect(within(thread).queryByText(/pasted onto another picture/)).toBeNull()
    await user.click(within(thread).getByRole('button', { name: 'See photo' }))
    expect(within(thread).getByText(/pasted onto another picture/)).toBeTruthy()
    // Revealing it is local: nothing reached the server.
    expect(sentIntents()).toEqual(['read'])
    expect(within(thread).getByText(/Pay tonight or this edited image goes to everyone you follow/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@case_file_221')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    expect(await screen.findByText(/The clock is running/)).toBeTruthy()
    await openMenu(user)
    await click(user, 'Chat details')
    expect(within(await surface()).getByText('Restrict')).toBeTruthy()
    await inSurface(user, /Restrict private_case_404/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open Support & Reporting/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('You are not the one in trouble')).toBeTruthy()
    await inSurface(user, 'Leave Support & Reporting')

    await click(user, /Report the account, keep the chat as a record/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('pays only after a PIN, and never sends the PIN', async () => {
    const user = userEvent.setup()
    startAt('I17', 'branch')
    await click(user, 'Open the wallet address')
    const sheet = await surface()
    expect(within(sheet).getByText('9f2k4b81qx7t')).toBeTruthy()
    expect(within(sheet).queryByRole('button', { name: /Send ₹40,000/ })).toBeNull()
    await user.type(within(sheet).getAllByRole('textbox').at(-1), '246810')
    await click(user, 'Send ₹40,000')
    await waitFor(() => expect(sentIntents()).toEqual(['attempt_payment']))
    expect(wire()).not.toContain('246810')
  }, 20_000)

  it('records sending another photo as the same release, and pleading as engagement', async () => {
    const user = userEvent.setup()
    startAt('I17', 'branch')
    await click(user, /Send a real photo/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    cleanup()

    startAt('I17', 'branch')
    await click(user, /Plead for more time/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
    expect(wire()).not.toContain('10k')
  })

  it('rings the welfare desk, which does not blame the learner', async () => {
    const user = userEvent.setup()
    startAt('I17', 'verify')
    await openMenu(user)
    await click(user, /Ring the welfare desk/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 97704')).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/your fault(?! )|you should have/i)
  })
})

/* ------------------------------------------------------------------ *
 * I18 - the high-fidelity copy
 * ------------------------------------------------------------------ */

describe('I18 - the teammate’s new private account', () => {
  it('finds the numbers right and the history wrong, sends nothing and rings Arjun', async () => {
    const user = userEvent.setup()
    startAt('I18', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/New private account\. Send tomorrow’s assembly point/)).toBeTruthy()
    // The older thread with the other account is in the same inbox.
    expect(within(list).getByText(/march was brutal/)).toBeTruthy()
    await click(user, /Open your chat with Arjun K\. Singh/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    expect(within(await surface()).getByText('4,588')).toBeTruthy()
    await inSurface(user, 'About this account')
    expect(await screen.findByText('8 September 2026')).toBeTruthy()
    expect(screen.getByText('@a.ksingh_2026')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/wasn’t this the March run/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, /Open @arjun\.ks/)
    expect(await screen.findByText(/Joined June 2014/)).toBeTruthy()
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText('14 March')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    await click(user, 'Reply with a location')
    expect(within(await surface()).getByText('Tomorrow · assembly point')).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Close without sending a location')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Ring Arjun on the number saved/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 44902')).toBeTruthy()
    await inSurface(user, 'Back to the conversation')

    await click(user, /Report arjun\.k_singh as pretending to be Arjun/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  }, 40_000)

  it('sends the pin as a location release', async () => {
    const user = userEvent.setup()
    startAt('I18', 'branch')
    await click(user, 'Reply with a location')
    await inSurface(user, 'Send the assembly-point pin')
    await waitFor(() => expect(sentIntents()).toEqual(['share_location']))
  })

  it('records typing the time and place without sending the words', async () => {
    const user = userEvent.setup()
    startAt('I18', 'branch')
    await click(user, /Type the time and the place/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('0500')
    expect(wire()).not.toContain('pavilion')
  })

  it('shows the teammate already acknowledged tomorrow in Unit Orders', async () => {
    const user = userEvent.setup()
    startAt('I18', 'verify')
    await openMenu(user)
    await click(user, /Open Unit Orders yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('Acknowledged 15 September, 06:40')).toBeTruthy()
  })
})

/* ------------------------------------------------------------------ *
 * I19 - the share tray
 * ------------------------------------------------------------------ */

describe('I19 - the urgent incident repost', () => {
  it('reads the post and the page’s history, closes the share tray and checks the bulletin', async () => {
    const user = userEvent.setup()
    startAt('I19', 'open')

    const list = await screen.findByTestId('ig-list')
    expect(within(list).getByText(/URGENT incident at Unit Falcon - repost before it is deleted/)).toBeTruthy()
    await click(user, 'Open the post you were mentioned in')
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    expect(within(thread).getByText(/Is there anything official about this/)).toBeTruthy()
    expect(within(thread).getByText(/in April with a different caption/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('@viral_cricket_now')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/major fire at a fuel depot/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, /Open @unitfalcon_public/)
    expect(await screen.findByText(/Last post 3 hours ago/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    expect(await screen.findByText(/is this true\?\? my mother/)).toBeTruthy()

    await openMenu(user)
    await click(user, 'Share…')
    await inSurface(user, /Add post to your story/)
    const composer = await surface()
    expect(within(composer).getByText('URGENT · Unit Falcon')).toBeTruthy()
    expect(within(composer).getByRole('button', { name: /Add a location sticker/ })).toBeTruthy()
    expect(within(composer).getByRole('button', { name: /Mention the people/ })).toBeTruthy()
    expect(sentIntents()).toEqual(['read', 'inspect_profile'])
    await inSurface(user, 'Close without sharing')
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Open the Unit Bulletin yourself/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(await screen.findByText('No statement issued')).toBeTruthy()
    await inSurface(user, 'Leave Unit Bulletin')

    await click(user, /Report it as false information/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report',
    ])
  }, 40_000)

  it('prices the location sticker and the mentions as releases, and posting as-is as engagement', async () => {
    const user = userEvent.setup()
    for (const [label, intent] of [
      [/Add a location sticker/, 'share_location'],
      [/Mention the people/, 'submit_data'],
      ['Post to your story as it is', 'reply'],
    ]) {
      startAt('I19', 'branch')
      await openMenu(user)
      await click(user, 'Share…')
      await inSurface(user, /Add post to your story/)
      await inSurface(user, label)
      await waitFor(() => expect(sentIntents()).toEqual([intent]))
      cleanup()
    }
  }, 30_000)

  it('comments from the post composer as engagement', async () => {
    const user = userEvent.setup()
    startAt('I19', 'branch')
    expect(await screen.findByText('Comments on your post are public.')).toBeTruthy()
    await click(user, /Comment “praying for everyone there/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  })
})

/* ------------------------------------------------------------------ *
 * I20 - the questionnaire
 * ------------------------------------------------------------------ */

describe('I20 - the researcher’s questions', () => {
  it('reads a month of thread, declines, and rings the security contact', async () => {
    const user = userEvent.setup()
    startAt('I20', 'open')
    await click(user, /Open your chat with Field Systems Study/)
    await waitFor(() => expect(server.stage).toBe('inspect'))

    const thread = await screen.findByTestId('ig-thread')
    for (const day of ['17 AUGUST', '29 AUGUST', '9 SEPTEMBER', 'TODAY']) {
      expect(within(thread).getByText(day)).toBeTruthy()
    }
    expect(within(thread).getByText(/Which system fails most often in field conditions/)).toBeTruthy()

    await click(user, /open profile/i)
    await waitFor(() => expect(server.stage).toBe('branch'))
    await inSurface(user, 'About this account')
    expect(await screen.findByText('Managed from 3 countries')).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'View pinned post')
    expect(await screen.findByText(/never received any note/)).toBeTruthy()
    await inSurface(user, 'Back to the previous screen')
    await inSurface(user, 'Close and go back')

    expect(await screen.findByText(/Even one line here would help/)).toBeTruthy()
    await openMenu(user)
    await click(user, /Don’t discuss equipment/)
    await waitFor(() => expect(server.stage).toBe('verify'))

    await openMenu(user)
    await click(user, /Ring the public-information and security contact/)
    await waitFor(() => expect(server.stage).toBe('resolve'))
    expect(within(await surface()).getByText('+91 00000 26922')).toBeTruthy()
    await inSurface(user, 'Back to the conversation')

    await click(user, /Decline, report the approach to the cell/)
    expect(sentIntents()).toEqual([
      'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report',
    ])
  }, 40_000)

  it('walks the questionnaire and submits it without sending a single answer', async () => {
    const user = userEvent.setup()
    startAt('I20', 'branch')
    await click(user, 'Open the questionnaire')
    expect(await within(await surface()).findByText('i20.training.example')).toBeTruthy()
    await inSurface(user, 'Start')
    await fill(user, ['12', 'driver', 'bravo'])
    await inSurface(user, 'Next')
    await fill(user, ['mounts', '7', '4'])
    await inSurface(user, 'Next')
    expect(within(await surface()).getByText(/the system you named/)).toBeTruthy()
    await inSurface(user, 'Send my answers')
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    for (const value of ['driver', 'bravo', 'mounts']) expect(wire()).not.toContain(value)
    expect(await screen.findByText(/may contact you with follow-up questions/)).toBeTruthy()
  }, 30_000)

  it('closes the questionnaire from its first page as the pivot', async () => {
    const user = userEvent.setup()
    startAt('I20', 'branch')
    await click(user, 'Open the questionnaire')
    await inSurface(user, 'Close the questionnaire')
    await waitFor(() => expect(sentIntents()).toEqual(['safe_pivot']))
  })

  it('treats a correction and a general answer differently', async () => {
    const user = userEvent.setup()
    startAt('I20', 'branch')
    await click(user, /Correct the figure in their note/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['submit_data']))
    expect(wire()).not.toContain('one in ten')
    cleanup()

    startAt('I20', 'branch')
    await click(user, /Say you can only talk in general terms/)
    await click(user, /^Send "/)
    await waitFor(() => expect(sentIntents()).toEqual(['reply']))
  })

  it('reaches the same questionnaire from the bio link, locally', async () => {
    const user = userEvent.setup()
    startAt('I20', 'branch')
    await openMenu(user)
    await click(user, /View defence_research_lab’s profile/)
    await inSurface(user, /fieldsystems\.training\.example/)
    expect(await within(await surface()).findByText('i20.training.example')).toBeTruthy()
    expect(posts()).toHaveLength(0)
  })
})

/* ------------------------------------------------------------------ *
 * What the device never does, across the batch
 * ------------------------------------------------------------------ */

describe('what the device never does on I16-I20', () => {
  const IDS = ['I16', 'I17', 'I18', 'I19', 'I20']

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

  it.each(IDS)('%s names the client’s handle on the toast, never the placeholder', async (id) => {
    startAt(id, 'notify')
    const tray = await screen.findByTestId('notification-tray')
    const handle = /^@([^:]+):/.exec(BANK[id].synthetic.assets
      .find((a) => a.kind === 'notification').content.body)[1]
    expect(within(tray).getByText(handle)).toBeTruthy()
    expect(document.body.textContent).not.toMatch(/unknownsender/)
  })

  it.each(IDS)('%s puts no verdict word on the page at any stage', async (id) => {
    for (const stage of ['inspect', 'branch', 'verify', 'resolve']) {
      startAt(id, stage)
      await screen.findByTestId('phone-app')
      expect(document.body.textContent.toLowerCase())
        .not.toMatch(/\b(malicious|legitimate|phishing|fraudulent|scam|fake|deepfake|impersonat\w*|genuine|clone|disinformation|misinformation|extortion|blackmail|elicitation)\b/)
      cleanup()
    }
  })

  it.each(IDS)('%s contacts no external origin and loads nothing', async (id) => {
    const { container } = startAt(id, 'branch')
    await screen.findByTestId('phone-app')
    contained(container)
  })
})

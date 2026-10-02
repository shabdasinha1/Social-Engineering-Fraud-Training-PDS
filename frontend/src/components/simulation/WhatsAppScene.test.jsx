import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Device } from '@/test/sceneHarness'

/**
 * The WhatsApp scene as the learner meets it (IMMERSIVE-003A, extended by R2).
 *
 * Rendered through the real `PhoneShell` with real bank content, so these are tests of
 * the device the client will be shown rather than of a mock of it. The harness mirrors
 * exactly what `SimulationPage` does with an accepted intent - record it, then push,
 * replace or pop what the affordance names - which is what lets a test walk a
 * cross-surface journey without a server.
 *
 * Forms and their data handling are in `SceneForms.test.jsx`; offline containment across
 * every screen is in `SceneContainment.test.jsx`.
 */

const openMenu = async (user) =>
  user.click(screen.getByRole('button', { name: 'More options' }))

afterEach(cleanup)

describe('the chat list is where a scenario starts', () => {
  it('shows the unread conversation before it is opened, and opens it by tapping it', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W01" stage="open" onAct={acted} />)

    const list = screen.getByTestId('wa-chat-list')
    expect(within(list).getByText('Unknown')).toBeTruthy()
    expect(within(list).getByText(/6-digit code/)).toBeTruthy()
    expect(within(list).getByText(/unread messages/)).toBeTruthy()
    expect(screen.queryByTestId('wa-thread')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Open the chat with Unknown/ }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'read' }), expect.anything())
  })

  it('puts the delivered conversation among ordinary ones rather than alone', () => {
    render(<Device scenarioId="W01" stage="open" />)
    const list = screen.getByTestId('wa-chat-list')

    // Background traffic exists, so which row matters is not given away by the list.
    expect(within(list).getByText(/Parade state is with the Adjt/)).toBeTruthy()
    expect(within(list).getByText('Family')).toBeTruthy()

    // ...and it is content, not a control that would lead nowhere.
    expect(within(list).queryByRole('button', { name: /Open Family/ })).toBeNull()
    // Only the delivered row is operable, plus the preview-reply control attached to it.
    const controls = within(list).getAllByRole('button')
    expect(controls.map((node) => node.getAttribute('aria-label') ?? node.textContent)).toEqual([
      expect.stringMatching(/^Open the chat with /),
      'Reply from the preview without opening the chat',
    ])
    // SECURITY-001: the markup names neither the control nor what it submits.
    for (const node of controls) {
      expect(node.getAttribute('data-control')).toBe('act')
      expect(node.hasAttribute('data-intent')).toBe(false)
      expect(node.hasAttribute('data-affordance')).toBe(false)
    }
  })

  it('offers the preview reply the specification warns about, as its own control', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W01" stage="open" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: /Reply from the preview/ }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'reply' }), expect.anything())
  })
})

describe('the conversation', () => {
  it('carries prior history, not a single bubble', () => {
    render(<Device scenarioId="W01" stage="inspect" />)
    const thread = screen.getByTestId('wa-thread')

    expect(within(thread).getByText('YESTERDAY')).toBeTruthy()
    expect(within(thread).getByText(/Sorry - wrong chat/)).toBeTruthy()
    expect(within(thread).getByText('TODAY')).toBeTruthy()
    expect(within(thread).getByText(/Sorry for disturbing you/)).toBeTruthy()
    expect(within(thread).getByText(/typed one digit wrong/)).toBeTruthy()
    expect(within(thread).getByText(/gone to your number by mistake/)).toBeTruthy()
    expect(within(thread).getByText(/6-digit code/)).toBeTruthy()
  })

  it('advances when the engine says the stage did', () => {
    const { unmount } = render(<Device scenarioId="W01" stage="inspect" />)
    expect(screen.queryByText('348-201')).toBeNull()
    // A transient beat: somebody is typing while the learner is looking them up.
    expect(screen.getByText('Typing...')).toBeTruthy()
    unmount()

    render(<Device scenarioId="W01" stage="branch" />)
    expect(screen.getByText('348-201')).toBeTruthy()
    expect(screen.getByText(/is your verification code/)).toBeTruthy()
    // ...and the typing strip is gone, because the message it belonged to arrived.
    expect(screen.queryByText('Typing...')).toBeNull()
  })

  it('shows what a reply would have produced, only while that is the current consequence', () => {
    const { unmount } = render(<Device scenarioId="W04" stage="verify" />)
    expect(screen.queryByText(/Is this really you/)).toBeNull()
    unmount()

    render(<Device scenarioId="W04" stage="verify" consequenceKind="simulated_reply_sent" />)
    expect(screen.getByText(/they are waiting at the counter/)).toBeTruthy()
  })

  it('groups consecutive messages from one speaker into one run of bubbles', () => {
    render(<Device scenarioId="W03" stage="branch" />)
    const thread = screen.getByTestId('wa-thread')

    // Four speakers, and the author strip appears once per run, not once per line.
    expect(within(thread).getAllByText('Recreation Coord').length).toBeGreaterThan(0)
    expect(within(thread).getByText('PT Instr')).toBeTruthy()
    // Once as the author of a message, once as the author of the line being quoted back.
    expect(within(thread).getAllByText('Coy Clerk')).toHaveLength(2)
    // A quoted reply, which is what a real group thread does when answering a question.
    expect(within(thread).getByText(/One bus at 0515/)).toBeTruthy()
  })
})

describe('the composer replies rather than answering a question', () => {
  it('puts the chosen reply in the message field and sends it on the second press', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W01" stage="branch" onAct={acted} />)

    expect(screen.getByText('Suggested replies')).toBeTruthy()
    // The message field is a display, never an input: nothing else can be typed into a chat.
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.getByTestId('wa-composer-field').textContent).toMatch(/Choose a reply/)

    await user.click(screen.getByRole('button', { name: /Send the code/ }))
    // Choosing is not sending. Nothing has reached the engine yet.
    expect(acted).not.toHaveBeenCalled()
    expect(screen.getByTestId('wa-composer-field').textContent).toBe('348-201')

    await user.click(screen.getByRole('button', { name: /^Send "348-201"$/ }))
    expect(acted).toHaveBeenCalledTimes(1)
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'share_secret' }), expect.anything())
  })

  it('lets a chosen reply be taken back before it is sent', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W01" stage="branch" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: /Ask who this is/ }))
    expect(screen.getByTestId('wa-composer-field').textContent).toBe('Who is this?')

    await user.click(screen.getByRole('button', { name: /Ask who this is/ }))
    expect(screen.getByTestId('wa-composer-field').textContent).toMatch(/Choose a reply/)
    expect(acted).not.toHaveBeenCalled()
  })
})

describe('contact and group investigation', () => {
  it('opens contact info from the chat header and comes back to the conversation', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W04" stage="inspect" />)

    await user.click(screen.getByRole('button', { name: /open contact info/ }))

    const sheet = screen.getByTestId('scene-surface')
    expect(within(sheet).getByText('Today')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Back from Contact info/ }))
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })

  it('hides the absence behind a tab, so it has to be looked for', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W04" stage="inspect" />)

    await user.click(screen.getByRole('button', { name: /open contact info/ }))
    const sheet = screen.getByTestId('scene-surface')
    expect(within(sheet).queryByText(/not in any group with this number/)).toBeNull()

    await user.click(within(sheet).getByRole('tab', { name: /Groups in common/ }))
    expect(within(sheet).getByText(/not in any group with this number/)).toBeTruthy()
  })

  it('lets the learner walk from the new number to the friend they already have', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W04" stage="inspect" />)

    await user.click(screen.getByRole('button', { name: /open contact info/ }))
    await user.click(screen.getByRole('button', { name: /Open Riya \(saved\)/ }))

    const saved = screen.getByTestId('scene-surface')
    expect(within(saved).getAllByText('+91 00000 44712').length).toBeGreaterThan(0)
    expect(within(saved).getByText('Yesterday at 21:14')).toBeTruthy()
    // The writing-style evidence the client's stage 3 asks the learner to compare.
    expect(within(saved).getByText(/that stove is so heavy/)).toBeTruthy()

    await user.click(within(saved).getByRole('tab', { name: /Groups in common/ }))
    expect(within(saved).getByText('Family')).toBeTruthy()
    expect(within(saved).getByText('Class of 2018')).toBeTruthy()
  })

  it('shows a group as a group: who made it, who is in it, what it is for', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W03" stage="inspect" />)

    await user.click(screen.getByRole('button', { name: /open group info/ }))

    const sheet = screen.getByTestId('scene-surface')
    expect(within(sheet).getByText(/No official business in this group/)).toBeTruthy()

    await user.click(within(sheet).getByRole('tab', { name: /Participants/ }))
    expect(within(sheet).getAllByText('Group admin')).toHaveLength(2)
    expect(within(sheet).getByText('PT Instr')).toBeTruthy()
    expect(within(sheet).getByText('Havildar Menon')).toBeTruthy()
  })

  it('answers the same investigation differently on the legitimate scenario', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W03" stage="inspect" />)

    await user.click(screen.getByRole('button', { name: /open group info/ }))
    const sheet = screen.getByTestId('scene-surface')
    await user.click(within(sheet).getByRole('tab', { name: /Participants/ }))
    await user.click(within(sheet).getByRole('button', { name: /Recreation Coord/ }))

    const card = screen.getByTestId('scene-surface')
    expect(within(card).getByText('Saved in your contacts.')).toBeTruthy()
    await user.click(within(card).getByRole('tab', { name: /Groups in common/ }))
    expect(within(card).getByText('Unit Falcon Notices')).toBeTruthy()
  })
})

describe('the offline browser', () => {
  it('takes the learner from the chat to the page and back again', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W02" stage="branch" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'open_link' }), expect.anything())

    const page = screen.getByTestId('scene-surface')
    expect(within(page).getByTestId('browser-address').textContent)
      .toContain('https://w02.training.example/verify')
    expect(within(page).getByText('Your parcel is waiting')).toBeTruthy()
    expect(within(page).getByText('QP-4417-2290')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Close the browser and go back/ }))
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })

  it('navigates between pages of the same site and walks back through them', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)

    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))
    await user.click(screen.getByRole('button', { name: /Terms and refunds/ }))
    expect(screen.getByText(/independent delivery agent/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Back to the previous page/ }))
    expect(screen.getByText('Your parcel is waiting')).toBeTruthy()

    // One more Back leaves the browser entirely, which is where the page graph ends.
    await user.click(screen.getByRole('button', { name: /Close the browser and go back/ }))
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })

  it('opens the courier the learner already uses on the verification route', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="verify" />)

    await openMenu(user)
    await user.click(screen.getByRole('button', { name: /Open the courier site I already use/ }))

    const page = screen.getByTestId('scene-surface')
    expect(within(page).getByTestId('browser-address').textContent)
      .toContain('https://quickparcel.training.example/track')
    expect(within(page).getByText('No consignment found')).toBeTruthy()

    await user.click(within(page).getByRole('button', { name: /Delivery fees and charges/ }))
    expect(screen.getByText(/Redelivery is free/)).toBeTruthy()
  })

  it('checks the wallet in an application that is plainly not the web page', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W05" stage="verify" />)

    await openMenu(user)
    await user.click(screen.getByRole('button', { name: /Open the NationalPay app on this phone/ }))

    const app = screen.getByTestId('scene-surface')
    // It is an application, not a browser: no address bar anywhere on it.
    expect(within(app).queryByTestId('browser-address')).toBeNull()
    expect(within(app).getByText('Complete - verified 2 years ago')).toBeTruthy()
    expect(within(app).getByText(/never asks for your PIN or an OTP/)).toBeTruthy()
    expect(within(app).getByText('KYC complete')).toBeTruthy()
  })
})

describe('the simulated call', () => {
  it('rings, connects and captions what the other side says', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W04" stage="verify" />)

    await openMenu(user)
    await user.click(screen.getByRole('button', { name: /Call Riya on \+91 00000 44712/ }))

    expect(screen.getByText('Ringing...')).toBeTruthy()

    const captions = await screen.findByTestId('call-captions')
    await waitFor(
      () => expect(within(captions).getByText(/I was in the other room/)).toBeTruthy(),
      { timeout: 4000 },
    )
    expect(screen.getByRole('button', { name: 'End call' })).toBeTruthy()
  }, 10_000)

  it('uses no microphone, camera or dialer', async () => {
    const user = userEvent.setup()
    const { container } = render(<Device scenarioId="W01" stage="branch" />)

    await openMenu(user)
    await user.click(screen.getByRole('button', { name: /Call \+91 00000 46205/ }))

    expect(container.querySelectorAll('audio, video, iframe, embed, object')).toHaveLength(0)
    expect(screen.getByText(/No microphone, camera or dialer was used/)).toBeTruthy()
  })
})

describe('the resolution is an app action', () => {
  it('offers Report under the conversation beside Keep, the way the app does', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W01" stage="resolve" onAct={acted} />)

    // IMMERSIVE-AUDIT-001: the banner holds one right and one wrong resolution, so its position
    // cannot stand in for judgement; Block lives in the overflow menu with the rest.
    const banner = screen.getByTestId('wa-action-banner')
    expect(within(banner).getByRole('button', { name: 'Keep the chat, no further action' })).toBeTruthy()
    expect(within(banner).queryByRole('button', { name: 'Block and delete the chat' })).toBeNull()

    await user.click(within(banner).getByRole('button', { name: 'Report and close the chat' }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'resolve_report' }), expect.anything())
  })

  it('lets the legitimate group be kept, from the same place', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W03" stage="resolve" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: 'Stay in the group and take part' }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'resolve_continue' }), expect.anything())
  })

  it('answers the poll in the app on the legitimate scenario', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W03" stage="branch" onAct={acted} />)

    expect(screen.getByText('Attendance - inter-company sports meet')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Yes, I will attend' }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'safe_pivot' }), expect.anything())
  })

  it('shows the group has already been answering the poll once voting has closed', () => {
    render(<Device scenarioId="W03" stage="verify" />)
    // Seven other answers are already in, which is what a ten-person group looks like.
    expect(screen.getByText('7 votes')).toBeTruthy()
  })
})

describe('the phone can be driven from the keyboard alone', () => {
  it('reaches and activates a chat control with Tab and Enter', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W03" stage="branch" onAct={acted} />)

    const vote = screen.getByRole('button', { name: 'No, I cannot attend' })
    vote.focus()
    await user.keyboard('{Enter}')
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'safe_pivot' }), expect.anything())
  })

  it('opens the overflow menu with the keyboard and closes it with Escape', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W01" stage="verify" />)

    screen.getByRole('button', { name: 'More options' }).focus()
    await user.keyboard('{Enter}')

    const dialog = await screen.findByRole('dialog')
    // Focus moves into the sheet rather than being left behind it.
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('walks into a pushed surface and back out with the keyboard', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W03" stage="inspect" />)

    screen.getByRole('button', { name: /open group info/ }).focus()
    await user.keyboard('{Enter}')

    const back = await screen.findByRole('button', { name: /Back from Group info/ })
    back.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })
})

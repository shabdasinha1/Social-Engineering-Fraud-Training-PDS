import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Device } from '@/test/sceneHarness'

/**
 * The interactive forms, and what happens to what is typed into them (R2).
 *
 * The client asked for forms the learner can actually fill in, because declining to hand
 * over a card number is only a decision if handing it over was possible. That change is
 * the single loosening of the containment rule in this batch, so it gets its own suite,
 * and the suite is written around the promises in `surfaces/SceneForm.jsx`:
 *
 *   the value is local, ephemeral, never transmitted, never persisted, never logged,
 *   never offered to a password manager, and never gates a control by RISK.
 *
 * The strongest of those is the third, and it is checked the strongest way available: the
 * whole payload the device would have handed the controller is serialised and searched
 * for the exact strings that were typed.
 */

/** Deliberately distinctive, so a substring search for them cannot match by accident. */
const CARD = '4917610000000000'
const CVV = '731'
const HOLDER = 'A KHAN'
const EXPIRY = '1128'
const PIN = '246813'
const OTP = '907214'
const ACCOUNT = '505511220099'
const MOBILE = '9000011122'
const DOCNO = 'XZ4471QQ'

const TYPED = [CARD, CVV, HOLDER, EXPIRY, PIN, OTP, ACCOUNT, MOBILE, DOCNO]

const fill = async (user, label, value) => {
  const box = screen.getByLabelText(label)
  await user.click(box)
  await user.keyboard(value)
  return box
}

afterEach(cleanup)

describe('the redelivery checkout is a checkout', () => {
  it('will not continue until the card details are complete, then walks to a review step', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    const next = screen.getByTestId('browser-primary')
    expect(next.disabled).toBe(true)

    await fill(user, 'Card number', CARD)
    await fill(user, 'Name on card', HOLDER)
    await fill(user, 'Expiry', EXPIRY)
    expect(next.disabled).toBe(true)
    await fill(user, 'CVV', CVV)
    expect(next.disabled).toBe(false)

    await user.click(next)
    expect(screen.getByText('Confirm your payment')).toBeTruthy()
    // The money's real destination is on the review step, which is where it bites.
    expect(screen.getByText('SR DIGITAL SERVICES')).toBeTruthy()
  })

  it('groups a card number as it is typed and masks the security code', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    const card = await fill(user, 'Card number', CARD)
    expect(card.value).toBe('4917 6100 0000 0000')
    expect(card.getAttribute('type')).toBe('text')

    const cvv = await fill(user, 'CVV', CVV)
    // Masked by the component, never by `type="password"`, so nothing offers to save it.
    expect(cvv.getAttribute('type')).toBe('text')
    expect(cvv.style.WebkitTextSecurity ?? cvv.style.getPropertyValue('-webkit-text-security'))
      .toBeTruthy()
  })

  it('puts the only scored control on the review step, not on the step being typed into', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    // Scoped to the site: the chat behind it has its own control of the same name, which
    // is exactly the point - one opens a sheet, the other commits a form.
    const site = () => within(screen.getByTestId('scene-surface'))
    expect(site().queryByRole('button', { name: /^Pay INR 25\.00/ })).toBeNull()

    await fill(user, 'Card number', CARD)
    await fill(user, 'Name on card', HOLDER)
    await fill(user, 'Expiry', EXPIRY)
    await fill(user, 'CVV', CVV)
    await user.click(screen.getByTestId('browser-primary'))

    expect(site().getByRole('button', { name: /^Pay INR 25\.00/ })).toBeTruthy()
  })

  it('reaches a receipt only after the engine has accepted the submission', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W02" stage="branch" onAct={acted} />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    await fill(user, 'Card number', CARD)
    await fill(user, 'Name on card', HOLDER)
    await fill(user, 'Expiry', EXPIRY)
    await fill(user, 'CVV', CVV)
    await user.click(screen.getByTestId('browser-primary'))
    expect(screen.queryByText('Payment received.')).toBeNull()

    const site = within(screen.getByTestId('scene-surface'))
    await user.click(site.getByRole('button', { name: /^Pay INR 25\.00/ }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'submit_data' }), expect.anything())
    expect(screen.getByText('Payment received.')).toBeTruthy()
    // The consequence the site itself reports: the parcel is exactly where it was.
    expect(screen.getByText(/status unchanged/)).toBeTruthy()

    // Back from a receipt leaves the site. The act is in the ledger; the form is done.
    await user.click(screen.getByRole('button', { name: /Close the browser and go back/ }))
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })

  it('offers the UPI route as a second page of the same site', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))
    await user.click(screen.getByRole('button', { name: /Pay by UPI instead/ }))

    expect(screen.getByLabelText('Your UPI ID')).toBeTruthy()
    expect(screen.getByTestId('browser-primary').disabled).toBe(true)
  })
})

describe('the KYC form is a form', () => {
  it('asks for account, PIN and OTP and accepts every one of them', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W05" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the KYC link' }))

    const account = await fill(user, 'Account number', ACCOUNT)
    const mobile = await fill(user, 'Registered mobile', MOBILE)
    const pin = await fill(user, 'Wallet PIN', '4417')
    const otp = await fill(user, 'OTP just sent to you', OTP)
    const doc = await fill(user, 'ID document number', DOCNO)

    expect(account.value).toBe('5055 1122 0099')
    expect(mobile.value).toBe(MOBILE)
    expect(pin.value).toBe('4417')
    expect(otp.value).toBe(OTP)
    expect(doc.value).toBe(DOCNO)
    expect(screen.getByTestId('browser-primary').disabled).toBe(false)
  })

  it('commits on the confirmation step and lands on the site is own outcome page', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W05" stage="branch" onAct={acted} />)
    await user.click(screen.getByRole('button', { name: 'Open the KYC link' }))

    await fill(user, 'Account number', ACCOUNT)
    await fill(user, 'Registered mobile', MOBILE)
    await fill(user, 'Wallet PIN', '4417')
    await fill(user, 'OTP just sent to you', OTP)
    await fill(user, 'ID document number', DOCNO)

    expect(screen.queryByRole('button', { name: /Submit and keep my wallet active/ })).toBeNull()
    await user.click(screen.getByTestId('browser-primary'))

    await user.click(screen.getByRole('button', { name: /Submit and keep my wallet active/ }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'submit_data' }), expect.anything())
    expect(screen.getByText('Details received.')).toBeTruthy()
    expect(screen.getByText(/further one-time password has been requested/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Close the browser and go back/ }))
    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })

  it('forgets everything typed as soon as the page is left', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W05" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the KYC link' }))

    await fill(user, 'Account number', ACCOUNT)
    await user.click(screen.getByRole('button', { name: /Why is this needed/ }))
    await user.click(screen.getByRole('button', { name: /Back to verification/ }))

    expect(screen.getByLabelText('Account number').value).toBe('')
  })
})

describe('the payment sheet is where a collect request is approved', () => {
  it('opens locally, records nothing, and only commits once the PIN is entered', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W04" stage="branch" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: /^Pay INR 8,000\.00$/ }))
    // Opening the sheet is navigation. Nothing reached the engine.
    expect(acted).not.toHaveBeenCalled()

    const sheet = screen.getByTestId('scene-surface')
    // The payee is the evidence, and it is read at the moment of paying.
    expect(within(sheet).getByText('S KUMAR ENTERPRISE')).toBeTruthy()
    expect(within(sheet).getByText(/Enter your 6-digit PIN/)).toBeTruthy()

    await fill(user, 'UPI PIN', PIN)
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))
    expect(acted).toHaveBeenCalledWith(expect.objectContaining({ intent: 'attempt_payment' }), expect.anything())
  })

  it('returns to the conversation once the decision has been recorded', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W04" stage="branch" />)

    await user.click(screen.getByRole('button', { name: /^Pay INR 8,000\.00$/ }))
    await fill(user, 'UPI PIN', PIN)
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))

    expect(screen.getByTestId('wa-thread')).toBeTruthy()
  })
})

describe('what the learner types goes nowhere', () => {
  it('never reaches the affordance the device submits', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W05" stage="branch" onAct={acted} />)
    await user.click(screen.getByRole('button', { name: 'Open the KYC link' }))

    await fill(user, 'Account number', ACCOUNT)
    await fill(user, 'Registered mobile', MOBILE)
    await fill(user, 'Wallet PIN', '4417')
    await fill(user, 'OTP just sent to you', OTP)
    await fill(user, 'ID document number', DOCNO)
    await user.click(screen.getByTestId('browser-primary'))
    await user.click(screen.getByRole('button', { name: /Submit and keep my wallet active/ }))

    const submitted = JSON.stringify(acted.mock.calls)
    for (const value of TYPED) expect(submitted).not.toContain(value)
    // What IS submitted is the intent and the asset the ledger should name, and no more.
    expect(acted.mock.calls.at(-1)[0]).toMatchObject({
      intent: 'submit_data',
      targetId: 'W05-browser-01',
    })
  })

  it('never reaches browser storage', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    await fill(user, 'Card number', CARD)
    await fill(user, 'Name on card', HOLDER)
    await fill(user, 'Expiry', EXPIRY)
    await fill(user, 'CVV', CVV)

    const stored = [
      ...Object.entries({ ...window.localStorage }),
      ...Object.entries({ ...window.sessionStorage }),
    ].map(([key, value]) => `${key}=${value}`).join('|')
    for (const value of TYPED) expect(stored).not.toContain(value)
    expect(document.cookie).toBe('')
  })

  it('is never described to the assessment, only the act is', async () => {
    const user = userEvent.setup()
    const acted = vi.fn()
    render(<Device scenarioId="W04" stage="branch" onAct={acted} />)

    await user.click(screen.getByRole('button', { name: /^Pay INR 8,000\.00$/ }))
    await fill(user, 'UPI PIN', PIN)
    await user.click(screen.getByRole('button', { name: 'Confirm payment' }))

    const affordance = acted.mock.calls.at(-1)[0]
    expect(JSON.stringify(affordance)).not.toContain(PIN)
    expect(Object.keys(affordance).some((key) => /pin|card|cvv|otp|value/i.test(key))).toBe(false)
  })
})

describe('a field never steers', () => {
  it('leaves every risky control selectable, and disables only for incomplete input', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W02" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the redelivery link' }))

    // The page's own step control is the ONLY disabled thing, and completing the form
    // enables it. Nothing on the screen is disabled because of what it would cost.
    const disabled = [...document.querySelectorAll('button:disabled')]
    expect(disabled).toHaveLength(1)
    expect(disabled[0].getAttribute('data-testid')).toBe('browser-primary')
  })

  it('offers no autofill surface a credential manager would recognise', async () => {
    const user = userEvent.setup()
    render(<Device scenarioId="W05" stage="branch" />)
    await user.click(screen.getByRole('button', { name: 'Open the KYC link' }))

    for (const input of document.querySelectorAll('input')) {
      expect(input.getAttribute('autocomplete')).toBe('off')
      expect(input.getAttribute('type')).toBe('text')
      // A meaningless name: nothing here looks like a card or credential field.
      expect(input.getAttribute('name')).toMatch(/^f\d+$/)
    }
    expect(document.querySelectorAll('form')).toHaveLength(0)
  })
})

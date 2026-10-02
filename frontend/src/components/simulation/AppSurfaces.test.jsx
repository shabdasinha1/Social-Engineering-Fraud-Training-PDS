import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppSurface } from '@/components/simulation/AppSurfaces'
import { CHANNELS } from '@/constants/channels'

/**
 * The four communication simulators as the learner finds them with nothing waiting
 * (CLIENT-POLISH-001).
 *
 * The client asked for "a glimpse of the individual module simulators", appearing "similar
 * to real-world applications". These tests pin the two halves of that: each app is
 * recognisable as itself, and none of them can do anything.
 */

const PLATFORMS = [
  { platform: 'whatsapp', label: 'WhatsApp' },
  { platform: 'instagram', label: 'Instagram' },
  { platform: 'email', label: 'Email' },
  { platform: 'sms', label: 'SMS' },
]

const renderSurface = (platform, label, onBack = () => {}) =>
  render(<AppSurface platform={platform} label={label} onBack={onBack} />)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('every simulator', () => {
  it.each(PLATFORMS)('renders a distinct surface for $label', ({ platform, label }) => {
    renderSurface(platform, label)
    expect(screen.getByTestId(`app-surface-${platform}`)).toBeTruthy()
    expect(screen.getByRole('status').textContent).toMatch(
      new RegExp(`Nothing new in ${label}\\.`),
    )
  })

  it.each(PLATFORMS)('$label offers exactly one real control, and it is Back', async ({ platform, label }) => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    renderSurface(platform, label, onBack)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].getAttribute('aria-label')).toBe('Back to home screen')

    await user.click(buttons[0])
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it.each(PLATFORMS)('$label can neither send, dial, navigate nor accept input', ({ platform, label }) => {
    renderSurface(platform, label)
    const root = screen.getByTestId(`app-surface-${platform}`)

    // Nothing typable, nothing submittable, nothing that leaves the device.
    expect(root.querySelectorAll('input, textarea, form, select')).toHaveLength(0)
    expect(root.querySelectorAll('a[href]')).toHaveLength(0)
    expect(root.querySelectorAll('img, iframe, video, audio, embed, object')).toHaveLength(0)
  })

  it.each(PLATFORMS)('$label loads no external resource', ({ platform, label }) => {
    renderSurface(platform, label)
    const root = screen.getByTestId(`app-surface-${platform}`)

    /**
     * Every icon is an inline `<svg>` from the local icon set, so the markup legitimately
     * contains the SVG namespace `http://www.w3.org/2000/svg`. That is an XML identifier
     * the browser never resolves, so the check is on what actually FETCHES: any attribute
     * that names a resource, and any CSS `url()`.
     */
    for (const node of root.querySelectorAll('*')) {
      for (const attr of ['src', 'srcset', 'href', 'poster', 'data', 'background']) {
        expect(node.getAttribute(attr)).toBeNull()
      }
      expect(node.getAttribute('style') ?? '').not.toMatch(/url\(/)
    }
    // And nothing that could carry a remote payload in the first place.
    expect(root.querySelectorAll('img, iframe, video, audio, embed, object, link, script'))
      .toHaveLength(0)
  })

  it.each(PLATFORMS)('$label exposes no scenario classification', ({ platform, label }) => {
    renderSurface(platform, label)
    const text = screen.getByTestId(`app-surface-${platform}`).textContent.toLowerCase()
    for (const forbidden of ['malicious', 'legitimate', 'disposition', 'difficulty',
      'attack family', 'trigger', 'score', 'points']) {
      expect(text).not.toContain(forbidden)
    }
  })

  it('the four surfaces do not render identically', () => {
    const markup = PLATFORMS.map(({ platform, label }) => {
      const { container } = renderSurface(platform, label)
      const html = container.innerHTML
      cleanup()
      return html
    })
    expect(new Set(markup).size).toBe(4)
  })

  it('covers every channel the product ships', () => {
    expect(PLATFORMS.map((p) => p.platform).sort()).toEqual(
      CHANNELS.map((c) => c.key).sort(),
    )
  })
})

describe('app-specific chrome', () => {
  it('WhatsApp shows its own header and Chats / Status / Calls tabs', () => {
    renderSurface('whatsapp', 'WhatsApp')
    const root = screen.getByTestId('app-surface-whatsapp')
    expect(within(root).getByText('WhatsApp')).toBeTruthy()
    for (const tab of ['CHATS', 'STATUS', 'CALLS']) {
      expect(within(root).getByText(tab)).toBeTruthy()
    }
  })

  it('Instagram shows its wordmark, a story rail and bottom navigation', () => {
    renderSurface('instagram', 'Instagram')
    const root = screen.getByTestId('app-surface-instagram')
    expect(within(root).getByText('Instagram')).toBeTruthy()
    expect(within(root).getByText('Your story')).toBeTruthy()
    expect(root.querySelector('nav')).toBeTruthy()
  })

  it('Email shows an inbox with mail categories', () => {
    renderSurface('email', 'Email')
    const root = screen.getByTestId('app-surface-email')
    expect(within(root).getByText('Inbox')).toBeTruthy()
    for (const tab of ['Primary', 'Social', 'Promotions']) {
      expect(within(root).getByText(tab)).toBeTruthy()
    }
  })

  it('SMS shows the Messages list and a compose affordance', () => {
    renderSurface('sms', 'SMS')
    const root = screen.getByTestId('app-surface-sms')
    expect(within(root).getByText('Messages')).toBeTruthy()
    expect(within(root).getByText('Start chat')).toBeTruthy()
  })

  it('an unknown platform still gets an honest, inert surface', () => {
    renderSurface('telegram', 'Telegram')
    expect(screen.getByRole('status').textContent).toMatch(/Nothing new in Telegram\./)
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

describe('accessibility of the simulators', () => {
  it.each(PLATFORMS)('$label announces its empty state without stealing focus', ({ platform, label }) => {
    renderSurface(platform, label)
    const status = screen.getByRole('status')
    expect(status.textContent).toContain(label)
    expect(document.activeElement).toBe(document.body)
  })

  it.each(PLATFORMS)('$label keeps decorative chrome out of the accessibility tree', ({ platform, label }) => {
    renderSurface(platform, label)
    const root = screen.getByTestId(`app-surface-${platform}`)

    // Every icon row, story rail, tab strip and ghost row is decoration.
    const hidden = root.querySelectorAll('[aria-hidden="true"]')
    expect(hidden.length).toBeGreaterThan(0)
    for (const node of hidden) {
      expect(node.querySelector('button')).toBeNull()
    }
  })

  it.each(PLATFORMS)('$label gives Back a usable target size', ({ platform, label }) => {
    renderSurface(platform, label)
    const back = screen.getByRole('button', { name: 'Back to home screen' })
    // size-9 plus the rounded hit area; the class is the contract the design system sets.
    expect(back.className).toMatch(/size-9/)
  })
})

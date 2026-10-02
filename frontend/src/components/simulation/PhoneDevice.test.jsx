import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhoneShell } from '@/components/simulation/PhoneShell'
import { assetOfKind } from '@/constants/simulation'

/**
 * The simulated device itself (UI-002): its chrome, its local navigation, its scroll
 * containment and its offline boundary.
 *
 * The scenario used is a real DATA-003 record read from `backend/data/synthetic/v1/`, so
 * the device is exercised against content the learner will actually be shown.
 */

function loadPlatform(platform) {
  const path = resolve(process.cwd(), `../backend/data/synthetic/v1/synthetic.${platform}.json`)
  const parsed = JSON.parse(readFileSync(path, 'utf8'))
  return Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
}

const WHATSAPP = loadPlatform('whatsapp')

function scenarioFrom(record) {
  return {
    scenario_id: record.scenario_id,
    version: record.definition_version,
    platform: record.platform,
    synthetic: record.synthetic,
    stages: [],
  }
}

/** A scenario that supplies a browser page, so a surface can be pushed onto the device. */
const WITH_BROWSER = scenarioFrom(
  WHATSAPP.find((r) => r.synthetic.assets.some((a) => a.kind === 'browser_page')),
)

afterEach(cleanup)

describe('device chrome', () => {
  it('draws a status bar, a clipped screen and a home indicator', () => {
    render(<PhoneShell scenario={WITH_BROWSER} stage="open" />)

    const bar = screen.getByTestId('device-status-bar')
    expect(bar).toBeTruthy()
    // The status bar describes the fictional phone, never the host's real network - and,
    // since the application is hosted online, it no longer claims to be offline.
    expect(bar.textContent).toMatch(/Simulated carrier/)
    expect(bar.textContent).not.toMatch(/offline/i)

    const deviceScreen = screen.getByTestId('device-screen')
    expect(deviceScreen.className).toMatch(/overflow-hidden/)
    expect(deviceScreen.className).toMatch(/relative/)
  })

  it('shows the scenario time on the status bar, not the host clock', () => {
    // A host clock far from any scenario time: the status bar must not follow it.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 28, 17, 18))
    try {
      const time = assetOfKind(WITH_BROWSER, 'notification').content.received_at
      render(<PhoneShell scenario={WITH_BROWSER} stage="notify" />)
      const bar = screen.getByTestId('device-status-bar')
      const [hours, minutes] = time.split(':')
      expect(bar.textContent).toMatch(new RegExp(`${Number(hours) % 12 || 12}:${minutes}|${hours}:${minutes}`))
      expect(bar.textContent).not.toMatch(/0?5:18/)
      // The toast on the same screen announces the same time.
      expect(screen.getByTestId('notification-tray').textContent).toContain(time)
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps the device within its own width so the page never scrolls sideways', () => {
    const { container } = render(<PhoneShell scenario={WITH_BROWSER} stage="open" />)

    // jsdom has no layout engine, so this asserts the sizing contract rather than pixels:
    // the frame is fluid up to a maximum and sets no fixed width of its own.
    const frame = container.firstElementChild
    expect(frame.className).toMatch(/w-full/)
    expect(frame.className).toMatch(/max-w-\[390px\]/)
    expect(container.querySelectorAll('[class*="w-screen"]')).toHaveLength(0)
  })

  it('scrolls inside the screen without chaining to the page', () => {
    const { container } = render(<PhoneShell scenario={WITH_BROWSER} stage="open" />)

    const scrollers = [...container.querySelectorAll('[class*="overflow-y-auto"]')]
    expect(scrollers.length).toBeGreaterThan(0)
    for (const scroller of scrollers) {
      expect(scroller.className).toMatch(/overscroll-contain/)
    }
  })
})

describe('local device navigation', () => {
  it('pushes a surface over the app and returns with Back', async () => {
    const user = userEvent.setup()
    const asset = assetOfKind(WITH_BROWSER, 'browser_page')
    const onCloseSurface = vi.fn()

    const { rerender } = render(<PhoneShell scenario={WITH_BROWSER} stage="verify" />)
    expect(screen.getByTestId('phone-app')).toBeTruthy()
    expect(screen.queryByTestId('phone-surface')).toBeNull()

    rerender(
      <PhoneShell
        scenario={WITH_BROWSER}
        stage="verify"
        surfaceAsset={asset}
        onCloseSurface={onCloseSurface}
      />,
    )

    const surface = screen.getByTestId('phone-surface')
    expect(within(surface).getByText(asset.display_target)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Back to the conversation/ }))
    expect(onCloseSurface).toHaveBeenCalledTimes(1)

    // Back is local navigation only - it submits nothing.
    rerender(<PhoneShell scenario={WITH_BROWSER} stage="verify" />)
    expect(screen.queryByTestId('phone-surface')).toBeNull()
    expect(screen.getByTestId('phone-app')).toBeTruthy()
  })

  it('opens a benign empty app from the home screen and comes back', async () => {
    const user = userEvent.setup()
    render(<PhoneShell scenario={WITH_BROWSER} stage="notify" onOpenItem={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Open Instagram' }))
    expect(screen.getByText(/Nothing new in Instagram/)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Back to home screen/ }))
    expect(screen.getByRole('button', { name: /Open WhatsApp/ })).toBeTruthy()
  })

  it('submits the open intent only from the app the scenario arrived in', async () => {
    const user = userEvent.setup()
    const onOpenItem = vi.fn()
    render(<PhoneShell scenario={WITH_BROWSER} stage="notify" onOpenItem={onOpenItem} />)

    await user.click(screen.getByRole('button', { name: 'Open Instagram' }))
    expect(onOpenItem).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Back to home screen/ }))
    await user.click(screen.getByRole('button', { name: /Open WhatsApp/ }))
    expect(onOpenItem).toHaveBeenCalledTimes(1)
  })
})

describe('the notification banner', () => {
  it('reads from the scenario notification and offers Open and Dismiss', async () => {
    const user = userEvent.setup()
    const onOpenItem = vi.fn()
    const onDismiss = vi.fn()
    const notification = assetOfKind(WITH_BROWSER, 'notification')

    render(
      <PhoneShell
        scenario={WITH_BROWSER}
        stage="notify"
        onOpenItem={onOpenItem}
        onDismiss={onDismiss}
      />,
    )

    // The tray and the tile preview read the same asset, so the body appears twice by
    // design; the tray is the notification itself.
    const tray = screen.getByTestId('notification-tray')
    expect(within(tray).getByText(notification.content.body)).toBeTruthy()
    await user.click(within(tray).getByRole('button', { name: /^Open .*, in WhatsApp$/ }))
    expect(onOpenItem).toHaveBeenCalledTimes(1)
    await user.click(within(tray).getByRole('button', { name: /^Dismiss .*, in WhatsApp$/ }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  /** UI-001 semantics: dismissing logs an event and keeps the scenario and its badge. */
  it('keeps the badged app after the banner is dismissed', () => {
    render(<PhoneShell scenario={WITH_BROWSER} stage="notify" dismissed />)

    expect(screen.queryByTestId('notification-tray')).toBeNull()
    expect(screen.getByText(/Alert dismissed/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Open WhatsApp, 1 unread item/ })).toBeTruthy()
  })

  it('disables the device controls while an intent is in flight', () => {
    render(<PhoneShell scenario={WITH_BROWSER} stage="notify" busy />)

    expect(screen.getByRole('button', { name: /^Open .*, in WhatsApp$/ }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: /Open WhatsApp/ }).disabled).toBe(true)
  })
})

describe('the offline boundary', () => {
  it('renders no element that could reach the network or the host device', () => {
    const asset = assetOfKind(WITH_BROWSER, 'browser_page')
    const { container } = render(
      <PhoneShell scenario={WITH_BROWSER} stage="verify" surfaceAsset={asset} />,
    )

    expect(container.querySelectorAll(
      'img, iframe, embed, object, video, audio, source, form, a[href]',
    )).toHaveLength(0)

    // The address is text on a reserved host, not a navigable link.
    const address = screen.getByText(asset.display_target)
    expect(address.tagName).not.toBe('A')
    expect(asset.display_target).toMatch(/\.example(\/|$)/)
  })

  it('uses only real buttons, so every device control is keyboard reachable', () => {
    render(<PhoneShell scenario={WITH_BROWSER} stage="notify" onOpenItem={vi.fn()} />)

    for (const control of screen.getAllByRole('button')) {
      expect(control.tagName).toBe('BUTTON')
      const name = control.getAttribute('aria-label') || control.textContent.trim()
      expect(name.length).toBeGreaterThan(0)
    }
  })
})

describe('reduced motion', () => {
  /**
   * The animations are CSS classes, and the global `prefers-reduced-motion` guard in
   * `styles/index.css` collapses every animation and transition duration. jsdom applies
   * no stylesheet, so this asserts the contract that guard depends on: the device animates
   * through classes, never through inline styles or a JS animation loop it could bypass.
   */
  it('animates through classes the reduced-motion guard can neutralise', () => {
    const { container } = render(<PhoneShell scenario={WITH_BROWSER} stage="open" />)

    const animated = [...container.querySelectorAll('[class*="animate-"]')]
    expect(animated.length).toBeGreaterThan(0)
    for (const node of animated) {
      expect(node.getAttribute('style')).toBeNull()
    }
  })
})

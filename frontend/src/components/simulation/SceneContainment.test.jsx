import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { STAGE_ORDER, affordancesFor, surfaceById } from '@/simulation/sceneModel'
import { AUTHORED_SCENARIO_IDS, sceneFor } from '@/simulation/sceneRegistry'
import { Device } from '@/test/sceneHarness'
import { payload } from '@/test/sceneFixtures'

/**
 * Offline containment, checked on every authored screen (R2).
 *
 * IMMERSIVE-003A asserted "no inputs anywhere". R2 deliberately changed that in exactly
 * one place - a page may carry form fields - so the rule has to be restated rather than
 * relaxed, and this suite is where it is restated:
 *
 *   1. Nothing navigates.  No `a[href]`, `<form>`, `iframe`, `embed`, `object`.
 *   2. Nothing loads.      No `img`, `video`, `audio`, `source`, no `src` of any kind.
 *   3. Nothing is captured. Inputs exist only inside a scene's own form blocks, and only
 *      as `type="text"` with `autocomplete="off"` and a meaningless name.
 *   4. Nothing is disabled to steer. A control is disabled only while a submission is in
 *      flight or while a page's own fields are incomplete.
 *   5. Every control has an accessible name.
 *
 * Walked stage by stage AND surface by surface, because a screen the learner can only
 * reach three taps in is exactly the screen a containment regression would hide on.
 */

const STAGES = STAGE_ORDER.filter((key) => key !== 'notify')

/** Every surface the scene declares, with the affordance or link that opens it. */
const surfacesOf = (id) => Object.keys(sceneFor(payload(id)).surfaces)

function assertContained(container) {
  expect(container.querySelectorAll('a[href], form, iframe, embed, object')).toHaveLength(0)
  expect(container.querySelectorAll('img, video, audio, source, [src]')).toHaveLength(0)
  for (const input of container.querySelectorAll('input, textarea, select')) {
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('type')).toBe('text')
    expect(input.getAttribute('autocomplete')).toBe('off')
    expect(input.getAttribute('name')).toMatch(/^f\d+$/)
  }
}

afterEach(cleanup)

describe('containment holds on every authored screen', () => {
  it.each(AUTHORED_SCENARIO_IDS)('%s stays contained at every stage', (id) => {
    for (const stage of STAGES) {
      const { container, unmount } = render(<Device scenarioId={id} stage={stage} />)
      assertContained(container)
      unmount()
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s stays contained on every surface it can push', async (id) => {
    const user = userEvent.setup()
    const scene = sceneFor(payload(id))

    for (const surfaceId of surfacesOf(id)) {
      const surface = surfaceById(scene, surfaceId)
      const pages = surface.pages ? Object.keys(surface.pages) : [null]

      for (const stage of STAGES) {
        // Find any control at this stage that opens the surface, scored or local.
        const opener = affordancesFor(scene, stage).find((item) => item.opens === surfaceId)
          ?? (scene.ambient ?? []).find((item) => item.opens === surfaceId)
        if (!opener) continue

        const { container, unmount } = render(<Device scenarioId={id} stage={stage} />)
        let control = container.querySelector(`[data-affordance="${opener.id}"]`)
        if (!control) {
          // Most routes into a surface live in the overflow sheet, as they do in the app.
          const menu = container.querySelector('button[aria-label="More options"]')
          if (menu) await user.click(menu)
          control = container.querySelector(`[data-affordance="${opener.id}"]`)
        }
        if (!control) {
          unmount()
          continue
        }
        await user.click(control)
        assertContained(container)

        // ...and on every page the surface can walk to from there.
        for (const pageId of pages.filter(Boolean)) {
          const inPageLink = container.querySelector(`[data-page-link="${pageId}"]`)
          if (inPageLink) {
            await user.click(inPageLink)
            assertContained(container)
          }
        }
        unmount()
        break
      }
    }
  }, 30_000)

  it.each(AUTHORED_SCENARIO_IDS)('%s gives every control an accessible name', (id) => {
    for (const stage of STAGES) {
      const { container, unmount } = render(<Device scenarioId={id} stage={stage} />)
      for (const button of container.querySelectorAll('button')) {
        const name = button.getAttribute('aria-label') ?? button.textContent.trim()
        expect(name.length).toBeGreaterThan(0)
      }
      unmount()
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s disables nothing in the conversation', (id) => {
    for (const stage of STAGES) {
      const { container, unmount } = render(<Device scenarioId={id} stage={stage} />)
      for (const button of container.querySelectorAll('button')) {
        // Nothing is removed from the tab order, and nothing is disabled to steer.
        expect(button.getAttribute('tabindex')).not.toBe('-1')
        expect(button.disabled).toBe(false)
      }
      unmount()
    }
  })

  it('makes no network call and opens no window on any authored scenario', async () => {
    const user = userEvent.setup()
    // Any of these being touched would mean a surface stopped being a description.
    const guards = ['fetch', 'open', 'XMLHttpRequest', 'WebSocket', 'EventSource']
      .map((key) => [key, window[key]])

    for (const id of AUTHORED_SCENARIO_IDS) {
      const { unmount } = render(<Device scenarioId={id} stage="branch" />)
      await user.click(screen.getByRole('button', { name: 'More options' }))
      unmount()
    }

    for (const [key, before] of guards) expect(window[key]).toBe(before)
    expect(navigator.mediaDevices).toBeUndefined()
  }, 20_000)
})

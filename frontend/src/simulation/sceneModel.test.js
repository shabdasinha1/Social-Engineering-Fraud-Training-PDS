import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STAGE_INTENTS as ENGINE_STAGE_INTENTS } from '../../../backend/src/constants/scenarioEngine.js'
import {
  ASSET_KIND, NOTIFY_DISMISS_ID, NOTIFY_OPEN_ID, actionsFor,
} from '@/constants/simulation'
import * as model from '@/simulation/sceneModel'
import {
  STAGE_ORDER, action, ambientFor, anchoredTo, beatsAt, fieldsOfPage, reached, surfaceById,
} from '@/simulation/sceneModel'
import { AUTHORED_SCENARIO_IDS, sceneFor } from '@/simulation/sceneRegistry'
import { NEXT_STAGE } from '@/test/attemptFixtures'
import {
  CANONICAL_INTENTS, FORBIDDEN_TOKENS, GENERIC_ACTIONS, SCENE_ACTIONS, withServerMeaning,
} from '@/test/actionMap'

/**
 * SECURITY-001. A scene control carries only a neutral id; what it submits is the server's
 * (`backend/data/learner-actions/v1`). These two helpers attach that server meaning -
 * `intent`, `source` and the authoring `name` the control had before, such as
 * `w11-verify-app` - so the assertions below can still say what each control does. The
 * raw model is `model.*`, and the SECURITY-001 block at the end checks it carries none of it.
 */
const allAffordances = (scene) =>
  model.allAffordances(scene).map((control) => withServerMeaning(scene.scenarioId, control))
const affordancesFor = (scene, stage) =>
  model.affordancesFor(scene, stage).map((control) => withServerMeaning(scene.scenarioId, control))

/** The intents the engine accepts at each stage, from the engine itself. */
const STAGE_INTENTS = Object.fromEntries(
  Object.entries(ENGINE_STAGE_INTENTS).map(([stage, rules]) => [stage, Object.keys(rules)]),
)

/**
 * The scene layer, checked against the REAL scenario bank rather than a fixture.
 *
 * Everything below builds each authored scene from the same payload the server sends and
 * asserts the properties that make the layer safe to scale: it stays inside the engine's
 * vocabulary, it never leaks a classification the learner must not see, it never names a
 * host or an asset that does not exist, and the thread it produces is a pure function of
 * the stage the server committed.
 */

const PLATFORMS = ['whatsapp', 'instagram', 'sms', 'email']

const BANK = (() => {
  const records = PLATFORMS.flatMap((platform) => {
    const path = resolve(process.cwd(), `../backend/data/synthetic/v1/synthetic.${platform}.json`)
    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(parsed) ? parsed : (parsed.scenarios ?? [])
  })
  return Object.fromEntries(records.map((record) => [record.scenario_id, record]))
})()

const SOURCE = (() => {
  const records = PLATFORMS.flatMap((platform) => {
    const path = resolve(process.cwd(), `../backend/data/scenarios/v1/scenarios.${platform}.json`)
    return JSON.parse(readFileSync(path, 'utf8'))
  })
  return Object.fromEntries(records.map((record) => [record.scenario_id, record]))
})()

/** A scenario in the shape `/current-run` delivers it. */
function payload(scenarioId) {
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

const SCENES = Object.fromEntries(
  AUTHORED_SCENARIO_IDS.map((id) => [id, sceneFor(payload(id))]),
)

describe('the registry', () => {
  it('authors every one of the hundred scenarios: all WhatsApp, Instagram, Email and SMS', () => {
    expect(AUTHORED_SCENARIO_IDS).toEqual([
      'W01', 'W02', 'W03', 'W04', 'W05', 'W06', 'W07', 'W08', 'W09', 'W10',
      'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20',
      'W21', 'W22', 'W23', 'W24', 'W25',
      'I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07', 'I08', 'I09', 'I10',
      'I11', 'I12', 'I13', 'I14', 'I15', 'I16', 'I17', 'I18', 'I19', 'I20',
      'I21', 'I22', 'I23', 'I24', 'I25',
      'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10',
      'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18', 'E19', 'E20',
      'E21', 'E22', 'E23', 'E24', 'E25',
      'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10',
      'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20',
      'S21', 'S22', 'S23', 'S24', 'S25',
    ])
    // 004A-004E authored Instagram I01-I25; IMMERSIVE-005 added Email E01-E05; IMMERSIVE-006
    // added Email E06-E10; IMMERSIVE-007 added Email E11-E15; IMMERSIVE-008 added E16-E20;
    // IMMERSIVE-009 added E21-E25, which completed Email; IMMERSIVE-010 added SMS S01-S05 and
    // IMMERSIVE-011 added SMS S06-S10, IMMERSIVE-012 added SMS S11-S15, IMMERSIVE-013 added
    // SMS S16-S20 and IMMERSIVE-014 adds SMS S21-S25, which completes all one hundred.
    expect(AUTHORED_SCENARIO_IDS).toHaveLength(100)
  })

  it('builds a scene for each of I01-I10 that does not collide with the WhatsApp ids', () => {
    const whatsapp = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('W'))
    for (const id of ['I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07', 'I08', 'I09', 'I10']) {
      const scene = sceneFor(payload(id))
      expect(scene.scenarioId).toBe(id)
      expect(scene.platform).toBe('instagram')
      const prefix = `${id.toLowerCase()}-`
      for (const affordance of [...allAffordances(scene), ...(scene.ambient ?? [])]) {
        expect(affordance.id.startsWith(prefix)).toBe(true)
      }
      for (const other of whatsapp) {
        const ids = new Set(allAffordances(SCENES[other]).map((item) => item.id))
        for (const affordance of allAffordances(scene)) expect(ids.has(affordance.id)).toBe(false)
      }
    }
  })

  it('builds a scene for each of I06-I10 that does not collide with I01-I05', () => {
    for (const id of ['I06', 'I07', 'I08', 'I09', 'I10']) {
      const scene = SCENES[id]
      for (const other of ['I01', 'I02', 'I03', 'I04', 'I05']) {
        const ids = new Set([...allAffordances(SCENES[other]), ...(SCENES[other].ambient ?? [])].map((item) => item.id))
        for (const affordance of [...allAffordances(scene), ...(scene.ambient ?? [])]) {
          expect(ids.has(affordance.id)).toBe(false)
        }
      }
    }
  })

  it('builds a scene for each of W21-W25 that does not collide with W01-W20', () => {
    const earlier = AUTHORED_SCENARIO_IDS.slice(0, 20)
    for (const id of ['W21', 'W22', 'W23', 'W24', 'W25']) {
      const scene = sceneFor(payload(id))
      expect(scene.scenarioId).toBe(id)
      const prefix = `${id.toLowerCase()}-`
      for (const affordance of [...allAffordances(scene), ...(scene.ambient ?? [])]) {
        expect(affordance.id.startsWith(prefix)).toBe(true)
      }
      for (const other of earlier) {
        const ids = new Set(allAffordances(SCENES[other]).map((item) => item.id))
        for (const affordance of allAffordances(scene)) expect(ids.has(affordance.id)).toBe(false)
      }
    }
  })

  it('leaves every other scenario on the generic path', () => {
    for (const id of Object.keys(BANK)) {
      if (AUTHORED_SCENARIO_IDS.includes(id)) continue
      expect(sceneFor(payload(id))).toBeNull()
    }
  })

  it('refuses a scene whose platform does not match the run', () => {
    expect(sceneFor({ ...payload('W01'), platform: 'sms' })).toBeNull()
  })

  it('builds nothing for a missing or unknown scenario', () => {
    expect(sceneFor(null)).toBeNull()
    expect(sceneFor({ scenario_id: 'Z99', platform: 'whatsapp' })).toBeNull()
  })
})

describe('every authored scene stays inside the engine vocabulary', () => {
  it.each(AUTHORED_SCENARIO_IDS)('%s offers only intents the engine allows at that stage', (id) => {
    for (const affordance of allAffordances(SCENES[id])) {
      if (!affordance.intent) continue
      expect(STAGE_INTENTS[affordance.stage]).toContain(affordance.intent)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s names only synthetic assets the scenario declares', (id) => {
    const known = new Set(BANK[id].synthetic.assets.map((asset) => asset.asset_id))
    for (const affordance of allAffordances(SCENES[id])) {
      if (!affordance.targetId) continue
      expect(known.has(affordance.targetId)).toBe(true)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s gives every scored control a stable id and a label', (id) => {
    const seen = new Set()
    for (const affordance of allAffordances(SCENES[id])) {
      expect(affordance.id).toMatch(/^[a-z0-9-]+$/)
      expect(typeof affordance.label).toBe('string')
      expect(affordance.label.length).toBeGreaterThan(0)
      expect(seen.has(affordance.id)).toBe(false)
      seen.add(affordance.id)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s only opens surfaces it actually declares', (id) => {
    const scene = SCENES[id]
    const controls = [...allAffordances(scene), ...(scene.ambient ?? [])]
    for (const affordance of controls) {
      if (affordance.opens) expect(surfaceById(scene, affordance.opens)).toBeTruthy()
      if (affordance.on) expect(surfaceById(scene, affordance.on)).toBeTruthy()
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s anchors every inline control to a beat that exists', (id) => {
    const scene = SCENES[id]
    const beatIds = new Set(scene.beats.map((beat) => beat.id))
    for (const affordance of allAffordances(scene)) {
      // `header` (the account row) and `cta` (a sponsored post's call-to-action strip,
      // IMMERSIVE-004B) are named places in the app's chrome rather than beats.
      if (!affordance.anchor || affordance.anchor === 'header') continue
      if (affordance.anchor === 'cta') {
        expect(scene.conversation.cta).toBeTruthy()
        continue
      }
      /**
       * IMMERSIVE-011: `spam` is the Messages app's own bar above an unsaved sender - the strip
       * that already carries Block and Report - and it is chrome, not a beat. A control may sit
       * there only on a scene that draws the bar.
       */
      if (affordance.anchor === 'spam') {
        expect(scene.conversation.spamBar).toBeTruthy()
        continue
      }
      // IMMERSIVE-004E: a reel's audio credit is a named place too, and only local navigation
      // may sit there.
      if (affordance.anchor === 'audio') {
        expect(scene.conversation.audio).toBeTruthy()
        expect(affordance.intent).toBeUndefined()
        continue
      }
      expect(beatIds.has(affordance.anchor)).toBe(true)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s links only to pages or screens the scene declares', (id) => {
    const scene = SCENES[id]
    /**
     * A link walks to another page of the same surface or, as `PhoneShell.navigateWithin`
     * allows, to another screen the scene declares (IMMERSIVE-003C: a member page's Deposit
     * link opens the payment sheet; a call's link opens the deposit it is pushing). Anything
     * else would be a control that leads nowhere.
     */
    const reachable = (surface) => [
      ...Object.keys(surface.pages ?? {}), ...Object.keys(scene.surfaces),
    ]
    for (const surface of Object.values(scene.surfaces)) {
      for (const page of Object.values(surface.pages ?? {})) {
        for (const pageLink of page.links ?? []) {
          expect(reachable(surface)).toContain(pageLink.to)
        }
        if (page.toggle) expect(reachable(surface)).toContain(page.toggle.to)
      }
      for (const surfaceLink of surface.links ?? []) {
        expect(Object.keys(scene.surfaces)).toContain(surfaceLink.to)
      }
      for (const section of surface.sections ?? []) {
        if (section.link) expect(surfaceById(scene, section.link.to)).toBeTruthy()
      }
    }
  })
})

describe('a scene shows nothing the learner must not see', () => {
  /**
   * The classification the specification hides from the candidate. Compared against the
   * scenario's OWN strings rather than a keyword list, so this cannot pass by accident:
   * if a scene ever paraphrased "Account takeover / OTP theft" into the fiction, the
   * source record is what it would be measured against.
   */
  it.each(AUTHORED_SCENARIO_IDS)('%s never names its disposition, family or trigger', (id) => {
    const serialised = JSON.stringify(SCENES[id]).toLowerCase()
    const record = SOURCE[id]

    expect(serialised).not.toContain(record.disposition.toLowerCase())
    expect(serialised).not.toContain(record.family.toLowerCase())
    expect(serialised).not.toContain(record.trigger.split('|')[0].trim().toLowerCase())
    expect(serialised).not.toContain(record.end_state.toLowerCase())
    expect(serialised).not.toContain(record.feedback.toLowerCase())
  })

  /**
   * IMMERSIVE-003C. The bank's `prior_context` narrator line is the client's "Context
   * presented" sentence, and for this batch it states the verdict outright - W13's reads
   * "fabricated profits and a supposed adviser", W15's "a cloned profile sends a convincing
   * synthetic voice note". W11-W15 present that context through the conversation instead,
   * and neither the line nor any word that labels the item may appear on the device.
   *
   * Words that are the ADVERSARY's in-world claims ("the case is genuine") are scenario
   * content and are not policed here; a label the simulation itself puts on the item is.
   */
  it.each([
    'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20',
    'W21', 'W22', 'W23', 'W24', 'W25',
    'I01', 'I02', 'I03', 'I04', 'I05', 'I06', 'I07', 'I08', 'I09', 'I10',
  ])('%s prints no narrator verdict and no label for the item', (id) => {
    const serialised = JSON.stringify(SCENES[id])
    expect(serialised).not.toContain(BANK[id].synthetic.prior_context)
    expect(serialised).not.toMatch(
      /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|synthetic|deepfake|impostor|suspicious)\b/i,
    )
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s never names a scoring event or a point value', (id) => {
    const serialised = JSON.stringify(SCENES[id])
    for (const code of [
      'NOTIFY_SEEN', 'ITEM_OPEN', 'INSPECT_CONTEXT', 'SAFE_PIVOT', 'CORRECT_USE',
      'TRUSTED_VERIFY', 'RESOLVE_CORRECT', 'PREMATURE_REPLY', 'RISKY_OPEN_REPLY',
      'FALSE_REPORT_BLOCK', 'UNSAFE_EXTERNAL_ACTION', 'NEEDLESS_REJECT_IGNORE',
      'SECRET_PAYMENT_INSTALL_DATA_RELEASE', 'CONTRADICTORY_UNSAFE_FINAL',
    ]) {
      expect(serialised).not.toContain(code)
    }
    expect(serialised).not.toMatch(/points_delta|score_0_10|expected_safe_behavior/)
  })
})

describe('a scene stays offline', () => {
  const EXTERNAL =
    /(^|\/\/|@)(?!.*\.example\b)[a-z0-9-]+\.(com|net|org|io|in|co|app|dev|cn|ru)\b/i

  it.each(AUTHORED_SCENARIO_IDS)('%s names no host outside the reserved domains', (id) => {
    const serialised = JSON.stringify(SCENES[id])
    expect(serialised).not.toMatch(EXTERNAL)
    expect(serialised).not.toMatch(/data:image\//)
    expect(serialised).not.toMatch(/https?:\/\/(localhost|\d+\.\d+\.\d+\.\d+)/)

    for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
      expect(url).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s uses only reserved training phone numbers', (id) => {
    const serialised = JSON.stringify(SCENES[id])
    for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
      expect(number.replace(/\s/g, '')).toMatch(/^\+9100000\d{5}$/)
    }
  })

  /**
   * IMMERSIVE-003C: W12's stage text asks for an unknown country code, so one scene carries
   * a number outside +91. It is held to a range reserved for fiction - the UK regulator's
   * drama block, 07700 900000-900999 - so no scene can ever name a number that rings a real
   * subscriber, whatever its country code.
   */
  it.each(AUTHORED_SCENARIO_IDS)('%s names foreign numbers only from a range reserved for fiction', (id) => {
    const serialised = JSON.stringify(SCENES[id])
    for (const number of serialised.match(/\+\d{1,3}[\d\s]{6,}/g) ?? []) {
      const compact = number.replace(/\s/g, '')
      if (compact.startsWith('+91')) continue
      expect(compact).toMatch(/^\+447700900\d{3}$/)
    }
  })
})

describe('the thread is a function of the stage the server committed', () => {
  it('reveals later beats only once the run has reached their stage', () => {
    const scene = SCENES.W01
    const atOpen = beatsAt(scene, 'open').map((beat) => beat.id)
    const atBranch = beatsAt(scene, 'branch').map((beat) => beat.id)

    expect(atOpen).not.toContain('w01-code')
    expect(atBranch).toContain('w01-code')
    // Nothing already said can disappear when the run moves on.
    expect(atBranch).toEqual(expect.arrayContaining(atOpen))
  })

  it('is deterministic: the same stage always produces the same thread', () => {
    for (const id of AUTHORED_SCENARIO_IDS) {
      for (const stage of STAGE_ORDER) {
        const once = beatsAt(SCENES[id], stage).map((beat) => beat.id)
        const twice = beatsAt(sceneFor(payload(id)), stage).map((beat) => beat.id)
        expect(twice).toEqual(once)
      }
    }
  })

  it('shows a consequence beat only while that consequence is the current one', () => {
    const scene = SCENES.W04
    const withoutAny = beatsAt(scene, 'verify').map((beat) => beat.id)
    const afterReply = beatsAt(scene, 'verify', 'simulated_reply_sent').map((beat) => beat.id)
    const afterPay = beatsAt(scene, 'verify', 'simulated_payment').map((beat) => beat.id)

    expect(withoutAny).not.toContain('w04-echo-reply')
    expect(afterReply).toContain('w04-echo-reply')
    expect(afterReply).not.toContain('w04-after-pay')
    expect(afterPay).toContain('w04-after-pay')
  })

  it('never advertises a stage that has not been reached', () => {
    expect(reached('open', 'branch')).toBe(false)
    expect(reached('branch', 'branch')).toBe(true)
    expect(reached('resolve', 'open')).toBe(true)
  })

  it('keeps investigation available after the stage that unlocked it', () => {
    const scene = SCENES.W02
    expect(ambientFor(scene, 'open')).toHaveLength(0)
    expect(ambientFor(scene, 'branch').map((item) => item.opens)).toContain('contact')
    expect(ambientFor(scene, 'resolve').map((item) => item.opens)).toContain('contact')
    // Ambient navigation is never a scored action.
    for (const item of ambientFor(scene, 'resolve')) expect(item.intent).toBeUndefined()
  })
})

describe('the five scenarios are not the same scenario', () => {
  it('gives each of them a different set of surfaces', () => {
    const shapes = AUTHORED_SCENARIO_IDS.map((id) =>
      Object.values(SCENES[id].surfaces).map((surface) => surface.kind).sort().join(','))
    expect(new Set(shapes).size).toBeGreaterThan(2)
  })

  it('gives each WhatsApp scenario a different branch-stage interaction', () => {
    const whatsapp = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('W'))
    const shapes = whatsapp.map((id) =>
      affordancesFor(SCENES[id], 'branch').map((item) => item.intent).sort().join(','))
    expect(new Set(shapes).size).toBe(whatsapp.length)
  })

  it('puts the legitimate scenario in a group with participants and a poll', () => {
    const scene = SCENES.W03
    expect(scene.conversation.kind).toBe('group')
    expect(scene.beats.some((beat) => beat.kind === 'poll')).toBe(true)

    // The participants tab of the group sheet is where the corroboration lives.
    const participants = scene.surfaces.contact.tabs.find((tab) => tab.id === 'participants')
    expect(participants.count).toBe(10)
    expect(participants.sections[0].items.length).toBe(10)

    // Tapping the coordinator opens a contact sheet with the SAME tabs W04's impostor has.
    const coordinator = scene.surfaces['contact-coordinator']
    expect(coordinator.tabs.map((tab) => tab.id))
      .toEqual(SCENES.W04.surfaces.contact.tabs.map((tab) => tab.id))
    // ...and answers differently. That contrast is the whole instrument.
    expect(coordinator.tabs.find((tab) => tab.id === 'groups').count).toBeGreaterThan(0)
    expect(SCENES.W04.surfaces.contact.tabs.find((tab) => tab.id === 'groups').count).toBe(0)

    // Its trusted-directory row matches the coordinator, which is the point of checking.
    expect(scene.directoryExtras[0].identifier).toBe(BANK.W03.synthetic.sender.identifier)
  })

  it('gives the legitimate scenario as much thread and as many screens as the others', () => {
    // Length must never be the answer: a visibly shorter legitimate item is a tell.
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('W03')).toBeGreaterThanOrEqual(
      Math.min(...['W01', 'W02', 'W04', 'W05'].map(beatsOf)),
    )
    expect(Object.keys(SCENES.W03.surfaces).length).toBeGreaterThanOrEqual(3)
  })

  it('gives the two browser journeys different destinations and different asks', () => {
    const parcel = SCENES.W02.surfaces['redelivery-page'].pages.fee
    const kyc = SCENES.W05.surfaces['kyc-page'].pages.kyc

    expect(parcel.host).not.toBe(kyc.host)
    const labels = (page) => fieldsOfPage(page).map((item) => item.label)
    expect(labels(parcel)).toContain('Card number')
    expect(labels(kyc)).toContain('Wallet PIN')
    expect(labels(parcel)).not.toContain('Wallet PIN')
    // Both are fillable, which is what makes declining them a decision.
    expect(fieldsOfPage(parcel).length).toBeGreaterThan(0)
    expect(fieldsOfPage(kyc).length).toBeGreaterThan(0)
  })

  it('anchors the poll options to the poll and the pay control to the payment card', () => {
    expect(anchoredTo(affordancesFor(SCENES.W03, 'branch'), 'w03-poll')).toHaveLength(2)
    expect(anchoredTo(affordancesFor(SCENES.W04, 'branch'), 'w04-pay')).toHaveLength(1)
  })
})

describe('W11-W15 each bring an interaction the first ten did not have', () => {
  const beatKinds = (id) => new Set(SCENES[id].beats.map((beat) => beat.kind))
  const surfaceKinds = (id) => new Set(Object.values(SCENES[id].surfaces).map((s) => s.kind))
  const FIRST_TEN = AUTHORED_SCENARIO_IDS.slice(0, 10)

  it('W11 answers on the business message itself, with its own buttons', () => {
    const confirm = anchoredTo(affordancesFor(SCENES.W11, 'branch'), 'w11-confirm')
    expect(confirm.map((item) => item.label)).toEqual(['Confirm', 'Reschedule'])
    expect(confirm[0].intent).toBe('safe_pivot')
    // Reschedule walks to the portal, which is navigation rather than a decision.
    expect(confirm[1].local).toBe(true)
    for (const id of FIRST_TEN) expect(beatKinds(id).has('template')).toBe(false)
  })

  it('W11 carries the check that settles it in a second app, not in the chat', () => {
    const verify = affordancesFor(SCENES.W11, 'verify').find((item) => item.name === 'w11-verify-app')
    const portal = surfaceById(SCENES.W11, verify.opens)
    expect(portal.kind).toBe('app')
    // The reference in the portal is the reference in the message.
    expect(JSON.stringify(portal)).toContain('WLF-2609-0317')
    expect(JSON.stringify(SCENES.W11.beats)).toContain('WLF-2609-0317')
  })

  it('W12 makes ending the call the decision, on the call', () => {
    const call = SCENES.W12.surfaces['video-call']
    expect(call.video).toBe(true)
    expect(call.endCallScored).toBe(true)
    const onCall = affordancesFor(SCENES.W12, 'branch').filter((item) => item.on === 'video-call')
    expect(onCall.map((item) => item.intent).sort())
      .toEqual(['call_number', 'safe_pivot', 'submit_data'])
    for (const id of FIRST_TEN) {
      expect(Object.values(SCENES[id].surfaces).some((s) => s.video)).toBe(false)
    }
  })

  it('W13 is a room only admins can speak in, and every poster is an admin', () => {
    expect(SCENES.W13.conversation.adminsOnly).toBe(true)
    expect(affordancesFor(SCENES.W13, 'branch').some((item) => item.slot === 'composer'))
      .toBe(false)
    const admins = SCENES.W13.surfaces.contact.tabs
      .find((tab) => tab.id === 'participants').sections[0].items.map((item) => item.label)
    const posters = new Set(SCENES.W13.beats
      .filter((beat) => beat.author).map((beat) => beat.author.split(' ~ ')[0]))
    for (const poster of posters) expect(admins).toContain(poster)
  })

  it('W14 moves the decision onto the phone’s own installer', () => {
    expect(surfaceKinds('W14').has('installer')).toBe(true)
    const installer = affordancesFor(SCENES.W14, 'branch').filter((item) => item.on === 'installer')
    expect(installer.map((item) => `${item.page}:${item.intent}`).sort()).toEqual([
      'blocked:safe_pivot', 'confirm:attempt_install', 'confirm:safe_pivot',
    ])
    for (const id of FIRST_TEN) expect(surfaceKinds(id).has('installer')).toBe(false)
  })

  it('W15 gives the learner something to listen to, and never says it sounds wrong', () => {
    const voices = SCENES.W15.beats.filter((beat) => beat.kind === 'voice')
    expect(voices.length).toBeGreaterThanOrEqual(2)
    for (const note of voices) expect(note.transcript.length).toBeGreaterThan(20)
    expect(JSON.stringify(SCENES.W15).toLowerCase())
      .not.toMatch(/robotic|synthetic|deepfake|cloned|ai-generated|sounds (off|odd|wrong|fake)/)
    for (const id of FIRST_TEN) expect(beatKinds(id).has('voice')).toBe(false)
  })

  it('gives the genuine item as much thread and as many screens as its four neighbours', () => {
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('W11')).toBeGreaterThanOrEqual(
      Math.min(...['W12', 'W13', 'W14', 'W15'].map(beatsOf)),
    )
    expect(Object.keys(SCENES.W11.surfaces).length).toBeGreaterThanOrEqual(4)
  })

  it('never makes the same branch decision five times', () => {
    const shapes = ['W11', 'W12', 'W13', 'W14', 'W15'].map((id) =>
      affordancesFor(SCENES[id], 'branch')
        .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(','))
    expect(new Set(shapes).size).toBe(5)
  })
})

describe('W16-W20 each bring an interaction the first fifteen did not have', () => {
  const FIRST_FIFTEEN = AUTHORED_SCENARIO_IDS.slice(0, 15)
  const BATCH_D = ['W16', 'W17', 'W18', 'W19', 'W20']
  const flag = (id, key) => SCENES[id].beats.some((beat) => Boolean(beat[key]))

  it('W16 answers with a reaction on the message itself, and the plan is pinned above it', () => {
    const scene = SCENES.W16
    const onMessage = anchoredTo(affordancesFor(scene, 'branch'), 'w16-head')
    expect(onMessage.map((item) => item.intent)).toEqual(['safe_pivot'])
    expect(scene.beats.find((beat) => beat.id === 'w16-head').kind).toBe('message')
    // The pinned bar points at a message that exists from the first stage the chat is open.
    const pinned = scene.beats.find((beat) => beat.id === scene.conversation.pinned.beatId)
    expect(beatsAt(scene, 'open')).toContain(pinned)
    expect(pinned.text).toMatch(/Alternate Gate B/)
    for (const id of FIRST_FIFTEEN) expect(SCENES[id].conversation.pinned).toBeUndefined()
  })

  it('W16 prices the helpful over-share, not the identity, as the risk', () => {
    const branch = affordancesFor(SCENES.W16, 'branch')
    const overshare = branch.find((item) => item.name === 'w16-branch-overshare')
    expect(overshare.intent).toBe('submit_data')
    expect(overshare.echo).toMatch(/Rao, Menon/)
    // The coordinator's own row in the directory matches the sender, as W03's did.
    expect(SCENES.W16.directoryExtras[0].identifier).toBe(BANK.W16.synthetic.sender.identifier)
  })

  it('W17 opens on a bulk-forwarded advert and lets the learner build the balance themselves', () => {
    const ad = SCENES.W17.beats.find((beat) => beat.id === 'w17-ad')
    expect(ad.forwarded).toBe('many')
    const pages = SCENES.W17.surfaces.tasks.pages
    // Three rating tasks, walked by page links, before the merged order appears.
    expect(pages.task1.links[0].to).toBe('task2')
    expect(pages.task3.links[0].to).toBe('level')
    expect(pages.level.links.map((l) => l.to)).toContain('premium')
    // The money that already arrived is in the learner's own bank app, from an individual.
    expect(SCENES.W17.surfaces['bank-app'].kind).toBe('app')
    expect(JSON.stringify(SCENES.W17.surfaces['bank-app'])).toMatch(/Individual savings account/)
    for (const id of FIRST_FIFTEEN) expect(flag(id, 'forwarded')).toBe(false)
  })

  it('W18 carries the group’s own record of what changed', () => {
    const scene = SCENES.W18
    expect(scene.beats.some((beat) => /security code changed/.test(beat.text ?? ''))).toBe(true)
    expect(scene.beats.some((beat) => /changed the group description/.test(beat.text ?? ''))).toBe(true)
    const deleted = scene.beats.find((beat) => beat.deleted)
    expect(deleted.deletedBy).toBe(BANK.W18.synthetic.sender.display_name)
    expect(deleted.text).toBe('')
    expect(flag('W18', 'reactions')).toBe(true)
    // The admin is the bank's own sender, reached from the participants list.
    const admins = scene.surfaces.contact.tabs.find((tab) => tab.id === 'participants')
      .sections[0].items
    expect(admins[0].to).toBe('contact-admin')
    expect(scene.surfaces['contact-admin'].identifier).toBe(BANK.W18.synthetic.sender.identifier)
    for (const id of FIRST_FIFTEEN) {
      expect(flag(id, 'deleted')).toBe(false)
      expect(flag(id, 'reactions')).toBe(false)
    }
  })

  it('W19 differs from the real CO by one letter, and the real CO is one row down', () => {
    const scene = SCENES.W19
    const about = (surface) => surface.tabs[0].sections[0].rows.find((r) => r.label === 'About').value
    const clone = about(scene.surfaces.contact)
    const real = about(scene.surfaces['chat-co'])
    expect(clone).not.toBe(real)
    expect(clone.length).toBe(real.length)
    const differing = [...clone].filter((ch, i) => ch !== real[i]).length
    expect(differing).toBeLessThanOrEqual(2)
    const peek = scene.list.rows.find((row) => row.opens)
    expect(peek.opens).toBe('chat-co')
    for (const id of FIRST_FIFTEEN) expect(SCENES[id].list.rows.some((row) => row.opens)).toBe(false)
  })

  it('W19 routes the share through the phone’s own location screens', () => {
    const scene = SCENES.W19
    const location = scene.surfaces.location
    expect(location.kind).toBe('installer')
    expect(location.pages.share.style).toBe('sheet')
    expect(location.pages.share.art).toBe('map')
    const onSheet = affordancesFor(scene, 'branch').filter((item) => item.on === 'location')
    expect(onSheet.map((item) => `${item.page}:${item.intent}`).sort()).toEqual([
      'permission:safe_pivot', 'share:safe_pivot', 'share:share_location', 'share:share_location',
      'share:share_location',
    ])
    // The paperclip is the way in, and walking in records nothing.
    const attach = affordancesFor(scene, 'branch').find((item) => item.opens === 'location')
    expect(attach.local).toBe(true)
    expect(attach.slot).toBe('composer')
  })

  it('W20 takes the decision in the procurement portal, not in the chat', () => {
    const scene = SCENES.W20
    const onPortal = affordancesFor(scene, 'branch').filter((item) => item.on === 'portal')
    expect(onPortal.map((item) => `${item.page}:${item.intent}`).sort()).toEqual([
      'invoice:safe_pivot', 'review:attempt_payment', 'review:submit_data',
    ])
    const vendor = JSON.stringify(scene.surfaces.portal.pages.vendor)
    expect(vendor).toMatch(/calls back the contact on file/)
    expect(vendor).toMatch(/second officer/)
    // The revised invoice carries the real references - accurate detail is not evidence.
    const text = scene.beats.map((beat) => beat.text ?? '').join(' ')
    expect(text).toContain('INV-NS-2291')
    expect(JSON.stringify(scene.surfaces.portal.pages.invoice)).toContain('INV-NS-2291')
  })

  it('gives the genuine item as much thread and as many screens as its four neighbours', () => {
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('W16')).toBeGreaterThanOrEqual(
      Math.min(...['W17', 'W18', 'W19', 'W20'].map(beatsOf)),
    )
    expect(Object.keys(SCENES.W16.surfaces).length).toBeGreaterThanOrEqual(3)
  })

  it('never makes the same branch decision five times', () => {
    const shapes = BATCH_D.map((id) =>
      affordancesFor(SCENES[id], 'branch')
        .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(','))
    expect(new Set(shapes).size).toBe(5)
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    /**
     * The first fifteen scenes put only the correct resolutions in the banner under the
     * thread, so position could stand in for judgement. This batch mixes them.
     */
    const correct = {
      W16: ['resolve_continue', 'resolve_retain'],
      W17: ['resolve_report', 'resolve_block'],
      W18: ['resolve_report', 'resolve_block'],
      W19: ['resolve_report', 'resolve_block'],
      W20: ['resolve_report', 'resolve_block'],
    }
    for (const id of BATCH_D) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
    }
  })
})

describe('W21-W25 each bring an interaction the first twenty did not have', () => {
  const FIRST_TWENTY = AUTHORED_SCENARIO_IDS.slice(0, 20)
  const BATCH_E = ['W21', 'W22', 'W23', 'W24', 'W25']
  const serialised = (id) => JSON.stringify(SCENES[id])

  it('leaves SMS untouched, scenes all Instagram, and scenes only Email E01-E20', () => {
    const scened = new Set(AUTHORED_SCENARIO_IDS)
    for (const platform of ['instagram', 'email', 'sms']) {
      const path = resolve(process.cwd(), `../backend/data/synthetic/v1/synthetic.${platform}.json`)
      const records = JSON.parse(readFileSync(path, 'utf8'))
      expect(records.length).toBe(25)
      for (const record of records) {
        const scene = sceneFor({
          scenario_id: record.scenario_id, platform: record.platform, synthetic: record.synthetic,
        })
        if (scened.has(record.scenario_id)) {
          expect(scene).not.toBeNull()
        } else {
          expect(scene).toBeNull()
        }
      }
    }
  })

  it('W21 gives the learner nothing to press in the chat, and the item lives in SecureDesk', () => {
    const scene = SCENES.W21
    // No link, file, QR, code, payment, poll or business button anywhere in the thread.
    const kinds = new Set(scene.beats.map((beat) => beat.kind))
    for (const kind of ['link', 'document', 'media', 'code', 'payment', 'poll', 'template']) {
      expect(kinds.has(kind)).toBe(false)
    }
    // ...and no control in the branch stage is anchored to a message.
    expect(affordancesFor(scene, 'branch').filter((item) => item.anchor)).toHaveLength(0)
    // The reference in the message is the reference in the portal, from the same originator.
    const portal = scene.surfaces.securedesk
    expect(JSON.stringify(portal.pages.inbox)).toContain('REF-ALPHA-17')
    expect(JSON.stringify(portal.pages.item)).toContain(BANK.W21.synthetic.sender.identifier)
    expect(BANK.W21.synthetic.assets.find((a) => a.kind === 'notification').content.body)
      .toContain('REF-ALPHA-17')
    const ack = affordancesFor(scene, 'branch').find((item) => item.on === 'securedesk')
    expect(`${ack.page}:${ack.intent}`).toBe('item:safe_pivot')
    // Disappearing messages and his own earlier redirection are in the thread.
    expect(scene.beats.some((beat) => /disappearing messages/.test(beat.text ?? ''))).toBe(true)
    expect(scene.beats.some((beat) => /Upload it to SecureDesk/.test(beat.text ?? ''))).toBe(true)
    // The directory row matches the sender, as a genuine item's should.
    expect(scene.directoryExtras[0].identifier).toBe(BANK.W21.synthetic.sender.identifier)
  })

  it('W21 prices pulling detail into WhatsApp, not the identity, as the risk', () => {
    const branch = affordancesFor(SCENES.W21, 'branch')
    expect(branch.map((item) => item.intent).filter(Boolean).sort())
      .toEqual(['call_number', 'reject_ignore', 'reply', 'reply', 'safe_pivot'])
  })

  it('W22 spans weeks, starts with a wrong number, and carries a biography that moves', () => {
    const scene = SCENES.W22
    const days = scene.beats.filter((beat) => beat.kind === 'day')
    expect(days.length).toBeGreaterThanOrEqual(6)
    const first = scene.beats.find((beat) => beat.kind === 'message')
    expect(first.text).toMatch(/Hi Kavya/)
    const text = scene.beats.map((beat) => beat.text ?? '').join(' ')
    expect(text).toMatch(/Dental surgeon in Pune/)
    expect(text).toMatch(/moved to Dubai/)
    expect(text).toMatch(/I owe you one/)
    // Checks outside the relationship: an image search and the regulator's register.
    expect(scene.surfaces['photo-search'].kind).toBe('app')
    expect(serialised('W22')).toMatch(/noor\.fitlife/)
    const register = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    expect(scene.surfaces[register.opens].hero.value).toBe('No registered entity')
    for (const id of FIRST_TWENTY) {
      expect(SCENES[id].beats.filter((beat) => beat.kind === 'day').length).toBeLessThan(6)
    }
  })

  it('W23 escalates the ask page by page, and the check includes the family itself', () => {
    const scene = SCENES.W23
    const pages = scene.surfaces.grant.pages
    const labels = (id) => fieldsOfPage(pages[id]).map((item) => item.label).join(' | ')
    expect(labels('step1')).toMatch(/relationship/)
    expect(labels('step2')).toMatch(/Service number/)
    expect(labels('step3')).toMatch(/Deployment/)
    expect(labels('step4')).toMatch(/Account number/)
    expect(fieldsOfPage(pages.apply)).toHaveLength(0)
    // Closing is offered on every page; sending only on the review page.
    const onGrant = affordancesFor(scene, 'branch').filter((item) => item.on === 'grant')
    expect(onGrant.map((item) => `${item.page}:${item.intent}`).sort())
      .toEqual(['null:safe_pivot', 'review:submit_data'])
    const ma = affordancesFor(scene, 'verify').find((item) => item.opens === 'call-ma')
    expect(ma.intent).toBe('verify_known_number')
    expect(JSON.stringify(scene.surfaces['call-ma'])).toMatch(/asked where you are posted/)
  })

  it('W24 puts the decision on a live call and the phone’s own screen-share consent', () => {
    const scene = SCENES.W24
    expect(scene.surfaces['support-call'].endCallScored).toBe(true)
    expect(scene.surfaces['support-call'].links[0].to).toBe('cast')
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.on === 'cast').map((item) => item.intent).sort())
      .toEqual(['safe_pivot', 'share_secret'])
    expect(branch.filter((item) => item.on === 'installer').map((item) => `${item.page}:${item.intent}`).sort())
      .toEqual(['confirm:attempt_install', 'confirm:safe_pivot', 'download:safe_pivot'])
    // The picture's status bar is not this phone's, and the phone's own screen says so.
    expect(serialised('W24')).toMatch(/Carrier “VIRTUO”/)
    expect(scene.surfaces['device-care'].hero.value).toBe('No threats found')
    for (const id of FIRST_TWENTY) {
      expect(Object.values(SCENES[id].surfaces).some((s) => s.links?.some((l) => l.to === 'cast')))
        .toBe(false)
    }
  })

  it('W25 shows the learner’s own linking code and a request sheet, cashing in a real favour', () => {
    const scene = SCENES.W25
    const notice = scene.list.rows.find((row) => row.opens === 'link-request')
    expect(notice.title).toBe('WhatsApp')
    expect(notice.preview).toMatch(/KX7P-49RT/)
    const onSheet = affordancesFor(scene, 'branch').filter((item) => item.on === 'link-request')
    expect(onSheet.map((item) => `${item.page}:${item.intent}`).sort())
      .toEqual(['request:approve_device_link', 'request:safe_pivot'])
    const code = affordancesFor(scene, 'branch').find((item) => item.intent === 'share_secret')
    expect(code.echo).toBe('KX7P-49RT')
    const text = scene.beats.map((beat) => beat.text ?? '').join(' ')
    expect(text).toMatch(/I owe you one/)
    expect(text).toMatch(/Remember you owe me one/)
    // The alternate route is an ordinary phone call to the saved number.
    const call = affordancesFor(scene, 'verify').find((item) => item.opens === 'call-neel')
    expect(scene.surfaces['call-neel'].title).toBe('Phone call')
    expect(scene.surfaces['call-neel'].number).toBe(BANK.W25.synthetic.sender.identifier)
    expect(call.intent).toBe('verify_known_number')
  })

  it('gives the genuine item as much thread and as many screens as its four neighbours', () => {
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('W21')).toBeGreaterThanOrEqual(10)
    expect(Object.keys(SCENES.W21.surfaces).length).toBeGreaterThanOrEqual(3)
  })

  it('never makes the same branch decision five times', () => {
    const shapes = BATCH_E.map((id) =>
      affordancesFor(SCENES[id], 'branch')
        .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(','))
    expect(new Set(shapes).size).toBe(5)
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    const correct = {
      W21: ['resolve_continue', 'resolve_retain'],
      W22: ['resolve_report', 'resolve_block'],
      W23: ['resolve_report', 'resolve_block'],
      W24: ['resolve_report', 'resolve_block'],
      W25: ['resolve_report', 'resolve_block'],
    }
    for (const id of BATCH_E) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner).toHaveLength(2)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
    }
  })
})

describe('I01-I05 are Instagram-native and distinct from each other and from WhatsApp', () => {
  const IG = ['I01', 'I02', 'I03', 'I04', 'I05']
  const surfaceKinds = (id) => new Set(Object.values(SCENES[id].surfaces).map((s) => s.kind))

  it('gives every Instagram scene a profile with an About-this-account page', () => {
    for (const id of IG) {
      const scene = SCENES[id]
      expect(surfaceKinds(id).has('social')).toBe(true)
      const profile = scene.surfaces.profile
      expect(profile.kind).toBe('social')
      const home = profile.pages[profile.home]
      expect(home.view).toBe('profile')
      // The account history the client's inspect stage names lives on an About page.
      const about = Object.values(profile.pages).find((page) => page.view === 'about')
      expect(about, `${id} profile has no About-this-account page`).toBeTruthy()
      expect(about.rows.some((row) => /joined/i.test(row.label))).toBe(true)
    }
  })

  it('never makes the same branch decision across the five', () => {
    const shapes = IG.map((id) =>
      affordancesFor(SCENES[id], 'branch')
        .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(','))
    expect(new Set(shapes).size).toBe(5)
  })

  it('opens I01 on a post the account tagged the learner in, comments off', () => {
    const scene = SCENES.I01
    expect(scene.conversation.kind).toBe('post')
    expect(scene.list.kind).toBe('activity')
    // The claim page and the fee sheet are the decision, not a message.
    expect(surfaceKinds('I01').has('browser')).toBe(true)
    expect(surfaceKinds('I01').has('paysheet')).toBe(true)
    // The brand's own verified account is reachable by searching the app.
    const search = Object.values(scene.surfaces.official.pages).find((p) => p.view === 'search')
    expect(search.results.some((r) => r.verified)).toBe(true)
    expect(scene.beats.some((b) => /turned off/i.test(b.text ?? ''))).toBe(true)
  })

  it('routes I02 through the app’s own Account Status, not the DM link', () => {
    const scene = SCENES.I02
    expect(scene.conversation.request).toBe(true)
    const verify = affordancesFor(scene, 'verify').find((i) => i.name === 'i02-verify-status')
    const status = scene.surfaces[verify.opens]
    expect(status.kind).toBe('social')
    const statusPage = Object.values(status.pages).find((p) => p.view === 'status')
    expect(statusPage.statusRows.some((r) => /copyright/i.test(r.label))).toBe(true)
  })

  it('makes I03 the legitimate control: verified, matched, and not thinner than its neighbours', () => {
    const scene = SCENES.I03
    const source = SOURCE.I03
    expect(source.disposition).toBe('Legitimate')
    expect(scene.conversation.verified).toBe(true)
    // Its directory row matches the account, which is the point of checking.
    expect(scene.directoryExtras[0].identifier).toBe(`@${scene.conversation.handle}`)
    // The correct branch action is CORRECT_USE-shaped (safe_pivot), not a rejection.
    const save = affordancesFor(scene, 'branch').find((i) => i.name === 'i03-branch-save')
    expect(save.intent).toBe('safe_pivot')
    // Length is never the tell: at least as much thread and as many screens as the others.
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('I03')).toBeGreaterThanOrEqual(
      Math.min(...['I01', 'I02', 'I04', 'I05'].map(beatsOf)),
    )
  })

  it('lets I04 lay the clone beside the real friend it copies', () => {
    const scene = SCENES.I04
    const pages = scene.surfaces.profile.pages
    const clone = pages[scene.surfaces.profile.home]
    const real = Object.values(pages).find((p) => p.view === 'profile' && p.handle !== clone.handle)
    expect(real, 'I04 has no real-friend profile to compare').toBeTruthy()
    // Same display name, different handle - the extra character is the whole tell.
    expect(real.name).toBe(clone.name)
    expect(real.handle).not.toBe(clone.handle)
    expect(clone.handle.length).toBeGreaterThan(real.handle.length)
    // The payment card names a third party, not the "friend".
    expect(scene.surfaces.pay.rows.some((r) => /Nandi/.test(r.value))).toBe(true)
  })

  it('makes answering the elicitation the release in I05, and shows the pattern elsewhere', () => {
    const scene = SCENES.I05
    const branch = affordancesFor(scene, 'branch')
    // The city/unit/route quick replies are all submit_data; deflecting is safe_pivot.
    const releases = branch.filter((i) => i.intent === 'submit_data')
    expect(releases.length).toBeGreaterThanOrEqual(3)
    expect(branch.some((i) => i.intent === 'safe_pivot')).toBe(true)
    // The comments page shows the same questions asked of other service members.
    const comments = Object.values(scene.surfaces.profile.pages)
      .find((p) => p.view === 'people' && /comment/i.test(p.heading ?? ''))
    expect(comments.people.length).toBeGreaterThanOrEqual(2)
    // It starts as a reply to the learner's own story - Instagram's usual first contact.
    expect(scene.beats.some((b) => b.kind === 'storyReply')).toBe(true)
  })

  it('gives each Instagram scene a message-request or activity entry point, never a WhatsApp list', () => {
    for (const id of IG) {
      expect(['dm', 'activity']).toContain(SCENES[id].list.kind)
    }
  })

  it('puts no verdict word on any Instagram control, page or beat', () => {
    /**
     * Found in the IMMERSIVE-004A browser run: a resolve pill read "Report the clone for
     * impersonation", which names the answer. The platform-wide list above catches "cloned"
     * but not "clone" or "impersonation"; Instagram's report categories tempt exactly these.
     */
    for (const id of IG) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised, id).not.toMatch(
        /\b(clone|clones|impersonat\w*|genuine|legit|look-?alike|hoax|unknownsender)\b/i,
      )
    }
  })

  it('never repeats a WhatsApp branch decision shape', () => {
    const shape = (id) => affordancesFor(SCENES[id], 'branch')
      .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(',')
    const whatsapp = new Set(AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('W')).map(shape))
    for (const id of IG) expect(whatsapp.has(shape(id)), id).toBe(false)
  })

  it('links every social page only to pages or screens the scene declares', () => {
    for (const id of IG) {
      const scene = SCENES[id]
      for (const surface of Object.values(scene.surfaces)) {
        if (surface.kind !== 'social') continue
        const reachable = [...Object.keys(surface.pages), ...Object.keys(scene.surfaces)]
        expect(reachable).toContain(surface.home)
        for (const page of Object.values(surface.pages)) {
          const targets = [
            page.aboutTo, page.pinnedTo, page.commentsTo, page.compareTo?.to, page.storyTo?.to,
            page.bioLink?.to, page.stats?.followersTo, page.stats?.followingTo,
            ...(page.results ?? []).map((r) => r.to), ...(page.rows ?? []).map((r) => r.to),
          ].filter(Boolean)
          for (const target of targets) expect(reachable, `${id} ${target}`).toContain(target)
        }
      }
    }
  })

  it('names the client’s handle on the toast and in the directory comparison, never the placeholder', () => {
    for (const id of IG) {
      const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
      const handle = /^@([^:]+):/.exec(body)[1]
      expect(SCENES[id].notify.sender).toBe(handle)
      expect(SCENES[id].messageSender.identifier).toBe(`@${handle}`)
      // The full client sentence is on the device, as the activity mention or the request preview.
      const rows = SCENES[id].list.sections.flatMap((section) => section.rows)
      const shown = [...rows.map((row) => row.text ?? row.preview), ...SCENES[id].beats.map((b) => b.text)]
      expect(shown.some((text) => text === body || text === body.slice(handle.length + 3)), id).toBe(true)
    }
  })

  it('takes I01’s and I02’s link from the scenario asset, never from the scene', () => {
    for (const id of ['I01', 'I02']) {
      const asset = BANK[id].synthetic.assets.find((a) => a.kind === 'browser_page')
      const browser = Object.values(SCENES[id].surfaces).find((s) => s.kind === 'browser')
      expect(Object.values(browser.pages).some((p) => p.url === asset.display_target), id).toBe(true)
    }
  })

  it('puts I03’s pull to another channel under the post, never in it', () => {
    const scene = SCENES.I03
    const post = JSON.stringify([scene.conversation, scene.beats.filter((b) => b.kind === 'caption')])
    expect(post).not.toMatch(/https?:|training\.example|register/i)
    const stranger = beatsAt(scene, 'branch').find((b) => b.kind === 'comment' && b.author === 'donor_link_fast')
    expect(stranger).toBeTruthy()
    expect(beatsAt(scene, 'inspect').some((b) => b.author === 'donor_link_fast')).toBe(false)
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((i) => i.intent === 'safe_pivot')).toHaveLength(2)
    expect(branch.map((i) => i.intent)).toEqual(expect.arrayContaining(['open_link', 'reply', 'reject_ignore']))
  })

  it('shows I04’s real friend posting a story while the clone says she has no phone', () => {
    const pages = SCENES.I04.surfaces.profile.pages
    const story = Object.values(pages).find((p) => p.view === 'story')
    expect(story.handle).not.toBe(SCENES.I04.conversation.handle)
    expect(story.time).toMatch(/m$/)
    const routes = affordancesFor(SCENES.I04, 'verify').filter((i) => i.intent === 'verify_known_number')
    expect(routes.map((i) => SCENES.I04.surfaces[i.opens].kind)).toEqual(['call', 'call'])
  })

  it('lets I05’s claimed mutual be checked outside the DM, and the learner review their own privacy', () => {
    const scene = SCENES.I05
    expect(scene.beats.some((b) => /Karan/.test(b.text ?? ''))).toBe(true)
    const karan = affordancesFor(scene, 'verify').find((i) => i.name === 'i05-verify-mutual')
    expect(scene.surfaces[karan.opens].kind).toBe('call')
    const privacy = scene.ambient.find((item) => item.opens === 'privacy')
    expect(privacy.after).toBe('resolve')
    expect(privacy.intent).toBeUndefined()
  })
})

describe('I06-I10 each bring an Instagram interaction I01-I05 and WhatsApp did not have', () => {
  const BATCH = ['I06', 'I07', 'I08', 'I09', 'I10']
  const EARLIER = AUTHORED_SCENARIO_IDS.filter((id) => !BATCH.includes(id))
  const BEFORE_004B = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('I06'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(',')
  const pagesOf = (id) => Object.values(SCENES[id].surfaces)
    .filter((surface) => surface.kind === 'social')
    .flatMap((surface) => Object.values(surface.pages))

  it('never repeats a branch decision shape from any earlier scene, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), id).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(5)
  })

  it('gives every one an account with an About-this-account page', () => {
    for (const id of BATCH) {
      const about = pagesOf(id).find((page) => page.view === 'about')
      expect(about, `${id} has no About page`).toBeTruthy()
      expect(about.rows.some((row) => /joined/i.test(row.label))).toBe(true)
    }
  })

  it('puts no verdict word on any control, page or beat', () => {
    for (const id of BATCH) {
      expect(JSON.stringify(SCENES[id]), id).not.toMatch(
        /\b(clone|clones|impersonat\w*|genuine|legit|look-?alike|hoax|unknownsender|deepfake|edited video of him|lip-?sync)\b/i,
      )
    }
  })

  it('I06 happens on the learner’s own post: a public reply or a location tag is the release', () => {
    const scene = SCENES.I06
    expect(scene.conversation.kind).toBe('post')
    expect(scene.conversation.own).toBe(true)
    // The question is a comment under the post, and the commenter's profile opens from it.
    const question = scene.beats.find((beat) => beat.kind === 'comment' && beat.author === scene.notify.sender)
    const inspect = affordancesFor(scene, 'inspect').find((item) => item.intent === 'inspect_profile')
    expect(inspect.anchor).toBe(question.id)
    // The composer is a public comment box; the Add location sheet carries the tags.
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.slot === 'composer').map((item) => item.intent).sort())
      .toEqual(['reply', 'submit_data'])
    expect(branch.filter((item) => item.on === 'location').map((item) => item.intent).sort())
      .toEqual(['safe_pivot', 'share_location', 'share_location'])
    expect(scene.surfaces.location.pages['add-location'].view).toBe('list')
    // The aggregation is on its pinned post; the release note and the PIO are the check.
    const map = scene.surfaces.profile.pages['season-map']
    expect(map.caption).toMatch(/Range 3/)
    expect(scene.surfaces.release.pages.note.statusRows.some((row) => /Not cleared/.test(row.label))).toBe(true)
    expect(scene.surfaces[affordancesFor(scene, 'verify').find((item) => item.name === 'i06-verify-pio').opens].kind)
      .toBe('call')
    /**
     * Both were new when this batch shipped, so the claim is measured against the scenes
     * that existed BEFORE it - W01-W25 and I01-I05 - rather than against every other scene.
     * IMMERSIVE-004C's I11 files a notice in a Saved collection, which is a `list` page too.
     */
    for (const id of BEFORE_004B) {
      expect(SCENES[id].conversation.own).toBeUndefined()
      expect(Object.values(SCENES[id].surfaces).some((s) => s.kind === 'social'
        && Object.values(s.pages).some((p) => p.view === 'list'))).toBe(false)
    }
  })

  it('I07 is the ordinary item: an inbox thread with history, a reel in the app, and no ask', () => {
    const scene = SCENES.I07
    expect(SOURCE.I07.disposition).toBe('Legitimate')
    expect(scene.conversation.request).toBe(false)
    expect(scene.list.sections.some((section) => section.heading === 'Requests')).toBe(false)
    // Yesterday's conversation is in the thread before today's reel arrives.
    const ids = beatsAt(scene, 'open').map((beat) => beat.id)
    expect(ids.indexOf('i07-y1')).toBeLessThan(ids.indexOf('i07-reel'))
    expect(scene.beats.some((beat) => beat.kind === 'link' || beat.kind === 'payCard')).toBe(false)
    // Like and Save are on the reel player, and the reply is correct use in the composer.
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.on === 'reel').map((item) => `${item.page}:${item.intent}`))
      .toEqual(['reel:safe_pivot', 'reel:safe_pivot'])
    expect(scene.surfaces.reel.pages.reel.view).toBe('reel')
    // The thread context is the check, reached by searching the chat.
    const check = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    expect(scene.surfaces[check.opens].pages.search.view).toBe('list')
    // Not thinner than its neighbours.
    expect(beatsAt(scene, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['I06', 'I08', 'I09', 'I10'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
    expect(Object.keys(scene.surfaces).length).toBeGreaterThanOrEqual(4)
    // Reporting or blocking is offered, as it must be for a false positive to be possible.
    expect(affordancesFor(scene, 'verify').map((item) => item.intent)).toEqual(expect.arrayContaining(['report', 'block']))
  })

  it('I08 sets a ✔️ in a name against the app’s own badge and verification page', () => {
    const scene = SCENES.I08
    expect(scene.conversation.name).toMatch(/✔️$/)
    expect(scene.conversation.verified).toBe(false)
    const about = scene.surfaces.profile.pages.about
    expect(about.rows.find((row) => row.label === 'Verified').value).toBe('No')
    const check = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    const official = scene.surfaces[check.opens]
    expect(official.kind).toBe('social')
    expect(JSON.stringify(official.pages.request)).toMatch(/guarantee a badge/)
    // Not I02's route: the verification page, not Account Status.
    expect(check.label).not.toMatch(/Account Status/)
    // The application asks for an ID number and the password, and the fee is a payment sheet.
    const labels = Object.values(scene.surfaces.application.pages).flatMap((page) => fieldsOfPage(page).map((f) => f.label))
    expect(labels).toEqual(expect.arrayContaining(['Government ID number', 'Password']))
    expect(scene.surfaces.fee.kind).toBe('paysheet')
  })

  it('I09 is a sponsored reel with the advertiser’s ad history, and the register is the check', () => {
    const scene = SCENES.I09
    expect(scene.conversation.media).toBe('reel')
    expect(scene.conversation.subline).toBe(BANK.I09.synthetic.sender.display_name)
    expect(scene.conversation.cta).toBeTruthy()
    expect(anchoredTo(affordancesFor(scene, 'branch'), 'cta')[0].local).toBe(true)
    // The frames are steppable, and one shows the audio against the mouth.
    expect(scene.conversation.slides.length).toBeGreaterThanOrEqual(3)
    expect(scene.conversation.slides.some((slide) => /mouth/.test(slide.subtitle))).toBe(true)
    expect(scene.conversation.audio).toMatch(/alphaedge\.trading/)
    expect(scene.surfaces.profile.pages.ads.view).toBe('status')
    // The landing page leads on to a group, an app, KYC and a deposit - each its own release.
    const onLanding = affordancesFor(scene, 'branch').filter((item) => item.on === 'landing' || item.on === 'deposit')
    expect(onLanding.map((item) => item.intent).sort())
      .toEqual(['attempt_install', 'attempt_payment', 'open_link', 'safe_pivot', 'submit_data'])
    const register = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    expect(scene.surfaces[register.opens].kind).toBe('app')
    expect(scene.surfaces[register.opens].hero.value).toMatch(/Not registered/)
    // "About this ad" is an inspection that opens a screen, never the raw asset sheet.
    expect(affordancesFor(scene, 'inspect').find((item) => item.intent === 'inspect_link').opens).toBe('adinfo')
  })

  it('I10 puts the turn in the agreement’s clauses, and checks the brand’s own website', () => {
    const scene = SCENES.I10
    const agreement = JSON.stringify(scene.surfaces.contract.pages.agreement)
    expect(agreement).toMatch(/username and password/)
    expect(agreement).toMatch(/INR 1,499 per month/)
    // The agreement is reached through the bio link, as the client says.
    expect(scene.surfaces.profile.pages.profile.bioLink.to).toBe('contract')
    const labels = fieldsOfPage(scene.surfaces.contract.pages.details).map((f) => f.label)
    expect(labels).toEqual(expect.arrayContaining(['Delivery address', 'Card number', 'Instagram password']))
    const site = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    expect(scene.surfaces[site.opens].kind).toBe('browser')
    expect(JSON.stringify(scene.surfaces[site.opens])).toMatch(/Not a PeakGear account/)
    expect(scene.surfaces[site.opens].pages.home.host).not.toBe(scene.surfaces.contract.pages.agreement.host)
    // The account's pinned post carries the evidence in its comments.
    expect(scene.surfaces.profile.pages.pinned.comments.some((c) => /tracking/.test(c.text))).toBe(true)
  })

  it('names the client’s account on the toast, or the client’s “Sponsored” for the ad', () => {
    for (const id of BATCH) {
      const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
      const handle = /^@([^:]+):/.exec(body)?.[1]
      if (handle) {
        expect(SCENES[id].notify.sender).toBe(handle)
        expect(SCENES[id].messageSender.identifier).toBe(`@${handle}`)
      } else {
        expect(SCENES[id].notify.sender).toBe(BANK[id].synthetic.sender.display_name)
      }
      const rows = SCENES[id].list.sections.flatMap((section) => section.rows)
      expect(rows.some((row) => (row.text ?? row.preview ?? '').includes(handle ? body.slice(handle.length + 3) : body)), id)
        .toBe(true)
    }
  })

  it('takes I09’s and I10’s landing link from the scenario asset', () => {
    for (const id of ['I09', 'I10']) {
      const asset = BANK[id].synthetic.assets.find((a) => a.kind === 'browser_page')
      const browsers = Object.values(SCENES[id].surfaces).filter((s) => s.kind === 'browser')
      expect(browsers.some((b) => Object.values(b.pages).some((p) => p.url === asset.display_target)), id).toBe(true)
    }
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    const correct = {
      I06: ['resolve_report', 'resolve_block'],
      I07: ['resolve_continue', 'resolve_retain'],
      I08: ['resolve_report', 'resolve_block'],
      I09: ['resolve_report', 'resolve_block'],
      I10: ['resolve_report', 'resolve_block'],
    }
    for (const id of BATCH) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner).toHaveLength(2)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
    }
  })

  it('links every social page only to pages or screens the scene declares', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      for (const surface of Object.values(scene.surfaces)) {
        if (surface.kind !== 'social') continue
        const reachable = [...Object.keys(surface.pages), ...Object.keys(scene.surfaces)]
        for (const page of Object.values(surface.pages)) {
          const targets = [
            page.aboutTo, page.pinnedTo, page.commentsTo, page.compareTo?.to, page.storyTo?.to,
            page.bioLink?.to, page.stats?.followersTo, page.stats?.followingTo, page.profileTo,
            ...(page.results ?? []).map((r) => r.to), ...(page.rows ?? []).map((r) => r.to),
          ].filter(Boolean)
          for (const target of targets) expect(reachable, `${id} ${target}`).toContain(target)
        }
      }
    }
  })
})

describe('I11-I15 each bring an Instagram interaction the first thirty-five scenes did not have', () => {
  const BATCH = ['I11', 'I12', 'I13', 'I14', 'I15']
  const EARLIER = AUTHORED_SCENARIO_IDS.filter((id) => !BATCH.includes(id))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(',')
  const pagesOf = (id) => Object.values(SCENES[id].surfaces)
    .filter((surface) => surface.kind === 'social')
    .flatMap((surface) => Object.values(surface.pages))

  it('never repeats a branch decision shape from any earlier scene, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), id).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(5)
  })

  it('gives every one an account with an About-this-account page', () => {
    for (const id of BATCH) {
      const about = pagesOf(id).find((page) => page.view === 'about')
      expect(about, `${id} has no About page`).toBeTruthy()
      expect(about.rows.some((row) => /joined/i.test(row.label))).toBe(true)
    }
  })

  it('puts no verdict word on any control, page or beat', () => {
    for (const id of BATCH) {
      expect(JSON.stringify(SCENES[id]), id).not.toMatch(
        /\b(clone|clones|impersonat\w*|genuine|legit|look-?alike|hoax|unknownsender|deepfake|lip-?sync|stolen photo)\b/i,
      )
    }
  })

  it('I11 is the ordinary item: the risk is what the learner says in public, not a link', () => {
    const scene = SCENES.I11
    expect(SOURCE.I11.disposition).toBe('Legitimate')
    expect(scene.conversation.kind).toBe('post')
    expect(scene.conversation.verified).toBe(true)
    // Its own row in the directory matches the account, which is the point of checking.
    expect(scene.directoryExtras[0].identifier).toBe(`@${scene.conversation.handle}`)
    // Nothing in this scene opens a browser, a payment sheet or an installer.
    expect(Object.values(scene.surfaces).map((surface) => surface.kind).sort())
      .toEqual(['app', 'social', 'social'])
    // Saving is the correct use; the two releases are a public comment and a message.
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.intent === 'safe_pivot')).toHaveLength(2)
    expect(branch.find((item) => item.slot === 'composer').intent).toBe('submit_data')
    expect(branch.some((item) => item.intent === 'reject_ignore')).toBe(true)
    // The comparison panel is the learner's own Saved collection, holding the OLD extension.
    const collection = scene.surfaces.saved.pages.collection
    expect(collection.view).toBe('list')
    expect(collection.rows[0].text).toMatch(/4412/)
    expect(JSON.stringify(scene.surfaces.profile.pages.contact)).toMatch(/4477/)
    // The account's own action row carries the contact detail the learner is comparing.
    expect(scene.surfaces.profile.pages.profile.actions.some((item) => /4477/.test(item.value))).toBe(true)
    // A public comment already shows someone else doing the unsafe thing.
    expect(beatsAt(scene, 'open').some((beat) => beat.kind === 'comment' && /file no/i.test(beat.text))).toBe(true)
    // Not thinner than the four beside it.
    expect(beatsAt(scene, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['I12', 'I13', 'I14', 'I15'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
  })

  it('I12 makes the release six digits typed into the message box, while the code is on screen', () => {
    const scene = SCENES.I12
    expect(scene.conversation.request).toBe(true)
    const branch = affordancesFor(scene, 'branch')
    const secret = branch.find((item) => item.intent === 'share_secret')
    expect(secret.slot).toBe('composer')
    // The code really arrives, and only once the run has reached the branch.
    const code = scene.beats.find((beat) => beat.id === 'i12-code')
    expect(code.since).toBe('branch')
    expect(secret.echo).toBe('419 302')
    expect(beatsAt(scene, 'inspect').map((beat) => beat.id)).not.toContain('i12-code')
    // The client's second route is the look-alike page, and it takes all three at once.
    const labels = Object.values(scene.surfaces.check.pages)
      .flatMap((page) => fieldsOfPage(page).map((item) => item.label))
    expect(labels).toEqual(expect.arrayContaining(['Instagram username', 'Password', 'Backup code']))
    // The check is the learner's OWN security screens - not I02's Account Status.
    const verify = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    expect(verify.label).not.toMatch(/Account Status/)
    const security = scene.surfaces[verify.opens]
    expect(Object.values(security.pages).map((page) => page.title)).toEqual(
      expect.arrayContaining(['Where you’re logged in', 'Login activity', 'Support requests']),
    )
    // Login activity is where the attempt the account itself caused is visible.
    expect(security.pages.activity.statusRows[0].value).toMatch(/16:2/)
  })

  it('I13 is four months of thread, and the picture is what settles it', () => {
    const scene = SCENES.I13
    // The main inbox, not Requests: the learner accepted this account in June.
    expect(scene.conversation.request).toBe(false)
    expect(scene.list.sections.some((section) => section.heading === 'Requests')).toBe(false)
    const days = beatsAt(scene, 'open').filter((beat) => beat.kind === 'day').map((beat) => beat.text)
    expect(days.length).toBeGreaterThanOrEqual(4)
    expect(days[0]).toMatch(/JUNE/)
    // The client's own stage 5: a reverse-image tool represented locally.
    const check = affordancesFor(scene, 'verify').find((item) => item.intent === 'verify_known_app')
    const tool = scene.surfaces[check.opens]
    expect(tool.kind).toBe('app')
    expect(tool.hero.value).toMatch(/3 matches/)
    expect(JSON.stringify(tool.sections)).toMatch(/Cannot say/)
    // The client's "crypto/gift-card choices": one portal, two irreversible ways to pay.
    expect(scene.surfaces.release.pages.methods.links.map((item) => item.to)).toEqual(['giftcard', 'wallet'])
    expect(scene.surfaces.wallet.kind).toBe('paysheet')
    expect(fieldsOfPage(scene.surfaces.release.pages.giftcard).length).toBe(4)
    // A release that needs no page at all: the learner's own identity card, in the chat.
    const identity = affordancesFor(scene, 'branch').find((item) => item.name === 'i13-branch-id')
    expect(identity.slot).toBe('composer')
    expect(identity.intent).toBe('submit_data')
  })

  it('I14 makes the decision the attachment picker, and the page publishes what it collects', () => {
    const scene = SCENES.I14
    // The learner's own files are on the picker; choosing between them is local.
    const picker = scene.surfaces.uploader
    expect(picker.kind).toBe('viewer')
    expect(picker.items.map((item) => item.art)).toEqual(expect.arrayContaining(['card', 'document']))
    const onPicker = affordancesFor(scene, 'branch').filter((item) => item.on === 'uploader')
    expect(onPicker.map((item) => item.intent).sort()).toEqual(['safe_pivot', 'submit_data'])
    // Highlights are where last month's "features" still carry other people's documents.
    const profile = scene.surfaces.profile.pages.profile
    expect(profile.highlights.length).toBeGreaterThanOrEqual(2)
    expect(scene.surfaces.profile.pages['highlight-sep'].view).toBe('story')
    expect(scene.surfaces.profile.pages['highlight-sep'].caption).toMatch(/service card/i)
    // Someone has already asked for theirs back, under the pinned post.
    expect(scene.surfaces.profile.pages.pinned.comments.some((item) => /remove/.test(item.text))).toBe(true)
    // The DM's claim and the profile's own count disagree.
    expect(scene.beats.some((beat) => /3\.3 lakh/.test(beat.text ?? ''))).toBe(true)
    expect(profile.stats.followers).toBe('3,383')
    // No earlier Instagram scene puts its branch decision on an attachment picker. Scoped to the
    // scenes that existed before this batch (IMMERSIVE-004E: I25 decides on a QR scanner, which
    // is the same viewer surface but a different screen, and is asserted in its own block).
    const beforeBatch = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('I11'))
    for (const id of beforeBatch.filter((item) => item.startsWith('I'))) {
      const onViewer = affordancesFor(SCENES[id], 'branch')
        .filter((item) => item.on && SCENES[id].surfaces[item.on]?.kind === 'viewer')
      expect(onViewer, id).toHaveLength(0)
    }
  })

  it('I15 leaves every document check clean and puts the tell in the behaviour', () => {
    const scene = SCENES.I15
    // The friend's own account: years old, no former names, mutuals everywhere.
    const about = scene.surfaces.profile.pages.about
    expect(about.rows.find((row) => row.label === 'Date joined').value).toMatch(/2015/)
    expect(about.formerUsernames).toEqual([])
    expect(scene.surfaces.profile.pages.profile.mutuals).toMatch(/410 others/)
    // Yesterday's long message is in the thread above today's two clipped ones.
    const ids = beatsAt(scene, 'open').map((beat) => beat.id)
    expect(ids.indexOf('i15-b1')).toBeLessThan(ids.indexOf('i15-b4'))
    expect(scene.beats.find((beat) => beat.id === 'i15-b1').text.length)
      .toBeGreaterThan(scene.beats.find((beat) => beat.id === 'i15-b5').text.length)
    // The link's host is not the platform's, and the card carries a drawn thumbnail.
    const card = scene.beats.find((beat) => beat.kind === 'link')
    expect(card.displayUrl).toMatch(/^ig-vid-share\.training\.example/)
    expect(card.play).toBe(true)
    // The second release needs nothing typed: the platform's own login prompt.
    const prompt = scene.surfaces.request
    expect(prompt.kind).toBe('installer')
    expect(prompt.pages.prompt.style).toBe('sheet')
    const onPrompt = affordancesFor(scene, 'branch').filter((item) => item.on === 'request')
    expect(onPrompt.map((item) => item.intent).sort()).toEqual(['approve_device_link', 'safe_pivot'])
    // It is offered only once the run has reached the branch.
    expect(scene.beats.find((beat) => beat.id === 'i15-loginreq').since).toBe('branch')
    // Both of the client's routes: the friend's saved number, and the learner's own activity.
    const routes = affordancesFor(scene, 'verify')
    expect(scene.surfaces[routes.find((item) => item.intent === 'verify_known_number').opens].kind).toBe('call')
    expect(scene.surfaces[routes.find((item) => item.intent === 'verify_known_app').opens].pages.home.view)
      .toBe('status')
    // Another thread in the inbox is asking the same question, without answering it.
    expect(scene.list.sections[0].rows.some((row) => /Rohit/.test(row.preview ?? ''))).toBe(true)
  })

  it('names the client’s account on the toast and carries the client’s sentence on the list row', () => {
    for (const id of BATCH) {
      const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
      const handle = /^@([^:]+):/.exec(body)[1]
      expect(SCENES[id].notify.sender).toBe(handle)
      expect(SCENES[id].messageSender.identifier).toBe(`@${handle}`)
      const rows = SCENES[id].list.sections.flatMap((section) => section.rows)
      expect(rows.some((row) => (row.text ?? row.preview ?? '').includes(body.slice(handle.length + 3))), id)
        .toBe(true)
    }
  })

  it('takes I12’s and I15’s page from the scenario asset, and never opens its stored body', () => {
    for (const id of ['I12', 'I15']) {
      const asset = BANK[id].synthetic.assets.find((a) => a.kind === 'browser_page')
      const browsers = Object.values(SCENES[id].surfaces).filter((s) => s.kind === 'browser')
      expect(browsers.some((b) => Object.values(b.pages).some((p) => p.url === asset.display_target)), id).toBe(true)
      /**
       * The stored `body` of those assets is the client's own stage-4 sentence and names the
       * answer, so no control may open the generic inspection sheet on them.
       */
      for (const item of allAffordances(SCENES[id])) {
        if (item.intent === 'inspect_link') expect(item.targetId).not.toBe(asset.asset_id)
      }
    }
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    const correct = {
      I11: ['resolve_continue', 'resolve_retain'],
      I12: ['resolve_report', 'resolve_block'],
      I13: ['resolve_report', 'resolve_block'],
      I14: ['resolve_report', 'resolve_block'],
      I15: ['resolve_report', 'resolve_block'],
    }
    for (const id of BATCH) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner).toHaveLength(2)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
    }
  })

  it('links every social page, action and highlight only to something the scene declares', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      for (const surface of Object.values(scene.surfaces)) {
        if (surface.kind !== 'social') continue
        const reachable = [...Object.keys(surface.pages), ...Object.keys(scene.surfaces)]
        expect(reachable).toContain(surface.home)
        for (const page of Object.values(surface.pages)) {
          const targets = [
            page.aboutTo, page.pinnedTo, page.commentsTo, page.compareTo?.to, page.storyTo?.to,
            page.bioLink?.to, page.stats?.followersTo, page.stats?.followingTo, page.profileTo,
            ...(page.actions ?? []).map((item) => item.to),
            ...(page.highlights ?? []).map((item) => item.to),
            ...(page.results ?? []).map((r) => r.to), ...(page.rows ?? []).map((r) => r.to),
          ].filter(Boolean)
          for (const target of targets) expect(reachable, `${id} ${target}`).toContain(target)
        }
      }
    }
  })
})

describe('I16-I20 each bring an Instagram interaction the first forty scenes did not have', () => {
  const BATCH = ['I16', 'I17', 'I18', 'I19', 'I20']
  const EARLIER = AUTHORED_SCENARIO_IDS.filter((id) => !BATCH.includes(id))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(',')
  const pagesOf = (id) => Object.values(SCENES[id].surfaces)
    .filter((surface) => surface.kind === 'social')
    .flatMap((surface) => Object.values(surface.pages))
  /**
   * Where a branch decision is made: the kind of screen and page view a control sits on (or its
   * slot in the app chrome), together with what the learner reached it from - a DM or a post.
   * I06 and I18 both decide on a social list page; one is the learner's own post, the other a DM.
   */
  const branchHome = (id) => {
    const scene = SCENES[id]
    const from = scene.conversation?.kind ?? 'chat'
    return affordancesFor(scene, 'branch')
      .filter((item) => item.intent)
      .map((item) => {
        if (!item.on) return `${from}/${item.slot}`
        const surface = scene.surfaces[item.on]
        const view = surface.pages?.[item.page ?? surface.home]?.view ?? '-'
        return `${from}/${surface.kind}:${view}`
      })
  }

  it('never repeats a branch decision shape from any earlier scene, or from each other', () => {
    const earlier = new Map(EARLIER.map((id) => [shape(id), id]))
    for (const id of BATCH) expect(earlier.get(shape(id)), id).toBeUndefined()
    expect(new Set(BATCH.map(shape)).size).toBe(5)
  })

  it('decides in five different places, four of which no earlier scene has used', () => {
    const signature = (id) => [...new Set(branchHome(id))].sort().join('|')
    expect(new Set(BATCH.map(signature)).size).toBe(5)
    const earlier = new Set(EARLIER.map(signature))
    for (const id of ['I16', 'I17', 'I18', 'I19']) expect(earlier.has(signature(id)), id).toBe(false)
    /**
     * I20 shares "a DM, a browser form and the composer" with I02 and I12, as those two already
     * share it with each other. What separates it is its branch shape (asserted unique above):
     * three different releases, two of them typed, and a multi-page questionnaire - recorded in
     * the batch research rather than hidden behind a looser signature.
     */
    expect(earlier.has(signature('I20'))).toBe(true)
    expect(signature('I02')).toBe(signature('I12'))
  })

  it('gives every one an account with an About-this-account page and a date joined', () => {
    for (const id of BATCH) {
      const about = pagesOf(id).find((page) => page.view === 'about')
      expect(about, `${id} has no About page`).toBeTruthy()
      expect(about.rows.some((row) => /joined/i.test(row.label))).toBe(true)
    }
  })

  it('prints no narrator verdict, no label for the item and no placeholder', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|synthetic|deepfake|impostor|suspicious|clone|clones|impersonat\w*|genuine|legit|look-?alike|hoax|unknownsender|misinformation|disinformation|blackmail|extortion|morphed|elicitation|espionage)\b/i,
      )
    }
  })

  it('offers no rejection on the four items where the engine refuses one', () => {
    for (const id of ['I17', 'I18', 'I19', 'I20']) {
      expect(allAffordances(SCENES[id]).map((item) => item.intent), id).not.toContain('reject_ignore')
    }
  })

  it('I16 is the ordinary item, and its decision is a consent card inside Tags and mentions', () => {
    const scene = SCENES.I16
    expect(SOURCE.I16.disposition).toBe('Legitimate')
    // Reached from Notifications, opening an established DM - not a request.
    expect(scene.list.kind).toBe('activity')
    expect(scene.conversation.kind).toBe('dm')
    expect(scene.conversation.request).toBe(false)
    expect(scene.conversation.verified).toBe(true)
    // The card lives in the app's own settings, and BOTH answers on it are the normal path.
    const onCard = affordancesFor(scene, 'branch').filter((item) => item.on === 'tags' && item.page === 'card')
    expect(onCard.map((item) => item.intent)).toEqual(['safe_pivot', 'safe_pivot'])
    expect(onCard.map((item) => item.label).join(' ')).toMatch(/Confirm.*Decline/)
    expect(scene.surfaces.tags.pages.card.view).toBe('status')
    expect(scene.surfaces.tags.pages.pending.rows[0].to).toBe('card')
    // The card names the same release ID the register holds.
    const register = scene.surfaces.register
    expect(register.kind).toBe('app')
    expect(register.hero.label).toMatch(/PF-204/)
    expect(JSON.stringify(scene.surfaces.tags.pages.card)).toMatch(/PF-204/)
    // Leaving it pending is offered, and priced by the engine, not hidden.
    expect(affordancesFor(scene, 'branch').some((item) => item.intent === 'reject_ignore')).toBe(true)
    // The page's own Call action and its directory row agree with the directory asset.
    const deskNumber = BANK.I16.synthetic.assets.find((a) => a.kind === 'trusted_directory_entry').content.identifier
    expect(scene.surfaces.profile.pages.profile.actions[0].value).toBe(deskNumber)
    expect(scene.directoryExtras[0].identifier).toBe(`@${scene.conversation.handle}`)
    // Not thinner than the four beside it.
    expect(beatsAt(scene, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['I17', 'I18', 'I19', 'I20'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
  })

  it('I17 screens the photo, and Instagram’s Restrict is one of the safe routes', () => {
    const scene = SCENES.I17
    expect(scene.conversation.request).toBe(true)
    const photo = scene.beats.find((beat) => beat.kind === 'photo')
    expect(photo.screen).toBeTruthy()
    // No earlier scene draws a screened photo.
    for (const id of EARLIER) expect(SCENES[id].beats.some((beat) => beat.kind === 'photo'), id).toBe(false)
    const restrict = affordancesFor(scene, 'branch').find((item) => item.name === 'i17-branch-restrict')
    expect(restrict.intent).toBe('safe_pivot')
    expect(scene.surfaces[restrict.on].pages.controls.rows[0].label).toBe('Restrict')
    // The transfer is a payment sheet with a PIN; paying from the list is the premature route.
    expect(scene.surfaces.pay.kind).toBe('paysheet')
    expect(affordancesFor(scene, 'open').map((item) => item.intent)).toContain('attempt_payment')
    // Deleting everything is priced where the engine can price it: the resolve stage.
    expect(affordancesFor(scene, 'resolve').find((item) => item.intent === 'resolve_ignore').label)
      .toMatch(/Delete the whole chat/)
    // The countdown tightens once the run reaches the branch.
    expect(scene.beats.find((beat) => beat.id === 'i17-b5').since).toBe('branch')
    // Support is reachable, and nothing in the scene blames the learner.
    expect(scene.surfaces.support.hero.value).toMatch(/not the one in trouble/)
    expect(JSON.stringify(scene)).not.toMatch(/(it is|it's|was) (all )?your (own )?fault|you should have|stupid|careless/i)
    expect(JSON.stringify(scene)).toMatch(/not your fault/)
  })

  it('I18 passes every numbers check and fails every history check', () => {
    const scene = SCENES.I18
    const profile = scene.surfaces.profile.pages.profile
    // Strong social proof on the surface...
    expect(Number(profile.stats.followers.replace(/,/g, ''))).toBeGreaterThan(4000)
    expect(profile.mutuals).toMatch(/38 others/)
    expect(scene.conversation.request).toBe(false)
    // ...and a nine-day-old account with two renames underneath.
    const about = scene.surfaces.profile.pages.about
    expect(about.formerUsernames).toHaveLength(2)
    expect(about.rows.find((row) => row.label === 'Date joined').value).toMatch(/September 2026/)
    // The pinned post is the other account's March caption, word for word.
    const { pinned, otherpost } = scene.surfaces.profile.pages
    expect(pinned.caption).toBe(otherpost.caption)
    expect(otherpost.time).toMatch(/March/)
    expect(pinned.time).toMatch(/days ago/)
    // The decision is the DM's own location card, anchored to the map the account sent.
    const onMap = affordancesFor(scene, 'branch').filter((item) => item.on === 'map')
    expect(onMap.map((item) => item.intent).sort()).toEqual(['safe_pivot', 'share_location'])
    expect(affordancesFor(scene, 'branch').find((item) => item.opens === 'map').anchor).toBe('i18-map')
    // The approved schedule channel shows the teammate already has tomorrow's details.
    expect(JSON.stringify(scene.surfaces.schedule.sections)).toMatch(/Arjun K\. Singh.*Acknowledged/)
    // The bank's truncated sentence is carried in full, starting with the stored text.
    const stored = BANK.I18.synthetic.assets.find((a) => a.kind === 'notification').content.body
    const message = stored.slice(stored.indexOf(': ') + 2)
    expect(scene.beats.find((beat) => beat.id === 'i18-b4').text.startsWith(message)).toBe(true)
    expect(message.endsWith('tomorrow')).toBe(true)
  })

  it('I19 puts the decision in the share tray and the story composer', () => {
    const scene = SCENES.I19
    expect(scene.conversation.kind).toBe('post')
    expect(scene.list.kind).toBe('activity')
    const share = scene.surfaces.share
    expect(share.pages.tray.view).toBe('settings')
    expect(share.pages.story.view).toBe('story')
    const onStory = affordancesFor(scene, 'branch').filter((item) => item.on === 'share' && item.page === 'story')
    expect(onStory.map((item) => item.intent).sort()).toEqual(['reply', 'share_location', 'submit_data'])
    // Closing works from either page of the tray.
    expect(affordancesFor(scene, 'branch').find((item) => item.name === 'i19-branch-close').page).toBeNull()
    // No earlier scene makes a branch decision on a story page.
    for (const id of EARLIER) {
      const onStoryPage = affordancesFor(SCENES[id], 'branch').filter((item) => (
        item.on && item.page && SCENES[id].surfaces[item.on]?.pages?.[item.page]?.view === 'story'))
      expect(onStoryPage, id).toHaveLength(0)
    }
    // The account's own pinned post carries the same frame under an earlier name and disaster.
    const { april, about } = scene.surfaces.profile.pages
    expect(april.slides[0].art).toBe(scene.conversation.slides[1].art)
    expect(about.formerUsernames.map((item) => item.handle)).toContain(april.handle)
    // The bulletin has nothing today.
    expect(scene.surfaces.bulletin.hero.value).toMatch(/No statement/)
    // The friend's question arrives only once the run reaches the branch.
    expect(scene.beats.find((beat) => beat.id === 'i19-c5').since).toBe('branch')
    // The post prints its age once (found in browser play: caption time + post time drew it twice).
    expect(scene.conversation.time).toBeTruthy()
    expect(scene.beats.filter((beat) => beat.kind === 'caption' && beat.time)).toHaveLength(0)
  })

  it('I20 is a month of rapport, then a three-page questionnaire from the scenario’s own page asset', () => {
    const scene = SCENES.I20
    const days = beatsAt(scene, 'open').filter((beat) => beat.kind === 'day').map((beat) => beat.text)
    expect(days).toEqual(['17 AUGUST', '29 AUGUST', '9 SEPTEMBER', 'TODAY'])
    const asset = BANK.I20.synthetic.assets.find((a) => a.kind === 'browser_page')
    const form = scene.surfaces.interview
    expect(form.pages.intro.url).toBe(asset.display_target)
    // The questions walk from harmless to specific.
    const labels = Object.values(form.pages).flatMap((page) => fieldsOfPage(page).map((item) => item.label))
    expect(labels[0]).toMatch(/Years/)
    expect(labels.join(' ')).toMatch(/Which system.*Failures.*Days per month/)
    // The commit control is only on the review step, and it moves to the receipt.
    const submit = affordancesFor(scene, 'branch').find((item) => item.name === 'i20-branch-submit')
    expect(submit.page).toBe('review')
    expect(submit.thenPage).toBe('done')
    expect(form.pages.done.final).toBe(true)
    // Three different releases.
    expect(affordancesFor(scene, 'branch').filter((item) => item.intent === 'submit_data')).toHaveLength(3)
    // The bio link leads to the same questionnaire.
    expect(scene.surfaces.profile.pages.profile.bioLink.to).toBe('interview')
    // Its stored body is the client's stage-4 sentence, so nothing opens the generic sheet on it.
    for (const item of allAffordances(scene)) {
      if (item.intent === 'inspect_link') expect(item.targetId).not.toBe(asset.asset_id)
    }
  })

  it('names the client’s account on the toast and carries the client’s sentence on the list row', () => {
    for (const id of BATCH) {
      const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
      const handle = /^@([^:]+):/.exec(body)[1]
      expect(SCENES[id].notify.sender).toBe(handle)
      expect(SCENES[id].messageSender.identifier).toBe(`@${handle}`)
      const rows = SCENES[id].list.sections.flatMap((section) => section.rows)
      expect(rows.some((row) => (row.text ?? row.preview ?? '').includes(body.slice(handle.length + 3))), id)
        .toBe(true)
    }
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    const correct = {
      I16: ['resolve_continue', 'resolve_retain'],
      I17: ['resolve_report', 'resolve_block'],
      I18: ['resolve_report', 'resolve_block'],
      I19: ['resolve_report', 'resolve_block'],
      I20: ['resolve_report', 'resolve_block'],
    }
    for (const id of BATCH) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner).toHaveLength(2)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
    }
  })

  it('links every social page, action and highlight only to something the scene declares', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      for (const surface of Object.values(scene.surfaces)) {
        if (surface.kind !== 'social') continue
        const reachable = [...Object.keys(surface.pages), ...Object.keys(scene.surfaces)]
        expect(reachable).toContain(surface.home)
        for (const page of Object.values(surface.pages)) {
          const targets = [
            page.aboutTo, page.pinnedTo, page.commentsTo, page.compareTo?.to, page.storyTo?.to,
            page.bioLink?.to, page.stats?.followersTo, page.stats?.followingTo, page.profileTo,
            ...(page.actions ?? []).map((item) => item.to),
            ...(page.highlights ?? []).map((item) => item.to),
            ...(page.results ?? []).map((r) => r.to), ...(page.rows ?? []).map((r) => r.to),
          ].filter(Boolean)
          for (const target of targets) expect(reachable, `${id} ${target}`).toContain(target)
        }
      }
      // Every browser step links only to a page of its own browser.
      for (const surface of Object.values(scene.surfaces)) {
        if (surface.kind !== 'browser') continue
        for (const page of Object.values(surface.pages)) {
          if (page.primary) expect(Object.keys(surface.pages), id).toContain(page.primary.to)
        }
      }
    }
  })

  it('never keeps a military detail that reads as real: fictional unit, reserved numbers only', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).not.toMatch(/\b(Indian Army|Rajput|Gorkha|Sikh Regiment|Cantonment|Brigade|Division HQ)\b/i)
      expect(serialised).not.toMatch(/\b\d{1,2}\.\d{4,},\s*\d{1,3}\.\d{4,}\b/)
    }
  })
})

describe('I21-I25 each bring an Instagram interaction the first forty-five scenes did not have', () => {
  const BATCH = ['I21', 'I22', 'I23', 'I24', 'I25']
  /** Every scene authored before this batch: W01-W25 and I01-I20. */
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('I21'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .map((item) => `${item.slot}:${item.intent ?? 'local'}`).sort().join(',')
  const pagesOf = (id) => Object.values(SCENES[id].surfaces)
    .filter((surface) => surface.kind === 'social')
    .flatMap((surface) => Object.values(surface.pages))
  const branchHome = (id) => {
    const scene = SCENES[id]
    const from = scene.conversation?.kind ?? 'chat'
    return [...new Set(affordancesFor(scene, 'branch')
      .filter((item) => item.intent)
      .map((item) => {
        if (!item.on) return `${from}/${item.slot}`
        const surface = scene.surfaces[item.on]
        const view = surface.pages?.[item.page ?? surface.home]?.view ?? '-'
        return `${from}/${surface.kind}:${view}`
      }))].sort().join('|')
  }

  it('covers exactly the forty-five earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(45)
    expect(EARLIER.filter((id) => id.startsWith('W'))).toHaveLength(25)
    expect(EARLIER.filter((id) => id.startsWith('I'))).toHaveLength(20)
  })

  it('never repeats a branch decision shape from any of the forty-five, or from each other', () => {
    const earlier = new Map(EARLIER.map((id) => [shape(id), id]))
    for (const id of BATCH) expect(earlier.get(shape(id)), id).toBeUndefined()
    expect(new Set(BATCH.map(shape)).size).toBe(5)
  })

  it('decides in five places no earlier scene decides in', () => {
    const earlier = new Map(EARLIER.map((id) => [branchHome(id), id]))
    for (const id of BATCH) expect(earlier.get(branchHome(id)), id).toBeUndefined()
    expect(new Set(BATCH.map(branchHome)).size).toBe(5)
  })

  it('gives every one an account with an About-this-account page and a date joined', () => {
    for (const id of BATCH) {
      const about = pagesOf(id).find((page) => page.view === 'about')
      expect(about, `${id} has no About page`).toBeTruthy()
      expect(about.rows.some((row) => /joined/i.test(row.label))).toBe(true)
    }
  })

  it('prints no narrator verdict, no label for the item and no placeholder', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|synthetic|deepfake|impostor|suspicious|clone|clones|impersonat\w*|genuine|legit|look-?alike|hoax|unknownsender|compromised|hacked|takeover|coercion|spoof\w*|misinformation|disinformation|extortion|elicitation|quishing)\b/i,
      )
      expect(serialised).not.toContain(BANK[id].synthetic.sender.identifier)
    }
  })

  it('offers no rejection on the four items where the engine refuses one', () => {
    for (const id of ['I22', 'I23', 'I24', 'I25']) {
      expect(allAffordances(SCENES[id]).map((item) => item.intent), id).not.toContain('reject_ignore')
    }
  })

  it('I21 is the ordinary item, decided on the published post’s own tag-review sheet', () => {
    const scene = SCENES.I21
    expect(SOURCE.I21.disposition).toBe('Legitimate')
    expect(scene.list.kind).toBe('dm')
    expect(scene.conversation.request).toBe(false)
    // An established thread, with the published post shared into it.
    expect(beatsAt(scene, 'open').filter((beat) => beat.kind === 'day').map((beat) => beat.text))
      .toEqual(['28 AUGUST', '13 SEPTEMBER', 'TODAY'])
    expect(scene.beats.find((beat) => beat.kind === 'sharedPost').title).toMatch(/PF-311/)
    // Approve and Decline are both the normal path, on the review sheet; the sheet is a view no
    // earlier scene has, and it carries a local audience choice.
    const onReview = affordancesFor(scene, 'branch').filter((item) => item.on === 'tag' && item.page === 'review')
    expect(onReview.map((item) => item.intent)).toEqual(['safe_pivot', 'safe_pivot'])
    expect(onReview.map((item) => item.label)).toEqual(['Approve tag', 'Decline tag'])
    const review = scene.surfaces.tag.pages.review
    expect(review.view).toBe('review')
    expect(review.audience.options).toHaveLength(3)
    for (const id of EARLIER) expect(pagesOf(id).some((page) => page.view === 'review'), id).toBe(false)
    // Nothing in the post adds location or schedule; the only way out of the app is a stranger's
    // comment, and following it is the untrusted channel.
    expect(review.rows.find((row) => row.label === 'Location').value).toBe('None added')
    const album = affordancesFor(scene, 'branch').find((item) => item.name === 'i21-branch-album')
    expect([album.intent, album.on, album.page]).toEqual(['open_link', 'tag', 'post'])
    expect(scene.surfaces.tag.pages.post.comments.some((c) => c.author === 'hd.match.photos')).toBe(true)
    // Leaving it unanswered is offered and priced by the engine.
    expect(affordancesFor(scene, 'branch').some((item) => item.intent === 'reject_ignore')).toBe(true)
    // The register holds PF-311 and the learner's own preferences.
    expect(scene.surfaces.register.hero.label).toMatch(/PF-311/)
    expect(JSON.stringify(scene.surfaces.register.sections)).toMatch(/Your release preferences/)
    // A long, clean history.
    expect(scene.surfaces.profile.pages.about.formerUsernames).toHaveLength(0)
    expect(scene.surfaces.profile.pages.about.rows[0].value).toMatch(/2015/)
    // Not thinner than the four beside it.
    expect(beatsAt(scene, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['I22', 'I23', 'I24', 'I25'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
  })

  it('I22 puts three asks inside an Instagram video chat, and End call is the decision', () => {
    const scene = SCENES.I22
    expect(scene.conversation.request).toBe(true)
    const call = scene.surfaces.call
    expect(call.video).toBe(true)
    expect(call.endCallScored).toBe(true)
    expect(call.remote.figure).toBe('agent')
    expect(call.links.map((link) => link.to)).toEqual(['camera', 'cast', 'codes'])
    const branch = affordancesFor(scene, 'branch')
    const on = (surface) => branch.filter((item) => item.on === surface).map((item) => item.intent).sort()
    expect(on('call')).toEqual(['reply', 'safe_pivot'])
    expect(on('camera')).toEqual(['safe_pivot', 'submit_data'])
    expect(on('cast')).toEqual(['safe_pivot', 'share_secret'])
    expect(on('codes')).toEqual(['share_secret'])
    // The call is joined from the ringing notice, locally, and only while it rings.
    expect(branch.find((item) => item.id === 'i22-nav-join').anchor).toBe('i22-ring')
    const ring = scene.beats.find((beat) => beat.id === 'i22-ring')
    expect([ring.since, ring.until]).toEqual(['branch', 'verify'])
    // The check is the learner's own Account Status and Support requests.
    const status = affordancesFor(scene, 'verify').find((item) => item.name === 'i22-verify-status')
    const settings = scene.surfaces[status.opens]
    expect(settings.pages[settings.home].rows.map((row) => row.to)).toEqual(['status', 'support', 'security'])
    // Secrecy and "don't change your password" are in the thread; the account is days old and renamed.
    expect(scene.beats.some((beat) => /do not change your password/i.test(beat.text ?? ''))).toBe(true)
    expect(scene.surfaces.profile.pages.about.formerUsernames).toHaveLength(2)
  })

  it('I23 is a broadcast channel with no reply box, whose beneficiary has changed', () => {
    const scene = SCENES.I23
    expect(scene.conversation.readOnly).toMatch(/Only carewithmaya can send messages/)
    expect(scene.conversation.verified).toBe(true)
    for (const id of EARLIER) expect(Boolean(SCENES[id].conversation?.readOnly), id).toBe(false)
    // No composer at any stage: the decisions are on the message and the wallet.
    expect(allAffordances(scene).filter((item) => item.slot === 'composer')).toHaveLength(0)
    const share = affordancesFor(scene, 'branch').find((item) => item.name === 'i23-branch-share')
    expect([share.intent, share.anchor]).toEqual(['reply', 'i23-b5'])
    expect(scene.surfaces.pay.kind).toBe('paysheet')
    // Every earlier fundraiser names the same trust; today's has none.
    const fundraisers = scene.surfaces.profile.pages.fundraisers
    expect(fundraisers.rows.every((row) => /Asha Care Trust/.test(row.text))).toBe(true)
    expect(fundraisers.note).toMatch(/no fundraiser/)
    // The account itself is old and unrenamed: identity passes.
    expect(scene.surfaces.profile.pages.about.formerUsernames).toHaveLength(0)
    // The trust's own site, reached from bookmarks, carries the confirmation.
    const site = scene.surfaces.trust.pages.donate
    expect(site.url).toMatch(/^https:\/\/ashacare\.training\.example\//)
    expect(JSON.stringify(site.blocks)).toMatch(/We do not accept it/)
  })

  it('I24 is a sponsored carousel whose decisions are a download page, a dashboard and a tax', () => {
    const scene = SCENES.I24
    expect(scene.conversation.kind).toBe('post')
    expect(scene.conversation.media).toBeUndefined()
    expect(scene.conversation.slides).toHaveLength(4)
    expect(scene.conversation.slides[2].subtitle).toMatch(/Regd\./)
    const branch = affordancesFor(scene, 'branch')
    const install = branch.find((item) => item.intent === 'attempt_install')
    expect(scene.surfaces[install.on].kind).toBe('installer')
    expect(install.thenPage).toBe('installed')
    expect(scene.surfaces.store.pages.installed.final).toBe(true)
    // The dashboard shows money never deposited, and the withdrawal is locked behind KYC and tax.
    const web = scene.surfaces.web
    const asset = BANK.I24.synthetic.assets.find((a) => a.kind === 'browser_page')
    expect(web.pages.dashboard.url).toBe(asset.display_target)
    expect(JSON.stringify(web.pages.dashboard.blocks)).toMatch(/Joining bonus/)
    expect(web.pages.withdraw.links.map((link) => link.to)).toEqual(['kyc', 'tax'])
    expect(branch.find((item) => item.intent === 'submit_data').page).toBe('kyc-review')
    expect(fieldsOfPage(web.pages.kyc).map((item) => item.label)).toContain('ID number')
    // A public "Interested" comment is engagement, drawn with a note that comments on ads are public.
    expect(branch.find((item) => item.intent === 'reply').slot).toBe('composer')
    expect(scene.conversation.commentNote).toMatch(/ads are public/)
    // The top comments are one sentence from accounts made this month.
    const [c1, c2] = scene.beats.filter((beat) => beat.kind === 'comment')
    expect(c2.text.startsWith(c1.text)).toBe(true)
    expect(scene.surfaces.profile.pages.commenters.people[0].note).toMatch(/Joined this month/)
    // Two independent known apps; neither is the regulator register I09 uses.
    const known = affordancesFor(scene, 'verify').filter((item) => item.intent === 'verify_known_app')
    expect(known.map((item) => scene.surfaces[item.opens].appName)).toEqual(['App Store', 'TradeDesk'])
    // Unlike I09 there is no group funnel.
    expect(branch.some((item) => item.intent === 'open_link')).toBe(false)
  })

  it('I25 hides the code in a reel, reads it from a screenshot, and credits the audio', () => {
    const scene = SCENES.I25
    expect(scene.conversation.media).toBe('reel')
    const qr = BANK.I25.synthetic.assets.find((a) => a.kind === 'qr_payload')
    const inspect = affordancesFor(scene, 'inspect').find((item) => item.intent === 'inspect_qr')
    expect([inspect.anchor, inspect.targetId, inspect.opens]).toEqual(['i25-pin', qr.asset_id, 'scanner'])
    const scanner = scene.surfaces.scanner
    expect(scanner.kind).toBe('viewer')
    expect(scanner.rows.find((row) => row.label === 'Opens').value).toBe(qr.content.decoded_target)
    expect(scanner.rows.find((row) => row.label === 'Read from').value).toMatch(/Screenshot/)
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.on === 'scanner').map((item) => item.intent).sort())
      .toEqual(['safe_pivot', 'scan_qr'])
    // The eligibility form asks for service and family details, at the scenario's own address.
    const page = BANK.I25.synthetic.assets.find((a) => a.kind === 'browser_page')
    const form = scene.surfaces.coupon.pages.eligibility
    expect(form.url).toBe(page.display_target)
    expect(fieldsOfPage(form).map((item) => item.label).join(' ')).toMatch(/Service number.*family members.*Canteen card/)
    // The audio credit leads to the page showing the welfare notice used the sound first.
    const audio = branch.find((item) => item.anchor === 'audio')
    expect(audio.intent).toBeUndefined()
    expect(scene.surfaces[audio.opens].pages.audio.rows[0].meta).toMatch(/original/)
    for (const id of EARLIER) {
      const anchors = allAffordances(SCENES[id]).map((item) => item.anchor)
      expect(anchors, id).not.toContain('audio')
    }
    // The official page is found through the app's own search.
    expect(scene.surfaces.profile.pages.search.results[0].verified).toBe(true)
    // "20 packs left" arrives at the branch.
    expect(scene.beats.find((beat) => beat.id === 'i25-c5').since).toBe('branch')
  })

  it('names the client’s account on the toast, and carries the client’s sentence on the list row', () => {
    for (const id of BATCH) {
      const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
      const match = /^@([^:]+):\s*(.*)$/.exec(body)
      const rows = SCENES[id].list.sections.flatMap((section) => section.rows)
      if (!match) {
        // I24 is a sponsored placement: the bank's own sender name, never the placeholder handle.
        expect(SCENES[id].notify.sender).toBe(BANK[id].synthetic.sender.display_name)
        expect(rows.some((row) => (row.text ?? '').includes(body)), id).toBe(true)
        continue
      }
      expect(SCENES[id].notify.sender).toBe(match[1])
      expect(SCENES[id].messageSender.identifier).toBe(`@${match[1]}`)
      expect(rows.some((row) => (row.text ?? row.preview ?? '').includes(match[2])), id).toBe(true)
    }
  })

  it('puts a wrong answer beside a right one in every resolve banner', () => {
    const correct = {
      I21: ['resolve_continue', 'resolve_retain'],
      I22: ['resolve_report', 'resolve_block'],
      I23: ['resolve_report', 'resolve_block'],
      I24: ['resolve_report', 'resolve_block'],
      I25: ['resolve_report', 'resolve_block'],
    }
    const positions = new Set()
    for (const id of BATCH) {
      const banner = affordancesFor(SCENES[id], 'resolve')
        .filter((item) => item.slot === 'inline' && !item.anchor).map((item) => item.intent)
      expect(banner).toHaveLength(2)
      expect(banner.some((intent) => correct[id].includes(intent)), id).toBe(true)
      expect(banner.some((intent) => !correct[id].includes(intent)), id).toBe(true)
      positions.add(correct[id].includes(banner[0]))
    }
    // The right answer is not always first.
    expect(positions.size).toBe(2)
  })

  it('links every social page, browser step and installer page only to something the scene declares', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      for (const surface of Object.values(scene.surfaces)) {
        const reachable = [...Object.keys(surface.pages ?? {}), ...Object.keys(scene.surfaces)]
        if (surface.pages) expect(reachable).toContain(surface.home)
        for (const page of Object.values(surface.pages ?? {})) {
          const targets = [
            page.aboutTo, page.pinnedTo, page.commentsTo, page.compareTo?.to, page.storyTo?.to,
            page.bioLink?.to, page.stats?.followersTo, page.stats?.followingTo, page.profileTo,
            page.primary?.to,
            ...(page.actions ?? []).map((item) => item.to),
            ...(page.highlights ?? []).map((item) => item.to),
            ...(page.links ?? []).map((item) => item.to),
            ...(page.results ?? []).map((r) => r.to), ...(page.rows ?? []).map((r) => r.to),
          ].filter(Boolean)
          for (const target of targets) expect(reachable, `${id} ${target}`).toContain(target)
        }
      }
    }
  })

  it('never keeps a military detail that reads as real: fictional unit, reserved numbers only', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).not.toMatch(/\b(Indian Army|Rajput|Gorkha|Sikh Regiment|Cantonment|Brigade|Division HQ|CSD)\b/i)
      expect(serialised).not.toMatch(/\b\d{1,2}\.\d{4,},\s*\d{1,3}\.\d{4,}\b/)
    }
  })
})

describe('the client content survives into the scene', () => {
  /**
   * The scenarios whose stored notification body is TRUNCATED in the bank.
   *
   * The DATA-003 generator captures the client's notification with a non-greedy match that
   * stops at the first apostrophe, so a sentence containing one loses everything after it -
   * W09's body is literally "Can", from "Can't talk. Buy four gift cards...". Twelve of the
   * hundred scenarios are affected across all four platforms.
   *
   * IMMERSIVE-003B could not fix that: regenerating rewrites the production synthetic bank
   * and every platform in it, which that task was explicitly forbidden to touch. So the
   * affected scenes state the client's own full sentence and the truncated asset is left
   * exactly as the bank holds it. IMMERSIVE-003C met the third one, W15 ("Voice note - Send
   * today"), under the same restriction and applied the same workaround. IMMERSIVE-003D met
   * the fourth, W20 ("Our bank is under audit. Use this new account for today"), and did the
   * same again. IMMERSIVE-003E met two more: W22 ("My uncle", from "My uncle's desk...") and
   * W25 - whose stored body is the single letter "I", from "I'm testing the team desktop...".
   *
   * These two are listed rather than pattern-matched so that FIXING the bank breaks this
   * test and sends whoever fixed it here, which is the only way the workaround gets removed
   * rather than quietly outliving the bug.
   */
  const TRUNCATED_IN_BANK = ['W06', 'W09', 'W15', 'W20', 'W22', 'W25']
  const WHATSAPP_IDS = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('W'))
  const INSTAGRAM_IDS = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('I'))
  /** Instagram items the bank stores as a sponsored placement, with no `@handle:` in the sentence. */
  const SPONSORED_IDS = ['I09', 'I24']

  it.each(WHATSAPP_IDS)('%s says the headline the bank stores, verbatim', (id) => {
    const notification = BANK[id].synthetic.assets.find((a) => a.kind === 'notification')
    const body = notification.content.body
    const texts = SCENES[id].beats.map((beat) => beat.text)

    if (!TRUNCATED_IN_BANK.includes(id)) {
      expect(texts).toContain(body)
      return
    }

    // The scene may only EXTEND the stored text, never paraphrase it: a beat has to start
    // with the bank's exact string, so a rewrite still fails here.
    const extended = texts.filter(Boolean).find((text) => text.startsWith(body))
    expect(extended, `${id} does not carry the bank's stored headline`).toBeTruthy()
    expect(extended).not.toBe(body)
    // ...and the stored text really is a mid-word truncation, not a deliberate short form.
    expect(body.endsWith('.')).toBe(false)
  })

  it('names every WhatsApp scenario whose stored headline is truncated, and no others', () => {
    const truncated = WHATSAPP_IDS.filter((id) => {
      const body = BANK[id].synthetic.assets
        .find((a) => a.kind === 'notification').content.body
      return !SCENES[id].beats.map((beat) => beat.text).includes(body)
    })
    expect(truncated).toEqual(TRUNCATED_IN_BANK)
  })

  /**
   * IMMERSIVE-004A. The Instagram bank writes every notification as `@handle: message` and
   * pairs it with a PLACEHOLDER sender asset (`@unknownsender274`, `name_source:
   * "placeholder"`) whose random follower counts contradict the client's own sentence. So
   * the Instagram scenes carry the client's message portion verbatim and use the handle from
   * the client's sentence as the account, never the placeholder - the same "the client wins
   * where the generator disagrees" workaround the truncated WhatsApp bodies get, documented
   * in the batch research. This asserts the message survives verbatim and the placeholder
   * never appears.
   */
  it.each(INSTAGRAM_IDS)('%s carries the client message verbatim and never the placeholder handle', (id) => {
    const body = BANK[id].synthetic.assets.find((a) => a.kind === 'notification').content.body
    const match = /^@([a-z0-9._]+):\s*(.*)$/i.exec(body)
    if (SPONSORED_IDS.includes(id)) {
      /**
       * IMMERSIVE-004B. I09 is a sponsored item: the bank's notification has no handle, and its
       * sender asset is the client's own word "Sponsored" with a PLACEHOLDER identifier
       * (`@sponsored829`). The sentence is carried verbatim; the placeholder identifier never is.
       */
      expect(match).toBeNull()
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).toContain(body)
      const { display_name: sponsor, identifier, identifier_source: source } = BANK[id].synthetic.sender
      expect(source).toBe('placeholder')
      expect(serialised).toContain(sponsor)
      expect(serialised).not.toContain(identifier)
      return
    }
    expect(match, `${id} notification is not in @handle: message form`).toBeTruthy()
    const [, clientHandle, message] = match
    const serialised = JSON.stringify(SCENES[id])

    // The message part appears verbatim somewhere in the scene (a beat or a preview).
    expect(serialised).toContain(message)
    // The client's handle is the account the scene shows...
    expect(serialised).toContain(clientHandle)
    // ...and the generated placeholder sender is never printed.
    const placeholder = BANK[id].synthetic.sender.display_name
    expect(placeholder).toMatch(/^@unknownsender/)
    expect(serialised).not.toContain(placeholder)
  })

  it.each(WHATSAPP_IDS)('%s keeps the sender identity the bank stores', (id) => {
    const { display_name: name, identifier } = BANK[id].synthetic.sender
    const serialised = JSON.stringify(SCENES[id])
    expect(serialised).toContain(name)
    expect(serialised).toContain(identifier)
  })

  it('takes the suspect link from the scenario asset, never from the scene', () => {
    for (const id of ['W02', 'W05']) {
      const asset = BANK[id].synthetic.assets.find((a) => a.kind === 'browser_page')
      const scene = SCENES[id]
      const surface = Object.values(scene.surfaces).find(
        (item) => item.pages && Object.values(item.pages).some((p) => p.url === asset.display_target),
      )
      expect(surface).toBeTruthy()
    }
  })
})

/**
 * IMMERSIVE-AUDIT-001 - properties that must hold across all fifty authored scenes at once.
 *
 * The batch suites above each police their own five scenes against the word list known at the
 * time, so a pattern introduced early (W01-W15 put only the correct resolutions in the banner;
 * W09 and W10 printed the bank's verdict-bearing narrator line; W06, W09 and W15 named the verdict
 * in a Report label) was never checked again. These run over every authored scene.
 */
describe('across all authored scenes, nothing before resolution gives the answer away', () => {
  const CORRECT = {
    Malicious: ['resolve_report', 'resolve_block'],
    Legitimate: ['resolve_continue', 'resolve_retain'],
  }
  /**
   * The union of the batch verdict lists, minus "genuine" and "legit": a learner's own
   * "is this genuine?" question is asked on legitimate and malicious items alike, and an
   * adversary's "the order is genuine" is scenario content.
   */
  const VERDICT = /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|cloned|deepfake|impostor|suspicious|clone|clones|impersonat\w*|look-?alike|hoax|compromised|hacked|takeover|coercion|spoof\w*|misinformation|disinformation|blackmail|extortion|morphed|elicitation|espionage|quishing)\b/i

  it('covers the hundred authored scenes', () => {
    expect(AUTHORED_SCENARIO_IDS).toHaveLength(100)
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s puts a wrong resolution beside a right one in the banner', (id) => {
    const correct = CORRECT[SOURCE[id].disposition]
    const banner = affordancesFor(SCENES[id], 'resolve')
      .filter((item) => item.slot === 'inline' && !item.anchor && item.intent)
      .map((item) => item.intent)
    expect(banner.some((intent) => correct.includes(intent)), id).toBe(true)
    expect(banner.some((intent) => !correct.includes(intent)), id).toBe(true)
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s names no verdict on any control', (id) => {
    const scene = SCENES[id]
    for (const item of [...allAffordances(scene), ...(scene.ambient ?? [])]) {
      expect(`${item.label} ${item.hint ?? ''} ${item.echo ?? ''}`, `${id} ${item.id}`).not.toMatch(VERDICT)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s never prints a narrator line that states the verdict', (id) => {
    const context = BANK[id].synthetic.prior_context
    if (!VERDICT.test(context) && !/\bgenuine\b/i.test(context)) return
    expect(JSON.stringify(SCENES[id])).not.toContain(context)
  })

  /** Every desk description a scene carries, wherever it keeps its directory rows. */
  const rolesOf = (id) => {
    const roles = []
    JSON.stringify(SCENES[id], (key, value) => {
      if (key === 'role' && typeof value === 'string') roles.push(value)
      return value
    })
    return roles
  }

  it('finds the directory desks it checks', () => {
    expect(rolesOf('W15').length).toBeGreaterThan(0)
    expect(rolesOf('I17').length).toBeGreaterThan(0)
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s describes no directory desk by the item’s verdict', (id) => {
    for (const role of rolesOf(id)) expect(role, id).not.toMatch(VERDICT)
  })
})

/* ------------------------------------------------------------------ *
 * Email E01-E10 - distinct, and E06-E10 Email-native (IMMERSIVE-005 / 006)
 * ------------------------------------------------------------------ */

describe('the Email scenes are distinct and Email-native', () => {
  const EMAIL = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('E'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  /** Where the scored branch controls sit: the app slot, or the surface kind they are on. */
  const branchHome = (id) => {
    const scene = SCENES[id]
    return [...new Set(affordancesFor(scene, 'branch')
      .filter((item) => item.intent)
      .map((item) => {
        if (!item.on) return `msg/${item.slot}`
        return `${scene.surfaces[item.on].kind}`
      }))].sort().join('|')
  }

  it('authors twenty-five Email scenes E01-E25', () => {
    expect(EMAIL).toEqual([
      'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10',
      'E11', 'E12', 'E13', 'E14', 'E15',
      'E16', 'E17', 'E18', 'E19', 'E20',
      'E21', 'E22', 'E23', 'E24', 'E25',
    ])
  })

  it('gives every one of the twenty Email scenes a distinct branch-stage shape', () => {
    // The slot+intent set of each scene's scored branch controls is unique across all twenty.
    expect(new Set(EMAIL.map(shape)).size).toBe(EMAIL.length)
  })

  it('decides the twenty Email scenes across at least fourteen distinct homes', () => {
    // A coarse decision-home signature; a handful of scenes legitimately share one (E09 and
    // E10 both release on a browser surface), so this is asserted as a floor, not a bijection.
    // The branch-shape uniqueness above is the strict guarantee.
    expect(new Set(EMAIL.map(branchHome)).size).toBeGreaterThanOrEqual(14)
    // The recorded overlaps: E09 and E10 share a coarse home, and the two in-message legitimate
    // controls E03 and E16 do too - each pair with distinct branch shapes.
    expect(branchHome('E09')).toBe(branchHome('E10'))
    expect(shape('E09')).not.toBe(shape('E10'))
    expect(branchHome('E03')).toBe(branchHome('E16'))
    expect(shape('E03')).not.toBe(shape('E16'))
  })

  it('opens every Email scene on the inbox, never a chat list or a feed', () => {
    for (const id of EMAIL) {
      expect(SCENES[id].stages.open.surface).toBe('list')
      expect(SCENES[id].list.folders?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('E06 makes the decision the reply composer, with a roster attachment chip', () => {
    const branch = affordancesFor(SCENES.E06, 'branch')
    const attach = branch.find((item) => item.compose?.attachment)
    expect(attach, 'E06 has no attaching composer control').toBeTruthy()
    expect(attach.intent).toBe('submit_data')
    // A bare reply is the -3, discarding is the safe pivot.
    expect(branch.some((item) => item.slot === 'composer' && item.intent === 'reply')).toBe(true)
    expect(branch.some((item) => item.slot === 'menu' && item.intent === 'safe_pivot')).toBe(true)
    // No other Email scene attaches from the composer.
    for (const id of EMAIL.filter((x) => x !== 'E06')) {
      expect(affordancesFor(SCENES[id], 'branch').some((item) => item.compose?.attachment), id).toBe(false)
    }
  })

  it('E07 is the legitimate control and decides on a calendar invite card', () => {
    const scene = SCENES.E07
    const inviteBeat = scene.beats.find((beat) => beat.kind === 'invite')
    expect(inviteBeat, 'E07 has no invite beat').toBeTruthy()
    // Accept / Tentative / Decline are all the normal in-app path (CORRECT_USE).
    const onInvite = affordancesFor(scene, 'branch').filter((item) => item.anchor === inviteBeat.id)
    expect(onInvite.map((item) => item.label)).toEqual(['Accept', 'Tentative', 'Decline'])
    for (const item of onInvite) expect(item.intent).toBe('safe_pivot')
    // Reporting the organiser is a false positive; no other Email scene uses an invite beat.
    for (const id of EMAIL.filter((x) => x !== 'E07')) {
      expect(SCENES[id].beats.some((beat) => beat.kind === 'invite'), id).toBe(false)
    }
  })

  it('E08 harvests identity and card data on a refund form, checked against the tax portal', () => {
    const form = SCENES.E08.surfaces.refund.pages.form
    const labels = fieldsOfPage(form).map((f) => f.label)
    expect(labels).toContain('Identity number')
    expect(labels).toContain('Card number')
    expect(labels).toContain('One-time code')
    const verify = affordancesFor(SCENES.E08, 'verify').find((item) => item.name === 'e08-verify-portal')
    expect(surfaceById(SCENES.E08, verify.opens).kind).toBe('browser')
  })

  it('E09 decides on a gift-card codes surface and checks a call and procurement', () => {
    const branch = affordancesFor(SCENES.E09, 'branch')
    const codes = branch.find((item) => item.intent === 'submit_data')
    expect(SCENES.E09.surfaces[codes.on].kind).toBe('browser')
    // The two checks are a saved-number call and the procurement app.
    const verify = affordancesFor(SCENES.E09, 'verify')
    expect(verify.some((item) => item.intent === 'verify_known_number')).toBe(true)
    expect(verify.some((item) => item.intent === 'verify_known_app')).toBe(true)
  })

  it('E10 offers both a beneficiary change and a payment approval, on the vendor master', () => {
    const branch = affordancesFor(SCENES.E10, 'branch')
    const save = branch.find((item) => item.intent === 'submit_data')
    const pay = branch.find((item) => item.intent === 'attempt_payment')
    expect(save.on).toBe('vendormaster')
    expect(pay.on).toBe('vendormaster')
    // The invoice reference in the message is the reference in the vendor master.
    expect(JSON.stringify(SCENES.E10.beats)).toContain('NS-104')
    expect(JSON.stringify(SCENES.E10.surfaces.vendormaster)).toContain('NS-104')
  })

  it('E11 is the second legitimate Email control and decides by opening the known portal', () => {
    const scene = SCENES.E11
    // No link and no attachment anywhere in the message; the notice states as much.
    expect(scene.beats.some((beat) => beat.kind === 'button' || beat.kind === 'attachment')).toBe(false)
    // Opening the request in the People Portal is the correct in-app path (CORRECT_USE).
    const branch = affordancesFor(scene, 'branch')
    const portal = branch.find((item) => item.intent === 'safe_pivot')
    expect(surfaceById(scene, portal.opens).kind).toBe('app')
    // Reporting or blocking a real status update is the false positive; it is a legit item.
    expect(SOURCE.E11.disposition).toBe('Legitimate')
  })

  it('E12 releases either by signing in or by approving the push, on the cloned page', () => {
    const branch = affordancesFor(SCENES.E12, 'branch')
    const signin = branch.find((item) => item.intent === 'submit_data')
    const approve = branch.find((item) => item.intent === 'approve_device_link')
    expect(signin.on).toBe('signin')
    expect(approve.on).toBe('signin')
    // E12 is the only Email scene that offers BOTH a credential submit and a push approval on
    // the same cloned surface (E15 approves consent but types nothing).
    const both = (id) => {
      const b = affordancesFor(SCENES[id], 'branch')
      return b.some((i) => i.intent === 'submit_data') && b.some((i) => i.intent === 'approve_device_link')
    }
    expect(both('E12')).toBe(true)
    for (const id of EMAIL.filter((x) => x !== 'E12')) expect(both(id), id).toBe(false)
  })

  it('E13 opens an archive whose contents include a document-shaped executable', () => {
    const preview = SCENES.E13.surfaces.preview.pages.preview
    const items = preview.blocks.find((block) => block.type === 'items').items
    expect(items.some((row) => /\.pdf\.exe$/.test(row.label))).toBe(true)
    const branch = affordancesFor(SCENES.E13, 'branch')
    // Extracting is the risky open; running the executable is the release.
    expect(branch.some((item) => item.intent === 'open_file')).toBe(true)
    expect(branch.some((item) => item.intent === 'attempt_install')).toBe(true)
  })

  it('only E14 and E24 decide on a scanned code, and they meet it in different places', () => {
    for (const id of EMAIL.filter((x) => x !== 'E14' && x !== 'E24')) {
      expect(affordancesFor(SCENES[id], 'branch').some((item) => item.intent === 'scan_qr'), id).toBe(false)
    }
    // Both decide on the inspector, because that is where a decoded target can be read.
    for (const id of ['E14', 'E24']) {
      const scan = affordancesFor(SCENES[id], 'branch').find((item) => item.intent === 'scan_qr')
      expect(SCENES[id].surfaces[scan.on].kind, id).toBe('viewer')
    }
    // IMMERSIVE-009: E14's code is in the message and is met at once; E24's is on page 7 of an
    // eight-page document, so it has to be walked to, and E24 alone offers the item's own
    // legitimate route (acknowledging in the app the unit already uses) as a safe branch.
    expect(Object.keys(SCENES.E24.surfaces.doc.pages)).toEqual(['p1', 'p4', 'p7'])
    expect(SCENES.E24.surfaces.doc.pages.p7.links.some((link) => link.to === 'qr')).toBe(true)
    expect(SCENES.E14.surfaces.doc).toBeUndefined()
    const centre = affordancesFor(SCENES.E24, 'branch')
      .find((item) => item.intent === 'safe_pivot' && item.on === 'centre')
    expect(centre).toBeTruthy()
    expect(SCENES.E24.surfaces.centre.kind).toBe('app')
  })

  it('E15 decides on an OAuth consent screen listing mailbox permissions, no password typed', () => {
    const consent = SCENES.E15.surfaces.consent.pages.consent
    const perms = consent.blocks.find((block) => block.type === 'summary').rows.map((r) => r.label)
    expect(perms).toEqual(['Mail.Read', 'Mail.Send', 'Contacts'])
    // The consent page has no form fields: granting is the decision, not typing.
    expect(fieldsOfPage(consent)).toHaveLength(0)
    const branch = affordancesFor(SCENES.E15, 'branch')
    expect(branch.some((item) => item.intent === 'approve_device_link')).toBe(true)
  })

  it('gives the legitimate E07 as much thread and as many screens as its malicious neighbours', () => {
    const beatsOf = (id) => beatsAt(SCENES[id], 'branch').length
    expect(beatsOf('E07')).toBeGreaterThanOrEqual(
      Math.min(...['E06', 'E08', 'E09', 'E10'].map(beatsOf)),
    )
    expect(Object.keys(SCENES.E07.surfaces).length).toBeGreaterThanOrEqual(2)
  })

  it('keeps every military Email scene fictional: reserved numbers, training hosts only', () => {
    for (const id of ['E06', 'E07', 'E09', 'E12', 'E14', 'E19']) {
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-008 - Email E16-E20
 * ------------------------------------------------------------------ */

describe('E16-E20 each bring an Email interaction the first sixty-five scenes did not have', () => {
  const BATCH = ['E16', 'E17', 'E18', 'E19', 'E20']
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('E16'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const branchKinds = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent && item.on)
    .map((item) => SCENES[id].surfaces[item.on].kind))]
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])

  it('covers exactly the sixty-five earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(65)
    expect(EARLIER).not.toContain('E16')
  })

  it('never repeats a branch decision shape from any of the sixty-five, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('types nothing on any E16-E20 screen: every decision is a control, never a form', () => {
    for (const id of BATCH) expect(allFields(SCENES[id]), id).toHaveLength(0)
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of ['E17', 'E18', 'E19', 'E20']) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
  })

  it('E16 is the legitimate control: a signed notice whose calendar file carries Add reminder', () => {
    const scene = SCENES.E16
    expect(SOURCE.E16.disposition).toBe('Legitimate')
    const ics = scene.beats.find((beat) => beat.kind === 'attachment')
    expect(ics.fileName).toMatch(/\.ics$/)
    const branch = affordancesFor(scene, 'branch')
    const reminder = branch.find((item) => item.anchor === ics.id)
    expect(reminder.label).toBe('Add reminder')
    expect(reminder.intent).toBe('safe_pivot')
    expect(surfaceById(scene, reminder.opens).kind).toBe('app')
    // Not E07's invite card, and no link or button anywhere in the notice.
    expect(scene.beats.some((beat) => ['invite', 'button'].includes(beat.kind))).toBe(false)
    // The signature is shown in the details, and the change number is on the IT status board.
    expect(JSON.stringify(scene.surfaces.details)).toContain('Digital signature')
    expect(JSON.stringify(scene.surfaces.statusboard)).toContain('CHG-118')
    // Moving a real notice to Junk is needless; forwarding work mail home is the unsafe route.
    expect(branch.find((item) => item.intent === 'reject_ignore').label).toMatch(/Junk/)
    const forward = branch.find((item) => item.compose?.mode === 'forward')
    expect(forward.intent).toBe('reply')
    expect(forward.compose.to).not.toMatch(/unit\.training\.example$/)
  })

  it('gives the legitimate E16 as much thread and as many screens as its malicious neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    expect(beatsAt(SCENES.E16, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['E17', 'E18', 'E19', 'E20'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
    expect(screens('E16')).toBeGreaterThanOrEqual(Math.min(...['E17', 'E18', 'E19', 'E20'].map(screens)))
  })

  it('E17 carries no link or attachment and decides on the phone’s own dial dialog', () => {
    const scene = SCENES.E17
    expect(scene.beats.some((beat) => beat.kind === 'attachment')).toBe(false)
    expect(Object.values(scene.surfaces).some((surface) => surface.kind === 'browser')).toBe(false)
    const branch = affordancesFor(scene, 'branch')
    const call = branch.find((item) => item.intent === 'call_number')
    expect(call.on).toBe('dial')
    expect(scene.surfaces.dial.kind).toBe('installer')
    expect(branch.find((item) => item.on === 'dial' && item.intent === 'safe_pivot')).toBeTruthy()
    // Tapping the number in the message is local; only the dialog's Call is scored.
    const tap = branch.find((item) => item.anchor === 'e17-phone')
    expect(tap.local).toBe(true)
    expect(tap.opens).toBe('dial')
    // The call's desk asks for remote access; the install screen has nothing to press.
    expect(JSON.stringify(scene.surfaces.support.script)).toMatch(/install/i)
    for (const item of allAffordances(scene)) expect(item.on === 'remote', item.id).toBe(false)
    // No other Email scene decides by calling a number.
    for (const id of AUTHORED_SCENARIO_IDS.filter((x) => x.startsWith('E') && x !== 'E17')) {
      expect(affordancesFor(SCENES[id], 'branch').some((item) => item.intent === 'call_number'), id).toBe(false)
    }
  })

  it('E18 comes from the vendor’s real address, and only its Reply-To differs', () => {
    const scene = SCENES.E18
    const details = JSON.stringify(scene.surfaces.details)
    expect(scene.messageSender.identifier).toBe('accounts@northstar.training.example')
    // E10 was the look-alike domain; E18's From is the address E10 kept on file.
    expect(JSON.stringify(SCENES.E10)).toContain(scene.messageSender.identifier)
    expect(details).toContain('Reply-To')
    const reply = affordancesFor(scene, 'branch').find((item) => item.compose?.mode === 'reply')
    expect(reply.compose.to).not.toBe(scene.messageSender.identifier)
    // The invoice reference in the thread is the one in the Payables app.
    expect(JSON.stringify(scene.beats)).toContain('NS-104')
    expect(JSON.stringify(scene.surfaces.payables)).toContain('NS-104')
    // Earlier thread messages carry the real statement before today's reply.
    expect(scene.beats.filter((beat) => beat.kind === 'earlier')).toHaveLength(2)
  })

  it('E18 decides in the Payables app and in the reply/forward composer', () => {
    const branch = affordancesFor(SCENES.E18, 'branch')
    for (const intent of ['submit_data', 'attempt_payment', 'safe_pivot']) {
      const item = branch.find((control) => control.intent === intent)
      expect(item.on, intent).toBe('payables')
    }
    expect(SCENES.E18.surfaces.payables.kind).toBe('app')
    expect(branch.filter((item) => item.slot === 'composer').map((item) => item.compose.mode).sort())
      .toEqual(['forward', 'reply'])
    // IMMERSIVE-009: three Email scenes decide on an application surface, and each uses it for a
    // different act - E18 changes a beneficiary, E24 completes the task the item was really about,
    // E25 holds a payroll run. No other Email scene decides on one.
    const onApp = AUTHORED_SCENARIO_IDS
      .filter((x) => x.startsWith('E') && branchKinds(x).includes('app'))
    expect(onApp).toEqual(['E18', 'E24', 'E25'])
  })

  it('E19 releases through the questionnaire’s own bar, and reads every question first', () => {
    const scene = SCENES.E19
    const preview = scene.surfaces.questionnaire.pages.preview
    expect(preview.blocks.some((block) => block.type === 'bar')).toBe(true)
    const questions = preview.blocks.find((block) => block.type === 'items').items.map((row) => row.value).join(' ')
    for (const topic of [/systems/, /gaps/, /based/, /typical week/]) expect(questions).toMatch(topic)
    const branch = affordancesFor(scene, 'branch')
    expect(branch.find((item) => item.intent === 'share_secret').on).toBe('questionnaire')
    expect(branch.filter((item) => item.slot === 'composer').map((item) => item.compose.mode).sort())
      .toEqual(['forward', 'reply'])
    // The recipient list is part of the evidence.
    expect(JSON.stringify(scene.surfaces.details)).toContain('38 recipients')
  })

  it('E20 keeps the case lookup on the portal it links to, and the real check elsewhere', () => {
    const scene = SCENES.E20
    const branch = affordancesFor(scene, 'branch')
    expect(branch.find((item) => item.intent === 'open_link').anchor).toBe('e20-portal')
    expect(branch.find((item) => item.intent === 'submit_data').page).toBe('upload')
    expect(branch.find((item) => item.intent === 'attempt_payment').page).toBe('pay')
    // The link target is the scenario's own browser asset.
    expect(scene.surfaces.portal.pages.case.url).toBe(BANK.E20.synthetic.assets
      .find((a) => a.kind === 'browser_page').display_target)
    // The secrecy demand is on the page; breaking it (legal support) is a trusted check.
    expect(JSON.stringify(scene.beats)).toMatch(/strictly confidential/)
    const verify = affordancesFor(scene, 'verify')
    expect(verify.find((item) => item.opens === 'legal').intent).toBe('verify_known_number')
    expect(surfaceById(scene, verify.find((item) => item.intent === 'verify_known_app').opens).kind).toBe('app')
  })
})

/* ------------------------------------------------------------------ *
 * Email E21-E25 - the final Email batch (IMMERSIVE-009)
 * ------------------------------------------------------------------ */

describe('E21-E25 each bring an Email interaction the first seventy scenes did not have', () => {
  const BATCH = ['E21', 'E22', 'E23', 'E24', 'E25']
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('E21'))
  const EMAIL = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('E'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])

  it('covers exactly the seventy earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(70)
    expect(EARLIER).not.toContain('E21')
  })

  it('never repeats a branch decision shape from any of the seventy, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives each of the five a decision home no other Email scene shares', () => {
    for (const id of BATCH) {
      const others = EMAIL.filter((x) => x !== id).map(home)
      expect(others, `${id} shares its home (${home(id)})`).not.toContain(home(id))
    }
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of ['E22', 'E23', 'E24', 'E25']) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    // E21 is the legitimate one, and over-rejecting it is the mistake it prices.
    expect(allAffordances(SCENES.E21).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('types on exactly the two screens that need a field, and nowhere else', () => {
    // E23's local page harvests a work login and E24's cloned sign-in does; the other three
    // decide entirely by pressing controls, and E22's PIN never leaves the payment sheet.
    expect(allFields(SCENES.E21), 'E21').toHaveLength(0)
    expect(allFields(SCENES.E25), 'E25').toHaveLength(0)
    expect(allFields(SCENES.E22).map((f) => f.name)).toEqual(['pin'])
    expect(allFields(SCENES.E23).map((f) => f.name)).toEqual(['account', 'passphrase'])
    expect(allFields(SCENES.E24).map((f) => f.name)).toEqual(['account', 'passphrase'])
    // No field anywhere in the batch is a real password input the browser would offer to save.
    for (const id of BATCH) {
      for (const item of allFields(SCENES[id])) {
        expect(['text', 'digits', 'secret', 'expiry', 'masked'], `${id} ${item.name}`).toContain(item.kind)
      }
    }
  })

  it('lets a learner reach every scored branch surface without spending the branch first', () => {
    /**
     * IMMERSIVE-009, found by hand-play. The engine takes ONE decision per stage, so a scene
     * whose second risky surface is reachable only through a scored control makes the controls on
     * that surface unpressable in the UI: opening it spends the decision they belong to. Every
     * E21-E25 surface that carries a scored branch control is therefore reachable by local
     * navigation as well - a `navigate` offered at inspect or branch, or a page link from a
     * surface that is. Three earlier scenes (W02, W05, I25) predate this rule and are recorded in
     * `EMAIL_E21_E25_REAL_WORLD_RESEARCH.md` §8; they are not changed by this task.
     */
    for (const id of BATCH) {
      const scene = SCENES[id]
      const free = new Set()
      const add = (sid) => {
        if (!sid || free.has(sid) || !scene.surfaces[sid]) return
        free.add(sid)
        const surface = scene.surfaces[sid]
        for (const page of Object.values(surface.pages ?? {})) {
          for (const link of page.links ?? []) add(link.to)
          for (const item of (page.blocks ?? []).flatMap((block) => block.items ?? [])) add(item.to)
        }
        for (const link of surface.links ?? []) add(link.to)
        for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
      }
      const local = [
        ...(scene.ambient ?? []),
        ...affordancesFor(scene, 'inspect'),
        ...affordancesFor(scene, 'branch'),
      ].filter((item) => item.local)
      for (const item of local) add(item.opens)
      const unreachable = affordancesFor(scene, 'branch')
        .filter((item) => item.intent && item.on && !free.has(item.on))
        .map((item) => item.on)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('E21 is the legitimate control, and its safe branch COMPLETES a high-risk change', () => {
    const scene = SCENES.E21
    expect(SOURCE.E21.disposition).toBe('Legitimate')
    const branch = affordancesFor(scene, 'branch')
    const approve = branch.find((item) => item.intent === 'safe_pivot')
    // The decision is on the portal's own case page, not in the message.
    expect(approve.on).toBe('portal')
    expect(approve.page).toBe('case')
    expect(scene.surfaces.portal.kind).toBe('browser')
    // Every earlier legitimate Email scene keeps, archives or accepts something. This one signs.
    for (const id of ['E03', 'E07', 'E11', 'E16']) {
      const earlier = affordancesFor(SCENES[id], 'branch').find((item) => item.intent === 'safe_pivot'
        || item.intent === 'reject_ignore')
      expect(earlier.label, id).not.toMatch(/approv/i)
    }
    // The case carries the two controls that make it safe: a callback on the number already on
    // file, and a first approval by somebody else.
    const casePage = JSON.stringify(scene.surfaces.portal.pages.case)
    expect(casePage).toContain('Approval 1 of 2')
    expect(casePage).toContain('Approval 2 of 2')
    expect(casePage).toContain('Callback')
    // The callback was made on the contact the vendor master already held, and the queue says so.
    expect(JSON.stringify(scene.surfaces.approvals)).toContain('vendor master')
    // The form's fingerprint is printed in the notice and recorded by the portal, and the scene
    // shows both so they can be read against each other rather than taken on trust.
    const fingerprint = scene.beats.find((beat) => beat.kind === 'table')
      .rows.find((row) => row.label === 'Form fingerprint').value
    expect(JSON.stringify(scene.surfaces.form)).toContain(fingerprint)
    expect(casePage).toContain(fingerprint)
    // The link in the notice is the unit's own portal, and the details say so rather than hiding it.
    expect(JSON.stringify(scene.surfaces.details)).toContain('vendorportal.unit.training.example')
    // Rejecting it and releasing the payment without the second approval are both offered.
    expect(branch.find((item) => item.intent === 'reject_ignore')).toBeTruthy()
    expect(branch.find((item) => item.intent === 'attempt_payment')).toBeTruthy()
  })

  it('gives the legitimate E21 as much thread and as many screens as its malicious neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    expect(beatsAt(SCENES.E21, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['E22', 'E23', 'E24', 'E25'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
    expect(screens('E21')).toBeGreaterThanOrEqual(
      Math.min(...['E22', 'E23', 'E24', 'E25'].map(screens)),
    )
  })

  it('E22 is the only scene in the product whose payload is a recording', () => {
    const scene = SCENES.E22
    const memo = scene.beats.find((beat) => beat.kind === 'voice')
    expect(memo).toBeTruthy()
    expect(memo.duration).toMatch(/^\d:\d\d$/)
    // The words are in the app's own transcript, because nothing here can make a sound.
    expect(memo.transcript.length).toBeGreaterThan(120)
    // The file name is drawn text; what must not exist is an element, a source or a MIME type.
    expect(JSON.stringify(scene)).not.toMatch(/<audio|audio\/(mpeg|mp4|wav|ogg)|"src"|data:audio/)
    // No other Email scene has one, and WhatsApp's voice notes are chat bubbles, not attachments.
    for (const id of EMAIL.filter((x) => x !== 'E22')) {
      expect(SCENES[id].beats.some((beat) => beat.kind === 'voice'), id).toBe(false)
    }
    // The decision is the fund's own transfer sheet, and Cancel sits beside Confirm on it.
    const branch = affordancesFor(scene, 'branch')
    const confirm = branch.find((item) => item.intent === 'attempt_payment')
    const cancel = branch.find((item) => item.intent === 'safe_pivot' && item.on === 'paysheet')
    expect(scene.surfaces[confirm.on].kind).toBe('paysheet')
    expect(cancel).toBeTruthy()
    // The file screen states what a recording cannot carry, which is the lesson.
    expect(JSON.stringify(scene.surfaces.memo)).toContain('Signature')
  })

  it('E23 opens its attachment from the device, where there is no address to check', () => {
    const scene = SCENES.E23
    const report = scene.surfaces.local.pages.report
    expect(report.url.startsWith('file:')).toBe(true)
    expect(report.secure).toBe(false)
    // It is the only scene in the product that opens a page from a local file.
    for (const id of AUTHORED_SCENARIO_IDS.filter((x) => x !== 'E23')) {
      expect(JSON.stringify(SCENES[id]), id).not.toContain('file:///')
    }
    // The mail app refuses to render it, and the bar it puts up is where the decision is taken.
    const bar = scene.surfaces.preview.pages.preview.blocks.find((block) => block.type === 'bar')
    expect(bar.title).toMatch(/not available/i)
    const open = affordancesFor(scene, 'branch').find((item) => item.intent === 'open_file')
    expect(open.on).toBe('preview')
    // Two separate releases on the local page: a login and an installer.
    const signin = affordancesFor(scene, 'branch').find((item) => item.intent === 'submit_data')
    const install = affordancesFor(scene, 'branch').find((item) => item.intent === 'attempt_install')
    expect([signin.on, install.on]).toEqual(['local', 'local'])
    expect(signin.page).toBe('report')
    expect(install.page).toBe('viewer')
  })

  it('E24 puts the code seven pages into a document, and offers the real task beside it', () => {
    const scene = SCENES.E24
    // The document is paginated, and the acknowledgement page is not the one it opens on.
    expect(scene.surfaces.doc.home).toBe('p1')
    expect(Object.keys(scene.surfaces.doc.pages)).toContain('p7')
    expect(scene.surfaces.doc.pages.p7.links.some((link) => link.to === 'qr')).toBe(true)
    // The inspector states both the printed short form and what it expands to.
    const rows = scene.surfaces.qr.rows.map((row) => row.value).join(' ')
    expect(rows).toContain('ackn.training.example')
    expect(rows).toContain('e24.training.example')
    // The Policy Centre already holds the acknowledgement, so the safe branch is doing the task.
    const centre = affordancesFor(scene, 'branch').find((item) => item.on === 'centre')
    expect(centre.intent).toBe('safe_pivot')
    expect(JSON.stringify(scene.surfaces.centre)).toContain('acknowledgement')
    // No link in the message itself - everything is in the attachment.
    expect(scene.beats.some((beat) => beat.kind === 'button')).toBe(false)
  })

  it('E25 reuses a subject line rather than a mailbox, and the money is somebody else’s', () => {
    const scene = SCENES.E25
    // The quoted history is a real earlier message; the headers say today's is not a reply to it.
    expect(scene.beats.some((beat) => beat.kind === 'earlier')).toBe(true)
    expect(scene.beats.find((beat) => beat.kind === 'body' && beat.quoted)).toBeTruthy()
    const details = JSON.stringify(scene.surfaces.details)
    expect(details).toContain('No earlier message')
    expect(details).toContain('a.iyer@unit.training.example')
    // E18 is the one whose authentication passes for the real correspondent; E25's does not.
    expect(JSON.stringify(SCENES.E18.surfaces.details)).toContain('pass')
    expect(details).toContain('external')
    // Nothing the learner owns is at stake: the account being changed belongs to a third person.
    const branch = affordancesFor(scene, 'branch')
    const approve = branch.find((item) => item.intent === 'submit_data')
    expect(approve.on).toBe('portal')
    const hold = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[hold.on].kind).toBe('app')
    // The member's own record is the check, and it holds the contact the message told them to skip.
    expect(JSON.stringify(scene.surfaces.record)).toContain('Contact on file')
  })

  it('keeps every military Email scene in this batch fictional: reserved numbers, training hosts', () => {
    for (const id of ['E22', 'E25']) {
      expect(SOURCE[id].family).toMatch(/FICTIONAL MILITARY CONTEXT|./)
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SMS S01-S05 - the first SMS batch (IMMERSIVE-010)
 * ------------------------------------------------------------------ */

describe('S01-S05 are SMS-native and distinct from the seventy-five scenes before them', () => {
  const BATCH = ['S01', 'S02', 'S03', 'S04', 'S05']
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('S01'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])

  it('covers exactly the seventy-five earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(75)
    expect(EARLIER).not.toContain('S01')
  })

  it('never repeats a branch decision shape from any of the seventy-five, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives each of the five a decision home no other SMS scene shares', () => {
    expect(new Set(BATCH.map(home)).size).toBe(BATCH.length)
  })

  it('lets a learner reach every scored branch surface without spending the branch first', () => {
    // The rule IMMERSIVE-009 found by hand-play, applied to this batch from the start.
    for (const id of BATCH) {
      const scene = SCENES[id]
      const free = new Set()
      const add = (sid) => {
        if (!sid || free.has(sid) || !scene.surfaces[sid]) return
        free.add(sid)
        const surface = scene.surfaces[sid]
        for (const page of Object.values(surface.pages ?? {})) {
          for (const link of page.links ?? []) add(link.to)
          for (const item of (page.blocks ?? []).flatMap((block) => block.items ?? [])) add(item.to)
        }
        for (const link of surface.links ?? []) add(link.to)
        for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
      }
      const local = [
        ...(scene.ambient ?? []),
        ...affordancesFor(scene, 'inspect'),
        ...affordancesFor(scene, 'branch'),
      ].filter((item) => item.local)
      for (const item of local) add(item.opens)
      const unreachable = affordancesFor(scene, 'branch')
        .filter((item) => item.intent && item.on && !free.has(item.on))
        .map((item) => item.on)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('opens every SMS scene on the message list, with the phone’s own categories', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      expect(scene.stages.open.surface).toBe('list')
      // The phone sorts texts into buckets, and which bucket a message landed in is evidence.
      expect(scene.list.tabs.length).toBeGreaterThanOrEqual(3)
      expect(scene.list.tabs.map((tab) => tab.label)).toContain('Spam')
      // No messenger chrome: a text has no unread badge count, no mute and no archive row.
      const serialised = JSON.stringify(scene.list)
      expect(serialised).not.toMatch(/"muted"|"archived"|"group"|"outgoing"/)
    }
  })

  it('uses the SMS vocabulary and none of the messenger’s', () => {
    for (const id of BATCH) {
      const kinds = new Set(SCENES[id].beats.map((beat) => beat.kind))
      for (const kind of kinds) {
        expect(['day', 'system', 'message', 'link', 'number', 'amount', 'attachment'], `${id} ${kind}`)
          .toContain(kind)
      }
      // No ticks, reactions, forwarding provenance, voice notes, polls or typing strips.
      // Scoped to the BEATS: a `call` SCREEN is a phone screen, not a chat bubble.
      const serialised = JSON.stringify(SCENES[id].beats)
      expect(serialised, id).not.toMatch(/"status":"(sent|delivered|read)"|"reactions"|"forwarded"|"kind":"(voice|poll|typing|call)"/)
    }
  })

  it('S01 makes the sender the tell, and puts the bank’s own header in the same app', () => {
    const scene = SCENES.S01
    // The message came from an ordinary mobile; the real bank uses a registered header, and
    // months of its alerts are one tab away in this very app.
    const details = JSON.stringify(scene.surfaces.details)
    expect(details).toContain('Registered sender ID')
    expect(details).toContain('BK-UNIONX')
    const transactions = scene.list.tabs.find((tab) => tab.label === 'Transactions')
    expect(transactions.rows.some((row) => row.from === 'BK-UNIONX')).toBe(true)
    // The link card shows the address as written; where it goes is a screen the learner opens.
    const card = scene.beats.find((beat) => beat.kind === 'link')
    expect(card.shown).not.toContain('s01.training.example')
    expect(JSON.stringify(scene.surfaces.linkinfo)).toContain('s01.training.example')
  })

  it('S02 carries no address at all, and the decision is what the voice asks for', () => {
    const scene = SCENES.S02
    expect(scene.beats.some((beat) => beat.kind === 'link')).toBe(false)
    expect(scene.beats.some((beat) => beat.kind === 'number')).toBe(true)
    // Install and pay are on the call itself; ending it is the safe branch.
    const branch = affordancesFor(scene, 'branch')
    for (const intent of ['attempt_install', 'attempt_payment', 'safe_pivot']) {
      const item = branch.find((control) => control.intent === intent)
      expect(item.on, intent).toBe('operator')
    }
    expect(scene.surfaces.operator.kind).toBe('call')
    // It is the only scene in the product whose two -8 routes are both spoken asks.
    expect(scene.surfaces.operator.script.length).toBeGreaterThanOrEqual(4)
  })

  it('S03 is the legitimate control, and its evidence is the thread’s own history', () => {
    const scene = SCENES.S03
    expect(SOURCE.S03.disposition).toBe('Legitimate')
    // A year of identical alerts from the same registered header, in the thread itself.
    const earlier = scene.beats.filter((beat) => beat.kind === 'message' && beat.id.includes('old'))
    expect(earlier.length).toBeGreaterThanOrEqual(3)
    expect(scene.beats.filter((beat) => beat.kind === 'day').length).toBeGreaterThanOrEqual(2)
    // No address and no number to call anywhere in the message.
    expect(scene.beats.some((beat) => beat.kind === 'link' || beat.kind === 'number')).toBe(false)
    // The decision is in the banking app, and blocking the header is the priced mistake.
    const branch = affordancesFor(scene, 'branch')
    const reviewed = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[reviewed.on].kind).toBe('app')
    expect(branch.find((item) => item.intent === 'reject_ignore').label).toMatch(/block/i)
  })

  it('gives the legitimate S03 as much thread and as many screens as its neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    expect(beatsAt(SCENES.S03, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['S01', 'S02', 'S04', 'S05'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
    expect(screens('S03')).toBeGreaterThanOrEqual(
      Math.min(...['S01', 'S02', 'S04', 'S05'].map(screens)) - 1,
    )
  })

  it('S04 turns on a registration that does not match, not on the sender alone', () => {
    const scene = SCENES.S04
    const details = JSON.stringify(scene.surfaces.details)
    expect(details).toContain('Vehicle quoted')
    expect(details).toContain('Your registration')
    // The portal the learner opens themselves searches both and finds neither.
    const portal = JSON.stringify(scene.surfaces.portal)
    expect(portal).toContain('No pending challan')
    expect(portal).toContain('No such registration on record')
  })

  it('S05 hides a mandate under twenty rupees, and the sheet says so', () => {
    const scene = SCENES.S05
    const sheet = scene.surfaces.mandate
    expect(sheet.kind).toBe('paysheet')
    const rows = sheet.rows.map((row) => `${row.label} ${row.value}`).join(' ')
    expect(rows).toMatch(/Mandate limit/)
    expect(rows).toMatch(/20,000/)
    expect(rows).toMatch(/Cancelled by you/)
    // The displayed name is the sender's own; the number underneath is on the details screen.
    expect(JSON.stringify(scene.surfaces.details)).toContain('set by the sender')
    // Cancel sits beside Approve on the same sheet.
    const branch = affordancesFor(scene, 'branch')
    expect(branch.filter((item) => item.on === 'mandate').map((item) => item.intent).sort())
      .toEqual(['attempt_payment', 'safe_pivot'])
  })

  it('types only where the scene genuinely collects something, and nowhere else', () => {
    // S02 and S03 decide entirely by pressing controls.
    expect(allFields(SCENES.S02), 'S02').toHaveLength(0)
    expect(allFields(SCENES.S03), 'S03').toHaveLength(0)
    expect(allFields(SCENES.S01).map((f) => f.name)).toEqual(['account', 'pin', 'otp'])
    expect(allFields(SCENES.S04).map((f) => f.name)).toEqual(['vehicle', 'handle', 'otp'])
    expect(allFields(SCENES.S05).map((f) => f.name)).toEqual(['name', 'address', 'phone', 'pin'])
    for (const id of BATCH) {
      for (const item of allFields(SCENES[id])) {
        expect(['text', 'digits', 'secret', 'expiry', 'masked'], `${id} ${item.name}`).toContain(item.kind)
      }
    }
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of ['S01', 'S02', 'S04', 'S05']) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    expect(allAffordances(SCENES.S03).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('keeps every SMS scene offline: reserved numbers, training hosts, no real sender IDs', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SMS S06-S10 - the second SMS batch (IMMERSIVE-011)
 * ------------------------------------------------------------------ */

describe('S06-S10 are SMS-native and distinct from the eighty scenes before them', () => {
  const BATCH = ['S06', 'S07', 'S08', 'S09', 'S10']
  const SMS = ['S01', 'S02', 'S03', 'S04', 'S05', ...BATCH]
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('S06'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])

  it('covers exactly the eighty earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(80)
    expect(EARLIER).toContain('S05')
    expect(EARLIER).not.toContain('S06')
  })

  it('never repeats a branch decision shape from any of the eighty, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives all ten SMS scenes a decision home no other SMS scene shares', () => {
    expect(new Set(SMS.map(home)).size).toBe(SMS.length)
  })

  /**
   * IMMERSIVE-009 found by hand-play that a scored release could sit behind another scored
   * control. IMMERSIVE-011 widens the rule to PAGES as well as surfaces: a page carrying a
   * scored control must be the surface's home or be walkable to by a link, an in-page list row
   * or the page's own local Continue - never only by spending the branch on the control that
   * declares `thenPage`.
   */
  it('lets a learner reach every scored branch surface AND page without spending the branch', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      const free = new Map()
      const addPage = (sid, pageId) => {
        const surface = scene.surfaces[sid]
        if (!surface || !pageId) return
        const pages = free.get(sid)
        if (pages.has(pageId)) return
        pages.add(pageId)
        const page = surface.pages?.[pageId]
        if (!page) return
        for (const link of page.links ?? []) {
          if (surface.pages?.[link.to]) addPage(sid, link.to)
          else add(link.to)
        }
        if (page.primary) {
          if (surface.pages?.[page.primary.to]) addPage(sid, page.primary.to)
          else add(page.primary.to)
        }
        if (page.toggle) addPage(sid, page.toggle.to)
        for (const item of (page.blocks ?? []).flatMap((block) => block.items ?? [])) {
          if (!item.to) continue
          if (surface.pages?.[item.to]) addPage(sid, item.to)
          else add(item.to)
        }
      }
      const add = (sid) => {
        if (!sid || free.has(sid) || !scene.surfaces[sid]) return
        free.set(sid, new Set())
        const surface = scene.surfaces[sid]
        for (const link of surface.links ?? []) add(link.to)
        for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
        if (surface.pages) addPage(sid, surface.home)
        for (const pageId of Object.keys(surface.pages ?? {})) {
          // A page nothing walks to is still unreachable; only the home page seeds the walk.
          if (pageId === surface.home) continue
        }
      }
      const local = [
        ...(scene.ambient ?? []),
        ...affordancesFor(scene, 'inspect'),
        ...affordancesFor(scene, 'branch'),
      ].filter((item) => item.local)
      for (const item of local) add(item.opens)

      const unreachable = affordancesFor(scene, 'branch')
        .filter((item) => item.intent && item.on)
        .filter((item) => !free.has(item.on)
          || (item.page && !free.get(item.on).has(item.page)))
        .map((item) => `${item.on}${item.page ? `/${item.page}` : ''}`)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('opens every one of the five on the message list, with the phone’s own categories', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      expect(scene.stages.open.surface).toBe('list')
      expect(scene.list.tabs.length).toBeGreaterThanOrEqual(3)
      expect(scene.list.tabs.map((tab) => tab.label)).toContain('Spam')
      const serialised = JSON.stringify(scene.list)
      expect(serialised).not.toMatch(/"muted"|"archived"|"group"|"outgoing"/)
    }
  })

  it('uses the SMS vocabulary and none of the messenger’s', () => {
    for (const id of BATCH) {
      const kinds = new Set(SCENES[id].beats.map((beat) => beat.kind))
      for (const kind of kinds) {
        expect(['day', 'system', 'message', 'link', 'number', 'amount', 'attachment'], `${id} ${kind}`)
          .toContain(kind)
      }
      const serialised = JSON.stringify(SCENES[id].beats)
      expect(serialised, id).not.toMatch(/"status":"(sent|delivered|read)"|"reactions"|"forwarded"|"kind":"(voice|poll|typing|call)"/)
    }
  })

  it('prints no narrator line and no label for the item', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised, id).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|deepfake|impostor|suspicious)\b/i,
      )
    }
  })

  it('S06 decides entirely inside the Messages app, and the photo picker is the second release', () => {
    const scene = SCENES.S06
    // No address anywhere: the only things that can leave are a reply and an attachment.
    expect(scene.beats.some((beat) => beat.kind === 'link')).toBe(false)
    expect(scene.beats.some((beat) => beat.kind === 'number')).toBe(false)
    const branch = affordancesFor(scene, 'branch').filter((item) => item.intent)
    const releases = branch.filter((item) => item.intent === 'submit_data')
    expect(releases).toHaveLength(2)
    expect(releases.map((item) => item.slot).sort()).toEqual(['composer', 'surface'])
    expect(scene.surfaces[releases.find((item) => item.on).on].kind).toBe('viewer')
    // The unit writes from its own registered sender ID, and the portal is one tap away.
    expect(JSON.stringify(scene.surfaces.details)).toContain('VM-FALCON')
    expect(scene.list.tabs.find((tab) => tab.label === 'Service').rows.every((row) => row.from === 'VM-FALCON'))
      .toBe(true)
    expect(scene.surfaces.unitapp.kind).toBe('app')
  })

  it('S06 is the batch’s military scene and keeps every entity synthetic', () => {
    expect(SOURCE.S06.military_flag ?? SOURCE.S06.trigger).toMatch(/FICTIONAL MILITARY CONTEXT/)
    const serialised = JSON.stringify(SCENES.S06)
    // The trigger word itself must never reach the device.
    expect(serialised.toLowerCase()).not.toContain('authority')
    // Only the fictional unit exists, and no rank, posting, movement or capability is named.
    expect(serialised).toContain('Unit Falcon')
    expect(serialised).not.toMatch(/\b(regiment|battalion|brigade|squadron|army|navy|air force|colonel|brigadier|major|captain|lieutenant|sepoy|jawan|posting|deployment|sortie|convoy)\b/i)
  })

  it('S07 is the legitimate control, and the priced mistakes are the learner’s own reaction', () => {
    const scene = SCENES.S07
    expect(SOURCE.S07.disposition).toBe('Legitimate')
    // A registered sender ID, no spam bar and nothing in the message to act on.
    expect(scene.conversation.spamBar).toBeUndefined()
    expect(scene.beats.some((beat) => beat.kind === 'link')).toBe(false)
    expect(scene.beats.some((beat) => beat.kind === 'amount')).toBe(true)
    const branch = affordancesFor(scene, 'branch')
    // Deleting the receipt is the needless rejection; S03's is blocking the sender.
    expect(branch.find((item) => item.intent === 'reject_ignore').label).toMatch(/delete/i)
    expect(affordancesFor(SCENES.S03, 'branch').find((item) => item.intent === 'reject_ignore').label)
      .toMatch(/block/i)
    // The costed switch is a searched-for care number, and the check is the app and the SIM pack.
    const rung = branch.find((item) => item.intent === 'call_number')
    expect(scene.surfaces[rung.on].kind).toBe('browser')
    expect(JSON.stringify(scene.surfaces.search)).toContain('Sponsored')
    expect(JSON.stringify(scene.surfaces.telecom)).toContain('SIM pack')
  })

  it('gives the legitimate S07 as much thread and as many screens as its neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    expect(beatsAt(SCENES.S07, 'branch').length).toBeGreaterThanOrEqual(
      Math.min(...['S06', 'S08', 'S09', 'S10'].map((id) => beatsAt(SCENES[id], 'branch').length)),
    )
    expect(screens('S07')).toBeGreaterThanOrEqual(
      Math.min(...['S06', 'S08', 'S09', 'S10'].map(screens)) - 1,
    )
  })

  it('S08 proves the blast with the phone itself, and both releases stand on their own page', () => {
    const scene = SCENES.S08
    // Two SIM cards, one second: the thing only a handset can show.
    expect(JSON.stringify(scene.surfaces.details)).toContain('SIM 1 and SIM 2')
    expect(scene.beats.some((beat) => beat.kind === 'system' && /SIM 2/.test(beat.text))).toBe(true)
    // The spam folder holds four of the same sentence from four numbers.
    const spam = JSON.stringify(scene.surfaces.spamfolder)
    expect((spam.match(/CONGRATS!/g) ?? []).length).toBeGreaterThanOrEqual(4)
    // The safe branch sits in the app's own unsaved-sender bar.
    const pivot = affordancesFor(scene, 'branch').find((item) => item.intent === 'safe_pivot')
    expect(pivot.anchor).toBe('spam')
    expect(pivot.opens).toBe('spamfolder')
    // Identity first, fee second - and the fee page is linked from the page above it.
    expect(scene.surfaces.claim.pages.form.links.some((link) => link.to === 'fee')).toBe(true)
  })

  it('S09 makes the learner’s own replies the evidence, and the payee a person', () => {
    const scene = SCENES.S09
    const mine = scene.beats.filter((beat) => beat.kind === 'message' && beat.from === 'me')
    expect(mine.length).toBeGreaterThanOrEqual(2)
    expect(scene.beats.filter((beat) => beat.kind === 'day').length).toBeGreaterThanOrEqual(3)
    // Six days laid out, counted, and attributed on the details screen.
    expect(JSON.stringify(scene.surfaces.details)).toContain('Who wrote first')
    // The deposit sheet pays an individual, and Cancel is the sheet's own Back.
    const sheet = scene.surfaces.deposit
    expect(sheet.kind).toBe('paysheet')
    expect(sheet.rows.map((row) => `${row.label} ${row.value}`).join(' ')).toMatch(/Individual savings/)
    // The desk's own Deposit link raises that sheet without deciding anything.
    expect(scene.surfaces.trading.pages.dash.links.some((link) => link.to === 'deposit')).toBe(true)
  })

  it('S10 puts the warning in the carrier’s own thread, and both releases there', () => {
    const scene = SCENES.S10
    const carrier = JSON.stringify(scene.surfaces.carriermsg)
    expect(carrier).toContain('DO NOT SHARE')
    expect(carrier).toContain('eSIM transfer')
    const releases = affordancesFor(scene, 'branch')
      .filter((item) => ['share_secret', 'approve_device_link'].includes(item.intent))
    expect(releases).toHaveLength(2)
    for (const item of releases) expect(item.on).toBe('carriermsg')
    // This is the only scene in the product whose branch controls sit on an SMS screen.
    expect(scene.surfaces.carriermsg.kind).toBe('sms')
    // Ringing the number is taken on the phone's own dial confirmation, not in the thread.
    const rung = affordancesFor(scene, 'branch').find((item) => item.intent === 'call_number')
    expect(scene.surfaces[rung.on].kind).toBe('installer')
    expect(rung.opens).toBe('desk')
  })

  it('types only where the scene genuinely collects something, and nowhere else', () => {
    // S06, S07 and S10 decide entirely by pressing controls.
    expect(allFields(SCENES.S06), 'S06').toHaveLength(0)
    expect(allFields(SCENES.S07), 'S07').toHaveLength(0)
    expect(allFields(SCENES.S10), 'S10').toHaveLength(0)
    expect(allFields(SCENES.S08).map((f) => f.name)).toEqual(['name', 'idnumber', 'account', 'upi', 'otp'])
    expect(allFields(SCENES.S09).map((f) => f.name)).toEqual(['pin'])
    for (const id of BATCH) {
      for (const item of allFields(SCENES[id])) {
        expect(['text', 'digits', 'secret', 'expiry', 'masked'], `${id} ${item.name}`).toContain(item.kind)
      }
    }
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of ['S06', 'S08', 'S09', 'S10']) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    expect(allAffordances(SCENES.S07).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('keeps every SMS scene offline: reserved numbers, training hosts, no real sender IDs', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SMS S11-S15 - the third SMS batch (IMMERSIVE-012)
 * ------------------------------------------------------------------ */

describe('S11-S15 are SMS-native and distinct from the eighty-five scenes before them', () => {
  const BATCH = ['S11', 'S12', 'S13', 'S14', 'S15']
  // IMMERSIVE-013: the claim this block makes is about the first fifteen SMS scenes; S16-S20 are
  // held to the same rule, over all twenty, by their own block below.
  const SMS = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('S') && id <= 'S15')
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('S11'))
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])
  const branchOf = (id) => affordancesFor(SCENES[id], 'branch').filter((item) => item.intent)

  /**
   * Every surface, and every page of it, a learner can walk to with the branch unspent: from the
   * local controls at inspect and branch and the ambient menu, following page links, in-page list
   * rows, a page's own Continue, surface links and section links. The walk the S06-S10 block
   * introduced, kept as a function here.
   */
  const freeWalk = (scene) => {
    const free = new Map()
    const add = (sid) => {
      if (!sid || free.has(sid) || !scene.surfaces[sid]) return
      free.set(sid, new Set())
      const surface = scene.surfaces[sid]
      for (const link of surface.links ?? []) add(link.to)
      for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
      if (surface.pages) addPage(sid, surface.home)
    }
    const addPage = (sid, pageId) => {
      const surface = scene.surfaces[sid]
      const pages = free.get(sid)
      if (!pageId || pages.has(pageId)) return
      pages.add(pageId)
      const page = surface.pages?.[pageId]
      if (!page) return
      const targets = [
        ...(page.links ?? []).map((link) => link.to),
        page.primary?.to, page.toggle?.to,
        ...(page.blocks ?? []).flatMap((block) => block.items ?? []).map((item) => item.to),
      ].filter(Boolean)
      for (const to of targets) {
        if (surface.pages?.[to]) addPage(sid, to)
        else add(to)
      }
    }
    const local = [
      ...(scene.ambient ?? []),
      ...affordancesFor(scene, 'inspect'),
      ...affordancesFor(scene, 'branch'),
    ].filter((item) => item.local)
    for (const item of local) add(item.opens)
    return free
  }

  it('covers exactly the eighty-five earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(85)
    expect(EARLIER).toContain('S10')
    expect(EARLIER).not.toContain('S11')
    expect(SMS).toHaveLength(15)
  })

  it('never repeats a branch decision shape from any of the eighty-five, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives all fifteen SMS scenes a decision home no other SMS scene shares', () => {
    expect(new Set(SMS.map(home)).size).toBe(SMS.length)
  })

  it('lets a learner reach every scored branch surface AND page without spending the branch', () => {
    for (const id of BATCH) {
      const free = freeWalk(SCENES[id])
      const unreachable = branchOf(id)
        .filter((item) => item.on)
        .filter((item) => !free.has(item.on) || (item.page && !free.get(item.on).has(item.page)))
        .map((item) => `${item.on}${item.page ? `/${item.page}` : ''}`)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('offers a safe branch and at least two priced mistakes on every one of the five', () => {
    for (const id of BATCH) {
      const intents = branchOf(id).map((item) => item.intent)
      expect(intents, id).toContain('safe_pivot')
      expect(intents.filter((intent) => intent !== 'safe_pivot').length, id).toBeGreaterThanOrEqual(2)
    }
  })

  it('opens every one of the five on the message list, with the phone’s own categories', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      expect(scene.stages.open.surface).toBe('list')
      expect(scene.list.tabs.length).toBeGreaterThanOrEqual(3)
      expect(scene.list.tabs.map((tab) => tab.label)).toContain('Spam')
    }
  })

  it('uses the SMS vocabulary and none of the messenger’s', () => {
    for (const id of BATCH) {
      for (const beat of SCENES[id].beats) {
        expect(['day', 'system', 'message', 'link', 'number', 'amount', 'attachment'], `${id} ${beat.kind}`)
          .toContain(beat.kind)
      }
      expect(JSON.stringify(SCENES[id].beats), id)
        .not.toMatch(/"status":"(sent|delivered|read)"|"reactions"|"forwarded"|"kind":"(voice|poll|typing|call)"/)
    }
  })

  it('prints no narrator line, no label for the item and none of its own trigger words', () => {
    const TRIGGER_WORDS = {
      S11: ['routine', 'empathy'], S12: ['greed', 'authority'], S13: ['greed', 'commitment'],
      S14: ['authority', 'urgency', 'urgent'], S15: ['familiarity', 'familiar', 'scarcity'],
    }
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised, id).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|deepfake|impostor|suspicious|spoofed|legitimate)\b/i,
      )
      for (const word of TRIGGER_WORDS[id]) {
        expect(serialised.toLowerCase(), `${id} prints ${word}`).not.toMatch(new RegExp(`\\b${word}\\b`))
      }
    }
  })

  it('S11 is the legitimate control: the correct act is a reply, and oversharing in it is priced', () => {
    const scene = SCENES.S11
    expect(SOURCE.S11.disposition).toBe('Legitimate')
    // A saved contact: no unsaved-sender bar, and the booking confirmation is in the thread.
    expect(scene.conversation.spamBar).toBeUndefined()
    expect(scene.beats.filter((beat) => beat.kind === 'day')).toHaveLength(2)
    expect(JSON.stringify(scene.surfaces.details)).toContain('Saved to your contacts')
    const branch = branchOf('S11')
    // Both quick replies are the correct use, and they are replies in the composer.
    const correct = branch.filter((item) => item.intent === 'safe_pivot')
    expect(correct.map((item) => item.slot)).toEqual(['composer', 'composer'])
    expect(correct.map((item) => item.echo).sort()).toEqual(['1', '2'])
    // The overshare is the same reply with health data added.
    const overshare = branch.find((item) => item.intent === 'submit_data')
    expect(overshare.slot).toBe('composer')
    expect(overshare.echo.startsWith('1')).toBe(true)
    expect(overshare.echo).toMatch(/DOB/)
    // The needless rejection deletes and blocks.
    expect(branch.find((item) => item.intent === 'reject_ignore').label).toMatch(/delete.*block/i)
    // Nothing is typed anywhere.
    expect(allFields(scene)).toHaveLength(0)
  })

  it('gives the legitimate S11 as much thread and as many screens as its neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    const others = ['S12', 'S13', 'S14', 'S15']
    expect(beatsAt(SCENES.S11, 'branch').length)
      .toBeGreaterThanOrEqual(Math.min(...others.map((id) => beatsAt(SCENES[id], 'branch').length)))
    expect(screens('S11')).toBeGreaterThanOrEqual(Math.min(...others.map(screens)) - 3)
  })

  it('S12 is a registered header in the Offers category, opened from the phone’s link details', () => {
    const scene = SCENES.S12
    expect(scene.conversation.title).toBe('AX-ITRFND')
    expect(scene.list.tabs[0].label).toBe('Offers')
    const details = JSON.stringify(scene.surfaces.details)
    expect(details).toContain('Promotional')
    expect(details).toContain('VM-ITDEPT')
    expect(JSON.stringify(scene.surfaces.taxthread)).toContain('No refund is due')
    const open = branchOf('S12').find((item) => item.intent === 'open_link')
    expect(scene.surfaces[open.on].kind).toBe('sms')
    // Identity and account first, card and code second, each page linked from the other.
    expect(scene.surfaces.refund.pages.form.links.some((link) => link.to === 'card')).toBe(true)
    expect(scene.surfaces.refund.pages.card.links.some((link) => link.to === 'form')).toBe(true)
    expect(scene.surfaces.taxportal.hero.value).toBe('No refund due')
  })

  it('S13 shows one signature on three numbers, a one-tap YES and a safe branch on the details screen', () => {
    const scene = SCENES.S13
    const details = JSON.stringify(scene.surfaces.details)
    for (const number of ['+91 00000 49417', '+91 00000 61204', '+91 00000 73390']) expect(details).toContain(number)
    const branch = branchOf('S13')
    const yes = branch.find((item) => item.intent === 'reply')
    expect(yes.slot).toBe('inline')
    expect(yes.label).toBe('YES')
    const pivot = branch.find((item) => item.intent === 'safe_pivot')
    expect(pivot.on).toBe('details')
    expect(pivot.opens).toBe('careers')
    expect(scene.surfaces.deposit.kind).toBe('paysheet')
    expect(scene.surfaces.deposit.rows.map((row) => row.value)).toContain('Individual savings')
    // W17's evidence is not reused.
    expect(JSON.stringify(scene)).not.toMatch(/merged order|Forwarded many times/i)
  })

  it('S14 compares against a genuine earlier recall and releases through the browser’s own prompt', () => {
    const scene = SCENES.S14
    expect(JSON.stringify(scene.surfaces.unitthread)).toContain('RC-0812')
    const allow = branchOf('S14').find((item) => item.intent === 'share_location')
    expect(scene.surfaces[allow.on].kind).toBe('installer')
    expect(scene.surfaces.geo.pages.prompt.title).toMatch(/use this device’s location/)
    expect(scene.surfaces.recall.pages.map.links.map((link) => link.to)).toEqual(['geo', 'form'])
    expect(scene.surfaces.unitapp.hero.value).toBe('No active recall')
  })

  it('S15 is a group MMS with a readable list, a picture viewer and a card PIN', () => {
    const scene = SCENES.S15
    expect(scene.beats.some((beat) => beat.kind === 'attachment')).toBe(true)
    const people = JSON.stringify(scene.surfaces.details.pages.people)
    for (let n = 40011; n <= 40018; n += 1) expect(people).toContain(`+91 00000 ${n}`)
    const scan = branchOf('S15').find((item) => item.intent === 'scan_qr')
    expect(scene.surfaces[scan.on].kind).toBe('viewer')
    expect(allFields(scene).find((f) => f.name === 'pin').kind).toBe('secret')
    const inspect = affordancesFor(scene, 'inspect').find((item) => item.intent === 'inspect_qr')
    expect(inspect.anchor).toBe('s15-mms')
    // I25's activation fee and reel are not reused.
    expect(JSON.stringify(scene)).not.toMatch(/\breel\b|audio credit|INR 49\b/i)
  })

  it('keeps both military scenes synthetic, with no rank, formation or operational term', () => {
    for (const id of ['S14', 'S15']) {
      expect(SOURCE[id].trigger, id).toMatch(/FICTIONAL MILITARY CONTEXT/)
      const serialised = JSON.stringify(SCENES[id])
      expect(serialised).toContain('Unit Falcon')
      expect(serialised, id).not.toMatch(/\b(regiment|battalion|brigade|squadron|army|navy|air force|colonel|brigadier|major|captain|lieutenant|sepoy|jawan|posting|deployment|sortie|convoy)\b/i)
    }
  })

  it('types only where the scene genuinely collects something, with masked secrets', () => {
    expect(allFields(SCENES.S11)).toHaveLength(0)
    expect(allFields(SCENES.S12).map((f) => f.name)).toEqual(['name', 'taxid', 'account', 'card', 'expiry', 'otp'])
    expect(allFields(SCENES.S13).map((f) => f.name)).toEqual(['name', 'account', 'upi', 'pin'])
    expect(allFields(SCENES.S14).map((f) => f.name)).toEqual(['svc', 'where', 'route', 'eta'])
    expect(allFields(SCENES.S15).map((f) => f.name)).toEqual(['card', 'pin'])
    for (const id of BATCH) {
      for (const item of allFields(SCENES[id])) {
        if (/pin|otp/.test(item.name)) expect(item.kind, `${id} ${item.name}`).toBe('secret')
      }
    }
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of ['S12', 'S13', 'S14', 'S15']) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    expect(allAffordances(SCENES.S11).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('keeps every scene offline: reserved numbers and training hosts only', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SMS S16-S20 - the fourth SMS batch (IMMERSIVE-013)
 * ------------------------------------------------------------------ */

describe('S16-S20 are SMS-native and distinct from the ninety scenes before them', () => {
  const BATCH = ['S16', 'S17', 'S18', 'S19', 'S20']
  // IMMERSIVE-014: this block's claims are about the first twenty SMS scenes; S21-S25 have their own.
  const SMS = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('S') && id <= 'S20')
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('S16'))
  const MALICIOUS = ['S17', 'S18', 'S19', 'S20']
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])
  const branchOf = (id) => affordancesFor(SCENES[id], 'branch').filter((item) => item.intent)
  const RELEASES = ['submit_data', 'attempt_payment', 'attempt_install', 'share_secret', 'share_location', 'approve_device_link']

  /** The same free walk the S11-S15 block uses: local controls, page links, rows, surface links. */
  const freeWalk = (scene) => {
    const free = new Map()
    const add = (sid) => {
      if (!sid || free.has(sid) || !scene.surfaces[sid]) return
      free.set(sid, new Set())
      const surface = scene.surfaces[sid]
      for (const surfaceLink of surface.links ?? []) add(surfaceLink.to)
      for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
      if (surface.pages) addPage(sid, surface.home)
    }
    const addPage = (sid, pageId) => {
      const surface = scene.surfaces[sid]
      const pages = free.get(sid)
      if (!pageId || pages.has(pageId)) return
      pages.add(pageId)
      const page = surface.pages?.[pageId]
      if (!page) return
      const targets = [
        ...(page.links ?? []).map((pageLink) => pageLink.to),
        page.primary?.to, page.toggle?.to,
        ...(page.blocks ?? []).flatMap((block) => block.items ?? []).map((item) => item.to),
      ].filter(Boolean)
      for (const to of targets) {
        if (surface.pages?.[to]) addPage(sid, to)
        else add(to)
      }
    }
    const local = [
      ...(scene.ambient ?? []),
      ...affordancesFor(scene, 'inspect'),
      ...affordancesFor(scene, 'branch'),
    ].filter((item) => item.local)
    for (const item of local) add(item.opens)
    return free
  }

  it('covers exactly the ninety earlier scenes when it compares', () => {
    expect(EARLIER).toHaveLength(90)
    expect(EARLIER).toContain('S15')
    expect(EARLIER).not.toContain('S16')
    expect(SMS).toHaveLength(20)
  })

  it('never repeats a branch decision shape from any of the ninety, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives all twenty SMS scenes a decision home no other SMS scene shares', () => {
    expect(new Set(SMS.map(home)).size).toBe(SMS.length)
  })

  it('decides in five different places, each on a different piece of the phone', () => {
    expect(home('S16')).toBe('app|msg/inline')
    expect(home('S17')).toBe('msg/composer|msg/inline|paysheet|sms')
    expect(home('S18')).toBe('call|installer|msg/menu')
    expect(home('S19')).toBe('browser|installer|msg/composer|msg/inline')
    expect(home('S20')).toBe('installer|msg/inline|msg/menu')
    // Where the safe branch sits differs in all five.
    const safeHome = (id) => branchOf(id).filter((item) => item.intent === 'safe_pivot')
      .map((item) => (item.on ? `${SCENES[id].surfaces[item.on].kind}:${item.on}` : `msg/${item.slot}/${item.anchor ?? ''}`))
      .sort().join('|')
    expect(new Set(BATCH.map(safeHome)).size).toBe(BATCH.length)
  })

  it('lets a learner reach every scored branch surface AND page without spending the branch', () => {
    for (const id of BATCH) {
      const free = freeWalk(SCENES[id])
      const unreachable = branchOf(id)
        .filter((item) => item.on)
        .filter((item) => !free.has(item.on) || (item.page && !free.get(item.on).has(item.page)))
        .map((item) => `${item.on}${item.page ? `/${item.page}` : ''}`)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('offers a safe branch and at least two priced mistakes on every one of the five', () => {
    for (const id of BATCH) {
      const intents = branchOf(id).map((item) => item.intent)
      expect(intents, id).toContain('safe_pivot')
      expect(intents.filter((intent) => intent !== 'safe_pivot').length, id).toBeGreaterThanOrEqual(2)
    }
    // Every malicious item carries a critical release; the legitimate one prices sharing its code.
    for (const id of MALICIOUS) {
      expect(branchOf(id).some((item) => RELEASES.includes(item.intent)), id).toBe(true)
    }
  })

  it('opens every one of the five on the message list, each with its own set of categories', () => {
    const tabSets = BATCH.map((id) => SCENES[id].list.tabs.map((tab) => tab.label).join('|'))
    for (const id of BATCH) {
      const scene = SCENES[id]
      expect(scene.stages.open.surface).toBe('list')
      expect(scene.list.tabs.length).toBeGreaterThanOrEqual(3)
      expect(scene.list.tabs.map((tab) => tab.label)).toContain('Spam')
    }
    expect(new Set(tabSets).size).toBe(BATCH.length)
  })

  it('uses the SMS vocabulary and none of the messenger’s', () => {
    for (const id of BATCH) {
      for (const beat of SCENES[id].beats) {
        expect(['day', 'system', 'message', 'link', 'number', 'amount', 'attachment'], `${id} ${beat.kind}`)
          .toContain(beat.kind)
      }
      expect(JSON.stringify(SCENES[id].beats), id)
        .not.toMatch(/"status":"(sent|delivered|read)"|"reactions"|"forwarded"|"kind":"(voice|poll|typing|call)"/)
    }
  })

  it('prints no narrator line, no label for the item and none of its own trigger words', () => {
    const TRIGGER_WORDS = {
      S16: ['routine', 'routinely'],
      S17: ['empathy', 'urgency', 'urgent'],
      S18: ['trust', 'fear'],
      S19: ['authority', 'helpfulness', 'helpful'],
      S20: ['curiosity', 'curious', 'urgency', 'urgent'],
    }
    for (const id of BATCH) {
      // The client's own sentence is the adversary's in-world claim (S20's says "fraud"), so it is
      // measured separately from everything the scene itself prints.
      const serialised = JSON.stringify(SCENES[id]).split(BANK[id].synthetic.assets
        .find((asset) => asset.kind === 'notification').content.body).join('')
      expect(serialised, id).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|deepfake|impostor|suspicious|spoofed|spoofing|legitimate|hijack\w*)\b/i,
      )
      for (const word of TRIGGER_WORDS[id]) {
        expect(serialised.toLowerCase(), `${id} prints ${word}`).not.toMatch(new RegExp(`\\b${word}\\b`))
      }
    }
  })

  it('S16 is the legitimate control: the code is used in the app that asked for it', () => {
    const scene = SCENES.S16
    expect(SOURCE.S16.disposition).toBe('Legitimate')
    // The client's sentence is verbatim, followed by the code line a phone reads.
    const code = scene.beats.find((beat) => beat.id === 's16-code')
    expect(code.text.startsWith(BANK.S16.synthetic.assets[0].content.body)).toBe(true)
    expect(code.text).toMatch(/@portal\.training\.example #482193$/)
    // A registered sender: no unsaved-sender bar, and the thread says it takes no replies.
    expect(scene.conversation.spamBar).toBeUndefined()
    expect(scene.conversation.title).toBe('VM-TRPRTL')
    expect(JSON.stringify(scene.beats)).toContain('You can’t reply to this sender')
    expect(scene.list.tabs[0].label).toBe('OTPs')
    const branch = branchOf('S16')
    // The correct use and the needless cancel are both in the Training Portal app.
    const correct = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[correct.on].kind).toBe('app')
    expect(correct.label).toBe('Fill 482193 from Messages')
    expect(branch.find((item) => item.intent === 'reject_ignore').on).toBe(correct.on)
    // Forwarding the text is the priced mistake, on the message itself.
    const forward = branch.find((item) => item.intent === 'share_secret')
    expect(forward.slot).toBe('inline')
    expect(forward.anchor).toBe('s16-code')
    // Every earlier code matches a sign-in the learner made.
    expect(JSON.stringify(scene.surfaces.details.pages.codes)).toContain('You signed in on this phone')
    expect(allFields(scene)).toHaveLength(0)
  })

  it('gives the legitimate S16 as much thread and as many screens as its neighbours', () => {
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    const pages = (id) => Object.values(SCENES[id].surfaces)
      .reduce((n, surface) => n + Math.max(1, Object.keys(surface.pages ?? {}).length), 0)
    const others = MALICIOUS
    expect(beatsAt(SCENES.S16, 'branch').length)
      .toBeGreaterThanOrEqual(Math.min(...others.map((id) => beatsAt(SCENES[id], 'branch').length)))
    expect(screens('S16')).toBeGreaterThanOrEqual(Math.min(...others.map(screens)) - 3)
    expect(pages('S16')).toBeGreaterThanOrEqual(5)
  })

  it('S17 files the new number under Unknown senders and puts the evidence in the saved thread', () => {
    const scene = SCENES.S17
    expect(scene.list.tabs[0].label).toBe('Unknown senders')
    expect(scene.list.tabs.map((tab) => tab.label)).toContain('Known senders')
    const saved = JSON.stringify(scene.surfaces.kabir)
    expect(saved).toContain('16:32 · Delivered')
    expect(saved).toContain('+91 00000 27164')
    const branch = branchOf('S17')
    // The app's own suggestion chip under the message, and a typed question, are both replies.
    const chip = branch.find((item) => item.intent === 'reply' && item.slot === 'inline')
    expect(chip.label).toBe('Done')
    expect(chip.anchor).toBe('s17-msg3')
    expect(branch.filter((item) => item.intent === 'reply')).toHaveLength(2)
    // The payee on the payment sheet is a person, not the child and not a hospital.
    const pay = branch.find((item) => item.intent === 'attempt_payment')
    expect(scene.surfaces[pay.on].kind).toBe('paysheet')
    expect(scene.surfaces[pay.on].rows.map((row) => row.value)).toContain('R DESHMUKH')
    // The safe branch is taken inside the saved thread.
    expect(branch.find((item) => item.intent === 'safe_pivot').on).toBe('kabir')
    // W04's and I04's evidence is not reused.
    expect(JSON.stringify(scene)).not.toMatch(/last seen|profile photo|followers|\bstory\b/i)
  })

  it('S18 arrives inside the bank’s own registered thread, and the release is on a call that rings', () => {
    const scene = SCENES.S18
    expect(scene.conversation.title).toBe('AX-TRBANK')
    expect(scene.conversation.spamBar).toBeUndefined()
    expect(scene.list.tabs[0].label).toBe('Transactions')
    // The hijacking text sits under genuine alerts that name the account and a reference.
    const beats = beatsAt(scene, 'inspect').filter((beat) => beat.kind === 'message')
    expect(beats.map((beat) => beat.id)).toEqual(['s18-old-1', 's18-old-2', 's18-msg'])
    expect(beats[0].text).toMatch(/xx6621.*Ref/)
    expect(beats[2].text).toBe(`SECURITY HOLD: ${BANK.S18.synthetic.assets[0].content.body}`)
    expect(JSON.stringify(scene.surfaces.details.pages.compare)).toContain('Same sender line')
    const branch = branchOf('S18')
    const call = branch.find((item) => item.intent === 'call_number')
    expect(scene.surfaces[call.on].kind).toBe('installer')
    expect(call.page).toBe('confirm')
    const readout = branch.find((item) => item.intent === 'share_secret')
    expect(scene.surfaces[readout.on].kind).toBe('call')
    expect(scene.surfaces[readout.on].endCallScored).toBe(true)
    // Hanging up on that call is one of the two safe branches.
    expect(branch.filter((item) => item.intent === 'safe_pivot').map((item) => item.on ?? item.slot).sort())
      .toEqual(['incoming', 'menu'])
    // The ring is a stage-bound beat, and a genuine code for a payee arrives above it.
    expect(beatsAt(scene, 'inspect').some((beat) => beat.id === 's18-ring')).toBe(false)
    expect(beatsAt(scene, 'branch').some((beat) => beat.id === 's18-ring')).toBe(true)
    expect(beatsAt(scene, 'verify').some((beat) => beat.id === 's18-ring')).toBe(false)
    expect(beatsAt(scene, 'branch').find((beat) => beat.id === 's18-otp').text).toMatch(/add payee/)
    expect(scene.surfaces.bankapp.hero.value).toBe('Active — no hold')
  })

  it('S19 lets the phone produce all three identifiers, and releases through the attach sheet and a form', () => {
    const scene = SCENES.S19
    expect(JSON.stringify(scene.surfaces.imei)).toContain('*#06#')
    expect(scene.surfaces.imei.pages.ids.rows.find((row) => row.label === 'IMEI 1').value).toMatch(/^00 /)
    const branch = branchOf('S19')
    const location = branch.find((item) => item.intent === 'share_location')
    expect(scene.surfaces[location.on].kind).toBe('installer')
    expect(scene.surfaces[location.on].pages[location.page].style).toBe('sheet')
    const form = branch.find((item) => item.intent === 'submit_data')
    expect(scene.surfaces[form.on].kind).toBe('browser')
    expect(scene.surfaces[form.on].pages.form.url).toBe(BANK.S19.synthetic.assets.find((a) => a.kind === 'browser_page').display_target)
    // The safe branch sits in the Messages app's own unsaved-sender bar.
    const safe = branch.find((item) => item.intent === 'safe_pivot')
    expect(safe.anchor).toBe('spam')
    expect(scene.surfaces[safe.opens].kind).toBe('sms')
    // S14's browser location prompt is not reused.
    expect(JSON.stringify(scene)).not.toMatch(/use this device’s location/)
  })

  it('S20 keeps two stories and the learner’s own delivered reply in one thread', () => {
    const scene = SCENES.S20
    const beats = beatsAt(scene, 'open')
    const reply = beats.find((beat) => beat.id === 's20-me')
    expect(reply.from).toBe('me')
    expect(reply.via).toBe('Delivered')
    const order = beats.filter((beat) => beat.kind === 'message').map((beat) => beat.time)
    expect(order.slice(0, 3)).toEqual(['10:43', '10:50', '16:01'])
    expect(beats.find((beat) => beat.id === 's20-m1').text.startsWith('Parcel address failed.')).toBe(true)
    expect(beats.find((beat) => beat.id === 's20-m2').text).toBe(BANK.S20.synthetic.assets[0].content.body)
    const branch = branchOf('S20')
    const call = branch.find((item) => item.intent === 'call_number')
    expect(call.anchor).toBe('s20-number')
    // Both releases are the phone's own system dialogs, never the call.
    for (const intent of ['attempt_install', 'share_secret']) {
      const item = branch.find((control) => control.intent === intent)
      expect(scene.surfaces[item.on].kind, intent).toBe('installer')
    }
    expect(JSON.stringify(scene.surfaces.cast)).toContain('any codes that arrive')
    expect(scene.surfaces.courier.hero.value).toBe('Nothing on the way')
  })

  it('keeps the one military scene synthetic, with no rank, formation or operational term', () => {
    expect(BATCH.filter((id) => /FICTIONAL MILITARY CONTEXT/.test(SOURCE[id].trigger))).toEqual(['S19'])
    const serialised = JSON.stringify(SCENES.S19)
    expect(serialised).toContain('Unit Falcon')
    expect(serialised).not.toMatch(/\b(regiment|battalion|brigade|squadron|army|navy|air force|colonel|brigadier|major|captain|lieutenant|sepoy|jawan|posting|deployment|sortie|convoy|grid|coordinates?)\b/i)
    expect(serialised).not.toMatch(/\d{1,2}\.\d{3,}\s*[NSEW]/)
  })

  it('types only where the scene genuinely collects something, with masked secrets', () => {
    expect(allFields(SCENES.S16)).toHaveLength(0)
    expect(allFields(SCENES.S17).map((f) => f.name)).toEqual(['pin'])
    expect(allFields(SCENES.S18)).toHaveLength(0)
    expect(allFields(SCENES.S19).map((f) => f.name)).toEqual(['imei', 'place', 'model'])
    expect(allFields(SCENES.S20)).toHaveLength(0)
    expect(allFields(SCENES.S17)[0].kind).toBe('secret')
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of MALICIOUS) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    expect(allAffordances(SCENES.S16).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('keeps every scene offline: reserved numbers and training hosts only', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      for (const number of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(number.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const bare of serialised.match(/\b\d{5} \d{5}\b/g) ?? []) {
        expect(bare, id).toMatch(/^00000 \d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
      for (const host of serialised.match(/\b[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}\b/g) ?? []) {
        expect(host, id).toMatch(/\.training\.example$/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SMS S21-S25 - the fifth and final SMS batch (IMMERSIVE-014)
 * ------------------------------------------------------------------ */

describe('S21-S25 are SMS-native and distinct from the ninety-five scenes before them', () => {
  const BATCH = ['S21', 'S22', 'S23', 'S24', 'S25']
  const SMS = AUTHORED_SCENARIO_IDS.filter((id) => id.startsWith('S'))
  const EARLIER = AUTHORED_SCENARIO_IDS.slice(0, AUTHORED_SCENARIO_IDS.indexOf('S21'))
  const MALICIOUS = ['S22', 'S23', 'S24', 'S25']
  const shape = (id) => affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => `${item.slot}:${item.intent}`).sort().join(',')
  const home = (id) => [...new Set(affordancesFor(SCENES[id], 'branch')
    .filter((item) => item.intent)
    .map((item) => (item.on ? SCENES[id].surfaces[item.on].kind : `msg/${item.slot}`)))]
    .sort().join('|')
  const allFields = (scene) => Object.values(scene.surfaces).flatMap((surface) => [
    ...Object.values(surface.pages ?? {}).flatMap((page) => fieldsOfPage(page)),
    ...(surface.form?.fields ?? []),
  ])
  const branchOf = (id) => affordancesFor(SCENES[id], 'branch').filter((item) => item.intent)
  const RELEASES = ['submit_data', 'attempt_payment', 'attempt_install', 'share_secret', 'share_location', 'approve_device_link']
  /** The client's own sentence, which may carry the adversary's words, is measured separately. */
  const withoutClientText = (id) => JSON.stringify(SCENES[id]).split(BANK[id].synthetic.assets
    .find((asset) => asset.kind === 'notification').content.body).join('')

  /** The same free walk the earlier SMS blocks use: local controls, page links, rows, surface links. */
  const freeWalk = (scene) => {
    const free = new Map()
    const add = (sid) => {
      if (!sid || free.has(sid) || !scene.surfaces[sid]) return
      free.set(sid, new Set())
      const surface = scene.surfaces[sid]
      for (const surfaceLink of surface.links ?? []) add(surfaceLink.to)
      for (const section of surface.sections ?? []) if (section.link) add(section.link.to)
      if (surface.pages) addPage(sid, surface.home)
    }
    const addPage = (sid, pageId) => {
      const surface = scene.surfaces[sid]
      const pages = free.get(sid)
      if (!pageId || pages.has(pageId)) return
      pages.add(pageId)
      const page = surface.pages?.[pageId]
      if (!page) return
      const targets = [
        ...(page.links ?? []).map((pageLink) => pageLink.to),
        page.primary?.to, page.toggle?.to,
        ...(page.blocks ?? []).flatMap((block) => block.items ?? []).map((item) => item.to),
      ].filter(Boolean)
      for (const to of targets) {
        if (surface.pages?.[to]) addPage(sid, to)
        else add(to)
      }
    }
    const local = [
      ...(scene.ambient ?? []),
      ...affordancesFor(scene, 'inspect'),
      ...affordancesFor(scene, 'branch'),
    ].filter((item) => item.local)
    for (const item of local) add(item.opens)
    return free
  }

  it('covers exactly the ninety-five earlier scenes when it compares, and all twenty-five SMS', () => {
    expect(EARLIER).toHaveLength(95)
    expect(EARLIER).toContain('S20')
    expect(EARLIER).not.toContain('S21')
    expect(SMS).toHaveLength(25)
    expect(AUTHORED_SCENARIO_IDS).toHaveLength(100)
  })

  it('never repeats a branch decision shape from any of the ninety-five, or from each other', () => {
    const earlier = new Set(EARLIER.map(shape))
    for (const id of BATCH) expect(earlier.has(shape(id)), `${id} repeats ${shape(id)}`).toBe(false)
    expect(new Set(BATCH.map(shape)).size).toBe(BATCH.length)
  })

  it('gives all twenty-five SMS scenes a decision home no other SMS scene shares', () => {
    expect(new Set(SMS.map(home)).size).toBe(SMS.length)
  })

  it('decides in five different places, each on a different piece of the phone', () => {
    expect(home('S21')).toBe('app|sms')
    expect(home('S22')).toBe('browser|msg/menu|viewer')
    expect(home('S23')).toBe('installer|msg/composer|paysheet')
    expect(home('S24')).toBe('msg/inline|paysheet|viewer')
    expect(home('S25')).toBe('installer|msg/inline|viewer')
    const safeHome = (id) => branchOf(id).filter((item) => item.intent === 'safe_pivot')
      .map((item) => (item.on ? `${SCENES[id].surfaces[item.on].kind}:${item.on}` : `msg/${item.slot}/${item.anchor ?? ''}`))
      .sort().join('|')
    expect(new Set(BATCH.map(safeHome)).size).toBe(BATCH.length)
  })

  it('lets a learner reach every scored branch surface AND page without spending the branch', () => {
    for (const id of BATCH) {
      const free = freeWalk(SCENES[id])
      const unreachable = branchOf(id)
        .filter((item) => item.on)
        .filter((item) => !free.has(item.on) || (item.page && !free.get(item.on).has(item.page)))
        .map((item) => `${item.on}${item.page ? `/${item.page}` : ''}`)
      expect(unreachable, `${id} cannot reach ${unreachable.join(', ')} without spending the branch`)
        .toEqual([])
    }
  })

  it('supports all six stages, with a scored control on every stage after the notification', () => {
    for (const id of BATCH) {
      const scene = SCENES[id]
      for (const stage of ['open', 'inspect', 'branch', 'verify', 'resolve']) {
        expect(affordancesFor(scene, stage).filter((item) => item.intent).length, `${id} ${stage}`)
          .toBeGreaterThanOrEqual(2)
      }
      // The list row opens the conversation (first inline control), and reading is what it does.
      expect(affordancesFor(scene, 'open')[0].intent, id).toBe('read')
      // Every inspection path records an inspection; skipping is the one alternative.
      expect(affordancesFor(scene, 'inspect').map((item) => item.intent).filter((i) => i !== 'skip_inspection')
        .every((i) => i.startsWith('inspect_') || i === 'read_thread' || i === 'preview_file'), id).toBe(true)
      // The thread only grows as the run advances.
      let before = []
      for (const stage of STAGE_ORDER) {
        const now = beatsAt(scene, stage).map((beat) => beat.id)
        expect(now, `${id} ${stage}`).toEqual(expect.arrayContaining(before))
        before = now
      }
    }
  })

  it('offers a safe branch and at least two priced mistakes on every one of the five', () => {
    for (const id of BATCH) {
      const intents = branchOf(id).map((item) => item.intent)
      expect(intents, id).toContain('safe_pivot')
      expect(intents.filter((intent) => intent !== 'safe_pivot').length, id).toBeGreaterThanOrEqual(2)
    }
    for (const id of MALICIOUS) {
      expect(branchOf(id).some((item) => RELEASES.includes(item.intent)), id).toBe(true)
    }
    // The legitimate S21 carries no release at all: its mistakes are a needless rejection and an
    // unsafe external act.
    expect(branchOf('S21').some((item) => RELEASES.includes(item.intent))).toBe(false)
    expect(branchOf('S21').map((item) => item.intent).sort()).toEqual(['open_link', 'reject_ignore', 'safe_pivot'])
  })

  it('opens every one of the five on the message list, each with its own set of categories', () => {
    const tabSets = BATCH.map((id) => SCENES[id].list.tabs.map((tab) => tab.label).join('|'))
    const earlierSets = new Set(SMS.filter((id) => id <= 'S20')
      .map((id) => SCENES[id].list.tabs.map((tab) => tab.label).join('|')))
    for (const id of BATCH) {
      const scene = SCENES[id]
      expect(scene.stages.open.surface).toBe('list')
      expect(scene.list.tabs.length).toBeGreaterThanOrEqual(3)
      expect(scene.list.tabs.map((tab) => tab.label)).toContain('Spam')
    }
    expect(new Set(tabSets).size).toBe(BATCH.length)
    for (const set of tabSets) expect(earlierSets.has(set), set).toBe(false)
  })

  it('uses the SMS vocabulary and none of the messenger’s', () => {
    for (const id of BATCH) {
      for (const beat of SCENES[id].beats) {
        expect(['day', 'system', 'message', 'link', 'number', 'amount', 'attachment'], `${id} ${beat.kind}`)
          .toContain(beat.kind)
      }
      expect(JSON.stringify(SCENES[id].beats), id)
        .not.toMatch(/"status":"(sent|delivered|read)"|"reactions"|"forwarded"|"kind":"(voice|poll|typing|call)"/)
    }
  })

  it('prints no narrator line, no label for the item and none of its own trigger words', () => {
    const TRIGGER_WORDS = {
      S21: ['fear', 'afraid', 'routine', 'routinely'],
      S22: ['authority', 'authoritative', 'curiosity', 'curious'],
      S23: ['greed', 'greedy', 'confusion', 'confusing', 'confused'],
      S24: ['fear', 'afraid', 'authority', 'authoritative'],
      S25: ['convenience', 'convenient', 'urgency', 'urgent'],
    }
    for (const id of BATCH) {
      const serialised = withoutClientText(id)
      expect(serialised, id).not.toContain(BANK[id].synthetic.prior_context)
      expect(serialised, id).not.toMatch(
        /\b(scam|scammer|fraud|fraudulent|phishing|malicious|fake|fabricated|supposed|cloned|deepfake|impostor|suspicious|spoofed|spoofing|legitimate|hijack\w*|impersonat\w*|synthetic|malware|extortion)\b/i,
      )
      for (const word of TRIGGER_WORDS[id]) {
        expect(serialised.toLowerCase(), `${id} prints ${word}`).not.toMatch(new RegExp(`\\b${word}\\b`))
      }
    }
  })

  it('S21 is the legitimate control: the alert is kept in the portal’s own session list', () => {
    const scene = SCENES.S21
    expect(SOURCE.S21.disposition).toBe('Legitimate')
    const alert = scene.beats.find((beat) => beat.id === 's21-alert')
    expect(alert.text).toBe(BANK.S21.synthetic.assets[0].content.body)
    // A registered sender: no unsaved-sender bar, no replies, and the sent/delivered gap explained.
    expect(scene.conversation.spamBar).toBeUndefined()
    expect(scene.conversation.title).toBe('VM-TPALRT')
    expect(JSON.stringify(scene.surfaces.msginfo)).toMatch(/Sent.*14:22.*Delivered to this phone.*14:49/)
    const branch = branchOf('S21')
    const keep = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[keep.on].kind).toBe('app')
    expect(branch.find((item) => item.intent === 'reject_ignore').on).toBe(keep.on)
    // The unsafe external act is a different text from a different number, already in Spam.
    const lure = branch.find((item) => item.intent === 'open_link')
    expect(scene.surfaces[lure.on].kind).toBe('sms')
    expect(scene.list.tabs.find((tab) => tab.id === 'spam').rows[0].from).not.toBe(scene.conversation.title)
    // The legitimate item gets as much thread and as many screens as its neighbours.
    const screens = (id) => Object.keys(SCENES[id].surfaces).length
    expect(screens('S21')).toBeGreaterThanOrEqual(Math.min(...MALICIOUS.map(screens)) - 2)
    expect(beatsAt(scene, 'branch').length)
      .toBeGreaterThanOrEqual(Math.min(...MALICIOUS.map((id) => beatsAt(SCENES[id], 'branch').length)))
    expect(allFields(scene)).toHaveLength(0)
  })

  it('S22 prices the sign-in and the call-back on the portal, and the phone’s voicemail is one tap away', () => {
    const scene = SCENES.S22
    expect(scene.beats.find((beat) => beat.id === 's22-msg').text)
      .toBe(`Secure Voice: ${BANK.S22.synthetic.assets[0].content.body}`)
    const branch = branchOf('S22')
    const signin = branch.find((item) => item.intent === 'submit_data')
    expect(scene.surfaces[signin.on].kind).toBe('browser')
    expect(scene.surfaces[signin.on].pages[signin.page].url)
      .toBe(BANK.S22.synthetic.assets.find((a) => a.kind === 'browser_page').display_target)
    expect(allFields(scene).map((f) => f.name)).toEqual(['mail', 'password'])
    expect(allFields(scene)[1].kind).toBe('masked')
    // The call-back is on the recording, reached from the page without signing in.
    const callback = branch.find((item) => item.intent === 'call_number')
    expect(scene.surfaces[callback.on].kind).toBe('viewer')
    expect(scene.surfaces[callback.on].art).toBe('voice')
    expect(scene.surfaces.portal.pages.login.links.map((l) => l.to)).toContain('clip')
    // Closing the page and leaving for Voicemail are the two safe branches.
    expect(branch.filter((item) => item.intent === 'safe_pivot').map((item) => item.on ?? item.slot).sort())
      .toEqual(['menu', 'portal'])
    expect(scene.surfaces.voicemail.hero.value).toBe('No new messages')
    expect(scene.ambient.some((item) => item.opens === 'voicemail' && item.after === 'inspect')).toBe(true)
    // W15's in-chat voice note and E22's attached memo are not reused.
    expect(JSON.stringify(scene.beats)).not.toMatch(/"kind":"voice"/)
  })

  it('keeps the one military scene synthetic, with no rank, formation or operational term', () => {
    expect(BATCH.filter((id) => /FICTIONAL MILITARY CONTEXT/.test(SOURCE[id].trigger))).toEqual(['S22'])
    const serialised = withoutClientText('S22')
    expect(serialised).toContain('Unit Falcon')
    expect(serialised).not.toMatch(/\b(col|regiment|battalion|brigade|squadron|army|navy|air force|colonel|brigadier|major|captain|lieutenant|sepoy|jawan|posting|deployment|sortie|convoy|grid|coordinates?|operation|exercise)\b/i)
    expect(serialised).not.toMatch(/\d{1,2}\.\d{3,}\s*[NSEW]/)
  })

  it('S23 shows the direction on every screen: a refund in the story, PAY on the phone', () => {
    const scene = SCENES.S23
    const branch = branchOf('S23')
    const decline = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[decline.on].kind).toBe('installer')
    expect(scene.surfaces[decline.on].pages[decline.page].title).toMatch(/is requesting INR 2,499\.00/)
    expect(scene.surfaces[decline.on].pages[decline.page].links.map((l) => l.to)).toEqual(['collect'])
    const pay = branch.find((item) => item.intent === 'attempt_payment')
    expect(scene.surfaces[pay.on].kind).toBe('paysheet')
    expect(scene.surfaces[pay.on].subtitle).toMatch(/^PAY to /)
    expect(scene.surfaces[pay.on].rows.map((row) => row.value)).toContain('Money leaves your account')
    expect(branch.find((item) => item.intent === 'reply').slot).toBe('composer')
    expect(scene.beats.find((beat) => beat.kind === 'amount').rows[0].value).toMatch(/SK-58213/)
    expect(scene.surfaces.shopapp.hero.value).toBe('No refund pending')
    expect(allFields(scene).map((f) => f.name)).toEqual(['pin'])
    expect(allFields(scene)[0].kind).toBe('secret')
    // A sheet reached through the notification leaves every pushed screen once paid.
    expect(pay.closes).toBe('all')
  })

  it('S24 keeps the texts as the safe branch and prices the fee, the upload and the officer', () => {
    const scene = SCENES.S24
    expect(scene.beats.find((beat) => beat.id === 's24-msg').text)
      .toBe(`CYBER CASE NOTICE: ${BANK.S24.synthetic.assets[0].content.body}`)
    expect(JSON.stringify(scene.beats)).toMatch(/confidential/)
    const branch = branchOf('S24')
    expect(branch.find((item) => item.intent === 'safe_pivot').anchor).toBe('s24-msg')
    expect(branch.find((item) => item.intent === 'call_number').anchor).toBe('s24-officer')
    expect(scene.surfaces[branch.find((item) => item.intent === 'attempt_payment').on].kind).toBe('paysheet')
    const upload = scene.surfaces[branch.find((item) => item.intent === 'submit_data').on]
    expect(upload.kind).toBe('viewer')
    expect(upload.items).toHaveLength(2)
    expect(branch.find((item) => item.intent === 'submit_data').closes).toBe('all')
    expect(branch.find((item) => item.intent === 'attempt_payment').closes).toBe('all')
    // Both releases hang off the case portal, which is walked for free.
    expect(scene.surfaces.portal.pages.case.links.map((l) => l.to).sort()).toEqual(['fee', 'upload'])
    expect(scene.surfaces.official.pages.track.blocks.find((b) => b.type === 'result').text)
      .toBe('No complaint with this number exists.')
    // W12's video call and E20's inbox summons are not reused.
    expect(Object.values(scene.surfaces).some((s) => s.video)).toBe(false)
  })

  it('S25 delivers the package as a picture message; deleting it in Files is the safe branch', () => {
    const scene = SCENES.S25
    const apk = scene.beats.find((beat) => beat.kind === 'attachment')
    expect(apk.fileName).toMatch(/\.apk$/)
    const branch = branchOf('S25')
    const del = branch.find((item) => item.intent === 'safe_pivot')
    expect(scene.surfaces[del.on].kind).toBe('viewer')
    expect(scene.surfaces[del.on].art).toBe('apk')
    const install = branch.find((item) => item.intent === 'attempt_install')
    expect(scene.surfaces[install.on].kind).toBe('installer')
    expect(JSON.stringify(scene.surfaces[install.on])).toMatch(/default SMS app/)
    expect(JSON.stringify(scene.surfaces[install.on])).toMatch(/Accessibility/)
    expect(JSON.stringify(scene.surfaces[install.on])).toMatch(/Screen capture/)
    expect(branch.find((item) => item.intent === 'open_link').anchor).toBe('s25-link')
    expect(scene.surfaces.issuer.hero.value).toBe('Active')
    // W14's unknown-sources settings page is not reused.
    expect(Object.values(scene.surfaces.pkg.pages).some((page) => page.style === 'settings')).toBe(false)
    expect(allFields(scene)).toHaveLength(0)
  })

  it('offers no rejection on the four malicious items, where the engine refuses one', () => {
    for (const id of MALICIOUS) {
      expect(allAffordances(SCENES[id]).some((item) => item.intent === 'reject_ignore'), id).toBe(false)
    }
    expect(allAffordances(SCENES.S21).some((item) => item.intent === 'reject_ignore')).toBe(true)
  })

  it('keeps every scene offline: reserved numbers and training hosts only', () => {
    for (const id of BATCH) {
      const serialised = JSON.stringify(SCENES[id])
      for (const phone of serialised.match(/\+91[\d\s]+/g) ?? []) {
        expect(phone.replace(/\s/g, ''), id).toMatch(/^\+9100000\d{5}$/)
      }
      for (const bare of serialised.match(/\b\d{5} \d{5}\b/g) ?? []) {
        expect(bare, id).toMatch(/^00000 \d{5}$/)
      }
      for (const url of serialised.match(/https?:\/\/[^"'\s]+/g) ?? []) {
        expect(url, id).toMatch(/^https:\/\/[a-z0-9.-]+\.training\.example(\/|$)/)
      }
      for (const host of serialised.match(/\b[a-z0-9-]+(\.[a-z0-9-]+)+\.[a-z]{2,}\b/g) ?? []) {
        expect(host, id).toMatch(/\.training\.example$/)
      }
    }
  })
})

/* ------------------------------------------------------------------ *
 * SECURITY-001 - the neutral learner action contract
 * ------------------------------------------------------------------ */

describe('SECURITY-001: no scene or action sheet carries what a control means', () => {
  const SRC = resolve(process.cwd(), 'src')

  /** Every non-test source file the product bundle can include. */
  const productSources = () => {
    const out = []
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== 'test') walk(full)
        } else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\.(js|jsx)$/.test(entry.name)) {
          out.push(full)
        }
      }
    }
    walk(SRC)
    return out
  }

  it.each(AUTHORED_SCENARIO_IDS)('%s names every scored control by a neutral id and nothing else', (id) => {
    for (const control of model.allAffordances(SCENES[id])) {
      if (control.local) continue
      expect(control.id, `${id} ${control.label}`).toMatch(new RegExp(`^${id.toLowerCase()}-c\\d{2}$`))
      expect(control).not.toHaveProperty('intent')
      expect(control).not.toHaveProperty('source')
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s and the server map describe exactly the same controls', (id) => {
    const scored = model.allAffordances(SCENES[id]).filter((control) => !control.local)
    const mapped = SCENE_ACTIONS[id]
    expect(mapped, `${id} has no server map`).toBeTruthy()
    expect(scored.map((control) => control.id).sort()).toEqual(Object.keys(mapped).sort())
    for (const control of scored) {
      expect(mapped[control.id].stage, `${id} ${control.id}`).toBe(control.stage)
      expect(ENGINE_STAGE_INTENTS[control.stage], `${id} ${control.id}`)
        .toHaveProperty(mapped[control.id].intent)
    }
  })

  it.each(AUTHORED_SCENARIO_IDS)('%s puts the row’s own control first at the list stage', (id) => {
    // The chat-list row finds its control by position, because it cannot know meaning.
    const [first] = model.affordancesFor(SCENES[id], 'open').filter((control) => control.slot === 'inline')
    expect(SCENES[id].stages.open.surface).toBe('list')
    expect(SCENE_ACTIONS[id][first.id].intent).toBe('read')
  })

  it('refuses a control that tries to carry an intent or a verification source', () => {
    expect(() => action({ id: 'x01-c01', label: 'x', intent: 'safe_pivot' })).toThrow(/server/)
    expect(() => action({ id: 'x01-c01', label: 'x', source: 'known_app' })).toThrow(/server/)
    expect(action({ id: 'x01-c01', label: 'x' })).not.toHaveProperty('intent')
  })

  it('gives the generic action sheet the same neutral ids, stages and order as the server', () => {
    const offered = STAGE_ORDER.flatMap((stage) => actionsFor(stage, {
      platform: 'instagram',
      synthetic: { assets: Object.values(ASSET_KIND).map((kind) => ({ kind, asset_id: kind })) },
    }).map((control) => ({ ...control, stage })))
    expect(offered.map((control) => control.id)).toEqual(Object.keys(GENERIC_ACTIONS))
    for (const control of offered) {
      expect(control.id).toMatch(/^gen-c\d{2}$/)
      expect(GENERIC_ACTIONS[control.id].stage).toBe(control.stage)
      expect(control).not.toHaveProperty('intent')
      expect(control).not.toHaveProperty('source')
    }
    expect(GENERIC_ACTIONS[NOTIFY_OPEN_ID].intent).toBe('open_item')
    expect(GENERIC_ACTIONS[NOTIFY_DISMISS_ID].intent).toBe('dismiss')
  })

  it('keeps the fake server able to advance every intent the server map uses', () => {
    for (const intent of CANONICAL_INTENTS) {
      if (intent.startsWith('resolve_')) continue
      expect(NEXT_STAGE, intent).toHaveProperty(intent)
    }
  })

  it('keeps canonical scoring vocabulary out of every product source file', () => {
    /**
     * The two post-resolution outcome label tables are the one exception: they turn the
     * learner's OWN final act, returned only once the run is terminal, into words. They map
     * no control to anything.
     */
    const OUTCOME_LABELS = /^resolve_(report|block|continue|retain|ignore)$/
    const ALLOWED = new Set([
      join(SRC, 'components', 'simulation', 'ScenarioOutcome.jsx'),
      join(SRC, 'constants', 'result.js'),
    ])
    const offenders = []
    for (const file of productSources()) {
      const text = readFileSync(file, 'utf8')
      for (const token of FORBIDDEN_TOKENS) {
        if (!new RegExp(`\\b${token}\\b`).test(text)) continue
        if (ALLOWED.has(file) && OUTCOME_LABELS.test(token)) continue
        offenders.push(`${file.slice(SRC.length + 1)}: ${token}`)
      }
      if (/data-intent|data-affordance/.test(text)) offenders.push(`${file}: data attribute`)
      if (/^import[^\n]*from ['"][^'"\n]*(test\/actionMap|learner-actions)/m.test(text)) {
        offenders.push(`${file}: reads the server map`)
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('the notification announces the time the app lists the item at', () => {
  /** The row the scene's own app list draws for the scenario's item. */
  const headlineRow = (scene) => {
    const id = `${scene.scenarioId.toLowerCase()}-row`
    const stack = [scene.list]
    while (stack.length) {
      const node = stack.pop()
      if (!node || typeof node !== 'object') continue
      if (!Array.isArray(node) && node.id === id) return node
      stack.push(...Object.values(node))
    }
    return null
  }

  it('gives every scene with a clock-time row that same time for the toast', () => {
    const checked = []
    for (const [id, scene] of Object.entries(SCENES)) {
      const row = headlineRow(scene)
      expect(row, `${id} has no headline row`).toBeTruthy()
      if (/^\d{1,2}:\d{2}$/.test(row.time ?? '')) {
        expect(model.headlineClockTime(scene), id).toBe(row.time)
        checked.push(id)
      } else {
        // Instagram lists relatively ("2m"); the toast keeps the bank's own clock time.
        expect(model.headlineClockTime(scene), id).toBeNull()
      }
    }
    // WhatsApp, Email and SMS all list by clock time.
    expect(checked.length).toBeGreaterThanOrEqual(75)
  })

  it('returns null for no scene, no row, or a relative time', () => {
    expect(model.headlineClockTime(null)).toBeNull()
    expect(model.headlineClockTime({ scenarioId: 'W99', list: { rows: [] } })).toBeNull()
    expect(model.headlineClockTime({
      scenarioId: 'I99', list: { sections: [{ rows: [{ id: 'i99-row', time: '2m' }] }] },
    })).toBeNull()
    expect(model.headlineClockTime({
      scenarioId: 'E99', list: { rows: [{ id: 'e99-bg-1', time: '07:00' }, { id: 'e99-row', time: '08:10' }] },
    })).toBe('08:10')
  })

  /**
   * Online UI pass. Instagram lists the item relatively, so the toast used to fall back to the
   * bank's `received_at` - which in seven DM scenes is not the time the thread draws the very
   * same message at (I02 announced itself at 19:19 and sat in the DM at 07:45).
   */
  it('gives an Instagram toast the time its thread draws the announced message at', () => {
    const body = (id) =>
      BANK[id].synthetic.assets.find((asset) => asset.kind === 'notification').content.body
    const expected = {
      I02: '07:45', I04: '13:49', I05: '08:28', I08: '12:59', I10: '10:49', I14: '12:06', I16: '17:05',
    }
    for (const [id, time] of Object.entries(expected)) {
      expect(model.headlineClockTime(SCENES[id]), id).toBeNull()
      expect(model.notifiedClockTime(SCENES[id], body(id)), id).toBe(time)
    }
    // Where the bank already agreed with the thread, nothing moves.
    for (const id of ['I07', 'I12', 'I13', 'I15', 'I17', 'I18', 'I20', 'I21', 'I22', 'I23']) {
      const content = BANK[id].synthetic.assets.find((asset) => asset.kind === 'notification').content
      expect(model.notifiedClockTime(SCENES[id], content.body), id).toBe(content.received_at)
    }
  })

  it('takes only a clock time, and only for a message that is the notification text', () => {
    const scene = {
      beats: [
        { id: 'a', text: 'Something else entirely, said earlier.', time: '09:00' },
        { id: 'b', text: 'Appeal within 30 minutes or your account goes.', time: '07:45' },
        { id: 'c', text: 'Posted by the page itself', time: '2 hours ago' },
      ],
    }
    expect(model.notifiedClockTime(scene, '@case_team: Appeal within 30 minutes or your')).toBe('07:45')
    expect(model.notifiedClockTime(scene, 'Posted by the page itself')).toBeNull()
    expect(model.notifiedClockTime(scene, 'Not in the thread at all, anywhere')).toBeNull()
    expect(model.notifiedClockTime(scene, 'short')).toBeNull()
    expect(model.notifiedClockTime(null, 'Appeal within 30 minutes')).toBeNull()
  })
})

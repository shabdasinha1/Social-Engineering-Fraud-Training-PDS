import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { STAGE_INTENTS } from '../src/constants/scenarioEngine.js'
import { resolveIntent } from '../src/services/scenarioEngineService.js'
import { classifyOutcome, pathFromEvents } from '../src/services/attemptResultService.js'
import { buildScenarioReview } from '../src/services/scenarioReviewService.js'
import { SCORING_EVENT_CODES } from '../src/constants/scenarioDefinition.js'
import { VERIFY_SOURCE_BY_INTENT } from '../src/constants/learnerAction.js'
import {
  MAPPED_SCENARIO_IDS,
  actionCodeFor,
  controlsForScenario,
  translateActionCode,
} from '../src/services/learnerActionService.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * IMMERSIVE-003A - the seam between the authored WhatsApp scenes and the engine.
 *
 * The scenes live in the frontend, and the frontend cannot see a scenario's evaluation
 * data - which is the point of the split, and also the risk: a scene could offer a
 * control that the engine will refuse, and nobody would find out until a learner pressed
 * it mid-assessment.
 *
 * So this test imports the real scene packs and runs every control they offer through the
 * real `resolveIntent` against the real W01-W05 definitions. If a scene ever offers an
 * intent the scenario does not declare at that stage, or names an asset that does not
 * exist, this fails here rather than in front of a learner.
 *
 * It also pins the event code each control produces. That is what stops a future
 * relabelling from quietly turning a safe route into a risky one: the wording may change,
 * the scoring may not.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SCENE_ROOT = path.resolve(HERE, '../../frontend/src/simulation')

const { sceneFor, AUTHORED_SCENARIO_IDS } = await import(
  pathToFileURL(path.join(SCENE_ROOT, 'sceneRegistry.js')).href
)
const rawSceneModel = await import(
  pathToFileURL(path.join(SCENE_ROOT, 'sceneModel.js')).href
)

/**
 * SECURITY-001. A scene control now carries only a neutral id (`w01-c08`), and what it
 * submits lives in the server's action map. This suite was written against the authoring
 * names those controls had before (`w01-branch-pivot`) and the intents they carried, so it
 * reads the scenes through a TEST-ONLY view that attaches both from the server map:
 * `id` is the authoring name, `neutralId` the real id, `intent` the server's. Every
 * walk below still goes through `translateActionCode`, so the map is exercised, not assumed.
 */
const MAP_ROOT = path.resolve(HERE, '../data/learner-actions/v1')
const RAW_MAPS = Object.assign({}, ...['whatsapp', 'instagram', 'email', 'sms'].map((platform) =>
  JSON.parse(readFileSync(path.join(MAP_ROOT, `${platform}.json`), 'utf8')).scenes))

function withServerMeaning(scene, control) {
  if (control.local) return control
  const entry = controlsForScenario(scene.scenarioId).get(control.id)
  return {
    ...control,
    id: RAW_MAPS[scene.scenarioId]?.[control.id]?.name ?? control.id,
    neutralId: control.id,
    intent: entry?.intent,
    source: VERIFY_SOURCE_BY_INTENT[entry?.intent] ?? null,
  }
}

const sceneModel = {
  ...rawSceneModel,
  allAffordances: (scene) =>
    rawSceneModel.allAffordances(scene).map((control) => withServerMeaning(scene, control)),
  affordancesFor: (scene, stage) =>
    rawSceneModel.affordancesFor(scene, stage).map((control) => withServerMeaning(scene, control)),
}

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const { byScenario } = await loadSyntheticContent()

const definitions = Object.fromEntries(
  scenarios.map((record) => [
    record.scenario_id,
    toScenarioDefinition(record, taxonomies, { synthetic: byScenario.get(record.scenario_id) }).doc,
  ]),
)

/** The scenario payload as `/current-run` sends it - the only thing a scene may read. */
function payload(scenarioId) {
  const entry = byScenario.get(scenarioId)
  return {
    scenario_id: scenarioId,
    version: entry.definition_version,
    platform: entry.platform,
    synthetic: entry.synthetic,
    stages: [],
  }
}

const scenes = Object.fromEntries(
  AUTHORED_SCENARIO_IDS.map((id) => [id, sceneFor(payload(id))]),
)

/* ------------------------------------------------------------------ *
 * The mirror
 * ------------------------------------------------------------------ */

test('the server action map and the scenes describe the same controls, all legal', () => {
  // SECURITY-001 replaced the frontend's intent mirror: the only copy is the server's.
  assert.equal(rawSceneModel.STAGE_INTENTS, undefined, 'the frontend must not mirror intents again')
  assert.deepEqual([...MAPPED_SCENARIO_IDS].sort(), [...AUTHORED_SCENARIO_IDS].sort())
  for (const id of AUTHORED_SCENARIO_IDS) {
    const scored = rawSceneModel.allAffordances(scenes[id]).filter((control) => !control.local)
    const mapped = [...controlsForScenario(id).values()]
      .filter((entry) => !entry.controlId.startsWith('gen-'))
    assert.deepEqual(
      scored.map((control) => control.id).sort(),
      mapped.map((entry) => entry.controlId).sort(),
      id,
    )
    for (const control of scored) {
      assert.equal(control.intent, undefined, `${id} ${control.id} carries an intent`)
      assert.equal(control.source, undefined, `${id} ${control.id} carries a source`)
      const entry = controlsForScenario(id).get(control.id)
      assert.equal(entry.stage, control.stage, `${id} ${control.id}`)
      assert.ok(STAGE_INTENTS[entry.stage][entry.intent], `${id} ${control.id}`)
      assert.notEqual(entry.intent, 'abandon')
    }
  }
})

test('the batches author all hundred scenarios: W01-W25, I01-I25, E01-E25 and S01-S25', () => {
  assert.deepEqual(AUTHORED_SCENARIO_IDS, [
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
  assert.equal(AUTHORED_SCENARIO_IDS.length, scenarios.length)
  for (const record of scenarios) {
    if (AUTHORED_SCENARIO_IDS.includes(record.scenario_id)) continue
    assert.equal(sceneFor(payload(record.scenario_id)), null,
      `${record.scenario_id} must stay on the generic path in this batch`)
  }
})

/* ------------------------------------------------------------------ *
 * Every control the learner can press
 * ------------------------------------------------------------------ */

test('every scene control resolves to a legal transition on its own scenario', () => {
  for (const id of AUTHORED_SCENARIO_IDS) {
    const definition = definitions[id]
    for (const affordance of sceneModel.allAffordances(scenes[id])) {
      if (!affordance.intent) continue
      const outcome = resolveIntent({
        definition,
        stage: affordance.stage,
        intent: affordance.intent,
        syntheticTargetId: affordance.targetId ?? null,
      })
      assert.ok(outcome.event_code,
        `${id} ${affordance.id} produced no event code`)
    }
  }
})

test('the safe path through each scene sums to the full ten points', () => {
  /** One control per stage that the specification calls the expected behaviour. */
  const SAFE = {
    W01: ['w01-open-read', 'w01-inspect-contact', 'w01-branch-pivot', 'w01-verify-account', 'w01-resolve-report'],
    W02: ['w02-open-read', 'w02-inspect-contact', 'w02-branch-pivot', 'w02-verify-courier', 'w02-resolve-report'],
    W03: ['w03-open-read', 'w03-inspect-group', 'w03-branch-yes', 'w03-verify-directory', 'w03-resolve-continue'],
    W04: ['w04-open-read', 'w04-inspect-contact', 'w04-branch-pivot', 'w04-verify-known', 'w04-resolve-report'],
    W05: ['w05-open-read', 'w05-inspect-contact', 'w05-branch-pivot', 'w05-verify-app', 'w05-resolve-report'],
    W06: ['w06-open-read', 'w06-inspect-contact', 'w06-branch-pivot', 'w06-verify-desk', 'w06-resolve-report'],
    W07: ['w07-open-read', 'w07-inspect-file', 'w07-branch-keep', 'w07-verify-known', 'w07-resolve-retain'],
    W08: ['w08-open-read', 'w08-inspect-qr', 'w08-branch-pivot', 'w08-verify-app', 'w08-resolve-report'],
    W09: ['w09-open-read', 'w09-inspect-contact', 'w09-branch-pivot', 'w09-verify-known', 'w09-resolve-report'],
    W10: ['w10-open-read', 'w10-inspect-qr', 'w10-branch-pivot', 'w10-verify-settings', 'w10-resolve-report'],
    // IMMERSIVE-003C. The safe branch control is a different piece of the phone every time:
    // a business message's own button, a call's End call, a group's Exit, the installer's
    // Cancel, and a reply in the composer.
    W11: ['w11-open-read', 'w11-inspect-contact', 'w11-branch-confirm', 'w11-verify-app', 'w11-resolve-continue'],
    W12: ['w12-open-read', 'w12-inspect-file', 'w12-branch-hangup', 'w12-verify-desk', 'w12-resolve-report'],
    W13: ['w13-open-read', 'w13-inspect-group', 'w13-branch-exit', 'w13-verify-app', 'w13-resolve-report'],
    W14: ['w14-open-read', 'w14-inspect-file', 'w14-branch-cancel-confirm', 'w14-verify-dms', 'w14-resolve-report'],
    W15: ['w15-open-read', 'w15-inspect-contact', 'w15-branch-pivot', 'w15-verify-adjt', 'w15-resolve-report'],
    // IMMERSIVE-003D. A reaction on the message itself, a refusal typed to a recruiter, a
    // form left unsubmitted, the phone's own "Don't allow", and a hold in the organisation's
    // procurement portal.
    W16: ['w16-open-read', 'w16-inspect-plan', 'w16-branch-ack', 'w16-verify-board', 'w16-resolve-continue'],
    W17: ['w17-open-read', 'w17-inspect-contact', 'w17-branch-stop', 'w17-verify-jobs', 'w17-resolve-report'],
    W18: ['w18-open-read', 'w18-inspect-group', 'w18-branch-pivot', 'w18-verify-office', 'w18-resolve-report'],
    W19: ['w19-open-read', 'w19-inspect-contact', 'w19-branch-deny', 'w19-verify-duty', 'w19-resolve-block'],
    W20: ['w20-open-read', 'w20-inspect-file', 'w20-branch-hold', 'w20-verify-rohit', 'w20-resolve-report'],
    // IMMERSIVE-003E. An acknowledgement inside the approved portal, a boundary set with a
    // friend, a form closed on whichever page it stops, a call ended, and a link request
    // refused on WhatsApp's own sheet.
    W21: ['w21-open-read', 'w21-inspect-contact', 'w21-branch-ack', 'w21-verify-portal', 'w21-resolve-continue'],
    W22: ['w22-open-read', 'w22-inspect-thread', 'w22-branch-pivot', 'w22-verify-register', 'w22-resolve-report'],
    W23: ['w23-open-read', 'w23-inspect-contact', 'w23-branch-close', 'w23-verify-ma', 'w23-resolve-report'],
    W24: ['w24-open-read', 'w24-inspect-file', 'w24-branch-hangup', 'w24-verify-it', 'w24-resolve-report'],
    W25: ['w25-open-read', 'w25-inspect-contact', 'w25-branch-deny', 'w25-verify-call', 'w25-resolve-report'],
    // IMMERSIVE-004A - Instagram. Closing the claim page / appeal, saving the genuine post,
    // not paying the clone, and refusing to answer the elicitation are the safe branches;
    // the checks are the app's own search, its Account Status, the friend's saved number and
    // a known mutual.
    I01: ['i01-open-read', 'i01-inspect-profile', 'i01-branch-close', 'i01-verify-search', 'i01-resolve-report'],
    I02: ['i02-open-read', 'i02-inspect-profile', 'i02-branch-close', 'i02-verify-status', 'i02-resolve-report'],
    I03: ['i03-open-read', 'i03-inspect-profile', 'i03-branch-save', 'i03-verify-directory', 'i03-resolve-continue'],
    I04: ['i04-open-read', 'i04-inspect-profile', 'i04-branch-pivot', 'i04-verify-call', 'i04-resolve-report'],
    I05: ['i05-open-read', 'i05-inspect-profile', 'i05-branch-pivot', 'i05-verify-mutual', 'i05-resolve-report'],
    // IMMERSIVE-004B - Instagram I06-I10. Leaving the question on your own post unanswered,
    // liking the friend's reel in the player, closing the badge application, closing the ad's
    // landing page and closing the agreement are the branches; the checks are the
    // public-information cell, the chat's own history, the app's verification page, the
    // regulator's register and the brand's own website.
    I06: ['i06-open-read', 'i06-inspect-profile', 'i06-branch-pivot', 'i06-verify-pio', 'i06-resolve-report'],
    I07: ['i07-open-read', 'i07-inspect-profile', 'i07-branch-like', 'i07-verify-thread', 'i07-resolve-continue'],
    I08: ['i08-open-read', 'i08-inspect-profile', 'i08-branch-close', 'i08-verify-request', 'i08-resolve-report'],
    I09: ['i09-open-read', 'i09-inspect-ad', 'i09-branch-close', 'i09-verify-register', 'i09-resolve-report'],
    I10: ['i10-open-read', 'i10-inspect-profile', 'i10-branch-close', 'i10-verify-site', 'i10-resolve-report'],
    // IMMERSIVE-004C - Instagram I11-I15. Saving the notice, leaving the recovery request alone,
    // refusing to send money, clearing the attachment picker and leaving the link unopened are the
    // branches; the checks are the approved directory, the learner's own Password and security
    // screens, a local image index, the administrative office and the friend's saved number.
    I11: ['i11-open-read', 'i11-inspect-profile', 'i11-branch-save', 'i11-verify-directory', 'i11-resolve-retain'],
    I12: ['i12-open-read', 'i12-inspect-profile', 'i12-branch-leave', 'i12-verify-security', 'i12-resolve-report'],
    I13: ['i13-open-read', 'i13-inspect-profile', 'i13-branch-stop', 'i13-verify-image', 'i13-resolve-report'],
    I14: ['i14-open-read', 'i14-inspect-profile', 'i14-branch-leave', 'i14-verify-directory', 'i14-resolve-report'],
    I15: ['i15-open-read', 'i15-inspect-profile', 'i15-branch-leave', 'i15-verify-call', 'i15-resolve-report'],
    // IMMERSIVE-004D - Instagram I16-I20. Confirming the consent card in Tags and mentions, not
    // engaging with the extortion, sending no location, sharing nothing and discussing no equipment
    // are the branches; the checks are the release register, the support app, the teammate's saved
    // number, the unit bulletin and the public-information/security contact.
    I16: ['i16-open-read', 'i16-inspect-profile', 'i16-branch-confirm', 'i16-verify-register', 'i16-resolve-continue'],
    I17: ['i17-open-read', 'i17-inspect-profile', 'i17-branch-keep', 'i17-verify-support', 'i17-resolve-report'],
    I18: ['i18-open-read', 'i18-inspect-profile', 'i18-branch-pivot', 'i18-verify-call', 'i18-resolve-report'],
    I19: ['i19-open-read', 'i19-inspect-profile', 'i19-branch-hold', 'i19-verify-bulletin', 'i19-resolve-report'],
    I20: ['i20-open-read', 'i20-inspect-profile', 'i20-branch-decline', 'i20-verify-pio', 'i20-resolve-report'],
    // IMMERSIVE-004E - Instagram I21-I25. Approving the tag on the post's own review sheet, ending
    // the video chat, sending and sharing nothing, not installing, and closing the scanner are the
    // branches; the checks are the release register, the learner's own Account Status, the trust's
    // own website, the phone's app store and the welfare notice board.
    I21: ['i21-open-read', 'i21-inspect-profile', 'i21-branch-approve', 'i21-verify-register', 'i21-resolve-continue'],
    I22: ['i22-open-read', 'i22-inspect-profile', 'i22-branch-hangup', 'i22-verify-status', 'i22-resolve-report'],
    I23: ['i23-open-read', 'i23-inspect-profile', 'i23-branch-hold', 'i23-verify-site', 'i23-resolve-report'],
    I24: ['i24-open-read', 'i24-inspect-profile', 'i24-branch-notnow', 'i24-verify-store', 'i24-resolve-report'],
    I25: ['i25-open-read', 'i25-inspect-qr', 'i25-branch-close', 'i25-verify-notices', 'i25-resolve-report'],
    // IMMERSIVE-005 - Email E01-E05. Closing the sign-in page, deleting the macro file unopened,
    // reading and archiving the genuine newsletter, closing the tracking page and closing the
    // acknowledgement page are the safe branches; the checks are the account portal, the vendor
    // system, the newsletter archive, the courier app and the HR portal.
    E01: ['e01-open-read', 'e01-inspect-sender', 'e01-branch-close', 'e01-verify-portal', 'e01-resolve-report'],
    E02: ['e02-open-read', 'e02-inspect-sender', 'e02-branch-delete', 'e02-verify-vendor', 'e02-resolve-report'],
    E03: ['e03-open-read', 'e03-inspect-sender', 'e03-branch-archive', 'e03-verify-archive', 'e03-resolve-continue'],
    E04: ['e04-open-read', 'e04-inspect-sender', 'e04-branch-close', 'e04-verify-courier', 'e04-resolve-report'],
    E05: ['e05-open-read', 'e05-inspect-sender', 'e05-branch-close', 'e05-verify-hr', 'e05-resolve-report'],
    // IMMERSIVE-006 - Email E06-E10. Discarding the roster reply, accepting the genuine invite,
    // closing the refund page, refusing the gift cards and holding the vendor change are the safe
    // branches; the checks are the records system, the course schedule, the tax portal, the
    // procurement system and change control.
    E06: ['e06-open-read', 'e06-inspect-sender', 'e06-branch-discard', 'e06-verify-records', 'e06-resolve-report'],
    E07: ['e07-open-read', 'e07-inspect-sender', 'e07-branch-accept', 'e07-verify-schedule', 'e07-resolve-continue'],
    E08: ['e08-open-read', 'e08-inspect-sender', 'e08-branch-close', 'e08-verify-portal', 'e08-resolve-report'],
    E09: ['e09-open-read', 'e09-inspect-sender', 'e09-branch-refuse', 'e09-verify-procure', 'e09-resolve-report'],
    E10: ['e10-open-read', 'e10-inspect-sender', 'e10-branch-hold', 'e10-verify-changecontrol', 'e10-resolve-report'],
    // IMMERSIVE-007 - Email E11-E15. Opening the leave request in the known portal (legitimate),
    // deleting the fake document share, deleting the malware archive, leaving the spoofed order and
    // deleting the consent lure are the safe branches; the checks are the leave record, the files
    // portal, the records system, the orders system and the app catalogue.
    E11: ['e11-open-read', 'e11-inspect-sender', 'e11-branch-portal', 'e11-verify-leave', 'e11-resolve-continue'],
    E12: ['e12-open-read', 'e12-inspect-sender', 'e12-branch-delete', 'e12-verify-portal', 'e12-resolve-report'],
    E13: ['e13-open-read', 'e13-inspect-sender', 'e13-branch-delete', 'e13-verify-records', 'e13-resolve-report'],
    E14: ['e14-open-read', 'e14-inspect-sender', 'e14-branch-leave', 'e14-verify-orders', 'e14-resolve-report'],
    E15: ['e15-open-read', 'e15-inspect-sender', 'e15-branch-delete', 'e15-verify-catalogue', 'e15-resolve-report'],
    // IMMERSIVE-008 - Email E16-E20. Adding the signed notice's reminder (legitimate), cancelling
    // the dial dialog, holding NS-104, closing the questionnaire and closing the summons are the
    // safe branches; the checks are the IT status board, the card statement, the vendor-master
    // call, the public-information office and the official case-status app.
    E16: ['e16-open-read', 'e16-inspect-sender', 'e16-branch-reminder', 'e16-verify-board', 'e16-resolve-continue'],
    E17: ['e17-open-read', 'e17-inspect-sender', 'e17-branch-cancel', 'e17-verify-statement', 'e17-resolve-report'],
    E18: ['e18-open-read', 'e18-inspect-sender', 'e18-branch-hold', 'e18-verify-call', 'e18-resolve-report'],
    E19: ['e19-open-read', 'e19-inspect-file', 'e19-branch-closedoc', 'e19-verify-pio', 'e19-resolve-report'],
    E20: ['e20-open-read', 'e20-inspect-sender', 'e20-branch-close', 'e20-verify-lookup', 'e20-resolve-report'],
    // IMMERSIVE-009 - Email E21-E25, the final Email batch. E21 is the legitimate control and
    // its safe branch COMPLETES the change (the second approval); the other four cancel the
    // transfer, leave the attachment unopened, acknowledge in the Policy Centre and hold the
    // payroll run. The checks are the vendor on the master number, the Adjutant's office, the
    // data-protection console, the compliance helpdesk and the member's own pay record.
    E21: ['e21-open-read', 'e21-inspect-sender', 'e21-branch-approve', 'e21-verify-vendor', 'e21-resolve-continue'],
    E22: ['e22-open-read', 'e22-inspect-sender', 'e22-branch-cancel', 'e22-verify-adjt', 'e22-resolve-report'],
    E23: ['e23-open-read', 'e23-inspect-sender', 'e23-branch-close', 'e23-verify-console', 'e23-resolve-report'],
    E24: ['e24-open-read', 'e24-inspect-sender', 'e24-branch-centre', 'e24-verify-helpdesk', 'e24-resolve-report'],
    E25: ['e25-open-read', 'e25-inspect-sender', 'e25-branch-hold', 'e25-verify-record', 'e25-resolve-report'],
    // IMMERSIVE-010 - SMS S01-S05, the first SMS batch. S03 is the legitimate control and its
    // safe branch marks the matching transaction reviewed; the other four leave the text alone
    // and open the app the learner already has, end the call, check the portal themselves, or
    // cancel the mandate. The checks are the banking app, the bill on the utility's own number,
    // the bank again, the transport portal and the courier's own app.
    S01: ['s01-open-read', 's01-inspect-sender', 's01-branch-app', 's01-verify-app', 's01-resolve-report'],
    S02: ['s02-open-read', 's02-inspect-sender', 's02-branch-endcall', 's02-verify-bill', 's02-resolve-report'],
    S03: ['s03-open-read', 's03-inspect-sender', 's03-branch-reviewed', 's03-verify-app', 's03-resolve-continue'],
    S04: ['s04-open-read', 's04-inspect-sender', 's04-branch-portal', 's04-verify-portal', 's04-resolve-report'],
    S05: ['s05-open-read', 's05-inspect-sender', 's05-branch-courier', 's05-verify-app', 's05-resolve-report'],
    // IMMERSIVE-011 - SMS S06-S10, the second SMS batch. S07 is the legitimate control and its
    // safe branch matches the receipt against the recharge in the provider's own app; the other
    // four leave the text alone for the unit portal, the phone's own spam folder, the investor
    // register and the carrier app. The checks are the approved unit directory, the provider app,
    // the consumer helpline, the register and the carrier app.
    S06: ['s06-open-read', 's06-inspect-sender', 's06-branch-portal', 's06-verify-directory', 's06-resolve-report'],
    S07: ['s07-open-read', 's07-inspect-sender', 's07-branch-match', 's07-verify-app', 's07-resolve-continue'],
    S08: ['s08-open-read', 's08-inspect-sender', 's08-branch-spam', 's08-verify-consumer', 's08-resolve-report'],
    S09: ['s09-open-read', 's09-inspect-sender', 's09-branch-register', 's09-verify-register', 's09-resolve-report'],
    S10: ['s10-open-read', 's10-inspect-sender', 's10-branch-carrier', 's10-verify-app', 's10-resolve-report'],
    // IMMERSIVE-012. A reply of 1 to a genuine reminder, the e-filing portal, the details screen
    // that lists three numbers, the portal's Alerts page, and the canteen app.
    S11: ['s11-open-read', 's11-inspect-sender', 's11-branch-confirm', 's11-verify-portal', 's11-resolve-continue'],
    S12: ['s12-open-read', 's12-inspect-sender', 's12-branch-portal', 's12-verify-portal', 's12-resolve-report'],
    S13: ['s13-open-read', 's13-inspect-sender', 's13-branch-lookup', 's13-verify-careers', 's13-resolve-report'],
    S14: ['s14-open-read', 's14-inspect-sender', 's14-branch-alerts', 's14-verify-duty', 's14-resolve-report'],
    S15: ['s15-open-read', 's15-inspect-qr', 's15-branch-canteen', 's15-verify-app', 's15-resolve-report'],
    // IMMERSIVE-013. The code filled from Messages inside the portal app (legitimate), the saved
    // thread, hanging up the call that rings, the carrier's own thread from the unsaved-sender bar,
    // and the courier app.
    S16: ['s16-open-read', 's16-inspect-sender', 's16-branch-fill', 's16-verify-security', 's16-resolve-continue'],
    S17: ['s17-open-read', 's17-inspect-sender', 's17-branch-saved', 's17-verify-kabir', 's17-resolve-report'],
    S18: ['s18-open-read', 's18-inspect-thread', 's18-branch-hangup', 's18-verify-card', 's18-resolve-report'],
    S19: ['s19-open-read', 's19-inspect-sender', 's19-branch-carrier', 's19-verify-comms', 's19-resolve-report'],
    S20: ['s20-open-read', 's20-inspect-thread', 's20-branch-courier', 's20-verify-courier', 's20-resolve-report'],
    // IMMERSIVE-014. Keeping DEV-204 in the portal's session list (legitimate), closing the voice
    // portal, declining in the payment notification, keeping the four texts, deleting the file.
    S21: ['s21-open-read', 's21-inspect-message', 's21-branch-keep', 's21-verify-history', 's21-resolve-retain'],
    S22: ['s22-open-read', 's22-inspect-link', 's22-branch-close', 's22-verify-duty', 's22-resolve-report'],
    S23: ['s23-open-read', 's23-inspect-card', 's23-branch-decline', 's23-verify-shop', 's23-resolve-report'],
    S24: ['s24-open-read', 's24-inspect-sender', 's24-branch-keep', 's24-verify-legal', 's24-resolve-report'],
    S25: ['s25-open-read', 's25-inspect-file', 's25-branch-delete', 's25-verify-issuer', 's25-resolve-report'],
  }

  for (const id of AUTHORED_SCENARIO_IDS) {
    const definition = definitions[id]
    const byId = Object.fromEntries(
      sceneModel.allAffordances(scenes[id]).map((item) => [item.id, item]),
    )

    // The notify stage's own control lives on the notification, not in the scene.
    let total = resolveIntent({ definition, stage: 'notify', intent: 'open_item' }).points_delta

    for (const controlId of SAFE[id]) {
      const affordance = byId[controlId]
      assert.ok(affordance, `${id} no longer offers ${controlId}`)
      total += resolveIntent({
        definition,
        stage: affordance.stage,
        intent: affordance.intent,
        syntheticTargetId: affordance.targetId ?? null,
      }).points_delta
    }

    assert.equal(total, 10, `${id}'s safe path should score the full ten points`)
  }
})

test('each scenario keeps its own scoring meaning for the same control', () => {
  const expectations = [
    // The safe branch control scores differently on a malicious and a legitimate item,
    // and the scene does not decide which - the scenario's own scoring list does.
    ['W01', 'w01-branch-pivot', 'SAFE_PIVOT', 3],
    ['W03', 'w03-branch-yes', 'CORRECT_USE', 3],

    // Reporting a legitimate group is a false positive; reporting a malicious one is not.
    ['W03', 'w03-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['W01', 'w01-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],

    // Independent verification is worth the same everywhere; the message's own contact
    // details are worth nothing.
    ['W04', 'w04-verify-known', 'TRUSTED_VERIFY', 3],
    ['W04', 'w04-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // The critical unsafe actions keep their weight.
    ['W01', 'w01-branch-send', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W04', 'w04-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W05', 'w05-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W02', 'w02-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['W01', 'w01-branch-ask', 'RISKY_OPEN_REPLY', -3],

    // On the legitimate scenario the same shapes score as the client's table requires.
    ['W03', 'w03-branch-exit', 'NEEDLESS_REJECT_IGNORE', -2],
    ['W03', 'w03-branch-location', 'UNSAFE_EXTERNAL_ACTION', -4],

    // Acting from the preview, before the item has been read.
    ['W01', 'w01-open-quickreply', 'PREMATURE_REPLY', -1],
    ['W02', 'w02-open-link', 'PREMATURE_REPLY', -1],

    // Resolutions, for and against the verified disposition.
    ['W01', 'w01-resolve-report', 'RESOLVE_CORRECT', 2],
    ['W01', 'w01-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W03', 'w03-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['W03', 'w03-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // --- IMMERSIVE-003B ------------------------------------------------
    // Releasing an identity document, a payment, a set of codes or an account link all
    // sit at the bottom of the client's table, whatever the story calls them.
    ['W06', 'w06-branch-send', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W08', 'w08-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W09', 'w09-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W09', 'w09-branch-secret', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W10', 'w10-branch-approve', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],

    // Engaging with the item, one step short of releasing anything.
    ['W08', 'w08-branch-scan', 'RISKY_OPEN_REPLY', -3],
    ['W10', 'w10-branch-scan', 'RISKY_OPEN_REPLY', -3],
    ['W06', 'w06-branch-call', 'RISKY_OPEN_REPLY', -3],

    // W07 is the legitimate control of this batch, and scores like W03 rather than like
    // its four neighbours: the same shapes mean the opposite things.
    ['W07', 'w07-branch-keep', 'CORRECT_USE', 3],
    ['W07', 'w07-branch-delete', 'NEEDLESS_REJECT_IGNORE', -2],
    ['W07', 'w07-branch-install', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W07', 'w07-branch-location', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W07', 'w07-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['W07', 'w07-verify-known', 'TRUSTED_VERIFY', 3],
    ['W07', 'w07-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['W07', 'w07-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // ...while on the four malicious ones reporting without checking is worth +1, not -4.
    ['W06', 'w06-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W09', 'w09-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W10', 'w10-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W09', 'w09-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // --- IMMERSIVE-003C ------------------------------------------------
    // W11 is the genuine item of this batch. Its Confirm button is the correct use; leaving
    // it unanswered is a needless rejection; ringing a number from a search result is the
    // untrusted channel the client prices at -4 - and so is reporting the office.
    ['W11', 'w11-branch-confirm', 'CORRECT_USE', 3],
    ['W11', 'w11-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['W11', 'w11-branch-call', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W11', 'w11-verify-app', 'TRUSTED_VERIFY', 3],
    ['W11', 'w11-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W11', 'w11-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W11', 'w11-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['W11', 'w11-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['W11', 'w11-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['W11', 'w11-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['W11', 'w11-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // Replying C from the notification is still acting before reading.
    ['W11', 'w11-open-quickreply', 'PREMATURE_REPLY', -1],

    // W12: ending the call is the safe route whether it is done on the call or in the chat;
    // staying on it is engagement; showing the ID or paying is the release.
    ['W12', 'w12-branch-hangup', 'SAFE_PIVOT', 3],
    ['W12', 'w12-branch-pivot', 'SAFE_PIVOT', 3],
    ['W12', 'w12-branch-stay', 'RISKY_OPEN_REPLY', -3],
    ['W12', 'w12-branch-plead', 'RISKY_OPEN_REPLY', -3],
    ['W12', 'w12-branch-id', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W12', 'w12-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W12', 'w12-open-answer', 'PREMATURE_REPLY', -1],
    ['W12', 'w12-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W12', 'w12-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W12', 'w12-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W13: leaving the room is the pivot, messaging the admin is engagement, the deposit is
    // the release.
    ['W13', 'w13-branch-exit', 'SAFE_PIVOT', 3],
    ['W13', 'w13-branch-dm', 'RISKY_OPEN_REPLY', -3],
    ['W13', 'w13-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W13', 'w13-inspect-link', 'INSPECT_CONTEXT', 2],
    ['W13', 'w13-open-link', 'PREMATURE_REPLY', -1],
    ['W13', 'w13-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // W14: Cancel on either installer dialog is the pivot; Install is the release.
    ['W14', 'w14-branch-cancel-blocked', 'SAFE_PIVOT', 3],
    ['W14', 'w14-branch-cancel-confirm', 'SAFE_PIVOT', 3],
    ['W14', 'w14-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W14', 'w14-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['W14', 'w14-open-file', 'PREMATURE_REPLY', -1],
    ['W14', 'w14-verify-ops', 'TRUSTED_VERIFY', 3],
    ['W14', 'w14-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // W15: all three of the client's chips are releases; calling the new number back is
    // engagement at branch and a check that proves nothing at verify.
    ['W15', 'w15-branch-phrase', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W15', 'w15-branch-photo', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W15', 'w15-branch-doc', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W15', 'w15-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['W15', 'w15-branch-pivot', 'SAFE_PIVOT', 3],
    ['W15', 'w15-verify-adjt', 'TRUSTED_VERIFY', 3],
    ['W15', 'w15-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W15', 'w15-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W15', 'w15-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // --- IMMERSIVE-003D ------------------------------------------------
    // W16 is the genuine item. Both acknowledgements are correct use; the helpful over-share
    // and forwarding the change to a residents' group are the untrusted-channel -4; muting
    // it is a needless rejection; reporting the coordinator is a false positive.
    ['W16', 'w16-branch-ack', 'CORRECT_USE', 3],
    ['W16', 'w16-branch-reply', 'CORRECT_USE', 3],
    ['W16', 'w16-branch-overshare', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W16', 'w16-branch-forward', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W16', 'w16-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['W16', 'w16-inspect-plan', 'INSPECT_CONTEXT', 2],
    ['W16', 'w16-verify-board', 'TRUSTED_VERIFY', 3],
    ['W16', 'w16-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W16', 'w16-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W16', 'w16-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['W16', 'w16-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['W16', 'w16-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['W16', 'w16-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['W16', 'w16-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W16', 'w16-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W16', 'w16-open-quickreply', 'PREMATURE_REPLY', -1],

    // W17: the recharge and the bank details are both releases; saying yes or recruiting
    // friends is engagement.
    ['W17', 'w17-branch-stop', 'SAFE_PIVOT', 3],
    ['W17', 'w17-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W17', 'w17-branch-bank', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W17', 'w17-branch-yes', 'RISKY_OPEN_REPLY', -3],
    ['W17', 'w17-branch-invite', 'RISKY_OPEN_REPLY', -3],
    ['W17', 'w17-verify-jobs', 'TRUSTED_VERIFY', 3],
    ['W17', 'w17-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W17', 'w17-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W17', 'w17-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W18: submitting the roster form is the release; asking the account that posted, or
    // forwarding its link, is engagement; the Coy Office desk and the Roster app verify.
    ['W18', 'w18-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W18', 'w18-branch-pivot', 'SAFE_PIVOT', 3],
    ['W18', 'w18-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['W18', 'w18-branch-forward', 'RISKY_OPEN_REPLY', -3],
    ['W18', 'w18-inspect-admin', 'INSPECT_CONTEXT', 2],
    ['W18', 'w18-verify-office', 'TRUSTED_VERIFY', 3],
    ['W18', 'w18-verify-app', 'TRUSTED_VERIFY', 3],
    ['W18', 'w18-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W18', 'w18-open-link', 'PREMATURE_REPLY', -1],
    ['W18', 'w18-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W19: every share - 15 minutes, 1 hour, current - and explaining the schedule are
    // releases; "Don't allow" and Cancel are the pivot.
    ['W19', 'w19-branch-deny', 'SAFE_PIVOT', 3],
    ['W19', 'w19-branch-cancel', 'SAFE_PIVOT', 3],
    ['W19', 'w19-branch-15m', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W19', 'w19-branch-1h', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W19', 'w19-branch-current', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W19', 'w19-branch-schedule', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W19', 'w19-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['W19', 'w19-verify-duty', 'TRUSTED_VERIFY', 3],
    ['W19', 'w19-verify-co', 'TRUSTED_VERIFY', 3],
    ['W19', 'w19-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W19', 'w19-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W20: releasing the payment and submitting the beneficiary change for approval are
    // both releases; the hold is the pivot; the number on the invoice proves nothing.
    ['W20', 'w20-branch-hold', 'SAFE_PIVOT', 3],
    ['W20', 'w20-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W20', 'w20-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W20', 'w20-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['W20', 'w20-inspect-file', 'INSPECT_CONTEXT', 2],
    ['W20', 'w20-verify-rohit', 'TRUSTED_VERIFY', 3],
    ['W20', 'w20-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W20', 'w20-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W20', 'w20-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W20', 'w20-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // --- IMMERSIVE-003E ------------------------------------------------
    // W21 is the genuine item. Acknowledging in SecureDesk is correct use; asking for the
    // detail on WhatsApp, calling about it or forwarding the reference are the untrusted
    // channel; muting it is needless; reporting or blocking the senior is a false positive.
    ['W21', 'w21-branch-ack', 'CORRECT_USE', 3],
    ['W21', 'w21-branch-ask', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W21', 'w21-branch-call', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W21', 'w21-branch-forward', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['W21', 'w21-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['W21', 'w21-inspect-contact', 'INSPECT_CONTEXT', 2],
    ['W21', 'w21-verify-portal', 'TRUSTED_VERIFY', 3],
    ['W21', 'w21-verify-office', 'TRUSTED_VERIFY', 3],
    ['W21', 'w21-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W21', 'w21-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W21', 'w21-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['W21', 'w21-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['W21', 'w21-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['W21', 'w21-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['W21', 'w21-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W21', 'w21-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W21', 'w21-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W21', 'w21-open-quickreply', 'PREMATURE_REPLY', -1],

    // W22: the deposit and the identity verification are both releases; asking for proof or
    // video-calling her is engagement; the register and the bank desk verify.
    ['W22', 'w22-branch-pivot', 'SAFE_PIVOT', 3],
    ['W22', 'w22-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W22', 'w22-branch-kyc', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W22', 'w22-branch-proof', 'RISKY_OPEN_REPLY', -3],
    ['W22', 'w22-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['W22', 'w22-verify-register', 'TRUSTED_VERIFY', 3],
    ['W22', 'w22-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W22', 'w22-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W22', 'w22-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W22', 'w22-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W22', 'w22-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W22', 'w22-open-quickreply', 'PREMATURE_REPLY', -1],

    // W23: submitting the form and typing the posting into the chat are both releases; asking
    // after the mother is engagement; Ma and the welfare office verify, "Mr. Menon" does not.
    ['W23', 'w23-branch-close', 'SAFE_PIVOT', 3],
    ['W23', 'w23-branch-pivot', 'SAFE_PIVOT', 3],
    ['W23', 'w23-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W23', 'w23-branch-disclose', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W23', 'w23-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['W23', 'w23-inspect-poster', 'INSPECT_CONTEXT', 2],
    ['W23', 'w23-verify-ma', 'TRUSTED_VERIFY', 3],
    ['W23', 'w23-verify-welfare', 'TRUSTED_VERIFY', 3],
    ['W23', 'w23-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W23', 'w23-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W23', 'w23-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W24: sharing the screen and installing are both releases; every Cancel and End call is
    // the pivot; the IT helpdesk verifies, the desk's own number does not.
    ['W24', 'w24-branch-hangup', 'SAFE_PIVOT', 3],
    ['W24', 'w24-branch-cancel-share', 'SAFE_PIVOT', 3],
    ['W24', 'w24-branch-cancel-download', 'SAFE_PIVOT', 3],
    ['W24', 'w24-branch-cancel-install', 'SAFE_PIVOT', 3],
    ['W24', 'w24-branch-pivot', 'SAFE_PIVOT', 3],
    ['W24', 'w24-branch-share', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W24', 'w24-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W24', 'w24-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['W24', 'w24-open-link', 'PREMATURE_REPLY', -1],
    ['W24', 'w24-verify-it', 'TRUSTED_VERIFY', 3],
    ['W24', 'w24-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W24', 'w24-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // W25: the code in the chat and Link device are both releases; asking why is engagement;
    // a phone call to Neel and the learner's own Linked devices verify; asking the account
    // itself proves nothing.
    ['W25', 'w25-branch-deny', 'SAFE_PIVOT', 3],
    ['W25', 'w25-branch-pivot', 'SAFE_PIVOT', 3],
    ['W25', 'w25-branch-code', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W25', 'w25-branch-link', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['W25', 'w25-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['W25', 'w25-verify-call', 'TRUSTED_VERIFY', 3],
    ['W25', 'w25-verify-devices', 'TRUSTED_VERIFY', 3],
    ['W25', 'w25-verify-directory', 'TRUSTED_VERIFY', 3],
    ['W25', 'w25-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['W25', 'w25-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['W25', 'w25-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['W25', 'w25-resolve-block', 'RESOLVE_CORRECT', 2],

    // --- IMMERSIVE-004A - Instagram ------------------------------------
    // I01: logging in on the claim page and paying the delivery fee are releases; sharing the
    // post is engagement; closing the page is the pivot; searching the brand yourself verifies,
    // messaging the account does not.
    ['I01', 'i01-branch-login', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I01', 'i01-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I01', 'i01-branch-share', 'RISKY_OPEN_REPLY', -3],
    ['I01', 'i01-branch-close', 'SAFE_PIVOT', 3],
    ['I01', 'i01-verify-search', 'TRUSTED_VERIFY', 3],
    ['I01', 'i01-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I01', 'i01-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I01', 'i01-open-quickreply', 'PREMATURE_REPLY', -1],
    ['I01', 'i01-resolve-report', 'RESOLVE_CORRECT', 2],
    ['I01', 'i01-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I02: submitting the appeal login/backup code is the release; closing is the pivot; the
    // app's own Account Status verifies.
    ['I02', 'i02-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I02', 'i02-branch-close', 'SAFE_PIVOT', 3],
    ['I02', 'i02-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['I02', 'i02-verify-status', 'TRUSTED_VERIFY', 3],
    ['I02', 'i02-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // I03 is the legitimate control. Saving/sharing the approved post is correct use; muting is
    // a needless rejection; reposting it off-platform with unit and address is the untrusted
    // channel; reporting or blocking the verified account is a false positive.
    ['I03', 'i03-branch-save', 'CORRECT_USE', 3],
    ['I03', 'i03-branch-share', 'CORRECT_USE', 3],
    ['I03', 'i03-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['I03', 'i03-branch-repost', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I03', 'i03-verify-directory', 'TRUSTED_VERIFY', 3],
    ['I03', 'i03-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['I03', 'i03-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['I03', 'i03-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I03', 'i03-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['I03', 'i03-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['I03', 'i03-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I04: paying the clone is the release; asking here is engagement; not sending is the pivot;
    // the friend's saved number verifies, asking the account does not.
    ['I04', 'i04-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I04', 'i04-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I04', 'i04-branch-pivot', 'SAFE_PIVOT', 3],
    ['I04', 'i04-verify-call', 'TRUSTED_VERIFY', 3],
    ['I04', 'i04-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // I05: answering city/unit/route is the release; a friendly deflection reply is engagement;
    // keeping the specifics back is the pivot; a known mutual verifies.
    ['I05', 'i05-branch-city', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I05', 'i05-branch-unit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I05', 'i05-branch-route', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I05', 'i05-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I05', 'i05-branch-pivot', 'SAFE_PIVOT', 3],
    ['I05', 'i05-verify-mutual', 'TRUSTED_VERIFY', 3],
    ['I05', 'i05-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],

    // --- IMMERSIVE-004B - Instagram I06-I10 ------------------------------
    // I06: a public reply with the range and dates, and either location tag, are releases;
    // telling them to DM is engagement; Cancel on Add location and leaving it unanswered pivot.
    ['I06', 'i06-branch-answer', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I06', 'i06-branch-tag-range', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I06', 'i06-branch-tag-lake', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I06', 'i06-branch-dm', 'RISKY_OPEN_REPLY', -3],
    ['I06', 'i06-branch-cancel', 'SAFE_PIVOT', 3],
    ['I06', 'i06-branch-pivot', 'SAFE_PIVOT', 3],
    ['I06', 'i06-inspect-profile', 'INSPECT_CONTEXT', 2],
    ['I06', 'i06-verify-pio', 'TRUSTED_VERIFY', 3],
    ['I06', 'i06-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I06', 'i06-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I06', 'i06-open-quickreply', 'PREMATURE_REPLY', -1],
    ['I06', 'i06-resolve-report', 'RESOLVE_CORRECT', 2],
    ['I06', 'i06-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I06', 'i06-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I07 is the ordinary item. Like, Save and a reply are correct use; muting is a needless
    // rejection; pasting the link into a downloader site is the untrusted channel; reporting
    // or blocking the friend is a false positive; the chat's own history verifies.
    ['I07', 'i07-branch-like', 'CORRECT_USE', 3],
    ['I07', 'i07-branch-save', 'CORRECT_USE', 3],
    ['I07', 'i07-branch-reply', 'CORRECT_USE', 3],
    ['I07', 'i07-branch-mute', 'NEEDLESS_REJECT_IGNORE', -2],
    ['I07', 'i07-branch-download', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I07', 'i07-verify-thread', 'TRUSTED_VERIFY', 3],
    ['I07', 'i07-verify-call', 'TRUSTED_VERIFY', 3],
    ['I07', 'i07-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I07', 'i07-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['I07', 'i07-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['I07', 'i07-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['I07', 'i07-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['I07', 'i07-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I07', 'i07-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I07', 'i07-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I07', 'i07-open-quickreply', 'PREMATURE_REPLY', -1],

    // I08: the application and the priority fee are releases; asking how they guarantee it is
    // engagement; the app's own Request verification page verifies.
    ['I08', 'i08-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I08', 'i08-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I08', 'i08-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I08', 'i08-branch-close', 'SAFE_PIVOT', 3],
    ['I08', 'i08-branch-leave', 'SAFE_PIVOT', 3],
    ['I08', 'i08-verify-request', 'TRUSTED_VERIFY', 3],
    ['I08', 'i08-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I08', 'i08-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I08', 'i08-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I08', 'i08-resolve-report', 'RESOLVE_CORRECT', 2],

    // I09: installing, KYC and the deposit are releases; joining the group is engagement;
    // closing the page or hiding the ad pivots; the regulator's register verifies.
    ['I09', 'i09-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I09', 'i09-branch-kyc', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I09', 'i09-branch-deposit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I09', 'i09-branch-join', 'RISKY_OPEN_REPLY', -3],
    ['I09', 'i09-branch-close', 'SAFE_PIVOT', 3],
    ['I09', 'i09-branch-hide', 'SAFE_PIVOT', 3],
    ['I09', 'i09-inspect-ad', 'INSPECT_CONTEXT', 2],
    ['I09', 'i09-verify-register', 'TRUSTED_VERIFY', 3],
    ['I09', 'i09-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I09', 'i09-open-join', 'PREMATURE_REPLY', -1],
    ['I09', 'i09-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I10: signing the agreement and paying shipping are releases; replying YES is engagement;
    // the brand's own website verifies, asking the account does not.
    ['I10', 'i10-branch-sign', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I10', 'i10-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I10', 'i10-branch-yes', 'RISKY_OPEN_REPLY', -3],
    ['I10', 'i10-branch-close', 'SAFE_PIVOT', 3],
    ['I10', 'i10-branch-decline', 'SAFE_PIVOT', 3],
    ['I10', 'i10-verify-site', 'TRUSTED_VERIFY', 3],
    ['I10', 'i10-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I10', 'i10-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I10', 'i10-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I10', 'i10-resolve-block', 'RESOLVE_CORRECT', 2],
  ]

  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id])
      .find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)

    const outcome = resolveIntent({
      definition: definitions[id],
      stage: affordance.stage,
      intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('the consequence a risky control triggers is a rendering instruction, never an action', () => {
  const risky = [
    ['W02', 'w02-branch-open', 'simulated_browser_open'],
    ['W05', 'w05-branch-submit', 'simulated_data_submission'],
    ['W04', 'w04-branch-pay', 'simulated_payment'],
    ['W01', 'w01-branch-call', 'simulated_call'],
    ['W06', 'w06-branch-send', 'simulated_data_submission'],
    ['W08', 'w08-branch-scan', 'simulated_qr_inspect'],
    ['W09', 'w09-branch-pay', 'simulated_payment'],
    ['W10', 'w10-branch-approve', 'simulated_device_link'],
    ['W11', 'w11-branch-call', 'simulated_call'],
    ['W12', 'w12-branch-pay', 'simulated_payment'],
    ['W12', 'w12-branch-id', 'simulated_data_submission'],
    ['W13', 'w13-branch-pay', 'simulated_payment'],
    ['W14', 'w14-branch-install', 'simulated_install'],
    ['W15', 'w15-branch-phrase', 'simulated_data_submission'],
    ['W16', 'w16-branch-overshare', 'simulated_data_submission'],
    ['W16', 'w16-branch-forward', 'simulated_reply_sent'],
    ['W17', 'w17-branch-pay', 'simulated_payment'],
    ['W17', 'w17-branch-bank', 'simulated_data_submission'],
    ['W18', 'w18-branch-submit', 'simulated_data_submission'],
    ['W19', 'w19-branch-1h', 'simulated_data_submission'],
    ['W20', 'w20-branch-pay', 'simulated_payment'],
    ['W20', 'w20-branch-submit', 'simulated_data_submission'],
    ['W21', 'w21-branch-ask', 'simulated_reply_sent'],
    ['W21', 'w21-branch-call', 'simulated_call'],
    ['W22', 'w22-branch-pay', 'simulated_payment'],
    ['W22', 'w22-branch-kyc', 'simulated_data_submission'],
    ['W23', 'w23-branch-submit', 'simulated_data_submission'],
    ['W24', 'w24-branch-install', 'simulated_install'],
    ['W24', 'w24-branch-share', 'simulated_data_submission'],
    ['W25', 'w25-branch-link', 'simulated_device_link'],
    ['W25', 'w25-branch-code', 'simulated_data_submission'],
    ['I01', 'i01-branch-login', 'simulated_data_submission'],
    ['I01', 'i01-branch-pay', 'simulated_payment'],
    ['I02', 'i02-branch-submit', 'simulated_data_submission'],
    ['I04', 'i04-branch-pay', 'simulated_payment'],
    ['I05', 'i05-branch-city', 'simulated_data_submission'],
    ['I06', 'i06-branch-answer', 'simulated_data_submission'],
    ['I06', 'i06-branch-tag-range', 'simulated_data_submission'],
    ['I06', 'i06-branch-dm', 'simulated_reply_sent'],
    ['I07', 'i07-branch-download', 'simulated_browser_open'],
    ['I08', 'i08-branch-submit', 'simulated_data_submission'],
    ['I08', 'i08-branch-pay', 'simulated_payment'],
    ['I08', 'i08-branch-ask', 'simulated_reply_sent'],
    ['I09', 'i09-branch-join', 'simulated_browser_open'],
    ['I09', 'i09-branch-install', 'simulated_install'],
    ['I09', 'i09-branch-kyc', 'simulated_data_submission'],
    ['I09', 'i09-branch-deposit', 'simulated_payment'],
    ['I10', 'i10-branch-sign', 'simulated_data_submission'],
    ['I10', 'i10-branch-pay', 'simulated_payment'],
    ['I10', 'i10-branch-yes', 'simulated_reply_sent'],
    ['I11', 'i11-branch-comment', 'simulated_data_submission'],
    ['I11', 'i11-branch-dm', 'simulated_reply_sent'],
    ['I12', 'i12-branch-code', 'simulated_data_submission'],
    ['I12', 'i12-branch-submit', 'simulated_data_submission'],
    ['I13', 'i13-branch-gift', 'simulated_data_submission'],
    ['I13', 'i13-branch-wallet', 'simulated_payment'],
    ['I13', 'i13-branch-id', 'simulated_data_submission'],
    ['I14', 'i14-branch-send', 'simulated_data_submission'],
    ['I14', 'i14-branch-form', 'simulated_browser_open'],
    ['I15', 'i15-branch-login', 'simulated_data_submission'],
    ['I15', 'i15-branch-approve', 'simulated_device_link'],
    ['I16', 'i16-branch-caption', 'simulated_data_submission'],
    ['I16', 'i16-branch-ask', 'simulated_reply_sent'],
    ['I17', 'i17-branch-pay', 'simulated_payment'],
    ['I17', 'i17-branch-photo', 'simulated_data_submission'],
    ['I17', 'i17-branch-plead', 'simulated_reply_sent'],
    ['I18', 'i18-branch-pin', 'simulated_data_submission'],
    ['I18', 'i18-branch-type', 'simulated_data_submission'],
    ['I18', 'i18-branch-ask', 'simulated_reply_sent'],
    ['I19', 'i19-branch-story', 'simulated_reply_sent'],
    ['I19', 'i19-branch-comment', 'simulated_reply_sent'],
    ['I19', 'i19-branch-location', 'simulated_data_submission'],
    ['I19', 'i19-branch-tag', 'simulated_data_submission'],
    ['I20', 'i20-branch-submit', 'simulated_data_submission'],
    ['I20', 'i20-branch-answer', 'simulated_data_submission'],
    ['I20', 'i20-branch-general', 'simulated_reply_sent'],
    ['I21', 'i21-branch-caption', 'simulated_data_submission'],
    ['I21', 'i21-branch-album', 'simulated_browser_open'],
    ['I22', 'i22-branch-camera', 'simulated_data_submission'],
    ['I22', 'i22-branch-share', 'simulated_data_submission'],
    ['I22', 'i22-branch-code', 'simulated_data_submission'],
    ['I22', 'i22-branch-ask', 'simulated_reply_sent'],
    ['I23', 'i23-branch-pay', 'simulated_payment'],
    ['I23', 'i23-branch-share', 'simulated_reply_sent'],
    ['I24', 'i24-branch-install', 'simulated_install'],
    ['I24', 'i24-branch-kyc', 'simulated_data_submission'],
    ['I24', 'i24-branch-tax', 'simulated_payment'],
    ['I24', 'i24-branch-comment', 'simulated_reply_sent'],
    ['I25', 'i25-branch-open', 'simulated_qr_inspect'],
    ['I25', 'i25-branch-submit', 'simulated_data_submission'],
    ['I25', 'i25-branch-pay', 'simulated_payment'],
    ['I25', 'i25-branch-share', 'simulated_reply_sent'],
  ]

  for (const [id, controlId, kind] of risky) {
    const affordance = sceneModel.allAffordances(scenes[id])
      .find((item) => item.id === controlId)
    const outcome = resolveIntent({
      definition: definitions[id],
      stage: affordance.stage,
      intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.consequence.kind, kind)
    assert.equal(outcome.consequence.inert, true)
    assert.equal(outcome.consequence.executes, false)
  }
})

test('every verification source the server records is one the event ledger accepts', async () => {
  /**
   * IMMERSIVE-003E. Every scene and the generic action sheet send `verify_source` metadata,
   * and the ScenarioEvent model validates it against an enum. The two drifted: clients sent
   * `in_message_contact`, the model listed only `in_message`, and the in-message route was
   * refused with a 422 in a real browser while every stubbed suite passed. This compares the
   * real values on both sides, with no database.
   *
   * SECURITY-001 moved the value to the server (derived from the intent), so the check is
   * now the server's table against the real enum - and that no client control carries one.
   */
  const { ScenarioEvent } = await import('../src/models/ScenarioEvent.js')
  const accepted = ScenarioEvent.schema.path('metadata').schema.path('verify_source').enumValues
  const { actionsFor } = await import(
    pathToFileURL(path.resolve(HERE, '../../frontend/src/constants/simulation.js')).href
  )

  for (const id of AUTHORED_SCENARIO_IDS) {
    for (const control of rawSceneModel.allAffordances(scenes[id])) {
      assert.equal(control.source, undefined, `${id} ${control.id}`)
    }
  }
  // The generic action sheet the Email and SMS scenarios use.
  for (const action of actionsFor('verify', payload('W21'))) {
    assert.equal(action.source, undefined, action.id)
    assert.equal(action.intent, undefined, action.id)
  }

  const sent = new Set(Object.values(VERIFY_SOURCE_BY_INTENT))
  assert.ok(sent.has('in_message_contact'), 'the server still records the in-message source')
  for (const source of sent) {
    assert.ok(accepted.includes(source), `verify_source "${source}" would be refused by the ledger`)
    const event = new ScenarioEvent({ metadata: { verify_source: source } })
    const error = event.validateSync()
    assert.equal(error?.errors?.['metadata.verify_source'], undefined, source)
  }
})

test('a scene never reaches for an asset the pinned scenario does not declare', () => {
  for (const id of AUTHORED_SCENARIO_IDS) {
    const known = new Set(definitions[id].synthetic.assets.map((asset) => asset.asset_id))
    for (const affordance of sceneModel.allAffordances(scenes[id])) {
      if (!affordance.targetId) continue
      assert.ok(known.has(affordance.targetId),
        `${id} ${affordance.id} names unknown asset ${affordance.targetId}`)
    }
  }
})

test('every stage of every authored scenario is reachable and can be left', () => {
  for (const id of AUTHORED_SCENARIO_IDS) {
    for (const stage of ['open', 'inspect', 'branch', 'verify', 'resolve']) {
      const offered = sceneModel.affordancesFor(scenes[id], stage)
        .filter((item) => item.intent)
      assert.ok(offered.length > 0, `${id} offers nothing at the ${stage} stage`)
    }
  }
})

test('the authoritative scenario records for this batch are untouched', () => {
  const expected = {
    W01: { title: 'The Accidental Login Code', disposition: 'Malicious', difficulty: 'Easy' },
    W02: { title: 'Parcel Redelivery Fee', disposition: 'Malicious', difficulty: 'Easy' },
    W03: { title: 'Known Sports Meet Group', disposition: 'Legitimate', difficulty: 'Easy' },
    W04: { title: 'Friend on a New Number', disposition: 'Malicious', difficulty: 'Easy' },
    W05: { title: 'KYC Suspension Warning', disposition: 'Malicious', difficulty: 'Easy' },
    W06: { title: 'Unit Clerk ID Photo Request', disposition: 'Malicious', difficulty: 'Easy' },
    W07: { title: 'Expected Family Document', disposition: 'Legitimate', difficulty: 'Easy' },
    W08: { title: 'Festival Reward QR', disposition: 'Malicious', difficulty: 'Easy' },
    W09: { title: 'Compromised Colleague Gift Cards', disposition: 'Malicious', difficulty: 'Medium' },
    W10: { title: 'Survey Device-Link QR', disposition: 'Malicious', difficulty: 'Medium' },
    W11: { title: 'Expected Welfare Appointment', disposition: 'Legitimate', difficulty: 'Medium' },
    W12: { title: 'Digital Arrest Escalation', disposition: 'Malicious', difficulty: 'Medium' },
    W13: { title: 'Guaranteed IPO Group', disposition: 'Malicious', difficulty: 'Medium' },
    W14: { title: 'Movement Order APK', disposition: 'Malicious', difficulty: 'Medium' },
    W15: { title: "Senior's Urgent Voice Note", disposition: 'Malicious', difficulty: 'Medium' },
    W16: { title: 'Verified Vehicle-Pool Change', disposition: 'Legitimate', difficulty: 'Medium' },
    W17: { title: 'Part-Time Rating Tasks', disposition: 'Malicious', difficulty: 'Medium' },
    W18: { title: 'Hijacked Group Admin Roster Link', disposition: 'Malicious', difficulty: 'Hard' },
    W19: { title: 'Commander Clone Requests Location', disposition: 'Malicious', difficulty: 'Hard' },
    W20: { title: 'Supplier Bank-Detail Change', disposition: 'Malicious', difficulty: 'Hard' },
    W21: { title: 'Verified Senior Requests Secure Follow-Up', disposition: 'Legitimate', difficulty: 'Hard' },
    W22: { title: 'Long-Game Online Friendship', disposition: 'Malicious', difficulty: 'Hard' },
    W23: { title: 'Family Welfare Pretext', disposition: 'Malicious', difficulty: 'Hard' },
    W24: { title: 'Remote Support Screen Share', disposition: 'Malicious', difficulty: 'Hard' },
    W25: { title: 'Known Contact Sends a Linking Code', disposition: 'Malicious', difficulty: 'Hard' },
  }

  for (const [id, fields] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, fields.title)
    assert.equal(record.disposition, fields.disposition)
    assert.equal(record.difficulty, fields.difficulty)
    assert.equal(record.platform, 'WhatsApp')
    assert.equal(record.stages.length, 6)
  }
  assert.equal(scenarios.length, 100)
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-003C - the W11-W15 walks, through the engine into the review
 * ------------------------------------------------------------------ */

/**
 * JOB 1's review reads nothing but the ledger, the definition and the outcome class, so
 * the honest test of "the review explains a W11-W15 mistake" is to produce the ledger the
 * way a learner would - by pressing the scene's own controls, each resolved by the real
 * engine against the real pinned definition - and hand it to the real review builder.
 * Nothing here names a mistake kind the engine did not produce.
 */
function walk(id, controlIds) {
  const definition = definitions[id]
  const byId = Object.fromEntries(
    sceneModel.allAffordances(scenes[id]).map((item) => [item.id, item]),
  )
  let sequence = 0
  let stage = 'notify'
  const events = []
  const record = (intent, targetId = null) => {
    const outcome = resolveIntent({ definition, stage, intent, syntheticTargetId: targetId })
    sequence += 1
    events.push({ sequence, stage, event_code: outcome.event_code, points: outcome.points_delta })
    stage = outcome.next_stage ?? stage
    return outcome
  }

  // SECURITY-001: every step is the code a client would send, translated by the server.
  const run = { _id: `walk-${id}`, scenario_id: id, definition_version: definition.version }
  const viaCode = (controlId) => translateActionCode({
    run,
    actionCode: actionCodeFor({
      runId: run._id, scenarioId: id, version: definition.version, controlId,
    }),
  })

  const opened = viaCode('gen-c01')
  assert.equal(opened.intent, 'open_item')
  record(opened.intent)
  let final = null
  for (const controlId of controlIds) {
    const affordance = byId[controlId]
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    assert.equal(affordance.stage, stage, `${id} ${controlId} is not offered at ${stage}`)
    const translated = viaCode(affordance.neutralId)
    assert.equal(translated.stage, stage, `${id} ${controlId} is placed at ${translated.stage}`)
    record(translated.intent, affordance.targetId ?? null)
    if (affordance.stage === 'resolve') final = translated.intent
  }

  const score = Math.max(0, Math.min(10, events.reduce((sum, e) => sum + e.points, 0)))
  const outcomeClass = classifyOutcome({
    disposition: definition.disposition,
    outcomeCode: final,
    eventCodes: events.map((e) => e.event_code),
  })
  const review = buildScenarioReview({
    definition,
    run: { outcome_code: final },
    events,
    outcomeClass,
    path: pathFromEvents(events),
  })
  return { events, score, outcomeClass, review }
}

const kinds = (review) => review.mistakes.map((m) => m.kind ?? m.card?.kind)
const cardOf = (review, kind) => {
  const found = review.mistakes.find((m) => (m.card ?? m).kind === kind)
  return found?.card ?? found
}

test('the engine really does advance a stage per control in these walks', () => {
  const { events } = walk('W12', [
    'w12-open-read', 'w12-inspect-file', 'w12-branch-hangup', 'w12-verify-desk', 'w12-resolve-report',
  ])
  assert.deepEqual(events.map((e) => e.stage),
    ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'])
})

test('W11-W15 safe walks score ten and produce the positive card', () => {
  const SAFE_WALKS = {
    W11: ['w11-open-read', 'w11-inspect-contact', 'w11-branch-confirm', 'w11-verify-app', 'w11-resolve-continue'],
    W12: ['w12-open-read', 'w12-inspect-file', 'w12-branch-hangup', 'w12-verify-desk', 'w12-resolve-report'],
    W13: ['w13-open-read', 'w13-inspect-group', 'w13-branch-exit', 'w13-verify-app', 'w13-resolve-report'],
    W14: ['w14-open-read', 'w14-inspect-file', 'w14-branch-cancel-blocked', 'w14-verify-dms', 'w14-resolve-report'],
    W15: ['w15-open-read', 'w15-inspect-voice', 'w15-branch-pivot', 'w15-verify-adjt', 'w15-resolve-block'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
  }
})

test('W11 reviews a genuine item handled as a threat as a false positive', () => {
  const { score, outcomeClass, review } = walk('W11', [
    'w11-open-read', 'w11-inspect-contact', 'w11-branch-call', 'w11-verify-report', 'w11-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'unsafe_external_action', 'rejected_a_genuine_item', 'contradictory_resolution',
  ])
  // The correct action at the branch is W11's own stage text, not a generic line.
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('W11 reviews leaving the confirmation unanswered as abandoning it', () => {
  const { score, review } = walk('W11', [
    'w11-open-read', 'w11-inspect-contact', 'w11-branch-ignore', 'w11-verify-app', 'w11-resolve-retain',
  ])
  assert.equal(score, 5)
  assert.deepEqual(kinds(review), ['abandoned_without_checking'])
})

test('W12 reviews answering from the list, paying and checking with the caller', () => {
  const { score, outcomeClass, review } = walk('W12', [
    'w12-open-answer', 'w12-branch-pay', 'w12-verify-inmessage', 'w12-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  // Answering from the list jumps straight to branch, so inspection was never offered a
  // chance - and the review says so, as it did for W06's premature route in 003B.
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'released_details_or_paid',
    'verified_through_the_message',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not stay isolated/)
})

test('W13 reviews messaging the admin and reporting unchecked', () => {
  const { score, outcomeClass, review } = walk('W13', [
    'w13-open-read', 'w13-inspect-group', 'w13-branch-dm', 'w13-verify-report', 'w13-resolve-report',
  ])
  assert.equal(score, 2)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('W14 reviews the install with its own correct action', () => {
  const { score, review } = walk('W14', [
    'w14-open-read', 'w14-inspect-file', 'w14-branch-install', 'w14-verify-dms', 'w14-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, and the engine clamps the final sum to 0.
  assert.equal(score, 0)
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not install the APK/)
})

test('W15 reviews sending the phrase and continuing, and says what to have done', () => {
  const { score, outcomeClass, review } = walk('W15', [
    'w15-open-read', 'w15-inspect-thread', 'w15-branch-phrase', 'w15-verify-inmessage', 'w15-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not send an access phrase/)
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-003D - the W16-W20 walks, through the engine into the review
 * ------------------------------------------------------------------ */

test('W16-W20 safe walks score ten and produce the positive card', () => {
  const SAFE_WALKS = {
    W16: ['w16-open-read', 'w16-inspect-plan', 'w16-branch-ack', 'w16-verify-board', 'w16-resolve-continue'],
    W17: ['w17-open-read', 'w17-inspect-contact', 'w17-branch-stop', 'w17-verify-jobs', 'w17-resolve-report'],
    W18: ['w18-open-read', 'w18-inspect-group', 'w18-branch-pivot', 'w18-verify-office', 'w18-resolve-report'],
    W19: ['w19-open-read', 'w19-inspect-contact', 'w19-branch-deny', 'w19-verify-duty', 'w19-resolve-block'],
    W20: ['w20-open-read', 'w20-inspect-file', 'w20-branch-hold', 'w20-verify-rohit', 'w20-resolve-report'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('W16 reviews an over-long acknowledgement as an unsafe step, not as a missed threat', () => {
  const { score, outcomeClass, review } = walk('W16', [
    'w16-open-read', 'w16-inspect-contact', 'w16-branch-overshare', 'w16-verify-directory', 'w16-resolve-continue',
  ])
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('W16 reviews muting and reporting the coordinator as a false positive', () => {
  const { score, outcomeClass, review } = walk('W16', [
    'w16-open-read', 'w16-inspect-skip', 'w16-branch-ignore', 'w16-verify-report', 'w16-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'rejected_a_genuine_item').correct_action, /movement board/)
})

test('W17 reviews answering from the preview and paying the recharge', () => {
  const { score, outcomeClass, review } = walk('W17', [
    'w17-open-quickreply', 'w17-branch-pay', 'w17-verify-inmessage', 'w17-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'released_details_or_paid',
    'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not deposit\/recharge/)
})

test('W17 treats linking a bank account for payouts as a release, even when it ends well', () => {
  const { score, review } = walk('W17', [
    'w17-open-read', 'w17-inspect-link', 'w17-branch-bank', 'w17-verify-jobs', 'w17-resolve-block',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
})

test('W18 reviews submitting the form and asking the account that posted it', () => {
  const { score, outcomeClass, review } = walk('W18', [
    'w18-open-read', 'w18-inspect-group', 'w18-branch-submit', 'w18-verify-inmessage', 'w18-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not submit personnel/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /known directory/)
})

test('W18 reviews forwarding the link and reporting unchecked', () => {
  const { score, review } = walk('W18', [
    'w18-open-read', 'w18-inspect-admin', 'w18-branch-forward', 'w18-verify-report', 'w18-resolve-report',
  ])
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('W19 reviews sharing live location for an hour with its own correct action', () => {
  const { score, outcomeClass, review } = walk('W19', [
    'w19-open-read', 'w19-inspect-thread', 'w19-branch-1h', 'w19-verify-inmessage', 'w19-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not share live\/current location/)
})

test('W20 reviews the override payment and the invoice number that vouched for itself', () => {
  const { score, outcomeClass, review } = walk('W20', [
    'w20-open-read', 'w20-inspect-contact', 'w20-branch-pay', 'w20-verify-inmessage', 'w20-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), ['released_details_or_paid', 'verified_through_the_message'])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not change stored bank details/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action,
    /supplier contact already on file/)
})

test('W20 counts submitting the beneficiary change for approval as a release too', () => {
  const { score, review } = walk('W20', [
    'w20-open-read', 'w20-inspect-file', 'w20-branch-submit', 'w20-verify-directory', 'w20-resolve-report',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
})

test('no W16-W20 review carries an engine event code or a point value', () => {
  const walks = [
    ['W16', ['w16-open-quickreply', 'w16-branch-forward', 'w16-verify-block', 'w16-resolve-block']],
    ['W17', ['w17-open-read', 'w17-inspect-skip', 'w17-branch-invite', 'w17-verify-report', 'w17-resolve-retain']],
    ['W18', ['w18-open-link', 'w18-branch-submit', 'w18-verify-inmessage', 'w18-resolve-continue']],
    ['W19', ['w19-open-quickreply', 'w19-branch-schedule', 'w19-verify-block', 'w19-resolve-ignore']],
    ['W20', ['w20-open-quickreply', 'w20-branch-reply', 'w20-verify-inmessage', 'w20-resolve-retain']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-003E - the W21-W25 walks, through the engine into the review
 * ------------------------------------------------------------------ */

test('W21-W25 carry the canonical identity the batch was built against', () => {
  const expected = {
    W21: ['legitimate', 'legit_routine_broadcast', ['authority'], true],
    W22: ['malicious', 'relationship_grooming_fraud', ['trust', 'reciprocity'], false],
    W23: ['malicious', 'operational_elicitation', ['empathy', 'authority'], true],
    W24: ['malicious', 'tech_support_and_callback_fraud', ['fear', 'helpfulness'], false],
    W25: ['malicious', 'account_takeover_authorisation_abuse', ['trust', 'reciprocity'], false],
  }
  for (const [id, [disposition, family, triggers, military]] of Object.entries(expected)) {
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
    assert.equal(definition.level, 'hard', id)
  }
})

test('W21-W25 safe walks score ten and produce the positive card', () => {
  const SAFE_WALKS = {
    W21: ['w21-open-read', 'w21-inspect-thread', 'w21-branch-ack', 'w21-verify-office', 'w21-resolve-retain'],
    W22: ['w22-open-read', 'w22-inspect-contact', 'w22-branch-pivot', 'w22-verify-directory', 'w22-resolve-block'],
    W23: ['w23-open-read', 'w23-inspect-poster', 'w23-branch-pivot', 'w23-verify-welfare', 'w23-resolve-block'],
    W24: ['w24-open-read', 'w24-inspect-contact', 'w24-branch-cancel-share', 'w24-verify-directory', 'w24-resolve-block'],
    W25: ['w25-open-read', 'w25-inspect-thread', 'w25-branch-pivot', 'w25-verify-devices', 'w25-resolve-block'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('W21 reviews asking for the detail on WhatsApp as an unsafe step, not a missed threat', () => {
  const { score, outcomeClass, review } = walk('W21', [
    'w21-open-read', 'w21-inspect-contact', 'w21-branch-ask', 'w21-verify-portal', 'w21-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('W21 reviews ignoring and reporting the senior as a false positive', () => {
  const { score, outcomeClass, review } = walk('W21', [
    'w21-open-read', 'w21-inspect-skip', 'w21-branch-ignore', 'w21-verify-block', 'w21-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'rejected_a_genuine_item').correct_action, /REF-ALPHA-17/)
})

test('W22 reviews the trial deposit and checking with Samira herself', () => {
  const { score, outcomeClass, review } = walk('W22', [
    'w22-open-read', 'w22-inspect-thread', 'w22-branch-pay', 'w22-verify-inmessage', 'w22-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not deposit funds, upload ID/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /outside the relationship/)
})

test('W22 reviews asking for proof and reporting unchecked', () => {
  const { score, review } = walk('W22', [
    'w22-open-read', 'w22-inspect-contact', 'w22-branch-proof', 'w22-verify-report', 'w22-resolve-report',
  ])
  // 0 + 2 - 3 + 1 + 2 = 2
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('W23 reviews submitting the grant form with its own correct action', () => {
  const { score, outcomeClass, review } = walk('W23', [
    'w23-open-read', 'w23-inspect-contact', 'w23-branch-submit', 'w23-verify-inmessage', 'w23-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not disclose posting, movement, family or bank information/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /known welfare office/)
})

test('W23 counts typing the posting into the chat as a release too', () => {
  const { score, review } = walk('W23', [
    'w23-open-quickreply', 'w23-branch-disclose', 'w23-verify-ma', 'w23-resolve-report',
  ])
  // -1 - 8 + 3 + 2 = -4, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['premature_action', 'no_inspection', 'released_details_or_paid'])
})

test('W24 reviews sharing the screen on the call', () => {
  const { score, outcomeClass, review } = walk('W24', [
    'w24-open-read', 'w24-inspect-file', 'w24-branch-share', 'w24-verify-inmessage', 'w24-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not install the app, share screen or grant accessibility/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /approved IT support/)
})

test('W24 reviews installing from the preview link', () => {
  const { score, review } = walk('W24', [
    'w24-open-link', 'w24-branch-install', 'w24-verify-it', 'w24-resolve-report',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['premature_action', 'no_inspection', 'released_details_or_paid'])
})

test('W25 reviews linking the device and checking with the account itself', () => {
  const { score, outcomeClass, review } = walk('W25', [
    'w25-open-read', 'w25-inspect-contact', 'w25-branch-link', 'w25-verify-inmessage', 'w25-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not share the code or approve the unfamiliar device/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /known alternate route/)
})

test('W25 reviews sending the code even when the rest of the run is careful', () => {
  const { score, review } = walk('W25', [
    'w25-open-read', 'w25-inspect-thread', 'w25-branch-code', 'w25-verify-call', 'w25-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
})

test('no W21-W25 review carries an engine event code or a point value', () => {
  const walks = [
    ['W21', ['w21-open-quickreply', 'w21-branch-call', 'w21-verify-report', 'w21-resolve-ignore']],
    ['W22', ['w22-open-quickreply', 'w22-branch-kyc', 'w22-verify-block', 'w22-resolve-continue']],
    ['W23', ['w23-open-read', 'w23-inspect-skip', 'w23-branch-ask', 'w23-verify-report', 'w23-resolve-retain']],
    ['W24', ['w24-open-read', 'w24-inspect-skip', 'w24-branch-reply', 'w24-verify-report', 'w24-resolve-ignore']],
    ['W25', ['w25-open-quickreply', 'w25-branch-ask', 'w25-verify-block', 'w25-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

test('no W11-W15 review carries an engine event code or a point value', () => {
  const walks = [
    ['W11', ['w11-open-quickreply', 'w11-branch-call', 'w11-verify-block', 'w11-resolve-block']],
    ['W12', ['w12-open-read', 'w12-inspect-skip', 'w12-branch-id', 'w12-verify-report', 'w12-resolve-retain']],
    ['W13', ['w13-open-link', 'w13-branch-pay', 'w13-verify-inmessage', 'w13-resolve-continue']],
    ['W14', ['w14-open-file', 'w14-branch-reply', 'w14-verify-block', 'w14-resolve-ignore']],
    ['W15', ['w15-open-quickreply', 'w15-branch-call', 'w15-verify-directory', 'w15-resolve-report']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-004A - Instagram I01-I05, through the engine into the review
 * ------------------------------------------------------------------ */

test('I01-I05 records are untouched and carry the canonical identity the batch was built against', () => {
  const expected = {
    I01: ['Flash Giveaway Winner', 'malicious', 'unsolicited_payment_lure', ['greed', 'scarcity'], false],
    I02: ['Copyright Appeal Countdown', 'malicious', 'credential_phishing', ['fear', 'urgency'], false],
    I03: ['Published Blood-Donation Drive', 'legitimate', 'legit_routine_broadcast', ['empathy'], true],
    I04: ['Cloned Friend in Distress', 'malicious', 'impersonation_emergency_payment', ['empathy', 'urgency'], false],
    I05: ['Friendly New Follower Questionnaire', 'malicious', 'operational_elicitation', ['flattery', 'curiosity'], true],
  }
  for (const [id, [title, disposition, family, triggers, military]] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, title, id)
    assert.equal(record.platform, 'Instagram', id)
    assert.equal(record.difficulty, 'Easy', id)
    assert.equal(record.stages.length, 6, id)
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
  }
})

test('the controls added after the first Instagram pass keep their scoring meaning', () => {
  const expectations = [
    // I03: the stranger's form and replying with a number are the untrusted channel on a
    // genuine item; the unit desk on the directory number verifies.
    ['I03', 'i03-branch-link', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I03', 'i03-branch-reply', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I03', 'i03-verify-call', 'TRUSTED_VERIFY', 3],
    ['I03', 'i03-open-quickreply', 'PREMATURE_REPLY', -1],
    // I04: a known mutual on her own number is the client's second route.
    ['I04', 'i04-verify-mutual', 'TRUSTED_VERIFY', 3],
    ['I04', 'i04-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I04', 'i04-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // The resolve banners mix a right and a wrong answer.
    ['I05', 'i05-resolve-report', 'RESOLVE_CORRECT', 2],
    ['I05', 'i05-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I02', 'i02-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I02', 'i02-open-quickreply', 'PREMATURE_REPLY', -1],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('I01-I05 safe walks score ten and produce the positive card', () => {
  const SAFE_WALKS = {
    I01: ['i01-open-read', 'i01-inspect-profile', 'i01-branch-leave', 'i01-verify-search', 'i01-resolve-block'],
    I02: ['i02-open-read', 'i02-inspect-thread', 'i02-branch-ignore', 'i02-verify-status', 'i02-resolve-report'],
    I03: ['i03-open-read', 'i03-inspect-thread', 'i03-branch-share', 'i03-verify-call', 'i03-resolve-retain'],
    I04: ['i04-open-read', 'i04-inspect-profile', 'i04-branch-pivot', 'i04-verify-mutual', 'i04-resolve-block'],
    I05: ['i05-open-read', 'i05-inspect-profile', 'i05-branch-pivot', 'i05-verify-mutual', 'i05-resolve-block'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('I01 reviews logging in on the claim page with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I01', [
    'i01-open-read', 'i01-inspect-skip', 'i01-branch-login', 'i01-verify-inmessage', 'i01-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'released_details_or_paid', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not enter credentials, payment data or share the post/)
})

test('I02 reviews replying to the "support" request and reporting unchecked', () => {
  const { score, review } = walk('I02', [
    'i02-open-read', 'i02-inspect-profile', 'i02-branch-reply', 'i02-verify-report', 'i02-resolve-report',
  ])
  // 0 + 2 - 3 + 1 + 2 = 2
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('I02 reviews submitting the appeal login and backup code from the preview', () => {
  const { score, outcomeClass, review } = walk('I02', [
    'i02-open-quickreply', 'i02-branch-submit', 'i02-verify-inmessage', 'i02-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'released_details_or_paid',
    'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not log in, upload ID or share a backup code/)
})

test('I03 reviews muting and reporting the genuine unit post as a false positive', () => {
  const { score, outcomeClass, review } = walk('I03', [
    'i03-open-read', 'i03-inspect-skip', 'i03-branch-ignore', 'i03-verify-report', 'i03-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
})

test('I03 reviews the strangerâ€™s registration form as an unsafe step, not a missed threat', () => {
  const { score, outcomeClass, review } = walk('I03', [
    'i03-open-read', 'i03-inspect-profile', 'i03-branch-link', 'i03-verify-directory', 'i03-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('I04 reviews paying the clone and asking the account to prove itself', () => {
  const { score, outcomeClass, review } = walk('I04', [
    'i04-open-read', 'i04-inspect-profile', 'i04-branch-pay', 'i04-verify-inmessage', 'i04-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not send money or verify only by DM/)
})

test('I05 reviews answering the route question even when the rest of the run is careful', () => {
  const { score, review } = walk('I05', [
    'i05-open-read', 'i05-inspect-profile', 'i05-branch-route', 'i05-verify-mutual', 'i05-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not reveal workplace, location, schedule or relationship data/)
})

test('no I01-I05 review carries an engine event code or a point value', () => {
  const walks = [
    ['I01', ['i01-open-quickreply', 'i01-branch-pay', 'i01-verify-block', 'i01-resolve-ignore']],
    ['I02', ['i02-open-read', 'i02-inspect-skip', 'i02-branch-submit', 'i02-verify-report', 'i02-resolve-continue']],
    ['I03', ['i03-open-quickreply', 'i03-branch-repost', 'i03-verify-block', 'i03-resolve-block']],
    ['I04', ['i04-open-quickreply', 'i04-branch-ask', 'i04-verify-report', 'i04-resolve-continue']],
    ['I05', ['i05-open-read', 'i05-inspect-skip', 'i05-branch-city', 'i05-verify-inmessage', 'i05-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
    // No Instagram scene string becomes a review string: the review is built from the definition.
    assert.doesNotMatch(serialised, /unknownsender/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-004B - Instagram I06-I10, through the engine into the review
 * ------------------------------------------------------------------ */

test('I06-I10 records are untouched and carry the canonical identity the batch was built against', () => {
  const expected = {
    I06: ['Where Was This Exercise?', 'Easy', 'malicious', 'operational_elicitation', ['pride'], true],
    I07: ['Known Friend Shares a Reel', 'Easy', 'legitimate', 'legit_routine_broadcast', ['familiarity'], false],
    I08: ['Verification Badge Agent', 'Easy', 'malicious', 'unsolicited_payment_lure', ['pride', 'scarcity'], false],
    I09: ['Deepfake Trading Advertisement', 'Medium', 'malicious', 'investment_and_task_fraud', ['greed', 'authority'], false],
    I10: ['Brand Collaboration Shipping Fee', 'Medium', 'malicious', 'unsolicited_payment_lure', ['flattery', 'reciprocity'], false],
  }
  for (const [id, [title, difficulty, disposition, family, triggers, military]] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, title, id)
    assert.equal(record.platform, 'Instagram', id)
    assert.equal(record.difficulty, difficulty, id)
    assert.equal(record.stages.length, 6, id)
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
  }
})

test('I06-I10 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    I06: ['i06-open-read', 'i06-inspect-thread', 'i06-branch-cancel', 'i06-verify-directory', 'i06-resolve-block'],
    I07: ['i07-open-read', 'i07-inspect-thread', 'i07-branch-reply', 'i07-verify-call', 'i07-resolve-retain'],
    I08: ['i08-open-read', 'i08-inspect-profile', 'i08-branch-leave', 'i08-verify-request', 'i08-resolve-block'],
    I09: ['i09-open-read', 'i09-inspect-profile', 'i09-branch-hide', 'i09-verify-register', 'i09-resolve-block'],
    I10: ['i10-open-read', 'i10-inspect-thread', 'i10-branch-decline', 'i10-verify-site', 'i10-resolve-report'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('I06 reviews tagging the range on your own post with its own correct action', () => {
  const { score, review } = walk('I06', [
    'i06-open-read', 'i06-inspect-profile', 'i06-branch-tag-range', 'i06-verify-pio', 'i06-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not identify a base, route, schedule, capability or participant/)
})

test('I06 reviews telling the account to DM you and reporting unchecked', () => {
  const { score, outcomeClass, review } = walk('I06', [
    'i06-open-read', 'i06-inspect-profile', 'i06-branch-dm', 'i06-verify-report', 'i06-resolve-continue',
  ])
  // 0 + 2 - 3 + 1 - 4 = -4, clamped to 0.
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking', 'contradictory_resolution'])
})

test('I07 reviews reporting and blocking a friend who sent what you asked for as a false positive', () => {
  const { score, outcomeClass, review } = walk('I07', [
    'i07-open-read', 'i07-inspect-skip', 'i07-branch-mute', 'i07-verify-block', 'i07-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item', 'contradictory_resolution',
  ])
})

test('I07 reviews the reel-downloader site as an unsafe step on an ordinary item', () => {
  const { score, outcomeClass, review } = walk('I07', [
    'i07-open-read', 'i07-inspect-profile', 'i07-branch-download', 'i07-verify-thread', 'i07-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('I08 reviews submitting the badge application from the preview', () => {
  const { score, outcomeClass, review } = walk('I08', [
    'i08-open-quickreply', 'i08-branch-submit', 'i08-verify-inmessage', 'i08-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'released_details_or_paid',
    'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not submit credentials\/ID or pay the agent/)
})

test('I09 reviews installing the app even when the check afterwards is right', () => {
  const { score, review } = walk('I09', [
    'i09-open-read', 'i09-inspect-profile', 'i09-branch-install', 'i09-verify-register', 'i09-resolve-report',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not join, install, deposit or upload identity documents/)
})

test('I09 reviews joining the group and asking the advertiser for its registration', () => {
  const { score, review } = walk('I09', [
    'i09-open-read', 'i09-inspect-ad', 'i09-branch-join', 'i09-verify-inmessage', 'i09-resolve-report',
  ])
  // 0 + 2 - 3 + 0 + 2 = 1
  assert.equal(score, 1)
  assert.deepEqual(kinds(review), ['risky_engagement', 'verified_through_the_message'])
})

test('I10 reviews signing the agreement with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I10', [
    'i10-open-read', 'i10-inspect-skip', 'i10-branch-sign', 'i10-verify-report', 'i10-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'released_details_or_paid', 'acted_without_checking', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not pay, enter credentials or provide unnecessary personal data/)
})

test('no I06-I10 review carries an engine event code, a point value or a placeholder', () => {
  const walks = [
    ['I06', ['i06-open-quickreply', 'i06-branch-answer', 'i06-verify-block', 'i06-resolve-ignore']],
    ['I07', ['i07-open-quickreply', 'i07-branch-download', 'i07-verify-report', 'i07-resolve-block']],
    ['I08', ['i08-open-read', 'i08-inspect-skip', 'i08-branch-pay', 'i08-verify-report', 'i08-resolve-continue']],
    ['I09', ['i09-open-join', 'i09-branch-kyc', 'i09-verify-inmessage', 'i09-resolve-retain']],
    ['I10', ['i10-open-read', 'i10-inspect-profile', 'i10-branch-pay', 'i10-verify-block', 'i10-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
    assert.doesNotMatch(serialised, /unknownsender|sponsored829/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-004C - Instagram I11-I15, through the engine into the review
 * ------------------------------------------------------------------ */

test('I11-I15 records are untouched and carry the canonical identity the batch was built against', () => {
  const expected = {
    I11: ['Official Welfare Helpline Update', 'legitimate', 'legit_routine_broadcast', ['authority', 'empathy'], true],
    I12: ['Account Recovery Backup Code', 'malicious', 'account_takeover_authorisation_abuse', ['fear', 'authority'], false],
    I13: ['Deployed Officer Romance Profile', 'malicious', 'relationship_grooming_fraud', ['trust', 'empathy'], true],
    I14: ['Commendation Page Requests Documents', 'malicious', 'identity_data_harvesting', ['pride', 'authority'], true],
    I15: ['You Are in This Video', 'malicious', 'credential_phishing', ['curiosity', 'shame_embarrassment'], false],
  }
  for (const [id, [title, disposition, family, triggers, military]] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, title, id)
    assert.equal(record.platform, 'Instagram', id)
    assert.equal(record.difficulty, 'Medium', id)
    assert.equal(record.stages.length, 6, id)
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
    assert.equal(definition.level, 'medium', id)
  }
})

test('the I11-I15 controls keep their scoring meaning', () => {
  const expectations = [
    // I11 is the ordinary item of the batch and scores like I03, I07 and W11 rather than like
    // its four neighbours: saving is correct use, muting is a needless rejection, a public
    // comment carrying a case and a message request carrying one are the untrusted channel,
    // and reporting the welfare cell is a false positive.
    ['I11', 'i11-branch-save', 'CORRECT_USE', 3],
    ['I11', 'i11-branch-file', 'CORRECT_USE', 3],
    ['I11', 'i11-branch-mute', 'NEEDLESS_REJECT_IGNORE', -2],
    ['I11', 'i11-branch-comment', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I11', 'i11-branch-dm', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I11', 'i11-verify-directory', 'TRUSTED_VERIFY', 3],
    ['I11', 'i11-verify-app', 'TRUSTED_VERIFY', 3],
    ['I11', 'i11-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I11', 'i11-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['I11', 'i11-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['I11', 'i11-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['I11', 'i11-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['I11', 'i11-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I11', 'i11-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I11', 'i11-open-quickreply', 'PREMATURE_REPLY', -1],

    // I12: the code typed into the composer and the page that takes all three at once are both
    // releases; asking what was blocked is engagement; the learner's own security screens verify.
    ['I12', 'i12-branch-code', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I12', 'i12-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I12', 'i12-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I12', 'i12-branch-close', 'SAFE_PIVOT', 3],
    ['I12', 'i12-branch-leave', 'SAFE_PIVOT', 3],
    ['I12', 'i12-verify-security', 'TRUSTED_VERIFY', 3],
    ['I12', 'i12-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I12', 'i12-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I12', 'i12-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I13: gift cards, the wallet transfer and the learner's own identity card are all releases,
    // whatever the story calls them; the local image index verifies, asking him does not.
    ['I13', 'i13-branch-gift', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I13', 'i13-branch-wallet', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I13', 'i13-branch-id', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I13', 'i13-branch-soon', 'RISKY_OPEN_REPLY', -3],
    ['I13', 'i13-branch-close', 'SAFE_PIVOT', 3],
    ['I13', 'i13-branch-stop', 'SAFE_PIVOT', 3],
    ['I13', 'i13-verify-image', 'TRUSTED_VERIFY', 3],
    ['I13', 'i13-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I13', 'i13-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I14: sending the files and typing the same details into the chat are priced identically,
    // because the client's table prices the content and not the medium.
    ['I14', 'i14-branch-send', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I14', 'i14-branch-type', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I14', 'i14-branch-form', 'RISKY_OPEN_REPLY', -3],
    ['I14', 'i14-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I14', 'i14-branch-clear', 'SAFE_PIVOT', 3],
    ['I14', 'i14-branch-leave', 'SAFE_PIVOT', 3],
    ['I14', 'i14-verify-directory', 'TRUSTED_VERIFY', 3],
    ['I14', 'i14-verify-desk', 'TRUSTED_VERIFY', 3],
    ['I14', 'i14-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I14', 'i14-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I15: the page and the login prompt are the same release at the same price - one needs a
    // password, the other needs one tap.
    ['I15', 'i15-branch-login', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I15', 'i15-branch-approve', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I15', 'i15-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I15', 'i15-branch-close', 'SAFE_PIVOT', 3],
    ['I15', 'i15-branch-deny', 'SAFE_PIVOT', 3],
    ['I15', 'i15-verify-call', 'TRUSTED_VERIFY', 3],
    ['I15', 'i15-verify-activity', 'TRUSTED_VERIFY', 3],
    ['I15', 'i15-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I15', 'i15-open-link', 'PREMATURE_REPLY', -1],
    ['I15', 'i15-resolve-block', 'RESOLVE_CORRECT', 2],
    ['I15', 'i15-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('I11-I15 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    I11: ['i11-open-read', 'i11-inspect-profile', 'i11-branch-save', 'i11-verify-directory', 'i11-resolve-retain'],
    I12: ['i12-open-read', 'i12-inspect-profile', 'i12-branch-leave', 'i12-verify-security', 'i12-resolve-report'],
    I13: ['i13-open-read', 'i13-inspect-profile', 'i13-branch-stop', 'i13-verify-image', 'i13-resolve-report'],
    I14: ['i14-open-read', 'i14-inspect-profile', 'i14-branch-leave', 'i14-verify-directory', 'i14-resolve-report'],
    I15: ['i15-open-read', 'i15-inspect-profile', 'i15-branch-leave', 'i15-verify-call', 'i15-resolve-report'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('I11 reviews muting and reporting the welfare cell as a false positive', () => {
  const { score, outcomeClass, review } = walk('I11', [
    'i11-open-read', 'i11-inspect-skip', 'i11-branch-mute', 'i11-verify-report', 'i11-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'rejected_a_genuine_item').correct_action, /Trusted Directory/)
})

test('I11 reviews a public comment carrying a case as an unsafe step, not a missed threat', () => {
  const { score, outcomeClass, review } = walk('I11', [
    'i11-open-read', 'i11-inspect-profile', 'i11-branch-comment', 'i11-verify-app', 'i11-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('I12 reviews passing on the backup code with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I12', [
    'i12-open-read', 'i12-inspect-profile', 'i12-branch-code', 'i12-verify-inmessage', 'i12-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not send a backup code, password or recovery link/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action,
    /Security Checkup\/Password and security directly from Settings/)
})

test('I12 reviews submitting the security-check page from the preview', () => {
  const { score, review } = walk('I12', [
    'i12-open-quickreply', 'i12-branch-submit', 'i12-verify-report', 'i12-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'released_details_or_paid', 'acted_without_checking',
    'contradictory_resolution',
  ])
})

test('I13 reviews the gift cards and checking with the account itself', () => {
  const { score, outcomeClass, review } = walk('I13', [
    'i13-open-read', 'i13-inspect-skip', 'i13-branch-gift', 'i13-verify-inmessage', 'i13-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'released_details_or_paid', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not send money, gift cards, identity documents/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /verify identity independently/)
})

test('I13 counts the wallet transfer as a release even when the rest of the run is careful', () => {
  const { score, review } = walk('I13', [
    'i13-open-read', 'i13-inspect-profile', 'i13-branch-wallet', 'i13-verify-image', 'i13-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
})

test('I14 reviews sending the documents with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I14', [
    'i14-open-read', 'i14-inspect-profile', 'i14-branch-send', 'i14-verify-inmessage', 'i14-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not upload identity, posting or family documents/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action,
    /public-information\/administrative office/)
})

test('I14 reviews opening the feature form and reporting unchecked', () => {
  const { score, review } = walk('I14', [
    'i14-open-read', 'i14-inspect-profile', 'i14-branch-form', 'i14-verify-report', 'i14-resolve-report',
  ])
  // 0 + 2 - 3 + 1 + 2 = 2
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('I15 reviews approving the login prompt exactly as it reviews the page', () => {
  const approved = walk('I15', [
    'i15-open-read', 'i15-inspect-profile', 'i15-branch-approve', 'i15-verify-activity', 'i15-resolve-report',
  ])
  assert.equal(approved.score, 0)
  assert.deepEqual(kinds(approved.review), ['released_details_or_paid'])
  assert.match(cardOf(approved.review, 'released_details_or_paid').correct_action,
    /Do not enter username\/password or approve a login prompt/)

  const typed = walk('I15', [
    'i15-open-link', 'i15-branch-login', 'i15-verify-inmessage', 'i15-resolve-continue',
  ])
  assert.equal(typed.score, 0)
  assert.equal(typed.outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(typed.review), [
    'premature_action', 'no_inspection', 'released_details_or_paid',
    'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(typed.review, 'verified_through_the_message').correct_action,
    /call\/message the friend through another known route/)
})

test('no I11-I15 review carries an engine event code, a point value or a placeholder', () => {
  const walks = [
    ['I11', ['i11-open-quickreply', 'i11-branch-dm', 'i11-verify-block', 'i11-resolve-block']],
    ['I12', ['i12-open-read', 'i12-inspect-skip', 'i12-branch-ask', 'i12-verify-report', 'i12-resolve-ignore']],
    ['I13', ['i13-open-quickreply', 'i13-branch-id', 'i13-verify-directory', 'i13-resolve-retain']],
    ['I14', ['i14-open-quickreply', 'i14-branch-type', 'i14-verify-inmessage', 'i14-resolve-continue']],
    ['I15', ['i15-open-read', 'i15-inspect-skip', 'i15-branch-ask', 'i15-verify-block', 'i15-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
    assert.doesNotMatch(serialised, /unknownsender/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-004D - Instagram I16-I20, through the engine into the review
 * ------------------------------------------------------------------ */

test('I16-I20 records are untouched and carry the canonical identity the batch was built against', () => {
  const expected = {
    I16: ['Approved Photo Release Request', 'Medium', 'legitimate', 'legit_coordination_request', ['authority', 'pride'], true],
    I17: ['Morphed-Photo Blackmail', 'Medium', 'malicious', 'coercion_and_extortion', ['fear', 'shame_embarrassment', 'isolation_secrecy'], false],
    I18: ['High-Fidelity Teammate Clone', 'Hard', 'malicious', 'operational_elicitation', ['familiarity', 'urgency'], true],
    I19: ['Urgent Unit Incident Repost', 'Hard', 'malicious', 'disinformation_amplification', ['fear', 'duty_compliance'], true],
    I20: ['Researcher Asks Capability Questions', 'Hard', 'malicious', 'operational_elicitation', ['expert_status', 'flattery'], true],
  }
  for (const [id, [title, difficulty, disposition, family, triggers, military]] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, title, id)
    assert.equal(record.platform, 'Instagram', id)
    assert.equal(record.difficulty, difficulty, id)
    assert.equal(record.stages.length, 6, id)
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
    assert.equal(definition.level, difficulty.toLowerCase(), id)
  }
})

test('the I16-I20 controls keep their scoring meaning', () => {
  const expectations = [
    // I16 is the ordinary item. Either answer on the consent card is correct use; leaving the
    // request pending is a needless rejection; the over-helpful caption detail and asking for a
    // "link to sign" are the untrusted channel; reporting the page is a false positive.
    ['I16', 'i16-branch-confirm', 'CORRECT_USE', 3],
    ['I16', 'i16-branch-decline', 'CORRECT_USE', 3],
    ['I16', 'i16-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['I16', 'i16-branch-caption', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I16', 'i16-branch-ask', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I16', 'i16-verify-register', 'TRUSTED_VERIFY', 3],
    ['I16', 'i16-verify-directory', 'TRUSTED_VERIFY', 3],
    ['I16', 'i16-verify-desk', 'TRUSTED_VERIFY', 3],
    ['I16', 'i16-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I16', 'i16-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['I16', 'i16-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['I16', 'i16-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['I16', 'i16-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['I16', 'i16-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I16', 'i16-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I16', 'i16-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I16', 'i16-open-quickreply', 'PREMATURE_REPLY', -1],

    // I17: paying and sending another photo are releases; pleading is engagement; Restrict and
    // not engaging are the pivot; paying from the list is acting before reading.
    ['I17', 'i17-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I17', 'i17-branch-photo', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I17', 'i17-branch-plead', 'RISKY_OPEN_REPLY', -3],
    ['I17', 'i17-branch-restrict', 'SAFE_PIVOT', 3],
    ['I17', 'i17-branch-keep', 'SAFE_PIVOT', 3],
    ['I17', 'i17-open-pay', 'PREMATURE_REPLY', -1],
    ['I17', 'i17-verify-support', 'TRUSTED_VERIFY', 3],
    ['I17', 'i17-verify-desk', 'TRUSTED_VERIFY', 3],
    ['I17', 'i17-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I17', 'i17-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I17', 'i17-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I17', 'i17-resolve-block', 'RESOLVE_CORRECT', 2],

    // I18: the pin and the typed place are the same release; asking "is it you" in the chat is
    // engagement; the saved number and the orders app verify.
    ['I18', 'i18-branch-pin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I18', 'i18-branch-type', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I18', 'i18-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I18', 'i18-branch-close', 'SAFE_PIVOT', 3],
    ['I18', 'i18-branch-pivot', 'SAFE_PIVOT', 3],
    ['I18', 'i18-verify-call', 'TRUSTED_VERIFY', 3],
    ['I18', 'i18-verify-orders', 'TRUSTED_VERIFY', 3],
    ['I18', 'i18-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I18', 'i18-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I18', 'i18-open-quickreply', 'PREMATURE_REPLY', -1],
    ['I18', 'i18-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I19: posting as-is and commenting amplify; a location sticker or mentions release; closing
    // the composer or not sharing pivot; the bulletin and the cell verify.
    ['I19', 'i19-branch-story', 'RISKY_OPEN_REPLY', -3],
    ['I19', 'i19-branch-comment', 'RISKY_OPEN_REPLY', -3],
    ['I19', 'i19-branch-location', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I19', 'i19-branch-tag', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I19', 'i19-branch-close', 'SAFE_PIVOT', 3],
    ['I19', 'i19-branch-hold', 'SAFE_PIVOT', 3],
    ['I19', 'i19-verify-bulletin', 'TRUSTED_VERIFY', 3],
    ['I19', 'i19-verify-pio', 'TRUSTED_VERIFY', 3],
    ['I19', 'i19-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I19', 'i19-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I19', 'i19-open-quickreply', 'PREMATURE_REPLY', -1],
    ['I19', 'i19-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I20: the form, an answer and a "correction" are all releases; a general answer is still
    // engagement; the security contact and the requests register verify.
    ['I20', 'i20-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I20', 'i20-branch-answer', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I20', 'i20-branch-correct', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I20', 'i20-branch-general', 'RISKY_OPEN_REPLY', -3],
    ['I20', 'i20-branch-close', 'SAFE_PIVOT', 3],
    ['I20', 'i20-branch-decline', 'SAFE_PIVOT', 3],
    ['I20', 'i20-verify-pio', 'TRUSTED_VERIFY', 3],
    ['I20', 'i20-verify-register', 'TRUSTED_VERIFY', 3],
    ['I20', 'i20-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I20', 'i20-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I20', 'i20-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('I17-I20 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['I17', 'I18', 'I19', 'I20']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('I16-I20 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    I16: ['i16-open-read', 'i16-inspect-thread', 'i16-branch-decline', 'i16-verify-desk', 'i16-resolve-retain'],
    I17: ['i17-open-read', 'i17-inspect-profile', 'i17-branch-restrict', 'i17-verify-desk', 'i17-resolve-block'],
    I18: ['i18-open-read', 'i18-inspect-profile', 'i18-branch-close', 'i18-verify-orders', 'i18-resolve-block'],
    I19: ['i19-open-read', 'i19-inspect-thread', 'i19-branch-close', 'i19-verify-pio', 'i19-resolve-block'],
    I20: ['i20-open-read', 'i20-inspect-profile', 'i20-branch-close', 'i20-verify-register', 'i20-resolve-block'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('I16 reviews leaving the consent card and reporting the page as a false positive', () => {
  const { score, outcomeClass, review } = walk('I16', [
    'i16-open-read', 'i16-inspect-skip', 'i16-branch-ignore', 'i16-verify-report', 'i16-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'rejected_a_genuine_item').correct_action, /PF-204/)
})

test('I16 reviews volunteering caption detail as an unsafe step, not a missed threat', () => {
  const { score, outcomeClass, review } = walk('I16', [
    'i16-open-read', 'i16-inspect-profile', 'i16-branch-caption', 'i16-verify-register', 'i16-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /normal in-app path/)
})

test('I17 reviews paying and asking the account to prove it, and says what to have done', () => {
  const { score, outcomeClass, review } = walk('I17', [
    'i17-open-read', 'i17-inspect-thread', 'i17-branch-pay', 'i17-verify-inmessage', 'i17-resolve-ignore',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not pay, send more images/)
})

test('I17 reviews paying straight from the list', () => {
  const { score, review } = walk('I17', [
    'i17-open-pay', 'i17-branch-photo', 'i17-verify-support', 'i17-resolve-report',
  ])
  // -1 - 8 + 3 + 2 = -4, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['premature_action', 'no_inspection', 'released_details_or_paid'])
})

test('I18 reviews sending the pin with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I18', [
    'i18-open-read', 'i18-inspect-skip', 'i18-branch-pin', 'i18-verify-inmessage', 'i18-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'released_details_or_paid', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not send assembly point, live location, schedule or roster detail/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /previously known account\/number/)
})

test('I18 reviews asking the account whether it is him and reporting unchecked', () => {
  const { score, review } = walk('I18', [
    'i18-open-read', 'i18-inspect-profile', 'i18-branch-ask', 'i18-verify-report', 'i18-resolve-report',
  ])
  // 0 + 2 - 3 + 1 + 2 = 2
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('I19 reviews tagging personnel on the repost even when the rest of the run is careful', () => {
  const { score, review } = walk('I19', [
    'i19-open-read', 'i19-inspect-profile', 'i19-branch-tag', 'i19-verify-bulletin', 'i19-resolve-report',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not repost, speculate, tag personnel or add location/)
})

test('I19 reviews reposting from the notification and following the page', () => {
  const { score, outcomeClass, review } = walk('I19', [
    'i19-open-quickreply', 'i19-branch-story', 'i19-verify-inmessage', 'i19-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'risky_engagement', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /approved official statements/)
})

test('I20 reviews submitting the questionnaire with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I20', [
    'i20-open-read', 'i20-inspect-profile', 'i20-branch-submit', 'i20-verify-inmessage', 'i20-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not answer, correct public speculation with nonpublic facts, or upload photos/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /public-information\/security contact/)
})

test('I20 counts a "correction" of their figure as a release', () => {
  const { score, review } = walk('I20', [
    'i20-open-read', 'i20-inspect-thread', 'i20-branch-correct', 'i20-verify-pio', 'i20-resolve-report',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['released_details_or_paid'])
})

test('no I16-I20 review carries an engine event code, a point value or a placeholder', () => {
  const walks = [
    ['I16', ['i16-open-quickreply', 'i16-branch-ask', 'i16-verify-block', 'i16-resolve-ignore']],
    ['I17', ['i17-open-read', 'i17-inspect-skip', 'i17-branch-plead', 'i17-verify-report', 'i17-resolve-continue']],
    ['I18', ['i18-open-quickreply', 'i18-branch-type', 'i18-verify-block', 'i18-resolve-continue']],
    ['I19', ['i19-open-read', 'i19-inspect-skip', 'i19-branch-location', 'i19-verify-report', 'i19-resolve-ignore']],
    ['I20', ['i20-open-quickreply', 'i20-branch-general', 'i20-verify-block', 'i20-resolve-retain']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
    assert.doesNotMatch(serialised, /unknownsender/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-004E - Instagram I21-I25, through the engine into the review
 * ------------------------------------------------------------------ */

test('I21-I25 records are untouched and carry the canonical identity the batch was built against', () => {
  const expected = {
    I21: ['Post-Event Teammate Tag', 'Hard', 'legitimate', 'legit_coordination_request', ['familiarity', 'pride'], true],
    I22: ['Live Support Video Call', 'Hard', 'malicious', 'tech_support_and_callback_fraud', ['authority', 'fear'], false],
    I23: ['Compromised Charity Influencer', 'Hard', 'malicious', 'unsolicited_payment_lure', ['empathy', 'social_proof'], false],
    I24: ['Institutional Trading App', 'Hard', 'malicious', 'investment_and_task_fraud', ['authority', 'greed'], false],
    I25: ['Canteen Coupon Reel QR', 'Hard', 'malicious', 'qr_code_phishing', ['familiarity', 'scarcity'], true],
  }
  for (const [id, [title, difficulty, disposition, family, triggers, military]] of Object.entries(expected)) {
    const record = scenarios.find((item) => item.scenario_id === id)
    assert.equal(record.title, title, id)
    assert.equal(record.platform, 'Instagram', id)
    assert.equal(record.difficulty, difficulty, id)
    assert.equal(record.stages.length, 6, id)
    const definition = definitions[id]
    assert.equal(definition.disposition, disposition, id)
    assert.equal(definition.canonical_family, family, id)
    assert.deepEqual(definition.canonical_triggers, triggers, id)
    assert.equal(definition.military_flag, military, id)
    assert.equal(definition.level, difficulty.toLowerCase(), id)
  }
})

test('the I21-I25 controls keep their scoring meaning', () => {
  const expectations = [
    // I21 is the ordinary item. Approve and Decline on the post's review sheet are both correct
    // use; leaving the request is a needless rejection; the next fixture "for the caption" and a
    // stranger's album link are the untrusted channel; reporting the teammate is a false positive.
    ['I21', 'i21-branch-approve', 'CORRECT_USE', 3],
    ['I21', 'i21-branch-decline', 'CORRECT_USE', 3],
    ['I21', 'i21-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['I21', 'i21-branch-caption', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I21', 'i21-branch-album', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['I21', 'i21-verify-register', 'TRUSTED_VERIFY', 3],
    ['I21', 'i21-verify-call', 'TRUSTED_VERIFY', 3],
    ['I21', 'i21-verify-directory', 'TRUSTED_VERIFY', 3],
    ['I21', 'i21-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I21', 'i21-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['I21', 'i21-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['I21', 'i21-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['I21', 'i21-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['I21', 'i21-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I21', 'i21-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I21', 'i21-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I21', 'i21-open-quickreply', 'PREMATURE_REPLY', -1],

    // I22: the camera, the screen share and the spoken code are releases; staying on to ask for a
    // case number is engagement; hanging up, keeping the camera off, not sharing and declining are
    // the pivot; joining from the list is acting before reading.
    ['I22', 'i22-branch-camera', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I22', 'i22-branch-share', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I22', 'i22-branch-code', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I22', 'i22-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['I22', 'i22-branch-hangup', 'SAFE_PIVOT', 3],
    ['I22', 'i22-branch-nocamera', 'SAFE_PIVOT', 3],
    ['I22', 'i22-branch-noshare', 'SAFE_PIVOT', 3],
    ['I22', 'i22-branch-decline', 'SAFE_PIVOT', 3],
    ['I22', 'i22-open-join', 'PREMATURE_REPLY', -1],
    ['I22', 'i22-verify-status', 'TRUSTED_VERIFY', 3],
    ['I22', 'i22-verify-desk', 'TRUSTED_VERIFY', 3],
    ['I22', 'i22-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I22', 'i22-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I22', 'i22-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['I22', 'i22-resolve-block', 'RESOLVE_CORRECT', 2],

    // I23: sending is the release; sharing to story amplifies; holding off is the pivot; the
    // trust's own site and helpline verify.
    ['I23', 'i23-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I23', 'i23-branch-share', 'RISKY_OPEN_REPLY', -3],
    ['I23', 'i23-branch-hold', 'SAFE_PIVOT', 3],
    ['I23', 'i23-open-pay', 'PREMATURE_REPLY', -1],
    ['I23', 'i23-verify-site', 'TRUSTED_VERIFY', 3],
    ['I23', 'i23-verify-call', 'TRUSTED_VERIFY', 3],
    ['I23', 'i23-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I23', 'i23-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I23', 'i23-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I24: installing, KYC and the tax are releases; an "Interested" comment is engagement; Not now
    // and Hide ad pivot; the phone's own store and the learner's broker verify.
    ['I24', 'i24-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I24', 'i24-branch-kyc', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I24', 'i24-branch-tax', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I24', 'i24-branch-comment', 'RISKY_OPEN_REPLY', -3],
    ['I24', 'i24-branch-notnow', 'SAFE_PIVOT', 3],
    ['I24', 'i24-branch-hide', 'SAFE_PIVOT', 3],
    ['I24', 'i24-open-install', 'PREMATURE_REPLY', -1],
    ['I24', 'i24-verify-store', 'TRUSTED_VERIFY', 3],
    ['I24', 'i24-verify-broker', 'TRUSTED_VERIFY', 3],
    ['I24', 'i24-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I24', 'i24-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I24', 'i24-resolve-retain', 'CONTRADICTORY_UNSAFE_FINAL', -4],

    // I25: opening the code is a risky open; the form and the fee are releases; sharing the reel is
    // engagement; closing the scanner pivots; reading the code without opening it is inspection.
    ['I25', 'i25-inspect-qr', 'INSPECT_CONTEXT', 2],
    ['I25', 'i25-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['I25', 'i25-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I25', 'i25-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['I25', 'i25-branch-share', 'RISKY_OPEN_REPLY', -3],
    ['I25', 'i25-branch-close', 'SAFE_PIVOT', 3],
    ['I25', 'i25-open-link', 'PREMATURE_REPLY', -1],
    ['I25', 'i25-verify-notices', 'TRUSTED_VERIFY', 3],
    ['I25', 'i25-verify-call', 'TRUSTED_VERIFY', 3],
    ['I25', 'i25-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['I25', 'i25-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['I25', 'i25-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('I22-I25 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['I22', 'I23', 'I24', 'I25']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('I21-I25 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    I21: ['i21-open-read', 'i21-inspect-thread', 'i21-branch-decline', 'i21-verify-call', 'i21-resolve-retain'],
    I22: ['i22-open-read', 'i22-inspect-profile', 'i22-branch-noshare', 'i22-verify-desk', 'i22-resolve-block'],
    I23: ['i23-open-read', 'i23-inspect-thread', 'i23-branch-hold', 'i23-verify-call', 'i23-resolve-block'],
    I24: ['i24-open-read', 'i24-inspect-thread', 'i24-branch-hide', 'i24-verify-broker', 'i24-resolve-block'],
    I25: ['i25-open-read', 'i25-inspect-profile', 'i25-branch-close', 'i25-verify-call', 'i25-resolve-block'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('I21 reviews leaving the tag and blocking the teammate as a false positive', () => {
  const { score, outcomeClass, review } = walk('I21', [
    'i21-open-read', 'i21-inspect-skip', 'i21-branch-ignore', 'i21-verify-block', 'i21-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.equal(review.learning_issue?.key, 'false_positive')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'abandoned_without_checking', 'rejected_a_genuine_item',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'rejected_a_genuine_item').correct_action, /PF-311/)
})

test('I21 reviews the stranger’s album link as an unsafe step on a genuine item', () => {
  const { score, outcomeClass, review } = walk('I21', [
    'i21-open-read', 'i21-inspect-profile', 'i21-branch-album', 'i21-verify-register', 'i21-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.deepEqual(kinds(review), ['unsafe_external_action'])
  assert.match(cardOf(review, 'unsafe_external_action').correct_action, /untrusted channel/)
})

test('I21 reviews replying from the preview and the caption detail', () => {
  const { score, review } = walk('I21', [
    'i21-open-quickreply', 'i21-branch-caption', 'i21-verify-inmessage', 'i21-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), [
    'premature_action', 'no_inspection', 'unsafe_external_action', 'verified_through_the_message',
  ])
})

test('I22 reviews reading the backup code aloud with its own correct action', () => {
  const { score, outcomeClass, review } = walk('I22', [
    'i22-open-read', 'i22-inspect-profile', 'i22-branch-code', 'i22-verify-inmessage', 'i22-resolve-continue',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'released_details_or_paid', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action,
    /Do not accept continued coercion, show ID, share screen or speak a code/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action,
    /open Security\/Support directly in app settings/)
})

test('I22 reviews joining from the list and showing the camera', () => {
  const { score, review } = walk('I22', [
    'i22-open-join', 'i22-branch-camera', 'i22-verify-status', 'i22-resolve-report',
  ])
  // -1 - 8 + 3 + 2 = -4, clamped to 0.
  assert.equal(score, 0)
  assert.deepEqual(kinds(review), ['premature_action', 'no_inspection', 'released_details_or_paid'])
})

test('I22 reviews staying on the call and reporting unchecked', () => {
  const { score, review } = walk('I22', [
    'i22-open-read', 'i22-inspect-thread', 'i22-branch-ask', 'i22-verify-report', 'i22-resolve-block',
  ])
  // 0 + 2 - 3 + 1 + 2 = 2
  assert.equal(score, 2)
  assert.deepEqual(kinds(review), ['risky_engagement', 'acted_without_checking'])
})

test('I23 reviews paying the wallet with the beneficiary check as the correct route', () => {
  const { score, outcomeClass, review } = walk('I23', [
    'i23-open-read', 'i23-inspect-skip', 'i23-branch-pay', 'i23-verify-inmessage', 'i23-resolve-retain',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(review), [
    'skipped_inspection', 'released_details_or_paid', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(review, 'released_details_or_paid').correct_action, /Do not send funds or amplify/)
  assert.match(cardOf(review, 'verified_through_the_message').correct_action, /compare beneficiary details/)
})

test('I23 reviews sharing to story as amplification even when the rest is careful', () => {
  const { score, review } = walk('I23', [
    'i23-open-read', 'i23-inspect-profile', 'i23-branch-share', 'i23-verify-site', 'i23-resolve-report',
  ])
  // 0 + 2 - 3 + 3 + 2 = 4
  assert.equal(score, 4)
  assert.deepEqual(kinds(review), ['risky_engagement'])
})

test('I24 reviews installing the app and paying the withdrawal tax', () => {
  const installed = walk('I24', [
    'i24-open-read', 'i24-inspect-profile', 'i24-branch-install', 'i24-verify-broker', 'i24-resolve-report',
  ])
  assert.equal(installed.score, 0)
  assert.deepEqual(kinds(installed.review), ['released_details_or_paid'])
  assert.match(cardOf(installed.review, 'released_details_or_paid').correct_action,
    /Do not install, upload KYC, deposit or pay withdrawal tax/)

  const taxed = walk('I24', [
    'i24-open-install', 'i24-branch-tax', 'i24-verify-inmessage', 'i24-resolve-continue',
  ])
  assert.equal(taxed.outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(taxed.review), [
    'premature_action', 'no_inspection', 'released_details_or_paid', 'verified_through_the_message',
    'contradictory_resolution',
  ])
  assert.match(cardOf(taxed.review, 'verified_through_the_message').correct_action, /approved store\/broker/)
})

test('I25 reviews confirming eligibility and opening the code', () => {
  const form = walk('I25', [
    'i25-open-read', 'i25-inspect-qr', 'i25-branch-submit', 'i25-verify-call', 'i25-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(form.score, 0)
  assert.deepEqual(kinds(form.review), ['released_details_or_paid'])
  assert.match(cardOf(form.review, 'released_details_or_paid').correct_action,
    /enter service number\/family details or pay an activation fee/)

  const opened = walk('I25', [
    'i25-open-read', 'i25-inspect-profile', 'i25-branch-open', 'i25-verify-inmessage', 'i25-resolve-ignore',
  ])
  assert.equal(opened.score, 0)
  assert.equal(opened.outcomeClass, 'missed_threat')
  assert.deepEqual(kinds(opened.review), [
    'risky_engagement', 'verified_through_the_message', 'contradictory_resolution',
  ])
  assert.match(cardOf(opened.review, 'verified_through_the_message').correct_action, /canteen\/welfare notice route/)
})

test('no I21-I25 review carries an engine event code, a point value or a placeholder', () => {
  const walks = [
    ['I21', ['i21-open-quickreply', 'i21-branch-album', 'i21-verify-report', 'i21-resolve-ignore']],
    ['I22', ['i22-open-read', 'i22-inspect-skip', 'i22-branch-share', 'i22-verify-block', 'i22-resolve-retain']],
    ['I23', ['i23-open-pay', 'i23-branch-share', 'i23-verify-inmessage', 'i23-resolve-continue']],
    ['I24', ['i24-open-read', 'i24-inspect-skip', 'i24-branch-kyc', 'i24-verify-report', 'i24-resolve-ignore']],
    ['I25', ['i25-open-link', 'i25-branch-pay', 'i25-verify-block', 'i25-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
    assert.doesNotMatch(serialised, /unknownsender|sponsored126/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-005 - Email E01-E05
 * ------------------------------------------------------------------ */

test('E01-E05 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // Malicious branches: opening/replying is -3, releasing a secret/payment is -8, the pivot is +3.
    ['E01', 'e01-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E01', 'e01-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E01', 'e01-branch-close', 'SAFE_PIVOT', 3],
    ['E01', 'e01-open-quickreply', 'PREMATURE_REPLY', -1],
    ['E01', 'e01-verify-portal', 'TRUSTED_VERIFY', 3],
    ['E01', 'e01-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E01', 'e01-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['E01', 'e01-resolve-report', 'RESOLVE_CORRECT', 2],
    ['E01', 'e01-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['E02', 'e02-branch-enable', 'RISKY_OPEN_REPLY', -3],
    ['E02', 'e02-branch-save', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E02', 'e02-branch-delete', 'SAFE_PIVOT', 3],
    ['E02', 'e02-verify-call', 'TRUSTED_VERIFY', 3],
    // Legitimate newsletter: the same shapes mean the opposite things.
    ['E03', 'e03-branch-archive', 'CORRECT_USE', 3],
    ['E03', 'e03-branch-delete', 'NEEDLESS_REJECT_IGNORE', -2],
    ['E03', 'e03-branch-forward', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E03', 'e03-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['E03', 'e03-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['E03', 'e03-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['E04', 'e04-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E04', 'e04-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E04', 'e04-branch-close', 'SAFE_PIVOT', 3],
    ['E05', 'e05-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E05', 'e05-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E05', 'e05-branch-close', 'SAFE_PIVOT', 3],
    ['E05', 'e05-verify-hr', 'TRUSTED_VERIFY', 3],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('E01, E02, E04 and E05 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['E01', 'E02', 'E04', 'E05']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('E01-E05 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    E01: ['e01-open-read', 'e01-inspect-sender', 'e01-branch-close', 'e01-verify-portal', 'e01-resolve-report'],
    E02: ['e02-open-read', 'e02-inspect-sender', 'e02-branch-delete', 'e02-verify-vendor', 'e02-resolve-report'],
    E03: ['e03-open-read', 'e03-inspect-sender', 'e03-branch-archive', 'e03-verify-archive', 'e03-resolve-continue'],
    E04: ['e04-open-read', 'e04-inspect-sender', 'e04-branch-close', 'e04-verify-courier', 'e04-resolve-report'],
    E05: ['e05-open-read', 'e05-inspect-sender', 'e05-branch-close', 'e05-verify-hr', 'e05-resolve-report'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('E01 reviews entering credentials on the sign-in page', () => {
  const { score, review } = walk('E01', [
    'e01-open-read', 'e01-inspect-sender', 'e01-branch-submit', 'e01-verify-portal', 'e01-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E02 reviews enabling content on the macro file', () => {
  const { score, review } = walk('E02', [
    'e02-open-read', 'e02-inspect-file', 'e02-branch-enable', 'e02-verify-vendor', 'e02-resolve-report',
  ])
  // 0 + 2 - 3 + 3 + 2 = 4
  assert.equal(score, 4)
  assert.ok(kinds(review).includes('risky_engagement'), kinds(review).join(','))
})

test('E03 reviews reporting the genuine newsletter as a false positive', () => {
  const { score, outcomeClass, review } = walk('E03', [
    'e03-open-read', 'e03-inspect-thread', 'e03-branch-delete', 'e03-verify-report', 'e03-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.ok(kinds(review).includes('rejected_a_genuine_item'), kinds(review).join(','))
})

test('E04 reviews paying the clearance fee', () => {
  const { score, review } = walk('E04', [
    'e04-open-read', 'e04-inspect-sender', 'e04-branch-pay', 'e04-verify-courier', 'e04-resolve-report',
  ])
  // 0 + 2 - 8 + 3 + 2 = -1, clamped to 0.
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E05 reviews acknowledging on the cloned HR portal', () => {
  const { score, review } = walk('E05', [
    'e05-open-read', 'e05-inspect-sender', 'e05-branch-submit', 'e05-verify-hr', 'e05-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('no E01-E05 review carries an engine event code or a point value', () => {
  const walks = [
    ['E01', ['e01-open-quickreply', 'e01-branch-open', 'e01-verify-report', 'e01-resolve-ignore']],
    ['E02', ['e02-open-read', 'e02-inspect-thread', 'e02-branch-save', 'e02-verify-block', 'e02-resolve-continue']],
    ['E03', ['e03-open-quickreply', 'e03-branch-forward', 'e03-verify-inmessage', 'e03-resolve-report']],
    ['E04', ['e04-open-quickreply', 'e04-branch-pay', 'e04-verify-block', 'e04-resolve-continue']],
    ['E05', ['e05-open-read', 'e05-inspect-skip', 'e05-branch-reply', 'e05-verify-report', 'e05-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-006 - Email E06-E10
 * ------------------------------------------------------------------ */

test('E06-E10 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // E06 roster reply: attach is -8, a bare reply is -3, discarding is the pivot.
    ['E06', 'e06-branch-attach', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E06', 'e06-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E06', 'e06-branch-discard', 'SAFE_PIVOT', 3],
    ['E06', 'e06-open-quickreply', 'PREMATURE_REPLY', -1],
    ['E06', 'e06-verify-records', 'TRUSTED_VERIFY', 3],
    ['E06', 'e06-verify-call', 'TRUSTED_VERIFY', 3],
    ['E06', 'e06-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E06', 'e06-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    // E07 legitimate invite: accept is CORRECT_USE, ignore is needless, an external link is -4.
    ['E07', 'e07-branch-accept', 'CORRECT_USE', 3],
    ['E07', 'e07-branch-tentative', 'CORRECT_USE', 3],
    ['E07', 'e07-branch-decline', 'CORRECT_USE', 3],
    ['E07', 'e07-branch-ignore', 'NEEDLESS_REJECT_IGNORE', -2],
    ['E07', 'e07-branch-external', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E07', 'e07-verify-schedule', 'TRUSTED_VERIFY', 3],
    ['E07', 'e07-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['E07', 'e07-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['E07', 'e07-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E08 refund form.
    ['E08', 'e08-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E08', 'e08-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E08', 'e08-branch-close', 'SAFE_PIVOT', 3],
    ['E08', 'e08-verify-portal', 'TRUSTED_VERIFY', 3],
    // E09 gift-card BEC.
    ['E09', 'e09-branch-codes', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E09', 'e09-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E09', 'e09-branch-refuse', 'SAFE_PIVOT', 3],
    ['E09', 'e09-verify-call', 'TRUSTED_VERIFY', 3],
    ['E09', 'e09-verify-procure', 'TRUSTED_VERIFY', 3],
    // E10 vendor diversion: both a beneficiary change and a payment approval are -8.
    ['E10', 'e10-branch-save', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E10', 'e10-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E10', 'e10-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E10', 'e10-branch-hold', 'SAFE_PIVOT', 3],
    ['E10', 'e10-verify-call', 'TRUSTED_VERIFY', 3],
    ['E10', 'e10-verify-changecontrol', 'TRUSTED_VERIFY', 3],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('E06, E08, E09 and E10 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['E06', 'E08', 'E09', 'E10']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('E06-E10 safe walks score ten, in six stages, and produce the positive card', () => {
  const SAFE_WALKS = {
    E06: ['e06-open-read', 'e06-inspect-sender', 'e06-branch-discard', 'e06-verify-records', 'e06-resolve-report'],
    E07: ['e07-open-read', 'e07-inspect-sender', 'e07-branch-accept', 'e07-verify-schedule', 'e07-resolve-continue'],
    E08: ['e08-open-read', 'e08-inspect-sender', 'e08-branch-close', 'e08-verify-portal', 'e08-resolve-report'],
    E09: ['e09-open-read', 'e09-inspect-sender', 'e09-branch-refuse', 'e09-verify-procure', 'e09-resolve-report'],
    E10: ['e10-open-read', 'e10-inspect-sender', 'e10-branch-hold', 'e10-verify-changecontrol', 'e10-resolve-report'],
  }
  for (const [id, controls] of Object.entries(SAFE_WALKS)) {
    const { score, outcomeClass, review, events } = walk(id, controls)
    assert.equal(score, 10, `${id} safe walk`)
    assert.equal(outcomeClass, 'handled_safely', `${id} safe walk`)
    assert.equal(review.status, 'correct', `${id} safe walk`)
    assert.deepEqual(review.mistakes, [], `${id} safe walk`)
    assert.deepEqual(events.map((e) => e.stage),
      ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], `${id} stage order`)
  }
})

test('E06 reviews attaching the roster as a data release', () => {
  const { score, review } = walk('E06', [
    'e06-open-read', 'e06-inspect-sender', 'e06-branch-attach', 'e06-verify-records', 'e06-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E07 reviews reporting the genuine invite as a false positive', () => {
  const { score, outcomeClass, review } = walk('E07', [
    'e07-open-read', 'e07-inspect-sender', 'e07-branch-ignore', 'e07-verify-report', 'e07-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.ok(kinds(review).includes('rejected_a_genuine_item'), kinds(review).join(','))
})

test('E07 reviews the external calendar link as an unsafe step on a genuine item', () => {
  const { score, outcomeClass, review } = walk('E07', [
    'e07-open-read', 'e07-inspect-sender', 'e07-branch-external', 'e07-verify-schedule', 'e07-resolve-continue',
  ])
  // 0 + 2 - 4 + 3 + 2 = 3
  assert.equal(score, 3)
  assert.equal(outcomeClass, 'unsafe_handling')
  assert.ok(kinds(review).includes('unsafe_external_action'), kinds(review).join(','))
})

test('E08 reviews submitting identity and card on the refund form', () => {
  const { score, review } = walk('E08', [
    'e08-open-read', 'e08-inspect-sender', 'e08-branch-submit', 'e08-verify-portal', 'e08-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E09 reviews sending the gift-card codes', () => {
  const { score, review } = walk('E09', [
    'e09-open-read', 'e09-inspect-sender', 'e09-branch-codes', 'e09-verify-procure', 'e09-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E10 reviews approving payment to the new account', () => {
  const { score, review } = walk('E10', [
    'e10-open-read', 'e10-inspect-sender', 'e10-branch-pay', 'e10-verify-call', 'e10-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('no E06-E10 review carries an engine event code or a point value', () => {
  const walks = [
    ['E06', ['e06-open-quickreply', 'e06-branch-reply', 'e06-verify-report', 'e06-resolve-ignore']],
    ['E07', ['e07-open-read', 'e07-inspect-thread', 'e07-branch-external', 'e07-verify-block', 'e07-resolve-report']],
    ['E08', ['e08-open-read', 'e08-inspect-skip', 'e08-branch-open', 'e08-verify-block', 'e08-resolve-continue']],
    ['E09', ['e09-open-read', 'e09-inspect-skip', 'e09-branch-codes', 'e09-verify-block', 'e09-resolve-continue']],
    ['E10', ['e10-open-read', 'e10-inspect-thread', 'e10-branch-save', 'e10-verify-block', 'e10-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-007 - Email E11-E15
 * ------------------------------------------------------------------ */

test('E11-E15 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // E11 legitimate leave update: opening the known portal is CORRECT_USE, a web-search login
    // is the unsafe external action, deleting a real update is needless, reporting it is a false
    // positive.
    ['E11', 'e11-branch-portal', 'CORRECT_USE', 3],
    ['E11', 'e11-branch-search', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E11', 'e11-branch-delete', 'NEEDLESS_REJECT_IGNORE', -2],
    ['E11', 'e11-verify-leave', 'TRUSTED_VERIFY', 3],
    ['E11', 'e11-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['E11', 'e11-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['E11', 'e11-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E12 document-share credential + MFA phishing: signing in or approving the push are both -8.
    ['E12', 'e12-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E12', 'e12-branch-signin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E12', 'e12-branch-approve', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E12', 'e12-branch-close', 'SAFE_PIVOT', 3],
    ['E12', 'e12-verify-portal', 'TRUSTED_VERIFY', 3],
    // E13 archive malware: extracting is -3, running the executable is -8.
    ['E13', 'e13-branch-extract', 'RISKY_OPEN_REPLY', -3],
    ['E13', 'e13-branch-run', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E13', 'e13-branch-close', 'SAFE_PIVOT', 3],
    ['E13', 'e13-verify-records', 'TRUSTED_VERIFY', 3],
    // E14 QR spearphish: scanning the QR is -3, entering credentials is -8.
    ['E14', 'e14-branch-scan', 'RISKY_OPEN_REPLY', -3],
    ['E14', 'e14-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E14', 'e14-branch-leave', 'SAFE_PIVOT', 3],
    ['E14', 'e14-verify-orders', 'TRUSTED_VERIFY', 3],
    // E15 consent phishing: opening the consent screen is -3, granting access is -8.
    ['E15', 'e15-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E15', 'e15-branch-grant', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E15', 'e15-branch-deny', 'SAFE_PIVOT', 3],
    ['E15', 'e15-verify-catalogue', 'TRUSTED_VERIFY', 3],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('E12, E13, E14 and E15 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['E12', 'E13', 'E14', 'E15']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('E12 reviews signing in on the cloned document-share page', () => {
  const { score, review } = walk('E12', [
    'e12-open-read', 'e12-inspect-sender', 'e12-branch-signin', 'e12-verify-portal', 'e12-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E12 reviews approving the sign-in push as a data release', () => {
  const { score, review } = walk('E12', [
    'e12-open-read', 'e12-inspect-sender', 'e12-branch-approve', 'e12-verify-call', 'e12-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E13 reviews running the executable inside the archive', () => {
  const { score, review } = walk('E13', [
    'e13-open-read', 'e13-inspect-sender', 'e13-branch-run', 'e13-verify-records', 'e13-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E14 reviews entering service credentials on the decrypt portal', () => {
  const { score, review } = walk('E14', [
    'e14-open-read', 'e14-inspect-sender', 'e14-branch-submit', 'e14-verify-orders', 'e14-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('E11 reviews reporting the genuine leave update as a false positive', () => {
  const { score, outcomeClass, review } = walk('E11', [
    'e11-open-read', 'e11-inspect-sender', 'e11-branch-delete', 'e11-verify-report', 'e11-resolve-report',
  ])
  assert.equal(score, 0)
  assert.equal(outcomeClass, 'false_positive')
  assert.ok(kinds(review).includes('rejected_a_genuine_item'), kinds(review).join(','))
})

test('E15 reviews granting the OAuth consent', () => {
  const { score, review } = walk('E15', [
    'e15-open-read', 'e15-inspect-sender', 'e15-branch-grant', 'e15-verify-catalogue', 'e15-resolve-report',
  ])
  assert.equal(score, 0)
  assert.ok(kinds(review).includes('released_details_or_paid'), kinds(review).join(','))
})

test('no E11-E15 review carries an engine event code or a point value', () => {
  const walks = [
    ['E11', ['e11-open-read', 'e11-inspect-skip', 'e11-branch-search', 'e11-verify-block', 'e11-resolve-report']],
    ['E12', ['e12-open-read', 'e12-inspect-thread', 'e12-branch-signin', 'e12-verify-block', 'e12-resolve-continue']],
    ['E13', ['e13-open-read', 'e13-inspect-thread', 'e13-branch-run', 'e13-verify-block', 'e13-resolve-continue']],
    ['E14', ['e14-open-read', 'e14-inspect-thread', 'e14-branch-submit', 'e14-verify-block', 'e14-resolve-continue']],
    ['E15', ['e15-open-read', 'e15-inspect-skip', 'e15-branch-grant', 'e15-verify-block', 'e15-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-008 - Email E16-E20
 * ------------------------------------------------------------------ */

test('E16-E20 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // E16 legitimate signed maintenance notice: the calendar reminder and archiving are the normal
    // path (CORRECT_USE), Junk is needless, forwarding work mail home is the unsafe external action,
    // and reporting or blocking a real notice is a false positive.
    ['E16', 'e16-branch-reminder', 'CORRECT_USE', 3],
    ['E16', 'e16-branch-archive', 'CORRECT_USE', 3],
    ['E16', 'e16-branch-junk', 'NEEDLESS_REJECT_IGNORE', -2],
    ['E16', 'e16-branch-forward', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E16', 'e16-verify-board', 'TRUSTED_VERIFY', 3],
    ['E16', 'e16-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['E16', 'e16-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['E16', 'e16-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['E16', 'e16-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['E16', 'e16-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E17 callback phishing: calling the number or replying is -3; cancelling the dialog is safe.
    ['E17', 'e17-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['E17', 'e17-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E17', 'e17-branch-cancel', 'SAFE_PIVOT', 3],
    ['E17', 'e17-branch-close', 'SAFE_PIVOT', 3],
    ['E17', 'e17-verify-statement', 'TRUSTED_VERIFY', 3],
    ['E17', 'e17-verify-bank', 'TRUSTED_VERIFY', 3],
    ['E17', 'e17-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E17', 'e17-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['E17', 'e17-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E18 thread hijack: changing the beneficiary or releasing the settlement is -8; replying or
    // pushing it to the second approver is -3; holding is safe.
    ['E18', 'e18-branch-beneficiary', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E18', 'e18-branch-release', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E18', 'e18-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E18', 'e18-branch-forward', 'RISKY_OPEN_REPLY', -3],
    ['E18', 'e18-branch-hold', 'SAFE_PIVOT', 3],
    ['E18', 'e18-verify-call', 'TRUSTED_VERIFY', 3],
    ['E18', 'e18-verify-dualcontrol', 'TRUSTED_VERIFY', 3],
    ['E18', 'e18-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    // E19 research-pretext questionnaire: answering is -8; agreeing to a call or forwarding it
    // round the section is -3; closing it or leaving it unanswered is safe.
    ['E19', 'e19-branch-answer', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E19', 'e19-branch-interview', 'RISKY_OPEN_REPLY', -3],
    ['E19', 'e19-branch-forward', 'RISKY_OPEN_REPLY', -3],
    ['E19', 'e19-branch-closedoc', 'SAFE_PIVOT', 3],
    ['E19', 'e19-branch-leave', 'SAFE_PIVOT', 3],
    ['E19', 'e19-verify-pio', 'TRUSTED_VERIFY', 3],
    ['E19', 'e19-verify-register', 'TRUSTED_VERIFY', 3],
    // E20 legal-notice demand: uploading documents or paying the bond is -8; opening the portal or
    // replying is -3; closing the notice is safe; checking on the notice's own portal is worth 0.
    ['E20', 'e20-branch-upload', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E20', 'e20-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E20', 'e20-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E20', 'e20-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E20', 'e20-branch-close', 'SAFE_PIVOT', 3],
    ['E20', 'e20-verify-lookup', 'TRUSTED_VERIFY', 3],
    ['E20', 'e20-verify-legal', 'TRUSTED_VERIFY', 3],
    ['E20', 'e20-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E20', 'e20-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('E17, E18, E19 and E20 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['E17', 'E18', 'E19', 'E20']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('E16-E20 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    ['E16', ['e16-open-read', 'e16-inspect-sender', 'e16-branch-forward', 'e16-verify-board', 'e16-resolve-continue'], 3, 'unsafe_external_action'],
    ['E16', ['e16-open-read', 'e16-inspect-sender', 'e16-branch-junk', 'e16-verify-report', 'e16-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['E17', ['e17-open-read', 'e17-inspect-sender', 'e17-branch-call', 'e17-verify-statement', 'e17-resolve-report'], 4, 'risky_engagement'],
    ['E17', ['e17-open-read', 'e17-inspect-search', 'e17-branch-reply', 'e17-verify-bank', 'e17-resolve-report'], 4, 'risky_engagement'],
    ['E18', ['e18-open-read', 'e18-inspect-sender', 'e18-branch-release', 'e18-verify-call', 'e18-resolve-report'], 0, 'released_details_or_paid'],
    ['E18', ['e18-open-read', 'e18-inspect-sender', 'e18-branch-beneficiary', 'e18-verify-call', 'e18-resolve-report'], 0, 'released_details_or_paid'],
    ['E18', ['e18-open-read', 'e18-inspect-thread', 'e18-branch-forward', 'e18-verify-dualcontrol', 'e18-resolve-report'], 4, 'risky_engagement'],
    ['E19', ['e19-open-read', 'e19-inspect-file', 'e19-branch-answer', 'e19-verify-pio', 'e19-resolve-report'], 0, 'released_details_or_paid'],
    ['E19', ['e19-open-read', 'e19-inspect-sender', 'e19-branch-forward', 'e19-verify-register', 'e19-resolve-report'], 4, 'risky_engagement'],
    ['E20', ['e20-open-read', 'e20-inspect-file', 'e20-branch-pay', 'e20-verify-lookup', 'e20-resolve-report'], 0, 'released_details_or_paid'],
    ['E20', ['e20-open-read', 'e20-inspect-sender', 'e20-branch-upload', 'e20-verify-legal', 'e20-resolve-report'], 0, 'released_details_or_paid'],
    ['E20', ['e20-open-read', 'e20-inspect-sender', 'e20-branch-open', 'e20-verify-lookup', 'e20-resolve-report'], 4, 'risky_engagement'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('E16 reviews reporting the signed notice as a false positive', () => {
  const { outcomeClass } = walk('E16', [
    'e16-open-read', 'e16-inspect-sender', 'e16-branch-junk', 'e16-verify-report', 'e16-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no E16-E20 review carries an engine event code or a point value', () => {
  const walks = [
    ['E16', ['e16-open-read', 'e16-inspect-thread', 'e16-branch-forward', 'e16-verify-block', 'e16-resolve-block']],
    ['E17', ['e17-open-read', 'e17-inspect-skip', 'e17-branch-call', 'e17-verify-inmessage', 'e17-resolve-continue']],
    ['E18', ['e18-open-read', 'e18-inspect-skip', 'e18-branch-release', 'e18-verify-inmessage', 'e18-resolve-continue']],
    ['E19', ['e19-open-read', 'e19-inspect-thread', 'e19-branch-answer', 'e19-verify-inmessage', 'e19-resolve-continue']],
    ['E20', ['e20-open-read', 'e20-inspect-thread', 'e20-branch-pay', 'e20-verify-inmessage', 'e20-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-009 - Email E21-E25, the final Email batch
 * ------------------------------------------------------------------ */

test('E21-E25 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // E21 legitimate verified change: recording the second approval is the normal path
    // (CORRECT_USE); rejecting a case that passed every control is needless; short-circuiting
    // dual control by releasing the payment is the unsafe external action; asking the vendor
    // for the account by email is the same; reporting or blocking the portal is a false positive.
    ['E21', 'e21-branch-approve', 'CORRECT_USE', 3],
    ['E21', 'e21-branch-reject', 'NEEDLESS_REJECT_IGNORE', -2],
    ['E21', 'e21-branch-release', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E21', 'e21-branch-reply', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['E21', 'e21-verify-vendor', 'TRUSTED_VERIFY', 3],
    ['E21', 'e21-verify-queue', 'TRUSTED_VERIFY', 3],
    ['E21', 'e21-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E21', 'e21-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['E21', 'e21-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['E21', 'e21-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['E21', 'e21-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['E21', 'e21-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E22 recorded instruction: confirming the transfer is -8; replying that it is done is -3;
    // cancelling the sheet or waiting for the briefing to end is safe.
    ['E22', 'e22-branch-confirm', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E22', 'e22-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E22', 'e22-branch-cancel', 'SAFE_PIVOT', 3],
    ['E22', 'e22-branch-wait', 'SAFE_PIVOT', 3],
    ['E22', 'e22-verify-fund', 'TRUSTED_VERIFY', 3],
    ['E22', 'e22-verify-adjt', 'TRUSTED_VERIFY', 3],
    ['E22', 'e22-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['E22', 'e22-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // E23 HTML attachment: signing in to the local page or installing its "viewer" is -8;
    // opening the file in the browser or replying is -3; leaving it unopened is safe.
    ['E23', 'e23-branch-signin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E23', 'e23-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E23', 'e23-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E23', 'e23-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E23', 'e23-branch-close', 'SAFE_PIVOT', 3],
    ['E23', 'e23-verify-console', 'TRUSTED_VERIFY', 3],
    ['E23', 'e23-verify-security', 'TRUSTED_VERIFY', 3],
    ['E23', 'e23-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    // E24 code in the policy document: signing in on the page the code leads to is -8; opening
    // that address or replying is -3; acknowledging in the Policy Centre - the real task - and
    // closing the circular are both safe.
    ['E24', 'e24-branch-signin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E24', 'e24-branch-scan', 'RISKY_OPEN_REPLY', -3],
    ['E24', 'e24-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['E24', 'e24-branch-centre', 'SAFE_PIVOT', 3],
    ['E24', 'e24-branch-close', 'SAFE_PIVOT', 3],
    ['E24', 'e24-verify-centre', 'TRUSTED_VERIFY', 3],
    ['E24', 'e24-verify-helpdesk', 'TRUSTED_VERIFY', 3],
    ['E24', 'e24-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    // E25 payroll redirect: approving the prefilled form or releasing the run to the new account
    // is -8; opening the form or forwarding it to the clerk is -3; holding the member out of
    // the run is safe.
    ['E25', 'e25-branch-approve', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E25', 'e25-branch-release', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['E25', 'e25-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['E25', 'e25-branch-forward', 'RISKY_OPEN_REPLY', -3],
    ['E25', 'e25-branch-hold', 'SAFE_PIVOT', 3],
    ['E25', 'e25-verify-record', 'TRUSTED_VERIFY', 3],
    ['E25', 'e25-verify-oc', 'TRUSTED_VERIFY', 3],
    ['E25', 'e25-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('E22, E23, E24 and E25 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['E22', 'E23', 'E24', 'E25']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('E21 is the only one of the five that may be rejected, and rejecting it costs', () => {
  const offered = sceneModel.allAffordances(scenes.E21).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.E21.disposition, 'legitimate')
})

test('E21-E25 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    // Rejecting a case that passed every control still completes the run, so the review calls it
    // what it is - the change was dropped without being checked - and the score is 5, not 10.
    ['E21', ['e21-open-read', 'e21-inspect-sender', 'e21-branch-reject', 'e21-verify-vendor', 'e21-resolve-continue'], 5, 'abandoned_without_checking'],
    ['E21', ['e21-open-read', 'e21-inspect-sender', 'e21-branch-release', 'e21-verify-queue', 'e21-resolve-continue'], 3, 'unsafe_external_action'],
    ['E21', ['e21-open-read', 'e21-inspect-thread', 'e21-branch-approve', 'e21-verify-report', 'e21-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['E22', ['e22-open-read', 'e22-inspect-sender', 'e22-branch-confirm', 'e22-verify-adjt', 'e22-resolve-report'], 0, 'released_details_or_paid'],
    ['E22', ['e22-open-read', 'e22-inspect-file', 'e22-branch-reply', 'e22-verify-fund', 'e22-resolve-report'], 4, 'risky_engagement'],
    ['E23', ['e23-open-read', 'e23-inspect-file', 'e23-branch-signin', 'e23-verify-console', 'e23-resolve-report'], 0, 'released_details_or_paid'],
    ['E23', ['e23-open-read', 'e23-inspect-sender', 'e23-branch-install', 'e23-verify-security', 'e23-resolve-report'], 0, 'released_details_or_paid'],
    ['E23', ['e23-open-read', 'e23-inspect-sender', 'e23-branch-open', 'e23-verify-console', 'e23-resolve-report'], 4, 'risky_engagement'],
    ['E24', ['e24-open-read', 'e24-inspect-file', 'e24-branch-signin', 'e24-verify-centre', 'e24-resolve-report'], 0, 'released_details_or_paid'],
    ['E24', ['e24-open-read', 'e24-inspect-sender', 'e24-branch-scan', 'e24-verify-helpdesk', 'e24-resolve-report'], 4, 'risky_engagement'],
    ['E25', ['e25-open-read', 'e25-inspect-sender', 'e25-branch-approve', 'e25-verify-record', 'e25-resolve-report'], 0, 'released_details_or_paid'],
    ['E25', ['e25-open-read', 'e25-inspect-thread', 'e25-branch-release', 'e25-verify-oc', 'e25-resolve-report'], 0, 'released_details_or_paid'],
    ['E25', ['e25-open-read', 'e25-inspect-sender', 'e25-branch-forward', 'e25-verify-record', 'e25-resolve-report'], 4, 'risky_engagement'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('E21 reviews reporting the verified change as a false positive', () => {
  const { outcomeClass } = walk('E21', [
    'e21-open-read', 'e21-inspect-sender', 'e21-branch-reject', 'e21-verify-report', 'e21-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no E21-E25 review carries an engine event code or a point value', () => {
  const walks = [
    ['E21', ['e21-open-read', 'e21-inspect-skip', 'e21-branch-release', 'e21-verify-inmessage', 'e21-resolve-report']],
    ['E22', ['e22-open-read', 'e22-inspect-skip', 'e22-branch-confirm', 'e22-verify-inmessage', 'e22-resolve-continue']],
    ['E23', ['e23-open-read', 'e23-inspect-skip', 'e23-branch-signin', 'e23-verify-inmessage', 'e23-resolve-continue']],
    ['E24', ['e24-open-read', 'e24-inspect-skip', 'e24-branch-signin', 'e24-verify-inmessage', 'e24-resolve-continue']],
    ['E25', ['e25-open-read', 'e25-inspect-skip', 'e25-branch-approve', 'e25-verify-inmessage', 'e25-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-010 - SMS S01-S05, the first SMS batch
 * ------------------------------------------------------------------ */

test('S01-S05 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // S01 bank impersonation: the KYC page is -8, opening it or replying is -3, and leaving the
    // text to open the banking app is the safe branch.
    ['S01', 's01-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S01', 's01-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S01', 's01-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S01', 's01-branch-app', 'SAFE_PIVOT', 3],
    ['S01', 's01-verify-app', 'TRUSTED_VERIFY', 3],
    ['S01', 's01-verify-card', 'TRUSTED_VERIFY', 3],
    ['S01', 's01-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S01', 's01-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S01', 's01-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S01', 's01-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S02 callback: both of the operator's asks are -8, replying is -3, ending the call is safe.
    ['S02', 's02-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S02', 's02-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S02', 's02-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S02', 's02-branch-endcall', 'SAFE_PIVOT', 3],
    ['S02', 's02-verify-app', 'TRUSTED_VERIFY', 3],
    ['S02', 's02-verify-bill', 'TRUSTED_VERIFY', 3],
    ['S02', 's02-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    // S03 legitimate alert: marking it reviewed is the normal path (CORRECT_USE); blocking the
    // header is needless; ringing the gateway number or replying is the unsafe external action;
    // reporting or blocking a real alert is a false positive.
    ['S03', 's03-branch-reviewed', 'CORRECT_USE', 3],
    ['S03', 's03-branch-block', 'NEEDLESS_REJECT_IGNORE', -2],
    ['S03', 's03-branch-callgateway', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S03', 's03-branch-reply', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S03', 's03-verify-app', 'TRUSTED_VERIFY', 3],
    ['S03', 's03-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['S03', 's03-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['S03', 's03-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['S03', 's03-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['S03', 's03-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S04 challan: paying is -8, opening the address or ringing the sender is -3, checking the
    // portal yourself is safe.
    ['S04', 's04-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S04', 's04-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S04', 's04-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['S04', 's04-branch-portal', 'SAFE_PIVOT', 3],
    ['S04', 's04-verify-portal', 'TRUSTED_VERIFY', 3],
    ['S04', 's04-verify-helpline', 'TRUSTED_VERIFY', 3],
    // S05 parcel: the address form and the mandate are both -8, opening the address is -3, and
    // cancelling the mandate or checking the courier app are both safe.
    ['S05', 's05-branch-address', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S05', 's05-branch-mandate', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S05', 's05-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S05', 's05-branch-cancel', 'SAFE_PIVOT', 3],
    ['S05', 's05-branch-courier', 'SAFE_PIVOT', 3],
    ['S05', 's05-verify-app', 'TRUSTED_VERIFY', 3],
    ['S05', 's05-verify-courier', 'TRUSTED_VERIFY', 3],
    ['S05', 's05-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('S01, S02, S04 and S05 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['S01', 'S02', 'S04', 'S05']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('S03 is the only SMS scene that may be rejected, and rejecting it costs', () => {
  const offered = sceneModel.allAffordances(scenes.S03).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.S03.disposition, 'legitimate')
})

test('every SMS scene opens on its message list and puts the opener first', () => {
  for (const id of AUTHORED_SCENARIO_IDS.filter((scenarioId) => scenarioId.startsWith('S'))) {
    const scene = scenes[id]
    assert.equal(scene.platform, 'sms')
    assert.equal(scene.stages.open.surface, 'list')
    const inline = sceneModel.affordancesFor(scene, 'open').filter((item) => item.slot === 'inline')
    assert.equal(inline[0].intent, 'read', `${id} does not open with the opener`)
  }
})

test('S01-S05 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    ['S01', ['s01-open-read', 's01-inspect-sender', 's01-branch-submit', 's01-verify-app', 's01-resolve-report'], 0, 'released_details_or_paid'],
    ['S01', ['s01-open-read', 's01-inspect-link', 's01-branch-open', 's01-verify-card', 's01-resolve-report'], 4, 'risky_engagement'],
    ['S02', ['s02-open-read', 's02-inspect-sender', 's02-branch-install', 's02-verify-bill', 's02-resolve-report'], 0, 'released_details_or_paid'],
    ['S02', ['s02-open-read', 's02-inspect-sender', 's02-branch-pay', 's02-verify-app', 's02-resolve-report'], 0, 'released_details_or_paid'],
    ['S03', ['s03-open-read', 's03-inspect-sender', 's03-branch-block', 's03-verify-report', 's03-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['S03', ['s03-open-read', 's03-inspect-sender', 's03-branch-reply', 's03-verify-app', 's03-resolve-continue'], 3, 'unsafe_external_action'],
    ['S04', ['s04-open-read', 's04-inspect-sender', 's04-branch-pay', 's04-verify-portal', 's04-resolve-report'], 0, 'released_details_or_paid'],
    ['S04', ['s04-open-read', 's04-inspect-link', 's04-branch-open', 's04-verify-portal', 's04-resolve-report'], 4, 'risky_engagement'],
    ['S05', ['s05-open-read', 's05-inspect-sender', 's05-branch-address', 's05-verify-app', 's05-resolve-report'], 0, 'released_details_or_paid'],
    ['S05', ['s05-open-read', 's05-inspect-sender', 's05-branch-mandate', 's05-verify-courier', 's05-resolve-report'], 0, 'released_details_or_paid'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('S03 reviews reporting the genuine alert as a false positive', () => {
  const { outcomeClass } = walk('S03', [
    's03-open-read', 's03-inspect-sender', 's03-branch-block', 's03-verify-report', 's03-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no S01-S05 review carries an engine event code or a point value', () => {
  const walks = [
    ['S01', ['s01-open-read', 's01-inspect-skip', 's01-branch-submit', 's01-verify-inmessage', 's01-resolve-continue']],
    ['S02', ['s02-open-read', 's02-inspect-skip', 's02-branch-pay', 's02-verify-inmessage', 's02-resolve-continue']],
    ['S03', ['s03-open-read', 's03-inspect-skip', 's03-branch-block', 's03-verify-block', 's03-resolve-ignore']],
    ['S04', ['s04-open-read', 's04-inspect-skip', 's04-branch-pay', 's04-verify-inmessage', 's04-resolve-continue']],
    ['S05', ['s05-open-read', 's05-inspect-skip', 's05-branch-mandate', 's05-verify-inmessage', 's05-resolve-ignore']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-011 - SMS S06-S10, the second SMS batch
 * ------------------------------------------------------------------ */

test('S06-S10 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // S06 identity collection: both releases are -8 and neither leaves the Messages app; the
    // reply is -3, and closing the picker or opening the unit portal are the two safe branches.
    ['S06', 's06-branch-identity', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S06', 's06-branch-photo', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S06', 's06-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S06', 's06-branch-closepicker', 'SAFE_PIVOT', 3],
    ['S06', 's06-branch-portal', 'SAFE_PIVOT', 3],
    ['S06', 's06-verify-directory', 'TRUSTED_VERIFY', 3],
    ['S06', 's06-verify-room', 'TRUSTED_VERIFY', 3],
    ['S06', 's06-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S06', 's06-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S06', 's06-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S06', 's06-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S07 legitimate receipt: matching it in the app is the normal path; deleting it is the
    // needless rejection; replying or ringing a searched-for number is the unsafe switch; and
    // reporting or blocking a real sender is a false positive.
    ['S07', 's07-branch-match', 'CORRECT_USE', 3],
    ['S07', 's07-branch-delete', 'NEEDLESS_REJECT_IGNORE', -2],
    ['S07', 's07-branch-reply', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S07', 's07-branch-aggregator', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S07', 's07-verify-app', 'TRUSTED_VERIFY', 3],
    ['S07', 's07-verify-care', 'TRUSTED_VERIFY', 3],
    ['S07', 's07-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['S07', 's07-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['S07', 's07-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['S07', 's07-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['S07', 's07-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S08 prize lure: the winner details and the release fee are both -8 and sit on two pages
    // that are each reachable from the other; opening the address or replying is -3, and going
    // to the phone's own spam folder is the safe branch.
    ['S08', 's08-branch-submit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S08', 's08-branch-fee', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S08', 's08-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S08', 's08-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S08', 's08-branch-spam', 'SAFE_PIVOT', 3],
    ['S08', 's08-verify-consumer', 'TRUSTED_VERIFY', 3],
    ['S08', 's08-verify-helpline', 'TRUSTED_VERIFY', 3],
    ['S08', 's08-resolve-block', 'RESOLVE_CORRECT', 2],
    // S09 grooming: the account details go out of the composer and the deposit off the payment
    // sheet; both are -8. Replying again is -3 and the register is the safe branch.
    ['S09', 's09-branch-account', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S09', 's09-branch-deposit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S09', 's09-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S09', 's09-branch-register', 'SAFE_PIVOT', 3],
    ['S09', 's09-verify-register', 'TRUSTED_VERIFY', 3],
    ['S09', 's09-verify-helpline', 'TRUSTED_VERIFY', 3],
    ['S09', 's09-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S10 SIM swap: reading the code out and approving the transfer are both -8 and both sit on
    // the carrier's own thread; ringing the number in the text is -3, taken on the dial
    // confirmation, and the carrier app is the safe branch.
    ['S10', 's10-branch-code', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S10', 's10-branch-approve', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S10', 's10-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['S10', 's10-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S10', 's10-branch-carrier', 'SAFE_PIVOT', 3],
    ['S10', 's10-verify-app', 'TRUSTED_VERIFY', 3],
    ['S10', 's10-verify-bill', 'TRUSTED_VERIFY', 3],
    ['S10', 's10-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('S06, S08, S09 and S10 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['S06', 'S08', 'S09', 'S10']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('S07 is the second SMS scene that may be rejected, and rejecting it costs', () => {
  const offered = sceneModel.allAffordances(scenes.S07).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.S07.disposition, 'legitimate')
})

test('S06-S10 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    ['S06', ['s06-open-read', 's06-inspect-sender', 's06-branch-identity', 's06-verify-directory', 's06-resolve-report'], 0, 'released_details_or_paid'],
    ['S06', ['s06-open-read', 's06-inspect-thread', 's06-branch-photo', 's06-verify-portal', 's06-resolve-report'], 0, 'released_details_or_paid'],
    ['S06', ['s06-open-read', 's06-inspect-sender', 's06-branch-reply', 's06-verify-room', 's06-resolve-report'], 4, 'risky_engagement'],
    ['S07', ['s07-open-read', 's07-inspect-sender', 's07-branch-delete', 's07-verify-report', 's07-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['S07', ['s07-open-read', 's07-inspect-thread', 's07-branch-aggregator', 's07-verify-app', 's07-resolve-continue'], 3, 'unsafe_external_action'],
    ['S08', ['s08-open-read', 's08-inspect-sender', 's08-branch-submit', 's08-verify-consumer', 's08-resolve-report'], 0, 'released_details_or_paid'],
    ['S08', ['s08-open-read', 's08-inspect-link', 's08-branch-fee', 's08-verify-helpline', 's08-resolve-report'], 0, 'released_details_or_paid'],
    ['S08', ['s08-open-read', 's08-inspect-link', 's08-branch-open', 's08-verify-consumer', 's08-resolve-report'], 4, 'risky_engagement'],
    ['S09', ['s09-open-read', 's09-inspect-sender', 's09-branch-account', 's09-verify-register', 's09-resolve-report'], 0, 'released_details_or_paid'],
    ['S09', ['s09-open-read', 's09-inspect-link', 's09-branch-deposit', 's09-verify-helpline', 's09-resolve-report'], 0, 'released_details_or_paid'],
    ['S10', ['s10-open-read', 's10-inspect-thread', 's10-branch-code', 's10-verify-app', 's10-resolve-report'], 0, 'released_details_or_paid'],
    ['S10', ['s10-open-read', 's10-inspect-thread', 's10-branch-approve', 's10-verify-bill', 's10-resolve-report'], 0, 'released_details_or_paid'],
    ['S10', ['s10-open-read', 's10-inspect-sender', 's10-branch-call', 's10-verify-app', 's10-resolve-report'], 4, 'risky_engagement'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('S07 reviews reporting the genuine receipt as a false positive', () => {
  const { outcomeClass } = walk('S07', [
    's07-open-read', 's07-inspect-sender', 's07-branch-delete', 's07-verify-report', 's07-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no S06-S10 review carries an engine event code or a point value', () => {
  const walks = [
    ['S06', ['s06-open-read', 's06-inspect-skip', 's06-branch-identity', 's06-verify-inmessage', 's06-resolve-continue']],
    ['S07', ['s07-open-read', 's07-inspect-skip', 's07-branch-delete', 's07-verify-block', 's07-resolve-ignore']],
    ['S08', ['s08-open-read', 's08-inspect-skip', 's08-branch-fee', 's08-verify-inmessage', 's08-resolve-continue']],
    ['S09', ['s09-open-read', 's09-inspect-skip', 's09-branch-deposit', 's09-verify-inmessage', 's09-resolve-ignore']],
    ['S10', ['s10-open-read', 's10-inspect-skip', 's10-branch-approve', 's10-verify-inmessage', 's10-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-012 - SMS S11-S15, the third SMS batch
 * ------------------------------------------------------------------ */

test('S11-S15 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // S11 is legitimate: both quick replies are the correct use; the reply with health details
    // is the unsafe external action; deleting and blocking the line is the needless rejection.
    ['S11', 's11-branch-confirm', 'CORRECT_USE', 3],
    ['S11', 's11-branch-reschedule', 'CORRECT_USE', 3],
    ['S11', 's11-branch-overshare', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S11', 's11-branch-block', 'NEEDLESS_REJECT_IGNORE', -2],
    ['S11', 's11-verify-portal', 'TRUSTED_VERIFY', 3],
    ['S11', 's11-verify-reception', 'TRUSTED_VERIFY', 3],
    ['S11', 's11-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S11', 's11-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['S11', 's11-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['S11', 's11-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['S11', 's11-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['S11', 's11-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['S11', 's11-open-quickreply', 'PREMATURE_REPLY', -1],
    // S12 refund: the open on link details is -3; the account and the card-and-code are -8.
    ['S12', 's12-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S12', 's12-branch-account', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S12', 's12-branch-card', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S12', 's12-branch-portal', 'SAFE_PIVOT', 3],
    ['S12', 's12-verify-portal', 'TRUSTED_VERIFY', 3],
    ['S12', 's12-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S12', 's12-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S13 task recruiter: YES is -3; the payout account and the deposit are -8.
    ['S13', 's13-branch-yes', 'RISKY_OPEN_REPLY', -3],
    ['S13', 's13-branch-payout', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S13', 's13-branch-deposit', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S13', 's13-branch-lookup', 'SAFE_PIVOT', 3],
    ['S13', 's13-verify-careers', 'TRUSTED_VERIFY', 3],
    ['S13', 's13-verify-office', 'TRUSTED_VERIFY', 3],
    ['S13', 's13-resolve-block', 'RESOLVE_CORRECT', 2],
    // S14 recall: opening is -3; allowing location and the form are -8.
    ['S14', 's14-branch-open', 'RISKY_OPEN_REPLY', -3],
    ['S14', 's14-branch-allow', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S14', 's14-branch-form', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S14', 's14-branch-alerts', 'SAFE_PIVOT', 3],
    ['S14', 's14-verify-duty', 'TRUSTED_VERIFY', 3],
    ['S14', 's14-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S14', 's14-resolve-report', 'RESOLVE_CORRECT', 2],
    // S15 canteen QR: inspecting the picture is +2; opening the code and replying to all are -3;
    // the card PIN is -8.
    ['S15', 's15-inspect-qr', 'INSPECT_CONTEXT', 2],
    ['S15', 's15-branch-scan', 'RISKY_OPEN_REPLY', -3],
    ['S15', 's15-branch-replyall', 'RISKY_OPEN_REPLY', -3],
    ['S15', 's15-branch-pin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S15', 's15-branch-canteen', 'SAFE_PIVOT', 3],
    ['S15', 's15-verify-app', 'TRUSTED_VERIFY', 3],
    ['S15', 's15-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('S12, S13, S14 and S15 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['S12', 'S13', 'S14', 'S15']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('S11 is the third SMS scene that may be rejected, and it is the legitimate one', () => {
  const offered = sceneModel.allAffordances(scenes.S11).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.S11.disposition, 'legitimate')
})

test('S11-S15 safe paths each score exactly ten through the real engine', () => {
  const safe = [
    ['S11', ['s11-open-read', 's11-inspect-sender', 's11-branch-confirm', 's11-verify-portal', 's11-resolve-continue']],
    ['S11', ['s11-open-read', 's11-inspect-thread', 's11-branch-reschedule', 's11-verify-reception', 's11-resolve-retain']],
    ['S12', ['s12-open-read', 's12-inspect-sender', 's12-branch-portal', 's12-verify-portal', 's12-resolve-report']],
    ['S12', ['s12-open-read', 's12-inspect-link', 's12-branch-portal', 's12-verify-helpline', 's12-resolve-block']],
    ['S13', ['s13-open-read', 's13-inspect-sender', 's13-branch-lookup', 's13-verify-careers', 's13-resolve-report']],
    ['S13', ['s13-open-read', 's13-inspect-link', 's13-branch-lookup', 's13-verify-office', 's13-resolve-block']],
    ['S14', ['s14-open-read', 's14-inspect-sender', 's14-branch-alerts', 's14-verify-duty', 's14-resolve-report']],
    ['S14', ['s14-open-read', 's14-inspect-link', 's14-branch-alerts', 's14-verify-portal', 's14-resolve-block']],
    ['S15', ['s15-open-read', 's15-inspect-qr', 's15-branch-canteen', 's15-verify-app', 's15-resolve-report']],
    ['S15', ['s15-open-read', 's15-inspect-sender', 's15-branch-canteen', 's15-verify-office', 's15-resolve-block']],
  ]
  for (const [id, route] of safe) {
    const { events, score } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, 10, `${id} ${route.join(' ')}`)
  }
})

test('S11-S15 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    ['S11', ['s11-open-read', 's11-inspect-sender', 's11-branch-overshare', 's11-verify-portal', 's11-resolve-continue'], 3, 'unsafe_external_action'],
    ['S11', ['s11-open-read', 's11-inspect-sender', 's11-branch-block', 's11-verify-portal', 's11-resolve-continue'], 5, 'abandoned_without_checking'],
    ['S11', ['s11-open-read', 's11-inspect-sender', 's11-branch-confirm', 's11-verify-report', 's11-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['S12', ['s12-open-read', 's12-inspect-link', 's12-branch-open', 's12-verify-portal', 's12-resolve-report'], 4, 'risky_engagement'],
    ['S12', ['s12-open-read', 's12-inspect-sender', 's12-branch-account', 's12-verify-portal', 's12-resolve-report'], 0, 'released_details_or_paid'],
    ['S12', ['s12-open-read', 's12-inspect-link', 's12-branch-card', 's12-verify-helpline', 's12-resolve-report'], 0, 'released_details_or_paid'],
    ['S13', ['s13-open-read', 's13-inspect-sender', 's13-branch-yes', 's13-verify-careers', 's13-resolve-report'], 4, 'risky_engagement'],
    ['S13', ['s13-open-read', 's13-inspect-link', 's13-branch-payout', 's13-verify-careers', 's13-resolve-report'], 0, 'released_details_or_paid'],
    ['S13', ['s13-open-read', 's13-inspect-sender', 's13-branch-deposit', 's13-verify-office', 's13-resolve-block'], 0, 'released_details_or_paid'],
    ['S14', ['s14-open-read', 's14-inspect-link', 's14-branch-open', 's14-verify-duty', 's14-resolve-report'], 4, 'risky_engagement'],
    ['S14', ['s14-open-read', 's14-inspect-sender', 's14-branch-allow', 's14-verify-duty', 's14-resolve-report'], 0, 'released_details_or_paid'],
    ['S14', ['s14-open-read', 's14-inspect-sender', 's14-branch-form', 's14-verify-portal', 's14-resolve-block'], 0, 'released_details_or_paid'],
    ['S15', ['s15-open-read', 's15-inspect-qr', 's15-branch-scan', 's15-verify-app', 's15-resolve-report'], 4, 'risky_engagement'],
    ['S15', ['s15-open-read', 's15-inspect-qr', 's15-branch-replyall', 's15-verify-office', 's15-resolve-report'], 4, 'risky_engagement'],
    ['S15', ['s15-open-read', 's15-inspect-sender', 's15-branch-pin', 's15-verify-app', 's15-resolve-report'], 0, 'released_details_or_paid'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('S11 reviews reporting the genuine reminder as a false positive', () => {
  const { outcomeClass } = walk('S11', [
    's11-open-read', 's11-inspect-sender', 's11-branch-block', 's11-verify-report', 's11-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no S11-S15 review carries an engine event code or a point value', () => {
  const walks = [
    ['S11', ['s11-open-read', 's11-inspect-skip', 's11-branch-overshare', 's11-verify-block', 's11-resolve-ignore']],
    ['S12', ['s12-open-read', 's12-inspect-skip', 's12-branch-card', 's12-verify-inmessage', 's12-resolve-continue']],
    ['S13', ['s13-open-read', 's13-inspect-skip', 's13-branch-deposit', 's13-verify-inmessage', 's13-resolve-ignore']],
    ['S14', ['s14-open-read', 's14-inspect-skip', 's14-branch-allow', 's14-verify-inmessage', 's14-resolve-continue']],
    ['S15', ['s15-open-read', 's15-inspect-skip', 's15-branch-pin', 's15-verify-inmessage', 's15-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-013 - SMS S16-S20, the fourth SMS batch
 * ------------------------------------------------------------------ */

test('S16-S20 carry the canonical identity the batch was built against', () => {
  const expected = {
    S16: { family: 'legit_system_confirmation', triggers: ['routine'], level: 'medium', disposition: 'legitimate', military: false },
    S17: { family: 'impersonation_emergency_payment', triggers: ['empathy', 'urgency'], level: 'medium', disposition: 'malicious', military: false },
    S18: { family: 'tech_support_and_callback_fraud', triggers: ['trust', 'fear'], level: 'hard', disposition: 'malicious', military: false },
    S19: { family: 'operational_elicitation', triggers: ['authority', 'helpfulness'], level: 'hard', disposition: 'malicious', military: true },
    S20: { family: 'tech_support_and_callback_fraud', triggers: ['curiosity', 'urgency'], level: 'hard', disposition: 'malicious', military: false },
  }
  for (const [id, fields] of Object.entries(expected)) {
    const definition = definitions[id]
    assert.equal(definition.canonical_family, fields.family, id)
    assert.deepEqual(definition.canonical_triggers, fields.triggers, id)
    assert.equal(definition.level, fields.level, id)
    assert.equal(definition.disposition, fields.disposition, id)
    assert.equal(definition.military_flag, fields.military, id)
    assert.equal(definition.stages.length, 6, id)
  }
})

test('S16-S20 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // S16 is legitimate: filling the code in the portal is the correct use; cancelling the sign-in
    // is the needless rejection; forwarding the code is the unsafe external action.
    ['S16', 's16-open-copy', 'PREMATURE_REPLY', -1],
    ['S16', 's16-inspect-sender', 'INSPECT_CONTEXT', 2],
    ['S16', 's16-inspect-thread', 'INSPECT_CONTEXT', 2],
    ['S16', 's16-branch-fill', 'CORRECT_USE', 3],
    ['S16', 's16-branch-cancel', 'NEEDLESS_REJECT_IGNORE', -2],
    ['S16', 's16-branch-forward', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S16', 's16-verify-security', 'TRUSTED_VERIFY', 3],
    ['S16', 's16-verify-directory', 'TRUSTED_VERIFY', 3],
    ['S16', 's16-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S16', 's16-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['S16', 's16-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['S16', 's16-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['S16', 's16-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['S16', 's16-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['S16', 's16-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['S16', 's16-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S17 new number: both replies are -3; the payment is -8; the saved thread is the safe branch.
    ['S17', 's17-open-quickreply', 'PREMATURE_REPLY', -1],
    ['S17', 's17-branch-done', 'RISKY_OPEN_REPLY', -3],
    ['S17', 's17-branch-ask', 'RISKY_OPEN_REPLY', -3],
    ['S17', 's17-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S17', 's17-branch-saved', 'SAFE_PIVOT', 3],
    ['S17', 's17-verify-kabir', 'TRUSTED_VERIFY', 3],
    ['S17', 's17-verify-sunil', 'TRUSTED_VERIFY', 3],
    ['S17', 's17-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S17', 's17-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S17', 's17-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S17', 's17-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S17', 's17-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S18 header hijack: the dial confirmation is -3; reading out card, PIN and code is -8; hanging
    // up on the call and leaving for the bank app are both the safe branch.
    ['S18', 's18-open-call', 'PREMATURE_REPLY', -1],
    ['S18', 's18-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['S18', 's18-branch-readout', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S18', 's18-branch-hangup', 'SAFE_PIVOT', 3],
    ['S18', 's18-branch-app', 'SAFE_PIVOT', 3],
    ['S18', 's18-verify-app', 'TRUSTED_VERIFY', 3],
    ['S18', 's18-verify-card', 'TRUSTED_VERIFY', 3],
    ['S18', 's18-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S18', 's18-resolve-block', 'RESOLVE_CORRECT', 2],
    ['S18', 's18-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S19 survey: the model-only reply is -3; the form and the location are both -8.
    ['S19', 's19-inspect-link', 'INSPECT_CONTEXT', 2],
    ['S19', 's19-branch-model', 'RISKY_OPEN_REPLY', -3],
    ['S19', 's19-branch-form', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S19', 's19-branch-location', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S19', 's19-branch-carrier', 'SAFE_PIVOT', 3],
    ['S19', 's19-verify-comms', 'TRUSTED_VERIFY', 3],
    ['S19', 's19-verify-app', 'TRUSTED_VERIFY', 3],
    ['S19', 's19-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S19', 's19-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S19', 's19-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S20 two-stage: calling is -3; installing the app and starting screen share are -8.
    ['S20', 's20-open-call', 'PREMATURE_REPLY', -1],
    ['S20', 's20-inspect-thread', 'INSPECT_CONTEXT', 2],
    ['S20', 's20-branch-call', 'RISKY_OPEN_REPLY', -3],
    ['S20', 's20-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S20', 's20-branch-share', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S20', 's20-branch-courier', 'SAFE_PIVOT', 3],
    ['S20', 's20-verify-courier', 'TRUSTED_VERIFY', 3],
    ['S20', 's20-verify-bank', 'TRUSTED_VERIFY', 3],
    ['S20', 's20-verify-card', 'TRUSTED_VERIFY', 3],
    ['S20', 's20-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S20', 's20-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S20', 's20-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('the risky S16-S20 controls hand the device a rendering instruction, never an action', () => {
  const expected = {
    's17-branch-pay': 'simulated_payment',
    's17-branch-done': 'simulated_reply_sent',
    's18-branch-call': 'simulated_call',
    's18-branch-readout': 'simulated_data_submission',
    's19-branch-location': 'simulated_data_submission',
    's20-branch-install': 'simulated_install',
    's20-branch-share': 'simulated_data_submission',
  }
  for (const [controlId, kind] of Object.entries(expected)) {
    const id = controlId.slice(0, 3).toUpperCase()
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.consequence?.kind, kind, controlId)
    assert.equal(outcome.consequence?.executes, false, controlId)
  }
})

test('S17, S18, S19 and S20 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['S17', 'S18', 'S19', 'S20']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
})

test('S16 is the fourth SMS scene that may be rejected, and it is the legitimate one', () => {
  const offered = sceneModel.allAffordances(scenes.S16).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.S16.disposition, 'legitimate')
})

test('S16-S20 safe paths each score exactly ten through the real engine', () => {
  const safe = [
    ['S16', ['s16-open-read', 's16-inspect-sender', 's16-branch-fill', 's16-verify-security', 's16-resolve-continue']],
    ['S16', ['s16-open-read', 's16-inspect-thread', 's16-branch-fill', 's16-verify-directory', 's16-resolve-retain']],
    ['S17', ['s17-open-read', 's17-inspect-sender', 's17-branch-saved', 's17-verify-kabir', 's17-resolve-report']],
    ['S17', ['s17-open-read', 's17-inspect-thread', 's17-branch-saved', 's17-verify-sunil', 's17-resolve-block']],
    ['S18', ['s18-open-read', 's18-inspect-thread', 's18-branch-hangup', 's18-verify-card', 's18-resolve-report']],
    ['S18', ['s18-open-read', 's18-inspect-sender', 's18-branch-app', 's18-verify-app', 's18-resolve-block']],
    ['S19', ['s19-open-read', 's19-inspect-sender', 's19-branch-carrier', 's19-verify-comms', 's19-resolve-report']],
    ['S19', ['s19-open-read', 's19-inspect-link', 's19-branch-carrier', 's19-verify-app', 's19-resolve-block']],
    ['S20', ['s20-open-read', 's20-inspect-thread', 's20-branch-courier', 's20-verify-courier', 's20-resolve-report']],
    ['S20', ['s20-open-read', 's20-inspect-sender', 's20-branch-courier', 's20-verify-card', 's20-resolve-block']],
  ]
  for (const [id, route] of safe) {
    const { events, score, outcomeClass } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, 10, `${id} ${route.join(' ')}`)
    assert.ok(!['false_positive'].includes(outcomeClass), `${id} ${outcomeClass}`)
  }
})

test('S16-S20 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    // [id, route, expected score 0-10, a review card kind the route must produce]
    ['S16', ['s16-open-read', 's16-inspect-sender', 's16-branch-forward', 's16-verify-security', 's16-resolve-continue'], 3, 'unsafe_external_action'],
    ['S16', ['s16-open-read', 's16-inspect-sender', 's16-branch-cancel', 's16-verify-security', 's16-resolve-continue'], 5, 'abandoned_without_checking'],
    ['S16', ['s16-open-read', 's16-inspect-sender', 's16-branch-fill', 's16-verify-report', 's16-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['S17', ['s17-open-read', 's17-inspect-sender', 's17-branch-done', 's17-verify-kabir', 's17-resolve-report'], 4, 'risky_engagement'],
    ['S17', ['s17-open-read', 's17-inspect-thread', 's17-branch-ask', 's17-verify-kabir', 's17-resolve-report'], 4, 'risky_engagement'],
    ['S17', ['s17-open-read', 's17-inspect-sender', 's17-branch-pay', 's17-verify-kabir', 's17-resolve-report'], 0, 'released_details_or_paid'],
    ['S18', ['s18-open-read', 's18-inspect-thread', 's18-branch-call', 's18-verify-card', 's18-resolve-report'], 4, 'risky_engagement'],
    ['S18', ['s18-open-read', 's18-inspect-sender', 's18-branch-readout', 's18-verify-app', 's18-resolve-report'], 0, 'released_details_or_paid'],
    ['S19', ['s19-open-read', 's19-inspect-sender', 's19-branch-model', 's19-verify-comms', 's19-resolve-report'], 4, 'risky_engagement'],
    ['S19', ['s19-open-read', 's19-inspect-link', 's19-branch-form', 's19-verify-comms', 's19-resolve-report'], 0, 'released_details_or_paid'],
    ['S19', ['s19-open-read', 's19-inspect-sender', 's19-branch-location', 's19-verify-app', 's19-resolve-block'], 0, 'released_details_or_paid'],
    ['S20', ['s20-open-read', 's20-inspect-thread', 's20-branch-call', 's20-verify-card', 's20-resolve-report'], 4, 'risky_engagement'],
    ['S20', ['s20-open-read', 's20-inspect-sender', 's20-branch-install', 's20-verify-bank', 's20-resolve-report'], 0, 'released_details_or_paid'],
    ['S20', ['s20-open-read', 's20-inspect-thread', 's20-branch-share', 's20-verify-courier', 's20-resolve-block'], 0, 'released_details_or_paid'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('S16 reviews reporting the genuine code as a false positive', () => {
  const { outcomeClass } = walk('S16', [
    's16-open-read', 's16-inspect-sender', 's16-branch-cancel', 's16-verify-report', 's16-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no S16-S20 review carries an engine event code or a point value', () => {
  const walks = [
    ['S16', ['s16-open-read', 's16-inspect-skip', 's16-branch-forward', 's16-verify-block', 's16-resolve-ignore']],
    ['S17', ['s17-open-read', 's17-inspect-skip', 's17-branch-pay', 's17-verify-inmessage', 's17-resolve-continue']],
    ['S18', ['s18-open-read', 's18-inspect-skip', 's18-branch-readout', 's18-verify-inmessage', 's18-resolve-continue']],
    ['S19', ['s19-open-read', 's19-inspect-skip', 's19-branch-location', 's19-verify-inmessage', 's19-resolve-ignore']],
    ['S20', ['s20-open-read', 's20-inspect-skip', 's20-branch-install', 's20-verify-inmessage', 's20-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

/* ------------------------------------------------------------------ *
 * IMMERSIVE-014 - SMS S21-S25, the fifth and final SMS batch
 * ------------------------------------------------------------------ */

test('S21-S25 carry the canonical identity the batch was built against', () => {
  const expected = {
    S21: { family: 'legit_system_confirmation', triggers: ['fear', 'routine'], level: 'hard', disposition: 'legitimate', military: false },
    S22: { family: 'credential_phishing', triggers: ['authority', 'curiosity'], level: 'hard', disposition: 'malicious', military: true },
    S23: { family: 'financial_credential_phishing', triggers: ['greed', 'confusion'], level: 'hard', disposition: 'malicious', military: false },
    S24: { family: 'coercion_and_extortion', triggers: ['fear', 'authority'], level: 'hard', disposition: 'malicious', military: false },
    S25: { family: 'malware_delivery', triggers: ['convenience', 'urgency'], level: 'hard', disposition: 'malicious', military: false },
  }
  for (const [id, fields] of Object.entries(expected)) {
    const definition = definitions[id]
    assert.equal(definition.canonical_family, fields.family, id)
    assert.deepEqual(definition.canonical_triggers, fields.triggers, id)
    assert.equal(definition.level, fields.level, id)
    assert.equal(definition.disposition, fields.disposition, id)
    assert.equal(definition.military_flag, fields.military, id)
    assert.equal(definition.stages.length, 6, id)
  }
})

test('the finished bank keeps its 80/20 disposition balance across all hundred authored scenes', () => {
  const dispositions = AUTHORED_SCENARIO_IDS.map((id) => definitions[id].disposition)
  assert.equal(dispositions.length, 100)
  assert.equal(dispositions.filter((d) => d === 'malicious').length, 80)
  assert.equal(dispositions.filter((d) => d === 'legitimate').length, 20)
})

test('S21-S25 controls each resolve to a legal transition and keep their scoring meaning', () => {
  const expectations = [
    // S21 is legitimate: keeping DEV-204 is the correct use; ending the session is the needless
    // rejection; opening the unrelated Spam text's address is the unsafe external action.
    ['S21', 's21-open-call', 'PREMATURE_REPLY', -1],
    ['S21', 's21-inspect-sender', 'INSPECT_CONTEXT', 2],
    ['S21', 's21-inspect-message', 'INSPECT_CONTEXT', 2],
    ['S21', 's21-branch-keep', 'CORRECT_USE', 3],
    ['S21', 's21-branch-end', 'NEEDLESS_REJECT_IGNORE', -2],
    ['S21', 's21-branch-spamlink', 'UNSAFE_EXTERNAL_ACTION', -4],
    ['S21', 's21-verify-history', 'TRUSTED_VERIFY', 3],
    ['S21', 's21-verify-meera', 'TRUSTED_VERIFY', 3],
    ['S21', 's21-verify-directory', 'TRUSTED_VERIFY', 3],
    ['S21', 's21-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S21', 's21-verify-report', 'FALSE_REPORT_BLOCK', -4],
    ['S21', 's21-verify-block', 'FALSE_REPORT_BLOCK', -4],
    ['S21', 's21-resolve-retain', 'RESOLVE_CORRECT', 2],
    ['S21', 's21-resolve-continue', 'RESOLVE_CORRECT', 2],
    ['S21', 's21-resolve-report', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['S21', 's21-resolve-block', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    ['S21', 's21-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S22 voice-mail link: signing in is -8; calling the recording's number is -3; two safe branches.
    ['S22', 's22-open-link', 'PREMATURE_REPLY', -1],
    ['S22', 's22-inspect-link', 'INSPECT_CONTEXT', 2],
    ['S22', 's22-branch-signin', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S22', 's22-branch-callback', 'RISKY_OPEN_REPLY', -3],
    ['S22', 's22-branch-close', 'SAFE_PIVOT', 3],
    ['S22', 's22-branch-voicemail', 'SAFE_PIVOT', 3],
    ['S22', 's22-verify-duty', 'TRUSTED_VERIFY', 3],
    ['S22', 's22-verify-mail', 'TRUSTED_VERIFY', 3],
    ['S22', 's22-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S22', 's22-verify-report', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S22', 's22-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S22', 's22-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S23 collect request: the PIN is -8; a reply is -3; Decline is the safe branch.
    ['S23', 's23-open-quickreply', 'PREMATURE_REPLY', -1],
    ['S23', 's23-inspect-card', 'INSPECT_CONTEXT', 2],
    ['S23', 's23-branch-reply', 'RISKY_OPEN_REPLY', -3],
    ['S23', 's23-branch-pay', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S23', 's23-branch-decline', 'SAFE_PIVOT', 3],
    ['S23', 's23-verify-shop', 'TRUSTED_VERIFY', 3],
    ['S23', 's23-verify-trainpay', 'TRUSTED_VERIFY', 3],
    ['S23', 's23-verify-block', 'REPORT_ONLY_WITHOUT_CHECK', 1],
    ['S23', 's23-resolve-block', 'RESOLVE_CORRECT', 2],
    ['S23', 's23-resolve-ignore', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S24 case fee: the fee and the upload are -8; calling the officer is -3; keeping the texts is safe.
    ['S24', 's24-open-call', 'PREMATURE_REPLY', -1],
    ['S24', 's24-inspect-link', 'INSPECT_CONTEXT', 2],
    ['S24', 's24-branch-officer', 'RISKY_OPEN_REPLY', -3],
    ['S24', 's24-branch-fee', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S24', 's24-branch-upload', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S24', 's24-branch-keep', 'SAFE_PIVOT', 3],
    ['S24', 's24-verify-legal', 'TRUSTED_VERIFY', 3],
    ['S24', 's24-verify-portal', 'TRUSTED_VERIFY', 3],
    ['S24', 's24-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S24', 's24-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S24', 's24-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
    // S25 toll APK: installing is -8; opening the link is -3; deleting the file is safe.
    ['S25', 's25-open-install', 'PREMATURE_REPLY', -1],
    ['S25', 's25-inspect-file', 'INSPECT_CONTEXT', 2],
    ['S25', 's25-branch-link', 'RISKY_OPEN_REPLY', -3],
    ['S25', 's25-branch-install', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE', -8],
    ['S25', 's25-branch-delete', 'SAFE_PIVOT', 3],
    ['S25', 's25-verify-issuer', 'TRUSTED_VERIFY', 3],
    ['S25', 's25-verify-support', 'TRUSTED_VERIFY', 3],
    ['S25', 's25-verify-inmessage', 'VERIFY_THROUGH_MESSAGE', 0],
    ['S25', 's25-resolve-report', 'RESOLVE_CORRECT', 2],
    ['S25', 's25-resolve-continue', 'CONTRADICTORY_UNSAFE_FINAL', -4],
  ]
  for (const [id, controlId, code, points] of expectations) {
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    assert.ok(affordance, `${id} no longer offers ${controlId}`)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.event_code, code, `${id} ${controlId}`)
    assert.equal(outcome.points_delta, points, `${id} ${controlId}`)
  }
})

test('the risky S21-S25 controls hand the device a rendering instruction, never an action', () => {
  const expected = {
    's21-branch-spamlink': 'simulated_browser_open',
    's22-branch-signin': 'simulated_data_submission',
    's22-branch-callback': 'simulated_call',
    's23-branch-pay': 'simulated_payment',
    's23-branch-reply': 'simulated_reply_sent',
    's24-branch-fee': 'simulated_payment',
    's24-branch-upload': 'simulated_data_submission',
    's24-branch-officer': 'simulated_call',
    's25-branch-install': 'simulated_install',
    's25-branch-link': 'simulated_browser_open',
  }
  for (const [controlId, kind] of Object.entries(expected)) {
    const id = controlId.slice(0, 3).toUpperCase()
    const affordance = sceneModel.allAffordances(scenes[id]).find((item) => item.id === controlId)
    const outcome = resolveIntent({
      definition: definitions[id], stage: affordance.stage, intent: affordance.intent,
      syntheticTargetId: affordance.targetId ?? null,
    })
    assert.equal(outcome.consequence?.kind, kind, controlId)
    assert.equal(outcome.consequence?.executes, false, controlId)
  }
})

test('S22, S23, S24 and S25 never offer a rejection the engine refuses on a malicious item', () => {
  for (const id of ['S22', 'S23', 'S24', 'S25']) {
    const offered = sceneModel.allAffordances(scenes[id]).map((item) => item.intent)
    assert.ok(!offered.includes('reject_ignore'), id)
  }
  const offered = sceneModel.allAffordances(scenes.S21).map((item) => item.intent)
  assert.ok(offered.includes('reject_ignore'))
  assert.equal(definitions.S21.disposition, 'legitimate')
})

test('S21-S25 safe paths each score exactly ten through the real engine', () => {
  const safe = [
    ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-keep', 's21-verify-history', 's21-resolve-retain']],
    ['S21', ['s21-open-read', 's21-inspect-sender', 's21-branch-keep', 's21-verify-meera', 's21-resolve-continue']],
    ['S22', ['s22-open-read', 's22-inspect-link', 's22-branch-close', 's22-verify-duty', 's22-resolve-report']],
    ['S22', ['s22-open-read', 's22-inspect-sender', 's22-branch-voicemail', 's22-verify-mail', 's22-resolve-block']],
    ['S23', ['s23-open-read', 's23-inspect-card', 's23-branch-decline', 's23-verify-shop', 's23-resolve-report']],
    ['S23', ['s23-open-read', 's23-inspect-sender', 's23-branch-decline', 's23-verify-trainpay', 's23-resolve-block']],
    ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-keep', 's24-verify-legal', 's24-resolve-report']],
    ['S24', ['s24-open-read', 's24-inspect-link', 's24-branch-keep', 's24-verify-portal', 's24-resolve-block']],
    ['S25', ['s25-open-read', 's25-inspect-file', 's25-branch-delete', 's25-verify-issuer', 's25-resolve-report']],
    ['S25', ['s25-open-read', 's25-inspect-sender', 's25-branch-delete', 's25-verify-support', 's25-resolve-block']],
  ]
  for (const [id, route] of safe) {
    const { events, score, outcomeClass } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, 10, `${id} ${route.join(' ')}`)
    assert.ok(!['false_positive'].includes(outcomeClass), `${id} ${outcomeClass}`)
  }
})

test('S21-S25 unsafe walks score through the real engine and review as the mistake they are', () => {
  const walks = [
    ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-spamlink', 's21-verify-history', 's21-resolve-retain'], 3, 'unsafe_external_action'],
    ['S21', ['s21-open-read', 's21-inspect-message', 's21-branch-end', 's21-verify-history', 's21-resolve-retain'], 5, 'abandoned_without_checking'],
    ['S21', ['s21-open-read', 's21-inspect-sender', 's21-branch-keep', 's21-verify-report', 's21-resolve-report'], 0, 'rejected_a_genuine_item'],
    ['S22', ['s22-open-read', 's22-inspect-link', 's22-branch-callback', 's22-verify-duty', 's22-resolve-report'], 4, 'risky_engagement'],
    ['S22', ['s22-open-read', 's22-inspect-sender', 's22-branch-signin', 's22-verify-mail', 's22-resolve-report'], 0, 'released_details_or_paid'],
    ['S23', ['s23-open-read', 's23-inspect-card', 's23-branch-reply', 's23-verify-shop', 's23-resolve-report'], 4, 'risky_engagement'],
    ['S23', ['s23-open-read', 's23-inspect-sender', 's23-branch-pay', 's23-verify-trainpay', 's23-resolve-block'], 0, 'released_details_or_paid'],
    ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-officer', 's24-verify-legal', 's24-resolve-report'], 4, 'risky_engagement'],
    ['S24', ['s24-open-read', 's24-inspect-link', 's24-branch-fee', 's24-verify-portal', 's24-resolve-report'], 0, 'released_details_or_paid'],
    ['S24', ['s24-open-read', 's24-inspect-sender', 's24-branch-upload', 's24-verify-legal', 's24-resolve-block'], 0, 'released_details_or_paid'],
    ['S25', ['s25-open-read', 's25-inspect-file', 's25-branch-link', 's25-verify-issuer', 's25-resolve-report'], 4, 'risky_engagement'],
    ['S25', ['s25-open-read', 's25-inspect-sender', 's25-branch-install', 's25-verify-support', 's25-resolve-report'], 0, 'released_details_or_paid'],
  ]
  for (const [id, route, expected, kind] of walks) {
    const { events, score, review } = walk(id, route)
    assert.deepEqual(events.map((e) => e.stage), ['notify', 'open', 'inspect', 'branch', 'verify', 'resolve'], id)
    assert.equal(score, expected, `${id} ${route[2]}`)
    assert.ok(kinds(review).includes(kind), `${id} ${route[2]}: ${kinds(review).join(',')}`)
  }
})

test('S21 reviews reporting the genuine alert as a false positive', () => {
  const { outcomeClass } = walk('S21', [
    's21-open-read', 's21-inspect-sender', 's21-branch-end', 's21-verify-report', 's21-resolve-report',
  ])
  assert.equal(outcomeClass, 'false_positive')
})

test('no S21-S25 review carries an engine event code or a point value', () => {
  const walks = [
    ['S21', ['s21-open-read', 's21-inspect-skip', 's21-branch-spamlink', 's21-verify-block', 's21-resolve-ignore']],
    ['S22', ['s22-open-read', 's22-inspect-skip', 's22-branch-signin', 's22-verify-inmessage', 's22-resolve-continue']],
    ['S23', ['s23-open-read', 's23-inspect-skip', 's23-branch-pay', 's23-verify-inmessage', 's23-resolve-continue']],
    ['S24', ['s24-open-read', 's24-inspect-skip', 's24-branch-upload', 's24-verify-inmessage', 's24-resolve-ignore']],
    ['S25', ['s25-open-read', 's25-inspect-skip', 's25-branch-install', 's25-verify-inmessage', 's25-resolve-continue']],
  ]
  for (const [id, controls] of walks) {
    const { review } = walk(id, controls)
    assert.ok(review.mistakes.length > 0, `${id} should have mistakes to review`)
    const serialised = JSON.stringify(review)
    for (const code of SCORING_EVENT_CODES) {
      assert.ok(!serialised.includes(code), `${id} review leaks ${code}`)
    }
    assert.doesNotMatch(serialised, /points_delta|score_0_10|scoring_text|"points"/)
  }
})

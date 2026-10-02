import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  RENDERED_CONTEXT_NOTE_SCENARIOS,
  ScenarioDefinition,
} from '../src/models/ScenarioDefinition.js'
import {
  loadSourceScenarios,
  loadSyntheticContent,
  loadTaxonomies,
  toScenarioDefinition,
} from '../src/services/scenarioDefinitionImportService.js'

/**
 * SCENARIO-AUDIT-002 (M1) - the learner projection carries no narration a scene does not draw.
 *
 * The client's third-person narration ("A fake support account…", "A spoofed sender…") can
 * state the verdict. `toCandidateJSON` now leaves it out wherever no learner screen renders it.
 * These tests prove the two halves of that: every authored scene is built identically from the
 * projection and from the full stored content, so nothing a learner sees changed; and the
 * narration that could name the verdict is no longer in the payload at all.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))
const { sceneFor } = await import(
  pathToFileURL(path.resolve(HERE, '../../frontend/src/simulation/sceneRegistry.js')).href
)

const taxonomies = await loadTaxonomies()
const { scenarios } = await loadSourceScenarios()
const { byScenario } = await loadSyntheticContent()
const docs = scenarios.map((record) => toScenarioDefinition(record, taxonomies, {
  synthetic: byScenario.get(record.scenario_id),
}).doc)

const payloadOf = (doc, synthetic) => ({
  scenario_id: doc.scenario_id,
  version: doc.version,
  platform: doc.platform,
  synthetic,
  stages: [],
})
const projected = (doc) => new ScenarioDefinition(doc).toCandidateJSON()
const noteOf = (doc) => doc.synthetic.assets
  .find((a) => a.kind === 'message_thread')?.content?.blocks?.find((b) => b.type === 'note')?.text

const VERDICT = /\b(malicious|legitimate|fake|spoof(?:ed|ing)?|scam(?:mer)?|phishing|fraudulent|impersonat\w*)\b/i

test('every scene is built identically from the learner projection and the stored content', () => {
  assert.equal(docs.length, 100)
  for (const doc of docs) {
    const full = sceneFor(payloadOf(doc, doc.synthetic))
    const learner = sceneFor(projected(doc))
    assert.ok(full, `${doc.scenario_id} has no scene`)
    assert.equal(JSON.stringify(learner), JSON.stringify(full), doc.scenario_id)
  }
})

test('the narrator note is sent to exactly the scenes that draw it', () => {
  for (const doc of docs) {
    const drawn = JSON.stringify(sceneFor(payloadOf(doc, doc.synthetic))).includes(noteOf(doc))
    assert.equal(RENDERED_CONTEXT_NOTE_SCENARIOS.has(doc.scenario_id), drawn, doc.scenario_id)
  }
})

test('the projection omits undrawn narration and keeps the rest of every asset', () => {
  for (const doc of docs) {
    const json = projected(doc)
    assert.equal(json.synthetic.prior_context, null, doc.scenario_id)
    assert.equal(json.synthetic.assets.length, doc.synthetic.assets.length, doc.scenario_id)
    for (const [i, asset] of json.synthetic.assets.entries()) {
      const stored = doc.synthetic.assets[i]
      if (asset.kind === 'browser_page') {
        assert.equal('body' in asset.content, false, doc.scenario_id)
        const { body, ...rest } = stored.content
        assert.deepEqual(asset.content, rest, doc.scenario_id)
      } else if (asset.kind === 'message_thread') {
        const notes = asset.content.blocks.filter((b) => b.type === 'note').length
        assert.equal(notes, RENDERED_CONTEXT_NOTE_SCENARIOS.has(doc.scenario_id) ? 1 : 0, doc.scenario_id)
        assert.deepEqual(asset.content.blocks.filter((b) => b.type !== 'note'),
          stored.content.blocks.filter((b) => b.type !== 'note'), doc.scenario_id)
      } else {
        assert.deepEqual(asset.content, stored.content, doc.scenario_id)
      }
    }
  }
})

test('no narration left in a learner payload states a verdict', () => {
  const affected = ['E04', 'E08', 'I01', 'I09', 'I10', 'I12', 'I15', 'I22', 'I24',
    'S01', 'S04', 'S09', 'S14', 'S18', 'S22', 'S24', 'W10', 'W13']
  for (const doc of docs) {
    const json = projected(doc)
    const narration = [
      json.synthetic.prior_context,
      ...json.synthetic.assets.flatMap((a) => (a.content?.blocks ?? [])
        .filter((b) => b.type === 'note').map((b) => b.text)),
      ...json.synthetic.assets.filter((a) => a.kind === 'browser_page').map((a) => a.content.body),
    ].filter(Boolean)
    for (const text of narration) {
      assert.doesNotMatch(text, VERDICT, `${doc.scenario_id}: "${text}"`)
    }
  }
  // The eighteen the audit named no longer carry their narration anywhere in the payload.
  for (const id of affected) {
    const doc = docs.find((d) => d.scenario_id === id)
    const text = JSON.stringify(projected(doc))
    assert.ok(!text.includes(doc.synthetic.prior_context), `${id} still sends its prior context`)
    for (const a of doc.synthetic.assets.filter((x) => x.kind === 'browser_page')) {
      assert.ok(!text.includes(a.content.body), `${id} still sends its branch narration`)
    }
  }
})

test('the stored definition keeps its narration; only the projection changed', () => {
  for (const doc of docs) {
    assert.equal(doc.synthetic.prior_context, byScenario.get(doc.scenario_id).synthetic.prior_context)
    assert.ok(noteOf(doc), doc.scenario_id)
  }
})

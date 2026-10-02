import mongoose from 'mongoose'
import {
  CONTENT_CURRENCY_NOTES,
  CSV_SECTION_MARKER,
  EXPORT_REPORT_SCHEMA_VERSION,
  EXPORT_SCOPE_ATTEMPT,
  EXPORT_SCOPE_LEARNER,
  LEARNER_EXPORT_MAX_ATTEMPTS,
  LEARNER_REPORT_TITLE,
  OFFLINE_MARKER,
  PDF_LINE_CHARS,
  REPORT_PRODUCT_NAME,
  REPORT_TITLE,
  SYNTHETIC_DATA_NOTICE,
  TRAINING_MARKER,
} from '../constants/export.js'
import { Attempt } from '../models/Attempt.js'
import { Candidate } from '../models/Candidate.js'
import { ScenarioDefinition } from '../models/ScenarioDefinition.js'
import { ApiError } from '../utils/ApiError.js'
import { blank, num, text } from '../utils/csvWriter.js'
import { renderPdf, wrapText } from '../utils/pdfWriter.js'
import { getAttemptForAdmin, toProfileDetail } from './attemptViewerService.js'

/**
 * The instructor export report (ADMIN-003).
 *
 * ### One dataset, two renderings
 *
 * `buildAttemptReport()` produces the report MODEL. `reportToCsvRows()` and
 * `reportToPdfDocument()` are pure formatters over that model and read nothing else - no
 * database, no request, no Mongoose document. So the CSV and the PDF cannot disagree
 * about a score, an outcome or a recommendation: they are two presentations of one object,
 * and a test asserts exactly that by building both from a single model.
 *
 * ### It computes nothing
 *
 * The model is assembled from `getAttemptForAdmin()` (ADMIN-002), which is itself built
 * from `buildAttemptResult()` (RESULT-001). Scoring, the missed-threat / false-positive
 * classification, the behaviour breakdown, the path replay, remediation and the
 * comparability gate all arrive already decided. **No score is recomputed here, no
 * taxonomy is re-derived here, and no ScenarioEvent is read here.** The only figures this
 * file produces of its own are sums of values it was given, for a totals row.
 *
 * ### The privacy boundary is inherited, then narrowed
 *
 * Everything in the model came through the ADMIN-002 allowlist, which already excludes the
 * learner's typed rationale, every event field, the seed, the selection metadata and the
 * raw service number. This file narrows further: it names each field it copies, so a field
 * added to the viewer later does not appear in an export until someone puts it here.
 */

const dash = (value) => (value === null || value === undefined || value === '' ? '-' : String(value))

const isoOrNull = (value) => (value ? new Date(value).toISOString() : null)

function durationText(ms) {
  if (ms === null || ms === undefined) return null
  const total = Math.max(Math.round(ms / 1000), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
}

const levelText = (level) => (level ? level.charAt(0).toUpperCase() + level.slice(1) : null)

/** The compact path, as one deterministic line. Steps only - never an event code. */
function pathText(path = []) {
  if (!path.length) return ''
  return path.map((step) => `${step.step}:${step.stage}/${step.action}`).join(' > ')
}

/**
 * Section 6: "clearly mark ... version".
 *
 * The attempt's pinned `content_version` is compared with the version the ACTIVE bank
 * currently carries, so a report from an older bank says so on its face. When the active
 * bank spans more than one version - which DATA-002 forbids but a future fault could
 * produce - the report says the currency is unknown rather than guessing.
 */
export async function contentCurrencyFor(attemptContentVersion) {
  const versions = await ScenarioDefinition.distinct('version', { active: true })
  const current = versions.length === 1 ? versions[0] : null

  if (current === null) {
    return {
      attempt_content_version: attemptContentVersion,
      current_content_version: null,
      is_current: null,
      note: CONTENT_CURRENCY_NOTES.UNKNOWN,
    }
  }
  const isCurrent = current === attemptContentVersion
  return {
    attempt_content_version: attemptContentVersion,
    current_content_version: current,
    is_current: isCurrent,
    note: isCurrent ? CONTENT_CURRENCY_NOTES.CURRENT : CONTENT_CURRENCY_NOTES.SUPERSEDED,
  }
}

/* ------------------------------------------------------------------ *
 * The model
 * ------------------------------------------------------------------ */

/**
 * The whole report for one attempt.
 *
 * `generatedAt` is passed in rather than read from the clock here, so the same report can
 * be rendered twice - once as CSV, once as PDF - carrying the same timestamp, and so the
 * formatters are deterministic under test.
 */
export async function buildAttemptReport(attemptId, {
  generatedAt = new Date(),
  generatedBy = null,
  format = null,
} = {}) {
  const view = await getAttemptForAdmin(attemptId)
  const currency = await contentCurrencyFor(view.attempt.content_version)

  const scenarios = view.scenarios.map((scenario) => (scenario.resolved
    ? {
      ordinal: scenario.ordinal,
      scenario_ref: scenario.scenario_ref,
      platform: scenario.platform,
      platform_label: scenario.platform_label,
      resolved: true,
      status: scenario.status,
      score_0_10: scenario.score_0_10,
      max_score: scenario.max_score,
      outcome_class: scenario.outcome_class,
      outcome_code: scenario.outcome_code,
      disposition: scenario.disposition,
      // ADM-007: from the pinned definition, via ADMIN-002. Instructor-only, like disposition.
      level: scenario.level ?? null,
      military_flag: scenario.military_flag ?? null,
      family_label: scenario.family_label,
      trigger_labels: [...(scenario.trigger_labels ?? [])],
      final_stage: scenario.final_stage,
      duration_ms: scenario.duration_ms,
      resolved_at: isoOrNull(scenario.resolved_at),
      sender: scenario.sender,
      preview: scenario.preview,
      path: (scenario.path ?? []).map((step) => ({ ...step })),
      feedback: scenario.feedback
        ? {
          result: scenario.feedback.result ?? null,
          cues: [...(scenario.feedback.cues ?? [])],
          safe_action: scenario.feedback.safe_action ?? null,
          impact: scenario.feedback.impact ?? null,
          prevention_habit: scenario.feedback.prevention_habit ?? null,
        }
        : null,
    }
    : {
      // An unfinished scenario carries no score, no disposition and no feedback.
      // ADMIN-002 already withholds them; the export does not reintroduce them.
      ordinal: scenario.ordinal,
      scenario_ref: scenario.scenario_ref,
      platform: scenario.platform,
      platform_label: scenario.platform_label,
      resolved: false,
      status: scenario.status,
      current_stage: scenario.current_stage,
      score_0_10: null,
      max_score: scenario.max_score,
    }))

  return {
    report: {
      schema_version: EXPORT_REPORT_SCHEMA_VERSION,
      kind: 'attempt_report',
      scope: EXPORT_SCOPE_ATTEMPT,
      product: REPORT_PRODUCT_NAME,
      title: REPORT_TITLE,
      training_marker: TRAINING_MARKER,
      network_marker: OFFLINE_MARKER,
      synthetic_data_notice: SYNTHETIC_DATA_NOTICE,
      generated_at: new Date(generatedAt).toISOString(),
      generated_by: generatedBy,
      format,
      content_version: view.attempt.content_version,
      taxonomy_version: view.attempt.taxonomy_version,
      trigger_taxonomy_version: view.attempt.trigger_taxonomy_version,
      content_currency: currency,
    },

    attempt: {
      attempt_id: view.attempt.attempt_id,
      learner_display_name: view.attempt.profile?.display_name ?? null,
      service_no_masked: view.attempt.profile?.service_no_masked ?? null,
      profile_id: view.attempt.profile?.profile_id ?? null,
      mode: view.attempt.mode,
      status: view.attempt.status,
      started_at: isoOrNull(view.attempt.started_at),
      completed_at: isoOrNull(view.attempt.completed_at),
      duration_ms: view.attempt.duration_ms,
      scenarios_total: view.attempt.scenarios_total,
      scenarios_resolved: view.attempt.scenarios_resolved,
      result_available: view.attempt.result_available,
      // Null unless the attempt is complete. ADMIN-002 decides this; the export copies it.
      total_score: view.attempt.total_score,
      max_score: view.attempt.max_score,
      resolved_points: view.attempt.resolved_points,
    },

    summary: view.summary
      ? {
        total_score: view.summary.total_score,
        max_score: view.summary.max_score,
        scenarios: view.summary.scenarios,
        handled_safely: view.summary.handled_safely,
        missed_threats: view.summary.missed_threats,
        false_positives: view.summary.false_positives,
        unsafe_handling: view.summary.unsafe_handling,
        duration_ms: view.summary.duration_ms,
      }
      : null,

    platform_coverage: view.platform_coverage.map((row) => ({ ...row })),

    behaviour: {
      by_platform: view.behaviour.by_platform.map((b) => ({ ...b })),
      by_family: view.behaviour.by_family.map((b) => ({ ...b })),
      by_trigger: view.behaviour.by_trigger.map((b) => ({ ...b })),
      by_stage: view.behaviour.by_stage.map((b) => ({ ...b })),
      scope: view.behaviour_scope.scope,
      scenarios_included: view.behaviour_scope.scenarios_included,
      scenarios_total: view.behaviour_scope.scenarios_total,
    },

    scenarios,

    remediation: {
      available: view.remediation.available,
      reason: view.remediation.reason,
      recommendations: view.remediation.recommendations.map((r) => ({
        family_key: r.family_key,
        label: r.label,
        reason: r.reason,
        points: r.points,
        max_points: r.max_points,
        practice_scenarios_available: r.practice_scenarios_available,
      })),
    },

    comparison: { ...view.comparison },
  }
}

/* ------------------------------------------------------------------ *
 * CSV rendering
 * ------------------------------------------------------------------ */

const section = (name) => [[text(CSV_SECTION_MARKER), text(name)]]

const yesNo = (value) => (value === null || value === undefined ? blank() : text(value ? 'yes' : 'no'))

/**
 * The SCENARIOS columns, shared by the attempt and the learner export so one scenario reads
 * the same in both. `level` and `military_flag` (ADM-007) sit after `disposition`, so every
 * column an existing reader indexes by position keeps its place.
 */
const SCENARIO_CSV_COLUMNS = [
  'ordinal', 'scenario_ref', 'platform', 'resolved', 'status',
  'score', 'max_score', 'outcome_class', 'disposition', 'level', 'military_flag',
  'case_family', 'triggers', 'final_stage', 'duration',
  'resolved_at_utc', 'sender', 'preview', 'path_replay',
  'feedback_result', 'feedback_cues', 'feedback_safe_action',
  'feedback_impact', 'feedback_prevention_habit',
]

/** One scenario as CSV cells. An unfinished scenario carries no answer of any kind. */
function scenarioCsvCells(s) {
  if (!s.resolved) {
    const cells = [
      num(s.ordinal), text(s.scenario_ref), text(s.platform_label), text('no'), text(s.status),
      blank(), num(s.max_score),
    ]
    while (cells.length < SCENARIO_CSV_COLUMNS.length) cells.push(blank())
    cells[SCENARIO_CSV_COLUMNS.indexOf('final_stage')] = text(s.current_stage)
    return cells
  }
  return [
    num(s.ordinal), text(s.scenario_ref), text(s.platform_label), text('yes'), text(s.status),
    num(s.score_0_10), num(s.max_score), text(s.outcome_class), text(s.disposition),
    text(s.level), yesNo(s.military_flag),
    text(s.family_label), text(s.trigger_labels.join('; ')), text(s.final_stage),
    text(durationText(s.duration_ms)), text(s.resolved_at), text(s.sender), text(s.preview),
    text(pathText(s.path)),
    text(s.feedback?.result), text((s.feedback?.cues ?? []).join('; ')),
    text(s.feedback?.safe_action), text(s.feedback?.impact), text(s.feedback?.prevention_habit),
  ]
}

/**
 * The sectioned CSV.
 *
 * A single flat table cannot carry a header, five breakdowns, ten scenarios and a
 * remediation list without either repeating everything or losing it. So the file is a
 * sequence of labelled blocks: `#SECTION,<name>`, a header row, its rows, a blank line.
 * Every block is written in a fixed order with fixed columns, so two exports of the same
 * attempt are byte-identical apart from the generated timestamp.
 */
export function reportToCsvRows(model) {
  const { report, attempt, summary, behaviour, scenarios, remediation, comparison } = model
  const rows = []

  rows.push(...section('REPORT'))
  rows.push([text('field'), text('value')])
  for (const [field, value] of [
    ['product', report.product],
    ['report', report.title],
    ['training_marker', report.training_marker],
    ['network_marker', report.network_marker],
    ['data_notice', report.synthetic_data_notice],
    ['report_schema_version', report.schema_version],
    ['export_format', report.format],
    ['generated_at_utc', report.generated_at],
    ['generated_by', report.generated_by],
    ['content_version', report.content_version],
    ['current_content_version', report.content_currency.current_content_version],
    ['content_is_current', report.content_currency.is_current],
    ['content_version_note', report.content_currency.note],
    ['taxonomy_version', report.taxonomy_version],
    ['trigger_taxonomy_version', report.trigger_taxonomy_version],
  ]) {
    rows.push([text(field), typeof value === 'number' ? num(value) : text(value)])
  }
  rows.push([])

  rows.push(...section('ATTEMPT'))
  rows.push([text('field'), text('value')])
  for (const [field, value] of [
    ['attempt_id', attempt.attempt_id],
    ['learner_display_name', attempt.learner_display_name],
    ['service_no_masked', attempt.service_no_masked],
    ['mode', attempt.mode],
    ['status', attempt.status],
    ['started_at_utc', attempt.started_at],
    ['completed_at_utc', attempt.completed_at],
    ['duration', durationText(attempt.duration_ms)],
    ['scenarios_total', attempt.scenarios_total],
    ['scenarios_resolved', attempt.scenarios_resolved],
    ['result_available', attempt.result_available],
    ['total_score', attempt.total_score],
    ['max_score', attempt.max_score],
    ['resolved_points', attempt.resolved_points],
  ]) {
    rows.push([
      text(field),
      value === null || value === undefined
        ? blank()
        : (typeof value === 'number' ? num(value) : text(value)),
    ])
  }
  rows.push([])

  rows.push(...section('OUTCOME_SUMMARY'))
  rows.push([text('metric'), text('value')])
  if (summary) {
    for (const [metric, value] of [
      ['total_score', summary.total_score],
      ['max_score', summary.max_score],
      ['scenarios', summary.scenarios],
      ['handled_safely', summary.handled_safely],
      ['missed_threats', summary.missed_threats],
      ['false_positives', summary.false_positives],
      ['unsafe_handling', summary.unsafe_handling],
    ]) rows.push([text(metric), num(value)])
    rows.push([text('duration'), text(durationText(summary.duration_ms))])
  } else {
    rows.push([text('status'), text('not available - the attempt is not complete')])
  }
  rows.push([])

  rows.push(...section('PLATFORM_COVERAGE'))
  rows.push([text('platform'), text('label'), text('scenarios'), text('resolved')])
  for (const row of model.platform_coverage) {
    rows.push([text(row.platform), text(row.label), num(row.scenarios), num(row.resolved)])
  }
  rows.push([])

  const breakdown = (name, buckets) => {
    rows.push(...section(name))
    rows.push([
      text('key'), text('label'), text('scenarios'), text('points'), text('max_points'),
      text('missed_threats'), text('false_positives'),
    ])
    for (const b of buckets) {
      rows.push([
        text(b.key), text(b.label), num(b.scenarios), num(b.points), num(b.max_points),
        num(b.missed_threats), num(b.false_positives),
      ])
    }
    rows.push([])
  }

  rows.push(...section('BEHAVIOUR_SCOPE'))
  rows.push([text('scope'), text('scenarios_included'), text('scenarios_total')])
  rows.push([text(behaviour.scope), num(behaviour.scenarios_included), num(behaviour.scenarios_total)])
  rows.push([])

  breakdown('BEHAVIOUR_BY_PLATFORM', behaviour.by_platform)
  breakdown('BEHAVIOUR_BY_CASE_FAMILY', behaviour.by_family)
  breakdown('BEHAVIOUR_BY_TRIGGER', behaviour.by_trigger)

  rows.push(...section('BEHAVIOUR_BY_ACTION_STAGE'))
  rows.push([text('stage'), text('scenarios_reached'), text('constructive_actions')])
  for (const stage of behaviour.by_stage) {
    rows.push([text(stage.stage), num(stage.scenarios_reached), num(stage.constructive_actions)])
  }
  rows.push([])

  rows.push(...section('SCENARIOS'))
  rows.push(SCENARIO_CSV_COLUMNS.map(text))
  for (const s of scenarios) rows.push(scenarioCsvCells(s))
  rows.push([])

  rows.push(...section('REMEDIATION'))
  rows.push([
    text('available'), text('reason'), text('family_key'), text('family'),
    text('why'), text('points'), text('max_points'), text('practice_scenarios_available'),
  ])
  if (remediation.recommendations.length) {
    for (const r of remediation.recommendations) {
      rows.push([
        text('yes'), blank(), text(r.family_key), text(r.label), text(r.reason),
        num(r.points), num(r.max_points), num(r.practice_scenarios_available),
      ])
    }
  } else {
    rows.push([text('no'), text(remediation.reason ?? 'no weak family identified'),
      blank(), blank(), blank(), blank(), blank(), blank()])
  }
  rows.push([])

  rows.push(...section('COMPARISON'))
  rows.push([text('field'), text('value')])
  rows.push([text('available'), text(comparison.available ? 'yes' : 'no')])
  if (comparison.available) {
    rows.push([text('previous_attempt_id'), text(comparison.previous_attempt_id)])
    rows.push([text('previous_total_score'), num(comparison.previous_total_score)])
    rows.push([text('previous_completed_at_utc'), text(isoOrNull(comparison.previous_completed_at))])
    rows.push([text('delta'), num(comparison.delta)])
  } else {
    rows.push([text('reason'), text(comparison.reason)])
    if (comparison.incomparable_on) {
      rows.push([text('incomparable_on'), text(comparison.incomparable_on.join('; '))])
    }
  }

  return rows
}

/* ------------------------------------------------------------------ *
 * PDF rendering
 * ------------------------------------------------------------------ */

const rule = () => ({ text: '-'.repeat(PDF_LINE_CHARS) })
const blankLine = () => ({ text: '' })

/** Wrapped body text as one or more lines. Guarantees nothing is clipped. */
const para = (value, indent = '') => wrapText(value, PDF_LINE_CHARS - indent.length)
  .map((line) => ({ text: `${indent}${line}` }))

/** `key ..... value`, with the value wrapped under a hanging indent. */
function keyValue(key, value, keyWidth = 26) {
  const label = `${key}`.padEnd(keyWidth, ' ').slice(0, keyWidth)
  const width = PDF_LINE_CHARS - keyWidth - 2
  const wrapped = wrapText(dash(value), width)
  return wrapped.map((line, index) => ({
    text: index === 0 ? `${label}  ${line}` : `${' '.repeat(keyWidth)}  ${line}`,
  }))
}

/** A fixed-width table row, truncated per column so a long value cannot break alignment. */
function tableRow(cells, widths, { bold = false } = {}) {
  const text_ = cells
    .map((cell, i) => {
      const width = widths[i]
      const value = dash(cell)
      return value.length > width ? `${value.slice(0, Math.max(width - 1, 1))}~` : value.padEnd(width)
    })
    .join(' ')
    .trimEnd()
  return { text: text_.slice(0, PDF_LINE_CHARS), bold }
}

/**
 * The PDF rendering of the same model.
 *
 * Every page repeats the training marker, the offline marker and the content version, so
 * a page separated from the rest of the report still says what it is. The header block is
 * given to the writer rather than emitted per page here, so pagination cannot drop it.
 */
export function reportToPdfDocument(model) {
  const { report, attempt } = model

  const header = [
    { text: `${report.training_marker}  |  ${report.network_marker}  |  `
      + `CONTENT VERSION ${report.content_version}  |  SYNTHETIC DATA`, bold: true },
    { text: `${report.product} - ${report.title}` },
  ]

  const lines = []
  const heading = (title) => {
    lines.push(blankLine(), { text: title.toUpperCase(), bold: true }, rule())
  }

  // --- cover block ---------------------------------------------------
  lines.push(blankLine())
  lines.push({ text: report.title.toUpperCase(), bold: true })
  lines.push({ text: report.product })
  lines.push(blankLine())
  lines.push({ text: `*** ${report.training_marker} - ${report.network_marker} ***`, bold: true })
  lines.push(...para(report.synthetic_data_notice))
  lines.push(blankLine())
  lines.push(...keyValue('Generated (UTC)', report.generated_at))
  lines.push(...keyValue('Generated by', report.generated_by))
  lines.push(...keyValue('Export format', (report.format ?? 'pdf').toUpperCase()))
  lines.push(...keyValue('Report schema version', report.schema_version))
  lines.push(...keyValue('Content version', report.content_version))
  lines.push(...keyValue('Current content version', report.content_currency.current_content_version))
  lines.push(...keyValue('Taxonomy version', report.taxonomy_version))
  lines.push(...keyValue('Trigger taxonomy version', report.trigger_taxonomy_version))
  lines.push(...para(report.content_currency.note))

  attemptPdfSections(model, lines, heading)

  lines.push(blankLine(), rule())
  lines.push(...para(`END OF REPORT - ${report.training_marker} - ${report.network_marker}`))

  return renderPdf({
    title: `${report.title} - ${attempt.attempt_id}`,
    subject: `${report.training_marker} / ${report.network_marker} / `
      + `content version ${report.content_version}`,
    createdAt: report.generated_at,
    header,
    lines,
    footerLabel: `${report.training_marker} - ${report.network_marker}`,
  })
}

/**
 * The body of one attempt - attempt, outcome, behaviour, scenarios, remediation and
 * comparison - appended to `lines`. Shared by the attempt PDF and the learner PDF, so one
 * attempt reads identically in both.
 */
function attemptPdfSections(model, lines, heading) {
  const { attempt, summary, behaviour, scenarios, remediation, comparison } = model

  // --- attempt -------------------------------------------------------
  heading('Attempt')
  lines.push(...keyValue('Attempt id', attempt.attempt_id))
  lines.push(...keyValue('Learner', attempt.learner_display_name))
  lines.push(...keyValue('Service number', attempt.service_no_masked))
  lines.push(...keyValue('Mode', attempt.mode))
  lines.push(...keyValue('Status', attempt.status))
  lines.push(...keyValue('Started (UTC)', attempt.started_at))
  lines.push(...keyValue('Completed (UTC)', attempt.completed_at))
  lines.push(...keyValue('Duration', durationText(attempt.duration_ms)))
  lines.push(...keyValue('Scenarios resolved',
    `${attempt.scenarios_resolved} of ${attempt.scenarios_total}`))

  if (attempt.result_available) {
    lines.push(...keyValue('TOTAL SCORE', `${attempt.total_score} / ${attempt.max_score}`))
  } else {
    lines.push(...keyValue('TOTAL SCORE', 'not available - attempt incomplete'))
    lines.push(...keyValue('Points from resolved', `${attempt.resolved_points} (partial)`))
  }

  // --- outcome summary -----------------------------------------------
  heading('Outcome summary')
  if (summary) {
    lines.push(...keyValue('Handled safely', summary.handled_safely))
    lines.push(...keyValue('Missed threats', summary.missed_threats))
    lines.push(...keyValue('False positives', summary.false_positives))
    lines.push(...keyValue('Unsafe handling', summary.unsafe_handling))
  } else {
    lines.push(...para('Not available: the attempt is not complete. '
      + 'No final outcome is reported for an unfinished attempt.'))
  }

  // --- behaviour ------------------------------------------------------
  heading('Behaviour breakdown')
  lines.push(...keyValue('Scope',
    `${behaviour.scope} (${behaviour.scenarios_included} of ${behaviour.scenarios_total} scenarios)`))

  const bucketWidths = [30, 9, 7, 7, 8, 8]
  const bucketHeader = ['Area', 'Scenarios', 'Points', 'Max', 'Missed', 'FalsePos']
  const bucketTable = (title, buckets) => {
    lines.push(blankLine(), { text: title, bold: true })
    lines.push(tableRow(bucketHeader, bucketWidths, { bold: true }))
    if (!buckets.length) lines.push({ text: '  (no data)' })
    for (const b of buckets) {
      lines.push(tableRow([
        b.label, b.scenarios, b.points, b.max_points, b.missed_threats, b.false_positives,
      ], bucketWidths))
    }
  }
  bucketTable('By platform', behaviour.by_platform)
  bucketTable('By case family', behaviour.by_family)
  bucketTable('By persuasion trigger', behaviour.by_trigger)

  lines.push(blankLine(), { text: 'By decision stage', bold: true })
  const stageWidths = [20, 18, 22]
  lines.push(tableRow(['Stage', 'Scenarios reached', 'Constructive actions'], stageWidths, { bold: true }))
  for (const stage of behaviour.by_stage) {
    lines.push(tableRow([stage.stage, stage.scenarios_reached, stage.constructive_actions], stageWidths))
  }

  // --- scenarios ------------------------------------------------------
  lines.push({ text: '', pageBreak: true })
  heading('Scenarios')
  for (const s of scenarios) {
    lines.push(blankLine())
    if (!s.resolved) {
      lines.push({ text: `${String(s.ordinal).padStart(2, ' ')}. ${s.platform_label} `
        + `- ${s.scenario_ref} - NOT RESOLVED (${s.status}, at stage "${s.current_stage}")`, bold: true })
      lines.push(...para('No score, outcome, classification or feedback is reported for a '
        + 'scenario the learner has not finished.', '    '))
      continue
    }

    lines.push({ text: `${String(s.ordinal).padStart(2, ' ')}. ${s.platform_label} `
      + `- ${s.scenario_ref} - ${s.score_0_10}/${s.max_score} - `
      + `${s.outcome_class} (${s.disposition})`, bold: true })
    lines.push(...keyValue('    Difficulty', levelText(s.level), 26))
    lines.push(...keyValue('    Military context', s.military_flag === null || s.military_flag === undefined
      ? null : (s.military_flag ? 'yes' : 'no'), 26))
    lines.push(...keyValue('    Case family', s.family_label, 26))
    lines.push(...keyValue('    Triggers', s.trigger_labels.join(', '), 26))
    lines.push(...keyValue('    Final action', `${s.outcome_code} at "${s.final_stage}"`, 26))
    lines.push(...keyValue('    Duration', durationText(s.duration_ms), 26))
    lines.push(...keyValue('    Item as shown', [s.sender, s.preview].filter(Boolean).join(' - '), 26))
    lines.push(...keyValue('    Path replay', pathText(s.path), 26))
    if (s.feedback) {
      lines.push(...keyValue('    What it was', s.feedback.result, 26))
      lines.push(...keyValue('    Cues', s.feedback.cues.join(' | '), 26))
      lines.push(...keyValue('    Safe response', s.feedback.safe_action, 26))
      lines.push(...keyValue('    Likely impact', s.feedback.impact, 26))
      lines.push(...keyValue('    Habit', s.feedback.prevention_habit, 26))
    }
  }

  // --- remediation ----------------------------------------------------
  heading('Remediation')
  if (remediation.recommendations.length) {
    lines.push(...para('Targeted practice is recommended in these case families. '
      + 'Families are named rather than individual scenarios, so the report carries no '
      + 'answer key for scenarios the learner may meet again.'))
    for (const r of remediation.recommendations) {
      lines.push(blankLine())
      lines.push({ text: `  - ${r.label}`, bold: true })
      lines.push(...para(r.reason, '    '))
      lines.push(...keyValue('    Points in this family', `${r.points} of ${r.max_points}`, 26))
      lines.push(...keyValue('    Practice available', `${r.practice_scenarios_available} scenarios`, 26))
    }
  } else {
    lines.push(...para(`Not available: ${remediation.reason ?? 'no weak family was identified.'}`))
  }

  // --- comparison -----------------------------------------------------
  heading('Comparison with previous attempt')
  if (comparison.available) {
    lines.push(...keyValue('Previous attempt', comparison.previous_attempt_id))
    lines.push(...keyValue('Previous total', `${comparison.previous_total_score} / ${attempt.max_score}`))
    lines.push(...keyValue('Previous completed (UTC)', isoOrNull(comparison.previous_completed_at)))
    lines.push(...keyValue('Change', `${comparison.delta > 0 ? '+' : ''}${comparison.delta}`))
  } else {
    lines.push(...para(`Not available: ${comparison.reason}.`))
    if (comparison.incomparable_on) {
      lines.push(...keyValue('Differs on', comparison.incomparable_on.join(', ')))
    }
    lines.push(...para('A comparison is offered only when the mode and the content and '
      + 'taxonomy versions of both attempts match.'))
  }
}

/* ------------------------------------------------------------------ *
 * ADM-007 - the learner report
 * ------------------------------------------------------------------ */

/**
 * Every COMPLETED attempt of one learner, for the instructor.
 *
 * It is a collection of attempt reports, not a new projection: each attempt is built by
 * `buildAttemptReport()` exactly as the attempt export builds it, so a scenario, a score or
 * a recommendation reads the same in both files. The learner header adds only the profile
 * summary ADMIN-002 already publishes - display name and MASKED service number - plus the
 * archive state and counts. The raw service number is never selected.
 *
 * Only completed attempts are included: an unfinished one has no total and no outcome, and
 * a reset one never will. They are counted in the header so the instructor knows they exist.
 */
export async function buildLearnerReport(profileId, {
  generatedAt = new Date(),
  generatedBy = null,
  format = null,
} = {}) {
  if (!mongoose.isValidObjectId(profileId)) {
    throw new ApiError(404, 'PROFILE_NOT_FOUND', 'Learner not found.')
  }
  const profile = await Candidate.findById(profileId)
    .select('name service_no_masked identifierNormalised createdAt last_seen_at archived archived_at')
    .catch(() => null)
  if (!profile) throw new ApiError(404, 'PROFILE_NOT_FOUND', 'Learner not found.')

  const [completed, attemptsStarted] = await Promise.all([
    Attempt.find({ profile_id: profile._id, status: 'completed' })
      .select('_id')
      .sort({ completed_at: 1, _id: 1 })
      .limit(LEARNER_EXPORT_MAX_ATTEMPTS + 1),
    Attempt.countDocuments({ profile_id: profile._id }),
  ])

  if (!completed.length) {
    throw new ApiError(409, 'NO_COMPLETED_ATTEMPTS',
      'This learner has no completed attempt to export.')
  }
  if (completed.length > LEARNER_EXPORT_MAX_ATTEMPTS) {
    throw new ApiError(422, 'EXPORT_TOO_LARGE',
      `A learner export carries at most ${LEARNER_EXPORT_MAX_ATTEMPTS} completed attempts.`)
  }

  // Sequential on purpose: each report is several bounded queries, and a learner export is
  // an occasional instructor action, not a hot path worth fanning out.
  const attempts = []
  for (const attempt of completed) {
    attempts.push(await buildAttemptReport(attempt._id, { generatedAt, generatedBy, format }))
  }

  const scores = attempts.map((a) => a.attempt.total_score)
  const versions = [...new Set(attempts.map((a) => a.report.content_version))]
  const learner = toProfileDetail(profile)

  return {
    report: {
      schema_version: EXPORT_REPORT_SCHEMA_VERSION,
      kind: 'learner_report',
      scope: EXPORT_SCOPE_LEARNER,
      product: REPORT_PRODUCT_NAME,
      title: LEARNER_REPORT_TITLE,
      training_marker: TRAINING_MARKER,
      network_marker: OFFLINE_MARKER,
      synthetic_data_notice: SYNTHETIC_DATA_NOTICE,
      generated_at: new Date(generatedAt).toISOString(),
      generated_by: generatedBy,
      format,
      content_versions: versions,
      current_content_version: attempts[attempts.length - 1].report.content_currency
        .current_content_version,
    },

    learner: {
      profile_id: learner.profile_id,
      display_name: learner.display_name,
      service_no_masked: learner.service_no_masked,
      created_at: isoOrNull(learner.created_at),
      last_seen_at: isoOrNull(learner.last_seen_at),
      archived: profile.archived === true,
      archived_at: isoOrNull(profile.archived_at),
      attempts_started: attemptsStarted,
      attempts_completed: attempts.length,
      attempts_not_completed: attemptsStarted - attempts.length,
      max_score: attempts[0].attempt.max_score,
      best_score: Math.max(...scores),
      latest_score: scores[scores.length - 1],
      first_completed_at: attempts[0].attempt.completed_at,
      latest_completed_at: attempts[attempts.length - 1].attempt.completed_at,
    },

    attempts,
  }
}

/** Two leading cells naming the attempt a row belongs to, in every per-attempt block. */
const attemptKey = (index, model) => [num(index + 1), text(model.attempt.attempt_id)]

const fieldRows = (pairs) => pairs.map(([field, value]) => [
  text(field), typeof value === 'number' ? num(value) : text(value),
])

/**
 * The learner CSV.
 *
 * Same sectioned layout as the attempt CSV, but each per-attempt block is ONE table across
 * every attempt, led by `attempt_no` and `attempt_id`. That is what makes it usable in a
 * spreadsheet: filter the SCENARIOS block by attempt, platform, difficulty or outcome
 * without stitching several files together.
 */
export function learnerReportToCsvRows(model) {
  const { report, learner, attempts } = model
  const rows = []

  rows.push(...section('REPORT'))
  rows.push([text('field'), text('value')])
  rows.push(...fieldRows([
    ['product', report.product],
    ['report', report.title],
    ['training_marker', report.training_marker],
    ['network_marker', report.network_marker],
    ['data_notice', report.synthetic_data_notice],
    ['report_schema_version', report.schema_version],
    ['export_scope', report.scope],
    ['export_format', report.format],
    ['generated_at_utc', report.generated_at],
    ['generated_by', report.generated_by],
    ['content_versions', report.content_versions.join('; ')],
    ['current_content_version', report.current_content_version],
  ]))
  rows.push([])

  rows.push(...section('LEARNER'))
  rows.push([text('field'), text('value')])
  rows.push(...fieldRows([
    ['profile_id', learner.profile_id],
    ['learner_display_name', learner.display_name],
    ['service_no_masked', learner.service_no_masked],
    ['profile_created_at_utc', learner.created_at],
    ['last_seen_at_utc', learner.last_seen_at],
    ['archived', learner.archived ? 'yes' : 'no'],
    ['archived_at_utc', learner.archived_at],
    ['attempts_started', learner.attempts_started],
    ['attempts_completed', learner.attempts_completed],
    ['attempts_not_completed', learner.attempts_not_completed],
    ['best_score', learner.best_score],
    ['latest_score', learner.latest_score],
    ['max_score', learner.max_score],
    ['first_completed_at_utc', learner.first_completed_at],
    ['latest_completed_at_utc', learner.latest_completed_at],
  ]))
  rows.push([])

  rows.push(...section('ATTEMPTS'))
  rows.push([
    'attempt_no', 'attempt_id', 'mode', 'status', 'started_at_utc', 'completed_at_utc',
    'duration', 'total_score', 'max_score', 'handled_safely', 'missed_threats',
    'false_positives', 'unsafe_handling', 'content_version', 'content_is_current',
    'change_from_previous', 'comparison_note',
  ].map(text))
  attempts.forEach((m, i) => {
    const { attempt, summary, report: r, comparison } = m
    rows.push([
      ...attemptKey(i, m), text(attempt.mode), text(attempt.status),
      text(attempt.started_at), text(attempt.completed_at), text(durationText(attempt.duration_ms)),
      num(attempt.total_score), num(attempt.max_score),
      num(summary?.handled_safely), num(summary?.missed_threats),
      num(summary?.false_positives), num(summary?.unsafe_handling),
      text(r.content_version), yesNo(r.content_currency.is_current),
      comparison.available ? num(comparison.delta) : blank(),
      comparison.available ? blank() : text(comparison.reason),
    ])
  })
  rows.push([])

  rows.push(...section('SCENARIOS'))
  rows.push([text('attempt_no'), text('attempt_id'), ...SCENARIO_CSV_COLUMNS.map(text)])
  attempts.forEach((m, i) => {
    for (const s of m.scenarios) rows.push([...attemptKey(i, m), ...scenarioCsvCells(s)])
  })
  rows.push([])

  const breakdown = (name, pick) => {
    rows.push(...section(name))
    rows.push([
      'attempt_no', 'attempt_id', 'key', 'label', 'scenarios', 'points', 'max_points',
      'missed_threats', 'false_positives',
    ].map(text))
    attempts.forEach((m, i) => {
      for (const b of pick(m.behaviour)) {
        rows.push([
          ...attemptKey(i, m), text(b.key), text(b.label), num(b.scenarios), num(b.points),
          num(b.max_points), num(b.missed_threats), num(b.false_positives),
        ])
      }
    })
    rows.push([])
  }
  breakdown('BEHAVIOUR_BY_PLATFORM', (b) => b.by_platform)
  breakdown('BEHAVIOUR_BY_CASE_FAMILY', (b) => b.by_family)
  breakdown('BEHAVIOUR_BY_TRIGGER', (b) => b.by_trigger)

  rows.push(...section('BEHAVIOUR_BY_ACTION_STAGE'))
  rows.push(['attempt_no', 'attempt_id', 'stage', 'scenarios_reached', 'constructive_actions'].map(text))
  attempts.forEach((m, i) => {
    for (const stage of m.behaviour.by_stage) {
      rows.push([
        ...attemptKey(i, m), text(stage.stage), num(stage.scenarios_reached),
        num(stage.constructive_actions),
      ])
    }
  })
  rows.push([])

  rows.push(...section('REMEDIATION'))
  rows.push([
    'attempt_no', 'attempt_id', 'available', 'reason', 'family_key', 'family', 'why',
    'points', 'max_points', 'practice_scenarios_available',
  ].map(text))
  attempts.forEach((m, i) => {
    const { remediation } = m
    if (!remediation.recommendations.length) {
      rows.push([...attemptKey(i, m), text('no'),
        text(remediation.reason ?? 'no weak family identified'),
        blank(), blank(), blank(), blank(), blank(), blank()])
      return
    }
    for (const r of remediation.recommendations) {
      rows.push([
        ...attemptKey(i, m), text('yes'), blank(), text(r.family_key), text(r.label),
        text(r.reason), num(r.points), num(r.max_points), num(r.practice_scenarios_available),
      ])
    }
  })

  return rows
}

/**
 * The learner PDF: a cover, the learner, an attempts table, then each attempt in full -
 * the same sections the attempt PDF prints, from the same model - starting on a new page.
 */
export function learnerReportToPdfDocument(model) {
  const { report, learner, attempts } = model
  const versions = report.content_versions.join(', ')

  const header = [
    { text: `${report.training_marker}  |  ${report.network_marker}  |  `
      + `CONTENT VERSION ${versions}  |  SYNTHETIC DATA`, bold: true },
    { text: `${report.product} - ${report.title}` },
  ]

  const lines = []
  const heading = (title) => {
    lines.push(blankLine(), { text: title.toUpperCase(), bold: true }, rule())
  }

  lines.push(blankLine())
  lines.push({ text: report.title.toUpperCase(), bold: true })
  lines.push({ text: report.product })
  lines.push(blankLine())
  lines.push({ text: `*** ${report.training_marker} - ${report.network_marker} ***`, bold: true })
  lines.push(...para(report.synthetic_data_notice))
  lines.push(blankLine())
  lines.push(...keyValue('Generated (UTC)', report.generated_at))
  lines.push(...keyValue('Generated by', report.generated_by))
  lines.push(...keyValue('Export format', (report.format ?? 'pdf').toUpperCase()))
  lines.push(...keyValue('Report schema version', report.schema_version))
  lines.push(...keyValue('Content version(s)', versions))
  lines.push(...keyValue('Current content version', report.current_content_version))

  heading('Learner')
  lines.push(...keyValue('Learner', learner.display_name))
  lines.push(...keyValue('Service number', learner.service_no_masked))
  lines.push(...keyValue('Profile id', learner.profile_id))
  lines.push(...keyValue('Profile created (UTC)', learner.created_at))
  lines.push(...keyValue('Last seen (UTC)', learner.last_seen_at))
  lines.push(...keyValue('Archived', learner.archived
    ? `yes${learner.archived_at ? ` (${learner.archived_at})` : ''}` : 'no'))
  lines.push(...keyValue('Attempts started', learner.attempts_started))
  lines.push(...keyValue('Attempts completed', learner.attempts_completed))
  lines.push(...keyValue('Best score', `${learner.best_score} / ${learner.max_score}`))
  lines.push(...keyValue('Latest score', `${learner.latest_score} / ${learner.max_score}`))
  if (learner.attempts_not_completed > 0) {
    lines.push(...para(`${learner.attempts_not_completed} attempt(s) not completed are not `
      + 'included: an unfinished or reset attempt has no total and no outcome.'))
  }

  heading('Attempts')
  const widths = [3, 24, 10, 24, 7, 7, 8]
  lines.push(tableRow(['#', 'Attempt id', 'Mode', 'Completed (UTC)', 'Score', 'Missed', 'FalsePos'],
    widths, { bold: true }))
  attempts.forEach((m, i) => {
    lines.push(tableRow([
      i + 1, m.attempt.attempt_id, m.attempt.mode, m.attempt.completed_at,
      `${m.attempt.total_score}/${m.attempt.max_score}`,
      m.summary?.missed_threats, m.summary?.false_positives,
    ], widths))
  })

  attempts.forEach((m, i) => {
    lines.push({ text: '', pageBreak: true })
    lines.push({ text: `ATTEMPT ${i + 1} OF ${attempts.length} - CONTENT VERSION `
      + `${m.report.content_version}`, bold: true })
    lines.push(...para(m.report.content_currency.note))
    attemptPdfSections(m, lines, heading)
  })

  lines.push(blankLine(), rule())
  lines.push(...para(`END OF REPORT - ${report.training_marker} - ${report.network_marker}`))

  return renderPdf({
    title: `${report.title} - ${learner.profile_id}`,
    subject: `${report.training_marker} / ${report.network_marker} / `
      + `content version ${versions}`,
    createdAt: report.generated_at,
    header,
    lines,
    footerLabel: `${report.training_marker} - ${report.network_marker}`,
  })
}

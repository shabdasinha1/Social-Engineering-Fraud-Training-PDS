import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ARTIFACT_ID_PATTERN,
  CSV_BOM,
  OFFLINE_MARKER,
  PDF_LINE_CHARS,
  TRAINING_MARKER,
} from '../src/constants/export.js'
import {
  escapeCell,
  looksLikeFormula,
  num,
  text,
  toCsv,
  toCsvRow,
} from '../src/utils/csvWriter.js'
import { pdfDate, renderPdf, toWinAnsi, wrapText } from '../src/utils/pdfWriter.js'
import { reportToCsvRows, reportToPdfDocument } from '../src/services/exportReportService.js'
import {
  artifactFilename,
  artifactPathFor,
  assertSafeArtifactId,
  newArtifactId,
  parseArtifactFilename,
  takeExportRequest,
} from '../src/services/exportService.js'

/**
 * ADMIN-003 - the export writers, the report formatters and the path boundary, with no
 * database and no filesystem.
 *
 * Three things are decided entirely by the arguments, so they are proven where a failure
 * is unambiguous: whether a CSV cell can execute in a spreadsheet, whether a PDF is
 * structurally a PDF, and whether anything a client sends can name a file. The HTTP,
 * audit and filesystem behaviour is proven separately in `exportApi.test.js`.
 */

const rejects = (fn, code) => {
  try {
    fn()
    assert.fail(`expected ${code}`)
  } catch (error) {
    assert.equal(error.code, code, `expected ${code}, got ${error.code}: ${error.message}`)
    return error
  }
  return null
}

/* ------------------------------------------------------------------ *
 * 1-8  CSV writing
 * ------------------------------------------------------------------ */

test('a plain value needs no quoting', () => {
  assert.equal(escapeCell(text('WhatsApp')), 'WhatsApp')
  assert.equal(escapeCell(num(7)), '7')
  assert.equal(escapeCell(num(0)), '0')
})

test('commas, quotes and newlines are escaped per RFC 4180', () => {
  assert.equal(escapeCell(text('a,b')), '"a,b"')
  assert.equal(escapeCell(text('say "hello"')), '"say ""hello"""')
  assert.equal(escapeCell(text('line1\nline2')), '"line1\nline2"')
  assert.equal(escapeCell(text('line1\r\nline2')), '"line1\r\nline2"')
  assert.equal(escapeCell(text('  padded  ')), '"  padded  "')
})

test('a null or undefined cell is empty, never the string "null"', () => {
  assert.equal(escapeCell(text(null)), '')
  assert.equal(escapeCell(text(undefined)), '')
  assert.equal(escapeCell(num(null)), '')
})

test('formula lead characters are detected on the raw value', () => {
  for (const value of ['=1+1', '+1', '-1', '@SUM(A1)', '\tcmd', '\rcmd']) {
    assert.ok(looksLikeFormula(value), `${JSON.stringify(value)} should be flagged`)
  }
  for (const value of ['WhatsApp', '7', 'a-b', 'e=mc2', '']) {
    assert.ok(!looksLikeFormula(value), `${JSON.stringify(value)} should not be flagged`)
  }
})

test('a text cell that looks like a formula is neutralised', () => {
  assert.equal(escapeCell(text('=cmd|"/c calc"!A1')), '"\'=cmd|""/c calc""!A1"')
  assert.equal(escapeCell(text('@SUM(1+1)')), "'@SUM(1+1)")
  assert.equal(escapeCell(text('-2+3+cmd')), "'-2+3+cmd")
  // The apostrophe is what a spreadsheet reads as "literal", so it must be present.
  assert.ok(escapeCell(text('=HYPERLINK("http://x")')).includes("'="))
})

test('a NUMBER is never neutralised - a negative score stays a number', () => {
  assert.equal(escapeCell(num(-3)), '-3')
  assert.equal(escapeCell(num(-0.5)), '-0.5')
  assert.ok(!escapeCell(num(-3)).includes("'"), 'a numeric cell must not be turned into text')
})

test('a row joins with commas and a document ends with CRLF', () => {
  assert.equal(toCsvRow([text('a'), num(1), text('b,c')]), 'a,1,"b,c"')
  assert.equal(toCsv([[text('a')], [text('b')]], { bom: false }), 'a\r\nb\r\n')
})

test('the document carries a UTF-8 BOM so Excel decodes it correctly', () => {
  const csv = toCsv([[text('•••4356')]])
  assert.ok(csv.startsWith(CSV_BOM))
  assert.ok(csv.includes('•••4356'))
})

/* ------------------------------------------------------------------ *
 * 9-15  PDF writing
 * ------------------------------------------------------------------ */

test('text is wrapped to the page width and never exceeds it', () => {
  const long = 'The learner opened the notification and then verified through the trusted '
    + 'directory before reporting the item as required by the standing instruction.'
  for (const line of wrapText(long)) {
    assert.ok(line.length <= PDF_LINE_CHARS, `line of ${line.length} exceeds ${PDF_LINE_CHARS}`)
  }
  assert.ok(wrapText(long).length > 1, 'a long paragraph should wrap')
})

test('a single unbroken token longer than a line is hard-split, not clipped', () => {
  const token = 'A'.repeat(PDF_LINE_CHARS * 2 + 7)
  const lines = wrapText(token)
  assert.ok(lines.every((line) => line.length <= PDF_LINE_CHARS))
  assert.equal(lines.join(''), token, 'no character may be dropped')
})

test('WinAnsi encoding maps report punctuation and escapes PDF delimiters', () => {
  assert.equal(toWinAnsi('abc').toString('latin1'), 'abc')
  assert.equal(toWinAnsi('•').toString('latin1'), '\x95')
  assert.equal(toWinAnsi('\u2013\u2019\u2026').toString('latin1'), '\x96\x92\x85')
  // A ')' inside scenario prose would otherwise close the string and corrupt every offset.
  assert.equal(toWinAnsi('a(b)c\\d').toString('latin1'), 'a\\(b\\)c\\\\d')
  // Anything with no WinAnsi glyph substitutes rather than failing the whole export.
  assert.equal(toWinAnsi('\u4e2d').toString('latin1'), '?')
})

test('the PDF date is UTC and machine-independent', () => {
  assert.equal(pdfDate('2026-09-07T12:00:00.000Z'), 'D:20260907120000Z')
})

test('the rendered file is structurally a PDF', () => {
  const { buffer, pages } = renderPdf({
    title: 'T', subject: 'S', createdAt: '2026-09-07T12:00:00.000Z',
    header: [{ text: 'HEADER', bold: true }],
    lines: Array.from({ length: 400 }, (_, i) => ({ text: `line ${i}` })),
    footerLabel: 'FOOT',
  })
  const body = buffer.toString('latin1')

  assert.ok(body.startsWith('%PDF-1.4'), 'missing the PDF signature')
  assert.ok(body.endsWith('%%EOF\n'), 'missing the EOF marker')
  assert.ok(body.includes('/Type /Catalog'))
  assert.ok(body.includes('/Type /Pages'))
  assert.ok(body.includes('/Type /Page '))
  assert.ok(body.includes('/BaseFont /Courier'))
  assert.ok(pages > 1, 'four hundred lines should paginate')
  assert.ok(body.includes(`/Count ${pages}`))

  // The cross-reference offsets must actually point at their objects.
  const startxref = Number(body.match(/startxref\n(\d+)\n%%EOF/)[1])
  assert.ok(body.slice(startxref).startsWith('xref\n'), 'startxref does not point at the table')
  for (const [, offset, index] of [...body.matchAll(/^(\d{10}) 00000 n $/gm)]
    .map((m, i) => [m, Number(m[1]), i + 1])) {
    assert.ok(body.slice(offset).startsWith(`${index} 0 obj`),
      `object ${index} is not at its recorded offset`)
  }
})

test('the PDF fetches nothing and executes nothing', () => {
  const { buffer } = renderPdf({
    title: 'T', createdAt: '2026-09-07T12:00:00.000Z',
    lines: [{ text: 'body' }],
  })
  const body = buffer.toString('latin1')
  for (const marker of ['/JavaScript', '/JS', '/Launch', '/URI', '/EmbeddedFile',
    '/OpenAction', '/AA', '/RichMedia', 'http://', 'https://', '/FontFile']) {
    assert.ok(!body.includes(marker), `the PDF carries "${marker}"`)
  }
})

test('the same input always produces the same bytes', () => {
  const input = {
    title: 'T', subject: 'S', createdAt: '2026-09-07T12:00:00.000Z',
    header: [{ text: 'H' }], lines: [{ text: 'a' }, { text: 'b', bold: true }],
  }
  assert.ok(renderPdf(input).buffer.equals(renderPdf(input).buffer))
})

/* ------------------------------------------------------------------ *
 * 16-21  path and request boundary
 * ------------------------------------------------------------------ */

test('a generated artifact id matches the allowlist pattern', () => {
  const id = newArtifactId('6a9e40cac3c410903d1c8f00', new Date('2026-09-07T12:00:00.000Z'))
  assert.match(id, ARTIFACT_ID_PATTERN)
  assert.ok(id.includes('20260907T120000Z'))
  // Two ids for the same attempt at the same instant still differ.
  assert.notEqual(id, newArtifactId('6a9e40cac3c410903d1c8f00', new Date('2026-09-07T12:00:00.000Z')))
})

test('an artifact id that is not exactly the allowlisted shape is refused', () => {
  for (const id of [
    '../../etc/passwd',
    '..\\..\\windows\\system32\\config\\sam',
    '/etc/passwd',
    'C:\\Windows\\win.ini',
    'D:/Social Engineering Fraud Training PDS/backend/.env',
    '\\\\server\\share\\report',
    '//server/share/report',
    'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd/../x',
    'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd\u0000',
    'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-GGGGGGGG',
    'training-attempt-ZZZZ-20260907T120000Z-aabbccdd',
    'CON', 'NUL', '', '.', '..',
  ]) {
    rejects(() => assertSafeArtifactId(id), 'INVALID_ARTIFACT_ID')
  }
})

test('an artifact always resolves to a file directly inside the export root', () => {
  const id = newArtifactId('6a9e40cac3c410903d1c8f00')
  const resolved = artifactPathFor(id, 'csv')
  assert.ok(resolved.endsWith(artifactFilename(id, 'csv')))
  assert.ok(!resolved.includes('..'))
  rejects(() => artifactPathFor(id, 'exe'), 'INVALID_EXPORT_FORMAT')
})

test('a filename parses only as an allowlisted id plus a known extension', () => {
  const id = newArtifactId('6a9e40cac3c410903d1c8f00')
  assert.deepEqual(parseArtifactFilename(`${id}.csv`), { artifactId: id, format: 'csv' })
  assert.deepEqual(parseArtifactFilename(`${id}.pdf`), { artifactId: id, format: 'pdf' })

  for (const name of [`${id}.exe`, `${id}.csv.exe`, `${id}`, `../${id}.csv`,
    `..\\${id}.csv`, `C:/${id}.csv`, `${id}.csv\u0000.txt`, '.env', 'web.config']) {
    rejects(() => parseArtifactFilename(name), 'INVALID_ARTIFACT_ID')
  }
})

test('a path-shaped request field is rejected, not ignored', () => {
  for (const field of ['path', 'destination', 'output_path', 'filename', 'directory',
    'save_as', 'export_dir', 'url', 'upload_url']) {
    const error = rejects(
      () => takeExportRequest({ format: 'csv', [field]: 'C:\\Users\\Public\\out.csv' }),
      'FORBIDDEN_FIELD',
    )
    assert.deepEqual(error.details.rejected_fields, [field])
  }
  // Case does not help.
  rejects(() => takeExportRequest({ format: 'csv', PATH: 'x' }), 'FORBIDDEN_FIELD')
})

test('the request accepts only a known format and a well-formed idempotency key', () => {
  assert.deepEqual(takeExportRequest({ format: 'csv' }), { format: 'csv', idempotencyKey: null })
  assert.equal(takeExportRequest({ format: 'pdf', idempotency_key: 'abc-123-def' }).idempotencyKey,
    'abc-123-def')

  for (const format of ['xlsx', 'docx', 'html', 'CSV', '', null, 7, { $ne: null }]) {
    rejects(() => takeExportRequest({ format }), 'INVALID_EXPORT_FORMAT')
  }
  for (const key of ['short', 'has spaces here', `${'a'.repeat(129)}`, '../../x', 7]) {
    rejects(() => takeExportRequest({ format: 'csv', idempotency_key: key }),
      'INVALID_IDEMPOTENCY_KEY')
  }
  rejects(() => takeExportRequest({ format: 'csv', scope: 'all' }), 'FORBIDDEN_FIELD')
})

/* ------------------------------------------------------------------ *
 * 22-27  the report model, and CSV/PDF agreement
 * ------------------------------------------------------------------ */

/**
 * A completed attempt, shaped exactly as `buildAttemptReport()` produces one.
 *
 * Hand-built so the formatters can be tested without a database, and deliberately hostile:
 * the feedback carries a leading `=`, a comma, a quote and a newline, so both the CSV
 * escaping and the PDF wrapping are exercised on content a real scenario could contain.
 */
function completedModel() {
  const scenario = (ordinal, platform, disposition, score, outcome) => ({
    ordinal,
    scenario_ref: `${platform[0].toUpperCase()}0${ordinal}`,
    platform,
    platform_label: platform === 'sms' ? 'SMS' : platform[0].toUpperCase() + platform.slice(1),
    resolved: true,
    status: 'resolved',
    score_0_10: score,
    max_score: 10,
    outcome_class: outcome,
    outcome_code: 'resolve_report',
    disposition,
    family_label: 'Payment diversion',
    trigger_labels: ['Authority', 'Urgency'],
    final_stage: 'resolve',
    duration_ms: 61_000,
    resolved_at: '2026-09-07T11:00:00.000Z',
    sender: 'Unit Pay Office',
    preview: 'Account change, action needed',
    path: [
      { step: 1, stage: 'notify', action: 'opened_notification' },
      { step: 2, stage: 'inspect', action: 'inspected_the_details' },
      { step: 3, stage: 'resolve', action: 'resolved_as_required' },
    ],
    feedback: {
      result: '=SUM(A1) looked like a payment instruction, but it was a diversion attempt',
      cues: ['a "new" account, mid-thread', 'urgency, out of hours'],
      safe_action: 'Confirm on the known number,\nnever the one in the message',
      impact: 'Funds sent to an attacker-controlled account',
      prevention_habit: 'Verify account changes out of band',
    },
  })

  return {
    report: {
      schema_version: 1,
      kind: 'attempt_report',
      scope: 'attempt',
      product: 'Cyber Social Engineering & Fraud Detection Simulation',
      title: 'Instructor Attempt Report',
      training_marker: TRAINING_MARKER,
      network_marker: OFFLINE_MARKER,
      synthetic_data_notice: 'All message content referenced in this report is SYNTHETIC.',
      generated_at: '2026-09-07T12:00:00.000Z',
      generated_by: 'instructor',
      format: 'csv',
      content_version: 1,
      taxonomy_version: '1.0.0',
      trigger_taxonomy_version: '1.0.0',
      content_currency: {
        attempt_content_version: 1,
        current_content_version: 2,
        is_current: false,
        note: 'This attempt was taken on an EARLIER content version.',
      },
    },
    attempt: {
      attempt_id: '6a9e40cac3c410903d1c8f00',
      learner_display_name: 'Test Learner',
      service_no_masked: '••••4356',
      profile_id: '6a9e40c5c3c410903d1c8eff',
      mode: 'assessment',
      status: 'completed',
      started_at: '2026-09-07T10:00:00.000Z',
      completed_at: '2026-09-07T11:00:00.000Z',
      duration_ms: 3_600_000,
      scenarios_total: 3,
      scenarios_resolved: 3,
      result_available: true,
      total_score: 21,
      max_score: 100,
      resolved_points: 21,
    },
    summary: {
      total_score: 21,
      max_score: 100,
      scenarios: 3,
      handled_safely: 1,
      missed_threats: 1,
      false_positives: 1,
      unsafe_handling: 0,
      duration_ms: 3_600_000,
    },
    platform_coverage: [
      { platform: 'email', label: 'Email', scenarios: 1, resolved: 1 },
      { platform: 'sms', label: 'SMS', scenarios: 1, resolved: 1 },
      { platform: 'whatsapp', label: 'WhatsApp', scenarios: 1, resolved: 1 },
    ],
    behaviour: {
      by_platform: [{ key: 'email', label: 'Email', scenarios: 1, points: 10, max_points: 10, missed_threats: 0, false_positives: 0 }],
      by_family: [{ key: 'payment_diversion', label: 'Payment diversion', scenarios: 3, points: 21, max_points: 30, missed_threats: 1, false_positives: 1 }],
      by_trigger: [{ key: 'authority', label: 'Authority', scenarios: 3, points: 21, max_points: 30, missed_threats: 1, false_positives: 1 }],
      by_stage: [{ stage: 'inspect', scenarios_reached: 3, constructive_actions: 3 }],
      scope: 'complete',
      scenarios_included: 3,
      scenarios_total: 3,
    },
    scenarios: [
      scenario(1, 'email', 'malicious', 10, 'handled_safely'),
      scenario(2, 'sms', 'malicious', 4, 'missed_threat'),
      scenario(3, 'whatsapp', 'legitimate', 7, 'false_positive'),
    ],
    remediation: {
      available: true,
      reason: null,
      recommendations: [{
        family_key: 'payment_diversion',
        label: 'Payment diversion',
        reason: 'A threat in this area was not stopped.',
        points: 21,
        max_points: 30,
        practice_scenarios_available: 6,
      }],
    },
    comparison: {
      available: true,
      previous_attempt_id: '6a9e40cac3c410903d1c8eff',
      previous_total_score: 15,
      previous_completed_at: '2026-09-01T11:00:00.000Z',
      delta: 6,
      attempts_compared: 2,
    },
  }
}

test('the CSV carries every required section, in a fixed order', () => {
  const rows = reportToCsvRows(completedModel())
  const sections = rows.filter((r) => r[0] && r[0].value === '#SECTION').map((r) => r[1].value)
  assert.deepEqual(sections, [
    'REPORT', 'ATTEMPT', 'OUTCOME_SUMMARY', 'PLATFORM_COVERAGE', 'BEHAVIOUR_SCOPE',
    'BEHAVIOUR_BY_PLATFORM', 'BEHAVIOUR_BY_CASE_FAMILY', 'BEHAVIOUR_BY_TRIGGER',
    'BEHAVIOUR_BY_ACTION_STAGE', 'SCENARIOS', 'REMEDIATION', 'COMPARISON',
  ])
})

test('the CSV marks the training data and the content version', () => {
  const csv = toCsv(reportToCsvRows(completedModel()))
  assert.ok(csv.includes(TRAINING_MARKER))
  assert.ok(csv.includes(OFFLINE_MARKER))
  assert.ok(csv.includes('SYNTHETIC'))
  assert.ok(csv.includes('content_version,1'))
  assert.ok(csv.includes('content_is_current,false'))
  assert.ok(csv.includes('EARLIER content version'))
})

test('hostile scenario text survives the CSV without becoming a formula', () => {
  const csv = toCsv(reportToCsvRows(completedModel()))
  // The feedback beginning with "=" is neutralised...
  assert.ok(csv.includes('"\'=SUM(A1) looked like'), 'a formula-shaped cell was not neutralised')
  // ...the embedded quote is doubled, and the newline is inside a quoted field.
  assert.ok(csv.includes('a ""new"" account'))
  assert.ok(csv.includes('"Confirm on the known number,\r\nnever the one in the message"')
    || csv.includes('"Confirm on the known number,\nnever the one in the message"'))
  // And no unquoted line begins with a formula character.
  for (const line of csv.split('\r\n')) {
    assert.ok(!/^[=+@]/.test(line), `a record begins with a formula character: ${line}`)
  }
})

test('the PDF carries the same marks and paginates', () => {
  const model = { ...completedModel() }
  model.report = { ...model.report, format: 'pdf' }
  const { buffer, pages } = reportToPdfDocument(model)
  const body = buffer.toString('latin1')

  assert.ok(body.startsWith('%PDF-1.4'))
  assert.ok(body.includes(TRAINING_MARKER))
  assert.ok(body.includes(OFFLINE_MARKER))
  assert.ok(body.includes('CONTENT VERSION 1'))
  assert.ok(body.includes('SYNTHETIC DATA'))
  assert.ok(body.includes('Page 1 of'))
  assert.ok(pages >= 1)
  // The header is repeated: the marker appears at least once per page.
  assert.ok((body.match(/TRAINING SIMULATION/g) ?? []).length >= pages)
})

test('CSV and PDF are two renderings of ONE dataset', () => {
  const model = completedModel()
  const csvRows = reportToCsvRows(model)
  const pdf = reportToPdfDocument(model)

  const flat = (rows) => rows.flatMap((row) => row.map((cell) => String(cell.value ?? '')))
  const csvText = flat(csvRows).join('\n')
  const pdfText = pdf.buffer.toString('latin1')

  // Both must state the same authoritative figures, taken from the same object.
  assert.ok(csvText.includes(String(model.attempt.total_score)))
  assert.ok(pdfText.includes(`${model.attempt.total_score} / ${model.attempt.max_score}`))

  for (const scenario of model.scenarios) {
    assert.ok(csvText.includes(scenario.outcome_class))
    assert.ok(pdfText.includes(scenario.outcome_class))
    assert.ok(csvText.includes(scenario.disposition))
    assert.ok(pdfText.includes(`${scenario.score_0_10}/${scenario.max_score}`))
  }
  for (const bucket of model.behaviour.by_family) {
    assert.ok(csvText.includes(bucket.label))
    assert.ok(pdfText.includes(bucket.label))
  }
  for (const r of model.remediation.recommendations) {
    assert.ok(csvText.includes(r.family_key))
    assert.ok(pdfText.includes(r.label))
    // Families, never scenario ids: the report must not become a partial answer key.
    assert.equal(r.scenario_id, undefined)
  }
  assert.ok(csvText.includes(model.comparison.previous_attempt_id))
  assert.ok(pdfText.includes(model.comparison.previous_attempt_id))
})

test('an incomplete attempt reports no total in either format', () => {
  const model = completedModel()
  model.attempt = {
    ...model.attempt,
    status: 'in_progress',
    completed_at: null,
    duration_ms: null,
    result_available: false,
    total_score: null,
    scenarios_resolved: 1,
    resolved_points: 10,
  }
  model.summary = null
  model.behaviour = { ...model.behaviour, scope: 'partial', scenarios_included: 1 }
  model.scenarios = [
    model.scenarios[0],
    { ordinal: 2, scenario_ref: 'S02', platform: 'sms', platform_label: 'SMS', resolved: false, status: 'active', current_stage: 'notify', score_0_10: null, max_score: 10 },
  ]
  model.remediation = { available: false, reason: 'attempt_not_complete', recommendations: [] }
  model.comparison = { available: false, reason: 'attempt_not_complete' }

  const csv = toCsv(reportToCsvRows(model))
  assert.ok(csv.includes('result_available,false'))
  assert.ok(csv.includes('resolved_points,10'))
  assert.ok(csv.includes('the attempt is not complete'))
  assert.ok(!/\btotal_score,\d/.test(csv.split('#SECTION,OUTCOME_SUMMARY')[0]),
    'a total was reported for an unfinished attempt')

  const pdf = reportToPdfDocument({ ...model, report: { ...model.report, format: 'pdf' } })
    .buffer.toString('latin1')
  assert.ok(pdf.includes('not available - attempt incomplete'))
  // Parentheses are PDF string delimiters, so the writer escapes them in the stream.
  assert.ok(pdf.includes('10 \\(partial\\)'))
  assert.ok(pdf.includes('Points from resolved'))
  assert.ok(pdf.includes('NOT RESOLVED'))
  assert.ok(pdf.includes('No score, outcome, classification or feedback is reported'))
})

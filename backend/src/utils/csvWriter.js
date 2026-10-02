import {
  CSV_BOM,
  CSV_EOL,
  CSV_FORMULA_LEAD_CHARS,
  CSV_FORMULA_PREFIX,
} from '../constants/export.js'

/**
 * A small, complete RFC 4180 CSV writer (ADMIN-003).
 *
 * ### Why this is not a dependency
 *
 * The backend's whole dependency set is express, mongoose, cors, cookie-parser,
 * cookie-signature and dotenv. Writing a CSV correctly is a page of code with two rules -
 * quote when you must, double an embedded quote - and the whole surface is covered by
 * unit tests here. Adding a package to an offline, air-gapped defence deployment costs a
 * supply-chain review and an update path forever; it is not worth it for this.
 *
 * What it is NOT is hand-concatenated strings: every value goes through `escapeCell()`,
 * which is the only place a cell is turned into text.
 *
 * ### Formula injection
 *
 * A spreadsheet reads a cell beginning with `=`, `+`, `-`, `@`, tab or carriage return as
 * a formula, which is how a CSV becomes code execution on the machine that opens it.
 * TEXT cells beginning with one of those are prefixed with an apostrophe - the convention
 * every major spreadsheet reads as "literal string".
 *
 * NUMBERS ARE NEVER PREFIXED. A score of `-3` must stay the number -3; neutralising it
 * would corrupt the figures the report exists to communicate. That is why `cell()` below
 * distinguishes a number from a string rather than stringifying everything first.
 */

/** A number cell. Written verbatim, never quoted and never neutralised. */
export function num(value) {
  if (value === null || value === undefined) return { kind: 'blank' }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('num() takes a finite number')
  }
  return { kind: 'number', value }
}

/** A text cell. Escaped, and neutralised if it could be read as a formula. */
export function text(value) {
  if (value === null || value === undefined) return { kind: 'blank' }
  return { kind: 'text', value: String(value) }
}

/** An empty cell. Distinct from `text('')` only in intent; both render as nothing. */
export const blank = () => ({ kind: 'blank' })

/**
 * Would a spreadsheet treat this text as a formula?
 *
 * Checked on the RAW value, before quoting: a leading `=` inside quotes is still a
 * formula to Excel, so quoting alone is not a defence.
 */
export function looksLikeFormula(value) {
  return typeof value === 'string' && value.length > 0
    && CSV_FORMULA_LEAD_CHARS.includes(value[0])
}

/**
 * One cell, rendered.
 *
 * Quoting rule (RFC 4180 plus one addition): a field is quoted when it contains a comma,
 * a double quote, CR or LF, or when it has leading or trailing whitespace. The last is
 * not required by the RFC, but unquoted surrounding spaces are silently eaten by several
 * readers, and a report should say what it means.
 */
export function escapeCell(input) {
  const cell = input && typeof input === 'object' && 'kind' in input ? input : text(input)

  if (cell.kind === 'blank') return ''
  if (cell.kind === 'number') return String(cell.value)

  let value = cell.value
  if (looksLikeFormula(value)) value = `${CSV_FORMULA_PREFIX}${value}`

  const needsQuotes = /[",\r\n]/.test(value) || /^\s|\s$/.test(value)
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value
}

/** One record. An empty array is a blank separator line, which the report uses. */
export function toCsvRow(cells) {
  return cells.map(escapeCell).join(',')
}

/**
 * The whole document.
 *
 * Deterministic: rows are written in the order given, nothing is sorted, nothing is
 * timestamped here, and the same rows always produce the same bytes. A trailing CRLF is
 * written after the final record, as RFC 4180 permits and most readers expect.
 */
export function toCsv(rows, { bom = true } = {}) {
  const body = rows.map((row) => toCsvRow(row ?? [])).join(CSV_EOL)
  return `${bom ? CSV_BOM : ''}${body}${CSV_EOL}`
}

/** The document as bytes, which is what actually gets written to disk. */
export function toCsvBuffer(rows, options) {
  return Buffer.from(toCsv(rows, options), 'utf8')
}

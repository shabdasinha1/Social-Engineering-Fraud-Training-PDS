import {
  PDF_FONT_SIZE,
  PDF_LINE_CHARS,
  PDF_LINE_HEIGHT,
  PDF_MARGIN,
  PDF_PAGE,
  PDF_PRODUCER,
} from '../constants/export.js'

/**
 * A minimal, deterministic, fully offline PDF 1.4 writer (ADMIN-003).
 *
 * ### Why this is not a dependency
 *
 * No PDF library is installed, and the report this project needs is monospaced text on A4
 * with a repeated header and page numbers. `pdfkit` would bring a font subsetting stack,
 * a stream pipeline and a dozen transitive packages to lay out text that is already
 * fixed-width; for an air-gapped defence deployment that is a permanent supply-chain and
 * update obligation bought for a page of layout.
 *
 * What is written here is a genuine PDF file - catalog, page tree, content streams, cross
 * reference table, trailer - not a text file with a `.pdf` name. The structure is asserted
 * by test, and the rendering is verified by opening the artifact in a PDF viewer.
 *
 * ### Why Courier
 *
 * Courier and Courier-Bold are two of the fourteen **base fonts** every conforming PDF
 * reader must provide. Nothing is embedded and nothing is fetched: no font file, no image,
 * no stylesheet, no URL, no JavaScript, no annotation, no link. An air-gapped machine
 * renders this file exactly as a connected one does.
 *
 * Monospace also makes layout exactly computable - a run of `n` characters is
 * `n x 0.6 x size` wide - which is what lets the caller guarantee, rather than hope, that
 * no line is clipped: `PDF_LINE_CHARS` is derived from the page geometry and the line
 * builder wraps to it.
 *
 * ### Determinism
 *
 * The same lines and the same `createdAt` always produce byte-identical output. There is
 * no `/ID` (optional for an unencrypted file, and the usual source of randomness), no
 * modification date, and no generation counter above zero.
 */

/* ------------------------------------------------------------------ *
 * Text encoding
 * ------------------------------------------------------------------ */

/**
 * Unicode -> WinAnsiEncoding, for the characters this report can actually contain.
 *
 * Client scenario prose carries typographic punctuation, and a masked service number
 * carries bullets. WinAnsi has all of them; without this map they would emit as the wrong
 * glyph rather than fail loudly.
 */
const WIN_ANSI = new Map([
  [0x2018, 0x91], [0x2019, 0x92], [0x201a, 0x82],
  [0x201c, 0x93], [0x201d, 0x94], [0x201e, 0x84],
  [0x2013, 0x96], [0x2014, 0x97], [0x2022, 0x95], [0x2026, 0x85],
  [0x2020, 0x86], [0x2021, 0x87], [0x2030, 0x89], [0x20ac, 0x80],
  [0x2039, 0x8b], [0x203a, 0x9b], [0x02c6, 0x88], [0x02dc, 0x98],
  [0x0160, 0x8a], [0x0161, 0x9a], [0x0152, 0x8c], [0x0153, 0x9c],
  [0x017d, 0x8e], [0x017e, 0x9e], [0x0178, 0x9f], [0x0192, 0x83],
])

/**
 * One line of text, as WinAnsi bytes with PDF string escaping applied.
 *
 * A character with no WinAnsi equivalent becomes `?`. Substituting is the right failure
 * here: a report that renders with one wrong glyph is usable, and a report that refuses
 * to generate because a scenario contained an unusual character is not.
 */
export function toWinAnsi(input) {
  const bytes = []
  for (const char of String(input ?? '')) {
    const code = char.codePointAt(0)
    let byte
    if (code === 0x09) byte = 0x20 // a tab has no width in a text object
    else if (code >= 0x20 && code <= 0x7e) byte = code
    else if (code >= 0xa0 && code <= 0xff) byte = code
    else if (WIN_ANSI.has(code)) byte = WIN_ANSI.get(code)
    else byte = 0x3f // '?'

    // PDF literal-string escaping. Without this a ')' in scenario prose ends the string
    // early and corrupts every object offset after it.
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) bytes.push(0x5c)
    bytes.push(byte)
  }
  return Buffer.from(bytes)
}

/** A PDF literal string, ready to place in a content stream. */
const pdfString = (value) => Buffer.concat([
  Buffer.from('('), toWinAnsi(value), Buffer.from(')'),
])

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

/**
 * Wraps text to the page's character width, breaking on spaces and hard-splitting a word
 * that is longer than a line.
 *
 * The hard split matters: a scenario id, a family slug or a path replay can be one
 * unbroken token, and a monospaced layout with no hard split would run it off the page -
 * the exact clipping this function exists to prevent.
 */
export function wrapText(value, width = PDF_LINE_CHARS) {
  const source = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!source) return ['']
  const limit = Math.max(width, 8)

  const lines = []
  let current = ''
  for (const word of source.split(' ')) {
    let token = word
    while (token.length > limit) {
      if (current) { lines.push(current); current = '' }
      lines.push(token.slice(0, limit))
      token = token.slice(limit)
    }
    if (!current) current = token
    else if (current.length + 1 + token.length <= limit) current = `${current} ${token}`
    else { lines.push(current); current = token }
  }
  if (current) lines.push(current)
  return lines
}

/* ------------------------------------------------------------------ *
 * Document assembly
 * ------------------------------------------------------------------ */

const F_REGULAR = '/F1'
const F_BOLD = '/F2'

/** `D:YYYYMMDDHHmmSSZ` - the PDF date form, always in UTC so it is machine-independent. */
export function pdfDate(date) {
  const iso = new Date(date).toISOString()
  return `D:${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}`
    + `${iso.slice(11, 13)}${iso.slice(14, 16)}${iso.slice(17, 19)}Z`
}

/**
 * One page's content stream.
 *
 * Text sits in a single BT/ET block using `TL`/`T*` for line advance, so a page is one
 * positioning operation plus one show-text operator per line. Rules are drawn outside the
 * text object, which is what the specification requires.
 */
function contentStream({ lines, rules, footer }) {
  const top = PDF_PAGE.height - PDF_MARGIN.top
  const parts = [Buffer.from(`BT ${F_REGULAR} ${PDF_FONT_SIZE} Tf ${PDF_LINE_HEIGHT} TL `
    + `${PDF_MARGIN.left} ${top} Td\n`)]

  let font = F_REGULAR
  for (const line of lines) {
    const wanted = line.bold ? F_BOLD : F_REGULAR
    if (wanted !== font) {
      parts.push(Buffer.from(`${wanted} ${PDF_FONT_SIZE} Tf\n`))
      font = wanted
    }
    parts.push(pdfString(line.text ?? ''), Buffer.from(' Tj T*\n'))
  }
  parts.push(Buffer.from('ET\n'))

  for (const y of rules) {
    parts.push(Buffer.from(`0.5 w 0.4 G ${PDF_MARGIN.left} ${y} m `
      + `${PDF_PAGE.width - PDF_MARGIN.right} ${y} l S\n`))
  }

  if (footer) {
    parts.push(Buffer.from(`BT ${F_REGULAR} ${PDF_FONT_SIZE} Tf `
      + `${PDF_MARGIN.left} ${PDF_MARGIN.bottom - 14} Td\n`))
    parts.push(pdfString(footer), Buffer.from(' Tj\nET\n'))
  }

  return Buffer.concat(parts)
}

/**
 * Paginates styled lines and writes the file.
 *
 * `lines` is a flat list of `{text, bold?, keepWithNext?}`; `header` is repeated at the
 * top of EVERY page, so a report read out of order still says what it is and which
 * version it came from. A line carrying `pageBreak: true` starts a new page.
 *
 * Memory is bounded by the report itself: a ten-scenario attempt is a few hundred lines,
 * and the whole document is assembled as one buffer rather than streamed, because the
 * caller must know the exact byte length before it decides to keep the artifact.
 */
export function renderPdf({
  title = '',
  subject = '',
  createdAt = new Date(),
  header = [],
  lines = [],
  footerLabel = '',
} = {}) {
  const usableHeight = PDF_PAGE.height - PDF_MARGIN.top - PDF_MARGIN.bottom
  const perPage = Math.max(Math.floor(usableHeight / PDF_LINE_HEIGHT) - 1, 8)

  /**
   * The header owns one blank row below itself, and the rule is drawn inside it.
   *
   * Without the reserved row the rule is drawn at whatever sits directly under the header
   * - which is fine while the first body line happens to be blank, and strikes a line of
   * text through the middle as soon as a page break lands inside a block.
   */
  const headerLines = header.length ? [...header, { text: '' }] : []
  const bodyPerPage = Math.max(perPage - headerLines.length, 4)

  // 1. paginate
  const pages = []
  let current = []
  for (const line of lines) {
    if (line?.pageBreak && current.length) { pages.push(current); current = [] }
    if (current.length >= bodyPerPage) { pages.push(current); current = [] }
    if (line?.pageBreak && !line.text) continue
    current.push({ text: line?.text ?? '', bold: Boolean(line?.bold) })
  }
  if (current.length || !pages.length) pages.push(current)

  // 2. lay out each page: repeated header, a rule in its reserved row, body, footer
  const headerRuleY = PDF_PAGE.height - PDF_MARGIN.top - (header.length * PDF_LINE_HEIGHT) + 3
  const rendered = pages.map((body, index) => contentStream({
    lines: [...headerLines, ...body],
    rules: header.length ? [headerRuleY] : [],
    footer: `${footerLabel}${footerLabel ? '   |   ' : ''}Page ${index + 1} of ${pages.length}`,
  }))

  // 3. objects: catalog, pages, two base fonts, info, then page + content per page
  const objects = []
  const add = (body) => { objects.push(body); return objects.length }

  const catalogId = add(null)
  const pagesId = add(null)
  const fontRegularId = add(Buffer.from(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>',
  ))
  const fontBoldId = add(Buffer.from(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>',
  ))
  const infoId = add(Buffer.concat([
    Buffer.from('<< /Title '), pdfString(title),
    Buffer.from(' /Subject '), pdfString(subject),
    Buffer.from(' /Producer '), pdfString(PDF_PRODUCER),
    Buffer.from(' /Creator '), pdfString(PDF_PRODUCER),
    Buffer.from(` /CreationDate (${pdfDate(createdAt)}) >>`),
  ]))

  const pageIds = []
  for (const stream of rendered) {
    const contentId = add(Buffer.concat([
      Buffer.from(`<< /Length ${stream.length} >>\nstream\n`),
      stream,
      Buffer.from('\nendstream'),
    ]))
    pageIds.push(add(Buffer.from(
      `<< /Type /Page /Parent ${pagesId} 0 R `
      + `/MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] `
      + `/Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> `
      + `/Contents ${contentId} 0 R >>`,
    )))
  }

  objects[catalogId - 1] = Buffer.from(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)
  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
  )

  // 4. serialise, recording every object's byte offset for the cross-reference table
  const chunks = [Buffer.from('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n', 'latin1')]
  let offset = chunks[0].length
  const offsets = []

  objects.forEach((body, index) => {
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`), body, Buffer.from('\nendobj\n'),
    ])
    offsets.push(offset)
    offset += chunk.length
    chunks.push(chunk)
  })

  const xrefStart = offset
  const xref = [`xref\n0 ${objects.length + 1}\n`, '0000000000 65535 f \n']
  for (const at of offsets) xref.push(`${String(at).padStart(10, '0')} 00000 n \n`)
  chunks.push(Buffer.from(xref.join('')))
  chunks.push(Buffer.from(
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\n`
    + `startxref\n${xrefStart}\n%%EOF\n`,
  ))

  return { buffer: Buffer.concat(chunks), pages: pages.length }
}

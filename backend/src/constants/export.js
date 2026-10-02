/**
 * The instructor export vocabulary (ADMIN-003).
 *
 * Specification section 6, third admin capability:
 *
 *   "Exports: offline CSV/PDF summary to instructor-selected local path; clearly mark
 *    training data and version."
 *
 * Everything an export may be, may be called, and may be written to is named here.
 *
 * ### The two rules this file exists to enforce
 *
 * 1. **The client never supplies a path, a path fragment or a filename.** Not a directory,
 *    not a basename, not an extension. The artifact name is derived entirely server-side
 *    from the attempt id, a UTC timestamp and random bytes, and the only directory it can
 *    ever be written to is the configured export root. A request carrying a path-shaped
 *    field is REJECTED, not ignored - see `FORBIDDEN_EXPORT_FIELDS`.
 * 2. **Every artifact is marked.** A report that leaves this system says TRAINING
 *    SIMULATION, says OFFLINE, says the content version it was produced from, and says
 *    that its message content is synthetic. Those four marks are not formatting choices;
 *    they are the section 6 requirement, and they are asserted by test in both formats.
 */

/* ------------------------------------------------------------------ *
 * Formats
 * ------------------------------------------------------------------ */

/** The ONLY formats. An unknown format string is a 422, never a file extension. */
export const EXPORT_FORMATS = ['csv', 'pdf']

export const EXPORT_FILE_EXTENSIONS = { csv: 'csv', pdf: 'pdf' }

export const EXPORT_CONTENT_TYPES = {
  csv: 'text/csv; charset=utf-8',
  pdf: 'application/pdf',
}

/**
 * The export scopes.
 *
 * `attempt` (ADMIN-003) is the per-attempt report ADMIN-002 assembles. `learner` (ADM-007)
 * is every COMPLETED attempt of one learner, each built from that same per-attempt report -
 * so it is a collection of attempt reports, not a second reporting engine. Exports across
 * learners remain out of scope - see docs/ADMIN_EXPORTS.md §"Scope".
 */
export const EXPORT_SCOPES = ['attempt', 'learner']
export const EXPORT_SCOPE_ATTEMPT = 'attempt'
export const EXPORT_SCOPE_LEARNER = 'learner'

/**
 * The most completed attempts one learner export will carry. A learner sits a handful of
 * attempts; this only stops a pathological profile from building an unbounded report.
 */
export const LEARNER_EXPORT_MAX_ATTEMPTS = 100

/** The report data model version. Bumped if the report's fields ever change shape. */
export const EXPORT_REPORT_SCHEMA_VERSION = 1

/* ------------------------------------------------------------------ *
 * Request boundary
 * ------------------------------------------------------------------ */

/** The only keys an export request body may carry. */
export const EXPORT_BODY_FIELDS = ['format', 'idempotency_key']

/**
 * Path-shaped fields a client might try, named explicitly so the refusal can say which
 * one was the problem.
 *
 * These are rejected rather than ignored on purpose. A caller that believes it chose
 * `C:\Reports\out.csv`, and got a 200, has been misled about where its data went - and
 * "where the data went" is the whole security question for an export feature.
 */
export const FORBIDDEN_EXPORT_FIELDS = [
  'path', 'file_path', 'filepath', 'destination', 'dest', 'output_path', 'output',
  'directory', 'dir', 'folder', 'filename', 'file_name', 'basename', 'extension', 'ext',
  'target', 'save_as', 'export_dir', 'root', 'url', 'upload_url', 'callback_url',
]

/* ------------------------------------------------------------------ *
 * Artifact naming
 * ------------------------------------------------------------------ */

/**
 * `training-attempt-<24 hex>-<YYYYMMDDTHHMMSSZ>-<8 hex>`
 *
 * Every part is server-generated: the attempt's own id, the server clock, and 4 random
 * bytes. No learner or administrator input reaches a filename, so a name cannot carry a
 * traversal sequence, a drive letter, a UNC prefix, a null byte or a reserved Windows
 * device name. The random suffix makes a collision - and therefore an overwrite of an
 * existing artifact - practically impossible.
 *
 * The id IS the filename stem, so an artifact resolves by string join and needs no
 * catalog, no database model and no directory scan.
 */
export const ARTIFACT_ID_PATTERN = /^training-(attempt|learner)-[0-9a-f]{24}-\d{8}T\d{6}Z-[0-9a-f]{8}$/

/** The id stem per scope: the attempt's id, or (ADM-007) the learner profile's id. */
export const ARTIFACT_ID_PREFIXES = {
  attempt: 'training-attempt',
  learner: 'training-learner',
}
export const ARTIFACT_ID_PREFIX = ARTIFACT_ID_PREFIXES.attempt
export const ARTIFACT_RANDOM_BYTES = 4

/** A part-file is finalised by rename. It never sits at the artifact's own name. */
export const ARTIFACT_TEMP_SUFFIX = '.part'
export const ARTIFACT_TEMP_DIR = '.pending'

/**
 * A generous ceiling for a ten-scenario report, which measures in tens of kilobytes.
 * Its purpose is to turn a runaway builder into a clear failure rather than a full disk.
 */
export const MAX_ARTIFACT_BYTES = 8 * 1024 * 1024

/* ------------------------------------------------------------------ *
 * Report marks (specification section 6: "clearly mark training data and version")
 * ------------------------------------------------------------------ */

export const REPORT_PRODUCT_NAME = 'Cyber Social Engineering & Fraud Detection Simulation'
export const REPORT_TITLE = 'Instructor Attempt Report'
export const LEARNER_REPORT_TITLE = 'Instructor Learner Report'

export const TRAINING_MARKER = 'TRAINING SIMULATION'
export const OFFLINE_MARKER = 'OFFLINE'

export const SYNTHETIC_DATA_NOTICE =
  'All message content referenced in this report is SYNTHETIC TRAINING DATA generated for '
  + 'simulation. No real message, sender, account, payment instrument or credential is '
  + 'represented. This report was produced offline on the local training machine.'

/** Said plainly on every report, because an instructor may read this months later. */
export const CONTENT_CURRENCY_NOTES = {
  CURRENT: 'This attempt was taken on the scenario content that is currently published.',
  SUPERSEDED:
    'This attempt was taken on an EARLIER content version than the one currently '
    + 'published. Scores are valid for the version shown and are not directly comparable '
    + 'with attempts on the current version.',
  UNKNOWN:
    'The currently published content version could not be determined, so this report '
    + 'does not state whether the attempt content is still current.',
}

/* ------------------------------------------------------------------ *
 * CSV
 * ------------------------------------------------------------------ */

/** RFC 4180: records are CRLF-separated. */
export const CSV_EOL = '\r\n'

/**
 * A UTF-8 byte-order mark is written.
 *
 * The deployment is a standalone Windows PC and the reader is Excel, which without a BOM
 * decodes a UTF-8 CSV as the system ANSI codepage and mangles every non-ASCII character -
 * including the bullets in a masked service number. The cost is three bytes.
 */
export const CSV_BOM = '\uFEFF'

/**
 * Characters that make a spreadsheet treat a cell as a formula.
 *
 * Tab and carriage return are included: both are used as lead-in characters in published
 * CSV-injection techniques, because several spreadsheets strip them before parsing.
 */
export const CSV_FORMULA_LEAD_CHARS = ['=', '+', '-', '@', '\t', '\r']

/**
 * The neutralising prefix, applied to TEXT cells only.
 *
 * A leading apostrophe is the convention every major spreadsheet understands as "this is
 * a literal string". It is deliberately NOT applied to numeric cells: a score of -3 must
 * stay the number -3, and quoting every negative number as text would corrupt exactly the
 * figures the report exists to communicate.
 */
export const CSV_FORMULA_PREFIX = "'"

/** The section marker that opens each block of the sectioned CSV. */
export const CSV_SECTION_MARKER = '#SECTION'

/* ------------------------------------------------------------------ *
 * PDF
 * ------------------------------------------------------------------ */

/**
 * A4 in PostScript points, and a monospaced standard-14 font.
 *
 * Courier is one of the fourteen base fonts every PDF reader is required to provide, so
 * NOTHING is embedded and nothing is fetched: no font file, no image, no stylesheet, no
 * URL. Monospace also makes layout exactly computable - a line is `chars x 0.6 x size`
 * wide - which is what lets the builder guarantee no text is ever clipped.
 */
export const PDF_PAGE = { width: 595, height: 842 }
export const PDF_MARGIN = { top: 44, right: 40, bottom: 44, left: 40 }
export const PDF_FONT_SIZE = 8
export const PDF_LINE_HEIGHT = 10.5
export const PDF_COURIER_WIDTH_RATIO = 0.6

/** 515pt of usable width at 4.8pt per character. */
export const PDF_LINE_CHARS = Math.floor(
  (PDF_PAGE.width - PDF_MARGIN.left - PDF_MARGIN.right)
  / (PDF_FONT_SIZE * PDF_COURIER_WIDTH_RATIO),
)

export const PDF_PRODUCER = `${REPORT_PRODUCT_NAME} (offline)`

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

/** Stable domain codes. No message echoes a path, a body or an administrator's input. */
export const EXPORT_ERRORS = {
  FORBIDDEN_FIELD: 422,
  INVALID_EXPORT_FORMAT: 422,
  INVALID_IDEMPOTENCY_KEY: 422,
  INVALID_ARTIFACT_ID: 422,
  ATTEMPT_NOT_FOUND: 404,
  PROFILE_NOT_FOUND: 404,
  ARTIFACT_NOT_FOUND: 404,
  NO_COMPLETED_ATTEMPTS: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  EXPORT_TOO_LARGE: 422,
  EXPORT_WRITE_FAILED: 500,
  EXPORT_FINALISE_FAILED: 500,
}

/** An idempotency key is an opaque client token, not a payload. */
export const MAX_IDEMPOTENCY_KEY_LENGTH = 128
export const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_.:-]{8,128}$/

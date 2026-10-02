/**
 * Presentation vocabulary for the instructor area (ADMIN-006).
 *
 * Every list here mirrors a **closed vocabulary the backend already enforces**. Nothing is
 * invented: a filter offers only values ADMIN-001/002 accept, a reason code only values
 * ADMIN-004 accepts, and a timing only the two ADMIN-004 defines. A value that arrives
 * without an entry falls back to its own slug rather than being hidden or guessed at, the
 * same rule `constants/result.js` follows.
 *
 * This file maps slugs to English. It classifies nothing, scores nothing and decides
 * nothing.
 */

/* ------------------------------------------------------------------ *
 * Scenario manager (ADMIN-001)
 * ------------------------------------------------------------------ */

/** The three lifecycle states, each with a shape and a word - never colour alone. */
export const LIFECYCLE = {
  draft: {
    label: 'Draft',
    tone: 'bg-secondary-soft text-secondary ring-border-strong',
    description: 'Never published. This is the only state that can be edited in place.',
  },
  published: {
    label: 'Published',
    tone: 'bg-success-soft text-success ring-success/25',
    description: 'Currently live. Editing it creates the next version as a draft.',
  },
  retired: {
    label: 'Retired',
    tone: 'bg-warning-soft text-warning ring-warning/25',
    description: 'Was published, now inactive. Preserved so past attempts still resolve.',
  },
}

export const LIFECYCLE_FILTERS = [
  { value: '', label: 'Any lifecycle state' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'retired', label: 'Retired' },
]

export const PLATFORM_FILTERS = [
  { value: '', label: 'Any platform' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
]

export const LEVEL_FILTERS = [
  { value: '', label: 'Any level' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export const DISPOSITION_FILTERS = [
  { value: '', label: 'Any disposition' },
  { value: 'malicious', label: 'Malicious' },
  { value: 'legitimate', label: 'Legitimate' },
]

export const PLATFORM_LABELS = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  sms: 'SMS',
  email: 'Email',
}

export const LEVEL_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export const DISPOSITION_LABELS = { malicious: 'Malicious', legitimate: 'Legitimate' }

/**
 * The scenario fields this UI lets an instructor edit.
 *
 * A deliberately small slice of ADMIN-001's `AUTHORABLE_FIELDS`: the provenance and
 * review metadata. **Scenario content - the six stages, the synthetic assets, the scoring
 * table and the evaluation block - is not editable here.** Editing client-supplied
 * scenario prose through a web form is how a bank of 100 authoritative scenarios quietly
 * drifts from the specification it was imported from, and DATA-002 exists to prevent that.
 */
export const EDITABLE_SCENARIO_FIELDS = ['owner', 'review_date']

/* ------------------------------------------------------------------ *
 * Attempt viewer (ADMIN-002)
 * ------------------------------------------------------------------ */

export const ATTEMPT_STATUS = {
  in_progress: {
    label: 'In progress',
    tone: 'bg-info-soft text-info ring-info/25',
  },
  completed: {
    label: 'Completed',
    tone: 'bg-success-soft text-success ring-success/25',
  },
  abandoned: {
    label: 'Reset',
    tone: 'bg-warning-soft text-warning ring-warning/25',
  },
}

export const ATTEMPT_STATUS_FILTERS = [
  { value: '', label: 'Any status' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Reset' },
]

/**
 * Every admin table shows at most this many rows per page (ENHANCEMENT-001B). The three
 * list APIs page on the server, so this is sent as `page_size` - nothing is fetched and
 * then sliced in the browser.
 */
export const ADMIN_PAGE_SIZE = 10

/**
 * Kept for the API contract only. The assessment flow creates assessment attempts and the
 * Attempts screen no longer offers a mode filter (ENHANCEMENT-001B); the backend still
 * accepts `mode`, so nothing that sends it breaks.
 */
export const ATTEMPT_MODE_FILTERS = [
  { value: '', label: 'Any mode' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'training', label: 'Training' },
]

export const MODE_LABELS = { assessment: 'Assessment', training: 'Training' }

/** Why the server declined to compare, or to recommend. Never phrased as a fault. */
export const UNAVAILABLE_REASONS = {
  no_previous_attempt: 'No earlier completed attempt to compare with.',
  not_comparable:
    'The previous attempt used a different mode or content version, so the two are not '
    + 'directly comparable.',
  attempt_not_complete: 'The attempt is not finished, so this is not available yet.',
}

/* ------------------------------------------------------------------ *
 * Exports (ADMIN-003)
 * ------------------------------------------------------------------ */

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', hint: 'Opens in a spreadsheet.' },
  { value: 'pdf', label: 'PDF', hint: 'For printing or filing.' },
]

/* ------------------------------------------------------------------ *
 * Instructor controls (ADMIN-004)
 * ------------------------------------------------------------------ */

/** ADMIN-004's closed reset vocabulary. There is no free-text reason, by design. */
export const RESET_REASONS = [
  { value: '', label: 'No reason recorded' },
  { value: 'learner_request', label: 'Learner requested' },
  { value: 'technical_fault', label: 'Technical fault' },
  { value: 'session_interrupted', label: 'Session interrupted' },
  { value: 'instructor_policy', label: 'Instructor policy' },
  { value: 'duplicate_attempt', label: 'Duplicate attempt' },
]

export const ARCHIVE_REASONS = [
  { value: '', label: 'No reason recorded' },
  { value: 'course_complete', label: 'Course complete' },
  { value: 'posting_change', label: 'Posting change' },
  { value: 'local_policy', label: 'Local policy' },
  { value: 'duplicate_profile', label: 'Duplicate profile' },
  { value: 'instructor_policy', label: 'Instructor policy' },
]

export const FEEDBACK_TIMING_LABELS = {
  immediate: 'Immediate — as each scenario is resolved',
  on_completion: 'On completion — when the attempt finishes',
}

/* ------------------------------------------------------------------ *
 * Audit log (ADMIN-005)
 * ------------------------------------------------------------------ */

export const AUDIT_ACTION_LABELS = {
  SCENARIO_PUBLISHED: 'Scenario published',
  SCENARIO_DEACTIVATED: 'Scenario deactivated',
  SCENARIO_RESET: 'Attempt reset',
  ATTEMPT_RESET: 'Attempt reset',
  PROFILE_ARCHIVED: 'Profile archived',
  EXPORT_CREATED: 'Export created',
  CONFIG_CHANGED: 'Configuration changed',
}

export const AUDIT_RESOURCE_LABELS = {
  scenario_definition: 'Scenario',
  attempt: 'Attempt',
  learner_profile: 'Learner profile',
  export: 'Export',
  configuration: 'Configuration',
}

export const AUDIT_ACTION_FILTERS = [
  { value: '', label: 'Any action' },
  { value: 'SCENARIO_PUBLISHED', label: 'Scenario published' },
  { value: 'SCENARIO_DEACTIVATED', label: 'Scenario deactivated' },
  { value: 'ATTEMPT_RESET', label: 'Attempt reset' },
  { value: 'PROFILE_ARCHIVED', label: 'Profile archived' },
  { value: 'EXPORT_CREATED', label: 'Export created' },
  { value: 'CONFIG_CHANGED', label: 'Configuration changed' },
]

/* ------------------------------------------------------------------ *
 * Dashboard (ENHANCEMENT-001, assessment-only since ENHANCEMENT-001B)
 * ------------------------------------------------------------------ */

/**
 * The five RESULT-001 outcome classes, as an instructor reads them in aggregate. `swatch`
 * is a design token (index.css); the order is the validated palette order and is also the
 * stacking order, so neighbours stay distinguishable. Every use pairs the swatch with the
 * label and a count.
 */
export const DASHBOARD_OUTCOMES = [
  {
    key: 'handled_safely',
    label: 'Handled safely',
    swatch: 'bg-outcome-safe',
    description: 'Right final action, with no critical unsafe step on the way.',
  },
  {
    key: 'false_positive',
    label: 'Genuine rejected',
    swatch: 'bg-outcome-rejected',
    description: 'A legitimate item was reported, blocked or abandoned.',
  },
  {
    key: 'unsafe_handling',
    label: 'Genuine, unsafe step',
    swatch: 'bg-outcome-unsafe',
    description: 'A legitimate item was kept, but through a critical unsafe action.',
  },
  {
    key: 'missed_threat',
    label: 'Threat missed',
    swatch: 'bg-outcome-missed',
    description: 'A malicious item was not stopped, or was engaged with unsafely first.',
  },
  {
    key: 'not_resolved',
    label: 'Closed by time limit',
    swatch: 'bg-outcome-unresolved',
    description: 'The 90-minute limit closed the scenario before a final action.',
  },
]

/**
 * The platform metrics the comparison chart can show. Every one is a ratio the server
 * computed and published with its numerator and denominator; `better` says which end is
 * good, so "highest" is never presented as praise for a rate where high is bad.
 */
export const PLATFORM_METRICS = [
  {
    key: 'score_rate',
    label: 'Average score',
    tab: 'Average score',
    better: 'high',
    short: 'Score',
    explain: 'Points earned ÷ points available, across every scenario on the platform in completed attempts.',
  },
  {
    key: 'attack_success_rate',
    label: 'Malicious scenario success',
    tab: 'Malicious success',
    better: 'low',
    short: 'Threats missed',
    explain: 'Malicious scenarios where the threat was missed ÷ malicious scenarios the learner took a final action on.',
  },
  {
    key: 'safe_handling_rate',
    label: 'Safe handling rate',
    tab: 'Safe handling',
    better: 'high',
    short: 'Handled safely',
    explain: 'Scenarios handled safely ÷ scenarios the learner took a final action on (malicious and genuine).',
  },
  {
    key: 'false_positive_rate',
    label: 'Genuine items rejected',
    tab: 'Genuine rejected',
    better: 'low',
    short: 'Rejected',
    explain: 'Genuine scenarios reported, blocked or abandoned ÷ genuine scenarios the learner took a final action on.',
  },
]

/** A 0-1 rate as a whole-number percentage, or an em dash when there was no data. */
export function formatRate(rate) {
  if (rate === null || rate === undefined) return '—'
  return `${Math.round(rate * 100)}%`
}

/** `2026-09-24` as `24 Sep`, in UTC so it matches the server's day buckets. */
export function formatShortDay(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

/** A slug with no label falls back to itself rather than being hidden. */
export const label = (map, key, fallback) => map?.[key] ?? fallback ?? key

/** UTC, because every timestamp the API returns is UTC and an instructor may compare them. */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toISOString().slice(0, 10)} ${date.toISOString().slice(11, 16)} UTC`
}

export function formatDuration(ms) {
  if (ms === null || ms === undefined) return '—'
  const total = Math.max(Math.round(ms / 1000), 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`
}

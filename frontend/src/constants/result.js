/**
 * Presentation labels for the RESULT-001 payload (UI-003).
 *
 * This file turns the server's stable slugs into English. It does **not** reconstruct any
 * taxonomy, recompute any score, or classify anything: every value it maps was already
 * decided server-side, and a slug with no entry here falls back to itself rather than
 * being hidden or guessed at.
 */

/** The outcome classes the server assigns. Blame-free, and never a diagnosis. */
export const OUTCOME_CLASS = {
  handled_safely: {
    label: 'Handled safely',
    tone: 'success',
    description: 'You reached the right outcome without an unsafe step.',
  },
  missed_threat: {
    label: 'Threat missed',
    tone: 'danger',
    description: 'A harmful item was not stopped, or was acted on before it was stopped.',
  },
  false_positive: {
    label: 'Genuine item rejected',
    tone: 'warning',
    description: 'A legitimate item was reported, blocked or abandoned.',
  },
  unsafe_handling: {
    label: 'Unsafe step taken',
    tone: 'warning',
    description: 'The item was kept, but an unsafe action happened on the way.',
  },
  /**
   * IMMERSIVE-001. Neutral on purpose: the learner took no decision here, so the copy
   * describes the CLOCK, not them. It is not a mistake and must not read like one.
   */
  not_resolved: {
    label: 'Not reached in time',
    tone: 'neutral',
    description: 'The time limit closed this scenario before you completed it.',
  },
  /**
   * ENHANCEMENT-003. Only the Demo User can produce it. Neutral, and says nothing about
   * what the skipped item was. Shared with the instructor's Attempt Detail, where it must
   * read differently from `not_resolved` - a demo skip is not a time-limit closure.
   */
  demo_skipped: {
    label: 'Skipped (Demo)',
    tone: 'neutral',
    description: 'Skipped during a demonstration. No decision was recorded.',
  },
}

/** The learner's final action, as the engine recorded it. */
export const OUTCOME_CODE_LABELS = {
  resolve_report: 'Reported',
  resolve_block: 'Blocked',
  resolve_continue: 'Continued',
  resolve_retain: 'Kept',
  resolve_ignore: 'Ignored',
  /** IMMERSIVE-001: a lifecycle marker, deliberately not phrased as a learner action. */
  resolve_expired: 'Not completed - time ran out',
  /** ENHANCEMENT-003. Demo User only. */
  resolve_demo_skipped: 'Skipped (Demo)',
}

/**
 * Path actions, in the server's own vocabulary from `PATH_LABELS`.
 *
 * Deliberately descriptive, never evaluative: the step says what the learner did, and the
 * feedback beside it says what it meant.
 */
export const PATH_ACTION_LABELS = {
  opened_notification: 'Opened the notification',
  dismissed_notification: 'Dismissed the alert',
  read_the_item: 'Read the message',
  acted_before_reading: 'Acted before reading',
  inspected_the_details: 'Inspected the details',
  skipped_inspection: 'Skipped inspection',
  declined_the_request: 'Declined the request',
  used_the_official_path: 'Used the official path',
  abandoned_without_checking: 'Abandoned without checking',
  engaged_with_the_item: 'Engaged with the item',
  took_an_external_action: 'Took an external action',
  released_details_or_paid: 'Released details or paid',
  verified_independently: 'Verified independently',
  used_contact_from_the_message: 'Used the contact in the message',
  reported_without_checking: 'Reported without checking',
  reported_or_blocked: 'Reported or blocked',
  resolved_as_required: 'Resolved as required',
  final_action_conflicted: 'Final action conflicted',
  abandoned_the_scenario: 'Abandoned the scenario',
  /**
   * IMMERSIVE-001. The server has always been able to send this step; without an entry
   * here it fell back to the raw slug, so a timed-out replay read "time_ran_out".
   */
  time_ran_out: 'Time ran out',
  /** ENHANCEMENT-003. Demo User only. */
  skipped_in_demonstration: 'Skipped (Demo)',

  /**
   * REVIEW-001. These two appear only in a CORRECT path, never in a learner's own: the
   * server phrases the expected resolve step for the disposition the item actually had,
   * because "resolved as required" tells a learner who got it wrong nothing.
   */
  reported_or_blocked_it: 'Report and block it',
  kept_it_and_continued: 'Keep it and carry on',
}

/* ------------------------------------------------------------------ *
 * Learning review (REVIEW-001)
 * ------------------------------------------------------------------ */

/**
 * The three shapes a scenario review can take. The server decides which; this only
 * chooses how it looks.
 */
export const REVIEW_STATUS = {
  correct: {
    label: 'Correct action',
    tone: 'success',
  },
  mistake: {
    label: 'Mistake',
    tone: 'danger',
  },
  not_resolved: {
    label: 'No decision recorded',
    tone: 'neutral',
  },
  /** ENHANCEMENT-003. Demo User only. */
  skipped: {
    label: 'Skipped (Demo)',
    tone: 'neutral',
  },
}

/**
 * The learning-issue names, as the server sends them.
 *
 * `label` and `description` both arrive in the payload; these are the fallbacks used when
 * an older server omits them, so the card never renders a bare slug.
 */
export const LEARNING_ISSUE_LABELS = {
  missed_threat: 'Missed threat',
  false_positive: 'Genuine item rejected',
  unsafe_handling: 'Unsafe step on a genuine item',
}

/** The six headings of a mistake card, in the order a learner reads them. */
export const REVIEW_HEADINGS = {
  what_you_did: 'What you did',
  what_you_missed: 'What you missed',
  correct_action: 'Correct action',
  why_it_mattered: 'Why it mattered',
  safe_response: 'Safe response',
  key_cue: 'Key cue',
  safe_habit: 'Safe habit',
  your_path: 'Your path',
  correct_path: 'Correct path',
}

/** Stage names for the path replay and the action-stage breakdown. */
export const STAGE_LABELS = {
  notify: 'Notify',
  open: 'Open',
  inspect: 'Inspect',
  branch: 'Branch',
  verify: 'Verify',
  resolve: 'Resolve',
}

/** Why a comparison was not offered. Never phrased as the learner's failing. */
export const COMPARISON_REASONS = {
  no_previous_attempt: 'This is your first completed attempt, so there is nothing to compare with yet.',
  not_comparable:
    'Your previous attempt used different content or a different mode, so the two are not directly comparable.',
}

export const label = (map, key, fallback) => map[key] ?? fallback ?? key

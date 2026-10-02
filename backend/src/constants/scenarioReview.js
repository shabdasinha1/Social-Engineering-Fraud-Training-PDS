import { SAFE_PATH_CODES } from './scenarioDefinition.js'
import { OUTCOME_CLASSES, PATH_LABELS } from './resultProjection.js'

/**
 * The learner-facing REVIEW vocabulary (REVIEW-001).
 *
 * RESULT-001 answers "what did I score". This file is what turns that into "what did I
 * do, what was wrong, what did I miss, what should I have done, why did it matter, what
 * should I remember" - the requested move from an assessment readout to a training
 * simulator.
 *
 * Three boundaries are enforced here rather than by the code that uses it, for the same
 * reason `resultProjection.js` enforces its own:
 *
 * 1. **No engine event code reaches the learner.** A rule is keyed BY an event code and
 *    publishes a `kind` slug of its own. `MISTAKE_KINDS` and `SCORING_EVENTS` share no
 *    value, so a card can never carry the scoring vocabulary by accident.
 * 2. **No point value reaches the learner.** Nothing here holds a number. `severity` is
 *    an ordering hint for choosing a headline, never a score, and it is stripped before
 *    the payload is built.
 * 3. **Nothing here is scenario-specific.** These are descriptions of an ACTION CLASS -
 *    what the learner observably did, and why that class of action carries risk.
 *    Everything specific to a case (the cue that was missed, the action expected at that
 *    stage, the consequence, the habit) comes from the scenario's own authored
 *    `evaluation` content. That is what makes one implementation serve all 100 scenarios
 *    without a single `if (scenario === 'W01')`.
 */

/* ------------------------------------------------------------------ *
 * Review status
 * ------------------------------------------------------------------ */

export const REVIEW_STATUS = {
  /** Nothing material went wrong. Gets the short, positive card. */
  CORRECT: 'correct',
  /** At least one materially incorrect or suboptimal action. Gets the detailed card. */
  MISTAKE: 'mistake',
  /** The clock closed it. Not a mistake, and must never be presented as one. */
  NOT_RESOLVED: 'not_resolved',
  /** ENHANCEMENT-003: the Demo User skipped it. No decision, and nothing about the item revealed. */
  SKIPPED: 'skipped',
}

/* ------------------------------------------------------------------ *
 * Mistake kinds
 * ------------------------------------------------------------------ */

/**
 * Stable learner-facing slugs for the categories the review names.
 *
 * Deliberately NOT the engine's event codes. The engine's vocabulary says what an action
 * was worth; this vocabulary says what the learner did. Keeping them separate is what
 * lets the scoring table change without changing a word the learner reads, and what stops
 * `RISKY_OPEN_REPLY` ever appearing on a training screen.
 */
export const MISTAKE_KINDS = {
  PREMATURE_ACTION: 'premature_action',
  SKIPPED_INSPECTION: 'skipped_inspection',
  ABANDONED_WITHOUT_CHECKING: 'abandoned_without_checking',
  RISKY_ENGAGEMENT: 'risky_engagement',
  UNSAFE_EXTERNAL_ACTION: 'unsafe_external_action',
  RELEASED_DETAILS_OR_PAID: 'released_details_or_paid',
  VERIFIED_THROUGH_THE_MESSAGE: 'verified_through_the_message',
  ACTED_WITHOUT_CHECKING: 'acted_without_checking',
  REJECTED_A_GENUINE_ITEM: 'rejected_a_genuine_item',
  CONTRADICTORY_RESOLUTION: 'contradictory_resolution',
  LEFT_THE_SCENARIO: 'left_the_scenario',

  /** Omissions - a step the scenario offered that was never taken. */
  NO_INSPECTION: 'no_inspection',
  NO_SAFE_PIVOT: 'no_safe_pivot',
  NO_INDEPENDENT_VERIFICATION: 'no_independent_verification',
  NO_CORRECT_RESOLUTION: 'no_correct_resolution',
}

export const MISTAKE_KIND_VALUES = Object.values(MISTAKE_KINDS)

/* ------------------------------------------------------------------ *
 * Commission rules - something the learner DID
 * ------------------------------------------------------------------ */

/**
 * Engine event code -> the learner-facing description of that action class.
 *
 * `what_you_did` describes an observable action and nothing else. It never characterises
 * the learner: "you are careless" and its neighbours are forbidden, and the most reliable
 * way to honour that is for this file to contain no sentence that has an adjective for a
 * person in it.
 *
 * `why_it_mattered` states the risk carried by the ACTION CLASS, not by this case. The
 * case-specific consequence is the scenario's own authored `feedback.impact`, and the
 * card carries both.
 */
export const MISTAKE_RULES = {
  PREMATURE_REPLY: {
    kind: MISTAKE_KINDS.PREMATURE_ACTION,
    stage: 'open',
    label: 'Acted before reading',
    headline: 'You acted on this message before you had read it.',
    what_you_did: 'You replied to, opened or acted on the message straight from the preview, before opening and reading it in full.',
    why_it_mattered: 'A decision taken from a preview is taken without the details that would have changed it, and the preview is the part a sender controls most tightly.',
    severity: 3,
  },

  STAGE_SKIPPED: {
    kind: MISTAKE_KINDS.SKIPPED_INSPECTION,
    stage: 'inspect',
    label: 'Skipped inspection',
    headline: 'You skipped the inspection step.',
    what_you_did: 'You moved on without inspecting the sender, the thread or what the message pointed at.',
    why_it_mattered: 'Inspection is the step where this kind of item shows what it is. Skipping it removes the only evidence available before a decision has to be made.',
    severity: 4,
  },

  NEEDLESS_REJECT_IGNORE: {
    kind: MISTAKE_KINDS.ABANDONED_WITHOUT_CHECKING,
    stage: 'branch',
    label: 'Abandoned without checking',
    headline: 'You dropped the item without checking it.',
    what_you_did: 'You rejected or ignored the item without checking whether it was genuine.',
    why_it_mattered: 'Walking away closes the screen without settling the question. A harmful item stays live for whoever receives it next, and a genuine one is left unanswered.',
    severity: 4,
  },

  RISKY_OPEN_REPLY: {
    kind: MISTAKE_KINDS.RISKY_ENGAGEMENT,
    stage: 'branch',
    label: 'Engaged with the item',
    headline: 'You engaged with the item before it had been verified.',
    what_you_did: 'You opened the link, file or code, replied, or called the number the message supplied, before the request had been verified.',
    why_it_mattered: 'Engaging confirms a real person is reading, and hands the sender a working contact and a next step. It is the point at which a message stops being ignorable.',
    severity: 6,
  },

  UNSAFE_EXTERNAL_ACTION: {
    kind: MISTAKE_KINDS.UNSAFE_EXTERNAL_ACTION,
    stage: 'branch',
    label: 'Took an external action',
    headline: 'You acted outside the conversation on an unverified request.',
    what_you_did: 'You carried the request out of the conversation and acted on it elsewhere before it had been verified.',
    why_it_mattered: 'Once an action leaves the message it leaves the place where it could still be checked, and no step remains that would catch the request being false.',
    severity: 7,
  },

  SECRET_PAYMENT_INSTALL_DATA_RELEASE: {
    kind: MISTAKE_KINDS.RELEASED_DETAILS_OR_PAID,
    stage: 'branch',
    label: 'Released details or paid',
    headline: 'You released details, paid, installed or approved access before verifying.',
    what_you_did: 'You submitted details, attempted a payment, installed something or approved access while the request was still unverified.',
    why_it_mattered: 'This is the step that cannot be taken back. A code, a credential, a payment or an approval is useful to whoever receives it the moment it arrives.',
    severity: 10,
  },

  VERIFY_THROUGH_MESSAGE: {
    kind: MISTAKE_KINDS.VERIFIED_THROUGH_THE_MESSAGE,
    stage: 'verify',
    label: 'Checked using the message itself',
    headline: 'You checked the request using contact details from the message itself.',
    what_you_did: 'You verified the request through a number, link or contact supplied inside the message you were checking.',
    why_it_mattered: 'A check that uses the message to confirm the message settles nothing. Whoever wrote it also chose what the check would find.',
    severity: 5,
  },

  REPORT_ONLY_WITHOUT_CHECK: {
    kind: MISTAKE_KINDS.ACTED_WITHOUT_CHECKING,
    stage: 'verify',
    label: 'Decided without checking',
    headline: 'You decided without checking through a source you already trusted.',
    what_you_did: 'You went straight to reporting or blocking without first checking the request through a channel you already held.',
    why_it_mattered: 'The outcome happened to be safe, but it was reached without evidence. The same decision, made the same way on a genuine item, rejects it.',
    severity: 2,
  },

  FALSE_REPORT_BLOCK: {
    kind: MISTAKE_KINDS.REJECTED_A_GENUINE_ITEM,
    stage: 'verify',
    label: 'Rejected a genuine item',
    headline: 'You reported or blocked an item that was genuine.',
    what_you_did: 'You reported or blocked the sender rather than checking the request and letting it stand.',
    why_it_mattered: 'Rejecting genuine traffic stops real work, and it trains the people around you to route around the reporting channel - the channel that has to work when something really is wrong.',
    severity: 6,
  },

  CONTRADICTORY_UNSAFE_FINAL: {
    kind: MISTAKE_KINDS.CONTRADICTORY_RESOLUTION,
    stage: 'resolve',
    label: 'Final action did not match',
    headline: 'Your final action did not match what this item turned out to be.',
    what_you_did: 'You closed the scenario with a final action that did not match what the item actually was.',
    why_it_mattered: 'The final action is what is left behind once the screen closes. It decides whether the item is stopped, and whether anyone else is warned about it.',
    severity: 8,
  },

  RUN_ABANDONED: {
    kind: MISTAKE_KINDS.LEFT_THE_SCENARIO,
    stage: 'resolve',
    label: 'Left before resolving',
    headline: 'You left this scenario before choosing a final action.',
    what_you_did: 'You left the scenario at the resolve step without completing it.',
    why_it_mattered: 'An item nobody has decided about stays open for the next person who sees it.',
    severity: 3,
  },
}

/* ------------------------------------------------------------------ *
 * Omission rules - a step the scenario offered that was never taken
 * ------------------------------------------------------------------ */

/**
 * The safe-path event code each graded stage is worth, and what it means for the learner
 * never to have earned it.
 *
 * An omission is raised only when the scenario ITSELF declares that code at that stage,
 * so a scenario is never marked down for a step it never offered. This is the whole
 * reason the review needs no per-scenario configuration: the scenario's own scoring
 * declaration already records which steps existed.
 *
 * A stage that already produced a commission mistake raises no omission - the learner did
 * something there, and saying both "you did X" and "you did nothing" about one moment
 * would be two claims about it, one of which is false.
 */
export const OMISSION_RULES = {
  inspect: {
    requires: ['INSPECT_CONTEXT'],
    kind: MISTAKE_KINDS.NO_INSPECTION,
    label: 'Details never inspected',
    headline: 'You never inspected the details this scenario offered.',
    what_you_did: 'You reached a decision without opening the sender, thread or target details that were available to you.',
    why_it_mattered: 'The evidence that separates a genuine item from an imitation of one is in those details. Without them the decision rests on the message alone.',
    severity: 5,
  },
  branch: {
    requires: ['SAFE_PIVOT', 'CORRECT_USE'],
    kind: MISTAKE_KINDS.NO_SAFE_PIVOT,
    label: 'Safe route not taken',
    headline: 'The safe route out of this request was available and was not taken.',
    what_you_did: 'You did not decline the request or use the official route, both of which this scenario offered.',
    why_it_mattered: 'Declining, or stepping onto the official route, ends the pressure the message is applying - and it is available before anything has to be risked.',
    severity: 6,
  },
  verify: {
    requires: ['TRUSTED_VERIFY'],
    kind: MISTAKE_KINDS.NO_INDEPENDENT_VERIFICATION,
    label: 'Never verified independently',
    headline: 'You never checked this through a source you already trusted.',
    what_you_did: 'You resolved the scenario without checking the request through an app, number or directory you already held.',
    why_it_mattered: 'Independent verification is the one step whose answer the sender cannot influence, which is what makes it the step that settles the question.',
    severity: 6,
  },
  resolve: {
    requires: ['RESOLVE_CORRECT'],
    kind: MISTAKE_KINDS.NO_CORRECT_RESOLUTION,
    label: 'Not closed as required',
    headline: 'This scenario was not closed the way it needed to be.',
    what_you_did: 'You did not finish the scenario with the final action this item called for.',
    why_it_mattered: 'The final action is the part that persists after the screen closes, and it is what decides whether the item is stopped.',
    severity: 7,
  },
}

/** The stages an omission may be raised for, in six-stage order. */
export const OMISSION_STAGES = Object.keys(OMISSION_RULES)

/* ------------------------------------------------------------------ *
 * The correct path
 * ------------------------------------------------------------------ */

/**
 * The safe-path event codes, in stage order, and the path step each corresponds to.
 *
 * Read out of `PATH_LABELS` rather than restated, so the correct path and the learner's
 * own path are drawn from one vocabulary and can never describe the same action with two
 * different words.
 */
export const EXPECTED_PATH_CODES = ['NOTIFY_SEEN', 'ITEM_OPEN', ...SAFE_PATH_CODES]

export const EXPECTED_PATH_STEPS = Object.fromEntries(
  EXPECTED_PATH_CODES.map((code) => [code, PATH_LABELS[code]]),
)

/**
 * The resolve step, phrased for the disposition the scenario actually had.
 *
 * "Resolved as required" is accurate but tells a learner who got it wrong nothing. These
 * two say what "as required" meant for THIS item, and which one applies is decided by the
 * scenario's own `disposition` - so the mechanism is generic and the sentence is specific.
 */
export const CORRECT_RESOLUTION_STEPS = {
  malicious: { stage: 'resolve', action: 'reported_or_blocked_it' },
  legitimate: { stage: 'resolve', action: 'kept_it_and_continued' },
}

/** What the resolve stage required, in a sentence, for a resolve-stage mistake. */
export const REQUIRED_RESOLUTION_TEXT = {
  malicious: 'This item was harmful. It needed to be reported or blocked, so that it was stopped and recorded.',
  legitimate: 'This item was genuine. It needed to be kept and acted on normally, with no report or block.',
}

/* ------------------------------------------------------------------ *
 * Learning issue - the missed-threat / false-positive distinction
 * ------------------------------------------------------------------ */

/**
 * RESULT-001 already decided this, from the disposition and the ledger. The review does
 * not re-derive it: it reads `outcome_class` and gives it a learner-facing name, so the
 * two surfaces can never disagree about whether something was a missed threat.
 *
 * Deliberately absent for `handled_safely` and `not_resolved`: neither is a learning
 * issue, and inventing a label for them would put a diagnosis on a clean scenario.
 */
export const LEARNING_ISSUES = {
  [OUTCOME_CLASSES.MISSED_THREAT]: {
    key: 'missed_threat',
    label: 'Missed threat',
    description: 'This item was harmful and was not stopped, or was acted on before it was stopped.',
  },
  [OUTCOME_CLASSES.FALSE_POSITIVE]: {
    key: 'false_positive',
    label: 'Genuine item rejected',
    description: 'This item was genuine and was reported, blocked or abandoned.',
  },
  [OUTCOME_CLASSES.UNSAFE_HANDLING]: {
    key: 'unsafe_handling',
    label: 'Unsafe step on a genuine item',
    description: 'This item was genuine and was kept, but an unsafe action happened on the way there.',
  },
}

/* ------------------------------------------------------------------ *
 * Headlines for the non-mistake cases
 * ------------------------------------------------------------------ */

export const CORRECT_HEADLINE = 'You handled this one correctly.'

export const NOT_RESOLVED_HEADLINE = 'The time limit closed this scenario before you reached a decision.'

/** ENHANCEMENT-003. Worded about the skip, never about the scenario: it must not hint at the answer. */
export const SKIPPED_HEADLINE = 'You skipped this scenario during the demonstration.'

export const SKIPPED_NOTE = 'No decision was recorded, so nothing is marked right or wrong here.'

export const NOT_RESOLVED_NOTE = 'No decision was recorded here, so there is nothing to mark right or wrong. What follows is what the scenario was, so you can read it before your next attempt.'

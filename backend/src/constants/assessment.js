/**
 * Values fixed by the approved proposal and the BE-000 design
 * (docs/QUESTION_ENGINE_DESIGN.md). Changing anything here changes the
 * product, not just the code.
 */

export const CHANNELS = ['whatsapp', 'instagram', 'sms', 'email']

/** Scenarios per channel in the MVP pool: 40 total. */
export const SCENARIOS_PER_CHANNEL = 10
export const SCENARIO_POOL_SIZE = SCENARIOS_PER_CHANNEL * CHANNELS.length

/** One assessment is always this many scenarios, mixed across all channels. */
export const ASSESSMENT_SCENARIO_COUNT = 10

export const SCENARIO_TYPES = ['malicious', 'legitimate']

/**
 * The only malicious / legitimate splits an assessment may use. The question
 * engine picks one per assessment, so the ratio varies between attempts.
 * Never 10/0 and never 0/10.
 */
export const ASSESSMENT_COMPOSITIONS = [
  { malicious: 6, legitimate: 4 },
  { malicious: 7, legitimate: 3 },
  { malicious: 8, legitimate: 2 },
]

/** Three-way classification, per the proposal's scoring model. */
export const JUDGEMENTS = ['genuine', 'fraudulent', 'needs_verification']

export const ASSESSMENT_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'ABANDONED']

/** Marks bounds from the proposal. Enforced on scenario option data. */
export const MARKS = {
  judgement: { min: 0, max: 3 },
  action: { min: -5, max: 5 },
  reason: { min: 0, max: 2 },
  scenario: { min: -5, max: 10 },
}

/** Emotional Vulnerability Index triggers. A training indicator, not clinical. */
export const EVI_CATEGORIES = [
  'authority_fear',
  'urgency',
  'greed_reward',
  'empathy_trust',
  'curiosity',
  'romance_attraction',
  'routine_convenience',
]

/** Proposal bands. Applied to the final 0-100 score once aggregation is confirmed. */
export const PERFORMANCE_BANDS = [
  { min: 85, max: 100, label: 'Strong' },
  { min: 70, max: 84, label: 'Developing' },
  { min: 50, max: 69, label: 'Needs Reinforcement' },
  { min: 0, max: 49, label: 'Immediate Coaching' },
]

/** Simulation model - see QUESTION_ENGINE_DESIGN.md section 3. */
export const SCREEN_KINDS = [
  'list',
  'thread',
  'inbox',
  'message',
  'feed',
  'profile',
  'document',
]

export const BLOCK_TYPES = [
  'message',
  'listItem',
  'image',
  'linkPreview',
  'attachment',
  'emailHeader',
  'emailBody',
  'profileHeader',
  'post',
  'note',
]

export const INTERACTION_TYPES = [
  'open-link',
  'open-attachment',
  'enter-otp',
  'enter-credentials',
  'make-payment',
  'call-number',
]

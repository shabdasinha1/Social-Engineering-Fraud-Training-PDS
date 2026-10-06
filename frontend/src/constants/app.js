/** The product name shown in headers and sidebars (the /login page carries its own). */
export const BRAND_NAME = 'SATARK'
/** The browser tab title on every learner route, exactly (index.html carries the same default). */
export const LEARNER_DOCUMENT_TITLE = 'SATARK'
/** The browser tab title on every admin route, exactly. */
export const ADMIN_DOCUMENT_TITLE = 'SATARK Admin'
export const SIMULATION_LABEL = 'TRAINING SIMULATION'

/**
 * The client scenario bank (DATA-002): 100 six-stage scenarios, 25 per platform.
 * An attempt is ONE mixed set of 10 drawn from that bank by the server, not four
 * separate per-platform tests.
 *
 * The legacy 40-scenario pool still exists behind the legacy journey; these numbers
 * describe the bank the assessment actually uses.
 */
export const SCENARIOS_PER_CHANNEL = 25
export const SCENARIO_POOL_SIZE = 100
export const ASSESSMENT_SCENARIO_COUNT = 10

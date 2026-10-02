export const APP_NAME = 'Cyber Awareness Training'
export const APP_TAGLINE = 'Fraud Detection Simulation'
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

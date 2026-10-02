/**
 * DEVELOPMENT ONLY - plays one named scenario through the real HTTP API, so a scene can be
 * exercised end to end without waiting for the selection engine to deal it.
 *
 * It creates an attempt, walks its runs until the requested scenario comes up, drives the
 * given intent path through the real engine, and prints the run's committed score and
 * outcome. Nothing is written to Mongo directly and no score is computed here: every event
 * code, point value and stage transition is the engine's.
 *
 * SECURITY-001: the API takes only the opaque action codes `/current-run` issues, so each
 * intent below is sent as the code of the control that submits it (`lib/learnerActions.js`).
 *
 * Point it at an ISOLATED database. It refuses to run against the production one.
 *
 *   MONGO_URI=mongodb://127.0.0.1:27017/<isolated>?replicaSet=rs0 PORT=5055 node src/server.js
 *   MONGO_URI=... PIN_WHATSAPP=W06,W07,W08 node scripts/playScenario.js W06 safe
 *
 * `PIN_WHATSAPP` narrows the ACTIVE WhatsApp pool in the isolated database so the selection
 * engine has to deal the scenarios being exercised - an attempt takes only three WhatsApp
 * items out of twenty-five, so waiting for a specific one is otherwise a lottery. The
 * selector, its quotas and its seeding are untouched: it still chooses freely, from a
 * smaller pool. Everything is restored before the script exits, including on failure.
 */
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { Attempt } from '../src/models/Attempt.js'
import { Candidate } from '../src/models/Candidate.js'
import { ScenarioDefinition } from '../src/models/ScenarioDefinition.js'
import { ScenarioEvent } from '../src/models/ScenarioEvent.js'
import { ScenarioRun } from '../src/models/ScenarioRun.js'
import { codeFromActions } from './lib/learnerActions.js'

const BASE = process.env.API_BASE || 'http://127.0.0.1:5055/api'

if (/cyber_awareness_training(\?|$)/.test(env.mongoUri)) {
  throw new Error('refusing to play scenarios against the primary database')
}

let seq = 0
const key = (label) => `${label}-${Date.now()}-${(seq += 1)}`

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, cookie: res.headers.getSetCookie?.()[0]?.split(';')[0] }
}

/**
 * The paths each W06-W25 scene offers, in learner intents.
 *
 * `safe` is the route the client's own expected safe behaviour describes, and must score
 * the full ten. The others are the unsafe routes the scene makes reachable.
 */
const PATHS = {
  // IMMERSIVE-004B regression: the first WhatsApp scene's safe route.
  W01: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    // IMMERSIVE-AUDIT-001: an unsafe route, and W02-W05, so all fifty can be played over HTTP.
    code: ['open_item', 'read', 'inspect_sender', 'share_secret', 'verify_in_message_contact', 'resolve_retain'],
  },
  W02: {
    safe: ['open_item', 'read', 'inspect_link', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'open_link', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
  },
  W03: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_trusted_directory', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  W04: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    pay: ['open_item', 'read', 'skip_inspection', 'attempt_payment', 'verify_in_message_contact', 'resolve_retain'],
  },
  W05: {
    safe: ['open_item', 'read', 'inspect_link', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_sender', 'submit_data', 'report', 'resolve_report'],
  },
  W06: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    release: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    premature: ['open_item', 'reply', 'safe_pivot', 'verify_trusted_directory', 'resolve_report'],
  },
  W07: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_retain'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
    install: ['open_item', 'read', 'preview_file', 'attempt_install', 'verify_known_number', 'resolve_retain'],
  },
  W08: {
    safe: ['open_item', 'read', 'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    release: ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    scan: ['open_item', 'read', 'inspect_qr', 'scan_qr', 'verify_known_app', 'resolve_report'],
  },
  W09: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    pay: ['open_item', 'read', 'inspect_sender', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
    reportonly: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'report', 'resolve_report'],
  },
  W10: {
    safe: ['open_item', 'read', 'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    link: ['open_item', 'read', 'skip_inspection', 'approve_device_link', 'verify_in_message_contact', 'resolve_continue'],
    scan: ['open_item', 'read', 'inspect_qr', 'scan_qr', 'verify_known_app', 'resolve_report'],
  },
  // IMMERSIVE-003C
  W11: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    helpline: ['open_item', 'read', 'inspect_sender', 'call_number', 'verify_known_app', 'resolve_retain'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  W12: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    pay: ['open_item', 'call_number', 'attempt_payment', 'verify_in_message_contact', 'resolve_report'],
    stay: ['open_item', 'read', 'inspect_sender', 'call_number', 'verify_known_number', 'resolve_report'],
  },
  W13: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    deposit: ['open_item', 'read', 'inspect_link', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
    dm: ['open_item', 'read', 'inspect_profile', 'reply', 'report', 'resolve_report'],
  },
  W14: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    install: ['open_item', 'read', 'preview_file', 'attempt_install', 'verify_known_app', 'resolve_report'],
    premature: ['open_item', 'attempt_install', 'safe_pivot', 'verify_known_number', 'resolve_block'],
  },
  W15: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    phrase: ['open_item', 'read', 'preview_file', 'share_secret', 'verify_in_message_contact', 'resolve_continue'],
    callback: ['open_item', 'read', 'inspect_sender', 'call_number', 'verify_known_number', 'resolve_report'],
  },
  // IMMERSIVE-003D
  W16: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    overshare: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_trusted_directory', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'report', 'resolve_report'],
  },
  W17: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    recharge: ['open_item', 'reply', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
    bank: ['open_item', 'read', 'inspect_link', 'submit_data', 'verify_known_app', 'resolve_block'],
  },
  W18: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_in_message_contact', 'resolve_retain'],
    forward: ['open_item', 'read', 'inspect_sender', 'reply', 'report', 'resolve_report'],
  },
  W19: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_block'],
    share: ['open_item', 'read', 'read_thread', 'share_location', 'verify_in_message_contact', 'resolve_continue'],
    ask: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_known_number', 'resolve_report'],
  },
  W20: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    release: ['open_item', 'read', 'inspect_sender', 'attempt_payment', 'verify_in_message_contact', 'resolve_report'],
    submitchange: ['open_item', 'read', 'preview_file', 'submit_data', 'verify_trusted_directory', 'resolve_report'],
  },
  // IMMERSIVE-003E
  W21: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    ask: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'block', 'resolve_report'],
  },
  W22: {
    safe: ['open_item', 'read', 'read_thread', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    deposit: ['open_item', 'read', 'read_thread', 'attempt_payment', 'verify_in_message_contact', 'resolve_retain'],
    proof: ['open_item', 'read', 'inspect_sender', 'reply', 'report', 'resolve_report'],
  },
  W23: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    ask: ['open_item', 'read', 'preview_file', 'reply', 'verify_known_number', 'resolve_report'],
  },
  W24: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    share: ['open_item', 'read', 'preview_file', 'share_secret', 'verify_in_message_contact', 'resolve_continue'],
    install: ['open_item', 'open_link', 'attempt_install', 'verify_known_number', 'resolve_report'],
  },
  W25: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    link: ['open_item', 'read', 'inspect_sender', 'approve_device_link', 'verify_in_message_contact', 'resolve_retain'],
    code: ['open_item', 'read', 'read_thread', 'share_secret', 'verify_known_number', 'resolve_report'],
  },
  // IMMERSIVE-004A - Instagram
  I01: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    login: ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    fee: ['open_item', 'reply', 'attempt_payment', 'block', 'resolve_ignore'],
  },
  I02: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    appeal: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_in_message_contact', 'resolve_retain'],
    reply: ['open_item', 'read', 'read_thread', 'reply', 'report', 'resolve_report'],
  },
  I03: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'report', 'resolve_report'],
    link: ['open_item', 'read', 'inspect_profile', 'open_link', 'verify_known_number', 'resolve_retain'],
  },
  I04: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    pay: ['open_item', 'read', 'inspect_profile', 'attempt_payment', 'verify_in_message_contact', 'resolve_retain'],
    ask: ['open_item', 'reply', 'reply', 'report', 'resolve_block'],
  },
  I05: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    route: ['open_item', 'read', 'read_thread', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    ask: ['open_item', 'read', 'inspect_profile', 'reply', 'verify_known_number', 'resolve_block'],
  },
  // IMMERSIVE-004B - Instagram
  I06: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    tag: ['open_item', 'read', 'inspect_profile', 'share_location', 'verify_known_number', 'resolve_report'],
    dm: ['open_item', 'read', 'read_thread', 'reply', 'report', 'resolve_continue'],
  },
  I07: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'block', 'resolve_report'],
    download: ['open_item', 'read', 'inspect_profile', 'open_link', 'verify_known_app', 'resolve_continue'],
  },
  I08: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    apply: ['open_item', 'reply', 'submit_data', 'verify_in_message_contact', 'resolve_retain'],
    fee: ['open_item', 'read', 'inspect_profile', 'attempt_payment', 'report', 'resolve_block'],
  },
  I09: {
    safe: ['open_item', 'read', 'inspect_link', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    install: ['open_item', 'read', 'inspect_profile', 'attempt_install', 'verify_known_app', 'resolve_report'],
    join: ['open_item', 'read', 'inspect_link', 'open_link', 'verify_in_message_contact', 'resolve_report'],
  },
  I10: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    sign: ['open_item', 'read', 'skip_inspection', 'submit_data', 'report', 'resolve_continue'],
    yes: ['open_item', 'read', 'read_thread', 'reply', 'verify_known_app', 'resolve_block'],
  },

  // IMMERSIVE-004C - Instagram I11-I15.
  I11: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_retain'],
    comment: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'report', 'resolve_report'],
  },
  I12: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    code: ['open_item', 'read', 'inspect_profile', 'share_secret', 'verify_in_message_contact', 'resolve_retain'],
    page: ['open_item', 'reply', 'submit_data', 'report', 'resolve_continue'],
  },
  I13: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    gift: ['open_item', 'read', 'skip_inspection', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    wallet: ['open_item', 'read', 'inspect_profile', 'attempt_payment', 'verify_known_app', 'resolve_report'],
  },
  I14: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_trusted_directory', 'resolve_report'],
    files: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_in_message_contact', 'resolve_retain'],
    form: ['open_item', 'read', 'inspect_profile', 'open_link', 'report', 'resolve_report'],
  },
  I15: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    approve: ['open_item', 'read', 'inspect_profile', 'approve_device_link', 'verify_known_app', 'resolve_report'],
    login: ['open_item', 'open_link', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
  },

  // IMMERSIVE-004D - Instagram I16-I20.
  I16: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    caption: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'report', 'resolve_report'],
  },
  I17: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'read_thread', 'attempt_payment', 'verify_in_message_contact', 'resolve_ignore'],
    plead: ['open_item', 'read', 'inspect_profile', 'reply', 'report', 'resolve_report'],
  },
  I18: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    pin: ['open_item', 'read', 'skip_inspection', 'share_location', 'verify_in_message_contact', 'resolve_retain'],
    ask: ['open_item', 'read', 'inspect_profile', 'reply', 'report', 'resolve_report'],
  },
  I19: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    tag: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_known_app', 'resolve_report'],
    repost: ['open_item', 'reply', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  I20: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    form: ['open_item', 'read', 'inspect_profile', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
    general: ['open_item', 'reply', 'reply', 'block', 'resolve_retain'],
  },

  // IMMERSIVE-004E - Instagram I21-I25.
  I21: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    album: ['open_item', 'read', 'inspect_profile', 'open_link', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'skip_inspection', 'reject_ignore', 'block', 'resolve_report'],
  },
  I22: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    code: ['open_item', 'read', 'inspect_profile', 'share_secret', 'verify_in_message_contact', 'resolve_continue'],
    ask: ['open_item', 'read', 'read_thread', 'reply', 'report', 'resolve_block'],
  },
  I23: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'skip_inspection', 'attempt_payment', 'verify_in_message_contact', 'resolve_retain'],
    share: ['open_item', 'read', 'inspect_profile', 'reply', 'verify_known_app', 'resolve_report'],
  },
  I24: {
    safe: ['open_item', 'read', 'inspect_profile', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    install: ['open_item', 'read', 'inspect_profile', 'attempt_install', 'verify_known_app', 'resolve_report'],
    tax: ['open_item', 'open_link', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
  },
  I25: {
    safe: ['open_item', 'read', 'inspect_qr', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    form: ['open_item', 'read', 'inspect_qr', 'submit_data', 'verify_known_number', 'resolve_report'],
    scan: ['open_item', 'read', 'inspect_profile', 'scan_qr', 'verify_in_message_contact', 'resolve_ignore'],
  },
  // IMMERSIVE-005 - Email E01-E05.
  E01: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_in_message_contact', 'resolve_continue'],
  },
  E02: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    enable: ['open_item', 'read', 'preview_file', 'open_file', 'verify_known_number', 'resolve_report'],
    save: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
  },
  E03: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
    forward: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_report'],
  },
  E04: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'inspect_sender', 'attempt_payment', 'verify_in_message_contact', 'resolve_continue'],
    open: ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_known_app', 'resolve_report'],
  },
  E05: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    reply: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  // IMMERSIVE-007 - Email E11-E15.
  E11: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    search: ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  E12: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    signin: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    approve: ['open_item', 'read', 'inspect_sender', 'approve_device_link', 'verify_known_number', 'resolve_continue'],
  },
  E13: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    run: ['open_item', 'read', 'preview_file', 'attempt_install', 'verify_known_app', 'resolve_report'],
    extract: ['open_item', 'read', 'inspect_sender', 'open_file', 'verify_in_message_contact', 'resolve_continue'],
  },
  E14: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    submit: ['open_item', 'read', 'preview_file', 'submit_data', 'verify_known_number', 'resolve_report'],
    scan: ['open_item', 'read', 'inspect_sender', 'scan_qr', 'verify_in_message_contact', 'resolve_continue'],
  },
  E15: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    grant: ['open_item', 'read', 'inspect_sender', 'approve_device_link', 'verify_known_app', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_in_message_contact', 'resolve_continue'],
  },
  // IMMERSIVE-008 - Email E16-E20.
  E16: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    forward: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  E17: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    call: ['open_item', 'read', 'inspect_sender', 'call_number', 'verify_known_app', 'resolve_report'],
    reply: ['open_item', 'read', 'read_thread', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  E18: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    release: ['open_item', 'read', 'inspect_sender', 'attempt_payment', 'verify_known_number', 'resolve_report'],
    beneficiary: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_in_message_contact', 'resolve_continue'],
  },
  E19: {
    safe: ['open_item', 'read', 'preview_file', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    answer: ['open_item', 'read', 'preview_file', 'share_secret', 'verify_known_number', 'resolve_report'],
    forward: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  E20: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'preview_file', 'attempt_payment', 'verify_known_app', 'resolve_report'],
    upload: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_in_message_contact', 'resolve_ignore'],
  },
  // IMMERSIVE-009 - Email E21-E25. E21 is the legitimate control, so its safe path COMPLETES
  // the change and its unsafe paths are over-rejection and breaking dual control.
  E21: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_continue'],
    reject: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'verify_known_app', 'resolve_continue'],
    release: ['open_item', 'read', 'read_thread', 'attempt_payment', 'verify_known_app', 'resolve_continue'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  E22: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    confirm: ['open_item', 'read', 'preview_file', 'attempt_payment', 'verify_known_app', 'resolve_report'],
    reply: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  E23: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    signin: ['open_item', 'read', 'preview_file', 'submit_data', 'verify_known_app', 'resolve_report'],
    install: ['open_item', 'read', 'preview_file', 'attempt_install', 'verify_known_number', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_sender', 'open_file', 'verify_in_message_contact', 'resolve_continue'],
  },
  E24: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    signin: ['open_item', 'read', 'preview_file', 'submit_data', 'verify_known_app', 'resolve_report'],
    scan: ['open_item', 'read', 'preview_file', 'scan_qr', 'verify_known_app', 'resolve_report'],
    reply: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  E25: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    approve: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    release: ['open_item', 'read', 'read_thread', 'attempt_payment', 'verify_known_number', 'resolve_report'],
    forward: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  // IMMERSIVE-010 - SMS S01-S05. S03 is the legitimate control, so its safe path marks the
  // matching transaction reviewed and its unsafe paths are over-rejection and replying.
  S01: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    submit: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_link', 'open_link', 'verify_known_number', 'resolve_report'],
    reply: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  S02: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_number', 'resolve_report'],
    install: ['open_item', 'read', 'inspect_sender', 'attempt_install', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'read_thread', 'attempt_payment', 'verify_known_app', 'resolve_report'],
    reply: ['open_item', 'read', 'inspect_sender', 'reply', 'verify_in_message_contact', 'resolve_continue'],
  },
  S03: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_continue'],
    block: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'verify_known_app', 'resolve_continue'],
    call: ['open_item', 'read', 'read_thread', 'call_number', 'verify_known_number', 'resolve_retain'],
    falsepositive: ['open_item', 'read', 'inspect_sender', 'reject_ignore', 'report', 'resolve_report'],
  },
  S04: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    pay: ['open_item', 'read', 'inspect_sender', 'attempt_payment', 'verify_known_app', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_link', 'open_link', 'verify_known_number', 'resolve_report'],
    call: ['open_item', 'read', 'inspect_sender', 'call_number', 'verify_in_message_contact', 'resolve_continue'],
  },
  S05: {
    safe: ['open_item', 'read', 'inspect_sender', 'safe_pivot', 'verify_known_app', 'resolve_report'],
    address: ['open_item', 'read', 'inspect_sender', 'submit_data', 'verify_known_app', 'resolve_report'],
    mandate: ['open_item', 'read', 'inspect_link', 'attempt_payment', 'verify_known_number', 'resolve_report'],
    open: ['open_item', 'read', 'inspect_sender', 'open_link', 'verify_in_message_contact', 'resolve_continue'],
  },
}

const [scenarioId, pathName = 'safe'] = process.argv.slice(2)
const intents = PATHS[scenarioId]?.[pathName]
if (!intents) {
  throw new Error(`no path "${pathName}" for ${scenarioId}. `
    + `Known: ${Object.keys(PATHS[scenarioId] ?? {}).join(', ') || '(unknown scenario)'}`)
}

await mongoose.connect(env.mongoUri)

/**
 * Narrow the active WhatsApp pool, remembering exactly what was changed so it can be put
 * back. Only the isolated verification database is ever touched: the guard above refuses
 * to run against the production one at all.
 */
/**
 * `PIN_WHATSAPP` (003B) and, from IMMERSIVE-004A, `PIN_INSTAGRAM` narrow their own platform's
 * pool; each deactivates only the other scenarios of that platform.
 */
const pins = [
  ['whatsapp', process.env.PIN_WHATSAPP],
  ['instagram', process.env.PIN_INSTAGRAM],
  ['email', process.env.PIN_EMAIL],
  ['sms', process.env.PIN_SMS],
].map(([platform, value]) => [platform, (value ?? '').split(',').map((id) => id.trim()).filter(Boolean)])
let deactivated = []

async function restorePool() {
  if (deactivated.length) {
    await ScenarioDefinition.updateMany({ _id: { $in: deactivated } }, { $set: { active: true } })
    deactivated = []
  }
}

for (const [platform, ids] of pins) {
  if (!ids.length) continue
  const others = await ScenarioDefinition.find({
    platform, active: true, scenario_id: { $nin: ids },
  }).select('_id')
  const batch = others.map((doc) => doc._id)
  await ScenarioDefinition.updateMany({ _id: { $in: batch } }, { $set: { active: false } })
  deactivated = [...deactivated, ...batch]
  console.log(`pinned ${platform} pool to ${ids.join(', ')} (${batch.length} deactivated)`)
}

process.on('exit', () => {
  if (deactivated.length) {
    console.error('WARNING: the pinned pool may not have been restored; re-run the import.')
  }
})

const identifier = `RB${String(Date.now()).slice(-6)}`
const signIn = await call('/candidates', {
  method: 'POST', body: { name: `Play ${scenarioId}`, identifier },
})
if (signIn.status !== 201) throw new Error(`sign-in failed: ${JSON.stringify(signIn.data)}`)
const cookie = signIn.cookie

const created = await call('/attempts', { method: 'POST', cookie })
const attemptId = created.data.attempt.attempt_id

/**
 * Every intent that might be legal at a stage, most convenient first.
 *
 * Which of them a given scenario actually declares is the scenario's own decision, so the
 * walk tries them in order and takes the first the engine accepts. A fixed list would spin
 * forever on any scenario that happens not to declare the one intent it names.
 */
const ANY_INTENT = {
  notify: ['open_item'],
  open: ['read'],
  inspect: ['skip_inspection', 'inspect_sender', 'read_thread'],
  branch: ['safe_pivot', 'reject_ignore', 'reply', 'open_link', 'submit_data'],
  verify: ['report', 'block', 'verify_trusted_directory', 'verify_in_message_contact'],
}

/** Moves a run to its resolve stage by whatever route its scenario happens to allow. */
async function walkToResolve(start, actions) {
  let run = start
  for (let step = 0; step < 6 && run.current_stage !== 'resolve'; step += 1) {
    let moved = false
    for (const intent of ANY_INTENT[run.current_stage] ?? []) {
      const code = codeFromActions(actions, run.scenario_id, run.current_stage, intent)
      if (!code) continue
      const res = await call(`/attempts/${attemptId}/runs/${run.run_id}/events`, {
        method: 'POST', cookie, body: { action_code: code, intent_key: key(intent) },
      })
      if (res.status === 200) { run = res.data.run; moved = true; break }
    }
    if (!moved) break
  }
  return run
}

/** Walk past whatever the selection engine dealt until the wanted scenario is current. */
let target = null
let targetActions = null
for (let i = 0; i < 12 && !target; i += 1) {
  const current = await call(`/attempts/${attemptId}/current-run`, { cookie })
  let run = current.data.run
  if (!run) break
  if (run.scenario_id === scenarioId) { target = run; targetActions = current.data.actions; break }

  run = await walkToResolve(run, current.data.actions)
  const closed = await call(`/attempts/${attemptId}/runs/${run.run_id}/resolve`, {
    method: 'POST',
    cookie,
    body: {
      action_code: codeFromActions(current.data.actions, run.scenario_id, 'resolve', 'resolve_report'),
      intent_key: key('resolve'),
    },
  })
  if (closed.status !== 200) {
    throw new Error(`could not close ${run.scenario_id}: ${JSON.stringify(closed.data)}`)
  }
}

if (!target) {
  console.log(`${scenarioId} was not dealt into this attempt; try again for a new seed.`)
  await restorePool()
  await mongoose.disconnect()
  process.exit(0)
}

console.log(`\n=== ${scenarioId} / ${pathName} ===`)
console.log(`  attempt   ${attemptId}`)
console.log(`  run       ${target.run_id}  (position ${target.ordinal ?? '?'})`)

const walk = intents.slice(0, -1)
const final = intents.at(-1)

let stage = target.current_stage
for (const intent of walk) {
  const code = codeFromActions(targetActions, scenarioId, stage, intent)
  if (!code) throw new Error(`${scenarioId} offers no control for ${intent} at ${stage}`)
  const res = await call(`/attempts/${attemptId}/runs/${target.run_id}/events`, {
    method: 'POST', cookie, body: { action_code: code, intent_key: key(intent) },
  })
  if (res.status !== 200) throw new Error(`${intent}: ${JSON.stringify(res.data)}`)
  stage = res.data.run.current_stage
  const consequence = res.data.consequence ? ` -> ${res.data.consequence.kind}` : ''
  console.log(`   ${intent.padEnd(26)} stage=${stage}${consequence}`)
}

const done = await call(`/attempts/${attemptId}/runs/${target.run_id}/resolve`, {
  method: 'POST',
  cookie,
  body: { action_code: codeFromActions(targetActions, scenarioId, 'resolve', final), intent_key: key('resolve') },
})
if (done.status !== 200) throw new Error(`${final}: ${JSON.stringify(done.data)}`)
console.log(`   ${final.padEnd(26)} resolved`)

/** The committed truth, read back from the ledger the engine wrote. */
const run = await ScenarioRun.findById(target.run_id)
const events = await ScenarioEvent.find({ run_id: run._id }).sort({ sequence: 1 })
const definition = await ScenarioDefinition.findOne({
  scenario_id: run.scenario_id, version: run.definition_version,
})

console.log(`\n  disposition   ${definition.disposition} / ${definition.canonical_family}`)
console.log(`  score         ${run.score_0_10}/10   outcome ${run.outcome_code}`)
console.log('  ledger        '
  + events.map((e) => `${e.event_code}(${e.points_delta > 0 ? '+' : ''}${e.points_delta})`).join(' '))
console.log('  metadata keys '
  + [...new Set(events.flatMap((e) => Object.keys(e.toObject().metadata ?? {})))].sort().join(', '))

/**
 * REVIEW=1 (IMMERSIVE-003C): finish the attempt the ordinary way - every remaining run
 * closed through the API - and print what JOB 1's review tells the learner about the
 * scenario that was played. The review is the real `/complete` result, built from the
 * ledger the engine just wrote; nothing is assembled here.
 */
if (process.env.REVIEW === '1') {
  for (let i = 0; i < 12; i += 1) {
    const current = await call(`/attempts/${attemptId}/current-run`, { cookie })
    let next = current.data?.run
    if (!next) break
    next = await walkToResolve(next, current.data.actions)
    await call(`/attempts/${attemptId}/runs/${next.run_id}/resolve`, {
      method: 'POST',
      cookie,
      body: {
        action_code: codeFromActions(current.data.actions, next.scenario_id, 'resolve', 'resolve_report'),
        intent_key: key('resolve'),
      },
    })
  }

  const completed = await call(`/attempts/${attemptId}/complete`, { method: 'POST', cookie })
  const result = completed.data?.result
  const entry = result?.scenarios?.find((s) => s.ordinal === target.ordinal)
  if (!entry) throw new Error(`no result entry for ${scenarioId}: ${completed.status}`)

  const review = entry.review
  console.log(`\n  review        ${review.status}   learning issue ${review.learning_issue?.key ?? '-'}`)
  for (const mistake of review.mistakes) {
    const card = mistake.card ?? mistake
    console.log(`   - ${card.stage.padEnd(8)} ${card.kind}`)
    console.log(`       correct: ${card.correct_action}`)
  }
  console.log(`  correct path  ${(review.correct_path ?? []).map((s) => s.action ?? s.label).join(' > ')}`)

  // The learner-facing payload must never carry the scoring vocabulary.
  const released = JSON.stringify(entry)
  const leaked = ['SAFE_PIVOT', 'RISKY_OPEN_REPLY', 'SECRET_PAYMENT_INSTALL_DATA_RELEASE',
    'TRUSTED_VERIFY', 'CORRECT_USE', 'FALSE_REPORT_BLOCK', 'UNSAFE_EXTERNAL_ACTION',
    'expected_actions', 'scoring_text', 'points_delta'].filter((word) => released.includes(word))
  console.log(`  review leaks  ${leaked.length ? leaked.join(', ') : 'none'}`)
}

// Leave nothing behind: this script is for exercising a scene, not for seeding a demo.
const candidate = await Candidate.findOne({ identifier }).select('_id')
if (candidate) {
  const attempts = await Attempt.find({ profile_id: candidate._id }).select('_id')
  const ids = attempts.map((a) => a._id)
  const runs = await ScenarioRun.find({ attempt_id: { $in: ids } }).select('_id')
  await ScenarioEvent.deleteMany({ run_id: { $in: runs.map((r) => r._id) } })
  await ScenarioRun.deleteMany({ attempt_id: { $in: ids } })
  await Attempt.deleteMany({ _id: { $in: ids } })
  await Candidate.deleteMany({ _id: candidate._id })
}

await restorePool()
await mongoose.disconnect()

/**
 * A fake instructor API for the admin component tests (ADMIN-006).
 *
 * A stubbed `fetch`, not a stubbed module: requests travel through the real `apiClient`,
 * the real `adminApi` and the real pages, so query-string building, the request-body
 * allowlists, the error envelope and the credentialed-fetch posture are all exercised
 * rather than assumed. Only the socket is missing.
 *
 * Every payload below is copied from what the backend projections actually return -
 * ADMIN-001's `toAdminSummary`/`toAdminDetail`, ADMIN-002's attempt list and detail,
 * ADMIN-003's export result, ADMIN-004's reset, archive and configuration responses, and
 * ADMIN-005's audit page. Where a field is absent here it is absent there too, which is
 * what makes the privacy assertions meaningful: the tests can only find a leak the shape
 * genuinely permits.
 */

export const SCENARIO_SUMMARY = {
  id: 'def-w01',
  scenario_id: 'W01',
  version: 2,
  lifecycle: 'published',
  active: true,
  platform: 'whatsapp',
  level: 'easy',
  disposition: 'malicious',
  canonical_family: 'payment_diversion',
  military_flag: false,
  asset_count: 5,
  owner: 'Training cell',
  published_at: '2026-09-05T09:00:00.000Z',
  updated_at: '2026-09-05T09:00:00.000Z',
}

export const SCENARIO_DRAFT = {
  ...SCENARIO_SUMMARY,
  id: 'def-w02-v3',
  scenario_id: 'W02',
  version: 3,
  lifecycle: 'draft',
  active: false,
  published_at: null,
}

/** The full authoring record, including the evaluation block the API really returns. */
export const SCENARIO_DETAIL = {
  ...SCENARIO_SUMMARY,
  family: 'Payment diversion',
  trigger: 'Authority | Urgency',
  canonical_triggers: ['authority', 'urgency'],
  legitimate_control: false,
  schema_version: 1,
  scoring: [],
  quality: null,
  review_date: null,
  synthetic: { assets: [] },
  stages: [{ key: 'notify' }, { key: 'open' }, { key: 'inspect' },
    { key: 'branch' }, { key: 'verify' }, { key: 'resolve' }],
  evaluation: {
    feedback: {
      result: 'A payment-diversion attempt dressed as a delivery fee.',
      cues: ['unexpected fee', 'new account details mid-thread'],
      safe_action: 'Confirm on the published number before paying anything.',
      impact: 'Funds sent to an attacker-controlled account.',
      prevention_habit: 'Verify account changes out of band.',
    },
  },
}

export const PROFILE = {
  profile_id: 'profile-1',
  display_name: 'Test Learner',
  service_no_masked: '••••4356',
}

export const ATTEMPT_SUMMARY = {
  attempt_id: 'attempt-complete',
  profile: PROFILE,
  mode: 'assessment',
  status: 'completed',
  started_at: '2026-09-07T10:00:00.000Z',
  completed_at: '2026-09-07T11:00:00.000Z',
  duration_ms: 3_600_000,
  total_score: 67,
  max_score: 100,
  scenarios_total: 10,
  scenarios_resolved: 10,
  content_version: 1,
  result_available: true,
}

export const ATTEMPT_IN_PROGRESS_SUMMARY = {
  ...ATTEMPT_SUMMARY,
  attempt_id: 'attempt-partial',
  status: 'in_progress',
  completed_at: null,
  duration_ms: null,
  total_score: null,
  scenarios_resolved: 3,
  result_available: false,
}

const resolvedScenario = (ordinal) => ({
  ordinal,
  scenario_ref: `W0${ordinal}`,
  platform: 'whatsapp',
  platform_label: 'WhatsApp',
  status: 'resolved',
  resolved: true,
  score_0_10: 7,
  max_score: 10,
  outcome_code: 'resolve_report',
  outcome_class: 'handled_safely',
  final_stage: 'resolve',
  disposition: 'malicious',
  level: 'medium',
  military_flag: ordinal === 1,
  canonical_family: 'payment_diversion',
  family_label: 'Payment diversion',
  canonical_triggers: ['authority'],
  trigger_labels: ['Authority'],
  sender: 'QuickParcel Support',
  preview: 'Your parcel is held.',
  started_at: '2026-09-07T10:00:00.000Z',
  resolved_at: '2026-09-07T10:05:00.000Z',
  duration_ms: 300_000,
  path: [
    { step: 1, stage: 'notify', action: 'opened_notification' },
    { step: 2, stage: 'inspect', action: 'inspected_the_details' },
    { step: 3, stage: 'resolve', action: 'resolved_as_required' },
  ],
  feedback: {
    result: 'A payment-diversion attempt.',
    cues: ['unexpected fee'],
    safe_action: 'Confirm on the published number.',
    impact: 'Funds lost.',
    prevention_habit: 'Verify out of band.',
  },
})

const pendingScenario = (ordinal) => ({
  ordinal,
  scenario_ref: `S0${ordinal}`,
  platform: 'sms',
  platform_label: 'SMS',
  status: 'active',
  resolved: false,
  current_stage: 'notify',
  score_0_10: null,
  max_score: 10,
})

const BEHAVIOUR = {
  by_platform: [{ key: 'whatsapp', label: 'WhatsApp', scenarios: 2, points: 14, max_points: 20, missed_threats: 0, false_positives: 0 }],
  by_family: [{ key: 'payment_diversion', label: 'Payment diversion', scenarios: 2, points: 14, max_points: 20, missed_threats: 0, false_positives: 0 }],
  by_trigger: [{ key: 'authority', label: 'Authority', scenarios: 2, points: 14, max_points: 20, missed_threats: 0, false_positives: 0 }],
  by_stage: [{ stage: 'inspect', scenarios_reached: 2, constructive_actions: 2 }],
}

export const ATTEMPT_DETAIL_COMPLETE = {
  attempt: {
    ...ATTEMPT_SUMMARY,
    profile: { ...PROFILE, created_at: '2026-09-01T00:00:00.000Z' },
    resolved_points: 67,
    taxonomy_version: '1.0.0',
    trigger_taxonomy_version: '1.0.0',
  },
  summary: {
    total_score: 67,
    max_score: 100,
    scenarios: 10,
    handled_safely: 6,
    missed_threats: 2,
    false_positives: 1,
    unsafe_handling: 1,
    duration_ms: 3_600_000,
  },
  platform_coverage: [{ platform: 'whatsapp', label: 'WhatsApp', scenarios: 2, resolved: 2 }],
  scenarios: [resolvedScenario(1), resolvedScenario(2)],
  behaviour: BEHAVIOUR,
  behaviour_scope: { scope: 'complete', scenarios_included: 2, scenarios_total: 2 },
  remediation: {
    available: true,
    reason: null,
    recommendations: [{
      family_key: 'payment_diversion',
      label: 'Payment diversion',
      reason: 'A threat in this area was not stopped.',
      points: 14,
      max_points: 20,
      practice_scenarios_available: 7,
    }],
  },
  comparison: {
    available: true,
    previous_attempt_id: 'attempt-old',
    previous_total_score: 52,
    previous_completed_at: '2026-09-01T11:00:00.000Z',
    delta: 15,
    attempts_compared: 2,
  },
}

export const ATTEMPT_DETAIL_IN_PROGRESS = {
  attempt: {
    ...ATTEMPT_IN_PROGRESS_SUMMARY,
    profile: { ...PROFILE, created_at: '2026-09-01T00:00:00.000Z' },
    resolved_points: 7,
    taxonomy_version: '1.0.0',
    trigger_taxonomy_version: '1.0.0',
  },
  summary: null,
  platform_coverage: [
    { platform: 'sms', label: 'SMS', scenarios: 1, resolved: 0 },
    { platform: 'whatsapp', label: 'WhatsApp', scenarios: 1, resolved: 1 },
  ],
  scenarios: [resolvedScenario(1), pendingScenario(2)],
  behaviour: BEHAVIOUR,
  behaviour_scope: { scope: 'partial', scenarios_included: 1, scenarios_total: 2 },
  remediation: { available: false, reason: 'attempt_not_complete', recommendations: [] },
  comparison: { available: false, reason: 'attempt_not_complete' },
}

export const EXPORT_RESULT = {
  artifact_id: 'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd',
  format: 'csv',
  filename: 'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd.csv',
  bytes: 11_788,
  generated_at: '2026-09-07T12:00:00.000Z',
  scope: 'attempt',
  attempt_id: 'attempt-complete',
  content_version: 1,
  content_is_current: true,
  training_marker: 'TRAINING SIMULATION',
  network_marker: 'OFFLINE',
  location: {
    kind: 'local_export_directory',
    directory: 'D:/app/backend/exports',
    path: 'D:/app/backend/exports/training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd.csv',
    artifact_present: true,
    note: 'Written to the local export directory on this machine.',
  },
  audit: {
    action: 'EXPORT_CREATED',
    resource_type: 'export',
    resource_id: 'training-attempt-6a9e40cac3c410903d1c8f00-20260907T120000Z-aabbccdd',
    status: 'succeeded',
  },
  replayed: false,
}

/** ADM-007: the learner-scope export response. */
export const LEARNER_EXPORT_RESULT = {
  ...Object.fromEntries(Object.entries(EXPORT_RESULT).filter(([key]) => key !== 'attempt_id')),
  artifact_id: 'training-learner-6a9e40cac3c410903d1c8f11-20260907T120000Z-aabbccdd',
  filename: 'training-learner-6a9e40cac3c410903d1c8f11-20260907T120000Z-aabbccdd.csv',
  scope: 'learner',
  profile_id: 'profile-1',
  attempts_included: 2,
}

export const FEEDBACK_CONFIG = {
  config: {
    training_feedback_timing: 'on_completion',
    assessment_feedback_timing: 'on_completion',
    assessment_duration_minutes: 30,
    config_version: 1,
    updated_at: null,
    updated_by: null,
    updated_by_username: null,
  },
  allowed_timings: ['immediate', 'on_completion'],
  defaults: { training: 'on_completion', assessment: 'on_completion' },
  enforcement: {
    on_completion: 'enforced - feedback is held until the attempt completes',
    immediate: 'enforced - each scenario\'s feedback card is released as it resolves',
  },
}

export const AUDIT_ENTRY = {
  audit_id: 'audit-1',
  actor_admin_id: 'admin-1',
  actor_username: 'instructor',
  action: 'ATTEMPT_RESET',
  resource_type: 'attempt',
  resource_id: 'attempt-partial',
  status: 'succeeded',
  error_code: null,
  metadata: { attempt_id: 'attempt-partial', attempt_status: 'in_progress', scenarios_discarded: 7 },
  occurred_at: '2026-09-07T12:30:00.000Z',
}

/**
 * ENHANCEMENT-001: the dashboard payload, generated by the backend's own
 * `aggregateDashboard()` from a small hand-built set of attempts, so the shape is the
 * real one. Aggregate only - no name, service number or id appears in it.
 */
export const DASHBOARD = {
  generated_at: '2026-09-24T09:00:00.000Z',
  scope: {
    mode: null,
    basis: 'completed_attempts'
  },
  learners: {
    total: 5,
    archived: 1,
    with_any_attempt: 4,
    with_completed_attempt: 2
  },
  attempts: {
    total: 5,
    by_status: {
      in_progress: 1,
      completed: 3,
      abandoned: 1
    },
    completion_rate: {
      numerator: 3,
      denominator: 5,
      rate: 0.6
    },
    completed_end_reasons: {
      learner_completed: 2,
      expired: 1
    },
    completed_by_mode: {
      assessment: 2,
      training: 1
    }
  },
  scores: {
    max_score: 100,
    attempts: {
      count: 3,
      mean: 68.3,
      median: 72,
      min: 38,
      max: 95
    },
    attempt_bands: [
      {
        from: 0,
        to: 9,
        count: 0
      },
      {
        from: 10,
        to: 19,
        count: 0
      },
      {
        from: 20,
        to: 29,
        count: 0
      },
      {
        from: 30,
        to: 39,
        count: 1
      },
      {
        from: 40,
        to: 49,
        count: 0
      },
      {
        from: 50,
        to: 59,
        count: 0
      },
      {
        from: 60,
        to: 69,
        count: 0
      },
      {
        from: 70,
        to: 79,
        count: 1
      },
      {
        from: 80,
        to: 89,
        count: 0
      },
      {
        from: 90,
        to: 100,
        count: 1
      }
    ],
    learners_latest: {
      count: 2,
      mean: 66.5,
      median: 66.5,
      min: 38,
      max: 95
    },
    learner_bands: [
      {
        from: 0,
        to: 9,
        count: 0
      },
      {
        from: 10,
        to: 19,
        count: 0
      },
      {
        from: 20,
        to: 29,
        count: 0
      },
      {
        from: 30,
        to: 39,
        count: 1
      },
      {
        from: 40,
        to: 49,
        count: 0
      },
      {
        from: 50,
        to: 59,
        count: 0
      },
      {
        from: 60,
        to: 69,
        count: 0
      },
      {
        from: 70,
        to: 79,
        count: 0
      },
      {
        from: 80,
        to: 89,
        count: 0
      },
      {
        from: 90,
        to: 100,
        count: 1
      }
    ]
  },
  platforms: [
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      scenarios: 4,
      points: 23,
      max_points: 40,
      average_score: 5.8,
      score_rate: {
        numerator: 23,
        denominator: 40,
        rate: 0.575
      },
      outcomes: {
        handled_safely: 2,
        missed_threat: 2,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 2,
        denominator: 3,
        rate: 0.6667
      },
      safe_handling_rate: {
        numerator: 2,
        denominator: 4,
        rate: 0.5
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 1,
        rate: 0
      }
    },
    {
      platform: 'instagram',
      label: 'Instagram',
      scenarios: 3,
      points: 16,
      max_points: 30,
      average_score: 5.3,
      score_rate: {
        numerator: 16,
        denominator: 30,
        rate: 0.5333
      },
      outcomes: {
        handled_safely: 1,
        missed_threat: 1,
        false_positive: 1,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 1,
        denominator: 2,
        rate: 0.5
      },
      safe_handling_rate: {
        numerator: 1,
        denominator: 3,
        rate: 0.3333
      },
      false_positive_rate: {
        numerator: 1,
        denominator: 1,
        rate: 1
      }
    },
    {
      platform: 'email',
      label: 'Email',
      scenarios: 4,
      points: 34,
      max_points: 40,
      average_score: 8.5,
      score_rate: {
        numerator: 34,
        denominator: 40,
        rate: 0.85
      },
      outcomes: {
        handled_safely: 3,
        missed_threat: 0,
        false_positive: 0,
        unsafe_handling: 1,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 0,
        denominator: 3,
        rate: 0
      },
      safe_handling_rate: {
        numerator: 3,
        denominator: 4,
        rate: 0.75
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 1,
        rate: 0
      }
    },
    {
      platform: 'sms',
      label: 'SMS',
      scenarios: 4,
      points: 22,
      max_points: 40,
      average_score: 5.5,
      score_rate: {
        numerator: 22,
        denominator: 40,
        rate: 0.55
      },
      outcomes: {
        handled_safely: 2,
        missed_threat: 1,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 1
      },
      attack_success_rate: {
        numerator: 1,
        denominator: 2,
        rate: 0.5
      },
      safe_handling_rate: {
        numerator: 2,
        denominator: 3,
        rate: 0.6667
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 1,
        rate: 0
      }
    }
  ],
  extremes: {
    attack_success_rate: {
      highest: {
        platforms: [
          'whatsapp'
        ],
        labels: [
          'WhatsApp'
        ],
        rate: 0.6667
      },
      lowest: {
        platforms: [
          'email'
        ],
        labels: [
          'Email'
        ],
        rate: 0
      },
      all_equal: false
    },
    score_rate: {
      highest: {
        platforms: [
          'email'
        ],
        labels: [
          'Email'
        ],
        rate: 0.85
      },
      lowest: {
        platforms: [
          'instagram'
        ],
        labels: [
          'Instagram'
        ],
        rate: 0.5333
      },
      all_equal: false
    }
  },
  scenarios: {
    classified: 15,
    unclassified: 0,
    outcomes: {
      handled_safely: 8,
      missed_threat: 4,
      false_positive: 1,
      unsafe_handling: 1,
      not_resolved: 1
    }
  },
  activity: {
    days: 14,
    completions_by_day: [
      {
        date: '2026-09-11',
        completed: 0
      },
      {
        date: '2026-09-12',
        completed: 0
      },
      {
        date: '2026-09-13',
        completed: 0
      },
      {
        date: '2026-09-14',
        completed: 0
      },
      {
        date: '2026-09-15',
        completed: 0
      },
      {
        date: '2026-09-16',
        completed: 0
      },
      {
        date: '2026-09-17',
        completed: 0
      },
      {
        date: '2026-09-18',
        completed: 0
      },
      {
        date: '2026-09-19',
        completed: 0
      },
      {
        date: '2026-09-20',
        completed: 1
      },
      {
        date: '2026-09-21',
        completed: 0
      },
      {
        date: '2026-09-22',
        completed: 0
      },
      {
        date: '2026-09-23',
        completed: 1
      },
      {
        date: '2026-09-24',
        completed: 1
      }
    ]
  }
}

/** ENHANCEMENT-001: a new installation - no attempts at all. Same generator. */
export const DASHBOARD_EMPTY = {
  generated_at: '2026-09-24T09:00:00.000Z',
  scope: {
    mode: null,
    basis: 'completed_attempts'
  },
  learners: {
    total: 0,
    archived: 0,
    with_any_attempt: 0,
    with_completed_attempt: 0
  },
  attempts: {
    total: 0,
    by_status: {
      in_progress: 0,
      completed: 0,
      abandoned: 0
    },
    completion_rate: {
      numerator: 0,
      denominator: 0,
      rate: null
    },
    completed_end_reasons: {
      learner_completed: 0,
      expired: 0
    },
    completed_by_mode: {}
  },
  scores: {
    max_score: 100,
    attempts: {
      count: 0,
      mean: null,
      median: null,
      min: null,
      max: null
    },
    attempt_bands: [
      {
        from: 0,
        to: 9,
        count: 0
      },
      {
        from: 10,
        to: 19,
        count: 0
      },
      {
        from: 20,
        to: 29,
        count: 0
      },
      {
        from: 30,
        to: 39,
        count: 0
      },
      {
        from: 40,
        to: 49,
        count: 0
      },
      {
        from: 50,
        to: 59,
        count: 0
      },
      {
        from: 60,
        to: 69,
        count: 0
      },
      {
        from: 70,
        to: 79,
        count: 0
      },
      {
        from: 80,
        to: 89,
        count: 0
      },
      {
        from: 90,
        to: 100,
        count: 0
      }
    ],
    learners_latest: {
      count: 0,
      mean: null,
      median: null,
      min: null,
      max: null
    },
    learner_bands: [
      {
        from: 0,
        to: 9,
        count: 0
      },
      {
        from: 10,
        to: 19,
        count: 0
      },
      {
        from: 20,
        to: 29,
        count: 0
      },
      {
        from: 30,
        to: 39,
        count: 0
      },
      {
        from: 40,
        to: 49,
        count: 0
      },
      {
        from: 50,
        to: 59,
        count: 0
      },
      {
        from: 60,
        to: 69,
        count: 0
      },
      {
        from: 70,
        to: 79,
        count: 0
      },
      {
        from: 80,
        to: 89,
        count: 0
      },
      {
        from: 90,
        to: 100,
        count: 0
      }
    ]
  },
  platforms: [
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      scenarios: 0,
      points: 0,
      max_points: 0,
      average_score: null,
      score_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      outcomes: {
        handled_safely: 0,
        missed_threat: 0,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      safe_handling_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      }
    },
    {
      platform: 'instagram',
      label: 'Instagram',
      scenarios: 0,
      points: 0,
      max_points: 0,
      average_score: null,
      score_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      outcomes: {
        handled_safely: 0,
        missed_threat: 0,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      safe_handling_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      }
    },
    {
      platform: 'email',
      label: 'Email',
      scenarios: 0,
      points: 0,
      max_points: 0,
      average_score: null,
      score_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      outcomes: {
        handled_safely: 0,
        missed_threat: 0,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      safe_handling_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      }
    },
    {
      platform: 'sms',
      label: 'SMS',
      scenarios: 0,
      points: 0,
      max_points: 0,
      average_score: null,
      score_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      outcomes: {
        handled_safely: 0,
        missed_threat: 0,
        false_positive: 0,
        unsafe_handling: 0,
        not_resolved: 0
      },
      attack_success_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      safe_handling_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      },
      false_positive_rate: {
        numerator: 0,
        denominator: 0,
        rate: null
      }
    }
  ],
  extremes: {
    attack_success_rate: null,
    score_rate: null
  },
  scenarios: {
    classified: 0,
    unclassified: 0,
    outcomes: {
      handled_safely: 0,
      missed_threat: 0,
      false_positive: 0,
      unsafe_handling: 0,
      not_resolved: 0
    }
  },
  activity: {
    days: 14,
    completions_by_day: [
      {
        date: '2026-09-11',
        completed: 0
      },
      {
        date: '2026-09-12',
        completed: 0
      },
      {
        date: '2026-09-13',
        completed: 0
      },
      {
        date: '2026-09-14',
        completed: 0
      },
      {
        date: '2026-09-15',
        completed: 0
      },
      {
        date: '2026-09-16',
        completed: 0
      },
      {
        date: '2026-09-17',
        completed: 0
      },
      {
        date: '2026-09-18',
        completed: 0
      },
      {
        date: '2026-09-19',
        completed: 0
      },
      {
        date: '2026-09-20',
        completed: 0
      },
      {
        date: '2026-09-21',
        completed: 0
      },
      {
        date: '2026-09-22',
        completed: 0
      },
      {
        date: '2026-09-23',
        completed: 0
      },
      {
        date: '2026-09-24',
        completed: 0
      }
    ]
  }
}

/**
 * A configurable fake server.
 *
 * `authenticated` drives `/admin/me`, so the guard can be tested in all three states an
 * instructor can be in: signed in, signed out, and holding a candidate session (which the
 * backend answers with the same 401 as no session at all).
 */
export function createAdminServer(overrides = {}) {
  return {
    authenticated: true,
    admin: { id: 'admin-1', username: 'instructor' },
    scenarios: [SCENARIO_SUMMARY, SCENARIO_DRAFT],
    scenarioVersions: [SCENARIO_DETAIL],
    attempts: [ATTEMPT_SUMMARY, ATTEMPT_IN_PROGRESS_SUMMARY],
    attemptDetail: ATTEMPT_DETAIL_COMPLETE,
    learners: [{ ...PROFILE, created_at: '2026-09-01T00:00:00.000Z' }],
    config: FEEDBACK_CONFIG,
    /** In-progress assessments the duration endpoint reports; above zero it refuses a change. */
    runningAssessments: 0,
    auditEntries: [AUDIT_ENTRY],
    exportResult: EXPORT_RESULT,
    dashboard: DASHBOARD,
    /** Set to `{ status, code, message, details }` to make the next matching call fail. */
    failNext: null,
    calls: [],
    ...overrides,
  }
}

/**
 * Server-side paging, as the three list APIs really do it (ENHANCEMENT-001B): `page` and
 * `page_size` come from the query string and the response carries the filtered total, so
 * pagination tests exercise real page arithmetic rather than a fixture that always says
 * "page 1 of 1". The fake does not filter; the tests assert what is SENT for filters.
 */
function pageOf(all, search) {
  const params = new URLSearchParams(search)
  const pageSize = Number(params.get('page_size') || 25)
  const total = all.length
  const totalPages = Math.max(Math.ceil(total / pageSize), 1)
  const page = Math.min(Math.max(Number(params.get('page') || 1), 1), totalPages)
  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    page,
    page_size: pageSize,
    total,
    total_pages: totalPages,
  }
}

/** `n` copies of a list row with distinct ids - enough to need several pages. */
export function manyOf(template, n, idKey, makeId) {
  return Array.from({ length: n }, (_, i) => ({ ...template, [idKey]: makeId(i) }))
}

export function installAdminFetch(server) {
  globalThis.fetch = async (url, options = {}) => {
    const raw = String(url).replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '')
    const [path, search = ''] = raw.split('?')
    const body = options.body ? JSON.parse(options.body) : null
    const method = options.method ?? 'GET'
    server.calls.push({ path, search, method, body })

    const ok = (data) => ({ ok: true, status: 200, json: async () => data })
    const err = (status, code, message, details = null) => ({
      ok: false,
      status,
      json: async () => ({ error: { code, message, details } }),
    })

    /**
     * The session check is never the call that fails: `failNext` exists to test how a
     * SCREEN handles a server error, and failing `/admin/me` would instead redirect to the
     * sign-in page and prove nothing about the screen under test.
     */
    if (server.failNext && path !== '/admin/me') {
      const failure = server.failNext
      server.failNext = null
      return err(failure.status, failure.code, failure.message, failure.details ?? null)
    }

    if (path === '/admin/me') {
      return server.authenticated
        ? ok({ admin: server.admin })
        : err(401, 'NO_ADMIN_SESSION', 'Please sign in as an administrator.')
    }
    if (path === '/admin/logout') return ok({ ok: true })

    if (path === '/admin/scenarios') {
      const { items, ...meta } = pageOf(server.scenarios, search)
      return ok({ scenarios: items, ...meta })
    }
    if (/^\/admin\/scenarios\/[^/]+$/.test(path)) {
      return ok({ scenario_id: 'W01', versions: server.scenarioVersions })
    }
    if (/\/publish$/.test(path)) {
      return ok({ scenario: SCENARIO_SUMMARY, changed: true, previously_active_version: 1 })
    }
    if (/\/deactivate$/.test(path)) {
      return ok({ scenario: { ...SCENARIO_SUMMARY, lifecycle: 'retired' }, changed: true })
    }
    if (/\/clone$/.test(path)) {
      return ok({ scenario: SCENARIO_DRAFT, created: true })
    }
    if (/^\/admin\/scenarios\/[^/]+\/versions\/\d+$/.test(path) && method === 'PATCH') {
      return ok({ scenario: SCENARIO_DETAIL, edited_in_place: false, created_version: 3 })
    }

    if (path === '/admin/attempts') {
      const { items, ...meta } = pageOf(server.attempts, search)
      return ok({ attempts: items, ...meta })
    }
    if (/^\/admin\/attempts\/[^/]+$/.test(path)) return ok(server.attemptDetail)
    if (/\/reset$/.test(path)) {
      return ok({
        reset: {
          attempt_id: 'attempt-partial',
          previous_status: 'in_progress',
          status: 'abandoned',
          reset_at: '2026-09-07T12:30:00.000Z',
          scenarios_discarded: 7,
          scenarios_preserved: 3,
          result_available: false,
          total_score: null,
          changed: true,
        },
      })
    }
    if (/\/archive$/.test(path)) {
      return ok({
        profile: {
          profile_id: 'profile-1',
          archived: true,
          archived_at: '2026-09-07T12:31:00.000Z',
          archived_by: 'admin-1',
          changed: true,
        },
      })
    }

    if (path === '/admin/learners') return ok({ learners: server.learners, limit: 20 })

    if (path.startsWith('/admin/exports/attempts/')) {
      return ok({ export: { ...server.exportResult, format: body?.format ?? 'csv' } })
    }
    if (path.startsWith('/admin/exports/learners/')) {
      return ok({ export: { ...LEARNER_EXPORT_RESULT, format: body?.format ?? 'csv' } })
    }
    if (path.startsWith('/admin/exports/')) {
      return { ok: true, status: 200, blob: async () => new Blob(['csv']) }
    }

    if (path === '/admin/config/feedback' && method === 'GET') return ok(server.config)
    if (path === '/admin/config/feedback' && method === 'PATCH') {
      const next = {
        ...server.config.config,
        ...(body.training_feedback_timing
          ? { training_feedback_timing: body.training_feedback_timing } : {}),
        ...(body.assessment_feedback_timing
          ? { assessment_feedback_timing: body.assessment_feedback_timing } : {}),
        config_version: server.config.config.config_version + 1,
        updated_at: '2026-09-07T12:40:00.000Z',
        updated_by_username: 'instructor',
      }
      server.config = { ...server.config, config: next }
      return ok({
        config: next,
        allowed_timings: ['immediate', 'on_completion'],
        changed: true,
        changed_keys: Object.keys(body).filter((key) => key.endsWith('_feedback_timing')),
      })
    }

    if (path === '/admin/config/assessment-duration' && method === 'GET') {
      return ok({
        config: server.config.config,
        allowed_durations_minutes: [30, 45, 60, 75, 90],
        default_duration_minutes: 30,
        running_assessments: server.runningAssessments,
      })
    }
    if (path === '/admin/config/assessment-duration' && method === 'PATCH') {
      if (server.runningAssessments > 0) {
        return err(409, 'ASSESSMENT_IN_PROGRESS',
          'The assessment duration cannot be changed while an assessment is currently running.',
          { running_assessments: server.runningAssessments })
      }
      const changed = body.assessment_duration_minutes !== server.config.config.assessment_duration_minutes
      const next = changed
        ? {
          ...server.config.config,
          assessment_duration_minutes: body.assessment_duration_minutes,
          config_version: server.config.config.config_version + 1,
          updated_at: '2026-09-07T12:40:00.000Z',
          updated_by_username: 'instructor',
        }
        : server.config.config
      server.config = { ...server.config, config: next }
      return ok({ config: next, allowed_durations_minutes: [30, 45, 60, 75, 90], changed })
    }

    if (path === '/admin/dashboard') return ok(server.dashboard)

    if (path === '/admin/audit') {
      const { items, ...meta } = pageOf(server.auditEntries, search)
      return ok({ entries: items, ...meta })
    }

    return err(404, 'NOT_FOUND', `unhandled ${method} ${path}`)
  }
}

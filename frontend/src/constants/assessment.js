export const ASSESSMENT_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

/** Screen state for the assessment page while it talks to the question engine. */
export const ASSESSMENT_UI_STATE = {
  LOADING: 'LOADING',
  ACTIVE: 'ACTIVE',
  SUBMITTING: 'SUBMITTING',
  ERROR: 'ERROR',
  COMPLETED: 'COMPLETED',
}

/**
 * Plain-English labels for the backend's three judgement values. The server
 * sends the values with each question; these only make them readable.
 */
export const JUDGEMENT_LABELS = {
  genuine: 'Genuine',
  fraudulent: 'Fraud',
  needs_verification: 'Needs checking',
}

export function judgementOptionsFrom(values = []) {
  return values.map((value) => ({ value, label: JUDGEMENT_LABELS[value] ?? value }))
}

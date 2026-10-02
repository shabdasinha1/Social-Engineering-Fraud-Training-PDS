/**
 * DEVELOPMENT ONLY - end-to-end check of the assessment API against a running
 * server and the local database. Creates two throwaway candidates and deletes
 * everything it made.
 *
 *   node src/server.js          (in one terminal)
 *   node scripts/validateApi.js (in another)
 */
const BASE = process.env.API_BASE || 'http://localhost:5000/api'

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -> ${detail}` : ''}`)
}

/** A tiny cookie jar, so each candidate has its own session. */
function makeClient() {
  let cookie = ''
  return async function request(method, path, body) {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const setCookie = response.headers.getSetCookie?.() ?? []
    if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ')
    const json = await response.json().catch(() => null)
    return { status: response.status, body: json }
  }
}

const stamp = Date.now()
const idA = `TEST-A-${stamp}`
const idB = `TEST-B-${stamp}`

const a = makeClient()
const b = makeClient()

// ------------------------------------------------------------------ session
let res = await a('GET', '/assessments/000000000000000000000000')
check('no session is rejected with 401', res.status === 401 && res.body.error.code === 'NO_SESSION')

res = await a('POST', '/candidates', { name: 'Candidate A', identifier: idA })
check('sign in creates a candidate and a session', res.status === 201)
const candidateAId = res.body.candidate.id

res = await a('GET', '/candidates/me')
check('session survives across requests', res.status === 200 && res.body.candidate.id === candidateAId)

res = await b('POST', '/candidates', { name: 'Candidate B', identifier: idB })
const candidateBId = res.body.candidate.id
check('a second candidate gets its own session', res.status === 201 && candidateBId !== candidateAId)

// --------------------------------------------------------------- assessment
res = await a('POST', '/assessments')
check('starting an assessment returns 201 and question 1', res.status === 201 && res.body.question?.questionNumber === 1)
const assessmentA = res.body.progress.assessmentId
const firstQuestion = res.body.question

check(
  'the question carries what the renderer needs',
  Boolean(firstQuestion.scenario.channel && firstQuestion.scenario.simulation?.screens?.length),
)
check('total questions is 10', firstQuestion.totalQuestions === 10)
check(
  'judgement options are the confirmed three',
  JSON.stringify(firstQuestion.judgementOptions) ===
    JSON.stringify(['genuine', 'fraudulent', 'needs_verification']),
)

const serialised = JSON.stringify(res.body)
check(
  'no evaluation, correct answer, warning signs or marks are exposed',
  !serialised.includes('evaluation') &&
    !serialised.includes('correctJudgement') &&
    !serialised.includes('warningSigns') &&
    !serialised.includes('authorNotes') &&
    !serialised.includes('"marks"') &&
    !serialised.includes('isCriticalFailure'),
)
check(
  'the composition is hidden from the candidate',
  !serialised.includes('maliciousCount') && !serialised.includes('legitimateCount'),
)

// ------------------------------------------------------------ resume/freeze
res = await a('POST', '/assessments')
check(
  'starting again resumes rather than creating a second assessment',
  res.status === 200 && res.body.created === false && res.body.progress.assessmentId === assessmentA,
)
check(
  'the resumed assessment shows the same question 1',
  res.body.question.scenario.id === firstQuestion.scenario.id,
)

res = await a('GET', `/assessments/${assessmentA}`)
check('GET returns the same question after a refresh', res.body.question.scenario.id === firstQuestion.scenario.id)

// ------------------------------------------------------------------ isolation
res = await b('GET', `/assessments/${assessmentA}`)
check("candidate B cannot read candidate A's assessment (404, not 403)", res.status === 404)

res = await b('POST', `/assessments/${assessmentA}/answers`, {
  questionNumber: 1,
  judgement: 'fraudulent',
  actionKey: firstQuestion.scenario.actionOptions[0].key,
  reasonKey: firstQuestion.scenario.reasonOptions[0].key,
})
check("candidate B cannot answer candidate A's assessment", res.status === 404)

// ------------------------------------------------------------------ answers
const answerFor = (question, judgement = 'fraudulent') => ({
  questionNumber: question.questionNumber,
  judgement,
  actionKey: question.scenario.actionOptions[0].key,
  reasonKey: question.scenario.reasonOptions[0].key,
})

res = await a('POST', `/assessments/${assessmentA}/answers`, {
  ...answerFor(firstQuestion),
  judgement: 'definitely-a-scam',
})
check('an invalid judgement is rejected', res.status === 422 && res.body.error.code === 'INVALID_OPTION')

res = await a('POST', `/assessments/${assessmentA}/answers`, {
  ...answerFor(firstQuestion),
  actionKey: 'not-a-real-option',
})
check('an action that is not on the scenario is rejected', res.status === 422)

res = await a('POST', `/assessments/${assessmentA}/answers`, { ...answerFor(firstQuestion), questionNumber: 4 })
check(
  'answering the wrong question number is rejected',
  res.status === 409 && res.body.error.code === 'NOT_CURRENT_QUESTION',
)

res = await a('POST', `/assessments/${assessmentA}/complete`)
check(
  'completing before all questions are answered is rejected',
  res.status === 409 && res.body.error.code === 'QUESTIONS_OUTSTANDING',
)

// timing: wait so the server-side duration is measurably non-zero
await new Promise((resolve) => setTimeout(resolve, 1200))

res = await a('POST', `/assessments/${assessmentA}/answers`, {
  ...answerFor(firstQuestion),
  durationMs: 1,
  marks: { total: 99 },
})
check('the first answer is accepted', res.status === 200)
check('post-answer feedback is returned', typeof res.body.feedback?.explanation === 'string')
check('feedback reports server-calculated marks', typeof res.body.feedback.awarded === 'number')
check('progress advanced to question 2', res.body.next.questionNumber === 2)

res = await a('POST', `/assessments/${assessmentA}/answers`, answerFor(firstQuestion))
check(
  'answering the same question twice is rejected',
  res.status === 409 && res.body.error.code === 'NOT_CURRENT_QUESTION',
)

// ------------------------------------------------------- walk to completion
const channelsSeen = []
for (let i = 2; i <= 10; i += 1) {
  const current = await a('GET', `/assessments/${assessmentA}`)
  channelsSeen.push(current.body.question.scenario.channel)
  const submitted = await a('POST', `/assessments/${assessmentA}/answers`, answerFor(current.body.question))
  if (submitted.status !== 200) {
    check(`answering question ${i}`, false, JSON.stringify(submitted.body))
    break
  }
}
check('all four channels appeared in one assessment', new Set(channelsSeen).size >= 3)

res = await a('GET', `/assessments/${assessmentA}`)
check('after 10 answers there is no further question', res.body.question === null && res.body.progress.answered === 10)

res = await a('POST', `/assessments/${assessmentA}/complete`)
check('completing with all 10 answered succeeds', res.status === 200 && res.body.status === 'COMPLETED')
check('the completion summary reports timing', res.body.summary.totalDurationMs > 1000)
check(
  'aggregation is deliberately not calculated',
  res.body.summary.scoringPending === true && res.body.summary.marksAvailable === 100,
)

res = await a('POST', `/assessments/${assessmentA}/complete`)
check('a completed assessment cannot be completed twice', res.status === 409)

res = await a('POST', `/assessments/${assessmentA}/answers`, answerFor(firstQuestion))
check('a completed assessment cannot be modified', res.status === 409)

// ------------------------------------------------------------------ history
res = await a('GET', '/assessments')
check('history requires no id and returns a list', res.status === 200 && Array.isArray(res.body.assessments))
check('the completed assessment appears in history', res.body.assessments.some((h) => h.assessmentId === assessmentA))

const historyRow = res.body.assessments.find((h) => h.assessmentId === assessmentA)
check('history row reports the completed status and date', historyRow.status === 'COMPLETED' && Boolean(historyRow.completedAt))
check('history row reports question counts', historyRow.totalQuestions === 10 && historyRow.summary.answeredQuestions === 10)
check('history row still reports scoring as pending', historyRow.summary.scoringPending === true)

const historyJson = JSON.stringify(res.body)
check(
  'history exposes no evaluation, answers, marks key or scenario content',
  !historyJson.includes('evaluation') &&
    !historyJson.includes('correctJudgement') &&
    !historyJson.includes('warningSigns') &&
    !historyJson.includes('authorNotes') &&
    !historyJson.includes('simulation') &&
    !historyJson.includes('actionKey') &&
    !historyJson.includes('sequence') &&
    !historyJson.includes('composition'),
)
check(
  'history invents no score or band',
  !historyJson.includes('overallScore') && !historyJson.includes('"band"'),
)

res = await b('GET', '/assessments')
check("candidate B's history is empty and shows nothing of candidate A", res.status === 200 && res.body.assessments.length === 0)

const anon = makeClient()
res = await anon('GET', '/assessments')
check('history requires a session', res.status === 401)

// --------------------------------------------------------------- new attempt
res = await a('POST', '/assessments')
const assessmentA2 = res.body.progress.assessmentId
check('a new assessment starts once the previous one is complete', res.status === 201 && assessmentA2 !== assessmentA)

res = await a('GET', '/assessments')
check(
  'an in-progress assessment does not appear in history',
  !res.body.assessments.some((h) => h.assessmentId === assessmentA2),
)
check('history did not create or alter anything', res.body.assessments.length === 1)

// ------------------------------------------------------------------- logout
res = await a('POST', '/candidates/logout')
check('logout succeeds', res.status === 200)
res = await a('GET', '/candidates/me')
check('logout destroys the session', res.status === 401)

// ---------------------------------------------------------------- db checks
const { connectDatabase, disconnectDatabase } = await import('../src/config/database.js')
await connectDatabase()
const { Assessment } = await import('../src/models/Assessment.js')
const { Candidate } = await import('../src/models/Candidate.js')

const stored = await Assessment.findById(assessmentA)
check('composition is stored and allowed', [6, 7, 8].includes(stored.composition.maliciousCount))
check(
  'composition matches: malicious + legitimate = 10',
  stored.composition.maliciousCount + stored.composition.legitimateCount === 10,
)
check(
  'no scenario repeats inside the stored sequence',
  new Set(stored.sequence.map((i) => String(i.scenario))).size === 10,
)
check(
  'every question has a server-calculated duration',
  stored.sequence.every((i) => i.answer.durationMs >= 0 && i.answer.submittedAt && i.servedAt),
)
check(
  'the client-supplied durationMs and marks were ignored',
  stored.sequence[0].answer.durationMs > 1000 && stored.sequence[0].answer.marks.total <= 10,
)

const candidateA = await Candidate.findById(candidateAId)
const candidateB = await Candidate.findById(candidateBId)
check('candidate A history recorded the delivered scenarios', candidateA.seenScenarios.length >= 10)
check('candidate B history is untouched', candidateB.seenScenarios.length === 0)

const secondSequence = await Assessment.findById(assessmentA2)
const firstIds = new Set(stored.sequence.map((i) => String(i.scenario)))
const overlap = secondSequence.sequence.filter((i) => firstIds.has(String(i.scenario))).length
check(`the second attempt mostly avoids the first 10 (overlap ${overlap})`, overlap <= 1)

// servedAt must not move on resume
const before = new Date(secondSequence.sequence[0].servedAt).getTime()
await new Promise((resolve) => setTimeout(resolve, 300))
const c = makeClient()
await c('POST', '/candidates', { name: 'Candidate A', identifier: idA })
await c('GET', `/assessments/${assessmentA2}`)
const after = await Assessment.findById(assessmentA2)
check('servedAt is not reset when the question is re-served', new Date(after.sequence[0].servedAt).getTime() === before)

// ------------------------------------------------------------------ cleanup
await Assessment.deleteMany({ candidate: { $in: [candidateAId, candidateBId] } })
await Candidate.deleteMany({ _id: { $in: [candidateAId, candidateBId] } })
await disconnectDatabase()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)

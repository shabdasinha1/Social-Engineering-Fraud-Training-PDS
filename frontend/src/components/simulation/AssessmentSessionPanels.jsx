import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { progressApi } from '@/services/progressApi'
import { formatRemaining, remainingFrom } from '@/utils/assessmentClock'

/**
 * The two panels that make the required chip menu safe during a live assessment
 * (IMMERSIVE-002).
 *
 * Section 3 requires the menu to contain attempt history, accessibility, restart
 * (instructor-controlled) and logout. All four stay. What changes is the CONSEQUENCE of
 * two of them, because since IMMERSIVE-001 there is a server-side 90-minute deadline that
 * keeps running whatever the browser does.
 *
 * These live in their own file rather than in `SupportDialogs.jsx`: that file is the
 * UI-004 support zone (rules, report an issue, accessibility, restart), all of which are
 * static explanations that read nothing and submit nothing. These two do neither - one
 * fetches, one acts - and keeping the distinction visible in the file layout is worth more
 * than keeping the count of files down.
 */

/* ------------------------------------------------------------------ *
 * Attempt history
 * ------------------------------------------------------------------ */

/**
 * Attempt history, as an in-shell read-only panel.
 *
 * ### Why a panel and not the `/history` route
 *
 * Section 3 requires the chip menu to *contain* attempt history. It does not require that
 * item to navigate anywhere - and navigating unmounts the assessment. Nothing would be
 * lost if it did (all state is server-side, and so is the deadline), but leaving the
 * assessment shell mid-scenario for an unbounded stretch of a clocked assessment is an
 * integrity problem the specification never asks anyone to accept. Showing the same
 * information without going anywhere satisfies the requirement and the concern at once.
 *
 * ### Why it reads `GET /api/progress`, and why that is the safe source
 *
 * The endpoint answers only for the session cookie's own learner - it takes no profile
 * parameter, so there is nothing to abuse - and `progressService` counts **only attempts
 * whose status is `completed`**. The attempt in flight is therefore excluded
 * *structurally*, by the server's own definition of the aggregate, rather than by a filter
 * this component applies and could one day get wrong.
 *
 * It is aggregate by construction: an attempt count, scores out of 100, per-platform and
 * per-family point totals. No scenario id, disposition, difficulty, attack family, trigger,
 * event, rationale, seed or internal identifier appears in the payload - so there is
 * nothing to mask at render, and nothing that could hint at what is coming next.
 */
export function HistoryPanel({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your attempt history"
      description="Assessments you have already finished."
    >
      {/*
        The body is a separate component so it MOUNTS when the panel opens. That lets the
        loading state be the initial state rather than something an effect has to set
        synchronously, and it means each opening is a fresh read rather than a cached one.
      */}
      <HistoryBody />
    </Modal>
  )
}

function HistoryBody() {
  const [state, setState] = useState({ status: 'loading', progress: null })

  useEffect(() => {
    const controller = new AbortController()

    progressApi
      .mine({ signal: controller.signal })
      .then((data) => setState({ status: 'ready', progress: data.progress }))
      .catch((error) => {
        if (error?.name === 'AbortError') return
        /**
         * Reported here and nowhere else. A failed read must NOT reach the attempt
         * controller: an unreachable history panel is an inconvenience, and escalating it
         * into a session error would let an optional panel disrupt an assessment.
         */
        setState({ status: 'error', progress: null })
      })

    return () => controller.abort()
  }, [])

  const { status, progress } = state
  const empty = status === 'ready' && (progress?.attempt_count ?? 0) === 0

  return (
    <>
      {status === 'loading' && (
        <p className="flex items-center gap-2.5 text-sm text-text-muted">
          <Spinner size={18} label="Loading your history" />
          Loading your history...
        </p>
      )}

      {status === 'error' && (
        <p className="text-balance-pretty text-sm text-text-muted">
          Your history could not be loaded just now. This has no effect on the assessment you
          are taking - close this panel and carry on.
        </p>
      )}

      {empty && (
        <p className="text-balance-pretty text-sm text-text-muted">
          You have not finished an assessment yet. The one you are taking now will appear here
          once it is complete.
        </p>
      )}

      {status === 'ready' && !empty && (
        <dl className="grid grid-cols-2 gap-3">
          <Stat label="Assessments completed" value={progress.attempt_count} />
          <Stat label="Scenarios completed" value={progress.scenarios_completed} />
          <Stat
            label="Most recent score"
            value={scoreText(progress.last_score, progress.max_score)}
          />
          <Stat label="Best score" value={scoreText(progress.best_score, progress.max_score)} />
        </dl>
      )}

      <p
        className="mt-4 border-t border-border pt-3 text-xs text-balance-pretty text-text-muted"
        data-testid="history-panel-note"
      >
        Your current assessment is still running and is not shown here. It has not been
        paused: your place and the time remaining are unchanged, and closing this panel
        returns you to exactly where you were.
      </p>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <dt className="text-xs text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums">{value}</dd>
    </div>
  )
}

function scoreText(score, max) {
  if (score === null || score === undefined) return 'Not recorded'
  return `${score}/${max ?? 100}`
}

/* ------------------------------------------------------------------ *
 * Logout confirmation
 * ------------------------------------------------------------------ */

/**
 * The logout confirmation - the reason IMMERSIVE-002 depends on IMMERSIVE-001.
 *
 * ### What logout actually does
 *
 * `POST /api/candidates/logout` clears the session cookie and nothing else. It does not
 * end, submit, abandon, reset or delete the attempt; no `ScenarioRun` and no
 * `ScenarioEvent` is touched. That was already true and already correct - section 6
 * requires that "closing/reopening resumes at the last committed state".
 *
 * ### What changed, and why this dialog now has to exist
 *
 * Since IMMERSIVE-001 the attempt carries a server-side deadline that keeps running while
 * nobody is signed in, and a sweeper that finalises it whether or not anyone returns. A
 * learner who signs out believing the assessment is being held for them can lose the rest
 * of their time without ever having been told that was possible. Removing that trap is the
 * whole purpose of this dialog.
 *
 * The copy states plainly that the assessment continues, that it is resumable, that the
 * clock does not stop, and what happens if it runs out. It deliberately never uses the
 * word "paused": the assessment is not paused, and saying so would be false.
 */
export function LogoutConfirmDialog({
  open,
  onClose,
  onConfirm,
  expiresAt = null,
  serverNow = null,
  busy = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Sign out of this assessment?"
      description="Your assessment stays open, and its time limit keeps running."
    >
      <div className="space-y-3 text-sm text-text">
        <p className="text-balance-pretty">
          Signing out ends this session on this device. It does <strong>not</strong> end,
          submit or reset your assessment - everything you have done so far is already saved,
          and signing back in returns you to the scenario you are on now.
        </p>

        <p
          className="rounded-md border border-warning/40 bg-warning-soft p-3 text-balance-pretty font-semibold text-warning"
          data-testid="logout-clock-warning"
        >
          The 90-minute time limit is not paused. It keeps running while you are signed out
          <RemainingClause expiresAt={expiresAt} serverNow={serverNow} />. Sign back in before
          it runs out and you can continue. If it runs out first, the assessment is closed and
          marked with whatever you had completed.
        </p>

        <p className="text-balance-pretty text-text-muted">
          If you are stepping away only briefly, staying signed in changes nothing about the
          clock but keeps you where you are.
        </p>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Stay signed in
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={busy}>
          Sign out
        </Button>
      </div>
    </Modal>
  )
}

/**
 * "- 41:12 of it remains", or nothing at all when the attempt has no deadline.
 *
 * A child component so it mounts with the dialog: the countdown then starts from its own
 * initial state instead of an effect having to clear a stale one, and an attempt created
 * before the limit existed simply renders nothing here.
 */
function RemainingClause({ expiresAt, serverNow }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    if (!expiresAt) return undefined

    const parsed = serverNow ? new Date(serverNow).getTime() : Number.NaN
    const offsetMs = Number.isNaN(parsed) ? 0 : parsed - Date.now()

    const read = () => setRemaining(remainingFrom(expiresAt, { offsetMs }))
    // Scheduled, not called inline, so no setState runs synchronously inside the effect.
    const first = setTimeout(read, 0)
    const timer = setInterval(read, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(timer)
    }
  }, [expiresAt, serverNow])

  if (remaining === null) return null

  return (
    <>
      {' '}
      &mdash; <span className="tabular-nums">{formatRemaining(remaining)}</span> of it remains
    </>
  )
}

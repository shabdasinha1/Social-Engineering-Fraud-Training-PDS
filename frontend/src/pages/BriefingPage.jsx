import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Eye,
  MessageSquareWarning,
  Search,
  ShieldAlert,
  ShieldQuestion,
} from 'lucide-react'
import { StepCard } from '@/components/common/StepCard'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ASSESSMENT_SCENARIO_COUNT } from '@/constants/app'
import { CHANNELS } from '@/constants/channels'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCandidate } from '@/hooks/useCandidate'

/**
 * The six stages of a scenario, in the learner's own words. These mirror the engine's
 * stages (ENGINE-001) so the briefing describes the assessment the learner will actually
 * take - it must never promise a step the simulation does not have.
 */
const STEPS = [
  {
    step: '01',
    icon: Bell,
    title: 'Something arrives',
    text: 'A notification appears on your dashboard. Open it, or dismiss the alert.',
  },
  {
    step: '02',
    icon: Eye,
    title: 'Open and read it',
    text: 'Look at the message the same way you would on your own phone.',
  },
  {
    step: '03',
    icon: Search,
    title: 'Check the details',
    text: 'Examine the sender, a link, an attachment or a code - or decide without checking.',
  },
  {
    step: '04',
    icon: ShieldQuestion,
    title: 'Decide what to do',
    text: 'Every choice is a real control. Unsafe ones work, and only change what you see here.',
  },
  {
    step: '05',
    icon: CheckCircle2,
    title: 'Verify or escalate',
    text: 'Check through a source you already trust, or report or block the sender.',
  },
  {
    step: '06',
    icon: MessageSquareWarning,
    title: 'Settle it',
    text: 'Choose your final action, and add one line on why if you want to.',
  },
]

/**
 * What is simulated, and what the learner must never do.
 *
 * Client feedback (CLIENT-POLISH-001): the wording states that the CONTENT is synthetic
 * without suggesting the ASSESSMENT is optional. "Made up for practice" did the second by
 * accident, so it now says what the content actually is - generated for this assessment.
 */
const SAFETY_POINTS = [
  'No real message is sent and no real person is contacted.',
  'Every name, number, organisation and link is synthetic content generated for this assessment.',
  'Never type a real password, OTP, bank or card detail anywhere in this assessment.',
]

const SUMMARY = [
  { value: ASSESSMENT_SCENARIO_COUNT, label: 'Scenarios' },
  { value: CHANNELS.length, label: 'Apps' },
  { value: 1, label: 'Assessment' },
]

export function BriefingPage() {
  useDocumentTitle()

  const navigate = useNavigate()
  const { candidate } = useCandidate()
  const firstName = candidate?.display_name?.trim().split(/\s+/)[0]

  return (
    <AppLayout>
      <header className="animate-fade-up">
        <p className="text-sm font-bold tracking-[0.1em] text-text-muted uppercase">
          Before you begin
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Welcome{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-3 max-w-2xl text-balance-pretty text-text-muted sm:text-lg">
          This is a controlled training simulation, and it is assessed. You will be shown
          realistic communications and asked to decide which are safe and which are fraud.
          Your decisions are evaluated.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="space-y-6">
          <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
            <h2 className="text-lg font-bold sm:text-xl">How the training works</h2>
            <p className="mt-1 text-text-muted">
              Every scenario runs through the same six steps.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {STEPS.map((step, index) => (
                <StepCard
                  key={step.step}
                  {...step}
                  className="animate-fade-up"
                  style={{ animationDelay: `${120 + index * 60}ms` }}
                />
              ))}
            </div>

            <p className="mt-6 rounded-md bg-primary-soft px-4 py-3 text-sm text-secondary">
              Your marks are kept until the end, so nothing you see during a scenario
              tells you whether it was genuine. Your time is recorded, but it does not
              change your score.
            </p>
          </Card>

          <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <h2 className="text-lg font-bold sm:text-xl">Where the messages come from</h2>
            <p className="mt-1 text-balance-pretty text-text-muted">
              Your {ASSESSMENT_SCENARIO_COUNT} scenarios are mixed together from these
              four apps. There is no separate test for each app.
            </p>

            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              {CHANNELS.map(({ key, label, icon: Icon, accent }) => (
                <li
                  key={key}
                  className="flex flex-col items-start gap-3 rounded-md border border-border bg-surface p-3.5 transition-[border-color,box-shadow] duration-200 hover:border-border-strong hover:shadow-sm sm:flex-row sm:items-center sm:gap-3.5 sm:p-4"
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-md ${accent}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="block font-semibold">{label}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside
          className="animate-fade-up lg:sticky lg:top-24"
          style={{ animationDelay: '180ms' }}
        >
          <Card className="p-5 sm:p-6">
            <h2 className="text-lg font-bold">Your training</h2>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              {SUMMARY.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col-reverse rounded-md bg-secondary-soft px-2 py-3"
                >
                  <dt className="mt-0.5 text-xs font-medium text-text-muted">{label}</dt>
                  <dd className="text-xl font-bold text-primary tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-md border border-warning/25 bg-warning-soft p-4">
              {/*
                The line the client named directly: "This is only practice - Only this line
                can be changed with something else, rest is fine." It read as though the
                exercise were optional. The panel still carries exactly the same safety
                facts; only the framing changed, and the TRAINING SIMULATION rail above is
                untouched.
              */}
              <p className="flex items-center gap-2 font-semibold text-warning">
                <ShieldAlert size={17} aria-hidden="true" />
                Assessment environment
              </p>
              <ul className="mt-2.5 space-y-2 text-sm text-text">
                {SAFETY_POINTS.map((point) => (
                  <li key={point} className="flex gap-2 text-balance-pretty">
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-warning"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <BriefingAcknowledgement onContinue={() => navigate(ROUTES.DASHBOARD)} />

            <p className="mt-3 text-center text-sm text-text-muted">
              Your answers are recorded for your score and feedback.
            </p>
          </Card>
        </aside>
      </div>
    </AppLayout>
  )
}

/**
 * The briefing acknowledgement (PROFILE-001, specification section 2 - gap G3).
 *
 * The only part of this screen PROFILE-001 changes. Everything above it is untouched: this
 * task adds a consent record, not a briefing redesign.
 *
 * Consent is a deliberate act, so it is gated on a control the learner has to operate.
 * Loading the page acknowledges nothing, and neither does reading it - the checkbox is the
 * action, and Continue is what commits it. The version acknowledged is the one the server
 * says it currently requires, sent back to it rather than hardcoded here, so this screen
 * cannot satisfy a briefing revision it did not display.
 *
 * A learner who has already acknowledged the current version is not asked twice; raising
 * `BRIEFING_VERSION` server-side makes `acknowledged` false again and this gate returns,
 * without a single attempt, run, event or earlier acknowledgement being deleted.
 */
function BriefingAcknowledgement({ onContinue }) {
  const { candidate, acknowledgeBriefing } = useCandidate()
  const [confirmed, setConfirmed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const briefing = candidate?.briefing ?? null
  const acknowledged = briefing?.acknowledged === true

  const handleContinue = async () => {
    if (acknowledged) {
      onContinue()
      return
    }

    setSaving(true)
    setError('')
    try {
      await acknowledgeBriefing(briefing?.required_version)
      onContinue()
    } catch (caught) {
      // Not navigating on failure is the point: an unrecorded acknowledgement must not
      // look like a recorded one.
      setError(caught.message)
      setSaving(false)
    }
  }

  return (
    <div className="mt-5">
      {acknowledged ? (
        <p className="flex items-start gap-2 rounded-md border border-success/25 bg-success-soft p-3 text-sm text-success">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            You acknowledged this briefing
            {briefing.acknowledged_at
              ? ` on ${new Date(briefing.acknowledged_at).toLocaleDateString()}`
              : ''}
            .
          </span>
        </p>
      ) : (
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background p-3 text-sm">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => {
              setConfirmed(event.target.checked)
              if (error) setError('')
            }}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="text-balance-pretty">
            I have read this briefing and understand how this assessment works.
          </span>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <Button
        size="lg"
        fullWidth
        className="mt-4"
        loading={saving}
        disabled={!acknowledged && !confirmed}
        onClick={handleContinue}
      >
        Continue to Dashboard
        {!saving && <ArrowRight size={19} aria-hidden="true" />}
      </Button>

      {!acknowledged && (
        <p className="mt-2 text-center text-xs text-text-muted">
          Your acknowledgement is recorded against briefing version{' '}
          {briefing?.required_version ?? '-'}.
        </p>
      )}
    </div>
  )
}

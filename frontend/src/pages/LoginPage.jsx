import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Hash,
  Lock,
  RotateCw,
  ServerCrash,
  User,
  UserCheck,
} from 'lucide-react'
import { EntryPanel } from '@/components/auth/EntryPanel'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '@/layouts/AuthLayout'
import { ROUTES } from '@/constants/routes'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useCandidate } from '@/hooks/useCandidate'
import { isInfrastructureError } from '@/services/apiClient'
import { validateIdentifier, validateName } from '@/utils/validation'

const EMPTY_FORM = { name: '', identifier: '' }

/**
 * Bounded on purpose. Retry is already one press per attempt, so nothing here can loop on
 * its own; this cap is for the learner who would otherwise keep pressing a button that is
 * never going to work, and it hands them the instructor instead.
 */
const MAX_RETRY_ATTEMPTS = 3

/**
 * The primary action's entry-screen treatment (ENHANCEMENT-002). `group` lets the arrow
 * inside nudge forward on hover; everything else is the `entry-cta` utility in index.css.
 */
const ENTRY_CTA = 'entry-cta group'
const CTA_ARROW = 'transition-transform duration-200 motion-safe:group-hover:translate-x-0.5'

/**
 * The panel readout for each state of the screen. Presentation only - see `EntryPanel`
 * for why it is hidden from assistive technology.
 */
function panelStatus({ storageFailure, retrying, foundProfile, submitting, checking }) {
  if (storageFailure) {
    return { tone: 'danger', label: retrying ? 'Retrying' : 'Record store unreachable' }
  }
  if (foundProfile) return { tone: 'success', label: 'Existing record found' }
  if (submitting) return { tone: 'active', label: 'Checking details' }
  if (checking) return { tone: 'active', label: 'Checking session' }
  return { tone: 'ready', label: 'Awaiting details' }
}

/**
 * Learner entry (LOGIN-001, client specification section 2 - closes ACCEPTANCE-001 gap G4).
 *
 * Three states, one screen: the identity form, the profile-found card when the service
 * number already resolves to a profile, and a storage failure with Retry.
 *
 * No new backend endpoint was needed for any of it. `POST /candidates` already answers 201
 * `created: true` for a new profile and 200 `created: false` for an existing one, and
 * `GET /candidates/me` already separates "nobody is signed in" (401) from "the session
 * could not be read" (status 0 or 5xx). LOGIN-001 renders distinctions the API was already
 * making and that the UI had been discarding.
 *
 * What this screen must never show is the other half of the requirement, and since
 * PROFILE-001 it is the server that guarantees it: the candidate payload carries
 * `display_name` and `service_no_masked` and no longer contains the profile id or the
 * service number in full, so the profile-found card cannot print either even by mistake.
 */
export function LoginPage() {
  useDocumentTitle('Start Training')

  const navigate = useNavigate()
  const { candidate, checking, sessionError, retrySession, signIn, signOut } = useCandidate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  /** The profile `POST /candidates` matched rather than created. */
  const [foundProfile, setFoundProfile] = useState(null)
  /** A storage failure raised by the sign-in itself, as opposed to the session check. */
  const [submitFailure, setSubmitFailure] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [retries, setRetries] = useState(0)

  /**
   * Set synchronously before the sign-in request, so that when `signIn` populates the
   * candidate the redirect effect below already knows this submit owns the outcome.
   * Without it the effect would fire on the new candidate and navigate straight past the
   * profile-found card the submit is about to show.
   */
  const submitOwnsOutcome = useRef(false)
  const headingRef = useRef(null)

  /**
   * Suppresses blur validation on a form the learner has not touched yet.
   *
   * Resetting the form ("use different details") re-renders the fields, and the name
   * input takes autofocus at the same moment focus leaves the control that caused the reset. The resulting blur is not the learner leaving
   * a field empty - they never entered it - so reporting "Please enter your full name" over
   * a form they have just been told is cleared would be wrong. Cleared again the moment
   * anything is typed, so ordinary blur validation is unaffected.
   */
  const suppressBlurValidation = useRef(false)

  const storageFailure = submitFailure || sessionError
  const retryMode = submitFailure ? 'submit' : 'session'
  const retriesLeft = MAX_RETRY_ATTEMPTS - retries

  // A session that already existed when this screen loaded goes straight on.
  useEffect(() => {
    if (checking || !candidate || submitOwnsOutcome.current) return
    navigate(ROUTES.BRIEFING, { replace: true })
  }, [checking, candidate, navigate])

  // Moving focus to the new heading is what announces a state change to a screen reader
  // without hijacking the reading position mid-form.
  useEffect(() => {
    if (foundProfile || storageFailure) headingRef.current?.focus()
  }, [foundProfile, storageFailure])

  const validators = { name: validateName, identifier: validateIdentifier }

  const handleChange = (field) => (event) => {
    const { value } = event.target
    suppressBlurValidation.current = false
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleBlur = (field) => () => {
    if (suppressBlurValidation.current) return
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }))
  }

  /**
   * The sign-in request, shared by the form submit and by Retry so a retry repeats exactly
   * what failed rather than a second, subtly different call.
   */
  const attemptSignIn = useCallback(async () => {
    setSubmitError('')
    submitOwnsOutcome.current = true
    try {
      const { candidate: profile, created } = await signIn(
        form.name.trim(),
        form.identifier.trim(),
      )
      setSubmitFailure('')
      if (created) {
        navigate(ROUTES.BRIEFING, { replace: true })
        return true
      }
      // An existing profile stops here so the learner can confirm it is theirs.
      setFoundProfile(profile)
      return true
    } catch (error) {
      submitOwnsOutcome.current = false
      if (isInfrastructureError(error)) {
        // Recoverable, and the typed values are kept so Retry costs nothing to use.
        setSubmitFailure(error.message)
      } else {
        setSubmitError(error.message)
      }
      return false
    }
  }, [form, navigate, signIn])

  const handleSubmit = async (event) => {
    event.preventDefault()
    // The disabled button already blocks a second submit; this covers Enter pressed in a
    // field while the first request is still in flight.
    if (submitting) return
    setSubmitError('')

    const nextErrors = {
      name: validateName(form.name),
      identifier: validateIdentifier(form.identifier),
    }
    setErrors(nextErrors)

    if (nextErrors.name || nextErrors.identifier) {
      document.getElementById(nextErrors.name ? 'name' : 'identifier')?.focus()
      return
    }

    setSubmitting(true)
    await attemptSignIn()
    setSubmitting(false)
  }

  const handleRetry = async () => {
    if (retrying || retriesLeft <= 0) return
    setRetries((n) => n + 1)
    setRetrying(true)
    if (retryMode === 'submit') {
      await attemptSignIn()
    } else {
      await retrySession()
    }
    setRetrying(false)
  }

  /** Back to the form from the profile-found card - a different learner at this device. */
  const handleUseDifferentDetails = async () => {
    submitOwnsOutcome.current = false
    suppressBlurValidation.current = true
    setFoundProfile(null)
    setForm(EMPTY_FORM)
    setErrors(EMPTY_FORM)
    await signOut()
    document.getElementById('name')?.focus()
  }

  return (
    <AuthLayout>
      <EntryPanel
        status={panelStatus({ storageFailure, retrying, foundProfile, submitting, checking })}
        busy={submitting || retrying}
      >
        {storageFailure ? (
          <StorageErrorState
            headingRef={headingRef}
            message={storageFailure}
            retrying={retrying}
            retriesLeft={retriesLeft}
            onRetry={handleRetry}
          />
        ) : foundProfile ? (
          <ProfileFoundState
            headingRef={headingRef}
            profile={foundProfile}
            onContinue={() => navigate(ROUTES.BRIEFING, { replace: true })}
            onUseDifferent={handleUseDifferentDetails}
          />
        ) : (
          <>
            <header>
              <h2 className="text-xl font-bold tracking-[-0.015em] sm:text-2xl">
                Enter your details to continue
              </h2>
              <p className="mt-1.5 text-balance-pretty text-text-muted">
                These two details identify your assessment record. Nothing else is required.
              </p>
            </header>

            {submitError && (
              <Alert variant="danger" className="mt-5 motion-safe:animate-shake">
                {submitError}
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5 sm:mt-7">
              <FormField id="name" label="Full Name" error={errors.name} required>
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    name="name"
                    icon={User}
                    tone="entry"
                    value={form.name}
                    onChange={handleChange('name')}
                    onBlur={handleBlur('name')}
                    invalid={Boolean(errors.name)}
                    aria-describedby={describedBy}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    autoFocus
                    maxLength={60}
                    enterKeyHint="next"
                  />
                )}
              </FormField>

              {/*
                Specification section 2 names this field "Personal / Service Number", and
                the same section's login data contract says: "Do not add password, Aadhaar,
                phone, email, rank or real unit fields to Version 1."

                The label previously read "Phone / Service Number" with a hint asking for a
                10-digit phone number, which invited exactly the value section 2 prohibits.
                Nothing was ever stored as a phone field - `Candidate` has no such field -
                but a learner reading the label had every reason to type one, and one
                existing profile key is a bare 10-digit number.

                The hint deliberately describes the identity rather than a format: the
                client-side length and character rule still diverges from section 2's
                "3-24 alphanumeric characters plus hyphen" (see `validateIdentifier`), and
                a hint promising a rule the validator does not enforce would be a second
                defect in place of the first.
              */}
              <FormField
                id="identifier"
                label="Personal / Service Number"
                hint="The personal or service number issued to you."
                error={errors.identifier}
                required
              >
                {({ id, describedBy }) => (
                  <Input
                    id={id}
                    name="identifier"
                    icon={Hash}
                    tone="entry"
                    value={form.identifier}
                    onChange={handleChange('identifier')}
                    onBlur={handleBlur('identifier')}
                    invalid={Boolean(errors.identifier)}
                    aria-describedby={describedBy}
                    placeholder="Enter your personal or service number"
                    inputMode="text"
                    autoComplete="off"
                    maxLength={20}
                    enterKeyHint="go"
                  />
                )}
              </FormField>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={submitting}
                className={`mt-1 ${ENTRY_CTA}`}
              >
                Start Training
                {!submitting && <ArrowRight size={19} aria-hidden="true" className={CTA_ARROW} />}
              </Button>
            </form>

            <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-sm text-text-muted">
              <Lock size={15} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
              Assessment environment. Your decisions will be evaluated across simulated
              communications, and these details are used only for this assessment record.
            </p>
          </>
        )}
      </EntryPanel>
    </AuthLayout>
  )
}

/**
 * Section 2's profile-found card.
 *
 * Everything shown here is deliberate: the display name so the learner can tell it is
 * their record, and the masked service number so they can tell it is the right one. The
 * profile id, the unmasked number, the attempt history and anything about previous answers
 * are all withheld - confirming identity needs none of them.
 */
function ProfileFoundState({ headingRef, profile, onContinue, onUseDifferent }) {
  return (
    <>
      <header>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold tracking-[-0.015em] outline-none sm:text-2xl"
        >
          Existing record found
        </h2>
        <p className="mt-1.5 text-balance-pretty text-text-muted">
          This service number is already registered for assessment. Confirm it is yours
          before continuing.
        </p>
      </header>

      <div className="relative mt-6 overflow-hidden rounded-md border border-border bg-background p-4 pl-5">
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-linear-to-b from-signal to-primary" />
        <p className="flex items-center gap-2 font-mono text-[0.68rem] font-bold tracking-[0.12em] text-signal uppercase">
          <UserCheck size={14} aria-hidden="true" />
          Registered learner
        </p>

        <dl className="mt-3 space-y-3">
          <div>
            <dt className="text-sm text-text-muted">Name</dt>
            <dd className="font-semibold text-text">{profile.display_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">Personal / Service Number</dt>
            <dd className="font-semibold tabular-nums text-text">
              {profile.service_no_masked}
              <span className="sr-only">
                {' '}
                (showing the last four characters only)
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 space-y-3">
        <Button size="lg" fullWidth onClick={onContinue} className={ENTRY_CTA}>
          Continue as this learner
          <ArrowRight size={19} aria-hidden="true" className={CTA_ARROW} />
        </Button>
        <Button variant="outline" fullWidth onClick={onUseDifferent}>
          Not you? Use different details
        </Button>
      </div>

      <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-sm text-text-muted">
        <Lock size={15} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
        Only the last four characters of your number are shown. Previous results are not
        displayed here.
      </p>
    </>
  )
}

/**
 * The session or the record store could not be reached.
 *
 * Distinct from a validation message on purpose: nothing the learner typed caused this and
 * nothing they can retype will fix it, so the screen stops asking for details and offers
 * the one action that can help. Entered values are preserved behind this state, so a
 * successful Retry continues from where they were rather than making them type again.
 */
function StorageErrorState({ headingRef, message, retrying, retriesLeft, onRetry }) {
  const exhausted = retriesLeft <= 0

  return (
    <>
      <header>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="flex items-start gap-2.5 text-xl font-bold tracking-[-0.015em] outline-none sm:text-2xl"
        >
          <ServerCrash size={22} className="mt-1 shrink-0 text-danger" aria-hidden="true" />
          Cannot reach your training record
        </h2>
        <p className="mt-1.5 text-balance-pretty text-text-muted">
          Your details have been kept on this screen. Nothing was submitted and no record
          was changed.
        </p>
      </header>

      <Alert variant="danger" title="Storage unavailable" className="mt-5">
        {message}
      </Alert>

      {/* Announced without moving focus, so a retry in progress is audible mid-press. */}
      <p role="status" aria-live="polite" className="mt-4 text-sm text-text-muted">
        {retrying
          ? 'Retrying now. Please wait.'
          : exhausted
            ? 'Retried three times without success. Ask the instructor supervising this '
              + 'session to check that the training server is running.'
            : `Retry is available. ${retriesLeft} of ${MAX_RETRY_ATTEMPTS} attempts remaining.`}
      </p>

      <Button
        size="lg"
        fullWidth
        className={`mt-5 ${ENTRY_CTA}`}
        loading={retrying}
        disabled={exhausted}
        onClick={onRetry}
      >
        {!retrying && <RotateCw size={18} aria-hidden="true" />}
        {retrying ? 'Retrying' : 'Retry'}
      </Button>

      <p className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-sm text-text-muted">
        <Lock size={15} className="mt-0.5 shrink-0 text-signal" aria-hidden="true" />
        This is a fault in the training system, not in the details you entered.
      </p>
    </>
  )
}

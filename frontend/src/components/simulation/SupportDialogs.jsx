import { Modal } from '@/components/ui/Modal'
import { ASSESSMENT_SCENARIO_COUNT } from '@/constants/app'

/**
 * The dashboard's support surfaces (UI-004, client specification section 3).
 *
 * Section 3 names two support controls - "Rules / Report simulation issue" - and puts
 * accessibility and restart in the profile chip menu. All four are here because they share
 * one property: none of them touches the attempt. They read nothing from the engine, they
 * submit nothing, and no learner action inside them is scored or recorded.
 *
 * What these panels must never contain is the harder constraint. Between them they explain
 * how the simulation works, and they are available at every stage - so a single sentence of
 * tactical advice here would be an answer key the learner could open mid-decision. The rules
 * therefore describe the CONTAINER (synthetic content, offline boundary, what is recorded,
 * when marks appear) and never the CONTENT: no disposition, no difficulty, no attack family,
 * no expected action, and no point value.
 */

function Bullets({ items }) {
  return (
    <ul className="space-y-2.5 text-sm text-text">
      {items.map((item) => (
        <li key={item.title} className="border-l-2 border-border-strong pl-3">
          <p className="font-semibold">{item.title}</p>
          <p className="mt-0.5 text-balance-pretty text-text-muted">{item.body}</p>
        </li>
      ))}
    </ul>
  )
}

export function RulesDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rules of this simulation"
      description="How this assessment works and what is and is not real."
    >
      <Bullets
        items={[
          {
            title: 'Everything here is synthetic',
            body:
              'Every message, sender, profile, link, attachment, code, call, payment and '
              + 'install screen is generated training content. No account, number, address or '
              + 'organisation shown is real, and no real one is contacted.',
          },
          {
            title: 'Nothing is carried out for real',
            body:
              'Links open a simulated browser, files are inert previews, codes are decoded on '
              + 'the phone, and no payment, install or reply is ever carried out. There is no '
              + 'dialer, camera or microphone.',
          },
          {
            title: 'How the assessment runs',
            body:
              `${ASSESSMENT_SCENARIO_COUNT} scenarios, one at a time. Each arrives as a `
              + 'notification, is opened from the toast or its app, and moves through six '
              + 'steps to a final action. You return here after each one.',
          },
          {
            title: 'What is recorded',
            body:
              'The actions you take and the order you take them in, on this system only. '
              + 'Never type a real password, OTP, PIN, card number or genuine unit detail '
              + 'into any field - no field here needs one.',
          },
          {
            title: 'Time limit',
            body:
              'This assessment has a time limit that starts the moment you begin it. The clock '
              + 'is kept by the training system, not by this window - it keeps running if '
              + 'you refresh, close the window or sign out, and it does not restart when '
              + 'you come back. When the time is up the assessment is closed and marked '
              + 'automatically: everything you completed counts, and anything you did not '
              + 'reach is recorded as not completed.',
          },
          {
            title: 'Marks',
            body:
              'Your score is shown once the whole attempt is complete, not during it. '
              + 'Judgment is what is measured, so treating every item the same way is not a '
              + 'strategy that scores well.',
          },
          {
            title: 'Using it',
            body:
              'Every control is reachable by keyboard: Tab to move, Enter or Space to '
              + 'choose, Escape to close a panel. The interface supports 200% zoom and '
              + 'follows your reduced-motion setting.',
          },
          {
            title: 'If something is wrong with the simulation',
            body:
              'Use "Report a simulation issue" at the bottom of the screen. That is separate '
              + 'from reporting a message inside a scenario, and it is not scored.',
          },
        ]}
      />
    </Modal>
  )
}

/**
 * Section 3: "Simulation-issue report is separate from the scenario's report-phishing
 * control."
 *
 * The separation is stated in the panel itself rather than implied by placement, because
 * the two really do have opposite consequences: reporting inside a scenario is a scored
 * decision about the item, and this is not a decision about the item at all.
 *
 * It sends nothing. There is no report form behind it, so the honest design is to give the
 * learner the reference they need and the escalation path, not a form that pretends to
 * file something.
 */
export function ReportIssueDialog({ open, onClose, ordinal, total }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Report a simulation issue"
      description="For problems with the training system itself."
    >
      <div className="space-y-4 text-sm">
        <p className="rounded-md border border-warning/25 bg-warning-soft p-3 text-warning">
          <span className="font-semibold">This is not the Report control inside a scenario.</span>{' '}
          Reporting a message is a scored decision about that message. Reporting a simulation
          issue is not scored, does not change your attempt and does not resolve the scenario
          you are on.
        </p>

        <p className="text-text-muted text-balance-pretty">
          Use this for content that will not load, a control that does nothing, text that is
          cut off, or anything that looks like a fault in the training system.
        </p>

        <div className="rounded-md border border-border bg-background p-3">
          <p className="text-[0.68rem] font-bold tracking-[0.08em] text-text-muted uppercase">
            Quote this reference
          </p>
          <p className="mt-1 font-semibold tabular-nums">
            {ordinal ? `Scenario ${ordinal} of ${total}` : 'Between scenarios'}
          </p>
        </div>

        <p className="text-text-muted text-balance-pretty">
          Tell the instructor supervising this session, through the approved support route
          for this system. This panel sends nothing - there is no report form here, so the
          instructor is the way to raise it.
        </p>
      </div>
    </Modal>
  )
}

export function AccessibilityDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accessibility"
      description="How to operate this assessment without a mouse."
    >
      <Bullets
        items={[
          {
            title: 'Keyboard',
            body:
              'Tab and Shift+Tab move between controls, Enter or Space activates one, and '
              + 'Escape closes an open panel. Focus stays inside a panel while it is open and '
              + 'returns to the page when it closes.',
          },
          {
            title: 'Screen readers',
            body:
              'The step you are on, the number of scenarios resolved and anything that has '
              + 'just arrived are announced without moving your focus.',
          },
          {
            title: 'Zoom and contrast',
            body:
              'The layout supports 200% browser zoom without loss of content. Meaning is '
              + 'never carried by colour alone: every status has a word or a shape as well.',
          },
          {
            title: 'Motion and sound',
            body:
              'Animations follow your reduced-motion setting. The simulation plays no sound.',
          },
        ]}
      />
    </Modal>
  )
}

/**
 * Section 3 puts "restart (instructor-controlled)" in the profile chip menu.
 *
 * Instructor-controlled is the whole requirement, so this panel explains and does not act.
 * A self-service restart would be a learner-authoritative attempt transition - exactly what
 * the instructor reset in section 6 exists to prevent - so no request is made from here,
 * and there is deliberately no confirm button to look for.
 */
export function RestartDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Restarting this assessment"
      description="Restart is controlled by your instructor."
    >
      <div className="space-y-3 text-sm text-text-muted">
        <p className="text-balance-pretty">
          An assessment in progress cannot be restarted from here. This is deliberate: an
          attempt that could be abandoned and retaken at will would not measure anything.
        </p>
        <p className="text-balance-pretty">
          If you need to start again - the wrong learner is signed in, or the session was set
          up incorrectly - ask the instructor supervising this session. An instructor can
          release an unfinished attempt from the administration area.
        </p>
        <p className="text-balance-pretty">
          Nothing has been requested by opening this panel, and your current attempt is
          unaffected. Closing this and carrying on continues from where you were.
        </p>
      </div>
    </Modal>
  )
}

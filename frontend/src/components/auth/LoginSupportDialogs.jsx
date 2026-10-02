import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

/**
 * The login screen's support surfaces (LOGIN-001, client specification section 2:
 * "Instructor help / Exit footer").
 *
 * Both reuse the `Modal` primitive the simulation already uses, so focus trapping, Escape
 * and focus restoration behave identically to every other dialog in the product rather
 * than being re-implemented here.
 *
 * Neither contacts anything. There is no support address to open and no ticket to file -
 * the honest thing is to name the escalation route and say plainly that nothing is sent
 * from here, which is the same posture
 * `ReportIssueDialog` takes on the simulation side.
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

/**
 * What a learner stuck on the entry screen actually needs, and nothing about the
 * assessment content: this dialog is reachable before an attempt exists, so it says
 * nothing about scenarios, scoring or what a correct decision looks like.
 */
export function InstructorHelpDialog({ open, onClose }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Instructor help"
      description="Getting into the assessment, and what to do if you cannot."
    >
      <Bullets
        items={[
          {
            title: 'What to enter',
            body:
              'Your full name, and the service number or contact number issued to you for '
              + 'this session. These two details identify your record and nothing else.',
          },
          {
            title: 'Never enter a real credential',
            body:
              'No password, OTP, PIN, card number, Aadhaar or personal email is needed '
              + 'anywhere in this system, on this screen or inside the assessment. No field '
              + 'here will ever ask you for one.',
          },
          {
            title: 'If your details are not accepted',
            body:
              'Check the number for a typo and try again. If it is still refused, or you are '
              + 'told the profile is not available, the instructor supervising this session '
              + 'has to resolve it from the administration area.',
          },
          {
            title: 'If the screen reports a connection problem',
            body:
              'Use Retry on that message. If it fails again, the training server needs '
              + 'attention - tell the instructor rather than reloading repeatedly.',
          },
          {
            title: 'Using this screen',
            body:
              'Tab and Shift+Tab move between controls, Enter activates one, and Escape '
              + 'closes a panel like this. Every control here is reachable without a mouse.',
          },
          {
            title: 'This panel contacts nobody',
            body:
              'Opening it sends nothing and raises no ticket. Ask the instructor '
              + 'supervising this session through the approved support route.',
          },
        ]}
      />
    </Modal>
  )
}

/**
 * Exit, stated honestly.
 *
 * A page cannot close a window it did not open - `window.close()` is ignored for a tab the
 * learner navigated to - so this does not offer to close the browser and then quietly fail.
 * It does the part that is real and does matter on a shared training machine: ends the
 * session and clears the details on screen, so the next person at this device does not
 * inherit the previous learner's entry.
 */
export function ExitDialog({ open, onClose, onConfirm, busy = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Exit the assessment"
      description="Ends this session on this device."
    >
      <div className="space-y-4 text-sm">
        <p className="text-balance-pretty text-text-muted">
          Exiting signs you out and clears the details you have entered, so the next person
          using this device does not start from your entry.
        </p>

        <p className="rounded-md border border-info/25 bg-info-soft p-3 text-info text-balance-pretty">
          <span className="font-semibold">This does not close the browser.</span> A page
          cannot close a window it did not open. Once you have exited, close the window
          yourself or hand the device back to the instructor supervising this session.
        </p>

        <p className="text-balance-pretty text-text-muted">
          Nothing you have already completed is deleted or changed by exiting. An assessment
          in progress is released by an instructor, not from here.
        </p>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Stay on this screen
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={busy}>
            Exit and clear details
          </Button>
        </div>
      </div>
    </Modal>
  )
}

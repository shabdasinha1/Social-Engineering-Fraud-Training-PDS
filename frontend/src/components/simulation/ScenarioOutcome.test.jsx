import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ScenarioOutcome } from '@/components/simulation/ScenarioOutcome'

/**
 * ADM-007: the outcome screen shows the feedback card only when the server released it.
 *
 * Whether it is released is the instructor's feedback-timing control, decided on the
 * server. This screen renders what it was given and invents nothing when it was not.
 */

afterEach(cleanup)

const CARD = {
  result: 'This was a delivery-fee scam.',
  cues: ['Unknown sender', 'Small fee to release a parcel'],
  safe_action: 'Report it and check the courier app yourself.',
  impact: 'Card details would have been stolen.',
  prevention_habit: 'Track parcels only in the official app.',
}

const resolution = (feedback) => ({
  score_visibility: 'final',
  score_0_10: 8,
  outcome_code: 'resolve_report',
  feedback,
})

describe('ScenarioOutcome feedback', () => {
  it('shows the released feedback card (immediate timing)', () => {
    render(
      <ScenarioOutcome
        resolution={resolution(CARD)}
        ordinal={3}
        total={10}
        scoreVisible={false}
        onContinue={() => {}}
      />,
    )

    expect(screen.getByRole('region', { name: 'Feedback on this scenario' })).toBeTruthy()
    expect(screen.getByText(CARD.result)).toBeTruthy()
    expect(screen.getByText(CARD.safe_action)).toBeTruthy()
    expect(screen.getByText(CARD.prevention_habit)).toBeTruthy()
    expect(screen.getByText('Unknown sender')).toBeTruthy()
    // Feedback does not unlock the score: assessment mode still hides it.
    expect(screen.queryByText(/for this scenario$/)).toBeNull()
  })

  it('shows no feedback when it is held until the attempt ends (on_completion)', () => {
    render(
      <ScenarioOutcome
        resolution={resolution(null)}
        ordinal={3}
        total={10}
        scoreVisible={false}
        onContinue={() => {}}
      />,
    )

    expect(screen.queryByRole('region', { name: 'Feedback on this scenario' })).toBeNull()
    expect(screen.getByText('You reported it.')).toBeTruthy()
  })
})

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headlineTime, me, quote, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W09 - Compromised Colleague Gift Cards.
 *
 * The hardest scenario in the batch, because **every check the learner has been trained to
 * run comes back clean**. The number is saved. It is the right number. There is a year of
 * real conversation above the request. Groups in common: nine. The account is not an
 * impostor's - it is Arin's, and somebody else is using it.
 *
 * That is the mechanism ATT&CK describes at T1586.002, whose own words are the point:
 * "utilizing an existing persona with a compromised email account may engender a level of
 * trust in a potential victim if they have a relationship with... the compromised
 * persona". The sub-technique names email accounts rather than messaging accounts, so it
 * is a partial fit and is recorded as one. The request itself is T1657 Financial Theft,
 * which names BEC explicitly, delivered through T1684.001 Impersonation - and gift cards
 * are the low-value entry form of the pattern the FBI's 2025 IC3 report counts at 24,768
 * complaints and $3.05bn.
 *
 * **The distinct interaction is the refused call.** Every other scenario in this batch
 * lets the learner verify by looking at something. Here the only thing that settles it is
 * a voice, the message pre-emptively forbids one ("can't talk, in a meeting"), and the
 * verification route is to ignore that and ring the saved number anyway. Arin answers.
 *
 * So the contact sheet is deliberately reassuring, and the evidence is entirely in
 * BEHAVIOUR: the writing changes register mid-thread, the request is for a payment
 * instrument that cannot be reversed or traced, secrecy is asked for, and voice is refused.
 * A learner who checks identity here gets the right answer to the wrong question.
 *
 * The client's notification text is truncated in the pinned bank at the apostrophe in
 * "Can't" - see `requestLine` - so the conversation states the client's full sentence and
 * the bank's own asset is left untouched.
 */
export function buildW09(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full. The pinned notification asset holds only "Can"
   * because the DATA-003 generator's capture stops at the first apostrophe; the bank is
   * not edited here. Recorded as a finding - twelve scenarios are affected.
   */
  const requestLine = "Can't talk. Buy four gift cards for visitors and send the codes in 10 minutes."

  return {
    scenarioId: 'W09',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      presence: 'last seen today at 14:03',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w09-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: headlineTime(scenario),
          unread: 4,
        },
        {
          id: 'w09-bg-1',
          title: 'Coy Office',
          group: true,
          preview: 'Adjt: visitor programme attached, 1400 start',
          time: '11:26',
          inert: true,
        },
        {
          id: 'w09-bg-2',
          title: 'Ma',
          preview: 'did you eat',
          time: '10:41',
          inert: true,
        },
        {
          id: 'w09-bg-3',
          title: 'Sep Rathi',
          preview: 'You: will collect it tomorrow',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w09-e2e'),
      // IMMERSIVE-AUDIT-001: the bank's narrator line ("…genuine account sends an
      // out-of-character request") states the verdict, so it is not printed; the thread shows it.

      /** A year of ordinary working conversation. This is what "clean" looks like. */
      day('w09-day-old', 'LAST WEEK'),
      them('w09-b0', 'Can you take the 0600 inspection on Thursday? I have the range that day.',
        '17:44', { priorChat: true }),
      me('w09-b0b', 'Yes sir, will do.', '17:51', { priorChat: true }),
      them('w09-b0c', 'Thanks. Put the return in the folder when it is done.', '17:52',
        { priorChat: true }),

      day('w09-day', 'TODAY'),
      me('w09-b1', 'Sir, visitor programme is out. Do you want me at the gate for 1400?',
        '11:31', { status: 'read' }),
      them('w09-b2', 'Yes please.', '11:38'),

      /**
       * The register changes here and never changes back. That is the evidence: shorter
       * sentences, no honorific, no reference to anything only Arin would know.
       */
      them('w09-b3', requestLine, headlineTime(scenario) ?? '14:02'),
      them('w09-b4', 'Denominations of 2000 each. Any brand available at the canteen.', '14:02'),
      them('w09-b5',
        'Photograph the back of each card and send the codes here. I will settle with you '
        + 'this evening.', '14:03'),

      them('w09-b6', 'In a meeting with the visitors, cannot take calls. Please just do it.',
        '14:09', { since: 'branch',
          quote: quote('You', 'Sir, should I come to the gate for 1400?') }),
      them('w09-b7', 'And do not discuss this with the adjutant, it is from my own pocket.',
        '14:10', { since: 'branch' }),

      typing('w09-typing', { until: 'resolve', since: 'verify' }),
      them('w09-b8', 'Have you got them?', '14:21', { since: 'verify' }),

      {
        kind: 'system', id: 'w09-after-pay', tone: 'alert',
        text: 'The cards were bought. Gift-card value cannot be stopped or reversed once the '
          + 'codes are read.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w09-after-pay-msg', from: 'them',
        text: 'Good. Two more of the same, I will send you the money together.',
        time: '14:26', since: 'verify', afterConsequence: 'simulated_payment',
      },
    ],

    surfaces: {
      /**
       * Deliberately clean. Every row here is genuine, because the account is genuine -
       * and a learner who treats this sheet as the answer will get it wrong.
       */
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: true,
        statusLine: 'Saved in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'Status', value: 'At work' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: `${who.display_name} (Coy 2IC)` },
                  { label: 'Saved', value: '2 years ago' },
                  { label: 'Number last changed', value: 'Never' },
                  { label: 'Security code', value: 'Changed today at 13:41' },
                ],
                note: 'The security code changes when the account is set up on a new device. '
                  + 'It also changes when someone reinstalls the app.',
              },
            ],
          },
          {
            id: 'style',
            label: 'This thread',
            sections: [
              {
                id: 'style-rows', heading: 'How this chat usually runs',
                rows: [
                  { label: 'Started', value: '2 years ago' },
                  { label: 'Usual subject', value: 'Duty rosters, inspections, returns' },
                  { label: 'Money mentioned before', value: 'Never' },
                  { label: 'Voice calls', value: '38, most recent last Thursday' },
                  { label: 'Calls refused before', value: 'Never' },
                ],
                note: 'Nothing in two years of this thread has been about buying anything.',
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 9,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: 'Coy Office', value: '14 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Duty Roster', value: '22 participants', group: true },
                  { label: 'Range Party', value: '11 participants', group: true },
                  { label: 'Welfare Fund', value: '31 participants', group: true },
                ],
                note: 'Four more groups in common.',
              },
            ],
          },
        ],
      },

      /**
       * The canteen's own gift-card counter, reached from the payment card.
       *
       * Walking into a shop is not a decision, so getting here is navigation. The decision
       * is at the till, after the total is on screen and the terms have said in plain words
       * that the value moves to whoever reads the code.
       */
      'giftcard-store': {
        kind: SURFACE.APP,
        appName: 'Canteen Store',
        appTagline: 'Gift cards',
        hero: {
          label: 'Selected',
          value: 'INR 8,000',
          caption: '4 cards of INR 2,000 - digital delivery, codes shown on screen',
          chips: ['No refunds', 'No cancellation'],
        },
        sections: [
          {
            id: 'order', heading: 'Order',
            rows: [
              { label: 'Cards', value: '4 x INR 2,000' },
              { label: 'Delivery', value: 'Codes displayed immediately after payment' },
              { label: 'Total', value: 'INR 8,000' },
            ],
          },
          {
            id: 'terms', heading: 'Before you buy',
            rows: [
              {
                label: 'How these work',
                value: 'Anyone who has the code can spend the value. The card does not have '
                  + 'to be handed over.',
              },
              {
                label: 'If a code is shared',
                value: 'The value cannot be stopped, traced or returned.',
              },
              { label: 'Reversal', value: 'Not possible once a code has been viewed' },
            ],
            note: 'Gift-card value behaves like cash, which is why requests to buy them and '
              + 'send the numbers are common in fraud.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Cards', icon: 'wallet' },
          { label: 'Orders', icon: 'history' },
          { label: 'Account', icon: 'profile' },
        ],
      },

      /** The till. The PIN lives in the sheet and is discarded when it closes. */
      'pay-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Confirm payment',
        app: 'Canteen Store',
        amount: 'INR 8,000.00',
        subtitle: '4 gift cards of INR 2,000',
        rows: [
          { label: 'Paying', value: 'Canteen Store - gift cards' },
          { label: 'Codes go to', value: 'Whoever they are sent to' },
          { label: 'Requested by', value: `${who.display_name} over WhatsApp` },
          { label: 'Reversible', value: 'No' },
        ],
        form: {
          heading: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'A request made only over chat has not been confirmed by the person it names.',
      },

      /** The call the message said could not happen. */
      'call-arin': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${who.display_name} (saved)`,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Arin here. Go ahead.' },
          { at: 4, speaker: 'you', text: 'Sir, about the gift cards for the visitors.' },
          { at: 8, speaker: 'them', text: 'What gift cards? I have not sent you anything today.' },
          { at: 13, speaker: 'them', text: 'I have been in the visitors brief since one o clock. My phone has been in my pocket.' },
          { at: 20, speaker: 'them', text: 'Do not buy anything. Report it and I will get the account looked at from my end.' },
        ],
      },

      'call-duty': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name ?? 'Unit Falcon Support Desk',
        number: desk.identifier ?? '+91 00000 57265',
        script: [
          { at: 0, speaker: 'them', text: 'Duty office.' },
          { at: 4, speaker: 'them', text: 'No, there is no authorisation for any purchase for the visitors. Nothing has come through this office.' },
          { at: 11, speaker: 'them', text: 'We have had two of these this month. Do not buy the cards. Send us the message and we will circulate it.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w09-dir-arin',
        name: `${who.display_name}, Coy 2IC`,
        identifier: who.identifier,
        provenance: 'local approved directory',
        role: 'Company second in command. Purchases are raised through the duty office, '
          + 'never by personal request.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w09-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w09-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w09-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, the history and how this chat usually runs',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w09-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w09-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w09-c06', slot: SLOT.COMPOSER,
            label: 'I will confirm this with you by phone before buying anything.',
            echo: 'I will confirm this with you by phone before buying anything.',
          }),
          /** Reaching the till is navigation; this control is the purchase. */
          action({
            id: 'w09-c07', slot: SLOT.SURFACE,
            on: 'pay-sheet', label: 'Pay INR 8,000', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'w09-c08', slot: SLOT.COMPOSER,
            label: 'Sending the codes now, I have not told anyone.',
            echo: 'Sending the codes now, I have not told anyone.',
          }),
          action({
            id: 'w09-c09', slot: SLOT.COMPOSER,
            label: 'On my way to the canteen now sir.',
            echo: 'On my way to the canteen now sir.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w09-c10',
            slot: SLOT.MENU, label: `Call ${who.display_name} on the saved number`,
            hint: 'The number already in your contacts', opens: 'call-arin',
          }),
          action({
            id: 'w09-c11',
            slot: SLOT.MENU,
            label: 'Check the duty office in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w09-c12',
            slot: SLOT.MENU,
            label: 'Ask in the chat to confirm it is really him',
          }),
          action({
            id: 'w09-c13', slot: SLOT.MENU,
            label: 'Report the message',
          }),
          action({
            id: 'w09-c14', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w09-c15', slot: SLOT.INLINE,
            label: 'Keep the chat, nothing further',
          }),
          action({
            id: 'w09-c16', slot: SLOT.INLINE,
            label: 'Report the account and alert the duty office',
          }),
          action({
            id: 'w09-c17', slot: SLOT.MENU,
            label: 'Block the account and close the chat',
          }),
          action({
            id: 'w09-c18', slot: SLOT.MENU,
            label: 'Buy the cards and send the codes',
          }),
          action({
            id: 'w09-c19', slot: SLOT.MENU,
            label: 'Leave it unanswered and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w09-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w09-nav-store', slot: SLOT.MENU, label: 'Canteen Store - gift cards',
        opens: 'giftcard-store', after: 'branch',
      }),
      navigate({
        id: 'w09-nav-till', slot: SLOT.MENU, label: 'Go to the till',
        opens: 'pay-sheet', after: 'branch',
      }),
      navigate({
        id: 'w09-nav-duty', slot: SLOT.MENU, label: 'Call the duty office',
        opens: 'call-duty', after: 'verify',
      }),
    ],

    supportDesk: desk,
  }
}

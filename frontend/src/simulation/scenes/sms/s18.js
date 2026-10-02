import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, message, messageText, number, receivedAt, sender, sms, system,
} from './shared.js'

/**
 * S18 - Bank Header Thread Hijack (IMMERSIVE-013) - the right thread, the wrong message.
 *
 * Every earlier SMS scene that impersonated a bank or a carrier did it from somewhere else: a mobile
 * number (S01), a promotional header (S12), an unsaved number beside the carrier's real thread (S10).
 * S18 is the one where the text arrives **inside the bank's own registered thread**, under six months
 * of genuine alerts, with the same sender line on top. The phone files messages by the name they
 * arrive with; it cannot tell the learner who really sent one.
 *
 * So the evidence is not the sender. It is what the text says beside what the bank's texts always
 * say: every genuine alert above it names the account, the amount and a reference, and ends by
 * telling the learner to use the app or the number on the card. This one names nothing, carries a
 * ten-digit number and a ten-minute clock.
 *
 * Two SMS-and-phone things carry the branch. Tapping the number raises the phone's own **call
 * confirmation** - calling is the cheaper mistake, taken there. And when the ten minutes run, the
 * phone **rings**: the same desk calling from a mobile, asking for the card number, the PIN and "the
 * code we are sending now" - while, above the call, a genuine one-time code arrives from the real
 * bank for a payee the learner never added. Reading it out is the release. Hanging up is the safe
 * branch, on the call itself.
 *
 * Fictional throughout: Training Bank, `AX-TRBANK`, account xx6621, SR TRADERS and every number
 * describe nothing real. No call is placed or answered; captions are text.
 */
export function buildS18(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const at = receivedAt(scenario) ?? '11:41'
  const header = 'AX-TRBANK'
  const label = senderInfo.display_name ?? 'SECURITY HOLD'
  const caller = senderInfo.identifier ?? '+91 00000 53944'
  const callback = messageText(scenario).match(/\b(\d{5} \d{5})\b/)?.[1] ?? '00000 41818'
  const cardLine = '+91 00000 22110'
  const account = 'xx6621'
  const text = `${label}: ${messageText(scenario)}`

  return {
    scenarioId: 'S18',
    platform: 'sms',
    notify: { sender: header },
    messageSender: { display_name: header, identifier: header },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'transactions', label: 'Transactions', heading: 'Transactions' },
        {
          id: 'personal', label: 'Personal', heading: 'Personal', count: 1,
          rows: [
            {
              id: 's18-pe-1', from: 'Farah', time: '10:12', inert: true,
              preview: 'Lunch at 1? The usual place.',
            },
          ],
        },
        {
          id: 'offers', label: 'Offers', heading: 'Offers',
          rows: [
            {
              id: 's18-of-1', from: 'AD-MEALHB', time: 'Yesterday', inert: true,
              preview: 'Flat 20% off your next order this weekend.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's18-row', from: header, time: at, unread: true,
          preview: text,
        },
        {
          id: 's18-bg-1', from: 'VM-NOVCEL', time: '15 Sep', inert: true,
          preview: 'Your mobile bill of INR 399 is paid. Thank you.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Business sender ID · Training Bank',
      detailsTo: 'details',
    },

    beats: [
      day('s18-day-1', '12 September'),
      message('s18-old-1', {
        text: `INR 1,250.00 debited from a/c ${account} on 12-Sep to MEAL HUB. Ref 424510. Avl bal INR 42,310. `
          + 'Not you? Use the Training Bank app or call the number on your card. We never ask for your PIN or OTP.',
        time: '13:10', via: 'SIM 1',
      }),
      day('s18-day-2', '18 September'),
      message('s18-old-2', {
        text: `INR 5,000.00 credited to a/c ${account} on 18-Sep. Ref 427781. Avl bal INR 46,160. -Training Bank`,
        time: '10:02', via: 'SIM 1',
      }),
      day('s18-day-3', 'Today'),
      message('s18-msg', { text, time: at, via: 'SIM 1' }),
      number('s18-number', { number: callback, caption: 'Number in the text' }),
      number('s18-ring', {
        number: caller, caption: 'Incoming call · not in your contacts', since: 'branch', until: 'verify',
      }),
      message('s18-otp', {
        text: `739104 is the OTP to add payee SR TRADERS to a/c ${account}. Do not share it with anyone, `
          + 'including bank staff. Not you? Use the app. -Training Bank',
        time: '11:49', via: 'SIM 1', since: 'branch',
      }),
      system('s18-ended', `Call ended · ${caller}`, { since: 'verify' }),
    ],

    surfaces: {
      /** Conversation details - the header is the bank's. That settles nothing. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              {
                type: 'identity', initials: 'TB', name: header,
                number: 'Business sender ID — cannot receive replies', note: 'Registered to Training Bank',
              },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'In this thread since', value: 'March 2026' },
                  { label: 'Messages', value: '43' },
                  { label: 'Filed under', value: 'Transactions' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered business sender ID', result: 'header' },
                  { label: 'How this thread is grouped', value: 'By the sender name a text arrives with', result: 'by name' },
                  { label: 'Number to call, in the bank’s alerts', value: 'Never — the app, or the number on your card', result: 'none' },
                  { label: 'Number to call, in today’s text', value: callback, result: 'in text' },
                ],
              },
              {
                type: 'note',
                text: 'Messages puts a text in this thread because of the name it arrives with. It cannot '
                  + 'show which network sent it.',
              },
            ],
            links: [
              { id: 's18-link-compare', label: 'Today’s message beside the last alert', to: 'compare' },
            ],
          },
          compare: {
            title: 'Message details',
            blocks: [
              {
                type: 'items',
                heading: 'Same sender line, different message',
                items: [
                  { label: '18 Sep, 10:02', meta: header, value: `Account ${account} · amount · Ref 427781 · no number to call` },
                  { label: '12 Sep, 13:10', meta: header, value: `Account ${account} · amount · Ref 424510 · “call the number on your card”` },
                  { label: `Today, ${at}`, meta: header, value: 'No account · no amount · no reference · a ten-digit number · ten minutes' },
                ],
              },
              {
                type: 'note',
                text: 'All three arrived on SIM 1 under the same header. Only what they say differs.',
              },
            ],
          },
        },
      }),

      /** The phone's own call confirmation, raised by tapping the number. */
      dial: {
        kind: SURFACE.INSTALLER,
        title: 'Phone',
        home: 'confirm',
        closeLabel: 'Close the dialog',
        inertNote: 'Simulated dialer. No call can be placed from this screen.',
        pages: {
          confirm: {
            style: 'dialog',
            title: `Call ${callback}?`,
            text: 'The number was tapped in a text message. The phone app will dial it.',
            rows: [
              { label: 'Number', value: callback },
              { label: 'Saved as', value: 'Not in your contacts' },
              { label: 'On the back of your card', value: cardLine },
            ],
          },
        },
      },

      /** Where the number in the text goes. */
      desk: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Security desk',
        number: callback,
        script: [
          { at: 0, speaker: 'them', text: 'Security desk, thank you for calling back in time.' },
          { at: 5, speaker: 'them', text: 'To stop the transfer I need to confirm it is you: your card number and PIN.' },
          { at: 12, speaker: 'them', text: 'You will get a code from Training Bank in a moment. Read it to me as soon as it comes.' },
        ],
      },

      /** The phone rings when the ten minutes are up. The decision is on this call. */
      incoming: {
        kind: SURFACE.CALL,
        title: 'Incoming call',
        caller: caller,
        number: 'Mobile · not in your contacts',
        backLabel: 'Back to the conversation',
        endCallScored: true,
        script: [
          { at: 0, speaker: 'them', text: 'Training Bank security. You did not call us back, so I am calling you.' },
          { at: 5, speaker: 'them', text: 'A transfer of INR 49,500 is waiting to leave your account. I can hold it now.' },
          { at: 11, speaker: 'them', text: 'I need the card number and PIN to confirm it is you.' },
          { at: 17, speaker: 'them', text: 'A code has just come from Training Bank. Read it to me - it cancels the transfer.' },
        ],
      },

      /** The learner's own banking app. */
      bankapp: {
        kind: SURFACE.APP,
        appName: 'Training Bank',
        appTagline: `Savings ${account}`,
        hero: {
          label: 'Account status',
          value: 'Active — no hold',
          caption: 'No transfer is waiting and no freeze is scheduled. One request is open: add payee '
            + 'SR TRADERS, started 11:49 and waiting for its OTP.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's18-app-requests',
            heading: 'Open requests',
            rows: [
              { label: 'Add payee', value: 'SR TRADERS — not started by you in this app' },
              { label: 'Needs', value: 'The OTP sent at 11:49' },
              { label: 'You can', value: 'Decline it here, or call the number on your card' },
            ],
          },
          {
            id: 's18-app-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Alerts', value: `From ${header}, with your account, amount and reference` },
              { label: 'To reach us', value: `This app, or ${cardLine} on your card` },
              { label: 'We never', value: 'Send a number to call, or ask for a PIN or OTP' },
            ],
          },
        ],
        tabs: [
          { label: 'Accounts', icon: 'home' },
          { label: 'Payments', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The bank, on the number printed on the card. */
      cardcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Training Bank (number on your card)',
        number: cardLine,
        script: [
          { at: 0, speaker: 'them', text: 'Training Bank card services.' },
          { at: 3, speaker: 'them', text: `There is no hold on ${account} and no transfer waiting.` },
          { at: 9, speaker: 'them', text: 'Someone has started adding a payee. I have declined it. Do not share the code.' },
          { at: 16, speaker: 'them', text: 'We did not send that text. Report it as junk; the header can be borrowed.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's18-c01', slot: SLOT.INLINE, label: 'Open the conversation' }),
          action({ id: 's18-c02', slot: SLOT.INLINE, label: `Call ${callback} from the list` }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's18-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Who this thread is with, and how it is grouped',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's18-c04', slot: SLOT.INLINE, anchor: 's18-old-2',
            label: 'Compare with the earlier alerts', hint: 'What each alert says',
            targetId: threadAsset, opens: 'details',
          }),
          action({ id: 's18-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's18-c06', slot: SLOT.SURFACE, on: 'dial', page: 'confirm',
            label: 'Call', targetId: callAsset, opens: 'desk',
          }),
          action({
            id: 's18-c07', slot: SLOT.SURFACE, on: 'incoming',
            label: 'Read out the card number, PIN and the code', closes: true,
          }),
          action({
            id: 's18-c08', slot: SLOT.SURFACE, on: 'incoming',
            // Found by hand-play: opening the bank app from here left the call underneath it, so Back
            // walked into a call that rang again. Hanging up closes the call; the app is in the menu.
            label: 'Hang up', closes: true,
          }),
          action({
            id: 's18-c09', slot: SLOT.MENU, label: 'Leave the text and open the bank app yourself',
            opens: 'bankapp',
          }),
          navigate({
            id: 's18-nav-dial', slot: SLOT.INLINE, anchor: 's18-number',
            label: `Call ${callback}`, opens: 'dial',
          }),
          navigate({
            id: 's18-nav-answer', slot: SLOT.INLINE, anchor: 's18-ring',
            label: 'Answer', opens: 'incoming',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's18-c10', slot: SLOT.MENU, label: 'Open your bank app and check holds and requests',
            hint: 'Account status and open requests', opens: 'bankapp',
          }),
          action({
            id: 's18-c11', slot: SLOT.MENU, label: 'Call the number printed on your card', opens: 'cardcall',
          }),
          action({
            id: 's18-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's18-c13', slot: SLOT.MENU, label: `Call ${callback} back and ask them to prove it` }),
          action({ id: 's18-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's18-c15', slot: SLOT.MENU, label: `Block ${callback}` }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's18-c16', slot: SLOT.INLINE, label: 'Report the text as junk and decline the payee in the app' }),
          action({ id: 's18-c17', slot: SLOT.INLINE, label: 'Call the number before the ten minutes are up' }),
          action({ id: 's18-c18', slot: SLOT.MENU, label: `Block ${caller} and report` }),
          action({ id: 's18-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's18-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's18-nav-bankapp', slot: SLOT.MENU, label: 'Open the bank app', opens: 'bankapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's18-dir-card',
        name: 'Training Bank — card services',
        identifier: cardLine,
        provenance: 'printed on your card',
        role: 'Confirms holds, transfers and payee requests on your account.',
      },
    ],
  }
}

import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S11 - Expected Clinic Reminder (IMMERSIVE-012) - the legitimate one, and the right answer is
 * a reply.
 *
 * On 26 August the learner booked a review with Dr S. Rao in the clinic portal, and the booking
 * page told them reminders would come from the clinic's reminder line, which they saved. Today the
 * reminder has arrived on that saved number, in the same conversation as the booking
 * confirmation, and asks for one character: 1 to confirm, 2 to reschedule.
 *
 * Every earlier SMS scene either had nothing to answer (S03, S07) or made answering the mistake
 * (S01-S10). S11 is the first in which **sending a text is the correct use of the channel** - so
 * the lesson is not "do not reply", it is "reply with what was asked for and nothing else". The
 * costed mistake is the one a person who cares about their health actually makes: a reply that
 * adds how they have been feeling, their date of birth and their member number, to a reminder
 * line that asked for none of it. Deleting the thread and blocking the line is the other, cheaper
 * mistake - the reminder was real.
 *
 * The evidence is SMS-native and sits in three places: the contact the learner saved themselves,
 * the confirmation two messages up with the same reference and slot, and the portal that lists
 * both the booking and the reminder number.
 *
 * Fictional throughout: Training Clinic, Dr S. Rao, the booking, the member number and every
 * number describe nothing real. No health detail exists anywhere in the scene except in the one
 * reply the learner should not send, and even that is an authored chip - nothing is typed.
 */
export function buildS11(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const clinic = senderInfo.display_name ?? 'Training Clinic'
  const line = senderInfo.identifier ?? '+91 00000 35413'
  const reception = '+91 00000 35400'
  const booking = 'TC-0903-118'
  const doctor = 'Dr S. Rao'

  return {
    scenarioId: 'S11',
    platform: 'sms',
    notify: { sender: clinic },
    messageSender: { display_name: clinic, identifier: line },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 3 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's11-tx-1', from: 'BK-UNIONX', time: '26 Aug', inert: true,
              preview: 'INR 300 debited from a/c xx4417 to TRAINING CLINIC. Not you? Call the number on your card.',
            },
            {
              id: 's11-tx-2', from: 'VM-TRNGMB', time: '24 Aug', inert: true,
              preview: 'Your mobile bill of INR 399 is paid. Thank you.',
            },
          ],
        },
        {
          id: 'spam', label: 'Spam', heading: 'Spam and blocked',
          rows: [
            {
              id: 's11-spam-1', from: '+91 00000 58821', time: '29 Aug', inert: true,
              preview: 'FULL BODY CHECKUP only INR 499!! 72 tests, home collection. Book now.',
            },
          ],
        },
      ],
      rows: [
        {
          id: 's11-row', from: clinic, time: '17:37', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's11-bg-1', from: 'Amma', time: '16:10', inert: true,
          preview: 'Did you book the doctor? Tell me what she says.',
        },
        {
          id: 's11-bg-2', from: 'Vikram', time: '12:02', inert: true,
          preview: 'Running at 6 tomorrow if your back is up to it.',
        },
      ],
    },

    conversation: {
      title: clinic,
      subtitle: `${line} · saved contact`,
      detailsTo: 'details',
    },

    beats: [
      day('s11-day-1', '26 August'),
      message('s11-book', {
        text: `${clinic}: booking ${booking} confirmed. ${doctor}, 03 Sep 09:20, Block B, ground floor. `
          + 'We will send a reminder two days before. Reply to reminders with 1 or 2 only.',
        time: '11:42', via: 'SIM 1',
      }),
      day('s11-day-2', 'Today'),
      message('s11-msg', { text: messageText(scenario), time: '17:37', via: 'SIM 1' }),
      message('s11-msg2', {
        text: 'Please bring any earlier reports with you. Hope you are keeping well.',
        time: '17:37', via: 'SIM 1',
      }),
      system('s11-sys', 'Replies to this number are sent as ordinary text messages.'),
    ],

    surfaces: {
      /** Conversation details - a contact the learner saved, and what the booking page said. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: 'TC', name: clinic, number: line, note: 'Saved to your contacts on 26 Aug' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'Started', value: '26 August, 11:42' },
                  { label: 'Messages', value: '3 — a booking confirmation and today’s reminder' },
                  { label: 'Reference in the thread', value: booking },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit number that accepts replies', result: 'mobile' },
                  { label: 'In your contacts', value: `Yes — saved as “${clinic}” from the booking page`, result: 'saved' },
                  { label: 'Listed in the clinic portal', value: 'Yes, as the reminder line', result: 'listed' },
                  { label: 'Replies asked for', value: '1 or 2', result: 'limited' },
                ],
              },
              {
                type: 'note',
                text: 'A reply goes to this number as an ordinary text. Whatever it says is read by '
                  + 'whoever handles the reminder line.',
              },
            ],
            links: [
              { id: 's11-link-booking', label: 'Show the booking confirmation', to: 'booking' },
            ],
          },
          booking: {
            title: 'Booking confirmation',
            blocks: [
              {
                type: 'items',
                heading: '26 August, 11:42',
                items: [
                  {
                    label: clinic, meta: '11:42',
                    value: `Booking ${booking} confirmed. ${doctor}, 03 Sep 09:20, Block B.`,
                  },
                ],
              },
              {
                type: 'rows',
                heading: 'Compared with today',
                rows: [
                  { label: 'Date and time', value: '03 Sep 09:20 — the same' },
                  { label: 'Number', value: `${line} — the same` },
                  { label: 'Asks for', value: 'A reply of 1 or 2 — as the booking said it would' },
                ],
              },
            ],
          },
        },
      }),

      /** The learner's own clinic portal - the booking, and how the clinic uses text messages. */
      clinicapp: {
        kind: SURFACE.APP,
        appName: 'Clinic Portal',
        appTagline: `${clinic} · patient bookings`,
        hero: {
          label: `Booking ${booking}`,
          value: '03 Sep, 09:20 — awaiting your confirmation',
          caption: `${doctor} · Block B, ground floor. Booked by you on 26 August.`,
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's11-app-booking',
            heading: 'This booking',
            rows: [
              { label: 'Reference', value: booking },
              { label: 'Booked', value: '26 August, from this account' },
              { label: 'Fee', value: 'INR 300, paid' },
              { label: 'Confirm', value: 'Reply 1 to the reminder, or press Confirm here' },
            ],
          },
          {
            id: 's11-app-texts',
            heading: 'How we use text messages',
            rows: [
              { label: 'Reminder line', value: line },
              { label: 'Replies we read', value: '1 to confirm, 2 to reschedule' },
              { label: 'Never sent by text', value: 'Symptoms, results, date of birth or member number' },
            ],
            note: 'Anything about your health is discussed at the visit, not over text messages.',
          },
        ],
        tabs: [
          { label: 'Bookings', icon: 'home' },
          { label: 'Reports', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The phone's own calendar - the learner put the visit there themselves. */
      calendar: {
        kind: SURFACE.APP,
        appName: 'Calendar',
        appTagline: 'Wednesday, 3 September',
        hero: {
          label: '09:20 – 09:50',
          value: `Review, ${doctor}`,
          caption: `${clinic}, Block B · added by you on 26 August`,
          chips: ['Your calendar'],
        },
        sections: [
          {
            id: 's11-cal-day',
            heading: 'That morning',
            rows: [
              { label: '08:00', value: 'Nothing booked' },
              { label: '09:20', value: `Review, ${doctor}` },
              { label: '11:00', value: 'Team call' },
            ],
            note: 'Nothing else clashes with the visit.',
          },
        ],
        tabs: [
          { label: 'Day', icon: 'home' },
          { label: 'Month', icon: 'history' },
        ],
      },

      /** Reception, on the number printed on the appointment card. */
      receptioncall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${clinic} — reception (appointment card)`,
        number: reception,
        script: [
          { at: 0, speaker: 'them', text: `${clinic}, reception.` },
          { at: 3, speaker: 'them', text: `Yes, ${booking}, Wednesday at 09:20 with ${doctor}. The reminder went out from our reminder line.` },
          { at: 10, speaker: 'them', text: 'Just reply 1 and you are confirmed. Please do not send anything about how you are feeling by text.' },
          { at: 17, speaker: 'them', text: 'The doctor will go through all of that with you on the day.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's11-c01', slot: SLOT.INLINE, label: 'Open the reminder' }),
          action({ id: 's11-c02', slot: SLOT.INLINE, label: 'Reply 1 from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's11-c03', slot: SLOT.INLINE, anchor: 'header',
            label: clinic, hint: 'Who sent it, and how you have them saved',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's11-c04', slot: SLOT.MENU, label: 'Compare it with the booking confirmation',
            hint: '26 August, in this thread', targetId: threadAsset, opens: 'details',
          }),
          action({ id: 's11-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({ id: 's11-c06', slot: SLOT.COMPOSER, label: 'Reply 1 to confirm', echo: '1' }),
          action({ id: 's11-c07', slot: SLOT.COMPOSER, label: 'Reply 2 to reschedule', echo: '2' }),
          action({
            id: 's11-c08', slot: SLOT.COMPOSER, label: 'Reply 1 and tell them how you have been',
            echo: '1. The pain in my lower back is worse since last week and the new tablets make '
              + 'me dizzy. DOB 14-03-1994, member no. TC-55102.',
          }),
          action({
            id: 's11-c09', slot: SLOT.MENU, label: 'Delete the conversation and block this number',
          }),
          navigate({ id: 's11-nav-portal', slot: SLOT.MENU, label: 'Open the clinic portal', opens: 'clinicapp' }),
          navigate({ id: 's11-nav-calendar', slot: SLOT.MENU, label: 'Open your calendar', opens: 'calendar' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's11-c10', slot: SLOT.MENU, label: 'Open the clinic portal and compare the booking',
            hint: 'Reference, slot and reminder line', opens: 'clinicapp',
          }),
          action({
            id: 's11-c11', slot: SLOT.MENU, label: 'Call reception on the number on your appointment card',
            opens: 'receptioncall',
          }),
          action({
            id: 's11-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's11-c13', slot: SLOT.MENU, label: 'Text the reminder line and ask if it is really them' }),
          action({ id: 's11-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's11-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's11-c16', slot: SLOT.INLINE, label: 'Keep the thread and go on Wednesday' }),
          action({ id: 's11-c17', slot: SLOT.MENU, label: 'Keep the reminder and set an alarm for 08:30' }),
          action({ id: 's11-c18', slot: SLOT.INLINE, label: 'Report the clinic’s messages as junk' }),
          action({ id: 's11-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's11-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's11-nav-portal2', slot: SLOT.MENU, label: 'Open the clinic portal', opens: 'clinicapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's11-dir-clinic',
        name: `${clinic} — reception`,
        identifier: reception,
        provenance: 'printed on your appointment card',
        role: 'Confirms bookings and reminders; health matters are discussed at the visit.',
      },
    ],
  }
}

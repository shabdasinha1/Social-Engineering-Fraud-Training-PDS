import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, me, sender, system,
  template, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W11 - Expected Welfare Appointment. The one genuine item in this batch.
 *
 * There is no adversary here, so there is no ATT&CK technique, and the research record
 * says so rather than reaching for one. What the scenario tests is the discrimination the
 * client's own scoring prices: reporting a real office costs four points, and so does the
 * mistake this scene is built around.
 *
 * **The distinct interaction is the cross-app match.** W07's evidence was the learner's own
 * request, visible three messages above the file in the same thread. Here the request was
 * made somewhere else - in the Welfare Portal app, on Monday - and the only way to connect
 * the two is to leave WhatsApp and look: the reference, the slot and the sending number in
 * the portal either match the business message or they do not. They do.
 *
 * The message is deliberately built to make a cautious learner hesitate. "Reply C to
 * confirm" is exactly the shape a warning poster would tell you to distrust, and the
 * confirmation arrives as a business template with buttons, not in the office's own words.
 * Every one of those features is also how genuine appointment systems work.
 *
 * **The trap is a verification that is not one.** A learner who wants to double-check can
 * open the browser and search for the office's number - and the first result is a
 * sponsored "helpline" that is not the office. Calling it is the client's "unsafe external
 * action": the genuine item was fine, and the learner took it somewhere that was not. The
 * check that actually settles it is the app they already have.
 */
export function buildW11(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const reference = 'WLF-2609-0317'
  const priorReference = 'WLF-2511-0142'
  const slot = 'Thursday 17 Sep, 10:30'
  const helpline = '+91 00000 11947'

  return {
    scenarioId: 'W11',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      business: true,
      presence: 'Business account',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w11-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 1,
        },
        {
          id: 'w11-bg-1',
          title: 'School Parents 3B',
          group: true,
          preview: 'Rina: fee receipt format is on the school app',
          time: '11:48',
          muted: true,
          inert: true,
        },
        {
          id: 'w11-bg-2',
          title: 'Ma',
          preview: 'call me after lunch',
          time: '10:02',
          inert: true,
        },
        {
          id: 'w11-bg-3',
          title: 'Kiran',
          preview: 'You: sending it tonight',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w11-e2e'),
      system('w11-business', `${who.display_name} is a business account.`),

      /** Last year's appointment, in exactly the same shape. This is the prior reference. */
      day('w11-day-old', 'LAST NOVEMBER'),
      template('w11-prior', {
        header: `Appointment ${priorReference}`,
        text: 'Your requested appointment is confirmed for 11:00 on 18 Nov. Reply C to confirm.',
        footer: `${who.display_name} - automated message`,
        buttons: ['Confirm', 'Reschedule'],
        time: '09:12',
        priorChat: true,
      }),
      me('w11-prior-reply', 'C', '09:40', { priorChat: true }),
      them('w11-prior-ack',
        `Thank you. Appointment ${priorReference} is confirmed. Please bring your welfare card `
        + 'to the Block 2 counter.', '09:40', { priorChat: true }),

      /** Monday: the portal booking, acknowledged by the same account. */
      day('w11-day-monday', 'MONDAY'),
      them('w11-received',
        `We have received your request ${reference} from the Welfare Portal. A time will be `
        + 'confirmed here within five working days.', '19:14'),

      day('w11-day-today', 'TODAY'),
      template('w11-confirm', {
        header: `Appointment ${reference} - ${slot}`,
        text: headline(scenario),
        footer: `${who.display_name} - automated message`,
        buttons: ['Confirm', 'Reschedule'],
        time: headlineTime(scenario),
      }),

      them('w11-reminder',
        'Please carry your welfare card and arrive ten minutes early. Documents are checked at '
        + 'the counter.', '12:06', { since: 'verify' }),

      {
        kind: 'system', id: 'w11-after-call', tone: 'alert',
        text: 'The call was answered by a number that is not the Welfare Office. It asked for '
          + 'your welfare card number and a payment.',
        since: 'verify', afterConsequence: 'simulated_call',
      },
    ],

    surfaces: {
      /** The business profile. It has what a business profile has, and asks nothing. */
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Business info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: true,
        statusLine: 'Saved in your contacts.',
        badges: ['Business account'],
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'Business details',
                rows: [
                  { label: 'Category', value: 'Public service' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: who.display_name },
                  { label: 'Saved', value: 'Last November' },
                  { label: 'Address', value: 'Block 2, Station Road' },
                  { label: 'Hours', value: 'Mon to Fri, 09:30 to 16:30' },
                ],
                note: 'You saved this number from the Welfare Portal contact page when you booked '
                  + 'last year.',
              },
            ],
          },
          {
            id: 'history',
            label: 'This chat',
            sections: [
              {
                id: 'history-rows', heading: 'What this chat has been used for',
                rows: [
                  { label: 'Messages', value: 'Appointment receipts and confirmations' },
                  { label: 'Previous appointment', value: `${priorReference}, 18 Nov` },
                  { label: 'Links sent', value: 'None' },
                  { label: 'Documents or payment asked for', value: 'Never' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 0,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                empty: 'You are not in any group with this number.',
                items: [],
                note: 'Business accounts are not usually members of your groups.',
              },
            ],
          },
        ],
      },

      /**
       * The app the booking was actually made in. Opened from the phone, not from the
       * message - which is what makes it a check the message cannot influence.
       */
      'portal-app': {
        kind: SURFACE.APP,
        appName: 'Welfare Portal',
        appTagline: 'My appointments',
        hero: {
          label: 'Upcoming',
          value: slot,
          caption: `${reference} - Education grant counselling - Block 2 counter`,
          chips: ['Requested by you', 'Waiting for your confirmation'],
        },
        sections: [
          {
            id: 'request', heading: 'Your request',
            rows: [
              { label: 'Reference', value: reference },
              { label: 'Requested', value: 'Monday 7 Sep at 19:12, from this phone' },
              { label: 'Preferred time', value: 'Any morning next week' },
              { label: 'Time allotted', value: '10:30, Thursday 17 Sep' },
            ],
          },
          {
            id: 'how', heading: 'How you will be contacted',
            rows: [
              { label: 'Confirmation', value: `WhatsApp, from ${who.display_name} ${who.identifier}` },
              { label: 'What you send back', value: 'A one-letter reply, or use Reschedule here' },
              { label: 'Documents', value: 'Checked at the counter on the day' },
            ],
            note: 'The office never asks for card numbers, one-time codes or fees over chat or '
              + 'phone.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Bookings', icon: 'history' },
          { label: 'Grants', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /**
       * The web search a careful person might run instead. The first result is paid for,
       * and is not the office. Reaching this page is navigation; calling is the decision.
       */
      search: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'results',
        pages: {
          results: {
            url: 'https://search.training.example/?q=welfare+office+appointment+confirm',
            host: 'search.training.example',
            title: 'Search results',
            blocks: [
              { type: 'search', query: 'welfare office appointment confirm number' },
              {
                type: 'listing',
                badge: 'Sponsored',
                host: 'welfare-helpdesk24.training.example',
                title: 'Welfare Appointment Helpline - 24x7 Confirmation',
                text: 'Confirm, change or cancel any welfare appointment by phone. Instant '
                  + 'service, all offices.',
                phone: helpline,
              },
              {
                type: 'listing',
                host: 'portal.welfare.training.example',
                title: 'Welfare Portal - My appointments',
                text: 'Sign in to see and manage the appointments you have requested.',
              },
              {
                type: 'listing',
                host: 'forum.training.example',
                title: 'Does the welfare office really send "Reply C" messages?',
                text: 'Got one last year from the saved office number, the reference matched my '
                  + 'booking...',
              },
            ],
          },
        },
      },

      'call-helpline': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Welfare Appointment Helpline',
        number: helpline,
        script: [
          { at: 0, speaker: 'them', text: 'Welfare helpline, good morning. Tell me your appointment reference.' },
          { at: 5, speaker: 'them', text: 'Yes, I can see it. To confirm by phone there is a small processing charge of INR 99.' },
          { at: 11, speaker: 'them', text: 'I am sending you a payment link. Also tell me your welfare card number for verification.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w11-dir-welfare',
        name: `${who.display_name} - appointments`,
        identifier: who.identifier,
        provenance: 'local approved directory',
        role: 'Sends appointment confirmations by WhatsApp and asks for a one-letter reply. '
          + 'Documents are checked at the counter.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w11-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w11-c02', slot: SLOT.INLINE,
            label: 'Reply C from the notification without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w11-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Business info',
            hint: 'The saved number, what this chat has been used for',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w11-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w11-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** The office's own buttons, on the office's own message. */
          action({
            id: 'w11-c06', slot: SLOT.INLINE,
            anchor: 'w11-confirm', label: 'Confirm',
          }),
          /** Rescheduling is done in the portal, so the button walks there - locally. */
          navigate({
            id: 'w11-branch-reschedule', slot: SLOT.INLINE, anchor: 'w11-confirm',
            label: 'Reschedule', opens: 'portal-app',
          }),
          action({
            id: 'w11-c07', slot: SLOT.MENU,
            label: 'Leave it unanswered and just turn up at 10:30',
          }),
          /** The untrusted channel: a paid search result, reached by the learner's own hand. */
          action({
            id: 'w11-c08', slot: SLOT.SURFACE,
            on: 'search', page: 'results', label: `Call ${helpline}`,
            opens: 'call-helpline',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w11-c09',
            slot: SLOT.MENU, label: 'Open the Welfare Portal app and find the booking',
            hint: 'The app you booked with, opened from your phone', opens: 'portal-app',
          }),
          action({
            id: 'w11-c10',
            slot: SLOT.MENU,
            label: `Check ${who.display_name} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w11-c11',
            slot: SLOT.MENU,
            label: 'Ask in this chat whether the message is genuine',
          }),
          action({
            id: 'w11-c12', slot: SLOT.MENU,
            label: `Report ${who.display_name}`,
          }),
          action({
            id: 'w11-c13', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w11-c14', slot: SLOT.INLINE,
            label: 'Report the business and close',
          }),
          action({
            id: 'w11-c15', slot: SLOT.INLINE,
            label: 'Confirm the appointment and keep the chat',
          }),
          action({
            id: 'w11-c16', slot: SLOT.MENU,
            label: 'Keep the chat and note the time',
          }),
          action({
            id: 'w11-c17', slot: SLOT.MENU,
            label: `Block ${who.display_name} and close`,
          }),
          action({
            id: 'w11-c18', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w11-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w11-nav-search', slot: SLOT.MENU, label: 'Search the web for the office number',
        opens: 'search', after: 'branch',
      }),
      navigate({
        id: 'w11-nav-portal', slot: SLOT.MENU, label: 'Welfare Portal app',
        opens: 'portal-app', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}

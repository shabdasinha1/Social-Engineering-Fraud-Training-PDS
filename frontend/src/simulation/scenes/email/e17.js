import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, button, directory, mail, sender, subjectLine, table,
} from './shared.js'

/**
 * E17 - Invoice Callback Trap (IMMERSIVE-008) - callback phishing, decided on the phone's dialer.
 *
 * A "Subscription Billing" renewal says INR 32,900 has been taken for a protection plan the learner
 * never bought, and that the charge can only be reversed by calling a cancellation desk within 30
 * minutes. The message is built the way callback lures are built to pass a mail filter: no link, no
 * attachment, only an order table and a phone number. The tells are what is missing - no order in
 * the learner's own mail, no charge in their own statement - and the recipients line, which is an
 * undisclosed bulk list.
 *
 * The Email-native move is the tappable phone number: tapping it is local and only raises the
 * phone's own "Call this number?" dialog, and the decision is taken there - Call or Cancel. Calling
 * connects to a scripted "cancellation desk" that immediately asks to install a remote-support app
 * and read out its code; that screen is shown as the consequence and nothing can be installed.
 * Replying to "dispute" it is the other risky route (it confirms a live mailbox to a bulk sender).
 * The checks are the learner's own card statement and their bank on the number printed on the card.
 * Fictional throughout: the plan, the order and every number describe nothing real.
 */
export function buildE17(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'subscriptionbillin@e17.training.example'
  const replyTo = 'renewals.helpdesk@e17-support.training.example'
  const number = '+91 00000 17340'
  const order = 'SB-77-4410'

  return {
    scenarioId: 'E17',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Subscription Billing' },
    messageSender: { display_name: senderInfo.display_name ?? 'Subscription Billing', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'receipts', label: 'Receipts', heading: 'Receipts',
          rows: [
            {
              id: 'e17-rc-1', from: 'Rail Bookings', subject: 'E-ticket for 03 Sep',
              preview: 'Booking confirmed, INR 1,240 paid by card.', time: '01 Sep', inert: true,
            },
            {
              id: 'e17-rc-2', from: 'Book Depot', subject: 'Your order has shipped',
              preview: 'Order BD-2210, INR 640.', time: '19 Aug', inert: true,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e17-row', from: 'Subscription Billing', subject: `Renewal receipt ${order}`,
          preview: subjectLine(scenario), time: '12:29', unread: true, tag: 'External',
        },
        {
          id: 'e17-bg-1', from: 'Mess Committee', subject: 'Guest night',
          preview: 'Names to the secretary by Friday.', time: '11:02', inert: true,
        },
        {
          id: 'e17-bg-2', from: 'Arjun', subject: 'Re: cricket on Sunday',
          preview: 'You: count me in', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `Renewal receipt ${order}`,
      fromName: 'Subscription Billing',
      time: '12:29',
      toLine: 'to undisclosed recipients',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      brand('e17-brand', { monogram: 'SB', name: 'Subscription Billing', tagline: 'Renewal receipt', color: '#1f4e79' }),
      body('e17-body', {
        greeting: 'Dear Customer,',
        paragraphs: [
          subjectLine(scenario),
          'Your annual ProSuite Total Protection plan (3 devices) has been renewed automatically and the '
          + 'amount below will be debited from the card on file.',
          'If you did not authorise this renewal, call our cancellation desk within 30 minutes. After that '
          + 'the charge cannot be reversed.',
        ],
        signature: ['Subscription Billing', 'Customer Accounts'],
        footer: 'This is an automated receipt. For cancellations call the desk below.',
      }),
      table('e17-order', {
        rows: [
          { label: 'Order', value: order },
          { label: 'Plan', value: 'ProSuite Total Protection · 1 year · 3 devices' },
          { label: 'Amount', value: 'INR 32,900' },
          { label: 'Paid by', value: 'Card on file' },
          { label: 'Status', value: 'Processed' },
        ],
      }),
      /** The number, laid out the way the mail app makes a phone number tappable. */
      button('e17-phone', { label: number, caption: 'Cancellation desk · open 24 hours' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Subscription Billing', address: fromAddress, note: 'No earlier mail from this sender' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Subscription Billing <${fromAddress}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: 'undisclosed-recipients' },
                  { label: 'Links', value: 'None — one phone number in the body' },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e17.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e17.training.example', result: 'pass' },
                  { label: 'Reply-To', value: 'e17-support.training.example', result: 'differs' },
                ],
              },
              { type: 'note', text: 'Passing checks show which domain sent the mail. They say nothing about whether you ever had an account there.' },
            ],
          },
        },
      }),

      /** A search of the learner's own mail for any earlier order. */
      search: mail({
        title: 'Search results',
        home: 'results',
        inertNote: 'Local search of this mailbox. Nothing is sent anywhere.',
        pages: {
          results: {
            title: 'Search: “ProSuite” OR “Subscription Billing”',
            blocks: [
              { type: 'items', heading: 'All folders', items: [], empty: 'No messages found other than today’s receipt.' },
              {
                type: 'items',
                heading: 'Recent receipts',
                items: [
                  { label: 'Rail Bookings', meta: '01 Sep', value: 'E-ticket, INR 1,240' },
                  { label: 'Book Depot', meta: '19 Aug', value: 'Order BD-2210, INR 640' },
                ],
              },
            ],
          },
        },
      }),

      /** The phone's own dial confirmation. Tapping the number only raises this dialog. */
      dial: {
        kind: SURFACE.INSTALLER,
        title: 'Phone',
        home: 'confirm',
        closeLabel: 'Close the dialog',
        inertNote: 'Simulated dialer. No call can be placed from this screen.',
        pages: {
          confirm: {
            style: 'dialog',
            title: `Call ${number}?`,
            text: 'The number was tapped in an email. The phone app will dial it.',
            rows: [
              { label: 'Number', value: number },
              { label: 'Saved as', value: 'Not in your contacts' },
            ],
          },
        },
      },

      /** Where the number leads: a scripted desk that goes straight to remote access. */
      support: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Cancellation desk',
        number,
        script: [
          { at: 0, speaker: 'them', text: 'Billing cancellations, this is Rohan. Can I have the order number?' },
          { at: 4, speaker: 'them', text: `Thank you. I can see the INR 32,900 on ${order}. The refund has to be processed on your device.` },
          { at: 9, speaker: 'them', text: 'Please install the SupportLink app and read me the six-digit code it shows.' },
          { at: 14, speaker: 'them', text: 'Please stay on the line. If the call drops the refund window closes.' },
        ],
        links: [{ id: 'e17-link-remote', label: 'SupportLink install screen', to: 'remote' }],
      },

      /** What the desk asks for. Shown only; nothing on it can be pressed. */
      remote: {
        kind: SURFACE.INSTALLER,
        title: 'Install',
        home: 'prompts',
        closeLabel: 'Close the install screen',
        inertNote: 'Simulated install screen. Nothing can be installed or granted from here.',
        pages: {
          prompts: {
            style: 'prompts',
            app: { name: 'SupportLink', monogram: 'SL', detail: 'Remote support · unknown developer' },
            text: 'The app asks for these before the desk can "process the refund":',
            prompts: [
              { title: 'Record or share everything on your screen', text: 'Screen capture' },
              { title: 'Control your device', text: 'Accessibility service' },
              { title: 'Read your text messages', text: 'Including bank one-time codes' },
            ],
            note: 'A six-digit session code would let the caller connect to this device.',
          },
        },
      },

      /** The learner's own card statement, opened from their own banking app. */
      statement: {
        kind: SURFACE.APP,
        appName: 'Banking',
        appTagline: 'Card statement · this month',
        hero: { label: 'Pending and posted', value: 'No renewal charge', caption: 'Nothing from Subscription Billing or ProSuite, pending or posted.' },
        sections: [
          {
            id: 'e17-stmt-rows',
            heading: 'Recent card activity',
            rows: [
              { label: '01 Sep', value: 'Rail Bookings · INR 1,240' },
              { label: '19 Aug', value: 'Book Depot · INR 640' },
              { label: 'Subscriptions', value: 'None on this card' },
            ],
            note: 'The bank shows every pending charge here the moment it is authorised.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Cards', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      bank: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Your bank (number on your card)',
        number: '+91 00000 30120',
        script: [
          { at: 0, speaker: 'them', text: 'Card services.' },
          { at: 3, speaker: 'them', text: 'There is no charge of 32,900 pending or posted on your card, and no subscription.' },
          { at: 8, speaker: 'them', text: 'Don’t call numbers from that email, and never install an app for someone who calls about a refund.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e17-c01', slot: SLOT.INLINE, label: 'Open the renewal receipt' }),
          action({ id: 'e17-c02', slot: SLOT.INLINE, label: 'Reply from the list to dispute it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e17-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Subscription Billing', hint: 'Sender, Reply-To and recipients',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e17-c04', slot: SLOT.MENU, label: 'Search your mail for an earlier order',
            hint: 'Look for ProSuite or Subscription Billing', opens: 'search',
          }),
          action({ id: 'e17-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e17-c06', slot: SLOT.SURFACE, on: 'dial',
            label: 'Call', targetId: callAsset, opens: 'support',
          }),
          action({ id: 'e17-c07', slot: SLOT.SURFACE, on: 'dial', label: 'Cancel', closes: true }),
          action({
            id: 'e17-c08', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: replyTo },
            label: 'Reply that you never ordered it',
            echo: 'I did not order this plan. Please cancel it and refund me.',
          }),
          action({ id: 'e17-c09', slot: SLOT.MENU, label: 'Close the receipt without calling' }),
          navigate({ id: 'e17-nav-phone', slot: SLOT.INLINE, anchor: 'e17-phone', label: `Call ${number}`, opens: 'dial' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e17-c10', slot: SLOT.MENU, label: 'Check your card statement in your banking app',
            hint: 'Look for the charge yourself', opens: 'statement',
          }),
          action({ id: 'e17-c11', slot: SLOT.MENU, label: 'Call your bank on the number on your card', opens: 'bank' }),
          action({
            id: 'e17-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e17-c13', slot: SLOT.MENU, label: 'Ask the cancellation desk in the email to confirm' }),
          action({ id: 'e17-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e17-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e17-c16', slot: SLOT.INLINE, label: 'Report it and leave the number uncalled' }),
          action({ id: 'e17-c17', slot: SLOT.INLINE, label: 'Call to cancel before the deadline' }),
          action({ id: 'e17-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e17-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e17-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e17-nav-search', slot: SLOT.MENU, label: 'Search your mail', opens: 'search', after: 'inspect' }),
      navigate({ id: 'e17-nav-statement', slot: SLOT.MENU, label: 'Open your card statement', opens: 'statement', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e17-dir-bank',
        name: 'Your bank — card services',
        identifier: '+91 00000 30120',
        provenance: 'printed on your card',
        role: 'Confirms card charges and subscriptions; the number is the one on the back of your card.',
      },
    ],
  }
}

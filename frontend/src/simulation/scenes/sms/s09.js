import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, day, directory, link, message, messageText, sender, sms,
} from './shared.js'

/**
 * S09 - Wrong Number Becomes an Investment Pitch (IMMERSIVE-011) - six days in the thread.
 *
 * "Sorry, is this Rohan?" arrived on Monday morning. The learner answered it - politely, once - and
 * that reply is still in the thread, in blue, where they can read it. On Wednesday there was small
 * talk. Today, on day six, there is a desk with a trial balance on it and an analyst with a
 * guaranteed trade.
 *
 * This is the first SMS scene in the product whose evidence is **the learner's own side of the
 * conversation**. Nothing about the number is wrong: it is a plain mobile, it has never lied about
 * who it is, and the only thing that has changed in six days is what it wants. The details screen
 * counts the turns and says who started; the six-day page lays them out; and the register app,
 * which the learner opens themselves, has no intermediary of that name.
 *
 * The two costed releases are deliberately in two different places. The deposit is on the phone's
 * own payment sheet, raised from the desk's Deposit button and reachable from the menu, and it
 * pays a **personal account**, not the platform. The account details go the other way - out of the
 * composer, in a text, because that is how this ends in real life.
 *
 * Fictional throughout: Meera, ApexQuant, the trial balance, the register and every number, host
 * and account describe nothing real; no money moves and what is typed stays on its own screen.
 */
export function buildS09(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 76798'
  const shortLink = 'apexquant.training.example'
  const target = page?.display_target ?? 'https://s09.training.example/desk'
  const registerLine = '+91 00000 39204'

  return {
    scenarioId: 'S09',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 2 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's09-tx-1', from: 'BK-UNIONX', time: '10:02', inert: true,
              preview: 'Salary credit INR 71,400 to a/c xx4417. Available balance updated.',
            },
            {
              id: 's09-tx-2', from: 'VM-TRNGMB', time: 'Monday', inert: true,
              preview: 'Your mobile bill of INR 399 is paid. Thank you.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's09-row', from, time: '15:04', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's09-bg-1', from: 'Anjali', time: '13:15', inert: true,
          preview: 'Dinner at eight? I will book the usual place.',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'You do not have this number saved. Messages from unknown senders are not checked.',
    },

    beats: [
      day('s09-day-1', 'Monday'),
      message('s09-d1-them', {
        text: 'Sorry, is this Rohan? This is Meera — we met at the logistics conference in March.',
        time: '09:39', via: 'SIM 1',
      }),
      message('s09-d1-me', { text: 'Wrong number, I am afraid. No Rohan here.', from: 'me', time: '09:52' }),
      message('s09-d1-them2', {
        text: 'Oh dear, my apologies. Thank you for writing back — most people do not. Have a good week.',
        time: '09:55',
      }),
      day('s09-day-3', 'Wednesday'),
      message('s09-d3-them', {
        text: 'Hope you do not mind me writing again. You were kind about the mix-up. How is the week going?',
        time: '20:11',
      }),
      message('s09-d3-me', { text: 'All fine, thanks. Busy as usual.', from: 'me', time: '20:40' }),
      message('s09-d3-them2', {
        text: 'I know that feeling. I only work mornings now — the afternoons take care of themselves.',
        time: '20:44',
      }),
      day('s09-day-6', 'Today'),
      message('s09-d6-them', {
        text: 'You seem kind, so I will say it plainly: my analyst has a guaranteed trade tonight. '
          + 'I have taken 4.2 lakh out since April.',
        time: '15:04', via: 'SIM 1',
      }),
      message('s09-d6-them2', {
        text: 'I opened a trial on the desk with your name on it so you can watch it without putting '
          + 'anything in. Look at the balance.',
        time: '15:06',
      }),
      link('s09-link', {
        shown: shortLink,
        caption: 'Tap to see where this address goes before opening it.',
      }),
    ],

    surfaces: {
      /** Conversation details - and what six days of turns actually look like counted up. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: '#', name: from, number: from, note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'First message', value: 'Monday, 09:39' },
                  { label: 'Messages', value: '9 over six days — 3 from you' },
                  { label: 'Who wrote first', value: 'The other number' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is a personal number', result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                  { label: 'Name used', value: 'Given in the first message, never shown by the network', result: 'claimed' },
                ],
              },
              {
                type: 'note',
                text: 'Nothing about the number has changed in six days. What has changed is what the '
                  + 'thread is asking for.',
              },
            ],
            links: [
              { id: 's09-link-history', label: 'Read the six days in order', to: 'history' },
              { id: 's09-link-target', label: 'Where does this address go?', to: 'linkinfo' },
            ],
          },
          history: {
            title: 'Six days, in order',
            blocks: [
              {
                type: 'items',
                heading: 'Every turn in this thread',
                items: [
                  { label: 'Monday 09:39 — them', meta: 'Day 1', value: 'A wrong number, and a name' },
                  { label: 'Monday 09:52 — you', meta: 'Day 1', value: 'You said it was the wrong number' },
                  { label: 'Monday 09:55 — them', meta: 'Day 1', value: 'Thanked you for replying' },
                  { label: 'Wednesday 20:11 — them', meta: 'Day 3', value: 'Wrote again, unprompted' },
                  { label: 'Wednesday 20:40 — you', meta: 'Day 3', value: 'A one-line answer' },
                  { label: 'Wednesday 20:44 — them', meta: 'Day 3', value: 'First mention of not needing to work' },
                  { label: 'Today 15:04 — them', meta: 'Day 6', value: 'An analyst, a guaranteed trade, a figure' },
                  { label: 'Today 15:06 — them', meta: 'Day 6', value: 'A desk, a trial in your name, an address' },
                ],
              },
              {
                type: 'note',
                text: 'Five messages of nothing in particular, then money. The gap between them is the '
                  + 'part that was built.',
              },
            ],
          },
        },
      }),

      /** The app's own link details screen. */
      linkinfo: sms({
        title: 'Link details',
        home: 'target',
        inertNote: 'Local link details. Nothing is fetched and no address is opened from here.',
        pages: {
          target: {
            title: 'Link details',
            blocks: [
              {
                type: 'link',
                heading: 'Address in this message',
                shown: shortLink,
                target,
                rows: [
                  { label: 'Host', value: 's09.training.example' },
                  { label: 'Registered', value: '5 weeks ago' },
                  { label: 'Certificate', value: 'Valid for s09.training.example' },
                  { label: 'Named on the page', value: 'No firm number, no address' },
                ],
              },
              {
                type: 'note',
                text: 'The written name and the host are not the same thing. A site can be named after '
                  + 'anything.',
              },
            ],
          },
        },
      }),

      /** The desk: a balance that only exists on this page, and a Deposit button under it. */
      trading: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dash',
        pages: {
          dash: {
            title: 'ApexQuant desk',
            host: 's09.training.example',
            url: target,
            blocks: [
              { type: 'brand', monogram: 'AQ', name: 'ApexQuant', tagline: 'Private desk · trial account' },
              { type: 'heading', text: 'Trial balance: INR 1,04,200' },
              {
                type: 'summary',
                rows: [
                  { label: 'Opened for', value: 'You, by M. (trial)' },
                  { label: 'Today’s gain', value: '+18.4%', strong: true },
                  { label: 'Trades shown', value: '14, all closed in profit' },
                  { label: 'Withdrawable', value: 'After your first live deposit' },
                ],
              },
              {
                type: 'text',
                text: 'The trial balance is displayed by this page. Converting to a live account unlocks '
                  + 'withdrawal.',
              },
              {
                type: 'notice',
                text: 'Deposits are settled to the desk’s collection account and are not held by a broker.',
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No account, balance or trade exists.',
              },
            ],
            /**
             * The desk's own Deposit button, as a page link rather than the browser's local
             * Continue: a `primary` is hidden on a page the stage offers no control on, and
             * the deposit is taken on the phone's payment sheet, not on this page. A link
             * renders whatever the stage is, so the sheet is reachable from the desk itself
             * and from the app's menu - never only by spending the branch.
             */
            links: [
              { id: 's09-page-deposit', label: 'Deposit and unlock withdrawal', to: 'deposit' },
              { id: 's09-page-terms', label: 'Read the desk terms', to: 'terms' },
            ],
          },
          terms: {
            title: 'Desk terms',
            host: 's09.training.example',
            url: `${target}/terms`,
            blocks: [
              { type: 'heading', text: 'Desk terms' },
              {
                type: 'summary',
                rows: [
                  { label: 'Operator', value: 'Not stated' },
                  { label: 'Registration', value: 'Not stated' },
                  { label: 'Office address', value: 'Not stated' },
                  { label: 'Deposits', value: 'Collected to an individual account nominated per client' },
                  { label: 'Withdrawals', value: 'Reviewed manually; may require a further deposit' },
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing on it is an offer of anything.',
              },
            ],
            links: [
              { id: 's09-page-dash', label: 'Back to the desk', to: 'dash' },
            ],
          },
        },
      },

      /** The phone's own payment sheet, raised by the desk. The payee is a person. */
      deposit: {
        kind: SURFACE.PAYSHEET,
        title: 'Send money',
        app: 'Payments',
        amount: 'INR 10,000.00',
        subtitle: 'To an individual account',
        rows: [
          { label: 'To', value: 'M R AGARWAL' },
          { label: 'Account type', value: 'Individual savings' },
          { label: 'Purpose', value: 'Margin top-up' },
          { label: 'Reference', value: 'AQ-77410' },
          { label: 'Refundable', value: 'Reviewed manually after 30 days' },
        ],
        form: {
          title: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The PIN stays on this screen. It is not stored, sent or read by anything.',
      },

      /** The register the learner can search for themselves. */
      register: {
        kind: SURFACE.APP,
        appName: 'Investor Register',
        appTagline: 'Registered intermediaries',
        hero: {
          label: 'Search: ApexQuant',
          value: 'No registered intermediary found',
          caption: 'Nobody is permitted to take client money under that name.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's09-app-search',
            heading: 'What the register holds',
            rows: [
              { label: 'Matches for "ApexQuant"', value: '0' },
              { label: 'Matches for "Apex"', value: '2, neither taking new clients by message' },
              { label: 'Warnings published', value: '9 about desks collecting to individual accounts' },
            ],
            note: 'A registered intermediary publishes a number, an office and a complaints route.',
          },
          {
            id: 's09-app-rule',
            heading: 'How client money is held',
            rows: [
              { label: 'Where deposits go', value: 'A segregated client account, never an individual’s' },
              { label: 'Guaranteed returns', value: 'Cannot be offered by anyone on the register' },
              { label: 'Where to check', value: 'This register, and the helpline printed in it' },
            ],
          },
        ],
        tabs: [
          { label: 'Register', icon: 'home' },
          { label: 'Warnings', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The investor helpline, on the number published in the register. */
      regcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Investor helpline (number in the register)',
        number: registerLine,
        script: [
          { at: 0, speaker: 'them', text: 'Investor helpline.' },
          { at: 3, speaker: 'them', text: 'No desk of that name is on the register, so nobody there may take your money.' },
          { at: 10, speaker: 'them', text: 'A deposit to a personal account is not client money and cannot be recovered by us.' },
          { at: 17, speaker: 'them', text: 'Send nothing, deposit nothing, and stop replying to the number.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's09-c01', slot: SLOT.INLINE, label: 'Open the conversation' }),
          action({ id: 's09-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about the trade' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's09-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who started it, and how the thread has moved',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's09-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's09-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's09-c06', slot: SLOT.COMPOSER, label: 'Reply asking how the trade works',
            echo: 'How does the trade work, and who is the analyst?',
          }),
          action({
            id: 's09-c07', slot: SLOT.COMPOSER,
            label: 'Send the account details so the profit can be paid out',
            echo: 'Account 00000 44172, branch code TRNG0417, ID TRNG-4417-22.',
          }),
          action({
            id: 's09-c08', slot: SLOT.SURFACE, on: 'deposit',
            label: 'Send the deposit', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 's09-c09', slot: SLOT.MENU,
            label: 'Leave the thread and look the desk up in the investor register',
            opens: 'register',
          }),
          navigate({
            id: 's09-nav-site', slot: SLOT.INLINE, anchor: 's09-link',
            label: 'Open the address', opens: 'trading',
          }),
          navigate({ id: 's09-nav-sheet', slot: SLOT.MENU, label: 'Open the deposit sheet', opens: 'deposit' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's09-c10', slot: SLOT.MENU, label: 'Open the investor register and search for the desk',
            hint: 'Registered intermediaries and published warnings', opens: 'register',
          }),
          action({
            id: 's09-c11', slot: SLOT.MENU, label: 'Call the investor helpline on the number in the register',
            opens: 'regcall',
          }),
          action({
            id: 's09-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's09-c13', slot: SLOT.MENU, label: 'Reply and ask her to prove the profits' }),
          action({ id: 's09-c14', slot: SLOT.MENU, label: 'Report the conversation as junk' }),
          action({ id: 's09-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's09-c16', slot: SLOT.INLINE, label: 'Stop replying and report the conversation' }),
          action({ id: 's09-c17', slot: SLOT.INLINE, label: 'Take the trade tonight' }),
          action({ id: 's09-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's09-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's09-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's09-nav-desk', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'trading', after: 'branch' }),
      navigate({ id: 's09-nav-register', slot: SLOT.MENU, label: 'Open the investor register', opens: 'register', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's09-dir-register',
        name: 'Investor helpline — registered intermediaries',
        identifier: registerLine,
        provenance: 'local approved directory',
        role: 'Confirms whether a desk may take client money, and publishes warnings about those that may not.',
      },
    ],
  }
}

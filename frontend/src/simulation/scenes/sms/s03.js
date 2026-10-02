import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  amount, assetId, day, directory, message, messageText, sender, sms,
} from './shared.js'

/**
 * S03 - Matching Debit Alert (IMMERSIVE-010) - the ordinary item, and the only legitimate one.
 *
 * INR 840 was spent at TRAINING MART four minutes ago, and the bank's alert for it has just
 * arrived. It is exactly the message it should be: from the registered header the learner has been
 * receiving alerts from for a year, quoting the masked card, carrying no address, no phone number
 * and no instruction beyond "no action needed".
 *
 * This is the scene where the SMS thread's OWN HISTORY is the evidence. The conversation is a year
 * of identical alerts - debits, a salary credit, a statement notice - all in the same shape from
 * the same header. The learner does not have to reason about what a bank text looks like; they can
 * scroll up and see fifty of them.
 *
 * What it prices is over-reaction. A no-action alert that matches a purchase you just made is
 * useful security information, and the normal thing to do is compare it with the account and mark
 * it reviewed. Blocking the header costs −2 and takes away every future fraud alert; replying to it
 * or ringing the number behind it is worse. Fictional throughout: the bank, the shop, the card and
 * every number describe nothing real, and nothing on any screen is typed.
 */
export function buildS03(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const desk = directory(scenario)
  const header = senderInfo.display_name ?? 'ALERT'
  const behind = senderInfo.identifier ?? '+91 00000 91902'
  const cardLine = '+91 00000 55021'

  return {
    scenarioId: 'S03',
    platform: 'sms',
    notify: { sender: header },
    messageSender: { display_name: header, identifier: behind },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'transactions', label: 'Transactions', heading: 'Transactions', count: 3 },
        {
          id: 'personal', label: 'Personal', heading: 'Personal',
          rows: [
            {
              id: 's03-p-1', from: 'Anjali', time: '11:02', inert: true,
              preview: 'Got the groceries. Did you pay at the counter or on the app?',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's03-row', from: header, time: '08:31', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's03-bg-1', from: 'VM-TRNGMB', time: 'Yesterday', inert: true,
          preview: 'Your mobile bill of INR 399 is paid. Thank you.',
        },
        {
          id: 's03-bg-2', from: 'TRN-RAIL', time: '01 Sep', inert: true,
          preview: 'PNR 8841027744 confirmed. Coach S4, seat 31.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Registered sender · alerts only',
      detailsTo: 'details',
    },

    beats: [
      day('s03-day-old', 'Earlier this month'),
      message('s03-old-1', {
        text: 'INR 2,310 debited from a/c xx4417 at CITY FUEL on 14 Sep. Card xx1042. Not you? Call the number on your card.',
        time: '14 Sep',
      }),
      message('s03-old-2', {
        text: 'Salary credit INR 71,400 to a/c xx4417 on 01 Sep. Available balance updated in the app.',
        time: '01 Sep',
      }),
      message('s03-old-3', {
        text: 'Your statement for August is ready. Open the UnionX app to view it. No action needed.',
        time: '28 Aug',
      }),
      day('s03-day-today', 'Today'),
      message('s03-msg', { text: messageText(scenario), time: '08:31', via: 'SIM 1' }),
      amount('s03-amount', {
        amount: 'INR 840.00',
        rows: [
          { label: 'Where', value: 'TRAINING MART' },
          { label: 'Card', value: 'xx1042' },
          { label: 'When', value: 'Today, 08:27' },
          { label: 'Action', value: 'None needed' },
        ],
      }),
    ],

    surfaces: {
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              {
                type: 'identity', initials: 'AL', name: header, number: `Sender ID · ${header}`,
                note: 'Registered business sender — you cannot reply to it',
              },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'Started', value: 'September 2025' },
                  { label: 'Messages', value: '54 — all alerts, none with an address' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered sender ID', result: 'header' },
                  { label: 'Route', value: `Delivered through ${behind}`, result: 'gateway' },
                  { label: 'In this message', value: 'No address, no phone number', result: 'none' },
                ],
              },
              {
                type: 'note',
                text: 'A registered sender ID is booked by one business and cannot be replied to. The '
                  + 'gateway number behind it belongs to the carrier, not to the bank.',
              },
            ],
            links: [
              { id: 's03-link-history', label: 'See the whole thread', to: 'history' },
              { id: 's03-link-protection', label: 'Spam protection settings', to: 'protection' },
            ],
          },
          history: {
            title: `Messages from ${header}`,
            blocks: [
              {
                type: 'items',
                heading: 'The last year, in this app',
                items: [
                  { label: 'Today', meta: '08:31', value: 'INR 840 debit · TRAINING MART · card xx1042' },
                  { label: '14 Sep', meta: '09:14', value: 'INR 2,310 debit · CITY FUEL · card xx1042' },
                  { label: '01 Sep', meta: '06:02', value: 'Salary credit INR 71,400' },
                  { label: '28 Aug', meta: '19:40', value: 'August statement ready' },
                  { label: '12 Aug', meta: '13:22', value: 'INR 640 debit · BOOK DEPOT · card xx1042' },
                ],
              },
              {
                type: 'note',
                text: 'Same header, same shape, no address in any of them — including this one.',
              },
            ],
          },
        },
      }),

      /** The learner's own banking app: the same transaction, and Mark reviewed. */
      bankapp: {
        kind: SURFACE.APP,
        appName: 'UnionX Bank',
        appTagline: 'Card xx1042 · recent transactions',
        hero: {
          label: 'Most recent',
          value: 'INR 840.00',
          caption: 'TRAINING MART · today 08:27 · card xx1042 · posted',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's03-app-txn',
            heading: 'This transaction',
            rows: [
              { label: 'Amount', value: 'INR 840.00' },
              { label: 'Merchant', value: 'TRAINING MART' },
              { label: 'Time', value: 'Today, 08:27' },
              { label: 'Card', value: 'xx1042' },
              { label: 'Alert sent', value: 'Today, 08:31' },
            ],
            note: 'The alert and the transaction match on amount, merchant, card and time.',
          },
          {
            id: 's03-app-recent',
            heading: 'Earlier on this card',
            rows: [
              { label: '14 Sep', value: 'CITY FUEL · INR 2,310' },
              { label: '12 Aug', value: 'BOOK DEPOT · INR 640' },
            ],
          },
        ],
        tabs: [
          { label: 'Accounts', icon: 'home' },
          { label: 'Cards', icon: 'wallet' },
          { label: 'History', icon: 'history' },
        ],
      },

      /**
       * The phone's own spam-protection screen - where blocking this sender would take
       * effect, and what it would cost. The Messages app has one; a messenger does not.
       */
      protection: sms({
        title: 'Spam protection',
        home: 'protection',
        inertNote: 'Local Messages settings. Nothing here changes a real phone.',
        pages: {
          protection: {
            title: 'Spam protection',
            blocks: [
              {
                type: 'rows',
                heading: 'On this phone',
                rows: [
                  { label: 'Spam protection', value: 'On' },
                  { label: 'Registered senders', value: '12 — including ALERT' },
                  { label: 'Blocked senders', value: 'None' },
                ],
              },
              {
                type: 'items',
                heading: 'If you block a registered sender',
                items: [
                  { label: 'Its future messages', value: 'Go straight to Spam and raise no notification' },
                  { label: 'Fraud alerts from it', value: 'Are blocked too — there is no separate setting' },
                  { label: 'Undoing it', value: 'Messages · Spam and blocked · Unblock' },
                ],
              },
              {
                type: 'note',
                text: 'A sender ID is booked by one business, so blocking it blocks everything that '
                  + 'business sends you.',
              },
            ],
          },
        },
      }),

      /** The card statement in the app, where the same line is posted. */
      statement: {
        kind: SURFACE.APP,
        appName: 'UnionX Bank',
        appTagline: 'Card xx1042 · statement',
        hero: {
          label: 'Posted today',
          value: 'INR 840.00',
          caption: 'TRAINING MART · card xx1042 · settled',
        },
        sections: [
          {
            id: 's03-stmt-rows',
            heading: 'Merchant details',
            rows: [
              { label: 'Descriptor', value: 'TRAINING MART 0441 · retail' },
              { label: 'Authorised', value: 'Today, 08:27' },
              { label: 'Posted', value: 'Today, 08:29' },
              { label: 'Alert sent', value: 'Today, 08:31' },
            ],
            note: 'The alert followed the posting by two minutes, which is when the bank sends them.',
          },
          {
            id: 's03-stmt-month',
            heading: 'This month so far',
            rows: [
              { label: 'Card spend', value: 'INR 3,790' },
              { label: 'Disputed', value: 'Nothing' },
            ],
          },
        ],
        tabs: [
          { label: 'Statement', icon: 'home' },
          { label: 'Cards', icon: 'wallet' },
          { label: 'History', icon: 'history' },
        ],
      },

      /** The bank, on the number printed on the card. */
      bankcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'UnionX Bank (number on your card)',
        number: cardLine,
        script: [
          { at: 0, speaker: 'them', text: 'UnionX card services.' },
          { at: 3, speaker: 'them', text: 'Yes, INR 840 at TRAINING MART this morning on card xx1042. That is yours.' },
          { at: 9, speaker: 'them', text: 'The alert is ours. Please keep receiving them — it is how you would spot one you did not make.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's03-c01', slot: SLOT.INLINE, label: 'Open the alert' }),
          action({ id: 's03-c02', slot: SLOT.INLINE, label: 'Reply from the list to query the charge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's03-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Sender ID, route and what the message carries',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 's03-c04', slot: SLOT.MENU, label: 'Read the earlier alerts in this thread' }),
          action({ id: 's03-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's03-c06', slot: SLOT.SURFACE, on: 'bankapp',
            label: 'Mark the transaction reviewed', targetId: paymentAsset, closes: true,
          }),
          action({ id: 's03-c07', slot: SLOT.MENU, label: 'Block this sender so it stops texting you' }),
          action({
            id: 's03-c08', slot: SLOT.MENU, label: 'Call the number the alert was delivered from',
            hint: 'The gateway number on the details screen',
          }),
          action({
            id: 's03-c09', slot: SLOT.COMPOSER,
            label: 'Reply to confirm it was you',
            echo: 'Yes, that was me. Card xx1042, INR 840 at Training Mart.',
          }),
          navigate({
            id: 's03-nav-app', slot: SLOT.INLINE, anchor: 's03-amount',
            label: 'Open this transaction in your banking app', opens: 'bankapp',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's03-c10', slot: SLOT.MENU, label: 'Compare it with the transaction list in your banking app',
            hint: 'Amount, merchant, card and time', opens: 'bankapp',
          }),
          action({ id: 's03-c11', slot: SLOT.MENU, label: 'Call the bank on the number on your card', opens: 'bankcall' }),
          action({
            id: 's03-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 's03-c13', slot: SLOT.MENU, label: 'Reply to the alert and ask them to confirm' }),
          action({ id: 's03-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's03-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's03-c16', slot: SLOT.INLINE, label: 'Keep the alert and carry on' }),
          action({ id: 's03-c17', slot: SLOT.INLINE, label: 'Report it as junk' }),
          action({ id: 's03-c18', slot: SLOT.MENU, label: 'Keep the thread as it is' }),
          action({ id: 's03-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's03-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's03-nav-bank', slot: SLOT.MENU, label: 'Open your banking app', opens: 'bankapp', after: 'verify' }),
      navigate({ id: 's03-nav-statement', slot: SLOT.MENU, label: 'Open the card statement', opens: 'statement', after: 'verify' }),
      navigate({ id: 's03-nav-protection', slot: SLOT.MENU, label: 'Spam protection settings', opens: 'protection', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 's03-dir-bank',
        name: 'UnionX Bank — card services',
        identifier: cardLine,
        provenance: 'printed on your card',
        role: 'Confirms transactions on your card; the number is the one on the back of the card.',
      },
    ],
  }
}

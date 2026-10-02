import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, message, messageText, number, sender, sms, system,
} from './shared.js'

/**
 * S02 - Electricity Disconnect Tonight (IMMERSIVE-010) - what the voice asks for is the decision.
 *
 * A text at 18:34 says the power goes off at 21:30 tonight for an unpaid bill, and gives a mobile
 * number to call. There is no link and no attachment: a filter has nothing to catch, and the only
 * thing in the message that can be acted on is ten digits.
 *
 * The SMS-native shape is the absence. A utility that is about to disconnect you quotes your
 * consumer number, and it texts from its registered header - the learner's own Transactions tab has
 * last month's bill and its paid receipt from `VM-TRNPWR`, both with a consumer number on them.
 * This one has neither, and it arrived from an ordinary mobile at a time when no office is open.
 *
 * Where it differs from every earlier callback scene is where the decision sits. Tapping the number
 * raises the phone's own dial confirmation, and connecting reaches a scripted operator - but the
 * scored decision is what the operator then ASKS FOR: an app to install so he can "restore the
 * connection remotely", and a reconnection charge to pay while he is on the line. Ending the call
 * is the safe branch. Fictional throughout: the utility, the bill, the operator and every number
 * describe nothing real; nothing is dialled, installed or paid.
 */
export function buildS02(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const installAsset = assetId(scenario, ASSET_KIND.INSTALL)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 97363'
  const callback = '+91 00000 12002'
  const utilityHeader = 'VM-TRNPWR'
  const billLine = '+91 00000 30455'
  const consumer = 'TP-55-208841'

  return {
    scenarioId: 'S02',
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
              id: 's02-tx-1', from: utilityHeader, time: '12 Sep', inert: true,
              preview: `Payment received INR 1,840 for consumer ${consumer}. Bill for Sep is settled. No dues.`,
            },
            {
              id: 's02-tx-2', from: utilityHeader, time: '04 Sep', inert: true,
              preview: `Bill for consumer ${consumer}: INR 1,840, due 14 Sep. Pay in the app or at any centre.`,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's02-row', from, time: '18:34', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's02-bg-1', from: 'Vikram', time: '17:40', inert: true,
          preview: 'Parking is full on the near side, come round the back.',
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
      day('s02-day', 'Today'),
      system('s02-sys', 'Sent from a number that is not in your contacts.'),
      message('s02-msg', { text: messageText(scenario), time: '18:34', via: 'SIM 1' }),
      number('s02-number', {
        number: callback,
        caption: 'Written in the message. Not saved in your contacts.',
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
              { type: 'identity', initials: '#', name: from, number: from, note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'Started', value: 'Today, 18:34' },
                  { label: 'In the message', value: 'No address — one phone number' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is not a business header', result: 'none' },
                  { label: 'Consumer number quoted', value: 'None', result: 'missing' },
                ],
              },
              {
                type: 'note',
                text: 'Your electricity bills come from a registered header and always quote the consumer '
                  + 'number printed on them.',
              },
            ],
            links: [{ id: 's02-link-compare', label: `See what ${utilityHeader} has sent you`, to: 'compare' }],
          },
          compare: {
            title: `Messages from ${utilityHeader}`,
            blocks: [
              {
                type: 'items',
                heading: 'Your electricity supplier, in this app',
                items: [
                  { label: utilityHeader, meta: '12 Sep', value: `Payment received · ${consumer} · no dues` },
                  { label: utilityHeader, meta: '04 Sep', value: `Bill INR 1,840 · ${consumer} · due 14 Sep` },
                  { label: utilityHeader, meta: '12 Aug', value: `Payment received · ${consumer}` },
                ],
              },
              { type: 'note', text: 'Every one quotes the consumer number, and none of them gives a mobile to call.' },
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
            title: `Call ${callback}?`,
            text: 'The number was tapped in a text message. The phone app will dial it.',
            rows: [
              { label: 'Number', value: callback },
              { label: 'Saved as', value: 'Not in your contacts' },
            ],
            links: [{ id: 's02-link-call', label: 'Call', to: 'operator' }],
          },
        },
      },

      /**
       * The scripted desk the number reaches. The two things it asks for are the scene's
       * decisions, and End call is the third.
       */
      operator: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Power supply — disconnection desk',
        number: callback,
        script: [
          { at: 0, speaker: 'them', text: 'Disconnection desk. Your line is scheduled for 21:30 tonight.' },
          { at: 5, speaker: 'them', text: 'The system shows the payment failed at our end. I can restore it from here if you let me in.' },
          { at: 11, speaker: 'them', text: 'Install the QuickAssist app from the message I am sending and read me the code on it.' },
          { at: 17, speaker: 'them', text: 'Or clear the reconnection charge of INR 1,299 now and I will hold the disconnection.' },
          { at: 23, speaker: 'them', text: 'Please stay on the line. If you hang up the crew will be dispatched.' },
        ],
      },

      /** The learner's own utility app - the bill, and whether anything is owed. */
      billapp: {
        kind: SURFACE.APP,
        appName: 'Power Supply',
        appTagline: `Consumer ${consumer}`,
        hero: {
          label: 'Account status',
          value: 'No dues',
          caption: 'September bill of INR 1,840 was paid on 12 September.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's02-bill-rows',
            heading: 'This connection',
            rows: [
              { label: 'Last bill', value: 'INR 1,840 · due 14 Sep' },
              { label: 'Paid', value: '12 Sep · receipt in the app' },
              { label: 'Disconnection notices', value: 'None' },
            ],
            note: 'A disconnection is raised here first, with the consumer number and a dated notice.',
          },
          {
            id: 's02-bill-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${utilityHeader} only, quoting your consumer number` },
              { label: 'Calls', value: `The number printed on your bill — ${billLine}` },
              { label: 'We never', value: 'Ask you to install an app so we can restore a connection' },
            ],
          },
        ],
        tabs: [
          { label: 'Bills', icon: 'home' },
          { label: 'Payments', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The supplier, on the number printed on the bill. */
      utilitycall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Power supply (number on your bill)',
        number: billLine,
        script: [
          { at: 0, speaker: 'them', text: 'Customer care.' },
          { at: 3, speaker: 'them', text: `Consumer ${consumer} is fully paid. There is no disconnection scheduled.` },
          { at: 9, speaker: 'them', text: 'We do not have a disconnection desk on a mobile number, and we never ask anyone to install anything.' },
          { at: 15, speaker: 'them', text: 'Please report that message as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's02-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's02-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's02-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and what is missing',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 's02-c04', slot: SLOT.MENU, label: 'Read the earlier texts about this connection' }),
          action({ id: 's02-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's02-c06', slot: SLOT.SURFACE, on: 'operator',
            label: 'Install the app the desk is sending', targetId: installAsset, closes: true,
          }),
          action({
            id: 's02-c07', slot: SLOT.SURFACE, on: 'operator',
            label: 'Pay the reconnection charge now', targetId: paymentAsset, closes: true,
          }),
          action({ id: 's02-c08', slot: SLOT.SURFACE, on: 'operator', label: 'End the call', closes: true }),
          action({
            id: 's02-c09', slot: SLOT.COMPOSER,
            label: 'Reply asking for the consumer number',
            echo: 'Which connection is this? Please send the consumer number on the bill.',
          }),
          navigate({
            id: 's02-nav-dial', slot: SLOT.INLINE, anchor: 's02-number',
            label: `Call ${callback}`, opens: 'dial',
          }),
          navigate({ id: 's02-nav-desk', slot: SLOT.MENU, label: 'Open the call already in progress', opens: 'operator' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's02-c10', slot: SLOT.MENU, label: 'Open your electricity app and check the bill',
            hint: 'Dues, payments and disconnection notices', opens: 'billapp',
          }),
          action({
            id: 's02-c11', slot: SLOT.MENU, label: 'Call the supplier on the number printed on your bill',
            opens: 'utilitycall',
          }),
          action({
            id: 's02-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 's02-c13', slot: SLOT.MENU, label: 'Call the number in the text back and ask', targetId: callAsset }),
          action({ id: 's02-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's02-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's02-c16', slot: SLOT.INLINE, label: 'Report it as junk and leave the connection alone' }),
          action({ id: 's02-c17', slot: SLOT.INLINE, label: 'Settle it with the desk before 21:30' }),
          action({ id: 's02-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's02-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's02-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's02-nav-app', slot: SLOT.MENU, label: 'Open your electricity app', opens: 'billapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's02-dir-power',
        name: 'Power supply — customer care',
        identifier: billLine,
        provenance: 'printed on your bill',
        role: 'Confirms dues and disconnection notices; the number is the one printed on the bill.',
      },
    ],
  }
}

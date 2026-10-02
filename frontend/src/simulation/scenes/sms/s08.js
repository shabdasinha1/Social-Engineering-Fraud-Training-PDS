import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S08 - Lottery Claim Text (IMMERSIVE-011) - the message that was not sent to you.
 *
 * Five lakh, a 499-rupee "processing" charge and a midnight deadline. The lure is the oldest one
 * in the book, and on most platforms the only tell is that the learner never entered anything.
 *
 * What SMS adds, and what this scene is built on, is **proof of a blast**. The phone has two SIM
 * cards, and the identical text reached both of them in the same second - which is something a
 * message addressed to a person cannot do. The details screen states it, and the phone's own spam
 * folder holds three more of the same text from three different numbers over the last month, each
 * with a different prize and a different "claim officer". Leaving the message to go and compare
 * them is the safe branch, and it is reached from the app's own unknown-sender bar.
 *
 * The claim page escalates the way real ones do: identity first (name, ID number, account), and
 * only on the next page the 499. Both pages are reachable from the page above them, so refusing
 * the first does not hide the second from a learner who wants to see what it asks.
 *
 * Fictional throughout: the Grand Fortune Draw, the claim page, the consumer desk, the prize and
 * every host and number describe nothing real; nothing is paid, and what is typed on the drawn
 * pages stays on the screen it is typed on.
 */
export function buildS08(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 62252'
  const shortLink = 'claim-now.training.example'
  const target = page?.display_target ?? 'https://s08.training.example/claim'
  const helpline = '+91 00000 45090'

  return {
    scenarioId: 'S08',
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
              id: 's08-tx-1', from: 'BK-UNIONX', time: '11:40', inert: true,
              preview: 'INR 180 debited from a/c xx4417 at CITY BUS. Not you? Call the number on your card.',
            },
            {
              id: 's08-tx-2', from: 'VM-TRNGMB', time: 'Yesterday', inert: true,
              preview: 'Your mobile bill of INR 399 is paid. Thank you.',
            },
          ],
        },
        {
          id: 'spam', label: 'Spam', heading: 'Spam and blocked',
          rows: [
            {
              id: 's08-spam-1', from: '+91 00000 71553', time: '02 Sep', inert: true,
              preview: 'CONGRATS! You won INR 8 lakh. Pay INR 599 processing before midnight.',
            },
            {
              id: 's08-spam-2', from: '+91 00000 24806', time: '21 Aug', inert: true,
              preview: 'CONGRATS! You won INR 3 lakh. Pay INR 349 processing before midnight.',
            },
            {
              id: 's08-spam-3', from: '+91 00000 66410', time: '09 Aug', inert: true,
              preview: 'CONGRATS! You won INR 5 lakh. Pay INR 499 processing before midnight.',
            },
          ],
        },
      ],
      rows: [
        {
          id: 's08-row', from, time: '16:25', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's08-bg-1', from: 'Ravi', time: '15:48', inert: true,
          preview: 'Sending the address for Sunday. Do not be late this time.',
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
      system('s08-sys', 'Sent from a number that is not in your contacts.'),
      message('s08-msg', { text: messageText(scenario), time: '16:25', via: 'SIM 1' }),
      system('s08-sys2', 'The same message was delivered to SIM 2 at 16:25.'),
      link('s08-link', {
        shown: shortLink,
        caption: 'Tap to see where this address goes before opening it.',
      }),
      message('s08-msg2', {
        text: 'Claim officer: R. Menon. The release desk closes at midnight and the prize rolls over.',
        time: '16:27', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - including the thing only a dual-SIM phone can show. */
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
                  { label: 'Delivered to', value: 'SIM 1 and SIM 2, both at 16:25:04' },
                  { label: 'Started', value: 'Today, 16:25' },
                  { label: 'Messages', value: '2 — no earlier texts from this number' },
                  { label: 'Draw or ticket quoted', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is not a business header', result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                  { label: 'Reached both SIM cards', value: 'Yes, in the same second', result: 'both' },
                ],
              },
              {
                type: 'note',
                text: 'A message that arrives on both of your numbers in the same second was sent to a '
                  + 'list. The phone files four more like it under Spam.',
              },
            ],
            links: [
              { id: 's08-link-spam', label: 'Open the phone’s spam folder', to: 'spamfolder' },
              { id: 's08-link-target', label: 'Where does this address go?', to: 'linkinfo' },
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
                  { label: 'Host', value: 's08.training.example' },
                  { label: 'Registered', value: '9 days ago' },
                  { label: 'Certificate', value: 'Valid for s08.training.example' },
                  { label: 'Named in the message', value: 'No organiser, no draw number' },
                ],
              },
              {
                type: 'note',
                text: 'A valid certificate says the address is what it claims to be. It does not say '
                  + 'who owns it or how old it is.',
              },
            ],
          },
        },
      }),

      /** The phone's own spam folder - four of the same text, from four different numbers. */
      spamfolder: sms({
        title: 'Spam and blocked',
        home: 'spam',
        inertNote: 'Local spam folder. Nothing here is opened, answered or forwarded.',
        pages: {
          spam: {
            title: 'Spam and blocked',
            blocks: [
              {
                type: 'items',
                heading: 'Filed by the phone in the last month',
                items: [
                  { label: '+91 00000 71553', meta: '02 Sep', value: 'CONGRATS! You won INR 8 lakh. Pay INR 599 processing before midnight.' },
                  { label: '+91 00000 24806', meta: '21 Aug', value: 'CONGRATS! You won INR 3 lakh. Pay INR 349 processing before midnight.' },
                  { label: '+91 00000 66410', meta: '09 Aug', value: 'CONGRATS! You won INR 5 lakh. Pay INR 499 processing before midnight.' },
                  { label: '+91 00000 39025', meta: '28 Jul', value: 'CONGRATS! You won INR 12 lakh. Pay INR 899 processing before midnight.' },
                ],
              },
              {
                type: 'note',
                text: 'Four numbers, four amounts, one sentence. The draw changes; the wording does not.',
              },
            ],
          },
        },
      }),

      /** The claim site: identity on the first page, the release fee on the second. */
      claim: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Claim your prize',
            host: 's08.training.example',
            url: target,
            blocks: [
              { type: 'brand', monogram: 'GF', name: 'Grand Fortune Draw', tagline: 'Winner release desk' },
              { type: 'heading', text: 'Congratulations. Your claim closes at 00:00.' },
              {
                type: 'text',
                text: 'Confirm the winner’s details so the release desk can raise the payout file.',
              },
              {
                type: 'form',
                title: 'Winner details',
                fields: [
                  field({ name: 'name', label: 'Full name as on your ID', kind: FIELD_KIND.TEXT, length: 3, max: 40 }),
                  field({ name: 'idnumber', label: 'ID number', kind: FIELD_KIND.TEXT, length: 4, max: 18 }),
                  field({ name: 'account', label: 'Bank account number', kind: FIELD_KIND.DIGITS, length: 6, max: 14, group: 4 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's08-page-fee', label: 'Already sent your details? Go to the release fee', to: 'fee' },
            ],
          },
          fee: {
            title: 'Release fee',
            host: 's08.training.example',
            url: `${target}/fee`,
            blocks: [
              { type: 'brand', monogram: 'GF', name: 'Grand Fortune Draw', tagline: 'Winner release desk' },
              { type: 'heading', text: 'Release fee: INR 499' },
              {
                type: 'summary',
                rows: [
                  { label: 'Prize', value: 'INR 5,00,000', strong: true },
                  { label: 'Release fee', value: 'INR 499' },
                  { label: 'Payable to', value: 'GF RELEASE DESK' },
                  { label: 'Closes', value: 'Tonight, 00:00' },
                ],
              },
              {
                type: 'form',
                title: 'Pay the release fee',
                fields: [
                  field({ name: 'upi', label: 'Your payment handle', kind: FIELD_KIND.TEXT, length: 4, max: 30 }),
                  field({ name: 'otp', label: 'Code sent by your bank', kind: FIELD_KIND.DIGITS, length: 6 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No money can move and nothing typed '
                  + 'here is sent anywhere.',
              },
            ],
            links: [
              { id: 's08-page-form', label: 'Back to the winner details', to: 'form' },
            ],
          },
        },
      },

      /** The consumer desk the learner can search themselves. */
      consumer: {
        kind: SURFACE.APP,
        appName: 'Consumer Desk',
        appTagline: 'Complaints and scheme register',
        hero: {
          label: 'Search: Grand Fortune Draw',
          value: 'No registered scheme found',
          caption: 'No draw, lottery or promotion is registered under that name.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's08-app-found',
            heading: 'What the register holds',
            rows: [
              { label: 'Registered schemes', value: '0 matching "Grand Fortune"' },
              { label: 'Complaints logged', value: '41 about prize texts this month' },
              { label: 'Common wording', value: '"Pay processing before midnight"' },
            ],
            note: 'A registered draw publishes an organiser, a draw number and a way to check a ticket.',
          },
          {
            id: 's08-app-rule',
            heading: 'How a genuine prize is released',
            rows: [
              { label: 'Entry', value: 'There must be one, and you must be able to find it' },
              { label: 'Fee to receive', value: 'Never charged before a payout' },
              { label: 'Where to check', value: 'The organiser you found yourself, not the sender' },
            ],
          },
        ],
        tabs: [
          { label: 'Register', icon: 'home' },
          { label: 'Complaints', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The consumer helpline, on the number in the directory. */
      officecall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Consumer helpline — prize and lottery complaints',
        number: helpline,
        script: [
          { at: 0, speaker: 'them', text: 'Consumer helpline.' },
          { at: 3, speaker: 'them', text: 'There is no draw of that name on the register, and no payout desk attached to it.' },
          { at: 9, speaker: 'them', text: 'Nothing is ever charged to release a prize. We have forty-one reports of that wording this month.' },
          { at: 16, speaker: 'them', text: 'Pay nothing, send nothing, and mark the message as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's08-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's08-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about the prize' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's08-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and where it landed',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's08-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's08-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's08-c06', slot: SLOT.INLINE, anchor: 's08-link',
            label: 'Open the address', targetId: browserAsset, opens: 'claim',
          }),
          action({
            id: 's08-c07', slot: SLOT.SURFACE, on: 'claim', page: 'form',
            label: 'Submit the winner details', thenPage: 'fee',
          }),
          action({
            id: 's08-c08', slot: SLOT.SURFACE, on: 'claim', page: 'fee',
            label: 'Pay the INR 499 release fee', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 's08-c09', slot: SLOT.INLINE, anchor: 'spam',
            label: 'Compare it with the others in the spam folder', opens: 'spamfolder',
          }),
          action({
            id: 's08-c10', slot: SLOT.COMPOSER, label: 'Reply to start the claim',
            echo: 'CLAIM. Please tell me what you need to release the prize.',
          }),
          navigate({ id: 's08-nav-page', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'claim' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's08-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 's08-c12', slot: SLOT.MENU, label: 'Call the consumer helpline in the directory',
            opens: 'officecall',
          }),
          action({
            id: 's08-c13', slot: SLOT.MENU, label: 'Open the Consumer Desk app and search for the draw',
            hint: 'Registered schemes and complaints', opens: 'consumer',
          }),
          action({ id: 's08-c14', slot: SLOT.MENU, label: 'Reply to the number and ask them to confirm' }),
          action({ id: 's08-c15', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's08-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's08-c17', slot: SLOT.INLINE, label: 'Report it as junk and claim nothing' }),
          action({ id: 's08-c18', slot: SLOT.INLINE, label: 'Complete the claim before midnight' }),
          action({ id: 's08-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's08-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's08-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's08-nav-spam', slot: SLOT.MENU, label: 'Open the spam folder', opens: 'spamfolder', after: 'inspect' }),
      navigate({ id: 's08-nav-consumer', slot: SLOT.MENU, label: 'Open the Consumer Desk app', opens: 'consumer', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's08-dir-consumer',
        name: 'Consumer helpline — prize and lottery complaints',
        identifier: helpline,
        provenance: 'local approved directory',
        role: 'Confirms whether a draw or promotion is registered, and takes reports about prize texts.',
      },
    ],
  }
}

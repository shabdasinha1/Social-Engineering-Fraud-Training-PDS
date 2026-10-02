import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S01 - Bank KYC Suspension (IMMERSIVE-010) - the sender is the tell.
 *
 * A text says the account will be blocked in thirty minutes unless KYC is updated, and gives an
 * address to do it at. The pressure is ordinary; what makes this scene SMS-native is where the
 * evidence lives. A bank does not text from a phone. It texts from a REGISTERED SENDER HEADER -
 * six characters, no digits to reply to - and the learner already has months of those in the
 * Transactions tab of this very app, from `BK-UNIONX`. This message came from a ten-digit mobile,
 * which is why the phone filed it under Personal and put its "not in your contacts" bar above it.
 *
 * The second SMS-native piece is the link. The app's preview card shows the address exactly as it
 * was written - a short one - and where it actually goes is something the learner has to open the
 * conversation details to find out. Nothing about the bubble gives it away.
 *
 * The safe route is the one the message is designed to stop them taking: leave the text alone and
 * open the banking app they already have, which shows no block and a KYC date years away.
 * Fictional throughout: the bank, the account and every number and host describe nothing real, and
 * what is typed on the drawn page stays on the screen it is typed on.
 */
export function buildS01(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 71088'
  const shortLink = 'bank-verify.training.example'
  const target = page?.display_target ?? 'https://s01.training.example/verify'
  const bankHeader = 'BK-UNIONX'
  const cardLine = '+91 00000 55021'

  return {
    scenarioId: 'S01',
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
              id: 's01-tx-1', from: bankHeader, time: '09:14', inert: true,
              preview: 'INR 2,310 debited from a/c xx4417 at CITY FUEL. Not you? Call the number on your card.',
            },
            {
              id: 's01-tx-2', from: bankHeader, time: '01 Sep', inert: true,
              preview: 'Salary credit INR 71,400 to a/c xx4417. Available balance updated.',
            },
            {
              id: 's01-tx-3', from: 'VM-TRNGMB', time: '28 Aug', inert: true,
              preview: 'Your mobile bill of INR 399 is paid. Thank you.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's01-row', from, time: '08:34', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's01-bg-1', from: 'Anjali', time: '07:52', inert: true,
          preview: 'Reaching by 10. Shall I pick up the tickets?',
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
      system('s01-sys', 'Sent from a number that is not in your contacts.'),
      message('s01-msg', { text: messageText(scenario), time: '08:34', via: 'SIM 1' }),
      link('s01-link', {
        shown: shortLink,
        caption: 'Tap to see where this address goes before opening it.',
      }),
    ],

    surfaces: {
      /** What the Messages app can say about this thread, and about the address in it. */
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
                  { label: 'Started', value: 'Today, 08:34' },
                  { label: 'Messages', value: '1 — no earlier texts from this number' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is not a business header', result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                ],
              },
              {
                type: 'note',
                text: 'Businesses that text you use a registered sender ID of six characters, which you '
                  + 'cannot reply to. Your bank has used one in this app since 2024.',
              },
            ],
            links: [
              { id: 's01-link-compare', label: `See what ${bankHeader} has sent you`, to: 'compare' },
              { id: 's01-link-target', label: 'Where does this address go?', to: 'linkinfo' },
            ],
          },
          compare: {
            title: `Messages from ${bankHeader}`,
            blocks: [
              {
                type: 'items',
                heading: 'Your bank, in this app',
                items: [
                  { label: bankHeader, meta: '09:14', value: 'Debit alert · a/c xx4417 · no link' },
                  { label: bankHeader, meta: '01 Sep', value: 'Salary credit · a/c xx4417 · no link' },
                  { label: bankHeader, meta: '18 Aug', value: 'Statement ready · open the app · no link' },
                  { label: bankHeader, meta: '02 Aug', value: 'Salary credit · a/c xx4417 · no link' },
                ],
              },
              {
                type: 'note',
                text: 'Every one is from the same six-character header, and none of them carries an address.',
              },
            ],
          },
        },
      }),

      /** The app's own link details screen: what was written, and where it actually goes. */
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
                  { label: 'Host', value: 's01.training.example' },
                  { label: 'Your bank', value: 'unionx.training.example' },
                  { label: 'Certificate', value: 'Valid for s01.training.example' },
                ],
              },
              {
                type: 'note',
                text: 'A valid certificate says the address is what it claims to be. It does not say who '
                  + 'owns it.',
              },
            ],
          },
        },
      }),

      /** Where the address goes: a mobile KYC page asking for the three things a bank never will. */
      kyc: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Complete your KYC',
            host: 's01.training.example',
            url: target,
            blocks: [
              { type: 'brand', monogram: 'UX', name: 'UnionX Bank', tagline: 'KYC re-verification' },
              { type: 'heading', text: 'Your account will be blocked in 00:27' },
              {
                type: 'text',
                text: 'Confirm your account number, your ATM PIN and the one-time code we have just sent '
                  + 'to complete re-verification.',
              },
              {
                type: 'form',
                title: 'Account holder verification',
                fields: [
                  field({ name: 'account', label: 'Account number', kind: FIELD_KIND.DIGITS, length: 6, max: 14, group: 4 }),
                  field({ name: 'pin', label: 'ATM PIN', kind: FIELD_KIND.SECRET, length: 4 }),
                  field({ name: 'otp', label: 'One-time code', kind: FIELD_KIND.DIGITS, length: 6 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
          },
        },
      },

      /** The learner's own banking app - the thing the message is trying to keep them out of. */
      bankapp: {
        kind: SURFACE.APP,
        appName: 'UnionX Bank',
        appTagline: 'Your accounts',
        hero: {
          label: 'Account xx4417',
          value: 'Active — no block',
          caption: 'No restriction, no pending action and no KYC request on this account.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's01-app-kyc',
            heading: 'KYC status',
            rows: [
              { label: 'Status', value: 'Complete' },
              { label: 'Next review', value: 'March 2028' },
              { label: 'Pending requests', value: 'None' },
            ],
            note: 'A KYC request would appear here first, with a deadline in weeks, not minutes.',
          },
          {
            id: 's01-app-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${bankHeader} only` },
              { label: 'We never ask for', value: 'Your PIN, your one-time code or your full account number' },
              { label: 'Calls', value: `The number on your card — ${cardLine}` },
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
      bankcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'UnionX Bank (number on your card)',
        number: cardLine,
        script: [
          { at: 0, speaker: 'them', text: 'UnionX card services.' },
          { at: 3, speaker: 'them', text: 'There is no block on that account and no KYC request outstanding.' },
          { at: 8, speaker: 'them', text: 'We only text from our sender ID, and we never ask for a PIN or a one-time code.' },
          { at: 13, speaker: 'them', text: 'Please mark that message as spam and do not open the address.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's01-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's01-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what it is about' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's01-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's01-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's01-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's01-c06', slot: SLOT.INLINE, anchor: 's01-link',
            label: 'Open the address', targetId: browserAsset, opens: 'kyc',
          }),
          action({
            id: 's01-c07', slot: SLOT.SURFACE, on: 'kyc', page: 'form',
            label: 'Complete the re-verification', closes: true,
          }),
          action({
            id: 's01-c08', slot: SLOT.MENU, label: 'Leave it and open your banking app instead',
            opens: 'bankapp',
          }),
          action({
            id: 's01-c09', slot: SLOT.COMPOSER,
            label: 'Reply asking which account it is',
            echo: 'Which account is this about? I have not had any KYC notice.',
          }),
          navigate({ id: 's01-nav-page', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'kyc' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's01-c10', slot: SLOT.MENU, label: 'Open your banking app and check the account',
            hint: 'Blocks, KYC and how the bank contacts you', opens: 'bankapp',
          }),
          action({ id: 's01-c11', slot: SLOT.MENU, label: 'Call the bank on the number on your card', opens: 'bankcall' }),
          action({
            id: 's01-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 's01-c13', slot: SLOT.MENU, label: 'Reply to the text and ask them to confirm' }),
          action({ id: 's01-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's01-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's01-c16', slot: SLOT.INLINE, label: 'Report it as junk and leave the account alone' }),
          action({ id: 's01-c17', slot: SLOT.INLINE, label: 'Update the KYC before the deadline' }),
          action({ id: 's01-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's01-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's01-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's01-nav-app', slot: SLOT.MENU, label: 'Open your banking app', opens: 'bankapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's01-dir-bank',
        name: 'UnionX Bank — card services',
        identifier: cardLine,
        provenance: 'printed on your card',
        role: 'Confirms account status and KYC requests; the number is the one on the back of your card.',
      },
    ],
  }
}

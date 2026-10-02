import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, link, message, messageText, number, receivedAt, sender, sms, system,
} from './shared.js'

/**
 * S20 - Parcel Text Plus Callback (IMMERSIVE-013) - one number, two companies, and your own reply.
 *
 * At 10:43 a parcel is "on hold". At 10:50 the learner answered - "Which parcel? I am not expecting
 * anything" - and the phone shows that reply as **Delivered**. At 16:01 the SAME number writes again,
 * no longer a courier but a card-fraud desk, with a support line, a payment the learner never made,
 * and an app to install "before you call".
 *
 * S05 was the product's parcel text and it stopped at a fee page; E17, S02 and W24 are callback and
 * remote-support scams decided in a dial dialog, on a call or in a messenger. S20 is the multi-stage
 * version, and what carries it is what an SMS thread keeps and a messenger hides behind a profile:
 *
 * - **one thread per number**, so the change of story is on one screen, three hours apart;
 * - **the learner's own delivered reply** sitting between the two - the moment the number learned it
 *   reached a person who reads their texts;
 * - **the phone's own system dialogs** as the place the damage is done: the package installer for the
 *   "support" app, and the operating system's screen-share consent for the agent, which says in its
 *   own words that codes arriving while it runs will be visible.
 *
 * Calling the number is the cheaper mistake, taken on the number itself. Both releases are reachable
 * from the thread without calling - the app from its link, screen share from quick settings, as the
 * text instructs - so neither is hidden behind the call. The safe branch stops and opens the courier
 * app; the checks are the courier app, the bank app and the number on the card.
 *
 * Fictional throughout: ParcelNet, parcel TR-88412, Harbour Bank, card xx3308, RemoteHelp,
 * SUPPORT-7731 and every number describe nothing real. Nothing is installed, shared, dialled or paid.
 */
export function buildS20(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const installAsset = assetId(scenario, ASSET_KIND.INSTALL)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 50050'
  const at = receivedAt(scenario) ?? '16:01'
  const first = (senderInfo.display_name ?? 'Parcel address failed. Later').replace(/\.?\s*Later$/, '.')
  const support = '00000 67240'
  const cardLine = '+91 00000 58240'
  const parcel = 'TR-88412'
  const app = 'RemoteHelp'
  const device = 'SUPPORT-7731'

  return {
    scenarioId: 'S20',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Conversations you have replied to' },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's20-tx-1', from: 'AX-HRBRBK', time: '19 Sep', inert: true,
              preview: 'INR 640.00 spent on card xx3308 at FRESH MART. Not you? Use the Harbour Bank app.',
            },
          ],
        },
        {
          id: 'promotions', label: 'Promotions', heading: 'Promotions',
          rows: [
            {
              id: 's20-pr-1', from: 'AD-PRCLNT', time: '17 Sep', inert: true,
              preview: 'ParcelNet: send two parcels, get the third at half price this week.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's20-row', from, time: at, unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's20-bg-1', from: 'Neha', time: '12:20', inert: true,
          preview: 'Can you bring the charger back tomorrow?',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'You do not have this number saved. You replied to it once today.',
    },

    beats: [
      day('s20-day', 'Today'),
      message('s20-m1', {
        text: `${first} Parcel ${parcel} is on hold. Confirm your address within 24 hours or it is returned:`,
        time: '10:43', via: 'SIM 1',
      }),
      link('s20-addr', { shown: 'https://s20.training.example/addr', caption: 'Parcel address update' }),
      message('s20-me', {
        from: 'me', text: 'Which parcel? I am not expecting anything.', time: '10:50', via: 'Delivered',
      }),
      message('s20-m2', { text: messageText(scenario), time: at, via: 'SIM 1' }),
      message('s20-m3', {
        text: 'INR 24,999 was taken from your card when the parcel fee was paid. To stop it, call support now:',
        time: at, via: 'SIM 1',
      }),
      number('s20-number', { number: support, caption: 'Support line, in the text' }),
      message('s20-m4', {
        text: `Before you call, install ${app} so the agent can reverse it on your screen:`,
        time: '16:02', via: 'SIM 1',
      }),
      link('s20-rh', { shown: 'https://s20.training.example/rh', caption: `${app} — support app` }),
      message('s20-m5', {
        text: `When the agent asks, open Screen share from your quick settings and choose ${device}.`,
        time: '16:05', via: 'SIM 1', since: 'branch',
      }),
      system('s20-sys-called', `Call to ${support} ended`, { afterConsequence: 'simulated_call' }),
    ],

    surfaces: {
      /** Conversation details - one number, two stories, and the reply in between. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: '#', name: from, number: 'Mobile', note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: '10:43', value: `A courier: parcel ${parcel} on hold, address link` },
                  { label: '10:50', value: 'Your reply — delivered' },
                  { label: '16:01', value: 'A card desk: a payment, a support line, an app to install' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Speaks for', value: 'A courier in the morning, a bank in the afternoon', result: '2 stories' },
                  { label: 'Your reply', value: 'Told the sender this number is read by a person', result: 'active' },
                  { label: 'Asks you to install', value: `${app}, from a link in the text`, result: 'app' },
                ],
              },
              {
                type: 'note',
                text: 'A courier writes from its own sender ID and a bank from its own. Neither asks you to '
                  + 'install an app or share your screen.',
              },
            ],
          },
        },
      }),

      /** The phone's package installer, raised by the link. */
      helper: {
        kind: SURFACE.INSTALLER,
        title: 'Package installer',
        home: 'confirm',
        closeLabel: 'Close the installer',
        pages: {
          confirm: {
            style: 'dialog',
            app: { name: app, detail: 'From: s20.training.example', monogram: 'RH' },
            title: `Do you want to install ${app}?`,
            text: 'This app will be able to:',
            rows: [
              { label: 'Screen', value: 'See and control everything on your screen' },
              { label: 'Messages', value: 'Read your text messages, including codes' },
              { label: 'Accessibility', value: 'Tap and type for you' },
            ],
          },
        },
      },

      /** The operating system's own screen-share consent, opened from quick settings. */
      cast: {
        kind: SURFACE.INSTALLER,
        title: 'Screen share',
        home: 'share',
        closeLabel: 'Close screen share',
        inertNote: 'Simulated system dialog. Nothing on this phone can be shared from here.',
        pages: {
          share: {
            style: 'dialog',
            alert: true,
            app: { name: 'Screen share', detail: 'Quick settings', monogram: 'SS' },
            title: `Start sharing your screen with ${device}?`,
            text: `${device} will see everything on your screen while you share - your messages, `
              + 'notifications and any codes that arrive.',
            rows: [
              { label: 'Device', value: `${device} — not one of your devices` },
              { label: 'Stops', value: 'When you stop it from quick settings' },
            ],
          },
        },
      },

      /** Where the number in the text goes. */
      support: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Card support',
        number: support,
        script: [
          { at: 0, speaker: 'them', text: 'Card support, thank you for calling. I can see the INR 24,999.' },
          { at: 6, speaker: 'them', text: `Have you installed ${app}? I need to see your screen to reverse it.` },
          { at: 12, speaker: 'them', text: `Open Screen share and pick ${device}. If a code comes, leave it on screen.` },
        ],
      },

      /** The learner's own courier app. */
      courier: {
        kind: SURFACE.APP,
        appName: 'ParcelNet',
        appTagline: 'Your parcels',
        hero: {
          label: 'Parcels to your address',
          value: 'Nothing on the way',
          caption: `No parcel is booked to you and none is on hold. ${parcel} is not a ParcelNet number.`,
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's20-courier-how',
            heading: 'How ParcelNet contacts you',
            rows: [
              { label: 'Texts', value: 'From VM-PRCLNT, with the tracking number from this app' },
              { label: 'Fees', value: 'Shown here, never paid by a link' },
            ],
          },
        ],
        tabs: [
          { label: 'Parcels', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The learner's own bank app. */
      bankapp: {
        kind: SURFACE.APP,
        appName: 'Harbour Bank',
        appTagline: 'Card xx3308',
        hero: {
          label: 'Recent card payments',
          value: 'No payment of INR 24,999',
          caption: 'Last card payment: INR 640 at FRESH MART on 19 Sep. Nothing is pending.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's20-bank-how',
            heading: 'Disputes and reversals',
            rows: [
              { label: 'Raise one', value: 'Here, under Card → Dispute' },
              { label: 'Or call', value: `${cardLine}, on the back of your card` },
              { label: 'We never ask you to', value: 'Install an app or share your screen' },
            ],
          },
        ],
        tabs: [
          { label: 'Accounts', icon: 'home' },
          { label: 'Cards', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The bank, on the number printed on the card. */
      cardcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Harbour Bank (number on your card)',
        number: cardLine,
        script: [
          { at: 0, speaker: 'them', text: 'Harbour Bank cards.' },
          { at: 3, speaker: 'them', text: 'There is no payment of 24,999 on xx3308, and nothing pending.' },
          { at: 9, speaker: 'them', text: 'We never ask anyone to install an app or share a screen to reverse a payment.' },
          { at: 15, speaker: 'them', text: 'Report both texts as junk and block the number.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's20-c01', slot: SLOT.INLINE, label: 'Open the conversation' }),
          action({ id: 's20-c02', slot: SLOT.INLINE, label: `Call ${support} from the list` }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's20-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who this number has claimed to be today',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's20-c04', slot: SLOT.INLINE, anchor: 's20-me',
            label: 'Read back to the morning', hint: 'The first text and your reply',
            targetId: threadAsset, opens: 'details',
          }),
          action({ id: 's20-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's20-c06', slot: SLOT.INLINE, anchor: 's20-number',
            label: 'Call support', targetId: callAsset, opens: 'support',
          }),
          action({
            id: 's20-c07', slot: SLOT.SURFACE, on: 'helper', page: 'confirm',
            label: 'Install', targetId: installAsset, closes: true,
          }),
          action({
            id: 's20-c08', slot: SLOT.SURFACE, on: 'cast', page: 'share',
            label: 'Start sharing', closes: true,
          }),
          action({
            id: 's20-c09', slot: SLOT.MENU, label: 'Stop here and open the courier app yourself',
            opens: 'courier',
          }),
          navigate({
            id: 's20-nav-app', slot: SLOT.INLINE, anchor: 's20-rh', label: 'Open the address', opens: 'helper',
          }),
          navigate({
            id: 's20-nav-cast', slot: SLOT.MENU, label: 'Open Screen share from quick settings', opens: 'cast',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's20-c10', slot: SLOT.MENU, label: 'Open the courier app and look for the parcel',
            hint: 'Parcels booked to your address', opens: 'courier',
          }),
          action({
            id: 's20-c11', slot: SLOT.MENU, label: 'Open your bank app and check the card',
            hint: 'Recent card payments', opens: 'bankapp',
          }),
          action({
            id: 's20-c12', slot: SLOT.MENU, label: 'Call your bank on the number printed on your card',
            opens: 'cardcall',
          }),
          action({
            id: 's20-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's20-c14', slot: SLOT.MENU, label: `Call ${support} and ask for a reference number` }),
          action({ id: 's20-c15', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's20-c16', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's20-c17', slot: SLOT.INLINE, label: 'Report both texts as junk and install nothing' }),
          action({ id: 's20-c18', slot: SLOT.INLINE, label: 'Call support back and finish the reversal' }),
          action({ id: 's20-c19', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's20-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's20-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's20-nav-courier', slot: SLOT.MENU, label: 'Open the courier app', opens: 'courier', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's20-dir-card',
        name: 'Harbour Bank — cards',
        identifier: cardLine,
        provenance: 'printed on your card',
        role: 'Confirms payments and disputes on your card.',
      },
    ],
  }
}

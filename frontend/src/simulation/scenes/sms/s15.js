import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, attachment, directory, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S15 - Canteen Subsidy MMS QR (IMMERSIVE-012) - a picture message sent to a list you can read.
 *
 * A picture message in the canteen's colours: a service family subsidy of INR 2,000, first 200
 * families, scan today. I25 is the product's other canteen QR, and it lived inside an Instagram
 * reel, with an audio credit and a ₹49 activation sheet. S15 is built on what only a **group MMS**
 * shows: the Messages app lists everybody the message went to. Two of the twelve are colleagues the
 * learner has saved, which is exactly why it feels like a unit thing - and eight of the others are
 * **consecutive numbers**, 40011 to 40018, which is what a list looks like when someone types it in
 * order. Vikram has already asked, in his own thread, whether the learner got it too.
 *
 * The code never has to be scanned to be read. The phone's picture viewer finds it in the image and
 * states where it points before anything opens - a host that is not the canteen portal - and opening
 * it from there is the risky tap. The subsidy site then asks for the thing no canteen ever needs from
 * a message: the canteen card number **and its PIN**, to "link the card for the credit".
 *
 * Replying is priced too, because on a group MMS a reply is never private: it goes to the sender and
 * to all eleven others, pulling colleagues further into the thread. The check is the canteen app the
 * learner already uses, and the canteen office on the directory number; the genuine canteen writes
 * from its own sender ID and has never sent a picture or a code.
 *
 * Fictional throughout: Unit Falcon, its canteen, `VM-FALCNT`, the subsidy, the card and every host
 * and number describe nothing real. No image file exists (the viewer draws a tile and describes the
 * picture in words), no camera or scanner is touched, and what is typed on the drawn page stays on
 * the screen it is typed on.
 */
export function buildS15(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const qrAsset = assetId(scenario, ASSET_KIND.QR)
  const desk = directory(scenario)
  const qr = (scenario?.synthetic?.assets ?? []).find((item) => item.kind === ASSET_KIND.QR)?.content ?? {}
  const from = senderInfo.identifier ?? '+91 00000 46373'
  const decoded = qr.decoded_target ?? 'https://s15.training.example/qr'
  const host = 's15.training.example'
  const canteenHeader = 'VM-FALCNT'
  const canteenOffice = '+91 00000 34160'
  const run = Array.from({ length: 8 }, (_, index) => `+91 00000 400${11 + index}`)

  return {
    scenarioId: 'S15',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 2 },
        {
          id: 'service', label: 'Service', heading: 'Service messages',
          rows: [
            {
              id: 's15-sv-1', from: canteenHeader, time: '05 Sep', inert: true,
              preview: 'Canteen card xx4410 balance: INR 640. No reply needed.',
            },
            {
              id: 's15-sv-2', from: canteenHeader, time: '28 Aug', inert: true,
              preview: 'Canteen closed on Sunday for stock-taking. Timings unchanged otherwise.',
            },
            {
              id: 's15-sv-3', from: 'VM-FALCON', time: '02 Sep', inert: true,
              preview: 'Your pay slip for August is available in the unit portal. No reply needed.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's15-row', from: `${from} +11`, time: '17:16', unread: true,
          preview: `Picture message · ${messageText(scenario)}`,
        },
        {
          id: 's15-bg-1', from: 'Vikram', time: '17:21', inert: true,
          preview: 'Did you get that canteen subsidy picture too? Half the block has.',
        },
      ],
    },

    conversation: {
      title: `${from} +11`,
      subtitle: 'Group message · 12 people',
      detailsTo: 'details',
      spamBar: 'The sender is not in your contacts. Messages from unknown senders are not checked.',
    },

    beats: [
      system('s15-sys', 'Group message with 12 people. A reply goes to everyone in it.'),
      attachment('s15-mms', { fileName: 'subsidy_poster.jpg', fileKind: 'Picture message', size: '212 KB' }),
      message('s15-msg', { text: messageText(scenario), time: '17:16', via: 'SIM 1' }),
      message('s15-msg2', {
        text: 'Unit Falcon Canteen. First 200 families only. Scanning closes at 20:00.',
        time: '17:16', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - who else the picture went to. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Group details',
            blocks: [
              { type: 'identity', initials: '#', name: from, number: 'Started this group message', note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This message',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'People', value: 'You and 11 others' },
                  { label: 'Content', value: 'One picture and two lines of text' },
                  { label: 'Earlier messages from this number', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: `None — the canteen writes from ${canteenHeader}`, result: 'none' },
                  { label: 'Others on the message', value: '2 saved contacts, 9 unsaved numbers', result: '11' },
                  { label: 'Unsaved numbers in a row', value: '8, from 40011 to 40018', result: 'in order' },
                ],
              },
              {
                type: 'note',
                text: 'Eight numbers one after another is what a typed-in list looks like. Two colleagues '
                  + 'being on it says the list was long, not that the canteen wrote it.',
              },
            ],
            links: [
              { id: 's15-link-people', label: 'Show all 12 people', to: 'people' },
              { id: 's15-link-canteen', label: `Messages from ${canteenHeader}`, to: 'canteenthread' },
            ],
          },
          people: {
            title: 'People in this message',
            blocks: [
              {
                type: 'items',
                heading: '12 people',
                items: [
                  { label: 'You', meta: 'SIM 1', value: '+91 00000 10001' },
                  { label: from, meta: 'Sender', value: 'Not in your contacts' },
                  { label: 'Vikram', meta: 'Saved', value: 'Colleague' },
                  { label: 'Anjali', meta: 'Saved', value: 'Colleague' },
                  ...run.map((number) => ({ label: number, meta: 'Unsaved', value: 'Not in your contacts' })),
                ],
              },
            ],
          },
        },
      }),

      /** The canteen's own thread - no pictures, no codes. */
      canteenthread: sms({
        title: canteenHeader,
        home: 'thread',
        pages: {
          thread: {
            title: `Messages from ${canteenHeader}`,
            blocks: [
              {
                type: 'identity', initials: 'VM', name: canteenHeader,
                number: 'Sender ID — cannot receive replies', note: 'Registered canteen sender',
              },
              {
                type: 'items',
                heading: 'Unit Falcon Canteen, in this app',
                items: [
                  { label: canteenHeader, meta: '05 Sep', value: 'Canteen card xx4410 balance: INR 640. No reply needed.' },
                  { label: canteenHeader, meta: '28 Aug', value: 'Closed on Sunday for stock-taking.' },
                  { label: canteenHeader, meta: '11 Aug', value: 'New grocery stock in. Timings unchanged.' },
                ],
              },
              {
                type: 'note',
                text: 'Text only. No picture, no code and no address in any of them.',
              },
            ],
          },
        },
      }),

      /** The phone's picture viewer - it finds the code and says where it goes, opening nothing. */
      mms: {
        kind: SURFACE.VIEWER,
        title: 'Picture',
        art: 'qr',
        label: 'subsidy_poster.jpg',
        heading: 'Picture message',
        text: 'A poster in the canteen’s colours: “Service Family Subsidy — INR 2,000 — scan to '
          + 'activate — 200 families only.” A code fills the lower half.',
        rowsHeading: 'Code found in this picture',
        rows: [
          { label: 'Address', value: decoded },
          { label: 'Host', value: `${host} (not the canteen app or portal)` },
          { label: 'Canteen named', value: 'In the picture only' },
          { label: 'Found by', value: 'The picture viewer, without opening anything' },
        ],
        note: 'The canteen’s own messages have never carried a picture or a code.',
        inertNote: 'Read locally from the picture. No camera, no network, nothing opened.',
        backLabel: 'Close the picture',
      },

      /** The subsidy site - and the card PIN it wants. */
      subsidy: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'check',
        pages: {
          check: {
            title: 'Service Family Subsidy',
            host,
            url: decoded,
            blocks: [
              { type: 'brand', monogram: 'SF', name: 'Service Family Subsidy', tagline: 'Canteen benefit activation' },
              { type: 'heading', text: 'You are eligible for INR 2,000' },
              {
                type: 'summary',
                rows: [
                  { label: 'Benefit', value: 'INR 2,000 canteen credit', strong: true },
                  { label: 'Families left', value: '23 of 200' },
                  { label: 'Closes', value: 'Today, 20:00' },
                ],
              },
              {
                type: 'notice',
                text: 'Link your canteen card to receive the credit on it today.',
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No benefit exists.',
              },
            ],
            links: [
              { id: 's15-page-card', label: 'Link my canteen card', to: 'card' },
            ],
          },
          card: {
            title: 'Link your canteen card',
            host,
            url: `${decoded}/card`,
            blocks: [
              { type: 'brand', monogram: 'SF', name: 'Service Family Subsidy', tagline: 'Link your card' },
              { type: 'heading', text: 'Link the card for the INR 2,000 credit' },
              {
                type: 'form',
                title: 'Canteen card',
                fields: [
                  field({ name: 'card', label: 'Canteen card number', kind: FIELD_KIND.DIGITS, length: 10, group: 5 }),
                  field({ name: 'pin', label: 'Card PIN', kind: FIELD_KIND.SECRET, length: 4 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's15-page-check', label: 'Back to the benefit', to: 'check' },
            ],
          },
        },
      },

      /** The learner's own canteen app. */
      canteen: {
        kind: SURFACE.APP,
        appName: 'Canteen',
        appTagline: 'Unit Falcon Canteen · your card',
        hero: {
          label: 'Benefits this month',
          value: 'No subsidy running',
          caption: 'No family subsidy, credit or coupon scheme is open.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's15-app-card',
            heading: 'Your canteen card',
            rows: [
              { label: 'Card', value: 'xx4410' },
              { label: 'Balance', value: 'INR 640' },
              { label: 'PIN', value: 'Known only to you — never asked for by the canteen' },
            ],
          },
          {
            id: 's15-app-how',
            heading: 'How the canteen contacts you',
            rows: [
              { label: 'Texts', value: `From ${canteenHeader} only` },
              { label: 'Never sent', value: 'Pictures, codes or links' },
              { label: 'Benefits', value: 'Listed here first, and collected at the counter' },
            ],
          },
        ],
        tabs: [
          { label: 'Card', icon: 'home' },
          { label: 'Benefits', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The canteen office, on the number in the unit directory. */
      canteencall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit Falcon Canteen — office',
        number: canteenOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Canteen office, Unit Falcon.' },
          { at: 3, speaker: 'them', text: 'There is no subsidy like that. We have had calls about the same picture all afternoon.' },
          { at: 10, speaker: 'them', text: `We text only from ${canteenHeader}, never with a picture or a code, and nobody here will ever ask for a card PIN.` },
          { at: 18, speaker: 'them', text: 'Do not scan it and do not pass it on. Report it and tell unit security the canteen name is being used.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's15-c01', slot: SLOT.INLINE, label: 'Open the picture message' }),
          action({ id: 's15-c02', slot: SLOT.INLINE, label: 'Reply to everyone from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's15-c03', slot: SLOT.INLINE, anchor: 'header',
            label: `${from} and 11 others`, hint: 'Who sent it, and who else it went to',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's15-c04', slot: SLOT.INLINE, anchor: 's15-mms',
            label: 'Look at the picture', hint: 'What the code in it points to',
            targetId: qrAsset, opens: 'mms',
          }),
          action({ id: 's15-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's15-c06', slot: SLOT.SURFACE, on: 'mms',
            label: 'Open the address in the code', targetId: browserAsset, opens: 'subsidy',
          }),
          action({
            id: 's15-c07', slot: SLOT.SURFACE, on: 'subsidy', page: 'card',
            label: 'Link the card and activate INR 2,000', closes: true,
          }),
          action({
            id: 's15-c08', slot: SLOT.COMPOSER, label: 'Reply to everyone asking if it worked',
            echo: 'Has anyone activated theirs? Does it really credit the card?',
          }),
          action({
            id: 's15-c09', slot: SLOT.MENU, label: 'Leave it and open your canteen app instead',
            opens: 'canteen',
          }),
          navigate({
            id: 's15-nav-picture', slot: SLOT.INLINE, anchor: 's15-mms',
            label: 'View the picture', opens: 'mms',
          }),
          navigate({
            id: 's15-nav-page', slot: SLOT.MENU, label: 'Open the address from the picture in the browser',
            opens: 'subsidy',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's15-c10', slot: SLOT.MENU, label: 'Open your canteen app and check benefits',
            hint: 'Schemes open this month', opens: 'canteen',
          }),
          action({
            id: 's15-c11', slot: SLOT.MENU, label: 'Call the canteen office on the number in the unit directory',
            opens: 'canteencall',
          }),
          action({
            id: 's15-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's15-c13', slot: SLOT.MENU, label: 'Reply to the sender and ask which office sent it' }),
          action({ id: 's15-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's15-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's15-c16', slot: SLOT.INLINE, label: 'Report it and tell unit security the canteen name is being used' }),
          action({ id: 's15-c17', slot: SLOT.INLINE, label: 'Send it on to the family before the slots go' }),
          action({ id: 's15-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's15-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's15-nav-details', slot: SLOT.MENU, label: 'Group details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's15-nav-canteenmsg', slot: SLOT.MENU, label: `Messages from ${canteenHeader}`, opens: 'canteenthread', after: 'inspect' }),
      navigate({ id: 's15-nav-canteen', slot: SLOT.MENU, label: 'Open the canteen app', opens: 'canteen', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's15-dir-canteen',
        name: 'Unit Falcon Canteen — office',
        identifier: canteenOffice,
        provenance: 'unit approved directory',
        role: 'Confirms which benefits are running; the canteen never sends pictures or codes, or asks for a card PIN.',
      },
    ],
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, body, brand, browserPage, button, directory, mail, sender,
  steps, subjectLine, timer,
} from './shared.js'

/**
 * E04 - Customs Parcel Hold (IMMERSIVE-005).
 *
 * A courier-branded email says a parcel is held at customs and a small clearance fee must be
 * paid today, with a "Track & pay" button. The parcel is unexpected, the button opens a
 * look-alike tracking page, and the page ends at a payment sheet asking for card or UPI
 * details for a fee that a real courier never collects by emailed link. The decision is taken
 * on that payment sheet - or by declining it.
 *
 * The payment sheet only reveals its commit control once a PIN is entered, so there is no
 * "close without paying" control on it: its Back cancels. The verification route is the
 * courier's own app, opened independently, where the tracking number does not exist.
 */
export function buildE04(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const paymentAsset = asset(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'customs@rapidship-clearance.training.example'
  const trackUrl = browserAsset?.display_target ?? 'https://e04.training.example/verify'
  const trackHost = browserAsset?.content?.host ?? 'e04.training.example'
  const tracking = 'RS-441'

  return {
    scenarioId: 'E04',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'RapidShip Customs' },
    messageSender: { display_name: senderInfo.display_name ?? 'RapidShip Customs', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'promo', label: 'Promotions', heading: 'Promotions', rows: [], empty: 'Nothing here.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e04-row', from: 'RapidShip Customs', subject: subjectLine(scenario),
          preview: `Parcel ${tracking} is held for a customs clearance fee. Pay today to release…`,
          time: '18:22', unread: true,
        },
        {
          id: 'e04-bg-1', from: 'Canteen Committee', subject: 'Festival lunch menu',
          preview: 'Booking opens Monday.', time: '16:40', inert: true,
        },
        {
          id: 'e04-bg-2', from: 'Meera', subject: 'Re: weekend plan',
          preview: 'You: sounds good', time: 'Sat', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'RapidShip Customs',
      time: '18:22',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      brand('e04-brand', { monogram: 'RS', name: 'RapidShip Customs', tagline: 'Parcel clearance', color: '#7a4a12' }),
      body('e04-body', {
        greeting: 'Dear customer,',
        paragraphs: [
          `Parcel ${tracking} could not be delivered and is held at customs pending a small `
          + 'clearance fee. To release it, pay the fee within 24 hours using the button below.',
          'Unpaid parcels are returned to sender.',
        ],
        signature: ['RapidShip Customs Team'],
        footer: `Tracking: ${tracking}. Do not reply to this automated address.`,
      }),
      steps('e04-steps', {
        steps: [
          { label: 'Collected', detail: 'Origin depot' },
          { label: 'In transit', detail: 'International' },
          { label: 'Held at customs', detail: 'Clearance fee due' },
          { label: 'Out for delivery', detail: 'After payment' },
        ],
        done: 2,
      }),
      timer('e04-timer', { label: 'Release window', value: '23h 41m left' }),
      button('e04-cta', { label: 'Track & pay clearance', caption: `${trackHost}/track` }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'RapidShip Customs', address: fromAddress, note: 'Not a saved courier contact' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `RapidShip Customs <${fromAddress}>` },
                  { label: 'Reply-To', value: 'no-reply@rapidship-clearance.training.example' },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Tracking', value: `${tracking} (not requested)` },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Parcel', value: 'You were not expecting a delivery', result: 'new' },
                  { label: 'Button target', value: trackHost, result: 'lookalike' },
                  { label: 'Fee', value: 'Collected on a linked page', result: 'caution' },
                ],
              },
              { type: 'note', text: 'The button opens a look-alike page, not the courier’s own site.' },
            ],
            links: [{ id: 'e04-link-target', label: 'Where does the button go?', to: 'targets' }],
          },
          targets: {
            title: 'Links in this message',
            blocks: [
              {
                type: 'items',
                heading: 'Buttons and links',
                items: [
                  { label: 'Track & pay clearance', value: trackUrl },
                  { label: 'Text shown', value: 'RapidShip tracking' },
                ],
                empty: 'No links.',
              },
            ],
          },
        },
      }),

      tracking: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'track',
        pages: {
          track: {
            url: trackUrl,
            host: trackHost,
            title: 'Parcel tracking',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'RS', name: 'RapidShip Tracking', tagline: 'Customs clearance' },
              { type: 'heading', text: `Parcel ${tracking} is held` },
              { type: 'summary', rows: [
                { label: 'Status', value: 'Held at customs', strong: true },
                { label: 'Clearance fee', value: 'INR 85.00' },
                { label: 'Release by', value: 'Today' },
              ] },
              { type: 'notice', text: 'Pay the clearance fee to release your parcel.' },
            ],
            links: [{ id: 'e04-track-pay', label: 'Pay the clearance fee', to: 'paysheet' }],
          },
        },
      },

      paysheet: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay clearance fee',
        app: 'UPI',
        amount: 'INR 85.00',
        subtitle: `Clearance for ${tracking}`,
        rows: [
          { label: 'Paying to', value: 'RapidShip Clearance' },
          { label: 'UPI ID', value: 'clearance@rapidship.training.example' },
          { label: 'Reference', value: paymentAsset?.content?.reference ?? 'TRAIN-E04' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'A clearance fee cannot be reversed once paid.',
      },

      courier: {
        kind: SURFACE.APP,
        appName: 'RapidShip app',
        appTagline: 'Your parcels',
        hero: { label: `Tracking ${tracking}`, value: 'Not found', caption: 'No parcel with this number.' },
        sections: [
          {
            id: 'e04-courier-rows',
            heading: 'Your shipments',
            rows: [
              { label: `Search ${tracking}`, value: 'No matching parcel on your account' },
              { label: 'Customs fees', value: 'RapidShip never collects fees by email link' },
            ],
            note: 'The courier’s own app is the place to check a parcel — this number is not here.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Parcels', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e04-c01', slot: SLOT.INLINE, label: 'Open the parcel email' }),
          action({ id: 'e04-c02', slot: SLOT.INLINE, label: 'Reply from the list asking about the parcel' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e04-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'RapidShip Customs', hint: 'Sender, tracking and the button target',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e04-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e04-c05', slot: SLOT.MENU, label: 'Skip ahead to the tracking button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e04-c06', slot: SLOT.INLINE, anchor: 'e04-cta',
            label: 'Track & pay clearance', opens: 'tracking', targetId: browserAsset?.asset_id ?? null,
          }),
          action({
            id: 'e04-c07', slot: SLOT.SURFACE, on: 'paysheet',
            label: 'Pay the clearance fee', targetId: paymentAsset?.asset_id ?? null, closes: true,
          }),
          action({ id: 'e04-c08', slot: SLOT.SURFACE, on: 'tracking', label: 'Close the tracking page', closes: true }),
          action({ id: 'e04-c09', slot: SLOT.MENU, label: 'Leave it — I’m not expecting a parcel' }),
          navigate({ id: 'e04-nav-track', slot: SLOT.MENU, label: 'Open the tracking link', opens: 'tracking' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e04-c10', slot: SLOT.MENU, label: 'Open the RapidShip app and search the number',
            hint: 'Check the parcel yourself', opens: 'courier',
          }),
          action({
            id: 'e04-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the courier desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e04-c12', slot: SLOT.MENU, label: 'Reply to the sender to ask for details' }),
          action({ id: 'e04-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e04-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e04-c15', slot: SLOT.INLINE, label: 'Report and keep it as evidence' }),
          action({ id: 'e04-c16', slot: SLOT.INLINE, label: 'Pay the fee to release the parcel' }),
          action({ id: 'e04-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e04-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e04-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e04-nav-courier', slot: SLOT.MENU, label: 'Open the RapidShip app', opens: 'courier', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e04-dir-desk',
        name: 'Unit Falcon Mail Room',
        identifier: desk.identifier || '+91 00000 81585',
        provenance: 'local approved directory',
        role: 'Handles incoming parcels; couriers are tracked in their own app, not by an emailed fee link.',
      },
    ],
  }
}

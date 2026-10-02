import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S05 - Parcel Address Fee (IMMERSIVE-010) - twenty rupees, and what is underneath it.
 *
 * "Parcel paused - confirm address and pay INR 20 within 6 hours." The amount is the point: it is
 * too small to argue with, too small to check, and small enough that paying it feels cheaper than
 * thinking about it. And the learner really is expecting a parcel, which is the coincidence the
 * sender is counting on rather than arranging.
 *
 * Two SMS-native things carry this scene. The first is the sender NAME: "Parcel paused" is an
 * alphanumeric name, not a registered header, and anyone can put one on a message - the details
 * screen shows the ordinary mobile number underneath it. The second is what the twenty rupees
 * actually is. The address form harvests a full name, address and phone; the payment that follows
 * is not a payment at all but an **autopay mandate** whose own small print, on the sheet, reads
 * "up to INR 20,000 per month until cancelled". Confirming it is the scene's second release, and
 * the sheet's Cancel sits beside it.
 *
 * The check is the courier app the learner already has, where the parcel they are actually waiting
 * for is out for delivery, with no fee and a different tracking number. Fictional throughout: the
 * courier, the parcel, the mandate and every host and number describe nothing real; no money moves
 * and what is typed stays on the screen it is typed on.
 */
export function buildS05(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const shownName = senderInfo.display_name ?? 'Parcel paused'
  const behind = senderInfo.identifier ?? '+91 00000 98499'
  const shortLink = 'redeliver.training.example'
  const target = page?.display_target ?? 'https://s05.training.example/verify'
  const courierHeader = 'VM-QPARCL'
  const realTracking = 'QP-77-441902'
  const claimed = 'QP-90-118377'
  const courierLine = '+91 00000 61140'

  return {
    scenarioId: 'S05',
    platform: 'sms',
    notify: { sender: shownName },
    messageSender: { display_name: shownName, identifier: behind },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 2 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's05-tx-1', from: courierHeader, time: '08:05', inert: true,
              preview: `Shipment ${realTracking} is out for delivery today. Track it in the QuickParcel app.`,
            },
            {
              id: 's05-tx-2', from: courierHeader, time: 'Yesterday', inert: true,
              preview: `Shipment ${realTracking} has reached the city hub.`,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's05-row', from: shownName, time: '15:13', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's05-bg-1', from: 'Rohit', time: '14:20', inert: true,
          preview: 'Are you in this evening? I can drop the book off.',
        },
      ],
    },

    conversation: {
      title: shownName,
      subtitle: `${behind} · not in your contacts`,
      detailsTo: 'details',
      spamBar: 'This sender set its own name. The number underneath it is not in your contacts.',
    },

    beats: [
      system('s05-sys', 'Sent from a number that is not in your contacts.'),
      message('s05-msg', {
        text: `Your parcel is paused at the sorting centre: ${messageText(scenario)}`,
        time: '15:13', via: 'SIM 1',
      }),
      message('s05-msg2', {
        text: `Tracking ${claimed}. Unclaimed parcels are returned to sender after 6 hours.`,
        time: '15:13',
      }),
      link('s05-link', {
        shown: shortLink,
        caption: 'Tap to see where this address goes before opening it.',
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
                type: 'identity', initials: 'PP', name: shownName, number: behind,
                note: 'The name was set by the sender — the number is not in your contacts',
              },
              {
                type: 'rows',
                heading: 'In this message',
                rows: [
                  { label: 'Tracking quoted', value: claimed },
                  { label: 'Your shipment', value: realTracking },
                  { label: 'Fee asked for', value: 'INR 20' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ordinary mobile with a display name', result: 'mobile' },
                  { label: 'Registered sender ID', value: `None — your courier uses ${courierHeader}`, result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                ],
              },
              {
                type: 'note',
                text: 'A name on a text is typed by whoever sends it. The number underneath is the only part '
                  + 'the network assigns.',
              },
            ],
            links: [{ id: 's05-link-target', label: 'Where does this address go?', to: 'linkinfo' }],
          },
        },
      }),

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
                  { label: 'Host', value: 's05.training.example' },
                  { label: 'Your courier', value: 'quickparcel.training.example' },
                  { label: 'Registered', value: '4 days ago' },
                ],
              },
              { type: 'note', text: 'The courier app you already have is on a different host.' },
            ],
          },
        },
      }),

      /** Where the address goes: an address form, and then the mandate dressed as a fee. */
      redeliver: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'address',
        pages: {
          address: {
            title: 'Confirm your delivery address',
            host: 's05.training.example',
            url: target,
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'Parcel redelivery', tagline: 'Address confirmation' },
              { type: 'heading', text: `Shipment ${claimed} is on hold` },
              {
                type: 'text',
                text: 'Confirm where the parcel should go and settle the INR 20 redelivery charge to release it.',
              },
              {
                type: 'form',
                title: 'Delivery address',
                fields: [
                  field({ name: 'name', label: 'Full name', kind: FIELD_KIND.TEXT, length: 3, max: 32 }),
                  field({ name: 'address', label: 'House and street', kind: FIELD_KIND.TEXT, length: 6, max: 48 }),
                  field({ name: 'phone', label: 'Contact number', kind: FIELD_KIND.DIGITS, length: 10, group: 5 }),
                ],
              },
              { type: 'fineprint', text: 'Nothing typed on this page is sent anywhere.' },
            ],
            links: [{ id: 's05-link-pay', label: 'Continue to the INR 20 charge', to: 'fee' }],
          },
          fee: {
            title: 'Redelivery charge',
            host: 's05.training.example',
            url: `${target}/fee`,
            final: true,
            blocks: [
              { type: 'heading', text: 'INR 20 redelivery charge' },
              {
                type: 'summary',
                rows: [
                  { label: 'Charge today', value: 'INR 20' },
                  { label: 'Shipment', value: claimed },
                  { label: 'Method', value: 'UPI autopay mandate' },
                ],
              },
              {
                type: 'notice',
                text: 'Approving sets up a recurring mandate. The sheet on your phone shows what it covers.',
              },
            ],
          },
        },
      },

      /** The mandate, on the phone's own payment sheet. The small print is the decision. */
      mandate: {
        kind: SURFACE.PAYSHEET,
        title: 'Approve mandate',
        app: 'Payments',
        amount: 'INR 20.00',
        subtitle: 'Today, then as presented',
        rows: [
          { label: 'To', value: 'QP REDELIVERY SERVICES' },
          { label: 'Charged today', value: 'INR 20.00' },
          { label: 'Mandate limit', value: 'Up to INR 20,000 per month' },
          { label: 'Runs until', value: 'Cancelled by you' },
          { label: 'Reference', value: claimed },
        ],
        form: {
          title: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The PIN stays on this screen. It is not stored, sent or read by anything.',
      },

      /** The courier app the learner already has. */
      courier: {
        kind: SURFACE.APP,
        appName: 'QuickParcel',
        appTagline: 'Your shipments',
        hero: {
          label: 'Out for delivery',
          value: realTracking,
          caption: 'Arriving today. No charge is due on this shipment.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's05-courier-rows',
            heading: 'Your shipments',
            rows: [
              { label: realTracking, value: 'Out for delivery · no fee due' },
              { label: claimed, value: 'No such shipment on this account' },
            ],
            note: 'A redelivery charge, if there ever were one, would appear against the shipment here.',
          },
          {
            id: 's05-courier-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${courierHeader}, quoting your tracking number` },
              { label: 'Charges', value: 'Collected in the app, never by a link in a text' },
            ],
          },
        ],
        tabs: [
          { label: 'Shipments', icon: 'home' },
          { label: 'Payments', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The courier's customer care, from the directory. */
      couriercall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'QuickParcel customer care (directory)',
        number: courierLine,
        script: [
          { at: 0, speaker: 'them', text: 'QuickParcel customer care.' },
          { at: 3, speaker: 'them', text: `${realTracking} is on the van and will be delivered today. Nothing is owed on it.` },
          { at: 10, speaker: 'them', text: `We have no shipment ${claimed}, and we never take a redelivery fee by a link.` },
          { at: 16, speaker: 'them', text: 'Please report that message as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's05-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's05-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask which parcel' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's05-c03', slot: SLOT.INLINE, anchor: 'header',
            label: shownName, hint: 'The name, and the number underneath it',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's05-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's05-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's05-c06', slot: SLOT.INLINE, anchor: 's05-link',
            label: 'Open the address', targetId: browserAsset, opens: 'redeliver',
          }),
          action({
            id: 's05-c07', slot: SLOT.SURFACE, on: 'redeliver', page: 'address',
            label: 'Confirm the delivery address', thenPage: 'fee',
          }),
          action({
            id: 's05-c08', slot: SLOT.SURFACE, on: 'mandate',
            label: 'Approve the mandate', targetId: paymentAsset, closes: true,
          }),
          action({ id: 's05-c09', slot: SLOT.SURFACE, on: 'mandate', label: 'Cancel the mandate', closes: true }),
          action({
            id: 's05-c10', slot: SLOT.MENU, label: 'Leave it and check your courier app instead',
            opens: 'courier',
          }),
          navigate({ id: 's05-nav-page', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'redeliver' }),
          navigate({ id: 's05-nav-sheet', slot: SLOT.MENU, label: 'Open the payment sheet', opens: 'mandate' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's05-c11', slot: SLOT.MENU, label: 'Open your courier app and look for the shipment',
            hint: 'Your tracking number, and anything owed', opens: 'courier',
          }),
          action({
            id: 's05-c12', slot: SLOT.MENU, label: 'Call the courier on the number in the directory',
            opens: 'couriercall',
          }),
          action({
            id: 's05-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 's05-c14', slot: SLOT.MENU, label: 'Reply to the text and ask which parcel it is' }),
          action({ id: 's05-c15', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's05-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's05-c17', slot: SLOT.INLINE, label: 'Report it as junk and wait for the real delivery' }),
          action({ id: 's05-c18', slot: SLOT.INLINE, label: 'Pay the INR 20 before the six hours run out' }),
          action({ id: 's05-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's05-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's05-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's05-nav-courier', slot: SLOT.MENU, label: 'Open your courier app', opens: 'courier', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's05-dir-courier',
        name: 'QuickParcel — customer care',
        identifier: courierLine,
        provenance: 'local approved directory',
        role: 'Confirms shipments and anything owed on them; charges are collected in the app.',
      },
    ],
  }
}

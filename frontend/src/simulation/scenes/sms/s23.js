import {
  FIELD_KIND, SLOT, SURFACE, action, field, navigate,
} from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  amount, assetId, day, directory, message, messageText, receivedAt, sender, sms,
} from './shared.js'

/**
 * S23 - UPI Refund Collect Request (IMMERSIVE-014) - read the direction, not the story.
 *
 * A text from an ordinary mobile says a ShopKart refund of INR 2,499 is ready, and that to receive
 * it the learner must accept a collect request and enter their UPI PIN. Seconds later the phone's
 * TrainPay notification says exactly what that request is: somebody is asking the learner to PAY
 * INR 2,499. The story says money is coming in; every screen the phone draws says money is going
 * out.
 *
 * W04's collect request was a friend's emergency on WhatsApp, decided on a payment card in the chat.
 * S23 is a refund, and the whole lesson is **direction**:
 *
 * - **The text's own amount card** says "Refund" and names an order the learner never placed.
 * - **The payment app's notification** (a system dialog over the Messages app) says "is requesting",
 *   with Decline beside Pay - the safe branch is taken right there, in the notification.
 * - **The collect screen** says PAY, from the learner's account, to a desk that is not ShopKart, and
 *   asks for the PIN that only ever approves a debit. Entering it is the release.
 *
 * A reply to the text is the cheaper mistake: it tells the sender the number is read by a person
 * who is ready to be walked through it.
 *
 * Fictional throughout: ShopKart, TrainPay, `skrefund.desk@trainpay`, order SK-58213, account xx4417
 * and every number describe nothing real. No PIN is kept, no request exists, no money moves.
 */
export function buildS23(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 93599'
  const at = receivedAt(scenario) ?? '17:19'
  const sum = messageText(scenario).match(/INR ([\d,]+)/)?.[1] ?? '2,499'
  const payee = 'SK REFUND DESK'
  const vpa = 'skrefund.desk@trainpay'
  const order = 'SK-58213'
  const account = 'xx4417'
  const shopHeader = 'VM-SHPKRT'

  return {
    scenarioId: 'S23',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'all', label: 'All', heading: 'All conversations' },
        {
          id: 'payments', label: 'Payments', heading: 'Payments',
          rows: [
            {
              id: 's23-pay-1', from: 'VM-TRNPAY', time: '02 Sep', inert: true,
              preview: `INR 649.00 paid to SHOPKART from a/c ${account}. UPI ref 623118. -TrainPay`,
            },
          ],
        },
        {
          id: 'offers', label: 'Offers', heading: 'Offers',
          rows: [
            {
              id: 's23-of-1', from: 'AD-SHPKRT', time: 'Yesterday', inert: true,
              preview: 'ShopKart: festive week starts Friday. Up to 40% off home and kitchen.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        { id: 's23-row', from, time: at, unread: true, preview: messageText(scenario) },
        {
          id: 's23-bg-1', from: shopHeader, time: '04 Sep', inert: true,
          preview: 'ShopKart: order SK-51820 delivered. Rate your purchase in the app.',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'This number is not in your contacts. ShopKart has texted you before from VM-SHPKRT.',
    },

    beats: [
      day('s23-day', 'Today'),
      message('s23-msg', { text: messageText(scenario), time: at, via: 'SIM 1' }),
      amount('s23-amount', {
        amount: `INR ${sum}.00`,
        rows: [
          { label: 'Refund for', value: `Order ${order} (cancelled)` },
          { label: 'Request from', value: vpa },
          { label: 'Ready until', value: 'Today, 19:00' },
        ],
      }),
      message('s23-m2', {
        text: 'The request is already in your TrainPay app. Tap PAY and enter UPI PIN - the refund is credited '
          + 'at once. After 19:00 it goes back to the seller.',
        time: '17:20', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - a mobile number speaking for a shop that has its own header. */
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
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'First message', value: `Today, ${at}` },
                  { label: 'Messages', value: '2, and a payment card' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'ShopKart writes as', value: `${shopHeader}, a registered sender ID`, result: 'header' },
                  { label: 'Order named', value: `${order} — not in your ShopKart messages`, result: 'unknown' },
                  { label: 'Asks for', value: 'Your UPI PIN', result: 'PIN' },
                ],
              },
            ],
          },
        },
      }),

      /** Request details - what a collect request is, as the phone's payment app puts it. */
      reqinfo: sms({
        title: 'Payment card',
        home: 'card',
        pages: {
          card: {
            title: 'Payment card details',
            blocks: [
              {
                type: 'rows',
                heading: 'What the card in the text points to',
                rows: [
                  { label: 'Type', value: 'UPI collect request' },
                  { label: 'Raised by', value: `${vpa} (${payee})` },
                  { label: 'Paid by', value: `You, from a/c ${account}, if you approve it` },
                  { label: 'Amount', value: `INR ${sum}.00` },
                ],
              },
              {
                type: 'note',
                text: 'A collect request asks you to pay. Money you receive needs no approval and no PIN.',
              },
            ],
          },
        },
      }),

      /** TrainPay's notification, drawn over the Messages app. Decline sits beside Pay. */
      notif: {
        kind: SURFACE.INSTALLER,
        title: 'Notification',
        home: 'request',
        closeLabel: 'Close the notification',
        inertNote: 'Simulated notification. No request exists and no money can move.',
        pages: {
          request: {
            style: 'dialog',
            app: { name: 'TrainPay', detail: `Collect request · ${at}`, monogram: 'TP' },
            title: `${payee} is requesting INR ${sum}.00`,
            text: 'Approving this request sends money from your account.',
            rows: [
              { label: 'From', value: vpa },
              { label: 'You', value: `Pay INR ${sum}.00 from a/c ${account}` },
              { label: 'Note on request', value: `Refund for ${order}` },
            ],
            links: [{ id: 's23-link-pay', label: 'Pay', to: 'collect' }],
          },
        },
      },

      /** The collect screen - PAY, the amount, and the PIN that approves a debit. */
      collect: {
        kind: SURFACE.PAYSHEET,
        title: 'TrainPay',
        app: 'Pay request',
        amount: `INR ${sum}.00`,
        subtitle: `PAY to ${payee}`,
        rows: [
          { label: 'To', value: payee },
          { label: 'UPI ID', value: vpa },
          { label: 'From', value: `Savings a/c ${account}` },
          { label: 'Direction', value: 'Money leaves your account' },
          { label: 'Note', value: `Refund for ${order}` },
        ],
        form: {
          type: 'form',
          title: 'Approve this payment',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Your UPI PIN approves money leaving your account. It is never needed to receive money.',
      },

      /** The learner's own ShopKart app. */
      shopapp: {
        kind: SURFACE.APP,
        appName: 'ShopKart',
        appTagline: 'Your orders',
        hero: {
          label: 'Refunds',
          value: 'No refund pending',
          caption: `There is no order ${order}. Your last order, SK-51820 for INR 649, was delivered on 04 Sep.`,
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's23-shop-how',
            heading: 'How ShopKart refunds',
            rows: [
              { label: 'Where it goes', value: 'Back to the account you paid from, automatically' },
              { label: 'You approve', value: 'Nothing — no request, no PIN' },
              { label: 'Texts from us', value: `From ${shopHeader} only` },
            ],
          },
        ],
        tabs: [
          { label: 'Orders', icon: 'home' },
          { label: 'Refunds', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** TrainPay's own history, opened from the home screen. */
      payhistory: {
        kind: SURFACE.APP,
        appName: 'TrainPay',
        appTagline: `Savings a/c ${account}`,
        hero: {
          label: 'Money in, last 30 days',
          value: 'No refund credited or pending',
          caption: `One open item: a request from ${vpa} asking you to PAY INR ${sum}.00. Refunds appear here `
            + 'as money in, with nothing to approve.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's23-pay-rows',
            heading: 'Recent activity',
            rows: [
              { label: '02 Sep', value: 'Paid INR 649.00 to SHOPKART' },
              { label: 'Today, pending', value: `Request to PAY INR ${sum}.00 to ${payee}` },
            ],
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's23-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's23-c02', slot: SLOT.INLINE, label: 'Reply from the list: Yes, please refund' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's23-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how ShopKart usually writes',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's23-c04', slot: SLOT.INLINE, anchor: 's23-amount',
            label: 'Card details', hint: 'Who is paying whom',
            targetId: threadAsset, opens: 'reqinfo',
          }),
          action({ id: 's23-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's23-c06', slot: SLOT.COMPOSER, label: 'I accepted. When will it arrive?',
          }),
          action({
            id: 's23-c07', slot: SLOT.SURFACE, on: 'notif', page: 'request',
            label: 'Decline', closes: true,
          }),
          action({
            id: 's23-c08', slot: SLOT.SURFACE, on: 'collect',
            label: `Pay INR ${sum}`, targetId: paymentAsset, closes: 'all',
          }),
          navigate({
            id: 's23-nav-notif', slot: SLOT.INLINE, anchor: 's23-amount', label: 'Open in TrainPay', opens: 'notif',
          }),
          navigate({
            id: 's23-nav-notif-menu', slot: SLOT.MENU, label: 'Open the TrainPay notification', opens: 'notif',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's23-c09', slot: SLOT.MENU, label: 'Open the ShopKart app and look for the order and refund',
            hint: 'Orders and refunds', opens: 'shopapp',
          }),
          action({
            id: 's23-c10', slot: SLOT.MENU, label: 'Open TrainPay from the home screen and read the history',
            hint: 'Money in and requests', opens: 'payhistory',
          }),
          action({
            id: 's23-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's23-c12', slot: SLOT.MENU, label: 'Call the number that sent the refund text' }),
          action({ id: 's23-c13', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's23-c14', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's23-c15', slot: SLOT.INLINE, label: 'Report the text as junk and approve nothing from this sender' }),
          action({ id: 's23-c16', slot: SLOT.INLINE, label: 'Approve it before 19:00 so the refund is not lost' }),
          action({ id: 's23-c17', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's23-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's23-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's23-nav-shop', slot: SLOT.MENU, label: 'Open the ShopKart app', opens: 'shopapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's23-dir-shop',
        name: 'ShopKart — customer care',
        identifier: '+91 00000 57310',
        provenance: 'listed in the ShopKart app',
        role: 'Confirms orders and refunds. Never raises a collect request.',
      },
    ],
  }
}

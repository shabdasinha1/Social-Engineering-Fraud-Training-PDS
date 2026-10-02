import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  amount, assetId, day, directory, message, messageText, sender, sms,
} from './shared.js'

/**
 * S07 - Expected Recharge Confirmation (IMMERSIVE-011) - the legitimate one, and the trap is the
 * learner's own reaction.
 *
 * INR 299 was recharged on xx7710 fifteen seconds ago, from the provider's own app, by the learner.
 * The receipt is what a receipt should be: a registered sender ID, a masked account, the exact
 * amount, the exact plan, and the sentence "No action required". Nothing in it to click, nobody to
 * ring, nothing to answer.
 *
 * S03 is the product's other matching-alert scene, and it prices **blocking the sender**. S07
 * prices something else entirely and something only a phone can teach: what a worried person does
 * next. The three costed moves here are **deleting the receipt** (the proof of a payment you may
 * need), **replying with the account number** to a sender ID that cannot receive replies, and -
 * the one that actually happens to people - **searching the web for a customer-care number and
 * ringing the first result**, which on this phone is a sponsored aggregator and not the provider.
 * The care number that is real is printed on the SIM pack and sits inside the provider's own app.
 *
 * Fictional throughout: TrainCell, `VM-TRNCEL`, the plan, the account, the aggregator listing and
 * every number and host describe nothing real, and nothing on any screen is typed or sent.
 */
export function buildS07(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const desk = directory(scenario)
  const header = 'VM-TRNCEL'
  const behind = senderInfo.identifier ?? '+91 00000 88047'
  const careLine = '+91 00000 44011'
  const aggregator = '+91 00000 51660'
  const account = 'xx7710'
  const reference = 'TC-2609-77104'

  return {
    scenarioId: 'S07',
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
              id: 's07-p-1', from: 'Anjali', time: '14:20', inert: true,
              preview: 'Did your pack get recharged? Mine ran out yesterday.',
            },
          ],
        },
        {
          id: 'spam', label: 'Spam', heading: 'Spam and blocked',
          rows: [
            {
              id: 's07-spam-1', from: '+91 00000 30712', time: '15:11', inert: true,
              preview: `Recharge FAILED for ${account}. Retry within 2 hours: retry-pack.training.example`,
            },
          ],
        },
      ],
      rows: [
        {
          id: 's07-row', from: header, time: '15:07', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's07-bg-1', from: 'BK-UNIONX', time: '09:14', inert: true,
          preview: 'INR 299 debited from a/c xx4417 to TRAINCELL RECHARGE. Not you? Call the number on your card.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Sender ID · TrainCell',
      detailsTo: 'details',
    },

    beats: [
      day('s07-day-old', 'Earlier this month'),
      message('s07-old-1', {
        text: 'Recharge of INR 299 successful for xx7710. Validity 28 days. No action required.',
        time: '18 Aug', via: 'SIM 1',
      }),
      message('s07-old-2', {
        text: 'Your daily data allowance for xx7710 is 1.5 GB. No action required.',
        time: '19 Aug', via: 'SIM 1',
      }),
      message('s07-old-3', {
        text: 'Pack for xx7710 expires in 3 days. Recharge in the TrainCell app.',
        time: '11 Sep', via: 'SIM 1',
      }),
      day('s07-day-today', 'Today'),
      amount('s07-amount', {
        amount: 'INR 299.00',
        rows: [
          { label: 'Account', value: account },
          { label: 'Plan', value: '28 days · unlimited calls · 1.5 GB a day' },
          { label: 'Paid by', value: 'TrainCell app · UPI' },
          { label: 'Reference', value: reference },
        ],
      }),
      message('s07-msg', { text: messageText(scenario), time: '15:07', via: 'SIM 1' }),
    ],

    surfaces: {
      /** What the Messages app can say about a registered sender ID. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              {
                type: 'identity', initials: 'VM', name: header,
                number: 'Sender ID — no number to reply to',
                note: 'Registered transactional sender',
              },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'First message', value: 'March 2025' },
                  { label: 'Messages', value: '61 — all from the same sender ID' },
                  { label: 'Account shown', value: `Masked — ${account}` },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered sender ID, six characters', result: 'header' },
                  { label: 'Gateway number behind it', value: behind, result: 'gateway' },
                  { label: 'In the message', value: 'No address, no attachment, no number to call', result: 'none' },
                  { label: 'Asks you to do anything', value: 'No', result: 'none' },
                ],
              },
              {
                type: 'note',
                text: 'A transactional sender ID cannot receive a reply. Anything typed into this '
                  + 'thread goes to a gateway that discards it.',
              },
            ],
            links: [
              { id: 's07-link-history', label: `Everything ${header} has sent you`, to: 'history' },
            ],
          },
        },
      }),

      /** A year of the same thread, in one screen. */
      history: sms({
        title: `Messages from ${header}`,
        home: 'history',
        pages: {
          history: {
            title: `Messages from ${header}`,
            blocks: [
              {
                type: 'items',
                heading: 'Your provider, in this app',
                items: [
                  { label: header, meta: '15:07', value: `Recharge INR 299 · ${account} · no action required` },
                  { label: header, meta: '11 Sep', value: `Pack expiring · ${account} · recharge in the app` },
                  { label: header, meta: '19 Aug', value: `Data allowance · ${account} · no action required` },
                  { label: header, meta: '18 Aug', value: `Recharge INR 299 · ${account} · no action required` },
                  { label: header, meta: '21 Jul', value: `Recharge INR 299 · ${account} · no action required` },
                ],
              },
              {
                type: 'note',
                text: 'Sixty-one messages, one sender ID, the same masked account, and not one '
                  + 'address or phone number in any of them.',
              },
            ],
          },
        },
      }),

      /** The learner's own provider app - where the recharge was made fifteen seconds earlier. */
      telecom: {
        kind: SURFACE.APP,
        appName: 'TrainCell',
        appTagline: `Account ${account}`,
        hero: {
          label: 'Current pack',
          value: 'Active — 28 days',
          caption: 'Recharged today at 15:06 from this app. Valid to 13 October.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's07-app-last',
            heading: 'Last recharge',
            rows: [
              { label: 'Amount', value: 'INR 299.00' },
              { label: 'Paid at', value: 'Today, 15:06' },
              { label: 'Method', value: 'UPI from this app' },
              { label: 'Reference', value: reference },
            ],
            note: 'The receipt in your messages should match this line on every field.',
          },
          {
            id: 's07-app-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${header} only` },
              { label: 'Care number', value: `Printed on your SIM pack — ${careLine}` },
              { label: 'We never ask for', value: 'Your account number, a PIN or a code by text' },
            ],
          },
        ],
        tabs: [
          { label: 'Pack', icon: 'home' },
          { label: 'Recharge', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** What a search for a care number actually returns on this phone. */
      search: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'results',
        pages: {
          results: {
            title: 'Search results',
            host: 'find.training.example',
            url: 'https://find.training.example/search',
            blocks: [
              { type: 'search', query: 'traincell customer care number' },
              {
                type: 'listing',
                badge: 'Sponsored',
                host: 'care-helpline-247.training.example',
                title: 'TrainCell Customer Care 24x7 — Instant Help Line',
                text: 'Recharge not credited? Talk to an executive now. All operators covered.',
                phone: aggregator,
              },
              {
                type: 'listing',
                badge: 'Sponsored',
                host: 'quick-recharge-support.training.example',
                title: 'All Operator Care Number — One Call Solution',
                text: 'Refunds, failed recharges and plan changes handled on the call.',
                phone: aggregator,
              },
              {
                type: 'notice',
                text: 'Results on this page are paid placements. The site does not check who owns a '
                  + 'number before printing it.',
              },
            ],
          },
        },
      },

      /** The provider, on the number printed on the SIM pack. */
      carecall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'TrainCell care (number on your SIM pack)',
        number: careLine,
        script: [
          { at: 0, speaker: 'them', text: 'TrainCell customer care.' },
          { at: 3, speaker: 'them', text: `Recharge of INR 299 on ${account} at 15:06 today, reference ${reference}. Credited.` },
          { at: 10, speaker: 'them', text: 'The receipt you received is ours. There is nothing to action on it.' },
          { at: 15, speaker: 'them', text: 'We only text from our sender ID, and it does not take replies.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's07-c01', slot: SLOT.INLINE, label: 'Open the receipt' }),
          action({ id: 's07-c02', slot: SLOT.INLINE, label: 'Reply from the list to query the charge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's07-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Sender ID, route and what the message carries',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's07-c04', slot: SLOT.MENU, label: 'Read the earlier receipts in this thread',
            hint: `Everything ${header} has sent`, targetId: threadAsset, opens: 'history',
          }),
          action({ id: 's07-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's07-c06', slot: SLOT.SURFACE, on: 'telecom',
            label: 'Match it against the recharge in your account', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 's07-c07', slot: SLOT.INLINE, anchor: 's07-amount',
            label: 'Delete the receipt from this thread',
          }),
          action({
            id: 's07-c08', slot: SLOT.COMPOSER, label: 'Reply with the account number to have it confirmed',
            echo: `Please confirm this recharge. Account ${account}, INR 299, reference ${reference}.`,
          }),
          action({
            id: 's07-c09', slot: SLOT.SURFACE, on: 'search', page: 'results',
            label: `Call ${aggregator}`, closes: true,
          }),
          navigate({
            id: 's07-nav-app', slot: SLOT.INLINE, anchor: 's07-amount',
            label: 'Open this recharge in your provider app', opens: 'telecom',
          }),
          navigate({
            id: 's07-nav-search', slot: SLOT.MENU,
            label: 'Search the web for the provider’s care number', opens: 'search',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's07-c10', slot: SLOT.MENU, label: 'Open your provider app and compare the recharge',
            hint: 'Amount, time, method and reference', opens: 'telecom',
          }),
          action({
            id: 's07-c11', slot: SLOT.MENU, label: 'Call the care number printed on your SIM pack',
            opens: 'carecall',
          }),
          action({
            id: 's07-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's07-c13', slot: SLOT.MENU, label: 'Reply to the sender ID and ask them to confirm' }),
          action({ id: 's07-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's07-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's07-c16', slot: SLOT.INLINE, label: 'Keep the receipt and carry on' }),
          action({ id: 's07-c17', slot: SLOT.INLINE, label: 'Report it as junk' }),
          action({ id: 's07-c18', slot: SLOT.MENU, label: 'Archive the receipt with your other bills' }),
          action({ id: 's07-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's07-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's07-nav-history', slot: SLOT.MENU, label: `Messages from ${header}`, opens: 'history', after: 'inspect' }),
      navigate({ id: 's07-nav-telecom', slot: SLOT.MENU, label: 'Open your provider app', opens: 'telecom', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's07-dir-care',
        name: 'TrainCell — customer care',
        identifier: careLine,
        provenance: 'printed on your SIM pack',
        role: 'Confirms recharges and pack changes; the number is the one on the SIM pack and in the app.',
      },
    ],
  }
}

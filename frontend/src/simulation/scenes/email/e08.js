import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, browserPage, button, directory, mail, sender, subjectLine, timer,
} from './shared.js'

/**
 * E08 - Instant Tax Refund (IMMERSIVE-006).
 *
 * A "Revenue Refund Centre" mail promises a small refund that "expires today" and pushes a
 * button to a form that harvests a PAN-like identity number, a card number and a one-time
 * code. It differs from the batch's other browser lures: it is not a login (E01) and not a
 * fee to pay (E04) - it is a refund form that collects identity and card data outright, driven
 * by greed plus an expiry deadline.
 *
 * The decision is taken on that form - filling it, replying with the details, or refusing.
 * The verification route is the official tax portal opened from a bookmark, where no refund
 * case exists. Everything is synthetic: the "Revenue Refund Centre", the amount and the hosts
 * describe nothing real, no money moves and no identity or card data leaves the component.
 */
export function buildE08(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'revenuerefundcentr@e08.training.example'
  const refundUrl = browserAsset?.display_target ?? 'https://e08.training.example/verify'
  const refundHost = browserAsset?.content?.host ?? 'e08.training.example'
  const amount = 'INR 7,840'

  return {
    scenarioId: 'E08',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Revenue Refund Centre' },
    messageSender: { display_name: senderInfo.display_name ?? 'Revenue Refund Centre', identifier: fromAddress },

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
          id: 'e08-row', from: 'Revenue Refund Centre', subject: subjectLine(scenario),
          preview: `${amount} refund expires today — complete release to receive it…`,
          time: '14:42', unread: true,
        },
        {
          id: 'e08-bg-1', from: 'Book Club', subject: 'September pick',
          preview: 'Voting closes Sunday.', time: '12:10', inert: true,
        },
        {
          id: 'e08-bg-2', from: 'Rohit', subject: 'Re: cricket',
          preview: 'You: I’m in for Saturday', time: 'Thu', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Revenue Refund Centre',
      time: '14:42',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      brand('e08-brand', { monogram: 'RR', name: 'Revenue Refund Centre', tagline: 'Refund processing', color: '#1f6a3c' }),
      body('e08-body', {
        greeting: 'Dear taxpayer,',
        paragraphs: [
          `Our records show a refund of ${amount} is available to you. This refund expires today `
          + 'and must be released using the button below.',
          'To release it, confirm your identity number, card and the one-time code we send.',
        ],
        signature: ['Revenue Refund Centre', 'Automated Refunds'],
        footer: 'Ref: RRC/GEN/0004. Do not share your one-time code.',
      }),
      timer('e08-timer', { label: 'Refund expires', value: 'Today, 23:59' }),
      button('e08-cta', { label: 'Release my refund now', caption: `${refundHost}/refund` }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Revenue Refund Centre', address: fromAddress, note: 'Not a saved contact' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Revenue Refund Centre <${fromAddress}>` },
                  { label: 'Reply-To', value: 'refunds@rrc-release.training.example' },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Reference', value: 'RRC/GEN/0004 (generic)' },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Refund', value: 'Unexpected, no case number', result: 'new' },
                  { label: 'Button target', value: refundHost, result: 'lookalike' },
                  { label: 'Data asked', value: 'Identity number, card and OTP', result: 'caution' },
                ],
              },
              { type: 'note', text: 'A refund does not need your card and a one-time code on a linked page.' },
            ],
            links: [{ id: 'e08-link-target', label: 'Where does the button go?', to: 'targets' }],
          },
          targets: {
            title: 'Links in this message',
            blocks: [
              {
                type: 'items',
                heading: 'Buttons and links',
                items: [
                  { label: 'Release my refund now', value: `${refundUrl}/refund` },
                  { label: 'Text shown', value: 'Official refund portal' },
                ],
                empty: 'No links.',
              },
            ],
          },
        },
      }),

      refund: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'landing',
        pages: {
          landing: {
            url: `${refundUrl}/refund`,
            host: refundHost,
            title: 'Refund release',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'RR', name: 'Refund Release Centre', tagline: 'Claim your refund' },
              { type: 'heading', text: `Release your ${amount} refund` },
              { type: 'summary', rows: [
                { label: 'Amount', value: amount, strong: true },
                { label: 'Expires', value: 'Today, 23:59' },
              ] },
              { type: 'notice', text: 'Confirm your details to release the refund.' },
            ],
            primary: { label: 'Continue', to: 'form' },
          },
          form: {
            url: `${refundUrl}/refund/details`,
            host: refundHost,
            title: 'Confirm details',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'RR', name: 'Confirm details', tagline: 'Identity and card' },
              {
                type: 'form',
                heading: 'Enter your details to release the refund',
                fields: [
                  field({ name: 'pan', label: 'Identity number', kind: FIELD_KIND.TEXT, length: 6, max: 10 }),
                  field({ name: 'card', label: 'Card number', kind: FIELD_KIND.DIGITS, length: 16, group: 4 }),
                  field({ name: 'otp', label: 'One-time code', kind: FIELD_KIND.DIGITS, length: 6, group: 3 }),
                ],
              },
              { type: 'fineprint', text: 'The refund is released once your details are confirmed.' },
            ],
            primary: { label: 'Release refund', to: 'confirm' },
          },
          confirm: {
            url: `${refundUrl}/refund/confirm`,
            host: refundHost,
            title: 'Confirm',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Submit your details?' },
              { type: 'notice', text: 'Your identity number, card and one-time code will be sent to release the refund.' },
            ],
          },
          done: {
            url: `${refundUrl}/refund/details`,
            host: refundHost,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Details submitted', text: 'Your refund request has been received.' },
            ],
          },
        },
      },

      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'portal',
        pages: {
          portal: {
            url: 'https://portal.tax.training.example',
            host: 'portal.tax.training.example',
            title: 'Tax portal',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'TX', name: 'Tax Portal', tagline: 'Your filed returns' },
              { type: 'heading', text: 'Refund status' },
              { type: 'summary', rows: [
                { label: 'Open refund cases', value: 'None', strong: true },
                { label: 'Last return', value: 'Processed — no refund due' },
              ] },
              { type: 'notice', text: 'Refunds are shown here when you open the portal yourself. There is no refund case for you.' },
            ],
          },
        },
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e08-c01', slot: SLOT.INLINE, label: 'Open the refund email' }),
          action({ id: 'e08-c02', slot: SLOT.INLINE, label: 'Reply from the list to claim it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e08-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Revenue Refund Centre', hint: 'Sender, reference and the button target',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e08-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e08-c05', slot: SLOT.MENU, label: 'Skip ahead to the refund button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e08-c06', slot: SLOT.INLINE, anchor: 'e08-cta',
            label: 'Release my refund now', opens: 'refund', targetId: browserAsset?.asset_id ?? null,
          }),
          action({
            id: 'e08-c07', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: fromAddress },
            label: 'Reply with my identity number and card', echo: 'Here are my details to release the refund.',
          }),
          action({
            id: 'e08-c08', slot: SLOT.SURFACE, on: 'refund', page: 'confirm',
            label: 'Release refund', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({ id: 'e08-c09', slot: SLOT.SURFACE, on: 'refund', label: 'Close the refund page', closes: true }),
          navigate({ id: 'e08-nav-refund', slot: SLOT.MENU, label: 'Open the refund link', opens: 'refund' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e08-c10', slot: SLOT.MENU, label: 'Open the tax portal from your bookmark',
            hint: 'Check your refund status yourself', opens: 'portal',
          }),
          action({
            id: 'e08-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e08-c12', slot: SLOT.MENU, label: 'Reply to the sender to ask if it is real' }),
          action({ id: 'e08-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e08-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e08-c15', slot: SLOT.INLINE, label: 'Report and delete it' }),
          action({ id: 'e08-c16', slot: SLOT.INLINE, label: 'Complete the refund release' }),
          action({ id: 'e08-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e08-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e08-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e08-nav-portal', slot: SLOT.MENU, label: 'Open the tax portal', opens: 'portal', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e08-dir-desk',
        name: 'Unit Falcon Support Desk',
        identifier: desk.identifier || '+91 00000 35734',
        provenance: 'local approved directory',
        role: 'Refund status is checked in the official tax portal; refunds are never released by an emailed link.',
      },
    ],
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sms, system,
} from './shared.js'

/**
 * S12 - Income-Tax Refund Form (IMMERSIVE-012) - a registered header is not a government one.
 *
 * INR 12,480, "approved", confirm the bank before 18:00. It is the product's second tax refund:
 * E08 made the same promise by email and was decided on its form. S12 is decided on something only
 * a phone shows, and it is the opposite lesson from S01.
 *
 * S01's tell was that a bank texted from an ordinary mobile. This text does not: it comes from a
 * **registered six-character sender ID**, `AX-ITRFND`, exactly the kind of sender the learner has
 * been taught to trust. What the phone also knows is the header's **category**. It is registered to
 * send *offers*, so the Messages app filed it under Offers, beside a pizza deal and a sale. The tax
 * department's own header, `VM-ITDEPT`, sits under Transactions in the Government category - and
 * its last message, three weeks ago, said the learner's return was processed and **no refund is
 * due**. The promise contradicts the sender who would actually make it.
 *
 * The attack surface is the phone's own link-details screen: the address is a short form, and the
 * screen that expands it is also where the app offers to open it. The refund site then asks for
 * identity and a bank account on one page and a card with a one-time code on the next, each linked
 * from the other so refusing the first does not hide the second.
 *
 * Fictional throughout: `AX-ITRFND`, `VM-ITDEPT`, the e-filing portal, the refund, the tax ID and
 * every host and number describe nothing real. Nothing is fetched, paid or submitted, and what is
 * typed on the drawn pages stays on the screen it is typed on.
 */
export function buildS12(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const header = 'AX-ITRFND'
  const taxHeader = 'VM-ITDEPT'
  const shortLink = 'tx-rf.training.example'
  const host = page?.content?.host ?? 's12.training.example'
  const target = `https://${host}/refund/claim`
  const helpline = '+91 00000 18500'

  return {
    scenarioId: 'S12',
    platform: 'sms',
    notify: { sender: header },
    messageSender: { display_name: header, identifier: header },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'offers', label: 'Offers', heading: 'Offers', count: 3 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's12-tx-1', from: taxHeader, time: '12 Aug', inert: true,
              preview: 'Your return for AY 2026-27 is processed. No refund is due. Details in the e-filing portal.',
            },
            {
              id: 's12-tx-2', from: 'BK-UNIONX', time: '10:02', inert: true,
              preview: 'INR 1,250 debited from a/c xx4417 at TRAINING FUEL. Not you? Call the number on your card.',
            },
            {
              id: 's12-tx-3', from: taxHeader, time: '22 Jul', inert: true,
              preview: 'Return for AY 2026-27 received. Acknowledgement ending 4471.',
            },
          ],
        },
        {
          id: 'personal', label: 'Personal', heading: 'Personal',
          rows: [
            {
              id: 's12-p-1', from: 'Ravi', time: '11:15', inert: true,
              preview: 'Did your refund ever come? Mine took four months last year.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's12-row', from: header, time: '12:54', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's12-bg-1', from: 'AD-PIZZAT', time: '12:10', inert: true,
          preview: 'Two medium pizzas for INR 399 today only. Order in the app.',
        },
        {
          id: 's12-bg-2', from: 'JM-STYLEX', time: 'Yesterday', inert: true,
          preview: 'End of season sale: up to 60% off. Shop now.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Business sender ID · Offers',
      detailsTo: 'details',
    },

    beats: [
      system('s12-sys', 'Filed under Offers by the Messages app.'),
      message('s12-msg', { text: messageText(scenario), time: '12:54', via: 'SIM 1' }),
      link('s12-link', {
        shown: shortLink,
        caption: 'Tap to see where this address goes before opening it.',
      }),
      message('s12-msg2', {
        text: 'Unconfirmed refunds are returned to the treasury at 18:00. Ref: REFUND/2026/APPROVED.',
        time: '12:55', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - a registered header, and the category it is registered in. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: 'AX', name: header, number: 'Business sender ID — cannot receive replies', note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'Filed under', value: 'Offers' },
                  { label: 'Messages', value: '2 — no earlier texts from this sender' },
                  { label: 'Return or PAN quoted', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered business sender ID', result: 'header' },
                  { label: 'Sender category', value: 'Promotional — registered to send offers', result: 'offers' },
                  { label: 'Tax department writes from', value: `${taxHeader}, category Government`, result: 'gov' },
                  { label: 'Link in the message', value: 'Shortened address', result: 'short' },
                ],
              },
              {
                type: 'note',
                text: 'A registered sender ID shows that somebody registered it. Its category shows '
                  + 'what they registered it to send.',
              },
            ],
            links: [
              { id: 's12-link-gov', label: `Messages from ${taxHeader}`, to: 'taxthread' },
              { id: 's12-link-target', label: 'Where does this address go?', to: 'linkinfo' },
            ],
          },
        },
      }),

      /** The tax department's own thread - which already answered the question. */
      taxthread: sms({
        title: taxHeader,
        home: 'thread',
        pages: {
          thread: {
            title: `Messages from ${taxHeader}`,
            blocks: [
              {
                type: 'identity', initials: 'VM', name: taxHeader,
                number: 'Business sender ID — cannot receive replies', note: 'Category: Government',
              },
              {
                type: 'items',
                heading: 'Filed under Transactions',
                items: [
                  { label: taxHeader, meta: '12 Aug', value: 'Your return for AY 2026-27 is processed. No refund is due. Details in the e-filing portal.' },
                  { label: taxHeader, meta: '22 Jul', value: 'Return for AY 2026-27 received. Acknowledgement ending 4471.' },
                  { label: taxHeader, meta: '14 Jun', value: 'Annual statement for FY 2025-26 is available in the e-filing portal.' },
                ],
              },
              {
                type: 'note',
                text: 'Three messages, none with an address in it and none asking for anything.',
              },
            ],
          },
        },
      }),

      /** The app's own link details - where the short form expands to, and where it can be opened. */
      linkinfo: sms({
        title: 'Link details',
        home: 'target',
        inertNote: 'Local link details. Nothing is fetched until you choose to open the address.',
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
                  { label: 'Host', value: host },
                  { label: 'Registered', value: '3 days ago' },
                  { label: 'Certificate', value: `Valid for ${host}` },
                  { label: 'Tax department’s site', value: 'No — the e-filing portal is a different host' },
                ],
              },
              {
                type: 'note',
                text: 'The short form hides the host until it is expanded here.',
              },
            ],
            links: [
              { id: 's12-link-load', label: 'Load the page in the browser', to: 'refund' },
            ],
          },
        },
      }),

      /** The refund site: identity and account on one page, card and code on the next. */
      refund: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Refund confirmation',
            host,
            url: target,
            blocks: [
              { type: 'brand', monogram: 'IT', name: 'Income Tax Refund Cell', tagline: 'Refund confirmation' },
              { type: 'heading', text: 'Refund of INR 12,480 approved' },
              {
                type: 'summary',
                rows: [
                  { label: 'Refund', value: 'INR 12,480', strong: true },
                  { label: 'Status', value: 'Awaiting bank confirmation' },
                  { label: 'Returns to treasury', value: 'Today, 18:00' },
                ],
              },
              {
                type: 'form',
                title: 'Confirm the refund account',
                fields: [
                  field({ name: 'name', label: 'Full name as on your tax ID', kind: FIELD_KIND.TEXT, length: 3, max: 40 }),
                  field({ name: 'taxid', label: 'Tax ID', kind: FIELD_KIND.TEXT, length: 10 }),
                  field({ name: 'account', label: 'Bank account number', kind: FIELD_KIND.DIGITS, length: 9, max: 16, group: 4 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's12-page-card', label: 'Receive the refund on a debit card instead', to: 'card' },
            ],
          },
          card: {
            title: 'Card confirmation',
            host,
            url: `${target}/card`,
            blocks: [
              { type: 'brand', monogram: 'IT', name: 'Income Tax Refund Cell', tagline: 'Card confirmation' },
              { type: 'heading', text: 'Confirm the card for INR 12,480' },
              {
                type: 'notice',
                text: 'Your bank will send a code to confirm the card. Enter it below to release the refund.',
              },
              {
                type: 'form',
                title: 'Card details',
                fields: [
                  field({ name: 'card', label: 'Card number', kind: FIELD_KIND.DIGITS, length: 16, group: 4 }),
                  field({ name: 'expiry', label: 'Expiry', kind: FIELD_KIND.EXPIRY, length: 4, placeholder: 'MM/YY' }),
                  field({ name: 'otp', label: 'Code sent by your bank', kind: FIELD_KIND.SECRET, length: 6 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No money can move and nothing typed '
                  + 'here is sent anywhere.',
              },
            ],
            links: [
              { id: 's12-page-form', label: 'Back to the refund account', to: 'form' },
            ],
          },
        },
      },

      /** The learner's own e-filing portal, from their bookmarks. */
      taxportal: {
        kind: SURFACE.APP,
        appName: 'e-Filing',
        appTagline: 'Your tax account',
        hero: {
          label: 'Refund status · AY 2026-27',
          value: 'No refund due',
          caption: 'Return processed on 12 August. Refund: nil. Demand: nil.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's12-app-status',
            heading: 'This year',
            rows: [
              { label: 'Return', value: 'Processed, 12 August' },
              { label: 'Refund determined', value: 'INR 0' },
              { label: 'Refund account', value: 'xx4417, pre-validated in March' },
            ],
            note: 'A refund, when there is one, is paid to the pre-validated account shown here.',
          },
          {
            id: 's12-app-how',
            heading: 'How the department contacts you',
            rows: [
              { label: 'Texts', value: `From ${taxHeader} only` },
              { label: 'Never asked for', value: 'A card number, a PIN or a code to pay a refund' },
              { label: 'Where to act', value: 'Inside this portal, never through a link in a message' },
            ],
          },
        ],
        tabs: [
          { label: 'Dashboard', icon: 'home' },
          { label: 'Returns', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The tax helpline, on the number in the directory. */
      taxcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Tax helpline — refunds',
        number: helpline,
        script: [
          { at: 0, speaker: 'them', text: 'Tax helpline, refunds.' },
          { at: 3, speaker: 'them', text: 'Your return for this year is processed with no refund due. Nothing was approved today.' },
          { at: 10, speaker: 'them', text: 'We only text from our own Government sender, and a refund never needs a card or a code.' },
          { at: 17, speaker: 'them', text: 'Do not open the link. Report the message as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's12-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's12-c02', slot: SLOT.INLINE, label: 'Open the address from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's12-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Who sent it, and what kind of sender it is',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's12-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's12-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's12-c06', slot: SLOT.SURFACE, on: 'linkinfo', page: 'target',
            label: 'Open the address', targetId: browserAsset, opens: 'refund',
          }),
          action({
            id: 's12-c07', slot: SLOT.SURFACE, on: 'refund', page: 'form',
            label: 'Confirm the refund account', thenPage: 'card',
          }),
          action({
            id: 's12-c08', slot: SLOT.SURFACE, on: 'refund', page: 'card',
            label: 'Release the refund with the code', closes: true,
          }),
          action({
            id: 's12-c09', slot: SLOT.MENU, label: 'Close it and open the e-filing portal yourself',
            opens: 'taxportal',
          }),
          navigate({
            id: 's12-nav-link', slot: SLOT.INLINE, anchor: 's12-link',
            label: 'See where this address goes', opens: 'linkinfo',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's12-c10', slot: SLOT.MENU, label: 'Open the e-filing portal from your bookmarks and check the refund',
            hint: 'Refund status for this year', opens: 'taxportal',
          }),
          action({
            id: 's12-c11', slot: SLOT.MENU, label: 'Call the tax helpline in the directory',
            opens: 'taxcall',
          }),
          action({
            id: 's12-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's12-c13', slot: SLOT.MENU, label: 'Open the address again and use its help chat' }),
          action({ id: 's12-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's12-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's12-c16', slot: SLOT.INLINE, label: 'Report it as junk and submit nothing' }),
          action({ id: 's12-c17', slot: SLOT.INLINE, label: 'Finish the refund form before 18:00' }),
          action({ id: 's12-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's12-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's12-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's12-nav-gov', slot: SLOT.MENU, label: `Messages from ${taxHeader}`, opens: 'taxthread', after: 'inspect' }),
      navigate({ id: 's12-nav-portal', slot: SLOT.MENU, label: 'Open the e-filing portal', opens: 'taxportal', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's12-dir-tax',
        name: 'Tax helpline — refunds',
        identifier: helpline,
        provenance: 'local approved directory',
        role: 'Confirms whether a refund has been determined; refunds are paid only to the pre-validated account.',
      },
    ],
  }
}

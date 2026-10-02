import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S04 - Unpaid E-Challan Link (IMMERSIVE-010) - the detail that does not match.
 *
 * A text says a traffic fine of INR 500 is pending and will go to court if it is not paid today.
 * It reads like a government notice, and it carries the one thing a government notice would carry:
 * a vehicle registration. That registration is the whole scene.
 *
 * Where S01's tell is the sender and S02's is what is missing, S04's is a **mismatch the learner
 * has to notice**: the challan quotes a number that is one character away from the learner's own,
 * and the link details screen shows the address resolving to a host that only looks official. The
 * official portal, opened by the learner from their own app list, finds no fine against either
 * registration - and lists the two notices they did receive last year, both of which arrived with
 * a challan number and a photograph reference this one does not have.
 *
 * The fake page asks for the vehicle, a card or UPI handle and a one-time code, in that order, so
 * the payment is only the last step of a data collection. Fictional throughout: the authority, the
 * challan, the registrations and every host describe nothing real, and what is typed on the drawn
 * page stays on the screen it is typed on.
 */
export function buildS04(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 77768'
  const shortLink = 'challan-pay.training.example'
  const target = page?.display_target ?? 'https://s04.training.example/verify'
  const quoted = 'TR 08 AB 4419'
  const mine = 'TR 08 AB 4419H'
  const helpline = '+91 00000 88121'

  return {
    scenarioId: 'S04',
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
              id: 's04-tx-1', from: 'TR-RTOGOV', time: '11 Nov 2025', inert: true,
              preview: `Challan TR/2025/884120 for ${mine} settled. Receipt in the transport portal.`,
            },
            {
              id: 's04-tx-2', from: 'TR-RTOGOV', time: '02 Nov 2025', inert: true,
              preview: `Challan TR/2025/884120 issued for ${mine}. Photograph on record. Pay in the transport portal.`,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's04-row', from, time: '19:09', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's04-bg-1', from: 'Meera', time: '18:15', inert: true,
          preview: 'Servicing is done, you can collect it tomorrow after 11.',
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
      system('s04-sys', 'Sent from a number that is not in your contacts.'),
      message('s04-msg', { text: messageText(scenario), time: '19:09', via: 'SIM 1' }),
      message('s04-msg2', {
        text: `Vehicle ${quoted}. Amount INR 500. Pay today to avoid court proceedings.`,
        time: '19:09',
      }),
      link('s04-link', {
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
              { type: 'identity', initials: '#', name: from, number: from, note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'In this message',
                rows: [
                  { label: 'Vehicle quoted', value: quoted },
                  { label: 'Your registration', value: mine },
                  { label: 'Challan number', value: 'None given' },
                  { label: 'Photograph reference', value: 'None given' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — the transport office uses TR-RTOGOV', result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                ],
              },
              {
                type: 'note',
                text: 'Last year’s two notices came from TR-RTOGOV and each carried a challan number and a '
                  + 'photograph reference.',
              },
            ],
            links: [{ id: 's04-link-target', label: 'Where does this address go?', to: 'linkinfo' }],
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
                  { label: 'Host', value: 's04.training.example' },
                  { label: 'Transport portal', value: 'transport.gov.training.example' },
                  { label: 'Registered', value: '11 days ago' },
                ],
              },
              {
                type: 'note',
                text: 'The portal you have used before is a different host, and it has been there for years.',
              },
            ],
          },
        },
      }),

      /** Where the address goes: vehicle, then a payment handle, then a code. */
      challan: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Pay your e-challan',
            host: 's04.training.example',
            url: target,
            blocks: [
              { type: 'brand', monogram: 'TR', name: 'Transport Challan', tagline: 'Online payment' },
              { type: 'heading', text: 'Pending challan — INR 500' },
              {
                type: 'summary',
                rows: [
                  { label: 'Vehicle', value: quoted },
                  { label: 'Amount', value: 'INR 500', strong: true },
                  { label: 'Pay before', value: 'Today, 23:59' },
                ],
              },
              {
                type: 'form',
                title: 'Confirm and pay',
                fields: [
                  field({ name: 'vehicle', label: 'Vehicle registration', kind: FIELD_KIND.TEXT, length: 6, max: 14 }),
                  field({ name: 'handle', label: 'Card number or UPI ID', kind: FIELD_KIND.TEXT, length: 6, max: 24 }),
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

      /** The transport portal the learner opens themselves. */
      portal: {
        kind: SURFACE.APP,
        appName: 'Transport portal',
        appTagline: 'Challans and vehicle records',
        hero: {
          label: `Challans for ${mine}`,
          value: 'None pending',
          caption: 'No challan is outstanding against this registration.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's04-portal-search',
            heading: 'Searches you just ran',
            rows: [
              { label: mine, value: 'No pending challan' },
              { label: quoted, value: 'No such registration on record' },
            ],
            note: 'A challan is raised against a registration that exists, with a number and a photograph.',
          },
          {
            id: 's04-portal-history',
            heading: 'Your history',
            rows: [
              { label: 'TR/2025/884120', value: 'Issued 02 Nov 2025 · paid 11 Nov 2025' },
              { label: 'How you were told', value: 'A text from TR-RTOGOV with the challan number' },
            ],
          },
        ],
        tabs: [
          { label: 'Challans', icon: 'home' },
          { label: 'Vehicles', icon: 'profile' },
          { label: 'Receipts', icon: 'history' },
        ],
      },

      /** The transport helpline, from the directory. */
      helpcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Transport office helpline (directory)',
        number: helpline,
        script: [
          { at: 0, speaker: 'them', text: 'Transport office, challan section.' },
          { at: 3, speaker: 'them', text: `There is nothing pending against ${mine}, and ${quoted} is not a registration we hold.` },
          { at: 10, speaker: 'them', text: 'We notify by text from our sender ID, with the challan number, and payment is only in the portal.' },
          { at: 16, speaker: 'them', text: 'Please report that message as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's04-c01', slot: SLOT.INLINE, label: 'Open the notice' }),
          action({ id: 's04-c02', slot: SLOT.INLINE, label: 'Reply from the list to dispute it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's04-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'The sender, and the registration it quotes',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's04-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's04-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's04-c06', slot: SLOT.INLINE, anchor: 's04-link',
            label: 'Open the address', targetId: browserAsset, opens: 'challan',
          }),
          action({
            id: 's04-c07', slot: SLOT.SURFACE, on: 'challan', page: 'form',
            label: 'Confirm and pay the challan', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 's04-c08', slot: SLOT.MENU, label: 'Call the number the text came from to query it',
          }),
          action({
            id: 's04-c09', slot: SLOT.MENU, label: 'Leave it and check the transport portal yourself',
            opens: 'portal',
          }),
          navigate({ id: 's04-nav-page', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'challan' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's04-c10', slot: SLOT.MENU, label: 'Search the transport portal for your registration',
            hint: 'Pending challans and your history', opens: 'portal',
          }),
          action({
            id: 's04-c11', slot: SLOT.MENU, label: 'Call the transport helpline from the directory',
            opens: 'helpcall',
          }),
          action({
            id: 's04-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 's04-c13', slot: SLOT.MENU, label: 'Reply to the text and ask for the challan number' }),
          action({ id: 's04-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's04-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's04-c16', slot: SLOT.INLINE, label: 'Report it as junk and keep the message' }),
          action({ id: 's04-c17', slot: SLOT.INLINE, label: 'Pay the challan before midnight' }),
          action({ id: 's04-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's04-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's04-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's04-nav-portal', slot: SLOT.MENU, label: 'Open the transport portal', opens: 'portal', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's04-dir-transport',
        name: 'Transport office — challan section',
        identifier: helpline,
        provenance: 'local approved directory',
        role: 'Confirms challans against a registration; notices go out from the office’s own sender ID.',
      },
    ],
  }
}

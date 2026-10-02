import {
  FIELD_KIND, SLOT, SURFACE, action, field, navigate,
} from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  asset, assetId, day, directory, link, message, messageText, number, receivedAt, sender, sms,
} from './shared.js'

/**
 * S24 - Fake Cybercrime Case Fee (IMMERSIVE-014) - four texts before breakfast.
 *
 * At 07:03 an ordinary mobile number writes "CYBER CASE NOTICE: pay a verification fee to avoid a
 * warrant; the case closes today". Within two minutes it adds a case number, a link to the "case
 * file", an "investigating officer" to call between ten and six, and an order that the matter is
 * confidential - that discussing it with family or an employer is itself an offence.
 *
 * W12 was the digital-arrest call that escalated on WhatsApp video; E20 was a legal summons in an
 * inbox that forbade asking anyone. S24 is the SMS opening of the same con, and it is decided on
 * what the phone lets the learner do with four texts at seven in the morning:
 *
 * - **a case portal with a countdown**, whose two ways out are a fee (the payment sheet) and an
 *   "upload for manual clearance" of an ID card and a bank passbook (the phone's own file picker) -
 *   both releases, both reached from the page without paying anything first;
 * - **a number card for "the officer"** - calling it is the cheaper mistake, taken on the text;
 * - **keeping the texts exactly as they are** - the safe branch, on the notice itself, because
 *   "preserve" is what the bank asks and a deleted thread cannot be reported.
 *
 * Verification is the office's own legal and security desk on the directory number, and the
 * reporting portal opened from the learner's bookmarks, where the case number does not exist.
 *
 * Fictional throughout: complaint CC/2026/0417, the Cyber Case Clearance site, the Cyber Reporting
 * Portal (training), `ccclear.2026@trainpay` and every number describe nothing real. Nothing is
 * paid, uploaded or dialled.
 */
export function buildS24(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const page = asset(scenario, ASSET_KIND.BROWSER)
  const target = page?.display_target ?? 'https://s24.training.example/verify'
  const host = page?.content?.host ?? 's24.training.example'
  const from = senderInfo.identifier ?? '+91 00000 97400'
  const label = senderInfo.display_name ?? 'CYBER CASE NOTICE'
  const at = receivedAt(scenario) ?? '07:03'
  const caseNo = 'CC/2026/0417'
  const officer = '00000 64510'
  const shortLink = 'https://cc-portal.training.example/c/0417'
  const legalDesk = '+91 00000 42260'
  const portalHost = 'reportcyber.training.example'

  return {
    scenarioId: 'S24',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox' },
        {
          id: 'government', label: 'Government', heading: 'Registered government senders',
          rows: [
            {
              id: 's24-gv-1', from: 'VM-GOVTRN', time: '28 Aug', inert: true,
              preview: 'Your address update request REF 55120 is complete. No further action is needed.',
            },
          ],
        },
        {
          id: 'bank', label: 'Bank', heading: 'Bank',
          rows: [
            {
              id: 's24-bk-1', from: 'AX-HRBRBK', time: 'Yesterday', inert: true,
              preview: 'INR 320.00 spent on card xx3308 at CITY CAFE. Not you? Use the Harbour Bank app.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        { id: 's24-row', from, time: at, unread: true, preview: `${label}: ${messageText(scenario)}` },
        {
          id: 's24-bg-1', from: 'Farah', time: 'Yesterday', inert: true,
          preview: 'See you at the bus stop at 8.',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'This number is not in your contacts. This is the first text from it.',
    },

    beats: [
      day('s24-day', 'Today'),
      message('s24-msg', { text: `${label}: ${messageText(scenario)}`, time: at, via: 'SIM 1' }),
      message('s24-m2', {
        text: `Complaint ${caseNo} names your mobile number. Pay the INR 9,800 verification fee today and the `
          + 'case is closed without arrest. View the case file:',
        time: at, via: 'SIM 1',
      }),
      link('s24-link', { shown: shortLink, caption: `Case file ${caseNo}` }),
      message('s24-m3', { text: 'Investigating officer, 10:00-18:00:', time: '07:04', via: 'SIM 1' }),
      number('s24-officer', { number: officer, caption: 'Officer’s number, in the text' }),
      message('s24-m4', {
        text: 'This matter is confidential. Discussing it with family or your employer is an offence under '
          + 'the order.',
        time: '07:05', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - a mobile number speaking for an agency. */
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
                  { label: 'Messages', value: '4 in two minutes: a fee, a link, a number, a secrecy order' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Calls itself', value: `${label} — the first words of the text`, result: 'in text' },
                  { label: 'Government senders in this phone', value: 'VM-GOVTRN, a registered sender ID', result: 'header' },
                  { label: 'Asks for', value: 'A fee today, or your ID and bank passbook', result: 'fee' },
                  { label: 'Tells you to', value: 'Tell nobody', result: 'secrecy' },
                ],
              },
            ],
          },
        },
      }),

      /** Link details - where the case file really is. */
      linkinfo: sms({
        title: 'Link details',
        home: 'link',
        pages: {
          link: {
            title: 'Link details',
            blocks: [
              {
                type: 'link',
                heading: 'Address in the message',
                shown: shortLink,
                target,
                rows: [
                  { label: 'Site', value: host },
                  { label: 'The reporting portal in your bookmarks', value: portalHost },
                ],
              },
            ],
          },
        },
      }),

      /** The case portal - a countdown and two ways out. Walking it records nothing. */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'case',
        pages: {
          case: {
            title: 'Cyber Case Clearance',
            host,
            url: target,
            blocks: [
              { type: 'brand', monogram: 'CC', name: 'Cyber Case Clearance', tagline: 'Online settlement desk' },
              { type: 'heading', text: `Case ${caseNo} — action required` },
              {
                type: 'summary',
                rows: [
                  { label: 'Complainant', value: 'Withheld' },
                  { label: 'Status', value: 'Warrant pending', strong: true },
                  { label: 'Case closes', value: 'Today, 18:00 — 10 h 54 min left' },
                  { label: 'Clearance fee', value: 'INR 9,800' },
                ],
              },
              {
                type: 'notice',
                text: 'Pay the fee now, or upload your ID card and bank passbook for manual clearance.',
              },
            ],
            links: [
              { id: 's24-link-fee', label: 'Pay the clearance fee', to: 'fee' },
              { id: 's24-link-upload', label: 'Upload ID and passbook for manual clearance', to: 'upload' },
            ],
          },
        },
      },

      /** The fee, on the phone's payment sheet. */
      fee: {
        kind: SURFACE.PAYSHEET,
        title: 'TrainPay',
        app: 'Pay',
        amount: 'INR 9,800.00',
        subtitle: 'Case clearance fee',
        rows: [
          { label: 'To', value: 'CASE CLEARANCE A/C' },
          { label: 'UPI ID', value: 'ccclear.2026@trainpay' },
          { label: 'Reference', value: caseNo },
        ],
        form: {
          type: 'form',
          title: 'Approve this payment',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Payments approved with your PIN cannot be reversed.',
      },

      /** The phone's own file picker, raised by the portal's upload link. */
      upload: {
        kind: SURFACE.VIEWER,
        title: 'Choose files',
        subtitle: `To upload to ${host}`,
        backLabel: 'Cancel',
        inertNote: 'Local file picker. No file is read, attached or uploaded.',
        itemsHeading: 'Photos on this phone',
        items: [
          {
            id: 'id-card', art: 'card', label: 'ID card — front.jpg',
            value: 'Photos · 12 Sep · 1.8 MB',
            rows: [
              { label: 'Shows', value: 'Your name, photo, date of birth and ID number' },
              { label: 'Selected', value: 'Yes — the portal asked for it' },
            ],
          },
          {
            id: 'passbook', art: 'document', label: 'Bank passbook — first page.jpg',
            value: 'Photos · 03 Aug · 2.2 MB',
            rows: [
              { label: 'Shows', value: 'Account number, branch code, name and address' },
              { label: 'Selected', value: 'Yes — the portal asked for it' },
            ],
          },
        ],
      },

      /** Where the officer's number goes. */
      officercall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Investigating officer',
        number: officer,
        script: [
          { at: 0, speaker: 'them', text: `Cyber cell. You are calling about ${caseNo}?` },
          { at: 5, speaker: 'them', text: 'Stay on the line. Do not tell anyone at home or at work.' },
          { at: 11, speaker: 'them', text: 'Pay the fee on the portal now, or I forward the warrant at six.' },
        ],
      },

      /** The office's own legal and security desk, on the directory number. */
      legal: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Legal and security desk',
        number: legalDesk,
        script: [
          { at: 0, speaker: 'them', text: 'Legal and security desk.' },
          { at: 3, speaker: 'them', text: 'No agency settles a case by a fee paid from a text, and none orders you to keep it secret from us.' },
          { at: 10, speaker: 'them', text: 'Keep the texts. Do not pay, upload or call the number in them.' },
          { at: 16, speaker: 'them', text: 'Report it on the reporting portal, then block the number. We will log it here too.' },
        ],
      },

      /** The reporting portal, opened from the learner's own bookmarks. */
      official: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'track',
        pages: {
          track: {
            title: 'Cyber Reporting Portal (training) — track a complaint',
            host: portalHost,
            url: `https://${portalHost}/track`,
            blocks: [
              { type: 'brand', monogram: 'CR', name: 'Cyber Reporting Portal (training)', tagline: 'Opened from your bookmarks' },
              { type: 'search', query: caseNo },
              {
                type: 'result',
                heading: 'Complaint status',
                text: 'No complaint with this number exists.',
                rows: [
                  { label: 'Fees', value: 'Complaints are never closed by a payment' },
                  { label: 'Contact', value: 'Only through this portal or your local police station' },
                  { label: 'To report a text', value: 'Use Report on this portal, with the sender number' },
                ],
              },
            ],
          },
        },
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's24-c01', slot: SLOT.INLINE, label: 'Open the conversation' }),
          action({ id: 's24-c02', slot: SLOT.INLINE, label: 'Call the officer from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's24-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how government senders appear on this phone',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's24-c04', slot: SLOT.INLINE, anchor: 's24-link',
            label: 'See where the case file is', hint: 'The address behind the short link',
            targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's24-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's24-c06', slot: SLOT.INLINE, anchor: 's24-officer',
            label: 'Call the officer', opens: 'officercall',
          }),
          action({
            id: 's24-c07', slot: SLOT.SURFACE, on: 'fee',
            label: 'Pay INR 9,800', targetId: paymentAsset, closes: 'all',
          }),
          action({
            id: 's24-c08', slot: SLOT.SURFACE, on: 'upload',
            label: 'Upload 2 files', closes: 'all',
          }),
          action({
            id: 's24-c09', slot: SLOT.INLINE, anchor: 's24-msg',
            label: 'Open nothing and keep all four texts as they are',
          }),
          navigate({
            id: 's24-nav-case', slot: SLOT.INLINE, anchor: 's24-link', label: 'Open the case file', opens: 'portal',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's24-c10', slot: SLOT.MENU, label: 'Call your legal and security desk on the directory number',
            opens: 'legal',
          }),
          action({
            id: 's24-c11', slot: SLOT.MENU, label: 'Open the reporting portal from your bookmarks and track the case',
            hint: 'The case number, looked up yourself', opens: 'official',
          }),
          action({
            id: 's24-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's24-c13', slot: SLOT.MENU, label: 'Call the officer’s number and ask for the case file' }),
          action({ id: 's24-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's24-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's24-c16', slot: SLOT.INLINE, label: 'Keep the texts and report them through the reporting portal' }),
          action({ id: 's24-c17', slot: SLOT.INLINE, label: 'Pay the fee before the case closes at 18:00' }),
          action({ id: 's24-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's24-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's24-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's24-nav-official', slot: SLOT.MENU, label: 'Open the reporting portal bookmark', opens: 'official', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's24-dir-legal',
        name: 'Legal and security desk',
        identifier: legalDesk,
        provenance: 'local approved directory',
        role: 'Advises on any legal notice, summons or demand you receive.',
      },
    ],
  }
}

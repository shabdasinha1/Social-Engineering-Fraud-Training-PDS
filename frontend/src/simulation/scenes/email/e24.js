import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, attachment, body, brand, directory, mail, notice, sender,
  subjectLine,
} from './shared.js'

/**
 * E24 - QR Code in Policy PDF (IMMERSIVE-009) - the code on page 7.
 *
 * A polished annual policy circular arrives with the acceptable-use document attached. Everything
 * about it is ordinary: the covering note is short, the document is eight pages, the deadline is a
 * fortnight away. The pressure is only in one sentence on the last page - acknowledgement "must be
 * completed on a mobile device" by scanning the code printed there - and that sentence is the whole
 * attack. A code inside an attachment is not scanned by a mail filter, does not appear as a link in
 * the message, and is read by a device that usually has no filter on it at all.
 *
 * It is deliberately built to be a different experience from E14's movement-order QR. There the
 * code was in the message and the learner met it immediately; here it is on page 7 of a paginated
 * document, so the learner has to walk through the pages to find it, and the document around it is
 * genuine-looking policy prose. The decoded target is a shortener that expands, in the inspector,
 * to a host that is not the unit's. And - this is the part the scene is really about - there IS a
 * correct way to acknowledge the policy: the Policy Centre the unit already uses has the
 * acknowledgement task waiting, and taking it there is the safe branch.
 *
 * Fictional throughout: the office, the policy, the circular number and every host and number
 * describe nothing real. No camera is opened, no code is read from an image, nothing is fetched and
 * what is typed into the drawn sign-in stays on the screen it is typed on.
 */
export function buildE24(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const fileAssetId = assetId(scenario, ASSET_KIND.FILE)
  const qrAsset = asset(scenario, ASSET_KIND.QR)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'complianceoffice@e24.training.example'
  const senderName = senderInfo.display_name ?? 'Compliance Office'
  const decoded = qrAsset?.display_target ?? 'https://e24.training.example/qr'
  const shortForm = 'ackn.training.example/p7'
  const helpdesk = '+91 00000 35201'
  const circular = 'CIR-2026/14'
  const subject = `${circular} — Acceptable Use Policy 2026: acknowledgement required`

  return {
    scenarioId: 'E24',
    platform: 'email',
    notify: { sender: senderName },
    messageSender: { display_name: senderName, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'policy', label: 'Policy', heading: 'Policy circulars',
          rows: [
            {
              id: 'e24-p-1', from: 'Compliance Office', subject: 'CIR-2025/11 — Acceptable Use Policy 2025',
              preview: 'Acknowledge in the Policy Centre by 30 Sep.', time: '12 Sep 2025', inert: true,
            },
            {
              id: 'e24-p-2', from: 'Policy Centre', subject: 'Acknowledgement recorded — CIR-2025/11',
              preview: 'Thank you. Your acknowledgement is on file.', time: '16 Sep 2025', inert: true,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e24-row', from: senderName, subject,
          preview: subjectLine(scenario), time: '12:58', unread: true, tag: 'External', attachment: true,
        },
        {
          id: 'e24-bg-1', from: 'Canteen Committee', subject: 'Menu for next week',
          preview: 'Suggestions by Friday please.', time: '12:02', inert: true,
        },
        {
          id: 'e24-bg-2', from: 'Sandeep', subject: 'Re: duty roster swap',
          preview: 'You: that works, thanks', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: senderName,
      time: '12:58',
      toLine: 'to all staff',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      brand('e24-brand', { monogram: 'CO', name: 'Compliance Office', tagline: `Circular ${circular}`, color: '#1f3d5b' }),
      body('e24-body', {
        greeting: 'All staff,',
        paragraphs: [
          'The Acceptable Use Policy has been revised for 2026 and is attached. Please read it in full.',
          subjectLine(scenario),
          'Acknowledgement instructions are on the last page of the document. The deadline is 30 September.',
        ],
        signature: ['Compliance Office', `Circular ${circular}`],
        footer: 'Sent to all staff. Please do not reply to this circular.',
      }),
      attachment('e24-policy', {
        fileName: 'Policy_2026_Acceptable_Use.pdf',
        fileKind: 'PDF',
        size: '292 KB',
      }),
      notice('e24-note', 'Attachment saved by your mail app. Open it to read the eight pages.'),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              {
                type: 'identity', name: senderName, address: fromAddress,
                note: 'Last year’s circular came from compliance@unit.training.example',
              },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${senderName} <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: 'all-staff@unit.training.example' },
                  { label: 'Links', value: 'None in the message — one attachment' },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e24.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e24.training.example', result: 'pass' },
                  { label: 'Sending domain', value: 'e24.training.example — not unit.training.example', result: 'external' },
                ],
              },
              {
                type: 'note',
                text: 'A message with no links in it has nothing for a filter to weigh. What it carries '
                  + 'is inside the attachment.',
              },
            ],
          },
        },
      }),

      /**
       * The document itself, paginated the way a reader paginates a PDF. The code is on the
       * last page, so it has to be walked to; pages 1 and 4 are ordinary policy prose.
       */
      doc: mail({
        title: 'Policy_2026_Acceptable_Use.pdf',
        home: 'p1',
        inertNote: 'Local document preview. Nothing is opened, scanned or run from here.',
        pages: {
          p1: {
            title: 'Page 1 of 8 — Acceptable Use Policy 2026',
            blocks: [
              { type: 'file', kind: 'pdf', name: 'Policy_2026_Acceptable_Use.pdf', meta: 'PDF · 292 KB · 8 pages' },
              { type: 'heading', text: '1. Purpose and scope' },
              {
                type: 'note',
                text: 'This policy sets out how information systems provided by the organisation may be '
                  + 'used, and applies to all staff, contractors and attached personnel.',
              },
              {
                type: 'items',
                heading: 'Contents',
                items: [
                  { label: '1. Purpose and scope', meta: 'p1' },
                  { label: '2. Acceptable use', meta: 'p2' },
                  { label: '3. Handling of information', meta: 'p4', to: 'p4' },
                  { label: '4. Reporting', meta: 'p6' },
                  { label: '5. Acknowledgement', meta: 'p7', to: 'p7' },
                ],
              },
            ],
            links: [{ id: 'e24-link-p4', label: 'Next page', to: 'p4' }],
          },
          p4: {
            title: 'Page 4 of 8 — Handling of information',
            blocks: [
              { type: 'heading', text: '3. Handling of information' },
              {
                type: 'note',
                text: 'Information is handled at the classification it carries. Staff must not move '
                  + 'material to personal accounts or devices, and must report any loss the same day.',
              },
              {
                type: 'rows',
                heading: 'Unchanged from 2025',
                rows: [
                  { label: '3.1', value: 'Classification travels with the material' },
                  { label: '3.2', value: 'Personal accounts and devices are not approved storage' },
                  { label: '3.3', value: 'Losses are reported the same day' },
                ],
              },
            ],
            links: [{ id: 'e24-link-p7', label: 'Go to the acknowledgement page', to: 'p7' }],
          },
          p7: {
            title: 'Page 7 of 8 — Acknowledgement',
            blocks: [
              { type: 'heading', text: '5. Acknowledgement' },
              {
                type: 'note',
                text: 'All staff must acknowledge this policy by 30 September 2026. From this year, '
                  + 'acknowledgement must be completed on a mobile device by scanning the code below. '
                  + 'Desktop acknowledgement has been withdrawn.',
              },
              {
                type: 'rows',
                heading: 'Printed on this page',
                rows: [
                  { label: 'Code', value: 'A square code, printed in the document' },
                  { label: 'Under it', value: shortForm },
                  { label: 'Deadline', value: '30 September 2026' },
                ],
              },
              {
                type: 'bar',
                title: 'A code is printed here.',
                text: 'Your device can read the code from the page and show you where it leads before '
                  + 'anything is opened.',
              },
            ],
            links: [{ id: 'e24-link-qr', label: 'Read the code with your device', to: 'qr' }],
          },
        },
      }),

      /** What the printed code contains, read from the page and stated in words. */
      qr: {
        kind: SURFACE.VIEWER,
        title: 'Code inspector',
        art: 'qr',
        label: 'Code on page 7',
        heading: 'What the code contains',
        text: 'Read from the document on this device. Nothing is opened until you choose to.',
        rowsHeading: 'Decoded',
        rows: [
          { label: 'Printed under it', value: shortForm },
          { label: 'Expands to', value: decoded },
          { label: 'Host', value: 'e24.training.example — not unit.training.example' },
          { label: 'Page asks for', value: 'Work account and password' },
        ],
        note: 'The short form and the address it expands to are two different hosts. The Policy Centre '
          + 'sits on the unit’s own domain.',
        inertNote: 'Read locally from the document. No camera, no network, nothing opened.',
        backLabel: 'Close the inspector',
      },

      /** Where the code leads: a picture of the unit's sign-in, on somebody else's domain. */
      signin: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'signin',
        pages: {
          signin: {
            title: 'Sign in to acknowledge',
            host: 'e24.training.example',
            url: decoded,
            blocks: [
              { type: 'brand', monogram: 'PC', name: 'Policy Centre', tagline: 'Acknowledgement · 2026' },
              { type: 'heading', text: 'Sign in to record your acknowledgement' },
              {
                type: 'text',
                text: 'Use your work account. Your acknowledgement will be recorded against your name '
                  + 'and this circular.',
              },
              {
                type: 'form',
                title: 'Work account',
                fields: [
                  field({ name: 'account', label: 'Work email', kind: FIELD_KIND.TEXT, length: 6, max: 42 }),
                  field({ name: 'passphrase', label: 'Password', kind: FIELD_KIND.MASKED, length: 4, max: 32 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'The address of this page is printed in the bar above. Compare it with the Policy '
                  + 'Centre you have used before.',
              },
            ],
          },
        },
      },

      /** The Policy Centre the unit actually uses, with the task already waiting. */
      centre: {
        kind: SURFACE.APP,
        appName: 'Policy Centre',
        appTagline: 'Your policy tasks',
        hero: {
          label: 'Waiting for you',
          value: '1 acknowledgement',
          caption: `${circular} — Acceptable Use Policy 2026. Due 30 September.`,
          chips: ['Signed in as you', 'unit.training.example'],
        },
        sections: [
          {
            id: 'e24-centre-task',
            heading: 'This circular',
            rows: [
              { label: 'Circular', value: `${circular} · issued today` },
              { label: 'How to acknowledge', value: 'Here, on any device, signed in already' },
              { label: 'Mobile code', value: 'The Centre has never used one' },
            ],
            note: 'Acknowledgement is recorded here. Nothing else records it.',
          },
          {
            id: 'e24-centre-history',
            heading: 'Your record',
            rows: [
              { label: 'CIR-2025/11', value: 'Acknowledged 16 Sep 2025, here' },
              { label: 'CIR-2024/09', value: 'Acknowledged 11 Sep 2024, here' },
            ],
          },
        ],
        tabs: [
          { label: 'Tasks', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The compliance helpdesk, on the directory number. */
      helpdesk: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Compliance helpdesk (directory)',
        number: helpdesk,
        script: [
          { at: 0, speaker: 'them', text: 'Compliance helpdesk.' },
          { at: 3, speaker: 'them', text: `${circular} is real and it went out this morning — from our own address, with no attachment.` },
          { at: 9, speaker: 'them', text: 'Acknowledgement is in the Policy Centre as always. We have never asked anyone to scan anything.' },
          { at: 15, speaker: 'them', text: 'Please report the copy you received and acknowledge in the Centre.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e24-c01', slot: SLOT.INLINE, label: 'Open the circular' }),
          action({ id: 'e24-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e24-c03', slot: SLOT.INLINE, anchor: 'header',
            label: senderName, hint: 'Sender, recipients and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e24-c04', slot: SLOT.INLINE, anchor: 'e24-policy',
            label: 'Open the policy document', hint: 'Eight pages, including the acknowledgement page',
            targetId: fileAssetId, opens: 'doc',
          }),
          action({ id: 'e24-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e24-c06', slot: SLOT.SURFACE, on: 'qr',
            label: 'Open the address the code contains', targetId: qrAsset?.asset_id ?? null, opens: 'signin',
          }),
          action({
            id: 'e24-c07', slot: SLOT.SURFACE, on: 'signin', page: 'signin',
            label: 'Sign in to acknowledge', targetId: browserAsset, closes: true,
          }),
          action({
            id: 'e24-c08', slot: SLOT.SURFACE, on: 'centre',
            label: 'Acknowledge the policy here', closes: true,
          }),
          action({
            id: 'e24-c09', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: fromAddress },
            label: 'Reply that you cannot scan it and ask for another way',
            echo: 'I cannot scan the code on this device. Is there another way to acknowledge?',
          }),
          action({ id: 'e24-c10', slot: SLOT.MENU, label: 'Close the circular without scanning anything' }),
          navigate({
            id: 'e24-nav-qr', slot: SLOT.MENU, label: 'Read the code on page 7 with your device', opens: 'qr',
          }),
          navigate({
            id: 'e24-nav-centre', slot: SLOT.MENU, label: 'Open the Policy Centre', opens: 'centre',
          }),
          /**
           * The inspector states the address in words, so a learner can open it in the browser
           * themselves. Navigation, recording nothing, which is what makes the sign-in on that
           * page reachable as an alternative to opening it from the code.
           */
          navigate({
            id: 'e24-nav-signin', slot: SLOT.MENU, label: 'Open that address in the browser', opens: 'signin',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e24-c11', slot: SLOT.MENU, label: 'Check the circular in the Policy Centre',
            hint: 'What the Centre says about acknowledging', opens: 'centre',
          }),
          action({
            id: 'e24-c12', slot: SLOT.MENU, label: 'Call the compliance helpdesk on the directory number',
            opens: 'helpdesk',
          }),
          action({
            id: 'e24-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e24-c14', slot: SLOT.MENU, label: 'Reply to the circular address to confirm' }),
          action({ id: 'e24-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e24-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e24-c17', slot: SLOT.INLINE, label: 'Report the circular and acknowledge in the Centre' }),
          action({ id: 'e24-c18', slot: SLOT.INLINE, label: 'Keep the circular and scan before the deadline' }),
          action({ id: 'e24-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e24-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e24-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e24-nav-doc', slot: SLOT.MENU, label: 'Open the policy document', opens: 'doc', after: 'inspect' }),
      navigate({ id: 'e24-nav-centre2', slot: SLOT.MENU, label: 'Open the Policy Centre', opens: 'centre', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e24-dir-compliance',
        name: 'Compliance helpdesk — internal directory',
        identifier: helpdesk,
        provenance: 'internal directory, printed on the intranet',
        role: 'Issues policy circulars and records acknowledgements in the Policy Centre.',
      },
    ],
  }
}

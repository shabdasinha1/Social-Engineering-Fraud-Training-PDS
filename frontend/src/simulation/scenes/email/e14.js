import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, attachment, body, directory, mail, sender, subjectLine,
} from './shared.js'

/**
 * E14 - Revised Movement Order (IMMERSIVE-007) - military spearphishing with a QR payload.
 *
 * A look-alike "HQ Alpha Movements" address - one letter off the real HQ domain - sends an
 * "urgent revision" to movement order MOV-77 shortly before a fictional exercise, tailored from
 * the sort of detail an exercise leaks publicly. The premise is plausible, which is the point;
 * the tells are the sender domain, the reply-to, a classification that does not match, and a
 * revision route that never goes through the approved orders system. The attachment is a PDF
 * with a QR "to decrypt the full order", and the QR decodes to an off-domain host.
 *
 * The batch's QR scene: the honest QR inspector states the decoded target in words (an offline
 * simulation has no camera and no reader), and scanning it is the -3 risky step, while the
 * "decrypt portal" it points at harvests service credentials for the -8. Both are alternatives;
 * verifying MOV-77 in the orders system or calling movement staff is safe. The resolve step
 * takes an optional one-line reason (the panel's rationale box, no sensitive data). Nothing is
 * scanned, decoded remotely or submitted. Fictional: HQ Alpha, MOV-77 and the exercise describe
 * nothing real; there is no real unit, location, schedule or procedure.
 */
export function buildE14(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = asset(scenario, ASSET_KIND.FILE)
  const fileId = fileAsset?.asset_id ?? null
  const fileName = fileAsset?.content?.file_name ?? 'Movement_Order_MOV-77.pdf'
  const qrAsset = asset(scenario, ASSET_KIND.QR)
  const decoded = qrAsset?.display_target ?? 'https://e14.training.example/qr'
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const lookalike = senderInfo.identifier ?? 'hqalphamovements@e14.training.example'
  const onFile = 'movements@hq-alpha.training.example'
  const order = 'MOV-77'

  return {
    scenarioId: 'E14',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'HQ Alpha Movements' },
    messageSender: { display_name: senderInfo.display_name ?? 'HQ Alpha Movements', identifier: lookalike },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'orders', label: 'Orders', heading: 'Orders', rows: [], empty: 'Orders arrive in the orders system, not by mail.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e14-row', from: 'HQ Alpha Movements', subject: subjectLine(scenario),
          preview: `Revision to ${order}. Open the attached order and decrypt it now.`,
          time: '16:10', unread: true, attachment: true, tag: 'Priority',
        },
        {
          id: 'e14-bg-1', from: 'Mess Secretary', subject: 'Dining-in night',
          preview: 'RSVP by Thursday.', time: '15:20', inert: true,
        },
        {
          id: 'e14-bg-2', from: 'Priya', subject: 'Re: transport pool',
          preview: 'You: booked the second vehicle', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'HQ Alpha Movements',
      time: '16:10',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Priority'],
    },

    beats: [
      body('e14-body', {
        greeting: 'For action,',
        paragraphs: [
          `Movement order ${order} has been revised with immediate effect ahead of the exercise. `
          + 'The attached order is encrypted.',
          'Scan the QR on the order to decrypt the full timings. Do not delay — sub-units are waiting.',
        ],
        signature: ['HQ Alpha Movements', 'Duty Movements'],
        footer: `Ref ${order}. Time-sensitive — acknowledge on receipt.`,
      }),
      attachment('e14-file', { fileName, fileKind: 'pdf', size: '359 KB' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'HQ Alpha Movements', address: lookalike, note: 'One letter off the HQ movements address on file' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `HQ Alpha Movements <${lookalike}>` },
                  { label: 'Reply-To', value: lookalike },
                  { label: 'To', value: LEARNER.account },
                  { label: 'On file', value: onFile },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Domain', value: 'hqalphamovements vs hq-alpha on file', result: 'off-domain' },
                  { label: 'Route', value: 'Orders never arrive by email QR', result: 'wrong-channel' },
                  { label: 'Marking', value: 'Classification does not match a real order', result: 'mismatch' },
                ],
              },
              { type: 'note', text: 'A revised order is confirmed in the approved orders system, whatever the email claims.' },
            ],
          },
        },
      }),

      preview: mail({
        title: fileName,
        home: 'preview',
        inertNote: 'Local preview. The order is not decrypted, opened or run.',
        pages: {
          preview: {
            title: fileName,
            subtitle: 'PDF · 359 KB',
            blocks: [
              { type: 'file', kind: 'pdf', name: fileName, meta: `Movement order ${order} · encrypted` },
              {
                type: 'mail',
                subject: `Movement order ${order} — REVISED`,
                from: 'HQ Alpha Movements',
                address: lookalike,
                date: 'Today',
                paragraphs: [
                  'Timings and routes for the exercise have changed. Full details are encrypted.',
                  'A QR code is printed at the foot of this order. Scan it to decrypt the timings.',
                ],
              },
              { type: 'note', text: 'Open the QR inspector to read where the code actually points before doing anything with it.' },
            ],
          },
        },
      }),

      /** The honest QR inspector: what the code decodes to, in words. */
      qr: {
        kind: SURFACE.VIEWER,
        title: 'QR inspector',
        art: 'qr',
        label: 'Order QR',
        heading: 'Decoded contents',
        text: 'This is what the printed QR points to. Nothing is opened until you choose to.',
        rowsHeading: 'Decoded target',
        rows: [
          { label: 'Link', value: decoded },
          { label: 'Host', value: 'e14.training.example (not the orders system)' },
          { label: 'Asks for', value: 'Service number and password' },
        ],
        note: 'A genuine order is never behind a QR that leads off the approved system to a login.',
        inertNote: 'Decoded locally. No camera, no network, nothing opened.',
        backLabel: 'Close the inspector',
      },

      /** The "decrypt portal" the QR points at - a credential harvester. Inert. */
      decrypt: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'portal',
        pages: {
          portal: {
            url: decoded,
            host: 'e14.training.example',
            title: 'Decrypt order',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'MV', name: 'Movements Decrypt', tagline: 'Restricted order access' },
              { type: 'heading', text: `Sign in to decrypt ${order}` },
              {
                type: 'form',
                heading: 'Verify your identity',
                fields: [
                  field({ name: 'service', label: 'Service number', kind: FIELD_KIND.TEXT, length: 5, max: 12 }),
                  field({ name: 'secret', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
              { type: 'fineprint', text: 'Access is logged against your service number.' },
            ],
            primary: { label: 'Decrypt order', to: 'confirm' },
          },
          confirm: {
            url: `${decoded}/verify`,
            host: 'e14.training.example',
            title: 'Confirm',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Confirm and decrypt' },
              { type: 'notice', text: 'Submitting hands your service number and password to this page.' },
            ],
          },
          done: {
            url: decoded,
            host: 'e14.training.example',
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Details submitted', text: 'The page accepted the credentials.' },
            ],
          },
        },
      },

      orders: {
        kind: SURFACE.APP,
        appName: 'Orders system',
        appTagline: 'Approved movement orders',
        hero: { label: `Order ${order}`, value: 'No revision', caption: `${order} shows no revision today. The current version stands.` },
        sections: [
          {
            id: 'e14-orders-rows',
            heading: 'Order status',
            rows: [
              { label: order, value: 'Issued 2 days ago · current · no change' },
              { label: 'Last amendment', value: 'None' },
              { label: 'Distribution', value: 'Orders system only — never by email' },
            ],
            note: 'A real revision appears here first. Nothing about it points to an emailed QR.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Orders', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Movement staff (directory)',
        number: '+91 00000 22275',
        script: [
          { at: 0, speaker: 'them', text: 'Movements, duty desk.' },
          { at: 3, speaker: 'them', text: `We have not revised ${order}, and we never send orders by email or QR.` },
          { at: 8, speaker: 'them', text: 'Please report it to unit security and do not scan anything.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e14-c01', slot: SLOT.INLINE, label: 'Open the movement-order email' }),
          action({ id: 'e14-c02', slot: SLOT.INLINE, label: 'Reply from the list to acknowledge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e14-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'HQ Alpha Movements', hint: 'Sender domain, Reply-To and marking',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e14-c04', slot: SLOT.INLINE, anchor: 'e14-file',
            label: 'Preview the order', hint: 'Read it without decrypting',
            targetId: fileId, opens: 'preview',
          }),
          action({ id: 'e14-c05', slot: SLOT.MENU, label: 'Read the whole message' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e14-c06', slot: SLOT.SURFACE, on: 'qr',
            label: 'Open the decoded link', targetId: qrAsset?.asset_id ?? null,
          }),
          action({
            id: 'e14-c07', slot: SLOT.SURFACE, on: 'decrypt', page: 'confirm',
            label: 'Enter your service number and password', thenPage: 'done',
          }),
          action({ id: 'e14-c08', slot: SLOT.SURFACE, on: 'decrypt', label: 'Close the decrypt page', closes: true }),
          action({ id: 'e14-c09', slot: SLOT.MENU, label: 'Leave the order and verify it properly' }),
          navigate({ id: 'e14-nav-qr', slot: SLOT.MENU, label: 'Inspect the QR code', opens: 'qr' }),
          navigate({ id: 'e14-nav-decrypt', slot: SLOT.MENU, label: 'Open the decrypt portal', opens: 'decrypt' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e14-c10', slot: SLOT.MENU, label: `Check ${order} in the orders system`,
            hint: 'Look for the revision yourself', opens: 'orders',
          }),
          action({ id: 'e14-c11', slot: SLOT.MENU, label: 'Call movement staff on the directory number', opens: 'call' }),
          action({
            id: 'e14-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e14-c13', slot: SLOT.MENU, label: 'Reply to the sender to confirm the revision' }),
          action({ id: 'e14-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e14-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e14-c16', slot: SLOT.INLINE, label: 'Report it and keep the email for unit security' }),
          action({ id: 'e14-c17', slot: SLOT.INLINE, label: 'Scan the QR to get the timings anyway' }),
          action({ id: 'e14-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e14-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e14-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e14-nav-orders', slot: SLOT.MENU, label: 'Open the orders system', opens: 'orders', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e14-dir-mov',
        name: 'Movement staff',
        identifier: '+91 00000 22275',
        provenance: 'local approved directory',
        role: 'Issues movement orders through the orders system; never sends an order or a revision by email.',
      },
    ],
  }
}

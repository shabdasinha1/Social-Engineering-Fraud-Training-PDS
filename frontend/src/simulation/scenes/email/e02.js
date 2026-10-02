import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, attachment, body, directory, mail, sender, subjectLine,
} from './shared.js'

/**
 * E02 - Invoice Spreadsheet Macro (IMMERSIVE-005).
 *
 * An unfamiliar "Accounts" sender forwards an "overdue" invoice as a macro-enabled
 * spreadsheet (`.xlsm`) and tells the reader to Enable Content to see the payment lines. The
 * decision is taken inside the attachment preview: the file opens as an inert grid whose
 * figures are hidden behind a yellow "Enable content" bar, exactly the way a real office
 * suite protects a macro document. Enabling it, or saving the file somewhere it would run,
 * is the risk; closing it without enabling is the safe pivot.
 *
 * Nothing here executes: the preview is a drawn grid, the macros are never extracted and the
 * "Enable content" control only records the decision. The verification route is the approved
 * vendor system and a call to the finance contact the learner already has.
 */
export function buildE02(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = asset(scenario, ASSET_KIND.FILE)
  const fileId = fileAsset?.asset_id ?? null
  const fileName = fileAsset?.content?.file_name ?? 'Invoice_8841.xlsm'
  const fileSize = fileAsset?.content?.file_size ?? '232 KB'
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'accountsnotice@e02.training.example'

  return {
    scenarioId: 'E02',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Accounts Notice' },
    messageSender: { display_name: senderInfo.display_name ?? 'Accounts Notice', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'sent', label: 'Sent', heading: 'Sent', rows: [], empty: 'Nothing here.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e02-row', from: 'Accounts Notice', subject: subjectLine(scenario),
          preview: 'Please find the overdue invoice attached. Enable content to view…',
          time: '14:18', unread: true, attachment: true,
        },
        {
          id: 'e02-bg-1', from: 'Ravi (Stores)', subject: 'PO numbers for October',
          preview: 'Both approved. The kit arrives Friday.', time: '11:02', inert: true,
        },
        {
          id: 'e02-bg-2', from: 'Learning Office', subject: 'Reminder: safety module',
          preview: 'Due by the end of the month.', time: 'Mon', inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Accounts Notice',
      time: '14:18',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      body('e02-body', {
        greeting: 'Hello,',
        paragraphs: [
          'Your account shows an overdue invoice. The payment lines are in the attached '
          + 'spreadsheet. You will need to Enable Content when it opens to see the figures.',
          'Please settle this today to avoid a late fee.',
        ],
        signature: ['Accounts', 'Billing Team'],
        footer: 'Ref: INV-8841. This message was scanned.',
        quoted: {
          header: 'On 12 Sep, Billing <billing@e02-invoices.training.example> wrote:',
          paragraphs: ['Automated reminder: one invoice is awaiting payment.'],
        },
      }),
      attachment('e02-file', { fileName, fileKind: 'xlsm', size: fileSize }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Accounts Notice', address: fromAddress, note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Accounts Notice <${fromAddress}>` },
                  { label: 'Reply-To', value: 'billing@e02-invoices.training.example' },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Attachment', value: `${fileName} (${fileSize})` },
                ],
              },
              {
                type: 'checks',
                heading: 'Attachment',
                rows: [
                  { label: 'File type', value: 'Macro-enabled spreadsheet (.xlsm)', result: 'macros' },
                  { label: 'Sender', value: 'First message from this address', result: 'new' },
                  { label: 'Requested action', value: 'Enable Content', result: 'caution' },
                ],
              },
              { type: 'note', text: 'A spreadsheet does not need macros to show an invoice.' },
            ],
          },
        },
      }),

      preview: mail({
        title: fileName,
        home: 'preview',
        inertNote: 'Local preview. The file is not opened, run or extracted.',
        pages: {
          preview: {
            title: fileName,
            subtitle: `Spreadsheet · ${fileSize}`,
            blocks: [
              { type: 'file', kind: 'xlsm', name: fileName, meta: `Macro-enabled spreadsheet · ${fileSize}` },
              {
                type: 'bar',
                title: 'Protected view.',
                text: 'This file wants to enable content (macros) before it will show the figures.',
              },
              {
                type: 'sheet',
                columns: ['Line', 'Description', 'Amount'],
                rows: [
                  ['1', 'Enable content to view', '####'],
                  ['2', 'Enable content to view', '####'],
                  ['3', 'Enable content to view', '####'],
                ],
                tabs: ['Invoice', 'Macro1'],
                caption: 'The amounts stay hidden until content is enabled.',
              },
            ],
          },
          enabled: {
            title: fileName,
            final: true,
            blocks: [
              { type: 'result', heading: 'Content enabled', text: 'The document ran its content.' },
            ],
          },
          saved: {
            title: fileName,
            final: true,
            blocks: [
              { type: 'result', heading: 'Saved', text: 'The file was copied to another location.' },
            ],
          },
        },
      }),

      vendor: {
        kind: SURFACE.APP,
        appName: 'Vendor system',
        appTagline: 'Approved suppliers',
        hero: { label: 'Supplier lookup', value: 'No match', caption: 'This sender is not an approved supplier.' },
        sections: [
          {
            id: 'e02-vendor-rows',
            heading: 'Search results',
            rows: [
              { label: 'accountsnotice@…', value: 'Not found in the approved supplier list' },
              { label: 'Open invoices', value: 'None assigned to you' },
            ],
            note: 'Invoices from approved suppliers appear here, never as an emailed macro file.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Invoices', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      finance: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Finance desk (saved)',
        number: desk.identifier || '+91 00000 76227',
        script: [
          { at: 0, speaker: 'them', text: 'Finance desk.' },
          { at: 3, speaker: 'them', text: 'No, we have not sent you an invoice, and we never send macro files.' },
          { at: 8, speaker: 'them', text: 'Please report it and do not open the attachment.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e02-c01', slot: SLOT.INLINE, label: 'Open the invoice email' }),
          action({ id: 'e02-c02', slot: SLOT.INLINE, label: 'Reply from the list to query the invoice' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e02-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Accounts Notice', hint: 'Sender, Reply-To and the attachment',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e02-c04', slot: SLOT.INLINE, anchor: 'e02-file',
            label: 'Preview the attachment', hint: 'Open it in protected view',
            targetId: fileId, opens: 'preview',
          }),
          action({ id: 'e02-c05', slot: SLOT.MENU, label: 'Read the whole message' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e02-c06', slot: SLOT.SURFACE, on: 'preview', page: 'preview',
            label: 'Enable content', targetId: fileId, thenPage: 'enabled',
          }),
          action({
            id: 'e02-c07', slot: SLOT.SURFACE, on: 'preview', page: 'preview',
            label: 'Save the file to the shared drive', targetId: fileId, thenPage: 'saved',
          }),
          action({ id: 'e02-c08', slot: SLOT.SURFACE, on: 'preview', label: 'Close without enabling', closes: true }),
          action({ id: 'e02-c09', slot: SLOT.MENU, label: 'Delete the attachment unopened' }),
          navigate({ id: 'e02-nav-preview', slot: SLOT.MENU, label: 'Open the attachment', opens: 'preview' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e02-c10', slot: SLOT.MENU, label: 'Check the supplier in the vendor system',
            hint: 'Look it up yourself', opens: 'vendor',
          }),
          action({
            id: 'e02-c11', slot: SLOT.MENU, label: `Look up ${desk.name || 'the finance desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 'e02-c12', slot: SLOT.MENU, label: 'Call the finance contact you already have', opens: 'finance' }),
          action({ id: 'e02-c13', slot: SLOT.MENU, label: 'Reply to the sender to confirm the invoice' }),
          action({ id: 'e02-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e02-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e02-c16', slot: SLOT.INLINE, label: 'Report and quarantine the file' }),
          action({ id: 'e02-c17', slot: SLOT.INLINE, label: 'Keep it and deal with the invoice later' }),
          action({ id: 'e02-c18', slot: SLOT.MENU, label: 'Block the supplier and report' }),
          action({ id: 'e02-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e02-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e02-nav-vendor', slot: SLOT.MENU, label: 'Open the vendor system', opens: 'vendor', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e02-dir-desk',
        name: 'Unit Falcon Finance Desk',
        identifier: desk.identifier || '+91 00000 76227',
        provenance: 'local approved directory',
        role: 'Approved invoices appear in the vendor system; the desk never sends macro files by email.',
      },
    ],
  }
}

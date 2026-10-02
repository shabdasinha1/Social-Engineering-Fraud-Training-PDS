import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, attachment, body, directory, earlier, mail, sender,
} from './shared.js'

/**
 * E10 - Vendor Changes Bank Details (IMMERSIVE-006) - invoice/payment diversion.
 *
 * A look-alike vendor domain - one character off the real one - replies into a genuine invoice
 * thread (real reference NS-104, real project context) to announce a "banking migration" and a
 * new beneficiary account, with the change attached. Stolen context makes it convincing; the
 * only tells are the one-character domain difference and the fact that a beneficiary change
 * arrives without the approved callback and dual control.
 *
 * The decision is taken on the vendor-master edit screen - saving the new beneficiary or
 * approving payment to it - or by holding. The checks are a call to the vendor contact on file
 * and the change-control system, both of which show no approved change. Everything is
 * synthetic: "Northstar Supplies", the invoice and the accounts describe nothing real, no money
 * moves and no account number the learner types leaves the component.
 */
export function buildE10(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const lookalike = 'accounts@northstsr.training.example'
  const onFile = 'accounts@northstar.training.example'
  const invoiceRef = 'NS-104'

  return {
    scenarioId: 'E10',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Northstar Supplies' },
    messageSender: { display_name: senderInfo.display_name ?? 'Northstar Supplies', identifier: lookalike },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'invoices', label: 'Invoices', heading: 'Invoices', rows: [], empty: 'No other invoices.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e10-row', from: 'Northstar Supplies', subject: `Re: Invoice ${invoiceRef} — banking update`,
          preview: 'Banking migration — please use the attached new beneficiary…',
          time: '12:20', unread: true, attachment: true,
        },
        {
          id: 'e10-bg-1', from: 'Facilities', subject: 'Lift maintenance',
          preview: 'Scheduled for Saturday.', time: '10:40', inert: true,
        },
        {
          id: 'e10-bg-2', from: 'Deepa', subject: 'Re: budget sheet',
          preview: 'You: sent the latest', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `Re: Invoice ${invoiceRef} — banking update`,
      fromName: 'Northstar Supplies',
      time: '12:20',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Invoices'],
    },

    beats: [
      /** The genuine invoice thread, from the real vendor domain, one character different. */
      earlier('e10-earlier', {
        from: 'Northstar Supplies (Accounts)',
        to: 'You',
        time: '28 Aug',
        snippet: `Invoice ${invoiceRef} attached for the fit-out. Payable to our usual account.`,
        paragraphs: [
          `Please find invoice ${invoiceRef} for the fit-out works, payable to our account on file. `
          + 'Thank you for your continued business.',
          `Northstar Supplies · Accounts · ${onFile}`,
        ],
      }),
      body('e10-body', {
        greeting: 'Dear Accounts,',
        paragraphs: [
          `Following invoice ${invoiceRef}, we have completed a banking migration. Please update our `
          + 'beneficiary to the new account in the attached letter and settle the invoice there.',
          'Our bank asked us to move quickly, so please apply the change today.',
        ],
        signature: ['Northstar Supplies', 'Accounts Team'],
        footer: `Ref: ${invoiceRef}. Reply to confirm the update.`,
      }),
      attachment('e10-file', { fileName: 'New_Beneficiary_Letter.pdf', fileKind: 'pdf', size: '148 KB' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Northstar Supplies', address: lookalike, note: 'One character off the address on file' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Northstar Supplies <${lookalike}>` },
                  { label: 'Reply-To', value: lookalike },
                  { label: 'To', value: LEARNER.account },
                  { label: 'On file', value: onFile },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Domain', value: 'northst‑s‑r vs northst‑a‑r on file', result: 'lookalike' },
                  { label: 'Change', value: 'New beneficiary account', result: 'caution' },
                  { label: 'Approval', value: 'No callback or dual control done', result: 'gap' },
                ],
              },
              { type: 'note', text: 'A beneficiary change needs an independent callback and dual approval, whatever context the mail quotes.' },
            ],
          },
        },
      }),

      preview: mail({
        title: 'New_Beneficiary_Letter.pdf',
        home: 'preview',
        inertNote: 'Local preview. The file is not opened, run or extracted.',
        pages: {
          preview: {
            title: 'New_Beneficiary_Letter.pdf',
            subtitle: 'PDF · 148 KB',
            blocks: [
              { type: 'file', kind: 'pdf', name: 'New_Beneficiary_Letter.pdf', meta: 'Beneficiary change letter · 148 KB' },
              {
                type: 'mail',
                subject: `Beneficiary update — Invoice ${invoiceRef}`,
                from: 'Northstar Supplies',
                address: lookalike,
                date: 'Today',
                paragraphs: [
                  'Please update our beneficiary to: A/C 0044 5566 7788, IFSC NRTH0000445.',
                  'Settle all outstanding invoices to this account with immediate effect.',
                ],
              },
              { type: 'note', text: 'A letter attached to the same email cannot verify a bank change on its own.' },
            ],
          },
        },
      }),

      vendormaster: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'record',
        pages: {
          record: {
            url: 'https://vendors.finance.training.example',
            host: 'vendors.finance.training.example',
            title: 'Vendor master',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'VM', name: 'Vendor Master', tagline: 'Finance' },
              { type: 'heading', text: 'Northstar Supplies' },
              { type: 'summary', rows: [
                { label: 'On file', value: 'A/C 9911 2233 4455 · IFSC NRTH0000912' },
                { label: 'Requested', value: 'A/C 0044 5566 7788 · IFSC NRTH0000445', strong: true },
                { label: `Invoice ${invoiceRef}`, value: 'Awaiting payment' },
              ] },
              { type: 'notice', text: 'Edit the beneficiary, or approve the invoice payment.' },
            ],
            links: [
              { id: 'e10-vm-edit', label: 'Edit the beneficiary', to: 'edit' },
              { id: 'e10-vm-pay', label: 'Approve payment for this invoice', to: 'pay' },
            ],
          },
          edit: {
            url: 'https://vendors.finance.training.example/edit',
            host: 'vendors.finance.training.example',
            title: 'Edit beneficiary',
            secure: true,
            blocks: [
              {
                type: 'form',
                heading: 'New beneficiary for Northstar Supplies',
                fields: [
                  field({ name: 'account', label: 'New account number', kind: FIELD_KIND.DIGITS, length: 9, max: 16, group: 4 }),
                  field({ name: 'ifsc', label: 'IFSC', kind: FIELD_KIND.TEXT, length: 8, max: 11 }),
                ],
              },
              { type: 'fineprint', text: 'Saving replaces the account all future payments go to.' },
            ],
            primary: { label: 'Continue', to: 'confirm' },
          },
          confirm: {
            url: 'https://vendors.finance.training.example/confirm',
            host: 'vendors.finance.training.example',
            title: 'Confirm',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Save the new beneficiary?' },
              { type: 'notice', text: 'All future payments to Northstar Supplies will go to the new account.' },
            ],
          },
          pay: {
            url: 'https://vendors.finance.training.example/pay',
            host: 'vendors.finance.training.example',
            title: 'Approve payment',
            secure: true,
            blocks: [
              { type: 'heading', text: `Approve payment for invoice ${invoiceRef}` },
              { type: 'summary', rows: [
                { label: 'Pay to', value: 'A/C 0044 5566 7788 (requested)', strong: true },
                { label: 'Amount', value: 'INR 2,40,000' },
              ] },
              { type: 'notice', text: 'Approving pays the requested account now.' },
            ],
          },
          saved: {
            url: 'https://vendors.finance.training.example/edit',
            host: 'vendors.finance.training.example',
            title: 'Saved',
            final: true,
            blocks: [
              { type: 'result', heading: 'Beneficiary updated', text: 'The account on file was changed.' },
            ],
          },
          paid: {
            url: 'https://vendors.finance.training.example/pay',
            host: 'vendors.finance.training.example',
            title: 'Approved',
            final: true,
            blocks: [
              { type: 'result', heading: 'Payment approved', text: 'The invoice was approved for payment.' },
            ],
          },
        },
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Northstar Supplies (on file)',
        number: desk.identifier || '+91 00000 48373',
        script: [
          { at: 0, speaker: 'them', text: 'Northstar Supplies, accounts.' },
          { at: 3, speaker: 'them', text: 'We have not changed our bank details and did not send that.' },
          { at: 8, speaker: 'them', text: 'Please keep paying the account on file and report the message.' },
        ],
      },

      changecontrol: {
        kind: SURFACE.APP,
        appName: 'Change control',
        appTagline: 'Finance approvals',
        hero: { label: 'Beneficiary changes', value: 'None approved', caption: 'No change to Northstar Supplies is approved.' },
        sections: [
          {
            id: 'e10-cc-rows',
            heading: 'Pending changes',
            rows: [
              { label: 'Northstar Supplies', value: 'No approved beneficiary change' },
              { label: 'Process', value: 'Callback on the number on file + dual approval' },
              { label: 'Requested account', value: 'Not verified' },
            ],
            note: 'A beneficiary change is only applied after a callback and a second approver here.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Changes', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e10-c01', slot: SLOT.INLINE, label: 'Open the vendor email' }),
          action({ id: 'e10-c02', slot: SLOT.INLINE, label: 'Reply from the list to confirm' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e10-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Northstar Supplies', hint: 'Sender domain, Reply-To and the change',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e10-c04', slot: SLOT.INLINE, anchor: 'e10-file',
            label: 'Preview the attachment', hint: 'Read the beneficiary letter', opens: 'preview',
          }),
          action({ id: 'e10-c05', slot: SLOT.MENU, label: 'Read the earlier invoice thread' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e10-c06', slot: SLOT.SURFACE, on: 'vendormaster', page: 'confirm',
            label: 'Save the new beneficiary', thenPage: 'saved',
          }),
          action({
            id: 'e10-c07', slot: SLOT.SURFACE, on: 'vendormaster', page: 'pay',
            label: 'Approve the payment', thenPage: 'paid',
          }),
          action({
            id: 'e10-c08', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: lookalike },
            label: 'Reply confirming the new details', echo: 'Confirmed — we’ll update the account.',
          }),
          action({ id: 'e10-c09', slot: SLOT.MENU, label: 'Hold payment and change nothing' }),
          navigate({ id: 'e10-nav-vm', slot: SLOT.MENU, label: 'Open the vendor master record', opens: 'vendormaster' }),
        ],
      },

      verify: {
        affordances: [
          action({ id: 'e10-c10', slot: SLOT.MENU, label: 'Call the vendor contact on file', opens: 'call' }),
          action({
            id: 'e10-c11', slot: SLOT.MENU, label: 'Check the change-control system',
            hint: 'Look for an approved change yourself', opens: 'changecontrol',
          }),
          action({
            id: 'e10-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e10-c13', slot: SLOT.MENU, label: 'Reply to the sender to confirm the change' }),
          action({ id: 'e10-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e10-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e10-c16', slot: SLOT.INLINE, label: 'Hold payment and report the sender' }),
          action({ id: 'e10-c17', slot: SLOT.INLINE, label: 'Apply the change to keep the vendor happy' }),
          action({ id: 'e10-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e10-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e10-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e10-nav-cc', slot: SLOT.MENU, label: 'Open change control', opens: 'changecontrol', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e10-dir-vendor',
        name: 'Northstar Supplies (on file)',
        identifier: onFile,
        provenance: 'local approved directory',
        role: 'The vendor on file; bank changes go through a callback and change control, never an emailed letter.',
      },
    ],
  }
}

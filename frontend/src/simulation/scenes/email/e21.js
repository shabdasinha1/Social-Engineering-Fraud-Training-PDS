import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, attachment, body, directory, earlier, mail, quote, sender, table,
} from './shared.js'

/**
 * E21 - Verified Vendor Master Change (IMMERSIVE-009) - the legitimate high-risk change.
 *
 * Northstar Supplies really is changing its beneficiary account, and it is doing it the way the
 * approved process says: a signed change form raised as case VC-209 in the vendor portal, the
 * vendor's own request that the unit call them back on the number already on file, and a case that
 * cannot complete until two approvers have signed it. The mail itself is a no-reply workflow
 * notification from the portal, not a letter from a person.
 *
 * This is the first scene in the Email set whose safe branch is COMPLETING a high-risk change
 * rather than keeping, archiving or accepting something. Everything a learner has been taught to
 * distrust is present - a bank-detail change, an amount, a deadline - and every control that
 * should be there is there too: the form's fingerprint printed in the mail matches the one the
 * portal recorded when the vendor uploaded it, the callback is logged against the number in the
 * vendor master, and the case shows "Approval 1 of 2" with the first approver named. Rejecting it
 * out of caution is the mistake this scene prices, and so is short-circuiting dual control by
 * releasing the payment from the same screen.
 *
 * The Email-native part is that the notification's link is GENUINE - it points at the unit's own
 * vendor portal, and the message details say so. The lesson is not "never follow a link"; it is
 * that a link is checkable, and that a high-risk change is completed through its own controls.
 * Fictional throughout: Northstar Supplies, VC-209, every account and every number describe
 * nothing real, no money moves and nothing is typed on any screen.
 */
export function buildE21(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const desk = directory(scenario)
  const portalFrom = 'no-reply@vendorportal.unit.training.example'
  const vendorContact = 'accounts@northstar.training.example'
  const caseId = 'VC-209'
  const callback = '+91 00000 44180'
  const fingerprint = '4F 19 C0 7A 2B 8E 55 D3'
  const subject = `${caseId} — signed beneficiary change ready for second approval`

  return {
    scenarioId: 'E21',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Northstar Supplies' },
    messageSender: { display_name: 'Vendor Portal', identifier: portalFrom },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'portal', label: 'Portal', heading: 'Vendor Portal notices',
          rows: [
            {
              id: 'e21-p-1', from: 'Vendor Portal', subject: `${caseId} — case opened by Northstar Supplies`,
              preview: 'A beneficiary-change case has been raised and is awaiting the callback step.',
              time: '11 Sep', inert: true,
            },
            {
              id: 'e21-p-2', from: 'Vendor Portal', subject: 'VC-201 — case closed',
              preview: 'Approved by two approvers on 22 Aug. Audit record written.', time: '22 Aug', inert: true,
            },
          ],
        },
        { id: 'sent', label: 'Sent', heading: 'Sent', rows: [], empty: 'Earlier sent mail is in the thread.' },
      ],
      rows: [
        {
          id: 'e21-row', from: 'Vendor Portal', subject,
          preview: 'Signed beneficiary-change case VC-209 is available in the vendor portal.',
          time: '13:01', unread: true, tag: 'Portal', attachment: true,
        },
        {
          id: 'e21-bg-1', from: 'Audit Section', subject: 'Evidence retention for change cases',
          preview: 'Keep the callback note with the case, not in mail.', time: '10:40', inert: true,
        },
        {
          id: 'e21-bg-2', from: 'Kavita', subject: 'Re: quarterly vendor review',
          preview: 'You: Thursday works', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: 'Vendor Portal',
      time: '13:01',
      toLine: 'to me (Payments approvers)',
      detailsTo: 'details',
      labels: ['Inbox', 'Portal'],
    },

    beats: [
      /** The case's own earlier notice, so the workflow is visibly several days old. */
      earlier('e21-earlier-1', {
        from: 'Vendor Portal',
        to: 'Payments approvers',
        time: '11 Sep',
        snippet: `${caseId} opened by Northstar Supplies. Callback step pending.`,
        paragraphs: [
          `${caseId} has been opened by Northstar Supplies (vendor code NS-0041) to change the `
          + 'beneficiary account on their master record.',
          'The case cannot move to approval until the callback step is completed by a payments approver '
          + 'on the contact number already held in the vendor master.',
        ],
      }),
      earlier('e21-earlier-2', {
        from: 'Northstar Supplies (Accounts)',
        to: 'You',
        time: '12 Sep',
        snippet: 'We have raised the change through the portal and signed the form. Please call us to confirm.',
        paragraphs: [
          `Hello, we have raised the account change through your vendor portal as ${caseId} and uploaded `
          + 'the signed form.',
          `Please call us on ${callback} — the number you already hold for us — so your approver can `
          + 'complete the callback step. We will not send the account details by email.',
          'Regards,',
          `Anil Mehra · Accounts · Northstar Supplies · ${callback}`,
        ],
      }),
      body('e21-body', {
        greeting: 'Payments approvers,',
        paragraphs: [
          'Signed beneficiary-change case VC-209 is available in the vendor portal.',
          'The callback step was completed on 12 Sep and the case has one approval. It now requires a '
          + 'second approver before the vendor master is updated.',
          'Open the case in the portal to see the current and requested details side by side. This is an '
          + 'automated notice; replies to this address are not read.',
        ],
        signature: ['Vendor Portal', 'Payments workflow'],
        footer: 'Sent to the Payments approvers group. Case evidence is retained with the case.',
      }),
      table('e21-case', {
        rows: [
          { label: 'Case', value: `${caseId} · beneficiary change` },
          { label: 'Vendor', value: 'Northstar Supplies (NS-0041)' },
          { label: 'Raised', value: '11 Sep, by the vendor in the portal' },
          { label: 'Callback', value: `Completed 12 Sep on ${callback} (number on file)` },
          { label: 'Approvals', value: '1 of 2 · first approver K. Rao' },
          { label: 'Form fingerprint', value: fingerprint },
        ],
      }),
      attachment('e21-form', {
        fileName: 'VC-209_beneficiary_change_signed.pdf',
        fileKind: 'PDF',
        size: '214 KB',
      }),
      body('e21-tail', {
        paragraphs: [
          'The signed form is attached for reference. The portal holds the copy of record.',
        ],
        quoted: quote('On 11 Sep, Vendor Portal wrote:', [
          `${caseId} opened by Northstar Supplies. Callback step pending.`,
        ]),
      }),
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
                type: 'identity', name: 'Vendor Portal', address: portalFrom,
                note: 'Internal workflow address · 14 earlier notices in this mailbox',
              },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Vendor Portal <${portalFrom}>` },
                  { label: 'Reply-To', value: 'No reply address set' },
                  { label: 'To', value: 'payments.approvers@unit.training.example' },
                  { label: 'Link target', value: `https://vendorportal.unit.training.example/cases/${caseId}` },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'vendorportal.unit.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'unit.training.example', result: 'pass' },
                  { label: 'DMARC', value: 'aligned with the From domain', result: 'pass' },
                ],
              },
              {
                type: 'note',
                text: 'The link and the From domain are the unit’s own portal, the same one the Portal folder’s '
                  + 'earlier notices came from.',
              },
            ],
            links: [{ id: 'e21-link-form', label: 'Open the attached signed form', to: 'form' }],
          },
        },
      }),

      /**
       * The signed form itself. The fingerprint printed in the notice and the one the portal
       * recorded when the vendor uploaded it are both here, side by side, so they can be read
       * against each other rather than taken on trust.
       */
      form: mail({
        title: 'Signed form',
        home: 'form',
        inertNote: 'Local document preview. Nothing is opened, signed or sent from here.',
        pages: {
          form: {
            title: 'VC-209_beneficiary_change_signed.pdf',
            blocks: [
              { type: 'file', kind: 'pdf', name: 'VC-209_beneficiary_change_signed.pdf', meta: 'PDF · 214 KB · 2 pages' },
              {
                type: 'rows',
                heading: 'Signature',
                rows: [
                  { label: 'Signed by', value: 'Northstar Supplies (Accounts) — certificate valid' },
                  { label: 'Signed on', value: '11 Sep' },
                  { label: 'Fingerprint', value: fingerprint },
                ],
              },
              {
                type: 'note',
                text: `The portal recorded ${fingerprint} when the vendor uploaded the form. The two agree.`,
              },
              {
                type: 'rows',
                heading: 'On the form',
                rows: [
                  { label: 'Current account', value: 'A/C ····4455 · IFSC NRTH0000112' },
                  { label: 'Requested account', value: 'A/C ····7702 · IFSC NRTH0000551' },
                  { label: 'Reason', value: 'Banking partner migration, effective 01 Oct' },
                ],
              },
            ],
          },
        },
      }),

      /**
       * The unit's own vendor portal, reached from the notice. The address bar shows the
       * internal host, and the case page lays the two account records side by side.
       */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'case',
        pages: {
          case: {
            title: `${caseId} — beneficiary change`,
            host: 'vendorportal.unit.training.example',
            url: `https://vendorportal.unit.training.example/cases/${caseId}`,
            blocks: [
              { type: 'brand', monogram: 'VP', name: 'Vendor Portal', tagline: 'Unit payments workflow' },
              { type: 'heading', text: `${caseId} · Northstar Supplies (NS-0041)` },
              {
                type: 'summary',
                rows: [
                  { label: 'Current on file', value: 'A/C ····4455 · IFSC NRTH0000112 · verified at onboarding' },
                  { label: 'Requested', value: 'A/C ····7702 · IFSC NRTH0000551', strong: true },
                  { label: 'Signed form', value: `Uploaded 11 Sep · fingerprint ${fingerprint}` },
                  { label: 'Callback', value: `12 Sep · ${callback} · logged by K. Rao` },
                  { label: 'Approval 1 of 2', value: 'K. Rao, 12 Sep' },
                  { label: 'Approval 2 of 2', value: 'Awaiting a second approver' },
                ],
              },
              {
                type: 'notice',
                text: 'A second approver must be someone other than the approver who logged the callback. '
                  + 'The vendor master is updated only when both approvals are recorded.',
              },
              {
                type: 'fineprint',
                text: 'Every action on this case is written to the audit record with the approver’s name.',
              },
            ],
            links: [{ id: 'e21-link-audit', label: 'View the case audit trail', to: 'audit' }],
          },
          audit: {
            title: `${caseId} — audit trail`,
            host: 'vendorportal.unit.training.example',
            url: `https://vendorportal.unit.training.example/cases/${caseId}/audit`,
            blocks: [
              { type: 'heading', text: 'Audit trail' },
              {
                type: 'summary',
                rows: [
                  { label: '11 Sep 09:12', value: 'Case opened by the vendor; signed form uploaded' },
                  { label: '12 Sep 10:35', value: `Callback completed on ${callback} by K. Rao` },
                  { label: '12 Sep 10:41', value: 'Approval 1 of 2 recorded (K. Rao)' },
                  { label: '13 Sep 13:01', value: 'Notice sent to the Payments approvers group' },
                ],
              },
              { type: 'fineprint', text: 'The audit trail is read-only and is retained with the case.' },
            ],
          },
        },
      },

      /** The dual-control queue in the unit's own payments application. */
      approvals: {
        kind: SURFACE.APP,
        appName: 'Payments',
        appTagline: 'Dual control · pending approvals',
        hero: {
          label: 'Northstar Supplies (NS-0041)',
          value: `${caseId} · 1 of 2`,
          caption: 'Callback logged on the number in the vendor master. One approval recorded.',
        },
        sections: [
          {
            id: 'e21-appr-rows',
            heading: 'What the queue holds',
            rows: [
              { label: 'Callback', value: `12 Sep · ${callback} · K. Rao` },
              { label: 'Signed form', value: `Fingerprint ${fingerprint} matches the upload` },
              { label: 'First approver', value: 'K. Rao, 12 Sep' },
              { label: 'Second approver', value: 'Not yet recorded' },
            ],
            note: 'The master stays on the account on file until both approvals exist.',
          },
          {
            id: 'e21-appr-history',
            heading: 'Earlier change cases',
            rows: [
              { label: 'VC-201', value: 'Approved by two approvers · 22 Aug' },
              { label: 'VC-188', value: 'Rejected · callback did not match the master · 04 Jul' },
            ],
          },
        ],
        tabs: [
          { label: 'Queue', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The vendor, on the number the vendor master already holds. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Anil Mehra, Northstar (vendor master)',
        number: callback,
        script: [
          { at: 0, speaker: 'them', text: 'Northstar accounts, Anil speaking.' },
          { at: 3, speaker: 'them', text: `Yes — we raised ${caseId} in your portal on the 11th and uploaded the signed form.` },
          { at: 8, speaker: 'them', text: 'Your Mr Rao called us on the 12th and we confirmed the new account to him then.' },
          { at: 13, speaker: 'them', text: 'We are moving banking partners from 01 October. Nothing is urgent today.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e21-c01', slot: SLOT.INLINE, label: `Open the ${caseId} notice` }),
          action({ id: 'e21-c02', slot: SLOT.INLINE, label: 'Reply from the list to query it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e21-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Vendor Portal', hint: 'From, link target and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e21-c04', slot: SLOT.MENU, label: 'Read the case notices from 11 Sep' }),
          action({ id: 'e21-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e21-c06', slot: SLOT.SURFACE, on: 'portal', page: 'case',
            label: 'Record your approval as the second approver', targetId: browserAsset, closes: true,
          }),
          action({
            id: 'e21-c07', slot: SLOT.SURFACE, on: 'portal', page: 'case',
            label: `Reject ${caseId} and close the case`, closes: true,
          }),
          action({
            id: 'e21-c08', slot: SLOT.SURFACE, on: 'portal', page: 'case',
            label: 'Approve and release this month’s payment in one step', closes: true,
          }),
          action({
            id: 'e21-c09', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: vendorContact },
            label: 'Email the vendor for the account number in writing',
            echo: 'Please send us the new account number and IFSC by email so we can update the master.',
          }),
          navigate({
            id: 'e21-nav-portal', slot: SLOT.INLINE, anchor: 'e21-case',
            label: `Open ${caseId} in the vendor portal`, opens: 'portal',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e21-c10', slot: SLOT.MENU, label: 'Call the vendor on the number in the vendor master',
            hint: 'The contact already on file', opens: 'call',
          }),
          action({
            id: 'e21-c11', slot: SLOT.MENU, label: 'Check the case in the dual-control queue',
            hint: 'Callback and first approver', opens: 'approvals',
          }),
          action({
            id: 'e21-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e21-c13', slot: SLOT.MENU, label: 'Reply to the notice address to confirm' }),
          action({ id: 'e21-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e21-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e21-c16', slot: SLOT.INLINE, label: 'Complete the case and keep the evidence with it' }),
          action({ id: 'e21-c17', slot: SLOT.INLINE, label: 'Report the notice and leave the case open' }),
          action({ id: 'e21-c18', slot: SLOT.MENU, label: 'Keep the notice with the case file' }),
          action({ id: 'e21-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e21-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e21-nav-case', slot: SLOT.MENU, label: `Open ${caseId} in the portal`, opens: 'portal', after: 'branch' }),
      navigate({ id: 'e21-nav-queue', slot: SLOT.MENU, label: 'Open the dual-control queue', opens: 'approvals', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e21-dir-vendor',
        name: 'Northstar Supplies — accounts (vendor master)',
        identifier: callback,
        provenance: 'vendor master record, verified at onboarding',
        role: 'The contact held for this vendor since onboarding; used for every callback on a change case.',
      },
    ],
  }
}

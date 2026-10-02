import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, attachment, body, brand, button, browserPage, directory, mail, sender,
  subjectLine, table, timer,
} from './shared.js'

/**
 * E20 - Legal Notice and Secrecy Order (IMMERSIVE-008) - a summons that forbids asking anyone.
 *
 * A "National Inquiry Office" notice, flagged high importance and marked confidential, says the
 * learner's name has come up in a financial-crimes case, attaches a provisional warrant carrying a
 * seal, and requires a "refundable verification bond" paid before 17:00 to stop the warrant being
 * executed. It forbids discussing the matter with anyone - colleagues, family, employer, lawyer -
 * and says to reply only to this address. The pressure is fear, authority and, above all, isolation.
 *
 * The Email-native evidence: the sender and Reply-To are ordinary external domains; the seal is an
 * image inside a PDF with nothing to check it against; the case lookup lives on the same portal the
 * email links to, so it can only ever agree with itself. The decisions: opening the bond portal from
 * the email, uploading identity and bank statements there, paying the bond there, or replying to
 * ask for more time - against closing the notice without responding. The checks break the
 * isolation: the case looked up on the official case portal the learner already knows, and unit
 * legal support told. Nothing is typed anywhere - the upload and the payment are decisions, not
 * forms. Fictional throughout: the office, the case, the officer and the portal describe nothing
 * real, and no real law, court or procedure is named.
 */
export function buildE20(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const page = browserPage(scenario)
  const pageId = page?.asset_id ?? null
  const portalUrl = page?.display_target ?? 'https://e20.training.example/verify'
  const portalHost = page?.content?.host ?? 'e20.training.example'
  const file = asset(scenario, ASSET_KIND.FILE)
  const fileId = file?.asset_id ?? null
  const fileName = file?.content?.file_name ?? 'E20_attachment.pdf'
  const fileSize = file?.content?.file_size ?? '429 KB'
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const name = senderInfo.display_name ?? 'National Inquiry Office'
  const fromAddress = senderInfo.identifier ?? 'nationalinquiryoff@e20.training.example'
  const replyTo = 'insp.kapoor.nio@e20-mail.training.example'
  const caseNo = 'NIO/FC/2026/0917'

  return {
    scenarioId: 'E20',
    platform: 'email',
    notify: { sender: name },
    messageSender: { display_name: name, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'important', label: 'Important', heading: 'Important', rows: [], empty: 'Only today’s notice is marked important.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e20-row', from: name, subject: `CONFIDENTIAL: Summons in case ${caseNo}`,
          preview: subjectLine(scenario), time: '11:51', unread: true, attachment: true, tag: 'High importance',
        },
        {
          id: 'e20-bg-1', from: 'Welfare Section', subject: 'School fee reimbursement',
          preview: 'Claims for this term close on the 30th.', time: '10:18', inert: true,
        },
        {
          id: 'e20-bg-2', from: 'Neha', subject: 'Re: weekend plans',
          preview: 'You: sounds good, see you Saturday', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `CONFIDENTIAL: Summons in case ${caseNo}`,
      fromName: name,
      time: '11:51',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'High importance', 'Confidential'],
    },

    beats: [
      brand('e20-brand', { monogram: 'NIO', name, tagline: 'Financial Crimes Cell', color: '#5a2a27' }),
      body('e20-body', {
        greeting: 'To the addressee,',
        paragraphs: [
          subjectLine(scenario),
          `Your name and account details have been identified in case ${caseNo}, concerning accounts used `
          + 'to move the proceeds of crime. A provisional warrant has been issued and is attached.',
          'To avoid the warrant being executed, you must deposit a refundable verification bond before '
          + '17:00 today through the case portal below. The bond is returned once your statement is recorded.',
          'This matter is strictly confidential. Discussing it with colleagues, family, your employer or a '
          + 'lawyer will be treated as obstruction. Respond only to this address.',
        ],
        signature: ['Insp. R. Kapoor', 'Investigating Officer', name],
        footer: 'This notice is confidential and intended only for the addressee. Do not forward.',
      }),
      table('e20-case', {
        rows: [
          { label: 'Case', value: caseNo },
          { label: 'Officer', value: 'Insp. R. Kapoor' },
          { label: 'Bond', value: 'INR 49,500 (refundable)' },
          { label: 'Deadline', value: 'Today, 17:00' },
        ],
      }),
      timer('e20-deadline', { label: 'Warrant executes at', value: 'Today 17:00' }),
      button('e20-portal', { label: 'Open the case portal', caption: portalUrl }),
      attachment('e20-file', { fileName, fileKind: 'pdf', size: fileSize }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name, address: fromAddress, note: 'No earlier mail from this sender' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${name} <${fromAddress}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Importance', value: 'High · marked “Do not forward”' },
                  { label: 'Link', value: portalUrl },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender and request',
                rows: [
                  { label: 'Domain', value: 'e20.training.example — a general external domain', result: 'external' },
                  { label: 'Payment', value: 'A bond paid into a web portal', result: 'unusual' },
                  { label: 'Contact', value: 'Only this address; no office, no phone', result: 'restricted' },
                ],
              },
              { type: 'note', text: 'The case lookup the notice offers is on the same portal it links to.' },
            ],
          },
        },
      }),

      /** The provisional warrant, read in the preview. */
      warrant: mail({
        title: fileName,
        home: 'preview',
        inertNote: 'Local preview. The document is not opened, downloaded or run.',
        pages: {
          preview: {
            title: fileName,
            subtitle: `PDF · ${fileSize}`,
            blocks: [
              { type: 'file', kind: 'pdf', name: fileName, meta: `Provisional warrant · case ${caseNo}` },
              {
                type: 'mail',
                subject: 'PROVISIONAL WARRANT OF ARREST',
                from: name,
                address: 'Financial Crimes Cell · round seal, top right',
                date: 'Issued today',
                paragraphs: [
                  `In the matter of case ${caseNo}, the addressee is directed to deposit a verification bond `
                  + 'of INR 49,500 before 17:00 today, failing which this warrant shall be executed.',
                  'The addressee shall not disclose this warrant or its contents to any person.',
                  'Signed: Insp. R. Kapoor, Investigating Officer.',
                ],
              },
              { type: 'note', text: 'The seal is a picture inside the PDF. Nothing in the file itself can confirm who issued it.' },
            ],
          },
        },
      }),

      /** The bond portal the notice links to. Upload and payment are decisions; nothing is typed. */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'case',
        pages: {
          case: {
            url: portalUrl,
            host: portalHost,
            title: 'Case portal',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'NIO', name, tagline: 'Case portal' },
              { type: 'heading', text: `Case ${caseNo}` },
              {
                type: 'summary',
                rows: [
                  { label: 'Status', value: 'Warrant pending', strong: true },
                  { label: 'Bond due', value: 'INR 49,500' },
                  { label: 'Deadline', value: 'Today 17:00' },
                ],
              },
              { type: 'notice', text: 'To register the bond, upload identity proof and your last three bank statements, then pay the bond.' },
            ],
            links: [
              { id: 'e20-link-upload', label: 'Upload documents', to: 'upload' },
              { id: 'e20-link-pay', label: 'Pay the bond', to: 'pay' },
            ],
          },
          upload: {
            url: `${portalUrl}/documents`,
            host: portalHost,
            title: 'Upload documents',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Upload documents' },
              {
                type: 'summary',
                rows: [
                  { label: 'Identity proof', value: 'Photo of your ID card (front and back)' },
                  { label: 'Bank statements', value: 'Last three months' },
                  { label: 'Selfie', value: 'Holding your ID card' },
                ],
              },
              { type: 'fineprint', text: 'Files are chosen from your phone. Uploading sends them to this portal.' },
            ],
          },
          pay: {
            url: `${portalUrl}/bond`,
            host: portalHost,
            title: 'Pay the bond',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Verification bond' },
              {
                type: 'summary',
                rows: [
                  { label: 'Pay to', value: 'NIO Bond Escrow · A/C 7701 2219 0045', strong: true },
                  { label: 'Amount', value: 'INR 49,500' },
                  { label: 'Reference', value: caseNo },
                ],
              },
              { type: 'notice', text: 'Paying moves the money from your account now.' },
            ],
          },
          uploaded: {
            url: `${portalUrl}/documents`,
            host: portalHost,
            title: 'Uploaded',
            final: true,
            blocks: [{ type: 'result', heading: 'Documents received', text: 'Your identity proof and statements were uploaded.' }],
          },
          paid: {
            url: `${portalUrl}/bond`,
            host: portalHost,
            title: 'Paid',
            final: true,
            blocks: [{ type: 'result', heading: 'Bond paid', text: 'INR 49,500 was sent to the escrow account.' }],
          },
        },
      },

      /** The official case-status portal the learner already knows, opened on its own. */
      lookup: {
        kind: SURFACE.APP,
        appName: 'Case status',
        appTagline: 'Official case portal · your saved app',
        hero: { label: `Case ${caseNo}`, value: 'No record found', caption: 'No case, notice or warrant under this number or your name.' },
        sections: [
          {
            id: 'e20-lookup-rows',
            heading: 'Search',
            rows: [
              { label: 'Case number', value: `${caseNo} · not found` },
              { label: 'Your name', value: 'No matters listed' },
              { label: 'How notices arrive', value: 'In person or by registered post, never with a payment link' },
            ],
            note: 'This portal is the one you use for official matters. It was not reached through the email.',
          },
        ],
        tabs: [
          { label: 'Search', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      legal: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit legal support (directory)',
        number: '+91 00000 89150',
        script: [
          { at: 0, speaker: 'them', text: 'Legal support cell.' },
          { at: 3, speaker: 'them', text: 'You did the right thing calling. No authority takes a bond through an emailed link, and none tells you to keep it from us.' },
          { at: 9, speaker: 'them', text: 'Don’t pay or reply. Keep the email and report it; we will note it for security.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e20-c01', slot: SLOT.INLINE, label: 'Open the summons email' }),
          action({ id: 'e20-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what this is about' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e20-c03', slot: SLOT.INLINE, anchor: 'header',
            label: name, hint: 'Domain, Reply-To and the payment route',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e20-c04', slot: SLOT.INLINE, anchor: 'e20-file',
            label: 'Preview the warrant', hint: 'Read it without opening it', targetId: fileId, opens: 'warrant',
          }),
          action({ id: 'e20-c05', slot: SLOT.MENU, label: 'Read the whole notice' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e20-c06', slot: SLOT.INLINE, anchor: 'e20-portal',
            label: 'Open the case portal', targetId: pageId, opens: 'portal',
          }),
          action({
            id: 'e20-c07', slot: SLOT.SURFACE, on: 'portal', page: 'upload',
            label: 'Upload the documents', thenPage: 'uploaded',
          }),
          action({
            id: 'e20-c08', slot: SLOT.SURFACE, on: 'portal', page: 'pay',
            label: 'Pay INR 49,500 now', targetId: paymentAsset, thenPage: 'paid',
          }),
          action({
            id: 'e20-c09', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: replyTo },
            label: 'Reply asking for more time',
            echo: 'I have done nothing wrong. Please give me until tomorrow to arrange the amount.',
          }),
          action({ id: 'e20-c10', slot: SLOT.MENU, label: 'Close the notice without responding' }),
          navigate({ id: 'e20-nav-portal', slot: SLOT.MENU, label: 'Go to the case portal', opens: 'portal' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e20-c11', slot: SLOT.MENU, label: 'Look the case up in the official case-status app',
            hint: 'The portal you already use, not the link', opens: 'lookup',
          }),
          action({ id: 'e20-c12', slot: SLOT.MENU, label: 'Tell unit legal support on the directory number', opens: 'legal' }),
          action({
            id: 'e20-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e20-c14', slot: SLOT.MENU, label: 'Check the case number on the portal in the notice' }),
          action({ id: 'e20-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e20-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e20-c17', slot: SLOT.INLINE, label: 'Report it and keep the email as evidence' }),
          action({ id: 'e20-c18', slot: SLOT.INLINE, label: 'Pay the bond to be safe' }),
          action({ id: 'e20-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e20-c20', slot: SLOT.MENU, label: 'Delete it and tell no one' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e20-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e20-nav-lookup', slot: SLOT.MENU, label: 'Open the case-status app', opens: 'lookup', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e20-dir-legal',
        name: 'Unit legal support',
        identifier: '+91 00000 89150',
        provenance: 'local approved directory',
        role: 'Advises staff on any legal notice, summons or demand they receive, in confidence.',
      },
    ],
  }
}

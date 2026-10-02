import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, asset, assetId, attachment, body, directory, mail, sender, subjectLine,
} from './shared.js'

/**
 * E13 - Password-Protected ZIP (IMMERSIVE-007) - archive-delivered malware.
 *
 * An unknown "Case Documents" sender attaches a password-protected archive and puts the
 * password in the message itself - the classic move that carries a payload past the mail
 * gateway, because a scanner cannot look inside an archive it has no password for. The learner
 * types the password, the archive opens, and inside is a document-shaped executable
 * (`Case_Scan.pdf.exe`) beside a decoy. Extracting the files or running the "document" is the
 * risk; leaving it unopened is safe.
 *
 * This is the batch's second malware scene, and it is deliberately unlike E02's macro
 * spreadsheet: there is no "Enable content" bar and no drawn grid, but an archive viewer with a
 * file list and a double-extension executable, and the decision splits into extracting versus
 * running. Nothing executes: the viewer is a drawn list, the archive is never mounted and the
 * "run" control only records the choice. The checks are the approved records system and a call
 * to the desk. Fictional: the case, the sender and the files describe nothing real.
 */
export function buildE13(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = asset(scenario, ASSET_KIND.FILE)
  const fileId = fileAsset?.asset_id ?? null
  const fileName = fileAsset?.content?.file_name ?? 'CaseFiles.zip'
  const fileSize = fileAsset?.content?.file_size ?? '906 KB'
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'casedocuments@e13.training.example'
  const innerExe = 'Case_Scan.pdf.exe'

  return {
    scenarioId: 'E13',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Case Documents' },
    messageSender: { display_name: senderInfo.display_name ?? 'Case Documents', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'quarantine', label: 'Quarantine', heading: 'Quarantine', rows: [], empty: 'Nothing quarantined.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e13-row', from: 'Case Documents', subject: subjectLine(scenario),
          preview: 'Confidential scan attached. Password inside the message…',
          time: '11:01', unread: true, attachment: true, tag: 'External',
        },
        {
          id: 'e13-bg-1', from: 'IT Security', subject: 'Reminder: report suspicious mail',
          preview: 'Use the Report button, don’t forward.', time: '10:05', inert: true,
        },
        {
          id: 'e13-bg-2', from: 'Arjun', subject: 'Re: duty swap',
          preview: 'You: thanks, confirmed', time: 'Wed', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Case Documents',
      time: '11:01',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      body('e13-body', {
        greeting: 'Hello,',
        paragraphs: [
          'Please find the confidential case scan attached. It is encrypted for security.',
          `To open it, use the password: 2468. Extract ${fileName} and open the document inside.`,
        ],
        signature: ['Case Documents', 'Records'],
        footer: 'Encrypted so only you can read it. Please action today.',
      }),
      attachment('e13-file', { fileName, fileKind: 'zip', size: fileSize }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Case Documents', address: fromAddress, note: 'External sender you have no case with' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Case Documents <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Attachment', value: `${fileName} · encrypted archive` },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Archive', value: 'Encrypted; scanner cannot inspect it', result: 'unscanned' },
                  { label: 'Password', value: 'Placed in the message body', result: 'in-message' },
                  { label: 'Case', value: 'No matching case assigned to you', result: 'unexpected' },
                ],
              },
              { type: 'note', text: 'A password put in the same email that carries the archive is there to get the file past inspection, not to protect you.' },
            ],
          },
        },
      }),

      /** The inert archive viewer: a file list with a document-shaped executable inside. */
      preview: mail({
        title: fileName,
        home: 'preview',
        inertNote: 'Local archive view. Nothing is extracted, mounted or run.',
        pages: {
          preview: {
            title: fileName,
            subtitle: `Encrypted archive · ${fileSize}`,
            blocks: [
              { type: 'file', kind: 'zip', name: fileName, meta: `Unlocked with 2468 · ${fileSize}` },
              {
                type: 'items',
                heading: 'Inside the archive',
                items: [
                  { label: innerExe, value: 'Application · 812 KB', file: 'application', meta: '.exe' },
                  { label: 'read-me-first.txt', value: 'Text · 1 KB', file: 'text' },
                ],
              },
              { type: 'note', text: 'A file that ends .pdf.exe is a program wearing a document name. Opening it runs it.' },
            ],
          },
          extracted: {
            title: fileName,
            final: true,
            blocks: [
              { type: 'result', heading: 'Files extracted', text: 'The archive contents were written to disk.' },
            ],
          },
          ran: {
            title: innerExe,
            final: true,
            blocks: [
              { type: 'result', heading: 'File opened', text: 'The document-shaped program was launched.' },
            ],
          },
        },
      }),

      records: {
        kind: SURFACE.APP,
        appName: 'Records system',
        appTagline: 'Approved case store',
        hero: { label: 'Case lookup', value: 'No case', caption: 'No case is assigned to you from this sender.' },
        sections: [
          {
            id: 'e13-records-rows',
            heading: 'Search results',
            rows: [
              { label: 'Sender', value: 'Not a registered records contact' },
              { label: 'Assigned cases', value: 'None for you' },
            ],
            note: 'Case files are shared inside the records system, never as an emailed encrypted archive.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Cases', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Records desk (saved)',
        number: '+91 00000 73304',
        script: [
          { at: 0, speaker: 'them', text: 'Records desk.' },
          { at: 3, speaker: 'them', text: 'We did not send you an archive, and we never email a password with a file.' },
          { at: 8, speaker: 'them', text: 'Please report it and do not extract or open the attachment.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e13-c01', slot: SLOT.INLINE, label: 'Open the case email' }),
          action({ id: 'e13-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about the case' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e13-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Case Documents', hint: 'Sender, the archive and the password',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e13-c04', slot: SLOT.INLINE, anchor: 'e13-file',
            label: 'Open the archive to look inside', hint: 'View the contents without extracting',
            targetId: fileId, opens: 'preview',
          }),
          action({ id: 'e13-c05', slot: SLOT.MENU, label: 'Read the whole message' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e13-c06', slot: SLOT.SURFACE, on: 'preview', page: 'preview',
            label: 'Extract the files', targetId: fileId, thenPage: 'extracted',
          }),
          action({
            id: 'e13-c07', slot: SLOT.SURFACE, on: 'preview', page: 'preview',
            label: `Open ${innerExe}`, targetId: fileId, thenPage: 'ran',
          }),
          action({ id: 'e13-c08', slot: SLOT.SURFACE, on: 'preview', label: 'Close without extracting', closes: true }),
          action({ id: 'e13-c09', slot: SLOT.MENU, label: 'Delete the archive unopened' }),
          navigate({ id: 'e13-nav-preview', slot: SLOT.MENU, label: 'Open the archive', opens: 'preview' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e13-c10', slot: SLOT.MENU, label: 'Check the records system for the case',
            hint: 'Look it up yourself', opens: 'records',
          }),
          action({ id: 'e13-c11', slot: SLOT.MENU, label: 'Call the records desk on the saved number', opens: 'call' }),
          action({
            id: 'e13-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e13-c13', slot: SLOT.MENU, label: 'Reply to the sender for the real file' }),
          action({ id: 'e13-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e13-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e13-c16', slot: SLOT.INLINE, label: 'Report and quarantine the archive' }),
          action({ id: 'e13-c17', slot: SLOT.INLINE, label: 'Extract it and read the document' }),
          action({ id: 'e13-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e13-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e13-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e13-nav-records', slot: SLOT.MENU, label: 'Open the records system', opens: 'records', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e13-dir-records',
        name: 'Records desk',
        identifier: '+91 00000 73304',
        provenance: 'local approved directory',
        role: 'Shares case files inside the records system; never emails an encrypted archive with its password.',
      },
    ],
  }
}

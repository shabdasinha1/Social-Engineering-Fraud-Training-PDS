import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, attachment, body, brand, directory, mail, sender, subjectLine, table,
} from './shared.js'

/**
 * E23 - DLP Alert HTML Attachment (IMMERSIVE-009) - the page that is already on your device.
 *
 * "Data Protection Monitor" writes that outbound traffic from the learner's account tripped an
 * exfiltration rule, and attaches SecurityReport.html so the finding can be reviewed locally. The
 * pretext is compliance rather than reward: a security tool telling you that you are the incident.
 *
 * What makes this scene different from every earlier attachment scene is where the payload runs.
 * The mail app refuses to render HTML inline and offers only "Open in browser", and when the
 * browser opens it the address bar shows a path on the device - no host, no padlock, nothing to
 * check. Every lesson the learner has been taught about reading a domain gives them nothing here,
 * because the page was never fetched from anywhere: it arrived in the message and was written to
 * Downloads. The sign-in box it draws is a picture of the unit's own login, and the "secure
 * viewer" button beside it is an installer.
 *
 * The checks are the tools the learner already has: the unit's own Data Protection console, which
 * lists alerts for their account and has none, and the IT security desk on the directory number.
 * Fictional throughout: the monitor, the rule, the report and every address describe nothing real;
 * nothing is downloaded, installed or run, and what is typed into the drawn form stays on the
 * screen it is typed on.
 */
export function buildE23(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const fileAssetId = assetId(scenario, ASSET_KIND.FILE)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'dataprotectionmoni@e23.training.example'
  const senderName = senderInfo.display_name ?? 'Data Protection Monitor'
  const replyTo = 'dlp-review@e23-alerts.training.example'
  const itDesk = '+91 00000 67415'
  const caseRef = 'DLP-4471'
  const subject = `Policy violation ${caseRef} — review required`

  return {
    scenarioId: 'E23',
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
          id: 'it', label: 'IT', heading: 'IT notices',
          rows: [
            {
              id: 'e23-it-1', from: 'IT Operations', subject: 'Quarterly data-handling refresher',
              preview: 'Course opens in the learning portal on Monday.', time: '08 Sep', inert: true,
            },
            {
              id: 'e23-it-2', from: 'IT Security', subject: 'How we contact you about an alert',
              preview: 'Alerts appear in the console. We never attach one.', time: '21 Aug', inert: true,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e23-row', from: senderName, subject,
          preview: subjectLine(scenario), time: '12:19', unread: true, tag: 'External', attachment: true,
        },
        {
          id: 'e23-bg-1', from: 'Facilities', subject: 'Lift maintenance, Block C',
          preview: 'Thursday 09:00 to 13:00.', time: '11:15', inert: true,
        },
        {
          id: 'e23-bg-2', from: 'Nisha', subject: 'Re: draft handover note',
          preview: 'You: sending the final version today', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: senderName,
      time: '12:19',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      brand('e23-brand', {
        monogram: 'DP', name: 'Data Protection Monitor', tagline: 'Automated policy alert', color: '#5b1f1f',
      }),
      body('e23-body', {
        greeting: 'Dear user,',
        paragraphs: [
          subjectLine(scenario),
          `Our monitoring has flagged an outbound transfer from your account against rule ${caseRef} `
          + '(bulk transfer of internal documents to an unapproved destination).',
          'The full finding is attached as an offline report so that it can be reviewed without '
          + 'sending anything further over the network. Open the attachment, sign in with your work '
          + 'account to unlock the finding, and confirm within 24 hours.',
          'Unreviewed findings are escalated to your line manager and your account is restricted '
          + 'pending review.',
        ],
        signature: ['Data Protection Monitor', 'Automated compliance alerting'],
        footer: 'This is an automated alert. Do not forward this report — it contains the flagged content.',
      }),
      table('e23-finding', {
        rows: [
          { label: 'Case', value: caseRef },
          { label: 'Account', value: LEARNER.account },
          { label: 'Rule', value: 'Bulk transfer to an unapproved destination' },
          { label: 'Detected', value: 'Today 11:52' },
          { label: 'Status', value: 'Awaiting your review' },
        ],
      }),
      attachment('e23-report', {
        fileName: 'SecurityReport.html',
        fileKind: 'HTML',
        size: '867 KB',
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
                type: 'identity', name: senderName, address: fromAddress,
                note: 'No earlier mail from this sender',
              },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${senderName} <${fromAddress}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Links', value: 'None — one attachment' },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e23.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e23.training.example', result: 'pass' },
                  { label: 'Reply-To', value: 'e23-alerts.training.example', result: 'differs' },
                ],
              },
              {
                type: 'note',
                text: 'Your own tools are on unit.training.example. An alert about your account that '
                  + 'arrives from outside it is an alert from someone else.',
              },
            ],
            links: [{ id: 'e23-link-preview', label: 'Open the attachment preview', to: 'preview' }],
          },
        },
      }),

      /**
       * The mail app's attachment preview. It cannot render HTML inline, so its message bar
       * offers the only thing a mail client offers for this kind of file: open it in the
       * browser. That bar is where the scene's control for this screen sits.
       */
      preview: mail({
        title: 'Attachment',
        home: 'preview',
        inertNote: 'Local preview. Nothing is rendered, run or downloaded from here.',
        pages: {
          preview: {
            title: 'SecurityReport.html',
            blocks: [
              { type: 'file', kind: 'html', name: 'SecurityReport.html', meta: 'HTML document · 867 KB' },
              {
                type: 'bar',
                title: 'Preview not available.',
                text: 'This mail app does not display HTML attachments. The file has been saved to '
                  + 'Downloads on this device and can be opened in the browser.',
              },
              {
                type: 'rows',
                heading: 'File',
                rows: [
                  { label: 'Type', value: 'HTML document (a web page in a file)' },
                  { label: 'Saved to', value: 'Downloads on this device' },
                  { label: 'Scripts', value: 'The file contains script it will run when opened' },
                  { label: 'Signature', value: 'None' },
                ],
              },
              {
                type: 'note',
                text: 'A page opened from a file on the device has no address to check: whatever it '
                  + 'draws, the bar will show a path in Downloads.',
              },
            ],
          },
        },
      }),

      /**
       * The report, opened from the device. The address is a local path, the page is
       * "not secure", and the sign-in box and the download button are what the file draws.
       */
      local: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'report',
        pages: {
          report: {
            title: 'Data Protection — finding review',
            host: 'Downloads',
            url: 'file:///storage/downloads/SecurityReport.html',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'DP', name: 'Data Protection Monitor', tagline: 'Finding review portal' },
              { type: 'heading', text: `Finding ${caseRef} is locked` },
              {
                type: 'text',
                text: 'The flagged content is encrypted in this report. Sign in with your work account '
                  + 'to unlock it, or install the secure viewer to open it offline.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Case', value: caseRef },
                  { label: 'Account', value: LEARNER.account },
                  { label: 'Files flagged', value: '14 (locked)' },
                ],
              },
              {
                type: 'form',
                title: 'Unlock the finding',
                fields: [
                  field({ name: 'account', label: 'Work email', kind: FIELD_KIND.TEXT, length: 6, max: 42 }),
                  field({ name: 'passphrase', label: 'Password', kind: FIELD_KIND.MASKED, length: 4, max: 32 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is running from a file on this device. The address bar shows where the '
                  + 'file is, not who wrote it.',
              },
            ],
            links: [{ id: 'e23-link-viewer', label: 'Can’t sign in? Install the secure viewer', to: 'viewer' }],
          },
          viewer: {
            title: 'Secure viewer',
            host: 'Downloads',
            url: 'file:///storage/downloads/SecurityReport.html#viewer',
            secure: false,
            blocks: [
              { type: 'heading', text: 'DP Secure Viewer' },
              {
                type: 'text',
                text: 'The viewer opens locked findings without signing in. It needs permission to read '
                  + 'files on this device and to run in the background.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Package', value: 'dp-secure-viewer · unknown publisher' },
                  { label: 'Asks for', value: 'Files, background activity, accessibility' },
                  { label: 'Signed by', value: 'Nobody' },
                ],
              },
              { type: 'fineprint', text: 'Nothing can be installed from this simulation.' },
            ],
          },
        },
      },

      /** The unit's own Data Protection console - the place an alert would actually appear. */
      console: {
        kind: SURFACE.APP,
        appName: 'Data Protection',
        appTagline: 'Console · alerts for your account',
        hero: {
          label: 'Alerts for you',
          value: 'None open',
          caption: 'No rule has been triggered on this account in the last 30 days.',
        },
        sections: [
          {
            id: 'e23-console-rows',
            heading: 'Your account',
            rows: [
              { label: 'Open alerts', value: 'None' },
              { label: 'Last 30 days', value: 'No rule triggered' },
              { label: `Case ${caseRef}`, value: 'No case with this reference exists' },
            ],
            note: 'Findings are reviewed in this console. A finding is never sent out as a file.',
          },
          {
            id: 'e23-console-how',
            heading: 'How you are told',
            rows: [
              { label: 'Where', value: 'Here, and a notice from IT Security on unit.training.example' },
              { label: 'Attachments', value: 'Never — the finding stays in the console' },
            ],
          },
        ],
        tabs: [
          { label: 'Alerts', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** IT security, on the number in the trusted directory. */
      security: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'IT security desk (directory)',
        number: itDesk,
        script: [
          { at: 0, speaker: 'them', text: 'IT security desk.' },
          { at: 3, speaker: 'them', text: `There is no ${caseRef} and nothing open against your account.` },
          { at: 8, speaker: 'them', text: 'We never send a finding as an attachment — it stays in the console you can open yourself.' },
          { at: 13, speaker: 'them', text: 'Don’t open the file. Report the message and we will take it from there.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e23-c01', slot: SLOT.INLINE, label: 'Open the alert' }),
          action({ id: 'e23-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what was flagged' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e23-c03', slot: SLOT.INLINE, anchor: 'header',
            label: senderName, hint: 'Sender, Reply-To and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e23-c04', slot: SLOT.INLINE, anchor: 'e23-report',
            label: 'Preview the attachment', hint: 'What kind of file it is',
            targetId: fileAssetId, opens: 'preview',
          }),
          action({ id: 'e23-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e23-c06', slot: SLOT.SURFACE, on: 'preview',
            label: 'Open it in the browser', targetId: fileAssetId, opens: 'local',
          }),
          action({
            id: 'e23-c07', slot: SLOT.SURFACE, on: 'local', page: 'report',
            label: 'Unlock the finding', targetId: browserAsset, thenPage: 'viewer',
          }),
          action({
            id: 'e23-c08', slot: SLOT.SURFACE, on: 'local', page: 'viewer',
            label: 'Install the secure viewer', closes: true,
          }),
          action({
            id: 'e23-c09', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: replyTo },
            label: 'Reply asking which files were flagged',
            echo: 'Which files were flagged? I cannot open the report on this device.',
          }),
          action({ id: 'e23-c10', slot: SLOT.MENU, label: 'Leave the attachment unopened and close the message' }),
          /**
           * The file is already saved to Downloads, so the device can open it without the mail
           * app's button. Walking there is navigation and records nothing (the same shape as
           * E20's "Go to the case portal"); it is what makes the page's own two releases
           * reachable as alternatives to opening it from the message.
           */
          navigate({ id: 'e23-nav-downloads', slot: SLOT.MENU, label: 'Open the saved file from Downloads', opens: 'local' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e23-c11', slot: SLOT.MENU, label: 'Open the Data Protection console and look for the case',
            hint: 'Alerts raised against your account', opens: 'console',
          }),
          action({
            id: 'e23-c12', slot: SLOT.MENU, label: 'Call the IT security desk on the directory number',
            opens: 'security',
          }),
          action({
            id: 'e23-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e23-c14', slot: SLOT.MENU, label: 'Reply to the alert address to confirm it is real' }),
          action({ id: 'e23-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e23-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e23-c17', slot: SLOT.INLINE, label: 'Report it and leave the attachment unopened' }),
          action({ id: 'e23-c18', slot: SLOT.INLINE, label: 'Complete the review before the 24 hours run out' }),
          action({ id: 'e23-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e23-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e23-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e23-nav-preview', slot: SLOT.MENU, label: 'Open the attachment preview', opens: 'preview', after: 'inspect' }),
      navigate({ id: 'e23-nav-console', slot: SLOT.MENU, label: 'Open the Data Protection console', opens: 'console', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e23-dir-it',
        name: 'IT security desk — internal directory',
        identifier: itDesk,
        provenance: 'internal directory, printed on the intranet',
        role: 'Raises and closes data-protection findings; the console holds every open case.',
      },
    ],
  }
}

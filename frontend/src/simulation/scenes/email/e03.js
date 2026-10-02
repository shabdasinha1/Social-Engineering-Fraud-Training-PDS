import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, directory, earlier, mail, sender, subjectLine, table,
} from './shared.js'

/**
 * E03 - Authenticated Internal Newsletter (IMMERSIVE-005) - the legitimate control.
 *
 * The monthly training newsletter arrives from the internal Learning Office address it always
 * comes from, on its usual cadence, with a read-only edition and no action request. Every
 * signal a cautious reader checks lines up: the sender matches the prior monthly thread, the
 * authentication summary passes, there is no attachment and no login. The correct behaviour
 * is to read and archive it on the normal in-app path; reporting or blocking it is a false
 * positive, and forwarding it off-platform is the needless external action.
 *
 * This is the batch's legitimate scenario, so it is deliberately not thinner than the four
 * malicious ones: it has the same length of thread, the same details sheet and its own
 * verification route (the internal newsletter archive, where the issue number matches).
 */
export function buildE03(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'learningoffice@e03.training.example'
  const issue = 'Issue 09 / 2026'

  return {
    scenarioId: 'E03',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Learning Office' },
    messageSender: { display_name: senderInfo.display_name ?? 'Learning Office', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'updates', label: 'Updates', heading: 'Updates', rows: [], empty: 'No updates.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e03-row', from: 'Learning Office', subject: subjectLine(scenario),
          preview: 'This month: fire drill dates, a phishing refresher and the reading list.',
          time: '10:03', unread: true, tag: 'Newsletter',
        },
        {
          id: 'e03-bg-1', from: 'Duty Roster', subject: 'Next week’s roster',
          preview: 'Published. Check your slots.', time: '09:15', inert: true,
        },
        {
          id: 'e03-bg-2', from: 'Anil Kumar', subject: 'Re: range booking',
          preview: 'You: booked for Thursday', time: 'Fri', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Learning Office',
      time: '10:03',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Newsletter'],
    },

    beats: [
      /** Last month's edition, from the same address - the cadence the client names. */
      earlier('e03-earlier', {
        from: 'Learning Office',
        to: 'All users',
        time: '2 Aug',
        snippet: 'August safety newsletter - read-only edition.',
        paragraphs: [
          'Issue 08 / 2026. This month: heat-safety, a password refresher and the August reading list.',
          'Learning Office · learningoffice@e03.training.example',
        ],
      }),

      brand('e03-brand', { monogram: 'LO', name: 'Learning Office', tagline: 'Monthly safety newsletter', color: '#1f6a3c' }),
      body('e03-body', {
        greeting: 'Hello everyone,',
        paragraphs: [
          `Welcome to the September edition (${issue}). This is a read-only newsletter — there is `
          + 'nothing to sign in to and nothing to send back.',
          'Inside: the fire-drill dates, a short phishing refresher, and the September reading list.',
        ],
        signature: ['Learning Office'],
        footer: `${issue} · Sent to all users · Archived on the internal portal.`,
      }),
      table('e03-toc', {
        rows: [
          { label: 'Fire drill', value: 'Thursday 18th, 09:30 — muster as usual' },
          { label: 'Refresher', value: 'Spotting a fake login page' },
          { label: 'Reading', value: 'Three short pieces on the portal' },
        ],
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
              { type: 'identity', name: 'Learning Office', address: fromAddress, note: 'Matches your monthly newsletter' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Learning Office <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: 'All users' },
                  { label: 'Date', value: 'Today, 10:03' },
                  { label: 'List', value: `${issue}` },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'passes for the internal domain', result: 'pass' },
                  { label: 'DKIM', value: 'valid signature', result: 'pass' },
                  { label: 'DMARC', value: 'aligned with From address', result: 'pass' },
                ],
              },
              { type: 'note', text: 'The sender, the domain and the cadence all match the monthly newsletter.' },
            ],
          },
        },
      }),

      reader: mail({
        title: issue,
        home: 'reader',
        inertNote: 'Local newsletter reader. Nothing here signs you in or sends anything.',
        pages: {
          reader: {
            title: 'September newsletter',
            subtitle: issue,
            blocks: [
              { type: 'heading', text: 'Spotting a fake login page' },
              {
                type: 'mail',
                subject: 'This month’s refresher',
                from: 'Learning Office',
                address: fromAddress,
                date: issue,
                paragraphs: [
                  'A real password change always starts from the portal you already use, never from a '
                  + 'link in a message. If a page asks for your password and a one-time code together, stop.',
                  'That is all for this month. There is nothing to reply to.',
                ],
              },
            ],
          },
        },
      }),

      archive: {
        kind: SURFACE.APP,
        appName: 'Newsletter archive',
        appTagline: 'Internal portal',
        hero: { label: 'Latest issue', value: issue, caption: 'Matches the message you received.' },
        sections: [
          {
            id: 'e03-archive-rows',
            heading: 'Recent issues',
            rows: [
              { label: 'Issue 09 / 2026', value: 'Published today by Learning Office' },
              { label: 'Issue 08 / 2026', value: 'Published 2 August' },
              { label: 'Issue 07 / 2026', value: 'Published 3 July' },
            ],
            note: 'Every edition is published here by the Learning Office. This month’s number matches.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Issues', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e03-c01', slot: SLOT.INLINE, label: 'Open the September newsletter' }),
          action({ id: 'e03-c02', slot: SLOT.INLINE, label: 'Reply from the list before reading it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e03-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Learning Office', hint: 'Sender, authentication and cadence',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e03-c04', slot: SLOT.MENU, label: 'Read the whole thread from last month' }),
          navigate({ id: 'e03-nav-reader', slot: SLOT.MENU, label: 'Open the newsletter reader', opens: 'reader' }),
        ],
      },

      branch: {
        affordances: [
          action({ id: 'e03-c06', slot: SLOT.INLINE, label: 'Read it and archive it normally' }),
          action({ id: 'e03-c07', slot: SLOT.INLINE, label: 'Delete it unread, just in case' }),
          action({
            id: 'e03-c08', slot: SLOT.COMPOSER, compose: { mode: 'forward', to: 'my.personal@webmail.training.example' },
            label: 'Forward it to my personal email to read at home',
            echo: 'Forwarding the staff newsletter to read later.',
          }),
          action({ id: 'e03-c09', slot: SLOT.MENU, label: 'Mark it as read' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e03-c10', slot: SLOT.MENU, label: 'Compare the issue number in the newsletter archive',
            hint: 'Check it against the internal archive', opens: 'archive',
          }),
          action({
            id: 'e03-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the Learning Office'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e03-c12', slot: SLOT.MENU, label: 'Reply to the Learning Office to check it is real' }),
          action({ id: 'e03-c13', slot: SLOT.MENU, label: 'Report and delete it' }),
          action({ id: 'e03-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e03-c15', slot: SLOT.INLINE, label: 'Keep it — mark as read' }),
          action({ id: 'e03-c16', slot: SLOT.INLINE, label: 'Report and delete it' }),
          action({ id: 'e03-c17', slot: SLOT.MENU, label: 'Archive it and keep it' }),
          action({ id: 'e03-c18', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e03-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e03-nav-archive', slot: SLOT.MENU, label: 'Open the newsletter archive', opens: 'archive', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e03-dir-desk',
        name: 'Unit Falcon Learning Office',
        identifier: fromAddress,
        provenance: 'local approved directory',
        role: 'Publishes the monthly newsletter to all users; issues are archived on the internal portal.',
      },
    ],
  }
}

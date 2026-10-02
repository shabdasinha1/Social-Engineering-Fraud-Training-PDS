import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, attachment, body, directory, earlier, mail, notice, sender, subjectLine, table,
} from './shared.js'

/**
 * E16 - Signed Maintenance Notice (IMMERSIVE-008) - the batch's legitimate control.
 *
 * IT Operations sends the unit-wide notice it sends before every mail maintenance window: a
 * change number, a half-hour window tonight, what users will notice, and the sentence that
 * matters - nothing to do. Last month's notice for the previous change is already in the thread,
 * from the same address, in the same shape. The message is digitally signed, the signature and
 * domain checks pass, it carries no link, and its only attachment is a calendar file for the
 * window itself.
 *
 * The Email-native decisions are proportionate ones. The normal path is the notice's own calendar
 * file - "Add reminder" - or simply archiving it. The mistakes are the learner's own: moving a real
 * operations notice to Junk, or forwarding work mail to a personal mailbox "to keep reading
 * tonight" (the one move that actually leaves the approved channel). The check is the change ID on
 * the IT status board. Fictional throughout: "Unit Falcon", CHG-118 and the IT desk describe
 * nothing real.
 */
export function buildE16(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'itoperations@e16.training.example'
  const change = 'CHG-118'
  const lastChange = 'CHG-097'
  const icsName = `${change}_mail_maintenance.ics`
  const personal = 'me.at.home@personalmail.training.example'

  return {
    scenarioId: 'E16',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'IT Operations' },
    messageSender: { display_name: senderInfo.display_name ?? 'IT Operations', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 2 },
        {
          id: 'it', label: 'IT notices', heading: 'IT notices',
          rows: [
            {
              id: 'e16-it-1', from: 'IT Operations', subject: `${lastChange}: mail maintenance 22:00–22:20`,
              preview: 'Planned mail maintenance tonight; no action required.', time: '14 Aug', inert: true,
            },
            {
              id: 'e16-it-2', from: 'IT Operations', subject: `${lastChange} complete`,
              preview: 'Maintenance finished at 22:14. Mail is running normally.', time: '14 Aug', inert: true,
            },
          ],
        },
        { id: 'junk', label: 'Junk', heading: 'Junk', rows: [], empty: 'Junk is empty.' },
      ],
      rows: [
        {
          id: 'e16-row', from: 'IT Operations', subject: `${change}: ${subjectLine(scenario)}`,
          preview: 'Tonight’s window, what you will notice, and why there is nothing to do.',
          time: '11:39', unread: true, attachment: true, tag: 'IT',
        },
        {
          id: 'e16-bg-1', from: 'Transport Office', subject: 'Bus timings from Monday',
          preview: 'The 07:40 now leaves from Gate 2.', time: '10:05', inert: true,
        },
        {
          id: 'e16-bg-2', from: 'Kavya', subject: 'Re: stores audit',
          preview: 'You: counts attached, see tab 2', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `${change}: ${subjectLine(scenario)}`,
      fromName: 'IT Operations',
      time: '11:39',
      toLine: 'to All staff',
      detailsTo: 'details',
      labels: ['Inbox', 'IT'],
    },

    beats: [
      /** Last month's notice for the previous change, from the same address, in the same shape. */
      earlier('e16-earlier', {
        from: 'IT Operations',
        to: 'All staff',
        time: '14 Aug',
        snippet: `${lastChange}: planned mail maintenance 22:00–22:20; no action required.`,
        paragraphs: [
          `Change ${lastChange}. Mail will be briefly unavailable between 22:00 and 22:20 tonight while `
          + 'the mail servers are patched. You do not need to do anything.',
          'Messages sent to you during the window are queued and delivered afterwards.',
          'The change is listed on the IT status board. IT Operations will never ask for your password.',
          `IT Operations · ${fromAddress} · digitally signed`,
        ],
      }),
      notice('e16-signed', 'Signed message. Sender details show the signature.'),
      body('e16-body', {
        greeting: 'Hello all,',
        paragraphs: [
          `${subjectLine(scenario)} This is change ${change}.`,
          'During the window the mail app may show “Connecting” and new messages will arrive a few '
          + 'minutes late. Anything sent to you is queued and delivered once the work is complete.',
          'You do not need to sign in, reset anything or install anything. We will never ask for your '
          + 'password by email.',
          `The change is listed on the IT status board under ${change}. A calendar file for the window is `
          + 'attached if you want a reminder.',
        ],
        signature: ['IT Operations', 'Unit Falcon IT'],
        footer: `Change ${change} · approved change calendar · sent to All staff`,
      }),
      table('e16-window', {
        rows: [
          { label: 'Change', value: change },
          { label: 'Window', value: 'Tonight, 22:00–22:30' },
          { label: 'Affects', value: 'Mail on web and mobile' },
          { label: 'You need to', value: 'Nothing' },
        ],
      }),
      attachment('e16-ics', { fileName: icsName, fileKind: 'ics', size: '2 KB' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'IT Operations', address: fromAddress, note: `Same address as the ${lastChange} notice on 14 Aug` },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `IT Operations <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: 'All staff (unit list) — includes you' },
                  { label: 'Attachment', value: `${icsName} · calendar file` },
                ],
              },
              {
                type: 'checks',
                heading: 'Signature and authentication',
                rows: [
                  { label: 'Digital signature', value: `Signed by ${fromAddress} · certificate from Unit Falcon CA`, result: 'valid' },
                  { label: 'SPF', value: 'e16.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e16.training.example', result: 'pass' },
                  { label: 'Links', value: 'None in this message', result: 'none' },
                ],
              },
              { type: 'note', text: 'A signature says who sent a message and that it was not altered. What it asks you to do is still yours to weigh.' },
            ],
            links: [{ id: 'e16-link-original', label: 'Show original', to: 'original' }],
          },
          original: {
            title: 'Original message',
            blocks: [
              {
                type: 'mono',
                heading: 'Headers (excerpt)',
                lines: [
                  `From: IT Operations <${fromAddress}>`,
                  'To: All staff <allstaff@unit.training.example>',
                  `Subject: ${change}: ${subjectLine(scenario)}`,
                  'Authentication-Results: spf=pass dkim=pass header.d=e16.training.example',
                  'Content-Type: multipart/signed; protocol="application/pkcs7-signature"',
                  `X-Change-Ref: ${change}`,
                ],
              },
            ],
          },
        },
      }),

      /** The calendar file, read before anything is added. */
      ics: mail({
        title: icsName,
        home: 'ics',
        inertNote: 'Local preview. Nothing is added to a calendar from this screen.',
        pages: {
          ics: {
            title: icsName,
            subtitle: 'Calendar file · 2 KB',
            blocks: [
              { type: 'file', kind: 'ics', name: icsName, meta: 'One event · no attendees · no link' },
              {
                type: 'rows',
                heading: 'Event',
                rows: [
                  { label: 'Title', value: `Mail maintenance (${change})` },
                  { label: 'When', value: 'Tonight 22:00–22:30' },
                  { label: 'Organizer', value: fromAddress },
                  { label: 'Location', value: 'None' },
                  { label: 'Reminder', value: '5 minutes before' },
                ],
              },
              { type: 'note', text: 'The event matches the window in the message. It contains no link and no meeting address.' },
            ],
          },
        },
      }),

      /** The learner's own calendar, once a reminder is added. */
      calendar: {
        kind: SURFACE.APP,
        appName: 'Calendar',
        appTagline: 'Today',
        hero: { label: 'Reminder added', value: '21:55', caption: `Mail maintenance (${change}) · 22:00–22:30` },
        sections: [
          {
            id: 'e16-cal-rows',
            heading: 'This evening',
            rows: [
              { label: '18:30', value: 'Evening roll call' },
              { label: '22:00', value: `Mail maintenance (${change})` },
            ],
            note: 'A reminder on this device only. Nothing was sent to anyone.',
          },
        ],
        tabs: [
          { label: 'Today', icon: 'home' },
          { label: 'Month', icon: 'history' },
          { label: 'Settings', icon: 'profile' },
        ],
      },

      /** The IT status board the notice itself names - opened from the learner's own apps. */
      statusboard: {
        kind: SURFACE.APP,
        appName: 'IT status board',
        appTagline: 'Unit Falcon IT · approved changes',
        hero: { label: `Change ${change}`, value: 'Scheduled', caption: 'Mail servers · tonight 22:00–22:30 · no user action' },
        sections: [
          {
            id: 'e16-board-rows',
            heading: 'This week',
            rows: [
              { label: change, value: 'Mail maintenance · tonight 22:00–22:30 · notice sent 11:39' },
              { label: 'CHG-116', value: 'Printer drivers · Thursday · no user action' },
              { label: lastChange, value: '14 Aug · completed 22:14' },
            ],
            note: 'The change number, window and owner match the notice.',
          },
        ],
        tabs: [
          { label: 'Status', icon: 'home' },
          { label: 'Changes', icon: 'history' },
          { label: 'Help', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'IT service desk (saved)',
        number: '+91 00000 68420',
        script: [
          { at: 0, speaker: 'them', text: 'IT service desk.' },
          { at: 3, speaker: 'them', text: `Yes, ${change} is tonight from 22:00. The notice went to all staff this morning.` },
          { at: 8, speaker: 'them', text: 'Nothing for you to do. Mail catches up by itself afterwards.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e16-c01', slot: SLOT.INLINE, label: 'Open the IT Operations notice' }),
          action({ id: 'e16-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what changes' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e16-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'IT Operations', hint: 'Signature, sender and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e16-c04', slot: SLOT.INLINE, anchor: 'e16-ics',
            label: 'Preview the calendar file', hint: 'Read the event before adding it', opens: 'ics',
          }),
          action({ id: 'e16-c05', slot: SLOT.MENU, label: `Read last month’s ${lastChange} notice` }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e16-c06', slot: SLOT.INLINE, anchor: 'e16-ics',
            label: 'Add reminder', opens: 'calendar',
          }),
          action({ id: 'e16-c07', slot: SLOT.MENU, label: 'Archive it — nothing to do' }),
          action({ id: 'e16-c08', slot: SLOT.MENU, label: 'Move it to Junk' }),
          action({
            id: 'e16-c09', slot: SLOT.COMPOSER, compose: { mode: 'forward', to: personal },
            label: 'Forward it to your personal address for tonight',
            echo: 'Forwarding so I can keep reading mail at home during the window.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e16-c10', slot: SLOT.MENU, label: `Compare ${change} with the IT status board`,
            hint: 'Match the change number and window yourself', opens: 'statusboard',
          }),
          action({ id: 'e16-c11', slot: SLOT.MENU, label: 'Call the IT service desk on the saved number', opens: 'call' }),
          action({
            id: 'e16-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e16-c13', slot: SLOT.MENU, label: 'Reply to IT Operations to confirm' }),
          action({ id: 'e16-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e16-c15', slot: SLOT.MENU, label: 'Block IT Operations' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e16-c16', slot: SLOT.INLINE, label: 'Archive the notice' }),
          action({ id: 'e16-c17', slot: SLOT.INLINE, label: 'Report it to be safe' }),
          action({ id: 'e16-c18', slot: SLOT.MENU, label: 'Keep it in the inbox' }),
          action({ id: 'e16-c19', slot: SLOT.MENU, label: 'Block the IT Operations address' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e16-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e16-nav-board', slot: SLOT.MENU, label: 'Open the IT status board', opens: 'statusboard', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e16-dir-it',
        name: 'IT service desk',
        identifier: '+91 00000 68420',
        provenance: 'local approved directory',
        role: 'Runs the approved change calendar and the IT status board; answers questions about planned work.',
      },
    ],
  }
}

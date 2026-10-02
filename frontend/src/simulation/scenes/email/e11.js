import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, earlier, mail, notice, sender, subjectLine,
} from './shared.js'

/**
 * E11 - Leave Approval in Known Portal (IMMERSIVE-007) - the legitimate control.
 *
 * The learner submitted leave request LV-204 last week and the People Portal's automatic
 * confirmation is already in the thread. Today the same no-reply system address says the
 * request's status has changed and - the point of the scene - carries no link, no button and
 * no attachment: it tells the reader to look in the portal they already use. Every signal lines
 * up: the request number is the learner's own, the sender and its authentication match the
 * earlier confirmation, and nothing is being collected.
 *
 * The Email-native decision is WHERE the learner goes to read the decision. The normal path is
 * the People Portal app on their own device (the branch control sits inside that app); the
 * mistakes are the learner's own - searching the web for "People Portal" and signing in through
 * whatever comes up, or deleting a real status update as if it were a trap. As the batch's
 * legitimate control it is as rich as its neighbours: a quoted confirmation, a details sheet, a
 * portal app, a leave record and an HR desk call. Fictional throughout: the portal, the request
 * and the manager describe nothing real.
 */
export function buildE11(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'peopleportal@e11.training.example'
  const request = 'LV-204'

  return {
    scenarioId: 'E11',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'People Portal' },
    messageSender: { display_name: senderInfo.display_name ?? 'People Portal', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 2 },
        {
          id: 'hr', label: 'HR', heading: 'HR',
          rows: [
            {
              id: 'e11-hr-1', from: 'People Portal', subject: `Request ${request} received`,
              preview: 'We have received your leave request for 22–24 Sep.', time: '12 Sep', inert: true,
            },
          ],
        },
        { id: 'archive', label: 'Archive', heading: 'Archive', rows: [], empty: 'Nothing archived yet.' },
      ],
      rows: [
        {
          id: 'e11-row', from: 'People Portal', subject: `Request ${request} status updated`,
          preview: subjectLine(scenario), time: '10:01', unread: true, tag: 'HR',
        },
        {
          id: 'e11-bg-1', from: 'Canteen Committee', subject: 'Menu for next week',
          preview: 'Vote for Friday’s special by Wednesday.', time: '09:12', inert: true,
        },
        {
          id: 'e11-bg-2', from: 'Nikhil', subject: 'Re: handover notes',
          preview: 'You: shared the tracker, covering 22–24', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `Request ${request} status updated`,
      fromName: 'People Portal',
      time: '10:01',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'HR'],
    },

    beats: [
      /** The portal's automatic confirmation of the learner's own request, a week ago. */
      earlier('e11-earlier', {
        from: 'People Portal',
        to: 'You',
        time: '12 Sep',
        snippet: `Request ${request} received: annual leave 22–24 Sep, sent to your manager.`,
        paragraphs: [
          `We have received your leave request ${request} (annual leave, 22–24 September) and sent it `
          + 'to your line manager for a decision.',
          'You will get a status update by email. Decisions are shown in the People Portal only.',
          `People Portal · ${fromAddress} · this mailbox is not monitored`,
        ],
      }),
      body('e11-body', {
        greeting: 'Hello,',
        paragraphs: [
          subjectLine(scenario),
          'For your privacy the decision is not included in this email. Open the People Portal app '
          + 'or your usual bookmark and look under My requests.',
        ],
        signature: ['People Portal', 'Automated notification'],
        footer: `Ref: ${request}. Please do not reply — this mailbox is not monitored.`,
      }),
      notice('e11-none', 'No links or attachments in this message.'),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'People Portal', address: fromAddress, note: 'Same address as the confirmation on 12 Sep' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `People Portal <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Request', value: `${request} — submitted by you on 12 Sep` },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e11.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e11.training.example', result: 'pass' },
                  { label: 'Links', value: 'None in this message', result: 'none' },
                ],
              },
              { type: 'note', text: 'The request number, the sender and the timeline all match the request you made.' },
            ],
          },
        },
      }),

      /** The People Portal app on the learner's own device - the normal path. */
      portal: {
        kind: SURFACE.APP,
        appName: 'People Portal',
        appTagline: 'My requests',
        hero: { label: `Request ${request}`, value: 'Approved', caption: 'Annual leave · 22–24 September · decided today 09:58' },
        sections: [
          {
            id: 'e11-portal-rows',
            heading: 'Decision',
            rows: [
              { label: 'Type', value: 'Annual leave (3 days)' },
              { label: 'Decided by', value: 'Your line manager' },
              { label: 'Balance after', value: '11 days' },
            ],
            note: 'Decisions are only ever shown here. Nothing to sign or pay.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Requests', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** Where a web search for the portal leads - not the app the learner already has. */
      search: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'results',
        pages: {
          results: {
            url: 'https://search.training.example/?q=people+portal+login',
            host: 'search.training.example',
            title: 'Search results',
            secure: true,
            blocks: [
              { type: 'search', query: 'people portal login' },
              {
                type: 'listing', badge: 'Sponsored', host: 'people-portal-login.training.example',
                title: 'People Portal Login — fast access', text: 'Sign in to check leave, pay and requests.',
              },
              {
                type: 'listing', host: 'hr.unit.training.example',
                title: 'People Portal', text: 'Use the app or your saved bookmark.',
              },
            ],
          },
        },
      },

      /** The leave record, checked separately from the notification. */
      leave: {
        kind: SURFACE.APP,
        appName: 'Leave record',
        appTagline: 'People Portal · history',
        hero: { label: 'Your requests', value: `${request} matches`, caption: 'Submitted 12 Sep by you · approved today' },
        sections: [
          {
            id: 'e11-leave-rows',
            heading: 'History',
            rows: [
              { label: request, value: '22–24 Sep · Approved · notified by email today' },
              { label: 'LV-188', value: '04 Jul · Approved' },
              { label: 'LV-151', value: '12 Mar · Withdrawn by you' },
            ],
            note: 'The notification refers to a request you made, and the portal shows the same decision.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'HR helpdesk (saved)',
        number: '+91 00000 41127',
        script: [
          { at: 0, speaker: 'them', text: 'HR helpdesk.' },
          { at: 3, speaker: 'them', text: `Yes, ${request} was approved this morning. The portal emails a status update automatically.` },
          { at: 8, speaker: 'them', text: 'You can archive the email; the decision stays in the portal.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e11-c01', slot: SLOT.INLINE, label: 'Open the People Portal update' }),
          action({ id: 'e11-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask the outcome' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e11-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'People Portal', hint: 'Sender, request number and links',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e11-c04', slot: SLOT.MENU, label: 'Read the confirmation from 12 Sep' }),
          action({ id: 'e11-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({ id: 'e11-c06', slot: SLOT.MENU, label: `Open ${request} in the People Portal`, opens: 'portal' }),
          action({ id: 'e11-c07', slot: SLOT.MENU, label: 'Search the web for the portal and sign in', opens: 'search' }),
          action({ id: 'e11-c08', slot: SLOT.MENU, label: 'Delete it without checking' }),
          navigate({ id: 'e11-nav-portal', slot: SLOT.MENU, label: 'Switch to the People Portal app', opens: 'portal' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e11-c09', slot: SLOT.MENU, label: 'Match the request in your leave history',
            hint: 'Compare the number and dates yourself', opens: 'leave',
          }),
          action({ id: 'e11-c10', slot: SLOT.MENU, label: 'Call the HR helpdesk on the saved number', opens: 'call' }),
          action({
            id: 'e11-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e11-c12', slot: SLOT.MENU, label: 'Reply to the notification to confirm' }),
          action({ id: 'e11-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e11-c14', slot: SLOT.MENU, label: 'Block People Portal' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e11-c15', slot: SLOT.INLINE, label: 'Archive the email' }),
          action({ id: 'e11-c16', slot: SLOT.INLINE, label: 'Report it to be safe' }),
          action({ id: 'e11-c17', slot: SLOT.MENU, label: 'Keep it in the inbox' }),
          action({ id: 'e11-c18', slot: SLOT.MENU, label: 'Block the portal address' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e11-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e11-nav-leave', slot: SLOT.MENU, label: 'Open the leave record', opens: 'leave', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e11-dir-hr',
        name: 'HR helpdesk',
        identifier: '+91 00000 41127',
        provenance: 'local approved directory',
        role: 'Answers leave and pay questions; leave decisions are published in the People Portal.',
      },
    ],
  }
}

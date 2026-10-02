import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, earlier, invite, mail, sender, subjectLine,
} from './shared.js'

/**
 * E07 - Expected Training Calendar Invite (IMMERSIVE-006) - the legitimate control.
 *
 * The training officer sends the calendar invite that was announced in the morning briefing:
 * a Social Engineering Lab on a known date, in a known room, from the organiser's usual
 * address. The Email-native decision is the calendar card itself - Accept, Tentative or
 * Decline - all of which are the normal in-app path. Every signal lines up: the organiser
 * matches the directory, the time and room match the briefing and the local course schedule,
 * and there is nothing to sign in to.
 *
 * The mistakes are the learner's own: leaving an expected invite unanswered, jumping to an
 * external "add to your personal calendar" link, or reporting a legitimate organiser. As the
 * batch's legitimate control it is deliberately as rich as its malicious neighbours: an invite
 * card, a details sheet, the briefing thread, and its own course-schedule check. Fictional
 * throughout: "Unit Falcon", the lab and the room describe nothing real.
 */
export function buildE07(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'trainingoffice@e07.training.example'

  return {
    scenarioId: 'E07',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Training Office' },
    messageSender: { display_name: senderInfo.display_name ?? 'Training Office', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'invites', label: 'Invites', heading: 'Invites', rows: [], empty: 'No other invites.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e07-row', from: 'Training Office', subject: subjectLine(scenario),
          preview: 'Invite: Social Engineering Lab, 04 Sep, Training Room C.',
          time: '14:40', unread: true, tag: 'Invite',
        },
        {
          id: 'e07-bg-1', from: 'Orderly Room', subject: 'Leave applications',
          preview: 'Submit by Friday.', time: '13:05', inert: true,
        },
        {
          id: 'e07-bg-2', from: 'Sana', subject: 'Re: study group',
          preview: 'You: see you at 5', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Training Office',
      time: '14:40',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Invite'],
    },

    beats: [
      /** The morning briefing that announced this exact session, in the same thread. */
      earlier('e07-earlier', {
        from: 'Training Office',
        to: 'All trainees',
        time: 'This morning',
        snippet: 'Morning briefing: Social Engineering Lab confirmed for Thursday, invite to follow.',
        paragraphs: [
          'As covered in the morning briefing: the Social Engineering Lab is confirmed for '
          + 'Thursday 4 September, 10:00–12:00, Training Room C. A calendar invite will follow.',
          'Training Office · trainingoffice@e07.training.example',
        ],
      }),
      body('e07-body', {
        greeting: 'Hello,',
        paragraphs: [
          'Here is the calendar invite for the Social Engineering Lab we announced this morning. '
          + 'Please respond so we can plan the room.',
          'There is nothing to sign in to — just Accept, Tentative or Decline below.',
        ],
        signature: ['Training Office'],
        footer: 'Course code SE-LAB-04. Room and time as announced.',
      }),
      invite('e07-invite', {
        title: 'Social Engineering Lab',
        when: 'Thursday 4 September · 10:00–12:00',
        where: 'Training Room C',
        organizer: 'Training Office',
        attendees: ['Training Office', 'You', '+ 14 trainees'],
        note: 'Responses are stored on your own calendar. Nothing is sent outside.',
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
              { type: 'identity', name: 'Training Office', address: fromAddress, note: 'Your training organiser' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Training Office <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: 'All trainees' },
                  { label: 'Organiser', value: 'Training Office (matches directory)' },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Announced', value: 'In this morning’s briefing', result: 'matches' },
                  { label: 'Time and room', value: 'Match the course schedule', result: 'matches' },
                  { label: 'Sign-in', value: 'None requested', result: 'ok' },
                ],
              },
              { type: 'note', text: 'The organiser, the time and the room all match what was announced.' },
            ],
          },
        },
      }),

      schedule: {
        kind: SURFACE.APP,
        appName: 'Course schedule',
        appTagline: 'Training Office',
        hero: { label: 'This week', value: 'Social Engineering Lab', caption: 'Thursday 4 Sep, Training Room C — matches the invite.' },
        sections: [
          {
            id: 'e07-schedule-rows',
            heading: 'Scheduled sessions',
            rows: [
              { label: 'Thu 4 Sep, 10:00', value: 'Social Engineering Lab — Training Room C (SE-LAB-04)' },
              { label: 'Organiser', value: `Training Office · ${fromAddress}` },
              { label: 'Fri 5 Sep, 09:00', value: 'Range safety refresher — Hall B' },
            ],
            note: 'The invite matches the published schedule and organiser. It is genuine.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Schedule', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e07-c01', slot: SLOT.INLINE, label: 'Open the training invite' }),
          action({ id: 'e07-c02', slot: SLOT.INLINE, label: 'Reply from the list before reading it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e07-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Training Office', hint: 'Organiser, time and room',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e07-c04', slot: SLOT.MENU, label: 'Read the morning-briefing thread' }),
        ],
      },

      branch: {
        affordances: [
          action({ id: 'e07-c05', slot: SLOT.INLINE, anchor: 'e07-invite', label: 'Accept' }),
          action({ id: 'e07-c06', slot: SLOT.INLINE, anchor: 'e07-invite', label: 'Tentative' }),
          action({ id: 'e07-c07', slot: SLOT.INLINE, anchor: 'e07-invite', label: 'Decline' }),
          action({ id: 'e07-c08', slot: SLOT.MENU, label: 'Leave the invite unanswered' }),
          action({ id: 'e07-c09', slot: SLOT.MENU, label: 'Open the “add to my personal calendar” link' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e07-c10', slot: SLOT.MENU, label: 'Compare it with the course schedule',
            hint: 'Check the organiser and time yourself', opens: 'schedule',
          }),
          action({
            id: 'e07-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the Training Office'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e07-c12', slot: SLOT.MENU, label: 'Reply to the organiser to confirm' }),
          action({ id: 'e07-c13', slot: SLOT.MENU, label: 'Report the invite' }),
          action({ id: 'e07-c14', slot: SLOT.MENU, label: 'Block the organiser' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e07-c15', slot: SLOT.INLINE, label: 'Keep your response and carry on' }),
          action({ id: 'e07-c16', slot: SLOT.INLINE, label: 'Report the organiser' }),
          action({ id: 'e07-c17', slot: SLOT.MENU, label: 'Keep it on your calendar' }),
          action({ id: 'e07-c18', slot: SLOT.MENU, label: 'Block the organiser' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e07-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e07-nav-schedule', slot: SLOT.MENU, label: 'Open the course schedule', opens: 'schedule', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e07-dir-org',
        name: 'Unit Falcon Training Office',
        identifier: fromAddress,
        provenance: 'local approved directory',
        role: 'Runs the course schedule and sends the calendar invites announced in briefings.',
      },
    ],
  }
}

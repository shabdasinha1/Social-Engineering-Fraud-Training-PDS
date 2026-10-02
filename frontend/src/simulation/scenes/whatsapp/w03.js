import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, poll, priorContext, quote, sender,
  system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W03 - Known Sports Meet Group. The legitimate one.
 *
 * A simulator that only ever rewards suspicion teaches suspicion, not judgment - which is
 * why the client bank carries twenty legitimate controls and why false reporting costs
 * four points. This scene therefore gets MORE work than the four malicious ones, not less,
 * and deliberately none of the tells: the coordinator is saved, the event was announced a
 * week ago, other people are already talking in the group, the poll stays inside WhatsApp
 * and nothing is asked for that a sports meet would not ask for.
 *
 * Two things R2 added are worth naming, because both exist to stop this reading as "the
 * safe one".
 *
 * **Length and texture.** If the legitimate scenario is visibly shorter or thinner than
 * the others, scenario length becomes the answer. So this group has a week of history,
 * four speakers, a quoted reply, admin badges, a purpose line and a participant list that
 * goes somewhere.
 *
 * **The same investigation, a different answer.** Tapping a participant opens a contact
 * sheet with exactly the same tabs W04's impostor has - About, Groups in common, Media.
 * On W04 that sheet is empty. Here it is full. The learner is given one instrument and
 * has to read what it says, which is the whole difference between judgment and a habit.
 *
 * The directory entry the scenario data supplies is the unit support desk, which is not
 * the coordinator. This scene adds the coordinator's own approved-directory row so the
 * comparison the specification asks for can actually be made. The bank's own asset is
 * untouched and still shown beside it.
 */
export function buildW03(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const groupName = 'Unit Falcon Sports Meet'

  return {
    scenarioId: 'W03',
    platform: 'whatsapp',

    conversation: {
      kind: 'group',
      title: groupName,
      subtitle: `${who.display_name}, Adjt Office, PT Instr, you, +6 others`,
      saved: true,
      avatarSeed: 'SM',
      presence: `${who.display_name}, Adjt Office, PT Instr, you, +6 others`,
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w03-row',
          title: groupName,
          subtitle: who.display_name,
          preview: `${who.display_name}: ${headline(scenario)}`,
          time: headlineTime(scenario),
          unread: 2,
          group: true,
        },
        {
          id: 'w03-bg-1',
          title: who.display_name,
          preview: 'Thanks. Poll is in the group.',
          time: '07:40',
          inert: true,
        },
        {
          id: 'w03-bg-2',
          title: 'PT Instr',
          preview: 'You: Understood, 0530 at the ground',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w03-bg-3',
          title: 'Building 4B',
          group: true,
          preview: 'Watchman: Water tanker at 4pm today',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w03-e2e'),
      system('w03-context', priorContext(scenario)),

      /** The announcement the group was created to follow up. A week of context. */
      day('w03-day-old', 'LAST TUESDAY'),
      them('w03-b0',
        'Reminder from the notice board: the inter-company sports meet is on the last weekend '
        + 'of this month. A group will follow for attendance.',
        '17:12', { author: who.display_name, priorChat: true }),

      day('w03-day', 'TODAY'),
      system('w03-created', `${who.display_name} created this group`),
      system('w03-added', `${who.display_name} added you`),

      them('w03-b1', headline(scenario), headlineTime(scenario) ?? '07:38',
        { author: who.display_name }),
      them('w03-b2',
        'Events: 100m, relay, tug of war, volleyball. Kit will be issued at the ground.',
        '07:39', { author: who.display_name }),
      them('w03-b3', 'Coach says bring your own water bottle this time.', '07:44',
        { author: 'PT Instr' }),
      them('w03-b3b', 'Is transport from the lines or do we make our own way?', '07:44',
        { author: 'Coy Clerk' }),
      them('w03-b3c', 'One bus at 0515 from the lines. Otherwise make your own way.', '07:45',
        {
          author: who.display_name,
          quote: quote('Coy Clerk', 'Is transport from the lines or do we make our own way?'),
        }),

      poll('w03-poll', {
        question: 'Attendance - inter-company sports meet',
        options: [
          { label: 'Yes, I will attend', votes: 6 },
          { label: 'No, I cannot attend', votes: 1 },
        ],
        time: '07:45',
        author: who.display_name,
        since: 'branch',
      }),
      them('w03-b4', 'Poll closes Friday. No need to message me separately.', '07:46',
        { since: 'branch', author: who.display_name }),

      /** The group carries on around the learner while they are deciding. */
      {
        kind: 'message', id: 'w03-b5', from: 'them', author: 'PT Instr',
        text: 'Voted. Relay team please stay back after the poll closes.', time: '07:52',
        since: 'verify',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.GROUP,
        title: 'Group info',
        name: groupName,
        identifier: 'Group - 10 participants',
        avatarSeed: 'SM',
        saved: true,
        statusLine: `Created by ${who.display_name}, today at 07:36`,
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'Description',
                rows: [
                  {
                    label: 'Purpose',
                    value: 'Attendance and kit for the inter-company sports meet. No official '
                      + 'business in this group.',
                  },
                  { label: 'Announced', value: 'Notice board, last Tuesday' },
                  { label: 'Created', value: `Today at 07:36 by ${who.display_name}` },
                  { label: 'Group permissions', value: 'Only admins can add participants' },
                ],
              },
            ],
          },
          {
            id: 'participants',
            label: 'Participants',
            count: 10,
            sections: [
              {
                id: 'participants-list', heading: '10 participants',
                items: [
                  {
                    label: who.display_name, value: who.identifier, badge: 'Group admin',
                    known: true, to: 'contact-coordinator',
                  },
                  {
                    label: 'Adjt Office', value: '+91 00000 61220', badge: 'Group admin',
                    known: true,
                  },
                  { label: 'PT Instr', value: '+91 00000 61374', known: true },
                  { label: 'You', value: 'This device' },
                  { label: 'Coy Clerk', value: '+91 00000 61455', known: true },
                  { label: 'Havildar Menon', value: '+91 00000 61502', known: true },
                  { label: 'L/Nk Bhatia', value: '+91 00000 61588', known: true },
                  { label: 'Sep Farooqui', value: '+91 00000 61613', known: true },
                  { label: 'Sep Iyer', value: '+91 00000 61644', known: true },
                  { label: 'Sports Store', value: '+91 00000 61677', known: true },
                ],
                note: 'All ten numbers are saved in your contacts.',
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 0,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                empty: 'Nothing has been shared in this group.',
                items: [],
              },
            ],
          },
        ],
      },

      /**
       * The coordinator's own contact sheet, reached from the participant list.
       *
       * Structurally identical to W04's impostor sheet, and full where that one is empty.
       * That symmetry is the point: the same three tabs, asked the same way, answering
       * differently.
       */
      'contact-coordinator': {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: true,
        statusLine: 'Saved in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'Status', value: 'Recreation and welfare' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved', value: '3 years ago' },
                  { label: 'On WhatsApp since', value: '2021' },
                  { label: 'Last message', value: 'Last month' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 9,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: groupName, value: '10 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Inter-Coy Volleyball 2024', value: '18 participants', group: true },
                  { label: 'Annual Day Committee', value: '14 participants', group: true },
                  { label: 'Welfare Fund', value: '31 participants', group: true },
                  { label: 'Marathon 2025', value: '46 participants', group: true },
                  { label: 'Blood Donation Drive', value: '58 participants', group: true },
                  { label: 'Canteen Updates', value: '190 participants', group: true },
                  { label: 'Family Welcome Day', value: '27 participants', group: true },
                ],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 62,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: '62 items', value: 'Shared since 2021' }],
              },
            ],
          },
        ],
      },

      'call-coordinator': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${who.display_name} (saved)`,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Yes, hello. Recreation coordinator speaking.' },
          { at: 4, speaker: 'them', text: 'Correct, I made the group this morning after the notice went up.' },
          { at: 9, speaker: 'them', text: 'Just answer the poll, nothing else is needed. Thank you.' },
        ],
      },
    },

    /**
     * The coordinator's own approved-directory row, shown beside the scenario's support
     * desk entry. Provenance is stated, exactly like every other row in the overlay.
     */
    directoryExtras: [
      {
        id: 'w03-dir-coordinator',
        name: `${who.display_name}, Unit Falcon`,
        identifier: who.identifier,
        provenance: 'local approved directory',
        role: 'Recreation and welfare',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w03-c01', slot: SLOT.INLINE,
            label: `Open ${groupName}`,
          }),
          action({
            id: 'w03-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the group',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w03-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Group info', hint: 'Who made it, who is in it, what it is for',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w03-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w03-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w03-c06', slot: SLOT.INLINE, anchor: 'w03-poll',
            label: 'Yes, I will attend', echo: 'Voted: Yes, I will attend',
          }),
          action({
            id: 'w03-c07', slot: SLOT.INLINE, anchor: 'w03-poll',
            label: 'No, I cannot attend', echo: 'Voted: No, I cannot attend',
          }),
          action({
            id: 'w03-c08', slot: SLOT.MENU,
            label: 'Exit the group without answering',
          }),
          action({
            id: 'w03-c09', slot: SLOT.MENU,
            label: 'Share my live location with the group',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w03-c10',
            slot: SLOT.MENU,
            label: 'Check the coordinator in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w03-c11',
            slot: SLOT.MENU, label: `Call ${who.display_name} on the saved number`,
            opens: 'call-coordinator',
          }),
          action({
            id: 'w03-c12',
            slot: SLOT.MENU,
            label: 'Ask in the group whether this is genuine',
          }),
          action({
            id: 'w03-c13', slot: SLOT.MENU, label: 'Report the group',
          }),
          action({
            id: 'w03-c14', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w03-c15', slot: SLOT.INLINE,
            label: 'Report the group and close it',
          }),
          action({
            id: 'w03-c16', slot: SLOT.INLINE,
            label: 'Stay in the group and take part',
          }),
          action({
            id: 'w03-c17', slot: SLOT.MENU,
            label: 'Keep the group, nothing further',
          }),
          action({
            id: 'w03-c18', slot: SLOT.MENU,
            label: `Block ${who.display_name} and close`,
          }),
          action({
            id: 'w03-c19', slot: SLOT.MENU,
            label: 'Exit the group and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w03-nav-group', slot: SLOT.MENU, label: 'Group info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w03-nav-coordinator', slot: SLOT.MENU, label: `${who.display_name} - contact info`,
        opens: 'contact-coordinator', after: 'branch',
      }),
    ],

    /** Kept so the directory overlay can name the support desk the bank supplied. */
    supportDesk: desk,
  }
}

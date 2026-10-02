import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, fileCard, headline, headlineTime, me, quote, sender, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W16 - Verified Vehicle-Pool Change.
 *
 * The genuine item of this batch, and a deliberately uncomfortable one: it has the two
 * pressures every malicious scenario leans on - authority and a clock - and it is still
 * exactly what it says it is. A simulator that only ever rewards distrust teaches distrust,
 * so this scene gets as much thread and as many screens as its four neighbours.
 *
 * **The distinct interaction is a message whose meaning was set three weeks ago.** The
 * coordinator pinned the monsoon contingency note in this chat on 21 August: if the Main
 * Gate closes for weather, pickups move to Alternate Gate B at the same time, the change
 * will arrive here marked "acknowledge only", and riders answer with a reaction - no names,
 * routes or rosters. Today's message is that paragraph arriving. The pinned bar under the
 * header is how the learner gets back to it, and the plan itself opens in the viewer.
 *
 * **The second is that the risk is what the learner adds.** The identity is right and the
 * request is harmless; what can go wrong is the helpful reply - six names, a block, a
 * walking route - or passing the change on to a residents' group that is not the unit's.
 * So the scored "acknowledge" is the reaction the coordinator asked for, attached to the
 * message itself, and the over-long acknowledgement sits in the composer beside a plain one.
 *
 * No ATT&CK mapping, by design: see the research record. The verification is the Movement
 * Board the MT Section publishes, and the coordinator's own row in the trusted directory.
 */
export function buildW16(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const planFile = 'Transport_Contingency_Monsoon.pdf'
  const para4 = 'Short version: if the Main Gate is closed for weather, pickups move to '
    + 'Alternate Gate B at the same time. I will send the change here marked "acknowledge '
    + 'only". React 👍 to acknowledge - no names, routes or rosters in reply.'

  return {
    scenarioId: 'W16',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      presence: 'last seen today at 10:03',
      avatarSeed: who.avatar_initials,
      /** The contingency note, pinned by the coordinator on 21 August. */
      pinned: { beatId: 'w16-para4', author: who.display_name, text: para4 },
    },

    list: {
      title: 'WhatsApp',
      archived: 4,
      rows: [
        {
          id: 'w16-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 2,
        },
        {
          id: 'w16-bg-1',
          title: 'Block C Residents',
          group: true,
          preview: 'Pooja: is the main road flooded already?',
          time: '09:47',
          muted: true,
          inert: true,
        },
        {
          id: 'w16-bg-2',
          title: 'Unit Falcon Notices',
          group: true,
          preview: 'Adjt Office: weather advisory - see Movement Board',
          time: '09:31',
          muted: true,
          inert: true,
        },
        {
          id: 'w16-bg-3',
          title: 'Ma',
          preview: 'You: raining here too',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w16-e2e'),

      /** Three weeks ago: the plan, and the paragraph that decides today's message. */
      day('w16-day-plan', '21 AUGUST'),
      them('w16-plan-intro',
        'Monsoon contingency for the vehicle pool, as briefed at the MT conference. Please '
        + 'read para 4.', '17:05'),
      fileCard('w16-plan', {
        fileName: planFile, pages: '3 pages', size: '184 KB', time: '17:05',
      }),
      them('w16-para4', para4, '17:06'),
      me('w16-plan-ack', 'Noted sir 👍', '17:20'),

      day('w16-day-mon', 'MONDAY'),
      them('w16-week',
        'Pool 3 this week: 07:15 Main Gate, Monday to Friday. Driver and vehicle as per the '
        + 'board.', '18:10'),
      me('w16-week-ack', 'Noted.', '18:14'),

      day('w16-day-yday', 'YESTERDAY'),
      them('w16-yday', 'Tomorrow normal timings.', '19:02'),

      day('w16-day-today', 'TODAY'),
      them('w16-head', headline(scenario), headlineTime(scenario) ?? '10:00'),
      them('w16-b2', 'Road to the Main Gate goes under water from tonight. Board is updated.',
        '10:01'),

      /** The branch stage: the coordinator says what an acknowledgement is. */
      them('w16-b3', '👍 on the message above is enough. No replies with names or timings '
        + 'please.', '10:04', {
        since: 'branch',
        quote: quote(who.display_name, headline(scenario)),
      }),

      them('w16-b4', 'Gate B marshal will be at the barrier from 06:45.', '10:40',
        { since: 'verify' }),

      /** What the helpful reply looks like once it has been sent. */
      {
        kind: 'message', id: 'w16-after-overshare', from: 'me', status: 'read',
        text: 'Ack. 6 from Block C: Rao, Menon, Iyer, Das, Khan and me. Walking via the ring '
          + 'road at 06:50.',
        time: '10:06', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w16-after-overshare-reply', from: 'them',
        text: 'Please delete that. Names and routes stay off WhatsApp - just the 👍.',
        time: '10:09', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'w16-after-forward', tone: 'alert',
        text: 'Forwarded to Block C Residents (212 participants, most of them not in the unit).',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      contact: {
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
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: `${who.display_name} (MT Section)` },
                  { label: 'Saved', value: '2 years ago' },
                  { label: 'Number last changed', value: 'Never' },
                  { label: 'About', value: 'MT Section - vehicle pool' },
                  { label: 'Pinned in this chat', value: 'Monsoon contingency, 21 Aug' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 3,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Pool 3 Riders', value: '8 participants', group: true },
                  { label: 'MT Conference', value: '14 participants', group: true },
                ],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 2,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: planFile, value: '21 Aug, 3 pages' },
                  { label: 'Pool 3 route card (photo)', value: '2 Jun' },
                ],
              },
            ],
          },
        ],
      },

      /** The plan itself - what para 4 says, and where else it is published. */
      'plan-viewer': {
        kind: SURFACE.VIEWER,
        title: planFile,
        subtitle: '3 pages - 184 KB',
        art: 'document',
        label: 'Vehicle pool monsoon contingency, PDF',
        heading: 'Vehicle pool - monsoon contingency',
        text: 'Para 4. Main Gate closure (weather or flooding): all pool pickups move to '
          + 'Alternate Gate B at the published time. The transport coordinator sends the change '
          + 'in the pool chat marked "acknowledge only", and the Movement Board is updated at '
          + 'the same time. Riders acknowledge with a reaction. Names, rosters and routes are '
          + 'not sent on WhatsApp.',
        rowsHeading: 'Document details',
        rows: [
          { label: 'Issued by', value: 'MT Section, Unit Falcon' },
          { label: 'Dated', value: '21 Aug' },
          { label: 'Also published', value: 'Unit notice board and the Movement Board app' },
          { label: 'Received', value: 'In this chat, 21 Aug at 17:05' },
          { label: 'Forwarded', value: 'No' },
        ],
        inertNote: 'Local preview. Nothing is opened, run or sent from here.',
      },

      /** The MT Section's own board, on an app the learner already has. */
      'board-app': {
        kind: SURFACE.APP,
        appName: 'Movement Board',
        appTagline: 'Unit Falcon - MT Section',
        hero: {
          label: 'Tomorrow',
          value: 'Main Gate closed 05:00-12:00',
          caption: 'Weather. All pool pickups at Alternate Gate B at their published times. '
            + 'Updated today at 09:58 by MT Section.',
          chips: ['Signed in on this phone', 'Unit Falcon'],
        },
        sections: [
          {
            id: 'pool3', heading: 'Pool 3',
            rows: [
              { label: 'Pickup', value: '07:15' },
              { label: 'Point', value: 'Alternate Gate B (contingency plan, para 4)' },
              { label: 'Coordinator', value: `${who.display_name}, ${who.identifier}` },
              { label: 'Acknowledge', value: 'Reaction in the pool chat' },
            ],
          },
          {
            id: 'gates', heading: 'Gates tomorrow',
            rows: [
              { label: 'Main Gate', value: 'Closed 05:00-12:00 (weather)' },
              { label: 'Alternate Gate B', value: 'Open - marshal from 06:45' },
              { label: 'Gate C', value: 'Closed' },
            ],
            note: 'The board shows the plan in force. Who rides in which vehicle is not '
              + 'published here or anywhere else.',
          },
        ],
        tabs: [
          { label: 'Board', icon: 'home' },
          { label: 'Plans', icon: 'history' },
          { label: 'Vehicles', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    /**
     * The coordinator's own approved row, so the comparison stage 5 asks for can be made -
     * the bank's directory asset is the unit support desk, which is not the MT Section. It
     * is shown beside the bank's row with the same provenance line, as W03's was.
     */
    directoryExtras: [
      {
        id: 'w16-dir-mt',
        name: 'Transport Coordinator, MT Section',
        identifier: who.identifier,
        provenance: 'local approved directory',
        role: 'Vehicle-pool changes are sent from this number and posted on the Movement Board.',
      },
      {
        id: 'w16-dir-mtoffice',
        name: 'MT Office (desk)',
        identifier: '+91 00000 10760',
        provenance: 'local approved directory',
        role: 'Vehicle pool, drivers and gate timings.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w16-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w16-c02', slot: SLOT.INLINE,
            label: 'Reply "Ack" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w16-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, how long it has been saved, groups in common',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w16-c04', slot: SLOT.INLINE,
            anchor: 'w16-plan', label: 'Open', opens: 'plan-viewer',
          }),
          action({
            id: 'w16-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w16-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** The reaction the coordinator asked for, on the message it acknowledges. */
          action({
            id: 'w16-c07', slot: SLOT.INLINE, anchor: 'w16-head',
            label: 'React 👍 to acknowledge',
          }),
          action({
            id: 'w16-c08', slot: SLOT.COMPOSER,
            label: 'Acknowledged.', echo: 'Acknowledged.',
          }),
          action({
            id: 'w16-c09', slot: SLOT.COMPOSER,
            label: 'Ack. 6 of us from Block C - names and route',
            echo: 'Ack. 6 from Block C: Rao, Menon, Iyer, Das, Khan and me. Walking via the '
              + 'ring road at 06:50.',
          }),
          action({
            id: 'w16-c10', slot: SLOT.MENU,
            label: 'Forward this update to Block C Residents',
          }),
          action({
            id: 'w16-c11', slot: SLOT.MENU,
            label: 'Mute the chat and use the Main Gate as usual',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w16-c12',
            slot: SLOT.MENU, label: 'Check the Movement Board app',
            hint: 'The MT Section’s own board, already on your phone', opens: 'board-app',
          }),
          action({
            id: 'w16-c13',
            slot: SLOT.MENU,
            label: 'Look up the MT Section in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w16-c14',
            slot: SLOT.MENU,
            label: 'Ask in this chat whether it is really him',
          }),
          action({ id: 'w16-c15', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w16-c16', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w16-c17', slot: SLOT.INLINE,
            label: 'Keep the acknowledgement and use Gate B at 07:15',
          }),
          action({
            id: 'w16-c18', slot: SLOT.INLINE,
            label: 'Leave it and go to the Main Gate as usual',
          }),
          action({
            id: 'w16-c19', slot: SLOT.MENU,
            label: 'Keep the chat, nothing further',
          }),
          action({
            id: 'w16-c20', slot: SLOT.MENU,
            label: 'Report the message and close',
          }),
          action({
            id: 'w16-c21', slot: SLOT.MENU,
            label: `Block ${who.display_name} and close`,
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w16-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w16-nav-plan', slot: SLOT.MENU, label: `Open ${planFile}`,
        opens: 'plan-viewer', after: 'inspect',
      }),
      navigate({
        id: 'w16-nav-board', slot: SLOT.MENU, label: 'Movement Board',
        opens: 'board-app', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}

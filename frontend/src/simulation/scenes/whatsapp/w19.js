import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  asset, day, directory, e2e, headline, headlineTime, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W19 - Commander Clone Requests Location.
 *
 * What is being asked for is not a code, a document or money. It is where the learner is,
 * continuously, for an hour, during a move. The Indian Army's own advisories describe the
 * delivery: profiles of officers built from pictures taken off the internet, used to engage
 * personnel "for extracting information". ATT&CK has the parts - the copied persona
 * (T1585.001), the impersonation (T1684.001), the public material it was built from
 * (T1593.001, which names "the roles, locations, and interests of staff"), and the request
 * itself (T1598, information obtained "through the exchange of... instant messages").
 * Mobile T1430 Location Tracking was read and rejected: it covers malware and OS APIs, not
 * a person being talked into pressing Share.
 *
 * Three things here are new to the batch, and none of them is W15's "Also in contacts" tab:
 *
 * 1. **A one-character difference.** The account uses the CO's photo and his About line,
 *    copied - except the surname is spelt "Seghal". The real CO is "Sehgal". The learner
 *    has to read the two side by side to see it, and nothing on the screen points at it.
 * 2. **The real CO's own chat, one row down in the chat list.** Opening it (local) shows
 *    what he told everyone at 15:10: positions only on the move control net, nothing on
 *    WhatsApp. The new account asked for the opposite, and asked for it "not in the group".
 * 3. **The phone's own location screens.** Sharing a live location on WhatsApp goes through
 *    the attach sheet, the operating system's location permission - off for WhatsApp on this
 *    phone - and the live-location sheet with its 15-minute and 1-hour choices. The learner
 *    can walk all the way to the button that would send it.
 *
 * The verification is the duty office on its directory number, or the CO on his saved
 * number - never a call to the account that is asking.
 */
export function buildW19(scenario) {
  const who = sender(scenario)
  const senderAsset = asset(scenario, ASSET_KIND.SENDER)?.asset_id ?? null
  const directoryAsset = asset(scenario, ASSET_KIND.DIRECTORY)?.asset_id ?? null
  const desk = directory(scenario)

  const realName = 'Col. Vikram Sehgal'
  const cloneName = 'Col. Vikram Seghal'
  const realNumber = '+91 00000 30428'
  const dutyOffice = '+91 00000 30400'
  const aboutLine = (name) => `${name} · CO, Unit Falcon · Service before self`

  return {
    scenarioId: 'W19',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'online',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: true,
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w19-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 4,
        },
        {
          /** The real CO's chat - saved, a different number, and it can be looked into. */
          id: 'w19-bg-co',
          title: `${realName} (CO)`,
          avatarSeed: who.avatar_initials,
          preview: 'Convoy brief 1800, ops room. Positions only on the move control net.',
          time: '15:10',
          inert: true,
          opens: 'chat-co',
        },
        {
          id: 'w19-bg-1',
          title: 'Unit Falcon Officers',
          group: true,
          preview: 'Adjt: Raising Day photos are on the unit page',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w19-bg-2',
          title: 'Ma',
          preview: 'You: parade went well',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w19-e2e'),

      day('w19-day', 'TODAY'),
      them('w19-b1', 'Good afternoon. Well turned out at the Raising Day parade yesterday - the '
        + 'photos on the unit page came out well.', '16:30'),
      them('w19-b2', 'I am on this number for a few days. The other phone is with the move staff.',
        '16:33'),
      them('w19-head', headline(scenario), headlineTime(scenario) ?? '16:38'),
      them('w19-b3', 'Share live location for 1 hour. It is for the convoy plan - I need to see '
        + 'where each detachment is.', '16:39'),

      them('w19-b4', 'Waiting. This move is close hold, so not a word in the officers’ group.',
        '16:43', { since: 'branch' }),

      typing('w19-typing', { since: 'verify', until: 'resolve' }),

      {
        kind: 'system', id: 'w19-after-share', tone: 'alert',
        text: `Your live location is being shared with ${who.identifier}.`,
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w19-after-share-msg', from: 'them',
        text: 'Good. Keep it on. Now send the vehicle numbers of your detachment.',
        time: '16:46', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w19-after-reply', from: 'them',
        text: 'No questions on chat. Just share it.',
        time: '16:45', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: 'This number is not in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'About', value: aboutLine(cloneName) },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Profile photo', value: 'Officer in ceremonials, parade ground behind' },
                  { label: 'On WhatsApp since', value: '3 days ago' },
                  { label: 'First message', value: 'Today at 16:30' },
                ],
                note: 'A profile photo and an About line can be copied onto any account.',
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 0,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                empty: 'You are not in any group with this number.',
                items: [],
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
                empty: 'No media, links or documents.',
                items: [],
              },
            ],
          },
        ],
      },

      /**
       * The real CO, reached from his own row in the chat list. The same tabs as the new
       * account, so the comparison is instrument against instrument.
       */
      'chat-co': {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: `${realName} (CO)`,
        identifier: realNumber,
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
                  { label: 'About', value: aboutLine(realName) },
                  { label: 'Phone', value: realNumber },
                  { label: 'Profile photo', value: 'Officer in ceremonials, parade ground behind' },
                  { label: 'Saved', value: '2 years ago' },
                  { label: 'Number last changed', value: 'Never' },
                ],
              },
            ],
          },
          {
            id: 'recent',
            label: 'Recent messages',
            sections: [
              {
                id: 'recent-messages', heading: 'Today',
                messages: [
                  { from: 'them', text: 'Convoy brief 1800, ops room. Positions only on the move control net - nothing on WhatsApp, including to me.', time: '15:10' },
                  { from: 'me', text: 'Noted sir.', time: '15:12' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 5,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: 'Unit Falcon Officers', value: '26 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Move Staff', value: '7 participants', group: true },
                ],
                note: 'Two more groups in common.',
              },
            ],
          },
        ],
      },

      /**
       * The phone's own location screens: the permission WhatsApp does not have yet, then
       * the live-location sheet. Walking between them is local; the shares and the refusals
       * are the scene's controls, scoped to the page they belong to.
       */
      location: {
        kind: SURFACE.INSTALLER,
        title: 'Location',
        home: 'permission',
        closeLabel: 'Close location sharing',
        inertNote: 'Simulated location screen. No location is read, granted or sent.',
        pages: {
          permission: {
            style: 'dialog',
            app: { name: 'WhatsApp', detail: 'Location: not allowed', monogram: 'WA' },
            title: 'Allow WhatsApp to access this device’s location?',
            text: 'WhatsApp uses your location to send your current or live location to a chat.',
            links: [
              { id: 'w19-perm-using', label: 'While using the app', to: 'share' },
              { id: 'w19-perm-once', label: 'Only this time', to: 'share' },
            ],
          },
          share: {
            style: 'sheet',
            screenTitle: 'Share location',
            art: 'map',
            artLabel: 'Map preview with your position',
            title: 'Share live location',
            text: 'Your position keeps updating in the chat until the time runs out or you stop '
              + 'sharing - including while you are moving.',
            rows: [
              { label: 'Shared with', value: `${who.display_name}, ${who.identifier}` },
              { label: 'Accuracy', value: 'About 8 m' },
              { label: 'Stops', value: 'When the time runs out, or when you stop it from the chat' },
            ],
            optionsHeading: 'Share for',
          },
        },
      },

      /** The duty office, on the directory number. */
      'call-duty': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Duty Office, Unit Falcon',
        number: dutyOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Duty office, Capt. Arora.' },
          { at: 3, speaker: 'you', text: 'A new number with the CO’s photo is asking for my live location for the convoy.' },
          { at: 9, speaker: 'them', text: 'The CO is in the ops room with me. His number has not changed, and he has not asked anyone for a location.' },
          { at: 16, speaker: 'them', text: 'Convoy positions go on the move control net only. Do not share anything. Block and report the number - I am telling unit security now.' },
        ],
      },

      /** The CO himself, on the number the learner has had saved for two years. */
      'call-co': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${realName} (CO)`,
        number: realNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Sehgal.' },
          { at: 3, speaker: 'you', text: 'Sir, a number with your photo is asking me to share live location for the convoy.' },
          { at: 9, speaker: 'them', text: 'That is not me. I have one number and you are calling it. Nobody sends positions on WhatsApp.' },
          { at: 16, speaker: 'them', text: 'Do not share. Report it and tell the duty office.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w19-dir-duty',
        name: 'Duty Office, Unit Falcon',
        identifier: dutyOffice,
        provenance: 'local approved directory',
        role: 'Round the clock. Confirm any instruction from a senior officer.',
      },
      {
        id: 'w19-dir-co',
        name: `${realName}, Commanding Officer`,
        identifier: realNumber,
        provenance: 'local approved directory',
        role: 'Commanding Officer, Unit Falcon.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w19-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w19-c02', slot: SLOT.INLINE,
            label: 'Reply "Yes sir" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w19-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, the About line, when this account appeared',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w19-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w19-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** The paperclip's Location: walking to the share sheet records nothing. */
          navigate({
            id: 'w19-nav-location', slot: SLOT.COMPOSER, label: 'Location',
            hint: 'Share your current or live location', opens: 'location',
          }),
          action({
            id: 'w19-c06', slot: SLOT.SURFACE,
            on: 'location', page: 'permission', label: 'Don’t allow', closes: true,
          }),
          action({
            id: 'w19-c07', slot: SLOT.SURFACE,
            on: 'location', page: 'share', label: '15 minutes', closes: true,
          }),
          action({
            id: 'w19-c08', slot: SLOT.SURFACE,
            on: 'location', page: 'share', label: '1 hour', closes: true,
          }),
          action({
            id: 'w19-c09', slot: SLOT.SURFACE,
            on: 'location', page: 'share', label: 'Send your current location instead',
            closes: true,
          }),
          action({
            id: 'w19-c10', slot: SLOT.SURFACE,
            on: 'location', page: 'share', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w19-c11', slot: SLOT.COMPOSER,
            label: 'Sir, we are at the old depot, moving 0500 by the river road',
            echo: 'Sir, we are at the old depot, moving 0500 by the river road.',
          }),
          action({
            id: 'w19-c12', slot: SLOT.COMPOSER,
            label: 'Sir, which detachment should I report with?',
            echo: 'Sir, which detachment should I report with?',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w19-c13',
            slot: SLOT.MENU, label: 'Call the duty office on the directory number',
            opens: 'call-duty',
          }),
          action({
            id: 'w19-c14',
            slot: SLOT.MENU, label: `Call ${realName} on his saved number`,
            opens: 'call-co',
          }),
          action({
            id: 'w19-c15',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w19-c16',
            slot: SLOT.MENU,
            label: 'Ask this number to prove who it is',
          }),
          action({ id: 'w19-c17', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w19-c18', slot: SLOT.MENU,
            label: `Block ${who.identifier}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w19-c19', slot: SLOT.MENU,
            label: 'Report the account and tell unit security',
          }),
          action({
            id: 'w19-c20', slot: SLOT.INLINE,
            label: 'Share the location and stay available',
          }),
          action({
            id: 'w19-c21', slot: SLOT.INLINE,
            label: 'Block and report the number',
          }),
          action({
            id: 'w19-c22', slot: SLOT.MENU,
            label: 'Keep the chat open in case he calls',
          }),
          action({
            id: 'w19-c23', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w19-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w19-nav-co', slot: SLOT.MENU, label: `${realName} (CO) - saved contact`,
        opens: 'chat-co', after: 'branch',
      }),
    ],

    supportDesk: desk,
  }
}

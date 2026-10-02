import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headlineTime, me, media, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W25 - Known Contact Sends a Linking Code.
 *
 * Gen Digital's December 2025 "GhostPairing" research describes the current form of this: a
 * message from a contact whose account has already been taken, and WhatsApp's own device
 * linking used to add the attacker's browser to the next victim's account. ATT&CK added the
 * technique in May 2025 (T1676 Linked Devices, which names WhatsApp); the account doing the
 * asking is T1586.001, and the person typing is impersonating its owner (T1684.001).
 *
 * W01 was a stranger asking for a code sent "by accident"; W10 was a survey desk with a QR;
 * W09 and W18 were hijacked accounts asking for money and a form. What is new here:
 *
 * 1. **The history is real, and the attacker uses it.** Last Thursday Neel covered the
 *    learner's 0600 duty and the learner wrote "I owe you one". Today's message cashes that
 *    in: "Remember you owe me one". A compromised account carries the genuine conversation, so
 *    everything the learner can check about the RELATIONSHIP checks out. None of it says who is
 *    typing now.
 * 2. **The code is the learner's own, on the learner's own screen.** WhatsApp's notice sits in
 *    the chat list one row down - a linking code and "don't share it" - and the request it
 *    belongs to is a sheet that names the device and how far away it is. Neel's "desktop
 *    screenshot" shows the login page with the LEARNER's phone number typed in.
 * 3. **The out-of-character evidence is outside the chat.** Neel's About line says he is at a
 *    family wedding until Wednesday; the team group says he is on leave; he has never written
 *    "Kindly" in four years. The check that settles it is an ordinary phone call to his number,
 *    which reaches the real Neel even though his WhatsApp does not.
 *
 * The client's notification is truncated in the pinned bank at the apostrophe in "I'm"; the
 * conversation carries the client's full sentence, as W06, W09, W15, W20 and W22 do.
 */
export function buildW25(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full. The pinned notification asset holds only "I"
   * because the DATA-003 generator's capture stops at the first apostrophe.
   */
  const requestLine = "I'm testing the team desktop. Send the linking code you just got so I can finish setup."

  const code = 'KX7P-49RT'
  const myNumber = '+91 00000 50288'
  const itDesk = '+91 00000 16710'

  return {
    scenarioId: 'W25',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      presence: 'online',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w25-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: headlineTime(scenario),
          unread: 3,
        },
        {
          /** WhatsApp's own notice - it opens the request it belongs to, locally. */
          id: 'w25-bg-whatsapp',
          title: 'WhatsApp',
          avatarSeed: 'WA',
          preview: `Linking code ${code}. Don’t share this code with anyone.`,
          time: '19:33',
          unread: 1,
          inert: true,
          opens: 'link-request',
        },
        {
          id: 'w25-bg-team',
          title: 'Team Delta',
          group: true,
          preview: 'Maj. Kulkarni: Neel is on leave till Wednesday, send his files to Priya',
          time: '09:05',
          muted: true,
          inert: true,
        },
        {
          id: 'w25-bg-ma',
          title: 'Ma',
          preview: 'reached home safely',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w25-e2e'),

      /** Last week: the favour. */
      day('w25-day-thu', 'LAST THURSDAY'),
      me('w25-h1', 'neel can you cover my 0600 duty tomorrow? ma’s appointment', '21:10'),
      them('w25-h2', 'done da 👍 go', '21:12'),
      me('w25-h3', 'lifesaver. I owe you one', '21:13'),
      them('w25-h4', 'haha treat pending 🍕', '21:14'),

      day('w25-day-sat', 'SATURDAY'),
      them('w25-h5', 'did u see the match 😭', '23:02'),
      me('w25-h6', 'don’t even', '23:10'),

      day('w25-day-today', 'TODAY'),
      them('w25-b0', 'Hi, hope you are doing well.', '19:31'),
      them('w25-head', requestLine, headlineTime(scenario) ?? '19:34'),
      them('w25-b1', 'Kindly do it fast. Remember you owe me one 😊', '19:35'),

      /** The branch stage: the "proof", and the clock. */
      media('w25-shot', {
        art: 'desktop', label: 'Screenshot: WhatsApp on a desktop',
        caption: 'See, it is asking for the code', time: '19:37', since: 'branch',
      }),
      them('w25-b2', 'Just type it here. It expires in 3 minutes.', '19:38', { since: 'branch' }),

      {
        kind: 'system', id: 'w25-after-share', tone: 'alert',
        text: 'A new device, Chrome on Windows, is now linked to your account.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w25-after-share-msg', from: 'them',
        text: 'Thanks 👍 Setup done. You can ignore any notification about a new login.',
        time: '19:40', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'w25-after-link', tone: 'alert',
        text: 'Chrome on Windows is now linked to your account. It can read and send messages in '
          + 'every chat until it is logged out.',
        since: 'verify', afterConsequence: 'simulated_device_link',
      },
      {
        kind: 'message', id: 'w25-after-link-msg', from: 'them',
        text: 'Done ✅ thanks. Ignore any login notification, it is the team system.',
        time: '19:41', since: 'verify', afterConsequence: 'simulated_device_link',
      },
      {
        kind: 'message', id: 'w25-after-reply', from: 'them',
        text: 'It is a new security step for the team system, IT told us. Please send it quickly.',
        time: '19:39', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },

      /** The other side composing, drawn after whatever the last action produced. */
      typing('w25-typing', { since: 'verify', until: 'resolve' }),
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
                  { label: 'About', value: 'At my cousin’s wedding 💍 back Wednesday' },
                  { label: 'About updated', value: 'Yesterday' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: `${who.display_name} (Team Delta)` },
                  { label: 'Saved', value: '4 years ago' },
                  { label: 'Number last changed', value: 'Never' },
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
                  { label: 'Team Delta', value: '9 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Cricket Sundays', value: '15 participants', group: true },
                ],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 1,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: 'Duty roster (photo)', value: 'Last Thursday' }],
              },
            ],
          },
        ],
      },

      /** The "desktop" screenshot: a login page with a phone number in it. */
      'shot-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Screenshot',
        subtitle: `From ${who.display_name}, today 19:37`,
        art: 'desktop',
        label: 'Screenshot of WhatsApp on a desktop browser',
        heading: 'WhatsApp - link with phone number',
        text: 'Enter the code on your phone. The code expires in 3 minutes.',
        rowsHeading: 'What the picture shows',
        rows: [
          { label: 'Phone number typed in', value: `${myNumber} (your number)` },
          { label: 'Browser', value: 'Chrome on Windows' },
          { label: 'Type', value: 'Image' },
        ],
        inertNote: 'Local preview. Nothing is opened or sent from here.',
      },

      /**
       * WhatsApp's own link request. Reached from its notice in the chat list or from Linked
       * devices; Link device and Don't link are the decision.
       */
      'link-request': {
        kind: SURFACE.INSTALLER,
        title: 'Linked devices',
        home: 'request',
        closeLabel: 'Close',
        inertNote: 'Simulated WhatsApp screen. No device is linked from here.',
        pages: {
          request: {
            style: 'sheet',
            screenTitle: 'Link a device',
            title: 'A device wants to link to your account',
            text: 'If you link it, it can read your chats, including older messages, and send '
              + 'messages as you - even when this phone is off.',
            rows: [
              { label: 'Device', value: 'Chrome on Windows' },
              { label: 'Requested', value: 'Today at 19:33, with your phone number' },
              { label: 'Location', value: 'Approximately 1,400 km from you' },
              { label: 'Linking code', value: code },
            ],
            note: 'Only use a linking code to link a device of your own to this account.',
          },
          linked: {
            style: 'sheet',
            final: true,
            screenTitle: 'Linked devices',
            title: 'Device linked',
            text: 'Chrome on Windows can read and send messages from this account until you log it out.',
            rows: [
              { label: 'Linked', value: 'Today at 19:39' },
              { label: 'Active now', value: 'Yes' },
            ],
          },
        },
      },

      /** Settings > Linked devices, opened by the learner. */
      'linked-devices': {
        kind: SURFACE.SETTINGS,
        title: 'Linked devices',
        name: 'Linked devices',
        identifier: 'WhatsApp Settings',
        breadcrumb: 'Settings > Linked devices',
        statusLine: 'Devices linked to your account can read and send your messages.',
        sections: [
          {
            id: 'waiting', heading: 'Waiting',
            rows: [
              { label: 'Device', value: 'Chrome on Windows' },
              { label: 'Requested', value: 'Today at 19:33' },
              { label: 'Location', value: 'Approximately 1,400 km from you' },
            ],
            link: { label: 'Review this request', to: 'link-request' },
          },
          {
            id: 'yours', heading: 'Your devices',
            items: [
              { label: 'This phone', value: 'Primary device' },
              { label: 'Office laptop', value: 'Linked 3 months ago - last active yesterday 17:40' },
            ],
          },
        ],
      },

      /** An ordinary phone call to Neel's number - not WhatsApp. */
      'call-neel': {
        kind: SURFACE.CALL,
        title: 'Phone call',
        caller: `${who.display_name} (mobile)`,
        number: who.identifier,
        backLabel: 'Back to the conversation',
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Arre, what happened? There is a band playing here.' },
          { at: 4, speaker: 'you', text: 'Neel, did you just ask me on WhatsApp for a linking code for the team desktop?' },
          { at: 10, speaker: 'them', text: 'What? No. I am at my cousin’s wedding. My WhatsApp logged me out this afternoon.' },
          { at: 17, speaker: 'them', text: 'Yesterday someone pretending to be WhatsApp support asked me for a code and I gave it... Don’t send anything. Report that chat and tell Team Delta my account is gone.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w25-dir-it',
        name: 'IT Helpdesk, Unit Falcon',
        identifier: itDesk,
        provenance: 'local approved directory',
        role: 'Account and device problems. Report a messaging account that has been taken over.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w25-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w25-c02', slot: SLOT.INLINE,
            label: 'Reply "ok wait" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w25-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, his About line, groups in common',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w25-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w25-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w25-branch-shot', slot: SLOT.INLINE, anchor: 'w25-shot',
            label: 'View', opens: 'shot-viewer',
          }),
          navigate({
            id: 'w25-branch-devices', slot: SLOT.MENU, label: 'Settings > Linked devices',
            opens: 'linked-devices',
          }),
          action({
            id: 'w25-c06', slot: SLOT.SURFACE,
            on: 'link-request', page: 'request', thenPage: 'linked', label: 'Link device',
          }),
          action({
            id: 'w25-c07', slot: SLOT.SURFACE,
            on: 'link-request', page: 'request', label: 'Don’t link', closes: true,
          }),
          action({
            id: 'w25-c08', slot: SLOT.COMPOSER,
            label: code, echo: code,
          }),
          action({
            id: 'w25-c09', slot: SLOT.COMPOSER,
            label: 'Why do you need my code for your desktop?',
            echo: 'Why do you need my code for your desktop?',
          }),
          action({
            id: 'w25-c10', slot: SLOT.COMPOSER,
            label: 'I am not sharing a linking code. Calling you on your number.',
            echo: 'I am not sharing a linking code. Calling you on your number.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w25-c11',
            slot: SLOT.MENU, label: `Phone ${who.display_name} on his mobile number, not on WhatsApp`,
            opens: 'call-neel',
          }),
          action({
            id: 'w25-c12',
            slot: SLOT.MENU, label: 'Review Settings > Linked devices',
            hint: 'Your own account, opened from the app', opens: 'linked-devices',
          }),
          action({
            id: 'w25-c13',
            slot: SLOT.MENU,
            label: 'Check the IT helpdesk in the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w25-c14',
            slot: SLOT.MENU,
            label: `Ask ${who.display_name} in this chat to prove it is him`,
          }),
          action({ id: 'w25-c15', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w25-c16', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w25-c17', slot: SLOT.INLINE,
            label: 'Don’t link; report the chat and warn Neel',
          }),
          action({
            id: 'w25-c18', slot: SLOT.INLINE,
            label: 'Send Neel the code after all',
          }),
          action({
            id: 'w25-c19', slot: SLOT.MENU,
            label: 'Block the chat until Neel recovers his account',
          }),
          action({
            id: 'w25-c20', slot: SLOT.MENU,
            label: 'Keep chatting with this account',
          }),
          action({
            id: 'w25-c21', slot: SLOT.MENU,
            label: 'Ignore it and carry on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w25-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w25-nav-request', slot: SLOT.MENU, label: 'WhatsApp link request',
        opens: 'link-request', after: 'inspect',
      }),
      navigate({
        id: 'w25-nav-devices', slot: SLOT.MENU, label: 'Linked devices',
        opens: 'linked-devices', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}

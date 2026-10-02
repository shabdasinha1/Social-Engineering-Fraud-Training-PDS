import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, sender, them, typing, voice,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W15 - Senior's Urgent Voice Note.
 *
 * The FBI's public service announcements of May and December 2025 describe this exact
 * shape at national scale: texts and AI-generated voice messages that claim to come from a
 * senior official, a quick move to a messaging app, and then a request. ATT&CK has the two
 * halves: T1588.007 (Artificial Intelligence) says in so many words that "AI-generated
 * text, images, audio, and video may be used for fraud, Impersonation", and T1598.004
 * (Spearphishing Voice) is the use of voice "to elicit sensitive information". T1684.001
 * carries the impersonation itself, and T1585.001 the new account with a copied photo.
 *
 * **The distinct interaction is the voice.** Every earlier scenario gave the learner
 * something to read. This one gives them something to LISTEN to - a voice message with a
 * play control, a waveform and the app's own transcript - and the voice is right. The scene
 * never says it sounds wrong, because a cloned voice does not, and teaching people to
 * listen for artefacts is teaching them to trust the ones that have none.
 *
 * So the evidence is everything except the voice: a number that joined WhatsApp last
 * night, a copied photo, no shared history, a request for something that never moves by
 * chat at all - and, one tap further, the real colonel's saved thread from yesterday
 * evening, where he said the Adjutant would brief the secure room. The verification is the
 * chain of command: the Adjutant, on his saved number, who was with the CO ten minutes ago.
 *
 * The client's notification is truncated in the pinned bank at the apostrophe in
 * "today's" - see `requestLine` - so the conversation carries the client's full sentence.
 */
export function buildW15(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = assetId(scenario, ASSET_KIND.FILE)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full. The pinned notification asset holds only
   * "Voice note - Send today" because the DATA-003 generator's capture stops at the first
   * apostrophe; the bank is not edited here. Recorded with W06 and W09 as the same finding.
   */
  const requestLine = "Voice note - Send today's access phrase here; official phone is unavailable."

  const savedNumber = '+91 00000 27150'
  const adjutantNumber = '+91 00000 27164'

  const transcript = 'Good morning, it is Dev. Listen, I am stuck at the airport and the '
    + 'inspection party reaches the secure room at nine. The duty NCO will not let them in '
    + 'without today\'s access phrase, and my official phone is not working. Send me the '
    + 'phrase on this number and I will pass it to him myself. Quickly please, I am boarding '
    + 'soon.'

  return {
    scenarioId: 'W15',
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
          id: 'w15-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: '07:26',
          unread: 4,
        },
        {
          /** The real colonel's chat, a little further down, saying something quite ordinary. */
          id: 'w15-bg-saved',
          title: 'Col. Dev',
          preview: 'Inspection party arrives 0900. Adjt will brief the secure room.',
          time: 'Yesterday',
          inert: true,
        },
        {
          id: 'w15-bg-1',
          title: 'Unit Falcon Officers',
          group: true,
          preview: 'Adjt: inspection programme attached',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w15-bg-2',
          title: 'Ma',
          preview: 'You: will call on Sunday',
          time: 'Tuesday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w15-e2e'),

      day('w15-day', 'TODAY'),
      them('w15-b1', 'Good morning. Dev here. This is my personal number, save it.', '07:20'),
      them('w15-b2', 'My official phone has been with the signals workshop since last night.',
        '07:21'),
      voice('w15-voice', { duration: '0:41', transcript, time: '07:24' }),
      them('w15-b3', requestLine, '07:26'),

      them('w15-b4', 'Boarding in fifteen minutes. Please.', '07:31', { since: 'branch' }),
      voice('w15-voice-2', {
        duration: '0:09',
        transcript: 'It is me, do not worry. Just send it here, nobody else needs to know.',
        time: '07:32',
        since: 'branch',
      }),

      typing('w15-typing', { since: 'verify', until: 'resolve' }),

      {
        kind: 'system', id: 'w15-after-send', tone: 'alert',
        text: 'Secure-room access material is now in a personal chat with a number you had not '
          + 'seen before today.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w15-after-send-msg', from: 'them',
        text: 'Good. Also send a photo of today’s visitor roster.',
        time: '07:35', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w15-after-call', from: 'them',
        text: 'Sorry, very bad network at the gate. Please just send it.',
        time: '07:34', since: 'verify', afterConsequence: 'simulated_call',
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
                  { label: 'Status', value: 'Available' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Profile photo', value: 'The same photo as your saved contact Col. Dev' },
                  { label: 'On WhatsApp since', value: 'Yesterday at 21:40' },
                  { label: 'First message', value: 'Today at 07:20' },
                  { label: 'Earlier chats', value: 'None' },
                ],
                note: 'Any photo can be copied onto a new account, and any name typed in.',
              },
            ],
          },
          {
            id: 'saved',
            label: 'Also in contacts',
            sections: [
              {
                id: 'saved-list', heading: 'Saved in your contacts',
                items: [
                  {
                    label: 'Col. Dev',
                    value: `${savedNumber} - saved 3 years ago`,
                    to: 'contact-saved',
                  },
                ],
                note: 'A different number, already in your phone.',
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
        ],
      },

      /** The colonel you actually know, and what he said yesterday evening. */
      'contact-saved': {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: 'Col. Dev',
        identifier: savedNumber,
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
                  { label: 'Phone', value: savedNumber },
                  { label: 'Saved as', value: 'Col. Dev (CO)' },
                  { label: 'Saved', value: '3 years ago' },
                  { label: 'Number last changed', value: 'Never' },
                  { label: 'Last message', value: 'Yesterday at 18:42' },
                ],
              },
            ],
          },
          {
            id: 'recent',
            label: 'Recent messages',
            sections: [
              {
                id: 'recent-messages', heading: 'Yesterday',
                messages: [
                  { from: 'them', text: 'Inspection party arrives 0900 tomorrow. Adjt will brief the secure room staff.', time: '18:40' },
                  { from: 'me', text: 'Noted sir.', time: '18:41' },
                  { from: 'them', text: 'Access procedure as per standing orders. No changes.', time: '18:42' },
                ],
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 7,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: 'Unit Falcon Officers', value: '26 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                  { label: 'Inspection Prep', value: '9 participants', group: true },
                ],
                note: 'Four more groups in common.',
              },
            ],
          },
        ],
      },

      /** The recording's own details, and the transcript the phone made of it. */
      'voice-info': {
        kind: SURFACE.VIEWER,
        title: 'Voice message',
        subtitle: '0:41 - today at 07:24',
        art: 'voice',
        label: `Voice message from ${who.identifier}`,
        heading: 'Transcript',
        text: transcript,
        rowsHeading: 'Details',
        rows: [
          { label: 'From', value: `${who.display_name}, ${who.identifier}` },
          { label: 'Length', value: '0:41' },
          { label: 'Recorded', value: 'In this chat, today at 07:24' },
          { label: 'Forwarded', value: 'No' },
          { label: 'Earlier voice messages from this number', value: 'None' },
        ],
        note: 'Transcripts are made on this phone and are not sent anywhere.',
        inertNote: 'Local preview. No audio is played or stored.',
      },

      /** Ringing the new number back. The same voice answers, briefly. */
      'call-new': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Yes, Dev here.' },
          { at: 3, speaker: 'them', text: 'I am at the gate, the line is very bad.' },
          { at: 7, speaker: 'them', text: 'I cannot talk now. Just send the phrase on WhatsApp, quickly.' },
          { at: 12, speaker: 'them', text: 'Hello? I am losing you. Send it.' },
        ],
      },

      /** The chain of command, on a number the learner already has. */
      'call-adjt': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Adjt (saved)',
        number: adjutantNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Adjutant.' },
          { at: 3, speaker: 'you', text: 'Sir, the CO has sent a voice note from a new number asking for today’s access phrase.' },
          { at: 9, speaker: 'them', text: 'The CO is in the building. I was with him ten minutes ago, and his official phone is working - I have just spoken to him on it.' },
          { at: 17, speaker: 'them', text: 'The access phrase is never passed on a phone or on WhatsApp. It is issued at the guard room, in person.' },
          { at: 24, speaker: 'them', text: 'Send nothing. Keep the voice note, report the number, and I will inform the CO and the security cell.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w15-dir-adjt',
        name: 'Adjutant, Unit Falcon',
        identifier: adjutantNumber,
        provenance: 'local approved directory',
        role: 'Chain of command for the Commanding Officer.',
      },
      {
        id: 'w15-dir-security',
        name: 'Unit Falcon Security Cell',
        identifier: '+91 00000 27188',
        provenance: 'local approved directory',
        role: 'Report any request for access details.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w15-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w15-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w15-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'When this account appeared, and who else you have saved',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w15-c04', slot: SLOT.INLINE,
            anchor: 'w15-voice', label: 'Message details', targetId: fileAsset,
            opens: 'voice-info',
          }),
          action({
            id: 'w15-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w15-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** The client's three chips - phrase, photo, document - and the refusal. */
          action({
            id: 'w15-c07', slot: SLOT.COMPOSER,
            label: 'Send today’s access phrase',
            echo: 'Sir, today’s phrase is ••••••••',
          }),
          action({
            id: 'w15-c08', slot: SLOT.COMPOSER,
            label: 'Send the photo of the access roster',
            echo: 'Photo: secure room access roster',
          }),
          action({
            id: 'w15-c09', slot: SLOT.COMPOSER,
            label: 'Send the secure-room entry procedure',
            echo: 'Document: Secure_Room_Entry_Procedure.pdf',
          }),
          action({
            id: 'w15-c10', slot: SLOT.COMPOSER,
            label: 'Sir, access details cannot be passed on WhatsApp. I will confirm through the Adjutant.',
            echo: 'Sir, access details cannot be passed on WhatsApp. I will confirm through the Adjutant.',
          }),
          action({
            id: 'w15-c11', slot: SLOT.MENU,
            label: 'Voice call this number', opens: 'call-new',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w15-c12',
            slot: SLOT.MENU, label: 'Call the Adjutant on his saved number',
            hint: 'The chain of command, on a number you already have', opens: 'call-adjt',
          }),
          action({
            id: 'w15-c13',
            slot: SLOT.MENU,
            label: 'Check the security cell in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w15-c14',
            slot: SLOT.MENU,
            label: 'Call the new number back and ask him to confirm', opens: 'call-new',
          }),
          action({
            id: 'w15-c15', slot: SLOT.MENU,
            label: 'Report the number',
          }),
          action({
            id: 'w15-c16', slot: SLOT.MENU,
            label: `Block ${who.identifier}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w15-c17', slot: SLOT.INLINE,
            label: 'Keep the chat and send nothing yet',
          }),
          action({
            id: 'w15-c18', slot: SLOT.INLINE,
            label: 'Report the number and keep the voice note as evidence',
          }),
          action({
            id: 'w15-c19', slot: SLOT.MENU,
            label: 'Block the number and close the chat',
          }),
          action({
            id: 'w15-c20', slot: SLOT.MENU,
            label: 'Send the phrase and close',
          }),
          action({
            id: 'w15-c21', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w15-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w15-nav-saved', slot: SLOT.MENU, label: 'Col. Dev (saved contact)',
        opens: 'contact-saved', after: 'inspect',
      }),
      navigate({
        id: 'w15-nav-voice', slot: SLOT.MENU, label: 'Voice message details',
        opens: 'voice-info', after: 'inspect',
      }),
    ],

    supportDesk: desk,
  }
}

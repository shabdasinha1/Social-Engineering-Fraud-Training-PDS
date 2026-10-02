import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, fileCard, headline, headlineTime, me, priorContext, quote,
  sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W07 - Expected Family Document. The legitimate one in this batch.
 *
 * There is no adversary here, so there is no ATT&CK technique to map, and saying so is
 * more useful than forcing one: ATT&CK catalogues adversary behaviour, and a cousin
 * sending the invitation PDF she was asked for is not any. What the scenario tests is the
 * discrimination the client's own scoring prices - reporting this costs four points, more
 * than half the marks available - which is the cost of a false positive expressed in the
 * only currency the assessment has.
 *
 * W03 established the rule that a legitimate scenario has to be at least as SUBSTANTIAL as
 * a malicious one, or length becomes the answer. This one is built the same way and then
 * pushed further in the direction that matters here: the evidence is not just "the sender
 * is saved", it is that **the learner asked for this file themselves**, three messages
 * earlier, in the same thread they are reading. That request is visible before any control
 * is pressed.
 *
 * **The distinct interaction is the document.** W06's attachment is a picture of a crest
 * with nothing behind it; this one opens into a real invitation with a date, a venue and
 * an RSVP line, and reading it is how the learner confirms it is the thing they asked for.
 * Same viewer, opposite answer - which is the W03 lesson applied to files instead of
 * contact sheets.
 *
 * The two ways to lose marks are both realistic and neither is stupidity. Deleting an
 * unexpected-looking attachment unread is what cautious people do; installing the reader
 * the viewer offers is what busy people do. The second is the sharper lesson, because the
 * FILE is safe and the INSTALL is not, and a learner who has been taught "attachments are
 * dangerous" will get the wrong half of that.
 */
export function buildW07(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = assetId(scenario, ASSET_KIND.FILE)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const fileName = 'Meera_wedding_invite.pdf'

  return {
    scenarioId: 'W07',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: 'online',
      saved: true,
      presence: 'online',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w07-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 1,
        },
        {
          id: 'w07-bg-1',
          title: 'Family',
          group: true,
          preview: 'Ma: did you both decide about the weekend',
          time: '12:58',
          inert: true,
        },
        {
          id: 'w07-bg-2',
          title: 'Orderly Room',
          group: true,
          preview: 'Chief Clerk: Leave applications by Thursday please',
          time: '11:15',
          muted: true,
          inert: true,
        },
        {
          id: 'w07-bg-3',
          title: 'Sep Rathi',
          preview: 'You: will collect it tomorrow',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w07-e2e'),
      system('w07-context', priorContext(scenario)),

      /** Two weeks of an ordinary family thread. */
      day('w07-day-old', 'LAST SUNDAY'),
      them('w07-b0', 'Meera has fixed the date finally. Second weekend of next month.',
        '19:22', { priorChat: true }),
      me('w07-b0b', 'That is good news. Ma will be pleased.', '19:40', { priorChat: true }),
      them('w07-b0c', 'She is already making a list.', '19:41', { priorChat: true }),

      day('w07-day-today', 'TODAY'),
      me('w07-b1', 'Asha, can you send me the invitation card when it is printed? I need the '
        + 'date and venue to apply for leave.', '13:02', { status: 'read' }),
      them('w07-b2', 'It came back from the printer this morning.', '13:24',
        { quote: quote('You', 'Asha, can you send me the invitation card when it is printed?') }),

      /** The file. Expected, from a saved number, and it says what it is. */
      fileCard('w07-file', {
        fileName,
        fileKind: 'PDF',
        pages: '1 page',
        size: '332 KB',
        time: headlineTime(scenario) ?? '13:25',
      }),
      them('w07-b3', headline(scenario), headlineTime(scenario) ?? '13:25'),

      them('w07-b4', 'Venue is the community hall near the station, same as Rohan’s.',
        '13:26', { since: 'branch' }),
      them('w07-b5', 'Tell me by Sunday if you are coming so Ma can give the count.', '13:27',
        { since: 'verify' }),

      {
        kind: 'system', id: 'w07-after-install', tone: 'alert',
        text: 'The reader was installed and asked for access to your files and contacts.',
        since: 'verify', afterConsequence: 'simulated_install',
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
                  { label: 'Status', value: 'Busy with wedding work' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved as', value: `${who.display_name} (cousin)` },
                  { label: 'Saved', value: '6 years ago' },
                  { label: 'On WhatsApp since', value: '2018' },
                  { label: 'Number last changed', value: 'Never' },
                ],
                note: 'This number has not changed since you saved it.',
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 4,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                items: [
                  { label: 'Family', value: '11 participants', group: true },
                  { label: 'Meera wedding', value: '23 participants', group: true },
                  { label: 'Cousins', value: '9 participants', group: true },
                  { label: 'Nana house repairs', value: '5 participants', group: true },
                ],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 214,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: '198 photos and videos', value: 'Shared since 2018' },
                  { label: '16 documents', value: 'Most recent: today' },
                ],
              },
            ],
          },
        ],
      },

      /**
       * The invitation, opened.
       *
       * It contains what an invitation contains and asks for nothing. The RSVP line is a
       * phone number the learner already has, not a link - which is the detail that makes
       * "check the details match the known context" a check that can actually be made.
       */
      'file-viewer': {
        kind: SURFACE.VIEWER,
        title: fileName,
        subtitle: 'PDF - 1 page, 332 KB',
        art: 'photo',
        label: 'Wedding invitation card',
        heading: 'Meera and Vivek',
        text: 'Together with their families, request the pleasure of your company at their '
          + 'wedding.',
        rowsHeading: 'Printed on the card',
        rows: [
          { label: 'Date', value: 'Saturday, the second weekend of next month' },
          { label: 'Time', value: '11:00 onwards' },
          { label: 'Venue', value: 'Community hall, near the station' },
          { label: 'RSVP', value: `${who.display_name} - ${who.identifier}` },
          { label: 'Dress', value: 'Traditional' },
        ],
        note: 'The document is a single page. It asks for no sign-in, no payment and no '
          + 'download, and the RSVP number is the one already saved in your contacts.',
        inertNote: 'Local document preview. Nothing is executed, extracted or downloaded.',
      },

      /**
       * The nag the viewer shows, and the point of the scenario's second unsafe route.
       *
       * The file is fine. The reader being advertised beside it is not, and it is offered
       * at exactly the moment a learner has decided the file is safe and stopped paying
       * attention. Reaching this screen is navigation; installing is the decision.
       */
      'reader-offer': {
        kind: SURFACE.VIEWER,
        title: 'PDF Reader Pro',
        subtitle: 'reader-pro.training.example',
        art: 'photo',
        label: 'PDF Reader Pro listing',
        heading: 'Open PDFs faster',
        text: 'Recommended by the document viewer for files of this type. Free to install.',
        rowsHeading: 'This app would be able to',
        rows: [
          { label: 'Files', value: 'Read and change all documents on this device' },
          { label: 'Contacts', value: 'Read your contact list' },
          { label: 'Messages', value: 'Read notification content' },
          { label: 'Publisher', value: 'Not verified' },
          { label: 'Installs', value: '1,000+' },
        ],
        note: 'The document already opened in the viewer built into this device.',
        inertNote: 'Simulated app listing. Nothing can be installed from here.',
      },

      'call-asha': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${who.display_name} (saved)`,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Yes, I just sent it.' },
          { at: 4, speaker: 'them', text: 'The card, yes. You asked for it on Sunday for your leave application.' },
          { at: 9, speaker: 'them', text: 'Second Saturday, community hall near the station. Same place as Rohan’s.' },
          { at: 15, speaker: 'them', text: 'Just tell me by Sunday if you are coming. Nothing else needed.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w07-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w07-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w07-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'How long this number has been saved, and what you share',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w07-c04', slot: SLOT.INLINE,
            anchor: 'w07-file', label: 'Preview',
            targetId: fileAsset, opens: 'file-viewer',
          }),
          action({
            id: 'w07-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w07-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w07-c07', slot: SLOT.INLINE, anchor: 'w07-file',
            label: 'Keep it in the chat and note the date',
            hint: 'Uses the viewer already on this device',
          }),
          action({
            id: 'w07-c08', slot: SLOT.MENU,
            label: 'Delete the file without opening it',
          }),
          /**
           * The convenience trap. It is on the reader listing, which the learner reaches
           * from the viewer - so it is found by someone who has already decided the file
           * is fine, which is exactly when it works.
           */
          action({
            id: 'w07-c09', slot: SLOT.SURFACE,
            on: 'reader-offer', label: 'Install PDF Reader Pro',
          }),
          action({
            id: 'w07-c10', slot: SLOT.MENU,
            label: 'Share my live location so she can send directions',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w07-c11',
            slot: SLOT.MENU, label: `Call ${who.display_name} on the saved number`,
            opens: 'call-asha',
          }),
          action({
            id: 'w07-c12',
            slot: SLOT.MENU,
            label: 'Check the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w07-c13',
            slot: SLOT.MENU,
            label: 'Ask in the chat whether she really sent it',
          }),
          action({
            id: 'w07-c14', slot: SLOT.MENU,
            label: 'Report the message',
          }),
          action({
            id: 'w07-c15', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w07-c16', slot: SLOT.INLINE,
            label: 'Report the message and close',
          }),
          action({
            id: 'w07-c17', slot: SLOT.INLINE,
            label: 'Keep the invitation and close the chat',
          }),
          action({
            id: 'w07-c18', slot: SLOT.MENU,
            label: 'Reply about the date and carry on',
          }),
          action({
            id: 'w07-c19', slot: SLOT.MENU,
            label: `Block ${who.display_name} and close`,
          }),
          action({
            id: 'w07-c20', slot: SLOT.MENU,
            label: 'Leave it unanswered and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w07-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w07-nav-file', slot: SLOT.MENU, label: 'Open the invitation again',
        opens: 'file-viewer', after: 'inspect',
      }),
      navigate({
        id: 'w07-nav-reader', slot: SLOT.MENU, label: 'Suggested app for PDF files',
        opens: 'reader-offer', after: 'branch',
      }),
    ],

    supportDesk: desk,
  }
}

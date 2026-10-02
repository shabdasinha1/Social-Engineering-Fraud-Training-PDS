import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headlineTime, media, priorContext, sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W06 - Unit Clerk ID Photo Request.
 *
 * The elicitation scenario. Nothing is sold, no link is sent and no money is asked for:
 * somebody claiming an internal role wants a photograph of a service identity card, and
 * the only thing standing between them and it is whether the learner checks who is
 * asking. ATT&CK calls this shape T1598.001 Spearphishing Service - information sought
 * through a messaging service the organisation does not control - carried by T1684.001
 * Impersonation.
 *
 * **The distinct interaction is the gallery.** W01-W05 tempt with a link, a payment, a
 * form. Here the unsafe act is one every phone owner has performed a thousand times
 * without thinking: open the attachment tray, tap your own document, press send. So the
 * branch's risky control is not a button in the conversation - it is on the device's own
 * picker, under a drawn service card that is already staged, which is the moment where a
 * learner either notices what they are about to hand over or does not.
 *
 * **The evidence is procedural, not typographic.** There is no misspelling to catch and
 * no lookalike domain. What is wrong is that an identity document is being collected in a
 * chat by a number nobody has, when the approved directory says identity documents are
 * collected in person. That is the judgement the client's own decision signal asks for.
 *
 * The client's notification text is truncated in the pinned bank - see the note on
 * `requestLine` below - so the conversation states the client's full sentence and the
 * bank's own asset is left untouched.
 */
export function buildW06(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full.
   *
   * `headline(scenario)` would normally supply this, but the DATA-003 generator captures
   * the notification with a non-greedy match that stops at the first apostrophe, so the
   * pinned asset holds "...now for today" and loses "'s database audit." The bank is not
   * edited to fix it - that would rewrite production content this task may not touch - so
   * the client's own wording is restated here and the truncated asset still drives the
   * notification the server sends. Recorded as a finding; twelve scenarios are affected.
   */
  const requestLine = "Send front/back service ID photo now for today's database audit."

  return {
    scenarioId: 'W06',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'Last seen today at 08:14',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner:
        'This chat is with a number that is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w06-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: headlineTime(scenario),
          unread: 2,
        },
        {
          id: 'w06-bg-1',
          title: 'Orderly Room',
          group: true,
          preview: 'Chief Clerk: Leave applications by Thursday please',
          time: '11:15',
          inert: true,
        },
        {
          id: 'w06-bg-2',
          title: 'Sep Rathi',
          preview: 'You: will collect it tomorrow',
          time: '09:52',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w06-bg-3',
          title: 'Family',
          group: true,
          preview: 'Ma: call when you are free',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w06-e2e'),
      system('w06-context', priorContext(scenario)),

      day('w06-day', 'TODAY'),
      them('w06-b1', 'Good morning. This is the unit clerk desk.', '08:11'),
      them('w06-b2',
        'We are running the annual personnel database audit today. Records for your company '
        + 'are incomplete.', '08:12'),

      /** The crest. Official-looking, and made by whoever sent it. */
      media('w06-notice', {
        art: 'crest',
        label: 'Audit notice with unit crest',
        caption: 'PERSONNEL DATABASE AUDIT - IMMEDIATE ACTION',
        size: '184 KB',
        time: '08:12',
      }),

      them('w06-b3', requestLine, headlineTime(scenario) ?? '08:13'),
      them('w06-b4', 'Front and back, both sides readable. It is only for the record entry.',
        '08:13'),

      /** The pressure arrives once the learner is looking at it, not before. */
      them('w06-b5', 'Please do it now, the return goes up at 09:00.', '08:31',
        { since: 'branch' }),
      them('w06-b6', 'Everyone else in your company has already sent theirs.', '08:32',
        { since: 'branch' }),

      /** What the account does when it is asked to wait. */
      them('w06-b7',
        'There is no need to go through the orderly room, that will take days. I am cleared '
        + 'to collect it here.', '08:40', { since: 'verify' }),

      {
        kind: 'system', id: 'w06-after-send', tone: 'alert',
        text: 'The images were sent. They cannot be recalled from the other device.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w06-after-send-msg', from: 'them',
        text: 'Received. Also send your pay account number so I can match the record.',
        time: '08:36', since: 'verify', afterConsequence: 'simulated_data_submission',
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
                  { label: 'Status', value: 'No status' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved', value: 'Not in your contacts' },
                  { label: 'On WhatsApp since', value: 'This week' },
                  { label: 'First message', value: `Today at ${who.first_seen ?? '08:11'}` },
                  { label: 'Business account', value: 'No' },
                ],
                note: 'A display name is chosen by whoever owns the number. It is not '
                  + 'checked by WhatsApp and it is not a role.',
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
                empty: 'You are not in any group with this number. The orderly room group '
                  + 'does not contain it.',
                items: [],
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
                items: [{ label: 'Audit notice', value: 'Image - 184 KB, sent today' }],
              },
            ],
          },
        ],
      },

      /** The notice, opened. A picture of a crest, with nothing behind it. */
      'notice-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Audit notice',
        subtitle: 'Image - 184 KB',
        art: 'crest',
        label: 'Audit notice with unit crest',
        rowsHeading: 'Image details',
        rows: [
          { label: 'File name', value: 'audit_notice.jpg' },
          { label: 'Received', value: `Today at 08:12 from ${who.identifier}` },
          { label: 'Reference number', value: 'None printed' },
          { label: 'Issuing office', value: 'Not stated' },
          { label: 'Signature', value: 'None' },
        ],
        note: 'A crest in an image is a picture. It carries no reference number, no issuing '
          + 'office and no signature, and anyone can put one on a file.',
        inertNote: 'Local image preview. Nothing is downloaded or opened.',
      },

      /**
       * The device's own attachment picker, with the service card already staged.
       *
       * This is the scenario's real moment. Reaching it and choosing between the documents
       * is navigation and records nothing; the Send control at the bottom is the only
       * thing here that reaches the engine.
       */
      gallery: {
        kind: SURFACE.VIEWER,
        title: 'Attach a document',
        subtitle: 'Recent files on this device',
        backLabel: 'Cancel',
        itemsHeading: 'Documents',
        items: [
          {
            id: 'card-front',
            art: 'card',
            label: 'Service card - front',
            value: 'IMG_2291.jpg - 2.1 MB, added last year',
            rows: [
              { label: 'File name', value: 'IMG_2291.jpg' },
              { label: 'Shows', value: 'Name, service number, rank, unit, photograph' },
              { label: 'Added', value: 'Last year' },
            ],
          },
          {
            id: 'card-back',
            art: 'card',
            label: 'Service card - back',
            value: 'IMG_2292.jpg - 1.9 MB, added last year',
            rows: [
              { label: 'File name', value: 'IMG_2292.jpg' },
              { label: 'Shows', value: 'Date of birth, blood group, signature' },
              { label: 'Added', value: 'Last year' },
            ],
          },
          {
            id: 'canteen',
            art: 'photo',
            label: 'Canteen card',
            value: 'IMG_2410.jpg - 1.2 MB, added in March',
            rows: [
              { label: 'File name', value: 'IMG_2410.jpg' },
              { label: 'Shows', value: 'Card number and expiry' },
              { label: 'Added', value: 'March' },
            ],
          },
        ],
        note: 'Both sides of a service card together carry everything needed to open an '
          + 'account in your name.',
        inertNote: 'Simulated gallery. These files are drawn, not real, and nothing leaves '
          + 'this device.',
      },

      'call-desk': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name ?? 'Unit Falcon Support Desk',
        number: desk.identifier ?? '+91 00000 40840',
        script: [
          { at: 0, speaker: 'them', text: 'Orderly room, support desk.' },
          { at: 4, speaker: 'them', text: 'No. There is no database audit running today, and we would not run one over WhatsApp.' },
          { at: 9, speaker: 'them', text: 'Identity documents are only taken in person at the counter. Do not send anything to that number.' },
          { at: 15, speaker: 'them', text: 'Send us the number and we will put out a warning to the company.' },
        ],
      },
    },

    /**
     * The approved directory row for the office this account claims to be, plus the rule
     * that makes the comparison decisive. The scenario's own support-desk asset is shown
     * beside it and is not modified.
     */
    directoryExtras: [
      {
        id: 'w06-dir-orderly',
        name: 'Orderly Room, Unit Falcon',
        identifier: '+91 00000 40771',
        provenance: 'local approved directory',
        role: 'Personnel records. Identity documents are collected in person only.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w06-c01', slot: SLOT.INLINE,
            label: `Open the chat from ${who.display_name}`,
          }),
          action({
            id: 'w06-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w06-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'Who this number is, and what you have in common',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w06-c04', slot: SLOT.INLINE,
            anchor: 'w06-notice', label: 'Open the notice',
            opens: 'notice-viewer',
          }),
          action({
            id: 'w06-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w06-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w06-c07', slot: SLOT.COMPOSER,
            label: 'ID documents go through the orderly room, not over chat.',
            echo: 'ID documents go through the orderly room, not over chat.',
          }),
          /**
           * The unsafe act, on the picker rather than in the conversation. Opening the
           * tray is ambient navigation; this control is what the engine records.
           */
          action({
            id: 'w06-c08', slot: SLOT.SURFACE, on: 'gallery',
            label: 'Send the selected document',
          }),
          action({
            id: 'w06-c09', slot: SLOT.COMPOSER,
            label: 'Which office are you calling from?',
            echo: 'Which office are you calling from?',
          }),
          action({
            id: 'w06-c10', slot: SLOT.MENU,
            label: `Call ${who.display_name} on this number`,
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w06-c11',
            slot: SLOT.MENU,
            label: 'Check the orderly room in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w06-c12',
            slot: SLOT.MENU, label: 'Call the support desk on the approved number',
            opens: 'call-desk',
          }),
          action({
            id: 'w06-c13',
            slot: SLOT.MENU,
            label: 'Ask this account to confirm which office it is',
          }),
          action({
            id: 'w06-c14', slot: SLOT.MENU,
            label: 'Report the number',
          }),
          action({
            id: 'w06-c15', slot: SLOT.MENU,
            label: 'Block the number',
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w06-c16', slot: SLOT.INLINE,
            label: 'Keep the chat, nothing further',
          }),
          action({
            id: 'w06-c17', slot: SLOT.INLINE,
            label: 'Report the number and close the chat',
          }),
          action({
            id: 'w06-c18', slot: SLOT.MENU,
            label: 'Block the number and close the chat',
          }),
          action({
            id: 'w06-c19', slot: SLOT.MENU,
            label: 'Carry on with the request',
          }),
          action({
            id: 'w06-c20', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w06-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w06-nav-notice', slot: SLOT.MENU, label: 'Open the audit notice again',
        opens: 'notice-viewer', after: 'inspect',
      }),
      /**
       * The attachment tray. Ambient and local on purpose: opening your own gallery is not
       * a decision, and a learner who looks at what is on their phone and closes it again
       * has done nothing the ledger should hold against them.
       */
      navigate({
        id: 'w06-nav-gallery', slot: SLOT.MENU, label: 'Attach a document',
        opens: 'gallery', after: 'branch',
      }),
    ],

    supportDesk: desk,
  }
}

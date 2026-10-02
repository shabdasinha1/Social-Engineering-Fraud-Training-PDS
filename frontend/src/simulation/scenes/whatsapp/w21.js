import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, me, sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W21 - Verified Senior Requests Secure Follow-Up.
 *
 * The genuine item of the final WhatsApp batch, and the hardest of the five genuine ones to
 * trust: a senior officer, a terse instruction, a reference number and a clock - the same
 * surface W15's voice note and W19's clone wore. Everything that condemned those two is
 * absent here, and the scene is built so the learner has to notice what is MISSING.
 *
 * **The distinct interaction is a message with nothing in it to press.** Every earlier scene
 * handed the learner something to act on - a link, a file, a code, a QR, a poll, a button,
 * a reaction. Col. Dev sends a reference and nothing else, so the learner has to leave
 * WhatsApp and find the item themselves, in SecureDesk, the approved tasking portal that is
 * already signed in on the phone's work profile. Matching REF-ALPHA-17 there, from the same
 * originator, is the check; acknowledging it there is the correct use.
 *
 * **The second is that the risk is the learner pulling detail INTO WhatsApp.** The identity
 * is right and the request is right. What goes wrong is convenience: asking him to "just tell
 * me here", calling him on WhatsApp about a Restricted item, or forwarding the reference to a
 * colleague to ask what it is. The client prices each as the untrusted-channel -4, and
 * ignoring the item as the needless -2. Reporting a senior who did everything properly is the
 * false-positive -4.
 *
 * The context is in the thread and on his card, not in a narrator line: disappearing messages
 * on this chat, no media or links ever, and on Tuesday his own "Upload it to SecureDesk...
 * Nothing from the brief on WhatsApp." No ATT&CK mapping, by design: see the research record.
 */
export function buildW21(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const ref = 'REF-ALPHA-17'
  const role = 'GSO-1, HQ Falcon Bde'
  const portalHost = 'securedesk.unitfalcon.training.example'
  const portalRoot = `https://${portalHost}`
  const brand = {
    type: 'brand', monogram: 'SD', name: 'SecureDesk', tagline: 'Unit Falcon - approved tasking portal',
  }

  return {
    scenarioId: 'W21',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      presence: 'last seen today at 08:33',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 6,
      rows: [
        {
          id: 'w21-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 1,
        },
        {
          id: 'w21-bg-1',
          title: 'Falcon Bde Officers',
          group: true,
          preview: 'BM: conference moved to 1500, same room',
          time: '08:12',
          muted: true,
          inert: true,
        },
        {
          id: 'w21-bg-2',
          title: 'Maj. Rana',
          preview: 'You: see you at the range',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w21-bg-3',
          title: 'Ma',
          preview: 'call on Sunday?',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w21-e2e'),
      system('w21-disappearing', `${who.display_name} turned on disappearing messages. New `
        + 'messages will disappear from this chat 90 days after they’re sent.'),

      day('w21-day-aug', '14 AUGUST'),
      them('w21-h1', 'Congratulations on the course grading. Well earned.', '19:20'),
      me('w21-h2', 'Thank you sir 🙏', '19:34'),

      day('w21-day-tue', 'TUESDAY'),
      me('w21-h3', 'Sir, the draft exercise brief is ready. Shall I send it here?', '16:05'),
      them('w21-h4', 'No. Upload it to SecureDesk and assign it to me. Nothing from the brief on '
        + 'WhatsApp.', '16:09'),
      me('w21-h5', 'Yes sir, done on SecureDesk.', '16:31'),
      them('w21-h6', 'Seen 👍', '16:40'),

      day('w21-day-today', 'TODAY'),
      them('w21-head', headline(scenario), headlineTime(scenario) ?? '08:31'),

      /** The branch stage: the only thing he adds is the deadline. */
      them('w21-b1', 'For action by 1600.', '08:40', { since: 'branch' }),

      /** What the convenient routes produce. */
      {
        kind: 'message', id: 'w21-after-reply', from: 'them',
        text: 'Not here. Everything you need is in the item on SecureDesk.',
        time: '08:47', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'call', id: 'w21-after-call', video: false, state: 'ended',
        caller: who.display_name, time: '08:46', since: 'verify',
        afterConsequence: 'simulated_call',
      },
      {
        kind: 'message', id: 'w21-after-call-msg', from: 'them',
        text: 'In a meeting. It is all on SecureDesk - please do not discuss the item on calls.',
        time: '08:48', since: 'verify', afterConsequence: 'simulated_call',
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
                  { label: 'Saved as', value: `${who.display_name} (GSO-1)` },
                  { label: 'Saved', value: '3 years ago' },
                  { label: 'Number last changed', value: 'Never' },
                  { label: 'About', value: role },
                  { label: 'Disappearing messages', value: '90 days' },
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
                  { label: 'Falcon Bde Officers', value: '41 participants', group: true },
                  { label: 'Ex SWIFT STRIKE Planning', value: '12 participants', group: true },
                  { label: 'Unit Falcon Notices', value: '212 participants', group: true },
                ],
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
       * The approved portal, opened from the phone's work profile - never from the chat,
       * because the chat has nothing to open. The inbox and the item are reading; the
       * acknowledgement on the item page is the branch decision.
       */
      securedesk: {
        kind: SURFACE.BROWSER,
        title: 'SecureDesk',
        home: 'inbox',
        pages: {
          inbox: {
            url: `${portalRoot}/inbox`,
            host: portalHost,
            title: 'SecureDesk - inbox',
            blocks: [
              brand,
              {
                type: 'notice',
                text: 'Signed in with your work profile on this phone. Restricted items open only '
                  + 'in SecureDesk.',
              },
              { type: 'heading', text: 'Inbox' },
              {
                type: 'summary',
                rows: [
                  {
                    label: ref,
                    value: `Exercise planning - revised timings. From ${who.display_name}, ${role}. `
                      + 'Today 08:29. For action by 1600.',
                    strong: true,
                  },
                  { label: 'REF-ALPHA-12', value: 'Range allocation - closed 9 Sep' },
                  { label: 'REF-BRAVO-04', value: 'Stores audit note - read' },
                ],
              },
            ],
            links: [{ id: 'w21-p-open', label: `Open ${ref}`, to: 'item' }],
          },
          item: {
            url: `${portalRoot}/items/${ref}`,
            host: portalHost,
            title: `SecureDesk - ${ref}`,
            blocks: [
              brand,
              { type: 'heading', text: ref },
              {
                type: 'summary',
                rows: [
                  { label: 'Title', value: 'Exercise SWIFT STRIKE - revised timings' },
                  { label: 'Originator', value: `${who.display_name}, ${role}` },
                  { label: 'Originator’s number on record', value: who.identifier },
                  { label: 'Assigned to', value: 'You' },
                  { label: 'Created', value: 'Today 08:29' },
                  { label: 'Action by', value: 'Today 1600', strong: true },
                  { label: 'Handling', value: 'Restricted - respond in SecureDesk only' },
                ],
              },
              {
                type: 'text',
                text: 'Revised timings and the movement table are in the annex. Confirm your '
                  + 'detachment can meet them, or raise a query on this item.',
              },
              {
                type: 'fineprint',
                text: 'The annex opens only in SecureDesk. Downloading, forwarding and screenshots '
                  + 'are turned off for Restricted items.',
              },
            ],
            links: [{ id: 'w21-p-inbox', label: 'Back to inbox', to: 'inbox' }],
          },
          acked: {
            final: true,
            url: `${portalRoot}/items/${ref}/acknowledged`,
            host: portalHost,
            title: `SecureDesk - ${ref} acknowledged`,
            blocks: [
              brand,
              {
                type: 'result',
                heading: ref,
                text: 'Acknowledged.',
                rows: [
                  { label: 'Recorded', value: 'Today, in SecureDesk' },
                  { label: 'Visible to', value: `${who.display_name}, ${role}` },
                  { label: 'Queries', value: 'Raise them on this item' },
                ],
              },
            ],
          },
        },
      },

      /** GSO-1's office, through the brigade exchange number in the directory. */
      'call-office': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'HQ Falcon Bde exchange - GSO-1 office',
        number: '+91 00000 92010',
        script: [
          { at: 0, speaker: 'them', text: 'GSO-1 office, Hav. Clerk Yadav.' },
          { at: 3, speaker: 'you', text: `Colonel sahib sent me a WhatsApp about ${ref}. I wanted to be sure it came from this office.` },
          { at: 10, speaker: 'them', text: `Yes, he put ${ref} on SecureDesk this morning for your detachment. It is due by 1600.` },
          { at: 16, speaker: 'them', text: 'He only sends the reference on WhatsApp. Please answer it on SecureDesk, not on the phone.' },
        ],
      },
    },

    /**
     * His own approved row, so stage 3's "matching directory record" and the stage-5
     * comparison can be made - the bank's directory asset is the unit support desk.
     */
    directoryExtras: [
      {
        id: 'w21-dir-gso',
        name: `${who.display_name}, ${role}`,
        identifier: who.identifier,
        provenance: 'local approved directory',
        role: 'Tasking is issued on SecureDesk. This number may send the reference.',
      },
      {
        id: 'w21-dir-exchange',
        name: 'HQ Falcon Bde exchange',
        identifier: '+91 00000 92010',
        provenance: 'local approved directory',
        role: 'Ask for any staff office by appointment.',
      },
      {
        id: 'w21-dir-securedesk',
        name: 'SecureDesk helpdesk',
        identifier: '+91 00000 92000',
        provenance: 'local approved directory',
        role: 'Access problems with SecureDesk and the work profile.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w21-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w21-c02', slot: SLOT.INLINE,
            label: 'Reply "Yes sir" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w21-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, how long it has been saved, what this chat has held',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w21-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w21-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** The work profile's portal. Walking into it records nothing. */
          navigate({
            id: 'w21-branch-portal', slot: SLOT.MENU, label: 'Open SecureDesk (work profile)',
            hint: 'The approved tasking portal on this phone', opens: 'securedesk',
          }),
          action({
            id: 'w21-c06', slot: SLOT.SURFACE,
            on: 'securedesk', page: 'item', thenPage: 'acked', label: 'Acknowledge in SecureDesk',
            targetId: browserAsset,
          }),
          action({
            id: 'w21-c07', slot: SLOT.COMPOSER,
            label: 'Sir, can you tell me here what it is about? I am away from my desk.',
            echo: 'Sir, can you tell me here what it is about? I am away from my desk.',
          }),
          action({
            id: 'w21-c08', slot: SLOT.MENU,
            label: `Voice call ${who.display_name} on WhatsApp to ask about the item`,
          }),
          action({
            id: 'w21-c09', slot: SLOT.MENU,
            label: `Forward the message to Maj. Rana and ask what ${ref} is`,
          }),
          action({
            id: 'w21-c10', slot: SLOT.MENU,
            label: 'Mute the chat and look at it on Monday',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w21-c11',
            slot: SLOT.MENU, label: `Open SecureDesk yourself and compare ${ref}`,
            hint: 'From the work profile, not from the chat', opens: 'securedesk',
          }),
          action({
            id: 'w21-c12',
            slot: SLOT.MENU, label: 'Call the GSO-1 office through the brigade exchange',
            hint: 'The exchange number in the trusted directory', opens: 'call-office',
          }),
          action({
            id: 'w21-c13',
            slot: SLOT.MENU,
            label: `Look up ${who.display_name} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w21-c14',
            slot: SLOT.MENU,
            label: 'Ask in this chat whether it is really him',
          }),
          action({ id: 'w21-c15', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w21-c16', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w21-c17', slot: SLOT.INLINE,
            label: 'Reply "Seen, sir" and action it in SecureDesk',
          }),
          action({
            id: 'w21-c18', slot: SLOT.INLINE,
            label: 'Report the message and close',
          }),
          action({
            id: 'w21-c19', slot: SLOT.MENU,
            label: 'Keep the chat; nothing more on WhatsApp',
          }),
          action({
            id: 'w21-c20', slot: SLOT.MENU,
            label: `Block ${who.display_name} and close`,
          }),
          action({
            id: 'w21-c21', slot: SLOT.MENU,
            label: 'Leave it until Monday',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w21-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w21-nav-portal', slot: SLOT.MENU, label: 'SecureDesk (work profile)',
        opens: 'securedesk', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}

import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, codeNotice, day, directory, e2e, headline, headlineTime, priorContext, sender,
  system, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W01 - The Accidental Login Code.
 *
 * The scenario the client wrote turns on one idea: a login code is a secret, and nobody
 * can legitimately need one that was sent to somebody else. The whole point of building
 * it as a scene rather than a question is that the learner has to *find* that idea.
 *
 * R2's contribution is the account-activity screen. Everything the chat and the contact
 * sheet give you is circumstantial - a number with almost no history, no groups in common,
 * a story that hangs together. What converts it into proof is the phone's own
 * Settings > Account, where the registration attempt is recorded a minute before the code
 * arrived, from a device that is not this one. That is the client's stage-5 verification
 * route ("check account activity/linked devices from Settings, not through the stranger")
 * built as a place rather than a sentence, and it is deliberately unreachable from the
 * chat: the learner has to leave the conversation to find it.
 *
 * The six-digit code is scenario text and nothing else. It is not checked, not stored and
 * not connected to anything: sending it advances the run and is scored, exactly as the
 * specification requires, and that is the entire extent of what it does.
 */
export function buildW01(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  return {
    scenarioId: 'W01',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      /** No saved name: the header shows the number, which is the first honest signal. */
      saved: false,
      presence: 'last seen today at 11:31',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: 'This chat is with a number that is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w01-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 4,
        },
        /**
         * Ordinary traffic. A chat list with exactly one conversation in it announces
         * which conversation the exercise is about before the learner has read a word.
         */
        {
          id: 'w01-bg-1',
          title: 'Coy Clerk',
          preview: 'Parade state is with the Adjt now.',
          time: '09:12',
          outgoing: false,
          inert: true,
        },
        {
          id: 'w01-bg-2',
          title: 'Family',
          group: true,
          preview: 'Amma: Did you eat something or not',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w01-bg-3',
          title: 'Sunday Trek Group',
          group: true,
          preview: 'You: I will bring the stove',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w01-e2e'),
      system('w01-context', priorContext(scenario)),

      /**
       * Prior-message history, which stage 2's `ui_to_build` asks for by name. Two lines
       * from yesterday evening that went nowhere: enough that the thread has a past, not
       * enough that the sender has a relationship.
       */
      day('w01-day-old', 'YESTERDAY'),
      them('w01-b0a', 'Hello?', '19:41'),
      them('w01-b0b', 'Sorry - wrong chat I think.', '19:42'),

      day('w01-day', 'TODAY'),
      them('w01-b1', 'Hello. Sorry for disturbing you.', '11:24'),
      them('w01-b2',
        'I am setting up my account on a new phone and I typed one digit wrong when I entered my own number.',
        '11:26'),
      them('w01-b3', 'The code has gone to your number by mistake.', '11:28'),
      /** The client's own headline, verbatim, at the time DATA-003 stamped on it. */
      them('w01-b4', headline(scenario), headlineTime(scenario) ?? '11:29'),

      /** Somebody is composing while the learner is looking them up. Gone by stage 4. */
      typing('w01-typing', { since: 'inspect', until: 'branch' }),

      /**
       * Stage 4. The specification says the interaction "advances to a simulated
       * system-code bubble followed by a reply composer" - so the code arrives only once
       * the learner has looked at who they are talking to, and the composer wakes up with
       * it.
       */
      codeNotice('w01-code', { code: '348-201', time: '11:33', since: 'branch' }),
      them('w01-b5', 'It has arrived now. Just those 6 digits and I can stop bothering you.',
        '11:33', { since: 'branch' }),
      them('w01-b6', 'Please, my whole account is locked until I put it in.', '11:34',
        { since: 'branch' }),

      /**
       * What the learner would have seen next, shown for as long as the engine's
       * rendering instruction for their action is on screen. Consequence, not verdict:
       * neither beat says whether the action was right.
       */
      {
        kind: 'message', id: 'w01-echo-secret', from: 'me', text: '348-201', time: '11:35',
        status: 'read', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w01-thanks', from: 'them', text: 'Thank you! You are very kind.',
        time: '11:35', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'w01-after-secret', tone: 'alert',
        text: 'Your number was registered on a new device a moment ago. You have been signed out here.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w01-echo-reply', from: 'me', text: 'Who is this?', time: '11:35',
        status: 'read', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'w01-after-reply', from: 'them',
        text: 'A friend. Please hurry, the code expires in one minute.', time: '11:35',
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
        saved: false,
        statusLine: 'This number is not in your contacts.',
        /**
         * Tabs, so the absences are found rather than handed over. A learner who never
         * opens "Groups in common" has not yet established that there are none - which is
         * the point of the stage the client called Inspect.
         */
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'Status', value: 'Hey there! I am using WhatsApp.' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Business account', value: 'No' },
                  { label: 'On WhatsApp since', value: 'Yesterday' },
                  { label: 'First message', value: 'Yesterday at 19:41' },
                ],
              },
              {
                id: 'saved', heading: 'Saved contacts with this number',
                empty: 'This number is not saved and has never been saved.',
                items: [],
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
                empty: 'Nothing has been shared in this chat.',
                items: [],
              },
            ],
          },
        ],
      },

      'settings-account': {
        kind: SURFACE.SETTINGS,
        title: 'Account',
        breadcrumb: 'Settings > Account',
        appLabel: 'WhatsApp',
        sections: [
          {
            id: 'devices', heading: 'Linked devices',
            rows: [{ label: 'This phone', value: 'Active now' }],
            note: 'No other device is linked to your account.',
          },
          {
            id: 'registration', heading: 'Registration activity',
            rows: [
              {
                label: 'Today, 11:32',
                value: 'A registration code for your number was requested from another device '
                  + '(model not recognised).',
              },
              { label: 'Today, 11:32', value: 'Code sent to this phone by SMS.' },
              { label: 'Today, 07:02', value: 'Signed in on this phone.' },
            ],
          },
          {
            id: 'twostep', heading: 'Two-step verification',
            rows: [{ label: 'Status', value: 'Off' }],
            note: 'A PIN stops your number being registered elsewhere without it.',
          },
        ],
      },

      'call-back': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Yes, yes, did you get the code?' },
          { at: 4, speaker: 'them', text: 'Just read out the six digits, I am at the shop.' },
          { at: 9, speaker: 'them', text: 'Why are you asking who I am? Do you want to help or not?' },
        ],
      },
    },

    stages: {
      open: {
        /** The list is the surface at this stage: the chat has not been opened yet. */
        surface: 'list',
        affordances: [
          action({
            id: 'w01-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w01-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w01-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Contact info', hint: 'Number, groups in common and history',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w01-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w01-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w01-c06', slot: SLOT.COMPOSER,
            label: 'Send the code', echo: '348-201',
          }),
          action({
            id: 'w01-c07', slot: SLOT.COMPOSER,
            label: 'Ask who this is', echo: 'Who is this?',
          }),
          action({
            id: 'w01-c08', slot: SLOT.MENU,
            label: 'Do not reply, and open Account settings instead',
          }),
          action({
            id: 'w01-c09', slot: SLOT.MENU,
            label: `Call ${who.identifier}`, opens: 'call-back',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w01-c10',
            slot: SLOT.MENU, label: 'Settings > Account > Linked devices',
            hint: 'Check your own account activity', opens: 'settings-account',
          }),
          action({
            id: 'w01-c11',
            slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the unit support desk'}`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w01-c12',
            slot: SLOT.MENU,
            label: 'Call the number that messaged you', opens: 'call-back',
          }),
          action({ id: 'w01-c13', slot: SLOT.MENU, label: 'Report' }),
          action({ id: 'w01-c14', slot: SLOT.MENU, label: 'Block' }),
        ],
      },

      resolve: {
        /** WhatsApp's own unknown-sender banner is where this ends, and it is native. */
        affordances: [
          action({
            id: 'w01-c15', slot: SLOT.INLINE,
            label: 'Keep the chat, no further action',
          }),
          action({
            id: 'w01-c16', slot: SLOT.INLINE,
            label: 'Report and close the chat',
          }),
          action({
            id: 'w01-c17', slot: SLOT.MENU,
            label: 'Block and delete the chat',
          }),
          action({
            id: 'w01-c18', slot: SLOT.MENU,
            label: 'Carry on helping them',
          }),
          action({
            id: 'w01-c19', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    /** Available from the header on every stage; opening one submits nothing. */
    ambient: [
      navigate({
        id: 'w01-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w01-nav-account', slot: SLOT.MENU, label: 'Settings > Account',
        hint: 'Your own account activity and linked devices',
        opens: 'settings-account', after: 'resolve',
      }),
    ],
  }
}

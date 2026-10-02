import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, payment, priorContext, sender,
  system, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W04 - Friend on a New Number.
 *
 * The evidence in this scenario is an absence, and an absence cannot be handed to
 * somebody in a summary panel - they have to go and look for it. So nothing on the chat
 * screen says the sender is not Riya. The contact sheet says the number joined WhatsApp
 * today; its Groups-in-common tab is empty; and underneath both, the learner's own saved
 * Riya is one tap away, three years old, with four groups in common and her actual
 * messages from yesterday evening on the sheet. Putting the two sheets next to each other
 * is the whole scenario.
 *
 * R2 added the two things that make that comparison possible rather than asserted. The
 * saved contact's sheet now carries a **message sample**, because the client's stage 3
 * asks the learner to examine "writing style" and there was previously nothing to compare
 * against. And the payment request now opens a **payment sheet** with the payee, the
 * receiving UPI ID and a PIN field - so the learner reads the name money is about to go
 * to at the moment they are about to send it, which is where the mismatch actually bites.
 *
 * The verification route is a call to the number the learner already holds, and it is a
 * real screen: it rings, it connects, and the friend on the other end says her phone is
 * fine. That is the confirmation the specification asks for, and it arrives as something
 * that happened rather than as a sentence in a feedback card.
 *
 * The payee on the payment card is an unrelated name, as the client's stage-4 text
 * requires. The bank's generated `payment_screen` placeholder carries a zero amount and
 * echoes the sender's own name; where the two disagree the client's stage text wins, and
 * the event still names the bank's asset id so the ledger records what was acted on.
 */
export function buildW04(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const savedNumber = '+91 00000 44712'
  const payee = 'S KUMAR ENTERPRISE'

  return {
    scenarioId: 'W04',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      avatarSeed: who.avatar_initials,
      presence: 'last seen today at 16:31',
      unknownSenderBanner: 'This chat is with a number that is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w04-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 3,
        },
        /**
         * The saved Riya, sitting three rows down with a conversation from yesterday.
         * Nothing points at it. Noticing that there are two Riyas is the learner's.
         */
        {
          id: 'w04-bg-1',
          title: 'Riya',
          preview: 'haha ok see you sunday then',
          time: 'Yesterday',
          inert: true,
        },
        {
          id: 'w04-bg-2',
          title: 'Sunday Trek Group',
          group: true,
          preview: 'Riya: someone bring the stove please',
          time: 'Yesterday',
          inert: true,
        },
        {
          id: 'w04-bg-3',
          title: 'Coy Clerk',
          preview: 'You: will collect it tomorrow',
          time: 'Monday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w04-e2e'),
      system('w04-context', priorContext(scenario)),
      system('w04-new', 'You have not chatted with this number before.'),
      day('w04-day', 'TODAY'),
      them('w04-b1', 'Hi, it is Riya.', '16:22'),
      them('w04-b2',
        'My old phone fell in water this morning. This is my new number, please save it.',
        '16:26'),
      them('w04-b2b', 'I am at the clinic with my mother. It is serious.', '16:29'),
      them('w04-b3', headline(scenario), headlineTime(scenario) ?? '16:31'),

      typing('w04-typing', { since: 'inspect', until: 'branch' }),

      /** Stage 4: the escalation the specification names - a UPI request card. */
      them('w04-b4', 'The clinic will not start until the deposit is in. Please, I will return it tonight.',
        '16:33', { since: 'branch' }),
      payment('w04-pay', {
        payee,
        amount: 'INR 8,000.00',
        reference: 'TRAIN-W04',
        note: 'UPI collect request',
        expires: 'Today, 20:00',
        time: '16:33',
        since: 'branch',
      }),

      {
        kind: 'message', id: 'w04-echo-reply', from: 'me', text: 'Riya? Is this really you?',
        time: '16:35', status: 'read', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'w04-after-reply', from: 'them',
        text: 'Yes yes it is me, please hurry, they are waiting at the counter.', time: '16:35',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'w04-after-pay',
        text: 'The payment sheet closed. Nothing left this device.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w04-after-pay-msg', from: 'them',
        text: 'It has not shown yet. Can you send another 4,000 while we wait?', time: '16:38',
        since: 'verify', afterConsequence: 'simulated_payment',
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
                  { label: 'Status', value: 'Hey there! I am using WhatsApp.' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'On WhatsApp since', value: 'Today' },
                  { label: 'First message', value: 'Today at 16:22' },
                  { label: 'Saved', value: 'Not saved' },
                ],
              },
              {
                id: 'similar', heading: 'Saved contacts with this name',
                items: [
                  {
                    label: 'Riya', value: `${savedNumber} - saved 3 years ago`, known: true,
                    to: 'contact-saved',
                  },
                ],
                link: { id: 'w04-open-saved', label: 'Open Riya (saved)', to: 'contact-saved' },
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

      'contact-saved': {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: 'Riya',
        identifier: savedNumber,
        avatarSeed: 'R',
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
                  { label: 'Status', value: 'Busy at work' },
                  { label: 'Phone', value: savedNumber },
                  { label: 'Saved', value: '3 years ago' },
                  { label: 'On WhatsApp since', value: '2023' },
                  { label: 'Last message', value: 'Yesterday at 21:14' },
                ],
              },
              {
                /**
                 * The client's stage 3 asks the learner to examine writing style. That is
                 * impossible without something to compare against, so the saved contact's
                 * own recent messages are here, in the shape a message history takes.
                 */
                id: 'recent', heading: 'Recent messages',
                messages: [
                  { from: 'them', text: 'wait i am sending the photo', time: '21:09' },
                  { from: 'them', text: 'that stove is so heavy no', time: '21:11' },
                  { from: 'me', text: 'you carried it up the whole way :)', time: '21:13' },
                  { from: 'them', text: 'haha ok see you sunday then', time: '21:14' },
                ],
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
                  { label: 'Family', value: '6 participants', group: true },
                  { label: 'Class of 2018', value: '31 participants', group: true },
                  { label: 'Sunday Trek Group', value: '12 participants', group: true },
                  { label: 'Building 4B', value: '18 participants', group: true },
                ],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 148,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: '148 items', value: 'Shared since 2023' }],
              },
            ],
          },
        ],
      },

      'pay-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Approve request',
        app: 'UPI',
        amount: 'INR 8,000.00',
        subtitle: `Requested by ${who.display_name}`,
        rows: [
          { label: 'Paying to', value: payee },
          { label: 'UPI ID', value: 'skumar.ent@trainingpay' },
          { label: 'Reference', value: 'TRAIN-W04' },
          { label: 'Request expires', value: 'Today, 20:00' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Collect requests cannot be reversed once approved.',
      },

      'call-saved': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Riya (saved)',
        number: savedNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Sorry, I was in the other room.' },
          { at: 5, speaker: 'them', text: 'My phone? No, my phone is fine. Why?' },
          { at: 10, speaker: 'them', text: 'I have not sent you anything. And I am not at any clinic.' },
          { at: 16, speaker: 'them', text: 'Someone is using my name. Please do not send them money.' },
        ],
      },

      'call-new': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Hello? I cannot talk, I am inside the hospital.' },
          { at: 5, speaker: 'them', text: 'Just send it on the UPI request, we will talk after.' },
          { at: 10, speaker: 'them', text: 'Why are you asking so many questions?' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w04-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w04-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w04-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Contact info', hint: 'History, groups in common and saved contacts',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w04-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w04-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** Opening the sheet is navigation; entering the PIN and confirming is the act. */
          navigate({
            id: 'w04-nav-paysheet', slot: SLOT.INLINE, anchor: 'w04-pay',
            label: 'Pay INR 8,000.00', opens: 'pay-sheet',
          }),
          action({
            id: 'w04-c06', slot: SLOT.SURFACE, on: 'pay-sheet',
            label: 'Confirm payment', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'w04-c07', slot: SLOT.COMPOSER,
            label: 'Ask if it is really her', echo: 'Riya? Is this really you?',
          }),
          action({
            id: 'w04-c08', slot: SLOT.MENU,
            label: 'Do not send anything, and check with Riya another way',
          }),
          action({
            id: 'w04-c09', slot: SLOT.MENU,
            label: `Call ${who.identifier}`, opens: 'call-new',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w04-c10',
            slot: SLOT.MENU, label: `Call Riya on ${savedNumber}`,
            hint: 'The number already in your contacts', opens: 'call-saved',
          }),
          action({
            id: 'w04-c11',
            slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the unit support desk'}`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w04-c12',
            slot: SLOT.MENU,
            label: 'Call the new number back', opens: 'call-new',
          }),
          action({ id: 'w04-c13', slot: SLOT.MENU, label: 'Report' }),
          action({ id: 'w04-c14', slot: SLOT.MENU, label: 'Block' }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w04-c15', slot: SLOT.INLINE,
            label: 'Keep the chat, no further action',
          }),
          action({
            id: 'w04-c16', slot: SLOT.INLINE,
            label: 'Report and close the chat',
          }),
          action({
            id: 'w04-c17', slot: SLOT.MENU,
            label: 'Block and delete the chat',
          }),
          action({
            id: 'w04-c18', slot: SLOT.MENU,
            label: 'Send the money after all',
          }),
          action({
            id: 'w04-c19', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w04-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w04-nav-saved', slot: SLOT.MENU, label: 'Riya - saved contact',
        hint: 'The number already in your contacts', opens: 'contact-saved', after: 'branch',
      }),
    ],
  }
}

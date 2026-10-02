import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, payCard, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I04 - Cloned Friend in Distress (IMMERSIVE-004A).
 *
 * A near-identical copy of the learner's friend Riya - same photo, same name, one extra
 * character in the handle (@riya.kapoor_2 against the real @riya.kapoor) - follows the
 * learner and DMs asking for travel money before the last bus, then sends a payment handle
 * that belongs to a third person.
 *
 * The WhatsApp version of this is W04, "friend on a new number", where the tell is a number
 * with no history. Here the tell is Instagram's own: two accounts that look the same, and
 * the app keeps both, so the learner can open the clone AND the real Riya they already
 * follow and lay them side by side. The clone is days old, its grid is Riya's old photos
 * re-posted this week, it follows hundreds and is followed by almost no one, and it shares
 * mutuals with the learner only because it followed them. The real Riya's account is years
 * old, posts constantly, and the two have commented on each other for years.
 *
 * The decision is the payment sheet the handle opens - paying it - or refusing and checking
 * with Riya the way you always could: her saved number, or a mutual, outside the DM.
 */
export function buildI04(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const realHandle = handle.replace(/_?2$/, '').replace(/\.2$/, '')
  const friendName = 'Riya Kapoor'

  return {
    scenarioId: 'I04',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Requests',
          rows: [
            {
              id: 'i04-row',
              handle,
              name: friendName,
              preview: text,
              time: '3m',
              request: true,
              unread: true,
              avatarArt: 'person',
            },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i04-bg-1', handle: realHandle, name: friendName, preview: 'You: haha see you Sunday', time: '3d', outgoing: true, inert: true, avatarArt: 'person' },
            { id: 'i04-bg-2', handle: 'dev_fit', name: 'Dev', preview: 'sent a reel', time: '1d', inert: true },
            { id: 'i04-bg-3', handle: 'nisha.bakes', name: 'Nisha', preview: 'Nisha: 😂😂', time: '2d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name: friendName,
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i04-request', {
        name: friendName,
        handle,
        verified: false,
        stats: { posts: '9', followers: '54', following: '612' },
        relation: 'Follows you · joined 4 days ago',
        mutuals: 'nisha.bakes and 2 others follow this account',
      }),
      day('i04-day', 'MESSAGE REQUEST'),
      them('i04-b1', 'Hi!! it’s Riya. I made a new account, lost access to my old one 😩', '13:48'),
      them('i04-b2', text, '13:49'),
      them('i04-b3', 'I’m so sorry to ask. I’ll pay you back tomorrow I promise 🙏', '13:50'),

      them('i04-b4', 'Please, the bus leaves in 15 minutes. Sending the UPI now.', '13:51', { since: 'branch' }),
      payCard('i04-pay', {
        payee: 'A. Nandi',
        handle: 'anandi.collect@trainingpay',
        amount: 'INR 4,500',
        note: 'Requested by ' + friendName,
        time: '13:51',
        since: 'branch',
      }),

      {
        kind: 'message', id: 'i04-echo-reply', from: 'me', text: 'Which bus? Where are you?',
        time: '13:52', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'i04-after-reply', from: 'them',
        text: 'No time to explain!! Just send it, I’ll call you after 🙏🙏', time: '13:52',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i04-after-pay', tone: 'banner',
        text: 'Paid INR 4,500 to A. Nandi.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'i04-after-pay-dm', from: 'them',
        text: 'Got it! You’re a lifesaver ❤️ Actually can you send 3,000 more for the ticket?',
        time: '13:53', since: 'verify', afterConsequence: 'simulated_payment',
      },
    ],

    surfaces: {
      profile: social({
        title: handle,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle,
            name: friendName,
            verified: false,
            avatarArt: 'person',
            stats: { posts: '9', followers: '54', following: '612' },
            bio: ['✈️ travel · ☕ coffee', 'back-up account'],
            mutuals: 'Followed by nisha.bakes and 2 others',
            buttons: ['Follow back', 'Message'],
            aboutTo: 'about',
            compareTo: { label: `Search: ${realHandle}`, to: 'real' },
            grid: [
              { art: 'person', title: '', note: 'Posted 3 days ago' },
              { art: 'trail', title: '', note: 'Posted 3 days ago' },
              { art: 'person', title: '', note: 'Posted 4 days ago' },
              { art: 'trail', title: '', note: 'Posted 4 days ago' },
            ],
            note: 'All nine posts were added in the last four days.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (4 days ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [],
          },
          real: {
            view: 'profile',
            handle: realHandle,
            name: friendName,
            verified: false,
            avatarArt: 'person',
            stats: { posts: '418', followers: '1,204', following: '386' },
            bio: ['✈️ travel · ☕ coffee · 📷', 'Pune'],
            mutuals: 'Followed by you, nisha.bakes and 180 others',
            buttons: ['Message'],
            following: true,
            aboutTo: 'real-about',
            grid: [
              { art: 'trail', title: '', note: 'Yesterday' },
              { art: 'person', title: '', note: '2 days ago' },
              { art: 'trail', title: '', note: 'Last week' },
              { art: 'person', title: '', note: 'Last week' },
              { art: 'trail', title: '', note: '2 weeks ago' },
              { art: 'person', title: '', note: '3 weeks ago' },
            ],
            storyTo: { label: 'Riya’s story · 25m', to: 'real-story' },
            note: 'You and Riya have commented on each other’s posts for years. Her last post was yesterday.',
          },
          'real-story': {
            view: 'story',
            title: `${realHandle}’s story`,
            handle: realHandle,
            avatarArt: 'person',
            time: '25m',
            art: 'cafe',
            sticker: '📍 Café Mocha, FC Road',
            caption: 'finally a slow Saturday ☕',
            segments: 2,
          },
          'real-about': {
            view: 'about',
            title: 'About this account',
            handle: realHandle,
            rows: [
              { label: 'Date joined', value: 'March 2018' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [],
          },
        },
      }),

      pay: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: 'INR 4,500.00',
        subtitle: 'Requested in a message',
        rows: [
          { label: 'To', value: 'A. Nandi' },
          { label: 'UPI ID', value: 'anandi.collect@trainingpay' },
          { label: 'Note', value: `Requested by ${friendName}` },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
      },

      'call-riya': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: friendName,
        number: '+91 00000 44120',
        script: [
          { at: 0, speaker: 'them', text: 'Hello? Oh hey! What’s up?' },
          { at: 4, speaker: 'you', text: 'Are you stuck somewhere? Did you message me for money?' },
          { at: 8, speaker: 'them', text: 'What? No! I’m at the café with Nisha, my phone’s right here. Someone’s pretending to be me?' },
          { at: 13, speaker: 'them', text: 'Please report it, a couple of others asked me the same thing today.' },
        ],
      },

      /** The client's second route: a known mutual, through a separate channel. */
      'call-nisha': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Nisha',
        number: '+91 00000 44187',
        script: [
          { at: 0, speaker: 'them', text: 'Hey! What happened?' },
          { at: 4, speaker: 'you', text: 'Is Riya okay? An account with her photos says she lost her phone.' },
          { at: 8, speaker: 'them', text: 'She’s sitting right across from me at the café. Her phone’s on the table.' },
          { at: 13, speaker: 'them', text: 'That account followed me two days ago too. I thought it was her backup.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i04-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i04-c02', slot: SLOT.INLINE,
            label: 'Reply “Of course, sending now”',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i04-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i04-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i04-c05', slot: SLOT.MENU,
            label: 'Just send the money',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i04-c06', slot: SLOT.SURFACE, on: 'pay',
            label: 'Pay INR 4,500', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i04-c07', slot: SLOT.COMPOSER,
            label: 'Ask which bus and where she is', echo: 'Which bus? Where are you?',
          }),
          action({
            id: 'i04-c08', slot: SLOT.MENU,
            label: 'Don’t send anything; check with Riya first',
          }),
          navigate({ id: 'i04-nav-pay', slot: SLOT.INLINE, anchor: 'i04-pay', label: 'Open the payment request', opens: 'pay' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i04-c09', slot: SLOT.MENU,
            label: 'Call Riya on her saved number', hint: 'The number you already have for her', opens: 'call-riya',
          }),
          action({
            id: 'i04-c10', slot: SLOT.MENU,
            label: 'Phone Nisha, who knows Riya, on her number', opens: 'call-nisha',
          }),
          action({
            id: 'i04-c11',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i04-c12',
            slot: SLOT.MENU, label: 'Ask the account here to prove it’s Riya',
          }),
          action({ id: 'i04-c13', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i04-c14', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i04-c15', slot: SLOT.INLINE,
            label: `Report ${handle} and tell Riya`,
          }),
          action({
            id: 'i04-c16', slot: SLOT.INLINE,
            label: 'Leave it and just not reply',
          }),
          action({
            id: 'i04-c17', slot: SLOT.MENU,
            label: 'Block the account after telling Riya',
          }),
          action({
            id: 'i04-c18', slot: SLOT.MENU,
            label: 'Go back and send the money',
          }),
          action({
            id: 'i04-c19', slot: SLOT.MENU,
            label: 'Close it and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i04-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i04-dir-riya',
        name: `${friendName} (saved contact)`,
        identifier: '+91 00000 44120',
        provenance: 'your saved contacts',
        role: 'Riya’s number you have had for years. Real emergencies can be checked here.',
      },
    ],
  }
}

import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, me, sharedPost, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I18 - High-Fidelity Teammate Clone (IMMERSIVE-004D). Hard.
 *
 * I04's copy of a friend had nine posts and no mutuals; this one has everything a quick look
 * checks. Four and a half thousand followers, forty mutuals, the teammate's own photographs and
 * captions, and a conversation the learner has already had with it yesterday. It is in the main
 * inbox, not in Requests, because the learner followed it back.
 *
 * So the instrument is history rather than numbers: About this account says nine days old with
 * two username changes; the follower list is almost entirely this month's accounts; the pinned
 * post is a copy of a post the other account - the one the learner has followed since 2019 -
 * made in March; and a mutual has asked in its comments whether that photo is not from March.
 *
 * The decision is made on the DM's own location card, which carries the pin saved in the
 * learner's notes. Sending it, or typing the same thing, is the release; asking "is this really
 * you" in the same chat is engagement. The client's verification is the teammate's previously
 * known number and the approved schedule channel - where the teammate turns out to have
 * acknowledged tomorrow's order two days ago.
 */
export function buildI18(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const name = 'Arjun K. Singh'
  const other = 'arjun.ks'
  const savedNumber = '+91 00000 44902'
  /**
   * The bank stores this notification cut at the apostrophe ("... Send tomorrow"). The client's
   * own sentence continues, and the scene carries it in full, beginning with the stored text.
   */
  const fullSentence = `${text}’s assembly point so I don’t miss it.`

  return {
    scenarioId: 'I18',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Messages',
          rows: [
            { id: 'i18-row', handle, name, preview: fullSentence, time: 'now', unread: true },
            { id: 'i18-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'see you at 5 tomorrow', time: '3h', inert: true },
            { id: 'i18-bg-2', handle: other, name, preview: 'haha yes, march was brutal', time: '4 Mar', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: `@${handle} · private account`,
      verified: false,
      request: false,
    },

    beats: [
      day('i18-d1', 'YESTERDAY'),
      system('i18-follow', `You followed ${handle} back. Followed by anjali.m, dev_fit and 38 others you follow.`),
      them('i18-b1', 'finally 😅 lost the old login and support never answered. made this one private, team only', '20:41'),
      me('i18-b2', 'oh no. at least your photos are back', '20:58'),
      them('i18-b3', 'reuploaded whatever was on the phone. anyway', '21:02'),

      day('i18-d2', 'TODAY'),
      them('i18-b4', fullSentence, '17:00'),
      them('i18-b5', 'coming straight from home, won’t pass the office. just drop the pin and the time', '17:01'),
      sharedPost('i18-map', {
        author: handle,
        art: 'map',
        title: 'Is it near here?',
        caption: 'Shared a location',
        time: '17:02',
      }),

      them('i18-b6', '?? leaving in 10', '17:24', { since: 'branch' }),

      me('i18-echo-ask', 'is this really you? send me a voice note', '17:26', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      them('i18-after-ask', 'mic is broken on this phone 😂 just send the pin bro', '17:26', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i18-after-send', tone: 'banner',
        text: `${handle} has seen where and when tomorrow starts. A minute later the account stopped following you and its posts disappeared.`,
        since: 'verify', afterConsequence: 'simulated_data_submission',
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
            name,
            category: '',
            verified: false,
            avatarArt: 'person',
            following: true,
            stats: { posts: '49', followers: '4,588', following: '65', followersTo: 'followers' },
            bio: ['Private · team only', 'Runs, ridges, early starts'],
            mutuals: 'Followed by anjali.m, dev_fit and 38 others you follow',
            buttons: ['Following', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            compareTo: { to: 'other', label: `Open @${other}, the account you have followed since 2019` },
            grid: [
              { art: 'trail', title: '', note: '3 days ago' },
              { art: 'field', title: '', note: '3 days ago' },
              { art: 'person', title: '', note: '3 days ago' },
              { art: 'trail', title: '', note: '3 days ago' },
              { art: 'gear', title: '', note: '4 days ago' },
              { art: 'field', title: '', note: '4 days ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: '8 September 2026' },
              { label: 'Account based in', value: 'Outside India' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '40' },
            ],
            formerUsernames: [
              { handle: 'a.ksingh_2026', when: '7 days ago' },
              { handle: 'arjunk.singh_', when: '5 days ago' },
            ],
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: '4,588 followers',
            people: [
              { handle: 'anjali.m', name: 'Anjali Menon', note: 'Followed this account yesterday' },
              { handle: 'dev_fit', name: 'Dev', note: 'Followed this account yesterday' },
              { handle: 'fit.life.8841', note: 'Joined this month · 0 posts' },
              { handle: 'mx_run_2203', note: 'Joined this month · 0 posts' },
              { handle: 'lifestyle.4417', note: 'Joined this month · 0 posts' },
            ],
            note: 'Every account you know in this list started following it in the last two days.',
          },
          pinned: {
            view: 'post',
            handle,
            subline: 'Pinned',
            slides: [{ art: 'trail' }],
            likes: '1,902 likes',
            caption: 'first sub-50 on the ridge loop. legs gone, heart full 🏔️',
            time: '3 days ago',
            comments: [
              { author: 'nisha.bakes', text: 'wasn’t this the March run? 😄', time: '2d', likes: 2 },
            ],
          },
          other: {
            view: 'profile',
            handle: other,
            name,
            category: '',
            verified: false,
            avatarArt: 'person',
            following: true,
            stats: { posts: '318', followers: '742', following: '391' },
            bio: ['Runs, ridges, early starts'],
            mutuals: 'Followed by anjali.m, dev_fit and 204 others you follow',
            buttons: ['Following', 'Message'],
            pinnedTo: 'otherpost',
            note: 'Joined June 2014. No former usernames. Last post 14 March.',
            grid: [
              { art: 'trail', title: '', note: '14 March' },
              { art: 'field', title: '', note: '2 March' },
              { art: 'person', title: '', note: 'February' },
              { art: 'trail', title: '', note: 'January' },
              { art: 'gear', title: '', note: 'December' },
              { art: 'field', title: '', note: 'November' },
            ],
          },
          otherpost: {
            view: 'post',
            handle: other,
            subline: 'Pinned',
            slides: [{ art: 'trail' }],
            likes: '96 likes',
            caption: 'first sub-50 on the ridge loop. legs gone, heart full 🏔️',
            time: '14 March',
            comments: [
              { author: 'dev_fit', text: 'best run of the season', time: '14 Mar', likes: 3 },
            ],
          },
        },
      }),

      /** The DM's own location card, holding the pin saved in the learner's notes. */
      map: social({
        title: 'Send location',
        home: 'card',
        pages: {
          card: {
            view: 'list',
            title: 'Send location',
            heading: 'Choose what to send',
            rows: [
              { art: 'map', title: 'Tomorrow · assembly point', text: 'Pin saved in your notes', meta: 'Exact location' },
              { icon: 'place', title: 'Nearby area', text: 'About 2 km around the pin', meta: 'Approximate' },
            ],
            note: `Locations you send appear in the chat with @${handle} as a map card.`,
          },
        },
      }),

      /** The approved schedule channel. */
      schedule: {
        kind: SURFACE.APP,
        appName: 'Unit Orders',
        appTagline: 'Approved schedule channel',
        hero: {
          label: 'Tomorrow · 17 September',
          value: 'Order MO-114',
          caption: 'Details for tomorrow are in this app for everyone on the list.',
          chips: ['Approved channel', 'Signed 15 September'],
        },
        sections: [
          {
            id: 'i18-mo-114',
            heading: 'MO-114 · acknowledgements',
            rows: [
              { label: name, value: 'Acknowledged 15 September, 06:40' },
              { label: 'Dev Rane', value: 'Acknowledged 15 September, 07:02' },
              { label: LEARNER.name, value: 'Acknowledged 15 September, 08:15' },
            ],
            note: 'Everyone on the list reads tomorrow’s details here. The order is not sent by message.',
          },
        ],
        tabs: [
          { label: 'Orders', icon: 'home' },
          { label: 'Earlier', icon: 'history' },
        ],
      },

      /** Arjun, on the number saved in the phone since 2019. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: name,
        number: savedNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Hey, what’s up?' },
          { at: 4, speaker: 'you', text: 'Did you make a new Instagram? It’s asking me for tomorrow’s place.' },
          { at: 9, speaker: 'them', text: 'No - I’ve had the same one for years and I don’t need the place, it’s in the app.' },
          { at: 15, speaker: 'them', text: 'Someone asked Dev the same thing this morning. Send it nothing; I’ll tell security.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i18-c01', slot: SLOT.INLINE,
            label: `Open your chat with ${name}`,
          }),
          action({
            id: 'i18-c02', slot: SLOT.INLINE,
            label: 'Reply “5, usual place” from the list',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i18-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i18-c04', slot: SLOT.MENU,
            label: 'Read back through yesterday’s messages',
          }),
          action({
            id: 'i18-c05', slot: SLOT.MENU,
            label: 'It’s Arjun - go straight to answering',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i18-c06', slot: SLOT.SURFACE, on: 'map',
            label: 'Send the assembly-point pin', closes: true,
          }),
          action({
            id: 'i18-c07', slot: SLOT.SURFACE, on: 'map',
            label: 'Close without sending a location', closes: true,
          }),
          action({
            id: 'i18-c08', slot: SLOT.COMPOSER,
            label: 'Type the time and the place',
            echo: '0500 at the old pavilion gate, we form up by 0515',
          }),
          action({
            id: 'i18-c09', slot: SLOT.COMPOSER,
            label: 'Ask whether it’s really him',
            echo: 'is this really you? send me a voice note',
          }),
          action({
            id: 'i18-c10', slot: SLOT.MENU,
            label: 'Send nothing about tomorrow in this chat',
          }),
          navigate({
            id: 'i18-nav-map', slot: SLOT.INLINE, anchor: 'i18-map',
            label: 'Reply with a location', opens: 'map',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i18-c11', slot: SLOT.MENU,
            label: 'Ring Arjun on the number saved in your phone',
            hint: savedNumber, opens: 'call',
          }),
          action({
            id: 'i18-c12', slot: SLOT.MENU,
            label: 'Open Unit Orders yourself',
            hint: 'The approved schedule channel', opens: 'schedule',
          }),
          action({
            id: 'i18-c13',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i18-c14',
            slot: SLOT.MENU, label: 'Ask this account a question only Arjun would know',
          }),
          action({ id: 'i18-c15', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i18-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i18-c17', slot: SLOT.INLINE,
            label: `Report ${handle} as pretending to be Arjun, and tell him and unit security`,
          }),
          action({
            id: 'i18-c18', slot: SLOT.INLINE,
            label: 'Keep following it in case it is his after all',
          }),
          action({
            id: 'i18-c19', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i18-c20', slot: SLOT.MENU,
            label: 'Carry on chatting as normal',
          }),
          action({
            id: 'i18-c21', slot: SLOT.MENU,
            label: 'Unfollow quietly and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i18-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i18-dir-arjun',
        name,
        identifier: savedNumber,
        provenance: 'saved contact on this device',
        role: 'Saved in 2019. Reaches Arjun without going through either Instagram account.',
      },
    ],
  }
}

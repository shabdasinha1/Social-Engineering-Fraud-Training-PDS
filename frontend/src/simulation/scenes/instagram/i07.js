import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, me, receivedAt, sharedPost, social, splitHeadline, them,
} from './shared.js'

/**
 * I07 - Known Friend Shares a Reel (IMMERSIVE-004B). The ordinary, expected item of the batch.
 *
 * Neel, a friend the learner has messaged for years, sends the cooking reel they talked about
 * last night: "This is the recipe we discussed yesterday." It arrives in the main inbox, not
 * in Requests; the handle is the one the chat has always had; the reel is a public post by a
 * long-running cooking account and plays inside the app; and there is no link, no ask, no
 * money and no hurry. The right thing to do is to watch it and use it normally.
 *
 * The judgement being tested comes AFTER six Instagram items that each had something wrong
 * with them: over-reaction. Reporting or blocking a friend for sending what you asked for is
 * the false positive; muting him is the needless rejection; and the one untrusted-channel
 * temptation is the learner's own habit of pasting a reel's link into a third-party
 * "downloader" site to keep it - not anything Neel did.
 *
 * Its evidence is Instagram's own: the conversation's history (searchable, going back years),
 * the reel's creator and audio, Neel's profile with years of mutual friends. The client's
 * verification is the existing thread context, so the check is the chat itself.
 */
export function buildI07(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const friend = 'Neel Verma'
  const creator = 'spice_route_kitchen'
  const time = receivedAt(scenario) ?? '19:36'

  return {
    scenarioId: 'I07',
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
            {
              id: 'i07-row',
              handle,
              name: friend,
              preview: text,
              time: '2m',
              unread: true,
            },
            { id: 'i07-bg-1', handle: 'nisha.bakes', name: 'Nisha', preview: 'Nisha: see you Sunday!', time: '1h', inert: true },
            { id: 'i07-bg-2', handle: 'dev_fit', name: 'Dev', preview: 'You: 😂😂', time: '5h', outgoing: true, inert: true },
            { id: 'i07-bg-3', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Meera: photos from the ridge', time: '2d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name: friend,
      subline: `${handle} · Active 2m ago`,
      verified: false,
      request: false,
    },

    beats: [
      day('i07-day-old', 'YESTERDAY 21:02'),
      me('i07-y1', 'that dal at Sunita’s was unreal 😭 did you get the recipe from her?', '21:02'),
      them('i07-y2', 'she won’t share it 😂 but I saw a reel last week that looks exactly like it. will find it', '21:05'),
      me('i07-y3', 'yes pls, Sunday lunch plan', '21:06'),
      them('i07-y4', '👍', '21:06'),
      day('i07-day', `TODAY ${time}`),
      sharedPost('i07-reel', {
        author: creator,
        art: 'food',
        reel: true,
        title: 'Dhaba-style dal tadka',
        caption: 'Dhaba-style dal tadka in 15 minutes 🍲',
        time,
      }),
      them('i07-b1', text, time),

      them('i07-b2', 'the tadka bit at 0:40 is the trick', time, { since: 'branch' }),

      {
        kind: 'system', id: 'i07-after-link', tone: 'banner',
        text: 'reelsave.training.example wants to send you notifications. It asked you to install “ReelSave HD” to finish the download.',
        since: 'verify', afterConsequence: 'simulated_browser_open',
      },
    ],

    surfaces: {
      reel: social({
        title: 'Reels',
        home: 'reel',
        pages: {
          reel: {
            view: 'reel',
            handle: creator,
            label: 'Food & cooking',
            avatarArt: 'food',
            profileTo: 'creator',
            slides: [
              { art: 'food', title: 'Dal tadka', subtitle: '0:00 · soak and pressure-cook the dal' },
              { art: 'food', title: 'Ghee, jeera, garlic', subtitle: '0:40 · the tadka' },
              { art: 'food', title: 'Smoke it', subtitle: '1:05 · hot coal in a bowl, lid on' },
            ],
            caption: 'Dhaba-style dal tadka in 15 minutes 🍲 Everything is in the video. #dal #homecooking',
            audio: `Original audio · ${creator}`,
            counts: '48.2K likes · 1,904 comments · shared with you by neel.verma',
          },
          creator: {
            view: 'profile',
            handle: creator,
            name: 'Spice Route Kitchen',
            category: 'Food & cooking',
            verified: false,
            avatarArt: 'food',
            stats: { posts: '1,204', followers: '812K', following: '210' },
            bio: ['Home-style Indian cooking 🍲', 'New reel every Tuesday and Friday'],
            mutuals: 'Followed by neel.verma, nisha.bakes and 12 others',
            buttons: ['Follow', 'Message'],
            aboutTo: 'creator-about',
            grid: [
              { art: 'food', title: '', note: 'Dal tadka · last week' },
              { art: 'food', title: '', note: 'Rajma · 2 weeks ago' },
              { art: 'food', title: '', note: 'Aloo paratha · 3 weeks ago' },
              { art: 'food', title: '', note: 'Chole · last month' },
              { art: 'food', title: '', note: 'Kadhi · last month' },
              { art: 'food', title: '', note: 'Poha · 2025' },
            ],
          },
          'creator-about': {
            view: 'about',
            title: 'About this account',
            handle: creator,
            rows: [
              { label: 'Date joined', value: 'January 2019' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [],
          },
        },
      }),

      profile: social({
        title: handle,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle,
            name: friend,
            verified: false,
            avatarArt: 'person',
            stats: { posts: '211', followers: '640', following: '592' },
            bio: ['🍳 cooks for friends · 🏏 weekend cricket', 'Pune'],
            mutuals: 'Followed by nisha.bakes, dev_fit and 38 others',
            buttons: ['Following', 'Message'],
            following: true,
            aboutTo: 'about',
            grid: [
              { art: 'food', title: '', note: '3 days ago' },
              { art: 'trail', title: '', note: 'Last week' },
              { art: 'person', title: '', note: '2 weeks ago' },
              { art: 'food', title: '', note: 'Last month' },
              { art: 'trail', title: '', note: 'Last month' },
              { art: 'person', title: '', note: '2025' },
            ],
            note: 'You follow each other. You have messaged since 2021.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'June 2016' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [],
          },
        },
      }),

      /** The existing thread context, as the app lets you search it. */
      history: social({
        title: 'Search in conversation',
        home: 'search',
        pages: {
          search: {
            view: 'list',
            title: 'Search in conversation',
            query: 'recipe',
            heading: `Your chat with ${friend}`,
            rows: [
              { title: 'You · yesterday 21:02', text: 'that dal at Sunita’s was unreal 😭 did you get the recipe from her?' },
              { title: 'Neel · yesterday 21:05', text: 'she won’t share it 😂 but I saw a reel last week that looks exactly like it. will find it' },
              { title: 'Neel · 14 Aug', text: 'sent a reel by spice_route_kitchen', meta: 'Rajma recipe' },
              { title: 'You · 16 Aug', text: 'made the rajma from that reel!! 10/10' },
              { title: 'Neel · March 2024', text: 'sent a reel by spice_route_kitchen', meta: 'Aloo paratha' },
              { title: 'Neel · November 2021', text: 'you have to try this recipe, trust me', meta: 'First message about food' },
            ],
            note: `${friend} has shared 23 reels in this chat. None had a link or asked for anything.`,
          },
        },
      }),

      downloader: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'save',
        pages: {
          save: {
            url: 'https://reelsave.training.example/',
            host: 'reelsave.training.example',
            title: 'ReelSave',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'RS', name: 'ReelSave HD', tagline: 'Download any reel' },
              { type: 'heading', text: 'Paste a reel link to download' },
              {
                type: 'summary',
                rows: [
                  { label: 'Link', value: 'Pasted from your clipboard' },
                  { label: 'Quality', value: 'HD, no watermark' },
                ],
              },
              { type: 'notice', text: 'Allow notifications and install the ReelSave HD app to finish your download.' },
            ],
          },
        },
      },

      'call-neel': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: friend,
        number: '+91 00000 36218',
        script: [
          { at: 0, speaker: 'them', text: 'Hey! Did you see it?' },
          { at: 4, speaker: 'you', text: 'The dal reel - that was you, right?' },
          { at: 8, speaker: 'them', text: 'Yeah, that’s the one I meant yesterday. Watch the tadka bit.' },
          { at: 12, speaker: 'them', text: 'Sunday lunch is on, then. Bring the rajma too 😄' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i07-c01', slot: SLOT.INLINE,
            label: `Open your chat with ${friend}`,
          }),
          action({
            id: 'i07-c02', slot: SLOT.INLINE,
            label: 'Reply “thanks!!” from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i07-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile and account history', targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i07-c04', slot: SLOT.MENU,
            label: 'Read back through the chat from yesterday',
          }),
          action({
            id: 'i07-c05', slot: SLOT.MENU,
            label: 'Just react to it',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({ id: 'i07-nav-reel', slot: SLOT.INLINE, anchor: 'i07-reel', label: 'Watch the reel', opens: 'reel' }),
          action({
            id: 'i07-c06', slot: SLOT.SURFACE, on: 'reel', page: 'reel',
            label: '♡ Like',
          }),
          action({
            id: 'i07-c07', slot: SLOT.SURFACE, on: 'reel', page: 'reel',
            label: 'Save',
          }),
          action({
            id: 'i07-c08', slot: SLOT.COMPOSER,
            label: 'Reply “saving this for Sunday 🤤”', echo: 'saving this for Sunday 🤤',
          }),
          action({
            id: 'i07-c09', slot: SLOT.MENU,
            label: `Mute messages from ${friend} and leave it unwatched`,
          }),
          action({
            id: 'i07-c10', slot: SLOT.MENU,
            label: 'Copy the link into a reel-downloader site to keep it',
            opens: 'downloader',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i07-c11', slot: SLOT.MENU,
            label: 'Search your chat with Neel for “recipe”',
            hint: 'The conversation you already have with him', opens: 'history',
          }),
          action({
            id: 'i07-c12', slot: SLOT.MENU,
            label: `Call ${friend} on his saved number`, opens: 'call-neel',
          }),
          action({
            id: 'i07-c13',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i07-c14',
            slot: SLOT.MENU, label: 'Ask Neel here if he really sent it',
          }),
          action({ id: 'i07-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'i07-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i07-c17', slot: SLOT.INLINE,
            label: 'Save the recipe and reply to Neel',
          }),
          action({
            id: 'i07-c18', slot: SLOT.INLINE,
            label: 'Report the message as spam',
          }),
          action({
            id: 'i07-c19', slot: SLOT.MENU,
            label: 'Mark it read and close the reel',
          }),
          action({
            id: 'i07-c20', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i07-c21', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i07-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i07-nav-watch', slot: SLOT.MENU, label: 'Watch the reel', opens: 'reel', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'i07-dir-neel',
        name: `${friend} (saved contact)`,
        identifier: `+91 00000 36218 · @${handle}`,
        provenance: 'your saved contacts',
        role: 'A friend since college. The number and the Instagram handle you have always had for him.',
      },
    ],
  }
}

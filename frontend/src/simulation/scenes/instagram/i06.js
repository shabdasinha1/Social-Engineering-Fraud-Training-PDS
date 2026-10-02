import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, caption, comment, directory, headline, receivedAt, social, splitHeadline, system,
} from './shared.js'

/**
 * I06 - Where Was This Exercise? (IMMERSIVE-004B). Military context.
 *
 * The item is not a message to the learner. It is a comment under the learner's OWN public
 * post - a generic field-training photo they were cleared to share - from an enthusiastic
 * account that praises it and asks which base, which dates, and for the route by DM. The
 * pressure is pride and the crowd: the question has likes, a friend has already joined in,
 * and answering in public feels like accepting a compliment.
 *
 * What is new against I05 (a stranger's DM with quick replies) is where the leak happens and
 * what the account does with it. The release here is two Instagram-native acts on your own
 * content: a public reply in the comments, or editing the post to add a location tag the app
 * helpfully suggests from the photo. The evidence is the account's own grid - other people's
 * photos re-captioned with a place and dates - and its pinned "season map", which is the
 * operational picture that small public answers add up to.
 *
 * The client's verification is the post's approved-release note and the unit public-information
 * route; the resolution is not to disclose, and to hide/report the eliciting comment.
 */
export function buildI06(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const pio = 'Unit Falcon Public Information Cell'
  const release = 'PA/FAL/2026/188'

  return {
    scenarioId: 'I06',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'activity',
      title: 'Notifications',
      sections: [
        {
          heading: 'New',
          rows: [
            {
              id: 'i06-row',
              handle,
              text: headline(scenario),
              detail: 'commented on your post',
              time: '4m',
              art: 'field',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i06-bg-1', handle: 'coy_mate_vikram', text: 'coy_mate_vikram and 41 others liked your post.', time: '1h', art: 'field', inert: true },
            { id: 'i06-bg-2', handle: 'meera.dsouza', text: 'meera.dsouza commented: "So proud of you!!"', time: '2h', art: 'field', inert: true },
          ],
        },
        {
          heading: 'This week',
          rows: [
            { id: 'i06-bg-3', handle: 'ranger_fanpage_in', text: 'ranger_fanpage_in started following you.', time: '3d', button: 'Follow', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      own: true,
      screenTitle: 'Your post',
      handle: LEARNER.handle,
      name: LEARNER.name,
      subline: null,
      verified: false,
      slides: [
        { art: 'field', title: '', subtitle: '' },
        { art: 'field', title: 'Team 💪', subtitle: '' },
      ],
      likes: '42 likes',
      time: `Yesterday · ${receivedAt(scenario) ?? '10:17'}`,
    },

    beats: [
      caption('i06-caption', {
        author: LEARNER.handle,
        text: 'Six days, zero sleep, best team 💪🏽 Proud of these people. #training #teamwork',
        time: 'Yesterday',
      }),
      system('i06-release', `Release note on this post: ${release} · cleared as a generic image.`),
      comment('i06-c1', { author: 'coy_mate_vikram', text: 'Beast mode 🔥🔥', time: '20h', likes: 3 }),
      comment('i06-c2', { author: 'meera.dsouza', text: 'So proud of you!!', time: '2h', likes: 1 }),
      comment('i06-c-q', { author: handle, text, time: '4m', likes: 14 }),
      comment('i06-c3', { author: 'ranger_fanpage_in', text: '+1 which range is this? looks like the one past the lake 👀', time: '3m', likes: 6 }),

      /** Stage 4: a friend answers for everyone, and the account follows the thread. */
      comment('i06-c4', {
        author: 'coy_mate_vikram', text: `@${handle} haha we were out there six days, back Friday 😅`,
        time: '1m', since: 'branch',
      }),
      comment('i06-c5', {
        author: handle, text: '@coy_mate_vikram legend 🙌 which gate did you all come in by?',
        time: 'now', since: 'branch',
      }),

      /**
       * A public reply and a location tag are both releases, so they share one consequence
       * kind; what follows fits either and echoes neither.
       */
      {
        kind: 'system', id: 'i06-after-release', tone: 'banner',
        text: 'Your post was updated. 3 new likes.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'comment', id: 'i06-after-release-2', author: handle,
        text: 'Legend 🙌 saved. Which way did the convoy come in? DM me 👊', time: 'now',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'comment', id: 'i06-echo-dm', author: LEARNER.handle,
        text: `@${handle} DM me 👍`, time: 'now', reply: true,
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i06-after-dm', tone: 'banner',
        text: `${handle} sent you a message request: "Thanks bro! So which base and what dates? 🙏"`,
        since: 'verify', afterConsequence: 'simulated_reply_sent',
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
            name: 'Defence Fan Archive',
            category: 'Fan page',
            verified: false,
            avatarArt: 'crest',
            stats: { posts: '1,146', followers: '38.2K', following: '2,911', followingTo: 'following' },
            bio: ['Saluting our heroes 🫡', 'Reposts with credit', 'DM your photos to be featured'],
            mutuals: 'Followed by coy_mate_vikram and 3 others',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'season-map',
            grid: [
              { art: 'notice', title: 'Season map', note: 'Pinned' },
              { art: 'field', title: '', note: 'Repost · 📍 Range 3 · 12–18 Aug' },
              { art: 'field', title: '', note: 'Repost · 📍 Lake sector · 20–24 Aug' },
              { art: 'crest', title: '', note: 'Repost · convoy · 06:00' },
              { art: 'field', title: '', note: 'Repost · 📍 North ridge · 2 Sep' },
              { art: 'field', title: '', note: 'Repost · 📍 Range 3 · 9 Sep' },
            ],
            note: 'Its posts are photos first shared by other people, each re-captioned with a place and a date.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'March 2026 (6 months ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'cantonment.memes', when: 'April 2026' },
              { handle: 'armed_forces_wallpapers_hd', when: 'June 2026' },
            ],
          },
          'season-map': {
            view: 'post',
            handle,
            name: 'Defence Fan Archive',
            verified: false,
            subline: 'Pinned',
            slides: [
              { art: 'notice', title: 'Exercise season 2026 🗺️', subtitle: 'Who trained where - thanks to you!' },
            ],
            likes: '2,318 likes',
            caption: 'Exercise season so far, thanks to everyone who told us in the comments 🙏 Range 3: 12–18 Aug and again from 9 Sep · Lake sector: 20–24 Aug, convoy in by the east gate at 06:00 · North ridge: from 2 Sep. Keep them coming, tell us where your unit is next 👇',
            comments: [
              { author: 'fitfauji_92', text: 'Lake sector was us 💪 back next month' },
              { author: 'ranger_fanpage_in', text: 'Adding the ones from today’s posts 👍' },
            ],
            time: 'Pinned · updated today',
          },
          following: {
            view: 'people',
            title: 'Following',
            heading: '2,911 accounts',
            people: [
              { handle: 'ranger_fanpage_in', name: 'Ranger Fan Page', note: 'Follows each other · commented on your post' },
              { handle: 'fitfauji_92', name: '', note: 'Commented on its season map' },
              { handle: 'coy_mate_vikram', name: 'Vikram', note: 'Follows you' },
              { handle: LEARNER.handle, name: `${LEARNER.name} (you)`, note: 'Followed you this week' },
              { handle: 'morning_miles', name: '', note: '' },
            ],
            note: 'Most of the accounts it follows post training or fitness photos.',
          },
        },
      }),

      /** Editing the learner's own post: the location suggestions the app offers from the photo. */
      location: social({
        title: 'Edit post',
        home: 'add-location',
        pages: {
          'add-location': {
            view: 'list',
            title: 'Add location',
            heading: 'Suggested for this photo',
            rows: [
              { icon: 'place', title: 'Falcon Cantonment · Range 3', meta: 'Suggested from where the photo was taken' },
              { icon: 'place', title: 'Lake Sector Training Area', meta: '12 posts tagged here this month' },
              { icon: 'place', title: 'Falcon Town', meta: 'City' },
            ],
            note: 'A location tag is shown to everyone who can see your post.',
          },
        },
      }),

      /** The post's own release note, for the learner to read against the question. */
      release: social({
        title: 'Release note',
        home: 'note',
        pages: {
          note: {
            view: 'status',
            title: 'Release note',
            heading: `Your post · ${release}`,
            statusRows: [
              { label: 'Cleared', value: 'A generic training image with no caption detail.', ok: true },
              { label: 'Not cleared', value: 'Location, base, range, dates, routes, timings, equipment or who took part.', ok: false },
              { label: 'Questions about the image', value: `Refer them to the ${pio}. Do not answer in comments or DMs.`, ok: false },
            ],
            note: 'Issued with the clearance for this post.',
          },
        },
      }),

      'call-pio': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: pio,
        number: '+91 00000 25990',
        script: [
          { at: 0, speaker: 'them', text: 'Public information cell, good morning.' },
          { at: 4, speaker: 'you', text: `Someone commented on my cleared post asking which base, the dates and the route.` },
          { at: 9, speaker: 'them', text: `Your clearance ${release} covers the image only. Don’t give place, dates or route - not in comments, not by DM.` },
          { at: 15, speaker: 'them', text: 'Hide the comment and report it. We’ve seen that account ask the same under other people’s posts.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i06-c01', slot: SLOT.INLINE,
            label: `Open the comment ${handle} left on your post`,
          }),
          action({
            id: 'i06-c02', slot: SLOT.INLINE,
            label: 'Reply “Thanks bro 🙏 DM me” from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i06-c03', slot: SLOT.INLINE, anchor: 'i06-c-q',
            label: `View ${handle}`, hint: 'Profile, posts and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i06-c04', slot: SLOT.MENU,
            label: 'Read all the comments on your post',
          }),
          action({
            id: 'i06-c05', slot: SLOT.MENU,
            label: 'Just answer the comment',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i06-c06', slot: SLOT.COMPOSER,
            label: 'Reply with the range and the dates',
            echo: `@${handle} Range 3 at Falcon, 12–18 Aug 🔥`,
          }),
          action({
            id: 'i06-c07', slot: SLOT.COMPOSER,
            label: 'Tell them to DM you', echo: `@${handle} DM me 👍`,
          }),
          action({
            id: 'i06-c08', slot: SLOT.SURFACE, on: 'location',
            label: 'Add “Falcon Cantonment · Range 3”', closes: true,
          }),
          action({
            id: 'i06-c09', slot: SLOT.SURFACE, on: 'location',
            label: 'Add “Lake Sector Training Area”', closes: true,
          }),
          action({
            id: 'i06-c10', slot: SLOT.SURFACE, on: 'location',
            label: 'Cancel', closes: true,
          }),
          action({
            id: 'i06-c11', slot: SLOT.MENU,
            label: 'Leave the question unanswered',
          }),
          navigate({ id: 'i06-nav-location', slot: SLOT.MENU, label: 'Edit post › Add location', opens: 'location' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i06-c12', slot: SLOT.MENU,
            label: `Call the ${pio} on the directory number`,
            hint: 'The public-information route for your post', opens: 'call-pio',
          }),
          action({
            id: 'i06-c13',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i06-c14',
            slot: SLOT.MENU, label: `Ask ${handle} in the comments why they want to know`,
          }),
          action({ id: 'i06-c15', slot: SLOT.MENU, label: 'Report the comment' }),
          action({ id: 'i06-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i06-c17', slot: SLOT.INLINE,
            label: 'Hide the comment and report it',
          }),
          action({
            id: 'i06-c18', slot: SLOT.INLINE,
            label: 'Leave the comment up, it’s only a fan',
          }),
          action({
            id: 'i06-c19', slot: SLOT.MENU,
            label: `Delete the comment and block ${handle}`,
          }),
          action({
            id: 'i06-c20', slot: SLOT.MENU,
            label: 'Answer them by DM instead of in public',
          }),
          action({
            id: 'i06-c21', slot: SLOT.MENU,
            label: 'Close the app and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i06-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i06-nav-release', slot: SLOT.MENU, label: 'View the release note on your post', opens: 'release', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i06-dir-pio',
        name: pio,
        identifier: '+91 00000 25990',
        provenance: 'local approved directory',
        role: 'Clears unit-related posts and answers questions about released images.',
      },
    ],
  }
}

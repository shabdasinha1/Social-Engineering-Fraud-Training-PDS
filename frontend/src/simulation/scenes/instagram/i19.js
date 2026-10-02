import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, caption, comment, directory, social, splitHeadline, system,
} from './shared.js'

/**
 * I19 - Urgent Unit Incident Repost (IMMERSIVE-004D). Hard.
 *
 * Nobody asks the learner for anything private. A page mentions them, among others, under a
 * dramatic post about their own unit and asks everyone to repost before it is "taken down". The
 * pull is duty and fear: families are asking, a friend in the comments wants the learner to
 * say whether it is true, and twelve thousand people have already shared it.
 *
 * The decision is made in a surface no earlier scene has used - Instagram's **share tray** and
 * the learner's own **story composer** with its location and mention stickers. Posting it as it
 * is, or commenting under it, is amplification (-3); adding the area or tagging the people who
 * were there is the release (-8). Closing the composer, or not sharing at all, is the pivot.
 *
 * The evidence is in-app and historical: the page is eleven days old and has posted under a
 * cricket name and a finance name; its own pinned post from April carries the SAME photograph
 * with a different disaster; and the unit page the learner follows has said nothing. The
 * client's verification is the approved official statements and the public-information route,
 * so the checks are the Unit Bulletin app and the public-information cell.
 */
export function buildI19(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const deskNumber = desk.identifier || '+91 00000 62597'
  const name = 'Breaking Defence Now'
  const unitPage = 'unitfalcon_public'

  const slides = [
    { art: 'poster', title: 'URGENT', subtitle: 'Unit Falcon · within the last hour' },
    { art: 'field', title: '', subtitle: '' },
    { art: 'notice', title: 'REPOST BEFORE IT IS DELETED', subtitle: 'Families need to know' },
  ]

  return {
    scenarioId: 'I19',
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
              id: 'i19-row',
              handle,
              detail: `${handle} mentioned you in a post.`,
              text,
              time: '4m',
              art: 'poster',
            },
            { id: 'i19-bg-1', handle: 'dev_fit', text: 'dev_fit mentioned you in a comment.', time: '4m', inert: true },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i19-bg-2', handle: unitPage, text: `${unitPage} shared a post: sports day results.`, time: '3h', art: 'award', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      screenTitle: 'Posts',
      handle,
      name,
      subline: 'News & media website',
      verified: false,
      avatarArt: 'poster',
      slides,
      likes: '18,402 likes',
      time: 'Posted 41 minutes ago',
    },

    beats: [
      caption('i19-caption', {
        author: handle,
        text: `${text} Reports are coming in from Unit Falcon in the last hour and families are asking what is happening. Put this on your story so it reaches the right people before the page is taken down.`,
        tags: [LEARNER.handle, 'dev_fit', 'anjali.m', '+ 44 others'],
        // No `time` here: the post already prints "Posted 41 minutes ago" under its notices,
        // and a caption time as well drew the same age twice (found in browser play).
      }),
      system('i19-shares', 'Shared 12,400 times in the last hour'),

      comment('i19-c1', { author: 'p.menon.44', text: 'Reposted. Everyone please share 🙏', time: '34m', likes: 210 }),
      comment('i19-c2', { author: 'anjali.m', text: 'Is there anything official about this? I can’t find a statement anywhere.', time: '29m', likes: 12 }),
      comment('i19-c3', { author: handle, reply: true, text: 'We are first with this. Official statements always come late. Repost now.', time: '27m', likes: 88 }),
      comment('i19-c4', { author: 'k_bose', text: 'This picture was on this same page in April with a different caption.', time: '18m', likes: 3 }),
      comment('i19-c5', {
        author: 'dev_fit', since: 'branch', time: '3m', likes: 0,
        text: `@${LEARNER.handle} you’d know - is this true?? my mother keeps calling me`,
      }),

      {
        kind: 'system', id: 'i19-after-share', tone: 'banner',
        text: 'What you added is public, under your name, beside the post. 212 people have seen it in two minutes and the post has been shared 300 more times.',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i19-after-release', tone: 'banner',
        text: 'Your story is live with detail the original post did not have. Four accounts you do not know have already screenshotted it.',
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
            category: 'News & media website',
            verified: false,
            avatarArt: 'poster',
            following: false,
            stats: { posts: '67', followers: '1,780', following: '803' },
            bio: ['Fastest defence updates 🔴', 'DM for promotions'],
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'april',
            compareTo: { to: 'unit', label: `Open @${unitPage}, the unit page you follow` },
            grid: [
              { art: 'poster', title: '', note: '41 min ago' },
              { art: 'poster', title: '', note: '2 days ago' },
              { art: 'chart', title: '', note: '6 days ago' },
              { art: 'giveaway', title: '', note: '9 days ago' },
              { art: 'poster', title: '', note: '10 days ago' },
              { art: 'field', title: '', note: 'April' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: '5 September 2026' },
              { label: 'Account based in', value: 'Outside India' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '2' },
            ],
            formerUsernames: [
              { handle: 'viral_cricket_now', when: '9 days ago' },
              { handle: 'breaking_finance_now', when: '6 days ago' },
            ],
          },
          april: {
            view: 'post',
            handle: 'breaking_finance_now',
            subline: 'Pinned · posted under an earlier name',
            slides: [{ art: 'field' }],
            likes: '9,110 likes',
            caption: 'BREAKING: major fire at a fuel depot. Share before this is taken down.',
            time: 'April 2026',
            comments: [
              { author: 'k_bose', text: 'this is the same picture as the one from last year', time: 'April', likes: 5 },
            ],
          },
          unit: {
            view: 'profile',
            handle: unitPage,
            name: 'Unit Falcon Public Information',
            category: 'Government organisation',
            verified: true,
            avatarArt: 'crest',
            following: true,
            stats: { posts: '412', followers: '48,109', following: '31' },
            bio: ['Official page of Unit Falcon', 'Statements appear here and on the Unit Bulletin'],
            buttons: ['Following', 'Message'],
            note: 'Last post 3 hours ago: sports day results.',
            grid: [
              { art: 'award', title: '', note: '3 hours ago' },
              { art: 'field', title: '', note: '6 days ago' },
              { art: 'crest', title: '', note: '2 weeks ago' },
            ],
          },
        },
      }),

      /** Instagram's share tray and the learner's own story composer. */
      share: social({
        title: 'Share',
        home: 'tray',
        pages: {
          tray: {
            view: 'settings',
            title: 'Share',
            username: LEARNER.handle,
            rows: [
              { label: 'Add post to your story', value: 'Seen by your 1,046 followers for 24 hours', to: 'story' },
              { label: 'Send in a message', value: 'Unit friends · Pune Trek Club · Family' },
              { label: 'Copy link', value: `instagram post by @${handle}` },
            ],
          },
          story: {
            view: 'story',
            title: 'Your story',
            handle: LEARNER.handle,
            art: 'poster',
            segments: 1,
            time: 'Not posted',
            sticker: 'URGENT · Unit Falcon',
            caption: `Post by @${handle}`,
          },
        },
      }),

      /** The approved statements board. */
      bulletin: {
        kind: SURFACE.APP,
        appName: 'Unit Bulletin',
        appTagline: 'Official statements · Unit Falcon',
        hero: {
          label: 'Today, 16 September',
          value: 'No statement issued',
          caption: 'Last entry: 13:40, sports day results.',
          chips: ['Approved channel', 'Refreshed 18:14'],
        },
        sections: [
          {
            id: 'i19-bul-how',
            heading: 'How statements are made',
            rows: [
              { label: 'Where', value: `This board first, then @${unitPage}` },
              { label: 'Who', value: 'The public-information cell only' },
              { label: 'Today', value: 'Nothing has been issued since 13:40' },
            ],
          },
          {
            id: 'i19-bul-report',
            heading: 'Report something you have seen about the unit',
            rows: [
              { label: 'Public-information cell', value: deskNumber },
              { label: 'What to keep', value: 'The link and the account name, unshared' },
            ],
          },
        ],
        tabs: [
          { label: 'Statements', icon: 'home' },
          { label: 'Archive', icon: 'history' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: deskName,
        number: deskNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Public-information cell.' },
          { at: 4, speaker: 'you', text: `There is a post by @${handle} about an incident here in the last hour. I was mentioned in it.` },
          { at: 10, speaker: 'them', text: 'We have had several calls. There is no incident and nothing has been issued.' },
          { at: 16, speaker: 'them', text: 'Please don’t share or comment. Report the post, keep the link, and send it to us here.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i19-c01', slot: SLOT.INLINE,
            label: 'Open the post you were mentioned in',
          }),
          action({
            id: 'i19-c02', slot: SLOT.INLINE,
            label: 'Share it to your story from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i19-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i19-c04', slot: SLOT.MENU,
            label: 'Read all the comments under the post',
          }),
          action({
            id: 'i19-c05', slot: SLOT.MENU,
            label: 'No time - go straight to sharing',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i19-c06', slot: SLOT.SURFACE, on: 'share', page: 'story',
            label: 'Post to your story as it is', closes: true,
          }),
          action({
            id: 'i19-c07', slot: SLOT.SURFACE, on: 'share', page: 'story',
            label: 'Add a location sticker for the area, then post', closes: true,
          }),
          action({
            id: 'i19-c08', slot: SLOT.SURFACE, on: 'share', page: 'story',
            label: 'Mention the people you know were on duty, then post', closes: true,
          }),
          action({
            id: 'i19-c09', slot: SLOT.SURFACE, on: 'share',
            label: 'Close without sharing', closes: true,
          }),
          action({
            id: 'i19-c10', slot: SLOT.COMPOSER,
            label: 'Comment “praying for everyone there 🙏”',
            echo: 'praying for everyone there 🙏',
          }),
          action({
            id: 'i19-c11', slot: SLOT.MENU,
            label: 'Don’t share it, don’t comment, don’t answer Dev here',
          }),
          navigate({
            id: 'i19-nav-share', slot: SLOT.MENU,
            label: 'Share…', opens: 'share',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i19-c12', slot: SLOT.MENU,
            label: 'Open the Unit Bulletin yourself',
            hint: 'Approved official statements', opens: 'bulletin',
          }),
          action({
            id: 'i19-c13', slot: SLOT.MENU,
            label: 'Ring the public-information cell on the directory number',
            hint: deskNumber, opens: 'call',
          }),
          action({
            id: 'i19-c14',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i19-c15',
            slot: SLOT.MENU, label: `Ask @${handle} for its source`,
          }),
          action({ id: 'i19-c16', slot: SLOT.MENU, label: 'Report the post' }),
          action({ id: 'i19-c17', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i19-c18', slot: SLOT.INLINE,
            label: 'Report it as false information and send the link to the cell',
          }),
          action({
            id: 'i19-c19', slot: SLOT.INLINE,
            label: 'Follow the page in case there is an update',
          }),
          action({
            id: 'i19-c20', slot: SLOT.MENU,
            label: `Block ${handle} and keep the link for review`,
          }),
          action({
            id: 'i19-c21', slot: SLOT.MENU,
            label: 'Save the post to come back to later',
          }),
          action({
            id: 'i19-c22', slot: SLOT.MENU,
            label: 'Scroll on and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i19-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i19-dir-page',
        name: 'Unit Falcon Public Information',
        identifier: `@${unitPage}`,
        provenance: 'local approved directory',
        role: 'The unit’s only public page. Statements appear here after the Unit Bulletin.',
      },
    ],
  }
}

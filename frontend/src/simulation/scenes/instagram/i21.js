import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, me, sharedPost, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I21 - Post-Event Teammate Tag (IMMERSIVE-004E). Hard. The batch's ordinary item.
 *
 * The event is over. The unit's page has published the cleared team photograph as PF-311, and a
 * teammate the learner has followed since 2019 has put it on his own grid and wants to tag them.
 * Everything checks out, and the scene is Hard because nothing is wrong: the lesson is to use the
 * app's normal path and give the post nothing it did not already have.
 *
 * What is Instagram's own here, and new to the product: the decision is the **tag-review sheet on
 * the published post itself** - Approve or Decline, both the normal path - with the sheet's own
 * **audience choice** (who sees the tagged post on the learner's profile), a real local choice
 * that is never sent. I16 decided on a consent card in Settings before publication; I21 decides on
 * the live post, after the event, peer to peer.
 *
 * The priced mistakes are the ones a friendly learner makes: leaving the request unanswered (-2),
 * offering the next fixture's date and ground "for the caption", and following a stranger's "HD
 * album" link in the post's comments instead of the post itself (-4 each, the client's untrusted
 * channel on a genuine item). The client's check is the release register plus the learner's own
 * privacy preferences; the teammate's saved number and the directory are the other routes.
 */
export function buildI21(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const name = 'Arjun K. Singh'
  const saved = '+91 00000 41766'
  const releaseId = 'PF-311'
  const unitPage = 'unitfalcon_public'

  return {
    scenarioId: 'I21',
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
            { id: 'i21-row', handle, name, preview: text, time: '4m', unread: true },
            { id: 'i21-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'that last penalty 😂', time: '1h', inert: true },
            { id: 'i21-bg-2', handle: 'nisha.bakes', name: 'Nisha', preview: 'Reacted 👍 to your message', time: '1d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: 'Active 4m ago',
      verified: false,
      request: false,
    },

    beats: [
      day('i21-d1', '28 AUGUST'),
      them('i21-b1', 'Final is on the 12th. Public info said they will shoot it and put the cleared ones on their page after.', '19:02'),
      me('i21-b2', '👍 see you there', '19:15'),

      day('i21-d2', '13 SEPTEMBER'),
      them('i21-b3', 'What a match 🏆', '08:40'),
      me('i21-b4', 'Still can’t believe that last penalty', '08:52'),

      day('i21-d3', 'TODAY'),
      sharedPost('i21-share', {
        author: unitPage,
        verified: true,
        art: 'award',
        title: `${releaseId} · Inter-unit football final`,
        caption: 'Cleared for public release. Well played, everyone.',
        time: '13:44',
      }),
      them('i21-b5', text, '13:51'),
      them('i21-b6', 'It’s the team photo with the trophy, same frame as theirs. Caption is just the result. Totally fine if you’d rather not be tagged 🙂', '13:51'),
      system('i21-tagnote', `Instagram · ${handle} wants to tag you in a post. You approve tags yourself, so it waits for you.`, { tone: 'mention' }),

      them('i21-b7', 'Writing the caption now - want me to add anything?', '13:58', { since: 'branch' }),

      me('i21-echo-caption', 'add: next up is the semi on 3 Oct at the east ground, 0700 🙌', '14:01', {
        since: 'verify', afterConsequence: 'simulated_data_submission',
      }),
      them('i21-after-caption', 'Ha, I’ll leave that out - the post was cleared as a result photo only.', '14:03', {
        since: 'verify', afterConsequence: 'simulated_data_submission',
      }),
      {
        kind: 'system', id: 'i21-after-album', tone: 'banner',
        text: 'The album page asked you to sign in with your Instagram password to “unlock HD downloads”. Nothing in Arjun’s post links to it.',
        since: 'verify', afterConsequence: 'simulated_browser_open',
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
            following: true,
            stats: { posts: '214', followers: '612', following: '540', followersTo: 'followers' },
            bio: ['Midfield, mostly on the bench 😄', 'Trekking · chai · football'],
            mutuals: 'Followed by dev_fit, anjali.m and 48 others you follow',
            buttons: ['Following', 'Message'],
            aboutTo: 'about',
            compareTo: { to: 'together', label: 'Posts you’re both tagged in' },
            grid: [
              { art: 'award', title: '', note: 'Today' },
              { art: 'trail', title: '', note: 'Aug' },
              { art: 'food', title: '', note: 'Jul' },
              { art: 'field', title: '', note: 'May' },
              { art: 'trail', title: '', note: '2025' },
              { art: 'cafe', title: '', note: '2024' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'June 2015' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '50' },
            ],
            formerUsernames: [],
            note: 'You have followed each other since 2019.',
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: '612 followers',
            people: [
              { handle: 'dev_fit', note: 'Follows you' },
              { handle: 'anjali.m', note: 'Follows you' },
              { handle: 'coach.menon', note: 'Followed by dev_fit' },
            ],
            note: 'Mostly people from the team and the trekking club, following since 2015-2024.',
          },
          together: {
            view: 'list',
            title: 'Tagged together',
            heading: 'Posts where you are both tagged',
            rows: [
              { art: 'trail', title: 'Monsoon trek', text: 'Posted by dev_fit', meta: 'August 2024' },
              { art: 'field', title: 'Club fixture', text: `Posted by ${handle}`, meta: 'May 2023 · you approved the tag' },
              { art: 'cafe', title: 'Pune reunion', text: 'Posted by anjali.m', meta: 'January 2021' },
            ],
          },
        },
      }),

      /**
       * The tag request on Arjun's published post. The review sheet is where the decision is
       * made; the post and the learner's own tag preferences are pages behind it.
       */
      tag: social({
        title: 'Tag request',
        home: 'review',
        pages: {
          review: {
            view: 'review',
            title: 'Tag request',
            handle,
            art: 'award',
            text: 'wants to tag you in this post.',
            rows: [
              { label: 'Post', value: 'Published today 13:49 · public' },
              { label: 'Photo', value: `Team with the trophy · release ${releaseId}` },
              { label: 'Caption', value: 'Final whistle 🏆 Champions 3-2' },
              { label: 'Location', value: 'None added' },
            ],
            audience: {
              label: 'Show this post on your profile to',
              options: ['Everyone', 'Followers only', 'Only me'],
              initial: 'Followers only',
            },
            links: [
              { id: 'i21-link-post', label: 'View the post', to: 'post' },
              { id: 'i21-link-prefs', label: 'Your tag settings', to: 'prefs' },
            ],
            note: 'If you decline, your name is removed from the post. The post stays up.',
          },
          post: {
            view: 'post',
            handle,
            subline: 'Tag request pending · you',
            slides: [
              { art: 'award', title: '', subtitle: '' },
            ],
            likes: '118 likes',
            caption: 'Final whistle 🏆 Champions 3-2',
            time: `Today · photo ${releaseId}`,
            comments: [
              { author: 'dev_fit', text: 'Legends 🔥', time: '6m', likes: 4 },
              { author: 'hd.match.photos', text: 'Full HD album of the whole final 👉 tap the link on our page, sign in to download', time: '3m', likes: 0 },
              { author: 'anjali.m', text: 'Framing this one', time: '2m', likes: 2 },
            ],
          },
          prefs: {
            view: 'settings',
            title: 'Tags and mentions',
            username: LEARNER.handle,
            rows: [
              { label: 'Manually approve tags', value: 'On' },
              { label: 'Who can tag you', value: 'People you follow' },
              { label: 'Location tags on posts about you', value: 'Never added by you' },
              { label: 'Pending tag requests', value: `1 · ${handle}` },
            ],
          },
        },
      }),

      /** The local public-release register, with the learner's own lodged preferences. */
      register: {
        kind: SURFACE.APP,
        appName: 'Release Register',
        appTagline: 'Unit Falcon · local copy',
        hero: {
          label: `Release ID · ${releaseId}`,
          value: 'Released for public use',
          caption: 'Published 13 September 2026, after the event had concluded.',
          chips: ['Local copy', 'Updated 06:00 today'],
        },
        sections: [
          {
            id: 'i21-reg-311',
            heading: releaseId,
            rows: [
              { label: 'Description', value: 'Team photograph with trophy, inter-unit football final' },
              { label: 'Event', value: 'Concluded 12 September' },
              { label: 'Re-sharing', value: 'Permitted on personal accounts' },
              { label: 'Tagging by name', value: 'Permitted with each person’s approval' },
              { label: 'Captions', value: 'Result only; no location, dates or future fixtures' },
            ],
          },
          {
            id: 'i21-reg-prefs',
            heading: `Your release preferences · ${LEARNER.name}`,
            rows: [
              { label: 'Tags by teammates on released images', value: 'Allowed' },
              { label: 'Location tags', value: 'Never' },
              { label: 'Who sees tagged posts', value: 'Your choice per post' },
            ],
            note: 'Release IDs are issued only in this register.',
          },
        ],
        tabs: [
          { label: 'Register', icon: 'home' },
          { label: 'My preferences', icon: 'profile' },
        ],
      },

      /** Arjun, on the number saved since 2019. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: name,
        number: saved,
        script: [
          { at: 0, speaker: 'them', text: 'Hey! Did the tag come through?' },
          { at: 4, speaker: 'you', text: `It did. Just checking it’s you and that it’s the ${releaseId} photo.` },
          { at: 9, speaker: 'them', text: `Yes, the trophy one - same as the unit page. Approve or decline, whatever you like.` },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i21-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${name}`,
          }),
          action({
            id: 'i21-c02', slot: SLOT.INLINE,
            label: 'Reply “sure, tag me” from the preview',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i21-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, history and followers',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i21-c04', slot: SLOT.MENU,
            label: 'Read back through the August and September messages',
          }),
          action({
            id: 'i21-c05', slot: SLOT.MENU,
            label: 'Go straight to the tag request',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'i21-nav-tag', slot: SLOT.INLINE, anchor: 'i21-tagnote',
            label: 'Review tag request', opens: 'tag',
          }),
          action({
            id: 'i21-c06', slot: SLOT.SURFACE, on: 'tag', page: 'review',
            label: 'Approve tag', closes: true,
          }),
          action({
            id: 'i21-c07', slot: SLOT.SURFACE, on: 'tag', page: 'review',
            label: 'Decline tag', closes: true,
          }),
          action({
            id: 'i21-c08', slot: SLOT.SURFACE, on: 'tag', page: 'post',
            label: 'Open the “full HD album” from the comments', closes: true,
          }),
          action({
            id: 'i21-c09', slot: SLOT.MENU,
            label: 'Leave the tag request unanswered',
          }),
          action({
            id: 'i21-c10', slot: SLOT.COMPOSER,
            label: 'Suggest the next fixture’s date and ground for the caption',
            echo: 'add: next up is the semi on 3 Oct at the east ground, 0700 🙌',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i21-c11', slot: SLOT.MENU,
            label: `Look up ${releaseId} in the Release Register`,
            hint: 'The unit’s register and your own release preferences', opens: 'register',
          }),
          action({
            id: 'i21-c12', slot: SLOT.MENU,
            label: 'Ring Arjun on his saved number',
            hint: saved, opens: 'call',
          }),
          action({
            id: 'i21-c13',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i21-c14',
            slot: SLOT.MENU, label: `Ask Arjun in this chat whether ${releaseId} is really public`,
          }),
          action({ id: 'i21-c15', slot: SLOT.MENU, label: `Report ${handle}` }),
          action({ id: 'i21-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i21-c17', slot: SLOT.INLINE,
            label: `Report ${handle}’s post`,
          }),
          action({
            id: 'i21-c18', slot: SLOT.INLINE,
            label: 'Keep your tag choice and carry on',
          }),
          action({
            id: 'i21-c19', slot: SLOT.MENU,
            label: 'Keep the chat as it is',
          }),
          action({
            id: 'i21-c20', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i21-c21', slot: SLOT.MENU,
            label: 'Remove Arjun from your followers and say nothing',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i21-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i21-nav-tagagain', slot: SLOT.MENU, label: 'Tags and mentions', opens: 'tag', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'i21-dir-arjun',
        name,
        identifier: saved,
        provenance: 'saved contact',
        role: 'Teammate. In your contacts since 2019.',
      },
    ],
  }
}

import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, requestCard, social, splitHeadline, storyReply, them,
} from './shared.js'

/**
 * I05 - Friendly New Follower Questionnaire (IMMERSIVE-004A). Military context.
 *
 * A new follower opens by complimenting the learner's fitness posts - it arrives as a reply
 * to their running story, the way most strangers actually start - and then, warmly, asks a
 * sequence of questions: which city, which unit, and the daily route. Nothing is demanded.
 * Nothing is urgent. The danger is that answering feels like ordinary friendliness, and the
 * answers together are a targeting package: location, affiliation and a predictable routine.
 *
 * This is the elicitation scene, and it is unlike every other Instagram item in the batch
 * because there is no link, no login, no payment and no clone. The "branch" surface is a
 * row of quick replies the app itself offers - the city, the unit, the route - and choosing
 * any of them is the release. The safe move is to keep it friendly without answering the
 * specifics. The evidence is the profile: an account a week old,
 * almost no posts of its own, following thousands, and a comment history of the same
 * questions on other people's fitness posts.
 *
 * There is nothing to report with confidence and no clone to expose, so the honest
 * verification is to look the account over and, if it claims to know someone, check through
 * a real mutual outside the DM - not to hand over the details to find out.
 */
export function buildI05(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  return {
    scenarioId: 'I05',
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
              id: 'i05-row',
              handle,
              name: 'Trail Fan',
              preview: text,
              time: '6m',
              request: true,
              unread: true,
            },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i05-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'Dev: nice pace today!', time: '4h', inert: true },
            { id: 'i05-bg-2', handle: 'run.club.falcontown', name: 'Falcon Town Run Club', preview: 'Meera: Sunday long run?', time: '1d', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name: 'Trail Fan',
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i05-request', {
        name: 'Trail Fan',
        handle,
        verified: false,
        stats: { posts: '2', followers: '38', following: '3,908' },
        relation: 'Started following you today · joined 1 week ago',
      }),
      day('i05-day', 'MESSAGE REQUEST'),
      storyReply('i05-story', {
        story: { art: 'trail', label: 'Your story · 6.2 km before work' },
        text: 'Replied to your story',
        time: '08:26',
      }),
      them('i05-b1', 'Love your running posts! That sunrise trail is unreal 🔥 how do you keep it up daily?', '08:27'),
      them('i05-b2', text, '08:28'),
      them('i05-b2a', 'btw I think we have a friend in common - Karan from the Sunday run club? He said you’re the fastest one there 😄', '08:28'),

      them('i05-b3', 'Just curious, always looking for good routes near my base too 🙂 which side of the city are you?', '08:29', { since: 'branch' }),
      them('i05-b4', 'And what time do you usually head out? Might join sometime!', '08:29', { since: 'branch' }),

      /**
       * Three different answers produce the same consequence kind, so the thread does not echo
       * one of them back (a browser run showed the wrong sentence under the chip chosen). What
       * follows is his next question, which fits whichever detail was given.
       */
      {
        kind: 'system', id: 'i05-echo-answer', text: 'You replied. The request moved to your chats.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'i05-after-answer', from: 'them',
        text: 'Perfect, thanks! Which unit is that? And do you go the same way back?', time: '08:31',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'i05-echo-deflect', from: 'me',
        text: 'Ha, I move around a lot! What got you into running?',
        time: '08:30', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'i05-after-deflect', from: 'them',
        text: 'Oh you know, the usual 😅 so which unit did you say you were with?', time: '08:31',
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
            name: 'Trail Fan',
            verified: false,
            avatarArt: 'trail',
            stats: { posts: '2', followers: '38', following: '3,908' },
            bio: ['🏃 fitness lover', '📍 everywhere', 'DM for routes'],
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Remove follower', 'Message'],
            following: true,
            aboutTo: 'about',
            commentsTo: 'comments',
            grid: [
              { art: 'trail', title: '', note: 'Reposted · 3 days ago' },
              { art: 'trail', title: '', note: 'Reposted · 5 days ago' },
            ],
            note: 'Both posts are shared from other accounts.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (1 week ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [],
          },
          comments: {
            view: 'people',
            title: 'Recent activity',
            heading: 'Comments this account left on other people’s posts',
            people: [
              { handle: 'runner_ankit', name: '', note: '“Great pace! Which base are you near?”' },
              { handle: 'fitfauji_92', name: '', note: '“Nice route! Which unit and what time do you run?”' },
              { handle: 'morning_miles', name: '', note: '“Do you go the same way daily? Which sector?”' },
            ],
            note: 'Replies left on public posts in the last week.',
          },
        },
      }),

      /** The mutual the account claimed, reached the way the learner always reaches him. */
      'call-karan': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Karan (run club)',
        number: '+91 00000 91340',
        script: [
          { at: 0, speaker: 'them', text: 'Hey, morning! What’s up?' },
          { at: 4, speaker: 'you', text: 'Do you know an account called trail_fan_87? He says he knows you from the club.' },
          { at: 9, speaker: 'them', text: 'Never heard of him. Nobody by that name runs with us.' },
          { at: 14, speaker: 'them', text: 'Wait - someone messaged me last week asking where you guys start from. I ignored it.' },
        ],
      },

      /** The learner's own account, for the "review profile privacy" half of stage 6. */
      privacy: social({
        title: 'Account privacy',
        home: 'privacy',
        pages: {
          privacy: {
            view: 'status',
            title: 'Account privacy',
            heading: `Your account · @${LEARNER.handle}`,
            statusRows: [
              { label: 'Private account', value: 'Off - anyone can see your posts and stories.', ok: false },
              { label: 'Location on stories', value: 'Added to 23 of your last 30 stories.', ok: false },
              { label: 'Who can reply to your stories', value: 'Everyone', ok: false },
              { label: 'Message requests', value: 'From anyone', ok: false },
            ],
            note: 'Changes here are yours to make. This simulation does not change any setting.',
          },
        },
      }),
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i05-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i05-c02', slot: SLOT.INLINE,
            label: 'Reply “Thanks! Falcon Town, lake loop 🙂” from the preview',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i05-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, posts, following and activity',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i05-c04', slot: SLOT.MENU,
            label: 'Read the whole conversation',
          }),
          action({
            id: 'i05-c05', slot: SLOT.MENU,
            label: 'Just answer the questions',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i05-c06', slot: SLOT.COMPOSER,
            label: 'Send your city and side of town',
            echo: 'Southern side, near the cantonment.',
          }),
          action({
            id: 'i05-c07', slot: SLOT.COMPOSER,
            label: 'Send your unit', echo: 'I’m with the unit near the cantonment lines.',
          }),
          action({
            id: 'i05-c08', slot: SLOT.COMPOSER,
            label: 'Send your daily route and time', echo: 'Same trail every morning, out by 6.',
          }),
          action({
            id: 'i05-c09', slot: SLOT.COMPOSER,
            label: 'Ask them a friendly question back', echo: 'Ha, I move around a lot! What got you into running?',
          }),
          action({
            id: 'i05-c10', slot: SLOT.MENU,
            label: 'Don’t reply to the questions',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i05-c11', slot: SLOT.MENU,
            label: 'Phone Karan from the run club and ask if he knows this account',
            hint: 'Check outside the DM before trusting it', opens: 'call-karan',
          }),
          action({
            id: 'i05-c12',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i05-c13',
            slot: SLOT.MENU, label: 'Ask the account itself who it really is',
          }),
          action({ id: 'i05-c14', slot: SLOT.MENU, label: 'Report the account' }),
          action({ id: 'i05-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i05-c16', slot: SLOT.INLINE,
            label: 'Restrict and report the account',
          }),
          action({
            id: 'i05-c17', slot: SLOT.INLINE,
            label: 'Accept the request and reply later',
          }),
          action({
            id: 'i05-c18', slot: SLOT.MENU,
            label: `Block ${handle} and review your privacy`,
          }),
          action({
            id: 'i05-c19', slot: SLOT.MENU,
            label: 'Go back and answer their questions',
          }),
          action({
            id: 'i05-c20', slot: SLOT.MENU,
            label: 'Close it and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i05-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i05-nav-privacy', slot: SLOT.MENU, label: 'Settings › Account privacy', opens: 'privacy', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i05-dir-cell',
        name: 'Unit Security Cell (social media)',
        identifier: '+91 00000 91282',
        provenance: 'local approved directory',
        role: 'Report accounts asking service members for location, unit or routine.',
      },
    ],
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, caption, comment, directory, headline, receivedAt, social, splitHeadline, system,
} from './shared.js'

/**
 * I03 - Published Blood-Donation Drive (IMMERSIVE-004A). The LEGITIMATE control.
 *
 * A verified public-information account the learner already follows posts an approved blood
 * donation drive, with a poster, a date and a venue, and no external registration of any
 * kind. The right answer is to use it normally - save it, or share it because it carries the
 * approved-for-release marker - and NOT to report or block a legitimate sender.
 *
 * The judgement the client asks for is the mirror image of the four malicious Instagram
 * items, and it must be as substantial as they are, or its thinness would give it away. So
 * it gets a real profile with a long verified history, an "About this account" page that
 * says it joined years ago and has never changed its name, comments from other real unit
 * accounts, and a directory row that matches. Everything that would be a tell on a scam - a
 * link, a login, a fee, a countdown, a DM - is deliberately ABSENT, and the learner has to
 * notice the absence rather than a red flag.
 *
 * The trap is over-reaction: reporting a genuine unit account (-4), needlessly ignoring an
 * approved post (-2), or moving it to an untrusted channel (-4, e.g. reposting off-platform / DMing donors
 * personal details).
 */
export function buildI03(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  return {
    scenarioId: 'I03',
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
              id: 'i03-row',
              handle,
              verified: true,
              text: headline(scenario),
              detail: 'shared a new post',
              time: '15m',
              art: 'poster',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i03-bg-1', handle: 'coy_clerk_falcon', text: 'coy_clerk_falcon liked your comment.', time: '2h', inert: true },
            { id: 'i03-bg-2', handle: 'unit_sports_cell', text: 'unit_sports_cell started following you.', time: '5h', button: 'Follow back', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      screenTitle: 'Posts',
      handle,
      name: 'Unit Falcon (Public Information)',
      subline: 'Public information',
      verified: true,
      slides: [
        { art: 'poster', title: 'BLOOD DONATION', subtitle: '05 Sep · Civic Hall' },
      ],
      likes: '486 likes',
      time: `Today · ${receivedAt(scenario) ?? '15:45'}`,
    },

    beats: [
      caption('i03-caption', {
        author: handle,
        verified: true,
        text: `${text} Walk-in from 0900 to 1600. Bring a photo ID. Refreshments provided. Organised with the station hospital. Approved for public release: PA/FAL/2026/214. #blooddonation #unitfalcon`,
        tags: ['station_hospital_falcon'],
        time: '15 minutes ago',
      }),
      system('i03-marker', 'This post is marked Approved for public release by its author.'),
      comment('i03-c1', { author: 'coy_clerk_falcon', text: 'Sharing with the company. Good cause 🙌', time: '12m', likes: 6 }),
      comment('i03-c2', { author: 'station_hospital_falcon', verified: true, text: 'We’ll have four beds ready. See everyone there.', time: '9m', likes: 11 }),
      comment('i03-c3', { author: 'meera.dsouza', text: 'Count me in. Is O- especially needed?', time: '6m' }),
      comment('i03-c4', { author: handle, verified: true, text: 'All groups welcome, Meera. O- and O+ especially. Thank you!', time: '4m', reply: true }),

      /**
       * Stage 4: somebody else arrives in the comments with a faster way to register. The
       * post itself asks for nothing; the pull towards another channel comes from a stranger
       * underneath it, which is where it comes from in practice.
       */
      comment('i03-c5', {
        author: 'donor_link_fast',
        text: 'Skip the queue 🩸 reply with your blood group + number and I’ll pre-register you. Link in my bio for the form.',
        time: '1m',
        since: 'branch',
      }),

      {
        kind: 'comment', id: 'i03-after-reply', author: 'rao.outdoors',
        text: '@donor_link_fast B+ · +91 00000 71842, please register me',
        time: 'now', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'comment', id: 'i03-after-reply-2', author: 'donor_link_fast',
        text: 'Done ✅ DM me your unit and a photo ID to confirm your slot.',
        time: 'now', since: 'verify', afterConsequence: 'simulated_reply_sent',
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
            name: 'Unit Falcon (Public Information)',
            category: 'Government organisation',
            verified: true,
            avatarArt: 'crest',
            stats: { posts: '312', followers: '18.4K', following: '46' },
            bio: ['Official public-information account', 'Approved releases only', 'Not monitored 24/7'],
            mutuals: 'Followed by coy_clerk_falcon and 40 others',
            buttons: ['Following', 'Message'],
            following: true,
            aboutTo: 'about',
            grid: [
              { art: 'poster', title: 'Blood donation', note: 'Today' },
              { art: 'crest', title: 'Republic Day', note: 'Jan 2026' },
              { art: 'poster', title: 'Marathon', note: 'Dec 2025' },
              { art: 'crest', title: 'Recruitment', note: 'Nov 2025' },
              { art: 'poster', title: 'Open day', note: 'Oct 2025' },
              { art: 'crest', title: 'Founding day', note: 'Sep 2025' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'February 2019' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'Since 2020' },
            ],
            formerUsernames: [],
            note: 'This account has never changed its username.',
          },
        },
      }),

      'donor-form': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            url: 'https://donorfast.training.example/register',
            host: 'donorfast.training.example',
            title: 'Pre-registration',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'DF', name: 'Donor Fast-Track', tagline: 'Priority slots' },
              { type: 'heading', text: 'Reserve a priority slot' },
              {
                type: 'form',
                heading: 'Your details',
                fields: [
                  field({ name: 'name', label: 'Full name', length: 3, max: 40 }),
                  field({ name: 'group', label: 'Blood group', length: 2, max: 3 }),
                  field({ name: 'mobile', label: 'Mobile number', kind: FIELD_KIND.DIGITS, length: 10 }),
                  field({ name: 'unit', label: 'Unit and service number', length: 4, max: 30 }),
                ],
              },
            ],
          },
        },
      },

      'call-desk': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name || 'Unit Falcon Support Desk',
        number: desk.identifier || '+91 00000 14735',
        script: [
          { at: 0, speaker: 'them', text: 'Support desk, good afternoon.' },
          { at: 4, speaker: 'you', text: 'Is the blood donation post on Instagram from the unit?' },
          { at: 8, speaker: 'them', text: `Yes, that’s ours - @${handle}. 05 Sep, Civic Hall, walk in with a photo ID.` },
          { at: 13, speaker: 'them', text: 'There is no registration and no form. We never ask for details in comments.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i03-c01', slot: SLOT.INLINE,
            label: `Open ${handle}’s post`,
          }),
          action({
            id: 'i03-c02', slot: SLOT.INLINE,
            label: 'Comment “Count me in!” from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i03-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Verified account, post history and details',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i03-c04', slot: SLOT.MENU,
            label: 'Read the comments',
          }),
          action({
            id: 'i03-c05', slot: SLOT.MENU,
            label: 'Act on the post without checking',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i03-c06', slot: SLOT.INLINE,
            label: 'Save the post',
          }),
          action({
            id: 'i03-c07', slot: SLOT.MENU,
            label: 'Share it to your story',
          }),
          action({
            id: 'i03-c08', slot: SLOT.MENU,
            label: 'Mute the account so it stops posting',
          }),
          action({
            id: 'i03-c09', slot: SLOT.MENU,
            label: 'Register through the form donor_link_fast posted', opens: 'donor-form',
          }),
          action({
            id: 'i03-c10', slot: SLOT.MENU,
            label: 'Reply to donor_link_fast with your blood group and number',
          }),
          action({
            id: 'i03-c11', slot: SLOT.MENU,
            label: 'Repost it to an outside donors’ WhatsApp with your unit and address',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i03-c12',
            slot: SLOT.MENU, label: `Compare the handle with the official-account directory`,
            hint: 'Check it against the local approved list', targetId: directoryAsset,
          }),
          action({
            id: 'i03-c13', slot: SLOT.MENU,
            label: `Call ${desk.name || 'the unit support desk'} on the directory number`,
            opens: 'call-desk',
          }),
          action({
            id: 'i03-c14',
            slot: SLOT.MENU, label: `DM ${handle} to ask if the post is really theirs`,
          }),
          action({ id: 'i03-c15', slot: SLOT.MENU, label: 'Report the post' }),
          action({ id: 'i03-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i03-c17', slot: SLOT.INLINE,
            label: 'Keep the post and share it normally',
          }),
          action({
            id: 'i03-c18', slot: SLOT.INLINE,
            label: 'Report the post to Instagram',
          }),
          action({
            id: 'i03-c19', slot: SLOT.MENU,
            label: 'Save it and do nothing further',
          }),
          action({
            id: 'i03-c20', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i03-c21', slot: SLOT.MENU,
            label: 'Mute and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i03-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i03-dir-falcon',
        name: 'Unit Falcon (Public Information)',
        identifier: `@${handle}`,
        provenance: 'local approved directory',
        role: 'Verified official public-information account for approved releases.',
      },
    ],
  }
}

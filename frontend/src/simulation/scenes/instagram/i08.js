import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, link, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I08 - Verification Badge Agent (IMMERSIVE-004B).
 *
 * A message request from an "agent" says the learner's profile is pre-approved for the blue
 * badge - authenticity score 94/100, two priority slots left today, pay a one-time fee and the
 * badge is guaranteed in 24 hours. The lever is status and scarcity, not fear: nothing is
 * threatened, something desirable is offered, and it is about to go.
 *
 * What makes it its own Instagram lesson rather than I02 again (a threat settled in Account
 * Status) is the thing being judged. The agent's name ends in a ✔️ emoji, which sits exactly
 * where a badge would; its pinned "client results" are screenshots; its tagged "clients" are
 * days old. The real badge is part of the app and shows on About this account - and the app's
 * own "Request verification" page and Help Center say who reviews requests, what it costs,
 * and that no third party can submit, speed up or guarantee one. The resolution includes the
 * client's "use only official in-app verification if desired": the aspiration is not wrong,
 * the route is.
 *
 * The decision is taken on the application the link opens - an ID number, the Instagram
 * password "so our team can apply from inside your account", and the priority fee.
 */
export function buildI08(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const name = 'Badge Priority Agent ✔️'
  const host = 'badgepriority.training.example'
  const root = `https://${host}/apply`

  return {
    scenarioId: 'I08',
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
            { id: 'i08-row', handle, name, preview: text, time: '7m', request: true, unread: true },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i08-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'Dev: 200 followers today?? 🔥', time: '1h', inert: true },
            { id: 'i08-bg-2', handle: 'nisha.bakes', name: 'Nisha', preview: 'sent a reel', time: '3h', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i08-request', {
        name,
        handle,
        verified: false,
        stats: { posts: '21', followers: '12.6K', following: '7,480' },
        relation: 'Not following each other · joined 9 days ago',
      }),
      day('i08-day', 'MESSAGE REQUEST'),
      them('i08-b1', `Hi @${LEARNER.handle} 👋 congratulations!`, '12:58'),
      them('i08-b2', text, '12:59'),
      them('i08-b3', 'Our partner desk reviewed your trek reels: authenticity score 94/100 ✅ You qualify for the blue badge.', '12:59'),
      link('i08-link', {
        title: 'Priority Verification Application',
        description: 'Pre-approved profiles only · 2 minutes',
        displayUrl: `${host}/apply`,
        time: '13:00',
      }),
      them('i08-b4', 'One-time fee INR 2,999. Badge in 24 hours or full refund 💯', '13:00'),

      them('i08-b5', 'Only 2 priority slots left today. Your pre-approval expires at 6 PM ⏳', '13:04', { since: 'branch' }),

      {
        kind: 'message', id: 'i08-echo-reply', from: 'me', text: 'How can you guarantee a badge?',
        time: '13:05', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'i08-after-reply', from: 'them',
        text: 'We are an official partner agency 🤝 100% success rate. Apply before 6 PM or the slot goes to the next profile.',
        time: '13:05', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i08-after-submit', tone: 'banner',
        text: 'Your password was changed and two-factor authentication was turned off. If this wasn’t you, secure your account.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'i08-after-pay', from: 'them',
        text: 'Payment received ✅ Final step: refundable review deposit INR 4,999 so the team can submit today.',
        time: '13:09', since: 'verify', afterConsequence: 'simulated_payment',
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
            category: 'Digital creator',
            verified: false,
            avatarArt: 'award',
            stats: { posts: '21', followers: '12.6K', following: '7,480' },
            bio: ['✔️ Blue badge in 24h, guaranteed', '🤝 Partner agency · 2,000+ clients', '📩 DM for pre-approval'],
            bioLink: { label: `${host}/apply`, to: 'application' },
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'results',
            compareTo: { label: 'Tagged: “clients”', to: 'clients' },
            grid: [
              { art: 'award', title: 'Client results', note: 'Pinned' },
              { art: 'text', title: 'Pre-approved ✅', note: '2 days ago' },
              { art: 'award', title: 'Verified in 24h', note: '4 days ago' },
              { art: 'text', title: 'Last slots', note: '6 days ago' },
              { art: 'award', title: '100% success', note: '8 days ago' },
              { art: 'text', title: 'DM us', note: '9 days ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (9 days ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'followers.boost.india', when: 'August 2026' },
              { handle: 'insta.growth.hacks', when: 'September 2026' },
            ],
          },
          results: {
            view: 'post',
            handle,
            name,
            verified: false,
            subline: 'Pinned',
            slides: [
              { art: 'award', title: 'CLIENT RESULTS ✔️', subtitle: 'Screenshots from happy clients' },
              { art: 'text', title: '“Verified in 24h!”', subtitle: 'screenshot · name hidden' },
            ],
            likes: '96 likes',
            caption: 'Another week, another 40 blue badges ✔️ Stop waiting for Instagram. Pre-approval by DM only.',
            comments: [
              { author: 'r.k_vlogs', text: 'Paid 2,999 two weeks ago. Still no badge and no reply to my DMs.' },
              { author: handle, text: 'check DM bro 🙏 high demand' },
              { author: 'hema.creates', text: 'they asked me for my password too??' },
            ],
            time: 'Pinned · 8 days ago',
          },
          clients: {
            view: 'people',
            title: 'Tagged',
            heading: 'Accounts tagged as clients',
            people: [
              { handle: 'priya.lifestyle.official', name: 'Priya ✔️', note: 'Joined 12 days ago' },
              { handle: 'fit.with.aman.official', name: 'Aman ✔️', note: 'Joined 11 days ago' },
              { handle: 'travel.diaries.verified', name: 'Travel Diaries ✔️', note: 'Joined 10 days ago' },
            ],
            note: 'Accounts this page has tagged in its client posts.',
          },
        },
      }),

      /** Settings › Account type and tools › Request verification, and the Help Center, locally. */
      official: social({
        title: 'Settings',
        home: 'settings',
        pages: {
          settings: {
            view: 'settings',
            title: 'Settings and activity',
            username: LEARNER.handle,
            rows: [
              { label: 'Account type and tools', value: 'Request verification, professional tools', to: 'request' },
              { label: 'Help', value: 'Help Center: verified badges', to: 'help' },
              { label: 'Account Status', value: 'See if your account can be recommended' },
            ],
          },
          request: {
            view: 'status',
            title: 'Request verification',
            heading: 'Verification is requested here',
            statusRows: [
              { label: 'Who reviews it', value: 'Instagram reviews every request itself.', ok: true },
              { label: 'What it costs', value: 'Requesting a review is free. The optional paid subscription is only sold in this app, under Settings.', ok: true },
              { label: 'Third parties', value: 'No agent, partner or page can submit, speed up or guarantee a badge.', ok: true },
              { label: 'Your account', value: 'You have not requested verification.', ok: false },
            ],
            note: 'If you want a badge, you can request it from this screen at any time.',
          },
          help: {
            view: 'status',
            title: 'Help Center',
            heading: 'Verified badges',
            statusRows: [
              { label: 'A badge in a name', value: 'A ✔️ typed into a name or bio is text. A real badge sits beside the username and is listed on About this account.', ok: true },
              { label: 'Your password', value: 'Instagram never asks for it, or for two-factor to be turned off, to verify you.', ok: true },
              { label: 'Offers by message', value: 'Instagram does not sell or promise badges in DMs or comments.', ok: true },
            ],
          },
        },
      }),

      application: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'apply',
        pages: {
          apply: {
            url: root,
            host,
            title: 'Priority verification',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'BP', name: 'Badge Priority Desk', tagline: 'Verification partner' },
              { type: 'heading', text: 'Your profile is pre-approved ✅' },
              {
                type: 'summary',
                rows: [
                  { label: 'Profile', value: `@${LEARNER.handle}` },
                  { label: 'Authenticity score', value: '94 / 100' },
                  { label: 'Badge delivery', value: 'Within 24 hours, guaranteed' },
                  { label: 'Priority slots left', value: '2 today', strong: true },
                  { label: 'Fee', value: 'INR 2,999 (one time)' },
                ],
              },
            ],
            primary: { label: 'Start application', to: 'identity' },
          },
          identity: {
            url: `${root}/identity`,
            host,
            title: 'Identity',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Step 1 of 3 · Identity' },
              {
                type: 'form',
                heading: 'As on your government ID',
                fields: [
                  field({ name: 'fullname', label: 'Full name', length: 3, max: 40 }),
                  field({ name: 'idnumber', label: 'Government ID number', kind: FIELD_KIND.DIGITS, length: 12, group: 4 }),
                  field({ name: 'dob', label: 'Date of birth (DD/MM/YYYY)', length: 8, max: 10 }),
                ],
              },
              { type: 'fineprint', text: 'Photos of the ID card are collected by your agent after payment.' },
            ],
            primary: { label: 'Continue', to: 'access' },
          },
          access: {
            url: `${root}/access`,
            host,
            title: 'Account access',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Step 2 of 3 · Account access' },
              { type: 'notice', text: 'Our team submits the request from inside your account, so we log in once. Turn off two-factor authentication for 24 hours.' },
              {
                type: 'form',
                heading: 'Instagram login',
                fields: [
                  field({ name: 'username', label: 'Username', length: 3, max: 30 }),
                  field({ name: 'password', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
            ],
            primary: { label: 'Review application', to: 'review' },
            links: [{ id: 'i08-fee-link', label: 'Step 3 · Pay the priority fee', to: 'fee' }],
          },
          review: {
            url: `${root}/review`,
            host,
            title: 'Review',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Submit your application?' },
              {
                type: 'summary',
                rows: [
                  { label: 'Sent to', value: 'Badge Priority Desk' },
                  { label: 'Includes', value: 'Your ID number and your Instagram login' },
                ],
              },
            ],
            links: [{ id: 'i08-fee-link-2', label: 'Pay the priority fee', to: 'fee' }],
          },
          done: {
            url: `${root}/review`,
            host,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Application received', text: 'Your agent will message you to finish verification.' },
            ],
          },
        },
      },

      fee: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: 'INR 2,999.00',
        subtitle: 'Priority verification fee',
        rows: [
          { label: 'To', value: 'BP VERIFY SERVICES' },
          { label: 'UPI ID', value: 'bpverify.desk@trainingpay' },
          { label: 'Note', value: 'PRIORITY-SLOT-2' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i08-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i08-c02', slot: SLOT.INLINE,
            label: 'Reply “Yes, I want the badge!” without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i08-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, clients and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i08-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i08-c05', slot: SLOT.MENU,
            label: 'Go straight to the application',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i08-c06', slot: SLOT.SURFACE, on: 'application', page: 'review',
            label: 'Submit application', thenPage: 'done',
          }),
          action({
            id: 'i08-c07', slot: SLOT.SURFACE, on: 'fee',
            label: 'Pay INR 2,999', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i08-c08', slot: SLOT.SURFACE, on: 'application',
            label: 'Close the application', closes: true,
          }),
          action({
            id: 'i08-c09', slot: SLOT.COMPOSER,
            label: 'Ask how they can guarantee a badge', echo: 'How can you guarantee a badge?',
          }),
          action({
            id: 'i08-c10', slot: SLOT.MENU,
            label: 'Leave the request without applying',
          }),
          navigate({ id: 'i08-nav-apply', slot: SLOT.INLINE, anchor: 'i08-link', label: 'Open the application', opens: 'application' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i08-c11', slot: SLOT.MENU,
            label: 'Open Settings › Request verification yourself',
            hint: 'The app’s own verification page and Help Center', opens: 'official',
          }),
          action({
            id: 'i08-c12',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i08-c13',
            slot: SLOT.MENU, label: `Ask ${handle} for proof they are a partner`,
          }),
          action({ id: 'i08-c14', slot: SLOT.MENU, label: 'Report the request' }),
          action({ id: 'i08-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i08-c16', slot: SLOT.INLINE,
            label: 'Keep the request until 6 PM and decide then',
          }),
          action({
            id: 'i08-c17', slot: SLOT.INLINE,
            label: 'Report the account; request a badge in Settings if you want one',
          }),
          action({
            id: 'i08-c18', slot: SLOT.MENU,
            label: `Block ${handle} and delete the request`,
          }),
          action({
            id: 'i08-c19', slot: SLOT.MENU,
            label: 'Go back and take the priority slot',
          }),
          action({
            id: 'i08-c20', slot: SLOT.MENU,
            label: 'Close the request and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i08-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i08-nav-settings', slot: SLOT.MENU, label: 'Settings › Request verification', opens: 'official', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i08-dir-ig',
        name: 'Instagram (in-app verification)',
        identifier: 'Settings › Account type and tools › Request verification',
        provenance: 'local approved directory',
        role: 'Badges are requested and reviewed inside the app. No outside agency takes part.',
      },
    ],
  }
}

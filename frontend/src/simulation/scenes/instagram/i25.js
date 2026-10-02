import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  asset, assetId, browserPage, caption, comment, directory, social, splitHeadline,
} from './shared.js'

/**
 * I25 - Canteen Coupon Reel QR (IMMERSIVE-004E). Hard. The last Instagram scene.
 *
 * A suggested reel from a "community" account: canteen coupon packs for service families, the
 * first 200 only, and at 0:06 a QR code fills the frame. The account's own pinned comment says to
 * scan it, or use the link in bio, and that a service number is needed "to confirm eligibility".
 *
 * What is Instagram-native and new to the product:
 *
 * - the code is **inside a reel**, which Instagram cannot open, so the learner has to take it out
 *   of the app - a screenshot read by the phone's own scanner - and the scanner shows where it
 *   goes before anything opens;
 * - the reel's **audio credit** is a link, and the audio page shows the sound (and the counter
 *   photo) first appeared on the welfare page's own notice fourteen months ago - the copied
 *   imagery is found through the app's own attribution, not a reverse-image tool;
 * - the scripted "Done ✅ got my pack" comments sit beside a member asking whether the canteen
 *   office knows anything about it.
 *
 * W08 was a QR photo in a family group that went to a card-and-OTP page. I25's decision homes are
 * the scanner (Open link / Close), an eligibility form asking for service number, family members
 * and canteen card, a ₹49 "activation" sheet, and sharing the reel to the family group. The check
 * is the welfare notice board and the canteen office on the directory number.
 */
export function buildI25(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const qr = asset(scenario, ASSET_KIND.QR)
  const qrAsset = qr?.asset_id ?? null
  const qrTarget = qr?.content?.decoded_target ?? qr?.display_target ?? 'https://i25.training.example/qr'
  const page = browserPage(scenario)
  const formUrl = page?.display_target ?? 'https://i25.training.example/verify'
  const host = page?.content?.host ?? 'i25.training.example'
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const official = 'falconwelfare.official'
  const canteen = '+91 00000 73342'
  const name = 'Falcon Family Deals'
  const brand = { type: 'brand', monogram: 'FF', name, tagline: 'Service family coupon desk' }

  return {
    scenarioId: 'I25',
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
              id: 'i25-row',
              handle,
              detail: `${handle} posted a reel for Falcon families.`,
              text,
              time: '3m',
              art: 'giveaway',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i25-bg-1', handle: official, text: `${official} shared a post: canteen timings unchanged.`, time: '5h', art: 'cafe', inert: true },
            { id: 'i25-bg-2', handle: 'nisha.bakes', text: 'nisha.bakes liked your reel.', time: '8h', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      media: 'reel',
      screenTitle: 'Reels',
      handle,
      name,
      subline: 'Suggested for you',
      verified: false,
      avatarArt: 'giveaway',
      slides: [
        { art: 'cafe', title: 'Coupon packs', subtitle: '0:01 · for service families · the canteen counter' },
        { art: 'giveaway', title: '₹2,000 of groceries', subtitle: '0:03 · for Falcon families' },
        { art: 'text', title: '▦ SCAN NOW ▦', subtitle: '0:06 · the code fills the frame · 142/200 claimed' },
        { art: 'cafe', title: 'Ends tonight', subtitle: '0:09 · first 200 families only' },
      ],
      audio: `Original audio · ${official}`,
      likes: '2,118 likes',
      time: 'Reel · 3 hours ago',
    },

    beats: [
      caption('i25-caption', {
        author: handle,
        text: `${text} 🛒 Canteen coupon packs for service families. Scan at 0:06 or use the link in bio.`,
      }),
      comment('i25-pin', { author: handle, text: '📌 Pinned · Scan the code at 0:06 👆 58 packs left. Your service number confirms eligibility.', time: '3h' }),
      comment('i25-c1', { author: 'meena_familyfirst', text: 'Done ✅ got my pack in 2 min', time: '2h', likes: 41 }),
      comment('i25-c2', { author: 'priya.k_falcon', text: 'Done ✅ got my pack in 2 min!!', time: '2h', likes: 39 }),
      comment('i25-c3', { author: 'rohan.dsilva', text: 'is this from the canteen office? their page has nothing about it', time: '1h', likes: 6 }),
      comment('i25-c4', { author: handle, text: '@rohan.dsilva community partner 🤝 limited stock, hurry', time: '1h', reply: true }),

      comment('i25-c5', { author: handle, text: '🔥 20 packs left', time: 'now', since: 'branch' }),

      {
        kind: 'system', id: 'i25-after-open', tone: 'banner',
        text: `The code opened ${host}, a page that asks for your service number before it shows any coupon.`,
        since: 'verify', afterConsequence: 'simulated_qr_inspect',
      },
      {
        kind: 'system', id: 'i25-after-form', tone: 'banner',
        text: '“Eligibility confirmed ✅ Pay the ₹49 activation to receive your pack.”',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i25-after-pay', tone: 'banner',
        text: '₹49 went to a personal UPI ID. The page now asks for ₹499 “delivery security”.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'i25-after-share', tone: 'banner',
        text: 'The reel is now in your family group, sent by you. Your aunt has already asked for the link.',
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
            name,
            category: 'Community',
            verified: false,
            following: false,
            avatarArt: 'giveaway',
            stats: { posts: '27', followers: '9,860', following: '1,412' },
            bio: ['Deals for service families', 'Community partner · coupons · offers'],
            bioLink: { label: formUrl.replace(/^https:\/\//, ''), to: 'coupon' },
            mutuals: 'Followed by meena_familyfirst and 2 others',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            compareTo: { to: 'search', label: 'Search “falcon welfare”' },
            grid: [
              { art: 'giveaway', title: '', note: 'Reel' },
              { art: 'cafe', title: '', note: 'Reel' },
              { art: 'award', title: '', note: 'Reel' },
              { art: 'cafe', title: '', note: 'Post' },
              { art: 'giveaway', title: '', note: 'Reel' },
              { art: 'notice', title: '', note: 'Post' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'August 2026' },
              { label: 'Account based in', value: 'Not shown' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '3' },
            ],
            formerUsernames: [
              { handle: 'mega_coupon_zone', when: '5 weeks ago' },
              { handle: 'quick.deals.hub', when: '3 weeks ago' },
            ],
          },
          search: {
            view: 'search',
            title: 'Search',
            query: 'falcon welfare',
            results: [
              { handle: official, name: 'Unit Falcon Welfare', verified: true, note: '14.9K followers', to: 'official' },
              { handle, name, note: '9,860 followers' },
              { handle: 'falcon.canteen.offers', name: 'Canteen Offers', note: '212 followers · 0 posts' },
            ],
          },
          official: {
            view: 'profile',
            handle: official,
            name: 'Unit Falcon Welfare',
            category: 'Community service',
            verified: true,
            following: true,
            avatarArt: 'crest',
            stats: { posts: '318', followers: '14.9K', following: '12' },
            bio: ['Canteen and welfare notices for Unit Falcon families', 'Offers are announced here and at the canteen counter'],
            mutuals: 'Followed by nisha.bakes, anjali.m and 88 others you follow',
            buttons: ['Following', 'Message'],
            pinnedTo: 'notice',
            grid: [
              { art: 'cafe', title: '', note: 'Timings' },
              { art: 'notice', title: '', note: 'Notice' },
              { art: 'giveaway', title: '', note: 'Counter' },
            ],
          },
          notice: {
            view: 'post',
            handle: official,
            verified: true,
            subline: 'Pinned',
            slides: [{ art: 'cafe', title: 'Canteen timings', subtitle: 'The main counter' }],
            likes: '1,902 likes',
            caption: 'Canteen timings for the season. Photo: the main counter. Offers are only ever announced here and at the counter.',
            time: 'July 2025',
          },
        },
      }),

      /** The reel's audio page, reached from the audio credit. */
      audio: social({
        title: 'Audio',
        home: 'audio',
        pages: {
          audio: {
            view: 'list',
            title: 'Audio',
            heading: `Original audio · ${official}`,
            rows: [
              { art: 'cafe', title: official, text: 'Canteen timings notice', meta: 'July 2025 · original' },
              { art: 'giveaway', title: handle, text: 'Coupon packs for service families', meta: '3 hours ago' },
              { art: 'giveaway', title: 'falcon.canteen.offers', text: 'Coupon packs for families', meta: 'Yesterday' },
            ],
            note: '3 reels use this audio.',
          },
        },
      }),

      /** The phone's scanner, reading the code from a screenshot of the paused reel. */
      scanner: {
        kind: SURFACE.VIEWER,
        title: 'Scan result',
        subtitle: 'Read from your screenshot',
        art: 'qr',
        label: 'Code from the reel at 0:06',
        heading: 'This code opens a web address',
        rowsHeading: 'Decoded contents',
        rows: [
          { label: 'Type', value: 'Web address' },
          { label: 'Opens', value: qrTarget },
          { label: 'Host', value: host },
          { label: 'Page name', value: `${name} · coupon desk` },
          { label: 'Read from', value: 'Screenshot · today 11:58' },
        ],
        note: 'Nothing opens until you choose to.',
        backLabel: 'Close the scanner',
        inertNote: 'Decoded locally from a screenshot. No camera was used and nothing was opened.',
      },

      /** Where the code (and the bio link) go. */
      coupon: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'claim',
        pages: {
          claim: {
            url: qrTarget,
            host,
            secure: false,
            title: `${name} - claim`,
            blocks: [
              brand,
              { type: 'heading', text: 'Claim your coupon pack' },
              { type: 'text', text: '58 of 200 packs left. Confirm eligibility, then activate.' },
              {
                type: 'summary',
                rows: [
                  { label: 'Pack', value: '₹2,000 of groceries' },
                  { label: 'Activation', value: '₹49, one time' },
                  { label: 'Delivery', value: 'To the address on your canteen card' },
                ],
              },
            ],
            links: [
              { id: 'i25-claim-eligible', label: 'Confirm eligibility', to: 'eligibility' },
              { id: 'i25-claim-fee', label: 'Pay the activation first', to: 'fee' },
            ],
          },
          eligibility: {
            url: formUrl,
            host,
            secure: false,
            title: `${name} - eligibility`,
            blocks: [
              brand,
              { type: 'heading', text: 'Service family eligibility' },
              {
                type: 'form',
                fields: [
                  field({ name: 'svc', label: 'Service number', length: 5, max: 12 }),
                  field({ name: 'relation', label: 'Your relationship to the service member', length: 3, max: 20 }),
                  field({ name: 'family', label: 'Names of family members on the card', length: 3, max: 60 }),
                  field({ name: 'card', label: 'Canteen card number', kind: FIELD_KIND.DIGITS, length: 10, group: 5 }),
                ],
              },
            ],
            primary: { label: 'Continue', to: 'review' },
          },
          review: {
            url: formUrl,
            host,
            secure: false,
            title: `${name} - review`,
            blocks: [
              brand,
              { type: 'heading', text: 'Check your details' },
              {
                type: 'summary',
                rows: [
                  { label: 'Sent to', value: name },
                  { label: 'Includes', value: 'Service number, relationship, family names, canteen card' },
                  { label: 'Next', value: '₹49 activation' },
                ],
              },
            ],
          },
          done: {
            url: formUrl,
            host,
            secure: false,
            title: `${name} - confirmed`,
            final: true,
            blocks: [
              brand,
              { type: 'result', heading: 'Eligibility', text: 'Confirmed ✅', rows: [{ label: 'Next', value: 'Pay ₹49 to receive your pack' }] },
            ],
          },
        },
      },

      fee: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: '₹49',
        subtitle: 'Coupon pack activation',
        rows: [
          { label: 'To', value: 'Deepak S' },
          { label: 'UPI ID', value: 'deepak.s4471@trainingpay' },
          { label: 'Note', value: 'FFD-ACT-142' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'UPI payments to a person cannot be reversed by the app.',
      },

      /** The unit's own notice board: the client's "known canteen/welfare notice route". */
      notices: {
        kind: SURFACE.APP,
        appName: 'Welfare Notices',
        appTagline: 'Unit Falcon · canteen and welfare',
        hero: {
          label: 'Canteen and welfare · this month',
          value: 'No coupon scheme',
          caption: 'Offers are announced only on this board and at the canteen counter.',
          chips: ['Official board', 'Updated 07:00 today'],
        },
        sections: [
          {
            id: 'i25-notices-now',
            heading: 'Current notices',
            rows: [
              { label: 'Canteen timings', value: 'Unchanged' },
              { label: 'Festival counter', value: 'Opens 20 October, at the counter only' },
              { label: 'Online orders', value: 'Not offered' },
            ],
          },
          {
            id: 'i25-notices-check',
            heading: 'How to check an offer',
            rows: [
              { label: 'Canteen office', value: canteen },
              { label: 'Official page', value: `@${official}` },
            ],
            note: 'The canteen never asks for service numbers, card numbers or fees online.',
          },
        ],
        tabs: [
          { label: 'Notices', icon: 'home' },
          { label: 'Archive', icon: 'history' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Canteen office',
        number: canteen,
        script: [
          { at: 0, speaker: 'them', text: 'Canteen office.' },
          { at: 3, speaker: 'you', text: 'There’s a reel offering coupon packs for service families with a QR code. Is it yours?' },
          { at: 9, speaker: 'them', text: 'No. There is no coupon scheme and we never take service numbers or fees online. Please report it - two families have called about it already.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i25-c01', slot: SLOT.INLINE,
            label: `Open ${handle}’s reel`,
          }),
          action({
            id: 'i25-c02', slot: SLOT.INLINE,
            label: 'Open the coupon link straight from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i25-c03', slot: SLOT.INLINE, anchor: 'i25-pin',
            label: 'Read the code from a screenshot, without opening it',
            targetId: qrAsset, opens: 'scanner',
          }),
          action({
            id: 'i25-c04', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, history and search',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i25-c05', slot: SLOT.MENU,
            label: 'Go straight to the coupon',
          }),
          navigate({ id: 'i25-nav-audio-inspect', slot: SLOT.INLINE, anchor: 'audio', label: 'Audio page', opens: 'audio' }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'i25-nav-scan', slot: SLOT.INLINE, anchor: 'i25-pin',
            label: 'Scan the code from a screenshot', opens: 'scanner',
          }),
          navigate({ id: 'i25-nav-audio', slot: SLOT.INLINE, anchor: 'audio', label: 'Audio page', opens: 'audio' }),
          action({
            id: 'i25-c06', slot: SLOT.SURFACE, on: 'scanner',
            label: 'Open link', targetId: qrAsset, opens: 'coupon',
          }),
          action({
            id: 'i25-c07', slot: SLOT.SURFACE, on: 'scanner',
            label: 'Close without opening', closes: true,
          }),
          action({
            id: 'i25-c08', slot: SLOT.SURFACE, on: 'coupon', page: 'review',
            label: 'Confirm eligibility', targetId: page?.asset_id ?? null, thenPage: 'done',
          }),
          action({
            id: 'i25-c09', slot: SLOT.SURFACE, on: 'fee',
            label: 'Pay ₹49', closes: true,
          }),
          action({
            id: 'i25-c10', slot: SLOT.MENU,
            label: 'Send the reel to your family group chat',
          }),
        ],
      },

      verify: {
        affordances: [
          navigate({ id: 'i25-nav-audio-verify', slot: SLOT.INLINE, anchor: 'audio', label: 'Audio page', opens: 'audio' }),
          action({
            id: 'i25-c11', slot: SLOT.MENU,
            label: 'Open Welfare Notices',
            hint: 'The unit’s canteen and welfare board', opens: 'notices',
          }),
          action({
            id: 'i25-c12', slot: SLOT.MENU,
            label: 'Ring the canteen office on the directory number',
            hint: canteen, opens: 'call',
          }),
          action({
            id: 'i25-c13',
            slot: SLOT.MENU, label: `Look up the canteen office and ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i25-c14',
            slot: SLOT.MENU, label: `Ask ${handle} in a comment whether it’s official`,
          }),
          action({ id: 'i25-c15', slot: SLOT.MENU, label: 'Report reel' }),
          action({ id: 'i25-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          navigate({ id: 'i25-nav-audio-resolve', slot: SLOT.INLINE, anchor: 'audio', label: 'Audio page', opens: 'audio' }),
          action({
            id: 'i25-c17', slot: SLOT.INLINE,
            label: 'Report the reel and the account, and tell the welfare office',
          }),
          action({
            id: 'i25-c18', slot: SLOT.INLINE,
            label: 'Save the reel in case the offer is real',
          }),
          action({
            id: 'i25-c19', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i25-c20', slot: SLOT.MENU,
            label: 'Scan it later if more families say it worked',
          }),
          action({
            id: 'i25-c21', slot: SLOT.MENU,
            label: 'Scroll on and say nothing',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i25-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i25-nav-scanner', slot: SLOT.MENU, label: 'Scan result', opens: 'scanner', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'i25-dir-canteen',
        name: 'Canteen office',
        identifier: canteen,
        provenance: 'local approved directory',
        role: 'Canteen timings, counter offers and card queries.',
      },
    ],
  }
}

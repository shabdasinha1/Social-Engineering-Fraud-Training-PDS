import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, caption, directory, headline, receivedAt, social,
  splitHeadline, system,
} from './shared.js'

/**
 * I01 - Flash Giveaway Winner (IMMERSIVE-004A).
 *
 * The client's scenario: an account the learner has never heard of tags them as the winner
 * of a giveaway they never entered, with ten minutes to claim through a link that wants a
 * social login and a small delivery fee.
 *
 * What makes it an Instagram scene rather than WhatsApp's festival voucher (W08) or parcel
 * fee (W02) is where the evidence lives. There is no message to read closely - there is a
 * POST, in the learner's Activity, that tags them among nineteen others, with comments
 * turned off. The claim is made in public, and the account making it has a public history:
 * a follower count out of proportion to what it follows, a grid of nothing but winner
 * graphics posted this week, and an "About this account" page that says it joined days ago
 * and has already had three names. The comparison that settles it is also native to the
 * app: search for the brand, and the brand's own verified account is the first result, with
 * a pinned post saying how its giveaways actually work.
 *
 * The decision is taken on the claim site the bio link opens - "Continue with Instagram",
 * then a delivery fee - or by doing what the post asks and sharing it.
 */
export function buildI01(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const claimUrl = browserAsset?.display_target ?? 'https://i01.training.example/verify'
  const claimHost = browserAsset?.content?.host ?? 'i01.training.example'
  const official = 'mega_rewards'

  const winnerSlides = [
    { art: 'giveaway', title: 'WINNERS 🎉', subtitle: 'Smart watch × 20' },
    { art: 'text', title: 'Claim in 10 minutes', subtitle: 'or we redraw' },
    { art: 'text', title: 'Link in bio', subtitle: 'Log in · confirm · delivery' },
  ]

  return {
    scenarioId: 'I01',
    platform: 'instagram',
    /** The toast names the account in the client's sentence, not the bank's placeholder. */
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
              id: 'i01-row',
              handle,
              text: headline(scenario),
              detail: 'mentioned you in a post',
              time: '2m',
              art: 'giveaway',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i01-bg-1', handle: 'nisha.bakes', text: 'nisha.bakes and 12 others liked your photo.', time: '1h', art: 'trail', inert: true },
            { id: 'i01-bg-2', handle: 'karan_m', text: 'karan_m started following you.', time: '3h', button: 'Following', inert: true },
          ],
        },
        {
          heading: 'This week',
          rows: [
            { id: 'i01-bg-3', handle: 'trekkers_pune', text: 'trekkers_pune, who you might know, is on Instagram.', time: '2d', button: 'Follow', inert: true },
            { id: 'i01-bg-4', handle: 'meera.dsouza', text: 'meera.dsouza commented: "Those hills 😍"', time: '4d', art: 'trail', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      screenTitle: 'Posts',
      handle,
      name: 'Mega Rewards 🎁 Giveaway',
      subline: 'Giveaway',
      verified: false,
      slides: winnerSlides,
      likes: '312 likes',
      time: `Today · ${receivedAt(scenario) ?? '10:19'}`,
    },

    beats: [
      caption('i01-caption', {
        author: handle,
        text: `🎉 CONGRATULATIONS to our 20 lucky winners! ${text} You were tagged because your account was picked for a Mega Rewards smart watch. Tap the link in our bio to claim. #megarewards #giveaway #winner`,
        tags: [LEARNER.handle, 'nisha.bakes', 'dev_fit', '+17 others'],
        time: '12 minutes ago',
      }),
      /** The client's sentence, verbatim, as the mention that brought the learner here. */
      system('i01-mention', `${headline(scenario)}`, { tone: 'mention' }),
      system('i01-limited', 'Comments on this post have been turned off.'),

      /** Stage 4: the account follows up while the learner is still on the post. */
      system('i01-dm-arrived', `${handle} sent you a message: "Hi winner 🎉 your watch is reserved for 10 minutes. Claim from the link in our bio before we redraw."`, { since: 'branch', tone: 'banner' }),

      {
        kind: 'system', id: 'i01-after-share', tone: 'banner',
        text: 'Shared to your story. 3 people have viewed it.',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i01-after-share-dm', tone: 'banner',
        text: `${handle} sent you a message: "Thanks for sharing! Now log in on the claim page so we can ship 📦"`,
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'i01-after-login', tone: 'banner',
        text: 'Someone tried to log in to your account from a new device. Was this you?',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i01-after-pay', tone: 'banner',
        text: `${handle} sent you a message: "Payment received ✅ One more step: customs clearance INR 1,499."`,
        since: 'verify', afterConsequence: 'simulated_payment',
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
            name: 'Mega Rewards 🎁 Giveaway',
            category: 'Shopping & retail',
            verified: false,
            avatarArt: 'giveaway',
            stats: { posts: '6', followers: '2,140', following: '7,480', followingTo: 'following' },
            bio: ['🎁 Official giveaway partner', '⏰ Winners claim in 10 min', '👇 Claim here'],
            bioLink: { label: claimHost + '/verify', to: 'claim' },
            mutuals: null,
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            grid: [
              { art: 'giveaway', title: 'WINNERS 🎉', note: 'Posted today' },
              { art: 'text', title: 'Last chance', note: 'Posted yesterday' },
              { art: 'giveaway', title: 'iPad × 5', note: 'Posted yesterday' },
              { art: 'text', title: 'Claim now', note: 'Posted 2 days ago' },
              { art: 'giveaway', title: 'Gift cards', note: 'Posted 2 days ago' },
              { art: 'giveaway', title: 'Earbuds', note: 'Posted 2 days ago' },
            ],
            tagged: { empty: 'No photos of this account.' },
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (2 days ago)' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'cricket_highlights_4k', when: 'August 2026' },
              { handle: 'rewardsdrop.daily', when: 'September 2026' },
            ],
          },
          following: {
            view: 'people',
            title: 'Following',
            heading: '7,480 accounts',
            people: [
              { handle: 'nisha.bakes', name: 'Nisha', note: 'Tagged in the winners post' },
              { handle: 'dev_fit', name: 'Dev', note: 'Tagged in the winners post' },
              { handle: LEARNER.handle, name: `${LEARNER.name} (you)`, note: 'Tagged in the winners post' },
              { handle: 'giveaway.hunter.22', name: '', note: '' },
              { handle: 'follow4follow_india', name: '', note: '' },
            ],
          },
        },
      }),

      /** The brand the handle borrows, found the way anyone would: the app's own search. */
      official: social({
        title: 'Search',
        home: 'search',
        pages: {
          search: {
            view: 'search',
            query: 'mega rewards',
            results: [
              { handle: official, name: 'Mega Rewards', verified: true, note: '1.2M followers', to: 'official-profile' },
              { handle, name: 'Mega Rewards 🎁 Giveaway', note: '2,140 followers', to: 'profile' },
              { handle: 'megarewards.winner', name: 'Mega Rewards Winner', note: '88 followers' },
            ],
          },
          'official-profile': {
            view: 'profile',
            handle: official,
            name: 'Mega Rewards',
            category: 'Shopping & retail',
            verified: true,
            avatarArt: 'brand',
            stats: { posts: '1,284', followers: '1.2M', following: '36' },
            bio: ['Falcon Mart’s loyalty programme 🛒', 'Points, offers and member events', 'Help: in the Falcon Mart app'],
            mutuals: 'Followed by nisha.bakes and 4 others',
            buttons: ['Follow', 'Message'],
            aboutTo: 'official-about',
            pinnedTo: 'official-rules',
            grid: [
              { art: 'notice', title: 'How our giveaways work', note: 'Pinned', to: 'official-rules' },
              { art: 'brand', title: 'Member week', note: '3 days ago' },
              { art: 'text', title: 'Double points', note: '1 week ago' },
              { art: 'brand', title: 'Store opening', note: '2 weeks ago' },
              { art: 'giveaway', title: 'July winners', note: 'July 2026' },
              { art: 'brand', title: 'App update', note: 'June 2026' },
            ],
          },
          'official-rules': {
            view: 'post',
            handle: official,
            name: 'Mega Rewards',
            verified: true,
            subline: 'Pinned',
            slides: [
              { art: 'notice', title: 'How our giveaways work', subtitle: 'Read before you claim' },
            ],
            likes: '18,406 likes',
            caption: 'How our giveaways work: 1) You enter by commenting on OUR post during the entry window. 2) Winners are announced in the caption of that same post, never by tagging. 3) We never ask winners to log in on a website, share a post or pay delivery, customs or any fee. 4) Our only account is @mega_rewards. Anything else using our name is not us - please report it.',
            comments: [
              { author: 'nisha.bakes', text: 'Got tagged by a "help" account yesterday, glad I checked 🙏' },
              { author: official, verified: true, text: 'Thanks for reporting it, Nisha. We have no help account.' },
            ],
            time: 'Pinned · March 2026',
          },
          'official-about': {
            view: 'about',
            title: 'About this account',
            handle: official,
            rows: [
              { label: 'Date joined', value: 'March 2016' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'Since 2019' },
            ],
            formerUsernames: [],
          },
        },
      }),

      tags: social({
        title: 'Tagged',
        home: 'tagged',
        pages: {
          tagged: {
            view: 'people',
            title: 'In this post',
            heading: '20 accounts tagged',
            people: [
              { handle: LEARNER.handle, name: `${LEARNER.name} (you)`, note: '' },
              { handle: 'nisha.bakes', name: 'Nisha', note: 'Follows you' },
              { handle: 'dev_fit', name: 'Dev', note: 'Follows you' },
              { handle: 'aarav.clicks', name: 'Aarav', note: '' },
              { handle: 'meera.dsouza', name: 'Meera D’Souza', note: 'Follows you' },
            ],
            note: '+15 more. Most of the tagged accounts follow each other, or you.',
          },
        },
      }),

      claim: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'claim',
        pages: {
          claim: {
            url: claimUrl,
            host: claimHost,
            title: 'Winner confirmation',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'MR', name: 'Mega Rewards Winners', tagline: 'Prize confirmation' },
              { type: 'heading', text: 'Congratulations, winner! 🎉' },
              {
                type: 'summary',
                rows: [
                  { label: 'Prize', value: 'Smart watch, series 5' },
                  { label: 'Retail value', value: 'INR 18,999' },
                  { label: 'Reserved for', value: '09:41 remaining', strong: true },
                ],
              },
              { type: 'notice', text: 'To confirm you are the real winner, continue with Instagram.' },
            ],
            primary: { label: 'Continue with Instagram', to: 'login' },
          },
          login: {
            url: `${claimUrl}/login`,
            host: claimHost,
            title: 'Log in',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'IG', name: 'Instagram', tagline: 'Log in to continue' },
              {
                type: 'form',
                heading: 'Log in',
                fields: [
                  field({ name: 'username', label: 'Phone number, username or email', length: 3, max: 30 }),
                  field({ name: 'password', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
              { type: 'fineprint', text: 'By continuing you allow Mega Rewards Winners to confirm your account.' },
            ],
            primary: { label: 'Log in', to: 'consent' },
            links: [{ id: 'i01-guest', label: 'Skip login and pay delivery as a guest', to: 'delivery' }],
          },
          consent: {
            url: `${claimUrl}/login/allow`,
            host: claimHost,
            title: 'Allow access',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Mega Rewards Winners wants to access your account' },
              {
                type: 'summary',
                rows: [
                  { label: 'Signed in as', value: 'The account you just entered' },
                  { label: 'Will be able to', value: 'Read your profile and messages, post and send messages as you' },
                ],
              },
              { type: 'fineprint', text: 'You can remove access later from your account settings.' },
            ],
          },
          delivery: {
            url: `${claimUrl}/delivery`,
            host: claimHost,
            title: 'Delivery',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Almost there - delivery' },
              {
                type: 'summary',
                rows: [
                  { label: 'Item', value: 'Smart watch, series 5' },
                  { label: 'Delivery and handling', value: 'INR 49', strong: true },
                  { label: 'Paid to', value: 'SWIFTSHIP LOGISTICS' },
                ],
              },
              { type: 'notice', text: 'Unpaid prizes are redrawn when the timer ends.' },
            ],
            links: [{ id: 'i01-pay', label: 'Pay INR 49 by UPI', to: 'fee' }],
          },
          'login-done': {
            url: `${claimUrl}/login`,
            host: claimHost,
            title: 'Confirmed',
            final: true,
            blocks: [
              { type: 'result', heading: 'Account confirmed', text: 'Now pay delivery to ship your prize.' },
            ],
          },
        },
      },

      fee: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: 'INR 49.00',
        subtitle: 'Delivery and handling',
        rows: [
          { label: 'To', value: 'SWIFTSHIP LOGISTICS' },
          { label: 'UPI ID', value: 'swiftship.pay@trainingpay' },
          { label: 'Note', value: 'MR-WIN-0917' },
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
            id: 'i01-c01', slot: SLOT.INLINE,
            label: `Open the post ${handle} mentioned you in`,
          }),
          action({
            id: 'i01-c02', slot: SLOT.INLINE,
            label: 'Reply “Yes! How do I claim?”',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i01-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i01-c04', slot: SLOT.MENU,
            label: 'See who else is tagged in this post', opens: 'tags',
          }),
          action({
            id: 'i01-c05', slot: SLOT.MENU,
            label: 'Go straight to claiming',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i01-c06', slot: SLOT.SURFACE, on: 'claim', page: 'consent',
            label: 'Allow', targetId: browserAsset?.asset_id ?? null, thenPage: 'login-done',
          }),
          action({
            id: 'i01-c07', slot: SLOT.SURFACE, on: 'fee',
            label: 'Pay INR 49', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i01-c08', slot: SLOT.SURFACE, on: 'claim',
            label: 'Close the claim page', closes: true,
          }),
          action({
            id: 'i01-c09', slot: SLOT.MENU,
            label: 'Share this post to your story to confirm your entry',
          }),
          action({
            id: 'i01-c10', slot: SLOT.MENU,
            label: 'Leave the post without claiming',
          }),
          navigate({ id: 'i01-nav-bio', slot: SLOT.MENU, label: 'Open the link in their bio', opens: 'claim' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i01-c11', slot: SLOT.MENU,
            label: 'Search Instagram for Mega Rewards yourself',
            hint: 'Find the brand’s own account and its giveaway rules', opens: 'official',
          }),
          action({
            id: 'i01-c12',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i01-c13',
            slot: SLOT.MENU, label: `Message ${handle} and ask for proof you won`,
          }),
          action({ id: 'i01-c14', slot: SLOT.MENU, label: 'Report the post' }),
          action({ id: 'i01-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i01-c16', slot: SLOT.INLINE,
            label: 'Report the post and remove your tag',
          }),
          action({
            id: 'i01-c17', slot: SLOT.INLINE,
            label: 'Turn on post notifications for the winners list',
          }),
          action({
            id: 'i01-c18', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i01-c19', slot: SLOT.MENU,
            label: 'Go back and finish claiming',
          }),
          action({
            id: 'i01-c20', slot: SLOT.MENU,
            label: 'Close the post and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i01-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i01-nav-tags', slot: SLOT.MENU, label: 'Tagged accounts', opens: 'tags', after: 'branch' }),
      navigate({ id: 'i01-nav-search', slot: SLOT.MENU, label: 'Search: mega rewards', opens: 'official', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i01-dir-brand',
        name: 'Mega Rewards (Falcon Mart loyalty programme)',
        identifier: '@mega_rewards · +91 00000 40410',
        provenance: 'local approved directory',
        role: 'Official Instagram account and member care line printed on the loyalty card.',
      },
    ],
  }
}

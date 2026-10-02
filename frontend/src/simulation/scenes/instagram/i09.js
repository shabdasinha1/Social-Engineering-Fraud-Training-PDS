import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  asset, assetId, browserPage, caption, comment, directory, headline, receivedAt, social, system,
} from './shared.js'

/**
 * I09 - Deepfake Trading Advertisement (IMMERSIVE-004B). Medium.
 *
 * Nobody writes to the learner. A SPONSORED reel in the feed shows a well-known TV markets
 * commentator saying his AI strategy makes 3% a day, guaranteed, and inviting viewers into a
 * private group before midnight. It is the first Instagram item in the bank that is paid
 * placement rather than an account reaching out, and the first whose persuasion is a face.
 *
 * Its evidence is the ad's own: the "Sponsored" label and the advertiser behind it (an account
 * three weeks old that has already worn three other names), Instagram's ad transparency for
 * that account (fourteen live ads, the same script with a different famous face in each), the
 * reel's audio credited to the advertiser rather than to the man speaking, and the frames
 * themselves - step to 0:07 and his mouth is shut while the voice says "guaranteed". The call
 * to action leaves Instagram for a landing page that hands the learner on to a messaging
 * group, an app installed from outside the store, identity documents and a deposit.
 *
 * The client's verification is the regulator and official sources, found independently; the
 * resolution is to close and report the ad, with the one-line rationale.
 *
 * The bank's notification for this item has no handle - it is "Sponsored" - so the toast
 * carries the bank's own client-specified sender name and the advertiser is authored here.
 */
export function buildI09(scenario) {
  const body = headline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const sponsor = asset(scenario, ASSET_KIND.SENDER)?.content?.display_name || 'Sponsored'
  const landingUrl = browserAsset?.display_target ?? 'https://i09.training.example/verify'
  const landingHost = browserAsset?.content?.host ?? 'i09.training.example'
  const advertiser = 'alphaedge.trading'
  const face = 'Prof. K. Raghavan'
  const brand = { type: 'brand', monogram: 'AE', name: 'AlphaEdge AI', tagline: `${face}’s trading window` }

  return {
    scenarioId: 'I09',
    platform: 'instagram',
    notify: { sender: sponsor },
    messageSender: { display_name: `@${advertiser} (${sponsor})`, identifier: `@${advertiser}` },

    list: {
      kind: 'activity',
      title: 'Notifications',
      sections: [
        {
          heading: 'New',
          rows: [
            {
              id: 'i09-row',
              handle: advertiser,
              text: `${sponsor}: ${body}`,
              detail: 'Sponsored · a reel picked for you',
              time: '1m',
              art: 'chart',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i09-bg-1', handle: 'dev_fit', text: 'dev_fit shared a reel with you.', time: '2h', art: 'trail', inert: true },
            { id: 'i09-bg-2', handle: 'meera.dsouza', text: 'meera.dsouza liked your comment.', time: '4h', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      media: 'reel',
      screenTitle: 'Reels',
      handle: advertiser,
      name: 'AlphaEdge AI Trading',
      subline: sponsor,
      verified: false,
      avatarArt: 'chart',
      slides: [
        { art: 'person', title: `“I’m ${face}.”`, subtitle: '0:02 · studio set, Market Hour logo' },
        { art: 'chart', title: '“My AI makes 3% a day.”', subtitle: '0:05 · chart graphic' },
        { art: 'person', title: 'Paused at 0:07', subtitle: 'Voice: “…guaranteed.” His mouth stays closed.' },
        { art: 'text', title: 'Join before midnight', subtitle: '0:12 · 50 seats · private group' },
      ],
      cta: 'Join the group',
      audio: `Original audio · ${advertiser}`,
      likes: '9,842 likes',
      time: `${sponsor} · ${receivedAt(scenario) ?? '17:56'}`,
    },

    beats: [
      caption('i09-caption', {
        author: advertiser,
        text: `${body} ${face}’s own AI strategy: 3% daily returns, guaranteed. Seats close at 11:59 PM. 👇 Tap Join the group.`,
        time: '1 minute ago',
      }),
      system('i09-limited', 'Comments on this ad have been limited.'),
      comment('i09-c1', { author: 'rakesh_invests_22', text: 'Joined last week, already ₹38,000 profit 🙏 thank you sir', time: '1h', likes: 212 }),
      comment('i09-c2', { author: 'priya.trader.pro', text: 'Best group!! withdrawal in 5 minutes 💯', time: '1h', likes: 187 }),
      comment('i09-c3', { author: 'dev_fit', text: 'isn’t this the Market Hour guy? didn’t know he ran groups', time: '12m', likes: 2 }),

      system('i09-urgency', `${advertiser}: ⏰ 3 hours left · 12 seats remaining`, { since: 'branch', tone: 'banner' }),

      {
        kind: 'system', id: 'i09-after-join', tone: 'banner',
        text: 'You were added to “AlphaEdge VIP 88” on WhatsApp · 256 members · only admins can send messages.',
        since: 'verify', afterConsequence: 'simulated_browser_open',
      },
      {
        kind: 'system', id: 'i09-after-kyc', tone: 'banner',
        text: 'KYC received ✅ Your account manager will call to activate trading.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i09-after-install', tone: 'banner',
        text: 'AlphaEdge AI is installed. It asks for a deposit of INR 10,000 to unlock signals.',
        since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'system', id: 'i09-after-deposit', tone: 'banner',
        text: 'Deposit received. Dashboard: +INR 2,140 today 📈 Withdrawals open after a one-time INR 4,999 release fee.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
    ],

    surfaces: {
      profile: social({
        title: advertiser,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle: advertiser,
            name: 'AlphaEdge AI Trading',
            category: 'Financial service',
            verified: false,
            avatarArt: 'chart',
            stats: { posts: '14', followers: '3,112', following: '0' },
            bio: ['🤖 AI trading signals · 3% daily', 'As seen on Market Hour', 'Private VIP group 👇'],
            bioLink: { label: `${landingHost}/verify`, to: 'landing' },
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            compareTo: { label: 'Ads from this account', to: 'ads' },
            grid: [
              { art: 'person', title: '', note: `Ad · ${face} · 2d` },
              { art: 'person', title: '', note: 'Ad · a cricket captain · 3d' },
              { art: 'person', title: '', note: 'Ad · a film actor · 4d' },
              { art: 'chart', title: '', note: 'Ad · “3% daily” · 5d' },
              { art: 'person', title: '', note: `Ad · ${face} · Hindi · 5d` },
              { art: 'text', title: '', note: 'Ad · “last seats” · 5d' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle: advertiser,
            rows: [
              { label: 'Date joined', value: 'August 2026 (3 weeks ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'ipo.alerts.daily', when: 'August 2026' },
              { handle: 'parttime.jobs.hub', when: 'August 2026' },
              { handle: 'crypto.gains.club', when: 'September 2026' },
            ],
          },
          ads: {
            view: 'status',
            title: 'Ads from this account',
            heading: 'This account is running ads',
            statusRows: [
              { label: 'Started running ads', value: '5 days ago', ok: false },
              { label: 'Active ads', value: '14, in 4 languages', ok: false },
              { label: 'People shown in its ads', value: `${face}, a cricket captain and a film actor - each reading the same script`, ok: false },
              { label: 'Where the ads send people', value: `${landingHost}, then a WhatsApp group`, ok: false },
              { label: 'Paid for by', value: 'Not declared', ok: false },
            ],
            note: 'Instagram shows this information about every account that runs ads.',
          },
        },
      }),

      /** "Why am I seeing this ad?" - reached from the ad itself. */
      adinfo: social({
        title: 'About this ad',
        home: 'why',
        pages: {
          why: {
            view: 'status',
            title: 'About this ad',
            heading: `Sponsored by @${advertiser}`,
            statusRows: [
              { label: 'Why you’re seeing it', value: 'The advertiser wants to reach people aged 25–45 in India interested in finance and cricket.', ok: false },
              { label: 'Destination', value: `${landingHost}/verify`, ok: false },
              { label: 'Ad started', value: '2 days ago', ok: false },
              { label: 'Audio', value: `Original audio, credited to @${advertiser}`, ok: false },
            ],
            note: 'See every ad this account runs on its profile.',
          },
        },
      }),

      landing: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'landing',
        pages: {
          landing: {
            url: landingUrl,
            host: landingHost,
            title: 'AI trading window',
            secure: true,
            blocks: [
              brand,
              { type: 'heading', text: `${face}’s AI Trading Window` },
              {
                type: 'summary',
                rows: [
                  { label: 'Returns', value: '3% daily, guaranteed' },
                  { label: 'Minimum', value: 'INR 10,000' },
                  { label: 'Seats left', value: '12', strong: true },
                  { label: 'Closes', value: '11:59 PM tonight' },
                ],
              },
              { type: 'notice', text: 'Signals and the app link are shared only inside the private WhatsApp group.' },
            ],
            links: [
              { id: 'i09-to-group', label: 'Join the private WhatsApp group', to: 'group' },
              { id: 'i09-to-app', label: 'Get the AlphaEdge AI app', to: 'app' },
            ],
          },
          group: {
            url: `${landingUrl}/group`,
            host: landingHost,
            title: 'Group invite',
            secure: true,
            blocks: [
              { type: 'heading', text: 'You’re invited to a WhatsApp group' },
              {
                type: 'summary',
                rows: [
                  { label: 'Group', value: 'AlphaEdge VIP 88' },
                  { label: 'Members', value: '256' },
                  { label: 'Created', value: '4 days ago' },
                  { label: 'Messages', value: 'Only admins can send messages' },
                ],
              },
            ],
          },
          app: {
            url: `${landingUrl}/app`,
            host: landingHost,
            title: 'Get the app',
            secure: true,
            blocks: [
              brand,
              { type: 'heading', text: 'AlphaEdge AI for Android' },
              {
                type: 'summary',
                rows: [
                  { label: 'File', value: 'alphaedge-ai-v3.apk · 24 MB' },
                  { label: 'Store', value: 'Not listed - install the file directly' },
                ],
              },
            ],
            links: [
              { id: 'i09-to-kyc', label: 'Open a trading account (KYC)', to: 'kyc' },
              { id: 'i09-to-deposit', label: 'Deposit INR 10,000 to activate', to: 'deposit' },
            ],
          },
          kyc: {
            url: `${landingUrl}/kyc`,
            host: landingHost,
            title: 'KYC',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Verify your identity to start trading' },
              {
                type: 'form',
                heading: 'Your documents',
                fields: [
                  field({ name: 'fullname', label: 'Full name', length: 3, max: 40 }),
                  field({ name: 'pan', label: 'PAN', length: 10 }),
                  field({ name: 'aadhaar', label: 'Aadhaar number', kind: FIELD_KIND.DIGITS, length: 12, group: 4 }),
                  field({ name: 'mobile', label: 'Mobile number', kind: FIELD_KIND.DIGITS, length: 10 }),
                ],
              },
              { type: 'fineprint', text: 'Front and back photos of both cards are requested by your account manager on WhatsApp.' },
            ],
            primary: { label: 'Continue', to: 'kyc-review' },
          },
          'kyc-review': {
            url: `${landingUrl}/kyc/review`,
            host: landingHost,
            title: 'Submit KYC',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Submit your KYC?' },
              { type: 'notice', text: 'Your PAN, Aadhaar and mobile number will be sent to AlphaEdge AI.' },
            ],
          },
          'kyc-done': {
            url: `${landingUrl}/kyc/review`,
            host: landingHost,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'KYC received', text: 'Your account manager will call you shortly.' },
            ],
          },
        },
      },

      deposit: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: 'INR 10,000.00',
        subtitle: 'Activate AI signals',
        rows: [
          { label: 'To', value: 'AE CAPITAL DESK' },
          { label: 'UPI ID', value: 'aecapital.desk@trainingpay' },
          { label: 'Note', value: 'VIP88-ACTIVATE' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
      },

      /** The markets regulator's public register, from the app the learner already has. */
      register: {
        kind: SURFACE.APP,
        appName: 'Investor Register',
        appTagline: 'Markets regulator · official app',
        hero: {
          label: `Search: ${face}`,
          value: 'Not registered as an adviser or research analyst',
          caption: 'No registration as an investment adviser, research analyst, broker or portfolio manager.',
          chips: ['Official app', 'Register updated today'],
        },
        sections: [
          {
            id: 'platform', heading: 'Search: AlphaEdge AI',
            rows: [
              { label: 'AlphaEdge AI', value: 'No registered broker, adviser or trading platform by this name' },
              { label: landingHost, value: 'Not a registered intermediary’s website' },
            ],
          },
          {
            id: 'alert', heading: 'Investor alert · 11 Sep 2026',
            rows: [
              { label: 'Edited videos', value: 'Ads show well-known commentators promoting trading groups. The people shown have not endorsed them.' },
            ],
          },
          {
            id: 'rules', heading: 'Before you invest',
            rows: [
              { label: 'Guaranteed returns', value: 'Not permitted for any registered entity' },
              { label: 'Trading apps', value: 'Registered brokers’ apps come from the official app store' },
              { label: 'Groups', value: 'Check any adviser here before joining a group or paying' },
            ],
          },
        ],
        tabs: [
          { label: 'Search', icon: 'home' },
          { label: 'Alerts', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i09-c01', slot: SLOT.INLINE,
            label: 'Watch the sponsored reel',
          }),
          action({
            id: 'i09-c02', slot: SLOT.INLINE,
            label: 'Tap “Join the group” from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i09-c03', slot: SLOT.INLINE, anchor: 'header',
            label: advertiser, hint: 'The advertiser, its history and its other ads',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i09-c04', slot: SLOT.MENU,
            label: 'About this ad', hint: 'Who paid for it and where it sends you',
            targetId: browserAsset?.asset_id ?? null, opens: 'adinfo',
          }),
          action({
            id: 'i09-c05', slot: SLOT.MENU,
            label: 'Go straight to joining',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({ id: 'i09-nav-cta', slot: SLOT.INLINE, anchor: 'cta', label: 'Join the group ›', opens: 'landing' }),
          action({
            id: 'i09-c06', slot: SLOT.SURFACE, on: 'landing', page: 'group',
            label: 'Join group', targetId: browserAsset?.asset_id ?? null, closes: true,
          }),
          action({
            id: 'i09-c07', slot: SLOT.SURFACE, on: 'landing', page: 'app',
            label: 'Install the app', closes: true,
          }),
          action({
            id: 'i09-c08', slot: SLOT.SURFACE, on: 'landing', page: 'kyc-review',
            label: 'Submit KYC', targetId: browserAsset?.asset_id ?? null, thenPage: 'kyc-done',
          }),
          action({
            id: 'i09-c09', slot: SLOT.SURFACE, on: 'deposit',
            label: 'Pay INR 10,000', closes: true,
          }),
          action({
            id: 'i09-c10', slot: SLOT.SURFACE, on: 'landing',
            label: 'Close the page', closes: true,
          }),
          action({
            id: 'i09-c11', slot: SLOT.MENU,
            label: 'Hide ad',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i09-c12', slot: SLOT.MENU,
            label: `Search the regulator’s Investor Register app for ${face} and AlphaEdge`,
            hint: 'An official source you open yourself', opens: 'register',
          }),
          action({
            id: 'i09-c13',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i09-c14',
            slot: SLOT.MENU, label: `Message ${advertiser} for its registration number`,
          }),
          action({ id: 'i09-c15', slot: SLOT.MENU, label: 'Report the ad' }),
          action({ id: 'i09-c16', slot: SLOT.MENU, label: `Block ${advertiser}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i09-c17', slot: SLOT.INLINE,
            label: 'Report the ad and hide it',
          }),
          action({
            id: 'i09-c18', slot: SLOT.INLINE,
            label: 'Save the reel to decide before midnight',
          }),
          action({
            id: 'i09-c19', slot: SLOT.MENU,
            label: `Block ${advertiser}`,
          }),
          action({
            id: 'i09-c20', slot: SLOT.MENU,
            label: 'Go back and join before the seats go',
          }),
          action({
            id: 'i09-c21', slot: SLOT.MENU,
            label: 'Scroll past it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i09-nav-profile', slot: SLOT.MENU, label: `View ${advertiser}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i09-nav-adinfo', slot: SLOT.MENU, label: 'About this ad', opens: 'adinfo', after: 'branch' }),
    ],

    directoryExtras: [
      {
        id: 'i09-dir-register',
        name: 'Markets regulator · Investor Register',
        identifier: 'Official app · registered advisers, brokers and platforms',
        provenance: 'local approved directory',
        role: 'The public register of every registered investment adviser, broker and platform.',
      },
    ],
  }
}

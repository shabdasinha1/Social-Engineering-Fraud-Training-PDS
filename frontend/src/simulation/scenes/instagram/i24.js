import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  asset, assetId, browserPage, caption, comment, directory, headline, receivedAt, social, system,
} from './shared.js'

/**
 * I24 - Institutional Trading App (IMMERSIVE-004E). Hard.
 *
 * A sponsored CAROUSEL, not a reel: four slides of institutional polish - "access for service
 * professionals", "confirmed IPO allotment", a slide of three official-looking seals with a
 * registration number, and an app. Nobody writes to the learner; the pull is the ad and the
 * comments under it.
 *
 * I09 was a borrowed face and a group funnel. I24 is the other half of the pattern: a platform
 * that already shows you money. Its evidence is Instagram's own: an advertiser three weeks old
 * with two earlier names; **a comment section whose top comments are the same sentence from
 * accounts made this month, all posted within two minutes**, beside one real mutual asking how an
 * allotment can be "confirmed" before it is decided; and a call to action that leaves the app for
 * a download page that is not the phone's app store.
 *
 * The decision is made in four places, none of them I09's: the **download page** (Install / Not
 * now), a **web dashboard already credited with a bonus and "profit"** whose withdrawal is locked
 * behind KYC and an 18% "tax", the tax's own payment sheet, and a public "Interested" comment,
 * which is how these ads harvest leads. Hiding the ad is also on the ad's own menu.
 *
 * The client's verification is independent: the phone's own app store (no such app) and the
 * learner's own broker (no application, and allotment is never confirmed in advance).
 *
 * The bank stores this item as a sponsored placement with no handle, so the toast carries the
 * bank's own "Sponsored" and the advertiser is authored here; the placeholder identifier is never
 * printed.
 */
export function buildI24(scenario) {
  const body = headline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const sponsor = asset(scenario, ASSET_KIND.SENDER)?.content?.display_name || 'Sponsored'
  const webUrl = browserAsset?.display_target ?? 'https://i24.training.example/verify'
  const webHost = browserAsset?.content?.host ?? 'i24.training.example'
  const advertiser = 'nivacap.institutional'
  const app = 'NivaCap Pro'
  const regNo = 'INV-00417'
  const investorLine = '+91 00000 60214'
  const brand = { type: 'brand', monogram: 'NC', name: 'NivaCap', tagline: 'Institutional desk · web' }

  return {
    scenarioId: 'I24',
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
              id: 'i24-row',
              handle: advertiser,
              text: `${sponsor}: ${body}`,
              detail: 'Sponsored · suggested for service professionals',
              time: '2m',
              art: 'chart',
            },
          ],
        },
        {
          heading: 'Today',
          rows: [
            { id: 'i24-bg-1', handle: 'anjali.m', text: 'anjali.m commented on a post you follow.', time: '1h', inert: true },
            { id: 'i24-bg-2', handle: 'dev_fit', text: 'dev_fit liked your story.', time: '3h', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'post',
      screenTitle: 'Posts',
      handle: advertiser,
      name: 'NivaCap Institutional Desk',
      subline: sponsor,
      verified: false,
      avatarArt: 'chart',
      slides: [
        { art: 'chart', title: 'Institutional access', subtitle: 'Now open to service professionals' },
        { art: 'award', title: 'Confirmed IPO allotment', subtitle: 'On every application this quarter' },
        { art: 'crest', title: 'Registered · Insured', subtitle: `◉ Licensed ◉ Regd. ${regNo}` },
        { art: 'chart', title: `Install ${app}`, subtitle: 'Average first-week profit ₹18,240' },
      ],
      cta: 'Install app',
      likes: '3,406 likes',
      time: `${sponsor} · ${receivedAt(scenario) ?? '17:14'}`,
      commentNote: 'Comments on ads are public.',
    },

    beats: [
      caption('i24-caption', {
        author: advertiser,
        text: `${body} Registered institutional desk, limited allotment window this week. ⬇️ Install ${app}`,
      }),
      comment('i24-c1', { author: 'sunil.sharma_7824', text: 'Got my allotment confirmed in 2 days 🙏 thank you NivaCap', time: '1h', likes: 96 }),
      comment('i24-c2', { author: 'kavita.rao_4410', text: 'Got my allotment confirmed in 2 days 🙏 thank you NivaCap!!', time: '1h', likes: 91 }),
      comment('i24-c3', { author: 'retd.vikram_2291', text: 'Withdrew ₹42,000 profit last week, very trusted team', time: '1h', likes: 88 }),
      comment('i24-c4', { author: 'anjali.m', text: 'how is an IPO allotment “confirmed” before it has even been decided?', time: '14m', likes: 3 }),
      comment('i24-c5', { author: advertiser, text: `@anjali.m institutional quota is separate ✅ registration ${regNo}`, time: '12m', reply: true }),

      system('i24-urgency', `${advertiser} · Allotment window closes in 6 hours`, { since: 'branch', tone: 'banner' }),

      {
        kind: 'system', id: 'i24-after-install', tone: 'banner',
        text: `${app} was installed from outside your app store. As it opened it asked to read your SMS and to draw over other apps.`,
        since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'system', id: 'i24-after-kyc', tone: 'banner',
        text: '“KYC received ✅ Your withdrawal unlocks after the 18% profit tax is paid.”',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i24-after-tax', tone: 'banner',
        text: '₹3,283 paid. The dashboard now says the withdrawal also needs a ₹15,000 “verification deposit”.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'i24-after-comment', tone: 'banner',
        text: 'Your comment is public. Within a minute two accounts replied: “DM sent, check your requests.”',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
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
            name: 'NivaCap Institutional Desk',
            category: 'Financial service',
            verified: false,
            following: false,
            avatarArt: 'chart',
            stats: { posts: '36', followers: '41.2K', following: '3' },
            bio: ['Institutional access for service professionals', `Regd. ${regNo} · Licensed · Insured`],
            bioLink: { label: webUrl.replace(/^https:\/\//, ''), to: 'web' },
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            compareTo: { to: 'commenters', label: 'People who commented on this ad' },
            grid: [
              { art: 'chart', title: '', note: '2d' },
              { art: 'award', title: '', note: '4d' },
              { art: 'crest', title: '', note: '1w' },
              { art: 'chart', title: '', note: '2w' },
              { art: 'award', title: '', note: '3w' },
              { art: 'chart', title: '', note: '3w' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle: advertiser,
            rows: [
              { label: 'Date joined', value: 'August 2026' },
              { label: 'Account based in', value: 'Outside India' },
              { label: 'Verified', value: 'No' },
              { label: 'Ads running', value: '9 ads, all started this month' },
            ],
            formerUsernames: [
              { handle: 'quickprofit.signals', when: '3 weeks ago' },
              { handle: 'ipo.alerts.daily', when: '2 weeks ago' },
            ],
          },
          commenters: {
            view: 'people',
            title: 'Comments',
            heading: 'People who commented',
            people: [
              { handle: 'sunil.sharma_7824', note: 'Joined this month · 0 posts · commented 17:02' },
              { handle: 'kavita.rao_4410', note: 'Joined this month · 0 posts · commented 17:02' },
              { handle: 'retd.vikram_2291', note: 'Joined this month · 1 post · commented 17:03' },
              { handle: 'anjali.m', note: 'Follows you · commented 17:51' },
            ],
            note: '212 comments were posted between 17:01 and 17:03. 186 of them say “Got my allotment confirmed”.',
          },
        },
      }),

      /** Where the ad's Install button goes: a download page, not the phone's app store. */
      store: {
        kind: SURFACE.INSTALLER,
        title: 'Download',
        home: 'listing',
        closeLabel: 'Close the download page',
        inertNote: 'Simulated download page. Nothing can be installed from here.',
        pages: {
          listing: {
            style: 'sheet',
            screenTitle: webHost,
            art: 'apk',
            artLabel: 'Download · 38 MB',
            title: app,
            text: 'Institutional trading · offered by NivaCap Global Ltd',
            rows: [
              { label: 'Rating', value: '4.9 ★ (12,408)' },
              { label: 'Downloads', value: '1M+' },
              { label: 'Download from', value: `${webHost} (a website)` },
              { label: 'Size', value: '38 MB' },
              { label: 'Asks for', value: 'SMS, accessibility, display over other apps' },
            ],
            links: [{ id: 'i24-store-web', label: 'Use the web dashboard instead', to: 'web' }],
            note: 'Installing from a website needs “Install unknown apps” turned on for your browser.',
          },
          installed: {
            style: 'prompts',
            final: true,
            app: { name: app, detail: 'Installed', monogram: 'NC' },
            text: `${app} is opening.`,
            prompts: [
              { title: `Allow ${app} to send and view SMS messages?`, text: 'Needed to “verify your trading account”.' },
              { title: `Allow ${app} to display over other apps?`, text: 'Needed for “live allotment alerts”.' },
            ],
          },
        },
      },

      /** The web dashboard, already showing money the learner never deposited. */
      web: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dashboard',
        pages: {
          dashboard: {
            url: webUrl,
            host: webHost,
            title: 'NivaCap web dashboard',
            blocks: [
              brand,
              { type: 'heading', text: 'Welcome, A. Rao' },
              {
                type: 'result',
                heading: 'Portfolio',
                text: '₹68,240',
                rows: [
                  { label: 'Joining bonus', value: '₹50,000' },
                  { label: 'Profit this week', value: '+₹18,240' },
                  { label: 'IPO allotments', value: 'Confirmed × 3' },
                ],
              },
              { type: 'notice', text: 'Withdrawals are locked until KYC and profit tax are complete.' },
            ],
            links: [{ id: 'i24-web-withdraw', label: 'Withdraw ₹18,240', to: 'withdraw' }],
          },
          withdraw: {
            url: `${webUrl}/withdraw`,
            host: webHost,
            title: 'Withdrawal locked',
            blocks: [
              brand,
              { type: 'heading', text: 'Withdrawal locked' },
              { type: 'text', text: 'Complete two steps to release ₹18,240 to your bank.' },
              {
                type: 'summary',
                rows: [
                  { label: 'Step 1 · KYC', value: 'Pending' },
                  { label: 'Step 2 · Profit tax (18%)', value: '₹3,283 due', strong: true },
                ],
              },
            ],
            links: [
              { id: 'i24-web-kyc', label: 'Step 1 · Complete KYC', to: 'kyc' },
              { id: 'i24-web-tax', label: 'Step 2 · Pay the profit tax', to: 'tax' },
            ],
          },
          kyc: {
            url: `${webUrl}/kyc`,
            host: webHost,
            title: 'KYC',
            blocks: [
              brand,
              { type: 'heading', text: 'Verify your identity' },
              {
                type: 'form',
                fields: [
                  field({ name: 'fullname', label: 'Full name', length: 3, max: 40 }),
                  field({ name: 'idno', label: 'ID number', kind: FIELD_KIND.DIGITS, length: 12, group: 4 }),
                  field({ name: 'account', label: 'Bank account number', kind: FIELD_KIND.DIGITS, length: 9, max: 18 }),
                ],
              },
              { type: 'fineprint', text: 'A selfie holding your ID is taken on the next screen.' },
            ],
            primary: { label: 'Continue', to: 'kyc-review' },
          },
          'kyc-review': {
            url: `${webUrl}/kyc`,
            host: webHost,
            title: 'KYC review',
            blocks: [
              brand,
              { type: 'heading', text: 'Check and submit' },
              {
                type: 'summary',
                rows: [
                  { label: 'Sent to', value: 'NivaCap Global Ltd' },
                  { label: 'Includes', value: 'Name, ID number, bank account, selfie with ID' },
                  { label: 'Unlocks', value: 'Step 2 · profit tax' },
                ],
              },
            ],
          },
          'kyc-done': {
            url: `${webUrl}/kyc`,
            host: webHost,
            title: 'KYC received',
            final: true,
            blocks: [
              brand,
              { type: 'result', heading: 'KYC', text: 'Received ✅', rows: [{ label: 'Next', value: 'Pay the 18% profit tax to unlock withdrawal' }] },
            ],
          },
        },
      },

      /** The "profit tax" the locked withdrawal asks for. */
      tax: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: '₹3,283',
        subtitle: 'Profit tax to unlock a withdrawal',
        rows: [
          { label: 'To', value: 'NVC Settlement Services' },
          { label: 'UPI ID', value: 'nvc.settle@trainingpay' },
          { label: 'Reference', value: 'TAX-18-ARAO' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'UPI payments to a person or business cannot be reversed by the app.',
      },

      /** The phone's own app store, opened from the home screen. */
      appstore: {
        kind: SURFACE.APP,
        appName: 'App Store',
        appTagline: 'Installed with your phone',
        hero: {
          label: `Search: “${app}”`,
          value: 'No results',
          caption: 'Brokers’ apps listed here show the broker’s registration on their page.',
          chips: ['Store search', 'Offline copy'],
        },
        sections: [
          {
            id: 'i24-store-ipo',
            heading: 'Results for “IPO”',
            rows: [
              { label: 'TradeDesk', value: 'Your broker · installed' },
              { label: 'Allotment Status', value: 'Registrar’s public status lookup' },
            ],
            note: `No app named ${app} or published by NivaCap is listed.`,
          },
        ],
        tabs: [
          { label: 'Apps', icon: 'home' },
          { label: 'Updates', icon: 'history' },
        ],
      },

      /** The learner's own broker. */
      broker: {
        kind: SURFACE.APP,
        appName: 'TradeDesk',
        appTagline: 'Your broker · since 2022',
        hero: {
          label: 'IPO applications this month',
          value: 'None',
          caption: 'Allotment is decided by the registrar after bidding closes. Nobody can confirm it in advance.',
          chips: ['Your account', 'Registered broker'],
        },
        sections: [
          {
            id: 'i24-broker-notices',
            heading: 'Notices from your broker',
            rows: [
              { label: 'Apps', value: 'Trade only in this app, installed from your app store' },
              { label: 'Withdrawals', value: 'Paid to your bank; there is no fee or tax to pay first' },
              { label: 'Institutional quota', value: 'Not available to individual accounts' },
            ],
          },
        ],
        tabs: [
          { label: 'Portfolio', icon: 'wallet' },
          { label: 'Orders', icon: 'history' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i24-c01', slot: SLOT.INLINE,
            label: 'Open the sponsored post',
          }),
          action({
            id: 'i24-c02', slot: SLOT.INLINE,
            label: 'Tap Install app straight from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i24-c03', slot: SLOT.INLINE, anchor: 'header',
            label: advertiser, hint: 'The advertiser, its history and its commenters',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i24-c04', slot: SLOT.MENU,
            label: 'Read every comment under the ad',
          }),
          action({
            id: 'i24-c05', slot: SLOT.MENU,
            label: 'Go straight to the app',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({ id: 'i24-nav-cta', slot: SLOT.INLINE, anchor: 'cta', label: 'Install app ›', opens: 'store' }),
          action({
            id: 'i24-c06', slot: SLOT.SURFACE, on: 'store', page: 'listing',
            label: 'Install', thenPage: 'installed',
          }),
          action({
            id: 'i24-c07', slot: SLOT.SURFACE, on: 'store', page: 'listing',
            label: 'Not now', closes: true,
          }),
          action({
            id: 'i24-c08', slot: SLOT.SURFACE, on: 'web', page: 'kyc-review',
            label: 'Submit KYC', targetId: browserAsset?.asset_id ?? null, thenPage: 'kyc-done',
          }),
          action({
            id: 'i24-c09', slot: SLOT.SURFACE, on: 'tax',
            label: 'Pay ₹3,283', closes: true,
          }),
          action({
            id: 'i24-c10', slot: SLOT.COMPOSER,
            label: 'Comment “Interested”',
            echo: 'Interested 🙋 please DM the details',
          }),
          action({
            id: 'i24-c11', slot: SLOT.MENU,
            label: 'Hide ad',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i24-c12', slot: SLOT.MENU,
            label: `Search your phone’s own app store for ${app}`,
            hint: 'The store that came with your phone', opens: 'appstore',
          }),
          action({
            id: 'i24-c13', slot: SLOT.MENU,
            label: 'Open TradeDesk, your own broker',
            hint: 'Your IPO applications and your broker’s notices', opens: 'broker',
          }),
          action({
            id: 'i24-c14',
            slot: SLOT.MENU, label: `Look up ${deskName} and the investor helpline in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i24-c15',
            slot: SLOT.MENU, label: `Message ${advertiser} for its registration certificate`,
          }),
          action({ id: 'i24-c16', slot: SLOT.MENU, label: 'Report ad' }),
          action({ id: 'i24-c17', slot: SLOT.MENU, label: `Block ${advertiser}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i24-c18', slot: SLOT.INLINE,
            label: 'Save the ad to check the allotment later',
          }),
          action({
            id: 'i24-c19', slot: SLOT.INLINE,
            label: 'Report the ad and the advertiser; install nothing',
          }),
          action({
            id: 'i24-c20', slot: SLOT.MENU,
            label: `Block ${advertiser} and hide its ads`,
          }),
          action({
            id: 'i24-c21', slot: SLOT.MENU,
            label: 'Keep the web dashboard in case the bonus is real',
          }),
          action({
            id: 'i24-c22', slot: SLOT.MENU,
            label: 'Scroll on without reporting',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i24-nav-profile', slot: SLOT.MENU, label: `View ${advertiser}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i24-dir-investor',
        name: 'Investor helpline',
        identifier: investorLine,
        provenance: 'local approved directory',
        role: 'Public line for checking whether an adviser or trading platform is registered.',
      },
    ],
  }
}

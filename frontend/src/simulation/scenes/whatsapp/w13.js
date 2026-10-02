import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  asset, assetId, countdown, day, directory, headline, headlineTime, link, media, system,
  sender, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W13 - Guaranteed IPO Group.
 *
 * W08 was a crowd of real neighbours reacting to something one of them forwarded. This is
 * the opposite: a room built to look like a crowd. The learner was added by a number they
 * do not know, only admins can post, and the "members" posting their profits are - once
 * the participants list is opened - admins too, on consecutive numbers, writing the same
 * sentence with the same emoji. The social proof is manufactured, and the evidence that it
 * is manufactured is in the group's own info screen.
 *
 * ATT&CK T1657 Financial Theft names "pig butchering" among its campaign types, which is
 * the family this belongs to: build trust with fabricated gains and a small bonus, then
 * take a deposit that the fake dashboard will never let go of. T1585.001 covers the
 * personas - the "professor", the assistant, the grateful members. SEBI's advisories on
 * WhatsApp "VIP" trading groups describe the same lures this scene uses: IPO allotment at
 * a discount or guaranteed, assured returns, and a trading app that is not a broker's.
 *
 * **The distinct interaction is a room you cannot speak in.** The composer is gone -
 * "Only admins can send messages" - so the learner's choices are the group's own
 * controls: read the room, open the member page, message the admin privately, or leave.
 * The deposit is made on a sheet reached from the dashboard, which is local navigation,
 * so both the risky reply and the release are genuinely reachable in the same scene.
 */
export function buildW13(scenario) {
  const who = sender(scenario)
  const groupName = who.display_name
  const admin = who.identifier
  const browser = asset(scenario, ASSET_KIND.BROWSER)
  const browserAsset = browser?.asset_id ?? null
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const memberUrl = browser?.display_target ?? 'https://w13.training.example/verify'
  const memberHost = browser?.content?.host ?? 'w13.training.example'
  const professor = `${admin} ~ Prof. V. Sethi`
  const assistant = '+91 00000 70412 ~ Asst. Priya'
  const registration = 'RA-2291-0457'

  /** The same sentence, three times, from three "members". */
  const testimonial = 'Thank you Professor sir 🙏 got 18% profit this week, already withdrawn to my bank account'

  return {
    scenarioId: 'W13',
    platform: 'whatsapp',

    conversation: {
      kind: 'group',
      title: groupName,
      subtitle: `${admin}, Asst. Priya, you, +211 others`,
      saved: false,
      presence: `${admin}, Asst. Priya, you, +211 others`,
      avatarSeed: who.avatar_initials,
      adminsOnly: true,
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w13-row',
          title: groupName,
          group: true,
          preview: `Prof. V. Sethi: ${headline(scenario)}`,
          time: headlineTime(scenario),
          unread: 23,
        },
        {
          id: 'w13-bg-1',
          title: 'Cousins',
          group: true,
          preview: 'Tanvi: photos from Sunday 😄',
          time: '17:55',
          inert: true,
        },
        {
          id: 'w13-bg-2',
          title: 'Ma',
          preview: 'You: reached home',
          time: '16:40',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w13-bg-3',
          title: 'Office Team',
          group: true,
          preview: 'Neha: leave calendar updated',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
      ],
    },

    beats: [
      /** Added two days ago. A new member sees nothing from before they arrived. */
      day('w13-day-added', 'WEDNESDAY'),
      system('w13-added', `${admin} added you`),
      system('w13-perms', 'Only admins can send messages to this group'),
      them('w13-b1',
        'Welcome to Alpha Wealth VIP 🙏 Our research desk has given 18% weekly returns for 11 '
        + 'weeks continuously. Follow the calls, profit is guaranteed.', '21:16',
        { author: professor }),

      day('w13-day-yesterday', 'YESTERDAY'),
      media('w13-proof-1', {
        art: 'chart', label: 'Member profit screenshot',
        caption: 'Member withdrawal: INR 2,40,000 in 5 days ✅', time: '10:02', author: assistant,
      }),
      them('w13-t1', testimonial, '10:05', { author: '+91 00000 70415 ~ Rakesh' }),
      them('w13-t2', testimonial, '10:06', { author: '+91 00000 70418 ~ Sunita' }),
      them('w13-t3',
        'Thank you professor sir 🙏🙏 got 18% profit this week, withdrawn to bank already',
        '10:06', { author: '+91 00000 70419 ~ Anil M' }),
      media('w13-proof-2', {
        art: 'chart', label: 'Member profit screenshot',
        caption: 'Proof 👆 withdrawn today', time: '10:09', author: '+91 00000 70423 ~ Meena',
      }),

      day('w13-day-today', 'TODAY'),
      them('w13-b2', headline(scenario), headlineTime(scenario) ?? '18:42', { author: professor }),
      link('w13-link', {
        title: 'Alpha Wealth Pro - member login',
        description: 'Your INR 2,000 welcome bonus is waiting. IPO allotment desk open till 21:00.',
        displayUrl: memberUrl,
        time: '18:43',
        author: assistant,
      }),
      them('w13-b3',
        'Only today: minimum deposit INR 50,000 to lock the allotment. Your deposit stays yours, '
        + 'profit is guaranteed.', '18:44', { author: assistant }),

      countdown('w13-slots', {
        label: 'IPO slots remaining',
        value: '7 / 50',
        caption: 'Allotment desk closes at 21:00',
        time: '19:02',
        since: 'branch',
      }),
      them('w13-t4', 'Deposited ✅ slot locked. Thank you sir 🙏', '19:04',
        { author: '+91 00000 70415 ~ Rakesh', since: 'branch' }),

      {
        kind: 'system', id: 'w13-after-pay', tone: 'alert',
        text: 'INR 50,000 moved to the "allotment escrow". The dashboard now shows INR 59,000, '
          + 'including profit that cannot be withdrawn.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w13-after-pay-msg', from: 'them', author: assistant,
        text: 'Congratulations 🎉 slot locked. To withdraw, the 10% processing tax must be paid '
          + 'first.',
        time: '19:20', since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w13-after-reply', from: 'them', author: assistant,
        text: 'Received your message sir 🙏 I have sent you the deposit link personally.',
        time: '19:11', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      /**
       * Group info. The tabs are where the room stops looking like a room: who made it,
       * who added you, and that everyone who has ever posted in it is an admin.
       */
      contact: {
        kind: SURFACE.GROUP,
        title: 'Group info',
        name: groupName,
        identifier: 'Group - 214 participants',
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: `Created by ${admin}, 4 days ago`,
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'Description',
                rows: [
                  { label: 'Description', value: `Research desk ${registration}. 100% guaranteed IPO allotment. 18% weekly profit. Withdraw anytime.` },
                  { label: 'Created', value: `4 days ago, by ${admin}` },
                  { label: 'You were added', value: `Wednesday at 21:14, by ${admin}` },
                  { label: 'Added by', value: 'A number that is not in your contacts' },
                  { label: 'Group permissions', value: 'Only admins can send messages' },
                ],
                note: 'Anyone who has your number can add you to a group unless your privacy '
                  + 'settings say otherwise.',
              },
            ],
          },
          {
            id: 'participants',
            label: 'Participants',
            count: 214,
            sections: [
              {
                id: 'admins', heading: '6 admins',
                items: [
                  { label: admin, value: '~ Prof. V. Sethi', badge: 'Group admin' },
                  { label: '+91 00000 70412', value: '~ Asst. Priya', badge: 'Group admin' },
                  { label: '+91 00000 70415', value: '~ Rakesh', badge: 'Group admin' },
                  { label: '+91 00000 70418', value: '~ Sunita', badge: 'Group admin' },
                  { label: '+91 00000 70419', value: '~ Anil M', badge: 'Group admin' },
                  { label: '+91 00000 70423', value: '~ Meena', badge: 'Group admin' },
                ],
              },
              {
                id: 'members', heading: '208 members',
                items: [{ label: 'You', value: 'Added Wednesday' }],
                note: '207 more members. None of them is in your contacts, and none of them has '
                  + 'posted - only admins can.',
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 41,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: '41 images', value: 'Profit and withdrawal screenshots' },
                  { label: 'Same app screen', value: '38 of the 41, with different amounts' },
                  { label: 'Links', value: `12, all to ${memberHost}` },
                ],
              },
            ],
          },
        ],
      },

      /** What the phone can say about the link without opening it. */
      'link-info': {
        kind: SURFACE.VIEWER,
        title: 'Link details',
        subtitle: memberHost,
        art: 'chart',
        label: 'Alpha Wealth Pro link preview',
        heading: 'Alpha Wealth Pro - member login',
        rowsHeading: 'About this link',
        rows: [
          { label: 'Address', value: memberUrl },
          { label: 'Site', value: memberHost },
          { label: 'Registered', value: '6 days ago' },
          { label: 'App store listing', value: 'None - a web page only' },
          { label: 'Posted by', value: 'Asst. Priya, group admin' },
        ],
        note: 'The preview image and title are written by whoever posts the link.',
        inertNote: 'Link details only. Nothing has been opened.',
      },

      /** The "trading app": a web page with a balance it made up. */
      member: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dashboard',
        pages: {
          dashboard: {
            url: memberUrl,
            host: memberHost,
            title: 'Alpha Wealth Pro',
            blocks: [
              { type: 'brand', monogram: 'AW', name: 'Alpha Wealth Pro', tagline: 'Member dashboard' },
              { type: 'heading', text: 'Welcome bonus credited' },
              {
                type: 'summary',
                rows: [
                  { label: 'Available balance', value: 'INR 2,000.00 (bonus)', strong: true },
                  { label: 'This week', value: '+18.4%' },
                  { label: 'Members online', value: '1,286' },
                  { label: 'Your IPO slot', value: 'Reserved - deposit to lock' },
                ],
              },
              {
                type: 'notice',
                text: 'Allotment is guaranteed for VIP members. Minimum deposit INR 50,000. The '
                  + 'deposit window closes at 21:00.',
              },
            ],
            links: [
              { id: 'w13-to-withdraw', label: 'Withdraw my bonus', to: 'withdraw' },
              { id: 'w13-to-deposit', label: 'Deposit to lock my IPO slot', to: 'deposit-sheet' },
            ],
          },
          withdraw: {
            url: `https://${memberHost}/withdraw`,
            host: memberHost,
            title: 'Withdraw',
            blocks: [
              { type: 'brand', monogram: 'AW', name: 'Alpha Wealth Pro', tagline: 'Withdraw' },
              { type: 'heading', text: 'Withdrawal locked' },
              {
                type: 'text',
                text: 'Bonus withdrawals unlock after your first deposit of INR 50,000. A 10% '
                  + 'processing tax applies to every withdrawal and is paid in advance.',
              },
              { type: 'fineprint', text: 'Withdrawal requests are reviewed within 7-10 working days.' },
            ],
          },
        },
      },

      'deposit-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Confirm payment',
        app: 'UPI',
        amount: 'INR 50,000.00',
        subtitle: 'Deposit - IPO allotment slot',
        rows: [
          { label: 'Paying', value: 'ALPHA WEALTH ESCROW' },
          { label: 'Account holder', value: 'R. K. Traders' },
          { label: 'Account type', value: 'Current account, small finance bank' },
          { label: 'Requested by', value: 'Alpha Wealth Pro web page' },
          { label: 'Reversible', value: 'No' },
        ],
        form: {
          heading: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The account being paid is in a different name from the one on the page.',
      },

      /**
       * The regulator's own register, from the app already on the phone. It answers the
       * group's claims with the only thing that can: a search that comes back empty.
       */
      'regulator-app': {
        kind: SURFACE.APP,
        appName: 'Investor Check',
        appTagline: 'Market regulator - registered intermediaries',
        hero: {
          label: 'Search',
          value: registration,
          caption: 'No registered adviser, research analyst or broker holds this number.',
          chips: ['Official register', 'Updated daily'],
        },
        sections: [
          {
            id: 'names', heading: 'Search: Alpha Wealth',
            rows: [
              { label: 'Registered broker', value: 'No match' },
              { label: 'Registered adviser', value: 'No match' },
              { label: 'Research analyst', value: 'No match' },
              { label: 'Prof. V. Sethi', value: 'No match' },
            ],
          },
          {
            id: 'ipo', heading: 'How IPO allotment works',
            rows: [
              { label: 'When oversubscribed', value: 'Shares are allotted by computerised lottery' },
              { label: 'Guaranteed allotment', value: 'Not possible - nobody can promise it' },
              { label: 'Where you apply', value: 'Through your own broker or bank, with the money held in your own account until allotment' },
            ],
            note: 'Registered intermediaries are not allowed to promise assured or guaranteed '
              + 'returns.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Search', icon: 'history' },
          { label: 'Alerts', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    directoryExtras: [],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w13-c01', slot: SLOT.INLINE,
            label: `Open ${groupName}`,
          }),
          action({
            id: 'w13-c02', slot: SLOT.INLINE,
            label: 'Open the member link from the preview', opens: 'member',
            targetId: browserAsset,
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w13-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Group info',
            hint: 'Who made the group, who added you, who can post',
            opens: 'contact',
          }),
          action({
            id: 'w13-c04', slot: SLOT.INLINE,
            anchor: 'w13-link', label: 'Link details', targetId: browserAsset,
            opens: 'link-info',
          }),
          action({
            id: 'w13-c05', slot: SLOT.MENU,
            label: 'Read the group from the start',
          }),
          action({
            id: 'w13-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** Walking into the member page is navigation; paying is the decision. */
          navigate({
            id: 'w13-branch-open', slot: SLOT.INLINE, anchor: 'w13-link',
            label: 'Open', opens: 'member',
          }),
          action({
            id: 'w13-c07', slot: SLOT.MENU,
            label: 'Exit group',
          }),
          action({
            id: 'w13-c08', slot: SLOT.MENU,
            label: 'Message Asst. Priya: "Interested, please reserve my IPO slot"',
          }),
          action({
            id: 'w13-c09', slot: SLOT.SURFACE,
            on: 'deposit-sheet', label: 'Deposit INR 50,000', targetId: paymentAsset,
            closes: true,
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w13-c10',
            slot: SLOT.MENU, label: 'Search the adviser in the Investor Check app',
            hint: 'The market regulator’s own register, already on your phone',
            opens: 'regulator-app',
          }),
          action({
            id: 'w13-c11',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w13-c12',
            slot: SLOT.MENU,
            label: 'Ask Asst. Priya for the registration certificate',
          }),
          action({
            id: 'w13-c13', slot: SLOT.MENU,
            label: 'Report the group',
          }),
          action({
            id: 'w13-c14', slot: SLOT.MENU,
            label: `Block ${admin}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w13-c15', slot: SLOT.INLINE,
            label: 'Stay in the group and watch for now',
          }),
          action({
            id: 'w13-c16', slot: SLOT.INLINE,
            label: 'Report the group, exit and delete it',
          }),
          action({
            id: 'w13-c17', slot: SLOT.MENU,
            label: 'Block the admins and exit the group',
          }),
          action({
            id: 'w13-c18', slot: SLOT.MENU,
            label: 'Deposit and stay in the group',
          }),
          action({
            id: 'w13-c19', slot: SLOT.MENU,
            label: 'Mute the group and leave it be',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w13-nav-group', slot: SLOT.MENU, label: 'Group info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w13-nav-member', slot: SLOT.MENU, label: 'Alpha Wealth Pro member page',
        opens: 'member', after: 'verify',
      }),
    ],

    supportDesk: desk,
  }
}

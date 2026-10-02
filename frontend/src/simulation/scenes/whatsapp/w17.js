import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  asset, day, directory, e2e, headline, headlineTime, link, media, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W17 - Part-Time Rating Tasks.
 *
 * The FTC's December 2024 data spotlight calls these "gamified job scams": simple
 * repetitive tasks - liking videos, rating product images - on a platform that shows
 * commission piling up, small real payouts at first, and then a deposit to "complete the
 * next set" and get the earnings out. I4C describes the Indian form exactly: unsolicited
 * WhatsApp messages, small payments to gain trust, then "prepaid tasks". ATT&CK names the
 * objective (T1657) and the persona (T1585.001); the task mechanics are the FTC's and I4C's.
 *
 * W13 was a crowd. This is one person and the learner's own effort, and three things make
 * it a different scenario rather than W13 with one speaker:
 *
 * 1. **The opener is a bulk template.** The job description arrives marked "Forwarded many
 *    times" - the app's own provenance label, which the recruiter cannot strip off - under a
 *    "personal" hello that says the learner's profile was found on a job portal.
 * 2. **The bait has already landed.** INR 150 is sitting in the learner's real bank app,
 *    "a joining gift". The bank app says who actually sent it: an individual's personal UPI
 *    handle, not a company. Money arriving is the most persuasive thing in this family and
 *    the scene lets it be persuasive.
 * 3. **Commitment is built by the learner's own taps.** The task site lets them rate three
 *    products and watch the balance climb - all local, all free - until Level 2 turns out to
 *    be a "merged order" with a negative balance and a recharge. The withdrawal page asks
 *    for their bank account "so payouts arrive the same day", which is the other ending of
 *    this pattern: becoming the account other victims' money moves through.
 *
 * The verification is a vacancy channel the learner already uses, not a link from the chat:
 * the JobsBoard app, where the company Mia named is real, hires full-time for an office,
 * and has posted that it never recruits on WhatsApp or asks anyone to pay.
 */
export function buildW17(scenario) {
  const who = sender(scenario)
  const senderAsset = asset(scenario, ASSET_KIND.SENDER)?.asset_id ?? null
  const browser = asset(scenario, ASSET_KIND.BROWSER)
  const browserAsset = browser?.asset_id ?? null
  const directoryAsset = asset(scenario, ASSET_KIND.DIRECTORY)?.asset_id ?? null
  const desk = directory(scenario)

  const taskUrl = browser?.display_target ?? 'https://w17.training.example/verify'
  const taskHost = browser?.content?.host ?? 'w17.training.example'
  const taskRoot = `https://${taskHost}`
  const brand = { type: 'brand', monogram: 'TH', name: 'TaskHub Rewards', tagline: 'Member tasks' }

  const bulkAd = 'PART-TIME / WORK FROM HOME 💼\n'
    + 'Rate products for top online stores from your phone.\n'
    + '⏱ 15-20 minutes a day\n'
    + '💰 INR 3,000 daily, paid the same day\n'
    + '✅ No fees, no experience\n'
    + 'Reply YES to start'

  /** One product-rating page. Walking to the next is local; nothing here is scored. */
  const task = (n, product, store, balance) => ({
    url: `${taskRoot}/tasks/${n}`,
    host: taskHost,
    title: `TaskHub - task ${n}`,
    blocks: [
      brand,
      { type: 'heading', text: `Task ${n} of 3` },
      ...(balance ? [{ type: 'notice', text: `+ INR 150 commission added. Balance ${balance}.` }] : []),
      {
        type: 'summary',
        rows: [
          { label: 'Product', value: product },
          { label: 'Store', value: store },
          { label: 'Rating required', value: '5 stars' },
          { label: 'Commission', value: 'INR 150' },
        ],
      },
      { type: 'text', text: 'Tap below to submit the rating. Commission is added instantly.' },
    ],
    links: [{
      id: `w17-t${n}-rate`, label: 'Submit ★★★★★ rating',
      to: n < 3 ? `task${n + 1}` : 'level',
    }],
  })

  return {
    scenarioId: 'W17',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'online',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: true,
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w17-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 5,
        },
        {
          id: 'w17-bg-1',
          title: 'College Batch 2019',
          group: true,
          preview: 'Aman: anyone going for the reunion?',
          time: '08:12',
          muted: true,
          inert: true,
        },
        {
          id: 'w17-bg-2',
          title: 'Falcon Bank',
          preview: 'Your statement for August is ready',
          time: 'Yesterday',
          inert: true,
        },
        {
          id: 'w17-bg-3',
          title: 'Ma',
          preview: 'You: will call tonight',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w17-e2e'),

      day('w17-day', 'TODAY'),
      them('w17-b1', 'Hello 😊 I am Mia from the HR team at BrightReach Digital. We found your '
        + 'profile on a job portal.', '08:40'),
      them('w17-ad', bulkAd, '08:41', { forwarded: 'many' }),
      them('w17-head', headline(scenario), headlineTime(scenario) ?? '08:44'),
      them('w17-b2', 'I have already sent INR 150 to your UPI number as a joining gift, so you '
        + 'know we are genuine 🙏 Please check your bank.', '08:46'),
      media('w17-proof', {
        art: 'chart', label: 'Payout screenshot',
        caption: 'Today’s payouts to our members 💸', time: '08:47',
      }),

      link('w17-link', {
        title: 'TaskHub - member tasks',
        description: 'Your account is ready. Welcome bonus INR 800 credited.',
        displayUrl: taskUrl,
        text: 'Log in with mentor code MIA-2291 and finish 3 tasks today 👍',
        time: '09:02',
        since: 'inspect',
      }),

      them('w17-b3', 'After 3 tasks you reach Level 2. Level 2 has the premium merged order - '
        + '30% commission 🔥', '09:15', { since: 'branch' }),
      them('w17-b4', 'The recharge comes back with the commission. Many members did it today.',
        '09:16', { since: 'branch' }),
      them('w17-b5', 'Also invite 3 friends and get INR 500 each!', '09:17', { since: 'branch' }),

      typing('w17-typing', { since: 'verify', until: 'resolve' }),

      {
        kind: 'system', id: 'w17-after-pay', tone: 'alert',
        text: 'INR 5,000 went to a personal account. The site now shows INR 6,480 "frozen" and '
          + 'asks for an unfreezing charge before any withdrawal.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w17-after-pay-msg', from: 'them',
        text: 'Congrats dear 🎉 order completed. Pay the 12% unfreezing charge (INR 780) and '
          + 'you can withdraw.',
        time: '09:41', since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'w17-after-bank', tone: 'alert',
        text: `Your bank account number and IFSC were sent to ${taskHost}.`,
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w17-after-bank-msg', from: 'them',
        text: 'Thank you! Other members’ payments may come into your account now. Please '
          + 'transfer them to the account I send you - it is part of the job.',
        time: '09:44', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w17-after-reply', from: 'them',
        text: 'Great 👍 your next task set is ready. Level 2 starts after the recharge.',
        time: '09:39', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: 'This number is not in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'About', value: 'Hiring now 💼 Work from home' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Business account', value: 'No' },
                  { label: 'Company named', value: 'BrightReach Digital (in the chat only)' },
                  { label: 'On WhatsApp since', value: 'Last month' },
                  { label: 'First message', value: 'Today at 08:40' },
                ],
                note: 'A name and a status line are typed by whoever owns the number.',
              },
            ],
          },
          {
            id: 'groups',
            label: 'Groups in common',
            count: 0,
            sections: [
              {
                id: 'groups-list', heading: 'Groups in common',
                empty: 'You are not in any group with this number.',
                items: [],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 4,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: 'Payout screenshots', value: '3 images, all today' },
                  { label: taskHost, value: 'TaskHub Rewards - not the company named in the chat' },
                ],
              },
            ],
          },
        ],
      },

      /** The learner's own bank, saying who really sent the "joining gift". */
      'bank-app': {
        kind: SURFACE.APP,
        appName: 'Falcon Bank',
        appTagline: 'Savings account ••6620',
        hero: {
          label: 'Credited today at 08:46',
          value: 'INR 150.00',
          caption: 'UPI credit from SUNIL K - sunil.k4471@trainingpay',
          chips: ['Signed in on this phone'],
        },
        sections: [
          {
            id: 'payer', heading: 'Payer details',
            rows: [
              { label: 'Payer', value: 'SUNIL K' },
              { label: 'Account type', value: 'Individual savings account' },
              { label: 'Remark', value: 'gift' },
              { label: 'Company account', value: 'No' },
            ],
            note: 'Anyone who knows your mobile number can send money to it. A credit does not '
              + 'show who asked for it to be sent.',
          },
          {
            id: 'recent', heading: 'Recent transactions',
            rows: [
              { label: 'Today 08:46', value: '+ 150.00 UPI / SUNIL K' },
              { label: 'Yesterday', value: '- 420.00 Groceries' },
              { label: '1 Sep', value: '+ 38,400.00 Salary' },
            ],
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Pay', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The task site. Local tasks build the balance; the two commits are at the end. */
      tasks: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dashboard',
        pages: {
          dashboard: {
            url: taskUrl,
            host: taskHost,
            title: 'TaskHub - dashboard',
            blocks: [
              brand,
              { type: 'heading', text: 'Welcome bonus credited' },
              {
                type: 'summary',
                rows: [
                  { label: 'Balance', value: 'INR 800.00 (bonus)', strong: true },
                  { label: 'Level 1', value: 'Tasks 0 of 3' },
                  { label: 'Commission', value: 'INR 150 per task' },
                  { label: 'Mentor', value: 'MIA-2291' },
                ],
              },
              { type: 'notice', text: 'Finish Level 1 today to unlock withdrawals.' },
            ],
            links: [
              { id: 'w17-d-start', label: 'Start task 1', to: 'task1' },
              { id: 'w17-d-withdraw', label: 'Withdraw', to: 'withdraw' },
            ],
          },
          task1: task(1, 'Wireless earbuds, black', 'An online electronics store', null),
          task2: task(2, 'Steel water bottle, 1 litre', 'An online homeware store', 'INR 950.00'),
          task3: task(3, 'Folding phone stand', 'An online accessories store', 'INR 1,100.00'),
          level: {
            url: `${taskRoot}/level`,
            host: taskHost,
            title: 'TaskHub - level complete',
            blocks: [
              brand,
              { type: 'heading', text: 'Level 1 complete 🎉' },
              {
                type: 'summary',
                rows: [
                  { label: 'Balance', value: 'INR 1,250.00', strong: true },
                  { label: 'Withdrawable', value: 'After Level 2' },
                  { label: 'Level 2', value: 'Premium merged order assigned' },
                ],
              },
            ],
            links: [
              { id: 'w17-l-premium', label: 'Open my premium order', to: 'premium' },
              { id: 'w17-l-withdraw', label: 'Withdraw', to: 'withdraw' },
            ],
          },
          premium: {
            url: `${taskRoot}/level-2/merged-order`,
            host: taskHost,
            title: 'TaskHub - premium merged order',
            blocks: [
              brand,
              { type: 'heading', text: 'Premium merged order' },
              {
                type: 'summary',
                rows: [
                  { label: 'Order', value: 'Merged order x3 (Level 2)' },
                  { label: 'Your balance', value: '- INR 4,860.00', strong: true },
                  { label: 'To complete', value: 'Recharge INR 5,000' },
                  { label: 'You receive', value: 'INR 6,480 including 30% commission' },
                ],
              },
              {
                type: 'notice',
                text: 'Merged orders cannot be skipped. Your account stays frozen until the order '
                  + 'is complete. The order expires in 30 minutes.',
              },
            ],
            links: [
              { id: 'w17-p-recharge', label: 'Recharge INR 5,000', to: 'recharge-sheet' },
              { id: 'w17-p-dash', label: 'Back to dashboard', to: 'dashboard' },
            ],
          },
          withdraw: {
            url: `${taskRoot}/withdraw`,
            host: taskHost,
            title: 'TaskHub - withdraw',
            blocks: [
              brand,
              { type: 'heading', text: 'Withdraw' },
              {
                type: 'notice',
                text: 'Withdrawals open after Level 2. Link your bank account now so your payout '
                  + 'reaches you the same day.',
              },
              {
                type: 'form',
                heading: 'Bank account for payouts',
                fields: [
                  field({ name: 'holder', label: 'Account holder name', length: 3, max: 26 }),
                  field({
                    name: 'account', label: 'Account number', kind: FIELD_KIND.DIGITS,
                    length: 9, max: 18,
                  }),
                  field({ name: 'ifsc', label: 'IFSC', length: 11, placeholder: 'ABCD0123456' }),
                ],
              },
            ],
            primary: { label: 'Continue', to: 'withdraw-review' },
            links: [{ id: 'w17-w-dash', label: 'Back to dashboard', to: 'dashboard' }],
          },
          'withdraw-review': {
            url: `${taskRoot}/withdraw/confirm`,
            host: taskHost,
            title: 'TaskHub - confirm payout account',
            blocks: [
              brand,
              { type: 'heading', text: 'Confirm payout account' },
              {
                type: 'summary',
                rows: [
                  { label: 'Payout to', value: 'The account you entered' },
                  { label: 'Handled by', value: 'TaskHub payout partner' },
                  { label: 'First payout', value: 'After Level 2' },
                ],
              },
              {
                type: 'fineprint',
                text: 'By linking an account you agree that member payouts may be routed through '
                  + 'it and forwarded as instructed by your mentor.',
              },
            ],
            links: [{ id: 'w17-r-change', label: 'Change details', to: 'withdraw' }],
          },
          'withdraw-done': {
            final: true,
            url: `${taskRoot}/withdraw/linked`,
            host: taskHost,
            title: 'TaskHub - account linked',
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Payout account',
                text: 'Account linked.',
                rows: [
                  { label: 'Withdrawal', value: 'Locked until the premium order is complete' },
                  { label: 'Balance', value: '- INR 4,860.00' },
                ],
              },
            ],
          },
        },
      },

      'recharge-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Confirm payment',
        app: 'UPI',
        amount: 'INR 5,000.00',
        subtitle: 'TaskHub recharge - premium order',
        rows: [
          { label: 'Paying', value: 'RK ENTERPRISES' },
          { label: 'UPI ID', value: 'rk.ent.7781@trainingpay' },
          { label: 'Requested by', value: 'TaskHub web page' },
          { label: 'Reversible', value: 'No' },
        ],
        form: {
          heading: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The account being paid is neither TaskHub, nor the company named in the chat, '
          + 'nor the person who sent you INR 150 this morning.',
      },

      /** A vacancy channel the learner already uses - not a link anyone sent. */
      'jobs-app': {
        kind: SURFACE.APP,
        appName: 'JobsBoard',
        appTagline: 'Verified employers and vacancies',
        hero: {
          label: 'Employer',
          value: 'BrightReach Digital Pvt Ltd',
          caption: 'Verified employer. 2 open roles, both full-time and office-based.',
          chips: ['Verified employer', 'Listed since 2019'],
        },
        sections: [
          {
            id: 'roles', heading: 'Open roles',
            rows: [
              { label: 'Data Analyst', value: 'Full-time, office - posted 4 Sep' },
              { label: 'Accounts Executive', value: 'Full-time, office - posted 28 Aug' },
              { label: 'Part-time or rating tasks', value: 'None listed' },
            ],
          },
          {
            id: 'notice', heading: 'Notice from the employer',
            rows: [
              { label: 'Recruiting on WhatsApp', value: 'Never' },
              { label: 'Fees, deposits or recharges', value: 'Never asked of candidates' },
              { label: 'Rating or review tasks', value: 'Not a role we offer' },
              { label: 'Recruiter contact', value: 'From @brightreach.training.example email only' },
            ],
          },
          {
            id: 'search', heading: 'Search: TaskHub Rewards',
            rows: [{ label: 'Employers', value: 'No employer listed under this name' }],
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Search', icon: 'history' },
          { label: 'Applied', icon: 'wallet' },
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
            id: 'w17-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w17-c02', slot: SLOT.INLINE,
            label: 'Reply "YES" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w17-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'Who owns this number, and since when',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w17-c04', slot: SLOT.INLINE,
            anchor: 'w17-link', label: 'Check where this link goes', targetId: browserAsset,
          }),
          action({
            id: 'w17-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w17-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          /** Walking into the task site and doing tasks is navigation; paying is not. */
          navigate({
            id: 'w17-branch-open', slot: SLOT.INLINE, anchor: 'w17-link',
            label: 'Open', opens: 'tasks',
          }),
          action({
            id: 'w17-c07', slot: SLOT.COMPOSER,
            label: 'No thanks. I will not pay anything to get paid.',
            echo: 'No thanks. I will not pay anything to get paid. Please do not contact me again.',
          }),
          action({
            id: 'w17-c08', slot: SLOT.COMPOSER,
            label: 'YES ✅ send me the next tasks',
            echo: 'YES ✅ send me the next tasks',
          }),
          action({
            id: 'w17-c09', slot: SLOT.COMPOSER,
            label: 'Sharing your invite with 3 friends now',
            echo: 'Sharing your invite with 3 friends now 👍',
          }),
          action({
            id: 'w17-c10', slot: SLOT.SURFACE,
            on: 'tasks', page: 'withdraw-review', thenPage: 'withdraw-done',
            label: 'Link account', targetId: browserAsset,
          }),
          action({
            id: 'w17-c11', slot: SLOT.SURFACE,
            on: 'recharge-sheet', label: 'Recharge INR 5,000', closes: true,
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w17-c12',
            slot: SLOT.MENU, label: 'Look up BrightReach Digital on the JobsBoard app',
            hint: 'A vacancy site you already use, not a link from the chat', opens: 'jobs-app',
          }),
          action({
            id: 'w17-c13',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w17-c14',
            slot: SLOT.MENU,
            label: 'Ask Mia for an offer letter and the company registration',
          }),
          action({ id: 'w17-c15', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w17-c16', slot: SLOT.MENU,
            label: `Block ${who.identifier}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w17-c17', slot: SLOT.INLINE,
            label: 'Report the recruiter and stop the tasks',
          }),
          action({
            id: 'w17-c18', slot: SLOT.MENU,
            label: 'Block the number and delete the chat',
          }),
          action({
            id: 'w17-c19', slot: SLOT.INLINE,
            label: 'Keep the chat and decide later',
          }),
          action({
            id: 'w17-c20', slot: SLOT.MENU,
            label: 'Recharge and carry on with the tasks',
          }),
          action({
            id: 'w17-c21', slot: SLOT.MENU,
            label: 'Mute the chat and leave it',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w17-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w17-nav-bank', slot: SLOT.MENU, label: 'Open the Falcon Bank app',
        opens: 'bank-app', after: 'inspect',
      }),
      navigate({
        id: 'w17-nav-tasks', slot: SLOT.MENU, label: 'TaskHub page',
        opens: 'tasks', after: 'verify',
      }),
      navigate({
        id: 'w17-nav-jobs', slot: SLOT.MENU, label: 'JobsBoard app',
        opens: 'jobs-app', after: 'resolve',
      }),
    ],

    supportDesk: desk,
  }
}

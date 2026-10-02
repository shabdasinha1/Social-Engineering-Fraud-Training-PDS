import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headlineTime, link, me, media, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W22 - Long-Game Online Friendship.
 *
 * The FBI's IC3 has described this pattern since 2022: an approach through social media, a
 * dating app or "even masquerading as a wrong number", trust built slowly, and only then an
 * investment platform whose dashboard shows returns nobody can withdraw. ATT&CK names the
 * objective (T1657 lists "pig butchering" among its campaign types) and the persona built
 * over time (T1585.001, "presence, history and appropriate affiliations").
 *
 * W13 was a crowd and W17 a recruiter; both were strangers the learner met today. This
 * scene is built around TIME, which neither of them had:
 *
 * 1. **A thread that spans four weeks and starts with a wrong number.** The conversation
 *    opens on today's message; the beginning is at the top, and the learner has to go and
 *    read it. Good-morning messages, a prayer for the learner's mother before her surgery,
 *    and the learner's own "I owe you one" - the reciprocity the request now leans on.
 * 2. **A biography that does not hold together across weeks.** A dental surgeon in Pune on
 *    21 August; helping at her uncle's trading desk in Dubai by 4 September; a video call
 *    that could never happen. No single message is wrong - the inconsistency only exists
 *    between messages the learner has to connect.
 * 3. **Checks that sit entirely outside the relationship.** An image search on the photos
 *    she sent (the phone's own Photos app), and the markets regulator's public register -
 *    neither of which asks Samira anything.
 *
 * The client's notification is truncated in the pinned bank at the apostrophe in "uncle's";
 * the conversation carries the client's full sentence, as W06, W09, W15 and W20 do.
 */
export function buildW22(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full. The pinned notification asset holds only "My
   * uncle" because the DATA-003 generator's capture stops at the first apostrophe.
   */
  const requestLine = "My uncle's desk has a guaranteed window tonight. Start small so you can trust me."

  const platform = 'Qorvex Global'
  const host = 'qorvex-global.training.example'
  const root = `https://${host}`
  const invite = 'SAMIRA-VIP'
  const brand = { type: 'brand', monogram: 'QG', name: platform, tagline: 'Smart crypto desk' }

  return {
    scenarioId: 'W22',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: true,
      presence: 'online',
      avatarSeed: who.avatar_initials,
    },

    list: {
      title: 'WhatsApp',
      archived: 4,
      rows: [
        {
          id: 'w22-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: headlineTime(scenario),
          unread: 2,
        },
        {
          id: 'w22-bg-1',
          title: 'Ma',
          preview: 'walked to the gate today without the stick 🙏',
          time: '09:15',
          inert: true,
        },
        {
          id: 'w22-bg-2',
          title: 'College Batch 2016',
          group: true,
          preview: 'Rohan: reunion poll closes Friday',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w22-bg-3',
          title: 'Rohan',
          preview: 'You: ha, next time',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w22-e2e'),

      /** Four weeks ago: the wrong number. */
      day('w22-day-1', '19 AUGUST'),
      them('w22-w1', 'Hi Kavya! Is Saturday dinner still on? 😊', '21:14'),
      me('w22-w2', 'Sorry, I think you have the wrong number', '21:20'),
      them('w22-w3', 'Oh no, so sorry!! 🙈 My friend changed her number. You are very polite though '
        + '- not many people even reply 😄', '21:22'),
      them('w22-w4', 'I am Samira. Dental surgeon in Pune. Have a good night!', '21:23'),

      day('w22-day-2', '21 AUGUST'),
      them('w22-w5', 'Good morning ☀️ hope today is kind to you', '07:02'),
      media('w22-photo-clinic', {
        art: 'photo', label: 'Photo: at the clinic', caption: 'First patient done 😅', time: '07:03',
      }),
      me('w22-w6', 'Morning! Busy day here too', '08:40'),

      day('w22-day-3', '26 AUGUST'),
      me('w22-w7', 'My mother’s knee surgery is tomorrow. A bit tense.', '22:05'),
      them('w22-w8', 'I will pray for her 🙏 Tell her to do ankle pumps after the surgery - my '
        + 'patients who do them recover faster.', '22:08'),
      them('w22-w9', 'She is lucky to have you.', '22:09'),
      me('w22-w10', 'You’re too kind. I owe you one.', '22:15'),

      day('w22-day-4', '30 AUGUST'),
      me('w22-w11', 'Can we video call sometime? Would be nice to talk properly', '20:10'),
      them('w22-w12', 'Sorry sorry, not now - network here is terrible and my front camera is '
        + 'broken 🙈 soon promise', '20:14'),

      day('w22-day-5', '4 SEPTEMBER'),
      them('w22-w13', 'Big news - I have moved to Dubai to help at my uncle’s firm. He runs a private '
        + 'trading desk.', '19:40'),
      media('w22-photo-marina', {
        art: 'photo', label: 'Photo: evening walk', caption: 'Dubai marina 🌇', time: '19:41',
      }),
      me('w22-w14', 'Wow! What about the clinic?', '19:50'),
      them('w22-w15', 'Someone is covering 😊 Uncle says I am wasted on teeth anyway', '19:52'),

      day('w22-day-6', 'YESTERDAY'),
      them('w22-w16', 'Uncle’s desk made me 4 lakh this month. I feel bad keeping it to myself when '
        + 'you have been so good to me.', '21:30'),
      me('w22-w17', 'That’s a lot!', '21:45'),

      day('w22-day-7', 'TODAY'),
      them('w22-head', requestLine, headlineTime(scenario) ?? '10:58'),
      them('w22-b1', 'Only for family and close friends. INR 2,000 to begin, and you can withdraw '
        + 'any time.', '10:59'),

      /** The branch stage: her own screenshot, the invite link, and the deadline. */
      media('w22-shot', {
        art: 'chart', label: 'Screenshot: trading account', caption: 'My account this month 😍 +212%',
        time: '11:04', since: 'branch',
      }),
      link('w22-link', {
        title: `${platform} - Smart crypto desk`,
        description: `Private desk access with invite code ${invite}`,
        displayUrl: `${root}/invite/${invite}`,
        text: 'Use my code so the desk knows you are with me',
        time: '11:05', since: 'branch',
      }),
      them('w22-b2', 'The window closes at 9 tonight ⏳', '11:06', { since: 'branch' }),

      {
        kind: 'system', id: 'w22-after-pay', tone: 'alert',
        text: 'INR 2,000 went by UPI to an individual’s account. The desk now shows INR 2,360 and '
          + '“withdrawals unlock at INR 50,000”.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w22-after-pay-msg', from: 'them',
        text: 'See!! 18% in two hours 😍 Put 50,000 before 9 and uncle will double your bonus.',
        time: '11:31', since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w22-after-kyc', from: 'them',
        text: 'Verified ✅ The desk has opened your account. Now the first deposit to activate it.',
        time: '11:29', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w22-after-reply', from: 'them',
        text: 'After four weeks you still don’t trust me? 😔 Fine, here is my withdrawal proof. '
          + 'Now please start before 9.',
        time: '11:18', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'call', id: 'w22-after-call', video: true, state: 'missed',
        caller: who.display_name, time: '11:12', since: 'verify', afterConsequence: 'simulated_call',
      },
      {
        kind: 'message', id: 'w22-after-call-msg', from: 'them',
        text: 'Can’t pick up, in a meeting with uncle. Just start with 2,000 😊',
        time: '11:13', since: 'verify', afterConsequence: 'simulated_call',
      },

      /** The other side composing, drawn after whatever the last action produced. */
      typing('w22-typing', { since: 'verify', until: 'resolve' }),
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: true,
        statusLine: 'Saved in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'About', value: 'Smile, it’s free ✨' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Saved', value: '4 weeks ago, by you' },
                  { label: 'Profile photo', value: 'Woman on a beach at sunset' },
                  { label: 'First message', value: '19 Aug at 21:14' },
                ],
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
            count: 2,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: 'Photo: at the clinic', value: '21 Aug' },
                  { label: 'Photo: evening walk', value: '4 Sep' },
                ],
                link: { label: 'Search these photos with Photos', to: 'photo-search' },
              },
            ],
          },
        ],
      },

      /** Her own screenshot. It shows a number, which is all a screenshot can do. */
      'shot-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Screenshot',
        subtitle: `From ${who.display_name}, today 11:04`,
        art: 'chart',
        label: 'Screenshot of a trading account',
        heading: `${platform} - account overview`,
        rowsHeading: 'What the picture shows',
        rows: [
          { label: 'Balance', value: 'USDT 14,380' },
          { label: 'This month', value: '+212%' },
          { label: 'Account holder', value: 'Not shown' },
          { label: 'Withdrawals', value: 'Not shown' },
          { label: 'Type', value: 'Image' },
        ],
        inertNote: 'Local preview. Nothing is opened or sent from here.',
      },

      /**
       * The phone's own Photos search, run on the two pictures she sent. Local
       * investigation: asking where else a picture appears asks Samira nothing.
       */
      'photo-search': {
        kind: SURFACE.APP,
        appName: 'Photos',
        appTagline: 'Search with an image',
        hero: {
          label: '2 photos from this chat',
          value: '31 matching pages',
          caption: 'Earliest match March 2021: a public fitness profile, “noor.fitlife”, Kuala '
            + 'Lumpur.',
          chips: ['Search run on this phone'],
        },
        sections: [
          {
            id: 'clinic', heading: 'Photo: at the clinic (21 Aug)',
            rows: [
              { label: 'Earliest seen', value: 'March 2021, noor.fitlife' },
              { label: 'Original caption', value: '“Leg day done 💪” - in a gym' },
              { label: 'Also posted by', value: '14 other profiles, under different names' },
            ],
          },
          {
            id: 'marina', heading: 'Photo: evening walk (4 Sep)',
            rows: [
              { label: 'Earliest seen', value: 'June 2022, noor.fitlife' },
              { label: 'Original location tag', value: 'Kuala Lumpur' },
            ],
            note: 'An image search shows where else a picture has appeared. It cannot tell you who '
              + 'is sending it to you.',
          },
        ],
        tabs: [
          { label: 'Photos', icon: 'home' },
          { label: 'Search', icon: 'history' },
          { label: 'Library', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The platform she is pushing. Its pages are local; two controls on it are decisions. */
      exchange: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'invite',
        pages: {
          invite: {
            url: `${root}/invite/${invite}`,
            host,
            title: `${platform} - invite`,
            blocks: [
              brand,
              { type: 'heading', text: `Welcome, friend of ${invite}` },
              { type: 'text', text: 'Private desk access. Our trading desk works for you around the clock.' },
              {
                type: 'summary',
                rows: [
                  { label: 'Your trial bonus', value: 'USDT 25 credited' },
                  { label: 'Desk return, 30 days', value: '+212%', strong: true },
                  { label: 'Capital', value: 'Guaranteed by the desk' },
                  { label: 'Members online', value: '1,284' },
                ],
              },
              { type: 'fineprint', text: 'Licensed and regulated. Certificate available on request.' },
            ],
            links: [{ id: 'w22-x-dash', label: 'Open my trial dashboard', to: 'dashboard' }],
          },
          dashboard: {
            url: `${root}/dashboard`,
            host,
            title: `${platform} - trial dashboard`,
            blocks: [
              brand,
              { type: 'heading', text: 'Trial dashboard' },
              {
                type: 'summary',
                rows: [
                  { label: 'Balance', value: 'USDT 25.00 (bonus)' },
                  { label: 'Today', value: '+18.4% - desk trade 09:12', strong: true },
                  { label: 'Withdrawable', value: 'After your first deposit' },
                ],
              },
              {
                type: 'notice',
                text: 'Verify your identity and make a first deposit of INR 2,000 to activate '
                  + 'withdrawals.',
              },
            ],
            links: [
              { id: 'w22-x-kyc', label: 'Verify identity', to: 'kyc' },
              { id: 'w22-x-deposit', label: 'Deposit INR 2,000', to: 'deposit-sheet' },
              { id: 'w22-x-withdraw', label: 'Withdraw', to: 'withdraw' },
            ],
          },
          withdraw: {
            url: `${root}/withdraw`,
            host,
            title: `${platform} - withdraw`,
            blocks: [
              brand,
              { type: 'heading', text: 'Withdraw' },
              {
                type: 'summary',
                rows: [
                  { label: 'Minimum balance', value: 'INR 50,000' },
                  { label: 'Withdrawal fee', value: '15% tax clearance, paid in advance' },
                  { label: 'Processing', value: 'After account activation' },
                ],
              },
            ],
            links: [{ id: 'w22-x-back', label: 'Back to dashboard', to: 'dashboard' }],
          },
          kyc: {
            url: `${root}/verify-identity`,
            host,
            title: `${platform} - verify identity`,
            blocks: [
              brand,
              { type: 'heading', text: 'Verify identity' },
              { type: 'text', text: 'Required by our licence. Takes one minute.' },
              {
                type: 'form',
                heading: 'Your details',
                fields: [
                  field({ name: 'name', label: 'Full name as on your ID', length: 3, max: 40 }),
                  field({ name: 'idno', label: 'PAN or Aadhaar number', length: 10, max: 14 }),
                  field({
                    name: 'account', label: 'Bank account number (for withdrawals)',
                    kind: FIELD_KIND.DIGITS, length: 9, max: 18,
                  }),
                ],
              },
            ],
            primary: { label: 'Continue', to: 'kyc-review' },
            links: [{ id: 'w22-k-back', label: 'Back to dashboard', to: 'dashboard' }],
          },
          'kyc-review': {
            url: `${root}/verify-identity/review`,
            host,
            title: `${platform} - review`,
            blocks: [
              brand,
              { type: 'heading', text: 'Review' },
              {
                type: 'summary',
                rows: [
                  { label: 'Name', value: 'As entered' },
                  { label: 'ID number', value: 'As entered' },
                  { label: 'Bank account', value: 'As entered' },
                  { label: 'Shared with', value: 'The desk and its payment partners' },
                ],
              },
            ],
            links: [{ id: 'w22-r-edit', label: 'Change the details', to: 'kyc' }],
          },
          'kyc-done': {
            final: true,
            url: `${root}/verify-identity/submitted`,
            host,
            title: `${platform} - submitted`,
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Verification',
                text: 'Submitted.',
                rows: [
                  { label: 'Status', value: 'Pending - make your first deposit to activate' },
                  { label: 'Support', value: 'Your desk manager, on WhatsApp' },
                ],
              },
            ],
          },
        },
      },

      'deposit-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Confirm payment',
        app: 'UPI',
        amount: 'INR 2,000.00',
        subtitle: `${platform} - first deposit`,
        rows: [
          { label: 'Paying', value: 'PRIYA M (desk payment partner)' },
          { label: 'UPI ID', value: 'priya.m88@trainingpay' },
          { label: 'Account type', value: 'Individual savings account' },
          { label: 'Note', value: 'The desk credits USDT after the partner confirms' },
          { label: 'Reversible', value: 'No' },
        ],
        form: {
          heading: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Money sent by UPI to another person’s account cannot be recalled by the sender.',
      },

      /** The regulator's own public register, from an app installed from the official store. */
      register: {
        kind: SURFACE.APP,
        appName: 'Investor Check',
        appTagline: 'Markets regulator - public register',
        hero: {
          label: `Search: ${platform}`,
          value: 'No registered entity',
          caption: 'Not registered as an exchange, broker, adviser or virtual-asset service '
            + 'provider.',
          chips: ['Official app', 'Register updated today'],
        },
        sections: [
          {
            id: 'caution', heading: 'Caution list',
            rows: [
              { label: platform, value: 'Added 2 Sep - unregistered platform promoted through messaging apps' },
              { label: host, value: 'Listed 2 Sep' },
            ],
          },
          {
            id: 'rules', heading: 'Before you invest',
            rows: [
              { label: 'Guaranteed returns', value: 'Not permitted for any registered entity' },
              { label: 'Deposits', value: 'Registered platforms never take deposits into a personal UPI ID' },
              { label: 'Withdrawals', value: 'No registered platform charges a fee in advance to release your money' },
            ],
          },
        ],
        tabs: [
          { label: 'Search', icon: 'home' },
          { label: 'Caution list', icon: 'history' },
          { label: 'Learn', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w22-dir-bank',
        name: 'Falcon Bank - customer protection desk',
        identifier: '+91 00000 38301',
        provenance: 'local approved directory',
        role: 'Check an investment platform or a payment request before you send money.',
      },
      {
        id: 'w22-dir-cyber',
        name: 'Cyber crime reporting desk',
        identifier: '+91 00000 38399',
        provenance: 'local approved directory',
        role: 'Report online investment and relationship crime. Keep the chat as evidence.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w22-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w22-c02', slot: SLOT.INLINE,
            label: 'Reply "Tell me more 😊" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w22-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, when you saved it, the photos she has sent',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w22-c04', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w22-c05', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w22-branch-link', slot: SLOT.INLINE, anchor: 'w22-link',
            label: 'Open', opens: 'exchange',
          }),
          navigate({
            id: 'w22-branch-shot', slot: SLOT.INLINE, anchor: 'w22-shot',
            label: 'View', opens: 'shot-viewer',
          }),
          action({
            id: 'w22-c06', slot: SLOT.SURFACE,
            on: 'exchange', page: 'kyc-review', thenPage: 'kyc-done', label: 'Submit verification',
          }),
          action({
            id: 'w22-c07', slot: SLOT.SURFACE,
            on: 'deposit-sheet', label: 'Pay INR 2,000', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'w22-c08', slot: SLOT.COMPOSER,
            label: 'Send me your withdrawal proof first, then I will start',
            echo: 'Send me your withdrawal proof first, then I will start.',
          }),
          action({
            id: 'w22-c09', slot: SLOT.MENU,
            label: `Video call ${who.display_name} to talk it through`,
          }),
          action({
            id: 'w22-c10', slot: SLOT.COMPOSER,
            label: 'I like talking to you, but I don’t invest through anyone I have only met online.',
            echo: 'I like talking to you, but I don’t invest through anyone I have only met online.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w22-c11',
            slot: SLOT.MENU, label: `Look up ${platform} in the Investor Check app`,
            hint: 'The regulator’s public register, not a link from the chat', opens: 'register',
          }),
          action({
            id: 'w22-c12',
            slot: SLOT.MENU,
            label: 'Ask the bank’s customer protection desk from the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w22-c13',
            slot: SLOT.MENU,
            label: `Ask ${who.display_name} to prove the desk is real`,
          }),
          action({
            id: 'w22-c14', slot: SLOT.MENU,
            label: `Report ${who.display_name}`,
          }),
          action({
            id: 'w22-c15', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w22-c16', slot: SLOT.INLINE,
            label: 'Export the chat, then report and block',
          }),
          action({
            id: 'w22-c17', slot: SLOT.INLINE,
            label: 'Try the INR 2,000 start and see',
          }),
          action({
            id: 'w22-c18', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
          action({
            id: 'w22-c19', slot: SLOT.MENU,
            label: 'Keep chatting, just don’t invest',
          }),
          action({
            id: 'w22-c20', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w22-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w22-nav-photos', slot: SLOT.MENU, label: 'Photos - search with an image',
        opens: 'photo-search', after: 'inspect',
      }),
      navigate({
        id: 'w22-nav-exchange', slot: SLOT.MENU, label: `${platform} (the link she sent)`,
        opens: 'exchange', after: 'verify',
      }),
    ],

    supportDesk: desk,
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, link, me, social, splitHeadline, them,
} from './shared.js'

/**
 * I13 - Deployed Officer Romance Profile (IMMERSIVE-004C). Medium.
 *
 * Four months of messages, not four. The thread opens in the main inbox rather than in
 * Requests, because the learner accepted this account in June and has been talking to it
 * since - and that history is where most of the evidence is: a "good morning" sent at 03:12,
 * a leave date that has moved twice, a video call that is never possible, and a parcel the
 * learner never asked for that is now being held.
 *
 * What separates it from W22 (the long online friendship that ends in a trading deposit) and
 * from I04 (a copied account asking for bus fare today) is the INVESTIGATION rather than the
 * ask. The client's stage 5 allows a reverse-image tool to be represented locally for
 * training, and that is this scene's decisive surface: a local, offline Image Match index
 * that finds the same photograph on two other accounts and on a stock listing, with three
 * different names on it. Nothing in the thread proves anything; the picture does.
 *
 * The release itself is the client's "customs-payment mock with crypto/gift-card choices" -
 * one portal, three ways to pay, all of them irreversible, plus the quieter release the
 * learner can make without leaving the chat: photographing their own identity card so the
 * parcel "clears in their name".
 */
export function buildI13(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const name = 'Aarav Menon'
  const portalHost = 'cargorelease.training.example'
  const portalUrl = `https://${portalHost}/GCR-7741`
  const caseRef = 'GCR-7741'
  const fee = 'INR 21,500'

  return {
    scenarioId: 'I13',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Messages',
          rows: [
            { id: 'i13-row', handle, name, preview: text, time: '14m', unread: true },
            { id: 'i13-bg-1', handle: 'nisha.bakes', name: 'Nisha', preview: 'You: I’ll call you in the evening', time: '5h', outgoing: true, inert: true },
            { id: 'i13-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: photos from Sunday 📷', time: '2d', inert: true },
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
      request: false,
    },

    beats: [
      day('i13-d1', '12 JUNE'),
      them('i13-b1', 'Thank you for accepting 🙏 Your ridge photographs are beautiful. I am posted far from home and these are a window for me.', '21:40'),
      me('i13-b2', 'Thank you! Where are you posted?', '21:52'),
      them('i13-b3', 'A multinational logistics detachment. I cannot say more than that, you understand 🙂', '21:55'),

      day('i13-d2', '3 AUGUST'),
      them('i13-b4', 'I woke thinking of you before the shift. Good morning ❤️', '03:12'),
      me('i13-b5', 'You are up early!', '07:30'),
      them('i13-b6', 'Always. My leave is approved for October - I am coming to meet your family.', '07:41'),
      me('i13-b7', 'Can we video call this weekend?', '07:42'),
      them('i13-b8', 'The detachment allows only text on the satellite link. Soon, I promise.', '07:58'),

      day('i13-d3', 'YESTERDAY'),
      them('i13-b9', 'I have sent a parcel ahead of me through a courier the detachment uses. My mother’s chain for you, my papers, and my savings in cash. I know it should not have gone that way.', '20:14'),

      day('i13-d4', 'TODAY'),
      them('i13-b10', text, '13:55'),
      link('i13-link', {
        title: `Global Cargo Release · Case ${caseRef}`,
        description: 'Consignment held pending release fee',
        displayUrl: `${portalHost}/${caseRef}`,
        time: '13:56',
      }),
      them('i13-b11', `I cannot reach my bank from the detachment. ${fee}. You will have it back the day I land ❤️`, '13:57'),

      them('i13-b12', 'The desk officer has written to me. If it is not cleared tonight the consignment goes to auction. I have never asked you for anything.', '14:20', { since: 'branch' }),

      /**
       * Two different releases produce `simulated_data_submission` here - the gift cards and
       * the identity card - so this beat says what is true of both rather than naming one.
       */
      them('i13-after-id', 'Thank you my love 🙏 The desk has written again: one more thing is needed before it clears tonight - the first page of your bank passbook.', '14:27', {
        since: 'verify', afterConsequence: 'simulated_data_submission',
      }),
      {
        kind: 'system', id: 'i13-after-pay', tone: 'banner',
        text: `${fee} sent. The release desk has written again: storage and insurance of INR 34,000 are now due before the consignment can move.`,
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      me('i13-echo-soon', 'I will arrange it tonight', '14:26', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i13-after-soon', 'Thank you my love 🙏 Send a screenshot the moment it is done, the desk closes at 20:00.', '14:26', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
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
            category: 'Public figure',
            verified: false,
            avatarArt: 'person',
            stats: { posts: '147', followers: '2,847', following: '134', followersTo: 'followers' },
            bio: ['Multinational logistics detachment', 'Duty first, family always', 'Widower · one daughter'],
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Following', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            grid: [
              { art: 'person', title: '', note: 'Posted 4 days ago' },
              { art: 'field', title: '', note: 'Posted 2 weeks ago' },
              { art: 'person', title: '', note: 'Posted 3 weeks ago' },
              { art: 'crest', title: '', note: 'Posted 1 month ago' },
              { art: 'person', title: '', note: 'Posted 2 months ago' },
              { art: 'field', title: '', note: 'Posted 3 months ago' },
            ],
            note: 'All 147 posts were added between May and September 2026.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'May 2026 (4 months ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
              { label: 'Tagged in', value: 'No photos' },
            ],
            formerUsernames: [
              { handle: 'capt.aarav.intl', when: 'June 2026' },
              { handle: 'aarav_peacekeeper_2026', when: 'July 2026' },
            ],
          },
          followers: {
            view: 'people',
            title: 'Followers',
            heading: 'Followers you know: none',
            people: [
              { handle: 'lonely_hearts_intl', name: '', note: 'Follows 4,900 accounts' },
              { handle: 'priya.widow.2019', name: '', note: 'Follows 3,100 accounts' },
              { handle: 'army_love_quotes_hd', name: '', note: 'Follows 6,200 accounts' },
            ],
            note: 'Of 2,847 followers, none follow you and none are followed by anyone you follow.',
          },
          pinned: {
            view: 'post',
            handle,
            name,
            verified: false,
            subline: 'Pinned',
            slides: [{ art: 'person', title: '', subtitle: 'Studio portrait, uniform, plain grey backdrop' }],
            likes: '1,902 likes',
            caption: 'Wherever duty sends me, home is a person, not a place. 🙏',
            comments: [
              { author: 'army_love_quotes_hd', text: 'God bless you sir 🙏🙏' },
              { author: 'm.fernandes.44', text: 'i have seen this exact photo on another page with a different name, is that you?' },
              { author: 'priya.widow.2019', text: 'Stay safe ❤️' },
            ],
            time: 'Pinned · 2 months ago',
          },
        },
      }),

      /** The release portal the message links to. Three ways to pay, all of them final. */
      release: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'case',
        pages: {
          case: {
            url: portalUrl,
            host: portalHost,
            title: 'Consignment held',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'GC', name: 'Global Cargo Release', tagline: 'Consignment desk' },
              { type: 'heading', text: `Consignment ${caseRef} is held` },
              {
                type: 'summary',
                rows: [
                  { label: 'Consignee', value: LEARNER.name },
                  { label: 'Sender', value: 'A. Menon' },
                  { label: 'Declared', value: 'Documents, one gold chain, currency' },
                  { label: 'Release fee', value: fee, strong: true },
                ],
              },
              { type: 'notice', text: 'Storage begins after 24 hours. Unreleased consignments are auctioned.' },
              { type: 'fineprint', text: 'Release fees are collected on behalf of the carrier and are non-refundable once paid.' },
            ],
            primary: { label: 'Release the consignment', to: 'methods' },
          },
          methods: {
            url: `${portalUrl}/pay`,
            host: portalHost,
            title: 'How to pay',
            secure: true,
            blocks: [
              { type: 'heading', text: `Pay the release fee of ${fee}` },
              {
                type: 'summary',
                rows: [
                  { label: 'Cards', value: 'Not accepted for consignment release' },
                  { label: 'Bank transfer', value: 'Not available for this corridor' },
                  { label: 'Accepted', value: 'Retail gift cards, or a wallet transfer', strong: true },
                ],
              },
              { type: 'text', text: 'Gift cards are read from the photograph of the back of the card; the balance is applied to the case immediately.' },
            ],
            links: [
              { id: 'i13-l-gift', label: 'Pay with gift cards', to: 'giftcard' },
              { id: 'i13-l-wallet', label: 'Pay from a wallet', to: 'wallet' },
            ],
          },
          giftcard: {
            url: `${portalUrl}/pay/gift`,
            host: portalHost,
            title: 'Gift card release',
            secure: true,
            blocks: [
              { type: 'heading', text: `Enter two gift cards totalling ${fee}` },
              {
                type: 'form',
                heading: 'Card one',
                fields: [
                  field({ name: 'card1', label: 'Gift card number', kind: FIELD_KIND.DIGITS, length: 16, group: 4 }),
                  field({ name: 'pin1', label: 'Scratch PIN', kind: FIELD_KIND.SECRET, length: 6 }),
                ],
              },
              {
                type: 'form',
                heading: 'Card two',
                fields: [
                  field({ name: 'card2', label: 'Gift card number', kind: FIELD_KIND.DIGITS, length: 16, group: 4 }),
                  field({ name: 'pin2', label: 'Scratch PIN', kind: FIELD_KIND.SECRET, length: 6 }),
                ],
              },
            ],
            primary: { label: 'Review', to: 'confirm' },
          },
          confirm: {
            url: `${portalUrl}/pay/confirm`,
            host: portalHost,
            title: 'Confirm',
            secure: true,
            blocks: [
              { type: 'heading', text: `Apply ${fee} in gift cards to ${caseRef}?` },
              {
                type: 'summary',
                rows: [
                  { label: 'Applied now', value: fee },
                  { label: 'Refundable', value: 'No' },
                  { label: 'Released to', value: 'The carrier, not the sender' },
                ],
              },
            ],
          },
          done: {
            url: `${portalUrl}/pay/confirm`,
            host: portalHost,
            title: 'Applied',
            final: true,
            blocks: [
              { type: 'result', heading: 'Balance applied', text: `${caseRef} moves to the next desk for storage and insurance assessment.` },
            ],
          },
        },
      },

      wallet: {
        kind: SURFACE.PAYSHEET,
        title: 'Send',
        app: 'Wallet',
        amount: 'INR 21,500.00',
        subtitle: `Consignment ${caseRef}`,
        rows: [
          { label: 'To', value: 'GCR RELEASE DESK' },
          { label: 'Address', value: 'tb1qgcr7741release0training0example' },
          { label: 'Network', value: 'Transfers on this network cannot be reversed' },
        ],
        form: {
          heading: 'Enter wallet PIN',
          fields: [field({ name: 'pin', label: 'Wallet PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
      },

      /**
       * The client's stage 5 allows a reverse-image tool to be represented locally. This is
       * that tool: an offline index held on the device, searched by the learner, answering
       * only about the photograph.
       */
      imagematch: {
        kind: SURFACE.APP,
        appName: 'Image Match',
        appTagline: 'Local index · works offline',
        hero: {
          label: `Profile photograph · @${handle}`,
          value: '3 matches in the local index',
          caption: 'The same photograph is indexed under three other names.',
          chips: ['Local index', 'Nothing was uploaded'],
        },
        sections: [
          {
            id: 'i13-match-1', heading: 'Match 1 · indexed March 2024',
            rows: [
              { label: 'Where', value: 'A stock photography listing' },
              { label: 'Caption', value: '“Serviceman in dress uniform, studio portrait, model released”' },
            ],
          },
          {
            id: 'i13-match-2', heading: 'Match 2 · indexed November 2025',
            rows: [
              { label: 'Where', value: 'An account named @maj.rohit.fieldops' },
              { label: 'Note', value: 'Account removed by the platform in January 2026' },
            ],
          },
          {
            id: 'i13-match-3', heading: 'Match 3 · indexed July 2026',
            rows: [
              { label: 'Where', value: 'An account named @col.samuel.unhq' },
              { label: 'Note', value: 'Still active. Same photograph, different name and rank.' },
            ],
          },
          {
            id: 'i13-match-note', heading: 'What this tool can and cannot say',
            rows: [
              { label: 'Can say', value: 'Whether this exact photograph appears elsewhere in the local index.' },
              { label: 'Cannot say', value: 'Who any person is. Identity is confirmed through the unit, not through a picture.' },
            ],
          },
        ],
        tabs: [
          { label: 'Search', icon: 'home' },
          { label: 'History', icon: 'history' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i13-c01', slot: SLOT.INLINE,
            label: `Open your conversation with ${name}`,
          }),
          action({
            id: 'i13-c02', slot: SLOT.INLINE,
            label: 'Reply “how much?” from the list',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i13-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, followers, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i13-c04', slot: SLOT.MENU,
            label: 'Read the whole conversation from June',
          }),
          action({
            id: 'i13-c05', slot: SLOT.MENU,
            label: 'Go straight to the release page',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i13-c06', slot: SLOT.SURFACE, on: 'release', page: 'confirm',
            label: `Apply ${fee} in gift cards`, thenPage: 'done',
          }),
          action({
            id: 'i13-c07', slot: SLOT.SURFACE, on: 'wallet',
            label: `Send ${fee}`, targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i13-c08', slot: SLOT.SURFACE, on: 'release',
            label: 'Close the release page', closes: true,
          }),
          action({
            id: 'i13-c09', slot: SLOT.COMPOSER,
            label: 'Send a photo of your ID card so it clears in your name',
            echo: 'Sending my ID card photo',
          }),
          action({
            id: 'i13-c10', slot: SLOT.COMPOSER,
            label: 'Say you will arrange it tonight', echo: 'I will arrange it tonight',
          }),
          action({
            id: 'i13-c11', slot: SLOT.MENU,
            label: 'Say you will not send money, and stop there',
          }),
          navigate({
            id: 'i13-nav-release', slot: SLOT.INLINE, anchor: 'i13-link',
            label: 'Open the release page', opens: 'release',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i13-c12', slot: SLOT.MENU,
            label: 'Check the profile photograph in Image Match',
            hint: 'The offline index on this device', opens: 'imagematch',
          }),
          action({
            id: 'i13-c13',
            slot: SLOT.MENU, label: `Ask ${desk.name || 'the support desk'} from the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i13-c14',
            slot: SLOT.MENU, label: 'Ask him for his service number and a video call',
          }),
          action({ id: 'i13-c15', slot: SLOT.MENU, label: 'Report the account' }),
          action({ id: 'i13-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i13-c17', slot: SLOT.INLINE,
            label: 'Keep the conversation as evidence and report the account',
          }),
          action({
            id: 'i13-c18', slot: SLOT.INLINE,
            label: 'Carry on with him and settle the fee later',
          }),
          action({
            id: 'i13-c19', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i13-c20', slot: SLOT.MENU,
            label: 'Leave the chat as it is and wait for October',
          }),
          action({
            id: 'i13-c21', slot: SLOT.MENU,
            label: 'Delete the conversation and say nothing to anyone',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i13-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i13-nav-image', slot: SLOT.MENU, label: 'Open Image Match', opens: 'imagematch', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i13-dir-legal',
        name: 'Unit Falcon welfare and legal cell',
        identifier: '+91 00000 72397 ext 4477',
        provenance: 'local approved directory',
        role: 'Takes reports of online relationships that turn into money requests. No customs, courier or consignment desk collects a fee through a person you met online.',
      },
    ],
  }
}

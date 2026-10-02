import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, sharedPost, social, splitHeadline, system, them,
} from './shared.js'

/**
 * I23 - Compromised Charity Influencer (IMMERSIVE-004E). Hard.
 *
 * The learner has been in Maya's broadcast channel since 2024 and has watched two surgeries get
 * funded through Instagram's own Donate button, paid to the same registered trust. Today the same
 * verified account - really hers, with eight years of history - posts an emergency, "crypto only,
 * two hours", with a wallet address, comments turned off and a request to put it on your story.
 *
 * What is new to the product: the entry is an Instagram **broadcast channel**, where members
 * cannot reply at all (only react), so the usual "just ask them" is not even on the screen; and the
 * account is not a copy. Every identity check passes. What fails is the **beneficiary**: the
 * channel's own history shows every earlier fundraiser paid to Asha Care Trust through the Donate
 * button, and today's post has no fundraiser, a changed bio link and three posts in an hour that
 * look nothing like the eight years before them.
 *
 * The decision is made on the channel message itself - "Share to your story" is a control the
 * message carries - and on the wallet sheet the address opens (PIN, then Send). Not sending and not
 * sharing is the pivot. The check is the trust's own website from the learner's bookmarks, which
 * has already posted that Maya's account was taken over, and the trust's saved helpline.
 */
export function buildI23(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const desk = directory(scenario)
  const deskName = desk.name || 'Unit Falcon Support Desk'
  const channel = 'Maya’s Care Circle 💛'
  const trust = 'Asha Care Trust'
  const trustHost = 'ashacare.training.example'
  const helpline = '+91 00000 52318'
  const wallet = '9e41k77ab02fdq'
  const amount = '₹5,000'

  return {
    scenarioId: 'I23',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Channels',
          rows: [
            { id: 'i23-row', handle, name: channel, preview: `${handle}: ${text}`, time: '2m', unread: true },
            { id: 'i23-bg-1', handle: 'trek.club.pune', name: 'Pune Trek Club · channel', preview: 'Route for Sunday is up', time: '1d', inert: true },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i23-bg-2', handle: 'nisha.bakes', name: 'Nisha', preview: 'did you see maya’s post??', time: '5m', inert: true },
            { id: 'i23-bg-3', handle: 'dev_fit', name: 'Dev', preview: 'You: sunday works', time: '3h', inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: channel,
      handle,
      name: channel,
      subline: 'Broadcast channel · 18.4K members',
      verified: true,
      request: false,
      readOnly: `Only ${handle} can send messages in this channel. Members can react.`,
    },

    beats: [
      system('i23-joined', `${handle} started this channel · You joined in March 2024`),

      day('i23-d1', '4 AUGUST'),
      them('i23-b1', 'Aarav’s surgery is fully funded 🙏 Thank you, all 1,212 of you. Receipts are on Asha Care Trust’s page as always.', '18:10'),
      sharedPost('i23-fund1', {
        author: handle,
        verified: true,
        art: 'person',
        title: `Fundraiser for ${trust} ✓`,
        caption: 'Donate button · ₹6,40,000 raised of ₹6,00,000',
        time: '18:10',
      }),

      day('i23-d2', '1 SEPTEMBER'),
      them('i23-b2', 'Next up: Riya’s cardiac care. As always, give only through the fundraiser on my post - it goes straight to the trust.', '09:30'),

      day('i23-d3', 'TODAY'),
      them('i23-b3', text, '12:59'),
      them('i23-b4', 'The hospital changed the rules this morning and the trust account is frozen, so it has to be crypto. Comments are off to stop spam.', '12:59'),
      them('i23-wallet', `Wallet address: ${wallet}`, '13:00'),
      them('i23-b5', 'Put this on your story - the next two hours decide everything 💔', '13:00'),

      them('i23-b6', '₹1,40,000 in so far. 1 hour 20 minutes left.', '13:34', { since: 'branch' }),

      {
        kind: 'system', id: 'i23-after-pay', tone: 'banner',
        text: `The transfer to ${wallet} cannot be reversed. Ten minutes later the channel posted a higher target.`,
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'i23-after-share', tone: 'banner',
        text: 'Your story now shows the wallet address to your followers, under your name. Two of them have already asked you if it is safe.',
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
            name: 'Maya Iyer',
            category: 'Creator',
            verified: true,
            following: true,
            stats: { posts: '1,088', followers: '212K', following: '402' },
            bio: ['Hospital visits, one family at a time 💛', 'Every fundraiser runs through the Donate button'],
            bioLink: { label: 'careflow-now.training.example' },
            mutuals: 'Followed by nisha.bakes, anjali.m and 61 others you follow',
            buttons: ['Following', 'Message'],
            aboutTo: 'about',
            compareTo: { to: 'fundraisers', label: 'Fundraisers' },
            storyTo: { to: 'story', label: 'Story · 40m' },
            note: 'Comments are turned off on the 3 newest posts.',
            grid: [
              { art: 'notice', title: '', note: '38m' },
              { art: 'notice', title: '', note: '52m' },
              { art: 'notice', title: '', note: '1h' },
              { art: 'person', title: '', note: '2w' },
              { art: 'person', title: '', note: '3w' },
              { art: 'cafe', title: '', note: '5w' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'April 2016' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'Yes · since 2021' },
              { label: 'Accounts you both follow', value: '63' },
            ],
            formerUsernames: [],
            note: 'You have followed this account since 2022.',
          },
          fundraisers: {
            view: 'list',
            title: 'Fundraisers',
            heading: `${handle}’s fundraisers`,
            rows: [
              { art: 'person', title: 'Riya’s cardiac care', text: `Beneficiary: ${trust} ✓ · Donate button`, meta: 'Open · ₹2,10,000 raised' },
              { art: 'person', title: 'Aarav’s surgery', text: `Beneficiary: ${trust} ✓ · Donate button`, meta: 'Completed August 2026' },
              { art: 'person', title: 'Meena’s dialysis', text: `Beneficiary: ${trust} ✓ · Donate button`, meta: 'Completed May 2026' },
            ],
            note: 'Today’s emergency post has no fundraiser attached.',
          },
          story: {
            view: 'story',
            handle,
            time: '40m',
            segments: 3,
            art: 'notice',
            sticker: 'EMERGENCY · CRYPTO ONLY',
            caption: 'Wallet in my channel. Two hours. Please share.',
          },
        },
      }),

      /** The wallet the address opens. Opening it is navigation; Send (after a PIN) is the decision. */
      pay: {
        kind: SURFACE.PAYSHEET,
        title: 'Send',
        app: 'Crypto wallet',
        amount,
        subtitle: 'To a wallet address',
        rows: [
          { label: 'To', value: wallet },
          { label: 'Name', value: 'Not available for this address' },
          { label: 'Reversible', value: 'No' },
          { label: 'Receipt', value: 'None' },
        ],
        form: {
          heading: 'Confirm with your PIN',
          fields: [field({ name: 'pin', label: 'Wallet PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Transfers to a wallet address arrive in minutes.',
      },

      /** The trust's own website, from the learner's bookmarks. */
      trust: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'donate',
        pages: {
          donate: {
            url: `https://${trustHost}/donate`,
            host: trustHost,
            title: `${trust} - How to give`,
            blocks: [
              { type: 'brand', monogram: 'AC', name: trust, tagline: 'Registered charity · bookmarked' },
              { type: 'notice', text: `Today 14:10 - Messages in @${handle}'s channel this afternoon asking for crypto were not sent by Maya. Her account was taken over this morning and she is working to recover it. Riya's care is fully booked through us.` },
              { type: 'heading', text: 'How to give' },
              {
                type: 'summary',
                rows: [
                  { label: 'On Instagram', value: 'Only the Donate button on a fundraiser that names us' },
                  { label: 'Bank / UPI', value: 'ashacare@trainingbank' },
                  { label: 'Cryptocurrency', value: 'We do not accept it' },
                ],
              },
            ],
            links: [{ id: 'i23-trust-contact', label: 'Contact us', to: 'contact' }],
          },
          contact: {
            url: `https://${trustHost}/contact`,
            host: trustHost,
            title: `${trust} - Contact`,
            blocks: [
              { type: 'heading', text: 'Contact us' },
              { type: 'summary', rows: [{ label: 'Helpline', value: helpline }, { label: 'Hours', value: '9:00-21:00' }] },
            ],
          },
        },
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${trust} helpline`,
        number: helpline,
        script: [
          { at: 0, speaker: 'them', text: `${trust}, Leela speaking.` },
          { at: 4, speaker: 'you', text: 'Maya’s channel is asking for crypto for Riya’s surgery. Is that from you?' },
          { at: 10, speaker: 'them', text: 'No. Riya’s care is fully booked through us. Maya lost access to her account this morning - please report the post and don’t send anything.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i23-c01', slot: SLOT.INLINE,
            label: `Open ${channel}`,
          }),
          action({
            id: 'i23-c02', slot: SLOT.INLINE,
            label: 'Send from the preview without opening the channel', targetId: paymentAsset,
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i23-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, fundraisers and recent posts',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i23-c04', slot: SLOT.MENU,
            label: 'Scroll back through the channel’s earlier fundraisers',
          }),
          action({
            id: 'i23-c05', slot: SLOT.MENU,
            label: 'Go straight to the wallet address',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'i23-nav-pay', slot: SLOT.INLINE, anchor: 'i23-wallet',
            label: 'Open in wallet', opens: 'pay',
          }),
          action({
            id: 'i23-c06', slot: SLOT.SURFACE, on: 'pay',
            label: `Send ${amount}`, targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i23-c07', slot: SLOT.INLINE, anchor: 'i23-b5',
            label: 'Share to your story',
          }),
          action({
            id: 'i23-c08', slot: SLOT.MENU,
            label: 'Send nothing and share nothing until the trust confirms',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i23-c09', slot: SLOT.MENU,
            label: `Open ${trust}’s website from your bookmarks`,
            hint: trustHost, opens: 'trust',
          }),
          action({
            id: 'i23-c10', slot: SLOT.MENU,
            label: 'Ring the trust helpline saved in your contacts',
            hint: helpline, opens: 'call',
          }),
          action({
            id: 'i23-c11',
            slot: SLOT.MENU, label: `Look up ${deskName} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i23-c12',
            slot: SLOT.MENU, label: 'Reply to Maya’s story to ask if it’s really her',
          }),
          action({ id: 'i23-c13', slot: SLOT.MENU, label: `Report ${handle}’s post` }),
          action({ id: 'i23-c14', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i23-c15', slot: SLOT.INLINE,
            label: `Report the post, and let ${trust} know what you saw`,
          }),
          action({
            id: 'i23-c16', slot: SLOT.INLINE,
            label: 'Donate later once the target is nearly met',
          }),
          action({
            id: 'i23-c17', slot: SLOT.MENU,
            label: 'Leave the channel and block the account until Maya is back',
          }),
          action({
            id: 'i23-c18', slot: SLOT.MENU,
            label: 'Keep the wallet address in case the trust really is frozen',
          }),
          action({
            id: 'i23-c19', slot: SLOT.MENU,
            label: 'Mute the channel and say nothing',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i23-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i23-dir-trust',
        name: `${trust} helpline`,
        identifier: helpline,
        provenance: 'saved contact',
        role: 'Registered charity. Number saved from its own website.',
      },
    ],
  }
}

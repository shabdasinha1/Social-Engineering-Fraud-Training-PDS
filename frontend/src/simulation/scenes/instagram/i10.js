import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, day, directory, me, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I10 - Brand Collaboration Shipping Fee (IMMERSIVE-004B). Medium.
 *
 * An account presenting itself as a sports brand's collaborations team tells the learner - a
 * small outdoor creator - that their trek reels were shortlisted from thousands, offers a kit
 * worth INR 8,999 for free, and asks only INR 199 shipping, through the link in its bio. In
 * return: two stories and a reel tagging the account. Flattery lowers the guard; the free kit
 * makes paying a little feel like fairness.
 *
 * What it teaches that I01 (a giveaway "win" settled by the brand's pinned rules) does not is
 * READING WHAT YOU ARE ASKED TO SIGN. The bio link is a creator agreement, and its clauses are
 * where the offer turns: the ambassador shares their Instagram login "so the creator team can
 * publish", and after thirty days the saved card is charged INR 1,499 a month for a "kit
 * club". The account's own pinned post carries the rest of the evidence in its comments -
 * the photo is the brand's own from last year, and a creator who paid shipping is still
 * waiting. The client's verification is the brand contacted through its separately found
 * official site, which is where the brand says who it works through and what it never asks.
 */
export function buildI10(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const contractUrl = browserAsset?.display_target ?? 'https://i10.training.example/verify'
  const contractHost = browserAsset?.content?.host ?? 'i10.training.example'
  const official = 'peakgear'
  const siteHost = 'peakgear.training.example'
  const name = 'PeakGear Collabs'
  const brand = { type: 'brand', monogram: 'PG', name: 'PeakGear Ambassador Programme', tagline: 'Creator agreement' }

  return {
    scenarioId: 'I10',
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
            { id: 'i10-row', handle, name, preview: text, time: '5m', request: true, unread: true },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i10-bg-1', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: your reel is on the club page 🙌', time: '3h', inert: true },
            { id: 'i10-bg-2', handle: 'nisha.bakes', name: 'Nisha', preview: 'You: haha yes', time: '1d', outgoing: true, inert: true },
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
      requestCard('i10-request', {
        name,
        handle,
        verified: false,
        stats: { posts: '38', followers: '2,906', following: '7,112' },
        relation: 'Not following each other · joined 11 days ago',
      }),
      day('i10-day', 'MESSAGE REQUEST'),
      them('i10-b1', `Hey @${LEARNER.handle} 👋 our team LOVED your Sahyadri trek reel 🔥`, '10:48'),
      them('i10-b2', 'You’ve been shortlisted from 2,000+ creators for the PeakGear Trail Ambassador programme 🏔️', '10:49'),
      them('i10-b3', text, '10:49'),
      them('i10-b4', 'Kit worth INR 8,999: trail jacket + shoes. In return, just 2 stories and 1 reel tagging us 🙌 Agreement and shipping are at the link in our bio.', '10:50'),

      them('i10-b5', 'Only 3 kits left in your size. The offer closes tonight ⏳', '10:53', { since: 'branch' }),

      me('i10-echo-yes', 'YES! I’m in 🙌', '10:54', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i10-after-yes', 'Amazing!! Sign the agreement and pay shipping so we can dispatch today 📦', '10:54', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i10-after-sign', tone: 'banner',
        text: 'INR 199 charged to your card. New login to your Instagram account from another device.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      them('i10-after-pay', 'Payment received ✅ Customs and insurance for the kit: INR 1,499. Pay within 1 hour or the kit is released.', '10:57', {
        since: 'verify', afterConsequence: 'simulated_payment',
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
            category: 'Sportswear store',
            verified: false,
            avatarArt: 'gear',
            stats: { posts: '38', followers: '2,906', following: '7,112' },
            bio: ['🏔️ PeakGear ambassador team', '🎁 Free kits for selected creators', '👇 Agreement + shipping'],
            bioLink: { label: `${contractHost}/verify`, to: 'contract' },
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            grid: [
              { art: 'gear', title: 'Summit jacket', note: 'Pinned' },
              { art: 'gear', title: '', note: 'Posted 9 days ago' },
              { art: 'trail', title: '', note: 'Posted 9 days ago' },
              { art: 'gear', title: '', note: 'Posted 10 days ago' },
              { art: 'trail', title: '', note: 'Posted 10 days ago' },
              { art: 'gear', title: '', note: 'Posted 11 days ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'September 2026 (11 days ago)' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
            ],
            formerUsernames: [
              { handle: 'fitness.giveaway.hub', when: 'August 2026' },
              { handle: 'trekgear.deals', when: 'September 2026' },
            ],
          },
          pinned: {
            view: 'post',
            handle,
            name,
            verified: false,
            subline: 'Pinned',
            slides: [
              { art: 'gear', title: 'SUMMIT JACKET', subtitle: 'Built for the monsoon ridge' },
            ],
            likes: '61 likes',
            caption: 'Built for the monsoon ridge. The Summit jacket is back 🏔️ Want one free? We’re selecting ambassadors now - DM us.',
            comments: [
              { author: 'anika.trails', text: 'this is @peakgear’s launch photo from March 2025, same caption too?' },
              { author: 'hike.with.sam', text: 'paid 199 shipping 3 weeks ago, still no tracking number' },
              { author: handle, text: 'DM us 💬 we reply to everyone' },
            ],
            time: 'Pinned · 9 days ago',
          },
        },
      }),

      contract: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'agreement',
        pages: {
          agreement: {
            url: contractUrl,
            host: contractHost,
            title: 'Ambassador agreement',
            secure: true,
            blocks: [
              brand,
              { type: 'heading', text: 'Trail Ambassador Agreement' },
              {
                type: 'summary',
                rows: [
                  { label: 'Creator', value: `@${LEARNER.handle}` },
                  { label: 'Kit', value: 'Trail jacket + shoes (INR 8,999)' },
                  { label: 'You pay', value: 'INR 199 shipping', strong: true },
                  { label: 'Your part', value: `2 stories + 1 reel tagging @${handle}` },
                ],
              },
              { type: 'notice', text: 'Kit reserved in your size until 11:59 PM.' },
              { type: 'text', text: 'Terms and conditions' },
              { type: 'fineprint', text: '3.1 Shipping and handling of INR 199 is paid by the Ambassador and is non-refundable.' },
              { type: 'fineprint', text: '4.2 So that collaboration content can be published on time, the Ambassador shares their Instagram username and password with the PeakGear creator team.' },
              { type: 'fineprint', text: '7.1 After 30 days the card used for shipping is charged INR 1,499 per month for the Ambassador Kit Club until cancelled in writing.' },
            ],
            primary: { label: 'Accept and continue', to: 'details' },
            links: [{ id: 'i10-upi', label: 'Pay shipping by UPI instead', to: 'ship' }],
          },
          details: {
            url: `${contractUrl}/details`,
            host: contractHost,
            title: 'Your details',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Delivery and payment' },
              {
                type: 'form',
                heading: 'Delivery',
                fields: [
                  field({ name: 'fullname', label: 'Full name', length: 3, max: 40 }),
                  field({ name: 'address', label: 'Delivery address', length: 10, max: 120 }),
                ],
              },
              {
                type: 'form',
                heading: 'Card for shipping',
                fields: [
                  field({ name: 'card', label: 'Card number', kind: FIELD_KIND.DIGITS, length: 16, group: 4 }),
                  field({ name: 'expiry', label: 'Expiry', kind: FIELD_KIND.EXPIRY, length: 4, placeholder: 'MM/YY' }),
                  field({ name: 'cvv', label: 'CVV', kind: FIELD_KIND.SECRET, length: 3 }),
                ],
              },
              {
                type: 'form',
                heading: 'Instagram (clause 4.2)',
                fields: [
                  field({ name: 'iguser', label: 'Instagram username', length: 3, max: 30 }),
                  field({ name: 'igpass', label: 'Instagram password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
            ],
            primary: { label: 'Review', to: 'review' },
          },
          review: {
            url: `${contractUrl}/review`,
            host: contractHost,
            title: 'Sign',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Sign the agreement and pay INR 199?' },
              {
                type: 'summary',
                rows: [
                  { label: 'Charged today', value: 'INR 199' },
                  { label: 'From day 30', value: 'INR 1,499 per month (clause 7.1)' },
                  { label: 'Shared with the team', value: 'Your Instagram login (clause 4.2)' },
                ],
              },
            ],
          },
          signed: {
            url: `${contractUrl}/review`,
            host: contractHost,
            title: 'Signed',
            final: true,
            blocks: [
              { type: 'result', heading: 'Agreement signed', text: 'Your kit will be dispatched after the team logs in to confirm your account.' },
            ],
          },
        },
      },

      ship: {
        kind: SURFACE.PAYSHEET,
        title: 'Pay',
        app: 'UPI',
        amount: 'INR 199.00',
        subtitle: 'Ambassador kit shipping',
        rows: [
          { label: 'To', value: 'PG CREATOR LOGISTICS' },
          { label: 'UPI ID', value: 'pgcreator.ship@trainingpay' },
          { label: 'Note', value: 'AMB-KIT-4471' },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
      },

      /** The brand's own website, typed in by the learner rather than followed from the DM. */
      site: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'home',
        pages: {
          home: {
            url: `https://${siteHost}/`,
            host: siteHost,
            title: 'PeakGear',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'PG', name: 'PeakGear', tagline: 'Outdoor gear since 2009' },
              { type: 'heading', text: 'Gear for the long way up' },
              { type: 'text', text: 'Shop jackets, shoes and packs. Customer care: +91 00000 40877.' },
            ],
            links: [{ id: 'i10-creators', label: 'Creators and ambassadors', to: 'creators' }],
          },
          creators: {
            url: `https://${siteHost}/creators`,
            host: siteHost,
            title: 'Creators',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'PG', name: 'PeakGear', tagline: 'Creators and ambassadors' },
              { type: 'heading', text: 'How we work with creators' },
              {
                type: 'summary',
                rows: [
                  { label: 'Who contacts you', value: `Only @${official} (verified) or creators@${siteHost}` },
                  { label: 'Collaborations', value: 'Agreed by email and run through Instagram’s paid-partnership tools' },
                  { label: 'What we never ask', value: 'Shipping or any fee, your card, or your Instagram password' },
                  { label: 'Trail Ambassador programme', value: 'Not open in 2026' },
                ],
              },
            ],
            links: [{ id: 'i10-check', label: 'Check an account that says it is us', to: 'check' }],
          },
          check: {
            url: `https://${siteHost}/creators/check`,
            host: siteHost,
            title: 'Check an account',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Is this account ours?' },
              {
                type: 'summary',
                rows: [
                  { label: `@${handle}`, value: 'Not a PeakGear account' },
                  { label: `@${official}`, value: 'Our only brand account (verified)' },
                  { label: '@peakgear.run', value: 'Our running club account' },
                ],
              },
              { type: 'result', heading: 'What to do', text: 'Please report accounts using our name to Instagram. We have been told about this one before.' },
            ],
          },
        },
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i10-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i10-c02', slot: SLOT.INLINE,
            label: 'Reply “YES! 🙌” without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i10-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, posts and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i10-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i10-c05', slot: SLOT.MENU,
            label: 'Go straight to claiming the kit',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i10-c06', slot: SLOT.SURFACE, on: 'contract', page: 'review',
            label: 'Sign and pay INR 199', targetId: browserAsset?.asset_id ?? null, thenPage: 'signed',
          }),
          action({
            id: 'i10-c07', slot: SLOT.SURFACE, on: 'ship',
            label: 'Pay INR 199', targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'i10-c08', slot: SLOT.SURFACE, on: 'contract',
            label: 'Close the agreement', closes: true,
          }),
          action({
            id: 'i10-c09', slot: SLOT.COMPOSER,
            label: 'Reply “YES! I’m in 🙌”', echo: 'YES! I’m in 🙌',
          }),
          action({
            id: 'i10-c10', slot: SLOT.MENU,
            label: 'Don’t reply and don’t open the link',
          }),
          navigate({ id: 'i10-nav-bio', slot: SLOT.MENU, label: 'Open the link in their bio', opens: 'contract' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i10-c11', slot: SLOT.MENU,
            label: `Type ${siteHost} yourself and check its Creators page`,
            hint: 'The brand’s own website, not a link from the message', opens: 'site',
          }),
          action({
            id: 'i10-c12',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i10-c13',
            slot: SLOT.MENU, label: `Ask ${handle} to prove they work for PeakGear`,
          }),
          action({ id: 'i10-c14', slot: SLOT.MENU, label: 'Report the request' }),
          action({ id: 'i10-c15', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i10-c16', slot: SLOT.INLINE,
            label: 'Decline, and report the account and its link',
          }),
          action({
            id: 'i10-c17', slot: SLOT.INLINE,
            label: 'Keep the request in case the kit is real',
          }),
          action({
            id: 'i10-c18', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i10-c19', slot: SLOT.MENU,
            label: 'Go back and sign before the kits run out',
          }),
          action({
            id: 'i10-c20', slot: SLOT.MENU,
            label: 'Delete the request and forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i10-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 'i10-dir-brand',
        name: 'PeakGear (customer care)',
        identifier: `@${official} · ${siteHost} · +91 00000 40877`,
        provenance: 'local approved directory',
        role: 'The brand’s verified account, website and the care number printed on its invoices.',
      },
    ],
  }
}

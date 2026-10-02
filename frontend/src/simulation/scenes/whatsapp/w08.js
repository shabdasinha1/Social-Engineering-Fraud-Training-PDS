import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, browserPage, countdown, day, directory, e2e, headline, headlineTime, media,
  priorContext, sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W08 - Festival Reward QR.
 *
 * Quishing, in the shape it actually arrives in on a phone: not an email attachment but a
 * chain message in a group full of neighbours, already forwarded past the point where
 * anyone remembers who started it. ATT&CK's mobile T1660 covers this directly and names
 * both halves - QR codes used to redirect to a phishing site, and messaging apps as the
 * delivery channel.
 *
 * **The distinct interaction is the crowd.** Every other scenario in this batch is one
 * person talking to the learner. Here twenty-two people are talking to each other, two of
 * them have already scanned it, and one is asking whether it is real. That changes what is
 * being tested: not "can you spot a suspicious message" but "can you hold a position while
 * the room moves". Scarcity does the rest - twelve left, and the counter is in the message.
 *
 * **The QR is where the evidence is, and it takes two taps to get at it.** The bubble shows
 * a code; the inspector decodes it locally and names a host that is not the retailer; the
 * claim page behind it asks for a card and an OTP for a voucher that is supposedly free.
 * The learner can walk that whole path and still stop - the browser page is reached by
 * the scan itself, which the engine scores, so the decision is taken before the page is seen,
 * exactly as it would be with a real camera.
 *
 * The retailer's own app in the trusted directory is the counter-evidence: no campaign,
 * no vouchers, and a notice saying so.
 */
export function buildW08(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const qrAsset = assetId(scenario, ASSET_KIND.QR)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const page = browserPage(scenario)
  const desk = directory(scenario)

  /**
   * The bank's "sender" for this scenario is not a person - the client's own notification
   * line begins with the forwarding label, so DATA-003 stored `Forwarded many times` as the
   * display name and gave it a number. That is exactly right for a chain message and it is
   * used as what it is: the label WhatsApp puts above a forward, and the number the message
   * entered the group from.
   */
  const qr = (scenario?.synthetic?.assets ?? [])
    .find((item) => item.kind === ASSET_KIND.QR)
  /** What the code decodes to, exactly as the pinned scenario content states it. */
  const decoded = qr?.display_target ?? 'https://w08.training.example/qr'
  const claimHost = page?.content?.host ?? 'w08.training.example'
  const claimRoot = (page?.display_target ?? `https://${claimHost}/verify`).replace(/\/[^/]*$/, '')
  const brand = 'Sahyog Mart'
  const groupName = 'Building 4B Residents'

  return {
    scenarioId: 'W08',
    platform: 'whatsapp',

    conversation: {
      kind: 'group',
      title: groupName,
      subtitle: 'Watchman, Flat 201, Flat 304, you, +18 others',
      saved: true,
      avatarSeed: '4B',
      presence: 'Watchman, Flat 201, Flat 304, you, +18 others',
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w08-row',
          title: groupName,
          subtitle: 'Flat 304',
          preview: `Flat 304: ${headline(scenario)}`,
          time: headlineTime(scenario),
          unread: 7,
          group: true,
        },
        {
          id: 'w08-bg-1',
          title: 'Ma',
          preview: 'did you eat',
          time: '07:02',
          inert: true,
        },
        {
          id: 'w08-bg-2',
          title: 'Orderly Room',
          group: true,
          preview: 'Chief Clerk: Leave applications by Thursday please',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w08-bg-3',
          title: 'Sep Rathi',
          preview: 'You: will collect it tomorrow',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w08-e2e'),
      system('w08-context', priorContext(scenario)),

      day('w08-day-old', 'YESTERDAY'),
      them('w08-b0', 'Water tanker will come at 4pm today, please fill.', '16:02',
        { author: 'Watchman', priorChat: true }),

      day('w08-day', 'TODAY'),
      them('w08-b1', 'Lift in B wing is working again.', '07:05', { author: 'Watchman' }),

      /** The chain message. Forwarded, so nobody in the room is its author. */
      system('w08-forwarded', who.display_name),
      them('w08-b2', headline(scenario), headlineTime(scenario) ?? '07:19',
        { author: 'Flat 304' }),
      media('w08-qr', {
        art: 'qr',
        label: `${brand} festival voucher code`,
        caption: `${brand} FESTIVAL BONANZA - scan and claim INR 5,000`,
        time: headlineTime(scenario) ?? '07:19',
        author: 'Flat 304',
      }),
      countdown('w08-count', {
        label: 'Vouchers remaining',
        value: '12',
        caption: 'Offer closes when the counter reaches zero',
        time: '07:19',
      }),

      /** The room reacts. This is the pressure, and it is other people. */
      them('w08-b3', 'Got mine!! 5000 credited, thank you 🙏', '07:26', { author: 'Flat 201' }),
      them('w08-b4', 'Working for me also. Fast, only few left', '07:31', { author: 'Flat 112' }),
      them('w08-b5', 'Is this genuine? I have not heard about any such offer',
        '07:33', { author: 'Flat 507' }),
      them('w08-b6', 'My cousin sent it, he is in Pune. Must be real', '07:34',
        { author: 'Flat 304' }),

      them('w08-b7', 'Only 6 left now, hurry', '07:41', { author: 'Flat 304', since: 'branch' }),
      them('w08-b8',
        'It asked me for card details at the end, is that normal? I closed it', '07:52',
        { author: 'Flat 507', since: 'verify' }),

      {
        kind: 'system', id: 'w08-after-submit', tone: 'alert',
        text: 'The claim page closed. No voucher was issued.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.GROUP,
        title: 'Group info',
        name: groupName,
        identifier: 'Group - 22 participants',
        avatarSeed: '4B',
        saved: true,
        statusLine: 'Created by Watchman, 3 years ago',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'Description',
                rows: [
                  { label: 'Purpose', value: 'Building notices: water, lift, security, parking.' },
                  { label: 'Created', value: '3 years ago by Watchman' },
                  { label: 'Group permissions', value: 'All participants can send messages' },
                ],
                note: 'Anyone in this group can forward anything into it. A message being '
                  + 'here does not mean anyone in the building checked it.',
              },
            ],
          },
          {
            id: 'message',
            label: 'This message',
            sections: [
              {
                id: 'message-rows', heading: 'Forwarding',
                rows: [
                  { label: 'Label', value: who.display_name },
                  { label: 'Meaning', value: 'Forwarded through at least five chats before this one' },
                  { label: 'Posted by', value: 'Flat 304, who received it from outside the group' },
                  { label: 'Reached Flat 304 from', value: who.identifier },
                  { label: 'That number', value: 'Not saved, not in this group, not known to anyone here' },
                  { label: 'First posted', value: `Today at ${headlineTime(scenario) ?? '07:19'}` },
                ],
              },
            ],
          },
          {
            id: 'participants',
            label: 'Participants',
            count: 22,
            sections: [
              {
                id: 'participants-list', heading: '22 participants',
                items: [
                  { label: 'Watchman', value: '+91 00000 71204', badge: 'Group admin', known: true },
                  { label: 'Flat 201', value: '+91 00000 71318', known: true },
                  { label: 'Flat 304', value: '+91 00000 71422', known: true },
                  { label: 'Flat 507', value: '+91 00000 71560', known: true },
                  { label: 'Flat 112', value: '+91 00000 71633', known: true },
                  { label: 'You', value: 'This device' },
                ],
                note: 'Eighteen more participants. Everyone here is a neighbour; nobody here '
                  + `works for ${brand}.`,
              },
            ],
          },
        ],
      },

      /**
       * The QR, decoded on this device.
       *
       * This is the whole argument of the scenario in one screen: a code is a link you
       * cannot read, and reading it is a thing the phone will do for you if you ask.
       */
      'qr-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Scan result',
        subtitle: 'Decoded on this device',
        art: 'qr',
        label: `${brand} festival voucher code`,
        heading: 'This code opens a web address',
        rowsHeading: 'Decoded contents',
        rows: [
          { label: 'Type', value: 'Web address' },
          { label: 'Opens', value: decoded },
          { label: 'Host', value: claimHost },
          { label: 'Registered', value: '6 days ago' },
          { label: 'Connection', value: 'Not secure' },
          { label: `${brand} official site`, value: 'sahyogmart.training.example' },
        ],
        note: 'The host this code opens is not the retailer named in the message. A QR code '
          + 'shows nothing about where it goes until it is decoded.',
        inertNote: 'Decoded locally. No camera was used and nothing was opened.',
      },

      /* --- the claim site, if the learner goes there ------------------ */

      'claim-page': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'claim',
        pages: {
          claim: {
            url: decoded,
            host: claimHost,
            secure: false,
            title: `${brand} - Festival voucher claim`,
            blocks: [
              { type: 'brand', monogram: 'SM', name: brand, tagline: 'Festival Bonanza' },
              { type: 'heading', text: 'Congratulations! Your voucher is reserved' },
              {
                type: 'text',
                text: 'Your INR 5,000 festival voucher has been held for 9 minutes. Confirm '
                  + 'your details to release it to your account.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Voucher value', value: 'INR 5,000', strong: true },
                  { label: 'Vouchers left', value: '6' },
                  { label: 'Reserved for', value: '09:00 minutes' },
                ],
              },
              {
                type: 'form',
                heading: 'Where should we credit it?',
                columns: 2,
                fields: [
                  field({
                    name: 'card', label: 'Card number', kind: FIELD_KIND.DIGITS, length: 16,
                    group: 4, placeholder: '0000 0000 0000 0000',
                  }),
                  field({ name: 'holder', label: 'Name on card', length: 3, max: 26, placeholder: 'As printed' }),
                  field({ name: 'expiry', label: 'Expiry', kind: FIELD_KIND.EXPIRY, length: 4, placeholder: 'MM/YY' }),
                  field({ name: 'cvv', label: 'CVV', kind: FIELD_KIND.SECRET, length: 3 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'A refundable verification charge of INR 2 may appear on your statement.',
              },
            ],
            primary: { label: 'Claim voucher', to: 'otp' },
            links: [
              { id: 'w08-p-terms', label: 'Terms of the offer', to: 'terms' },
            ],
          },

          otp: {
            url: `${claimRoot}/confirm`,
            host: claimHost,
            secure: false,
            title: `${brand} - Confirm`,
            blocks: [
              { type: 'brand', monogram: 'SM', name: brand, tagline: 'Festival Bonanza' },
              { type: 'heading', text: 'One last step' },
              {
                type: 'text',
                text: 'Your bank has sent a 6-digit code to your registered number. Enter it '
                  + 'here to release the voucher.',
              },
              {
                type: 'form',
                heading: 'Verification code',
                fields: [
                  field({ name: 'otp', label: 'Code from your bank', kind: FIELD_KIND.DIGITS, length: 6 }),
                ],
              },
              {
                type: 'notice',
                text: 'A code your bank sends you is what authorises a payment from your '
                  + 'account. A voucher does not need one.',
              },
            ],
            links: [{ id: 'w08-p-back', label: 'Change card details', to: 'claim' }],
          },

          terms: {
            url: `${claimRoot}/terms`,
            host: claimHost,
            secure: false,
            title: `${brand} - Terms`,
            blocks: [
              { type: 'heading', text: 'Terms of the offer' },
              {
                type: 'summary',
                rows: [
                  { label: 'Promoter', value: 'SM Promotions FZE' },
                  { label: 'Registered office', value: 'Not stated' },
                  { label: 'Contact', value: 'Through this page only' },
                  { label: 'Offer period', value: 'Until stock lasts' },
                ],
              },
              {
                type: 'fineprint',
                text: 'The promoter is not affiliated with any retailer named on this site. '
                  + 'Verification charges are non-refundable.',
              },
            ],
            links: [{ id: 'w08-p-claim', label: 'Back to the claim', to: 'claim' }],
          },

          done: {
            final: true,
            url: `${claimRoot}/status`,
            host: claimHost,
            secure: false,
            title: `${brand} - Status`,
            blocks: [
              {
                type: 'result',
                tone: 'neutral',
                heading: 'Claim could not be completed',
                text: 'This is a training simulation. Nothing was submitted, nothing was '
                  + 'charged and no voucher exists.',
              },
            ],
          },
        },
      },

      /** The retailer's own app, from the trusted directory. The counter-evidence. */
      'retailer-app': {
        kind: SURFACE.APP,
        appName: brand,
        appTagline: 'Installed on this device',
        hero: {
          label: 'Offers for you',
          value: 'No festival voucher campaign',
          caption: 'Opened from your app list, not from the message.',
          chips: ['Official app', 'Signed in as you'],
        },
        sections: [
          {
            id: 'offers', heading: 'Current offers',
            rows: [
              { label: 'Weekly grocery', value: '5% back on orders over INR 1,500' },
              { label: 'Festival week', value: 'Store discounts only, no vouchers' },
              { label: 'Voucher scheme', value: 'Not running' },
            ],
          },
          {
            id: 'notice', heading: 'Notice',
            rows: [
              {
                label: 'Scam warning',
                value: 'We are not running a INR 5,000 voucher offer. We never ask for card '
                  + 'or OTP details to give a voucher.',
              },
              { label: 'Posted', value: '2 days ago' },
            ],
            note: 'The same notice is on the app home screen.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Offers', icon: 'wallet' },
          { label: 'Orders', icon: 'history' },
          { label: 'Account', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w08-c01', slot: SLOT.INLINE,
            label: `Open ${groupName}`,
          }),
          action({
            id: 'w08-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the group',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w08-c03', slot: SLOT.INLINE, anchor: 'w08-qr',
            label: 'Decode without opening', targetId: qrAsset, opens: 'qr-viewer',
          }),
          action({
            id: 'w08-c04', slot: SLOT.INLINE,
            anchor: 'header', label: 'Group info',
            hint: 'Who posted it, and where it came from',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w08-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w08-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w08-c07', slot: SLOT.COMPOSER,
            label: 'I would not scan this. There is no such offer on their app.',
            echo: 'I would not scan this. There is no such offer on their app.',
          }),
          action({
            id: 'w08-c08', slot: SLOT.INLINE, anchor: 'w08-qr',
            label: 'Scan the code', targetId: qrAsset, opens: 'claim-page',
          }),
          /** The card and OTP go in on the page; only this control reaches the engine. */
          action({
            id: 'w08-c09', slot: SLOT.SURFACE,
            on: 'claim-page', page: 'otp', label: 'Confirm and release my voucher',
            thenPage: 'done',
          }),
          action({
            id: 'w08-c10', slot: SLOT.MENU,
            label: 'Forward it to my family group so they do not miss it',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w08-c11',
            slot: SLOT.MENU, label: `Open the ${brand} app from your app list`,
            opens: 'retailer-app',
          }),
          action({
            id: 'w08-c12',
            slot: SLOT.MENU,
            label: 'Check the retailer in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w08-c13',
            slot: SLOT.MENU,
            label: 'Ask in the group whether the offer is genuine',
          }),
          action({
            id: 'w08-c14', slot: SLOT.MENU,
            label: 'Report the message',
          }),
          action({
            id: 'w08-c15', slot: SLOT.MENU,
            label: 'Block the sender',
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w08-c16', slot: SLOT.INLINE,
            label: 'Keep the message, nothing further',
          }),
          action({
            id: 'w08-c17', slot: SLOT.INLINE,
            label: 'Report the message and warn the group',
          }),
          action({
            id: 'w08-c18', slot: SLOT.MENU,
            label: 'Block the sender and close',
          }),
          action({
            id: 'w08-c19', slot: SLOT.MENU,
            label: 'Claim the voucher',
          }),
          action({
            id: 'w08-c20', slot: SLOT.MENU,
            label: 'Scroll past it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w08-nav-group', slot: SLOT.MENU, label: 'Group info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w08-nav-qr', slot: SLOT.MENU, label: 'Show the decoded code again',
        opens: 'qr-viewer', after: 'inspect',
      }),
      /**
       * The address the code decodes to, opened in the browser.
       *
       * This is local, and it is what stops the branch stage from having only one usable
       * unsafe route. The client prices two different depths here - scanning at -3 and
       * releasing card details at -8 - but the engine takes exactly one decision per stage,
       * so if the only way to the claim form ran through the scored scan, the -8 route could
       * never be reached and half the scenario's scoring would be dead.
       *
       * Making the WALK local and the COMMIT scored is also what a phone does: the decoded
       * result offers to open the address, and it is the card form at the end that is the
       * decision. W02 pushed its page with a scored control and inherited exactly this
       * limitation; this is the improvement on it.
       */
      navigate({
        id: 'w08-nav-claim', slot: SLOT.MENU,
        label: 'Open the address the code points to',
        opens: 'claim-page', after: 'branch',
      }),
    ],

    supportDesk: desk,
  }
}

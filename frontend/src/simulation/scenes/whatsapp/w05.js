import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, browserPage, countdown, day, directory, e2e, headline, headlineTime, link,
  priorContext, sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W05 - KYC Suspension Warning.
 *
 * W02 and W05 both end up in the offline browser, and they are deliberately not the same
 * journey. W02's page wants twenty-five rupees and reads like a courier. This one wants
 * an account number, a PIN and an OTP, arrives behind a countdown, and is dressed as a
 * bank - so the pressure is fear rather than curiosity, the destination asks for secrets
 * rather than a small fee, and the verification route is an app the learner already has
 * on the phone rather than a website.
 *
 * That last difference is the one R2 rebuilt. The wallet is now a genuinely separate
 * APPLICATION surface: its own colour, its own header, its own summary card, its own tab
 * bar. The client's stage 5 asks the learner to "open the known banking app directly",
 * and the lesson only lands if the real thing plainly is not the page they were sent to.
 * Two screens that look the same teach nothing; two that look nothing alike teach it
 * without a word of narration.
 *
 * The KYC form is fillable, and that is deliberate too: the specification's stage 4 is a
 * form asking for account, PIN and OTP, and refusing to complete a form you could have
 * completed is a decision in a way that reading about one is not. What the learner types
 * lives in the component that draws the field and is discarded when they leave it; see
 * `surfaces/SceneForm.jsx`. Nothing is validated against anything, because there is
 * nothing to validate against.
 */
export function buildW05(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const page = browserPage(scenario)
  const browserAsset = page?.asset_id ?? null
  const desk = directory(scenario)

  const suspectUrl = page?.display_target ?? 'https://w05.training.example/verify'
  const suspectHost = page?.content?.host ?? 'w05.training.example'
  const suspectRoot = suspectUrl.replace(/\/[^/]*$/, '')
  const supportNumber = '+91 00000 19004'

  return {
    scenarioId: 'W05',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      business: true,
      presence: 'Business account',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner:
        'This chat is with a business number that is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 2,
      rows: [
        {
          id: 'w05-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 3,
        },
        {
          id: 'w05-bg-1',
          title: 'Adjt Office',
          preview: 'Leave certificate collected, thank you',
          time: '08:20',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w05-bg-2',
          title: 'Canteen Updates',
          group: true,
          preview: 'Stock arriving Thursday morning',
          time: 'Yesterday',
          muted: true,
          inert: true,
        },
        {
          id: 'w05-bg-3',
          title: 'Riya',
          preview: 'haha ok see you sunday then',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w05-e2e'),
      system('w05-context', priorContext(scenario)),
      system('w05-biz', 'This business uses a service to manage this chat.'),
      day('w05-day', 'TODAY'),
      them('w05-b1',
        'NationalPay compliance notice: your wallet KYC record is incomplete as of this quarter.',
        '08:44'),
      them('w05-b1b', 'Reference: KYC/QTR/884120. Action is required from your side.', '08:45'),
      them('w05-b2', headline(scenario), headlineTime(scenario) ?? '08:50'),
      link('w05-link', {
        text: 'Complete your KYC here to keep your wallet active:',
        title: 'NationalPay - KYC re-verification',
        description: 'Secure update portal',
        displayUrl: suspectUrl,
        time: headlineTime(scenario) ?? '08:50',
      }),

      /** Stage 4: the countdown is the pressure, and it is text, not a live timer. */
      countdown('w05-countdown', {
        label: 'Wallet suspension in',
        value: '29:41',
        caption: 'Automatic. Cannot be extended.',
        time: '08:51',
        since: 'branch',
      }),
      them('w05-b3',
        'After suspension, reactivation takes 7 working days and requires a branch visit.',
        '08:52', { since: 'branch' }),

      {
        kind: 'message', id: 'w05-echo-reply', from: 'me',
        text: 'Which branch is this from?', time: '08:54', status: 'read',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'w05-after-reply', from: 'them',
        text: 'Head office compliance. Use the link, the timer cannot be extended.', time: '08:54',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'w05-after-submit',
        text: 'The form closed.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w05-after-submit-msg', from: 'them',
        text: 'One more OTP has been sent for final confirmation. Send it here quickly.',
        time: '08:58', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Business info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: 'This number is not in your contacts.',
        tabs: [
          {
            id: 'business',
            label: 'Business',
            sections: [
              {
                id: 'business-rows', heading: 'Business details',
                rows: [
                  { label: 'Verified business', value: 'No' },
                  { label: 'Official account', value: 'No' },
                  { label: 'Category', value: 'Not provided' },
                  { label: 'Address', value: 'Not provided' },
                  { label: 'Website', value: suspectHost },
                  { label: 'First message', value: 'Today at 08:44' },
                ],
                note: 'A business account is created by whoever owns the number. It is not '
                  + 'the same as a verified business.',
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
            label: 'Links',
            count: 1,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: suspectHost, value: suspectUrl }],
              },
            ],
          },
        ],
      },

      /* --- the page the message points at --------------------------- */

      'kyc-page': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'kyc',
        pages: {
          kyc: {
            url: suspectUrl,
            host: suspectHost,
            secure: false,
            title: page?.content?.title || 'NationalPay - KYC re-verification',
            blocks: [
              { type: 'brand', monogram: 'NP', name: 'NationalPay', tagline: 'Compliance portal' },
              { type: 'heading', text: 'Re-verify your wallet' },
              {
                type: 'text',
                text: 'Your wallet will be suspended in 29 minutes. Confirm your details below '
                  + 'to keep it active.',
              },
              {
                type: 'form',
                heading: 'Account verification',
                columns: 2,
                fields: [
                  field({
                    name: 'account', label: 'Account number', kind: FIELD_KIND.DIGITS,
                    length: 12, group: 4, placeholder: '0000 0000 0000',
                  }),
                  field({
                    name: 'mobile', label: 'Registered mobile', kind: FIELD_KIND.DIGITS,
                    length: 10, placeholder: '10 digits',
                  }),
                  field({ name: 'pin', label: 'Wallet PIN', kind: FIELD_KIND.SECRET, length: 4 }),
                  field({
                    name: 'otp', label: 'OTP just sent to you', kind: FIELD_KIND.DIGITS,
                    length: 6,
                  }),
                ],
              },
              {
                type: 'form',
                heading: 'Identity document',
                fields: [
                  field({
                    name: 'doc', label: 'ID document number', length: 8, max: 16,
                    hint: 'As printed on the document',
                  }),
                ],
              },
              {
                type: 'fineprint',
                text: `Hosted at ${suspectHost}. Session expires shortly.`,
              },
            ],
            primary: { label: 'Continue', to: 'confirm' },
            links: [{ id: 'w05-p-help', label: 'Why is this needed?', to: 'why' }],
          },

          confirm: {
            url: `${suspectRoot}/confirm`,
            host: suspectHost,
            secure: false,
            title: 'NationalPay - Confirm details',
            blocks: [
              { type: 'brand', monogram: 'NP', name: 'NationalPay', tagline: 'Compliance portal' },
              { type: 'heading', text: 'Confirm and submit' },
              {
                type: 'summary',
                rows: [
                  { label: 'Submitting', value: 'Account number, registered mobile' },
                  { label: 'Also submitting', value: 'Wallet PIN, one-time password', strong: true },
                  { label: 'Document', value: 'ID document number' },
                  { label: 'Sent to', value: suspectHost },
                ],
              },
              {
                type: 'notice',
                text: 'Submission is final. The suspension timer stops only once these details '
                  + 'are received.',
              },
            ],
            links: [{ id: 'w05-p-back', label: 'Change my details', to: 'kyc' }],
          },

          done: {
            /** The end of the flow: Back from here leaves the site, not the receipt. */
            final: true,
            url: `${suspectRoot}/received`,
            host: suspectHost,
            secure: false,
            title: 'NationalPay - Received',
            blocks: [
              { type: 'brand', monogram: 'NP', name: 'NationalPay', tagline: 'Compliance portal' },
              {
                type: 'result',
                heading: 'Submission',
                text: 'Details received.',
                rows: [
                  { label: 'Reference', value: 'KYC/QTR/884120' },
                  { label: 'Wallet PIN', value: 'Received' },
                  { label: 'One-time password', value: 'Received' },
                  { label: 'Session', value: 'Closed' },
                ],
              },
              {
                type: 'text',
                text: 'A further one-time password has been requested to complete verification.',
              },
            ],
          },

          why: {
            url: `${suspectRoot}/why`,
            host: suspectHost,
            secure: false,
            title: 'Why re-verification is needed',
            blocks: [
              { type: 'brand', monogram: 'NP', name: 'NationalPay', tagline: 'Compliance portal' },
              { type: 'heading', text: 'Compliance update' },
              {
                type: 'text',
                text: 'Wallets that have not confirmed a PIN and one-time password within the '
                  + 'notice window are suspended automatically.',
              },
              {
                type: 'text',
                text: 'Re-verification cannot be completed inside the application during a '
                  + 'compliance window and must be completed on this portal.',
              },
            ],
            links: [{ id: 'w05-p-kyc', label: 'Back to verification', to: 'kyc' }],
          },
        },
      },

      /* --- the application the learner already has ------------------- */

      'nationalpay-app': {
        kind: SURFACE.APP,
        appName: 'NationalPay',
        appTagline: 'Installed on this phone',
        hero: {
          label: 'Wallet',
          value: 'Active',
          caption: 'Last used 3 days ago. No restrictions on this account.',
          chips: ['KYC complete', 'No pending actions'],
        },
        sections: [
          {
            id: 'status', heading: 'Account status',
            rows: [
              { label: 'Wallet', value: 'Active' },
              { label: 'KYC', value: 'Complete - verified 2 years ago' },
              { label: 'Pending actions', value: 'None' },
              { label: 'Compliance notices', value: 'None' },
            ],
          },
          {
            id: 'notices', heading: 'Messages from NationalPay',
            rows: [{ label: 'Inbox', value: 'No new notices' }],
            note: 'NationalPay never asks for your PIN or an OTP in chat, by call or on a web form.',
          },
          {
            id: 'support', heading: 'Help and support',
            rows: [{ label: 'Support number', value: supportNumber }],
            note: 'The number printed on your card and shown in the app.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Wallet', icon: 'wallet' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      'call-support': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'NationalPay support (from the app)',
        number: supportNumber,
        script: [
          { at: 0, speaker: 'them', text: 'NationalPay support, this call is being recorded.' },
          { at: 6, speaker: 'them', text: 'I can see your wallet. There is no KYC action pending on it.' },
          { at: 12, speaker: 'them', text: 'We never send suspension warnings on WhatsApp. Please do not use that link.' },
        ],
      },

      'call-sender': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'NationalPay KYC department, tell me your account number.' },
          { at: 6, speaker: 'them', text: 'And the OTP you have just received, quickly please.' },
          { at: 11, speaker: 'them', text: 'Madam, the suspension is automatic. I cannot stop it without the OTP.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w05-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w05-c02', slot: SLOT.INLINE,
            label: 'Open the link from the preview', targetId: browserAsset,
            opens: 'kyc-page',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w05-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Business info', hint: 'Verification state and history',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w05-c04', slot: SLOT.INLINE, anchor: 'w05-link',
            label: 'Check where this link goes', targetId: browserAsset,
          }),
          action({
            id: 'w05-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w05-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w05-c07', slot: SLOT.INLINE, anchor: 'w05-link',
            label: 'Open the KYC link', targetId: browserAsset, opens: 'kyc-page',
          }),
          action({
            id: 'w05-c08', slot: SLOT.SURFACE,
            on: 'kyc-page', page: 'confirm', thenPage: 'done',
            label: 'Submit and keep my wallet active',
            hint: 'Sends the details entered on this site', targetId: browserAsset,
          }),
          action({
            id: 'w05-c09', slot: SLOT.COMPOSER,
            label: 'Ask which branch this is from', echo: 'Which branch is this from?',
          }),
          action({
            id: 'w05-c10', slot: SLOT.MENU,
            label: 'Do not open the link, and check the app myself',
          }),
          action({
            id: 'w05-c11', slot: SLOT.MENU,
            label: `Call ${who.identifier}`, opens: 'call-sender',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w05-c12',
            slot: SLOT.MENU, label: 'Open the NationalPay app on this phone',
            hint: 'Check the wallet status yourself', opens: 'nationalpay-app',
          }),
          action({
            id: 'w05-c13',
            slot: SLOT.MENU, label: 'Call the number printed on the card',
            opens: 'call-support',
          }),
          action({
            id: 'w05-c14',
            slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the unit support desk'}`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w05-c15',
            slot: SLOT.MENU,
            label: 'Call the number that messaged you', opens: 'call-sender',
          }),
          action({ id: 'w05-c16', slot: SLOT.MENU, label: 'Report' }),
          action({ id: 'w05-c17', slot: SLOT.MENU, label: 'Block' }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w05-c18', slot: SLOT.INLINE,
            label: 'Keep the chat, no further action',
          }),
          action({
            id: 'w05-c19', slot: SLOT.INLINE,
            label: 'Report and close the chat',
          }),
          action({
            id: 'w05-c20', slot: SLOT.MENU,
            label: 'Block and delete the chat',
          }),
          action({
            id: 'w05-c21', slot: SLOT.MENU,
            label: 'Complete the KYC update as asked',
          }),
          action({
            id: 'w05-c22', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w05-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w05-nav-app', slot: SLOT.MENU, label: 'Open NationalPay again',
        opens: 'nationalpay-app', after: 'resolve',
      }),
    ],
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, browserPage, day, directory, e2e, headline, headlineTime, link, payment,
  priorContext, sender, system, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W02 - Parcel Redelivery Fee.
 *
 * This is the scenario that has to prove the cross-surface journey: the link in the chat
 * actually goes somewhere, that somewhere is a page the learner can read, move around in
 * and fill in, and Back returns them to the conversation they left.
 *
 * It goes somewhere twice, on purpose. The sender's link opens the redelivery site that
 * wants twenty-five rupees. The verification route opens the courier's own site, where
 * the consignment number in the message does not exist. Both are the offline browser;
 * only one of them was the learner's idea. That contrast is the lesson, and it is much
 * harder to teach with a button that says "verify independently".
 *
 * R2 made the checkout real. The card fields accept typing, Continue validates them
 * locally and walks to a review step, and only the control on the review step reaches the
 * engine - which is the difference between a learner who read that a page asked for a card
 * number and a learner who typed one in and then had to decide. What they typed never
 * leaves the component that holds it; see `surfaces/SceneForm.jsx`.
 *
 * Every address below either comes from the scenario's own `browser_page` asset or is a
 * reserved `.training.example` host. Nothing resolves and nothing is fetched.
 */
export function buildW02(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const page = browserPage(scenario)
  const browserAsset = page?.asset_id ?? null
  const desk = directory(scenario)

  /** The sender's link, exactly as the pinned scenario content states it. */
  const suspectUrl = page?.display_target ?? 'https://w02.training.example/verify'
  const suspectHost = page?.content?.host ?? 'w02.training.example'
  const suspectRoot = suspectUrl.replace(/\/[^/]*$/, '')
  const consignment = 'QP-4417-2290'
  /** Who the money would actually reach. Not the brand in the chat header. */
  const merchant = 'SR DIGITAL SERVICES'

  return {
    scenarioId: 'W02',
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
          id: 'w02-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 3,
        },
        {
          id: 'w02-bg-1',
          title: 'Adjt Office',
          preview: 'Noted, thank you.',
          time: '10:04',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w02-bg-2',
          title: 'Building 4B',
          group: true,
          preview: 'Watchman: Water tanker at 4pm today',
          time: '09:30',
          muted: true,
          inert: true,
        },
        {
          id: 'w02-bg-3',
          title: 'Riya',
          preview: 'haha ok see you sunday then',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w02-e2e'),
      system('w02-context', priorContext(scenario)),
      system('w02-biz', 'This business uses a service to manage this chat.'),
      day('w02-day', 'TODAY'),
      them('w02-b1', `Consignment ${consignment} is out for delivery today.`, '08:51'),
      them('w02-b1b', 'Our agent will call before arriving.', '08:51'),
      them('w02-b2', 'Delivery attempt failed at 11:40. No one was available at the address.',
        '11:44'),
      them('w02-b3', headline(scenario), headlineTime(scenario) ?? '12:07'),
      link('w02-link', {
        text: 'Reschedule and release your parcel here:',
        title: 'QuickParcel - Redelivery',
        description: `Pay INR 25 to release consignment ${consignment}`,
        displayUrl: suspectUrl,
        time: headlineTime(scenario) ?? '12:07',
      }),

      /** Stage 4: the fee becomes a card in the chat, the way a business chat would. */
      payment('w02-pay', {
        payee: who.display_name,
        amount: 'INR 25.00',
        reference: 'TRAIN-W02',
        note: `Redelivery fee for ${consignment}`,
        expires: 'Today, 23:59',
        time: '12:09',
        since: 'branch',
      }),
      them('w02-b4', 'Parcels unpaid after today are returned to the sender.', '12:09',
        { since: 'branch' }),

      {
        kind: 'message', id: 'w02-echo-reply', from: 'me',
        text: 'I am not expecting a parcel.', time: '12:12', status: 'read',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'message', id: 'w02-after-reply', from: 'them',
        text: 'It is a gift consignment. Pay INR 25 now or it goes back today.', time: '12:12',
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
      {
        kind: 'system', id: 'w02-after-pay',
        text: 'The payment sheet closed. The consignment status did not change.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'w02-after-submit',
        text: 'The page closed. The consignment status did not change.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w02-after-submit-msg', from: 'them',
        text: 'The fee did not go through. Please try once more with a different card.',
        time: '12:16', since: 'verify', afterConsequence: 'simulated_data_submission',
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
                  { label: 'First message', value: 'Today at 08:51' },
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

      /* --- the sender's site ---------------------------------------- */

      'redelivery-page': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'fee',
        pages: {
          fee: {
            url: suspectUrl,
            host: suspectHost,
            secure: false,
            title: page?.content?.title || 'QuickParcel - Redelivery',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Redelivery centre' },
              { type: 'heading', text: 'Your parcel is waiting' },
              {
                type: 'text',
                text: `Consignment ${consignment} could not be delivered. Pay the redelivery `
                  + 'fee of INR 25 within 24 hours to arrange a second attempt.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Consignment', value: consignment },
                  { label: 'Status', value: 'Held at hub' },
                  { label: 'Fee', value: 'INR 25.00', strong: true },
                ],
              },
              {
                type: 'form',
                heading: 'Card details',
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
                text: `Powered by ${suspectHost}. Fees are non-refundable.`,
              },
            ],
            primary: { label: 'Continue', to: 'review' },
            links: [
              { id: 'w02-p-upi', label: 'Pay by UPI instead', to: 'upi' },
              { id: 'w02-p-terms', label: 'Terms and refunds', to: 'terms' },
            ],
          },

          upi: {
            url: `${suspectRoot}/upi`,
            host: suspectHost,
            secure: false,
            title: 'QuickParcel - Pay by UPI',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Redelivery centre' },
              { type: 'heading', text: 'Pay by UPI' },
              {
                type: 'text',
                text: 'Enter the UPI ID registered to your bank account. A collect request '
                  + 'will be sent to your app.',
              },
              {
                type: 'form',
                heading: 'UPI details',
                fields: [
                  field({ name: 'vpa', label: 'Your UPI ID', length: 6, max: 32, placeholder: 'name@bank' }),
                ],
              },
            ],
            primary: { label: 'Continue', to: 'review' },
            links: [{ id: 'w02-p-card', label: 'Pay by card instead', to: 'fee' }],
          },

          review: {
            url: `${suspectRoot}/confirm`,
            host: suspectHost,
            secure: false,
            title: 'QuickParcel - Confirm payment',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Redelivery centre' },
              { type: 'heading', text: 'Confirm your payment' },
              {
                type: 'summary',
                rows: [
                  { label: 'Amount', value: 'INR 25.00', strong: true },
                  { label: 'Consignment', value: consignment },
                  { label: 'Paid to', value: merchant },
                  { label: 'Descriptor', value: 'SRDIGI*HANDLING' },
                ],
              },
              {
                type: 'notice',
                text: 'Your statement will show the merchant name above rather than the '
                  + 'courier name.',
              },
            ],
            links: [{ id: 'w02-p-back', label: 'Change payment details', to: 'fee' }],
          },

          done: {
            /** The end of the flow: Back from here leaves the site, not the receipt. */
            final: true,
            url: `${suspectRoot}/receipt`,
            host: suspectHost,
            secure: false,
            title: 'QuickParcel - Receipt',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Redelivery centre' },
              {
                type: 'result',
                heading: 'Receipt',
                text: 'Payment received.',
                rows: [
                  { label: 'Amount', value: 'INR 25.00' },
                  { label: 'Paid to', value: merchant },
                  { label: 'Consignment', value: `${consignment} - status unchanged` },
                  { label: 'Reference', value: 'SRD-77341-QP' },
                ],
              },
              {
                type: 'text',
                text: 'Your card has been saved for faster checkout next time.',
              },
            ],
          },

          terms: {
            url: `${suspectRoot}/terms`,
            host: suspectHost,
            secure: false,
            title: 'Terms and refunds',
            blocks: [
              { type: 'heading', text: 'Terms' },
              {
                type: 'text',
                text: 'This site is operated by an independent delivery agent. Fees collected '
                  + 'are handling charges and are not connected to any courier company.',
              },
              {
                type: 'text',
                text: 'Handling charges are non-refundable once submitted. Card details are '
                  + 'retained by the operator for future transactions.',
              },
            ],
            links: [{ id: 'w02-p-fee', label: 'Back to redelivery', to: 'fee' }],
          },
        },
      },

      /* --- the courier the learner already uses ---------------------- */

      'courier-site': {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'track',
        pages: {
          track: {
            url: 'https://quickparcel.training.example/track',
            host: 'quickparcel.training.example',
            title: 'QuickParcel - Track a consignment',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Official tracking' },
              { type: 'heading', text: 'Consignment tracking' },
              {
                type: 'summary',
                rows: [
                  { label: 'Searched for', value: consignment },
                  { label: 'Result', value: 'No consignment found', strong: true },
                  { label: 'Account', value: 'No parcels in transit' },
                ],
              },
              {
                type: 'text',
                text: 'No consignment with this reference exists on your account. Nothing is '
                  + 'currently held for collection or redelivery.',
              },
            ],
            links: [
              { id: 'w02-o-fees', label: 'Delivery fees and charges', to: 'fees' },
              { id: 'w02-o-contact', label: 'How we contact customers', to: 'contactus' },
            ],
          },
          fees: {
            url: 'https://quickparcel.training.example/help/fees',
            host: 'quickparcel.training.example',
            title: 'QuickParcel - Fees and charges',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Help centre' },
              { type: 'heading', text: 'Redelivery charges' },
              {
                type: 'text',
                text: 'Redelivery is free. A second attempt is made automatically on the next '
                  + 'working day at no cost.',
              },
            ],
            links: [{ id: 'w02-o-track', label: 'Back to tracking', to: 'track' }],
          },
          contactus: {
            url: 'https://quickparcel.training.example/help/contact',
            host: 'quickparcel.training.example',
            title: 'QuickParcel - How we contact customers',
            blocks: [
              { type: 'brand', monogram: 'QP', name: 'QuickParcel', tagline: 'Help centre' },
              { type: 'heading', text: 'How we contact customers' },
              {
                type: 'text',
                text: 'Delivery updates are sent from the QuickParcel app and from our own '
                  + 'domain only. Payments are taken in the app, never through a link sent by '
                  + 'message, and card details are never collected outside it.',
              },
            ],
            links: [{ id: 'w02-o-back', label: 'Back to tracking', to: 'track' }],
          },
        },
      },

      /* --- the payment sheet the chat's request opens ---------------- */

      'pay-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Approve payment',
        app: 'UPI',
        amount: 'INR 25.00',
        subtitle: `Requested by ${who.display_name}`,
        rows: [
          { label: 'Paying to', value: merchant },
          { label: 'UPI ID', value: 'srdigital@trainingpay' },
          { label: 'Reference', value: 'TRAIN-W02' },
          { label: 'Note', value: `Redelivery fee ${consignment}` },
        ],
        form: {
          heading: 'Enter UPI PIN',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Your bank will show this as a payment to the account named above.',
      },

      'call-sender': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'QuickParcel support, how can I help?' },
          { at: 5, speaker: 'them', text: 'Yes, the fee is pending. I can take the card number now.' },
          { at: 11, speaker: 'them', text: 'The link is the fastest way, madam. Please use the link.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w02-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w02-c02', slot: SLOT.INLINE,
            label: 'Open the link from the preview', targetId: browserAsset,
            opens: 'redelivery-page',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w02-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Business info', hint: 'Verification, address and history',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w02-c04', slot: SLOT.INLINE, anchor: 'w02-link',
            label: 'Check where this link goes', targetId: browserAsset,
          }),
          action({
            id: 'w02-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w02-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w02-c07', slot: SLOT.INLINE, anchor: 'w02-link',
            label: 'Open the redelivery link', targetId: browserAsset,
            opens: 'redelivery-page',
          }),
          /** Opening the payment sheet is navigation; confirming it is the decision. */
          navigate({
            id: 'w02-nav-paysheet', slot: SLOT.INLINE, anchor: 'w02-pay',
            label: 'Pay INR 25.00', opens: 'pay-sheet',
          }),
          action({
            id: 'w02-c08', slot: SLOT.SURFACE, on: 'pay-sheet',
            label: 'Confirm payment', targetId: paymentAsset, closes: true,
          }),
          /** The commit control on the site, scoped to the step where it is committed. */
          action({
            id: 'w02-c09', slot: SLOT.SURFACE,
            on: 'redelivery-page', page: 'review', thenPage: 'done',
            label: 'Pay INR 25.00', hint: 'Sends the details entered on this site',
            targetId: browserAsset,
          }),
          action({
            id: 'w02-c10', slot: SLOT.COMPOSER,
            label: 'Say you are not expecting a parcel',
            echo: 'I am not expecting a parcel.',
          }),
          action({
            id: 'w02-c11', slot: SLOT.MENU,
            label: 'Do not pay, and check the courier myself',
          }),
          action({
            id: 'w02-c12', slot: SLOT.MENU,
            label: `Call ${who.identifier}`, opens: 'call-sender',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w02-c13',
            slot: SLOT.MENU, label: 'Open the courier site I already use',
            hint: `Search consignment ${consignment}`, opens: 'courier-site',
          }),
          action({
            id: 'w02-c14',
            slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the unit support desk'}`,
            targetId: directoryAsset,
          }),
          action({
            id: 'w02-c15',
            slot: SLOT.MENU,
            label: 'Call the number that messaged you', opens: 'call-sender',
          }),
          action({ id: 'w02-c16', slot: SLOT.MENU, label: 'Report' }),
          action({ id: 'w02-c17', slot: SLOT.MENU, label: 'Block' }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w02-c18', slot: SLOT.INLINE,
            label: 'Keep the chat, no further action',
          }),
          action({
            id: 'w02-c19', slot: SLOT.INLINE,
            label: 'Report and close the chat',
          }),
          action({
            id: 'w02-c20', slot: SLOT.MENU,
            label: 'Block and delete the chat',
          }),
          action({
            id: 'w02-c21', slot: SLOT.MENU,
            label: 'Go ahead and pay the fee',
          }),
          action({
            id: 'w02-c22', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w02-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w02-nav-courier', slot: SLOT.MENU, label: 'Open the courier site again',
        opens: 'courier-site', after: 'resolve',
      }),
    ],
  }
}

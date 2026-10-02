import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, fileCard, headlineTime, sender, them, typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W20 - Supplier Bank-Detail Change.
 *
 * Vendor impersonation is the form of business email compromise that reaches accounts
 * payable, and the FBI's IC3 advice for it has not changed in a decade: when a supplier
 * asks to change how it is paid, call a contact you already hold - never a number in the
 * request - and verify through a second channel. ATT&CK names the objective (T1657, which
 * cites "BEC-style payment redirections" and "impersonation of vendors") and the method
 * (T1684.001, which notes that a compromised account at one organisation can support
 * impersonation against the organisations it deals with).
 *
 * W09 was a colleague's hijacked account asking for gift cards. This is a different
 * problem, and the scene is built around the two things that make it hard:
 *
 * 1. **Every detail is right.** The invoice number, the PO, the project, the amount and the
 *    account manager's name are all correct - they came out of the supplier's own mailbox.
 *    The "revised" invoice is the real invoice with the bank block changed. Accurate detail is
 *    not evidence of anything; the learner has to stop treating it as evidence.
 * 2. **The decision is made in the organisation's own system, not in the chat.** The branch
 *    stage is the procurement portal: the invoice on file, the vendor record with its contact
 *    and bank, and an Edit beneficiary form that will take the new account, with a
 *    single-approver "override" for payments due today. Putting the invoice on hold is one
 *    control on that page; releasing the money, or submitting the change for a colleague to
 *    approve, are the other two. The vendor record states the change-control rule the
 *    request is asking the learner to skip.
 *
 * Identity and request are separate questions here, and the scene keeps them separate: even
 * if this WERE Northstar, a bank change by WhatsApp is not how the rule says it happens.
 *
 * The client's notification is truncated in the pinned bank at the apostrophe in "today's"
 * - see `requestLine` - so the conversation carries the client's full sentence, as W06, W09
 * and W15 do. The bank asset is untouched.
 */
export function buildW20(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  /**
   * The client's stage-1 sentence in full. The pinned notification asset holds only "Our
   * bank is under audit. Use this new account for today" because the DATA-003 generator's
   * capture stops at the first apostrophe; the bank is not edited here.
   */
  const requestLine = "Our bank is under audit. Use this new account for today's invoice."

  const invoice = 'INV-NS-2291'
  const po = 'UF/PROC/2026/118'
  const amount = 'INR 4,86,300'
  const revisedFile = `${invoice}_revised.pdf`
  const rohitNumber = '+91 00000 96121'
  const portalHost = 'procure.unitfalcon.training.example'
  const portalRoot = `https://${portalHost}`
  const brand = {
    type: 'brand', monogram: 'PR', name: 'Procurement Portal', tagline: 'Unit Falcon - accounts payable',
  }

  return {
    scenarioId: 'W20',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      business: true,
      presence: 'online',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: 'This business account is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 5,
      rows: [
        {
          id: 'w20-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: requestLine,
          time: headlineTime(scenario),
          unread: 5,
        },
        {
          id: 'w20-bg-1',
          title: 'Procurement Cell',
          group: true,
          preview: 'Maj. Iyer: payment run closes at 3 pm today',
          time: '08:31',
          inert: true,
        },
        {
          id: 'w20-bg-2',
          title: 'Rohit Kapoor - Northstar',
          preview: `You: Thanks, ${invoice} received on the portal`,
          time: '3 Sep',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w20-bg-3',
          title: 'Ma',
          preview: 'call when free',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w20-e2e'),

      day('w20-day', 'TODAY'),
      them('w20-b1', 'Good morning. Northstar Supplies accounts team here. Rohit is on leave '
        + 'this week, so I am handling his accounts.', '08:52'),
      them('w20-b2', `Regarding PO ${po} - Barracks Wi-Fi refit - invoice ${invoice} dated `
        + `3 Sep for ${amount}, due today.`, '08:54'),
      them('w20-head', requestLine, headlineTime(scenario) ?? '09:00'),
      fileCard('w20-file', {
        fileName: revisedFile, pages: '2 pages', size: '212 KB',
        caption: 'Revised invoice with the updated bank details', time: '09:01',
      }),
      them('w20-b3', 'Please process before 2 pm so the team can dispatch the access points '
        + 'tomorrow.', '09:03'),

      them('w20-b4', 'Any update? Our MD has asked me to confirm the payment by 2 pm.', '09:31',
        { since: 'branch' }),
      them('w20-b5', 'Please do not use the old account, payments to it will bounce during the '
        + 'audit.', '09:32', { since: 'branch' }),

      typing('w20-typing', { since: 'verify', until: 'resolve' }),

      {
        kind: 'system', id: 'w20-after-pay', tone: 'alert',
        text: `${amount} released to NORTHSTAR SUPPLY SERVICES, account ending 9082. The vendor `
          + 'record now holds the new account.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w20-after-pay-msg', from: 'them',
        text: 'Received, thank you. Please also clear INV-NS-2304 to the same account.',
        time: '09:48', since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'w20-after-change', tone: 'alert',
        text: 'A beneficiary change to account ending 9082 is waiting in a colleague’s approval '
          + 'queue, marked "supplier request".',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w20-after-reply', from: 'them',
        text: 'Thank you! Please share the payment advice once done.',
        time: '09:36', since: 'verify', afterConsequence: 'simulated_reply_sent',
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
        statusLine: 'This business is not in your contacts.',
        tabs: [
          {
            id: 'business',
            label: 'Business',
            sections: [
              {
                id: 'business-rows', heading: 'Business details',
                rows: [
                  { label: 'Business account', value: 'Yes' },
                  { label: 'Verified business', value: 'No' },
                  { label: 'Profile photo', value: 'The Northstar Supplies logo' },
                  { label: 'Category', value: 'Wholesale' },
                  { label: 'Website', value: 'northstar-billing.training.example' },
                  { label: 'On WhatsApp since', value: 'Monday' },
                  { label: 'First message', value: 'Today at 08:52' },
                ],
                note: 'Anyone can open a business account and upload a logo.',
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
            label: 'Docs',
            count: 1,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: revisedFile, value: 'Today, 09:01' }],
              },
            ],
          },
        ],
      },

      /** The "revised" invoice: every field right except the one that matters. */
      'invoice-viewer': {
        kind: SURFACE.VIEWER,
        title: revisedFile,
        subtitle: '2 pages - 212 KB',
        art: 'document',
        label: `Invoice ${invoice}, revised, PDF`,
        heading: `Tax invoice ${invoice} (revised)`,
        text: `Northstar Supplies - Barracks Wi-Fi refit, PO ${po}. 24 access points and `
          + `installation. Total ${amount}. Bank details (revised): NORTHSTAR SUPPLY SERVICES, `
          + 'Coastal Small Finance Bank, account ending 9082.',
        rowsHeading: 'Document details',
        rows: [
          { label: 'Invoice', value: `${invoice}, dated 3 Sep` },
          { label: 'PO', value: po },
          { label: 'Amount', value: amount },
          { label: 'Pay to', value: 'NORTHSTAR SUPPLY SERVICES' },
          { label: 'Bank', value: 'Coastal Small Finance Bank, account ending 9082' },
          { label: 'Contact on invoice', value: who.identifier },
          { label: 'File created', value: 'Today, 08:47' },
          { label: 'Digital signature', value: 'None' },
        ],
        inertNote: 'Local preview. Nothing is opened, run or sent from here.',
      },

      /**
       * The organisation's own procurement portal. The invoice and the vendor record are
       * reading; the three controls on it are the branch decision.
       */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'invoice',
        pages: {
          invoice: {
            url: `${portalRoot}/invoices/${invoice}`,
            host: portalHost,
            title: `Procurement Portal - ${invoice}`,
            blocks: [
              brand,
              { type: 'heading', text: invoice },
              {
                type: 'summary',
                rows: [
                  { label: 'Supplier', value: 'Northstar Supplies Pvt Ltd (vendor NS-0142)' },
                  { label: 'PO', value: `${po} - Barracks Wi-Fi refit` },
                  { label: 'Amount', value: `${amount}.00`, strong: true },
                  { label: 'Status', value: 'Approved for payment - due today' },
                  { label: 'Received', value: 'Through the vendor portal, 3 Sep' },
                ],
              },
              {
                type: 'notice',
                text: 'Beneficiary on file: Northstar Supplies Pvt Ltd - State Co-operative Bank, '
                  + 'account ending 4471. Verified at onboarding, 14 Mar 2025.',
              },
            ],
            links: [
              { id: 'w20-i-vendor', label: 'Vendor record', to: 'vendor' },
              { id: 'w20-i-edit', label: 'Edit beneficiary', to: 'edit' },
            ],
          },
          vendor: {
            url: `${portalRoot}/vendors/NS-0142`,
            host: portalHost,
            title: 'Procurement Portal - vendor NS-0142',
            blocks: [
              brand,
              { type: 'heading', text: 'Northstar Supplies Pvt Ltd' },
              {
                type: 'summary',
                rows: [
                  { label: 'Vendor', value: 'NS-0142, since March 2025' },
                  { label: 'Contact on file', value: 'Rohit Kapoor, Accounts Manager' },
                  { label: 'Phone on file', value: rohitNumber },
                  { label: 'Email on file', value: 'accounts@northstar.training.example' },
                  { label: 'Website', value: 'northstar.training.example' },
                  { label: 'Bank on file', value: 'State Co-operative Bank, account ending 4471' },
                  { label: 'Pending change requests', value: 'None' },
                ],
              },
              {
                type: 'notice',
                text: 'Bank-detail changes: the supplier submits the change on letterhead through '
                  + 'the vendor portal; accounts calls back the contact on file; a second officer '
                  + 'approves. Changes by phone, email or messaging app are not accepted.',
              },
            ],
            links: [{ id: 'w20-v-invoice', label: `Back to ${invoice}`, to: 'invoice' }],
          },
          edit: {
            url: `${portalRoot}/vendors/NS-0142/beneficiary`,
            host: portalHost,
            title: 'Procurement Portal - edit beneficiary',
            blocks: [
              brand,
              { type: 'heading', text: 'Edit beneficiary - NS-0142' },
              {
                type: 'notice',
                text: 'Beneficiary changes normally need a second approver. Payments due today can '
                  + 'use the single-approver override.',
              },
              {
                type: 'form',
                heading: 'New bank details',
                fields: [
                  field({ name: 'holder', label: 'Account holder name', length: 3, max: 40 }),
                  field({
                    name: 'account', label: 'Account number', kind: FIELD_KIND.DIGITS,
                    length: 9, max: 18,
                  }),
                  field({ name: 'ifsc', label: 'IFSC', length: 11, placeholder: 'ABCD0123456' }),
                ],
              },
            ],
            primary: { label: 'Continue', to: 'review' },
            links: [{ id: 'w20-e-invoice', label: `Back to ${invoice}`, to: 'invoice' }],
          },
          review: {
            url: `${portalRoot}/vendors/NS-0142/beneficiary/review`,
            host: portalHost,
            title: 'Procurement Portal - review change',
            blocks: [
              brand,
              { type: 'heading', text: 'Review beneficiary change' },
              {
                type: 'summary',
                rows: [
                  { label: 'From', value: 'State Co-operative Bank, account ending 4471' },
                  { label: 'To', value: 'The account you entered' },
                  { label: 'Reason', value: 'Supplier request' },
                  { label: 'Vendor portal request', value: 'None' },
                  { label: 'Approval', value: 'Second officer, or single-approver override' },
                  { label: 'Then pay', value: `${invoice}, ${amount}` },
                ],
              },
            ],
            links: [{ id: 'w20-r-edit', label: 'Change the details', to: 'edit' }],
          },
          submitted: {
            final: true,
            url: `${portalRoot}/vendors/NS-0142/beneficiary/submitted`,
            host: portalHost,
            title: 'Procurement Portal - change submitted',
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Change request',
                text: 'Submitted for second approval.',
                rows: [
                  { label: 'Beneficiary', value: 'Pending: the account you entered' },
                  { label: invoice, value: 'Will be paid to the new account once approved' },
                ],
              },
            ],
          },
          released: {
            final: true,
            url: `${portalRoot}/payments/${invoice}`,
            host: portalHost,
            title: 'Procurement Portal - payment released',
            blocks: [
              brand,
              {
                type: 'result',
                heading: 'Payment',
                text: `${amount} released.`,
                rows: [
                  { label: 'Paid to', value: 'The account you entered' },
                  { label: 'Vendor record', value: 'Now holds the new account' },
                  { label: 'Reversal', value: 'Only if the receiving bank agrees' },
                ],
              },
            ],
          },
          held: {
            final: true,
            url: `${portalRoot}/invoices/${invoice}/hold`,
            host: portalHost,
            title: `Procurement Portal - ${invoice} on hold`,
            blocks: [
              brand,
              {
                type: 'result',
                heading: invoice,
                text: 'On hold.',
                rows: [
                  { label: 'Reason', value: 'Bank-detail change received outside the vendor portal' },
                  { label: 'Next', value: 'Callback to the contact on file' },
                  { label: 'Beneficiary on file', value: 'Unchanged - account ending 4471' },
                ],
              },
            ],
          },
        },
      },

      /** The contact on file, on the number in the vendor record. */
      'call-rohit': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Rohit Kapoor - Northstar (vendor record)',
        number: rohitNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Rohit Kapoor.' },
          { at: 3, speaker: 'you', text: `A Northstar WhatsApp account says your bank is under audit and to pay ${invoice} to a new account.` },
          { at: 10, speaker: 'them', text: 'That is not us. I am not on leave, our bank is not under audit, and our account has not changed.' },
          { at: 17, speaker: 'them', text: 'Someone got into our accounts mailbox last week - we had to reset everything. That is probably where the invoice came from. Please do not pay that account.' },
        ],
      },

      /** The number printed on the revised invoice. It confirms itself. */
      'call-invoice': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Northstar accounts (number on the invoice)',
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Northstar accounts, good morning.' },
          { at: 3, speaker: 'them', text: 'Yes, the new account is correct. The audit is only for this month.' },
          { at: 8, speaker: 'them', text: 'Please release it today, the delivery team is waiting.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w20-dir-procurement',
        name: 'Procurement Cell, Unit Falcon',
        identifier: '+91 00000 96100',
        provenance: 'local approved directory',
        role: 'Second approval for payments and any change to a supplier’s bank details.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w20-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w20-c02', slot: SLOT.INLINE,
            label: 'Reply "Noted" from the notification',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w20-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Business info',
            hint: 'The number, the account, the website',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w20-c04', slot: SLOT.INLINE,
            anchor: 'w20-file', label: 'Open', opens: 'invoice-viewer',
          }),
          action({
            id: 'w20-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w20-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w20-branch-file', slot: SLOT.INLINE, anchor: 'w20-file',
            label: 'Open', opens: 'invoice-viewer',
          }),
          /** The portal is where the decision is taken; walking into it records nothing. */
          navigate({
            id: 'w20-branch-portal', slot: SLOT.MENU, label: 'Open the procurement portal',
            hint: `${invoice} and the Northstar vendor record`, opens: 'portal',
          }),
          action({
            id: 'w20-c07', slot: SLOT.SURFACE,
            on: 'portal', page: 'invoice', thenPage: 'held', label: 'Put invoice on hold',
          }),
          action({
            id: 'w20-c08', slot: SLOT.SURFACE,
            on: 'portal', page: 'review', thenPage: 'submitted',
            label: 'Submit change for second approval',
          }),
          action({
            id: 'w20-c09', slot: SLOT.SURFACE,
            on: 'portal', page: 'review', thenPage: 'released',
            label: `Override and release ${amount} now`, targetId: paymentAsset,
          }),
          action({
            id: 'w20-c10', slot: SLOT.COMPOSER,
            label: 'Noted. I will update the account and pay today.',
            echo: 'Noted. I will update the account and pay today.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w20-c11',
            slot: SLOT.MENU, label: 'Call Rohit Kapoor on the number in the vendor record',
            hint: 'The contact the organisation already holds', opens: 'call-rohit',
          }),
          action({
            id: 'w20-c12',
            slot: SLOT.MENU,
            label: 'Take it to the Procurement Cell from the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w20-c13',
            slot: SLOT.MENU,
            label: 'Call the number on the revised invoice', opens: 'call-invoice',
          }),
          action({ id: 'w20-c14', slot: SLOT.MENU, label: 'Report' }),
          action({
            id: 'w20-c15', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w20-c16', slot: SLOT.INLINE,
            label: 'Hold payment; report it and record it for procurement',
          }),
          action({
            id: 'w20-c17', slot: SLOT.INLINE,
            label: 'Update the bank details and pay before 2 pm',
          }),
          action({
            id: 'w20-c18', slot: SLOT.MENU,
            label: 'Block and report the business account',
          }),
          action({
            id: 'w20-c19', slot: SLOT.MENU,
            label: 'Keep the chat and decide after 2 pm',
          }),
          action({
            id: 'w20-c20', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w20-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w20-nav-invoice', slot: SLOT.MENU, label: `Open ${revisedFile}`,
        opens: 'invoice-viewer', after: 'inspect',
      }),
      navigate({
        id: 'w20-nav-portal', slot: SLOT.MENU, label: 'Procurement portal',
        opens: 'portal', after: 'verify',
      }),
    ],

    supportDesk: desk,
  }
}

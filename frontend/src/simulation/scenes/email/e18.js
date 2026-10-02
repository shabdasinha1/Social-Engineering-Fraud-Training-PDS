import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, earlier, mail, quote,
} from './shared.js'

/**
 * E18 - Hijacked Reply-Chain Invoice (IMMERSIVE-008) - a real thread, continued by someone else.
 *
 * NS-104 is a monthly maintenance contract with Northstar Supplies, settled every month to the
 * account verified at onboarding. The learner asked Anil in Northstar's accounts team for the
 * September statement; Anil sent it. Today a reply arrives in the same thread, from the same
 * address, passing every authentication check - because it really did come from Northstar's
 * mailbox. It asks for "this month's settlement only" to go to a "recovery account".
 *
 * That is what separates it from E10's look-alike domain: here nothing about the From line is
 * wrong. The tells are in the email itself - a Reply-To that points somewhere else, a writing style
 * and signature that are not Anil's, and a one-off exception to a routine payment - and in the
 * vendor master, where the account on file and the contact on file have not changed.
 *
 * The Email-native decisions: replying (the To line fills with the other Reply-To address), or
 * forwarding the thread to the second approver asking for a same-day sign-off, which quietly turns
 * dual control into a formality; and in the Payables app, changing the beneficiary or releasing the
 * settlement to the new account, or holding it. The check is a call to Anil on the number in the
 * vendor master. Fictional throughout: Northstar, NS-104 and every account describe nothing real,
 * no money moves and nothing is typed.
 */
export function buildE18(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const desk = directory(scenario)
  const vendor = 'accounts@northstar.training.example'
  const replyTo = 'accounts.northstar@e18.training.example'
  const approver = 'second.approver@unit.training.example'
  const invoice = 'NS-104'
  const contact = '+91 00000 48373'
  const subject = `Re: ${invoice} - September statement`

  return {
    scenarioId: 'E18',
    platform: 'email',
    notify: { sender: 'Northstar Supplies (Accounts)' },
    messageSender: { display_name: 'Northstar Supplies (Accounts)', identifier: vendor },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'vendors', label: 'Vendors', heading: 'Vendors',
          rows: [
            {
              id: 'e18-v-1', from: 'Northstar Supplies (Accounts)', subject: `${invoice} - August statement`,
              preview: 'Statement attached, payable to the usual account. Regards, Anil', time: '06 Aug', inert: true,
            },
            {
              id: 'e18-v-2', from: 'Northstar Supplies (Accounts)', subject: `${invoice} - July statement`,
              preview: 'Statement attached, payable to the usual account. Regards, Anil', time: '05 Jul', inert: true,
            },
          ],
        },
        { id: 'sent', label: 'Sent', heading: 'Sent', rows: [], empty: 'Earlier sent mail is in the thread.' },
      ],
      rows: [
        {
          id: 'e18-row', from: 'Northstar Supplies (Accounts)', subject,
          preview: `${invoice} - Please use our recovery account for this month's settlement.`,
          time: '09:42', unread: true, tag: 'Vendors',
        },
        {
          id: 'e18-bg-1', from: 'Audit Section', subject: 'Quarter-end cut-off',
          preview: 'Please clear pending bills by the 25th.', time: '08:50', inert: true,
        },
        {
          id: 'e18-bg-2', from: 'Meena', subject: 'Re: stationery order',
          preview: 'You: approved, thanks', time: 'Wed', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: 'Northstar Supplies (Accounts)',
      time: '09:42',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Vendors'],
    },

    beats: [
      /** The learner's own request, then Anil's real reply with the statement. */
      earlier('e18-earlier-1', {
        from: 'You',
        to: 'Northstar Supplies (Accounts)',
        time: '02 Sep',
        snippet: `Hi Anil, could you send the September statement for ${invoice}?`,
        paragraphs: [
          `Hi Anil, could you send the September statement for ${invoice} when it is ready? `
          + 'We are running the settlement on the 20th as usual.',
          'Thanks',
        ],
      }),
      earlier('e18-earlier-2', {
        from: 'Northstar Supplies (Accounts)',
        to: 'You',
        time: '05 Sep',
        snippet: `Statement attached, payable to the usual account by 20 Sep. Regards, Anil`,
        paragraphs: [
          `Hi, attached is the September statement for ${invoice}: INR 1,86,000, payable to the usual `
          + 'account by 20 Sep.',
          'Regards,',
          `Anil Mehra · Accounts · Northstar Supplies · ${contact}`,
        ],
      }),
      body('e18-body', {
        greeting: 'Hello,',
        paragraphs: [
          'Hope you are doing well.',
          `Kindly note our main account is under routine audit this month, so please use our recovery `
          + `account for this month's settlement of ${invoice} only:`,
          'Northstar Supplies Recovery · A/C 5520 1180 3391 · IFSC NRTH0000551',
          'Kindly process today itself and share the remittance advice on this email. Our regular account '
          + 'resumes from next month.',
        ],
        signature: ['Thanks & regards', 'Accounts Team'],
        quoted: quote('On 05 Sep, Northstar Supplies (Accounts) wrote:', [
          `Hi, attached is the September statement for ${invoice}: INR 1,86,000, payable to the usual account by 20 Sep.`,
          `Anil Mehra · Accounts · Northstar Supplies · ${contact}`,
        ]),
      }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Northstar Supplies (Accounts)', address: vendor, note: 'Same address as the rest of this thread' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Northstar Supplies (Accounts) <${vendor}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: LEARNER.account },
                  { label: 'In reply to', value: `Your message of 02 Sep (${invoice})` },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'northstar.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'northstar.training.example', result: 'pass' },
                  { label: 'Reply-To', value: 'e18.training.example — not northstar', result: 'differs' },
                ],
              },
              { type: 'note', text: 'The checks confirm the message left Northstar’s own mail system. They cannot tell you who was typing.' },
            ],
            links: [{ id: 'e18-link-compare', label: 'Compare with Anil’s message of 05 Sep', to: 'compare' }],
          },
          compare: {
            title: 'Compare messages',
            blocks: [
              {
                type: 'rows',
                heading: '05 Sep (statement)',
                rows: [
                  { label: 'Reply-To', value: vendor },
                  { label: 'Signed', value: `Anil Mehra · ${contact}` },
                  { label: 'Pay to', value: 'The usual account' },
                ],
              },
              {
                type: 'rows',
                heading: 'Today 09:42',
                rows: [
                  { label: 'Reply-To', value: replyTo },
                  { label: 'Signed', value: 'Accounts Team · no name, no number' },
                  { label: 'Pay to', value: 'A “recovery account”, this month only' },
                ],
              },
            ],
          },
        },
      }),

      /** The Payables application - the existing invoice and the vendor master behind it. */
      payables: {
        kind: SURFACE.APP,
        appName: 'Payables',
        appTagline: `Northstar Supplies · ${invoice}`,
        hero: { label: `${invoice} · September settlement`, value: 'INR 1,86,000', caption: 'Due 20 Sep · awaiting release' },
        sections: [
          {
            id: 'e18-pay-master',
            heading: 'Vendor master',
            rows: [
              { label: 'Account on file', value: 'A/C ····4455 · verified at onboarding by callback' },
              { label: 'Contact on file', value: `Anil Mehra · ${contact}` },
              { label: 'Requested today', value: 'A/C ····3391 “recovery account” (by email)' },
            ],
            note: 'Changing a beneficiary needs a callback on the contact on file and a second approver.',
          },
          {
            id: 'e18-pay-history',
            heading: 'Last settlements',
            rows: [
              { label: 'August', value: 'INR 1,86,000 · A/C ····4455 · paid 20 Aug' },
              { label: 'July', value: 'INR 1,86,000 · A/C ····4455 · paid 19 Jul' },
            ],
          },
        ],
        tabs: [
          { label: 'Invoices', icon: 'home' },
          { label: 'Payments', icon: 'history' },
          { label: 'Vendors', icon: 'profile' },
        ],
      },

      /** The dual-control queue: where a beneficiary change waits for its callback and approver. */
      approvals: {
        kind: SURFACE.APP,
        appName: 'Payables',
        appTagline: 'Beneficiary changes · dual control',
        hero: { label: 'Northstar Supplies', value: 'No approved change', caption: `The account on file for ${invoice} is ····4455.` },
        sections: [
          {
            id: 'e18-appr-rows',
            heading: 'Change request',
            rows: [
              { label: 'Requested', value: 'A/C ····3391, by email today' },
              { label: 'Callback', value: `Not done — contact on file is ${contact}` },
              { label: 'Second approver', value: 'Not requested' },
            ],
            note: `${invoice} stays payable to the account on file until both steps are complete.`,
          },
        ],
        tabs: [
          { label: 'Queue', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Anil Mehra, Northstar (vendor master)',
        number: contact,
        script: [
          { at: 0, speaker: 'them', text: 'Northstar accounts, Anil speaking.' },
          { at: 3, speaker: 'them', text: 'No, we have no recovery account, and I didn’t send that. Please pay the usual account only.' },
          { at: 8, speaker: 'them', text: 'Our IT team found a rule in our mailbox forwarding mail out last week. We are resetting everything now.' },
          { at: 13, speaker: 'them', text: 'Please hold the payment and pass that reply to your security team.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e18-c01', slot: SLOT.INLINE, label: `Open the ${invoice} thread` }),
          action({ id: 'e18-c02', slot: SLOT.INLINE, label: 'Reply from the list to acknowledge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e18-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Northstar Supplies (Accounts)', hint: 'From, Reply-To and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e18-c04', slot: SLOT.MENU, label: 'Read the whole thread from 02 Sep' }),
          action({ id: 'e18-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e18-c06', slot: SLOT.SURFACE, on: 'payables',
            label: 'Change the beneficiary to the recovery account', closes: true,
          }),
          action({
            id: 'e18-c07', slot: SLOT.SURFACE, on: 'payables',
            label: 'Release this month’s settlement to the recovery account', targetId: paymentAsset, closes: true,
          }),
          action({ id: 'e18-c08', slot: SLOT.SURFACE, on: 'payables', label: `Put ${invoice} on hold`, closes: true }),
          action({
            id: 'e18-c09', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: replyTo },
            label: 'Reply that you will use the recovery account',
            echo: `Noted, we will settle ${invoice} to the recovery account today.`,
          }),
          action({
            id: 'e18-c10', slot: SLOT.COMPOSER, compose: { mode: 'forward', to: approver },
            label: 'Forward it to the second approver for sign-off today',
            echo: 'Vendor has changed account for this month only. Please approve today so we are not late.',
          }),
          navigate({ id: 'e18-nav-payables', slot: SLOT.MENU, label: `Open ${invoice} in Payables`, opens: 'payables' }),
        ],
      },

      verify: {
        affordances: [
          action({ id: 'e18-c11', slot: SLOT.MENU, label: 'Call Anil on the vendor-master number', opens: 'call' }),
          action({
            id: 'e18-c12', slot: SLOT.MENU, label: 'Check the change in the dual-control queue',
            hint: 'Callback and second approver', opens: 'approvals',
          }),
          action({
            id: 'e18-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e18-c14', slot: SLOT.MENU, label: 'Reply on the thread to confirm the account' }),
          action({ id: 'e18-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e18-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e18-c17', slot: SLOT.INLINE, label: 'Hold the payment and report the reply' }),
          action({ id: 'e18-c18', slot: SLOT.INLINE, label: 'Pay the recovery account to stay on time' }),
          action({ id: 'e18-c19', slot: SLOT.MENU, label: 'Block the Reply-To address and report' }),
          action({ id: 'e18-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e18-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e18-nav-approvals', slot: SLOT.MENU, label: 'Open the dual-control queue', opens: 'approvals', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e18-dir-vendor',
        name: 'Northstar Supplies — Anil Mehra (vendor master)',
        identifier: contact,
        provenance: 'vendor master, verified at onboarding',
        role: 'The vendor contact on file; any change to how Northstar is paid is confirmed on this number.',
      },
    ],
  }
}

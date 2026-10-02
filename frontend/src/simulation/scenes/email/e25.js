import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, button, directory, earlier, mail, quote, subjectLine, table,
} from './shared.js'

/**
 * E25 - Payroll Direct-Deposit Redirect (IMMERSIVE-009) - somebody else's money, fictional military.
 *
 * The learner works in the pay section. A reply arrives from the officer commanding the section
 * asking them to correct one soldier's allowance account "before the run closes tonight", with the
 * completed change form already filled in and waiting behind a link. It is a Friday, the run does
 * close tonight, and correcting a payment detail for a soldier is exactly the learner's job.
 *
 * Two things make this scene different from every earlier payment scene. The first is whose money
 * it is: the learner is not being asked to pay anyone, and nothing they own is at risk, so the
 * instinct that fires on "transfer this amount" does not fire at all - this is a clerical task from
 * their own boss. The second is the tell. E18 was a thread continued from the vendor's real
 * mailbox; here the mailbox is not the OC's at all. What has been reused is the SUBJECT LINE: the
 * quoted history underneath is a genuine exchange from three weeks ago about the same soldier's
 * leave, pasted under a new subject, so "Re:" is doing all the work that authentication would
 * normally have to do.
 *
 * The evidence is the soldier's own record: the account on file, when it last changed, and the pay
 * section's own rule that a member's account is changed on the member's signed request, never on
 * their manager's say-so. The decisions are the prefilled form's Approve button, and - in the
 * Payroll application - releasing the run to the new account or putting the change on hold.
 * Fictional throughout: the unit, the officer, the soldier, the account and every number describe
 * nothing real; no money moves and nothing is typed on any screen.
 */
export function buildE25(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const desk = directory(scenario)
  const ocName = 'Maj. A. Iyer'
  const ocReal = 'a.iyer@unit.training.example'
  const fromAddress = 're@e25.training.example'
  const clerk = 'pay.clerk@unit.training.example'
  const member = 'Nk R. Bose'
  const serviceRef = 'PAY-3342'
  const memberLine = '+91 00000 25884'
  const subject = `Re: ${serviceRef} — allowance correction, ${member}`

  return {
    scenarioId: 'E25',
    platform: 'email',
    notify: { sender: ocName },
    messageSender: { display_name: ocName, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'pay', label: 'Pay section', heading: 'Pay section',
          rows: [
            {
              id: 'e25-pay-1', from: 'Pay Section', subject: 'September run — closes 18:00 Friday',
              preview: 'Corrections after that go into October.', time: '15 Sep', inert: true,
            },
            {
              id: 'e25-pay-2', from: 'Pay Section', subject: 'Reminder: account changes',
              preview: 'Member’s signed request only. No exceptions for deadlines.', time: '01 Sep', inert: true,
            },
          ],
        },
        { id: 'sent', label: 'Sent', heading: 'Sent', rows: [], empty: 'Earlier sent mail is in the thread.' },
      ],
      rows: [
        {
          id: 'e25-row', from: ocName, subject,
          preview: subjectLine(scenario), time: '11:00', unread: true, tag: 'External',
        },
        {
          id: 'e25-bg-1', from: 'Quartermaster', subject: 'Stores indent for October',
          preview: 'Please send your section’s numbers.', time: '10:20', inert: true,
        },
        {
          id: 'e25-bg-2', from: 'Deepa', subject: 'Re: mess bill query',
          preview: 'You: sorted, thanks', time: 'Thu', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: ocName,
      time: '11:00',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      /**
       * The genuine exchange the subject line was lifted from. It is about the same soldier and
       * the same reference, three weeks ago, and about leave - not about money.
       */
      earlier('e25-earlier-1', {
        from: ocName,
        to: 'You',
        time: '28 Aug',
        snippet: `Please note ${member}’s leave dates against ${serviceRef} for the August return.`,
        paragraphs: [
          `Please note ${member}’s leave dates against ${serviceRef} for the August return — 18 to 26 Aug.`,
          'Nothing else changes on his file.',
          `${ocName} · Officer Commanding`,
        ],
      }),
      body('e25-body', {
        greeting: 'Morning,',
        paragraphs: [
          subjectLine(scenario),
          `${member}'s salary account has changed and the old one has been closed by his bank. His `
          + 'allowance will bounce tonight if it goes to the account on file.',
          'I have filled in the change form for you — it is ready to approve at the link below. Please '
          + 'push it through before the run closes at 18:00 so he is not left short over the weekend.',
          'He is on a course and out of contact this week, so please do not chase him for it.',
        ],
        signature: [ocName, 'Officer Commanding'],
        quoted: quote(`On 28 Aug, ${ocName} wrote:`, [
          `Please note ${member}’s leave dates against ${serviceRef} for the August return — 18 to 26 Aug.`,
          `${ocName} · Officer Commanding`,
        ]),
      }),
      table('e25-change', {
        rows: [
          { label: 'Member', value: `${member} · ${serviceRef}` },
          { label: 'Account on file', value: 'A/C ····6610' },
          { label: 'New account', value: 'A/C 8820 4417 0093' },
          { label: 'IFSC', value: 'TRNG0000882' },
          { label: 'Effective', value: 'September run, tonight' },
        ],
      }),
      button('e25-cta', {
        label: 'Open the completed form',
        caption: 'Pay change · prefilled · approve and submit',
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
              {
                type: 'identity', name: ocName, address: fromAddress,
                note: 'Every earlier message from this name came from a.iyer@unit.training.example',
              },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${ocName} <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'In reply to', value: 'No earlier message — this thread starts here' },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e25.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e25.training.example', result: 'pass' },
                  { label: 'Sending domain', value: 'e25.training.example — not unit.training.example', result: 'external' },
                ],
              },
              {
                type: 'note',
                text: 'The checks pass for the domain that sent it. "Re:" in a subject line is typed by '
                  + 'whoever writes it; the headers say whether a message is really a reply.',
              },
            ],
            links: [{ id: 'e25-link-compare', label: `Compare with ${ocName}'s message of 28 Aug`, to: 'compare' }],
          },
          compare: {
            title: 'Compare messages',
            blocks: [
              {
                type: 'rows',
                heading: '28 Aug (leave dates)',
                rows: [
                  { label: 'From', value: ocReal },
                  { label: 'In reply to', value: 'Your message of 27 Aug' },
                  { label: 'About', value: 'Leave dates for the August return' },
                ],
              },
              {
                type: 'rows',
                heading: 'Today 11:00',
                rows: [
                  { label: 'From', value: fromAddress },
                  { label: 'In reply to', value: 'Nothing — a new message with "Re:" typed in' },
                  { label: 'About', value: 'A bank account, with a deadline' },
                ],
              },
              {
                type: 'note',
                text: 'The quoted text below today’s message is the 28 Aug message, pasted in.',
              },
            ],
          },
        },
      }),

      /** The prefilled change form the link opens. Everything is already filled in. */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Pay change — approve',
            host: 'e25.training.example',
            url: 'https://e25.training.example/verify',
            blocks: [
              { type: 'brand', monogram: 'PC', name: 'Pay Change', tagline: 'Allowance account correction' },
              { type: 'heading', text: `${serviceRef} — ${member}` },
              {
                type: 'text',
                text: 'This form has been completed by the requesting officer. Review the details and '
                  + 'approve to apply the change to tonight’s run.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Member', value: `${member} · ${serviceRef}` },
                  { label: 'Current account', value: 'A/C ····6610' },
                  { label: 'New account', value: 'A/C 8820 4417 0093 · IFSC TRNG0000882', strong: true },
                  { label: 'Requested by', value: `${ocName} (typed on this form)` },
                  { label: 'Member’s signature', value: 'Not required for officer-raised corrections' },
                ],
              },
              {
                type: 'notice',
                text: 'Approving applies the change immediately and includes it in tonight’s run.',
              },
              {
                type: 'fineprint',
                text: 'Nothing on this page is filled in by you. It arrived completed.',
              },
            ],
          },
        },
      },

      /** The unit's own Payroll application: tonight's run and what it would pay. */
      payroll: {
        kind: SURFACE.APP,
        appName: 'Payroll',
        appTagline: `September run · ${member}`,
        hero: {
          label: 'Tonight’s run',
          value: 'Closes 18:00',
          caption: `${serviceRef} is included at the account currently on file.`,
        },
        sections: [
          {
            id: 'e25-payroll-rows',
            heading: 'This member',
            rows: [
              { label: 'Account on file', value: 'A/C ····6610 · unchanged since 2024' },
              { label: 'Requested today', value: 'A/C ····0093, by email' },
              { label: 'Member’s request', value: 'None on file' },
            ],
            note: 'An account is changed on the member’s signed request through the pay section.',
          },
          {
            id: 'e25-payroll-run',
            heading: 'Run controls',
            rows: [
              { label: 'Release', value: 'Applies the current account list to tonight’s run' },
              { label: 'Hold', value: 'Leaves this member out of tonight’s run pending a check' },
            ],
          },
        ],
        tabs: [
          { label: 'Run', icon: 'home' },
          { label: 'Members', icon: 'profile' },
          { label: 'History', icon: 'history' },
        ],
      },

      /** The member's own pay record - the history a change would have to appear in. */
      record: {
        kind: SURFACE.APP,
        appName: 'Pay records',
        appTagline: `${member} · ${serviceRef}`,
        hero: {
          label: 'Account changes',
          value: 'One, in 2024',
          caption: 'Raised by the member in person, with a signed request on file.',
        },
        sections: [
          {
            id: 'e25-record-rows',
            heading: 'Change history',
            rows: [
              { label: 'Mar 2024', value: 'A/C ····6610 · member’s signed request, counter-signed' },
              { label: 'Since', value: 'No change requested, raised or approved' },
              { label: 'Bank notice', value: 'No closure notice received for A/C ····6610' },
            ],
            note: 'A closed account is reported by the bank to the pay section, not by the member’s officer.',
          },
          {
            id: 'e25-record-contact',
            heading: 'Contact on file',
            rows: [
              { label: member, value: memberLine },
              { label: 'Status', value: 'On the station this week — no course recorded' },
            ],
          },
        ],
        tabs: [
          { label: 'Record', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The officer, on the number the unit directory holds. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${ocName} (unit directory)`,
        number: '+91 00000 25107',
        script: [
          { at: 0, speaker: 'them', text: `${ocName} speaking.` },
          { at: 3, speaker: 'them', text: 'No, I have not sent you anything about an account this morning.' },
          { at: 8, speaker: 'them', text: `And ${member} is here on the station — he is not on any course.` },
          { at: 13, speaker: 'them', text: 'Hold it out of the run, keep the mail, and tell the security section.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e25-c01', slot: SLOT.INLINE, label: 'Open the correction request' }),
          action({ id: 'e25-c02', slot: SLOT.INLINE, label: 'Reply from the list to confirm you will action it' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e25-c03', slot: SLOT.INLINE, anchor: 'header',
            label: ocName, hint: 'Sender, thread position and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e25-c04', slot: SLOT.MENU, label: 'Read the quoted thread from 28 Aug' }),
          action({ id: 'e25-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e25-c06', slot: SLOT.INLINE, anchor: 'e25-cta',
            label: 'Open the completed form', targetId: browserAsset, opens: 'portal',
          }),
          action({
            id: 'e25-c07', slot: SLOT.SURFACE, on: 'portal', page: 'form',
            label: 'Approve the change', closes: true,
          }),
          action({
            id: 'e25-c08', slot: SLOT.SURFACE, on: 'payroll',
            label: 'Release tonight’s run with the new account', closes: true,
          }),
          action({
            id: 'e25-c09', slot: SLOT.SURFACE, on: 'payroll',
            label: `Hold ${serviceRef} out of tonight’s run`, closes: true,
          }),
          action({
            id: 'e25-c10', slot: SLOT.COMPOSER, compose: { mode: 'forward', to: clerk },
            label: 'Forward it to the pay clerk to action before 18:00',
            echo: 'Please apply this account correction to tonight’s run — OC has already approved it.',
          }),
          navigate({ id: 'e25-nav-payroll', slot: SLOT.MENU, label: 'Open tonight’s run in Payroll', opens: 'payroll' }),
          /**
           * The form can also be reached from the browser rather than from the message's button
           * (the same shape as E20's "Go to the case portal"). Navigation, recording nothing, so
           * approving it is reachable as an alternative to opening it from the message.
           */
          navigate({ id: 'e25-nav-form', slot: SLOT.MENU, label: 'Open the change form in the browser', opens: 'portal' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e25-c11', slot: SLOT.MENU, label: 'Open the member’s pay record',
            hint: 'Change history and contact on file', opens: 'record',
          }),
          action({
            id: 'e25-c12', slot: SLOT.MENU, label: 'Call the officer on the unit directory number',
            opens: 'call',
          }),
          action({
            id: 'e25-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e25-c14', slot: SLOT.MENU, label: 'Reply on the thread and ask him to confirm' }),
          action({ id: 'e25-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e25-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e25-c17', slot: SLOT.INLINE, label: 'Report it and leave the account on file' }),
          action({ id: 'e25-c18', slot: SLOT.INLINE, label: 'Apply the correction before the run closes' }),
          action({ id: 'e25-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e25-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e25-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e25-nav-record', slot: SLOT.MENU, label: 'Open the member’s pay record', opens: 'record', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e25-dir-oc',
        name: `${ocName} — unit directory`,
        identifier: '+91 00000 25107',
        provenance: 'unit directory, printed and on the intranet',
        role: 'Officer commanding the section; the directory holds the number and the unit address.',
      },
    ],
  }
}

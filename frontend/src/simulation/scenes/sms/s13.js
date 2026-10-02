import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S13 - Rating-Task Recruiter (IMMERSIVE-012) - one recruiter, three numbers.
 *
 * INR 4,000 a day for rating products, no interview, "Reply YES for instant joining". W17 is the
 * product's other rating-task scene and it is built on WhatsApp's evidence: a "Forwarded many
 * times" label, INR 150 already sitting in the learner's bank, and tasks the learner rates until a
 * merged order goes negative. S13 uses none of that. Its evidence is the kind only a Messages app
 * keeps: **conversations are filed by number, not by person** - and "Priya, HR - Nexa Staffing"
 * has written from three different mobile numbers in four days. One of those conversations the
 * phone has already put in Spam. A company does not change its phone number every day.
 *
 * Two SMS-native pressures replace W17's. The first is the **suggested reply**: the app itself
 * offers a one-tap "YES" under the message, and a suggestion sends as soon as it is tapped - so
 * the easiest thing on the screen is answering. The second is **commitment without effort**: the
 * task site shows an onboarding checklist with two of its three steps already ticked "for you" and
 * an INR 800 welcome bonus held until the third. The third is a registration that collects a bank
 * account, and a "refundable" task-ID deposit paid to an individual.
 *
 * The safe branch is taken where the evidence is: on the conversation-details screen that lists
 * the three numbers, which is also where the app lets the learner leave and look the company up
 * themselves. The check is the company's own careers page, found by searching, not by the link.
 *
 * Fictional throughout: Nexa Staffing, "Priya", the task site, the payee, the bonus and every host
 * and number describe nothing real. Nothing is paid, nothing is sent, and what is typed on the
 * drawn pages stays on the screen it is typed on.
 */
export function buildS13(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 49417'
  const heading = senderInfo.display_name ?? 'Remote role'
  const signature = 'Priya, HR — Nexa Staffing'
  const yesterday = '+91 00000 61204'
  const earlier = '+91 00000 73390'
  const host = page?.content?.host ?? 's13.training.example'
  const shortLink = 'nexa-tasks.training.example'
  const office = '+91 00000 26180'

  return {
    scenarioId: 'S13',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 3 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's13-tx-1', from: 'BK-UNIONX', time: '09:12', inert: true,
              preview: 'INR 60 debited from a/c xx4417 at CITY BUS. Not you? Call the number on your card.',
            },
          ],
        },
        {
          id: 'spam', label: 'Spam', heading: 'Spam and blocked',
          rows: [
            {
              id: 's13-spam-1', from: earlier, time: 'Fri', inert: true,
              preview: `${signature}: part-time rating job, INR 3,500/day. Reply YES to join.`,
            },
          ],
        },
      ],
      rows: [
        {
          id: 's13-row', from, time: '10:35', unread: true,
          preview: `${heading}: ${messageText(scenario)}`,
        },
        {
          id: 's13-bg-1', from: yesterday, time: 'Yesterday', inert: true,
          preview: `${signature}: your profile is shortlisted. Your task ID will follow from our team.`,
        },
        {
          id: 's13-bg-2', from: 'Anjali', time: '08:50', inert: true,
          preview: 'Any luck with the job applications?',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'You do not have this number saved. Messages from unknown senders are not checked.',
    },

    beats: [
      system('s13-sys', 'Sent from a number that is not in your contacts.'),
      message('s13-msg', { text: `${heading}: ${messageText(scenario)}`, time: '10:35', via: 'SIM 1' }),
      message('s13-msg2', {
        text: `${signature}. No interview, no experience needed. Two of your three onboarding steps `
          + 'are already done for you. Only 40 seats today.',
        time: '10:36', via: 'SIM 1',
      }),
      message('s13-msg3', {
        text: 'Step 3: activate your task ID and collect your INR 800 welcome bonus.',
        time: '10:38', via: 'SIM 1',
      }),
      link('s13-link', {
        shown: shortLink,
        caption: 'Tap to open this address in the browser.',
      }),
    ],

    surfaces: {
      /**
       * Conversation details - and every conversation the same signature has started. The safe
       * branch is taken here, where the three numbers are.
       */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: '#', name: from, number: from, note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'Started', value: 'Today, 10:35' },
                  { label: 'Messages', value: '3 — no earlier texts from this number' },
                  { label: 'You replied', value: 'Never' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — not a business header', result: 'none' },
                  { label: 'Signs itself', value: signature, result: 'claimed' },
                  { label: 'Same signature, other numbers', value: '2 more in the last four days', result: '3 total' },
                ],
              },
              {
                type: 'items',
                heading: `Conversations signed “${signature}”`,
                items: [
                  { label: from, meta: 'Today', value: 'INR 4,000/day. Reply YES. Task ID link.' },
                  { label: yesterday, meta: 'Yesterday', value: 'Profile shortlisted. Task ID will follow from our team.' },
                  { label: earlier, meta: 'Fri · Spam', value: 'INR 3,500/day. Reply YES to join.' },
                ],
              },
              {
                type: 'note',
                text: 'Three numbers in four days, one already filed as spam by the phone. The pay went '
                  + 'up between the first and the third.',
              },
            ],
            links: [
              { id: 's13-link-target', label: 'Where does this address go?', to: 'linkinfo' },
            ],
          },
        },
      }),

      /** The app's own link details. */
      linkinfo: sms({
        title: 'Link details',
        home: 'target',
        inertNote: 'Local link details. Nothing is fetched and no address is opened from here.',
        pages: {
          target: {
            title: 'Link details',
            blocks: [
              {
                type: 'link',
                heading: 'Address in this message',
                shown: shortLink,
                target: `https://${host}/onboard`,
                rows: [
                  { label: 'Host', value: host },
                  { label: 'Registered', value: '6 days ago' },
                  { label: 'Company named on it', value: 'None' },
                  { label: 'Nexa Staffing’s own site', value: 'No — a different host' },
                ],
              },
            ],
          },
        },
      }),

      /** The task site: a checklist ticked "for you", a held bonus, and two ways to finish step 3. */
      tasks: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dash',
        pages: {
          dash: {
            title: 'Task centre',
            host,
            url: `https://${host}/onboard`,
            blocks: [
              { type: 'brand', monogram: 'TC', name: 'Task Centre', tagline: 'Product rating partners' },
              { type: 'heading', text: 'Welcome. Your seat is held for 30 minutes.' },
              {
                type: 'summary',
                rows: [
                  { label: 'Step 1 · Profile shortlisted', value: 'Done for you' },
                  { label: 'Step 2 · Task ID created', value: 'Done for you' },
                  { label: 'Step 3 · Activate', value: 'Waiting', strong: true },
                  { label: 'Welcome bonus', value: 'INR 800 — held until step 3' },
                  { label: 'Daily earnings', value: 'INR 4,000 after activation' },
                ],
              },
              {
                type: 'notice',
                text: 'Activation needs your payout account and a refundable task-ID deposit of INR 1,499.',
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No task, bonus or earnings exist.',
              },
            ],
            links: [
              { id: 's13-page-register', label: 'Add your payout account', to: 'register' },
              { id: 's13-page-deposit', label: 'Pay the refundable deposit', to: 'deposit' },
            ],
          },
          register: {
            title: 'Payout account',
            host,
            url: `https://${host}/onboard/payout`,
            blocks: [
              { type: 'brand', monogram: 'TC', name: 'Task Centre', tagline: 'Payout account' },
              { type: 'heading', text: 'Where should we send your daily earnings?' },
              {
                type: 'form',
                title: 'Payout account',
                fields: [
                  field({ name: 'name', label: 'Full name as on your bank account', kind: FIELD_KIND.TEXT, length: 3, max: 40 }),
                  field({ name: 'account', label: 'Bank account number', kind: FIELD_KIND.DIGITS, length: 9, max: 16, group: 4 }),
                  field({ name: 'upi', label: 'Payment handle', kind: FIELD_KIND.TEXT, length: 4, max: 30 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's13-page-dash', label: 'Back to the task centre', to: 'dash' },
            ],
          },
        },
      },

      /** The phone's own payment sheet, raised by the site. The payee is a person. */
      deposit: {
        kind: SURFACE.PAYSHEET,
        title: 'Send money',
        app: 'Payments',
        amount: 'INR 1,499.00',
        subtitle: 'To an individual account',
        rows: [
          { label: 'To', value: 'K SHARMA' },
          { label: 'Account type', value: 'Individual savings' },
          { label: 'Purpose', value: 'Task ID activation' },
          { label: 'Refundable', value: 'After 30 completed tasks' },
        ],
        form: {
          title: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The PIN stays on this screen. It is not stored, sent or read by anything.',
      },

      /** The company, found by the learner's own search - not through the link. */
      careers: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'results',
        pages: {
          results: {
            title: 'Search',
            host: 'search.training.example',
            url: 'https://search.training.example/?q=nexa+staffing+careers',
            blocks: [
              { type: 'search', query: 'nexa staffing careers' },
              {
                type: 'listing', host: 'nexastaffing.training.example',
                title: 'Nexa Staffing — Careers',
                text: 'Open roles, how we hire, and how to check that a message is really from us.',
              },
              {
                type: 'listing', host: 'jobsboard.training.example',
                title: 'Nexa Staffing on JobsBoard',
                text: '12 open roles · all office-based · applications through JobsBoard only.',
              },
            ],
            links: [
              { id: 's13-page-site', label: 'Open Nexa Staffing — Careers', to: 'site' },
            ],
          },
          site: {
            title: 'Nexa Staffing — Careers',
            host: 'nexastaffing.training.example',
            url: 'https://nexastaffing.training.example/careers',
            blocks: [
              { type: 'brand', monogram: 'NS', name: 'Nexa Staffing', tagline: 'Careers' },
              { type: 'heading', text: 'People are using our name in text messages' },
              {
                type: 'summary',
                rows: [
                  { label: 'Product-rating roles', value: 'We have none' },
                  { label: 'How we contact you', value: 'By email after you apply, never by text from a mobile' },
                  { label: 'Fees or deposits', value: 'Never — we do not charge candidates anything' },
                  { label: 'Interviews', value: 'Every role has one' },
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation.',
              },
            ],
            links: [
              { id: 's13-page-results', label: 'Back to the results', to: 'results' },
            ],
          },
        },
      },

      /** Nexa Staffing's office, on the number from its own site. */
      officecall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Nexa Staffing — candidate desk (from its own site)',
        number: office,
        script: [
          { at: 0, speaker: 'them', text: 'Nexa Staffing, candidate desk.' },
          { at: 3, speaker: 'them', text: 'We have no one called Priya in HR, and no rating jobs of any kind.' },
          { at: 9, speaker: 'them', text: 'We never text from personal numbers and we never take a deposit. We have had a lot of these calls this week.' },
          { at: 16, speaker: 'them', text: 'Do not pay or send your bank details. Report the numbers as junk.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's13-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's13-c02', slot: SLOT.INLINE, label: 'Reply YES from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's13-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and what else they have sent',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's13-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's13-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({ id: 's13-c06', slot: SLOT.INLINE, anchor: 's13-msg3', label: 'YES' }),
          action({
            id: 's13-c07', slot: SLOT.SURFACE, on: 'tasks', page: 'register',
            label: 'Save the payout account', closes: true,
          }),
          action({
            id: 's13-c08', slot: SLOT.SURFACE, on: 'deposit',
            label: 'Pay INR 1,499 to activate', closes: true,
          }),
          action({
            id: 's13-c09', slot: SLOT.SURFACE, on: 'details', page: 'details',
            label: 'Leave this and look the company up yourself', opens: 'careers',
          }),
          navigate({
            id: 's13-nav-open', slot: SLOT.INLINE, anchor: 's13-link',
            label: 'Open the address', opens: 'tasks',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's13-c10', slot: SLOT.MENU, label: 'Search for Nexa Staffing yourself and open its careers page',
            hint: 'The company’s own site, not the link', opens: 'careers',
          }),
          action({
            id: 's13-c11', slot: SLOT.MENU, label: 'Call Nexa Staffing on the number from its own site',
            opens: 'officecall',
          }),
          action({
            id: 's13-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's13-c13', slot: SLOT.MENU, label: 'Reply to Priya and ask for the company’s registration' }),
          action({ id: 's13-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's13-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's13-c16', slot: SLOT.INLINE, label: 'Report it as junk and pay nothing' }),
          action({ id: 's13-c17', slot: SLOT.INLINE, label: 'Activate the task ID before the seats go' }),
          action({ id: 's13-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's13-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's13-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's13-nav-tasks', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'tasks', after: 'branch' }),
      navigate({ id: 's13-nav-careers', slot: SLOT.MENU, label: 'Search for Nexa Staffing', opens: 'careers', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's13-dir-nexa',
        name: 'Nexa Staffing — candidate desk',
        identifier: office,
        provenance: 'from the company’s own careers page',
        role: 'Confirms whether a role or a recruiter is genuine; the company never charges candidates.',
      },
    ],
  }
}

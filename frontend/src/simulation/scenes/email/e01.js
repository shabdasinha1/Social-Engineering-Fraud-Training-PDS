import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, browserPage, button, directory, earlier, mail,
  sender, subjectLine, timer,
} from './shared.js'

/**
 * E01 - Password Expires Today (IMMERSIVE-005).
 *
 * A message wearing the in-house IT desk's branding says the mailbox password expires today
 * and links to a "self-service" page that asks for the username, the current password and a
 * one-time code. The tells are the ones a mail client actually shows: the display name reads
 * "IT Service Desk" but the address and the Reply-To are unrelated reserved domains, the
 * authentication summary fails, and the button's real target is a training host, not the
 * account portal. The genuine password reminder from a month earlier is in the same thread,
 * from a different address, so the two can be compared side by side.
 *
 * The decision is taken on the sign-in page the link opens - entering the credentials, or
 * clicking the link at all - or by refusing it. The verification route is the learner's own
 * account/security portal, opened directly, where nothing is expiring.
 */
export function buildE01(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'itservicedesk@e01.training.example'
  const replyTo = 'no-reply@id-e01-secure.training.example'
  const loginUrl = browserAsset?.display_target ?? 'https://e01.training.example/verify'
  const loginHost = browserAsset?.content?.host ?? 'e01.training.example'

  return {
    scenarioId: 'E01',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'IT Service Desk' },
    messageSender: { display_name: senderInfo.display_name ?? 'IT Service Desk', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'flagged', label: 'Starred', heading: 'Starred', rows: [], empty: 'Nothing starred.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e01-row',
          from: 'IT Service Desk',
          subject: subjectLine(scenario),
          preview: 'Your mailbox password expires today. Validate now to keep access…',
          time: '08:10',
          unread: true,
        },
        {
          id: 'e01-bg-1', from: 'Unit Mess Committee', subject: 'This week’s menu',
          preview: 'Thursday is regional food day. RSVP by Wednesday.', time: '07:20', inert: true,
        },
        {
          id: 'e01-bg-2', from: 'Priya Menon', subject: 'Re: handover notes',
          preview: 'You: thanks, I’ll take it from here', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'IT Service Desk',
      time: '08:10',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      /** The genuine reminder from a month ago, from the real desk, for comparison. */
      earlier('e01-earlier', {
        from: 'IT Helpdesk (Unit Falcon)',
        to: 'All users',
        time: '13 Aug',
        snippet: 'Scheduled maintenance: password change window opens next month.',
        paragraphs: [
          'This is a routine notice. When your password is due, change it yourself from the '
          + 'Account portal you already use - we will never send you a link to a sign-in page.',
          'IT Helpdesk, Unit Falcon · helpdesk@falcon.unit.training.example',
        ],
      }),

      brand('e01-brand', { monogram: 'IT', name: 'IT Service Desk', tagline: 'Account & access', color: '#1b5fb4' }),
      body('e01-body', {
        greeting: 'Dear user,',
        paragraphs: [
          'Our records show your mailbox password expires today. To avoid an interruption to '
          + 'your access, you must validate your account within the next few hours.',
          'Use the button below to confirm your username, current password and the one-time '
          + 'code we will show you. This keeps your mailbox active.',
        ],
        signature: ['IT Service Desk', 'Access Management'],
        footer: 'This is an automated message. Do not share your one-time code with anyone.',
      }),
      timer('e01-timer', { label: 'Access expires', value: 'Today, 18:00' }),
      button('e01-cta', { label: 'Validate password now', caption: loginHost + '/verify' }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'IT Service Desk', address: fromAddress, note: 'Display name set by sender' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `IT Service Desk <${fromAddress}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Date', value: 'Today, 08:10' },
                  { label: 'Mailed-by', value: loginHost },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: `does not permit ${loginHost}`, result: 'fail' },
                  { label: 'DKIM', value: 'no valid signature', result: 'fail' },
                  { label: 'DMARC', value: 'not aligned with From address', result: 'fail' },
                ],
              },
              { type: 'note', text: 'The display name and the address do not belong to the same organisation.' },
            ],
            links: [
              { id: 'e01-link-original', label: 'Show original', to: 'original' },
              { id: 'e01-link-targets', label: 'Where does the button go?', to: 'targets' },
            ],
          },
          original: {
            title: 'Original message',
            blocks: [
              {
                type: 'mono',
                heading: 'Raw headers',
                lines: [
                  `Return-Path: <bounce@${loginHost}>`,
                  `From: "IT Service Desk" <${fromAddress}>`,
                  `Reply-To: <${replyTo}>`,
                  'Authentication-Results: spf=fail dkim=fail dmarc=fail',
                  `X-Mailer: bulk-sender/2.1 (${loginHost})`,
                ],
              },
            ],
          },
          targets: {
            title: 'Links in this message',
            blocks: [
              {
                type: 'items',
                heading: 'Buttons and links',
                items: [
                  { label: 'Validate password now', value: `${loginUrl}` },
                  { label: 'Text shown', value: 'Account portal' },
                ],
                empty: 'No links.',
              },
              { type: 'note', text: 'The text says one thing; the address it opens is a training host.' },
            ],
          },
        },
      }),

      login: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'portal',
        pages: {
          portal: {
            url: loginUrl,
            host: loginHost,
            title: 'Account validation',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'IT', name: 'Account Self-Service', tagline: 'Validate your access' },
              { type: 'heading', text: 'Validate your mailbox password' },
              { type: 'summary', rows: [
                { label: 'Status', value: 'Expires today', strong: true },
                { label: 'Action', value: 'Confirm credentials' },
              ] },
              { type: 'notice', text: 'Sign in to keep your access active.' },
            ],
            primary: { label: 'Continue to sign in', to: 'signin' },
          },
          signin: {
            url: `${loginUrl}/signin`,
            host: loginHost,
            title: 'Sign in',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'IT', name: 'Sign in', tagline: 'Confirm it’s you' },
              {
                type: 'form',
                heading: 'Confirm your credentials',
                fields: [
                  field({ name: 'username', label: 'Username', length: 3, max: 40 }),
                  field({ name: 'password', label: 'Current password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                  field({ name: 'otp', label: 'One-time code', kind: FIELD_KIND.DIGITS, length: 6, group: 3 }),
                ],
              },
              { type: 'fineprint', text: 'Validation confirms you are the account holder.' },
            ],
            primary: { label: 'Continue', to: 'confirm' },
          },
          confirm: {
            url: `${loginUrl}/confirm`,
            host: loginHost,
            title: 'Confirm',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Submit your details?' },
              { type: 'notice', text: 'Your username, password and one-time code will be sent to validate the account.' },
            ],
          },
          done: {
            url: `${loginUrl}/signin`,
            host: loginHost,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Validation submitted', text: 'Your account has been validated.' },
            ],
          },
        },
      },

      portal: {
        kind: SURFACE.APP,
        appName: 'Account portal',
        appTagline: 'Falcon single sign-on',
        hero: { label: 'Password status', value: 'Active · 47 days left', caption: 'Nothing is expiring today.' },
        sections: [
          {
            id: 'e01-portal-status',
            heading: 'Your account',
            rows: [
              { label: 'Password', value: 'Active — expires in 47 days' },
              { label: 'Last changed', value: '31 days ago, by you' },
              { label: 'Pending actions', value: 'None' },
            ],
            note: 'Password changes always start here, from your own bookmark — never from an emailed link.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Security', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e01-c01', slot: SLOT.INLINE, label: 'Open the email from IT Service Desk' }),
          action({ id: 'e01-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask for a reset' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e01-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'IT Service Desk', hint: 'From, Reply-To and authentication',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e01-c04', slot: SLOT.MENU, label: 'Read the whole thread from the start' }),
          action({ id: 'e01-c05', slot: SLOT.MENU, label: 'Skip ahead to the button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e01-c06', slot: SLOT.INLINE, anchor: 'e01-cta',
            label: 'Validate password now', opens: 'login', targetId: browserAsset?.asset_id ?? null,
          }),
          action({
            id: 'e01-c07', slot: SLOT.SURFACE, on: 'login', page: 'confirm',
            label: 'Validate', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({ id: 'e01-c08', slot: SLOT.SURFACE, on: 'login', label: 'Close the sign-in page', closes: true }),
          action({ id: 'e01-c09', slot: SLOT.MENU, label: 'Leave the email without clicking anything' }),
          navigate({ id: 'e01-nav-login', slot: SLOT.MENU, label: 'Open the sign-in link', opens: 'login' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e01-c10', slot: SLOT.MENU, label: 'Open your Account portal from your bookmark',
            hint: 'Check the password status yourself', opens: 'portal',
          }),
          action({
            id: 'e01-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the IT desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e01-c12', slot: SLOT.MENU, label: 'Reply to the sender to ask if it is real' }),
          action({ id: 'e01-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e01-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e01-c15', slot: SLOT.INLINE, label: 'Report and delete it' }),
          action({ id: 'e01-c16', slot: SLOT.INLINE, label: 'Keep it and validate later' }),
          action({ id: 'e01-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e01-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e01-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e01-nav-portal', slot: SLOT.MENU, label: 'Open the Account portal', opens: 'portal', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e01-dir-desk',
        name: 'Unit Falcon IT Helpdesk',
        identifier: 'helpdesk@falcon.unit.training.example',
        provenance: 'local approved directory',
        role: 'Password changes are made in the Account portal; the desk never emails a sign-in link.',
      },
    ],
  }
}

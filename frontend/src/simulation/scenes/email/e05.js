import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, browserPage, button, directory, mail, sender, subjectLine, timer,
} from './shared.js'

/**
 * E05 - Mandatory HR Policy Login (IMMERSIVE-005).
 *
 * A "People Office" message says pay access will be suspended within the hour unless a policy
 * is acknowledged through a login button. The pressure is compliance and a countdown; the
 * tells are a generic greeting, a Reply-To that is not the HR domain, and a button that opens
 * a cloned HR login and acknowledgement screen asking for the password and payroll details.
 *
 * Unlike E01, the button here is opened as ordinary navigation and the scored risky act at
 * the branch is a reply that confirms before signing in; the release is entering the
 * password and payroll data on the cloned portal. The correct route is to start from the
 * approved HR portal, opened from a bookmark, where no acknowledgement task is assigned.
 */
export function buildE05(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'peopleoffice@e05.training.example'
  const replyTo = 'hr-verify@e05-people.training.example'
  const portalUrl = browserAsset?.display_target ?? 'https://e05.training.example/verify'
  const portalHost = browserAsset?.content?.host ?? 'e05.training.example'

  return {
    scenarioId: 'E05',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'People Office' },
    messageSender: { display_name: senderInfo.display_name ?? 'People Office', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'hr', label: 'HR', heading: 'HR', rows: [], empty: 'Nothing here.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e05-row', from: 'People Office', subject: subjectLine(scenario),
          preview: 'Acknowledge the updated policy within 60 minutes or pay access is suspended…',
          time: '17:48', unread: true,
        },
        {
          id: 'e05-bg-1', from: 'Sports Committee', subject: 'Football final — teams',
          preview: 'Line-ups attached below.', time: '15:30', inert: true,
        },
        {
          id: 'e05-bg-2', from: 'Vikram', subject: 'Re: duty swap',
          preview: 'You: thanks, agreed', time: 'Wed', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'People Office',
      time: '17:48',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      brand('e05-brand', { monogram: 'PO', name: 'People Office', tagline: 'Policy & compliance', color: '#6a3f86' }),
      body('e05-body', {
        greeting: 'Dear employee,',
        paragraphs: [
          'A mandatory policy update requires your acknowledgement. Sign in through the button '
          + 'below and confirm your details to record your acknowledgement.',
          'Acknowledgement is due within 60 minutes. Pay access will be suspended for accounts '
          + 'that do not comply in time.',
        ],
        signature: ['People Office', 'Compliance'],
        footer: 'This is a mandatory notice. Reference: POL-2026-09.',
      }),
      timer('e05-timer', { label: 'Acknowledgement due', value: '00:58 remaining' }),
      button('e05-cta', { label: 'Acknowledge policy now', caption: `${portalHost}/ack` }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'People Office', address: fromAddress, note: 'Generic greeting, no name' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `People Office <${fromAddress}>` },
                  { label: 'Reply-To', value: replyTo },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Greeting', value: '“Dear employee” — not addressed to you' },
                  { label: 'Mailed-by', value: portalHost },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: `does not permit ${portalHost}`, result: 'fail' },
                  { label: 'DKIM', value: 'no valid signature', result: 'fail' },
                  { label: 'DMARC', value: 'not aligned', result: 'fail' },
                ],
              },
              { type: 'note', text: 'HR tasks are assigned in the HR portal, not by a countdown in a message.' },
            ],
            links: [{ id: 'e05-link-target', label: 'Where does the button go?', to: 'targets' }],
          },
          targets: {
            title: 'Links in this message',
            blocks: [
              {
                type: 'items',
                heading: 'Buttons and links',
                items: [
                  { label: 'Acknowledge policy now', value: `${portalUrl}/ack` },
                  { label: 'Text shown', value: 'HR portal' },
                ],
                empty: 'No links.',
              },
              { type: 'note', text: 'The address is a look-alike host, not the HR portal you use.' },
            ],
          },
        },
      }),

      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'ack',
        pages: {
          ack: {
            url: `${portalUrl}/ack`,
            host: portalHost,
            title: 'Policy acknowledgement',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'PO', name: 'People Office', tagline: 'Policy acknowledgement' },
              { type: 'heading', text: 'Acknowledge the updated policy' },
              { type: 'summary', rows: [
                { label: 'Policy', value: 'POL-2026-09', strong: true },
                { label: 'Due', value: 'Within 60 minutes' },
              ] },
              { type: 'notice', text: 'Sign in to record your acknowledgement.' },
            ],
            primary: { label: 'Continue to sign in', to: 'signin' },
          },
          signin: {
            url: `${portalUrl}/ack/signin`,
            host: portalHost,
            title: 'Sign in',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'PO', name: 'Sign in', tagline: 'Confirm your details' },
              {
                type: 'form',
                heading: 'Acknowledge and confirm',
                fields: [
                  field({ name: 'employee', label: 'Employee ID', kind: FIELD_KIND.DIGITS, length: 6, group: 3 }),
                  field({ name: 'password', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                  field({ name: 'payroll', label: 'Payroll account (last 4)', kind: FIELD_KIND.DIGITS, length: 4 }),
                ],
              },
              { type: 'fineprint', text: 'Confirming records your acknowledgement.' },
            ],
            primary: { label: 'Continue', to: 'confirm' },
          },
          confirm: {
            url: `${portalUrl}/ack/confirm`,
            host: portalHost,
            title: 'Confirm',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Submit your acknowledgement?' },
              { type: 'notice', text: 'Your employee ID, password and payroll details will be submitted.' },
            ],
          },
          done: {
            url: `${portalUrl}/ack/signin`,
            host: portalHost,
            title: 'Submitted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Acknowledgement recorded', text: 'Your details were submitted.' },
            ],
          },
        },
      },

      hr: {
        kind: SURFACE.APP,
        appName: 'HR portal',
        appTagline: 'People Office',
        hero: { label: 'Assigned tasks', value: 'None due', caption: 'No acknowledgement is assigned to you.' },
        sections: [
          {
            id: 'e05-hr-rows',
            heading: 'Your tasks',
            rows: [
              { label: 'Policy acknowledgements', value: 'None outstanding' },
              { label: 'Payroll', value: 'Active — no action needed' },
              { label: 'Notices', value: 'HR posts tasks here, never with a countdown by email' },
            ],
            note: 'Any real acknowledgement would appear here when you open the portal yourself.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Tasks', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e05-c01', slot: SLOT.INLINE, label: 'Open the policy email' }),
          action({ id: 'e05-c02', slot: SLOT.INLINE, label: 'Reply from the list to acknowledge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e05-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'People Office', hint: 'Sender, Reply-To, greeting and the button target',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e05-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e05-c05', slot: SLOT.MENU, label: 'Skip ahead to the acknowledge button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e05-c06', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: fromAddress },
            label: 'Reply to confirm before signing in',
            echo: 'Confirming before I acknowledge the policy.',
          }),
          action({
            id: 'e05-c07', slot: SLOT.SURFACE, on: 'portal', page: 'confirm',
            label: 'Acknowledge', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({ id: 'e05-c08', slot: SLOT.SURFACE, on: 'portal', label: 'Close the acknowledgement page', closes: true }),
          action({ id: 'e05-c09', slot: SLOT.MENU, label: 'Leave it and check the HR portal instead' }),
          navigate({ id: 'e05-cta-open', slot: SLOT.INLINE, anchor: 'e05-cta', label: 'Acknowledge policy now', opens: 'portal' }),
          navigate({ id: 'e05-nav-portal', slot: SLOT.MENU, label: 'Open the acknowledgement link', opens: 'portal' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e05-c10', slot: SLOT.MENU, label: 'Open the HR portal from your bookmark',
            hint: 'Check your assigned tasks yourself', opens: 'hr',
          }),
          action({
            id: 'e05-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the People Office'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e05-c12', slot: SLOT.MENU, label: 'Reply to the sender to check it is real' }),
          action({ id: 'e05-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e05-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e05-c15', slot: SLOT.INLINE, label: 'Report and take no action' }),
          action({ id: 'e05-c16', slot: SLOT.INLINE, label: 'Acknowledge now to keep pay access' }),
          action({ id: 'e05-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e05-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e05-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e05-nav-hr', slot: SLOT.MENU, label: 'Open the HR portal', opens: 'hr', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e05-dir-desk',
        name: 'Unit Falcon People Office',
        identifier: fromAddress,
        provenance: 'local approved directory',
        role: 'Assigns policy tasks inside the HR portal; never asks for a password by an emailed link.',
      },
    ],
  }
}

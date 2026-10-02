import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, button, directory, mail, sender, subjectLine,
} from './shared.js'

/**
 * E15 - OAuth Consent for Mail Review (IMMERSIVE-007) - consent phishing / cloud-app access.
 *
 * A "Security Upgrade" message says a mandatory protection step needs the learner to authorise
 * an app - "MailSafe Analyzer" - that will "scan the inbox for threats". The button leads not to
 * a password page but to an OAuth consent screen requesting Mail.Read, Mail.Send and Contacts.
 * The lesson is the one credential-phishing scenes cannot teach: a consent screen grants standing
 * access WITHOUT a password, so reading the permissions and checking the publisher is the whole
 * defence. The app is an unverified publisher and no approved change announced it.
 *
 * The decision is Grant versus Deny on the consent screen - no field is typed, which is exactly
 * what makes it different from every login scene in the batch. Granting is the -8; denying is
 * safe. The checks are the approved application catalogue and IT through the known directory.
 * Nothing is authorised: the consent screen is a drawn panel, no permission is created, no token
 * issued and no mailbox touched. Fictional throughout; nonmilitary.
 */
export function buildE15(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'securityupgrade@e15.training.example'
  const consentHost = 'mailsafe-analyzer.training.example'
  const appName = 'MailSafe Analyzer'

  return {
    scenarioId: 'E15',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Security Upgrade' },
    messageSender: { display_name: senderInfo.display_name ?? 'Security Upgrade', identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'it', label: 'IT', heading: 'IT notices', rows: [], empty: 'No approved change notices.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e15-row', from: 'Security Upgrade', subject: subjectLine(scenario),
          preview: 'Mandatory protection. Approve MailSafe Analyzer to finish.',
          time: '16:58', unread: true, tag: 'External',
        },
        {
          id: 'e15-bg-1', from: 'Service Desk', subject: 'Ticket #4471 closed',
          preview: 'Your printer request is done.', time: '15:30', inert: true,
        },
        {
          id: 'e15-bg-2', from: 'Rahul', subject: 'Re: slides',
          preview: 'You: sent v2', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Security Upgrade',
      time: '16:58',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      brand('e15-brand', { monogram: 'SU', name: 'Security Upgrade', tagline: 'Mailbox protection', color: '#33475b' }),
      body('e15-body', {
        greeting: 'Action required,',
        paragraphs: [
          `As part of a mandatory security upgrade, authorise ${appName} so it can scan your inbox `
          + 'for threats. This does not need your password.',
          'Approve within the hour to keep your mailbox protected.',
        ],
        signature: ['Security Upgrade', 'IT Protection'],
        footer: 'Automated protection notice.',
      }),
      button('e15-cta', { label: `Approve ${appName}`, caption: `${consentHost}/consent` }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: 'Security Upgrade', address: fromAddress, note: 'External sender; not your IT service desk' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Security Upgrade <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'App', value: `${appName} · publisher unverified` },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Publisher', value: 'Unverified — not an approved app', result: 'unverified' },
                  { label: 'Permissions', value: 'Read, send mail and read contacts', result: 'broad' },
                  { label: 'Change notice', value: 'No approved IT change announced this', result: 'unannounced' },
                ],
              },
              { type: 'note', text: 'Approving an app grants standing access without a password. Read what it asks for and who publishes it.' },
            ],
          },
        },
      }),

      /** The OAuth consent screen. A drawn panel: no token, no grant, nothing authorised. */
      consent: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'consent',
        pages: {
          consent: {
            url: `https://${consentHost}/consent`,
            host: consentHost,
            title: 'Permissions requested',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'MA', name: appName, tagline: 'wants to access your account' },
              { type: 'heading', text: `${appName} is requesting:` },
              { type: 'summary', rows: [
                { label: 'Mail.Read', value: 'Read all your email', strong: true },
                { label: 'Mail.Send', value: 'Send email as you', strong: true },
                { label: 'Contacts', value: 'Read your contacts', strong: true },
              ] },
              { type: 'notice', text: 'Publisher unverified. Granting gives this app standing access until it is removed.' },
            ],
          },
          granted: {
            url: `https://${consentHost}/granted`,
            host: consentHost,
            title: 'Access granted',
            final: true,
            blocks: [
              { type: 'result', heading: 'Consent recorded', text: 'The app was granted the requested access.' },
            ],
          },
        },
      },

      /** The approved application catalogue - where a genuine tool would be listed. */
      catalogue: {
        kind: SURFACE.APP,
        appName: 'App catalogue',
        appTagline: 'Approved applications',
        hero: { label: appName, value: 'Not listed', caption: `${appName} is not an approved application.` },
        sections: [
          {
            id: 'e15-cat-rows',
            heading: 'Search results',
            rows: [
              { label: appName, value: 'No match in the approved catalogue' },
              { label: 'Mailbox protection', value: 'Managed centrally by IT — nothing for you to approve' },
              { label: 'Connected apps', value: 'None granted on your account' },
            ],
            note: 'Approved tools are added by IT and never need you to grant them mailbox access from an email.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Apps', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'IT service desk (saved)',
        number: '+91 00000 30991',
        script: [
          { at: 0, speaker: 'them', text: 'IT service desk.' },
          { at: 3, speaker: 'them', text: 'No, there is no upgrade that needs you to approve an app, and MailSafe Analyzer is not ours.' },
          { at: 8, speaker: 'them', text: 'Please deny it, report the email, and we will check your connected apps.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e15-c01', slot: SLOT.INLINE, label: 'Open the security-upgrade email' }),
          action({ id: 'e15-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask if it is real' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e15-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'View sender and app permissions', hint: 'Publisher, permissions and change notice',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e15-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e15-c05', slot: SLOT.MENU, label: 'Skip ahead to the approve button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e15-c06', slot: SLOT.INLINE, anchor: 'e15-cta',
            label: `Approve ${appName}`, opens: 'consent',
          }),
          action({
            id: 'e15-c07', slot: SLOT.SURFACE, on: 'consent', page: 'consent',
            label: 'Grant access', thenPage: 'granted',
          }),
          action({ id: 'e15-c08', slot: SLOT.SURFACE, on: 'consent', label: 'Deny and close the consent page', closes: true }),
          action({ id: 'e15-c09', slot: SLOT.MENU, label: 'Delete the email without approving' }),
          navigate({ id: 'e15-nav-consent', slot: SLOT.MENU, label: 'Open the consent screen', opens: 'consent' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e15-c10', slot: SLOT.MENU, label: 'Check the approved application catalogue',
            hint: 'Look it up yourself', opens: 'catalogue',
          }),
          action({ id: 'e15-c11', slot: SLOT.MENU, label: 'Call the IT service desk on the saved number', opens: 'call' }),
          action({
            id: 'e15-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e15-c13', slot: SLOT.MENU, label: 'Reply to the sender to confirm the upgrade' }),
          action({ id: 'e15-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e15-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e15-c16', slot: SLOT.INLINE, label: 'Deny consent and report the app' }),
          action({ id: 'e15-c17', slot: SLOT.INLINE, label: 'Approve it to finish the upgrade' }),
          action({ id: 'e15-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e15-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e15-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e15-nav-catalogue', slot: SLOT.MENU, label: 'Open the app catalogue', opens: 'catalogue', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e15-dir-it',
        name: 'IT service desk',
        identifier: '+91 00000 30991',
        provenance: 'local approved directory',
        role: 'Manages mailbox protection centrally; never asks you to grant an app access from an email.',
      },
    ],
  }
}

import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, brand, browserPage, button, directory, mail, sender,
} from './shared.js'

/**
 * E12 - Shared Document Sign-In (IMMERSIVE-007) - cloud-document credential phishing.
 *
 * An external collaborator "shares" a document with a generic, curiosity-baiting title -
 * "Updated Deployment Photos" - and the share button leads to a page dressed as a cloud
 * sign-in. Two things are wrong and both are visible: the share is unexpected and comes from
 * outside, and the sign-in host is not the approved collaboration domain. The lure exploits
 * the habit of clicking a share and signing in without looking.
 *
 * What makes it Email-native and distinct from E01/E05's single login page is the SECOND step:
 * after the cloned login there is a push-approval prompt, so the release can happen two ways -
 * typing the password, or approving the "sign-in request" on the authenticator (MFA fatigue).
 * Both are the -8; closing the page is the safe pivot. Nothing executes: the browser is inert,
 * the password is CSS-masked and never leaves the field, and no approval reaches anything. The
 * checks are the approved collaboration portal and a call to the supposed sharer. Fictional:
 * "Unit Falcon", the shared file and the collaborator describe nothing real.
 */
export function buildE12(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const browserAsset = browserPage(scenario)
  const fromAddress = senderInfo.identifier ?? 'sender@e12.training.example'
  const fakeHost = 'docs-share-signin.training.example'
  const approvedHost = 'files.unit.training.example'
  const docTitle = 'Updated Deployment Photos'

  return {
    scenarioId: 'E12',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? fromAddress },
    messageSender: { display_name: senderInfo.display_name ?? fromAddress, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'shared', label: 'Shared', heading: 'Shared with me', rows: [], empty: 'No shared documents from the approved portal.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e12-row', from: fromAddress, subject: `Docs Share: “${docTitle}” shared with you`,
          preview: 'You have a new shared document. Sign in to view it.',
          time: '08:52', unread: true, tag: 'External',
        },
        {
          id: 'e12-bg-1', from: 'Duty Roster', subject: 'This week’s roster',
          preview: 'Published on the portal.', time: '08:10', inert: true,
        },
        {
          id: 'e12-bg-2', from: 'Meena', subject: 'Re: kit list',
          preview: 'You: added the two spares', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: `Docs Share: “${docTitle}” shared with you`,
      fromName: fromAddress,
      time: '08:52',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      brand('e12-brand', { monogram: 'DS', name: 'Docs Share', tagline: 'Secure document sharing', color: '#1f6a3c' }),
      body('e12-body', {
        greeting: 'Hello,',
        paragraphs: [
          `A document has been shared with you: “${docTitle}”.`,
          'To protect the file you must sign in before viewing. This link expires in 24 hours.',
        ],
        signature: ['Docs Share', 'Automated sharing'],
        footer: 'You are receiving this because someone shared a file with your address.',
      }),
      button('e12-cta', { label: `Open “${docTitle}”`, caption: browserAsset?.display_target ?? `https://${fakeHost}/open` }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              { type: 'identity', name: fromAddress, address: fromAddress, note: 'External sender — first time you have heard from them' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: fromAddress },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Button goes to', value: fakeHost },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Share', value: 'Unexpected; no such share in the portal', result: 'caution' },
                  { label: 'Sign-in host', value: `${fakeHost}, not ${approvedHost}`, result: 'off-domain' },
                  { label: 'External', value: 'Outside your organisation', result: 'external' },
                ],
              },
              { type: 'note', text: `The approved collaboration portal is ${approvedHost}. A share you did not expect that asks you to sign in elsewhere is the tell.` },
            ],
          },
        },
      }),

      /** The cloned sign-in, then a push-approval prompt. Inert; nothing is sent or approved. */
      signin: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'login',
        pages: {
          login: {
            url: browserAsset?.display_target ?? `https://${fakeHost}/open`,
            host: fakeHost,
            title: 'Sign in to view',
            secure: false,
            blocks: [
              { type: 'brand', monogram: 'DS', name: 'Docs Share', tagline: 'Sign in to continue' },
              { type: 'heading', text: `“${docTitle}” is waiting` },
              {
                type: 'form',
                heading: 'Sign in with your work account',
                fields: [
                  field({ name: 'account', label: 'Work email', kind: FIELD_KIND.TEXT, length: 6, max: 40, placeholder: 'name@unit.training.example' }),
                  field({ name: 'secret', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
              { type: 'fineprint', text: 'You will be asked to approve the sign-in on your authenticator.' },
            ],
            primary: { label: 'Sign in', to: 'confirm' },
            links: [
              { id: 'e12-lnk-push', label: 'Already signed in? Approve on your authenticator', to: 'mfa' },
            ],
          },
          confirm: {
            url: `https://${fakeHost}/verify`,
            host: fakeHost,
            title: 'Confirm sign-in',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Confirm sign-in' },
              { type: 'notice', text: 'Submitting hands your work email and password to this page.' },
            ],
          },
          mfa: {
            url: `https://${fakeHost}/approve`,
            host: fakeHost,
            title: 'Approve sign-in',
            secure: false,
            blocks: [
              { type: 'heading', text: 'Approve this sign-in?' },
              { type: 'summary', rows: [
                { label: 'App', value: 'Docs Share' },
                { label: 'Request', value: 'Approve to grant access now', strong: true },
              ] },
              { type: 'notice', text: 'Approving lets whoever started this sign-in into your account.' },
            ],
          },
          done: {
            url: `https://${fakeHost}/open`,
            host: fakeHost,
            title: 'Signed in',
            final: true,
            blocks: [
              { type: 'result', heading: 'Sign-in completed', text: 'The page accepted the sign-in.' },
            ],
          },
        },
      },

      /** The approved collaboration portal - where a real share would be. */
      portal: {
        kind: SURFACE.APP,
        appName: 'Files portal',
        appTagline: approvedHost,
        hero: { label: 'Shared with me', value: 'Nothing new', caption: `No document titled “${docTitle}” has been shared with you.` },
        sections: [
          {
            id: 'e12-portal-rows',
            heading: 'Recent shares',
            rows: [
              { label: 'Training plan v3', value: 'Shared by Training Office · Mon' },
              { label: `“${docTitle}”`, value: 'Not present' },
            ],
            note: 'Genuine shares appear here and open without a fresh sign-in.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Shared', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Collaboration desk (saved)',
        number: '+91 00000 51228',
        script: [
          { at: 0, speaker: 'them', text: 'Collaboration desk.' },
          { at: 3, speaker: 'them', text: 'We have no record of that share, and our portal never asks you to sign in through an emailed link.' },
          { at: 8, speaker: 'them', text: 'Please report it and do not enter your password or approve any prompt.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e12-c01', slot: SLOT.INLINE, label: 'Open the shared-document email' }),
          action({ id: 'e12-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what it is' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e12-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'View sender and sign-in target', hint: 'Sender, external status and the link host',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e12-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e12-c05', slot: SLOT.MENU, label: 'Skip ahead to the button' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e12-c06', slot: SLOT.INLINE, anchor: 'e12-cta',
            label: `Open “${docTitle}”`, opens: 'signin', targetId: browserAsset?.asset_id ?? null,
          }),
          action({
            id: 'e12-c07', slot: SLOT.SURFACE, on: 'signin', page: 'confirm',
            label: 'Sign in', thenPage: 'done',
          }),
          action({
            id: 'e12-c08', slot: SLOT.SURFACE, on: 'signin', page: 'mfa',
            label: 'Approve the sign-in request', thenPage: 'done',
          }),
          action({ id: 'e12-c09', slot: SLOT.SURFACE, on: 'signin', label: 'Close the sign-in page', closes: true }),
          action({ id: 'e12-c10', slot: SLOT.MENU, label: 'Delete the share without opening it' }),
          navigate({ id: 'e12-nav-signin', slot: SLOT.MENU, label: 'Open the share link', opens: 'signin' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e12-c11', slot: SLOT.MENU, label: 'Open the approved files portal directly',
            hint: 'Look for the share yourself', opens: 'portal',
          }),
          action({ id: 'e12-c12', slot: SLOT.MENU, label: 'Call the collaboration desk on the saved number', opens: 'call' }),
          action({
            id: 'e12-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e12-c14', slot: SLOT.MENU, label: 'Reply to the sender to confirm the share' }),
          action({ id: 'e12-c15', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e12-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e12-c17', slot: SLOT.INLINE, label: 'Report the message and close it' }),
          action({ id: 'e12-c18', slot: SLOT.INLINE, label: 'Request access through the page to see it' }),
          action({ id: 'e12-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e12-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e12-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e12-nav-portal', slot: SLOT.MENU, label: 'Open the files portal', opens: 'portal', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e12-dir-collab',
        name: 'Collaboration desk',
        identifier: '+91 00000 51228',
        provenance: 'local approved directory',
        role: 'Runs the approved files portal; genuine shares open there without an emailed sign-in.',
      },
    ],
  }
}

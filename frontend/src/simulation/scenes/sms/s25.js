import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  attachment, assetId, day, directory, link, message, messageText, receivedAt, sender, sms,
} from './shared.js'

/**
 * S25 - FASTag Update APK (IMMERSIVE-014) - the app arrives as a picture message.
 *
 * An unsaved number says the learner's toll tag will stop working unless a verification app is
 * installed now, and sends the app itself: an Android package attached to the text as an MMS, with
 * a download link underneath "if the file does not open". A follow-up names a vehicle and a
 * deadline - 23:59 - and says to "allow what the app asks".
 *
 * W14's package came through a messenger link and was decided in the operating system's
 * unknown-apps setting; S20's installer was one confirmation for a remote-help app. S25 is decided
 * on three things only an SMS-delivered package gives:
 *
 * - **The picture-message attachment** itself - a file already on the phone, opened in Files, where
 *   the phone lists who sent it, that no store lists it, and what it will ask for. Deleting it
 *   there is the safe branch.
 * - **The install warning**, which names the permissions a toll app has no need for - to become
 *   the default SMS app (and so read every code), accessibility (to tap for the learner) and screen
 *   capture. "Install anyway" is the release.
 * - **The download link**, opened as the cheaper mistake.
 *
 * Verification is the tag issuer's own app, where the tag is active and KYC was done in March, and
 * the support number listed in that app.
 *
 * Fictional throughout: TollTag KYC, Meridian Bank, `AX-MRDTAG`, vehicle TR 00 AB 4471 and every
 * number describe nothing real. No package exists; nothing is downloaded, installed or granted.
 */
export function buildS25(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const fileAsset = assetId(scenario, ASSET_KIND.FILE)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 20845'
  const at = receivedAt(scenario) ?? '10:15'
  const apk = 'TollTag_KYC_Verify.apk'
  const appName = 'TollTag KYC'
  const vehicle = 'TR 00 AB 4471'
  const issuerHeader = 'AX-MRDTAG'
  const issuerLine = '+91 00000 73180'
  const download = 'https://s25.training.example/tolltag.apk'

  return {
    scenarioId: 'S25',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'conversations', label: 'Conversations', heading: 'Conversations' },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's25-tx-1', from: issuerHeader, time: '20 Sep', inert: true,
              preview: `Toll of INR 115.00 paid by tag for ${vehicle} at PLAZA 12. Balance INR 1,240. -Meridian Bank`,
            },
          ],
        },
        {
          id: 'mms', label: 'Pictures', heading: 'Picture messages', count: 1,
          rows: [
            {
              id: 's25-mm-1', from, time: at, inert: true,
              preview: `Attachment: ${apk} · 6.1 MB`,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        { id: 's25-row', from, time: at, unread: true, preview: messageText(scenario) },
        {
          id: 's25-bg-1', from: 'Dad', time: '08:02', inert: true,
          preview: 'Take the car today if you like. Tag was recharged last week.',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'This number is not in your contacts. It sent you a file.',
    },

    beats: [
      day('s25-day', 'Today'),
      message('s25-msg', { text: messageText(scenario), time: at, via: 'SIM 1 · Picture message' }),
      attachment('s25-apk', { fileName: apk, fileKind: 'Android app package', size: '6.1 MB' }),
      message('s25-m2', {
        text: `Tag for vehicle ${vehicle} stops at 23:59 today. Install, allow what the app asks, and verify `
          + 'with your debit card. Takes 2 minutes.',
        time: '10:16', via: 'SIM 1',
      }),
      link('s25-link', { shown: download, caption: 'If the file does not open' }),
    ],

    surfaces: {
      /** Conversation details - an unsaved mobile sending a package, beside the issuer's own header. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              { type: 'identity', initials: '#', name: from, number: 'Mobile', note: 'Not in your contacts' },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'First message', value: `Today, ${at}` },
                  { label: 'Attachments', value: `1 — ${apk}` },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Your tag issuer writes as', value: `${issuerHeader}, a registered sender ID`, result: 'header' },
                  { label: 'Sent', value: 'An app package as a picture message', result: 'app' },
                  { label: 'Deadline', value: 'Today, 23:59', result: 'today' },
                ],
              },
              {
                type: 'note',
                text: `Every message from your tag issuer is in the Transactions tab, from ${issuerHeader}. `
                  + 'None of them carries a file.',
              },
            ],
          },
        },
      }),

      /** The attachment, opened in Files. The safe branch is here. */
      apkfile: {
        kind: SURFACE.VIEWER,
        title: 'Files',
        subtitle: 'Saved from Messages · 6.1 MB',
        art: 'apk',
        label: apk,
        backLabel: 'Back to Messages',
        inertNote: 'Local file details. The package is not opened, unpacked or run.',
        heading: apk,
        rowsHeading: 'About this file',
        rows: [
          { label: 'Type', value: 'Android app package' },
          { label: 'From', value: `${from}, in a picture message` },
          { label: 'Publisher', value: 'Not stated' },
          { label: 'In the app store', value: 'Not listed' },
          { label: 'Will ask for', value: 'Default SMS app, accessibility, screen capture' },
        ],
      },

      /** The operating system's install warning, raised from the attachment. */
      pkg: {
        kind: SURFACE.INSTALLER,
        title: 'Package installer',
        home: 'warn',
        closeLabel: 'Close the installer',
        pages: {
          warn: {
            style: 'dialog',
            alert: true,
            app: { name: appName, detail: 'From Messages · not from an app store', monogram: 'TT' },
            title: `Install ${appName}?`,
            text: 'This app is not from an app store. After it opens it will ask to:',
            rows: [
              { label: 'Messages', value: 'Become your default SMS app and read every text, including codes' },
              { label: 'Accessibility', value: 'See what is on the screen and tap for you' },
              { label: 'Screen capture', value: 'Record everything shown on the screen' },
            ],
          },
        },
      },

      /** Where the download link goes. */
      dlpage: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'dl',
        pages: {
          dl: {
            title: `${appName} — download`,
            host: 's25.training.example',
            url: download,
            blocks: [
              { type: 'brand', monogram: 'TT', name: appName, tagline: 'Tag verification' },
              { type: 'heading', text: 'Your download is ready' },
              { type: 'text', text: `${apk} (6.1 MB). Open it, allow installs from this browser, then allow every permission.` },
              { type: 'fineprint', text: 'This page is part of the training simulation. Nothing is downloaded.' },
            ],
          },
        },
      },

      /** The learner's own tag issuer app. */
      issuer: {
        kind: SURFACE.APP,
        appName: 'Meridian Bank',
        appTagline: `Toll tag · ${vehicle}`,
        hero: {
          label: 'Tag status',
          value: 'Active',
          caption: 'KYC completed on 14 Mar 2026. Nothing expires today. Balance INR 1,240.',
          chips: ['Opened from your home screen'],
        },
        sections: [
          {
            id: 's25-iss-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${issuerHeader} only` },
              { label: 'KYC', value: 'Done in this app or at a branch — never by another app' },
              { label: 'We never', value: 'Send an app by text, or ask for accessibility or screen capture' },
              { label: 'Tag support', value: issuerLine },
            ],
          },
        ],
        tabs: [
          { label: 'Tag', icon: 'home' },
          { label: 'Tolls', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** Tag support, on the number listed in the issuer's app. */
      tagcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Meridian Bank — tag support',
        number: issuerLine,
        script: [
          { at: 0, speaker: 'them', text: 'Meridian Bank toll tag support.' },
          { at: 3, speaker: 'them', text: `The tag for ${vehicle} is active and its KYC is complete. Nothing is due.` },
          { at: 9, speaker: 'them', text: 'We do not send apps by text. Delete the file without opening it.' },
          { at: 15, speaker: 'them', text: 'Report the text as junk and block the number.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's25-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's25-c02', slot: SLOT.INLINE, label: 'Install the app from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's25-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how your tag issuer writes',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's25-c04', slot: SLOT.INLINE, anchor: 's25-apk',
            label: 'File details', hint: 'What the attachment is, and what it will ask for',
            targetId: fileAsset, opens: 'apkfile',
          }),
          action({ id: 's25-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's25-c06', slot: SLOT.INLINE, anchor: 's25-link',
            label: 'Open the link', opens: 'dlpage',
          }),
          action({
            id: 's25-c07', slot: SLOT.SURFACE, on: 'pkg', page: 'warn',
            label: 'Install anyway', targetId: fileAsset, closes: true,
          }),
          action({
            id: 's25-c08', slot: SLOT.SURFACE, on: 'apkfile',
            label: 'Delete the file without opening it', closes: true,
          }),
          navigate({
            id: 's25-nav-install', slot: SLOT.INLINE, anchor: 's25-apk', label: 'Install', opens: 'pkg',
          }),
          navigate({
            id: 's25-nav-files', slot: SLOT.INLINE, anchor: 's25-apk', label: 'Open in Files', opens: 'apkfile',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's25-c09', slot: SLOT.MENU, label: 'Open the Meridian Bank app and check the tag',
            hint: 'Tag status and KYC', opens: 'issuer',
          }),
          action({
            id: 's25-c10', slot: SLOT.MENU, label: 'Call tag support on the number listed in the bank app',
            opens: 'tagcall',
          }),
          action({
            id: 's25-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's25-c12', slot: SLOT.MENU, label: 'Reply HELP to the number that sent the file' }),
          action({ id: 's25-c13', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's25-c14', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's25-c15', slot: SLOT.INLINE, label: 'Report the text as junk and delete the file' }),
          action({ id: 's25-c16', slot: SLOT.INLINE, label: 'Install it before 23:59 so the tag keeps working' }),
          action({ id: 's25-c17', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's25-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's25-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's25-nav-issuer', slot: SLOT.MENU, label: 'Open the Meridian Bank app', opens: 'issuer', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's25-dir-tag',
        name: 'Meridian Bank — toll tag support',
        identifier: issuerLine,
        provenance: 'listed in the Meridian Bank app',
        role: 'Confirms tag status, KYC and any toll charge.',
      },
    ],
  }
}

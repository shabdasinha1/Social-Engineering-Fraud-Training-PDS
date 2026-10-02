import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, fileCard, headline, headlineTime, sender,
  them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W14 - Movement Order APK.
 *
 * The real-world pattern is one of the best documented in the region: a group ATT&CK
 * tracks as Transparent Tribe (G0134, "primarily targeting diplomatic, defense, and research
 * organizations in India") has for years delivered its Android spyware, CapraRAT, inside
 * apps distributed outside the Play Store and pushed to military personnel by social
 * engineering (SentinelOne, 2023-2024). The shape is always the same: an app is sent where
 * a document was expected, the phone's own guard against unknown apps has to be switched
 * off, and the app then asks for exactly the permissions that let it read messages and
 * watch the screen.
 *
 * ATT&CK: T1660 Phishing (Mobile) for the delivery - its own procedure example is an actor
 * that "delivered malicious applications to victims via... WhatsApp" - and T1636.004 (SMS),
 * T1417.001 (keylogging through an Android AccessibilityService) and T1513 (screen capture)
 * for the three permissions the bank's install asset lists. They describe what the app
 * would do; nothing here does it.
 *
 * **The distinct interaction is the operating system.** Every other scenario keeps the
 * learner inside an app. This one walks them out of WhatsApp and into the phone's own
 * screens - "not allowed to install unknown apps from this source", the settings switch
 * that lifts it, the install confirmation with its permission list - and the decision is
 * made on the phone's dialog, not in the chat. Cancel on either dialog is the client's
 * "installer is closed before permission grant"; Install is the release.
 */
export function buildW14(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const installAsset = assetId(scenario, ASSET_KIND.INSTALL)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const fileName = 'MoveOrder_Viewer.apk'
  const appName = 'MoveOrder Viewer'
  const viewerApp = { name: appName, detail: 'From: WhatsApp', monogram: 'MO' }

  return {
    scenarioId: 'W14',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'last seen today at 13:31',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: true,
    },

    list: {
      title: 'WhatsApp',
      archived: 5,
      rows: [
        {
          id: 'w14-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 4,
        },
        {
          /** An ordinary row, in the background - and it says how orders actually arrive. */
          id: 'w14-bg-1',
          title: 'Det Orders Room',
          group: true,
          preview: 'Chief Clerk: any revision will be on the DMS as usual',
          time: '09:10',
          muted: true,
          inert: true,
        },
        {
          id: 'w14-bg-2',
          title: 'Ma',
          preview: 'did you eat',
          time: '12:40',
          inert: true,
        },
        {
          id: 'w14-bg-3',
          title: 'Sep Rathi',
          preview: 'You: kit list sent',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w14-e2e'),

      day('w14-day', 'TODAY'),
      them('w14-b1',
        'Jai Hind. HQ Alpha Ops here. The movement order for your detachment has been revised, '
        + 'effective 0600 tomorrow.', '13:20'),
      them('w14-b2', 'Route and timings changed because of the exercise. Details in the order.',
        '13:21'),
      fileCard('w14-apk', {
        fileName, fileKind: 'APK', size: '4.8 MB', time: '13:24',
      }),
      them('w14-b3', headline(scenario), headlineTime(scenario) ?? '13:25'),
      them('w14-b4', 'The order is encrypted and opens only in this viewer. Do not forward it.',
        '13:25'),

      them('w14-b5', 'Acknowledge receipt after installing. The nominal roll is being finalised '
        + 'at 1800.', '13:31', { since: 'branch' }),
      them('w14-b6', 'Your detachment is the only one yet to acknowledge.', '13:32',
        { since: 'branch' }),
      them('w14-b7', 'Acknowledgement still pending. Confirm immediately.', '13:44',
        { since: 'verify' }),

      {
        kind: 'system', id: 'w14-after-install', tone: 'alert',
        text: `${appName} was installed. It asked to read your text messages, to turn on `
          + 'accessibility access and to record your screen. No order was displayed.',
        since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'message', id: 'w14-after-install-msg', from: 'them',
        text: 'Received. Keep the viewer running in the background, it syncs the updates.',
        time: '13:40', since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'message', id: 'w14-after-reply', from: 'them',
        text: 'PDF is not authorised for this order. Use the viewer only.',
        time: '13:38', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },
    ],

    surfaces: {
      contact: {
        kind: SURFACE.CONTACT,
        title: 'Contact info',
        name: who.display_name,
        identifier: who.identifier,
        avatarSeed: who.avatar_initials,
        saved: false,
        statusLine: 'This number is not in your contacts.',
        tabs: [
          {
            id: 'about',
            label: 'About',
            sections: [
              {
                id: 'about-rows', heading: 'About',
                rows: [
                  { label: 'Status', value: 'Official' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Official account', value: 'No' },
                  { label: 'Business account', value: 'No' },
                  { label: 'On WhatsApp since', value: 'This week' },
                  { label: 'First message', value: 'Today at 13:20' },
                ],
                note: 'A display name is chosen by whoever owns the number.',
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
                empty: 'You are not in any group with this number. Det Orders Room does not '
                  + 'include it.',
                items: [],
              },
            ],
          },
          {
            id: 'media',
            label: 'Media',
            count: 1,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: fileName, value: 'Today, 13:24' }],
              },
            ],
          },
        ],
      },

      /** What the phone knows about the file before anything is opened. */
      'file-info': {
        kind: SURFACE.VIEWER,
        title: fileName,
        subtitle: 'APK - 4.8 MB',
        art: 'apk',
        label: 'Android app package',
        heading: 'Android app package',
        rowsHeading: 'File details',
        rows: [
          { label: 'Type', value: 'Android package (APK) - installs an app' },
          { label: 'Opens with', value: 'Package installer' },
          { label: 'App name', value: appName },
          { label: 'Developer', value: 'Not identified' },
          { label: 'Would request', value: 'Text messages, Accessibility, Screen recording, Files' },
        ],
        note: 'A document can be previewed without installing anything. This file cannot be '
          + 'previewed; it can only be installed.',
        inertNote: 'File details only. Nothing is executed, installed or extracted.',
      },

      /**
       * The phone's own screens. Moving between them is navigation; Cancel and Install are
       * the decision, and each lives on the dialog it belongs to.
       */
      installer: {
        kind: SURFACE.INSTALLER,
        title: 'Package installer',
        home: 'blocked',
        pages: {
          blocked: {
            style: 'dialog',
            alert: true,
            title: 'For your security, your phone is not allowed to install unknown apps from '
              + 'this source.',
            text: 'WhatsApp is not allowed to install apps. You can change this in Settings.',
            links: [{ id: 'w14-to-settings', label: 'Settings', to: 'allow' }],
          },
          allow: {
            style: 'settings',
            screenTitle: 'Install unknown apps',
            breadcrumb: 'Settings > Apps > Special app access',
            app: { name: 'WhatsApp', detail: 'Can install other apps: No', monogram: 'WA' },
            toggle: { label: 'Allow from this source', to: 'confirm' },
            text: 'Your phone and your personal data are more exposed to attack by apps from '
              + 'unknown sources. If you install apps from this source, you accept '
              + 'responsibility for any damage to your phone or loss of data they cause.',
          },
          confirm: {
            style: 'dialog',
            app: viewerApp,
            title: 'Do you want to install this app?',
            text: 'It will be able to:',
            rows: [
              { label: 'Text messages', value: 'Read and send SMS, including one-time codes' },
              { label: 'Accessibility', value: 'Observe your actions and read what is on screen' },
              { label: 'Screen', value: 'Record or cast everything shown on your screen' },
              { label: 'Files', value: 'Read photos, media and files on this phone' },
            ],
          },
          granted: {
            style: 'prompts',
            final: true,
            app: viewerApp,
            text: `${appName} is installed and is asking for:`,
            prompts: [
              { title: `Allow ${appName} to send and view SMS messages?`, text: 'This includes the one-time codes your bank and your accounts send you.' },
              { title: `Turn on accessibility for ${appName}?`, text: 'It would be able to see everything you do and tap on your behalf.' },
              { title: `Start recording or casting with ${appName}?`, text: 'It would see everything on your screen, including passwords and messages.' },
              { title: `Allow ${appName} to access photos, media and files?`, text: 'Every document and picture on this phone.' },
            ],
            note: 'No order has been displayed.',
          },
        },
      },

      /** The document system the unit actually uses, opened from the phone. */
      'dms-app': {
        kind: SURFACE.APP,
        appName: 'Orders DMS',
        appTagline: 'Unit document system',
        hero: {
          label: 'Movement orders',
          value: 'No revision issued',
          caption: 'Latest: MO 17/26, issued 02 Sep. No amendment since.',
          chips: ['Signed in on this phone', 'Unit Falcon'],
        },
        sections: [
          {
            id: 'orders', heading: 'Recent orders',
            rows: [
              { label: 'MO 17/26', value: 'Detachment move, 0600 on 14 Sep - as issued' },
              { label: 'Amendments', value: 'None' },
            ],
          },
          {
            id: 'distribution', heading: 'How orders are issued',
            rows: [
              { label: 'Channel', value: 'This system only, as a signed PDF' },
              { label: 'Viewer needed', value: 'None - opens in the phone’s own reader' },
              { label: 'Sent by messaging app', value: 'Never' },
            ],
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Orders', icon: 'history' },
          { label: 'Files', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      'call-ops': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name ?? 'Unit Falcon Support Desk',
        number: desk.identifier ?? '+91 00000 95688',
        script: [
          { at: 0, speaker: 'them', text: 'Ops room.' },
          { at: 3, speaker: 'you', text: 'I have been sent a revised movement order as an app to install.' },
          { at: 8, speaker: 'them', text: 'The movement order has not been revised. MO 17 stands as issued, and it is on the DMS.' },
          { at: 15, speaker: 'them', text: 'We never send orders as apps. Do not install it. Send the chat to the unit cyber cell and block the number.' },
        ],
      },

      /** The number that sent the file. It vouches for itself, which proves nothing. */
      'call-sender': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'HQ Alpha Ops.' },
          { at: 3, speaker: 'them', text: 'Yes, the order is genuine. The viewer is mandatory for all ranks.' },
          { at: 8, speaker: 'them', text: 'Install it and acknowledge before 1800.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w14-dir-cyber',
        name: 'Unit Falcon Cyber Cell',
        identifier: '+91 00000 95712',
        provenance: 'local approved directory',
        role: 'Report any file, app or message you cannot verify. Orders are issued only on the DMS.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w14-c01', slot: SLOT.INLINE,
            label: `Open the chat from ${who.display_name}`,
          }),
          /** Tapping the file straight from the preview - the premature route. */
          action({
            id: 'w14-c02', slot: SLOT.INLINE,
            label: 'Tap the file in the preview to open it', opens: 'installer',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w14-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, its name and what you share',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w14-c04', slot: SLOT.INLINE,
            anchor: 'w14-apk', label: 'File info', opens: 'file-info',
          }),
          action({
            id: 'w14-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w14-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w14-branch-open', slot: SLOT.INLINE, anchor: 'w14-apk',
            label: 'Open', opens: 'installer',
          }),
          /** Cancel is on both of the installer's dialogs, exactly where it is on a phone. */
          action({
            id: 'w14-c07', slot: SLOT.SURFACE,
            on: 'installer', page: 'blocked', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w14-c08', slot: SLOT.SURFACE,
            on: 'installer', page: 'confirm', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w14-c09', slot: SLOT.SURFACE,
            on: 'installer', page: 'confirm', label: 'Install', targetId: installAsset,
            thenPage: 'granted',
          }),
          action({
            id: 'w14-c10', slot: SLOT.COMPOSER,
            label: 'I will check the order on the DMS and with the ops room before I open anything.',
            echo: 'I will check the order on the DMS and with the ops room before I open anything.',
          }),
          action({
            id: 'w14-c11', slot: SLOT.COMPOSER,
            label: 'The viewer will not install on my phone. Can you send the order as a PDF?',
            echo: 'The viewer will not install on my phone. Can you send the order as a PDF?',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w14-c12',
            slot: SLOT.MENU, label: 'Check the order in the Orders DMS app',
            hint: 'The unit’s document system, opened from your phone', opens: 'dms-app',
          }),
          action({
            id: 'w14-c13',
            slot: SLOT.MENU, label: 'Call the ops room on the approved number',
            opens: 'call-ops',
          }),
          action({
            id: 'w14-c14',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w14-c15',
            slot: SLOT.MENU,
            label: 'Call the number that sent the file', opens: 'call-sender',
          }),
          action({
            id: 'w14-c16', slot: SLOT.MENU,
            label: 'Report the number',
          }),
          action({
            id: 'w14-c17', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w14-c18', slot: SLOT.INLINE,
            label: 'Keep the file to open later',
          }),
          action({
            id: 'w14-c19', slot: SLOT.INLINE,
            label: 'Delete the file, report it to the cyber cell and block the number',
          }),
          action({
            id: 'w14-c20', slot: SLOT.MENU,
            label: 'Block the number and delete the file',
          }),
          action({
            id: 'w14-c21', slot: SLOT.MENU,
            label: 'Install the viewer and acknowledge',
          }),
          action({
            id: 'w14-c22', slot: SLOT.MENU,
            label: 'Leave the chat unanswered',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w14-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w14-nav-file', slot: SLOT.MENU, label: 'File info',
        opens: 'file-info', after: 'inspect',
      }),
    ],

    supportDesk: desk,
  }
}

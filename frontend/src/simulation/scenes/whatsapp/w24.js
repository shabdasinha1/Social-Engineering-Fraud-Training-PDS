import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, callEvent, day, directory, e2e, headline, headlineTime, link, media, sender, them,
  typing,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W24 - Remote Support Screen Share.
 *
 * The screen-sharing scam is the one police and banks have been describing through 2025:
 * an unexpected call from "support", a fabricated problem, and a request to share the screen
 * or install a remote-access app, after which the caller simply watches the one-time codes
 * arrive. India's banking regulator warned about remote-access apps used this way years
 * before WhatsApp added screen sharing to its own video calls. ATT&CK has the delivery
 * (T1660), the tool (T1663 Remote Access Software, Mobile), what the tool gives - the screen
 * (T1513) and the device's accessibility controls (T1516) - and the pretext (T1684.001).
 *
 * W14 was an order that turned out to be an app. This scene is about the person on the
 * other end, and it is built around three things W14 did not have:
 *
 * 1. **A live call that talks the learner through their own phone.** "Rahul" answers every
 *    hesitation before it is spoken - the warning is "normal, it is because of the virus" -
 *    and the thing he wants is a button on the call itself, Share screen, which leads to the
 *    phone's own consent dialog. That dialog says, in the app's words, who would see what.
 * 2. **A diagnosis that can be compared with the device.** The "scan" he sent is a picture of
 *    another phone - a different carrier and battery in its status bar - and the phone's own
 *    Device care screen, one tap away, says what it last found.
 * 3. **Fear aimed at helpfulness.** The threat is not to the learner; it is that their phone
 *    is infecting their contacts. Saying no feels like leaving them exposed.
 *
 * The install route the client describes is here too, as one download warning and one
 * install dialog listing the accessibility, screen and SMS access; the unknown-apps chain W14
 * already walks is not repeated.
 */
export function buildW24(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const installAsset = assetId(scenario, ASSET_KIND.INSTALL)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const appName = 'AssistNow'
  const apk = 'AssistNow_v4.apk'
  const siteHost = 'assistnow-support.training.example'
  const itDesk = '+91 00000 18510'
  const assistApp = { name: appName, detail: `From: ${siteHost}`, monogram: 'AN' }

  return {
    scenarioId: 'W24',
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
      archived: 2,
      rows: [
        {
          id: 'w24-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 5,
        },
        {
          id: 'w24-bg-1',
          title: 'Unit Falcon IT Notices',
          group: true,
          preview: 'IT Helpdesk: phone checks at the IT room, Mon-Fri 1000-1300',
          time: '09:02',
          muted: true,
          inert: true,
        },
        {
          id: 'w24-bg-2',
          title: 'Ma',
          preview: 'You: yes, tonight',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
        {
          id: 'w24-bg-3',
          title: 'Sep Rathi',
          preview: 'bring the charger',
          time: 'Yesterday',
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w24-e2e'),

      day('w24-day', 'TODAY'),
      them('w24-b1', '⚠️ SECURITY ALERT ⚠️\nOur network monitoring has flagged your number. Your '
        + 'phone is sending infected links to your contacts.', '10:52'),
      media('w24-scan', {
        art: 'scan', label: 'Device diagnostic report', caption: '3 threats found on your device',
        time: '10:53',
      }),
      them('w24-b2', '3 of your contacts have already reported receiving them. Your bank app data '
        + 'is also at risk.', '10:55'),
      them('w24-head', headline(scenario), headlineTime(scenario) ?? '11:01'),
      link('w24-link', {
        title: `${appName} - Remote Support`,
        description: 'Secure repair tool for Android',
        displayUrl: `https://${siteHost}/${apk}`,
        text: 'Download from here. Our technician will connect and remove the infection in 5 minutes.',
        time: '11:02',
      }),
      them('w24-b3', 'Do not restart the phone. Restarting spreads the infection to your SIM.',
        '11:03'),

      /** The branch stage: the technician rings, on this same account. */
      them('w24-b4', 'Technician Rahul is calling you now. Accept and tap Share screen.', '11:09',
        { since: 'branch' }),
      callEvent('w24-ringing', {
        video: true, state: 'ringing', caller: who.display_name, number: who.identifier,
        time: '11:09', since: 'branch', until: 'verify',
      }),
      /**
       * After the branch the ringing strip becomes the app's neutral call entry. Not "missed":
       * the learner may have answered it, and the thread is branch-neutral.
       */
      callEvent('w24-call-log', {
        video: true, state: 'ended', caller: who.display_name, time: '11:09', since: 'verify',
      }),

      {
        kind: 'system', id: 'w24-after-install', tone: 'alert',
        text: `${appName} was installed. It is asking for full control through Accessibility, to `
          + 'record your screen and to read your SMS.',
        since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'message', id: 'w24-after-install-msg', from: 'them',
        text: `Good. Now open ${appName}, allow everything and read me the 9-digit session code.`,
        time: '11:15', since: 'verify', afterConsequence: 'simulated_install',
      },
      {
        kind: 'system', id: 'w24-after-share', tone: 'alert',
        text: `Your screen was shared with ${who.display_name}. While it was shared they could see `
          + 'everything on it, including notifications.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w24-after-share-msg', from: 'them',
        text: 'I can see your screen 👍 Now open your bank app so I can scan it. Read me the code '
          + 'when the SMS comes.',
        time: '11:14', since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w24-after-reply', from: 'them',
        text: 'Priya, Arjun and Neha reported you. No time to explain on chat - accept the call.',
        time: '11:11', since: 'verify', afterConsequence: 'simulated_reply_sent',
      },

      /** The other side composing, drawn after whatever the last action produced. */
      typing('w24-typing', { since: 'verify', until: 'resolve' }),
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
                  { label: 'Profile photo', value: 'A shield with a tick' },
                  { label: 'Category', value: 'IT services' },
                  { label: 'Website', value: siteHost },
                  { label: 'On WhatsApp since', value: '2 days ago' },
                  { label: 'First message', value: 'Today at 10:52' },
                ],
                note: 'A business name and a shield picture can be chosen by anyone.',
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
            label: 'Media',
            count: 2,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [
                  { label: 'Device diagnostic report', value: 'Today, 10:53' },
                  { label: `${siteHost}/${apk}`, value: 'Today, 11:02' },
                ],
              },
            ],
          },
        ],
      },

      /** The "diagnosis": a picture, with somebody else's status bar in it. */
      'scan-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Image',
        subtitle: 'Received today, 10:53',
        art: 'scan',
        label: 'Device diagnostic report',
        heading: `${appName} Mobile Scan`,
        text: 'CRITICAL. 3 threats found: Trojan.SMS.Spy, Adware.Clicker, Spyware.BankGrab. '
          + 'Device: Android device. Scan time 10:48.',
        rowsHeading: 'What the picture shows',
        rows: [
          { label: 'Status bar in the picture', value: 'Carrier “VIRTUO”, battery 19%, 10:48' },
          { label: 'This phone right now', value: 'Carrier Falcon Mobile, battery 76%' },
          { label: 'Device named in the scan', value: '“Android device” - no model' },
          { label: 'Type', value: 'Image' },
        ],
        inertNote: 'Local preview. Nothing is opened or sent from here.',
      },

      /** The phone's own security screen, one tap away from the chat. */
      'device-care': {
        kind: SURFACE.APP,
        appName: 'Device care',
        appTagline: 'Built into this phone',
        hero: {
          label: 'Security',
          value: 'No threats found',
          caption: 'Last full scan today at 09:00 by the phone’s built-in protection. 84 apps checked.',
          chips: ['System app', 'Updated today'],
        },
        sections: [
          {
            id: 'checks', heading: 'Right now',
            rows: [
              { label: 'Apps from unknown sources', value: 'None installed' },
              { label: 'Install unknown apps', value: 'Not allowed for any app' },
              { label: 'Accessibility services in use', value: 'None' },
              { label: 'Screen sharing', value: 'Not active' },
            ],
          },
          {
            id: 'about', heading: 'This phone',
            rows: [
              { label: 'Model', value: 'Falcon A52' },
              { label: 'Carrier', value: 'Falcon Mobile' },
            ],
          },
        ],
        tabs: [
          { label: 'Security', icon: 'home' },
          { label: 'Battery', icon: 'history' },
          { label: 'Storage', icon: 'wallet' },
          { label: 'More', icon: 'profile' },
        ],
      },

      /** The download warning and the install dialog. Cancel is on both. */
      installer: {
        kind: SURFACE.INSTALLER,
        title: 'Download',
        home: 'download',
        pages: {
          download: {
            style: 'dialog',
            alert: true,
            title: 'This type of file can harm your device.',
            text: `Do you want to keep ${apk} anyway? It came from ${siteHost}.`,
            links: [{ id: 'w24-keep', label: 'Keep and open', to: 'confirm' }],
          },
          confirm: {
            style: 'dialog',
            app: assistApp,
            title: 'Do you want to install this app?',
            text: 'After installing, it will ask for:',
            rows: [
              { label: 'Accessibility', value: 'Full control - view and control the screen, view and perform actions' },
              { label: 'Screen', value: 'Record or cast everything shown on the screen' },
              { label: 'SMS', value: 'Read messages, including one-time codes' },
            ],
          },
          setup: {
            style: 'prompts',
            final: true,
            app: assistApp,
            text: `${appName} is installed and is asking for:`,
            prompts: [
              { title: `Allow ${appName} to have full control of your device?`, text: 'Full control is for apps that help with accessibility needs. It can read the screen and tap for you.' },
              { title: `Start recording or casting with ${appName}?`, text: 'It will have access to everything visible on your screen, including passwords, payment details, photos and messages.' },
              { title: `Allow ${appName} to send and view SMS messages?`, text: 'Including the codes your bank sends.' },
            ],
            note: 'Session code on screen: 482 913 771. The technician asks you to read it out.',
          },
        },
      },

      /**
       * The technician's call. Answering is navigation; ending it is a decision, and so is the
       * Share screen dialog it leads to.
       */
      'support-call': {
        kind: SURFACE.CALL,
        title: 'WhatsApp video call - camera off',
        caller: `${who.display_name} - Rahul`,
        number: who.identifier,
        endCallScored: true,
        backLabel: 'Leave the call screen',
        script: [
          { at: 0, speaker: 'them', text: 'Hello, Rahul from Mobile Security Desk. I have your case open. Three infections, very serious.' },
          { at: 5, speaker: 'them', text: 'They are sending links from your WhatsApp to your contacts right now. We must stop it before it reaches your bank app.' },
          { at: 11, speaker: 'them', text: 'I will not ask for any password. Just tap Share screen so I can see the infected files.' },
          { at: 17, speaker: 'them', text: 'The phone will show a warning. That is normal, it is because of the virus. Tap Start now.' },
          { at: 24, speaker: 'them', text: 'Quickly please, every minute it copies more of your data.' },
        ],
        links: [{ id: 'w24-link-share', label: 'Share screen', to: 'cast' }],
      },

      /** WhatsApp's own screen-sharing consent, with its warning about unsaved contacts. */
      cast: {
        kind: SURFACE.INSTALLER,
        title: 'Share screen',
        home: 'prompt',
        closeLabel: 'Close',
        inertNote: 'Simulated system screen. Nothing on this phone is shared.',
        pages: {
          prompt: {
            style: 'dialog',
            alert: true,
            app: { name: 'WhatsApp', detail: 'Screen sharing on a video call', monogram: 'WA' },
            title: 'Start sharing your screen?',
            text: `You are about to share your screen with ${who.display_name}, who is not in your `
              + 'contacts. While you share, they can see everything on your screen, including '
              + 'passwords, payment details, messages and notifications.',
          },
        },
      },

      'call-it': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'IT Helpdesk, Unit Falcon',
        number: itDesk,
        script: [
          { at: 0, speaker: 'them', text: 'IT helpdesk, Cpl. Das.' },
          { at: 3, speaker: 'you', text: 'A WhatsApp account says my phone is infected, and wants me to install AssistNow and share my screen on a call.' },
          { at: 10, speaker: 'them', text: 'Nobody monitors your phone through WhatsApp, and we never ask anyone to install a remote app or share a screen on a call.' },
          { at: 18, speaker: 'them', text: 'Install nothing and share nothing. Report and block the account. If you already tapped anything, bring the phone to the IT room and we will check it.' },
        ],
      },

      'call-back': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: who.display_name,
        number: who.identifier,
        script: [
          { at: 0, speaker: 'them', text: 'Mobile Security Desk, how can I help?' },
          { at: 3, speaker: 'them', text: 'Yes, the alert is genuine. The technician is waiting to connect.' },
          { at: 8, speaker: 'them', text: 'Please don’t delay, your contacts are at risk.' },
        ],
      },
    },

    directoryExtras: [
      {
        id: 'w24-dir-it',
        name: 'IT Helpdesk, Unit Falcon',
        identifier: itDesk,
        provenance: 'local approved directory',
        role: 'Phone and laptop problems. Device checks at the IT room.',
      },
    ],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w24-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          action({
            id: 'w24-c02', slot: SLOT.INLINE,
            label: 'Tap the download link in the preview', opens: 'installer',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w24-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Business info',
            hint: 'The account, the number, the website',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w24-c04', slot: SLOT.INLINE,
            anchor: 'w24-scan', label: 'View', opens: 'scan-viewer',
          }),
          action({
            id: 'w24-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w24-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w24-branch-answer', slot: SLOT.INLINE, anchor: 'w24-ringing',
            label: 'Answer', opens: 'support-call',
          }),
          navigate({
            id: 'w24-branch-open', slot: SLOT.INLINE, anchor: 'w24-link',
            label: 'Open', opens: 'installer',
          }),
          action({
            id: 'w24-c07', slot: SLOT.SURFACE,
            on: 'support-call', label: 'End call', closes: true,
          }),
          action({
            id: 'w24-c08', slot: SLOT.SURFACE,
            on: 'cast', page: 'prompt', label: 'Start now', closes: true,
          }),
          action({
            id: 'w24-c09', slot: SLOT.SURFACE,
            on: 'cast', page: 'prompt', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w24-c10', slot: SLOT.SURFACE,
            on: 'installer', page: 'download', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w24-c11', slot: SLOT.SURFACE,
            on: 'installer', page: 'confirm', label: 'Install', targetId: installAsset,
            thenPage: 'setup',
          }),
          action({
            id: 'w24-c12', slot: SLOT.SURFACE,
            on: 'installer', page: 'confirm', label: 'Cancel', closes: true,
          }),
          action({
            id: 'w24-c13', slot: SLOT.COMPOSER,
            label: 'Which contacts reported me? What do I do first?',
            echo: 'Which contacts reported me? What do I do first?',
          }),
          action({
            id: 'w24-c14', slot: SLOT.COMPOSER,
            label: 'I will take my phone to our own IT helpdesk.',
            echo: 'I will take my phone to our own IT helpdesk.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w24-c15',
            slot: SLOT.MENU, label: 'Call the IT helpdesk on the directory number',
            opens: 'call-it',
          }),
          action({
            id: 'w24-c16',
            slot: SLOT.MENU,
            label: 'Check IT support in the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w24-c17',
            slot: SLOT.MENU,
            label: 'Call the Security Desk number back', opens: 'call-back',
          }),
          action({
            id: 'w24-c18', slot: SLOT.MENU,
            label: 'Report the business account',
          }),
          action({
            id: 'w24-c19', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w24-c20', slot: SLOT.INLINE,
            label: 'Report and block; ask IT for a device check',
          }),
          action({
            id: 'w24-c21', slot: SLOT.INLINE,
            label: 'Let the technician clean the phone',
          }),
          action({
            id: 'w24-c22', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
          action({
            id: 'w24-c23', slot: SLOT.MENU,
            label: 'Keep the chat in case the problem comes back',
          }),
          action({
            id: 'w24-c24', slot: SLOT.MENU,
            label: 'Delete the chat',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w24-nav-contact', slot: SLOT.MENU, label: 'Business info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w24-nav-scan', slot: SLOT.MENU, label: 'View the diagnostic report again',
        opens: 'scan-viewer', after: 'inspect',
      }),
      navigate({
        id: 'w24-nav-care', slot: SLOT.MENU, label: 'Settings > Device care',
        opens: 'device-care', after: 'inspect',
      }),
    ],

    supportDesk: desk,
  }
}

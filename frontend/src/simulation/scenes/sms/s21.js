import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, message, messageText, receivedAt, sms, system,
} from './shared.js'

/**
 * S21 - Matching New-Login Alert (IMMERSIVE-014) - sent at 14:22, delivered at 14:49.
 *
 * The learner spent the afternoon in Lab 3 on issued laptop DEV-204, phone in airplane mode as the
 * lab asks. They signed in to Training Portal on that laptop at 14:22. When the phone came back on
 * at 14:49 the portal's security alert arrived - "login on DEV-204 at 14:22" - under the portal's
 * own registered alerts header, in the thread where every earlier new-device alert has arrived.
 *
 * Nothing about it is wrong, and two things make it look as if something might be:
 *
 * - **The time in the text is not the time on the bubble.** A text sent while the phone was off is
 *   delivered when it comes back on. The Messages app's own message details show both times; the
 *   one in the text is the one that matches the learner's sign-in.
 * - **A second text, a minute later, in Spam.** An unsaved number says "unusual sign-in, verify
 *   now" with an address. It is not the alert, and the phone already filed it where it belongs.
 *   Opening it is the unsafe external action this legitimate scene prices.
 *
 * The decision is taken in the portal app's own session list: keep DEV-204 (the correct use) or end
 * a session the learner is still using (the needless rejection). Reporting or blocking the alerts
 * header is the false positive.
 *
 * Fictional throughout: Training Portal, `VM-TPALRT`, DEV-204, DEV-117, Lab 3, Meera and every number
 * describe nothing real. Nothing is signed in to, ended or opened; the sessions are drawn text.
 */
export function buildS21(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const text = messageText(scenario)
  const at = receivedAt(scenario) ?? '14:49'
  const signedIn = text.match(/\bat (\d{2}:\d{2})\b/)?.[1] ?? '14:22'
  const device = text.match(/\b(DEV-\d{3})\b/)?.[1] ?? 'DEV-204'
  const header = 'VM-TPALRT'
  const spamFrom = '+91 00000 88412'
  const spamHost = 'tp-verify.training.example'
  const meera = '+91 00000 26630'

  return {
    scenarioId: 'S21',
    platform: 'sms',
    notify: { sender: header },
    messageSender: { display_name: header, identifier: header },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'security', label: 'Security', heading: 'Security and sign-in' },
        {
          id: 'personal', label: 'Personal', heading: 'Personal', count: 1,
          rows: [
            {
              id: 's21-pe-1', from: 'Meera (Lab 3)', time: '14:04', inert: true,
              preview: `Lab 3 today. You're on laptop ${device} - sign in with your own portal account.`,
            },
          ],
        },
        {
          id: 'updates', label: 'Updates', heading: 'Updates',
          rows: [
            {
              id: 's21-up-1', from: 'VM-NOVCEL', time: '11 Sep', inert: true,
              preview: 'Your data pack renews on 25 Sep. No action is needed.',
            },
          ],
        },
        {
          id: 'spam', label: 'Spam', heading: 'Spam and blocked', count: 1,
          rows: [
            {
              id: 's21-sp-1', from: spamFrom, time: '14:50', inert: true,
              preview: `Training Portal: unusual sign-in. Verify within 2 hours or access is paused: https://${spamHost}/s`,
            },
          ],
        },
      ],
      rows: [
        { id: 's21-row', from: header, time: at, unread: true, preview: text },
        {
          id: 's21-bg-1', from: 'VM-TRPRTL', time: '14 Sep', inert: true,
          preview: 'Your TRAINING PORTAL code is 268407. Do not share it. Expires in 5 minutes.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Business sender ID · sign-in alerts',
      detailsTo: 'details',
    },

    beats: [
      day('s21-day-1', '18 August'),
      message('s21-old-1', {
        text: 'TRAINING PORTAL login on DEV-117 at 09:03. If this was you, no action is needed.',
        time: '09:03', via: 'SIM 1',
      }),
      day('s21-day-2', '02 September'),
      message('s21-old-2', {
        text: 'TRAINING PORTAL login on a new phone at 09:11. If this was you, no action is needed.',
        time: '09:11', via: 'SIM 1',
      }),
      day('s21-day-3', 'Today'),
      system('s21-sys-air', `Airplane mode turned off · ${at}`),
      message('s21-alert', { text, time: at, via: 'SIM 1' }),
      system('s21-sys-noreply', 'You can’t reply to this sender. It sends sign-in alerts only.'),
    ],

    surfaces: {
      /** Conversation details - the portal's registered alerts header and what it has sent before. */
      details: sms({
        title: 'Details',
        home: 'details',
        pages: {
          details: {
            title: 'Conversation details',
            blocks: [
              {
                type: 'identity', initials: 'TP', name: header,
                number: 'Business sender ID — cannot receive replies', note: 'Registered to Training Portal',
              },
              {
                type: 'rows',
                heading: 'This thread',
                rows: [
                  { label: 'Received on', value: 'SIM 1 · TRAINING NET' },
                  { label: 'First message', value: '18 August, 09:03' },
                  { label: 'Messages', value: '3, each naming a device and a time' },
                  { label: 'Filed under', value: 'Security' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered business sender ID', result: 'header' },
                  { label: 'Registered to', value: 'Training Portal — sign-in alerts', result: 'portal' },
                  { label: 'Addresses in its messages', value: 'None, in any of the three', result: 'none' },
                  { label: 'Numbers to call in its messages', value: 'None, in any of the three', result: 'none' },
                ],
              },
              {
                type: 'note',
                text: 'This sender writes once for each new device that signs in to your portal account, '
                  + 'and asks for nothing.',
              },
            ],
            links: [
              { id: 's21-link-alerts', label: 'Alerts from this sender', to: 'alerts' },
            ],
          },
          alerts: {
            title: 'Alerts from this sender',
            blocks: [
              {
                type: 'items',
                heading: 'Each alert, and where you were',
                items: [
                  { label: `Today, ${signedIn}`, meta: device, value: 'Lab 3 — the laptop Meera assigned you at 14:04' },
                  { label: '02 Sep, 09:11', meta: 'New phone', value: 'This phone, the day you set it up' },
                  { label: '18 Aug, 09:03', meta: 'DEV-117', value: 'Lab 1 — the laptop you used that morning' },
                ],
              },
              {
                type: 'note',
                text: 'Each alert names the device and the time of the sign-in, not the time the text reached you.',
              },
            ],
          },
        },
      }),

      /** Message details - the Messages app's own sent and delivered times. */
      msginfo: sms({
        title: 'Message details',
        home: 'message',
        pages: {
          message: {
            title: 'Message details',
            blocks: [
              {
                type: 'rows',
                heading: 'Today’s alert',
                rows: [
                  { label: 'From', value: header },
                  { label: 'Sent', value: `Today, ${signedIn}:41` },
                  { label: 'Delivered to this phone', value: `Today, ${at}:06` },
                  { label: 'Why the gap', value: `Airplane mode was on from 13:58 to ${at}` },
                  { label: 'Device named', value: device },
                  { label: 'Addresses or numbers to call', value: 'None' },
                ],
              },
              {
                type: 'note',
                text: 'A text sent while a phone is off, or in airplane mode, waits with the network and '
                  + 'arrives when the phone comes back.',
              },
            ],
          },
        },
      }),

      /** The Spam folder - a different text from a different sender, one minute later. */
      spam: sms({
        title: 'Spam and blocked',
        home: 'folder',
        inertNote: 'Local Messages screen. Nothing here opens, sends or receives anything.',
        pages: {
          folder: {
            title: 'Spam and blocked',
            blocks: [
              {
                type: 'bar',
                title: 'Moved to Spam.',
                text: `${spamFrom} is not in your contacts and has not texted you before.`,
              },
              {
                type: 'items',
                heading: 'Today',
                items: [
                  {
                    label: spamFrom, meta: '14:50',
                    value: `Training Portal: unusual sign-in. Verify within 2 hours or access is paused: https://${spamHost}/s`,
                  },
                ],
              },
              {
                type: 'link',
                heading: 'Address in the message',
                shown: `https://${spamHost}/s`,
                target: `https://${spamHost}/signin`,
                rows: [
                  { label: 'Site', value: spamHost },
                  { label: 'Training Portal’s site', value: 'portal.training.example' },
                ],
              },
            ],
          },
        },
      }),

      /** The portal app's own device and session list. The decision is here. */
      sessions: {
        kind: SURFACE.APP,
        appName: 'Training Portal',
        appTagline: 'Security · devices and sessions',
        hero: {
          label: 'Signed in now',
          value: `2 devices — this phone and ${device}`,
          caption: `${device} signed in at ${signedIn} today on the Lab 3 network with your password and an `
            + 'approval in this app. It is still open.',
          chips: ['Opened from your home screen'],
        },
        sections: [
          {
            id: 's21-sess-active',
            heading: 'Active sessions',
            rows: [
              { label: device, value: `Since ${signedIn} today · Lab 3 network · browser` },
              { label: 'This phone', value: 'Since 02 Sep · the Training Portal app' },
            ],
          },
          {
            id: 's21-sess-code',
            heading: `How ${device} signed in`,
            rows: [
              { label: 'Password', value: 'Correct at the first try' },
              { label: 'Second step', value: `Approved in this app, on this phone, at ${signedIn} over the lab Wi-Fi` },
            ],
            note: 'Airplane mode stops texts, not Wi-Fi: the approval reached this app at once, and the alert '
              + 'text waited until the phone came back on.',
          },
        ],
        tabs: [
          { label: 'Sessions', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** Sign-in history, opened from the home screen. */
      history: {
        kind: SURFACE.APP,
        appName: 'Training Portal',
        appTagline: 'Security · sign-in history',
        hero: {
          label: 'New-device sign-ins this year',
          value: '3 — all yours',
          caption: `Today ${signedIn} ${device} (Lab 3) · 02 Sep this phone · 18 Aug DEV-117 (Lab 1). No failed `
            + 'sign-ins and no other device.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's21-hist-alerts',
            heading: 'How we alert you',
            rows: [
              { label: 'Texts', value: `From ${header} only, one per new device` },
              { label: 'They contain', value: 'The device and the time — never an address or a number' },
              { label: 'If it was you', value: 'Nothing to do. Mark the alert reviewed here if you like.' },
            ],
          },
        ],
        tabs: [
          { label: 'Sessions', icon: 'home' },
          { label: 'History', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The lab coordinator, on her saved number. */
      labcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Meera (Lab 3)',
        number: meera,
        script: [
          { at: 0, speaker: 'them', text: 'Lab 3, Meera speaking.' },
          { at: 3, speaker: 'them', text: `Yes, ${device} was yours this afternoon. You signed in just after two.` },
          { at: 9, speaker: 'them', text: 'Everyone gets that alert the first time they use a lab laptop.' },
          { at: 14, speaker: 'them', text: 'Leave it. Sign out of the laptop when you hand it back.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's21-c01', slot: SLOT.INLINE, label: 'Open the alert' }),
          action({ id: 's21-c02', slot: SLOT.INLINE, label: 'Call the IT desk from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's21-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Who sends these alerts, and what else it has sent',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's21-c04', slot: SLOT.INLINE, anchor: 's21-alert',
            label: 'Message details', hint: 'When it was sent, and when it arrived',
            targetId: threadAsset, opens: 'msginfo',
          }),
          action({ id: 's21-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's21-c06', slot: SLOT.SURFACE, on: 'sessions',
            label: `This was me — keep ${device} signed in`, closes: true,
          }),
          action({
            id: 's21-c07', slot: SLOT.SURFACE, on: 'sessions',
            label: `End the ${device} session`, closes: true,
          }),
          action({
            id: 's21-c08', slot: SLOT.SURFACE, on: 'spam', page: 'folder',
            label: `Open ${spamHost}`, closes: true,
          }),
          navigate({
            id: 's21-nav-sessions', slot: SLOT.MENU, label: 'Open Training Portal from the home screen',
            opens: 'sessions',
          }),
          navigate({ id: 's21-nav-spam', slot: SLOT.MENU, label: 'Spam and blocked', opens: 'spam' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's21-c09', slot: SLOT.MENU, label: 'Open Training Portal and read the sign-in history',
            hint: 'Every new device this year', opens: 'history',
          }),
          action({
            id: 's21-c10', slot: SLOT.MENU, label: 'Call Meera on her saved number', opens: 'labcall',
          }),
          action({
            id: 's21-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's21-c12', slot: SLOT.MENU, label: `Look up ${spamHost}, the address in the Spam text` }),
          action({ id: 's21-c13', slot: SLOT.MENU, label: 'Report the alert as junk' }),
          action({ id: 's21-c14', slot: SLOT.MENU, label: `Block ${header}` }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's21-c15', slot: SLOT.INLINE, label: `Mark the alert reviewed: the sign-in was yours` }),
          action({ id: 's21-c16', slot: SLOT.INLINE, label: 'Report the alert as junk' }),
          action({ id: 's21-c17', slot: SLOT.MENU, label: 'Keep the thread and carry on with the lab' }),
          action({ id: 's21-c18', slot: SLOT.MENU, label: `Block ${header} and delete the thread` }),
          action({ id: 's21-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's21-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's21-nav-history', slot: SLOT.MENU, label: 'Training Portal sign-in history', opens: 'history', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's21-dir-lab',
        name: 'Meera — Lab 3 coordinator',
        identifier: meera,
        provenance: 'saved contact',
        role: 'Assigns the lab laptops and knows who used which one.',
      },
    ],
  }
}

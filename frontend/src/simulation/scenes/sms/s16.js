import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, day, directory, message, messageText, receivedAt, sms, system,
} from './shared.js'

/**
 * S16 - Learner-Initiated Login Code (IMMERSIVE-013) - the code belongs to the app that asked for it.
 *
 * The learner has just pressed "Send code" in the Training Portal app on this phone, and fifteen
 * seconds later the code arrives from the portal's own registered sender, in the thread where every
 * earlier portal code has arrived. Nothing about it is wrong. What S16 prices is what the learner does
 * WITH a genuine code - and on a phone the right thing is not even in the Messages app.
 *
 * Three things only a handset shows carry the scene:
 *
 * - **The code line at the foot of the text** (`@portal.training.example #482193`) - the format a
 *   phone reads to know which site a code is for, and the reason the keyboard offers it only to the
 *   portal.
 * - **The keyboard's "From Messages" suggestion** inside the portal app. The correct use is taken
 *   there, in a second app, where the session waiting for it is on screen - not by copying digits
 *   around.
 * - **A thread you cannot reply to.** A registered sender ID takes no replies, so the only way a code
 *   leaves this conversation is by forwarding it - which is exactly the helpful-sounding mistake the
 *   scene prices.
 *
 * The needless rejection is the portal's own "cancel this sign-in", taken on a sign-in the learner
 * started. Reporting or blocking the portal's sender is the false positive.
 *
 * Fictional throughout: the Training Portal, `VM-TRPRTL`, session TP-4471 and every number describe
 * nothing real. Nothing is typed, sent or signed in to; the code is drawn text.
 */
export function buildS16(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const text = messageText(scenario)
  const code = text.match(/\b(\d{6})\b/)?.[1] ?? '482193'
  const at = receivedAt(scenario) ?? '14:49'
  const header = 'VM-TRPRTL'
  const host = 'portal.training.example'
  const session = 'TP-4471'
  const helpDesk = '+91 00000 61580'
  const learnerNumber = '+91 00000 10001'

  return {
    scenarioId: 'S16',
    platform: 'sms',
    notify: { sender: header },
    messageSender: { display_name: header, identifier: header },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'codes', label: 'OTPs', heading: 'One-time codes' },
        {
          id: 'personal', label: 'Personal', heading: 'Personal', count: 1,
          rows: [
            {
              id: 's16-pe-1', from: 'Amma', time: '13:05', inert: true,
              preview: 'Are you back for dinner on Sunday?',
            },
          ],
        },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's16-tx-1', from: 'VM-NOVCEL', time: '10 Sep', inert: true,
              preview: 'Your mobile bill of INR 399 is paid. Thank you.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's16-row', from: header, time: at, unread: true,
          preview: text,
        },
        {
          id: 's16-bg-1', from: 'VM-NOVCEL', time: '10 Sep', inert: true,
          preview: '615204 is your code to sign in to NovaCell. It expires in 10 minutes.',
        },
      ],
    },

    conversation: {
      title: header,
      subtitle: 'Business sender ID · sign-in codes',
      detailsTo: 'details',
    },

    beats: [
      day('s16-day-1', '02 September'),
      message('s16-old-1', {
        text: 'Your TRAINING PORTAL code is 730514. Do not share it. Expires in 5 minutes.'
          + `\n\n@${host} #730514`,
        time: '09:12', via: 'SIM 1',
      }),
      day('s16-day-2', '14 September'),
      message('s16-old-2', {
        text: 'Your TRAINING PORTAL code is 268407. Do not share it. Expires in 5 minutes.'
          + `\n\n@${host} #268407`,
        time: '18:30', via: 'SIM 1',
      }),
      day('s16-day-3', 'Today'),
      message('s16-code', { text: `${text}\n\n@${host} #${code}`, time: at, via: 'SIM 1' }),
      system('s16-sys-noreply', 'You can’t reply to this sender. It sends codes only.'),
      system('s16-sys-delete', 'Codes from this sender are deleted from Messages automatically after 24 hours.'),
    ],

    surfaces: {
      /** Conversation details - the portal's registered header, and the codes it has sent before. */
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
                  { label: 'First message', value: '02 September, 09:12' },
                  { label: 'Messages', value: '3, each one a six-digit code' },
                  { label: 'Filed under', value: 'OTPs' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Registered business sender ID', result: 'header' },
                  { label: 'Registered to', value: 'Training Portal — sign-in codes', result: 'portal' },
                  { label: 'Addresses in its messages', value: 'None, in any of the three', result: 'none' },
                  { label: 'Code line', value: `@${host} — the portal’s own address`, result: 'bound' },
                ],
              },
              {
                type: 'note',
                text: 'The last line of each text tells the phone which site the code is for. The keyboard '
                  + 'offers a code only inside the app or page that line names.',
              },
            ],
            links: [
              { id: 's16-link-codes', label: 'Codes from this sender', to: 'codes' },
              { id: 's16-link-message', label: 'Details of today’s message', to: 'message' },
            ],
          },
          codes: {
            title: 'Codes from this sender',
            blocks: [
              {
                type: 'items',
                heading: 'Each code, and the sign-in it arrived for',
                items: [
                  { label: `Today, ${at}`, meta: code, value: 'Sign-in started on this phone at 14:48' },
                  { label: '14 Sep, 18:30', meta: '268407', value: 'You signed in on this phone at 18:29' },
                  { label: '02 Sep, 09:12', meta: '730514', value: 'You signed in on this phone at 09:11' },
                ],
              },
              {
                type: 'note',
                text: 'Every code arrived within a minute of a sign-in started on this phone. Training Portal '
                  + 'lists the same sign-ins under Security.',
              },
            ],
          },
          message: {
            title: 'Message details',
            blocks: [
              {
                type: 'rows',
                heading: 'Today’s message',
                rows: [
                  { label: 'From', value: header },
                  { label: 'Received', value: `Today, ${at}:07 · SIM 1` },
                  { label: 'Code', value: code },
                  { label: 'For', value: host },
                  { label: 'Valid for', value: '5 minutes from sending' },
                  { label: 'Addresses or numbers to call', value: 'None' },
                ],
              },
            ],
          },
        },
      }),

      /** The Training Portal app, open on the sign-in the learner started. The decision is here. */
      portal: {
        kind: SURFACE.APP,
        appName: 'Training Portal',
        appTagline: 'Sign in · this phone',
        hero: {
          label: 'Enter the code we texted you',
          value: `Session ${session}`,
          caption: `You started this sign-in at 14:48. We texted a six-digit code to ${learnerNumber} at ${at}. `
            + 'It works only in this session, for five minutes.',
          chips: ['This phone', 'Waiting for a code'],
        },
        sections: [
          {
            id: 's16-portal-signin',
            heading: 'This sign-in',
            rows: [
              { label: 'Started', value: 'Today, 14:48:52, from this screen' },
              { label: 'Device', value: 'This phone' },
              { label: 'Code sent to', value: learnerNumber },
              { label: 'Code expires', value: '14:54' },
            ],
          },
          {
            id: 's16-portal-keyboard',
            heading: 'Keyboard suggestion',
            rows: [
              { label: 'From Messages', value: `${code} · ${header} · ${at}` },
              { label: 'Offered to', value: `${host} only` },
            ],
            note: 'The keyboard reads the code line at the foot of the text and offers the code only here.',
          },
        ],
        tabs: [
          { label: 'Sign in', icon: 'home' },
          { label: 'Security', icon: 'profile' },
        ],
      },

      /** Training Portal's own security page - the sign-in activity, from the other side. */
      security: {
        kind: SURFACE.APP,
        appName: 'Training Portal',
        appTagline: 'Security · sign-in activity',
        hero: {
          label: 'Sign-in requests',
          value: '1 waiting — this phone',
          caption: `Session ${session}, started at 14:48 on this phone. No other device is signed in `
            + 'or waiting for a code.',
          chips: ['Signed in on this phone before'],
        },
        sections: [
          {
            id: 's16-sec-recent',
            heading: 'Recent sign-ins',
            rows: [
              { label: 'Today, 14:48', value: 'This phone — waiting for the code' },
              { label: '14 Sep, 18:29', value: 'This phone — signed in' },
              { label: '02 Sep, 09:11', value: 'This phone — signed in' },
            ],
          },
          {
            id: 's16-sec-how',
            heading: 'How we send codes',
            rows: [
              { label: 'Texts', value: `From ${header} only` },
              { label: 'A code is for', value: 'The sign-in screen that asked for it' },
              { label: 'We never ask', value: 'Anyone — including our help desk — to be told a code' },
            ],
          },
        ],
        tabs: [
          { label: 'Sign in', icon: 'home' },
          { label: 'Security', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's16-c01', slot: SLOT.INLINE, label: 'Open the code message' }),
          action({ id: 's16-c02', slot: SLOT.INLINE, label: `Copy ${code} from the list` }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's16-c03', slot: SLOT.INLINE, anchor: 'header',
            label: header, hint: 'Who sends these codes, and what else it has sent',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's16-c04', slot: SLOT.INLINE, anchor: 's16-old-2',
            label: 'Compare with the earlier codes', hint: 'When each one arrived',
            targetId: threadAsset, opens: 'details',
          }),
          action({ id: 's16-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's16-c06', slot: SLOT.SURFACE, on: 'portal',
            label: `Fill ${code} from Messages`, closes: true,
          }),
          action({
            id: 's16-c07', slot: SLOT.SURFACE, on: 'portal',
            label: 'Not now — cancel this sign-in', closes: true,
          }),
          action({
            id: 's16-c08', slot: SLOT.INLINE, anchor: 's16-code',
            label: 'Forward this text to the IT help desk',
          }),
          navigate({
            id: 's16-nav-portal', slot: SLOT.MENU, label: 'Switch back to the Training Portal app',
            opens: 'portal',
          }),
          navigate({
            id: 's16-nav-portal-inline', slot: SLOT.INLINE, anchor: 's16-code',
            label: 'Open Training Portal', opens: 'portal',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's16-c09', slot: SLOT.MENU, label: 'Open Training Portal and compare the sign-in under Security',
            hint: 'Which sessions are waiting', opens: 'security',
          }),
          action({
            id: 's16-c10', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's16-c11', slot: SLOT.MENU, label: `Look up ${host}/help, the address the code line names` }),
          action({ id: 's16-c12', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's16-c13', slot: SLOT.MENU, label: `Block ${header}` }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's16-c14', slot: SLOT.INLINE, label: 'Finish signing in and let the code run out' }),
          action({ id: 's16-c15', slot: SLOT.INLINE, label: 'Report the code text as junk' }),
          action({ id: 's16-c16', slot: SLOT.MENU, label: 'Keep the thread; the code clears itself tomorrow' }),
          action({ id: 's16-c17', slot: SLOT.MENU, label: `Block ${header} and delete the thread` }),
          action({ id: 's16-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's16-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's16-nav-security', slot: SLOT.MENU, label: 'Open Training Portal security', opens: 'security', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's16-dir-help',
        name: 'Training Portal — IT help desk',
        identifier: helpDesk,
        provenance: 'local approved directory',
        role: 'Can see your sign-in activity with you. Never needs to be told a code.',
      },
    ],
  }
}

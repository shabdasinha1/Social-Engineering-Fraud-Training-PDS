import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, directory, message, messageText, number, sender, sms, system,
} from './shared.js'

/**
 * S10 - eSIM Upgrade OTP (IMMERSIVE-011) - the warning is already on the phone.
 *
 * "SIM upgrade pending. Call 00000 31010 and quote the OTP sent next." Two minutes later the code
 * arrives - but not in this thread. It arrives where it always does, from the carrier's own
 * registered sender ID, in a message that says in capitals that it must not be shared, names what
 * it authorises, and gives the learner a way to stop it.
 *
 * That second thread is the whole scene, and it is the reason S10 is not S02. S02's decisions were
 * things a voice asked for on a call. S10's are things the learner does **in the carrier's own
 * conversation**: reading the code out, or replying YES to the approval it offers. Both are on the
 * carrier thread, which the learner can walk into from the details screen without deciding
 * anything, so neither release is hidden behind the other. Ringing the number in the text is the
 * third, cheaper mistake, taken on the phone's own dial confirmation.
 *
 * What makes the lesson land is what the code is FOR. It is not a login: it moves the number to a
 * new eSIM, and the number is what every other code on this phone is delivered to.
 *
 * Fictional throughout: NovaCell, `VM-NOVCEL`, the account, the upgrade desk and every number
 * describe nothing real. Nothing is dialled, no code is sent anywhere, and no SIM exists.
 */
export function buildS10(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 87986'
  const callback = '+91 00000 31010'
  const carrierHeader = 'VM-NOVCEL'
  const billLine = '+91 00000 62330'
  const account = 'xx4188'
  const codeText = `DO NOT SHARE. 481920 is your code to approve an eSIM transfer for ${account}. `
    + 'If you did not ask for this, reply NO or call the number on your bill.'

  return {
    scenarioId: 'S10',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 2 },
        {
          id: 'transactions', label: 'Transactions', heading: 'Transactions',
          rows: [
            {
              id: 's10-tx-1', from: carrierHeader, time: '12:53', unread: true, inert: true,
              preview: codeText,
            },
            {
              id: 's10-tx-2', from: carrierHeader, time: '01 Sep', inert: true,
              preview: `Your bill for August on ${account} is ready in the NovaCell app. No action required.`,
            },
            {
              id: 's10-tx-3', from: 'BK-UNIONX', time: '09:14', inert: true,
              preview: 'INR 640 debited from a/c xx4417 at TRAINING MART. Not you? Call the number on your card.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's10-row', from, time: '12:51', unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's10-bg-1', from: 'Anjali', time: '12:04', inert: true,
          preview: 'Can you collect the parcel on the way back?',
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
      system('s10-sys', 'Sent from a number that is not in your contacts.'),
      message('s10-msg', { text: messageText(scenario), time: '12:51', via: 'SIM 1' }),
      number('s10-number', {
        number: callback,
        caption: 'Tap to call the number written in this message.',
      }),
      system('s10-sys2', `A message from ${carrierHeader} arrived in another conversation at 12:53.`),
      message('s10-msg2', {
        text: 'The code has gone out. Ring the desk and read it to the adviser so the upgrade does not lapse.',
        time: '12:54', via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - and the route to the thread the code actually arrived in. */
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
                  { label: 'Started', value: 'Today, 12:51' },
                  { label: 'In the message', value: 'A phone number, no address' },
                  { label: 'Account quoted', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is not a carrier header', result: 'none' },
                  { label: 'Your carrier writes from', value: carrierHeader, result: 'header' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                ],
              },
              {
                type: 'note',
                text: `Everything NovaCell has ever sent you came from ${carrierHeader}, including the `
                  + 'code that arrived two minutes after this message. This thread did not.',
              },
            ],
            links: [
              { id: 's10-link-carrier', label: `Open the messages from ${carrierHeader}`, to: 'carriermsg' },
            ],
          },
        },
      }),

      /**
       * The carrier's own conversation - where the code actually landed, and where the two
       * releases in this scene are made. Walking here decides nothing; the controls do.
       */
      carriermsg: sms({
        title: carrierHeader,
        home: 'thread',
        inertNote: 'Local Messages screen. Nothing here sends or receives a text.',
        pages: {
          thread: {
            title: `Messages from ${carrierHeader}`,
            blocks: [
              {
                type: 'identity', initials: 'VM', name: carrierHeader,
                number: 'Sender ID — replies go to the carrier',
                note: 'Registered carrier sender',
              },
              {
                type: 'items',
                heading: 'Today',
                items: [
                  { label: carrierHeader, meta: '12:53', value: codeText },
                ],
              },
              {
                type: 'items',
                heading: 'Earlier',
                items: [
                  { label: carrierHeader, meta: '01 Sep', value: `Bill for August on ${account} is ready in the app.` },
                  { label: carrierHeader, meta: '12 Aug', value: `Pack renewed on ${account}. No action required.` },
                  { label: carrierHeader, meta: '28 Jul', value: 'Planned maintenance on Sunday night.' },
                ],
              },
              {
                type: 'note',
                text: 'An eSIM transfer moves your number to a new SIM profile. Every code your bank, '
                  + 'your email and this phone send you is delivered to that number.',
              },
            ],
          },
        },
      }),

      /** The phone's own dial confirmation. Tapping the number only raises this dialog. */
      dial: {
        kind: SURFACE.INSTALLER,
        title: 'Phone',
        home: 'confirm',
        closeLabel: 'Close the dialog',
        inertNote: 'Simulated dialer. No call can be placed from this screen.',
        pages: {
          confirm: {
            style: 'dialog',
            title: `Call ${callback}?`,
            text: 'The number was tapped in a text message. The phone app will dial it.',
            rows: [
              { label: 'Number', value: callback },
              { label: 'Saved as', value: 'Not in your contacts' },
              { label: 'Carrier’s own number', value: `${billLine}, printed on your bill` },
            ],
          },
        },
      },

      /** The desk the number reaches. What it wants is already in the carrier's thread. */
      desk: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'SIM upgrade desk',
        number: callback,
        script: [
          { at: 0, speaker: 'them', text: 'Upgrade desk. You are calling about the eSIM on the account ending 4188?' },
          { at: 6, speaker: 'them', text: 'I have the request open here. Read me the six digits we sent two minutes ago.' },
          { at: 12, speaker: 'them', text: 'If the message says not to share it, that is the standard wording. I am the one who sent it.' },
          { at: 19, speaker: 'them', text: 'Stay on the line. If the code lapses your number goes off tonight.' },
        ],
      },

      /** The learner's own carrier app - whether anything was ever requested. */
      carrier: {
        kind: SURFACE.APP,
        appName: 'NovaCell',
        appTagline: `Number ${account}`,
        hero: {
          label: 'SIM status',
          value: 'Active — no change requested',
          caption: 'No eSIM transfer, no replacement SIM and no upgrade is pending on this number.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's10-app-sim',
            heading: 'This number',
            rows: [
              { label: 'SIM', value: 'Physical, active since March 2024' },
              { label: 'Requests open', value: 'None' },
              { label: 'eSIM profiles', value: '0' },
            ],
            note: 'A transfer you asked for would be listed here before any code was sent.',
          },
          {
            id: 's10-app-how',
            heading: 'How we contact you',
            rows: [
              { label: 'Texts', value: `From ${carrierHeader} only` },
              { label: 'Calls', value: `The number printed on your bill — ${billLine}` },
              { label: 'We never ask you to', value: 'Read a code out, or approve a transfer you did not start' },
            ],
          },
        ],
        tabs: [
          { label: 'Number', icon: 'home' },
          { label: 'Bills', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The carrier, on the number printed on the bill. */
      storecall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'NovaCell (number on your bill)',
        number: billLine,
        script: [
          { at: 0, speaker: 'them', text: 'NovaCell account security.' },
          { at: 3, speaker: 'them', text: `There is no eSIM request on ${account}, and no upgrade is pending.` },
          { at: 9, speaker: 'them', text: 'Somebody has started a transfer and needs your code to finish it. Do not give it to anyone.' },
          { at: 16, speaker: 'them', text: 'I have put a port lock on the number. Report that message and block it.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's10-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's10-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask about the upgrade' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's10-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and who your carrier is',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's10-c04', slot: SLOT.MENU, label: `Read the messages from ${carrierHeader}`,
            hint: 'The conversation the code arrived in', targetId: threadAsset, opens: 'carriermsg',
          }),
          action({ id: 's10-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's10-c06', slot: SLOT.SURFACE, on: 'dial', page: 'confirm',
            label: 'Call', targetId: callAsset, opens: 'desk',
          }),
          action({
            id: 's10-c07', slot: SLOT.SURFACE, on: 'carriermsg', page: 'thread',
            label: 'Send the six digits to the number that texted you', closes: true,
          }),
          action({
            id: 's10-c08', slot: SLOT.SURFACE, on: 'carriermsg', page: 'thread',
            label: 'Reply YES to approve the eSIM transfer', closes: true,
          }),
          action({
            id: 's10-c09', slot: SLOT.MENU, label: 'Leave it and open your carrier app instead',
            opens: 'carrier',
          }),
          action({
            id: 's10-c10', slot: SLOT.COMPOSER, label: 'Reply asking what this upgrade is',
            echo: 'What upgrade is this? I have not asked for an eSIM.',
          }),
          navigate({
            id: 's10-nav-dial', slot: SLOT.INLINE, anchor: 's10-number',
            label: `Call ${callback}`, opens: 'dial',
          }),
          navigate({
            id: 's10-nav-carrier', slot: SLOT.MENU,
            label: `Open the messages from ${carrierHeader}`, opens: 'carriermsg',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's10-c11', slot: SLOT.MENU, label: 'Open your carrier app and check for a SIM change',
            hint: 'Open requests and eSIM profiles', opens: 'carrier',
          }),
          action({
            id: 's10-c12', slot: SLOT.MENU, label: 'Call the carrier on the number printed on your bill',
            opens: 'storecall',
          }),
          action({
            id: 's10-c13', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's10-c14', slot: SLOT.MENU, label: 'Reply to the number and ask them to confirm' }),
          action({ id: 's10-c15', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's10-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's10-c17', slot: SLOT.INLINE, label: 'Report it as junk and keep the number locked' }),
          action({ id: 's10-c18', slot: SLOT.INLINE, label: 'Finish the upgrade before the code lapses' }),
          action({ id: 's10-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's10-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's10-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's10-nav-carrierapp', slot: SLOT.MENU, label: 'Open your carrier app', opens: 'carrier', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's10-dir-carrier',
        name: 'NovaCell — account security',
        identifier: billLine,
        provenance: 'printed on your bill',
        role: 'Confirms whether a SIM or eSIM change has been requested, and can lock the number against a transfer.',
      },
    ],
  }
}

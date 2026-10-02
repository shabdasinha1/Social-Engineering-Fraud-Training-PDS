import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import {
  assetId, day, directory, e2e, headline, headlineTime, media, sender, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W10 - Survey Device-Link QR.
 *
 * The one scenario in this batch that is not a variation on anything: the QR is not a link
 * to a phishing page, it is the account's own linking credential, and scanning it hands
 * somebody a live copy of every conversation on the phone. Nothing is stolen at the moment
 * of the scan and nothing looks different afterwards, which is exactly why it works.
 *
 * ATT&CK added a technique for this in May 2025 - **T1676 Linked Devices** (Mobile;
 * Collection and Persistence), whose description names WhatsApp, names QR codes and names
 * the outcome: "register victim accounts on attacker-controlled devices, enabling account
 * persistence, information collection, and unauthorized message sending". The delivery is
 * T1660 Phishing (Mobile). The real-world instance is Star Blizzard / COLDRIVER, reported
 * by Microsoft Threat Intelligence in January 2025, which sent targets to a page whose QR
 * "is actually used by WhatsApp to connect an account to a linked device"; ATT&CK now
 * carries T1676 on that group. This scenario moves the delivery inside WhatsApp itself,
 * where a support account is more plausible than an email.
 *
 * **The distinct interaction is the settings screen.** The learner is told to go to
 * Settings > Linked Devices, and they should - just not for the reason they were given.
 * Opening it independently shows a device already waiting to be approved, from a browser in
 * a city the learner is not in, and that pending row is the whole scenario in one line. So
 * the same screen carries the unsafe control and the evidence that condemns it, reached two
 * different ways: the message's route pushes it with the pending link ready to confirm, and
 * the learner's own route through the phone's settings shows what is actually being asked.
 *
 * The tell is not spelling. It is that a survey has no reason to touch account linking,
 * and that WhatsApp support does not arrive as a chat from an ordinary number.
 */
export function buildW10(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  return {
    scenarioId: 'W10',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'Last seen today at 13:52',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner:
        'This chat is with a number that is not in your contacts.',
    },

    list: {
      title: 'WhatsApp',
      archived: 3,
      rows: [
        {
          id: 'w10-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 2,
        },
        {
          id: 'w10-bg-1',
          title: 'Ma',
          preview: 'did you eat',
          time: '12:12',
          inert: true,
        },
        {
          id: 'w10-bg-2',
          title: 'Building 4B',
          group: true,
          preview: 'Watchman: Lift in B wing is working again',
          time: '10:20',
          muted: true,
          inert: true,
        },
        {
          id: 'w10-bg-3',
          title: 'Sep Rathi',
          preview: 'You: will collect it tomorrow',
          time: 'Yesterday',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w10-e2e'),
      // IMMERSIVE-AUDIT-001: the bank's narrator line ("A fake support account…") states the
      // verdict, so it is not printed; the thread and the Linked Devices screen show it.

      day('w10-day', 'TODAY'),
      them('w10-b1',
        'Hello. This is the WhatsApp service quality desk. You have been selected for a short '
        + 'feedback survey about call quality in your area.', '13:44'),
      them('w10-b2', 'It takes two minutes and there is a INR 500 recharge for completing it.',
        '13:45'),
      them('w10-b3', headline(scenario), headlineTime(scenario) ?? '13:50'),

      media('w10-qr', {
        art: 'qr',
        label: 'Survey verification code',
        caption: 'Open WhatsApp > Settings > Linked Devices > Link a device, then scan this',
        time: headlineTime(scenario) ?? '13:50',
      }),

      them('w10-b4',
        'This only confirms you are a real user. It does not give us access to anything.',
        '13:51', { since: 'branch' }),
      them('w10-b5', 'The survey slot expires at 14:30.', '13:58', { since: 'branch' }),
      them('w10-b6',
        'Are you having trouble? I can stay on chat and guide you through the steps.', '14:06',
        { since: 'verify' }),

      {
        kind: 'system', id: 'w10-after-link', tone: 'alert',
        text: 'A device was linked to this account. It can read this conversation and every '
          + 'other one on this phone until it is removed.',
        since: 'verify', afterConsequence: 'simulated_device_link',
      },
      {
        kind: 'message', id: 'w10-after-link-msg', from: 'them',
        text: 'Verified, thank you. Please do not remove the linked device for 24 hours or '
          + 'the survey will not register.',
        time: '13:56', since: 'verify', afterConsequence: 'simulated_device_link',
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
                  { label: 'Status', value: 'No status' },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Official account', value: 'No' },
                  { label: 'Business account', value: 'No' },
                  { label: 'On WhatsApp since', value: 'This month' },
                  { label: 'First message', value: `Today at ${who.first_seen ?? '13:44'}` },
                ],
                note: 'An official WhatsApp account carries a verified badge and cannot be an '
                  + 'ordinary mobile number. WhatsApp does not run surveys by chat message.',
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
        ],
      },

      /** The code, decoded on this device. It is not a web address at all. */
      'qr-viewer': {
        kind: SURFACE.VIEWER,
        title: 'Scan result',
        subtitle: 'Decoded on this device',
        art: 'qr',
        label: 'Survey verification code',
        heading: 'This is an account linking code',
        rowsHeading: 'Decoded contents',
        rows: [
          { label: 'Type', value: 'WhatsApp device-linking credential' },
          { label: 'Not a', value: 'Web address, voucher or survey form' },
          { label: 'What it does', value: 'Signs this account in on another device' },
          { label: 'Generated by', value: 'A browser session, 11 minutes ago' },
          { label: 'Grants', value: 'Read and send on every chat in this account' },
        ],
        note: 'A linking code is generated by the device that wants access, not by the '
          + 'account that owns it. There is no version of a survey that needs one.',
        inertNote: 'Decoded locally. No camera was used and no device was linked.',
      },

      /**
       * The phone's own Linked Devices screen.
       *
       * The pending row is what the message never mentions: a browser session in a city
       * the learner is not in, waiting on a confirmation. Reaching this screen is
       * navigation from either direction; the Confirm control on it is the decision.
       */
      'linked-devices': {
        kind: SURFACE.SETTINGS,
        title: 'Linked Devices',
        name: 'Linked Devices',
        identifier: 'WhatsApp Settings',
        statusLine: 'Devices linked to this account can read and send your messages.',
        tabs: [
          {
            id: 'devices',
            label: 'Devices',
            sections: [
              {
                id: 'pending', heading: 'Waiting for confirmation',
                rows: [
                  { label: 'Device', value: 'Chrome on Windows' },
                  { label: 'Location', value: 'Approximately 1,900 km away' },
                  { label: 'Requested', value: 'Today at 13:39, 11 minutes before the message' },
                  { label: 'Would be able to', value: 'Read and send in every chat' },
                  { label: 'Session lasts', value: 'Until removed from this screen' },
                ],
                note: 'This request was created before you were asked to scan anything.',
              },
              {
                id: 'existing', heading: 'Your linked devices',
                items: [
                  { label: 'This phone', value: 'Primary device' },
                ],
                empty: null,
                note: 'No other device is linked to this account.',
              },
            ],
          },
          {
            id: 'what',
            label: 'What linking does',
            sections: [
              {
                id: 'what-rows', heading: 'A linked device can',
                rows: [
                  { label: 'Read', value: 'Every conversation, including older messages' },
                  { label: 'Send', value: 'Messages as you, to anyone in your contacts' },
                  { label: 'Stay connected', value: 'Even when this phone is offline' },
                  { label: 'Be noticed', value: 'Only by looking at this screen' },
                ],
                note: 'Linking is how WhatsApp Web works. It is the same mechanism whoever '
                  + 'sent the code is asking you to use.',
              },
            ],
          },
        ],
      },

      'call-desk': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name ?? 'Unit Falcon Support Desk',
        number: desk.identifier ?? '+91 00000 59214',
        script: [
          { at: 0, speaker: 'them', text: 'Support desk.' },
          { at: 4, speaker: 'them', text: 'No. WhatsApp does not contact people for surveys, and it does not use linked devices for verification.' },
          { at: 11, speaker: 'them', text: 'If you have not scanned it, do not. Go to Settings, Linked Devices, and remove anything you do not recognise.' },
          { at: 18, speaker: 'them', text: 'Then report the number. We have seen this twice this week.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w10-c01', slot: SLOT.INLINE,
            label: `Open the chat from ${who.display_name}`,
          }),
          action({
            id: 'w10-c02', slot: SLOT.INLINE,
            label: 'Reply from the preview without opening the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w10-c03', slot: SLOT.INLINE, anchor: 'w10-qr',
            label: 'Decode without scanning', opens: 'qr-viewer',
          }),
          action({
            id: 'w10-c04', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'Whether this is an official account',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w10-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w10-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'w10-c07', slot: SLOT.COMPOSER,
            label: 'A linking code is account access. I am not scanning it.',
            echo: 'A linking code is account access. I am not scanning it.',
          }),
          /**
           * The confirmation, on the Linked Devices screen where it really lives. Getting
           * to that screen is navigation from either route; this is the decision.
           */
          action({
            id: 'w10-c08', slot: SLOT.SURFACE,
            on: 'linked-devices', label: 'Confirm the waiting device',
          }),
          action({
            id: 'w10-c09', slot: SLOT.INLINE, anchor: 'w10-qr',
            label: 'Scan the code', opens: 'linked-devices',
          }),
          action({
            id: 'w10-c10', slot: SLOT.COMPOSER,
            label: 'Which steps do I follow?',
            echo: 'Which steps do I follow?',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w10-c11',
            slot: SLOT.MENU, label: 'Open Settings > Linked Devices yourself',
            hint: 'Through the app, not through the message', opens: 'linked-devices',
          }),
          action({
            id: 'w10-c12',
            slot: SLOT.MENU,
            label: 'Check the support desk in the trusted directory',
            targetId: directoryAsset,
          }),
          action({
            id: 'w10-c13',
            slot: SLOT.MENU,
            label: 'Ask the survey desk whether this is safe',
          }),
          action({
            id: 'w10-c14', slot: SLOT.MENU,
            label: 'Report the number',
          }),
          action({
            id: 'w10-c15', slot: SLOT.MENU,
            label: 'Block the number',
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w10-c16', slot: SLOT.INLINE,
            label: 'Keep the chat, nothing further',
          }),
          action({
            id: 'w10-c17', slot: SLOT.INLINE,
            label: 'Cancel the link, report the number and close',
          }),
          action({
            id: 'w10-c18', slot: SLOT.MENU,
            label: 'Cancel the link, block the number and close',
          }),
          action({
            id: 'w10-c19', slot: SLOT.MENU,
            label: 'Complete the survey',
          }),
          action({
            id: 'w10-c20', slot: SLOT.MENU,
            label: 'Leave it and move on',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w10-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w10-nav-qr', slot: SLOT.MENU, label: 'Show the decoded code again',
        opens: 'qr-viewer', after: 'inspect',
      }),
      /**
       * The learner's own route into the settings screen, available from the branch stage
       * onwards. It is the same screen the message is trying to walk them into, reached
       * without being told to - which is the difference the scenario is teaching.
       */
      navigate({
        id: 'w10-nav-devices', slot: SLOT.MENU, label: 'Settings > Linked Devices',
        opens: 'linked-devices', after: 'branch',
      }),
    ],

    supportDesk: desk,
  }
}

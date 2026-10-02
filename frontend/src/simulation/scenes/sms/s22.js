import {
  FIELD_KIND, SLOT, SURFACE, action, field, navigate,
} from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  asset, assetId, day, directory, link, message, messageText, receivedAt, sender, sms,
} from './shared.js'

/**
 * S22 - Synthetic Voice-Mail Link (IMMERSIVE-014) - your voicemail is in the Phone app.
 *
 * A text from an ordinary mobile number calls itself "Secure Voice" and says a senior in the unit
 * has left an urgent voice message that expires at 18:00. There is a short link. Behind it, a
 * "voice portal" wants the learner's unit mail address and password to play the message - and, for
 * anyone who hesitates, offers a ten-second preview "to confirm it is for you". The preview is a
 * recorded voice that sounds like the senior and asks to be called back on a different number,
 * "not the office".
 *
 * W15 and E22 were a senior's voice delivered inside a messenger and attached to an email; both were
 * about acting on the voice. S22 is about the channel the voice pretends to arrive through, and
 * three things only a phone shows carry it:
 *
 * - **The phone's own Voicemail**, one tap away in the Phone app, where a real voice message for
 *   this number would be - and where there is none.
 * - **A "service" name on a ten-digit mobile.** The words "Secure Voice" are the first words of the
 *   text, not a sender the phone knows.
 * - **The link details screen**, which expands the short address to a site that is not the unit's
 *   mail.
 *
 * Two releases are priced where they happen: signing in on the portal (the credential release) and
 * calling the number the recorded voice gives (the risky act on the instruction). Closing the page
 * is the safe branch, on the page; leaving the link unopened for Voicemail is the other.
 *
 * Fictional throughout: Unit Falcon, its duty office, "Dev", Secure Voice and every number and host
 * describe nothing real. Nothing is played, signed in to or dialled; the recording is a transcript.
 */
export function buildS22(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const page = asset(scenario, ASSET_KIND.BROWSER)
  const target = page?.display_target ?? 'https://s22.training.example/verify'
  const host = page?.content?.host ?? 's22.training.example'
  const from = senderInfo.identifier ?? '+91 00000 38373'
  const label = senderInfo.display_name ?? 'Secure Voice'
  const at = receivedAt(scenario) ?? '15:16'
  const shortLink = 'https://sv-msg.training.example/l/7Q2'
  const callback = '00000 46120'
  const dutyOffice = '+91 00000 31275'

  return {
    scenarioId: 'S22',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'unknown', label: 'Not in contacts', heading: 'From numbers you have not saved' },
        {
          id: 'contacts', label: 'Contacts', heading: 'From your contacts',
          rows: [
            {
              id: 's22-ct-1', from: 'Duty office (Unit Falcon)', time: '09:40', inert: true,
              preview: 'Reminder: fire drill at 16:30 today. Assemble at the car park.',
            },
          ],
        },
        {
          id: 'carrier', label: 'Carrier', heading: 'Carrier',
          rows: [
            {
              id: 's22-ca-1', from: 'VM-TRNNET', time: '03 Sep', inert: true,
              preview: 'Voicemail is on for your number. New messages appear in the Phone app under Voicemail.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        { id: 's22-row', from, time: at, unread: true, preview: `${label}: ${messageText(scenario)}` },
        {
          id: 's22-bg-1', from: 'Amma', time: '12:48', inert: true,
          preview: 'Did you eat? Call when you are free.',
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'This number is not in your contacts. This is the first text from it.',
    },

    beats: [
      day('s22-day', 'Today'),
      message('s22-msg', { text: `${label}: ${messageText(scenario)}`, time: at, via: 'SIM 1' }),
      link('s22-link', { shown: shortLink, caption: `${label} — play message` }),
      message('s22-m2', {
        text: 'Length 0:41. Caller: Dev (office line withheld). Sign in with your Unit Falcon mail to listen. '
          + 'The link stops working at 18:00.',
        time: at, via: 'SIM 1',
      }),
    ],

    surfaces: {
      /** Conversation details - a service name at the front of a text from a mobile. */
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
                  { label: 'Messages', value: '2, with one short link' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Calls itself', value: `${label} — the first words of the text`, result: 'in text' },
                  { label: 'Your voicemail arrives in', value: 'The Phone app, under Voicemail', result: 'phone' },
                  { label: 'Asks for', value: 'Your unit mail address and password', result: 'sign-in' },
                ],
              },
              {
                type: 'note',
                text: 'A voice message left for your number is kept by your carrier and played in the Phone '
                  + 'app. It does not need a sign-in page.',
              },
            ],
          },
        },
      }),

      /** Link details - where the short address really goes. */
      linkinfo: sms({
        title: 'Link details',
        home: 'link',
        pages: {
          link: {
            title: 'Link details',
            blocks: [
              {
                type: 'link',
                heading: 'Address in the message',
                shown: shortLink,
                target,
                rows: [
                  { label: 'Site', value: host },
                  { label: 'Unit Falcon mail', value: 'mail.falcon.training.example' },
                  { label: 'The page asks for', value: 'Mail address and password' },
                ],
              },
              {
                type: 'note',
                text: 'Opening the address shows the page in the browser. Nothing typed on it leaves the phone '
                  + 'until a button on it is pressed.',
              },
            ],
          },
        },
      }),

      /** The "voice portal" behind the link. */
      portal: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'login',
        pages: {
          login: {
            title: 'Secure Voice — sign in to listen',
            host,
            url: target,
            blocks: [
              { type: 'brand', monogram: 'SV', name: 'Secure Voice', tagline: 'Encrypted voice messages' },
              { type: 'heading', text: '1 new voice message' },
              {
                type: 'summary',
                rows: [
                  { label: 'From', value: 'Dev', strong: true },
                  { label: 'Length', value: '0:41' },
                  { label: 'Available until', value: 'Today, 18:00' },
                ],
              },
              {
                type: 'form',
                title: 'Sign in with your unit mail',
                fields: [
                  field({ name: 'mail', label: 'Unit mail address', length: 6, max: 60 }),
                  field({ name: 'password', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 40 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's22-link-preview', label: 'Play a 10-second preview to check it is for you', to: 'clip' },
            ],
          },
        },
      },

      /** The preview the portal plays without a sign-in. A transcript; nothing is played. */
      clip: {
        kind: SURFACE.VIEWER,
        title: 'Secure Voice',
        subtitle: 'Preview · 0:10',
        art: 'voice',
        label: 'Voice message preview',
        backLabel: 'Back to the page',
        inertNote: 'Local transcript. No audio is played and nothing is dialled from here.',
        heading: 'Preview of the message from Dev',
        rowsHeading: 'Transcript',
        rows: [
          { label: '0:00', value: 'It’s Dev. I’m between meetings and the office line is down.' },
          { label: '0:04', value: `Call me back on ${callback} — not the office.` },
          { label: '0:08', value: 'Before six, please. Keep it between us for now.' },
        ],
        note: `The number in the recording, ${callback}, is not the duty office’s number in your contacts.`,
      },

      /** The Phone app's own voicemail. */
      voicemail: {
        kind: SURFACE.APP,
        appName: 'Phone',
        appTagline: 'Voicemail · SIM 1',
        hero: {
          label: 'Voicemail',
          value: 'No new messages',
          caption: 'Messages left for your number are kept by TrainNet and played here. The last one was '
            + 'on 11 Sep, from Amma.',
          chips: ['Your number'],
        },
        sections: [
          {
            id: 's22-vm-how',
            heading: 'How voicemail works on this phone',
            rows: [
              { label: 'New messages', value: 'Appear here, with the caller’s number' },
              { label: 'To listen', value: 'Tap the message — no sign-in, no link' },
              { label: 'Texts about voicemail', value: 'Only from VM-TRNNET, your carrier' },
            ],
          },
        ],
        tabs: [
          { label: 'Voicemail', icon: 'home' },
          { label: 'Recents', icon: 'history' },
          { label: 'Contacts', icon: 'profile' },
        ],
      },

      /** The approved unit mail app. */
      mailapp: {
        kind: SURFACE.APP,
        appName: 'Unit Falcon Mail',
        appTagline: 'Approved messaging · signed in',
        hero: {
          label: 'Inbox',
          value: 'Nothing from Dev today',
          caption: 'The last message from Dev’s office was the leave calendar on 19 Sep. No voice message, '
            + 'no request to call.',
          chips: ['Opened from your home screen'],
        },
        sections: [
          {
            id: 's22-mail-how',
            heading: 'Voice messages at Unit Falcon',
            rows: [
              { label: 'Arrive as', value: 'An attachment in this app, or a voicemail in the Phone app' },
              { label: 'Your mail password is typed', value: 'Only in this app' },
              { label: 'Short links in texts', value: 'Never used for unit messages' },
            ],
          },
        ],
        tabs: [
          { label: 'Inbox', icon: 'home' },
          { label: 'Sent', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The duty office, on the number saved in contacts and in the directory. */
      office: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Duty office (Unit Falcon)',
        number: dutyOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Duty office, Unit Falcon.' },
          { at: 3, speaker: 'them', text: 'Dev has been here all afternoon and has not left anyone a voice message.' },
          { at: 9, speaker: 'them', text: 'We do not use a voice service with a sign-in page, and the office line is working.' },
          { at: 15, speaker: 'them', text: 'Do not sign in or call that number. Report the text and block it.' },
        ],
      },

      /** Where the number in the recording goes. */
      callback: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: callback,
        number: 'Number from the recording',
        // Found by hand-play: this call is pushed from the preview, so Back returns there.
        backLabel: 'Back to the preview',
        script: [
          { at: 0, speaker: 'them', text: 'Thanks for calling back. Dev is in with someone.' },
          { at: 5, speaker: 'them', text: 'He needs the code that is about to come to your phone to get into his mail.' },
          { at: 11, speaker: 'them', text: 'Read it to me when it arrives. He said you would understand.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's22-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's22-c02', slot: SLOT.INLINE, label: 'Open the link from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's22-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and where your voicemail really arrives',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's22-c04', slot: SLOT.INLINE, anchor: 's22-link',
            label: 'See where the link goes', hint: 'The address behind the short link',
            targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's22-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's22-c06', slot: SLOT.SURFACE, on: 'portal', page: 'login',
            label: 'Sign in and listen', targetId: browserAsset, closes: true,
          }),
          action({
            id: 's22-c07', slot: SLOT.SURFACE, on: 'portal', page: 'login',
            label: 'Close this page', closes: true,
          }),
          action({
            id: 's22-c08', slot: SLOT.SURFACE, on: 'clip',
            label: `Call ${callback} as the message asks`, targetId: callAsset, opens: 'callback',
          }),
          action({
            id: 's22-c09', slot: SLOT.MENU, label: 'Leave the link unopened and check Voicemail in the Phone app',
            opens: 'voicemail',
          }),
          navigate({
            id: 's22-nav-open', slot: SLOT.INLINE, anchor: 's22-link', label: 'Open the link', opens: 'portal',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's22-c10', slot: SLOT.MENU, label: 'Call the duty office on the number in your contacts',
            opens: 'office',
          }),
          action({
            id: 's22-c11', slot: SLOT.MENU, label: 'Open Unit Falcon Mail and look for a message from Dev',
            hint: 'The approved messaging app', opens: 'mailapp',
          }),
          action({
            id: 's22-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's22-c13', slot: SLOT.MENU, label: 'Call back the number that sent the text' }),
          action({ id: 's22-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's22-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's22-c16', slot: SLOT.INLINE, label: 'Report the text as junk and tell the duty office' }),
          action({ id: 's22-c17', slot: SLOT.INLINE, label: 'Sign in before 18:00 and listen to it' }),
          action({ id: 's22-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's22-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's22-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's22-nav-voicemail', slot: SLOT.MENU, label: 'Open Voicemail in the Phone app', opens: 'voicemail', after: 'inspect' }),
    ],

    directoryExtras: [
      {
        id: 's22-dir-duty',
        name: 'Unit Falcon — duty office',
        identifier: dutyOffice,
        provenance: 'unit approved directory',
        role: 'Can confirm whether anyone in the unit has tried to reach you.',
      },
    ],
  }
}

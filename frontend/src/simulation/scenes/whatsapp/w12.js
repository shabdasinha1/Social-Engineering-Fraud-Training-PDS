import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import {
  assetId, callEvent, day, directory, e2e, fileCard, headline, headlineTime,
  sender, them,
} from './shared.js'
import { ASSET_KIND } from '../../../constants/simulation.js'

/**
 * W12 - Digital Arrest Escalation.
 *
 * The first scenario in the bank where the pressure is LIVE. Everything before it was a
 * message the learner could put down; this one is a person on a video call, in something
 * that looks like a uniform, with a countdown in the frame, telling them not to hang up and
 * not to tell anyone. That is the documented four-step pattern Indian authorities describe
 * - impersonation, intimidation, "digital confinement" on camera, then a payment demand -
 * and the I4C advisory of 6 March 2025 is blunt about the premise: there is no concept of a
 * digital arrest under any Indian law.
 *
 * ATT&CK: T1684.001 Impersonation for the uniform and the case notice, carried by the
 * parent T1684's own description of "scare tactics (i.e., threaten repercussions for
 * non-compliance)"; T1657 Financial Theft, whose description names extortion, for the
 * "security deposit". The research record states why each applies and what was not copied.
 *
 * **The distinct interaction is the call you have to leave.** In W09 the learner had to
 * place a call the message forbade; here they have to END one the caller forbids. So "End
 * call" on this screen is the scored decision rather than the phone's own button, the
 * deposit sheet is reached from inside the call, and the call can be answered straight from
 * the chat list - which is the premature route, and exactly how people end up on one.
 *
 * Two numbers, deliberately. The chat is the bank's sender; the video call comes from a
 * "secure line" with a country code that is not India's - the unknown country code the
 * client's stage 3 names. It uses the UK's reserved drama range (+44 7700 900xxx), which
 * exists so fiction never rings a real subscriber. Recorded as a content note: the bank's
 * placeholder call asset names the chat number, and the client's stage text wins.
 */
export function buildW12(scenario) {
  const who = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const callAsset = assetId(scenario, ASSET_KIND.CALL)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)

  const secureLine = '+44 7700 900417'
  const officer = 'Insp. R. Rathore'
  const caseFile = 'Case_IDX-2291_Notice.pdf'
  const deposit = 'INR 1,85,000'

  return {
    scenarioId: 'W12',
    platform: 'whatsapp',

    conversation: {
      kind: 'direct',
      title: who.display_name,
      subtitle: who.identifier,
      saved: false,
      presence: 'online',
      avatarSeed: who.avatar_initials,
      unknownSenderBanner: true,
    },

    list: {
      title: 'WhatsApp',
      archived: 4,
      rows: [
        {
          id: 'w12-row',
          title: who.display_name,
          subtitle: who.identifier,
          preview: headline(scenario),
          time: headlineTime(scenario),
          unread: 4,
        },
        {
          /** The secure line, already calling before the chat has been opened. */
          id: 'w12-bg-secure',
          title: secureLine,
          preview: 'Missed video call',
          time: '13:59',
          unread: 2,
          inert: true,
        },
        {
          id: 'w12-bg-1',
          title: 'Office Team',
          group: true,
          preview: 'Neha: minutes from today are on the drive',
          time: '12:31',
          muted: true,
          inert: true,
        },
        {
          id: 'w12-bg-2',
          title: 'Ma',
          preview: 'You: will call in the evening',
          time: '11:05',
          outgoing: true,
          inert: true,
        },
      ],
    },

    beats: [
      e2e('w12-e2e'),

      day('w12-day', 'TODAY'),
      them('w12-b1', 'Good afternoon. This is the Investigation Desk, parcel interdiction cell.',
        '13:47'),
      them('w12-b2',
        'A parcel booked against your ID number was stopped at the cargo terminal this '
        + 'morning. It contains 5 passports, 3 bank cards and 140 g of a narcotic substance.',
        '13:48'),
      fileCard('w12-file', {
        fileName: caseFile, fileKind: 'PDF', pages: '2 pages', size: '186 KB',
        caption: 'Case notice', time: '13:52',
      }),
      them('w12-b3', headline(scenario), headlineTime(scenario) ?? '13:58'),
      them('w12-b4',
        `The investigating officer will video call you from the secure line ${secureLine}. `
        + 'Do not disconnect, and do not discuss this case with anyone, including family. It '
        + 'is a confidential matter.', '13:58'),

      /** It rings for exactly as long as the branch stage lasts. */
      callEvent('w12-ringing', {
        video: true, state: 'ringing', caller: officer, number: secureLine, time: '14:03',
        since: 'branch', until: 'verify',
      }),
      them('w12-b5',
        'Answer now. If you disconnect it will be recorded as non-cooperation and the warrant '
        + 'will be executed.', '14:03', { since: 'branch' }),

      them('w12-b6', 'Case IDX-2291 remains open. Do not share this chat with anyone.', '14:21',
        { since: 'verify' }),

      {
        kind: 'system', id: 'w12-after-pay', tone: 'alert',
        text: `${deposit} left your account for a private savings account. Money sent this way `
          + 'cannot be recalled.',
        since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'message', id: 'w12-after-pay-msg', from: 'them',
        text: 'Deposit noted. A second verification deposit may be required. Stay available and '
          + 'do not leave your room.',
        time: '14:26', since: 'verify', afterConsequence: 'simulated_payment',
      },
      {
        kind: 'system', id: 'w12-after-id', tone: 'alert',
        text: 'Your ID card was shown on camera, front and back, and the call was recorded.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'message', id: 'w12-after-call', from: 'them',
        text: 'The officer has recorded your cooperation. Remain on standby for the next call.',
        time: '14:31', since: 'verify', afterConsequence: 'simulated_call',
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
                  { label: 'Status', value: `Official verification line: ${secureLine}. Cases handled on video only.` },
                  { label: 'Phone', value: who.identifier },
                  { label: 'Official account', value: 'No' },
                  { label: 'Business account', value: 'No' },
                  { label: 'On WhatsApp since', value: 'Last week' },
                  { label: 'First message', value: 'Today at 13:47' },
                ],
                note: 'A name and a status line are typed in by whoever owns the number.',
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
            count: 1,
            sections: [
              {
                id: 'media-list', heading: 'Media, links and docs',
                items: [{ label: caseFile, value: 'Today, 13:52' }],
              },
            ],
          },
        ],
      },

      /** The notice, opened. Official-looking; nothing on it can be checked. */
      'case-file': {
        kind: SURFACE.VIEWER,
        title: caseFile,
        subtitle: 'PDF - 2 pages, 186 KB',
        art: 'document',
        label: 'Case notice with a printed seal',
        heading: 'NOTICE OF DIGITAL CUSTODY',
        text: 'You are placed under digital custody pending video verification. Leaving the '
          + 'video call, informing any person or visiting a police station will be treated as '
          + 'obstruction.',
        rowsHeading: 'Printed on the notice',
        rows: [
          { label: 'Case number', value: 'IDX-2291' },
          { label: 'Issued by', value: 'Investigation Desk, Parcel Interdiction Cell' },
          { label: 'Court', value: 'None named' },
          { label: 'Officer', value: officer },
          { label: 'Contact', value: `${secureLine} (WhatsApp video)` },
          { label: 'Security deposit', value: `${deposit}, "refundable after verification"` },
          { label: 'Signature', value: 'Typed name only' },
        ],
        note: 'The only contact on the notice is a WhatsApp video number. No office address, '
          + 'landline or court appears anywhere on it.',
        inertNote: 'Local document preview. Nothing is executed, extracted or downloaded.',
      },

      /**
       * The call. Answering is navigation - picking up a phone is not the decision. What
       * happens on it is: stay, show the ID, pay, or end it.
       */
      'video-call': {
        kind: SURFACE.CALL,
        title: 'WhatsApp video call',
        caller: officer,
        number: secureLine,
        video: true,
        endCallScored: true,
        backLabel: 'Leave the call screen',
        remote: {
          name: officer,
          label: 'A man in a police-style uniform at a desk, with a noticeboard behind him',
        },
        overlay: 'Video verification in progress - do not disconnect',
        countdown: { label: 'Warrant in', from: 14 * 60 + 59 },
        script: [
          { at: 0, speaker: 'them', text: `Good afternoon. ${officer}, parcel interdiction cell. Keep your camera on and your face visible.` },
          { at: 5, speaker: 'them', text: 'A parcel in your name had passports and narcotics in it. As of now you are under digital arrest.' },
          { at: 11, speaker: 'them', text: 'Do not disconnect. Do not tell your family or anyone else. Whoever you tell will also be made an accused.' },
          { at: 18, speaker: 'them', text: `To keep you out of custody, a refundable security deposit of ${deposit} must be verified before the countdown ends.` },
          { at: 25, speaker: 'them', text: 'Hold your ID card up to the camera now, front and back, so I can match it with the case.' },
        ],
        links: [
          { id: 'w12-link-deposit', label: 'Open the deposit request he has sent', to: 'deposit-sheet' },
        ],
      },

      'deposit-sheet': {
        kind: SURFACE.PAYSHEET,
        title: 'Confirm payment',
        app: 'UPI',
        amount: `${deposit}.00`,
        subtitle: 'Security deposit - case IDX-2291',
        rows: [
          { label: 'Paying', value: 'SAFE CUSTODY VERIFICATION A/C' },
          { label: 'Account holder', value: 'M. S. Enterprises' },
          { label: 'Account type', value: 'Private savings account' },
          { label: 'Requested by', value: `${officer}, on a video call` },
          { label: 'Reversible', value: 'No' },
        ],
        form: {
          heading: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'Money sent by UPI to another person’s account cannot be recalled by the sender.',
      },

      /** The unit's security route, from the approved directory. */
      'call-desk': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: desk.name ?? 'Unit Falcon Support Desk',
        number: desk.identifier ?? '+91 00000 68795',
        script: [
          { at: 0, speaker: 'them', text: 'Support desk.' },
          { at: 3, speaker: 'you', text: 'I have had a video call saying I am under digital arrest over a parcel.' },
          { at: 8, speaker: 'them', text: 'There is no such thing as a digital arrest. No police or agency arrests anyone over a video call, or settles a case by taking a deposit.' },
          { at: 16, speaker: 'them', text: 'Do not pay and do not show any ID. Keep the chat and the notice, note the number that called you, and report it. We will log it with the cybercrime reporting line.' },
        ],
      },

      /** The line printed on the notice. Calling it confirms nothing. */
      'call-secure': {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${officer} (from the notice)`,
        number: secureLine,
        script: [
          { at: 0, speaker: 'them', text: 'Why did you disconnect? This is being noted.' },
          { at: 5, speaker: 'them', text: 'Yes, this is the genuine investigation line. The case is real.' },
          { at: 10, speaker: 'them', text: 'You have until the countdown ends to verify the deposit. Do not waste it.' },
        ],
      },
    },

    directoryExtras: [],

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'w12-c01', slot: SLOT.INLINE,
            label: `Open the chat with ${who.display_name}`,
          }),
          /** Picking up from the chat list, before reading anything. The premature route. */
          action({
            id: 'w12-c02', slot: SLOT.INLINE,
            label: 'Answer the incoming video call', opens: 'video-call',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'w12-c03', slot: SLOT.INLINE,
            anchor: 'header', label: 'Contact info',
            hint: 'The number, its status line and what you share',
            targetId: senderAsset, opens: 'contact',
          }),
          action({
            id: 'w12-c04', slot: SLOT.INLINE,
            anchor: 'w12-file', label: 'Open the notice', opens: 'case-file',
          }),
          action({
            id: 'w12-c05', slot: SLOT.MENU,
            label: 'Read the conversation from the start',
          }),
          action({
            id: 'w12-c06', slot: SLOT.MENU,
            label: 'Skip the checks and act on this message',
          }),
        ],
      },

      branch: {
        affordances: [
          navigate({
            id: 'w12-branch-answer', slot: SLOT.INLINE, anchor: 'w12-ringing',
            label: 'Answer', opens: 'video-call',
          }),
          /** Ending the call is the decision, so it is the scene's control, not the phone's. */
          action({
            id: 'w12-c07', slot: SLOT.SURFACE,
            on: 'video-call', label: 'End call', closes: true,
          }),
          action({
            id: 'w12-c08', slot: SLOT.SURFACE,
            on: 'video-call', label: 'Stay on the call with the camera on, as he says',
            targetId: callAsset,
          }),
          action({
            id: 'w12-c09', slot: SLOT.SURFACE,
            on: 'video-call', label: 'Hold my ID card up to the camera',
            targetId: callAsset,
          }),
          action({
            id: 'w12-c10', slot: SLOT.SURFACE,
            on: 'deposit-sheet', label: `Pay ${deposit}`, targetId: paymentAsset, closes: true,
          }),
          action({
            id: 'w12-c11', slot: SLOT.COMPOSER,
            label: 'I will not join a video call. I will speak to my family and go to the police station in person.',
            echo: 'I will not join a video call. I will speak to my family and go to the police station in person.',
          }),
          action({
            id: 'w12-c12', slot: SLOT.COMPOSER,
            label: 'Please, I have not sent any parcel. I will cooperate, tell me what to do.',
            echo: 'Please, I have not sent any parcel. I will cooperate, tell me what to do.',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'w12-c13',
            slot: SLOT.MENU, label: 'Call the support desk on the approved number',
            hint: 'The number in your approved directory, not one from the notice',
            opens: 'call-desk',
          }),
          action({
            id: 'w12-c14',
            slot: SLOT.MENU,
            label: 'Check the trusted directory', targetId: directoryAsset,
          }),
          action({
            id: 'w12-c15',
            slot: SLOT.MENU,
            label: 'Call the verification line printed on the notice', opens: 'call-secure',
          }),
          action({
            id: 'w12-c16', slot: SLOT.MENU,
            label: 'Report the number',
          }),
          action({
            id: 'w12-c17', slot: SLOT.MENU,
            label: `Block ${who.display_name}`,
          }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'w12-c18', slot: SLOT.INLINE,
            label: 'Keep the chat open and wait for the officer',
          }),
          action({
            id: 'w12-c19', slot: SLOT.INLINE,
            label: 'Report both numbers and keep the notice as evidence',
          }),
          action({
            id: 'w12-c20', slot: SLOT.MENU,
            label: 'Block both numbers and close the chat',
          }),
          action({
            id: 'w12-c21', slot: SLOT.MENU,
            label: 'Pay the deposit to close the case',
          }),
          action({
            id: 'w12-c22', slot: SLOT.MENU,
            label: 'Delete the chat and try to forget it',
          }),
        ],
      },
    },

    ambient: [
      navigate({
        id: 'w12-nav-contact', slot: SLOT.MENU, label: 'Contact info',
        opens: 'contact', after: 'inspect',
      }),
      navigate({
        id: 'w12-nav-file', slot: SLOT.MENU, label: 'Open the notice again',
        opens: 'case-file', after: 'inspect',
      }),
    ],

    supportDesk: desk,
  }
}

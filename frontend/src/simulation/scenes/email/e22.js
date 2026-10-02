import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, mail, notice, sender, subjectLine, table, voice,
} from './shared.js'

/**
 * E22 - Senior Voice Memo Transfer (IMMERSIVE-009) - the recorded order, fictional military.
 *
 * A mail arrives from outside the unit's own mail system carrying a forty-second audio
 * attachment. The voice on it is unmistakably the Commanding Officer's, and it gives a clear,
 * calm instruction: a welfare disbursement for a soldier's family has to leave today, the
 * account is in the message, and nobody is to call because the briefing has started.
 *
 * This is the first Email scene whose payload is a RECORDING. Every other scene has put its
 * pressure in written words a learner can read twice; here the instruction is in a voice the
 * learner recognises, and the thing that makes it work is exactly the thing that makes it
 * checkable - a recording can be replayed but it cannot answer a question. The mail app's own
 * transcription is offered beside the player, so the words are on the page without the
 * simulation ever making a sound.
 *
 * The tells are all outside the audio: the address is an external domain rather than the unit's
 * own, the memo instructs the learner not to verify, the beneficiary is a personal account, and
 * the Welfare Fund has no request logged against it and has a standing two-signature rule. The
 * decision is taken on the fund's transfer sheet - PIN then Confirm - and Cancel is right there
 * beside it. Fictional throughout: the unit, the officer, the fund, the family and every account
 * and number describe nothing real; nothing is played, no money moves and no PIN leaves the
 * screen it is typed on.
 */
export function buildE22(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const fileAssetId = assetId(scenario, ASSET_KIND.FILE)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const desk = directory(scenario)
  const fromAddress = senderInfo.identifier ?? 'coldev@e22.training.example'
  const officer = senderInfo.display_name ?? 'Col. Dev'
  const adjutant = '+91 00000 22615'
  const subject = 'Welfare disbursement — voice memo attached'

  return {
    scenarioId: 'E22',
    platform: 'email',
    notify: { sender: officer },
    messageSender: { display_name: officer, identifier: fromAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        {
          id: 'welfare', label: 'Welfare', heading: 'Welfare fund',
          rows: [
            {
              id: 'e22-w-1', from: 'Welfare Fund', subject: 'August disbursements — both signatures recorded',
              preview: 'Two cases released after the committee met.', time: '29 Aug', inert: true,
            },
            {
              id: 'e22-w-2', from: 'Adjutant’s Office', subject: 'Standing instruction on welfare cases',
              preview: 'No disbursement on a verbal or recorded instruction.', time: '14 Aug', inert: true,
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e22-row', from: officer, subject,
          preview: subjectLine(scenario), time: '12:10', unread: true, tag: 'External', attachment: true,
        },
        {
          id: 'e22-bg-1', from: 'Station Library', subject: 'Overdue: two titles',
          preview: 'Please return by Friday.', time: '09:55', inert: true,
        },
        {
          id: 'e22-bg-2', from: 'Ravi', subject: 'Re: transport for the run',
          preview: 'You: I will take the earlier bus', time: 'Mon', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject,
      fromName: officer,
      time: '12:10',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'External'],
    },

    beats: [
      notice('e22-external', 'This message came from outside your organisation.'),
      body('e22-body', {
        greeting: 'Listen to this before you do anything else.',
        paragraphs: [
          'I have recorded the instruction rather than typing it because I am about to go into the '
          + 'briefing and will not have the phone with me.',
          'The details are in the memo and repeated below. Please put it through this afternoon and '
          + 'confirm to me here when it is done.',
        ],
        signature: [officer, 'Commanding Officer'],
      }),
      voice('e22-memo', {
        fileName: 'welfare_memo.m4a',
        duration: '0:41',
        size: '601 KB',
        caption: 'Transcribed by your mail app. Accuracy is not guaranteed.',
        transcript:
          'It’s me. There is a welfare case for one of our families that has to be settled today — '
          + 'the paperwork will follow but the money has to move first. Put one lakh twenty thousand '
          + 'through the welfare account to the details in my mail. Don’t ring me about it, I am in '
          + 'the briefing until five, and keep it between us for now because the family has asked for '
          + 'discretion. Confirm to me by mail when it is done.',
      }),
      table('e22-details', {
        rows: [
          { label: 'Amount', value: 'INR 1,20,000' },
          { label: 'Beneficiary', value: 'D. Menon (individual account)' },
          { label: 'Account', value: 'A/C 7741 0092 3318' },
          { label: 'IFSC', value: 'TRNG0000774' },
          { label: 'Reference', value: 'Welfare — family support' },
          { label: 'Today by', value: '17:00' },
        ],
      }),
    ],

    surfaces: {
      details: mail({
        title: 'Message details',
        home: 'details',
        pages: {
          details: {
            title: 'Message details',
            blocks: [
              {
                type: 'identity', name: officer, address: fromAddress,
                note: 'First message from this address',
              },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `${officer} <${fromAddress}>` },
                  { label: 'Reply-To', value: fromAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Attachments', value: 'welfare_memo.m4a (audio)' },
                ],
              },
              {
                type: 'checks',
                heading: 'Authentication',
                rows: [
                  { label: 'SPF', value: 'e22.training.example', result: 'pass' },
                  { label: 'DKIM', value: 'e22.training.example', result: 'pass' },
                  { label: 'Sending domain', value: 'e22.training.example — not unit.training.example', result: 'external' },
                ],
              },
              {
                type: 'note',
                text: 'Authentication says which domain sent the message. Everyone in the unit, including '
                  + 'the Commanding Officer, has an address on unit.training.example.',
              },
            ],
            links: [{ id: 'e22-link-memo', label: 'Attachment details', to: 'memo' }],
          },
        },
      }),

      /** What the file itself carries, which is the part a recording cannot supply. */
      memo: mail({
        title: 'Attachment details',
        home: 'memo',
        inertNote: 'Local file details. Nothing is played, opened or run from here.',
        pages: {
          memo: {
            title: 'welfare_memo.m4a',
            blocks: [
              { type: 'file', kind: 'audio', name: 'welfare_memo.m4a', meta: 'Audio · 0:41 · 601 KB' },
              {
                type: 'rows',
                heading: 'File',
                rows: [
                  { label: 'Container', value: 'M4A · single audio track' },
                  { label: 'Created', value: 'Today 11:58, four minutes before the mail' },
                  { label: 'Device tag', value: 'None recorded' },
                  { label: 'Signature', value: 'Audio files carry none' },
                ],
              },
              {
                type: 'note',
                text: 'A recording carries no sender, no signature and no address. It can be replayed, '
                  + 'forwarded and edited by anyone who has it.',
              },
            ],
          },
        },
      }),

      /** The welfare account's own transfer sheet: payee, amount, PIN, then Confirm. */
      paysheet: {
        kind: SURFACE.PAYSHEET,
        title: 'Transfer',
        app: 'Welfare Fund · unit account',
        amount: 'INR 1,20,000',
        subtitle: 'From the unit welfare account',
        rows: [
          { label: 'To', value: 'D. Menon (individual account)' },
          { label: 'Account', value: 'A/C 7741 0092 3318' },
          { label: 'IFSC', value: 'TRNG0000774' },
          { label: 'Reference', value: 'Welfare — family support' },
          { label: 'Second signature', value: 'Not recorded' },
        ],
        form: {
          title: 'Authorise',
          fields: [field({ name: 'pin', label: 'Fund PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The PIN stays on this screen. It is not stored, sent or read by anything.',
      },

      /** The unit's own Welfare Fund application - what it does and does not hold. */
      fund: {
        kind: SURFACE.APP,
        appName: 'Welfare Fund',
        appTagline: 'Unit account · cases and disbursements',
        hero: {
          label: 'Open cases',
          value: 'No case for today',
          caption: 'Nothing has been raised for a family disbursement this week.',
        },
        sections: [
          {
            id: 'e22-fund-rules',
            heading: 'Standing rules',
            rows: [
              { label: 'Raised by', value: 'A written case from the Welfare Committee' },
              { label: 'Signatures', value: 'Two, recorded in the fund before release' },
              { label: 'Instructions', value: 'Never acted on from a recording or a phone call' },
            ],
            note: 'The rules are printed on the fund’s own home screen and in the 14 Aug standing instruction.',
          },
          {
            id: 'e22-fund-history',
            heading: 'Last disbursements',
            rows: [
              { label: '29 Aug', value: 'Two cases · both with committee minutes and two signatures' },
              { label: '02 Aug', value: 'One case · committee minutes on file' },
            ],
          },
        ],
        tabs: [
          { label: 'Cases', icon: 'home' },
          { label: 'Ledger', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The Adjutant's office, on the number in the unit's own directory. */
      adjt: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Adjutant’s office (unit directory)',
        number: adjutant,
        script: [
          { at: 0, speaker: 'them', text: 'Adjutant’s office.' },
          { at: 3, speaker: 'them', text: 'The Commanding Officer is in the briefing, yes. He has sent no welfare instruction today.' },
          { at: 8, speaker: 'them', text: 'And he would not: welfare cases go through the committee with two signatures.' },
          { at: 13, speaker: 'them', text: 'Hold the transfer, keep the mail, and pass it to the security section.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e22-c01', slot: SLOT.INLINE, label: 'Open the memo' }),
          action({ id: 'e22-c02', slot: SLOT.INLINE, label: 'Reply from the list to acknowledge' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e22-c03', slot: SLOT.INLINE, anchor: 'header',
            label: officer, hint: 'Sender, domain and attachments',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 'e22-c04', slot: SLOT.MENU, label: 'Check the attachment’s details',
            hint: 'What the file itself carries', targetId: fileAssetId, opens: 'memo',
          }),
          action({ id: 'e22-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e22-c06', slot: SLOT.SURFACE, on: 'paysheet',
            label: 'Confirm the transfer', targetId: paymentAsset, closes: true,
          }),
          action({ id: 'e22-c07', slot: SLOT.SURFACE, on: 'paysheet', label: 'Cancel the transfer', closes: true }),
          action({
            id: 'e22-c08', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: fromAddress },
            label: 'Reply that it has been put through',
            echo: 'Done, sir. The disbursement has gone this afternoon as instructed.',
          }),
          action({ id: 'e22-c09', slot: SLOT.MENU, label: 'Leave it until the briefing ends and raise it then' }),
          navigate({
            id: 'e22-nav-pay', slot: SLOT.INLINE, anchor: 'e22-details',
            label: 'Open the transfer in the welfare account', opens: 'paysheet',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e22-c10', slot: SLOT.MENU, label: 'Open the Welfare Fund and look for the case',
            hint: 'Cases, signatures and the standing rules', opens: 'fund',
          }),
          action({
            id: 'e22-c11', slot: SLOT.MENU, label: 'Call the Adjutant’s office on the unit directory number',
            opens: 'adjt',
          }),
          action({
            id: 'e22-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e22-c13', slot: SLOT.MENU, label: 'Reply to the memo and ask him to confirm' }),
          action({ id: 'e22-c14', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e22-c15', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e22-c16', slot: SLOT.INLINE, label: 'Report it and leave the transfer unmade' }),
          action({ id: 'e22-c17', slot: SLOT.INLINE, label: 'Put the transfer through before the deadline' }),
          action({ id: 'e22-c18', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e22-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e22-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e22-nav-fund', slot: SLOT.MENU, label: 'Open the Welfare Fund', opens: 'fund', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e22-dir-adjt',
        name: 'Adjutant’s office — unit directory',
        identifier: adjutant,
        provenance: 'unit directory, printed and on the intranet',
        role: 'Confirms where officers are and what instructions have been issued through the unit.',
      },
    ],
  }
}

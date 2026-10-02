import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, earlier, mail, notice, sender, subjectLine,
} from './shared.js'

/**
 * E06 - Adjutant Roster Request (IMMERSIVE-006).
 *
 * A display name copied from the unit adjutant asks, on an external address, for the current
 * personnel roster "before the commander's brief". The Email-native decision is the reply
 * composer: the learner can attach a roster spreadsheet and send it, or refuse. The tells are
 * the ones a mail client shows - the sender is on an outside domain, the message carries the
 * app's own "External" banner, and the thread holds a genuine earlier note from the real
 * adjutant on the approved domain, so the two addresses can be compared.
 *
 * The decision is taken in the reply composer (attach the roster, or a bare reply, or discard);
 * the checks are the Personnel Records System, a call to the adjutant's saved number, and the
 * trusted directory. Everything is fictional: "Unit Falcon", the roster and the addresses
 * describe nothing real, and no personnel data exists anywhere.
 */
export function buildE06(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const externalAddress = senderInfo.identifier ?? 'unitadjutant@e06.training.example'
  const approvedAddress = 'adjutant@falcon.unit.training.example'

  return {
    scenarioId: 'E06',
    platform: 'email',
    notify: { sender: senderInfo.display_name ?? 'Unit Adjutant' },
    messageSender: { display_name: senderInfo.display_name ?? 'Unit Adjutant', identifier: externalAddress },

    list: {
      title: 'Inbox',
      account: LEARNER.account,
      accountName: 'You',
      folders: [
        { id: 'inbox', label: 'Inbox', heading: 'Inbox', count: 3 },
        { id: 'flagged', label: 'Starred', heading: 'Starred', rows: [], empty: 'Nothing starred.' },
        { id: 'spam', label: 'Spam', heading: 'Spam', rows: [], empty: 'Spam is empty.' },
      ],
      rows: [
        {
          id: 'e06-row', from: 'Unit Adjutant', subject: subjectLine(scenario),
          preview: 'Send the latest personnel roster before the commander’s brief…',
          time: '12:58', unread: true, tag: 'External',
        },
        {
          id: 'e06-bg-1', from: 'Duty Roster', subject: 'This week’s duty list',
          preview: 'Published on the board.', time: '11:30', inert: true,
        },
        {
          id: 'e06-bg-2', from: 'Nikhil', subject: 'Re: PT timings',
          preview: 'You: 0600 works', time: 'Tue', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Unit Adjutant',
      time: '12:58',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox', 'Protected'],
    },

    beats: [
      notice('e06-external', 'External sender. This message came from outside your organisation.'),
      /** The genuine earlier thread from the real adjutant, on the approved domain. */
      earlier('e06-earlier', {
        from: 'Adjutant (Unit Falcon)',
        to: 'You',
        time: '3 Sep',
        snippet: 'Roster is maintained in the Records System — pull it there, don’t email it.',
        paragraphs: [
          'Reminder for everyone: the personnel roster stays in the Records System. If you need a '
          + 'figure for a brief, take it from there. Do not send the roster by email.',
          'Adjutant, Unit Falcon · adjutant@falcon.unit.training.example',
        ],
      }),
      body('e06-body', {
        greeting: 'Priority,',
        paragraphs: [
          'I need the latest personnel roster in spreadsheet form before the commander’s brief. '
          + 'Reply to this address and attach it now.',
          'Time-critical — the brief is shortly.',
        ],
        signature: ['Unit Adjutant'],
        footer: 'Sent from a mobile device.',
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
              { type: 'identity', name: 'Unit Adjutant', address: externalAddress, note: 'Outside your organisation' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Unit Adjutant <${externalAddress}>` },
                  { label: 'Reply-To', value: externalAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Classification', value: 'Requested item: Protected — Personnel' },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Sender domain', value: `e06.training.example (external)`, result: 'external' },
                  { label: 'Approved adjutant', value: approvedAddress, result: 'onfile' },
                  { label: 'Request', value: 'Protected personnel data by email', result: 'caution' },
                ],
              },
              { type: 'note', text: 'The real adjutant is on the approved domain and never asks for the roster by email.' },
            ],
          },
        },
      }),

      records: {
        kind: SURFACE.APP,
        appName: 'Personnel Records System',
        appTagline: 'Approved directory',
        hero: { label: 'Adjutant on file', value: approvedAddress, caption: 'The request did not come from this address.' },
        sections: [
          {
            id: 'e06-records-rows',
            heading: 'Directory',
            rows: [
              { label: 'Adjutant', value: `${approvedAddress} · desk ${desk.identifier || '+91 00000 41708'}` },
              { label: 'Roster access', value: 'Held in the Records System; never released by email' },
              { label: 'Requested address', value: `${externalAddress} — not on file` },
            ],
            note: 'Roster figures are read here by anyone who needs them. They are not attached to messages.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Directory', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Adjutant (saved)',
        number: desk.identifier || '+91 00000 41708',
        script: [
          { at: 0, speaker: 'them', text: 'Adjutant.' },
          { at: 3, speaker: 'them', text: 'No, I did not send that, and that is not my address.' },
          { at: 8, speaker: 'them', text: 'Don’t attach the roster. Report it to unit security.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e06-c01', slot: SLOT.INLINE, label: 'Open the message from Unit Adjutant' }),
          action({ id: 'e06-c02', slot: SLOT.INLINE, label: 'Reply from the list right away' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e06-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Unit Adjutant', hint: 'Sender address, Reply-To and classification',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e06-c04', slot: SLOT.MENU, label: 'Read the earlier thread from the adjutant' }),
          action({ id: 'e06-c05', slot: SLOT.MENU, label: 'Skip ahead and reply' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e06-c06', slot: SLOT.COMPOSER,
            compose: { mode: 'reply', to: externalAddress, attachment: 'Unit_Roster.xlsx' },
            label: 'Attach the roster spreadsheet and send',
            echo: 'Roster attached as requested.',
          }),
          action({
            id: 'e06-c07', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: externalAddress },
            label: 'Reply to ask which format he needs', echo: 'Which format do you need it in?',
          }),
          action({ id: 'e06-c08', slot: SLOT.MENU, label: 'Discard the draft and don’t reply' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'e06-c09', slot: SLOT.MENU, label: 'Open the Personnel Records System',
            hint: 'Check the adjutant’s address on file', opens: 'records',
          }),
          action({ id: 'e06-c10', slot: SLOT.MENU, label: 'Call the adjutant’s saved number', opens: 'call' }),
          action({
            id: 'e06-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e06-c12', slot: SLOT.MENU, label: 'Reply to the address to confirm it is him' }),
          action({ id: 'e06-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e06-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e06-c15', slot: SLOT.INLINE, label: 'Report the message and cancel the reply' }),
          action({ id: 'e06-c16', slot: SLOT.INLINE, label: 'Send the roster to be safe' }),
          action({ id: 'e06-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e06-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e06-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e06-nav-records', slot: SLOT.MENU, label: 'Open the Records System', opens: 'records', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e06-dir-adjt',
        name: 'Unit Falcon Adjutant',
        identifier: approvedAddress,
        provenance: 'local approved directory',
        role: 'Holds the roster in the Records System; never asks for personnel data by email.',
      },
    ],
  }
}

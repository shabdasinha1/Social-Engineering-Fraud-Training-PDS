import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, body, directory, mail, subjectLine,
} from './shared.js'

/**
 * E09 - Executive Gift-Card Request (IMMERSIVE-006) - business email compromise.
 *
 * A short message wearing a senior officer's display name ("Col. Dev") arrives from a personal
 * look-alike address: he is "in a meeting", cannot call, and needs six gift cards for visitors,
 * with the codes sent back and the whole thing kept confidential. It is the classic BEC
 * pattern - authority, urgency and secrecy - and the Email tells are the personal domain, the
 * Reply-To that is not the official address, and a payment method (gift cards) that no
 * procurement process uses.
 *
 * The decision is buying the cards and sending the codes, replying that you will, or refusing;
 * the checks are a call to the duty office on the known number and the procurement system,
 * where no such authorisation exists. Fictional throughout: "Col. Dev", "Unit Falcon" and the
 * addresses describe nothing real, and no card code the learner types leaves the component.
 */
export function buildE09(scenario) {
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const personalAddress = 'col.dev.87@e09-personal.training.example'
  const officialAddress = 'dev@falcon.unit.training.example'

  return {
    scenarioId: 'E09',
    platform: 'email',
    notify: { sender: 'Col. Dev' },
    messageSender: { display_name: 'Col. Dev', identifier: personalAddress },

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
          id: 'e09-row', from: 'Col. Dev', subject: subjectLine(scenario),
          preview: 'Need six gift cards for visitors. Keep this confidential…',
          time: '14:24', unread: true,
        },
        {
          id: 'e09-bg-1', from: 'Mess Secretary', subject: 'Dining-in night',
          preview: 'RSVP by Thursday.', time: '13:15', inert: true,
        },
        {
          id: 'e09-bg-2', from: 'Arjun', subject: 'Re: kit issue',
          preview: 'You: collected, thanks', time: 'Wed', outgoing: true, inert: true,
        },
      ],
    },

    conversation: {
      subject: subjectLine(scenario),
      fromName: 'Col. Dev',
      time: '14:24',
      toLine: 'to me',
      detailsTo: 'details',
      labels: ['Inbox'],
    },

    beats: [
      body('e09-body', {
        greeting: null,
        paragraphs: [
          'I’m in a meeting and can’t take calls. I need six gift cards of INR 2,000 each for '
          + 'visitors today.',
          'Buy them, scratch the codes and reply with photos of the codes. Keep this between us '
          + 'for now — I’ll reimburse you afterwards.',
        ],
        signature: ['Col. Dev', 'Sent from my phone'],
        footer: null,
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
              { type: 'identity', name: 'Col. Dev', address: personalAddress, note: 'Personal address, not on file' },
              {
                type: 'rows',
                heading: 'Headers',
                rows: [
                  { label: 'From', value: `Col. Dev <${personalAddress}>` },
                  { label: 'Reply-To', value: personalAddress },
                  { label: 'To', value: LEARNER.account },
                  { label: 'Official address', value: officialAddress },
                ],
              },
              {
                type: 'checks',
                heading: 'Signals',
                rows: [
                  { label: 'Sender', value: 'Personal domain, not the official one', result: 'external' },
                  { label: 'Channel', value: '“Can’t call”, keep it confidential', result: 'secrecy' },
                  { label: 'Payment', value: 'Gift cards — outside procurement', result: 'caution' },
                ],
              },
              { type: 'note', text: 'Authority plus secrecy plus gift cards is an unexpected request outside normal controls.' },
            ],
          },
        },
      }),

      purchase: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'store',
        pages: {
          store: {
            url: 'https://cards.store.training.example',
            host: 'cards.store.training.example',
            title: 'Gift cards',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'GC', name: 'Gift Card Store', tagline: 'Digital gift cards' },
              { type: 'heading', text: 'Buy 6 × INR 2,000 gift cards' },
              { type: 'summary', rows: [
                { label: 'Quantity', value: '6 cards' },
                { label: 'Total', value: 'INR 12,000', strong: true },
              ] },
              { type: 'notice', text: 'After purchase, enter the card codes to send them on.' },
            ],
            primary: { label: 'Continue', to: 'codes' },
          },
          codes: {
            url: 'https://cards.store.training.example/codes',
            host: 'cards.store.training.example',
            title: 'Send the codes',
            secure: true,
            blocks: [
              {
                type: 'form',
                heading: 'Enter the card codes to send to Col. Dev',
                fields: [
                  field({ name: 'code', label: 'Gift card code', kind: FIELD_KIND.TEXT, length: 8, max: 19 }),
                  field({ name: 'pin', label: 'Card PIN', kind: FIELD_KIND.SECRET, length: 4 }),
                ],
              },
              { type: 'fineprint', text: 'The codes will be sent to the requester.' },
            ],
            primary: { label: 'Continue', to: 'confirm' },
          },
          confirm: {
            url: 'https://cards.store.training.example/confirm',
            host: 'cards.store.training.example',
            title: 'Confirm',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Send these card codes?' },
              { type: 'notice', text: 'The gift-card codes will be sent to the requester and cannot be recovered.' },
            ],
          },
          done: {
            url: 'https://cards.store.training.example/codes',
            host: 'cards.store.training.example',
            title: 'Sent',
            final: true,
            blocks: [
              { type: 'result', heading: 'Codes sent', text: 'The gift-card codes were sent.' },
            ],
          },
        },
      },

      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Duty office (saved)',
        number: desk.identifier || '+91 00000 91267',
        script: [
          { at: 0, speaker: 'them', text: 'Duty office.' },
          { at: 3, speaker: 'them', text: 'The Colonel is in the brief and has not asked for any gift cards.' },
          { at: 8, speaker: 'them', text: 'That is not his address. Report it and buy nothing.' },
        ],
      },

      procure: {
        kind: SURFACE.APP,
        appName: 'Procurement system',
        appTagline: 'Approved workflow',
        hero: { label: 'Authorisation', value: 'None found', caption: 'No gift-card purchase is authorised for you.' },
        sections: [
          {
            id: 'e09-procure-rows',
            heading: 'Requests',
            rows: [
              { label: 'Open authorisations', value: 'None' },
              { label: 'Gift cards', value: 'Not an approved payment method' },
              { label: 'Rule', value: 'Purchases need a raised request and dual approval' },
            ],
            note: 'Real purchases are raised and approved here — never arranged by a confidential email.',
          },
        ],
        tabs: [
          { label: 'Home', icon: 'home' },
          { label: 'Requests', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 'e09-c01', slot: SLOT.INLINE, label: 'Open the message from Col. Dev' }),
          action({ id: 'e09-c02', slot: SLOT.INLINE, label: 'Reply from the list right away' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'e09-c03', slot: SLOT.INLINE, anchor: 'header',
            label: 'Col. Dev', hint: 'Sender address, Reply-To and channel',
            targetId: senderAsset, opens: 'details',
          }),
          action({ id: 'e09-c04', slot: SLOT.MENU, label: 'Read the whole message' }),
          action({ id: 'e09-c05', slot: SLOT.MENU, label: 'Skip ahead and act on it' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'e09-c06', slot: SLOT.SURFACE, on: 'purchase', page: 'confirm',
            label: 'Send the card codes', thenPage: 'done',
          }),
          action({
            id: 'e09-c07', slot: SLOT.COMPOSER, compose: { mode: 'reply', to: personalAddress },
            label: 'Reply that you’ll get the cards', echo: 'On it — I’ll get the cards now.',
          }),
          action({ id: 'e09-c08', slot: SLOT.MENU, label: 'Don’t reply or buy anything' }),
          navigate({ id: 'e09-nav-purchase', slot: SLOT.MENU, label: 'Buy the gift cards', opens: 'purchase' }),
        ],
      },

      verify: {
        affordances: [
          action({ id: 'e09-c09', slot: SLOT.MENU, label: 'Call the duty office on the known number', opens: 'call' }),
          action({
            id: 'e09-c10', slot: SLOT.MENU, label: 'Check the procurement system',
            hint: 'Look for an authorisation yourself', opens: 'procure',
          }),
          action({
            id: 'e09-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the duty office'} in the trusted directory`, targetId: directoryAsset,
          }),
          action({ id: 'e09-c12', slot: SLOT.MENU, label: 'Reply to the address to confirm it is him' }),
          action({ id: 'e09-c13', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'e09-c14', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 'e09-c15', slot: SLOT.INLINE, label: 'Report the message and buy nothing' }),
          action({ id: 'e09-c16', slot: SLOT.INLINE, label: 'Buy the cards to be safe' }),
          action({ id: 'e09-c17', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 'e09-c18', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'e09-nav-details', slot: SLOT.MENU, label: 'Show message details', opens: 'details', after: 'inspect' }),
      navigate({ id: 'e09-nav-procure', slot: SLOT.MENU, label: 'Open the procurement system', opens: 'procure', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 'e09-dir-duty',
        name: 'Unit Falcon Duty Office',
        identifier: desk.identifier || '+91 00000 91267',
        provenance: 'local approved directory',
        role: 'Confirms senior requests; purchases are raised and dual-approved in the procurement system.',
      },
    ],
  }
}

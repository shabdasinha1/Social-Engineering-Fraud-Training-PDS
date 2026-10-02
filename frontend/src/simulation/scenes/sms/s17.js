import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  amount, assetId, day, directory, message, messageText, receivedAt, sender, sms, system,
} from './shared.js'

/**
 * S17 - New-Phone Family Emergency (IMMERSIVE-013) - the saved thread is one tab away.
 *
 * "Mum, this is my new number. Phone broke." The learner is the parent. W04 (a friend on a new
 * WhatsApp number) and I04 (a cloned Instagram profile) are the product's other two versions of this
 * story, and both had the conversation carry the evidence. S17 is built on what only the phone's own
 * Messages app does with it:
 *
 * - **It files the text by number, not by name.** The new number lands under *Unknown senders*; Kabir
 *   is under *Known senders*, where he has always been - and his thread is where the evidence is. He
 *   wrote from his saved number at 16:31, twenty-two minutes before the "broken" phone, and the
 *   learner's reply to that number shows **Delivered** at 16:32.
 * - **It suggests the reply.** The sender asked for "Done", and the app's own suggestion chip under
 *   the message offers exactly that - one tap, no typing, no thought. That chip is priced.
 * - **It turns a payment handle into a Pay button.** The money goes to R DESHMUKH, an individual, not
 *   to Kabir and not to a hospital; the phone's payment sheet shows the name before the PIN.
 *
 * The safe branch is taken **inside Kabir's saved thread**, which the learner can walk into from the
 * list or the details screen without deciding anything. The check is Kabir himself, on that number.
 *
 * Fictional throughout: Kabir, Sunil, R DESHMUKH, the hospital and every number and payment handle
 * describe nothing real. No money moves; the PIN never leaves the sheet.
 */
export function buildS17(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const paymentAsset = assetId(scenario, ASSET_KIND.PAYMENT)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 19543'
  const at = receivedAt(scenario) ?? '16:53'
  const kabir = 'Kabir'
  const kabirNumber = '+91 00000 27164'
  const sunil = 'Sunil'
  const sunilNumber = '+91 00000 27190'
  const payee = 'R DESHMUKH'
  const handle = 'rdeshmukh.care@trainpay'

  return {
    scenarioId: 'S17',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'unknown', label: 'Unknown senders', heading: 'From numbers not in your contacts' },
        {
          id: 'known', label: 'Known senders', heading: 'From your contacts', count: 3,
          rows: [
            {
              id: 's17-kn-1', from: kabir, time: '16:32', inert: true,
              preview: 'You: OK. Take the bus, not the bike.',
            },
            {
              id: 's17-kn-2', from: sunil, time: '15:10', inert: true,
              preview: 'Meeting runs till 7. Will pick up milk.',
            },
            {
              id: 's17-kn-3', from: 'Priya', time: 'Yesterday', inert: true,
              preview: 'Photos from Sunday attached 😊',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's17-row', from, time: at, unread: true,
          preview: messageText(scenario),
        },
      ],
    },

    conversation: {
      title: from,
      subtitle: 'Mobile · not in your contacts',
      detailsTo: 'details',
      spamBar: 'This number is not in your contacts. The app cannot tell who is using it.',
    },

    beats: [
      day('s17-day', 'Today'),
      message('s17-msg', { text: messageText(scenario), time: at, via: 'SIM 1' }),
      message('s17-msg2', {
        text: 'Don’t call, it’s a nurse’s phone and she needs it back. They won’t start until the deposit '
          + `is paid. Send it to the desk account: ${payee}, UPI ${handle}`,
        time: at, via: 'SIM 1',
      }),
      amount('s17-pay', {
        amount: 'INR 15,000',
        rows: [
          { label: 'Pay to', value: payee },
          { label: 'UPI ID', value: handle },
          { label: 'Found in', value: 'The text above' },
        ],
      }),
      message('s17-msg3', { text: 'Reply Done when it’s sent. Please Mum, now.', time: '16:54', via: 'SIM 1' }),
      message('s17-msg4', {
        text: 'Mum?? The desk is asking again. Did you send it?', time: '16:58', via: 'SIM 1', since: 'branch',
      }),
      system('s17-sys-after-reply', 'Sent as SMS to a number that is not in your contacts.', {
        afterConsequence: 'simulated_reply_sent',
      }),
      message('s17-after-reply', {
        text: 'Thank you Mum. Please send it now, they are waiting for me.', time: '17:01', via: 'SIM 1',
        afterConsequence: 'simulated_reply_sent',
      }),
      message('s17-after-pay', {
        text: 'Got it. They need INR 8,000 more for the scan, same account. Hurry.', time: '17:03', via: 'SIM 1',
        afterConsequence: 'simulated_payment',
      }),
    ],

    surfaces: {
      /** Conversation details - an unsaved number that has never written before. */
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
                  { label: 'First message from this number', value: `Today, ${at}` },
                  { label: 'Earlier messages or calls', value: 'None' },
                  { label: 'Filed under', value: 'Unknown senders' },
                ],
              },
              {
                type: 'checks',
                heading: 'What the texts say',
                rows: [
                  { label: 'Name used', value: 'None — only “Mum”', result: 'none' },
                  { label: 'Money goes to', value: `${payee}, an individual — not ${kabir}, not a hospital`, result: 'person' },
                  { label: 'Calling back', value: 'Asked not to', result: 'no calls' },
                  { label: `${kabir}’s saved number`, value: `${kabirNumber} — your last text to it was delivered at 16:32`, result: 'saved' },
                ],
              },
              {
                type: 'note',
                text: 'Messages files a text by the number it came from. A new number starts under Unknown '
                  + 'senders whoever is using it.',
              },
            ],
            links: [
              { id: 's17-link-kabir', label: `Open ${kabir}’s saved conversation`, to: 'kabir' },
            ],
          },
        },
      }),

      /** Kabir's own thread, under Known senders. The safe branch is taken here. */
      kabir: sms({
        title: kabir,
        home: 'thread',
        inertNote: 'Local Messages screen. Nothing here sends a text.',
        pages: {
          thread: {
            title: kabir,
            subtitle: `${kabirNumber} · saved contact`,
            blocks: [
              { type: 'identity', initials: 'K', name: kabir, number: kabirNumber, note: 'Saved in your contacts · son' },
              {
                type: 'items',
                heading: 'Today, in this conversation',
                items: [
                  { label: kabir, meta: '16:31', value: 'Practice done, going to Rahul’s to study. Home by 8.' },
                  { label: 'You', meta: '16:32 · Delivered', value: 'OK. Take the bus, not the bike.' },
                  { label: kabir, meta: '12:05', value: 'Can you top up my bus card? 🙏' },
                ],
              },
              {
                type: 'note',
                text: 'Your last text to this number was delivered twenty-one minutes before the new number '
                  + 'wrote. A delivery report comes back only from a phone that is switched on.',
              },
            ],
          },
        },
      }),

      /** The phone's payment sheet, raised by the UPI ID in the text. The payee is a person. */
      upi: {
        kind: SURFACE.PAYSHEET,
        title: 'Send money',
        app: 'Payments',
        amount: 'INR 15,000.00',
        subtitle: 'To an individual account',
        rows: [
          { label: 'To', value: payee },
          { label: 'UPI ID', value: handle },
          { label: 'In your contacts', value: 'No' },
          { label: 'Paid before', value: 'Never' },
        ],
        form: {
          title: 'Authorise',
          fields: [field({ name: 'pin', label: 'UPI PIN', kind: FIELD_KIND.SECRET, length: 6 })],
        },
        note: 'The PIN stays on this screen. It is not stored, sent or read by anything.',
      },

      /** Kabir, on the number he has always had. */
      kabircall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${kabir} (saved)`,
        number: kabirNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Mum? I’m at Rahul’s, we’re doing the chemistry sheet.' },
          { at: 4, speaker: 'you', text: 'Is your phone broken? Are you at a hospital?' },
          { at: 8, speaker: 'them', text: 'What? No, it’s in my hand. I haven’t texted you from any other number.' },
          { at: 14, speaker: 'them', text: 'Don’t send anybody anything. Block that number.' },
        ],
      },

      /** Kabir's father, on his saved number. */
      suniltcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: `${sunil} (saved)`,
        number: sunilNumber,
        script: [
          { at: 0, speaker: 'them', text: 'Hi, I’m still in the meeting. Everything OK?' },
          { at: 4, speaker: 'you', text: 'A new number says it’s Kabir, phone broken, wants fifteen thousand for a hospital.' },
          { at: 10, speaker: 'them', text: 'He texted me from his own phone half an hour ago from Rahul’s place.' },
          { at: 16, speaker: 'them', text: 'Call him on his number to be sure, and don’t pay anyone.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's17-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's17-c02', slot: SLOT.INLINE, label: 'Reply from the list: Coming, which hospital?' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's17-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who this number is, and what the texts ask for',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's17-c04', slot: SLOT.MENU, label: `Compare with ${kabir}’s saved conversation`,
            hint: 'His own number, under Known senders', targetId: threadAsset, opens: 'kabir',
          }),
          action({ id: 's17-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's17-c06', slot: SLOT.INLINE, anchor: 's17-msg3', label: 'Done',
          }),
          action({
            id: 's17-c07', slot: SLOT.COMPOSER, label: 'Ask which hospital and what happened',
            echo: 'Which hospital are you in? What happened? Send me a photo of the bill.',
          }),
          action({
            id: 's17-c08', slot: SLOT.SURFACE, on: 'upi', label: 'Pay INR 15,000',
            targetId: paymentAsset, closes: true,
          }),
          action({
            id: 's17-c09', slot: SLOT.SURFACE, on: 'kabir', page: 'thread',
            label: `Leave the new number unanswered and keep to ${kabir}’s saved number`, closes: true,
          }),
          navigate({
            id: 's17-nav-pay', slot: SLOT.INLINE, anchor: 's17-pay', label: 'Pay with UPI', opens: 'upi',
          }),
          navigate({
            id: 's17-nav-kabir', slot: SLOT.MENU, label: `Open ${kabir}’s saved conversation`, opens: 'kabir',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's17-c10', slot: SLOT.MENU, label: `Call ${kabir} on his saved number`, opens: 'kabircall',
          }),
          action({
            id: 's17-c11', slot: SLOT.MENU, label: `Call ${sunil} on his saved number`, opens: 'suniltcall',
          }),
          action({
            id: 's17-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's17-c13', slot: SLOT.MENU, label: 'Call the new number back to hear his voice' }),
          action({ id: 's17-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's17-c15', slot: SLOT.MENU, label: 'Block the new number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's17-c16', slot: SLOT.INLINE, label: 'Report the number as junk and send nothing' }),
          action({ id: 's17-c17', slot: SLOT.INLINE, label: 'Send the money if he texts again' }),
          action({ id: 's17-c18', slot: SLOT.MENU, label: 'Block the new number and report it' }),
          action({ id: 's17-c19', slot: SLOT.MENU, label: 'Leave it and do nothing' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's17-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's17-nav-kabir-ambient', slot: SLOT.MENU, label: `${kabir}’s conversation`, opens: 'kabir', after: 'verify' }),
    ],

    directoryExtras: [],
  }
}

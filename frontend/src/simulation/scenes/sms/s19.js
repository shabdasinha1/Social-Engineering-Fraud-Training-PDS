import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, day, directory, link, message, messageText, receivedAt, sender, sms, system,
} from './shared.js'

/**
 * S19 - Network Survey Requests IMEI (IMMERSIVE-013) - three things that identify one phone.
 *
 * "Priority network survey for Unit Falcon area. Reply IMEI + location + device model." The pretext
 * is technical and it is plausible: a colleague has just complained about the signal near the east
 * gate. What makes it SMS and not the messenger is that everything it asks for is something the
 * PHONE can produce on request, and the scene lets the learner see each one being produced:
 *
 * - **the IMEI**, by dialling the code the text gives (`*#06#`) - the phone's own identifier screen,
 *   which says what that number is: permanent, tied to the handset whatever SIM is in it;
 * - **the location**, from the Messages app's own *attach → location* sheet, which turns the phone's
 *   position into a map link inside a text;
 * - **the model**, which the learner can type in a reply without looking anything up - the cheap,
 *   helpful-feeling answer that still confirms the number is live and belongs to the unit area.
 *
 * The structured "quick form" behind the link collects all three at once. None of these requires
 * opening anything risky first, and none of them is hidden behind another decision.
 *
 * The comparison is the carrier's own registered thread - planned work near the learner, finished on
 * 16 September, no action needed - and the check is the unit's communications office on the
 * directory number, and the carrier's own app.
 *
 * Fictional throughout: Unit Falcon, its communications office, TrainNet, `VM-TRNNET`, the survey,
 * the handset and its identifiers describe nothing real. The IMEI shown uses the reserved test range;
 * no location exists; what is typed on the drawn form stays on the screen it is typed on.
 */
export function buildS19(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const desk = directory(scenario)
  const page = browserPage(scenario)
  const from = senderInfo.identifier ?? '+91 00000 95779'
  const at = receivedAt(scenario) ?? '15:55'
  const target = page?.display_target ?? 'https://s19.training.example/verify'
  const host = page?.content?.host ?? 's19.training.example'
  const carrierHeader = 'VM-TRNNET'
  const commsOffice = '+91 00000 44120'
  const model = 'TR-X5'
  const imei1 = '00 440011 000573 2'
  const imei2 = '00 440011 000574 0'

  return {
    scenarioId: 'S19',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'all', label: 'All', heading: 'All conversations' },
        {
          id: 'personal', label: 'Personal', heading: 'Personal', count: 1,
          rows: [
            {
              id: 's19-pe-1', from: 'Dev', time: '14:40', inert: true,
              preview: 'Signal near the east gate is terrible again. Calls keep dropping.',
            },
          ],
        },
        {
          id: 'updates', label: 'Updates', heading: 'Updates from services',
          rows: [
            {
              id: 's19-up-1', from: carrierHeader, time: '16 Sep', inert: true,
              preview: 'Network work in your area is complete. No action is needed from you.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's19-row', from, time: at, unread: true,
          preview: messageText(scenario),
        },
        {
          id: 's19-bg-1', from: 'Dev', time: '14:40', inert: true,
          preview: 'Signal near the east gate is terrible again. Calls keep dropping.',
        },
        {
          id: 's19-bg-2', from: carrierHeader, time: '16 Sep', inert: true,
          preview: 'Network work in your area is complete. No action is needed from you.',
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
      day('s19-day', 'Today'),
      message('s19-msg', { text: messageText(scenario), time: at, via: 'SIM 1' }),
      message('s19-msg2', {
        text: 'Dial *#06# to see the IMEI. Send all three in one text. Numbers that have not replied by '
          + '18:00 are left off the upgrade list for the area.',
        time: at, via: 'SIM 1',
      }),
      message('s19-msg3', { text: 'Or use the quick form:', time: '15:56', via: 'SIM 1' }),
      link('s19-link', { shown: target, caption: 'Network coverage survey — quick reply form' }),
      message('s19-msg4', {
        text: 'Twelve numbers from the Unit Falcon area have answered already. Help us fix your signal.',
        time: '16:10', via: 'SIM 1', since: 'branch',
      }),
      system('s19-sys-after-reply', 'Sent as SMS to a number that is not in your contacts.', {
        afterConsequence: 'simulated_reply_sent',
      }),
      message('s19-after-reply', {
        text: 'Thanks. Now the IMEI and your location please, or the area stays off the list.',
        time: '16:14', via: 'SIM 1', afterConsequence: 'simulated_reply_sent',
      }),
    ],

    surfaces: {
      /** Conversation details - an unsaved mobile, and who the carrier really writes as. */
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
                  { label: 'Received on', value: 'SIM 1 · TRAINNET' },
                  { label: 'First message from this number', value: `Today, ${at}` },
                  { label: 'Earlier messages or calls', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'What it asks for',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Your carrier writes as', value: `${carrierHeader}, a registered sender ID`, result: 'header' },
                  { label: 'Asked for', value: 'IMEI, current location and handset model', result: '3 items' },
                  { label: 'Names', value: 'Unit Falcon area — no office, no person, no reference', result: 'none' },
                ],
              },
              {
                type: 'note',
                text: 'An IMEI, a position and a model together describe one handset, where it is, and '
                  + 'which unit area it sits in.',
              },
            ],
            links: [
              { id: 's19-link-carrier', label: `Messages from ${carrierHeader}`, to: 'carrier' },
            ],
          },
        },
      }),

      /** The phone's link details for the quick form. */
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
                shown: target,
                target,
                rows: [
                  { label: 'Site', value: host },
                  { label: 'Your carrier’s site', value: 'trainnet.training.example' },
                  { label: 'Asks for', value: 'IMEI, location and model in one form' },
                ],
              },
              {
                type: 'note',
                text: 'Opening an address from here shows the page in the browser. Nothing on the page is '
                  + 'sent until a form on it is submitted.',
              },
            ],
          },
        },
      }),

      /** The carrier's own registered thread. */
      carrier: sms({
        title: carrierHeader,
        home: 'thread',
        pages: {
          thread: {
            title: `Messages from ${carrierHeader}`,
            blocks: [
              {
                type: 'identity', initials: 'TN', name: carrierHeader,
                number: 'Sender ID — cannot receive replies', note: 'Registered to TrainNet',
              },
              {
                type: 'items',
                heading: 'TrainNet, in this app',
                items: [
                  { label: carrierHeader, meta: '16 Sep', value: 'Network work in your area is complete. No action is needed from you.' },
                  { label: carrierHeader, meta: '14 Sep', value: 'Planned work near you 14–16 Sep. Calls may drop briefly. Report problems in the TrainNet app.' },
                  { label: carrierHeader, meta: '10 Sep', value: 'Your bill of INR 399 is paid. Thank you.' },
                ],
              },
              {
                type: 'note',
                text: 'None of them asks for a reply, an IMEI or a location.',
              },
            ],
          },
        },
      }),

      /** What dialling *#06# shows. The phone's own identifier screen. */
      imei: {
        kind: SURFACE.INSTALLER,
        title: 'Phone',
        home: 'ids',
        closeLabel: 'Close',
        inertNote: 'Simulated phone screen. The identifiers shown are from a reserved test range.',
        pages: {
          ids: {
            style: 'dialog',
            title: 'Device identifiers',
            text: 'Shown after dialling *#06#.',
            rows: [
              { label: 'IMEI 1', value: imei1 },
              { label: 'IMEI 2', value: imei2 },
              { label: 'Model', value: model },
              { label: 'What an IMEI is', value: 'A permanent number for this handset. It stays the same whatever SIM is inside.' },
            ],
          },
        },
      },

      /** The Messages app's own attach sheet - Location. */
      attach: {
        kind: SURFACE.INSTALLER,
        title: 'Attach',
        home: 'location',
        closeLabel: 'Close the attach sheet',
        inertNote: 'Simulated attach sheet. No location is read, attached or sent.',
        pages: {
          location: {
            style: 'sheet',
            screenTitle: 'Attach',
            art: 'map',
            artLabel: 'Map with your current position',
            title: 'Send your current location',
            text: 'Your position is added to the text as a map link. Whoever receives it can see where this '
              + 'phone is now, to within a few metres.',
            rows: [
              { label: 'Send to', value: from },
              { label: 'Accuracy', value: 'About 10 m' },
              { label: 'Sent as', value: 'A map link in a text message' },
            ],
          },
        },
      },

      /** The quick form behind the link. */
      survey: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'form',
        pages: {
          form: {
            title: 'Network coverage survey',
            host,
            url: target,
            blocks: [
              { type: 'brand', monogram: 'NS', name: 'Network Coverage Survey', tagline: 'Priority areas' },
              { type: 'heading', text: 'Unit Falcon area — handset survey' },
              { type: 'text', text: 'Three fields. Takes less than a minute. Answers help plan the upgrade.' },
              {
                type: 'form',
                title: 'Your handset',
                fields: [
                  field({ name: 'imei', label: 'IMEI (dial *#06#)', kind: FIELD_KIND.DIGITS, length: 15, group: 5 }),
                  field({ name: 'place', label: 'Where the phone is now', length: 4, max: 60 }),
                  field({ name: 'model', label: 'Handset model', length: 2, max: 30 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
          },
        },
      },

      /** The carrier's own app. */
      carrierapp: {
        kind: SURFACE.APP,
        appName: 'TrainNet',
        appTagline: 'Your number · SIM 1',
        hero: {
          label: 'Network in your area',
          value: 'No survey running',
          caption: 'Planned work near you finished on 16 Sep. Coverage problems are reported here, under '
            + 'Report a network problem.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's19-app-report',
            heading: 'Report a network problem',
            rows: [
              { label: 'We ask for', value: 'The area and the time the calls dropped' },
              { label: 'We never ask for', value: 'Your IMEI, your live location or a reply by text' },
              { label: 'Texts from us', value: `From ${carrierHeader} only` },
            ],
          },
        ],
        tabs: [
          { label: 'Network', icon: 'home' },
          { label: 'Bills', icon: 'wallet' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The unit's communications office, on the directory number. */
      commscall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit Falcon — communications office',
        number: commsOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Communications office, Unit Falcon.' },
          { at: 3, speaker: 'them', text: 'We are not running a survey, and the carrier does not run one by text.' },
          { at: 9, speaker: 'them', text: 'Nobody here will ever ask for an IMEI or a location in a message.' },
          { at: 15, speaker: 'them', text: 'Send nothing. Report it through unit security and block the number.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's19-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's19-c02', slot: SLOT.INLINE, label: 'Reply from the list with the model' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's19-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and who your carrier writes as',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's19-c04', slot: SLOT.INLINE, anchor: 's19-link',
            label: 'See where the form goes', hint: 'The address behind the link',
            targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's19-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's19-c06', slot: SLOT.COMPOSER, label: 'Reply with just the model',
            echo: `Model ${model}. Signal is weak here too.`,
          }),
          action({
            id: 's19-c07', slot: SLOT.SURFACE, on: 'survey', page: 'form',
            label: 'Send survey', targetId: browserAsset, closes: true,
          }),
          action({
            id: 's19-c08', slot: SLOT.SURFACE, on: 'attach', page: 'location',
            label: 'Send current location', closes: true,
          }),
          action({
            id: 's19-c09', slot: SLOT.INLINE, anchor: 'spam',
            label: `Send nothing and read ${carrierHeader} instead`, opens: 'carrier',
          }),
          navigate({
            id: 's19-nav-form', slot: SLOT.INLINE, anchor: 's19-link', label: 'Open the form', opens: 'survey',
          }),
          navigate({ id: 's19-nav-imei', slot: SLOT.MENU, label: 'Dial *#06#', opens: 'imei' }),
          navigate({ id: 's19-nav-attach', slot: SLOT.MENU, label: 'Attach your location to a reply', opens: 'attach' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's19-c10', slot: SLOT.MENU, label: 'Call the communications office on the number in the unit directory',
            opens: 'commscall',
          }),
          action({
            id: 's19-c11', slot: SLOT.MENU, label: 'Open your carrier app and check network notices',
            hint: 'Work and surveys in your area', opens: 'carrierapp',
          }),
          action({
            id: 's19-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's19-c13', slot: SLOT.MENU, label: 'Reply and ask which office runs the survey' }),
          action({ id: 's19-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's19-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's19-c16', slot: SLOT.INLINE, label: 'Report it through unit security and send nothing' }),
          action({ id: 's19-c17', slot: SLOT.INLINE, label: 'Answer before 18:00 so the area is included' }),
          action({ id: 's19-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's19-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's19-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's19-nav-carrier', slot: SLOT.MENU, label: `Messages from ${carrierHeader}`, opens: 'carrier', after: 'inspect' }),
      navigate({ id: 's19-nav-carrierapp', slot: SLOT.MENU, label: 'Open the carrier app', opens: 'carrierapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's19-dir-comms',
        name: 'Unit Falcon — communications office',
        identifier: commsOffice,
        provenance: 'unit approved directory',
        role: 'Confirms any network or handset request made in the unit’s name.',
      },
    ],
  }
}

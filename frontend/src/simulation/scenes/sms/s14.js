import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, browserPage, directory, link, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S14 - Emergency Recall Location Link (IMMERSIVE-012) - the unit has recalled you before, and
 * it did not look like this.
 *
 * "UNIT ALERT: Immediate recall. Confirm live location and ETA." A message designed to be obeyed
 * before it is read. What the learner has, and what this scene is built on, is a **genuine recall
 * to compare it with**: on 12 August the unit ran a recall exercise, and that message is still in
 * the phone's Service tab from the unit's own sender ID `VM-FALCON`. It quoted a reference, it said
 * to acknowledge in the Unit Portal under Alerts, and it carried no address and asked for nothing.
 * Today's text came from an ordinary mobile, quotes no reference, and asks for the one thing a
 * recall process never collects through a website - where the learner is, and how they will travel.
 *
 * The release is taken somewhere new to the product: the **browser's own site-permission prompt**.
 * The recall page asks to "place you on the recall map", and the prompt that follows belongs to the
 * browser, not to the page - "Allow this site to use this device's location?". W19's location
 * share was the messenger's own share sheet with a duration; this is a web page asking the phone
 * for a live position. The page's other route is a form for service number, position, route and
 * arrival time - operational detail about the learner's movement, typed into a stranger's page.
 *
 * The check is the official recall channel itself - the Alerts page of the Unit Portal, which holds
 * no active recall - and the duty office on the number in the unit directory.
 *
 * Fictional throughout: Unit Falcon, `VM-FALCON`, the Unit Portal, the exercise, its reference, the
 * duty office and every host and number describe nothing real. No real unit, person, location,
 * schedule, procedure or capability appears. Nothing is read from the phone, no position exists, and
 * what is typed on the drawn page stays on the screen it is typed on.
 */
export function buildS14(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const browserAsset = assetId(scenario, ASSET_KIND.BROWSER)
  const page = browserPage(scenario)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 35758'
  const label = senderInfo.display_name ?? 'UNIT ALERT'
  const unitHeader = 'VM-FALCON'
  const shown = 'recall.training.example'
  const host = page?.content?.host ?? 's14.training.example'
  const target = `https://${host}/recall/map`
  const dutyOffice = '+91 00000 34120'
  const exercise = 'EXERCISE: recall test. Acknowledge in the Unit Portal under Alerts. Ref RC-0812. No reply needed.'

  return {
    scenarioId: 'S14',
    platform: 'sms',
    notify: { sender: from },
    messageSender: { display_name: from, identifier: from },

    list: {
      title: 'Messages',
      accountName: 'You',
      tabs: [
        { id: 'personal', label: 'Personal', heading: 'Personal', count: 2 },
        {
          id: 'service', label: 'Service', heading: 'Service messages',
          rows: [
            {
              id: 's14-sv-1', from: unitHeader, time: '02 Sep', inert: true,
              preview: 'Your pay slip for August is available in the unit portal. No reply needed.',
            },
            {
              id: 's14-sv-2', from: unitHeader, time: '12 Aug', inert: true,
              preview: exercise,
            },
            {
              id: 's14-sv-3', from: unitHeader, time: '29 Jul', inert: true,
              preview: 'Portal maintenance on Sunday. No reply needed.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's14-row', from, time: '15:45', unread: true,
          preview: `${label}: ${messageText(scenario)}`,
        },
        {
          id: 's14-bg-1', from: 'Vikram', time: '14:58', inert: true,
          preview: 'Are we still on for the match on Saturday?',
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
      system('s14-sys', 'Sent from a number that is not in your contacts.'),
      message('s14-msg', { text: `${label}: ${messageText(scenario)}`, time: '15:45', via: 'SIM 2' }),
      link('s14-link', {
        shown,
        caption: 'Tap to see where this address goes before opening it.',
      }),
      message('s14-msg2', {
        text: 'Confirm within 60 minutes. Personnel who do not confirm will be marked absent.',
        time: '15:46', via: 'SIM 2',
      }),
    ],

    surfaces: {
      /** Conversation details - and how the unit's own alerts are recognised. */
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
                  { label: 'Received on', value: 'SIM 2 · TRAINING NET' },
                  { label: 'Started', value: 'Today, 15:45' },
                  { label: 'Messages', value: '2 — no earlier texts from this number' },
                  { label: 'Recall reference quoted', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: `None — unit alerts come from ${unitHeader}`, result: 'none' },
                  { label: 'Asks for', value: 'Live location and arrival time, through a link', result: 'link' },
                  { label: 'Signs itself', value: label, result: 'claimed' },
                ],
              },
              {
                type: 'note',
                text: 'A heading in capitals is text anyone can type. What identifies a unit message '
                  + 'is where it comes from and whether its reference appears in the portal.',
              },
            ],
            links: [
              { id: 's14-link-unit', label: `Messages from ${unitHeader}`, to: 'unitthread' },
              { id: 's14-link-target', label: 'Where does this address go?', to: 'linkinfo' },
            ],
          },
        },
      }),

      /** The unit's own thread - including the last time it really recalled anyone. */
      unitthread: sms({
        title: unitHeader,
        home: 'thread',
        pages: {
          thread: {
            title: `Messages from ${unitHeader}`,
            blocks: [
              {
                type: 'identity', initials: 'VM', name: unitHeader,
                number: 'Sender ID — cannot receive replies', note: 'Registered unit sender',
              },
              {
                type: 'items',
                heading: 'Your unit, in this app',
                items: [
                  { label: unitHeader, meta: '02 Sep', value: 'Pay slip available · unit portal · no reply needed' },
                  { label: unitHeader, meta: '12 Aug', value: exercise },
                  { label: unitHeader, meta: '29 Jul', value: 'Portal maintenance on Sunday · no reply needed' },
                ],
              },
              {
                type: 'rows',
                heading: 'The August recall, beside today’s text',
                rows: [
                  { label: 'From', value: `${unitHeader} — today: an unsaved mobile` },
                  { label: 'Reference', value: 'RC-0812 — today: none' },
                  { label: 'Where to respond', value: 'Unit Portal, Alerts — today: a public web address' },
                  { label: 'Asked for', value: 'Nothing — today: live location and arrival time' },
                ],
              },
            ],
          },
        },
      }),

      /** The app's own link details. */
      linkinfo: sms({
        title: 'Link details',
        home: 'target',
        inertNote: 'Local link details. Nothing is fetched and no address is opened from here.',
        pages: {
          target: {
            title: 'Link details',
            blocks: [
              {
                type: 'link',
                heading: 'Address in this message',
                shown,
                target,
                rows: [
                  { label: 'Host', value: host },
                  { label: 'Registered', value: 'Today' },
                  { label: 'Unit Portal', value: 'No — a public address anyone can open' },
                  { label: 'Sign-in needed', value: 'None' },
                ],
              },
            ],
          },
        },
      }),

      /** The recall page - a map that wants a live position, and a form that wants the rest. */
      recall: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'map',
        pages: {
          map: {
            title: 'Recall map',
            host,
            url: target,
            blocks: [
              { type: 'brand', monogram: 'UA', name: 'UNIT ALERT', tagline: 'Recall confirmation' },
              { type: 'heading', text: 'Immediate recall — confirm your position' },
              {
                type: 'notice',
                text: 'Share your live position to be placed on the recall map. Your arrival time is '
                  + 'worked out from it.',
              },
              {
                type: 'summary',
                rows: [
                  { label: 'Confirm by', value: '16:45' },
                  { label: 'Confirmed so far', value: '118 personnel' },
                  { label: 'Sign-in', value: 'Not needed' },
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. No map, position or record exists.',
              },
            ],
            links: [
              { id: 's14-page-geo', label: 'Share live position', to: 'geo' },
              { id: 's14-page-form', label: 'Confirm by form instead', to: 'form' },
            ],
          },
          form: {
            title: 'Recall confirmation',
            host,
            url: `${target}/form`,
            blocks: [
              { type: 'brand', monogram: 'UA', name: 'UNIT ALERT', tagline: 'Recall confirmation' },
              { type: 'heading', text: 'Confirm your recall' },
              {
                type: 'form',
                title: 'Your details',
                fields: [
                  field({ name: 'svc', label: 'Service number', kind: FIELD_KIND.TEXT, length: 4, max: 16 }),
                  field({ name: 'where', label: 'Where you are now', kind: FIELD_KIND.TEXT, length: 3, max: 60 }),
                  field({ name: 'route', label: 'Route you will take', kind: FIELD_KIND.TEXT, length: 3, max: 60 }),
                  field({ name: 'eta', label: 'Arrival time (HH:MM)', kind: FIELD_KIND.DIGITS, length: 4 }),
                ],
              },
              {
                type: 'fineprint',
                text: 'This page is part of the training simulation. Nothing typed here is sent anywhere.',
              },
            ],
            links: [
              { id: 's14-page-map', label: 'Back to the recall map', to: 'map' },
            ],
          },
        },
      },

      /** The browser's own site-permission prompt - it belongs to the phone, not the page. */
      geo: {
        kind: SURFACE.INSTALLER,
        title: 'Browser',
        home: 'prompt',
        closeLabel: 'Block',
        inertNote: 'Simulated permission prompt. No location is read, granted or sent.',
        pages: {
          prompt: {
            style: 'dialog',
            app: { name: host, detail: 'Location: not allowed for this site', monogram: 'UA' },
            title: `Allow ${host} to use this device’s location?`,
            text: 'The site will see your precise position, and keep seeing it while the page is open.',
            rows: [
              { label: 'Site', value: host },
              { label: 'Accuracy', value: 'Precise, about 5 m' },
              { label: 'Opened from', value: 'A link in a text message' },
            ],
          },
        },
      },

      /** The official recall channel - the Alerts page of the Unit Portal. */
      unitapp: {
        kind: SURFACE.APP,
        appName: 'Unit Portal',
        appTagline: 'Unit Falcon · Alerts',
        hero: {
          label: 'Alerts',
          value: 'No active recall',
          caption: 'The last alert was the recall exercise on 12 August (RC-0812), acknowledged by you.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's14-app-alerts',
            heading: 'Recent alerts',
            rows: [
              { label: 'Today', value: 'None' },
              { label: '12 Aug', value: 'Recall exercise RC-0812 · acknowledged' },
            ],
            note: 'Every genuine alert appears here with its reference and is acknowledged here.',
          },
          {
            id: 's14-app-how',
            heading: 'How alerts reach you',
            rows: [
              { label: 'Texts', value: `From ${unitHeader} only, always with a reference` },
              { label: 'Acknowledge', value: 'In this portal, under Alerts' },
              { label: 'Never asked for', value: 'Your position, route or service number on a website' },
            ],
          },
        ],
        tabs: [
          { label: 'Alerts', icon: 'home' },
          { label: 'Leave', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The duty office, on the number in the unit directory. */
      dutycall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit Falcon — duty office',
        number: dutyOffice,
        script: [
          { at: 0, speaker: 'them', text: 'Duty office, Unit Falcon.' },
          { at: 3, speaker: 'them', text: 'There is no recall. Nothing has gone out from this office today.' },
          { at: 9, speaker: 'them', text: `A recall comes from ${unitHeader} with a reference you can see in the portal. We never ask where you are on a website.` },
          { at: 17, speaker: 'them', text: 'Share nothing. Report the number to unit security and block it.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's14-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's14-c02', slot: SLOT.INLINE, label: 'Open the address from the list' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's14-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how unit alerts arrive',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's14-c04', slot: SLOT.MENU, label: 'Check where the address goes',
            hint: 'Link details', targetId: browserAsset, opens: 'linkinfo',
          }),
          action({ id: 's14-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's14-c06', slot: SLOT.INLINE, anchor: 's14-link',
            label: 'Open the address', targetId: browserAsset, opens: 'recall',
          }),
          action({
            id: 's14-c07', slot: SLOT.SURFACE, on: 'geo', page: 'prompt',
            label: 'Allow', closes: true,
          }),
          action({
            id: 's14-c08', slot: SLOT.SURFACE, on: 'recall', page: 'form',
            label: 'Confirm my recall', closes: true,
          }),
          action({
            id: 's14-c09', slot: SLOT.MENU, label: 'Leave it and check Alerts in the Unit Portal',
            opens: 'unitapp',
          }),
          navigate({ id: 's14-nav-page', slot: SLOT.MENU, label: 'Open the address in the browser', opens: 'recall' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's14-c10', slot: SLOT.MENU, label: 'Call the duty office on the number in the unit directory',
            opens: 'dutycall',
          }),
          action({
            id: 's14-c11', slot: SLOT.MENU, label: 'Open the Unit Portal and check Alerts',
            hint: 'The official recall channel', opens: 'unitapp',
          }),
          action({
            id: 's14-c12', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({ id: 's14-c13', slot: SLOT.MENU, label: 'Call the number that sent the alert' }),
          action({ id: 's14-c14', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's14-c15', slot: SLOT.MENU, label: 'Block the number' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's14-c16', slot: SLOT.INLINE, label: 'Report it through unit security and share nothing' }),
          action({ id: 's14-c17', slot: SLOT.INLINE, label: 'Confirm the recall on the page' }),
          action({ id: 's14-c18', slot: SLOT.MENU, label: 'Block the number and report' }),
          action({ id: 's14-c19', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's14-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's14-nav-unit', slot: SLOT.MENU, label: `Messages from ${unitHeader}`, opens: 'unitthread', after: 'inspect' }),
      navigate({ id: 's14-nav-portal', slot: SLOT.MENU, label: 'Open the Unit Portal', opens: 'unitapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's14-dir-duty',
        name: 'Unit Falcon — duty office',
        identifier: dutyOffice,
        provenance: 'unit approved directory',
        role: 'Confirms whether any alert or recall has been issued; alerts are acknowledged in the Unit Portal.',
      },
    ],
  }
}

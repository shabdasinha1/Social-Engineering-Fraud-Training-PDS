import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  assetId, directory, message, messageText, sender, sms, system,
} from './shared.js'

/**
 * S06 - Service-Number Confirmation (IMMERSIVE-011) - the reply IS the payload.
 *
 * A text signed "Unit Records" asks for a service number and a date of birth so a personnel file
 * stays active. There is no address, no attachment to open and nothing to install: the only thing
 * in this scene that can hurt the learner is the composer, and the only thing that can hurt them
 * twice is the photo picker underneath it.
 *
 * That is what separates it from every earlier scene in the product. S01, S04, S05 and S08 end on
 * a page; S02 and S10 end on a voice; S06 never leaves the Messages app. The learner is handed two
 * ready-made chips - the identity line, and the photograph of the card already sitting in the
 * gallery - and the whole exercise is whether they press one.
 *
 * The evidence is what a records cell would have done instead. The unit writes from its own
 * registered sender ID, `VM-FALCON`, and a tab away sit its leave approval and its pay-slip
 * notice, both of which point at the unit portal and neither of which asks a question. The portal
 * shows a file that is active with nothing outstanding, and the records cell is a counter the
 * learner can walk to.
 *
 * Fictional throughout: Unit Falcon, its records cell, its orderly room, its portal, the service
 * number, the date of birth and every phone number describe nothing real. No real unit, person,
 * location, schedule, procedure, roster or capability appears anywhere. Nothing is sent, attached
 * or uploaded, and the gallery holds no image file - only rows of text describing one.
 */
export function buildS06(scenario) {
  const senderInfo = sender(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const threadAsset = assetId(scenario, ASSET_KIND.THREAD)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const from = senderInfo.identifier ?? '+91 00000 16025'
  const signature = senderInfo.display_name ?? 'Unit Records'
  const unitHeader = 'VM-FALCON'
  const orderlyRoom = '+91 00000 34117'
  const serviceNumber = 'TR-SVC-448210'

  return {
    scenarioId: 'S06',
    platform: 'sms',
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
              id: 's06-sv-1', from: unitHeader, time: '09:05', inert: true,
              preview: 'Leave application LV/2026/0418 is approved. The letter is in the unit portal.',
            },
            {
              id: 's06-sv-2', from: unitHeader, time: '02 Sep', inert: true,
              preview: 'Your pay slip for August is available in the unit portal. No reply needed.',
            },
            {
              id: 's06-sv-3', from: unitHeader, time: '18 Aug', inert: true,
              preview: 'Annual medical is due this quarter. Book a slot in the unit portal.',
            },
          ],
        },
        { id: 'spam', label: 'Spam', heading: 'Spam and blocked', rows: [], empty: 'Nothing has been marked as spam.' },
      ],
      rows: [
        {
          id: 's06-row', from, time: '11:18', unread: true,
          preview: `${signature}: ${messageText(scenario)}`,
        },
        {
          id: 's06-bg-1', from: 'Vikram', time: '10:40', inert: true,
          preview: 'Are you coming for the run tomorrow morning?',
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
      system('s06-sys', 'Sent from a number that is not in your contacts.'),
      message('s06-msg', {
        text: `${signature}: ${messageText(scenario)}`, time: '11:18', via: 'SIM 2',
      }),
      message('s06-msg2', {
        text: 'A photograph of your identity card is also accepted. The cell closes at 1800.',
        time: '11:21', via: 'SIM 2',
      }),
    ],

    surfaces: {
      /** What the Messages app can say about this thread, and about how records really move. */
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
                  { label: 'Started', value: 'Today, 11:18' },
                  { label: 'Messages', value: '2 — no earlier texts from this number' },
                  { label: 'Case or reference quoted', value: 'None' },
                ],
              },
              {
                type: 'checks',
                heading: 'Sender',
                rows: [
                  { label: 'Sender type', value: 'Ten-digit mobile number', result: 'mobile' },
                  { label: 'Registered sender ID', value: 'None — this is not a unit header', result: 'none' },
                  { label: 'In your contacts', value: 'No', result: 'unsaved' },
                  { label: 'Signs itself', value: signature, result: 'claimed' },
                ],
              },
              {
                type: 'note',
                text: `Messages from the unit arrive from ${unitHeader}, a six-character sender ID that `
                  + 'takes no reply. This thread is an ordinary mobile number.',
              },
            ],
            links: [
              { id: 's06-link-process', label: 'How a personnel file is updated', to: 'process' },
            ],
          },
          process: {
            title: 'Updating a personnel file',
            blocks: [
              {
                type: 'rows',
                heading: 'The two ways it happens',
                rows: [
                  { label: 'In the portal', value: 'Sign in and submit the change; the file updates the same day' },
                  { label: 'At the counter', value: 'Records cell, working hours, with the card in your hand' },
                  { label: 'By text', value: 'Never — a text cannot amend a file' },
                ],
              },
              {
                type: 'note',
                text: 'Nobody on the records staff asks for a service number by message: they already '
                  + 'hold it, which is what a records system is.',
              },
            ],
          },
        },
      }),

      /** Everything the unit itself has sent, in the app the learner already has. */
      history: sms({
        title: `Messages from ${unitHeader}`,
        home: 'history',
        pages: {
          history: {
            title: `Messages from ${unitHeader}`,
            blocks: [
              {
                type: 'items',
                heading: 'Your unit, in this app',
                items: [
                  { label: unitHeader, meta: '09:05', value: 'Leave approved · read it in the unit portal' },
                  { label: unitHeader, meta: '02 Sep', value: 'Pay slip available · unit portal · no reply needed' },
                  { label: unitHeader, meta: '18 Aug', value: 'Medical due · book in the unit portal' },
                  { label: unitHeader, meta: '29 Jul', value: 'Portal maintenance on Sunday · no reply needed' },
                ],
              },
              {
                type: 'note',
                text: 'Every one is from the same six characters, every one points at the portal, and '
                  + 'not one of them asks a question.',
              },
            ],
          },
        },
      }),

      /** The phone's own photo picker - what an MMS reply would attach. */
      gallery: {
        kind: SURFACE.VIEWER,
        title: 'Photos',
        backLabel: 'Close the picker',
        itemsHeading: 'Recent photos on this phone',
        rowsHeading: 'About this photo',
        inertNote: 'Local photo picker. No image file exists and nothing can be attached or sent.',
        note: 'Choosing a photo here only changes what is shown. Nothing leaves the phone.',
        items: [
          {
            id: 's06-photo-card',
            label: 'IMG_20260914_1102',
            value: 'Identity card, front',
            art: 'photo',
            rows: [
              { label: 'Taken', value: '14 September, 11:02' },
              { label: 'Shows', value: 'Name, service number, date of birth, photograph' },
              { label: 'Size', value: '1.8 MB' },
            ],
          },
          {
            id: 's06-photo-park',
            label: 'IMG_20260901_0840',
            value: 'Parking receipt',
            art: 'photo',
            rows: [
              { label: 'Taken', value: '1 September, 08:40' },
              { label: 'Shows', value: 'A printed receipt' },
              { label: 'Size', value: '0.6 MB' },
            ],
          },
          {
            id: 's06-photo-meter',
            label: 'IMG_20260820_1930',
            value: 'Meter reading',
            art: 'photo',
            rows: [
              { label: 'Taken', value: '20 August, 19:30' },
              { label: 'Shows', value: 'A dial and a number' },
              { label: 'Size', value: '0.9 MB' },
            ],
          },
        ],
      },

      /** The learner's own unit portal - the file, and what it actually needs. */
      unitapp: {
        kind: SURFACE.APP,
        appName: 'Unit Portal',
        appTagline: 'Unit Falcon · personnel self-service',
        hero: {
          label: 'Your personnel file',
          value: 'Active — nothing outstanding',
          caption: 'No lapse, no pending confirmation and no action waiting on you.',
          chips: ['Signed in as you'],
        },
        sections: [
          {
            id: 's06-app-file',
            heading: 'File status',
            rows: [
              { label: 'Status', value: 'Active' },
              { label: 'Last updated', value: '02 September 2026' },
              { label: 'Actions needed', value: 'None' },
            ],
            note: 'A records action appears here first and is completed in the portal or at the counter.',
          },
          {
            id: 's06-app-how',
            heading: 'How the records cell contacts you',
            rows: [
              { label: 'Texts', value: `From ${unitHeader} only` },
              { label: 'We never ask for', value: 'A service number, a date of birth or a photograph of your card' },
              { label: 'In person', value: 'Records cell counter, working hours' },
            ],
          },
        ],
        tabs: [
          { label: 'File', icon: 'home' },
          { label: 'Leave', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },

      /** The orderly room, on the number in the unit's own directory. */
      roomcall: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: 'Unit Falcon — station orderly room',
        number: orderlyRoom,
        script: [
          { at: 0, speaker: 'them', text: 'Orderly room.' },
          { at: 3, speaker: 'them', text: 'No, the records cell has not sent anything out today.' },
          { at: 8, speaker: 'them', text: 'Records are amended in the portal or at the counter. We do not collect details by text.' },
          { at: 14, speaker: 'them', text: 'Send nothing, and let unit security know about that number.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({ id: 's06-c01', slot: SLOT.INLINE, label: 'Open the message' }),
          action({ id: 's06-c02', slot: SLOT.INLINE, label: 'Reply from the list to ask what this is' }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 's06-c03', slot: SLOT.INLINE, anchor: 'header',
            label: from, hint: 'Who sent it, and how',
            targetId: senderAsset, opens: 'details',
          }),
          action({
            id: 's06-c04', slot: SLOT.MENU, label: 'Read what the unit has sent you before',
            hint: `Messages from ${unitHeader}`, targetId: threadAsset, opens: 'history',
          }),
          action({ id: 's06-c05', slot: SLOT.MENU, label: 'Skip the details and move on' }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 's06-c06', slot: SLOT.COMPOSER,
            label: 'Send the service number and date of birth',
            echo: `Svc No ${serviceNumber}, DOB 14-03-1994.`,
          }),
          action({
            id: 's06-c07', slot: SLOT.SURFACE, on: 'gallery',
            label: 'Attach this photograph and send it', closes: true,
          }),
          action({
            id: 's06-c08', slot: SLOT.SURFACE, on: 'gallery',
            label: 'Close the picker and attach nothing', closes: true,
          }),
          action({
            id: 's06-c09', slot: SLOT.COMPOSER, label: 'Reply asking who this is',
            echo: 'Who is this, and which cell are you writing from?',
          }),
          action({
            id: 's06-c10', slot: SLOT.MENU, label: 'Leave it and open the unit portal instead',
            opens: 'unitapp',
          }),
          navigate({ id: 's06-nav-gallery', slot: SLOT.MENU, label: 'Attach a photo', opens: 'gallery' }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 's06-c11', slot: SLOT.MENU,
            label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 's06-c12', slot: SLOT.MENU, label: 'Call the orderly room on the number in the unit directory',
            opens: 'roomcall',
          }),
          action({
            id: 's06-c13', slot: SLOT.MENU, label: 'Open the unit portal and check what the file needs',
            hint: 'File status and outstanding actions', opens: 'unitapp',
          }),
          action({ id: 's06-c14', slot: SLOT.MENU, label: 'Reply to the number and ask them to confirm' }),
          action({ id: 's06-c15', slot: SLOT.MENU, label: 'Report the message as junk' }),
          action({ id: 's06-c16', slot: SLOT.MENU, label: 'Block the sender' }),
        ],
      },

      resolve: {
        affordances: [
          action({ id: 's06-c17', slot: SLOT.INLINE, label: 'Report it through unit security and send nothing' }),
          action({ id: 's06-c18', slot: SLOT.INLINE, label: 'Send the details before the cell closes' }),
          action({ id: 's06-c19', slot: SLOT.MENU, label: 'Block the sender and report' }),
          action({ id: 's06-c20', slot: SLOT.MENU, label: 'Ignore it and move on' }),
        ],
      },
    },

    ambient: [
      navigate({ id: 's06-nav-details', slot: SLOT.MENU, label: 'Conversation details', opens: 'details', after: 'inspect' }),
      navigate({ id: 's06-nav-history', slot: SLOT.MENU, label: `Messages from ${unitHeader}`, opens: 'history', after: 'inspect' }),
      navigate({ id: 's06-nav-portal', slot: SLOT.MENU, label: 'Open the unit portal', opens: 'unitapp', after: 'verify' }),
    ],

    directoryExtras: [
      {
        id: 's06-dir-room',
        name: 'Unit Falcon — station orderly room',
        identifier: orderlyRoom,
        provenance: 'unit approved directory',
        role: 'Confirms what the records cell has and has not sent; records are amended in the portal or at the counter.',
      },
    ],
  }
}

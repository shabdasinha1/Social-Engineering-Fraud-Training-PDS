import { SLOT, SURFACE, action, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, day, directory, me, requestCard, social, splitHeadline, them,
} from './shared.js'

/**
 * I14 - Commendation Page Requests Documents (IMMERSIVE-004C). Medium.
 *
 * A tribute page tells the learner they are on tomorrow's shortlist of five and asks for two
 * files: the service identity card, both sides, and a posting order with their name on it.
 * Nothing is sold, nothing is paid for, and nobody is threatened - the whole pressure is
 * pride and a deadline.
 *
 * The interaction it brings that no earlier scene has is the ATTACHMENT PICKER. I06 was a
 * public comment box and W06 was a photograph described in a chat; here the learner opens
 * their own gallery, sees their own documents sitting in it next to a trek photograph, picks
 * two, and presses Send - which is what the client's stage 4 asks for and is the moment the
 * decision is actually made. Choosing a file is local and records nothing; Send is the one
 * control that reaches the engine, and Clear the selection is the pivot beside it.
 *
 * The decisive evidence is on the page itself, in a surface no earlier Instagram scene has
 * used: its story HIGHLIGHTS. Last month's "featured" personnel are in there with their
 * service cards on screen and a blur that does not cover the number - so the page publishes
 * exactly what it is asking the learner to hand over, and someone has said so in the comments
 * under its pinned post. The DM claims three lakh followers; the profile says 3,383.
 */
export function buildI14(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const name = 'Honour Roll Daily'
  const formHost = 'honourroll.training.example'
  const formUrl = `https://${formHost}/feature`

  return {
    scenarioId: 'I14',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Requests',
          rows: [
            { id: 'i14-row', handle, name, preview: text, time: '11m', request: true, unread: true },
          ],
        },
        {
          heading: 'Messages',
          rows: [
            { id: 'i14-bg-1', handle: 'dev_fit', name: 'Dev', preview: 'ridge on Sunday?', time: '3h', inert: true },
            { id: 'i14-bg-2', handle: 'nisha.bakes', name: 'Nisha', preview: 'You: 👍', time: '1d', outgoing: true, inert: true },
          ],
        },
      ],
    },

    conversation: {
      kind: 'dm',
      screenTitle: handle,
      handle,
      name,
      subline: `@${handle}`,
      verified: false,
      request: true,
    },

    beats: [
      requestCard('i14-request', {
        name,
        handle,
        verified: false,
        stats: { posts: '184', followers: '3,383', following: '56' },
        relation: 'Not following each other · joined February 2026',
      }),
      day('i14-day', 'MESSAGE REQUEST'),
      them('i14-b1', 'Jai Hind 🙏 We run Honour Roll - 3.3 lakh followers across our pages.', '12:05'),
      them('i14-b2', `Your name has come up on tomorrow’s shortlist: five serving personnel, one post each. Last month’s five crossed 1,200 shares.`, '12:05'),
      them('i14-b3', text, '12:06'),
      them('i14-b4', 'Two files only: (1) your service identity card, both sides, (2) any posting order or movement letter carrying your name. Editorial verification only - we blur everything before publishing.', '12:07'),

      them('i14-b5', 'Tomorrow’s post is locked at 2100 hrs. If the documents are not with us by then the slot passes to the next name on the list 🙏', '12:41', { since: 'branch' }),

      /**
       * The picker and the composer both produce `simulated_data_submission`, so this beat
       * fits either: what the page asks for next is the same whichever way it arrived.
       */
      them('i14-after-files', 'Received 🙏 One more thing - a selfie holding your card next to your face, for the editorial record.', '12:45', {
        since: 'verify', afterConsequence: 'simulated_data_submission',
      }),
      me('i14-echo-ask', 'Which publication is this for?', '12:44', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i14-after-ask', 'We are an independent tribute page, sir. The documents are only for our editorial check 🙏 Shall I hold your slot?', '12:45', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i14-after-form', tone: 'banner',
        text: 'The feature form was submitted. It asked for the service number, posting station and next-of-kin details it said were needed for the caption.',
        since: 'verify', afterConsequence: 'simulated_browser_open',
      },
    ],

    surfaces: {
      profile: social({
        title: handle,
        home: 'profile',
        pages: {
          profile: {
            view: 'profile',
            handle,
            name,
            category: 'Digital creator',
            verified: false,
            avatarArt: 'award',
            stats: { posts: '184', followers: '3,383', following: '56' },
            bio: ['Saluting our heroes every single day 🙏', 'Features · tributes · shoutouts', 'DM to be featured'],
            bioLink: { label: `${formHost}/feature`, to: 'formnote' },
            mutuals: 'Not followed by anyone you follow',
            buttons: ['Follow', 'Message'],
            aboutTo: 'about',
            pinnedTo: 'pinned',
            highlights: [
              { id: 'h-sep', label: 'SEPT FEATURES', art: 'award', to: 'highlight-sep' },
              { id: 'h-aug', label: 'AUG FEATURES', art: 'award', to: 'highlight-aug' },
              { id: 'h-shout', label: 'SHOUTOUTS', art: 'crest' },
            ],
            grid: [
              { art: 'crest', title: '', note: 'Reposted' },
              { art: 'award', title: '', note: 'Reposted' },
              { art: 'crest', title: '', note: 'Reposted' },
              { art: 'field', title: '', note: 'Reposted' },
              { art: 'award', title: '', note: 'Reposted' },
              { art: 'crest', title: '', note: 'Reposted' },
            ],
            note: 'Every photograph in the grid carries another account’s watermark under the page’s own crest.',
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'February 2026' },
              { label: 'Account based in', value: 'Not available' },
              { label: 'Verified', value: 'No' },
              { label: 'Followers', value: '3,383' },
            ],
            formerUsernames: [
              { handle: 'viral.army.status', when: 'February 2026' },
              { handle: 'fauji.shayari.hub', when: 'June 2026' },
            ],
          },
          'highlight-sep': {
            view: 'story',
            title: 'SEPT FEATURES',
            handle,
            time: '12 September',
            segments: 5,
            art: 'card',
            sticker: 'VERIFIED ✅',
            caption: 'Feature 3 of 5 · service card as submitted · name and photograph legible, number partly covered',
          },
          'highlight-aug': {
            view: 'story',
            title: 'AUG FEATURES',
            handle,
            time: '19 August',
            segments: 5,
            art: 'document',
            sticker: 'POSTING ORDER',
            caption: 'Feature 2 of 5 · posting order as submitted · station and dates legible',
          },
          pinned: {
            view: 'post',
            handle,
            name,
            verified: false,
            subline: 'Pinned',
            slides: [{ art: 'award', title: 'TOMORROW’S FIVE', subtitle: 'Shortlist announced tonight' }],
            likes: '431 likes',
            caption: 'Tomorrow we honour five more. Send your documents today to hold your slot 🙏 #honourroll',
            comments: [
              { author: 'a.k.deshmukh', text: 'my card photo is still on your September highlight. i asked in July. please remove it' },
              { author: handle, text: 'DM us 🙏' },
              { author: 's.rathore.77', text: 'why do you need a posting order for a photo post?' },
            ],
            time: 'Pinned · 3 days ago',
          },
          formnote: {
            view: 'settings',
            title: 'Feature form',
            username: `${formHost}/feature`,
            rows: [
              { label: 'Opens', value: 'A form on the page’s own site, outside Instagram' },
              { label: 'It asks for', value: 'Full name, unit, service number, posting station and next-of-kin' },
              { label: 'The page says', value: '“So the caption is accurate.”' },
            ],
          },
        },
      }),

      /**
       * The attachment picker - the client's "media uploader". The learner's own files are
       * on this screen; choosing between them is local and records nothing, and only Send
       * reaches the engine.
       */
      uploader: {
        kind: SURFACE.VIEWER,
        title: 'Attach',
        subtitle: 'Recent · on this device',
        backLabel: 'Cancel and go back',
        heading: 'Choose what to send',
        itemsHeading: 'Recent files',
        rowsHeading: 'About this file',
        inertNote: 'Simulated picker. No file exists and nothing can leave this device.',
        items: [
          {
            id: 'i14-f1', art: 'card', label: 'Service identity card (front).jpg',
            value: '2.1 MB · photographed 4 March 2026',
            rows: [
              { label: 'Shows', value: 'Name, photograph, service number, blood group' },
              { label: 'Taken for', value: 'A unit form that was handed in at the counter' },
            ],
          },
          {
            id: 'i14-f2', art: 'card', label: 'Service identity card (back).jpg',
            value: '1.9 MB · photographed 4 March 2026',
            rows: [
              { label: 'Shows', value: 'Date of birth, next-of-kin, unit stamp' },
            ],
          },
          {
            id: 'i14-f3', art: 'document', label: 'Posting order 2026.pdf',
            value: '340 KB · received 11 January 2026',
            rows: [
              { label: 'Shows', value: 'Station, reporting date, movement route, file reference' },
            ],
          },
          {
            id: 'i14-f4', art: 'photo', label: 'Ridge sunrise.jpg',
            value: '3.4 MB · 7 September 2026',
            rows: [{ label: 'Shows', value: 'A photograph already published on this account' }],
          },
        ],
        note: 'Two files are selected: the identity card and the posting order.',
      },

      /** The form on the page's own site, reached from its bio link. */
      form: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'feature',
        pages: {
          feature: {
            url: formUrl,
            host: formHost,
            title: 'Feature submission',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'HR', name: 'Honour Roll', tagline: 'Feature submission' },
              { type: 'heading', text: 'Tell us who we are honouring' },
              { type: 'text', text: 'Fill this in so tomorrow’s caption is accurate. Documents are sent separately on Instagram.' },
              {
                type: 'summary',
                rows: [
                  { label: 'Required', value: 'Full name, unit, service number' },
                  { label: 'Required', value: 'Present posting station and reporting date' },
                  { label: 'Required', value: 'Next-of-kin name and contact number' },
                  { label: 'Optional', value: 'A message for your family' },
                ],
              },
              { type: 'fineprint', text: 'By submitting you permit Honour Roll and its partner pages to publish the material provided, in any form, without further approval.' },
            ],
          },
        },
      },

      /** The unit's own publicity desk, opened by the learner from the device. */
      publicity: {
        kind: SURFACE.APP,
        appName: 'Unit Falcon · Media desk',
        appTagline: 'Publicity and public information',
        hero: {
          label: 'Standing instruction · media features',
          value: 'No personnel documents to any page',
          caption: 'Features, interviews and tributes are cleared through the public information cell first.',
          chips: ['Unit application', 'Updated 01 September 2026'],
        },
        sections: [
          {
            id: 'i14-pub-rule', heading: 'What a feature may use',
            rows: [
              { label: 'Allowed', value: 'A photograph already cleared for release, with its clearance reference.' },
              { label: 'Never released', value: 'Identity cards, posting or movement orders, service numbers, next-of-kin details.' },
              { label: 'Who asks', value: 'A publication writes to the public information cell. It does not message you.' },
            ],
          },
          {
            id: 'i14-pub-route', heading: 'If a page contacts you',
            rows: [
              { label: 'Step 1', value: `Ring the administrative office on ${desk.identifier || '+91 00000 63815'}.` },
              { label: 'Step 2', value: 'Send nothing while you wait, however short the deadline.' },
              { label: 'Step 3', value: 'Report the account on the platform and tell the cell which page it was.' },
            ],
          },
        ],
        tabs: [
          { label: 'Instructions', icon: 'home' },
          { label: 'Clearances', icon: 'history' },
          { label: 'Profile', icon: 'profile' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i14-c01', slot: SLOT.INLINE,
            label: 'Open the message request',
          }),
          action({
            id: 'i14-c02', slot: SLOT.INLINE,
            label: 'Reply “which files?” without opening it',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i14-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, highlights, pinned post and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i14-c04', slot: SLOT.MENU,
            label: 'Read the request from the start',
          }),
          action({
            id: 'i14-c05', slot: SLOT.MENU,
            label: 'Go straight to attaching the files',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i14-c06', slot: SLOT.SURFACE, on: 'uploader',
            label: 'Send the two selected files', closes: true,
          }),
          action({
            id: 'i14-c07', slot: SLOT.SURFACE, on: 'uploader',
            label: 'Clear the selection and close', closes: true,
          }),
          action({
            id: 'i14-c08', slot: SLOT.COMPOSER,
            label: 'Type your service number and posting station instead',
            echo: 'Svc no … , presently at … since January, posting order ref …',
          }),
          action({
            id: 'i14-c09', slot: SLOT.COMPOSER,
            label: 'Ask which publication this is for', echo: 'Which publication is this for?',
          }),
          action({
            id: 'i14-c10', slot: SLOT.MENU,
            label: 'Open the feature form on their site', opens: 'form',
          }),
          action({
            id: 'i14-c11', slot: SLOT.MENU,
            label: 'Send nothing and leave the request where it is',
          }),
          navigate({
            id: 'i14-nav-attach', slot: SLOT.INLINE, anchor: 'i14-b4',
            label: 'Attach files', opens: 'uploader',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i14-c12',
            slot: SLOT.MENU,
            label: `Ring ${desk.name || 'the administrative office'} from the trusted directory`,
            hint: 'The approved directory held on this device', targetId: directoryAsset,
          }),
          action({
            id: 'i14-c13', slot: SLOT.MENU,
            label: 'Open the unit media desk and read the standing instruction',
            hint: 'The application already on this device', opens: 'publicity',
          }),
          action({
            id: 'i14-c14',
            slot: SLOT.MENU, label: `Ask ${handle} to prove it is a publication`,
          }),
          action({ id: 'i14-c15', slot: SLOT.MENU, label: 'Report the request' }),
          action({ id: 'i14-c16', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i14-c17', slot: SLOT.INLINE,
            label: 'Send nothing and report the page for asking for documents',
          }),
          action({
            id: 'i14-c18', slot: SLOT.INLINE,
            label: 'Keep the request in case the feature is worth it',
          }),
          action({
            id: 'i14-c19', slot: SLOT.MENU,
            label: `Block ${handle}`,
          }),
          action({
            id: 'i14-c20', slot: SLOT.MENU,
            label: 'Go back and send the files before 2100 hrs',
          }),
          action({
            id: 'i14-c21', slot: SLOT.MENU,
            label: 'Delete the request and say nothing to anyone',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i14-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i14-nav-uploader', slot: SLOT.MENU, label: 'Open the attachment picker', opens: 'uploader', after: 'branch' }),
    ],

    directoryExtras: [
      {
        id: 'i14-dir-pio',
        name: 'Unit Falcon public information cell',
        identifier: `${desk.identifier || '+91 00000 63815'} ext 4477`,
        provenance: 'local approved directory',
        role: 'Clears every media feature, interview and tribute. No page, editor or agency obtains service documents from an individual.',
      },
    ],
  }
}

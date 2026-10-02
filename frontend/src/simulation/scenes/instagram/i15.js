import { FIELD_KIND, SLOT, SURFACE, action, field, navigate } from '../../sceneModel.js'
import { ASSET_KIND } from '../../../constants/simulation.js'
import {
  LEARNER, assetId, browserPage, day, directory, link, me, social, splitHeadline, them,
} from './shared.js'

/**
 * I15 - You Are in This Video (IMMERSIVE-004C). Medium.
 *
 * The account that writes is the learner's friend. Not a copy of him and not a new account
 * wearing his photograph - his own account, eleven years old, four hundred mutual followers,
 * yesterday's ordinary conversation about trekking poles still on the screen above today's
 * message. Everything an inspection can check comes back clean, which is the lesson: the
 * thing that has changed is not the account, it is who is holding it.
 *
 * So the tells are behavioural rather than documentary - two clipped lines where he usually
 * writes in full, a link on a host that is not Instagram's, a thumbnail that could be
 * anybody, and a mutual asking in another thread whether he has messaged them today.
 *
 * The page behind the link asks the learner to log in to watch a video of themselves, and
 * then for the code that follows. The second release the client's stage 4 names is the one
 * nobody types anything for: while the learner is deciding, their own phone raises Instagram's
 * "someone is trying to log in - is this you?" prompt, and approving it hands the account over
 * in two taps. Refusing it, or closing the page, is the pivot.
 *
 * The client's verification is both halves: ring the friend on the number already saved for
 * him, and read the learner's own Login activity.
 */
export function buildI15(scenario) {
  const { handle, text } = splitHeadline(scenario)
  const senderAsset = assetId(scenario, ASSET_KIND.SENDER)
  const browserAsset = browserPage(scenario)
  const directoryAsset = assetId(scenario, ASSET_KIND.DIRECTORY)
  const desk = directory(scenario)
  const gateUrl = browserAsset?.display_target ?? 'https://i15.training.example/verify'
  const gateHost = browserAsset?.content?.host ?? 'i15.training.example'
  const shareHost = 'ig-vid-share.training.example'
  const name = 'Rohit Kamath'
  const number = '+91 00000 30418'

  return {
    scenarioId: 'I15',
    platform: 'instagram',
    notify: { sender: handle },
    messageSender: { display_name: `@${handle}`, identifier: `@${handle}` },

    list: {
      kind: 'dm',
      title: 'Messages',
      username: LEARNER.handle,
      sections: [
        {
          heading: 'Messages',
          rows: [
            { id: 'i15-row', handle, name, preview: text, time: '3m', unread: true },
            { id: 'i15-bg-1', handle: 'anjali.m', name: 'Anjali', preview: 'has Rohit messaged you today?', time: '6m', inert: true },
            { id: 'i15-bg-2', handle: 'trek.club.pune', name: 'Pune Trek Club', preview: 'Dev: poles are sorted 👍', time: '1d', inert: true },
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
      request: false,
    },

    beats: [
      day('i15-d1', 'YESTERDAY'),
      them('i15-b1', 'did you find the trek poles in the end? the club sale is on till friday i think, and the aluminium ones were half price when i looked', '18:22'),
      me('i15-b2', 'yes! got the cheap pair 😄 thanks for the tip', '18:40'),
      them('i15-b3', 'good good. see you sunday then, we start at 5 sharp', '18:44'),

      day('i15-d2', 'TODAY'),
      them('i15-b4', `${text}’t believe it 😳`, '19:39'),
      link('i15-link', {
        title: 'Watch · 0:42',
        description: 'Shared video · 41,208 views',
        displayUrl: `${shareHost}/v/8ha2k`,
        art: 'person',
        play: true,
        time: '19:39',
      }),
      them('i15-b5', 'someone put it in the group. open it fast', '19:40'),

      them('i15-b6', '?? are you seeing this', '19:52', { since: 'branch' }),
      {
        kind: 'system', id: 'i15-loginreq', tone: 'mention',
        text: 'Instagram · Login request: someone is trying to log in to your account from a device in another city. Is this you?',
        since: 'branch',
      },

      me('i15-echo-ask', 'omg where is this from??', '19:54', { since: 'verify', afterConsequence: 'simulated_reply_sent' }),
      them('i15-after-ask', 'just open it, it is you in it. the link works only today', '19:54', {
        since: 'verify', afterConsequence: 'simulated_reply_sent',
      }),
      {
        kind: 'system', id: 'i15-after-login', tone: 'banner',
        text: 'Your password was changed from a device in another city. Your email and phone number on the account were changed two minutes later.',
        since: 'verify', afterConsequence: 'simulated_data_submission',
      },
      {
        kind: 'system', id: 'i15-after-approve', tone: 'banner',
        text: 'A new device is now signed in to your account. It has begun sending the same message to everyone you follow.',
        since: 'verify', afterConsequence: 'simulated_device_link',
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
            category: '',
            verified: false,
            avatarArt: 'person',
            following: true,
            stats: { posts: '318', followers: '1,046', following: '873', followersTo: 'mutuals' },
            bio: ['Pune · weekend ridges', 'Coffee, then hills ☕', 'Club: @trek.club.pune'],
            mutuals: 'Followed by anjali.m, dev_fit and 410 others you follow',
            buttons: ['Following', 'Message'],
            aboutTo: 'about',
            grid: [
              { art: 'trail', title: '', note: '2 days ago' },
              { art: 'field', title: '', note: '1 week ago' },
              { art: 'cafe', title: '', note: '2 weeks ago' },
              { art: 'trail', title: '', note: '3 weeks ago' },
              { art: 'person', title: '', note: '1 month ago' },
              { art: 'field', title: '', note: '1 month ago' },
            ],
          },
          about: {
            view: 'about',
            title: 'About this account',
            handle,
            rows: [
              { label: 'Date joined', value: 'June 2015' },
              { label: 'Account based in', value: 'India' },
              { label: 'Verified', value: 'No' },
              { label: 'Accounts you both follow', value: '412' },
            ],
            formerUsernames: [],
            note: 'Nothing about this account has changed since you started following it in 2016.',
          },
          mutuals: {
            view: 'people',
            title: 'Followers',
            heading: 'Followers you know',
            people: [
              { handle: 'anjali.m', name: 'Anjali Menon', note: 'You follow each other' },
              { handle: 'dev_fit', name: 'Dev', note: 'You follow each other' },
              { handle: 'nisha.bakes', name: 'Nisha', note: 'You follow each other' },
              { handle: 'trek.club.pune', name: 'Pune Trek Club', note: 'You follow each other' },
            ],
            note: '412 accounts you follow also follow this one.',
          },
        },
      }),

      /** The page behind the shared link. Its address comes from the pinned asset. */
      gate: {
        kind: SURFACE.BROWSER,
        title: 'Browser',
        home: 'watch',
        pages: {
          watch: {
            url: gateUrl,
            host: gateHost,
            title: 'Shared video',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'IG', name: 'Instagram', tagline: 'Shared video' },
              { type: 'heading', text: 'This video may show someone you know' },
              {
                type: 'summary',
                rows: [
                  { label: 'Length', value: '0:42' },
                  { label: 'Views', value: '41,208' },
                  { label: 'Shared by', value: `@${handle}` },
                ],
              },
              { type: 'text', text: `Confirm it is you, ${LEARNER.name}, and the clip will play. The link expires at midnight.` },
            ],
            primary: { label: 'Log in to watch', to: 'login' },
          },
          login: {
            url: `${gateUrl}/login`,
            host: gateHost,
            title: 'Log in',
            secure: true,
            blocks: [
              { type: 'brand', monogram: 'IG', name: 'Instagram', tagline: 'Log in' },
              {
                type: 'form',
                heading: 'Log in',
                fields: [
                  field({ name: 'user', label: 'Username, email or mobile number', length: 3, max: 30 }),
                  field({ name: 'pass', label: 'Password', kind: FIELD_KIND.MASKED, length: 6, max: 32 }),
                ],
              },
            ],
            primary: { label: 'Log in', to: 'code' },
          },
          code: {
            url: `${gateUrl}/code`,
            host: gateHost,
            title: 'Enter code',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Enter the login code we sent you' },
              { type: 'text', text: 'A 6-digit code has been sent to the phone on this account.' },
              {
                type: 'form',
                heading: 'Two-factor code',
                fields: [field({ name: 'otp', label: 'Login code', kind: FIELD_KIND.DIGITS, length: 6, group: 3 })],
              },
            ],
            primary: { label: 'Continue', to: 'confirm' },
          },
          confirm: {
            url: `${gateUrl}/confirm`,
            host: gateHost,
            title: 'Confirm',
            secure: true,
            blocks: [
              { type: 'heading', text: 'Confirm and play the clip?' },
              {
                type: 'summary',
                rows: [
                  { label: 'This page receives', value: 'Your username, your password and the login code' },
                  { label: 'Then', value: 'The clip plays' },
                ],
              },
            ],
          },
          done: {
            url: `${gateUrl}/confirm`,
            host: gateHost,
            title: 'Signed in',
            final: true,
            blocks: [
              { type: 'result', heading: 'Signed in', text: 'The clip will start in a moment.' },
            ],
          },
        },
      },

      /**
       * Instagram's own login-request prompt, drawn as the system sheet it is. Approving it
       * needs no page, no password and nothing typed - which is exactly why it belongs here.
       */
      request: {
        kind: SURFACE.INSTALLER,
        title: 'Login request',
        closeLabel: 'Close the prompt',
        inertNote: 'Simulated prompt. Nothing can be approved, linked or signed in from here.',
        home: 'prompt',
        pages: {
          prompt: {
            style: 'sheet',
            screenTitle: 'Instagram',
            breadcrumb: 'Login request',
            title: 'Is this you trying to log in?',
            text: 'We noticed a login attempt on your account from a device you have not used before.',
            rows: [
              { label: 'Device', value: 'Android · Chrome' },
              { label: 'Near', value: 'Nagpur, IN' },
              { label: 'Time', value: 'Today, 19:52' },
            ],
            optionsHeading: 'Choose one',
            note: 'Approving a login request signs that device in to your account. Instagram will not ask you again for this attempt.',
          },
        },
      },

      /** The learner's own Login activity, opened from Settings rather than followed to. */
      activity: social({
        title: 'Login activity',
        home: 'home',
        pages: {
          home: {
            view: 'status',
            title: 'Login activity',
            heading: 'Recent attempts on your account',
            statusRows: [
              { label: 'Login attempt · Nagpur, IN', value: 'Today, 19:52 · Android · waiting for approval', ok: false },
              { label: 'Login · Pune, IN · this device', value: 'Today, 07:12', ok: true },
              { label: 'Login · Pune, IN · iPhone', value: '14 September', ok: true },
            ],
            note: 'The attempt from Nagpur began three minutes after the message arrived, and is still waiting for you to approve it.',
          },
        },
      }),

      /** Ringing the friend on the number already saved for him. */
      call: {
        kind: SURFACE.CALL,
        title: 'Calling',
        caller: name,
        number,
        script: [
          { at: 0, speaker: 'them', text: 'Hey! What’s up?' },
          { at: 4, speaker: 'you', text: 'Did you send me a video link just now? It says I’m in it.' },
          { at: 9, speaker: 'them', text: 'No - and I can’t get into Instagram since this morning. It says my password is wrong.' },
          { at: 15, speaker: 'them', text: 'Anjali rang about the same thing. Please don’t open it, and tell anyone else who got it.' },
        ],
      },
    },

    stages: {
      open: {
        surface: 'list',
        affordances: [
          action({
            id: 'i15-c01', slot: SLOT.INLINE,
            label: `Open your chat with ${name}`,
          }),
          action({
            id: 'i15-c02', slot: SLOT.INLINE,
            label: 'Open the video from the list without reading the chat',
          }),
        ],
      },

      inspect: {
        affordances: [
          action({
            id: 'i15-c03', slot: SLOT.INLINE, anchor: 'header',
            label: handle, hint: 'Profile, mutual followers and account history',
            targetId: senderAsset, opens: 'profile',
          }),
          action({
            id: 'i15-c04', slot: SLOT.MENU,
            label: 'Read back through yesterday’s messages',
          }),
          action({
            id: 'i15-c05', slot: SLOT.MENU,
            label: 'Go straight to the video',
          }),
        ],
      },

      branch: {
        affordances: [
          action({
            id: 'i15-c06', slot: SLOT.SURFACE, on: 'gate', page: 'confirm',
            label: 'Confirm and play the clip', targetId: browserAsset?.asset_id ?? null, thenPage: 'done',
          }),
          action({
            id: 'i15-c07', slot: SLOT.SURFACE, on: 'gate',
            label: 'Close the page', closes: true,
          }),
          action({
            id: 'i15-c08', slot: SLOT.SURFACE, on: 'request',
            label: 'Yes, it was me', closes: true,
          }),
          action({
            id: 'i15-c09', slot: SLOT.SURFACE, on: 'request',
            label: 'It wasn’t me', closes: true,
          }),
          action({
            id: 'i15-c10', slot: SLOT.COMPOSER,
            label: 'Ask where the video came from', echo: 'omg where is this from??',
          }),
          action({
            id: 'i15-c11', slot: SLOT.MENU,
            label: 'Don’t open it and don’t reply here',
          }),
          navigate({
            id: 'i15-nav-gate', slot: SLOT.INLINE, anchor: 'i15-link',
            label: 'Open the link', opens: 'gate',
          }),
          navigate({
            id: 'i15-nav-request', slot: SLOT.INLINE, anchor: 'i15-loginreq',
            label: 'Open the login request', opens: 'request',
          }),
        ],
      },

      verify: {
        affordances: [
          action({
            id: 'i15-c12', slot: SLOT.MENU,
            label: `Ring ${name} on the number saved in your phone`,
            hint: number, opens: 'call',
          }),
          action({
            id: 'i15-c13', slot: SLOT.MENU,
            label: 'Open Settings › Login activity yourself',
            hint: 'Your own account, inside the app', opens: 'activity',
          }),
          action({
            id: 'i15-c14',
            slot: SLOT.MENU, label: `Look up ${desk.name || 'the support desk'} in the trusted directory`,
            targetId: directoryAsset,
          }),
          action({
            id: 'i15-c15',
            slot: SLOT.MENU, label: 'Ask in the chat whether it is really him',
          }),
          action({ id: 'i15-c16', slot: SLOT.MENU, label: 'Report the message' }),
          action({ id: 'i15-c17', slot: SLOT.MENU, label: `Block ${handle}` }),
        ],
      },

      resolve: {
        affordances: [
          action({
            id: 'i15-c18', slot: SLOT.INLINE,
            label: `Report the message and warn ${name} on his number`,
          }),
          action({
            id: 'i15-c19', slot: SLOT.INLINE,
            label: 'Leave it open and watch the clip later',
          }),
          action({
            id: 'i15-c20', slot: SLOT.MENU,
            label: `Block ${handle} until he has his account back`,
          }),
          action({
            id: 'i15-c21', slot: SLOT.MENU,
            label: 'Keep the chat as it is and carry on',
          }),
          action({
            id: 'i15-c22', slot: SLOT.MENU,
            label: 'Delete the message and tell nobody',
          }),
        ],
      },
    },

    ambient: [
      navigate({ id: 'i15-nav-profile', slot: SLOT.MENU, label: `View ${handle}’s profile`, opens: 'profile', after: 'inspect' }),
      navigate({ id: 'i15-nav-activity', slot: SLOT.MENU, label: 'Settings › Login activity', opens: 'activity', after: 'resolve' }),
    ],

    directoryExtras: [
      {
        id: 'i15-dir-rohit',
        name,
        identifier: number,
        provenance: 'saved contact on this device',
        role: 'Saved in 2016. The route to reach him that does not go through the account in question.',
      },
    ],
  }
}
